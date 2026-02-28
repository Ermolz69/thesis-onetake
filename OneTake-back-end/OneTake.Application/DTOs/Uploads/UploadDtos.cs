using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using OneTake.Domain.Enums;

namespace OneTake.Application.DTOs.Uploads
{
    public record InitUploadRequest(
        [Required, MinLength(1), MaxLength(256)] string FileName,
        [Required, MinLength(1), MaxLength(128)] string ContentType,
        [Range(1, long.MaxValue)] long TotalSize,
        [MaxLength(4000)] string? ContentText = null,
        [MaxLength(20)] List<string>? Tags = null
    );

    public record InitUploadResponse(
        string UploadId,
        int ChunkSize
    );

    public record UploadStatusResponse(
        string UploadId,
        int TotalParts,
        IReadOnlyList<int> UploadedPartIndices
    );

    public record FinalizeUploadRequest(
        [MaxLength(4000)] string? ContentText = null,
        [MaxLength(20)] List<string>? Tags = null,
        Visibility? Visibility = null,
        [Range(0, int.MaxValue)] int? TrimStartMs = null,
        [Range(0, int.MaxValue)] int? TrimEndMs = null
    );
}
