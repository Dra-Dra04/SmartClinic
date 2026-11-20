using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartClinic.Infrastructure.Data;

namespace SmartClinic.API.Controllers;

[ApiController, Authorize(Roles = "Admin,Receptionist"), Route("api/clinic/staff/appointments")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public class StaffAppointmentsController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] DateOnly? date, [FromQuery] Guid? doctorId,
        [FromQuery, StringLength(50)] string? status, [FromQuery, StringLength(200)] string? search, CancellationToken ct)
    {
        var query = db.Appointments.AsNoTracking();
        if (date.HasValue)
        {
            var start = date.Value.ToDateTime(TimeOnly.MinValue).AddHours(-7);
            var end = start.AddDays(1);
            query = query.Where(a => a.TimeSlot.StartTime >= start && a.TimeSlot.StartTime < end);
        }
        if (doctorId.HasValue) query = query.Where(a => a.TimeSlot.DoctorId == doctorId);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(a => a.Status == status);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(a => (a.Patient.FullName != null && a.Patient.FullName.Contains(term)) || a.Patient.User.PhoneNumber.Contains(term));
        }
        return Ok(await query.OrderBy(a => a.TimeSlot.StartTime).Select(a => new {
            a.Id, a.Status, a.Symptom, a.TimeSlot.StartTime, a.TimeSlot.EndTime,
            DoctorId = a.TimeSlot.DoctorId, DoctorName = a.TimeSlot.Doctor.User.FullName,
            PatientName = a.Patient.FullName, PhoneNumber = a.Patient.User.PhoneNumber,
            Room = db.DoctorSchedules.Where(s => s.Id == a.TimeSlot.ScheduleId).Select(s => s.Room).FirstOrDefault()
        }).ToListAsync(ct));
    }

    [HttpPut("{id:guid}/confirm")]
    public async Task<IActionResult> Confirm(Guid id, CancellationToken ct)
    {
        // Conditional update prevents confirmation from overwriting cancellation or a later state.
        var now = DateTime.UtcNow;
        var changed = await db.Appointments.Where(a => a.Id == id && a.Status == "Pending"
            && a.TimeSlot.EndTime > now
            && db.DoctorSchedules.Any(s => s.Id == a.TimeSlot.ScheduleId && s.IsActive))
            .ExecuteUpdateAsync(setters => setters.SetProperty(a => a.Status, "Confirmed"), ct);
        if (changed == 1) return NoContent();
        var status = await db.Appointments.Where(a => a.Id == id).Select(a => a.Status).FirstOrDefaultAsync(ct);
        if (status is null) return NotFound();
        if (status == "Confirmed") return NoContent();
        return Conflict(new { message = "Lịch hẹn đã thay đổi, hết giờ khám hoặc ca đã hủy. Hãy tải lại danh sách." });
    }
}
