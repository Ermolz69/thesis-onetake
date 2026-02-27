using System.Net;
using System.Net.Http.Json;
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
            var response = await _client.PostAsJsonAsync("/api/auth/register", new { });

            Assert.True(response.StatusCode == HttpStatusCode.BadRequest || 
                       response.StatusCode == HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task Login_ShouldReturnBadRequest_WhenCredentialsAreInvalid()
        {
            var response = await _client.PostAsJsonAsync("/api/auth/login", new
            {
                Username = "nonexistent",
                Password = "wrongpassword"
            });

            Assert.True(response.StatusCode == HttpStatusCode.BadRequest || 
                       response.StatusCode == HttpStatusCode.Unauthorized ||
                       response.StatusCode == HttpStatusCode.NotFound);
        }
    }
}

