using System;
using System.ComponentModel.DataAnnotations;

namespace OneTake.Application.DTOs.Comments
{
    public record CommentDto(
        Guid Id,
        Guid PostId,
        Guid UserId,
        string Username,
        string Text,
        DateTime CreatedAt
    );

    public record CreateCommentRequest(
        [Required, MinLength(1), MaxLength(2000)] string Text
    );
}

