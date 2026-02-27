using System;
using OneTake.Domain.Common;
using OneTake.Domain.Enums;

namespace OneTake.Domain.Entities
{
    public class MediaObject : Entity
    {
        public string Url { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty; // Local path or key
        public MediaType MediaType { get; set; }
        public long FileSize { get; set; }
        public double? DurationSec { get; set; }
        public string? ThumbnailUrl { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}

