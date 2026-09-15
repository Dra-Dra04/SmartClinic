using System;
using System.Collections.Generic;

namespace SmartClinic.Domain.Entities;

public partial class TimeSlot
{
    public Guid Id { get; set; }

    public Guid DoctorId { get; set; }

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public bool? IsBooked { get; set; }

    public byte[] RowVersion { get; set; } = null!;

    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public virtual DoctorProfile Doctor { get; set; } = null!;
}
