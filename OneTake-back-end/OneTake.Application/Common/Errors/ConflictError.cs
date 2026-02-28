using Microsoft.AspNetCore.Mvc;

namespace OneTake.Application.Common.Errors
{
    public class ConflictError : ApiError
    {
        public ConflictError(string errorCode, string message)
            : base(errorCode, message, 409)
        {
        }

        public override IActionResult ToActionResult()
        {
            ProblemDetails problemDetails = ToProblemDetails(null, string.Empty, string.Empty);
            return new ObjectResult(problemDetails) { StatusCode = HttpStatusCode };
        }

        public override ProblemDetails ToProblemDetails(string? traceId, string requestPath, string method)
        {
            ProblemDetails problemDetails = new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.8",
                Title = "Conflict",
                Status = HttpStatusCode,
                Detail = Message
            };

            problemDetails.Extensions["errorCode"] = ErrorCode;
            if (!string.IsNullOrEmpty(traceId))
                problemDetails.Extensions["traceId"] = traceId;
            if (!string.IsNullOrEmpty(requestPath))
                problemDetails.Extensions["requestPath"] = requestPath;
            if (!string.IsNullOrEmpty(method))
                problemDetails.Extensions["method"] = method;

            return problemDetails;
        }
    }
}

