using System;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;
using OneTake.Infrastructure.Persistence;
using Xunit;

namespace OneTake.IntegrationTests.Controllers
{
    public class UsersControllerTests : IClassFixture<WebApiFactory>
    {
        private readonly HttpClient _client;
        private readonly WebApiFactory _factory;

        public UsersControllerTests(WebApiFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetProfile_Returns404_WhenUserNotFound()
        {
            Guid nonExistentId = Guid.NewGuid();
            HttpResponseMessage response = await _client.GetAsync($"/api/users/{nonExistentId}");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetProfile_Returns200_WhenUserExists()
        {
            Guid userId;
            string unique = Guid.NewGuid().ToString("N")[..8];
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    Username = $"ProfileUser_{unique}",
                    Email = $"profile_{unique}@example.com",
                    PasswordHash = "hash",
                    Role = UserRole.Author
                };
                context.Users.Add(user);
                var profile = new Profile { UserId = user.Id, FullName = "Full Name" };
                context.Profiles.Add(profile);
                await context.SaveChangesAsync();
                userId = user.Id;
            }

            HttpResponseMessage response = await _client.GetAsync($"/api/users/{userId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            string json = await response.Content.ReadAsStringAsync();
            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;
            Assert.True(root.TryGetProperty("username", out var u) || root.TryGetProperty("Username", out u));
            Assert.True(root.TryGetProperty("fullName", out var fn) || root.TryGetProperty("FullName", out fn));
        }

        [Fact]
        public async Task UpdateProfile_Returns200_WithAuth()
        {
            string token = await TestAuthHelper.GetAccessTokenAsync(_client);
            TestAuthHelper.SetBearerToken(_client, token);

            HttpResponseMessage response = await _client.PutAsJsonAsync("/api/users/me/profile", new
            {
                fullName = "Updated Full Name",
                bio = "My bio"
            });

            Assert.True(response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NoContent);
        }

        [Fact]
        public async Task Follow_Returns200_WithAuth()
        {
            string token = await TestAuthHelper.GetAccessTokenAsync(_client);
            TestAuthHelper.SetBearerToken(_client, token);

            Guid targetUserId;
            string unique = Guid.NewGuid().ToString("N")[..8];
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    Username = $"followee_{unique}",
                    Email = $"followee_{unique}@example.com",
                    PasswordHash = "hash",
                    Role = OneTake.Domain.Enums.UserRole.Author
                };
                db.Users.Add(user);
                db.Profiles.Add(new Profile { UserId = user.Id, FullName = "Followee" });
                await db.SaveChangesAsync();
                targetUserId = user.Id;
            }

            HttpResponseMessage response = await _client.PostAsync($"/api/users/{targetUserId}/follow", null);

            Assert.True(response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NoContent || response.StatusCode == HttpStatusCode.Created);
        }
    }
}
