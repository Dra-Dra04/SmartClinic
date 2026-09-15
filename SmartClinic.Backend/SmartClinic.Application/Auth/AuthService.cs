using System.ComponentModel.DataAnnotations;
using SmartClinic.Application.Abstractions;
using SmartClinic.Domain.Constants;
using SmartClinic.Domain.Entities;

namespace SmartClinic.Application.Auth;

// This use case depends on contracts only: no EF Core, HTTP or JWT implementation.
public sealed class AuthService(IUserRepository users, IUnitOfWork unitOfWork,
    IPasswordService passwords, ITokenService tokens) : IAuthService
{
    public async Task<AuthResult<RegisterResponse>> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var email = NormalizeEmail(request.Email);
        var phoneNumber = request.PhoneNumber?.Trim() ?? "";
        if (!IsValidPhoneNumber(phoneNumber))
            return AuthResult<RegisterResponse>.Failure(AuthError.Validation,
                "Số điện thoại phải gồm 9–15 chữ số, có thể có dấu + ở đầu.");
        if (!IsValidEmail(email))
            return AuthResult<RegisterResponse>.Failure(AuthError.Validation, "Email không hợp lệ hoặc dài quá 255 ký tự.");
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 10 || request.Password.Length > 128)
            return AuthResult<RegisterResponse>.Failure(AuthError.Validation, "Mật khẩu phải có từ 10 đến 128 ký tự.");
        if (request.Password != request.ConfirmPassword)
            return AuthResult<RegisterResponse>.Failure(AuthError.Validation, "Mật khẩu xác nhận không khớp.");
        if (await users.FindByEmailAsync(email, ct) is not null)
            return AuthResult<RegisterResponse>.Failure(AuthError.EmailAlreadyExists, "Email đã được sử dụng.");

        var user = new User
        {
            Id = Guid.NewGuid(), Email = email,
            PhoneNumber = phoneNumber, Role = UserRole.Patient
        };
        user.PasswordHash = passwords.Hash(user, request.Password);
        user.PatientProfile = new PatientProfile { UserId = user.Id, User = user };
        users.Add(user);
        try
        {
            // One SaveChanges commits the user and its patient profile together.
            await unitOfWork.SaveChangesAsync(ct);
        }
        catch (DuplicateEmailException)
        {
            return AuthResult<RegisterResponse>.Failure(AuthError.EmailAlreadyExists, "Email đã được sử dụng.");
        }
        return AuthResult<RegisterResponse>.Success(new(user.Id, user.Email, user.Role));
    }

    public async Task<AuthResult<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        const string message = "Email hoặc mật khẩu không đúng.";
        var email = NormalizeEmail(request.Email);
        if (!IsValidEmail(email) || string.IsNullOrEmpty(request.Password) || request.Password.Length > 128)
            return AuthResult<LoginResponse>.Failure(AuthError.InvalidCredentials, message);
        var user = await users.FindByEmailAsync(email, ct);
        // The adapter also verifies a dummy hash for a missing user.
        var check = passwords.Verify(user, request.Password);
        if (user is null || check == PasswordCheckResult.Failed ||
            user.Role is not (UserRole.Patient or UserRole.Doctor or UserRole.Admin))
            return AuthResult<LoginResponse>.Failure(AuthError.InvalidCredentials, message);
        if (check == PasswordCheckResult.SuccessRehashNeeded)
        {
            user.PasswordHash = passwords.Hash(user, request.Password);
            await unitOfWork.SaveChangesAsync(ct);
        }
        var token = tokens.CreateAccessToken(user);
        return AuthResult<LoginResponse>.Success(new(user.Id, user.Email, user.Role, token.Value, token.ExpiresAtUtc));
    }

    public async Task<AuthResult<CurrentUserResponse>> GetCurrentUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await users.FindByIdAsync(userId, ct);
        return user is null
            ? AuthResult<CurrentUserResponse>.Failure(AuthError.UserNotFound, "Tài khoản không còn tồn tại.")
            : AuthResult<CurrentUserResponse>.Success(new(user.Id, user.Email, user.Role));
    }

    private static string NormalizeEmail(string? email) => (email ?? "").Trim().ToLowerInvariant();
    private static bool IsValidPhoneNumber(string phoneNumber)
    {
        var digits = phoneNumber.StartsWith('+') ? phoneNumber.AsSpan(1) : phoneNumber.AsSpan();
        if (digits.Length is < 9 or > 15) return false;
        foreach (var digit in digits)
            if (digit is < '0' or > '9') return false;
        return true;
    }
    private static bool IsValidEmail(string email) =>
        email.Length is > 0 and <= 255 && new EmailAddressAttribute().IsValid(email);
}
