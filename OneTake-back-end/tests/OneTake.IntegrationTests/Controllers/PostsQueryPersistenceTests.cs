using System.Net;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using OneTake.Application.Common.Interfaces;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;
using OneTake.Infrastructure.Persistence;
using Xunit;

namespace OneTake.IntegrationTests.Controllers;

public class PostsQueryPersistenceTests : IClassFixture<WebApiFactory>
{
    private readonly WebApiFactory _factory;

    public PostsQueryPersistenceTests(WebApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetPosts_UsesStableCursorPagination_WithoutDuplicates()
    {
        Guid authorId = Guid.NewGuid();
        DateTime baseTime = new DateTime(2026, 3, 21, 12, 0, 0, DateTimeKind.Utc);
        Guid firstId = Guid.Parse("00000000-0000-0000-0000-000000000010");
        Guid secondId = Guid.Parse("00000000-0000-0000-0000-000000000020");
        Guid thirdId = Guid.Parse("00000000-0000-0000-0000-000000000030");
        Guid fourthId = Guid.Parse("00000000-0000-0000-0000-000000000040");

        await SeedUserWithProfileAsync(authorId, "pagination_author");
        await SeedPostAsync(firstId, authorId, "post-1", baseTime.AddMinutes(-3), Visibility.Public);
        await SeedPostAsync(secondId, authorId, "post-2", baseTime.AddMinutes(-2), Visibility.Public);
        await SeedPostAsync(thirdId, authorId, "post-3", baseTime.AddMinutes(-1), Visibility.Public);
        await SeedPostAsync(fourthId, authorId, "post-4", baseTime, Visibility.Public);

        using IServiceScope scope = _factory.Services.CreateScope();
        IPostRepository postsRepository = scope.ServiceProvider.GetRequiredService<IUnitOfWork>().Posts;

        (List<Post> firstPosts, bool firstHasMore) = await postsRepository.GetByAuthorIdWithCursorAsync(authorId, null, 2);
        Assert.Equal(2, firstPosts.Count);
        Assert.Equal(fourthId, firstPosts[0].Id);
        Assert.Equal(thirdId, firstPosts[1].Id);
        Assert.True(firstHasMore);
        string nextCursor = $"{firstPosts.Last().CreatedAt:O}|{firstPosts.Last().Id}";

        (List<Post> secondPosts, bool secondHasMore) = await postsRepository.GetByAuthorIdWithCursorAsync(authorId, nextCursor, 2);
        Assert.Equal(2, secondPosts.Count);
        Assert.Equal(secondId, secondPosts[0].Id);
        Assert.Equal(firstId, secondPosts[1].Id);
        Assert.False(secondHasMore);

        HashSet<Guid> ids = new(firstPosts.Select(post => post.Id));
        ids.UnionWith(secondPosts.Select(post => post.Id));
        Assert.Equal(4, ids.Count);

        string lastCursor = $"{baseTime.AddMinutes(-3):O}|{firstId}";
        (List<Post> emptyPosts, bool emptyHasMore) = await postsRepository.GetByAuthorIdWithCursorAsync(authorId, lastCursor, 2);
        Assert.Empty(emptyPosts);
        Assert.False(emptyHasMore);
    }

    [Fact]
    public async Task GetPosts_WithInvalidCursor_FallsBackToFirstPageBehavior()
    {
        Guid authorId = Guid.NewGuid();
        await SeedUserWithProfileAsync(authorId, "invalid_cursor_author");
        await SeedPostAsync(Guid.NewGuid(), authorId, "invalid-1", new DateTime(2026, 3, 21, 10, 0, 0, DateTimeKind.Utc), Visibility.Public);
        await SeedPostAsync(Guid.NewGuid(), authorId, "invalid-2", new DateTime(2026, 3, 21, 11, 0, 0, DateTimeKind.Utc), Visibility.Public);

        using IServiceScope scope = _factory.Services.CreateScope();
        IPostRepository postsRepository = scope.ServiceProvider.GetRequiredService<IUnitOfWork>().Posts;

        (List<Post> posts, bool hasMore) = await postsRepository.GetByAuthorIdWithCursorAsync(authorId, "not-a-valid-cursor", 1);

        Assert.Single(posts);
        Assert.Equal("invalid-2", posts[0].ContentText);
        Assert.True(hasMore);
    }

    [Fact]
    public async Task GetPosts_FiltersByAuthorAndTag_AndExcludesUnlistedPosts()
    {
        Guid authorA = Guid.NewGuid();
        Guid authorB = Guid.NewGuid();
        await SeedUserWithProfileAsync(authorA, "filter_author_a");
        await SeedUserWithProfileAsync(authorB, "filter_author_b");

        Guid publicMatchingPostId = Guid.NewGuid();
        Guid unlistedMatchingPostId = Guid.NewGuid();
        Guid publicOtherAuthorPostId = Guid.NewGuid();

        await SeedTaggedPostAsync(publicMatchingPostId, authorA, "music-public", "music", new DateTime(2026, 3, 20, 9, 0, 0, DateTimeKind.Utc), Visibility.Public);
        await SeedTaggedPostAsync(unlistedMatchingPostId, authorA, "music-unlisted", "music", new DateTime(2026, 3, 20, 10, 0, 0, DateTimeKind.Utc), Visibility.Unlisted);
        await SeedTaggedPostAsync(publicOtherAuthorPostId, authorB, "music-other-author", "music", new DateTime(2026, 3, 20, 11, 0, 0, DateTimeKind.Utc), Visibility.Public);
        await SeedTaggedPostAsync(Guid.NewGuid(), authorA, "travel-public", "travel", new DateTime(2026, 3, 20, 12, 0, 0, DateTimeKind.Utc), Visibility.Public);

        HttpClient client = _factory.CreateClient();
        HttpResponseMessage response = await client.GetAsync($"/api/posts?tag=music&authorId={authorA}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using JsonDocument doc = await TestApiHelper.ReadJsonAsync(response);
        JsonElement posts = TestApiHelper.GetProperty(doc.RootElement, "posts", "Posts");
        Assert.Single(posts.EnumerateArray());
        Assert.Equal(publicMatchingPostId, TestApiHelper.GetGuid(posts[0], "id", "Id"));
    }

    [Fact]
    public async Task FollowingFeed_ReturnsOnlyFollowedAuthors_InStableNewestFirstOrder()
    {
        HttpClient followerClient = _factory.CreateClient();
        HttpClient followedAClient = _factory.CreateClient();
        HttpClient followedBClient = _factory.CreateClient();
        HttpClient unfollowedClient = _factory.CreateClient();

        (string followerToken, _, _, _) = await TestApiHelper.RegisterUserAsync(followerClient, "feed_owner");
        (string followedAToken, Guid followedAId, _, _) = await TestApiHelper.RegisterUserAsync(followedAClient, "feed_a");
        (string followedBToken, Guid followedBId, _, _) = await TestApiHelper.RegisterUserAsync(followedBClient, "feed_b");
        (string unfollowedToken, _, _, _) = await TestApiHelper.RegisterUserAsync(unfollowedClient, "feed_c");

        TestApiHelper.SetBearerToken(followerClient, followerToken);
        TestApiHelper.SetBearerToken(followedAClient, followedAToken);
        TestApiHelper.SetBearerToken(followedBClient, followedBToken);
        TestApiHelper.SetBearerToken(unfollowedClient, unfollowedToken);

        Guid newestFollowedPostId = await TestApiHelper.CreatePostAsync(followedAClient, "Newest followed");
        Guid olderFollowedPostId = await TestApiHelper.CreatePostAsync(followedBClient, "Older followed");
        Guid unfollowedPostId = await TestApiHelper.CreatePostAsync(unfollowedClient, "Do not include me");

        using (IServiceScope scope = _factory.Services.CreateScope())
        {
            AppDbContext db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Post newest = await db.Posts.FindAsync(newestFollowedPostId) ?? throw new InvalidOperationException();
            Post older = await db.Posts.FindAsync(olderFollowedPostId) ?? throw new InvalidOperationException();
            Post outsider = await db.Posts.FindAsync(unfollowedPostId) ?? throw new InvalidOperationException();
            newest.CreatedAt = new DateTime(2026, 3, 21, 14, 0, 0, DateTimeKind.Utc);
            older.CreatedAt = new DateTime(2026, 3, 21, 13, 0, 0, DateTimeKind.Utc);
            outsider.CreatedAt = new DateTime(2026, 3, 21, 15, 0, 0, DateTimeKind.Utc);
            await db.SaveChangesAsync();
        }

        Assert.Equal(HttpStatusCode.NoContent, (await followerClient.PostAsync($"/api/users/{followedAId}/follow", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await followerClient.PostAsync($"/api/users/{followedBId}/follow", null)).StatusCode);

        HttpResponseMessage feedResponse = await followerClient.GetAsync("/api/posts/feed/following");
        Assert.Equal(HttpStatusCode.OK, feedResponse.StatusCode);
        using JsonDocument feedDoc = await TestApiHelper.ReadJsonAsync(feedResponse);
        JsonElement posts = TestApiHelper.GetProperty(feedDoc.RootElement, "posts", "Posts");
        Assert.Equal(2, posts.GetArrayLength());
        Assert.Equal(newestFollowedPostId, TestApiHelper.GetGuid(posts[0], "id", "Id"));
        Assert.Equal(olderFollowedPostId, TestApiHelper.GetGuid(posts[1], "id", "Id"));
        Assert.DoesNotContain(
            posts.EnumerateArray().Select(post => TestApiHelper.GetGuid(post, "id", "Id")),
            id => id == unfollowedPostId);
    }

    private async Task SeedUserWithProfileAsync(Guid userId, string prefix, string? fullName = null)
    {
        using IServiceScope scope = _factory.Services.CreateScope();
        AppDbContext db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        string unique = Guid.NewGuid().ToString("N")[..8];
        db.Users.Add(new User
        {
            Id = userId,
            Username = $"{prefix}_{unique}",
            Email = $"{prefix}_{unique}@example.com",
            PasswordHash = "hash",
            Role = UserRole.Author
        });
        db.Profiles.Add(new Profile
        {
            UserId = userId,
            FullName = fullName ?? prefix
        });
        await db.SaveChangesAsync();
    }

    private async Task SeedPostAsync(Guid postId, Guid authorId, string contentText, DateTime createdAt, Visibility visibility)
    {
        using IServiceScope scope = _factory.Services.CreateScope();
        AppDbContext db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Posts.Add(new Post
        {
            Id = postId,
            AuthorId = authorId,
            ContentText = contentText,
            MediaType = MediaType.Video,
            Visibility = visibility,
            CreatedAt = createdAt
        });
        await db.SaveChangesAsync();
    }

    private async Task SeedTaggedPostAsync(Guid postId, Guid authorId, string contentText, string tagName, DateTime createdAt, Visibility visibility)
    {
        using IServiceScope scope = _factory.Services.CreateScope();
        AppDbContext db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Tag? tag = db.Tags.FirstOrDefault(t => t.Name == tagName);
        if (tag == null)
        {
            tag = new Tag { Id = Guid.NewGuid(), Name = tagName };
            db.Tags.Add(tag);
        }

        db.Posts.Add(new Post
        {
            Id = postId,
            AuthorId = authorId,
            ContentText = contentText,
            MediaType = MediaType.Video,
            Visibility = visibility,
            CreatedAt = createdAt
        });
        db.PostTags.Add(new PostTag { PostId = postId, TagId = tag.Id });
        await db.SaveChangesAsync();
    }
}
