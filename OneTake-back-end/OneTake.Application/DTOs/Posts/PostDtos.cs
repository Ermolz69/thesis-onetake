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
        Guid AuthorId,
        DateTime CreatedAt,
        int LikeCount,
        int CommentCount,
        List<string> Tags
    );

    public record CreatePostRequest(
        [MaxLength(4000)] string ContentText,
        [MaxLength(20)] List<string>? Tags,
        Visibility? Visibility = null
    );
}

