using System;
using System.Collections.Generic;
using OneTake.Application.Common.Interfaces;

namespace OneTake.Infrastructure.Video;

internal sealed class ProcessedMediaResult : IProcessedMediaResult
{
    private readonly List<string> _tempPaths = new();
    private bool _disposed;

    public Stream Stream { get; }
    public string FileName { get; }
    public string ContentType { get; }

    public ProcessedMediaResult(Stream stream, string fileName, string contentType, IEnumerable<string>? tempPathsToDelete = null)
    {
        Stream = stream;
        FileName = fileName;
        ContentType = contentType;
        if (tempPathsToDelete != null)
        {
            _tempPaths.AddRange(tempPathsToDelete);
        }
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        try
        {
            Stream?.Dispose();
        }
        finally
        {
            foreach (string path in _tempPaths)
            {
                try
                {
                    if (File.Exists(path))
                    {
                        File.Delete(path);
                    }
                }
                catch (Exception) { /* Best-effort cleanup; do not throw from Dispose */ }
            }
            _disposed = true;
        }
    }
}
