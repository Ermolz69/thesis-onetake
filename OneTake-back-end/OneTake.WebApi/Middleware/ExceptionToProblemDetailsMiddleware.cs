using System.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using OneTake.Application.Common.Exceptions;

namespace OneTake.WebApi.Middleware
{
    public class ExceptionToProblemDetailsMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionToProblemDetailsMiddleware> _logger;

        public ExceptionToProblemDetailsMiddleware(RequestDelegate next, ILogger<ExceptionToProblemDetailsMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var traceId = Activity.Current?.Id ?? context.TraceIdentifier ?? Guid.NewGuid().ToString();
            var requestPath = context.Request.Path;
            var method = context.Request.Method;

            ProblemDetails problemDetails;
            int statusCode;

            switch (exception)
            {
                case ApiException apiException:
                    problemDetails = CreateProblemDetails(
                        apiException.ErrorCode,
                        apiException.Message,
                        apiException.HttpStatusCode,
                        traceId,
                        requestPath,
                        method
                    );
                    statusCode = apiException.HttpStatusCode;
                    _logger.LogError(
                        exception,
                        "ApiException occurred: {ErrorCode} | TraceId: {TraceId} | Path: {Path} | Method: {Method}",
                        apiException.ErrorCode,
                        traceId,
                        requestPath,
                        method
                    );
                    break;

                default:
                    problemDetails = CreateProblemDetails(
                        "INTERNAL_SERVER_ERROR",
                        "An unexpected error occurred",
                        500,
                        traceId,
                        requestPath,
                        method
                    );
                    statusCode = 500;
                    _logger.LogError(
                        exception,
                        "Unexpected exception occurred | TraceId: {TraceId} | Path: {Path} | Method: {Method}",
                        traceId,
                        requestPath,
                        method
                    );
                    break;
            }

            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/problem+json";

            await context.Response.WriteAsJsonAsync(problemDetails);
        }

        private static ProblemDetails CreateProblemDetails(
            string errorCode,
            string message,
            int statusCode,
            string traceId,
            string requestPath,
            string method)
        {
            var problemDetails = new ProblemDetails
            {
                Type = statusCode switch
                {
                    400 => "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                    401 => "https://tools.ietf.org/html/rfc7235#section-3.1",
                    403 => "https://tools.ietf.org/html/rfc7231#section-6.5.3",
                    404 => "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                    409 => "https://tools.ietf.org/html/rfc7231#section-6.5.8",
                    500 => "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                    _ => "https://tools.ietf.org/html/rfc7231#section-6.6.1"
                },
                Title = statusCode switch
                {
                    400 => "Bad Request",
                    401 => "Unauthorized",
                    403 => "Forbidden",
                    404 => "Not Found",
                    409 => "Conflict",
                    500 => "Internal Server Error",
                    _ => "Error"
                },
                Status = statusCode,
                Detail = message
            };

            problemDetails.Extensions["errorCode"] = errorCode;
            problemDetails.Extensions["traceId"] = traceId;
            problemDetails.Extensions["requestPath"] = requestPath;
            problemDetails.Extensions["method"] = method;

            return problemDetails;
        }
    }
}

