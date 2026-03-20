using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Xunit;

namespace OneTake.IntegrationTests.Controllers;

public class FlowIntegrationTests : IClassFixture<WebApiFactory>
{
    private readonly WebApiFactory _factory;

    public FlowIntegrationTests(WebApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Register_Login_Me_Refresh_Logout_Flow_Works()
    {
        HttpClient client = _factory.CreateClient();

        (string accessToken, Guid userId, string email, _) = await TestApiHelper.RegisterUserAsync(client, "authflow");
        string loginToken = await TestApiHelper.LoginAsync(client, email);

        TestApiHelper.SetBearerToken(client, loginToken);
        HttpResponseMessage meResponse = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
        using (JsonDocument meDoc = await TestApiHelper.ReadJsonAsync(meResponse))
        {
            Assert.Equal(userId, TestApiHelper.GetGuid(meDoc.RootElement, "id", "Id"));
            Assert.Equal(email, TestApiHelper.GetString(meDoc.RootElement, "email", "Email"));
        }

        HttpResponseMessage refreshResponse = await client.PostAsync("/api/auth/refresh", content: null);
        Assert.Equal(HttpStatusCode.OK, refreshResponse.StatusCode);
        using (JsonDocument refreshDoc = await TestApiHelper.ReadJsonAsync(refreshResponse))
        {
            string refreshedAccessToken = TestApiHelper.GetString(refreshDoc.RootElement, "accessToken", "AccessToken");
            Assert.False(string.IsNullOrWhiteSpace(refreshedAccessToken));
        }

        HttpResponseMessage logoutResponse = await client.PostAsync("/api/auth/logout", content: null);
        Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);

        HttpResponseMessage refreshAfterLogoutResponse = await client.PostAsync("/api/auth/refresh", content: null);
        Assert.Equal(HttpStatusCode.Unauthorized, refreshAfterLogoutResponse.StatusCode);
    }

    [Fact]
    public async Task CreatePost_Fetch_Like_Unlike_Comment_Flow_PersistsCountsAndNotifications()
    {
        HttpClient authorClient = _factory.CreateClient();
        HttpClient viewerClient = _factory.CreateClient();

        (string authorToken, Guid authorId, _, _) = await TestApiHelper.RegisterUserAsync(authorClient, "authorflow");
        (string viewerToken, _, _, string viewerUsername) = await TestApiHelper.RegisterUserAsync(viewerClient, "viewerflow");
        TestApiHelper.SetBearerToken(authorClient, authorToken);
        TestApiHelper.SetBearerToken(viewerClient, viewerToken);

        Guid postId = await TestApiHelper.CreatePostAsync(authorClient, "Flow post", new[] { "flow", "integration" });

        HttpResponseMessage fetchResponse = await _factory.CreateClient().GetAsync($"/api/posts/{postId}");
        Assert.Equal(HttpStatusCode.OK, fetchResponse.StatusCode);

        HttpResponseMessage likeResponse = await viewerClient.PostAsync($"/api/posts/{postId}/like", content: null);
        Assert.Equal(HttpStatusCode.NoContent, likeResponse.StatusCode);

        HttpResponseMessage commentResponse = await viewerClient.PostAsJsonAsync($"/api/posts/{postId}/comments", new
        {
            text = "Great flow"
        });
        Assert.Equal(HttpStatusCode.OK, commentResponse.StatusCode);
        using (JsonDocument commentDoc = await TestApiHelper.ReadJsonAsync(commentResponse))
        {
            Assert.Equal("Great flow", TestApiHelper.GetString(commentDoc.RootElement, "text", "Text"));
            Assert.Equal(viewerUsername, TestApiHelper.GetString(commentDoc.RootElement, "username", "Username"));
        }

        HttpResponseMessage unlikeResponse = await viewerClient.DeleteAsync($"/api/posts/{postId}/like");
        Assert.Equal(HttpStatusCode.NoContent, unlikeResponse.StatusCode);

        HttpResponseMessage fetchAfterInteractionsResponse = await _factory.CreateClient().GetAsync($"/api/posts/{postId}");
        Assert.Equal(HttpStatusCode.OK, fetchAfterInteractionsResponse.StatusCode);
        using (JsonDocument postDoc = await TestApiHelper.ReadJsonAsync(fetchAfterInteractionsResponse))
        {
            JsonElement root = postDoc.RootElement;
            int likeCount = (root.TryGetProperty("likeCount", out JsonElement likes) ? likes : root.GetProperty("LikeCount")).GetInt32();
            int commentCount = (root.TryGetProperty("commentCount", out JsonElement comments) ? comments : root.GetProperty("CommentCount")).GetInt32();
            Assert.Equal(0, likeCount);
            Assert.Equal(1, commentCount);
            Assert.Equal(authorId, TestApiHelper.GetGuid(root, "authorId", "AuthorId"));
        }

        HttpResponseMessage commentsListResponse = await _factory.CreateClient().GetAsync($"/api/posts/{postId}/comments");
        Assert.Equal(HttpStatusCode.OK, commentsListResponse.StatusCode);
        using (JsonDocument commentsDoc = await TestApiHelper.ReadJsonAsync(commentsListResponse))
        {
            JsonElement comments = commentsDoc.RootElement;
            Assert.Equal(1, comments.GetArrayLength());
        }

        HttpResponseMessage unreadCountResponse = await authorClient.GetAsync("/api/notifications/unread-count");
        Assert.Equal(HttpStatusCode.OK, unreadCountResponse.StatusCode);
        string unreadCountJson = await unreadCountResponse.Content.ReadAsStringAsync();
        int unreadCount = int.Parse(unreadCountJson);
        Assert.Equal(2, unreadCount);
    }

    [Fact]
    public async Task Upload_Init_Parts_Status_Finalize_Flow_CreatesPost()
    {
        HttpClient client = _factory.CreateClient();
        (string accessToken, _, _, _) = await TestApiHelper.RegisterUserAsync(client, "uploadflow");
        TestApiHelper.SetBearerToken(client, accessToken);

        byte[] payload = Encoding.UTF8.GetBytes("small-video");
        HttpResponseMessage initResponse = await client.PostAsJsonAsync("/api/uploads/init", new
        {
            fileName = "upload.mp4",
            contentType = "video/mp4",
            totalSize = payload.Length,
            contentText = "Uploaded via flow",
            tags = new[] { "upload", "flow" }
        });

        Assert.Equal(HttpStatusCode.OK, initResponse.StatusCode);
        using JsonDocument initDoc = await TestApiHelper.ReadJsonAsync(initResponse);
        string uploadId = TestApiHelper.GetString(initDoc.RootElement, "uploadId", "UploadId");

        ByteArrayContent partContent = new ByteArrayContent(payload);
        partContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream");
        HttpResponseMessage uploadPartResponse = await client.PutAsync($"/api/uploads/{uploadId}/parts/0", partContent);
        Assert.Equal(HttpStatusCode.NoContent, uploadPartResponse.StatusCode);

        HttpResponseMessage statusResponse = await client.GetAsync($"/api/uploads/{uploadId}/status");
        Assert.Equal(HttpStatusCode.OK, statusResponse.StatusCode);
        using (JsonDocument statusDoc = await TestApiHelper.ReadJsonAsync(statusResponse))
        {
            JsonElement indices = statusDoc.RootElement.TryGetProperty("uploadedPartIndices", out JsonElement uploaded)
                ? uploaded
                : statusDoc.RootElement.GetProperty("UploadedPartIndices");
            Assert.Single(indices.EnumerateArray());
            Assert.Equal(0, indices[0].GetInt32());
        }

        HttpResponseMessage finalizeResponse = await client.PostAsJsonAsync($"/api/uploads/{uploadId}/finalize", new
        {
            contentText = "Finalized upload",
            tags = new[] { "upload", "final" }
        });

        Assert.Equal(HttpStatusCode.OK, finalizeResponse.StatusCode);
        using JsonDocument finalizeDoc = await TestApiHelper.ReadJsonAsync(finalizeResponse);
        Guid postId = TestApiHelper.GetGuid(finalizeDoc.RootElement, "id", "Id");

        HttpResponseMessage postResponse = await _factory.CreateClient().GetAsync($"/api/posts/{postId}");
        Assert.Equal(HttpStatusCode.OK, postResponse.StatusCode);
    }
}
