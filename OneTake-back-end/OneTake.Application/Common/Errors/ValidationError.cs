using Microsoft.AspNetCore.Mvc;

namespace OneTake.Application.Common.Errors
{
    public class ValidationError : ApiError
    {
        public Dictionary<string, string[]> Errors { get; }

        public ValidationError(string errorCode, string message, Dictionary<string, string[]> errors)
            : base(errorCode, message, 400)
        {
            Errors = errors;
        }

        public ValidationError(string errorCode, string message)
            : base(errorCode, message, 400)
        {
            Errors = new Dictionary<string, string[]>();
        }

        public override IActionResult ToActionResult()
        {
            ProblemDetails problemDetails = ToProblemDetails(null, string.Empty, string.Empty);
            return new BadRequestObjectResult(problemDetails);
        }

        public override ProblemDetails ToProblemDetails(string? traceId, string requestPath, string method)
        {
            ValidationProblemDetails problemDetails = new ValidationProblemDetails(Errors)
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                Title = "Validation Error",
                Status = HttpStatusCode,
                Detail = Message
            };

            problemDetails.Extensions["errorCode"] = ErrorCode;
            if (!string.IsNullOrEmpty(traceId))
            {
                problemDetails.Extensions["traceId"] = traceId;
            }

            if (!string.IsNullOrEmpty(requestPath))
            {
                problemDetails.Extensions["requestPath"] = requestPath;
            }

            if (!string.IsNullOrEmpty(method))
            {
                problemDetails.Extensions["method"] = method;
            }

            return problemDetails;
        }
    }
}

