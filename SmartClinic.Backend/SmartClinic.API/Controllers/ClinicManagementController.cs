using System.ComponentModel.DataAnnotations;
using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartClinic.Domain.Entities;
using SmartClinic.Infrastructure.Data;

namespace SmartClinic.API.Controllers;

[ApiController, Route("api/clinic"), ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public class ClinicManagementController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet("departments")]
    public async Task<IActionResult> Departments(CancellationToken ct) => Ok(await db.Departments.AsNoTracking()
        .Where(x => x.IsActive || User.IsInRole("Admin")).OrderBy(x => x.Name).ToListAsync(ct));

    public record DepartmentInput([Required, StringLength(50)] string Code, [Required, StringLength(200)] string Name, bool IsActive);

    [Authorize(Policy = "AdminOnly"), HttpPost("departments")]
    public async Task<IActionResult> SaveDepartment(DepartmentInput input, CancellationToken ct) => await DepartmentSave(null,input,ct);
    [Authorize(Policy = "AdminOnly"), HttpPut("departments/{id:int}")]
    public async Task<IActionResult> UpdateDepartment(int id, DepartmentInput input, CancellationToken ct) => await DepartmentSave(id,input,ct);
    private async Task<IActionResult> DepartmentSave(int? id, DepartmentInput input, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input.Code) || string.IsNullOrWhiteSpace(input.Name)) return BadRequest(new {message="Nhập mã và tên khoa."});
        if (await db.Departments.AnyAsync(x=>x.Id!=id && x.Code==input.Code.Trim(),ct)) return Conflict(new {message="Mã khoa đã tồn tại."});
        var row=id.HasValue ? await db.Departments.FindAsync([id.Value],ct) : new Department();
        if(row==null) return NotFound();
        row.Code=input.Code.Trim(); row.Name=input.Name.Trim(); row.IsActive=input.IsActive;
        if(!id.HasValue) db.Departments.Add(row);
        await db.SaveChangesAsync(ct); return Ok(row);
    }

    private IQueryable<DoctorProfile> PublicDoctors() => db.DoctorProfiles.AsNoTracking().Where(d=>d.User.Role=="Doctor" && d.User.IsActive && d.User.DeletedAtUtc==null && d.IsPublished && db.Departments.Any(k=>k.Id==d.PrimaryDepartmentId && k.IsActive));

    [HttpGet("doctors")]
    public async Task<IActionResult> Doctors([FromQuery] int? departmentId, [FromQuery, StringLength(150)] string? search,
        [FromQuery] bool featured=false, CancellationToken ct=default)
    {
        var q=PublicDoctors();
        if(departmentId.HasValue) q=q.Where(d=>d.PrimaryDepartmentId==departmentId);
        if(!string.IsNullOrWhiteSpace(search)) q=q.Where(d=>d.User.FullName!=null && d.User.FullName.Contains(search.Trim()));
        if(featured) q=q.Where(d=>d.IsFeatured);
        return Ok(await ProjectDoctors(q.OrderBy(d=>d.SortOrder).ThenBy(d=>d.User.FullName)).ToListAsync(ct));
    }
    [Authorize(Policy="AdminOnly"), HttpGet("admin/doctors")]
    public async Task<IActionResult> AdminDoctors(CancellationToken ct) => Ok(await ProjectDoctors(db.DoctorProfiles.AsNoTracking().Where(d=>d.User.Role=="Doctor" && d.User.DeletedAtUtc==null).OrderBy(d=>d.User.FullName)).ToListAsync(ct));

    private IQueryable<DoctorView> ProjectDoctors(IQueryable<DoctorProfile> q) => q.Select(d=>new DoctorView(d.UserId,d.User.FullName ?? d.User.Email,d.SpecialtyId,d.PrimaryDepartmentId,
        db.Departments.Where(k=>k.Id==d.PrimaryDepartmentId).Select(k=>k.Name).FirstOrDefault(),d.Title,d.Position,d.Bio,d.Expertise,d.Education,d.WorkHistory,d.Certificates,d.ConsultationFee ?? 0,d.IsPublished,d.IsFeatured,d.AcceptingBookings,d.SortOrder,d.Photo!=null));
    public record DoctorView(Guid Id,string FullName,int SpecialtyId,int? DepartmentId,string? DepartmentName,string? Title,string? Position,string? Bio,string? Expertise,string? Education,string? WorkHistory,string? Certificates,decimal ConsultationFee,bool IsPublished,bool IsFeatured,bool AcceptingBookings,int SortOrder,bool HasPhoto);
    public record DoctorInput([Required,StringLength(100)] string FullName,int DepartmentId,[StringLength(150)] string? Title,[StringLength(255)] string? Position,
        [StringLength(10000)] string? Bio,[StringLength(10000)] string? Expertise,[StringLength(10000)] string? Education,[StringLength(10000)] string? WorkHistory,[StringLength(10000)] string? Certificates,
        [Range(0,100000000)] decimal ConsultationFee,bool IsPublished,bool IsFeatured,bool AcceptingBookings,[Range(0,10000)] int SortOrder);

    [HttpGet("doctors/{id:guid}")]
    public async Task<IActionResult> Doctor(Guid id,CancellationToken ct) { var row=await ProjectDoctors(PublicDoctors().Where(d=>d.UserId==id)).FirstOrDefaultAsync(ct); return row==null?NotFound():Ok(row); }

    [Authorize(Policy="AdminOnly"),HttpPut("admin/doctors/{id:guid}")]
    public async Task<IActionResult> SaveDoctor(Guid id,DoctorInput input,CancellationToken ct)
    {
        if(string.IsNullOrWhiteSpace(input.FullName)) return BadRequest(new{message="Nhập họ tên bác sĩ."});
        var doctor=await db.DoctorProfiles.Include(d=>d.User).FirstOrDefaultAsync(d=>d.UserId==id && d.User.Role=="Doctor" && d.User.DeletedAtUtc==null,ct);
        if(doctor==null) return NotFound();
        if(!await db.Departments.AnyAsync(k=>k.Id==input.DepartmentId && k.IsActive,ct)) return BadRequest(new{message="Chọn khoa đang hoạt động."});
        await using var tx=await db.Database.BeginTransactionAsync(ct);
        doctor.User.FullName=input.FullName.Trim(); doctor.PrimaryDepartmentId=input.DepartmentId;
        doctor.Title=input.Title; doctor.Position=input.Position; doctor.Bio=input.Bio; doctor.Expertise=input.Expertise;
        doctor.Education=input.Education;doctor.WorkHistory=input.WorkHistory;doctor.Certificates=input.Certificates;
        doctor.ConsultationFee=input.ConsultationFee;doctor.IsPublished=input.IsPublished;doctor.IsFeatured=input.IsFeatured;
        doctor.AcceptingBookings=input.AcceptingBookings;doctor.SortOrder=input.SortOrder;
        await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE dbo.DoctorDepartments SET IsPrimary=0, IsActive=0 WHERE DoctorId={id} AND DepartmentId<>{input.DepartmentId}",ct);
        await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE dbo.DoctorDepartments SET IsPrimary=1, IsActive=1 WHERE DoctorId={id} AND DepartmentId={input.DepartmentId}; IF @@ROWCOUNT=0 INSERT INTO dbo.DoctorDepartments(DoctorId,DepartmentId,IsPrimary,IsActive,AssignedAtUtc) VALUES ({id},{input.DepartmentId},1,1,SYSUTCDATETIME());",ct);
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct); return NoContent();
    }

    [Authorize(Policy="AdminOnly"),HttpPost("admin/doctors/{id:guid}/photo"),RequestSizeLimit(5300000)]
    public async Task<IActionResult> PhotoUpload(Guid id,IFormFile file,CancellationToken ct)
    {
        var doctor=await db.DoctorProfiles.FirstOrDefaultAsync(d=>d.UserId==id && d.User.Role=="Doctor" && d.User.DeletedAtUtc==null,ct);
        if(doctor==null)return NotFound();
        if(file.Length is <=0 or >5242880) return BadRequest(new{message="Ảnh tối đa 5 MB."});
        using var stream=new MemoryStream(); await file.CopyToAsync(stream,ct); var bytes=stream.ToArray();
        var type=bytes.Length>12 && bytes[0]==255 && bytes[1]==216 && bytes[2]==255?"image/jpeg":bytes.Length>8 && bytes.AsSpan(0,8).SequenceEqual(new byte[]{137,80,78,71,13,10,26,10})?"image/png":bytes.Length>12 && System.Text.Encoding.ASCII.GetString(bytes,0,4)=="RIFF" && System.Text.Encoding.ASCII.GetString(bytes,8,4)=="WEBP"?"image/webp":null;
        if(type==null)return BadRequest(new{message="Chỉ hỗ trợ ảnh JPEG, PNG, WebP."});
        doctor.Photo=bytes;doctor.PhotoContentType=type;await db.SaveChangesAsync(ct);return NoContent();
    }
    [HttpGet("doctors/{id:guid}/photo")]
    public async Task<IActionResult> Photo(Guid id,CancellationToken ct)
    {
        var q=User.IsInRole("Admin")?db.DoctorProfiles.AsNoTracking():PublicDoctors();
        var row=await q.Where(x=>x.UserId==id).Select(x=>new{x.Photo,x.PhotoContentType}).FirstOrDefaultAsync(ct);
        return row?.Photo==null?NotFound():File(row.Photo,row.PhotoContentType ?? "image/jpeg");
    }

    public record ScheduleInput(Guid DoctorId, DateTimeOffset StartTime,DateTimeOffset EndTime,[Range(5,120)] int SlotMinutes,[Required,StringLength(100)] string Room);
    [Authorize(Policy="AdminOnly"),HttpGet("admin/schedules")]
    public async Task<IActionResult> Schedules(CancellationToken ct) => Ok(await db.DoctorSchedules.AsNoTracking().OrderByDescending(x=>x.StartTime).Select(s=>new{s.Id,s.DoctorId,s.StartTime,s.EndTime,s.Room,s.SlotMinutes,s.IsActive,TotalSlots=db.TimeSlots.Count(t=>t.ScheduleId==s.Id),HasAppointments=db.Appointments.Any(a=>a.TimeSlot.ScheduleId==s.Id),DoctorName=db.DoctorProfiles.Where(d=>d.UserId==s.DoctorId).Select(d=>d.User.FullName).FirstOrDefault(),Booked=db.TimeSlots.Count(t=>t.ScheduleId==s.Id && t.Appointments.Any(a=>a.Status!="Cancelled"))}).ToListAsync(ct));

    [Authorize(Policy="AdminOnly"),HttpPost("admin/schedules")]
    public Task<IActionResult> CreateSchedule(ScheduleInput input,CancellationToken ct) => SaveSchedule(null,input,ct);

    [Authorize(Policy="AdminOnly"),HttpPut("admin/schedules/{id:guid}")]
    public Task<IActionResult> UpdateSchedule(Guid id,ScheduleInput input,CancellationToken ct) => SaveSchedule(id,input,ct);

    private async Task<IActionResult> SaveSchedule(Guid? id,ScheduleInput input,CancellationToken ct)
    {
        var start=input.StartTime.UtcDateTime;var end=input.EndTime.UtcDateTime;
        if(input.SlotMinutes is <5 or >120 || start<=DateTime.UtcNow || end<=start || end-start>TimeSpan.FromHours(12) || (end-start).TotalMinutes%input.SlotMinutes!=0 || string.IsNullOrWhiteSpace(input.Room))return BadRequest(new{message="Ca khám phải ở tương lai, tối đa 12 giờ và chia hết theo thời lượng khám."});
        await using var tx=await db.Database.BeginTransactionAsync(IsolationLevel.Serializable,ct);
        // Serialize room allocations across doctors as well as concurrent edits.
        await db.Database.ExecuteSqlRawAsync("DECLARE @result int; EXEC @result = sp_getapplock @Resource=N'ClinicScheduleAllocation', @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=10000; IF @result < 0 THROW 50001, 'Schedule allocation busy', 1;",ct);
        // Serialize schedule changes and bookings for a doctor to prevent overlapping slots.
        var d=await db.DoctorProfiles.FromSqlInterpolated($"SELECT * FROM dbo.DoctorProfiles WITH (UPDLOCK,HOLDLOCK) WHERE UserId={input.DoctorId}").Include(d=>d.User).FirstOrDefaultAsync(ct);
        if(d==null || d.User.Role!="Doctor" || !d.User.IsActive || d.User.DeletedAtUtc!=null || !await db.Departments.AnyAsync(k=>k.Id==d.PrimaryDepartmentId && k.IsActive,ct)) return BadRequest(new{message="Bác sĩ cần thuộc khoa đang hoạt động."});
        var existing = id.HasValue ? await db.DoctorSchedules.FirstOrDefaultAsync(s=>s.Id==id,ct) : null;
        if(id.HasValue && existing==null)return NotFound();
        if(existing!=null && (!existing.IsActive || existing.StartTime<=DateTime.UtcNow))return Conflict(new{message="Chỉ sửa được ca chưa bắt đầu và chưa hủy."});
        if(existing!=null && existing.DoctorId!=input.DoctorId)return BadRequest(new{message="Không thể đổi bác sĩ của ca. Hãy hủy và tạo ca mới."});
        if(id.HasValue && await db.Appointments.AnyAsync(a=>a.TimeSlot.ScheduleId==id,ct))return Conflict(new{message="Ca đã có lịch sử đặt khám, không thể sửa giờ. Hãy tạo ca mới để giữ nguyên lịch sử."});
        if(await db.DoctorSchedules.AnyAsync(s=>s.Id!=id && s.IsActive && s.Room==input.Room.Trim() && s.StartTime<end && s.EndTime>start,ct))return Conflict(new{message="Phòng khám đã được sử dụng trong khoảng thời gian này."});
        if(await db.TimeSlots.AnyAsync(t=>(!id.HasValue || t.ScheduleId!=id) && t.DoctorId==input.DoctorId && t.StartTime<end && t.EndTime>start && (t.ScheduleId==null || db.DoctorSchedules.Any(s=>s.Id==t.ScheduleId && s.IsActive)),ct))return Conflict(new{message="Bác sĩ đã có lịch trong khoảng thời gian này."});
        var schedule=existing ?? new DoctorSchedule{Id=Guid.NewGuid(),DoctorId=input.DoctorId,StartTime=start,EndTime=end,SlotMinutes=input.SlotMinutes,Room=input.Room.Trim()};
        if(existing==null)db.DoctorSchedules.Add(schedule);
        else {
            db.TimeSlots.RemoveRange(await db.TimeSlots.Where(t=>t.ScheduleId==id).ToListAsync(ct));
            schedule.StartTime=start;schedule.EndTime=end;schedule.SlotMinutes=input.SlotMinutes;schedule.Room=input.Room.Trim();
        }
        for(var t=start;t<end;t=t.AddMinutes(input.SlotMinutes))db.TimeSlots.Add(new TimeSlot{Id=Guid.NewGuid(),DoctorId=input.DoctorId,StartTime=t,EndTime=t.AddMinutes(input.SlotMinutes),IsBooked=false,ScheduleId=schedule.Id});
        await db.SaveChangesAsync(ct);await tx.CommitAsync(ct);return Ok(new{id=schedule.Id});
    }

    [Authorize(Policy="AdminOnly"),HttpGet("admin/schedules/{id:guid}/appointments")]
    public async Task<IActionResult> ScheduleAppointments(Guid id,CancellationToken ct)
    {
        if(!await db.DoctorSchedules.AnyAsync(s=>s.Id==id,ct))return NotFound();
        return Ok(await db.Appointments.AsNoTracking().Where(a=>a.TimeSlot.ScheduleId==id)
            .OrderBy(a=>a.TimeSlot.StartTime).Select(a=>new{a.Id,a.Status,a.Symptom,
                PatientName=a.Patient.FullName,PhoneNumber=a.Patient.User.PhoneNumber,
                a.TimeSlot.StartTime,a.TimeSlot.EndTime}).ToListAsync(ct));
    }

    [Authorize(Policy="AdminOnly"),HttpDelete("admin/schedules/{id:guid}")]
    public async Task<IActionResult> RemoveSchedule(Guid id,CancellationToken ct)
    {
        var doctorId=await db.DoctorSchedules.AsNoTracking().Where(s=>s.Id==id).Select(s=>(Guid?)s.DoctorId).FirstOrDefaultAsync(ct);
        if(doctorId==null)return NotFound();
        await using var tx=await db.Database.BeginTransactionAsync(IsolationLevel.Serializable,ct);
        await db.DoctorProfiles.FromSqlInterpolated($"SELECT * FROM dbo.DoctorProfiles WITH (UPDLOCK,HOLDLOCK) WHERE UserId={doctorId.Value}").LoadAsync(ct);
        var schedule=await db.DoctorSchedules.FirstOrDefaultAsync(s=>s.Id==id,ct);if(schedule==null)return NotFound();
        if(schedule.StartTime<=DateTime.UtcNow)return Conflict(new{message="Không thể hủy ca đã bắt đầu."});
        if(await db.Appointments.AnyAsync(a=>a.TimeSlot.ScheduleId==id && a.Status!="Cancelled",ct))return Conflict(new{message="Ca đã có lịch hẹn, không thể hủy ca."});
        schedule.IsActive=false;await db.SaveChangesAsync(ct);await tx.CommitAsync(ct);return NoContent();
    }

    [HttpGet("doctors/{id:guid}/slots")]
    public async Task<IActionResult> Slots(Guid id,[FromQuery] DateOnly date,CancellationToken ct)
    {
        if(!await PublicDoctors().AnyAsync(d=>d.UserId==id && d.AcceptingBookings,ct))return Ok(Array.Empty<object>());
        var start=date.ToDateTime(TimeOnly.MinValue).AddHours(-7);var end=start.AddDays(1);
        return Ok(await db.TimeSlots.AsNoTracking().Where(t=>t.DoctorId==id && t.StartTime>=start && t.StartTime<end && t.StartTime>DateTime.UtcNow && t.IsBooked!=true && db.DoctorSchedules.Any(s=>s.Id==t.ScheduleId && s.IsActive) && !t.Appointments.Any(a=>a.Status!="Cancelled"))
            .OrderBy(t=>t.StartTime).Select(t=>new{t.Id,t.StartTime,t.EndTime,Room=db.DoctorSchedules.Where(s=>s.Id==t.ScheduleId).Select(s=>s.Room).FirstOrDefault()}).ToListAsync(ct));
    }

    public record BookingInput(Guid TimeSlotId,[StringLength(2000)] string? Symptom);
    [Authorize(Policy="PatientOnly"),HttpPost("appointments")]
    public async Task<IActionResult> Book(BookingInput input,CancellationToken ct)
    {
        if(!Guid.TryParse(User.FindFirst("sub")?.Value,out var patientId))return Unauthorized();
        var patient=await db.PatientProfiles.Include(p=>p.User).FirstOrDefaultAsync(p=>p.UserId==patientId,ct);
        if(patient==null || string.IsNullOrWhiteSpace(patient.FullName) || patient.Dob==null || string.IsNullOrWhiteSpace(patient.Address) || string.IsNullOrWhiteSpace(patient.Gender) || string.IsNullOrWhiteSpace(patient.User.PhoneNumber) || (string.IsNullOrWhiteSpace(patient.IdentityCard) && string.IsNullOrWhiteSpace(patient.HealthInsuranceNumber)))return BadRequest(new{message="Vui lòng hoàn thiện thông tin cá nhân trước khi đặt lịch."});
        var doctorId=await db.TimeSlots.Where(t=>t.Id==input.TimeSlotId).Select(t=>(Guid?)t.DoctorId).FirstOrDefaultAsync(ct);if(doctorId==null)return NotFound();
        await using var tx=await db.Database.BeginTransactionAsync(IsolationLevel.Serializable,ct);
        await db.PatientProfiles.FromSqlInterpolated($"SELECT * FROM dbo.PatientProfiles WITH (UPDLOCK,HOLDLOCK) WHERE UserId={patientId}").LoadAsync(ct);
        await db.DoctorProfiles.FromSqlInterpolated($"SELECT * FROM dbo.DoctorProfiles WITH (UPDLOCK,HOLDLOCK) WHERE UserId={doctorId.Value}").LoadAsync(ct);
        var slot=await db.TimeSlots.FirstOrDefaultAsync(t=>t.Id==input.TimeSlotId,ct);
        if(slot==null || slot.StartTime<=DateTime.UtcNow || slot.IsBooked==true || !await PublicDoctors().AnyAsync(d=>d.UserId==slot.DoctorId && d.AcceptingBookings,ct) || !await db.DoctorSchedules.AnyAsync(s=>s.Id==slot.ScheduleId && s.IsActive,ct) || await db.Appointments.AnyAsync(a=>a.TimeSlotId==slot.Id && a.Status!="Cancelled",ct))return Conflict(new{message="Khung giờ không còn trống. Vui lòng chọn lại."});
        if(await db.Appointments.AnyAsync(a=>a.PatientId==patientId && a.Status!="Cancelled" && a.TimeSlot.StartTime<slot.EndTime && a.TimeSlot.EndTime>slot.StartTime,ct))return Conflict(new{message="Bạn đã có lịch hẹn trùng giờ."});
        var appointment=new Appointment{Id=Guid.NewGuid(),PatientId=patientId,TimeSlotId=slot.Id,Status="Pending",PaymentStatus="Unpaid",Symptom=input.Symptom};
        slot.IsBooked=true;db.Appointments.Add(appointment);await db.SaveChangesAsync(ct);await tx.CommitAsync(ct);return Ok(new{appointment.Id,appointment.Status});
    }
    [Authorize(Policy="PatientOnly"),HttpGet("appointments")]
    public async Task<IActionResult> MyAppointments(CancellationToken ct)
    {
        if(!Guid.TryParse(User.FindFirst("sub")?.Value,out var id))return Unauthorized();
        return Ok(await db.Appointments.AsNoTracking().Where(a=>a.PatientId==id).OrderByDescending(a=>a.TimeSlot.StartTime).Select(a=>new{a.Id,a.Status,a.Symptom,a.TimeSlot.StartTime,a.TimeSlot.EndTime,DoctorId=a.TimeSlot.DoctorId,DoctorName=a.TimeSlot.Doctor.User.FullName,DepartmentName=db.Departments.Where(d=>d.Id==a.TimeSlot.Doctor.PrimaryDepartmentId).Select(d=>d.Name).FirstOrDefault()}).ToListAsync(ct));
    }
}
