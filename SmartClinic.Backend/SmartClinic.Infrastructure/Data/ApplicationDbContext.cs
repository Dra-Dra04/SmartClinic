using SmartClinic.Domain.Entities;
using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace SmartClinic.Infrastructure.Data;

public partial class ApplicationDbContext : DbContext
{
public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Appointment> Appointments { get; set; }

    public virtual DbSet<DoctorProfile> DoctorProfiles { get; set; }

    public virtual DbSet<KnowledgeDoc> KnowledgeDocs { get; set; }

    public virtual DbSet<MedicalRecord> MedicalRecords { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<PatientProfile> PatientProfiles { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<Specialty> Specialties { get; set; }

    public virtual DbSet<TimeSlot> TimeSlots { get; set; }

    public virtual DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Appointm__3214EC07E63F499D");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.AitriageSuggestion).HasColumnName("AITriageSuggestion");
            entity.Property(e => e.PaymentStatus).HasMaxLength(50);
            entity.Property(e => e.Status).HasMaxLength(50);

            entity.HasOne(d => d.Patient).WithMany(p => p.Appointments)
                .HasForeignKey(d => d.PatientId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Appointme__Patie__59063A47");

            entity.HasOne(d => d.TimeSlot).WithMany(p => p.Appointments)
                .HasForeignKey(d => d.TimeSlotId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Appointme__TimeS__59FA5E80");
        });

        modelBuilder.Entity<DoctorProfile>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__DoctorPr__1788CC4CF20C00F7");

            entity.Property(e => e.UserId).ValueGeneratedNever();
            entity.Property(e => e.ConsultationFee)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Specialty).WithMany(p => p.DoctorProfiles)
                .HasForeignKey(d => d.SpecialtyId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__DoctorPro__Speci__45F365D3");

            entity.HasOne(d => d.User).WithOne(p => p.DoctorProfile)
                .HasForeignKey<DoctorProfile>(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__DoctorPro__UserI__44FF419A");
        });

        modelBuilder.Entity<KnowledgeDoc>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Knowledg__3214EC07EE090711");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.IsVectorized).HasDefaultValue(false);
            entity.Property(e => e.Title).HasMaxLength(500);
            entity.Property(e => e.UploadedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
        });

        modelBuilder.Entity<MedicalRecord>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__MedicalR__3214EC0778E20271");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

            entity.HasOne(d => d.Appointment).WithMany(p => p.MedicalRecords)
                .HasForeignKey(d => d.AppointmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__MedicalRe__Appoi__5DCAEF64");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Notifica__3214EC07A8772791");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.IsRead).HasDefaultValue(false);
            entity.Property(e => e.Title).HasMaxLength(255);

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Notificat__UserI__4E88ABD4");
        });

        modelBuilder.Entity<PatientProfile>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__PatientP__1788CC4C39C464B1");

            entity.Property(e => e.UserId).ValueGeneratedNever();
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.AvatarUrl).HasMaxLength(500);
            entity.Property(e => e.BloodType).HasMaxLength(10);
            entity.Property(e => e.Dob)
                .HasColumnType("datetime")
                .HasColumnName("DOB");
            entity.Property(e => e.EmergencyContactName).HasMaxLength(255);
            entity.Property(e => e.EmergencyContactPhone).HasMaxLength(50);
            entity.Property(e => e.Ethnicity).HasMaxLength(100);
            entity.Property(e => e.FullName).HasMaxLength(100);
            entity.Property(e => e.Gender).HasMaxLength(20);
            entity.Property(e => e.HealthInsuranceExpiry).HasColumnType("datetime");
            entity.Property(e => e.HealthInsuranceNumber).HasMaxLength(100);
            entity.Property(e => e.IdentityCard).HasMaxLength(20);
            entity.Property(e => e.Occupation).HasMaxLength(255);

            entity.HasOne(d => d.User).WithOne(p => p.PatientProfile)
                .HasForeignKey<PatientProfile>(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__PatientPr__UserI__4222D4EF");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__RefreshT__3214EC078CCC98EF");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.ExpiresAt).HasColumnType("datetime");
            entity.Property(e => e.Token).HasMaxLength(255);

            entity.HasOne(d => d.User).WithMany(p => p.RefreshTokens)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__RefreshTo__UserI__4AB81AF0");
        });

        modelBuilder.Entity<Specialty>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Specialt__3214EC0795810B99");

            entity.Property(e => e.Name).HasMaxLength(255);
        });

        modelBuilder.Entity<TimeSlot>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__TimeSlot__3214EC07314E8967");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.EndTime).HasColumnType("datetime");
            entity.Property(e => e.IsBooked).HasDefaultValue(false);
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.StartTime).HasColumnType("datetime");

            entity.HasOne(d => d.Doctor).WithMany(p => p.TimeSlots)
                .HasForeignKey(d => d.DoctorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__TimeSlots__Docto__5441852A");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Users__3214EC079ED9029B");

            entity.HasIndex(e => e.Email, "UQ__Users__A9D10534AE710E00").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.DeviceToken).HasMaxLength(255);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.Role).HasMaxLength(50);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
