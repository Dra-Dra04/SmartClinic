using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SmartClinic.Application.Abstractions;
using SmartClinic.Application.Auth;
namespace SmartClinic.Infrastructure.Data;
public sealed class UnitOfWork(ApplicationDbContext dbContext) : IUnitOfWork
{
    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        try { return await dbContext.SaveChangesAsync(ct); }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqlException sql &&
            sql.Errors.Cast<SqlError>().Any(error =>
                (error.Number is 2601 or 2627) &&
                error.Message.Contains("UQ__Users__A9D10534AE710E00", StringComparison.Ordinal)))
        {
            throw new DuplicateEmailException(exception);
        }
    }
}