using Microsoft.EntityFrameworkCore;
using SmartClinic.Domain.Entities;

namespace SmartClinic.Infrastructure.Data;

public partial class ApplicationDbContext
{
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<DoctorSchedule> DoctorSchedules => Set<DoctorSchedule>();

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Department>().ToTable("Departments");
        modelBuilder.Entity<Department>().Property(x => x.Code).HasMaxLength(50).IsUnicode(false);
        modelBuilder.Entity<Department>().Property(x => x.Name).HasMaxLength(200);
        modelBuilder.Entity<DoctorSchedule>().ToTable("DoctorSchedules");
        modelBuilder.Entity<DoctorSchedule>().Property(x => x.Room).HasMaxLength(100);
        modelBuilder.Entity<DoctorSchedule>().HasOne<DoctorProfile>().WithMany().HasForeignKey(x => x.DoctorId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<TimeSlot>().HasOne<DoctorSchedule>().WithMany().HasForeignKey(x => x.ScheduleId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<DoctorProfile>().HasOne<Department>().WithMany().HasForeignKey(x => x.PrimaryDepartmentId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<DoctorProfile>().Property(x => x.Title).HasMaxLength(150);
        modelBuilder.Entity<DoctorProfile>().Property(x => x.Position).HasMaxLength(255);
        modelBuilder.Entity<DoctorProfile>().Property(x => x.PhotoContentType).HasMaxLength(50);
    }
}
