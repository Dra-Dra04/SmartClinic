using System.ComponentModel.DataAnnotations;
using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartClinic.Application.Abstractions;
using SmartClinic.Domain.Entities;
using SmartClinic.Infrastructure.Data;

namespace SmartClinic.API.Controllers;

[ApiController, Authorize(Roles = "Admin,Receptionist"), Route("api/clinic/staff")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public class StaffReceptionController(ApplicationDbContext db, IPasswordService passwords) : ControllerBase
{
    [HttpPut("appointments/{id:guid}/check-in")]
    public async Task<IActionResult> CheckIn(Guid id, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var today = now.AddHours(7).Date.AddHours(-7);
        var tomorrow = today.AddDays(1);
        var changed = await db.Appointments.Where(a => a.Id == id && (a.Status == "Pending" || a.Status == "Confirmed")
            && a.TimeSlot.StartTime >= today && a.TimeSlot.StartTime < tomorrow && a.TimeSlot.EndTime > now
            && db.DoctorSchedules.Any(s => s.Id == a.TimeSlot.ScheduleId && s.IsActive))
            .ExecuteUpdateAsync(setters => setters.SetProperty(a => a.Status, "CheckedIn"), ct);
        if (changed == 1) return NoContent();
        var status = await db.Appointments.Where(a => a.Id == id).Select(a => a.Status).FirstOrDefaultAsync(ct);
        if (status is null) return NotFound();
        if (status == "CheckedIn") return NoContent();
        return Conflict(new { message = "Chỉ tiếp nhận lịch hôm nay chưa hết giờ, còn chờ xác nhận hoặc đã xác nhận. Hãy tải lại danh sách." });
    }

    [HttpGet("patients")]
    public async Task<IActionResult> Patients([FromQuery, Required, StringLength(100, MinimumLength = 2)] string search, CancellationToken ct)
    {
        var term = search.Trim();
        if (term.Length < 2) return BadRequest(new { message = "Nhập ít nhất 2 ký tự để tìm bệnh nhân." });
        return Ok(await db.PatientProfiles.AsNoTracking().Where(p => p.User.Role == "Patient" && p.User.DeletedAtUtc == null
            && ((p.FullName != null && p.FullName.Contains(term)) || p.User.PhoneNumber.Contains(term)))
            .OrderBy(p => p.FullName).Take(20).Select(p => new { Id = p.UserId, p.FullName, p.User.PhoneNumber, p.Dob, p.Gender }).ToListAsync(ct));
    }

    [HttpGet("walk-in/slots")]
    public async Task<IActionResult> Slots(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var today = now.AddHours(7).Date.AddHours(-7);
        var tomorrow = today.AddDays(1);
        return Ok(await db.TimeSlots.AsNoTracking().Where(t => t.StartTime >= today && t.StartTime < tomorrow && t.EndTime > now
            && t.IsBooked != true && !t.Appointments.Any(a => a.Status != "Cancelled")
            && t.Doctor.User.IsActive && t.Doctor.User.DeletedAtUtc == null && t.Doctor.User.Role == "Doctor"
            && db.Departments.Any(k => k.Id == t.Doctor.PrimaryDepartmentId && k.IsActive)
            && db.DoctorSchedules.Any(s => s.Id == t.ScheduleId && s.IsActive))
            .OrderBy(t => t.StartTime).Select(t => new { t.Id, t.StartTime, t.EndTime, t.DoctorId, DoctorName = t.Doctor.User.FullName,
                DepartmentName = db.Departments.Where(k => k.Id == t.Doctor.PrimaryDepartmentId).Select(k => k.Name).FirstOrDefault(),
                Room = db.DoctorSchedules.Where(s => s.Id == t.ScheduleId).Select(s => s.Room).FirstOrDefault() }).ToListAsync(ct));
    }

    public record WalkInInput(Guid TimeSlotId, Guid? PatientId, [StringLength(100)] string? FullName,
        [RegularExpression(@"^\+?[0-9]{9,15}$")] string? PhoneNumber, DateOnly? Dob,
        [StringLength(20)] string? Gender, [StringLength(2000)] string? Symptom,
        [RegularExpression(@"^[0-9]{12}$", ErrorMessage = "CCCD phải gồm đúng 12 chữ số.")] string? IdentityCard = null);

    [HttpPost("walk-in")]
    public async Task<IActionResult> WalkIn(WalkInInput input, CancellationToken ct)
    {
        if (!input.PatientId.HasValue && (string.IsNullOrWhiteSpace(input.FullName) || string.IsNullOrWhiteSpace(input.PhoneNumber)
            || input.Dob is null || input.Dob > DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7)) || input.Gender is not ("Nam" or "Nữ" or "Khác")))
            return BadRequest(new { message = "Nhập họ tên, số điện thoại, ngày sinh và giới tính cho bệnh nhân mới." });
        var doctorId = await db.TimeSlots.Where(t => t.Id == input.TimeSlotId).Select(t => (Guid?)t.DoctorId).FirstOrDefaultAsync(ct);
        if (!doctorId.HasValue) return NotFound();
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        PatientProfile? patient;
        if (input.PatientId.HasValue)
        {
            patient = await db.PatientProfiles.FromSqlInterpolated($"SELECT * FROM dbo.PatientProfiles WITH (UPDLOCK,HOLDLOCK) WHERE UserId={input.PatientId.Value}")
                .Include(p => p.User).FirstOrDefaultAsync(ct);
            if (patient is null || patient.User.Role != "Patient" || patient.User.DeletedAtUtc != null) return BadRequest(new { message = "Hồ sơ bệnh nhân không hợp lệ." });
        }
        else
        {
            var id = Guid.NewGuid();
            var user = new User { Id = id, Email = $"walkin-{id:N}@patients.invalid", Role = "Patient", IsActive = false,
                FullName = input.FullName!.Trim(), PhoneNumber = input.PhoneNumber! };
            user.PasswordHash = passwords.Hash(user, Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"));
            patient = new PatientProfile { UserId = id, User = user, FullName = user.FullName, Dob = input.Dob!.Value.ToDateTime(TimeOnly.MinValue), Gender = input.Gender, IdentityCard = string.IsNullOrWhiteSpace(input.IdentityCard) ? null : input.IdentityCard };
            db.PatientProfiles.Add(patient);
        }
        await db.DoctorProfiles.FromSqlInterpolated($"SELECT * FROM dbo.DoctorProfiles WITH (UPDLOCK,HOLDLOCK) WHERE UserId={doctorId.Value}").LoadAsync(ct);
        var now = DateTime.UtcNow;
        var today = now.AddHours(7).Date.AddHours(-7);
        var tomorrow = today.AddDays(1);
        var slot = await db.TimeSlots.FirstOrDefaultAsync(t => t.Id == input.TimeSlotId, ct);
        if (slot is null || slot.StartTime < today || slot.StartTime >= tomorrow || slot.EndTime <= now || slot.IsBooked == true
            || await db.Appointments.AnyAsync(a => a.TimeSlotId == slot.Id && a.Status != "Cancelled", ct)
            || !await db.DoctorSchedules.AnyAsync(s => s.Id == slot.ScheduleId && s.IsActive, ct)
            || !await db.DoctorProfiles.AnyAsync(d => d.UserId == slot.DoctorId && d.User.IsActive && d.User.Role == "Doctor" && d.User.DeletedAtUtc == null
                && db.Departments.Any(k => k.Id == d.PrimaryDepartmentId && k.IsActive), ct))
            return Conflict(new { message = "Khung giờ không còn trống hoặc không thuộc ca hôm nay. Hãy chọn lại." });
        if (await db.Appointments.AnyAsync(a => a.PatientId == patient.UserId && a.Status != "Cancelled"
            && a.TimeSlot.StartTime < slot.EndTime && a.TimeSlot.EndTime > slot.StartTime, ct))
            return Conflict(new { message = "Bệnh nhân đã có lịch trùng giờ." });
        var appointment = new Appointment { Id = Guid.NewGuid(), PatientId = patient.UserId, TimeSlotId = slot.Id,
            Status = "CheckedIn", PaymentStatus = "Unpaid", Symptom = input.Symptom?.Trim() };
        slot.IsBooked = true;
        db.Appointments.Add(appointment);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return Ok(new { appointment.Id, appointment.Status, PatientId = patient.UserId });
    }
}
