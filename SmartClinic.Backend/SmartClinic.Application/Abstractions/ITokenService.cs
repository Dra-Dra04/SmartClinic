using SmartClinic.Domain.Entities;
namespace SmartClinic.Application.Abstractions;
public sealed record AccessToken(string Value, DateTime ExpiresAtUtc);
public interface ITokenService
{
    AccessToken CreateAccessToken(User user);
}