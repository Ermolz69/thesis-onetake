using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Comments;
using OneTake.Application.Services;
using OneTake.GrpcContracts.Analytics.V1;
using OneTake.WebApi.Extensions;

namespace OneTake.WebApi.Controllers
{
    [ApiController]
    [Route("api/posts/{postId}/comments")]
    public class CommentsController : ControllerBase
    {
        private readonly ICommentService _commentService;
        private readonly IAnalyticsIngestClient _analyticsIngest;
        private readonly ICurrentRequestContext _requestContext;

        public CommentsController(ICommentService commentService, IAnalyticsIngestClient analyticsIngest, ICurrentRequestContext requestContext)
        {
            _commentService = commentService;
            _analyticsIngest = analyticsIngest;
            _requestContext = requestContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetComments(Guid postId, CancellationToken cancellationToken = default)
        {
            Result<List<CommentDto>> result = await _commentService.GetCommentsByPostIdAsync(postId, cancellationToken);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddComment(Guid postId, CreateCommentRequest request, CancellationToken cancellationToken = default)
        {
            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            Result<CommentDto> result = await _commentService.CreateCommentAsync(postId, userId, request, cancellationToken);
            if (result.IsSuccess)
            {
                TrackEventRequest req = new TrackEventRequest
                {
                    EventId = Guid.NewGuid().ToString(),
                    Ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    UserId = userId.ToString(),
                    SessionId = _requestContext.GetSessionId(),
                    EventName = "comment_create",
                    Route = Request.Path,
                    EntityType = "comment",
                    EntityId = result.Value!.Id.ToString(),
                    PropsJson = "{}",
                    TraceId = _requestContext.GetTraceId()
                };
                _ = Task.Run(async () => { try { await _analyticsIngest.TrackEventAsync(req); } catch { } });
            }
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [Authorize]
        [HttpDelete("{commentId}")]
        public async Task<IActionResult> DeleteComment(Guid postId, Guid commentId, CancellationToken cancellationToken = default)
        {
            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            string? role = User.FindFirstValue(ClaimTypes.Role);
            bool canDeleteAny = role == "Admin" || role == "Moderator";
            Result result = await _commentService.DeleteCommentAsync(postId, commentId, userId, canDeleteAny, cancellationToken);
            if (result.IsSuccess)
            {
                TrackEventRequest req = new TrackEventRequest
                {
                    EventId = Guid.NewGuid().ToString(),
                    Ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    UserId = userId.ToString(),
                    SessionId = _requestContext.GetSessionId(),
                    EventName = "comment_delete",
                    Route = Request.Path,
                    EntityType = "comment",
                    EntityId = commentId.ToString(),
                    PropsJson = "{}",
                    TraceId = _requestContext.GetTraceId()
                };
                _ = Task.Run(async () => { try { await _analyticsIngest.TrackEventAsync(req); } catch { } });
            }
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }
    }
}

