using System;

namespace OneTake.Application.DTOs.Users
{
    public record ProfileDto(
        Guid UserId,
        string Username,
        string FullName,
        string? Bio,
        string? AvatarUrl,
        int FollowersCount,
        int FollowingCount
    );

    public record UpdateProfileRequest(
        string FullName,
        string? Bio,
        string? AvatarUrl
    );
}

