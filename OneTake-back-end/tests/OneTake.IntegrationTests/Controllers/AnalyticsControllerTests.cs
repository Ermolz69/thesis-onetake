using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Xunit;

namespace OneTake.IntegrationTests.Controllers
{
    public class AnalyticsControllerTests : IClassFixture<WebApiFactory>
    {
        private readonly HttpClient _client;

        public AnalyticsControllerTests(WebApiFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task TrackEvent_Returns401_WhenUnauthorized()
        {
            HttpResponseMessage response = await _client.PostAsJsonAsync("/api/analytics/events", new
            {
                eventName = "test",
                propsJson = "{}",
                entityType = "post",
                entityId = "00000000-0000-0000-0000-000000000000"
            });

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task TrackEvent_Returns202_WithAuth()
        {
            string token = await TestAuthHelper.GetAccessTokenAsync(_client);
            TestAuthHelper.SetBearerToken(_client, token);

            HttpResponseMessage response = await _client.PostAsJsonAsync("/api/analytics/events", new
            {
                eventName = "test",
                propsJson = "{}",
                entityType = "post",
                entityId = "00000000-0000-0000-0000-000000000000"
            });

            Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        }
    }
}
