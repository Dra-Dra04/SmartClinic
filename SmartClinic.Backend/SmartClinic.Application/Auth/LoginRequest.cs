namespace SmartClinic.Application.Auth;
public sealed record LoginRequest(string Email, string Password);
public sealed record LoginResponse(Guid UserId, string Email, string Role, string AccessToken, DateTime AccessTokenExpiresAtUtc);
public sealed record CurrentUserResponse(Guid UserId, string Email, string Role);