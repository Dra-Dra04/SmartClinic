using System;
using System.Collections.Generic;

namespace SmartClinic.Domain.Entities;

public partial class User
{
    public Guid Id { get; set; }

    public string Email { get; set; } = null!;
    public string PhoneNumber { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string Role { get; set; } = null!;

    public string? DeviceToken { get; set; }

    public virtual DoctorProfile? DoctorProfile { get; set; }

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual PatientProfile? PatientProfile { get; set; }

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
