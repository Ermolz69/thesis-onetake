using System.Diagnostics;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace OneTake.Logging.Middleware
{
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;

        public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            Stopwatch stopwatch = Stopwatch.StartNew();
            string? traceId = Activity.Current?.Id ?? context.TraceIdentifier;

            context.Items["TraceId"] = traceId;
            context.Items["RequestStartTime"] = DateTime.UtcNow;

            string? userId = context.User?.FindFirstValue(ClaimTypes.NameIdentifier);

            using (_logger.BeginScope(new Dictionary<string, object>
            {
                ["TraceId"] = traceId,
                ["RequestPath"] = context.Request.Path,
                ["RequestMethod"] = context.Request.Method
            }))
            {
                try
                {
                    await _next(context);
                }
                finally
                {
                    stopwatch.Stop();
                    int statusCode = context.Response.StatusCode;
                    LogLevel logLevel = GetLogLevel(statusCode);

                    _logger.Log(
                        logLevel,
                        "Request completed: {Method} {Path} responded {StatusCode} in {ElapsedMs}ms | TraceId: {TraceId} | UserId: {UserId}",
                        context.Request.Method,
                        context.Request.Path,
                        statusCode,
                        stopwatch.ElapsedMilliseconds,
                        traceId,
                        userId ?? "Anonymous"
                    );
                }
            }
        }

        private static LogLevel GetLogLevel(int statusCode)
        {
            return statusCode switch
            {
                >= 500 => LogLevel.Error,
                >= 400 => LogLevel.Warning,
                _ => LogLevel.Information
            };
        }
    }
}

