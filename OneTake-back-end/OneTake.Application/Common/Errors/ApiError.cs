using Microsoft.AspNetCore.Mvc;

namespace OneTake.Application.Common.Errors
{
    public abstract class ApiError
    {
        public string ErrorCode { get; }
        public string Message { get; }
        public int HttpStatusCode { get; }

        protected ApiError(string errorCode, string message, int httpStatusCode)
        {
            ErrorCode = errorCode;
            Message = message;
            HttpStatusCode = httpStatusCode;
        }

        public abstract IActionResult ToActionResult();
        public abstract ProblemDetails ToProblemDetails(string? traceId, string requestPath, string method);
    }
}

