using System;
using System.Collections.Generic;

namespace SmartClinic.Domain.Entities;
public partial class Appointment
{
    public Guid Id { get; set; }

    public Guid PatientId { get; set; }

    public Guid TimeSlotId { get; set; }

    public string Status { get; set; } = null!;

    public string? Symptom { get; set; }

    public string? AitriageSuggestion { get; set; }

    public string? PaymentStatus { get; set; }

    public virtual ICollection<MedicalRecord> MedicalRecords { get; set; } = new List<MedicalRecord>();

    public virtual PatientProfile Patient { get; set; } = null!;

    public virtual TimeSlot TimeSlot { get; set; } = null!;
}
