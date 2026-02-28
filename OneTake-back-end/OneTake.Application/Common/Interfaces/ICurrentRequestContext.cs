namespace OneTake.Application.Common.Interfaces;

/// <summary>
/// Provides current request-scoped values (session id, trace id) for analytics and tracing.
/// Implemented in WebApi using HttpContext; allows Application layer to get session/trace without depending on HTTP.
/// </summary>
public interface ICurrentRequestContext
{
    string GetSessionId();
    string GetTraceId();
}
