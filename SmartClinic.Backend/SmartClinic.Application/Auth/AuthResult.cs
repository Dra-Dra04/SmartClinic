namespace SmartClinic.Application.Auth;
public enum AuthError { Validation, EmailAlreadyExists, InvalidCredentials, UserNotFound }
public sealed record AuthResult<T>(T? Value, AuthError? Error, string? Message)
{
    public bool IsSuccess => Error is null;
    public static AuthResult<T> Success(T value) => new(value, null, null);
    public static AuthResult<T> Failure(AuthError error, string message) => new(default, error, message);
}
public sealed class DuplicateEmailException(Exception innerException)
    : Exception("Email already exists.", innerException);