using System.Net;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;
using OneTake.Infrastructure.Persistence;
using Xunit;

namespace OneTake.IntegrationTests.Controllers;

public class PersistenceConsistencyTests : IClassFixture<WebApiFactory>
{
    private readonly WebApiFactory _factory;

    public PersistenceConsistencyTests(WebApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task LikeAndCommentFlows_PersistConsistently_AndCreateNotificationsOnlyWhenExpected()
    {
        HttpClient authorClient = _factory.CreateClient();
        HttpClient viewerClient = _factory.CreateClient();

        (string authorToken, Guid authorId, _, _) = await TestApiHelper.RegisterUserAsync(authorClient, "persist_author");
        (string viewerToken, Guid viewerId, _, _) = await TestApiHelper.RegisterUserAsync(viewerClient, "persist_viewer");
        TestApiHelper.SetBearerToken(authorClient, authorToken);
        TestApiHelper.SetBearerToken(viewerClient, viewerToken);

        Guid postId = await TestApiHelper.CreatePostAsync(authorClient, "Persistence target");

        HttpResponseMessage firstLikeResponse = await viewerClient.PostAsync($"/api/posts/{postId}/like", null);
        HttpResponseMessage duplicateLikeResponse = await viewerClient.PostAsync($"/api/posts/{postId}/like", null);
        HttpResponseMessage commentResponse = await viewerClient.PostAsJsonAsync($"/api/posts/{postId}/comments", new
        {
            text = "Persistent comment"
        });
        HttpResponseMessage ownerLikeResponse = await authorClient.PostAsync($"/api/posts/{postId}/like", null);
        HttpResponseMessage ownerCommentResponse = await authorClient.PostAsJsonAsync($"/api/posts/{postId}/comments", new
        {
            text = "Owner self-comment"
        });

        Assert.Equal(HttpStatusCode.NoContent, firstLikeResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, duplicateLikeResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, commentResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, ownerLikeResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, ownerCommentResponse.StatusCode);

        using IServiceScope scope = _factory.Services.CreateScope();
        AppDbContext db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        List<Reaction> reactions = db.Reactions.Where(r => r.PostId == postId).ToList();
        Assert.Equal(2, reactions.Count);
        Assert.Single(reactions, r => r.UserId == viewerId && r.Type == ReactionType.Like);
        Assert.Single(reactions, r => r.UserId == authorId && r.Type == ReactionType.Like);

        List<Comment> comments = db.Comments.Where(c => c.PostId == postId).ToList();
        Assert.Equal(2, comments.Count);
        Assert.Single(comments, c => c.UserId == viewerId && c.Text == "Persistent comment");
        Assert.Single(comments, c => c.UserId == authorId && c.Text == "Owner self-comment");

        List<Notification> notifications = db.Notifications.Where(n => n.UserId == authorId).ToList();
        Assert.Equal(2, notifications.Count);
        Assert.Single(notifications, n => n.Type == NotificationType.LikeOnPost && n.EntityId == postId);
        Assert.Single(notifications, n => n.Type == NotificationType.CommentOnPost && n.EntityId == postId);

        Assert.DoesNotContain(db.Notifications, n => n.UserId == viewerId && n.EntityId == postId);
    }

    [Fact]
    public async Task DeleteCommentAndDeletePost_RemoveExpectedPersistenceState_WithoutAffectingOtherEntities()
    {
        HttpClient authorClient = _factory.CreateClient();
        HttpClient commenterClient = _factory.CreateClient();
        HttpClient outsiderClient = _factory.CreateClient();

        (string authorToken, Guid authorId, _, _) = await TestApiHelper.RegisterUserAsync(authorClient, "delete_author");
        (string commenterToken, Guid commenterId, _, _) = await TestApiHelper.RegisterUserAsync(commenterClient, "delete_commenter");
        (string outsiderToken, _, _, _) = await TestApiHelper.RegisterUserAsync(outsiderClient, "delete_outsider");
        TestApiHelper.SetBearerToken(authorClient, authorToken);
        TestApiHelper.SetBearerToken(commenterClient, commenterToken);
        TestApiHelper.SetBearerToken(outsiderClient, outsiderToken);

        Guid postId = await TestApiHelper.CreatePostAsync(authorClient, "Delete persistence");
        Guid mediaId;
        using (IServiceScope mediaScope = _factory.Services.CreateScope())
        {
            AppDbContext db = mediaScope.ServiceProvider.GetRequiredService<AppDbContext>();
            mediaId = (await db.Posts.FindAsync(postId))!.MediaId!.Value;
        }
        await commenterClient.PostAsync($"/api/posts/{postId}/like", null);
        HttpResponseMessage createCommentResponse = await commenterClient.PostAsJsonAsync($"/api/posts/{postId}/comments", new
        {
            text = "Delete me"
        });
        Assert.Equal(HttpStatusCode.OK, createCommentResponse.StatusCode);
        using var commentDoc = await TestApiHelper.ReadJsonAsync(createCommentResponse);
        Guid commentId = TestApiHelper.GetGuid(commentDoc.RootElement, "id", "Id");

        HttpResponseMessage forbiddenDeleteResponse = await outsiderClient.DeleteAsync($"/api/posts/{postId}/comments/{commentId}");
        Assert.Equal(HttpStatusCode.Forbidden, forbiddenDeleteResponse.StatusCode);

        HttpResponseMessage authorDeletesCommentResponse = await authorClient.DeleteAsync($"/api/posts/{postId}/comments/{commentId}");
        Assert.Equal(HttpStatusCode.NoContent, authorDeletesCommentResponse.StatusCode);

        using (IServiceScope commentDeleteScope = _factory.Services.CreateScope())
        {
            AppDbContext db = commentDeleteScope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.Null(await db.Comments.FindAsync(commentId));
            Assert.NotNull(await db.Posts.FindAsync(postId));
            Assert.Single(db.Reactions.Where(r => r.PostId == postId && r.UserId == commenterId));
        }

        HttpResponseMessage deletePostResponse = await authorClient.DeleteAsync($"/api/posts/{postId}");
        Assert.Equal(HttpStatusCode.NoContent, deletePostResponse.StatusCode);

        using IServiceScope scope = _factory.Services.CreateScope();
        AppDbContext finalDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Null(await finalDb.Posts.FindAsync(postId));
        Assert.Empty(finalDb.Reactions.Where(r => r.PostId == postId));
        Assert.Empty(finalDb.Comments.Where(c => c.PostId == postId));
        Assert.Null(await finalDb.MediaObjects.FindAsync(mediaId));

        User? author = await finalDb.Users.FindAsync(authorId);
        User? commenter = await finalDb.Users.FindAsync(commenterId);
        Assert.NotNull(author);
        Assert.NotNull(commenter);
    }

    [Fact]
    public async Task NotificationsEndpoints_PersistReadState_AndReturnDeterministicOrdering()
    {
        HttpClient actorClient = _factory.CreateClient();
        HttpClient ownerClient = _factory.CreateClient();

        (string ownerToken, Guid ownerId, _, _) = await TestApiHelper.RegisterUserAsync(ownerClient, "notify_owner");
        (string actorToken, _, _, _) = await TestApiHelper.RegisterUserAsync(actorClient, "notify_actor");
        TestApiHelper.SetBearerToken(ownerClient, ownerToken);
        TestApiHelper.SetBearerToken(actorClient, actorToken);

        Guid firstPostId = await TestApiHelper.CreatePostAsync(ownerClient, "Notify one");
        Guid secondPostId = await TestApiHelper.CreatePostAsync(ownerClient, "Notify two");

        await actorClient.PostAsync($"/api/posts/{firstPostId}/like", null);
        await actorClient.PostAsJsonAsync($"/api/posts/{secondPostId}/comments", new { text = "Second notification" });

        using (IServiceScope reseedScope = _factory.Services.CreateScope())
        {
            AppDbContext db = reseedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            Notification first = db.Notifications.Single(n => n.EntityId == firstPostId);
            Notification second = db.Notifications.Single(n => n.EntityId == secondPostId);
            first.CreatedAt = new DateTime(2026, 3, 21, 9, 0, 0, DateTimeKind.Utc);
            second.CreatedAt = new DateTime(2026, 3, 21, 10, 0, 0, DateTimeKind.Utc);
            await db.SaveChangesAsync();
        }

        HttpResponseMessage unreadCountResponse = await ownerClient.GetAsync("/api/notifications/unread-count");
        Assert.Equal(HttpStatusCode.OK, unreadCountResponse.StatusCode);
        Assert.Equal("2", await unreadCountResponse.Content.ReadAsStringAsync());

        HttpResponseMessage notificationsResponse = await ownerClient.GetAsync("/api/notifications?pageSize=10");
        Assert.Equal(HttpStatusCode.OK, notificationsResponse.StatusCode);
        using (JsonDocument notificationsDoc = await TestApiHelper.ReadJsonAsync(notificationsResponse))
        {
            JsonElement items = TestApiHelper.GetProperty(notificationsDoc.RootElement, "items", "Items");
            Assert.Equal(2, items.GetArrayLength());
            Assert.Equal(secondPostId, TestApiHelper.GetGuid(items[0], "entityId", "EntityId"));
            Assert.Equal(firstPostId, TestApiHelper.GetGuid(items[1], "entityId", "EntityId"));
        }

        Guid notificationToMarkRead;
        using (IServiceScope scope = _factory.Services.CreateScope())
        {
            AppDbContext db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            notificationToMarkRead = db.Notifications.Single(n => n.EntityId == firstPostId).Id;
        }

        HttpResponseMessage markReadResponse = await ownerClient.PutAsync($"/api/notifications/{notificationToMarkRead}/read", null);
        Assert.Equal(HttpStatusCode.NoContent, markReadResponse.StatusCode);

        using (IServiceScope readScope = _factory.Services.CreateScope())
        {
            AppDbContext db = readScope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.True((await db.Notifications.FindAsync(notificationToMarkRead))!.IsRead);
            Assert.Single(db.Notifications.Where(n => n.UserId == ownerId && !n.IsRead));
        }

        HttpResponseMessage markAllResponse = await ownerClient.PutAsync("/api/notifications/read-all", null);
        Assert.Equal(HttpStatusCode.NoContent, markAllResponse.StatusCode);

        using IServiceScope finalScope = _factory.Services.CreateScope();
        AppDbContext finalDb = finalScope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Empty(finalDb.Notifications.Where(n => n.UserId == ownerId && !n.IsRead));
    }

    [Fact]
    public async Task GetProfile_ReturnsFollowerCounts_AndViewerSpecificFollowState()
    {
        HttpClient ownerClient = _factory.CreateClient();
        HttpClient viewerClient = _factory.CreateClient();

        (string ownerToken, Guid ownerId, _, _) = await TestApiHelper.RegisterUserAsync(ownerClient, "profile_owner");
        (string viewerToken, Guid viewerId, _, _) = await TestApiHelper.RegisterUserAsync(viewerClient, "profile_viewer");
        TestApiHelper.SetBearerToken(ownerClient, ownerToken);
        TestApiHelper.SetBearerToken(viewerClient, viewerToken);

        Assert.Equal(HttpStatusCode.NoContent, (await viewerClient.PostAsync($"/api/users/{ownerId}/follow", null)).StatusCode);

        HttpResponseMessage ownerSeesSelfResponse = await ownerClient.GetAsync($"/api/users/{ownerId}");
        Assert.Equal(HttpStatusCode.OK, ownerSeesSelfResponse.StatusCode);
        using (JsonDocument selfDoc = await TestApiHelper.ReadJsonAsync(ownerSeesSelfResponse))
        {
            Assert.Equal(1, TestApiHelper.GetInt(selfDoc.RootElement, "followersCount", "FollowersCount"));
            Assert.Equal(0, TestApiHelper.GetInt(selfDoc.RootElement, "followingCount", "FollowingCount"));
            JsonElement isFollowingValue = TestApiHelper.GetProperty(selfDoc.RootElement, "isFollowing", "IsFollowing");
            Assert.Equal(JsonValueKind.Null, isFollowingValue.ValueKind);
        }

        HttpResponseMessage viewerResponse = await viewerClient.GetAsync($"/api/users/{ownerId}");
        Assert.Equal(HttpStatusCode.OK, viewerResponse.StatusCode);
        using JsonDocument viewerDoc = await TestApiHelper.ReadJsonAsync(viewerResponse);
        Assert.True(TestApiHelper.GetBool(viewerDoc.RootElement, "isFollowing", "IsFollowing"));

        using IServiceScope scope = _factory.Services.CreateScope();
        AppDbContext db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Single(db.Follows.Where(f => f.FollowerId == viewerId && f.FollowedId == ownerId));
    }
}
