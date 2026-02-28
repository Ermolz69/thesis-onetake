using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace OneTake.Application.Common.Interfaces
{
    public class UploadSessionMeta
    {
        public string UploadId { get; set; } = string.Empty;
        public Guid UserId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long TotalSize { get; set; }
        public string? ContentText { get; set; }
        public System.Collections.Generic.List<string>? Tags { get; set; }
        public Domain.Enums.Visibility? Visibility { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public interface IUploadSessionStore
    {
        Task<string> CreateSessionAsync(UploadSessionMeta meta, CancellationToken cancellationToken = default);
        Task<UploadSessionMeta?> GetSessionAsync(string uploadId, CancellationToken cancellationToken = default);
        Task SavePartAsync(string uploadId, int partIndex, Stream data, CancellationToken cancellationToken = default);
        Task<Stream> GetMergedStreamAsync(string uploadId, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<int>> GetUploadedPartIndicesAsync(string uploadId, CancellationToken cancellationToken = default);
        Task DeleteSessionAsync(string uploadId, CancellationToken cancellationToken = default);
    }
}
