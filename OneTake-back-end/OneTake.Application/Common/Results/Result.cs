using OneTake.Application.Common.Errors;

namespace OneTake.Application.Common.Results
{
    public class Result<T>
    {
        public bool IsSuccess { get; }
        public T? Value { get; }
        public ApiError? Error { get; }

        private Result(T value)
        {
            IsSuccess = true;
            Value = value;
            Error = null;
        }

        private Result(ApiError error)
        {
            IsSuccess = false;
            Value = default;
            Error = error;
        }

        public static Result<T> Success(T value) => new(value);
        public static Result<T> Fail(ApiError error) => new(error);

        public TResult Match<TResult>(Func<T, TResult> onSuccess, Func<ApiError, TResult> onError)
        {
            return IsSuccess ? onSuccess(Value!) : onError(Error!);
        }

        public static implicit operator Result<T>(T value) => Success(value);
        public static implicit operator Result<T>(ApiError error) => Fail(error);
    }

    public class Result
    {
        public bool IsSuccess { get; }
        public ApiError? Error { get; }

        private Result(bool isSuccess, ApiError? error)
        {
            IsSuccess = isSuccess;
            Error = error;
        }

        public static Result Success() => new(true, null);
        public static Result Fail(ApiError error) => new(false, error);

        public TResult Match<TResult>(Func<TResult> onSuccess, Func<ApiError, TResult> onError)
        {
            return IsSuccess ? onSuccess() : onError(Error!);
        }

        public static implicit operator Result(ApiError error) => Fail(error);
    }
}
