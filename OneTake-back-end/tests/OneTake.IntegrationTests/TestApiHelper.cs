using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace OneTake.IntegrationTests;

public static class TestApiHelper
{
    public static async Task<(string AccessToken, Guid UserId, string Email, string Username)> RegisterUserAsync(
        HttpClient client,
        string? prefix = null,
        string password = "Password123!")
    {
        string unique = Guid.NewGuid().ToString("N")[..8];
        string safePrefix = string.IsNullOrWhiteSpace(prefix) ? "user" : prefix;
        string username = $"{safePrefix}_{unique}";
        string email = $"{safePrefix}_{unique}@example.com";

        HttpResponseMessage response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            username,
            email,
            password
        });

        await EnsureSuccessWithBodyAsync(response, "register");
        using JsonDocument doc = await ReadJsonAsync(response);
        JsonElement root = doc.RootElement;
        return (
            GetString(root, "accessToken", "AccessToken"),
            GetGuid(root.GetProperty("user"), "id", "Id"),
            email,
            username);
    }

    public static async Task<string> LoginAsync(HttpClient client, string login, string password = "Password123!")
    {
        HttpResponseMessage response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            login,
            password
        });

        await EnsureSuccessWithBodyAsync(response, "login");
        using JsonDocument doc = await ReadJsonAsync(response);
        return GetString(doc.RootElement, "accessToken", "AccessToken");
    }

    public static void SetBearerToken(HttpClient client, string accessToken)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
    }

    public static MultipartFormDataContent CreatePostForm(
        string contentText,
        string fileName = "clip.mp4",
        string contentType = "video/mp4",
        string fileContent = "fake-media",
        IEnumerable<string>? tags = null,
        string? visibility = null)
    {
        MultipartFormDataContent form = new MultipartFormDataContent();
        form.Add(new StringContent(contentText), "ContentText");

        if (tags != null)
        {
            foreach (string tag in tags)
            {
                form.Add(new StringContent(tag), "Tags");
            }
        }

        if (!string.IsNullOrWhiteSpace(visibility))
        {
            form.Add(new StringContent(visibility), "Visibility");
        }

        ByteArrayContent fileContentPart = new ByteArrayContent(Encoding.UTF8.GetBytes(fileContent));
        fileContentPart.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        form.Add(fileContentPart, "file", fileName);
        return form;
    }

    public static async Task<Guid> CreatePostAsync(
        HttpClient client,
        string contentText,
        IEnumerable<string>? tags = null,
        string? visibility = null)
    {
        using MultipartFormDataContent form = CreatePostForm(contentText, tags: tags, visibility: visibility);
        HttpResponseMessage response = await client.PostAsync("/api/posts", form);
        await EnsureSuccessWithBodyAsync(response, "create post");
        using JsonDocument doc = await ReadJsonAsync(response);
        return GetGuid(doc.RootElement, "id", "Id");
    }

    public static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(json);
    }

    public static string GetString(JsonElement element, params string[] propertyNames)
    {
        foreach (string propertyName in propertyNames)
        {
            if (element.TryGetProperty(propertyName, out JsonElement value))
            {
                return value.GetString() ?? throw new InvalidOperationException($"{propertyName} is null");
            }
        }

        throw new InvalidOperationException($"Missing property: {string.Join(", ", propertyNames)}");
    }

    public static Guid GetGuid(JsonElement element, params string[] propertyNames)
    {
        string value = GetString(element, propertyNames);
        return Guid.Parse(value);
    }

    private static async Task EnsureSuccessWithBodyAsync(HttpResponseMessage response, string operation)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        string body = await response.Content.ReadAsStringAsync();
        throw new InvalidOperationException($"{operation} failed: {(int)response.StatusCode} {response.StatusCode}, {body}");
    }
}
