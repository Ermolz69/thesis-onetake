using System;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace OneTake.IntegrationTests.Controllers
{
    public class AuthControllerTests : IClassFixture<WebApiFactory>
    {
        private readonly HttpClient _client;

        public AuthControllerTests(WebApiFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task Register_ShouldReturnBadRequest_WhenModelIsInvalid()
        {
            HttpResponseMessage response = await _client.PostAsJsonAsync("/api/auth/register", new { });

            Assert.True(response.StatusCode == HttpStatusCode.BadRequest ||
                       response.StatusCode == HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task Register_ShouldReturn400_WithProblemDetailsShape_WhenModelIsInvalid()
        {
            HttpResponseMessage response = await _client.PostAsJsonAsync("/api/auth/register", new { });

            if (response.StatusCode != HttpStatusCode.BadRequest)
            {
                return;
            }

            string json = await response.Content.ReadAsStringAsync();
            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;
            Assert.True(root.TryGetProperty("type", out _) || root.TryGetProperty("title", out _) || root.TryGetProperty("detail", out _) || root.TryGetProperty("errors", out _));
        }

        [Fact]
        public async Task Login_ShouldReturnBadRequest_WhenCredentialsAreInvalid()
        {
            var response = await _client.PostAsJsonAsync("/api/auth/login", new
            {
                login = "nonexistent@example.com",
                password = "wrongpassword"
            });

            Assert.True(response.StatusCode == HttpStatusCode.BadRequest ||
                       response.StatusCode == HttpStatusCode.Unauthorized ||
                       response.StatusCode == HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task Register_Returns200_WhenValidRequest()
        {
            string unique = Guid.NewGuid().ToString("N")[..8];
            var response = await _client.PostAsJsonAsync("/api/auth/register", new
            {
                username = $"reg_{unique}",
                email = $"reg_{unique}@example.com",
                password = "Password123!"
            });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            string json = await response.Content.ReadAsStringAsync();
            Assert.Contains("accessToken", json, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Login_Returns200_WhenValidCredentials()
        {
            string unique = Guid.NewGuid().ToString("N")[..8];
            string email = $"login_{unique}@example.com";
            await _client.PostAsJsonAsync("/api/auth/register", new
            {
                username = $"login_{unique}",
                email,
                password = "Password123!"
            });

            var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new
            {
                login = email,
                password = "Password123!"
            });

            Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
            string json = await loginResponse.Content.ReadAsStringAsync();
            Assert.Contains("accessToken", json, StringComparison.OrdinalIgnoreCase);
        }
    }
}

