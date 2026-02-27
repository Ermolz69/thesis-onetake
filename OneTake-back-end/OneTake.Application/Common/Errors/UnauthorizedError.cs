using Microsoft.AspNetCore.Mvc;

namespace OneTake.Application.Common.Errors
{
    public class UnauthorizedError : ApiError
    {
        public UnauthorizedError(string errorCode, string message)
            : base(errorCode, message, 401)
        {
        }

        public override IActionResult ToActionResult()
        {
            var problemDetails = ToProblemDetails(null, string.Empty, string.Empty);
            return new ObjectResult(problemDetails) { StatusCode = HttpStatusCode };
        }

        public override ProblemDetails ToProblemDetails(string? traceId, string requestPath, string method)
        {
            var problemDetails = new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc7235#section-3.1",
                Title = "Unauthorized",
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

