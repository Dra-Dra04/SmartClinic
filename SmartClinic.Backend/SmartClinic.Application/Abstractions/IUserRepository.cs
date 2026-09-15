using SmartClinic.Domain.Entities;
namespace SmartClinic.Application.Abstractions;
public interface IUserRepository
{
    Task<User?> FindByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> FindByIdAsync(Guid id, CancellationToken ct = default);
    void Add(User user);
}