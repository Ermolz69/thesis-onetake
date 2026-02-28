using System.Diagnostics;
using System.IO;
using Microsoft.Extensions.Logging;
using OneTake.Application.Common.Interfaces;

namespace OneTake.Infrastructure.Video;

/// <summary>
/// Applies trim (and optional transcode to MP4) via ffmpeg when available.
/// Server must have ffmpeg on PATH for trim/transcode; otherwise returns source unchanged.
/// </summary>
public sealed class FfmpegVideoProcessor : IVideoProcessor
{
    private readonly ILogger<FfmpegVideoProcessor> _logger;

    public FfmpegVideoProcessor(ILogger<FfmpegVideoProcessor> logger)
    {
        _logger = logger;
    }

    public async Task<IProcessedMediaResult> ProcessAsync(
        Stream source,
        string sourceFileName,
        string sourceContentType,
        int? trimStartMs,
        int? trimEndMs,
        CancellationToken cancellationToken = default)
    {
        string tempIn = Path.Combine(Path.GetTempPath(), $"upload_{Guid.NewGuid():N}{Path.GetExtension(sourceFileName) ?? ".bin"}");
        await using (FileStream fs = File.Create(tempIn))
        {
            await source.CopyToAsync(fs, cancellationToken);
        }

        bool applyTrim = trimStartMs.HasValue && trimEndMs.HasValue
            && trimStartMs.Value >= 0 && trimEndMs.Value > trimStartMs.Value;

        if (!applyTrim)
        {
            return new ProcessedMediaResult(File.OpenRead(tempIn), sourceFileName, sourceContentType, new[] { tempIn });
        }

        string tempOut = Path.Combine(Path.GetTempPath(), $"upload_trimmed_{Guid.NewGuid():N}.mp4");
        try
        {
            double startSec = trimStartMs!.Value / 1000.0;
            double endSec = trimEndMs!.Value / 1000.0;
            ProcessStartInfo psi = new ProcessStartInfo
            {
                FileName = "ffmpeg",
                ArgumentList = { "-y", "-i", tempIn, "-ss", startSec.ToString("F3", System.Globalization.CultureInfo.InvariantCulture), "-to", endSec.ToString("F3", System.Globalization.CultureInfo.InvariantCulture), "-c:v", "libx264", "-c:a", "aac", tempOut },
                RedirectStandardError = true,
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            using Process? process = Process.Start(psi);
            if (process == null)
            {
                _logger.LogWarning("ffmpeg process could not be started; using untrimmed file");
                return new ProcessedMediaResult(File.OpenRead(tempIn), sourceFileName, sourceContentType, new[] { tempIn });
            }
            await process.WaitForExitAsync(cancellationToken);
            if (process.ExitCode != 0 || !File.Exists(tempOut))
            {
                string err = await process.StandardError.ReadToEndAsync(cancellationToken);
                _logger.LogWarning("ffmpeg failed (exit {ExitCode}): {Error}; using untrimmed file", process.ExitCode, err);
                return new ProcessedMediaResult(File.OpenRead(tempIn), sourceFileName, sourceContentType, new[] { tempIn });
            }
            return new ProcessedMediaResult(File.OpenRead(tempOut), "video.mp4", "video/mp4", new[] { tempIn, tempOut });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ffmpeg trim failed; using untrimmed file");
            if (File.Exists(tempOut))
            {
                try
                {
                    File.Delete(tempOut);
                }
                catch
                {
                    /* best-effort */
                }
            }
            return new ProcessedMediaResult(File.OpenRead(tempIn), sourceFileName, sourceContentType, new[] { tempIn });
        }
    }
}
