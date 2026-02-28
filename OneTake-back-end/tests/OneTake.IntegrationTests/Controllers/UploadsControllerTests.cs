using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace OneTake.IntegrationTests.Controllers
{
    public class UploadsControllerTests : IClassFixture<WebApiFactory>
    {
        private readonly HttpClient _client;

        public UploadsControllerTests(WebApiFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task Init_Returns401_WhenUnauthorized()
        {
            HttpResponseMessage response = await _client.PostAsJsonAsync("/api/uploads/init", new
            {
                fileName = "test.mp4",
                contentType = "video/mp4",
                totalSize = 1024L,
                contentText = "",
                tags = Array.Empty<string>()
            });

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Init_Returns200_WithAuth()
        {
            string token = await TestAuthHelper.GetAccessTokenAsync(_client);
            TestAuthHelper.SetBearerToken(_client, token);

            HttpResponseMessage response = await _client.PostAsJsonAsync("/api/uploads/init", new
            {
                fileName = "test.mp4",
                contentType = "video/mp4",
                totalSize = 1024L,
                contentText = "",
                tags = Array.Empty<string>()
            });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            string json = await response.Content.ReadAsStringAsync();
            using JsonDocument doc = JsonDocument.Parse(json);
            Assert.True(doc.RootElement.TryGetProperty("uploadId", out _) || doc.RootElement.TryGetProperty("UploadId", out _));
        }

        [Fact]
        public async Task Status_Returns401_WhenUnauthorized()
        {
            HttpResponseMessage response = await _client.GetAsync("/api/uploads/some-id/status");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
}
