namespace OneTake.Application.Common.Exceptions
{
    public class ApiException : Exception
    {
        public string ErrorCode { get; }
        public int HttpStatusCode { get; }

        public ApiException(string errorCode, string message, int httpStatusCode = 500)
            : base(message)
        {
            ErrorCode = errorCode;
            HttpStatusCode = httpStatusCode;
        }

        public ApiException(string errorCode, string message, Exception innerException, int httpStatusCode = 500)
            : base(message, innerException)
        {
            ErrorCode = errorCode;
            HttpStatusCode = httpStatusCode;
        }
    }
}

