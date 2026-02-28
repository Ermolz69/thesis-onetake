using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace OneTake.IntegrationTests
{
    public class WebApiFactory : WebApplicationFactory<OneTake.WebApi.Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseSetting("UseInMemoryDatabase", "true");
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["UseInMemoryDatabase"] = "true",
                    ["Jwt:Secret"] = "ThisIsASecretKeyForJwtTokenGenerationOneTakeApp123!",
                    ["Jwt:Issuer"] = "OneTakeApi",
                    ["Jwt:Audience"] = "OneTakeClient",
                    ["Jwt:ExpirationInMinutes"] = "15",
                    ["Jwt:RefreshExpirationDays"] = "14",
                    ["Jwt:RefreshCookieName"] = "refreshToken",
                    ["Jwt:RefreshCookiePath"] = "/api/auth/refresh",
                    ["Jwt:RefreshCookieSecure"] = "false"
                });
            });
        }
    }
}

