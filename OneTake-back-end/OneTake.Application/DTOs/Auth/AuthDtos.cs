using System.ComponentModel.DataAnnotations;

namespace OneTake.Application.DTOs.Auth
{
    public record RegisterRequest(
        [Required] string Username,
        [Required, EmailAddress] string Email,
        [Required, MinLength(6)] string Password
    );

    public record LoginRequest(
        [Required] string Login,
        [Required] string Password
    );

    public record AuthUserDto(Guid Id, string Username, string Email);

    public record AuthResponse(string AccessToken, AuthUserDto User);

    public record RefreshTokenResponse(string AccessToken);

    public record LoginResult(AuthResponse Auth, string RefreshTokenValue);

    public record RefreshResult(RefreshTokenResponse Auth, string RefreshTokenValue);
}

