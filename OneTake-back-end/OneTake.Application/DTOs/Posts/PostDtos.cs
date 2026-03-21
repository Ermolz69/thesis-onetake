using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using OneTake.Domain.Enums;

namespace OneTake.Application.DTOs.Posts
{
    public record PostDto(
        Guid Id,
        string ContentText,
        string MediaUrl,
        MediaType MediaType,
        Visibility Visibility,
        string AuthorName,
        string AuthorDisplayName,
        string? AuthorAvatarUrl,
        Guid AuthorId,
        DateTime CreatedAt,
        int LikeCount,
        bool IsLikedByCurrentUser,
        int CommentCount,
        List<string> Tags,
        string? ThumbnailUrl,
        double? DurationSec
    );

    public record CreatePostRequest(
        [MaxLength(4000)] string ContentText,
        [MaxLength(20)] List<string>? Tags,
        Visibility? Visibility = null
    );
}
