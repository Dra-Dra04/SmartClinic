using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartClinic.Domain.Entities;
using SmartClinic.Infrastructure.Data;

namespace SmartClinic.API.Controllers;

[ApiController, Authorize(Policy = "PatientOnly"), Route("api/clinic/appointments")]
public class PatientAppointmentChangesController(ApplicationDbContext db) : ControllerBase
{
    public record ChangeInput(Guid TimeSlotId);
    [HttpPut("{id:guid}/cancel")]
    public Task<IActionResult> Cancel(Guid id, CancellationToken ct) => Change(id, null, ct);
    [HttpPut("{id:guid}/reschedule")]
    public Task<IActionResult> Reschedule(Guid id, ChangeInput input, CancellationToken ct) => Change(id, input.TimeSlotId, ct);

    private async Task<IActionResult> Change(Guid id, Guid? newSlotId, CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirst("sub")?.Value, out var patientId)) return Unauthorized();
        var original = await db.Appointments.AsNoTracking().Where(a => a.Id == id && a.PatientId == patientId)
            .Select(a => new { a.TimeSlotId, a.TimeSlot.DoctorId, a.Symptom }).FirstOrDefaultAsync(ct);
        if (original is null) return NotFound();
        if (newSlotId == original.TimeSlotId) return BadRequest(new { message = "Hãy chọn khung giờ khác lịch hiện tại." });
        var newDoctorId = newSlotId.HasValue ? await db.TimeSlots.Where(t => t.Id == newSlotId).Select(t => (Guid?)t.DoctorId).FirstOrDefaultAsync(ct) : null;
        if (newSlotId.HasValue && !newDoctorId.HasValue) return NotFound();
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        await db.PatientProfiles.FromSqlInterpolated($"SELECT * FROM dbo.PatientProfiles WITH (UPDLOCK,HOLDLOCK) WHERE UserId={patientId}").LoadAsync(ct);
        foreach (var doctorId in new[] { original.DoctorId, newDoctorId ?? original.DoctorId }.Distinct().OrderBy(x => x))
            await db.DoctorProfiles.FromSqlInterpolated($"SELECT * FROM dbo.DoctorProfiles WITH (UPDLOCK,HOLDLOCK) WHERE UserId={doctorId}").LoadAsync(ct);
        var now = DateTime.UtcNow;
        TimeSlot? target = null;
        if (newSlotId.HasValue)
        {
            target = await db.TimeSlots.FirstOrDefaultAsync(t => t.Id == newSlotId, ct);
            if (target is null || target.StartTime <= now || target.IsBooked == true
                || await db.Appointments.AnyAsync(a => a.TimeSlotId == target.Id && a.Status != "Cancelled", ct)
                || !await db.DoctorSchedules.AnyAsync(s => s.Id == target.ScheduleId && s.IsActive, ct)
                || !await db.DoctorProfiles.AnyAsync(d => d.UserId == target.DoctorId && d.IsPublished && d.AcceptingBookings && d.User.Role == "Doctor" && d.User.IsActive && d.User.DeletedAtUtc == null
                    && db.Departments.Any(k => k.Id == d.PrimaryDepartmentId && k.IsActive), ct))
                return Conflict(new { message = "Giờ mới không còn trống hoặc bác sĩ ngừng nhận lịch. Lịch cũ vẫn được giữ nguyên." });
            if (await db.Appointments.AnyAsync(a => a.Id != id && a.PatientId == patientId && a.Status != "Cancelled"
                && a.TimeSlot.StartTime < target.EndTime && a.TimeSlot.EndTime > target.StartTime, ct))
                return Conflict(new { message = "Bạn đã có lịch hẹn trùng giờ." });
        }
        var changed = await db.Appointments.Where(a => a.Id == id && a.PatientId == patientId
            && (a.Status == "Pending" || a.Status == "Confirmed") && a.TimeSlot.StartTime > now)
            .ExecuteUpdateAsync(setters => setters.SetProperty(a => a.Status, "Cancelled"), ct);
        if (changed == 0) return Conflict(new { message = "Chỉ đổi/hủy lịch chưa đến giờ khám và chưa tiếp nhận. Hãy tải lại danh sách." });
        var oldSlot = await db.TimeSlots.SingleAsync(t => t.Id == original.TimeSlotId, ct);
        oldSlot.IsBooked = await db.Appointments.AnyAsync(a => a.TimeSlotId == oldSlot.Id && a.Status != "Cancelled", ct);
        Appointment? replacement = null;
        if (target is not null)
        {
            target.IsBooked = true;
            replacement = new Appointment { Id = Guid.NewGuid(), PatientId = patientId, TimeSlotId = target.Id,
                Status = "Pending", PaymentStatus = "Unpaid", Symptom = original.Symptom };
            db.Appointments.Add(replacement);
        }
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return Ok(new { Id = replacement?.Id ?? id, Status = replacement?.Status ?? "Cancelled" });
    }
}
