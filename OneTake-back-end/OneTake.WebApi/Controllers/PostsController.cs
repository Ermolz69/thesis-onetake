using System.Diagnostics;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneTake.Application.Common.Errors;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.DTOs.Posts;
using OneTake.Application.Services;
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

        public PostsController(
            IPostService postService,
            IAnalyticsIngestClient analyticsIngest,
            IRecommendationsClient recommendationsClient)
        {
            _postService = postService;
            _analyticsIngest = analyticsIngest;
            _recommendationsClient = recommendationsClient;
        }

        [HttpGet]
        public async Task<IActionResult> GetPosts([FromQuery] string? tag, [FromQuery] Guid? authorId, [FromQuery] string? cursor, [FromQuery] int pageSize = 10)
        {
            var result = await _postService.GetPostsAsync(tag, authorId, cursor, pageSize);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPost(Guid id)
        {
            var result = await _postService.GetPostByIdAsync(id);
            if (result.IsSuccess)
            {
                var traceId = Activity.Current?.Id ?? HttpContext.TraceIdentifier ?? string.Empty;
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var request = new TrackEventRequest
                {
                    EventId = Guid.NewGuid().ToString(),
                    Ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    UserId = userId ?? string.Empty,
                    SessionId = string.Empty,
                    EventName = "post_view",
                    Route = Request.Path,
                    EntityType = "post",
                    EntityId = id.ToString(),
                    PropsJson = "{}",
                    TraceId = traceId
                };
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _analyticsIngest.TrackEventAsync(request);
                    }
                    catch (Exception)
                    {
                        // Fire-and-forget: do not fail the request if analytics is down
                    }
                });
            }
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreatePost([FromForm] CreatePostRequest request, IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                var error = new ValidationError("FILE_REQUIRED", "File is required");
                return error.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
            }

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            using var stream = file.OpenReadStream();
            var result = await _postService.CreatePostAsync(userId, request, stream, file.FileName, file.ContentType);
            
            return result.Match(
                success => CreatedAtAction(nameof(GetPost), new { id = success.Id }, success),
                error => error.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method)
            );
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePost(Guid id)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var role = User.FindFirstValue("role");
            var canDelete = role == "Admin" || role == "Moderator";

            var result = await _postService.DeletePostAsync(id, userId, canDelete);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [Authorize]
        [HttpPost("{id}/like")]
        public async Task<IActionResult> LikePost(Guid id)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _postService.LikePostAsync(id, userId);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [Authorize]
        [HttpDelete("{id}/like")]
        public async Task<IActionResult> UnlikePost(Guid id)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _postService.UnlikePostAsync(id, userId);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [HttpGet("feed/recommended")]
        public async Task<IActionResult> GetRecommended([FromQuery] int limit = 10)
        {
            var traceId = Activity.Current?.Id ?? HttpContext.TraceIdentifier ?? string.Empty;
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            var request = new GetRecommendationsRequest
            {
                UserId = userId,
                Limit = limit,
                FeedType = "HOME",
                TraceId = traceId
            };
            try
            {
                var response = await _recommendationsClient.GetRecommendationsAsync(request);
                var postIds = response.Items.Select(i => Guid.TryParse(i.PostId, out var g) ? g : (Guid?)null).Where(g => g.HasValue).Select(g => g!.Value).ToList();
                var posts = new List<PostDto>();
                foreach (var postId in postIds)
                {
                    var postResult = await _postService.GetPostByIdAsync(postId);
                    if (postResult.IsSuccess && postResult.Value != null)
                        posts.Add(postResult.Value);
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

