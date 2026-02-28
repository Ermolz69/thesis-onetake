using System.Security.Claims;
using System.Threading;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Users;
using OneTake.Application.Services;
using OneTake.GrpcContracts.Analytics.V1;
using OneTake.WebApi.Extensions;

namespace OneTake.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IAnalyticsIngestClient _analyticsIngest;
        private readonly IFollowService _followService;
        private readonly ICurrentRequestContext _requestContext;

        public UsersController(IUserService userService, IAnalyticsIngestClient analyticsIngest, IFollowService followService, ICurrentRequestContext requestContext)
        {
            _userService = userService;
            _analyticsIngest = analyticsIngest;
            _followService = followService;
            _requestContext = requestContext;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProfile(Guid id, CancellationToken cancellationToken = default)
        {
            Guid? viewerId = null;
            string? viewerIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(viewerIdStr, out Guid v))
            {
                viewerId = v;
            }
            Result<ProfileDto> result = await _userService.GetProfileAsync(id, viewerId, cancellationToken);
            if (result.IsSuccess)
            {
                TrackEventRequest req = new TrackEventRequest
                {
                    EventId = Guid.NewGuid().ToString(),
                    Ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    UserId = viewerId?.ToString() ?? string.Empty,
                    SessionId = _requestContext.GetSessionId(),
                    EventName = "profile_view",
                    Route = Request.Path,
                    EntityType = "user",
                    EntityId = id.ToString(),
                    PropsJson = "{}",
                    TraceId = _requestContext.GetTraceId()
                };
                _ = Task.Run(async () => { try { await _analyticsIngest.TrackEventAsync(req); } catch { } });
            }
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [Authorize]
        [HttpPut("me/profile")]
        public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request, CancellationToken cancellationToken = default)
        {
            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            Result result = await _userService.UpdateProfileAsync(userId, request, cancellationToken);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [Authorize]
        [HttpPost("{id}/follow")]
        public async Task<IActionResult> Follow(Guid id, CancellationToken cancellationToken = default)
        {
            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            Result result = await _followService.FollowAsync(userId, id, cancellationToken);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [Authorize]
        [HttpDelete("{id}/follow")]
        public async Task<IActionResult> Unfollow(Guid id, CancellationToken cancellationToken = default)
        {
            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            Result result = await _followService.UnfollowAsync(userId, id, cancellationToken);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }
    }
}

