using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneTake.Application.Common.Interfaces;
using OneTake.GrpcContracts.Analytics.V1;

namespace OneTake.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsIngestClient _analyticsIngest;
        private readonly ICurrentRequestContext _requestContext;
        private readonly ILogger<AnalyticsController> _logger;

        public AnalyticsController(
            IAnalyticsIngestClient analyticsIngest,
            ICurrentRequestContext requestContext,
            ILogger<AnalyticsController> logger)
        {
            _analyticsIngest = analyticsIngest;
            _requestContext = requestContext;
            _logger = logger;
        }

        [HttpPost("events")]
        [Authorize]
        public IActionResult TrackEvent([FromBody] TrackEventBody body)
        {
            string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

            TrackEventRequest request = new TrackEventRequest
            {
                EventId = Guid.NewGuid().ToString(),
                Ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                UserId = userId,
                SessionId = _requestContext.GetSessionId(),
                EventName = body.EventName ?? string.Empty,
                Route = Request.Path,
                EntityType = body.EntityType ?? string.Empty,
                EntityId = body.EntityId ?? string.Empty,
                PropsJson = body.PropsJson ?? "{}",
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

            return Accepted();
        }
    }

    public class TrackEventBody
    {
        public string? EventName { get; set; }
        public string? PropsJson { get; set; }
        public string? EntityType { get; set; }
        public string? EntityId { get; set; }
    }
}
