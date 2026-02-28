using System.Security.Claims;
using System.Threading;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Auth;
using OneTake.Application.Services;
using OneTake.WebApi.Extensions;

namespace OneTake.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IConfiguration _configuration;

        public AuthController(IAuthService authService, IConfiguration configuration)
        {
            _authService = authService;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest request, CancellationToken cancellationToken = default)
        {
            Result<LoginResult> result = await _authService.RegisterAsync(request, cancellationToken);
            return result.Match(
                loginResult =>
                {
                    SetRefreshCookie(loginResult.RefreshTokenValue);
                    return (IActionResult)new OkObjectResult(loginResult.Auth);
                },
                error => error.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken = default)
        {
            Result<LoginResult> result = await _authService.LoginAsync(request, cancellationToken);
            return result.Match(
                loginResult =>
                {
                    SetRefreshCookie(loginResult.RefreshTokenValue);
                    return (IActionResult)new OkObjectResult(loginResult.Auth);
                },
                error => error.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method));
        }

        private void SetRefreshCookie(string refreshTokenValue)
        {
            string cookieName = _configuration["Jwt:RefreshCookieName"] ?? "refreshToken";
            string path = _configuration["Jwt:RefreshCookiePath"] ?? "/api/auth/refresh";
            bool secure = string.Equals(_configuration["Jwt:RefreshCookieSecure"], "true", StringComparison.OrdinalIgnoreCase);
            int refreshDays = int.Parse(_configuration["Jwt:RefreshExpirationDays"] ?? "14");
            TimeSpan maxAge = TimeSpan.FromDays(refreshDays);

            CookieOptions options = new CookieOptions
            {
                HttpOnly = true,
                Secure = secure,
                SameSite = SameSiteMode.Lax,
                Path = path,
                MaxAge = maxAge
            };

            Response.Cookies.Append(cookieName, refreshTokenValue, options);
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh(CancellationToken cancellationToken = default)
        {
            string cookieName = _configuration["Jwt:RefreshCookieName"] ?? "refreshToken";
            string? refreshToken = Request.Cookies[cookieName];

            Result<RefreshResult> result = await _authService.RefreshAsync(refreshToken, cancellationToken);

            return result.Match(
                refreshResult =>
                {
                    SetRefreshCookie(refreshResult.RefreshTokenValue);
                    return (IActionResult)new OkObjectResult(refreshResult.Auth);
                },
                error => error.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method));
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout(CancellationToken cancellationToken = default)
        {
            string cookieName = _configuration["Jwt:RefreshCookieName"] ?? "refreshToken";
            string path = _configuration["Jwt:RefreshCookiePath"] ?? "/api/auth/refresh";
            string? refreshToken = Request.Cookies[cookieName];

            await _authService.RevokeRefreshTokenAsync(refreshToken, cancellationToken);

            Response.Cookies.Append(cookieName, string.Empty, new CookieOptions
            {
                HttpOnly = true,
                Secure = string.Equals(_configuration["Jwt:RefreshCookieSecure"], "true", StringComparison.OrdinalIgnoreCase),
                SameSite = SameSiteMode.Lax,
                Path = path,
                Expires = DateTimeOffset.UtcNow.AddYears(-1)
            });

            return NoContent();
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me(CancellationToken cancellationToken = default)
        {
            string? userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
            {
                return Unauthorized();
            }

            Result<AuthUserDto> result = await _authService.GetMeAsync(userId, cancellationToken);
            return result.Match(
                user => (IActionResult)new OkObjectResult(user),
                error => error.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method));
        }
    }
}

