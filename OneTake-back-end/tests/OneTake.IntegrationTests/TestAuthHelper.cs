using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

namespace OneTake.IntegrationTests
{
    public static class TestAuthHelper
    {
        public static async Task<string> GetAccessTokenAsync(HttpClient client)
        {
            string unique = Guid.NewGuid().ToString("N")[..8];
            string username = $"user_{unique}";
            string email = $"user_{unique}@example.com";
            string password = "Password123!";

            HttpResponseMessage registerResponse = await client.PostAsJsonAsync("/api/auth/register", new
            {
                username,
                email,
                password
            });

            if (registerResponse.StatusCode != HttpStatusCode.OK)
            {
                string body = await registerResponse.Content.ReadAsStringAsync();
                throw new InvalidOperationException($"Register failed: {registerResponse.StatusCode}, {body}");
            }

            string json = await registerResponse.Content.ReadAsStringAsync();
            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;
            if (root.TryGetProperty("accessToken", out JsonElement tokenProp))
                return tokenProp.GetString() ?? throw new InvalidOperationException("accessToken is null");
            if (root.TryGetProperty("AccessToken", out tokenProp))
                return tokenProp.GetString() ?? throw new InvalidOperationException("AccessToken is null");
            throw new InvalidOperationException("No accessToken in response: " + json);
        }

        public static void SetBearerToken(HttpClient client, string accessToken)
        {
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        }
    }
}
