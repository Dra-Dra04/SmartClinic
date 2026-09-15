namespace SmartClinic.Application.Auth;
public interface IAuthService
{
    Task<AuthResult<RegisterResponse>> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<AuthResult<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<AuthResult<CurrentUserResponse>> GetCurrentUserAsync(Guid userId, CancellationToken ct = default);
}