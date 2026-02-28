using System;
using System.ComponentModel.DataAnnotations;

namespace OneTake.Application.DTOs.Users
{
    public record ProfileDto(
        Guid UserId,
        string Username,
        string FullName,
        string? Bio,
        string? AvatarUrl,
        int FollowersCount,
        int FollowingCount,
        bool? IsFollowing = null
    );

    public record UpdateProfileRequest(
        [Required, MinLength(1), MaxLength(200)] string FullName,
        [MaxLength(500)] string? Bio,
        [MaxLength(2048)] string? AvatarUrl
    );
}

