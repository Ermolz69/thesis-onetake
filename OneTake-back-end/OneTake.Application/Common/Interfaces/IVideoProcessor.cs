namespace OneTake.Application.Common.Interfaces;

/// <summary>
/// Result of processing upload media (e.g. trim/transcode). Caller must dispose to release stream and temp files.
/// </summary>
public interface IProcessedMediaResult : IDisposable
{
    Stream Stream { get; }
    string FileName { get; }
    string ContentType { get; }
}

/// <summary>
/// Optional video processing (trim, transcode). When ffmpeg is not available, returns source unchanged.
/// </summary>
public interface IVideoProcessor
{
    Task<IProcessedMediaResult> ProcessAsync(
        Stream source,
        string sourceFileName,
        string sourceContentType,
        int? trimStartMs,
        int? trimEndMs,
        CancellationToken cancellationToken = default);
}
