using System.Diagnostics;
using System.Security.Claims;
using System.Threading;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneTake.Application.Common.Errors;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Posts;
using OneTake.Application.Services;
using OneTake.Domain.Enums;
using OneTake.GrpcContracts.Analytics.V1;
using OneTake.GrpcContracts.Reco.V1;
using OneTake.WebApi.Extensions;

namespace OneTake.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostsController : ControllerBase
    {
        private readonly IPostService _postService;
        private readonly IAnalyticsIngestClient _analyticsIngest;
        private readonly IRecommendationsClient _recommendationsClient;
        private readonly IFollowService _followService;
        private readonly ICurrentRequestContext _requestContext;
        private readonly ILogger<PostsController> _logger;

        public PostsController(
            IPostService postService,
            IAnalyticsIngestClient analyticsIngest,
            IRecommendationsClient recommendationsClient,
            IFollowService followService,
            ICurrentRequestContext requestContext,
            ILogger<PostsController> logger)
        {
            _postService = postService;
            _analyticsIngest = analyticsIngest;
            _recommendationsClient = recommendationsClient;
            _followService = followService;
            _requestContext = requestContext;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetPosts([FromQuery] string? tag, [FromQuery] Guid? authorId, [FromQuery] string? cursor, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
        {
            Result<PagedPostResponse> result = await _postService.GetPostsAsync(tag, authorId, cursor, pageSize, cancellationToken);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] string? cursor, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return Ok(new PagedPostResponse(new List<PostDto>(), null, false));
            }

            Result<PagedPostResponse> result = await _postService.SearchPostsAsync(q.Trim(), cursor, pageSize, cancellationToken);
            if (result.IsSuccess)
            {
                string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
                TrackEventRequest req = new TrackEventRequest
                {
                    EventId = Guid.NewGuid().ToString(),
                    Ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    UserId = userId,
                    SessionId = _requestContext.GetSessionId(),
                    EventName = "search_query",
                    Route = Request.Path,
                    EntityType = string.Empty,
                    EntityId = string.Empty,
                    PropsJson = System.Text.Json.JsonSerializer.Serialize(new { query_length = q!.Trim().Length }),
                    TraceId = _requestContext.GetTraceId()
                };
                _ = Task.Run(async () => { try { await _analyticsIngest.TrackEventAsync(req); } catch { } });
            }
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPost(Guid id, CancellationToken cancellationToken = default)
        {
            Result<PostDto> result = await _postService.GetPostByIdAsync(id, cancellationToken);
            if (result.IsSuccess)
            {
                string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                TrackEventRequest request = new TrackEventRequest
                {
                    EventId = Guid.NewGuid().ToString(),
                    Ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    UserId = userId ?? string.Empty,
                    SessionId = _requestContext.GetSessionId(),
                    EventName = "post_view",
                    Route = Request.Path,
                    EntityType = "post",
                    EntityId = id.ToString(),
                    PropsJson = "{}",
                    TraceId = _requestContext.GetTraceId()
                };
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _analyticsIngest.TrackEventAsync(request);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Analytics track event failed (fire-and-forget)");
                    }
                });
            }
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreatePost([FromForm] CreatePostRequest request, IFormFile file, CancellationToken cancellationToken = default)
        {
            if (file == null || file.Length == 0)
            {
                ValidationError error = new ValidationError("FILE_REQUIRED", "File is required");
                return error.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
            }

            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            using Stream stream = file.OpenReadStream();
            Result<PostDto> result = await _postService.CreatePostAsync(userId, request, stream, file.FileName, file.ContentType, cancellationToken);

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
            else
            {
                TrackEventRequest trackRequest = new TrackEventRequest
                {
                    EventId = Guid.NewGuid().ToString(),
                    Ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    UserId = userId.ToString(),
                    SessionId = _requestContext.GetSessionId(),
                    EventName = "publish_failed",
                    Route = Request.Path,
                    EntityType = "post",
                    EntityId = string.Empty,
                    PropsJson = "{}",
                    TraceId = _requestContext.GetTraceId()
                };
                _ = Task.Run(async () => { try { await _analyticsIngest.TrackEventAsync(trackRequest); } catch { } });
            }

            return result.Match(
                success => CreatedAtAction(nameof(GetPost), new { id = success.Id }, success),
                error => error.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method)
            );
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePost(Guid id, CancellationToken cancellationToken = default)
        {
            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            string? role = User.FindFirstValue("role");
            bool canDelete = role == "Admin" || role == "Moderator";

            Result result = await _postService.DeletePostAsync(id, userId, canDelete, cancellationToken);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [Authorize]
        [HttpPost("{id}/like")]
        public async Task<IActionResult> LikePost(Guid id, CancellationToken cancellationToken = default)
        {
            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            Result result = await _postService.LikePostAsync(id, userId, cancellationToken);
            if (result.IsSuccess)
            {
                TrackEventRequest req = new TrackEventRequest
                {
                    EventId = Guid.NewGuid().ToString(),
                    Ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    UserId = userId.ToString(),
                    SessionId = _requestContext.GetSessionId(),
                    EventName = "post_like",
                    Route = Request.Path,
                    EntityType = "post",
                    EntityId = id.ToString(),
                    PropsJson = "{}",
                    TraceId = _requestContext.GetTraceId()
                };
                _ = Task.Run(async () => { try { await _analyticsIngest.TrackEventAsync(req); } catch { } });
            }
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [Authorize]
        [HttpDelete("{id}/like")]
        public async Task<IActionResult> UnlikePost(Guid id, CancellationToken cancellationToken = default)
        {
            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            Result result = await _postService.UnlikePostAsync(id, userId, cancellationToken);
            if (result.IsSuccess)
            {
                TrackEventRequest req = new TrackEventRequest
                {
                    EventId = Guid.NewGuid().ToString(),
                    Ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    UserId = userId.ToString(),
                    SessionId = _requestContext.GetSessionId(),
                    EventName = "post_unlike",
                    Route = Request.Path,
                    EntityType = "post",
                    EntityId = id.ToString(),
                    PropsJson = "{}",
                    TraceId = _requestContext.GetTraceId()
                };
                _ = Task.Run(async () => { try { await _analyticsIngest.TrackEventAsync(req); } catch { } });
            }
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [Authorize]
        [HttpGet("feed/following")]
        public async Task<IActionResult> GetFollowingFeed([FromQuery] string? cursor, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
        {
            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            Result<PagedPostResponse> result = await _followService.GetFollowingFeedAsync(userId, cursor, pageSize, cancellationToken);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [HttpGet("feed/recommended")]
        public async Task<IActionResult> GetRecommended([FromQuery] int limit = 10, CancellationToken cancellationToken = default)
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            GetRecommendationsRequest request = new GetRecommendationsRequest
            {
                UserId = userId,
                Limit = limit,
                FeedType = "HOME",
                TraceId = _requestContext.GetTraceId()
            };
            try
            {
                GetRecommendationsResponse response = await _recommendationsClient.GetRecommendationsAsync(request);
                List<Guid> postIds = response.Items.Select(i => Guid.TryParse(i.PostId, out Guid g) ? g : (Guid?)null).Where(g => g.HasValue).Select(g => g!.Value).ToList();
                List<PostDto> posts = new List<PostDto>();
                foreach (Guid postId in postIds)
                {
                    Result<PostDto> postResult = await _postService.GetPostByIdAsync(postId, cancellationToken);
                    if (postResult.IsSuccess && postResult.Value != null && postResult.Value.Visibility == Visibility.Public)
                    {
                        posts.Add(postResult.Value);
                    }
                }
                return Ok(posts);
            }
            catch (Exception)
            {
                return Ok(new List<PostDto>());
            }
        }
    }
}

