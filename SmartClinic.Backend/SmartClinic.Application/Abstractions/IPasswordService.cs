using SmartClinic.Domain.Entities;
namespace SmartClinic.Application.Abstractions;
public enum PasswordCheckResult { Failed, Success, SuccessRehashNeeded }
public interface IPasswordService
{
    string Hash(User user, string password);
    PasswordCheckResult Verify(User? user, string password);
}