using System;
using System.Collections.Generic;
using OneTake.Domain.Enums;

namespace OneTake.Application.DTOs.Posts
{
    public record PostDto(
        Guid Id,
        string ContentText,
        string MediaUrl,
        MediaType MediaType,
        string AuthorName,
        Guid AuthorId,
        DateTime CreatedAt,
        int LikeCount,
        int CommentCount,
        List<string> Tags
    );

    public record CreatePostRequest(
        string ContentText,
        List<string> Tags
        // File is handled separately in Controller
    );
}

