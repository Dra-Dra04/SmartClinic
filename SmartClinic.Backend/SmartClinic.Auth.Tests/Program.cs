using System.ComponentModel.DataAnnotations;
using SmartClinic.Application.Patients;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SmartClinic.Application.Abstractions;
using SmartClinic.Application.Auth;
using SmartClinic.Domain.Constants;
using SmartClinic.Domain.Entities;
using SmartClinic.Infrastructure.Security;

// Small executable regression suite: no real database or persistent accounts.
var store = new MemoryStore();
var passwords = new PasswordService();
var settings = new JwtOptions { SigningKey = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(48)) };
var tokens = new JwtTokenService(Options.Create(settings), TimeProvider.System);
var service = new AuthService(store, store, passwords, tokens);
const string password = "a-long-test-password";
int passed = 0;
void Check(bool condition, string name)
{
    if (!condition) throw new Exception("FAIL: " + name);
    Console.WriteLine("PASS: " + name);
    passed++;
}

var invalid = await service.RegisterAsync(new("bad-email", password, password, "0912345678"));
Check(invalid.Error == AuthError.Validation && store.Users.Count == 0, "Invalid email does not create user");
Check((await service.RegisterAsync(new("p@example.com", "short", "short", "0912345678"))).Error == AuthError.Validation, "Short password rejected");
Check((await service.RegisterAsync(new("p@example.com", password, "different", "0912345678"))).Error == AuthError.Validation, "Confirmation mismatch rejected");
foreach (var badPhone in new string?[] { null, "", "   ", "12345", "09123abc78", "+", "1234567890123456", "0912 345678" })
{
    Check((await service.RegisterAsync(new("phone@example.com", password, password, badPhone!))).Error == AuthError.Validation
        && store.Users.Count == 0, "Invalid phone rejected before saving: " + (badPhone ?? "null"));
}
var register = await service.RegisterAsync(new("  Patient@Example.com  ", password, password, " 0912345678 "));
var user = store.Users.Single();
Check(user.PhoneNumber == "0912345678", "Registration trims and stores phone, preserving leading zero");
var phoneStore = new MemoryStore();
var phoneService = new AuthService(phoneStore, phoneStore, passwords, tokens);
Check((await phoneService.RegisterAsync(new("international@example.com", password, password, "+84912345678"))).IsSuccess
    && phoneStore.Users.Single().PhoneNumber == "+84912345678", "International phone prefix preserved");
Check((await phoneService.RegisterAsync(new("family@example.com", password, password, "+84912345678"))).IsSuccess,
    "Family members may share a contact phone");
Check(register.IsSuccess && user.Email == "patient@example.com", "Registration normalizes email");
Check(user.Role == UserRole.Patient && user.PatientProfile?.UserId == user.Id, "Registration creates Patient and linked profile");
Check(user.PasswordHash != password && passwords.Verify(user, password) != PasswordCheckResult.Failed, "Password is hashed and verifiable");
Check((await service.RegisterAsync(new("PATIENT@example.com", password, password, "0912345678"))).Error == AuthError.EmailAlreadyExists, "Duplicate email rejected");
store.DuplicateOnSave = true;
Check((await service.RegisterAsync(new("race@example.com", password, password, "0912345678"))).Error == AuthError.EmailAlreadyExists, "Database duplicate race becomes application error");
store.DuplicateOnSave = false;
var wrong = await service.LoginAsync(new(user.Email, "wrong-password"));
var missing = await service.LoginAsync(new("missing@example.com", password));
Check(wrong.Error == AuthError.InvalidCredentials && missing.Error == wrong.Error && missing.Message == wrong.Message, "Unknown email and wrong password share error");
Check(passwords.Verify(null, password) == PasswordCheckResult.Failed, "Missing user cannot authenticate");
var login = await service.LoginAsync(new(" PATIENT@example.com ", password));
Check(login.IsSuccess && login.Value!.UserId == user.Id, "Login succeeds with normalized email");
var validator = new JwtSecurityTokenHandler { MapInboundClaims = false };
TokenValidationParameters Validation(string key) => new()
{
    ValidateIssuer = true, ValidIssuer = settings.Issuer,
    ValidateAudience = true, ValidAudience = settings.Audience,
    ValidateLifetime = true, RequireExpirationTime = true,
    ValidateIssuerSigningKey = true,
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
    ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
    RoleClaimType = "role", NameClaimType = "sub", ClockSkew = TimeSpan.Zero
};
var principal = validator.ValidateToken(login.Value!.AccessToken, Validation(settings.SigningKey), out _);
Check(principal.FindFirst("sub")?.Value == user.Id.ToString() && principal.IsInRole(UserRole.Patient) && !principal.IsInRole(UserRole.Admin), "Signed JWT contains correct identity and role");
bool Rejects(string token, TokenValidationParameters parameters)
{
    try { validator.ValidateToken(token, parameters, out _); return false; }
    catch (SecurityTokenException) { return true; }
}
Check(Rejects(login.Value.AccessToken, Validation(new string('x', 64))), "Wrong signing key rejected");
var wrongAudience = Validation(settings.SigningKey);
wrongAudience.ValidAudience = "other-client";
Check(Rejects(login.Value.AccessToken, wrongAudience), "Wrong audience rejected");
var expiredService = new JwtTokenService(Options.Create(settings), new PastClock());
Check(Rejects(expiredService.CreateAccessToken(user).Value, Validation(settings.SigningKey)), "Expired token rejected");
user.Role = UserRole.Doctor;
var doctorLogin = await service.LoginAsync(new(user.Email, password));
var doctor = validator.ValidateToken(doctorLogin.Value!.AccessToken, Validation(settings.SigningKey), out _);
Check(doctor.IsInRole(UserRole.Doctor) && !doctor.IsInRole(UserRole.Patient), "Role is read from database on each login");
user.DoctorProfile = new DoctorProfile { UserId = user.Id, Specialty = new Specialty { Name = "Test", WorkspaceType = "ClinicalService" } };
Check((await service.LoginAsync(new(user.Email, password))).Value?.DoctorWorkspace == "ClinicalService", "Login exposes specialty workspace");
Check((await service.GetCurrentUserAsync(user.Id)).Value?.DoctorWorkspace == "ClinicalService", "Session restore exposes specialty workspace");
user.DoctorProfile = null;
user.Role = UserRole.Receptionist;
var receptionistLogin = await service.LoginAsync(new(user.Email, password));
Check(receptionistLogin.IsSuccess, "Receptionist can log in");
var receptionist = validator.ValidateToken(receptionistLogin.Value!.AccessToken, Validation(settings.SigningKey), out _);
Check(receptionist.IsInRole(UserRole.Receptionist) && !receptionist.IsInRole(UserRole.Admin), "Receptionist JWT has only its assigned role");
user.IsActive = false;
Check((await service.LoginAsync(new(user.Email, password))).Error == AuthError.InvalidCredentials,
    "Locked account cannot sign in with its correct password");
user.IsActive = true;
user.SessionVersion = Guid.NewGuid();
var unlocked = await service.LoginAsync(new(user.Email, password));
Check(unlocked.IsSuccess &&
    validator.ValidateToken(unlocked.Value!.AccessToken, Validation(settings.SigningKey), out _)
        .FindFirst("session_version")?.Value == user.SessionVersion.ToString(),
    "Unlocked account receives a token with the current session version");
user.Role = "unknown";
Check((await service.LoginAsync(new(user.Email, password))).Error == AuthError.InvalidCredentials, "Unknown role cannot receive a token");
Check((await service.GetCurrentUserAsync(Guid.NewGuid())).Error == AuthError.UserNotFound, "Deleted or unknown user rejected by me");
Check((await service.GetCurrentUserAsync(user.Id)).Value?.UserId == user.Id, "Me returns account DTO");

// Exercise the rehash branch independently from current hasher defaults.
var rehash = new RehashPasswords();
user.Role = UserRole.Patient;
var rehashService = new AuthService(store, store, rehash, tokens);
var savesBefore = store.Saves;
Check((await rehashService.LoginAsync(new(user.Email, password))).IsSuccess &&
    user.PasswordHash == "upgraded-hash" && store.Saves == savesBefore + 1, "Successful login upgrades an outdated password hash");
// Profile regressions use the same fake repository; no production database writes.
var profiles = new PatientProfileService(store, store, TimeProvider.System);
var initialProfile = await profiles.GetAsync(user.Id, default);
Check(initialProfile is { IsProfileCompleted: false }, "Empty registered profile is incomplete");
var validProfile = new UpdatePatientProfileRequest(" Nguyễn Văn Test ", "0912345678",
    new DateOnly(2000, 1, 2), "Nam", "012345678901", null, " Địa chỉ test ",
    170.25m, 65.5m, null, " Dị ứng test ", null);
var savedProfile = await profiles.UpdateAsync(user.Id, validProfile, default);
Check(savedProfile is { IsProfileCompleted: true, HeightCm: 170.25m, WeightKg: 65.5m }
    && savedProfile.FullName == "Nguyễn Văn Test", "Profile persists measurements and trims fields");
Check((await profiles.GetAsync(user.Id, default))?.Id == user.Id,
    "Profile read is scoped to the requested identity");
Check(await profiles.GetAsync(Guid.NewGuid(), default) is null, "Unknown identity cannot read profile");
async Task RejectProfile(UpdatePatientProfileRequest request, string name)
{
    var before = store.Saves;
    try { await profiles.UpdateAsync(user.Id, request, default); Check(false, name); }
    catch (ValidationException) { Check(store.Saves == before, name); }
}
await RejectProfile(validProfile with { IdCardNumber = " ", HealthInsuranceNumber = null },
    "Missing both identity documents rejected before save");
await RejectProfile(validProfile with { DateOfBirth = new DateOnly(2999, 1, 1) }, "Future birthdate rejected");
await RejectProfile(validProfile with { FullName = " " }, "Whitespace name rejected");
await RejectProfile(validProfile with { Phone = "abc" }, "Invalid contact phone rejected");
await RejectProfile(validProfile with { Gender = "invalid" }, "Invalid gender rejected");
await RejectProfile(validProfile with { WeightKg = -1 }, "Negative measurement rejected");
var withInsurance = await profiles.UpdateAsync(user.Id,
    validProfile with { IdCardNumber = null, HealthInsuranceNumber = "BHYT-test", HeightCm = null, WeightKg = null }, default);
Check(withInsurance is { IsProfileCompleted: true, HeightCm: null, WeightKg: null },
    "Insurance alone satisfies identity gate and measurements may remain unknown");
user.Role = UserRole.Doctor;
Check(await profiles.GetAsync(user.Id, default) is null &&
    await profiles.UpdateAsync(user.Id, validProfile, default) is null,
    "Non-patient account cannot use patient profile service");
user.Role = UserRole.Patient;
Console.WriteLine($"All {passed} checks passed.");

sealed class MemoryStore : IUserRepository, IUnitOfWork
{
    public List<User> Users { get; } = [];
    public bool DuplicateOnSave { get; set; }
    public int Saves { get; private set; }
    public Task<User?> FindByEmailAsync(string email, CancellationToken ct = default) =>
        Task.FromResult(Users.SingleOrDefault(user => user.Email == email));
    public Task<User?> FindByIdAsync(Guid id, CancellationToken ct = default) =>
        Task.FromResult(Users.SingleOrDefault(user => user.Id == id));
    public void Add(User user) => Users.Add(user);
    public Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        if (DuplicateOnSave) throw new DuplicateEmailException(new Exception("simulated unique constraint"));
        Saves++;
        return Task.FromResult(1);
    }
}
sealed class PastClock : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => DateTimeOffset.UtcNow.AddHours(-1);
}
sealed class RehashPasswords : IPasswordService
{
    public string Hash(User user, string password) => "upgraded-hash";
    public PasswordCheckResult Verify(User? user, string password) => PasswordCheckResult.SuccessRehashNeeded;
}
