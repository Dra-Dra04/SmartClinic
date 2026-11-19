using System.ComponentModel.DataAnnotations;
using SmartClinic.Application.Abstractions;
using SmartClinic.Domain.Constants;
using SmartClinic.Domain.Entities;

namespace SmartClinic.Application.Patients;

public sealed record UpdatePatientProfileRequest
{
    public UpdatePatientProfileRequest() : this(null!, null!, default, null!, null, null, null!, null, null, null, null, null) { }

    [Required, StringLength(100)]
    public string FullName { get; init; }
    [Required, RegularExpression(@"^\+?[0-9]{9,15}$")]
    public string Phone { get; init; }
    public DateOnly DateOfBirth { get; init; }
    [Required, RegularExpression("^(Nam|Nữ|Khác)$")]
    public string Gender { get; init; }
    [StringLength(20)]
    public string? IdCardNumber { get; init; }
    [StringLength(100)]
    public string? HealthInsuranceNumber { get; init; }
    [Required, StringLength(500)]
    public string Address { get; init; }
    [Range(typeof(decimal), "0.01", "9999.99")]
    public decimal? HeightCm { get; init; }
    [Range(typeof(decimal), "0.01", "9999.99")]
    public decimal? WeightKg { get; init; }
    [RegularExpression("^(A[+-]|B[+-]|AB[+-]|O[+-]|Chưa rõ)$")]
    public string? BloodType { get; init; }
    [StringLength(4000)]
    public string? Allergies { get; init; }
    [StringLength(4000)]
    public string? MedicalHistory { get; init; }

    public UpdatePatientProfileRequest(string FullName, string Phone, DateOnly DateOfBirth, string Gender, string? IdCardNumber, string? HealthInsuranceNumber, string Address, decimal? HeightCm, decimal? WeightKg, string? BloodType, string? Allergies, string? MedicalHistory)
    {
        this.FullName = FullName;
        this.Phone = Phone;
        this.DateOfBirth = DateOfBirth;
        this.Gender = Gender;
        this.IdCardNumber = IdCardNumber;
        this.HealthInsuranceNumber = HealthInsuranceNumber;
        this.Address = Address;
        this.HeightCm = HeightCm;
        this.WeightKg = WeightKg;
        this.BloodType = BloodType;
        this.Allergies = Allergies;
        this.MedicalHistory = MedicalHistory;
    }
}

public sealed record PatientProfileResponse(Guid Id, string Email, string Phone,
    string? FullName, DateOnly? DateOfBirth, string? Gender, string? IdCardNumber,
    string? HealthInsuranceNumber, string? Address, decimal? HeightCm, decimal? WeightKg,
    string? BloodType, string? Allergies, string? MedicalHistory, bool IsProfileCompleted,
    string? AvatarUrl = null);

public interface IPatientProfileService
{
    Task<PatientProfileResponse?> GetAsync(Guid userId, CancellationToken ct);
    Task<PatientProfileResponse?> UpdateAsync(Guid userId, UpdatePatientProfileRequest request, CancellationToken ct);
    Task<string?> UploadAvatarAsync(Guid userId, Stream content, long length, CancellationToken ct);
}

public sealed class PatientProfileService(IUserRepository users, IUnitOfWork unitOfWork, TimeProvider clock, IAvatarStorage avatars)
    : IPatientProfileService
{
    public async Task<PatientProfileResponse?> GetAsync(Guid userId, CancellationToken ct)
    {
        var user = await users.FindByIdAsync(userId, ct);
        return user?.Role == UserRole.Patient ? Map(user) : null;
    }

    public async Task<PatientProfileResponse?> UpdateAsync(Guid userId, UpdatePatientProfileRequest request, CancellationToken ct)
    {
        Validator.ValidateObject(request, new ValidationContext(request), validateAllProperties: true);
        // The clinic's business date is in Vietnam (UTC+7), independent of server timezone.
        var today = DateOnly.FromDateTime(clock.GetUtcNow().ToOffset(TimeSpan.FromHours(7)).DateTime);
        if (request.DateOfBirth == default || request.DateOfBirth > today)
            throw new ValidationException("Ngày sinh không hợp lệ hoặc ở tương lai.");
        if (string.IsNullOrWhiteSpace(request.IdCardNumber) && string.IsNullOrWhiteSpace(request.HealthInsuranceNumber))
            throw new ValidationException("Cần nhập CCCD hoặc BHYT để hoàn thiện hồ sơ.");
        var user = await users.FindByIdAsync(userId, ct);
        if (user?.Role != UserRole.Patient) return null;
        var profile = user.PatientProfile ??= new PatientProfile { UserId = user.Id, User = user };
        profile.FullName = request.FullName.Trim();
        user.PhoneNumber = request.Phone.Trim();
        profile.Dob = request.DateOfBirth.ToDateTime(TimeOnly.MinValue);
        profile.Gender = request.Gender;
        profile.IdentityCard = Clean(request.IdCardNumber);
        profile.HealthInsuranceNumber = Clean(request.HealthInsuranceNumber);
        profile.Address = request.Address.Trim();
        profile.HeightCm = request.HeightCm;
        profile.WeightKg = request.WeightKg;
        profile.BloodType = Clean(request.BloodType);
        profile.Allergies = Clean(request.Allergies);
        profile.BackgroundDisease = Clean(request.MedicalHistory);
        await unitOfWork.SaveChangesAsync(ct);
        return Map(user);
    }

    public async Task<string?> UploadAvatarAsync(Guid userId, Stream content, long length, CancellationToken ct)
    {
        var user = await users.FindByIdAsync(userId, ct);
        if (user?.Role != UserRole.Patient) return null;
        var stored = await avatars.StoreAsync(userId, content, length, ct);
        if (stored is null) throw new ValidationException("Ảnh không hợp lệ hoặc vượt quá 5 MB.");
        user.PatientProfile ??= new PatientProfile { UserId = user.Id, User = user };
        user.PatientProfile.AvatarUrl = $"/api/patients/me/avatar?v={Guid.NewGuid():N}";
        await unitOfWork.SaveChangesAsync(ct);
        return user.PatientProfile.AvatarUrl;
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static PatientProfileResponse Map(User user)
    {
        var p = user.PatientProfile;
        var completed = p is not null && !string.IsNullOrWhiteSpace(p.FullName) && p.Dob.HasValue &&
            !string.IsNullOrWhiteSpace(p.Gender) && !string.IsNullOrWhiteSpace(user.PhoneNumber) &&
            !string.IsNullOrWhiteSpace(p.Address) &&
            (!string.IsNullOrWhiteSpace(p.IdentityCard) || !string.IsNullOrWhiteSpace(p.HealthInsuranceNumber));
        return new(user.Id, user.Email, user.PhoneNumber, p?.FullName,
            p?.Dob is DateTime dob ? DateOnly.FromDateTime(dob) : null, p?.Gender, p?.IdentityCard,
            p?.HealthInsuranceNumber, p?.Address, p?.HeightCm, p?.WeightKg,
            p?.BloodType, p?.Allergies, p?.BackgroundDisease, completed, p?.AvatarUrl);
    }
}
