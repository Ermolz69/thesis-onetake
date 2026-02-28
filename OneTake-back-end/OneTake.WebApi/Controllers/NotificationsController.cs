using System.Security.Claims;
using System.Threading;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Notifications;
using OneTake.Application.Services;
using OneTake.GrpcContracts.Analytics.V1;
using OneTake.WebApi.Extensions;

namespace OneTake.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly IAnalyticsIngestClient _analyticsIngest;
        private readonly ICurrentRequestContext _requestContext;

        public NotificationsController(INotificationService notificationService, IAnalyticsIngestClient analyticsIngest, ICurrentRequestContext requestContext)
        {
            _notificationService = notificationService;
            _analyticsIngest = analyticsIngest;
            _requestContext = requestContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] string? cursor, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
        {
            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            Result<PagedNotificationsResponse> result = await _notificationService.GetPagedAsync(userId, cursor, pageSize, cancellationToken);
            if (result.IsSuccess && result.Value != null)
            {
                TrackEventRequest req = new TrackEventRequest
                {
                    EventId = Guid.NewGuid().ToString(),
                    Ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    UserId = userId.ToString(),
                    SessionId = _requestContext.GetSessionId(),
                    EventName = "notification_view",
                    Route = Request.Path,
                    EntityType = string.Empty,
                    EntityId = string.Empty,
                    PropsJson = "{}",
                    TraceId = _requestContext.GetTraceId()
                };
                _ = Task.Run(async () => { try { await _analyticsIngest.TrackEventAsync(req); } catch { } });
            }
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken = default)
        {
            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            Result<int> result = await _notificationService.GetUnreadCountAsync(userId, cancellationToken);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken cancellationToken = default)
        {
            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            Result result = await _notificationService.MarkAsReadAsync(id, userId, cancellationToken);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken = default)
        {
            Guid userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            Result result = await _notificationService.MarkAllAsReadAsync(userId, cancellationToken);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }
    }
}
