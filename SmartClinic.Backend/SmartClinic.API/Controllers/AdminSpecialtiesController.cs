using System.ComponentModel.DataAnnotations;
using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartClinic.Domain.Entities;
using SmartClinic.Infrastructure.Data;

namespace SmartClinic.API.Controllers;

[ApiController, Authorize(Policy = "AdminOnly"), Route("api/admin/specialties")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public class AdminSpecialtiesController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await db.Specialties.AsNoTracking()
        .OrderBy(s => s.Name).Select(s => new { s.Id, s.Name, s.Description, s.WorkspaceType, s.IsActive,
            DoctorCount = s.DoctorProfiles.Count }).ToListAsync(ct));

    public record SpecialtyInput([Required, StringLength(255)] string Name,
        [StringLength(2000)] string? Description, [Required] string WorkspaceType, bool IsActive = true);

    [HttpPost]
    public Task<IActionResult> Create(SpecialtyInput input, CancellationToken ct) => Save(null, input, ct);

    [HttpPut("{id:int}")]
    public Task<IActionResult> Update(int id, SpecialtyInput input, CancellationToken ct) => Save(id, input, ct);

    private async Task<IActionResult> Save(int? id, SpecialtyInput input, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input.Name)) return BadRequest(new { message = "Nhập tên chuyên khoa." });
        if (input.WorkspaceType is not ("Consultation" or "ClinicalService"))
            return BadRequest(new { message = "Chọn loại hoạt động hợp lệ." });
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var name = input.Name.Trim();
        if (await db.Specialties.AnyAsync(s => s.Id != id && s.Name.ToUpper() == name.ToUpper(), ct))
            return Conflict(new { message = "Tên chuyên khoa đã tồn tại." });
        var row = id.HasValue ? await db.Specialties.FindAsync([id.Value], ct) : new Specialty();
        if (row is null) return NotFound();
        row.Name = name;
        row.Description = input.Description?.Trim();
        row.WorkspaceType = input.WorkspaceType;
        row.IsActive = input.IsActive;
        if (!id.HasValue) db.Specialties.Add(row);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return Ok(new { row.Id });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var row = await db.Specialties.FindAsync([id], ct);
        if (row is null) return NotFound();
        if (await db.DoctorProfiles.AnyAsync(d => d.SpecialtyId == id, ct))
            return Conflict(new { message = "Chuyên khoa đã có hồ sơ bác sĩ. Hãy ngừng sử dụng thay vì xóa." });
        db.Specialties.Remove(row);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return NoContent();
    }
}
