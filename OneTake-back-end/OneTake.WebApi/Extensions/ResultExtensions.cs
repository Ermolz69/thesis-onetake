using Microsoft.AspNetCore.Mvc;
using OneTake.Application.Common.Errors;
using OneTake.Application.Common.Results;

namespace OneTake.WebApi.Extensions
{
    public static class ResultExtensions
    {
        public static IActionResult ToActionResult<T>(this Result<T> result, string? traceId = null, string requestPath = "", string method = "")
        {
            return result.Match(
                success => new OkObjectResult(success),
                error => error.ToActionResult(traceId, requestPath, method)
            );
        }

        public static IActionResult ToActionResult(this Result result, string? traceId = null, string requestPath = "", string method = "")
        {
            return result.Match(
                () => new NoContentResult(),
                error => error.ToActionResult(traceId, requestPath, method)
            );
        }

        public static IActionResult ToActionResult(this ApiError error, string? traceId = null, string requestPath = "", string method = "")
        {
            ProblemDetails problemDetails = error.ToProblemDetails(traceId, requestPath, method);
            return new ObjectResult(problemDetails) { StatusCode = error.HttpStatusCode };
        }
    }
}

