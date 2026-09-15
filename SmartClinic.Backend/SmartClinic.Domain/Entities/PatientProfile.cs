using System;
using System.Collections.Generic;

namespace SmartClinic.Domain.Entities;

public partial class PatientProfile
{
    public Guid UserId { get; set; }

    public DateTime? Dob { get; set; }

    public string? FullName { get; set; }

    public string? IdentityCard { get; set; }

    public string? AvatarUrl { get; set; }

    public string? Gender { get; set; }

    public string? Occupation { get; set; }

    public string? Ethnicity { get; set; }

    public string? Address { get; set; }

    public string? HealthInsuranceNumber { get; set; }

    public DateTime? HealthInsuranceExpiry { get; set; }

    public string? EmergencyContactName { get; set; }

    public string? EmergencyContactPhone { get; set; }

    public string? BloodType { get; set; }

    public string? Allergies { get; set; }

    public string? BackgroundDisease { get; set; }

    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public virtual User User { get; set; } = null!;
}
