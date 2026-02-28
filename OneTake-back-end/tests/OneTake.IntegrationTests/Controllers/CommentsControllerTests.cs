using System.Net;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;
using OneTake.Infrastructure.Persistence;
using Xunit;

namespace OneTake.IntegrationTests.Controllers
{
    public class CommentsControllerTests : IClassFixture<WebApiFactory>
    {
        private readonly HttpClient _client;
        private readonly WebApiFactory _factory;

        public CommentsControllerTests(WebApiFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetComments_Returns200_AndArrayShape()
        {
            Guid postId = Guid.NewGuid();
            HttpResponseMessage response = await _client.GetAsync($"/api/posts/{postId}/comments");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            string json = await response.Content.ReadAsStringAsync();
            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;
            Assert.Equal(JsonValueKind.Array, root.ValueKind);
        }

        [Fact]
        public async Task GetComments_Returns200_WhenPostExists()
        {
            Guid postId;
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                string u3 = Guid.NewGuid().ToString("N")[..8];
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    Username = $"comment_author_{u3}",
                    Email = $"comment_author_{u3}@example.com",
                    PasswordHash = "hash",
                    Role = UserRole.Author
                };
                db.Users.Add(user);
                db.Profiles.Add(new Profile { Id = Guid.NewGuid(), UserId = user.Id, FullName = "Comment Author" });
                postId = Guid.NewGuid();
                db.Posts.Add(new Post
                {
                    Id = postId,
                    AuthorId = user.Id,
                    ContentText = "Post for comments",
                    MediaType = MediaType.Video,
                    Visibility = Visibility.Public
                });
                db.Comments.Add(new Comment
                {
                    Id = Guid.NewGuid(),
                    PostId = postId,
                    UserId = user.Id,
                    Text = "Seeded comment"
                });
                await db.SaveChangesAsync();
            }

            HttpResponseMessage response = await _client.GetAsync($"/api/posts/{postId}/comments");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            string json = await response.Content.ReadAsStringAsync();
            using (JsonDocument doc = JsonDocument.Parse(json))
            {
                JsonElement root = doc.RootElement;
                Assert.Equal(JsonValueKind.Array, root.ValueKind);
                Assert.True(root.GetArrayLength() >= 1);
            }
        }
    }
}
