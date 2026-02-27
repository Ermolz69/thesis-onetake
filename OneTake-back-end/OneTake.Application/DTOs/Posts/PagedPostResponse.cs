using System;
using System.Collections.Generic;

namespace OneTake.Application.DTOs.Posts
{
    public record PagedPostResponse(
        List<PostDto> Posts,
        string? NextCursor,
        bool HasMore
    );
}

