using System;
using System.Collections.Generic;

namespace SmartClinic.Domain.Entities;

public partial class MedicalRecord
{
    public Guid Id { get; set; }

    public Guid AppointmentId { get; set; }

    public string Diagnosis { get; set; } = null!;

    public string? ClinicalNotes { get; set; }

    public string? Prescription { get; set; }

    public virtual Appointment Appointment { get; set; } = null!;
}
