using System.Net;
using System.Threading.Tasks;
using Xunit;

namespace OneTake.IntegrationTests.Controllers
{
    public class NotificationsControllerTests : IClassFixture<WebApiFactory>
    {
        private readonly HttpClient _client;

        public NotificationsControllerTests(WebApiFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetNotifications_Returns401_WhenUnauthorized()
        {
            HttpResponseMessage response = await _client.GetAsync("/api/notifications");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetUnreadCount_Returns401_WhenUnauthorized()
        {
            HttpResponseMessage response = await _client.GetAsync("/api/notifications/unread-count");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetNotifications_Returns200_WithAuth()
        {
            string token = await TestAuthHelper.GetAccessTokenAsync(_client);
            TestAuthHelper.SetBearerToken(_client, token);

            HttpResponseMessage response = await _client.GetAsync("/api/notifications");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
    }
}
