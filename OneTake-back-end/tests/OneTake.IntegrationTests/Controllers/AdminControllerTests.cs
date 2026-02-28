using System.Linq;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using OneTake.Domain.Enums;
using OneTake.Infrastructure.Persistence;
using Xunit;

namespace OneTake.IntegrationTests.Controllers
{
    public class AdminControllerTests : IClassFixture<WebApiFactory>
    {
        private readonly HttpClient _client;
        private readonly WebApiFactory _factory;

        public AdminControllerTests(WebApiFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetAllUsers_Returns401_WhenUnauthorized()
        {
            HttpResponseMessage response = await _client.GetAsync("/api/admin/users");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetAllUsers_Returns200_WithAdminUser()
        {
            string unique = Guid.NewGuid().ToString("N")[..8];
            string email = $"admin_{unique}@example.com";
            string password = "Password123!";
            await _client.PostAsJsonAsync("/api/auth/register", new { username = $"admin_{unique}", email, password });

            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var user = db.Users.FirstOrDefault(u => u.Email == email);
                if (user != null)
                {
                    user.Role = UserRole.Admin;
                    await db.SaveChangesAsync();
                }
            }

            var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new { login = email, password });
            loginResponse.EnsureSuccessStatusCode();
            string json = await loginResponse.Content.ReadAsStringAsync();
            using (var doc = JsonDocument.Parse(json))
            {
                var root = doc.RootElement;
                string? token = root.TryGetProperty("accessToken", out var t) ? t.GetString() : root.TryGetProperty("AccessToken", out t) ? t.GetString() : null;
                TestAuthHelper.SetBearerToken(_client, token!);
            }

            HttpResponseMessage response = await _client.GetAsync("/api/admin/users");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
    }
}
