using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;
using OneTake.Infrastructure.Persistence;
using Xunit;

namespace OneTake.IntegrationTests.Controllers
{
    public class PostsControllerTests : IClassFixture<WebApiFactory>
    {
        private readonly HttpClient _client;
        private readonly WebApiFactory _factory;

        public PostsControllerTests(WebApiFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetPosts_Returns200_AndPagedShape()
        {
            HttpResponseMessage response = await _client.GetAsync("/api/posts?pageSize=5");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            string json = await response.Content.ReadAsStringAsync();
            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;
            Assert.True(root.TryGetProperty("posts", out _) || root.TryGetProperty("Posts", out _));
            Assert.True(root.TryGetProperty("nextCursor", out _) || root.TryGetProperty("NextCursor", out _));
            Assert.True(root.TryGetProperty("hasMore", out _) || root.TryGetProperty("HasMore", out _));
        }

        [Fact]
        public async Task GetPosts_WithTag_Returns200()
        {
            const string tagName = "integration-test-tag";
            Guid postId;
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                string u1 = Guid.NewGuid().ToString("N")[..8];
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    Username = $"postauthor_{u1}",
                    Email = $"postauthor_{u1}@example.com",
                    PasswordHash = "hash",
                    Role = UserRole.Author
                };
                db.Users.Add(user);
                db.Profiles.Add(new Profile { Id = Guid.NewGuid(), UserId = user.Id, FullName = "Post Author" });
                var tag = new Tag { Id = Guid.NewGuid(), Name = tagName };
                db.Tags.Add(tag);
                postId = Guid.NewGuid();
                var post = new Post
                {
                    Id = postId,
                    AuthorId = user.Id,
                    ContentText = "Post with tag",
                    MediaType = MediaType.Video,
                    Visibility = Visibility.Public
                };
                db.Posts.Add(post);
                db.PostTags.Add(new PostTag { PostId = post.Id, TagId = tag.Id });
                await db.SaveChangesAsync();
            }

            HttpResponseMessage response = await _client.GetAsync($"/api/posts?tag={Uri.EscapeDataString(tagName)}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            string json = await response.Content.ReadAsStringAsync();
            using (JsonDocument doc = JsonDocument.Parse(json))
            {
                JsonElement root = doc.RootElement;
                Assert.True(root.TryGetProperty("posts", out var postsEl) || root.TryGetProperty("Posts", out postsEl));
                Assert.True(postsEl.GetArrayLength() >= 1);
            }
        }

        [Fact]
        public async Task GetPostById_Returns200_WhenPostExists()
        {
            Guid postId;
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                string u2 = Guid.NewGuid().ToString("N")[..8];
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    Username = $"getbyid_author_{u2}",
                    Email = $"getbyid_author_{u2}@example.com",
                    PasswordHash = "hash",
                    Role = UserRole.Author
                };
                db.Users.Add(user);
                db.Profiles.Add(new Profile { Id = Guid.NewGuid(), UserId = user.Id, FullName = "GetById Author" });
                postId = Guid.NewGuid();
                db.Posts.Add(new Post
                {
                    Id = postId,
                    AuthorId = user.Id,
                    ContentText = "Seeded post",
                    MediaType = MediaType.Video,
                    Visibility = Visibility.Public
                });
                await db.SaveChangesAsync();
            }

            HttpResponseMessage response = await _client.GetAsync($"/api/posts/{postId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            string json = await response.Content.ReadAsStringAsync();
            using (JsonDocument doc = JsonDocument.Parse(json))
            {
                JsonElement root = doc.RootElement;
                Assert.True(root.TryGetProperty("id", out var idEl) || root.TryGetProperty("Id", out idEl));
                Assert.Equal(postId.ToString(), idEl.GetString());
            }
        }

        [Fact]
        public async Task GetPostById_Returns404_WhenNotFound()
        {
            Guid nonExistentId = Guid.NewGuid();
            HttpResponseMessage response = await _client.GetAsync($"/api/posts/{nonExistentId}");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
