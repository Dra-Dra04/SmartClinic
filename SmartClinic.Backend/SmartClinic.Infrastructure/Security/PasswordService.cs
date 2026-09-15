using Microsoft.AspNetCore.Identity;
using SmartClinic.Application.Abstractions;
using SmartClinic.Domain.Entities;
namespace SmartClinic.Infrastructure.Security;
public sealed class PasswordService : IPasswordService
{
    private static readonly PasswordHasher<User> Hasher = new();
    private static readonly User DummyUser = new();
    private static readonly string DummyHash = Hasher.HashPassword(DummyUser, Guid.NewGuid().ToString());
    public string Hash(User user, string password) => Hasher.HashPassword(user, password);
    public PasswordCheckResult Verify(User? user, string password)
    {
        var hash = string.IsNullOrEmpty(user?.PasswordHash) ? DummyHash : user.PasswordHash;
        PasswordVerificationResult result;
        try { result = Hasher.VerifyHashedPassword(user ?? DummyUser, hash, password); }
        catch (FormatException) { return PasswordCheckResult.Failed; }
        if (user is null || string.IsNullOrEmpty(user.PasswordHash)) return PasswordCheckResult.Failed;
        return result switch
        {
            PasswordVerificationResult.Success => PasswordCheckResult.Success,
            PasswordVerificationResult.SuccessRehashNeeded => PasswordCheckResult.SuccessRehashNeeded,
            _ => PasswordCheckResult.Failed
        };
    }
}