using System.Linq;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using OneTake.Domain.Enums;
using OneTake.Infrastructure.Persistence;
using Xunit;

namespace OneTake.IntegrationTests.Controllers;

public class AuthorizationMatrixTests : IClassFixture<WebApiFactory>
{
    private readonly WebApiFactory _factory;

    public AuthorizationMatrixTests(WebApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task DeletePost_Returns401_ForAnonymousUser()
    {
        HttpClient anonymousClient = _factory.CreateClient();

        HttpResponseMessage response = await anonymousClient.DeleteAsync($"/api/posts/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task DeletePost_Returns403_ForAuthenticatedNonOwner()
    {
        HttpClient ownerClient = _factory.CreateClient();
        HttpClient otherClient = _factory.CreateClient();

        (string ownerToken, _, _, _) = await TestApiHelper.RegisterUserAsync(ownerClient, "ownerdel");
        (string otherToken, _, _, _) = await TestApiHelper.RegisterUserAsync(otherClient, "otherdel");
        TestApiHelper.SetBearerToken(ownerClient, ownerToken);
        TestApiHelper.SetBearerToken(otherClient, otherToken);

        Guid postId = await TestApiHelper.CreatePostAsync(ownerClient, "Owner post");
        HttpResponseMessage deleteResponse = await otherClient.DeleteAsync($"/api/posts/{postId}");

        Assert.Equal(HttpStatusCode.Forbidden, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task DeletePost_Returns204_ForOwner()
    {
        HttpClient ownerClient = _factory.CreateClient();

        (string ownerToken, _, _, _) = await TestApiHelper.RegisterUserAsync(ownerClient, "ownerok");
        TestApiHelper.SetBearerToken(ownerClient, ownerToken);
        Guid postId = await TestApiHelper.CreatePostAsync(ownerClient, "Delete me");

        HttpResponseMessage deleteResponse = await ownerClient.DeleteAsync($"/api/posts/{postId}");

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task AdminEndpoints_Return401_ForAnonymous_And403_ForNonAdmin_AndSucceed_ForAdmin()
    {
        HttpClient anonymousClient = _factory.CreateClient();
        HttpClient authorClient = _factory.CreateClient();
        HttpClient adminClient = _factory.CreateClient();

        HttpResponseMessage anonymousResponse = await anonymousClient.GetAsync("/api/admin/users");
        Assert.Equal(HttpStatusCode.Unauthorized, anonymousResponse.StatusCode);

        (string authorToken, Guid authorId, _, _) = await TestApiHelper.RegisterUserAsync(authorClient, "authoradmin");
        TestApiHelper.SetBearerToken(authorClient, authorToken);
        HttpResponseMessage authorResponse = await authorClient.GetAsync("/api/admin/users");
        Assert.Equal(HttpStatusCode.Forbidden, authorResponse.StatusCode);

        (_, Guid adminId, string adminEmail, _) = await TestApiHelper.RegisterUserAsync(adminClient, "realadmin");
        using (IServiceScope scope = _factory.Services.CreateScope())
        {
            AppDbContext db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var adminUser = await db.Users.FindAsync(adminId);
            Assert.NotNull(adminUser);
            adminUser!.Role = UserRole.Admin;
            await db.SaveChangesAsync();
        }

        string elevatedAdminToken = await TestApiHelper.LoginAsync(adminClient, adminEmail);
        TestApiHelper.SetBearerToken(adminClient, elevatedAdminToken);

        HttpResponseMessage adminListResponse = await adminClient.GetAsync("/api/admin/users");
        Assert.Equal(HttpStatusCode.OK, adminListResponse.StatusCode);

        HttpResponseMessage updateRoleResponse = await adminClient.PutAsJsonAsync($"/api/admin/users/{authorId}/role", UserRole.Moderator);
        Assert.Equal(HttpStatusCode.NoContent, updateRoleResponse.StatusCode);
    }

    [Fact]
    public async Task PublicAndUnlistedPosts_FollowVisibilityRules()
    {
        HttpClient authorClient = _factory.CreateClient();
        (string authorToken, _, _, _) = await TestApiHelper.RegisterUserAsync(authorClient, "visibility");
        TestApiHelper.SetBearerToken(authorClient, authorToken);

        Guid publicPostId = await TestApiHelper.CreatePostAsync(authorClient, "Public post", visibility: "Public");
        Guid unlistedPostId = await TestApiHelper.CreatePostAsync(authorClient, "Unlisted post", visibility: "Unlisted");

        HttpClient anonymousClient = _factory.CreateClient();
        HttpResponseMessage listResponse = await anonymousClient.GetAsync("/api/posts?pageSize=50");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        using (JsonDocument listDoc = await TestApiHelper.ReadJsonAsync(listResponse))
        {
            JsonElement posts = listDoc.RootElement.TryGetProperty("posts", out JsonElement items)
                ? items
                : listDoc.RootElement.GetProperty("Posts");
            List<Guid> returnedIds = posts
                .EnumerateArray()
                .Select(post => TestApiHelper.GetGuid(post, "id", "Id"))
                .ToList();

            Assert.Contains(publicPostId, returnedIds);
            Assert.DoesNotContain(unlistedPostId, returnedIds);
        }

        HttpResponseMessage unlistedByIdResponse = await anonymousClient.GetAsync($"/api/posts/{unlistedPostId}");
        Assert.Equal(HttpStatusCode.OK, unlistedByIdResponse.StatusCode);
    }

    [Fact]
    public async Task FollowingFeed_Returns401_ForAnonymous_And200_ForAuthenticatedFollower()
    {
        HttpClient creatorClient = _factory.CreateClient();
        HttpClient followerClient = _factory.CreateClient();
        HttpClient anonymousClient = _factory.CreateClient();

        (string creatorToken, Guid creatorId, _, _) = await TestApiHelper.RegisterUserAsync(creatorClient, "feedcreator");
        (string followerToken, _, _, _) = await TestApiHelper.RegisterUserAsync(followerClient, "feedfollower");
        TestApiHelper.SetBearerToken(creatorClient, creatorToken);
        TestApiHelper.SetBearerToken(followerClient, followerToken);

        await TestApiHelper.CreatePostAsync(creatorClient, "Following feed post");

        HttpResponseMessage anonymousResponse = await anonymousClient.GetAsync("/api/posts/feed/following");
        Assert.Equal(HttpStatusCode.Unauthorized, anonymousResponse.StatusCode);

        HttpResponseMessage followResponse = await followerClient.PostAsync($"/api/users/{creatorId}/follow", content: null);
        Assert.Equal(HttpStatusCode.NoContent, followResponse.StatusCode);

        HttpResponseMessage feedResponse = await followerClient.GetAsync("/api/posts/feed/following");
        Assert.Equal(HttpStatusCode.OK, feedResponse.StatusCode);
        using JsonDocument feedDoc = await TestApiHelper.ReadJsonAsync(feedResponse);
        JsonElement posts = feedDoc.RootElement.TryGetProperty("posts", out JsonElement items)
            ? items
            : feedDoc.RootElement.GetProperty("Posts");
        Assert.True(posts.GetArrayLength() >= 1);
    }
}
