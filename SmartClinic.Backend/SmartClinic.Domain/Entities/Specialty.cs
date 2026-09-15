using System;
using System.Collections.Generic;

namespace SmartClinic.Domain.Entities;

public partial class Specialty
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public virtual ICollection<DoctorProfile> DoctorProfiles { get; set; } = new List<DoctorProfile>();
}
