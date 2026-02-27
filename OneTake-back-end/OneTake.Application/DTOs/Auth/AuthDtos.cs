using System.ComponentModel.DataAnnotations;

namespace OneTake.Application.DTOs.Auth
{
    public record RegisterRequest(
        [Required] string Username,
        [Required, EmailAddress] string Email,
        [Required, MinLength(6)] string Password
    );

    public record LoginRequest(
        [Required] string Login, // Username or Email
        [Required] string Password
    );

    public record AuthResponse(
        Guid Id,
        string Username,
        string Email,
        string Token
    );
}

