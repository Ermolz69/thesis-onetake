using System;

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
        string Text
    );
}

