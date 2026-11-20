using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartClinic.Application.Abstractions;
using SmartClinic.Application.Auth;
using SmartClinic.Domain.Constants;
using SmartClinic.Domain.Entities;
using SmartClinic.Infrastructure.Data;

namespace SmartClinic.API.Controllers;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
[Route("api/admin/accounts")]
public sealed class AdminAccountsController(ApplicationDbContext db, IPasswordService passwords, IUnitOfWork unitOfWork,
    IAvatarStorage avatars)
    : ControllerBase
{
    private const int PageSize = 20;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery, StringLength(255)] string? search,
        [FromQuery, Range(1, 1000000)] int page = 1, [FromQuery, StringLength(50)] string? role = null,
        [FromQuery] bool? isActive = null, CancellationToken ct = default)
    {
        var query = db.Users.AsNoTracking().Where(u => u.DeletedAtUtc == null);
        var counts = await query.GroupBy(u => new { u.Role, u.IsActive })
            .Select(group => new { group.Key.Role, group.Key.IsActive, Count = group.Count() })
            .ToListAsync(ct);
        var summary = new
        {
            total = counts.Sum(x => x.Count),
            doctors = counts.Where(x => x.Role == UserRole.Doctor).Sum(x => x.Count),
            receptionists = counts.Where(x => x.Role == UserRole.Receptionist).Sum(x => x.Count),
            patients = counts.Where(x => x.Role == UserRole.Patient).Sum(x => x.Count),
            locked = counts.Where(x => !x.IsActive).Sum(x => x.Count)
        };

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(u => u.Email.Contains(term) || u.PhoneNumber.Contains(term) ||
                (u.FullName != null && u.FullName.Contains(term)) ||
                (u.PatientProfile != null && u.PatientProfile.FullName != null && u.PatientProfile.FullName.Contains(term)));
        }
        if (!string.IsNullOrWhiteSpace(role)) query = query.Where(u => u.Role == role);
        if (isActive.HasValue) query = query.Where(u => u.IsActive == isActive.Value);

        var filteredTotal = await query.CountAsync(ct);
        var items = await query.OrderBy(u => u.Email).ThenBy(u => u.Id)
            .Skip((page - 1) * PageSize).Take(PageSize + 1)
            .Select(u => new AccountItem(u.Id, u.Email, u.PhoneNumber, u.Role, u.IsActive,
                u.Role != UserRole.Doctor || u.DoctorProfile == null ? u.Department :
                    db.Departments.Where(d=>d.Id==u.DoctorProfile.PrimaryDepartmentId).Select(d=>d.Name).FirstOrDefault() ?? u.DoctorProfile.Specialty.Name,
                (u.PatientProfile == null ? null : u.PatientProfile.FullName) ?? u.FullName,
                u.PatientProfile == null ? null : u.PatientProfile.AvatarUrl,
                u.Role != UserRole.Doctor || u.DoctorProfile == null ? null : u.DoctorProfile.Specialty.WorkspaceType,
                u.Role == UserRole.Doctor && u.DoctorProfile != null ? (int?)u.DoctorProfile.SpecialtyId : null))
            .ToListAsync(ct);
        var accounts = items.Take(PageSize).Select(account => account with
        {
            AvatarUrl = string.IsNullOrWhiteSpace(account.AvatarUrl) ? null :
                $"/api/admin/accounts/{account.Id}/avatar?{account.AvatarUrl.Split('?').Last()}"
        });
        return Ok(new { items = accounts, hasMore = items.Count > PageSize, filteredTotal, summary });
    }

    [HttpGet("{id:guid}/avatar")]
    public async Task<IActionResult> Avatar(Guid id, CancellationToken ct)
    {
        var exists = await db.Users.AnyAsync(u => u.Id == id && u.DeletedAtUtc == null &&
            u.PatientProfile != null && u.PatientProfile.AvatarUrl != null, ct);
        if (!exists) return NotFound();
        var stream = avatars.Open(id, out var contentType);
        if (stream is null) return NotFound();
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(stream, contentType);
    }

    [HttpGet("specialties")]
    public async Task<IActionResult> Specialties(CancellationToken ct) =>
        Ok(await db.Specialties.AsNoTracking().Where(s => s.IsActive).OrderBy(s => s.Name)
            .Select(s => new { s.Id, s.Name }).ToListAsync(ct));

    [HttpPost]
    public async Task<IActionResult> Create(CreateStaffAccount request, CancellationToken ct)
    {
        if (!IsAssignableRole(request.Role))
            return Problem(statusCode: 400, title: "Hãy chọn vai trò bệnh nhân, bác sĩ hoặc lễ tân.");

        string? specialtyName = null;
        if (request.Role == UserRole.Doctor)
        {
            specialtyName = await db.Specialties.Where(s => s.Id == request.SpecialtyId && s.IsActive)
                .Select(s => s.Name).SingleOrDefaultAsync(ct);
            if (specialtyName is null)
                return Problem(statusCode: 400, title: "Hãy chọn chuyên khoa hợp lệ cho bác sĩ.");
        }
        else if (request.SpecialtyId is not null)
            return Problem(statusCode: 400, title: "Chuyên khoa chỉ áp dụng cho bác sĩ.");

        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            return Problem(statusCode: 409, title: "Email đã được sử dụng.");

        var account = new User
        {
            Id = Guid.NewGuid(), Email = email, PhoneNumber = request.PhoneNumber ?? "",
            Role = request.Role, IsActive = true, FullName = request.FullName?.Trim(),
            Department = request.Role == UserRole.Doctor ? null : request.Department?.Trim(),
            IdentityNumber = request.IdentityNumber
        };
        account.PasswordHash = passwords.Hash(account, request.Password);
        if (request.Role == UserRole.Doctor)
            account.DoctorProfile = new DoctorProfile { UserId = account.Id, SpecialtyId = request.SpecialtyId!.Value };
        if (request.Role == UserRole.Patient)
            account.PatientProfile = new PatientProfile
            {
                UserId = account.Id, FullName = account.FullName, IdentityCard = account.IdentityNumber
            };

        db.Users.Add(account);
        try
        {
            await unitOfWork.SaveChangesAsync(ct);
        }
        catch (DuplicateEmailException)
        {
            return Problem(statusCode: 409, title: "Email đã được sử dụng.");
        }

        return StatusCode(201, new AccountItem(account.Id, email, account.PhoneNumber, account.Role, true,
            specialtyName ?? account.Department, account.FullName));
    }

    [HttpPut("{id:guid}/role")]
    public async Task<IActionResult> SetRole(Guid id, ChangeAccountRole request, CancellationToken ct)
    {
        if (!IsAssignableRole(request.Role))
            return Problem(statusCode: 400, title: "Hãy chọn vai trò bệnh nhân, bác sĩ hoặc lễ tân.");
        if (request.Role != UserRole.Doctor && request.SpecialtyId is not null)
            return Problem(statusCode: 400, title: "Chuyên khoa chỉ áp dụng cho bác sĩ.");

        var account = await db.Users.Include(u => u.DoctorProfile).Include(u => u.PatientProfile)
            .SingleOrDefaultAsync(u => u.Id == id && u.DeletedAtUtc == null, ct);
        if (account is null) return NotFound();
        if (account.Role == UserRole.Admin)
            return Problem(statusCode: 403, title: "Không thể đổi vai trò tài khoản quản trị viên.");

        if (request.Role == UserRole.Doctor)
        {
            if (!await db.Specialties.AnyAsync(s => s.Id == request.SpecialtyId && (s.IsActive || (account.Role == UserRole.Doctor && account.DoctorProfile != null && account.DoctorProfile.SpecialtyId == s.Id)), ct))
                return Problem(statusCode: 400, title: "Hãy chọn chuyên khoa hợp lệ cho bác sĩ.");

            account.DoctorProfile ??= new DoctorProfile { UserId = account.Id };
            account.DoctorProfile.SpecialtyId = request.SpecialtyId!.Value;
        }
        if (request.Role == UserRole.Patient)
            account.PatientProfile ??= new PatientProfile { UserId = account.Id };

        account.Role = request.Role;
        account.SessionVersion = Guid.NewGuid();
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Problem(statusCode: 409, title: "Tài khoản vừa thay đổi. Hãy tải lại danh sách.");
        }
        return NoContent();
    }

    private static bool IsAssignableRole(string role) =>
        role is UserRole.Patient or UserRole.Doctor or UserRole.Receptionist;

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, ChangeAccountStatus request, CancellationToken ct)
    {
        var account = await db.Users.SingleOrDefaultAsync(u => u.Id == id && u.DeletedAtUtc == null, ct);
        if (account is null) return NotFound();
        if (account.Role == UserRole.Admin)
            return Problem(statusCode: 403, title: "Không thể thay đổi trạng thái tài khoản quản trị viên.");
        if (account.IsActive == request.IsActive!.Value) return NoContent();

        account.IsActive = request.IsActive.Value;
        account.SessionVersion = Guid.NewGuid();
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Problem(statusCode: 409, title: "Tài khoản vừa thay đổi. Hãy tải lại danh sách.");
        }
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var account = await db.Users.SingleOrDefaultAsync(u => u.Id == id, ct);
        if (account is null) return NotFound();
        if (account.Role == UserRole.Admin)
            return Problem(statusCode: 403, title: "Không thể xóa tài khoản quản trị viên.");
        if (account.DeletedAtUtc.HasValue) return NoContent();

        account.DeletedAtUtc = DateTime.UtcNow;
        account.IsActive = false;
        account.SessionVersion = Guid.NewGuid();
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Problem(statusCode: 409, title: "Tài khoản vừa thay đổi. Hãy tải lại danh sách.");
        }
        return NoContent();
    }

    public sealed record AccountItem(Guid Id, string Email, string PhoneNumber, string Role, bool IsActive,
        string? SpecialtyName, string? FullName = null, string? AvatarUrl = null,
        string? DoctorWorkspace = null, int? SpecialtyId = null);
    public sealed record CreateStaffAccount(
        [Required, EmailAddress, StringLength(255)] string Email,
        [RegularExpression(@"^\+?[0-9]{9,15}$")] string? PhoneNumber,
        [Required, StringLength(128, MinimumLength = 10)] string Password,
        [Required, StringLength(50)] string Role,
        int? SpecialtyId,
        [StringLength(100)] string? FullName = null,
        [StringLength(150)] string? Department = null,
        [RegularExpression(@"^[0-9]{12}$")] string? IdentityNumber = null);
    public sealed record ChangeAccountStatus([Required] bool? IsActive);
    public sealed record ChangeAccountRole([Required, StringLength(50)] string Role, int? SpecialtyId);
}
