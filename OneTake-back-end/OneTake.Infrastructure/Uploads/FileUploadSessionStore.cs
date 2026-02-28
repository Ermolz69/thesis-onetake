using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using OneTake.Application.Common.Interfaces;

namespace OneTake.Infrastructure.Uploads
{
    public class FileUploadSessionStore : IUploadSessionStore
    {
        private const int ChunkSizeBytes = 5 * 1024 * 1024;
        private readonly string _basePath;

        public static int ChunkSize => ChunkSizeBytes;

        public FileUploadSessionStore(IConfiguration configuration)
        {
            string uploadsPath = configuration["UploadSessionStore:BasePath"]
                ?? Path.Combine(Path.GetTempPath(), "onetake_uploads");
            _basePath = uploadsPath;
            if (!Directory.Exists(_basePath))
            {
                Directory.CreateDirectory(_basePath);
            }
        }

        private string GetSessionPath(string uploadId) => Path.Combine(_basePath, uploadId);

        public Task<string> CreateSessionAsync(UploadSessionMeta meta, CancellationToken cancellationToken = default)
        {
            string path = GetSessionPath(meta.UploadId);
            if (Directory.Exists(path))
            {
                throw new InvalidOperationException($"Session {meta.UploadId} already exists");
            }
            Directory.CreateDirectory(path);
            string metaPath = Path.Combine(path, "meta.json");
            string json = JsonSerializer.Serialize(meta);
            File.WriteAllText(metaPath, json);
            return Task.FromResult(meta.UploadId);
        }

        public async Task<UploadSessionMeta?> GetSessionAsync(string uploadId, CancellationToken cancellationToken = default)
        {
            string metaPath = Path.Combine(GetSessionPath(uploadId), "meta.json");
            if (!File.Exists(metaPath))
            {
                return null;
            }
            string json = await File.ReadAllTextAsync(metaPath, cancellationToken);
            return JsonSerializer.Deserialize<UploadSessionMeta>(json);
        }

        public async Task SavePartAsync(string uploadId, int partIndex, Stream data, CancellationToken cancellationToken = default)
        {
            var path = GetSessionPath(uploadId);
            if (!Directory.Exists(path))
            {
                throw new InvalidOperationException($"Session {uploadId} not found");
            }

            var partPath = Path.Combine(path, $"part_{partIndex}");
            await using var file = new FileStream(partPath, FileMode.Create, FileAccess.Write, FileShare.None);
            await data.CopyToAsync(file, cancellationToken);
        }

        public Task<IReadOnlyList<int>> GetUploadedPartIndicesAsync(string uploadId, CancellationToken cancellationToken = default)
        {
            string path = GetSessionPath(uploadId);
            if (!Directory.Exists(path))
            {
                return Task.FromResult<IReadOnlyList<int>>(Array.Empty<int>());
            }
            List<int> indices = Directory.GetFiles(path, "part_*")
                .Select(f => int.TryParse(Path.GetFileName(f).Replace("part_", ""), out var i) ? i : -1)
                .Where(i => i >= 0)
                .OrderBy(i => i)
                .ToList();
            return Task.FromResult<IReadOnlyList<int>>(indices);
        }

        public async Task<Stream> GetMergedStreamAsync(string uploadId, CancellationToken cancellationToken = default)
        {
            var path = GetSessionPath(uploadId);
            if (!Directory.Exists(path))
            {
                throw new InvalidOperationException($"Session {uploadId} not found");
            }

            var partFiles = Directory.GetFiles(path, "part_*")
                .OrderBy(f => int.Parse(Path.GetFileName(f).Replace("part_", "")))
                .ToArray();
            if (partFiles.Length == 0)
            {
                throw new InvalidOperationException($"No parts found for session {uploadId}");
            }
            var mergedPath = Path.Combine(path, "merged.tmp");
            await using (var merged = new FileStream(mergedPath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                foreach (var partPath in partFiles)
                {
                    await using var part = new FileStream(partPath, FileMode.Open, FileAccess.Read, FileShare.Read);
                    await part.CopyToAsync(merged, cancellationToken);
                }
            }
            return new FileStream(mergedPath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, FileOptions.DeleteOnClose);
        }

        public Task DeleteSessionAsync(string uploadId, CancellationToken cancellationToken = default)
        {
            string path = GetSessionPath(uploadId);
            if (Directory.Exists(path))
            {
                try
                {
                    Directory.Delete(path, recursive: true);
                }
                catch (Exception)
                {
                    /* Best-effort cleanup; do not fail session removal */
                }
            }
            return Task.CompletedTask;
        }
    }
}
