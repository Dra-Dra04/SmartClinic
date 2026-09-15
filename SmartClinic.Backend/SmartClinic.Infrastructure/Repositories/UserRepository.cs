using Microsoft.EntityFrameworkCore;
using SmartClinic.Application.Abstractions;
using SmartClinic.Domain.Entities;
using SmartClinic.Infrastructure.Data;
namespace SmartClinic.Infrastructure.Repositories;

public sealed class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _dbContext;
    public UserRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return _dbContext.Users.SingleOrDefaultAsync(
            user => user.Email == email,
            cancellationToken);
    }

    public Task<User?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _dbContext.Users.SingleOrDefaultAsync(
            user => user.Id == id,
            cancellationToken);
    }

    public void Add(User user)
    {
        _dbContext.Users.Add(user);
    }
}
