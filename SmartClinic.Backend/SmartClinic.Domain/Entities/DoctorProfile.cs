using System;
using System.Collections.Generic;

namespace SmartClinic.Domain.Entities;

public partial class DoctorProfile
{
    public Guid UserId { get; set; }

    public int SpecialtyId { get; set; }

    public string? Bio { get; set; }

    public decimal? ConsultationFee { get; set; }

    public virtual Specialty Specialty { get; set; } = null!;

    public virtual ICollection<TimeSlot> TimeSlots { get; set; } = new List<TimeSlot>();

    public virtual User User { get; set; } = null!;
}
