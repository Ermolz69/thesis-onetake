using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Claims;
using System.Threading;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Posts;
using OneTake.Application.DTOs.Uploads;
using OneTake.Application.Services;
using OneTake.Domain.Enums;
using OneTake.GrpcContracts.Analytics.V1;
using OneTake.WebApi.Extensions;

namespace OneTake.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UploadsController : ControllerBase
    {
        private const int ChunkSizeBytes = 5 * 1024 * 1024;
        private readonly IUploadSessionStore _uploadStore;
        private readonly IPostService _postService;
        private readonly IVideoProcessor _videoProcessor;
        private readonly IAnalyticsIngestClient _analyticsIngest;
        private readonly ICurrentRequestContext _requestContext;

        public UploadsController(
            IUploadSessionStore uploadStore,
            IPostService postService,
            IVideoProcessor videoProcessor,
            IAnalyticsIngestClient analyticsIngest,
            ICurrentRequestContext requestContext)
        {
            _uploadStore = uploadStore;
            _postService = postService;
            _videoProcessor = videoProcessor;
            _analyticsIngest = analyticsIngest;
            _requestContext = requestContext;
        }

        [HttpPost("init")]
        public async Task<IActionResult> Init([FromBody] InitUploadRequest request, CancellationToken cancellationToken = default)
        {
            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            string uploadId = Guid.NewGuid().ToString("N");
            UploadSessionMeta meta = new UploadSessionMeta
            {
                UploadId = uploadId,
                UserId = userId,
                FileName = request.FileName,
                ContentType = request.ContentType,
                TotalSize = request.TotalSize,
                ContentText = request.ContentText,
                Tags = request.Tags,
                CreatedAt = DateTime.UtcNow
            };
            await _uploadStore.CreateSessionAsync(meta, cancellationToken);
            return Ok(new InitUploadResponse(uploadId, ChunkSizeBytes));
        }

        [HttpPut("{uploadId}/parts/{partIndex}")]
        [Consumes("application/octet-stream")]
        public async Task<IActionResult> UploadPart(string uploadId, int partIndex, CancellationToken cancellationToken = default)
        {
            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            UploadSessionMeta? meta = await _uploadStore.GetSessionAsync(uploadId, cancellationToken);
            if (meta == null)
            {
                return NotFound();
            }

            if (meta.UserId != userId)
            {
                return Forbid();
            }

            int totalParts = (int)((meta.TotalSize + ChunkSizeBytes - 1) / ChunkSizeBytes);
            if (partIndex < 0 || partIndex >= totalParts)
            {
                return BadRequest();
            }
            await _uploadStore.SavePartAsync(uploadId, partIndex, Request.Body, cancellationToken);
            return NoContent();
        }

        [HttpGet("{uploadId}/status")]
        public async Task<IActionResult> Status(string uploadId, CancellationToken cancellationToken = default)
        {
            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            UploadSessionMeta? meta = await _uploadStore.GetSessionAsync(uploadId, cancellationToken);
            if (meta == null)
            {
                return NotFound();
            }

            if (meta.UserId != userId)
            {
                return Forbid();
            }

            IReadOnlyList<int> indices = await _uploadStore.GetUploadedPartIndicesAsync(uploadId, cancellationToken);
            int totalParts = (int)((meta.TotalSize + ChunkSizeBytes - 1) / ChunkSizeBytes);
            return Ok(new UploadStatusResponse(uploadId, totalParts, indices));
        }

        [HttpPost("{uploadId}/finalize")]
        public async Task<IActionResult> Finalize(string uploadId, [FromBody] FinalizeUploadRequest? request, CancellationToken cancellationToken = default)
        {
            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            UploadSessionMeta? meta = await _uploadStore.GetSessionAsync(uploadId, cancellationToken);
            if (meta == null)
            {
                return NotFound();
            }

            if (meta.UserId != userId)
            {
                return Forbid();
            }

            Stream? mergedStream = null;
            IProcessedMediaResult? processed = null;
            try
            {
                mergedStream = await _uploadStore.GetMergedStreamAsync(uploadId, cancellationToken);
                processed = await _videoProcessor.ProcessAsync(
                    mergedStream,
                    meta.FileName,
                    meta.ContentType,
                    request?.TrimStartMs,
                    request?.TrimEndMs,
                    cancellationToken);
                mergedStream.Dispose();
                mergedStream = null;

                string contentText = request?.ContentText ?? meta.ContentText ?? string.Empty;
                List<string> tags = request?.Tags ?? meta.Tags ?? new List<string>();
                Visibility visibility = request?.Visibility ?? meta.Visibility ?? Visibility.Public;
                CreatePostRequest createRequest = new CreatePostRequest(contentText, tags, visibility);
                Result<PostDto> result = await _postService.CreatePostAsync(userId, createRequest, processed.Stream, processed.FileName, processed.ContentType, cancellationToken);
                await _uploadStore.DeleteSessionAsync(uploadId, cancellationToken);

                if (result.IsSuccess)
                {
                    TrackEventRequest trackRequest = new TrackEventRequest
                    {
                        EventId = Guid.NewGuid().ToString(),
                        Ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                        UserId = userId.ToString(),
                        SessionId = _requestContext.GetSessionId(),
                        EventName = "publish_success",
                        Route = Request.Path,
                        EntityType = "post",
                        EntityId = result.Value!.Id.ToString(),
                        PropsJson = System.Text.Json.JsonSerializer.Serialize(new { post_id = result.Value.Id }),
                        TraceId = _requestContext.GetTraceId()
                    };
                    _ = Task.Run(async () => { try { await _analyticsIngest.TrackEventAsync(trackRequest); } catch { } });
                }

                return result.Match(
                    success => Ok(success),
                    error => error.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method));
            }
            catch (Exception)
            {
                TrackEventRequest trackRequest = new TrackEventRequest
                {
                    EventId = Guid.NewGuid().ToString(),
                    Ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    UserId = userId.ToString(),
                    SessionId = _requestContext.GetSessionId(),
                    EventName = "upload_failed",
                    Route = Request.Path,
                    EntityType = string.Empty,
                    EntityId = string.Empty,
                    PropsJson = System.Text.Json.JsonSerializer.Serialize(new { upload_id = uploadId, reason = "finalize_error" }),
                    TraceId = _requestContext.GetTraceId()
                };
                _ = Task.Run(async () => { try { await _analyticsIngest.TrackEventAsync(trackRequest); } catch { } });
                throw;
            }
            finally
            {
                mergedStream?.Dispose();
                processed?.Dispose();
            }
        }
    }
}
