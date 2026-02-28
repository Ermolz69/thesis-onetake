namespace OneTake.WebApi.Middleware;

public class SessionIdMiddleware
{
    public const string SessionIdItemKey = "SessionId";
    public const string SessionIdHeaderName = "X-Session-Id";
    private readonly RequestDelegate _next;

    public SessionIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        string? sessionId = context.Request.Headers[SessionIdHeaderName].FirstOrDefault()
            ?? context.Request.Cookies[SessionIdHeaderName];
        if (string.IsNullOrWhiteSpace(sessionId))
            sessionId = Guid.NewGuid().ToString("N");

        context.Items[SessionIdItemKey] = sessionId;
        context.Response.OnStarting(() =>
        {
            if (!context.Response.Headers.ContainsKey(SessionIdHeaderName))
                context.Response.Headers.Append(SessionIdHeaderName, sessionId);
            return Task.CompletedTask;
        });

        await _next(context);
    }
}
