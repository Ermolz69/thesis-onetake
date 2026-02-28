using Microsoft.AspNetCore.Http;
using OneTake.Application.Common.Interfaces;
using OneTake.WebApi.Middleware;

namespace OneTake.WebApi.Services;

public class CurrentRequestContext : ICurrentRequestContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentRequestContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string GetSessionId()
    {
        HttpContext? context = _httpContextAccessor.HttpContext;
        if (context?.Items[SessionIdMiddleware.SessionIdItemKey] is string sessionId)
        {
            return sessionId;
        }
        return Guid.NewGuid().ToString("N");
    }

    public string GetTraceId()
    {
        HttpContext? context = _httpContextAccessor.HttpContext;
        return context?.TraceIdentifier ?? System.Diagnostics.Activity.Current?.Id ?? string.Empty;
    }
}
