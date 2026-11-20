namespace SmartClinic.Domain.Entities;

public class Department
{
    public int Id { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public partial class DoctorProfile
{
    public int? PrimaryDepartmentId { get; set; }
    public string? Title { get; set; }
    public string? Position { get; set; }
    public string? Expertise { get; set; }
    public string? Education { get; set; }
    public string? WorkHistory { get; set; }
    public string? Certificates { get; set; }
    public bool IsPublished { get; set; }
    public bool IsFeatured { get; set; }
    public bool AcceptingBookings { get; set; }
    public int SortOrder { get; set; }
    public byte[]? Photo { get; set; }
    public string? PhotoContentType { get; set; }
}

public class DoctorSchedule
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int SlotMinutes { get; set; }
    public string Room { get; set; } = "";
    public bool IsActive { get; set; } = true;
}

public partial class TimeSlot
{
    public Guid? ScheduleId { get; set; }
}
