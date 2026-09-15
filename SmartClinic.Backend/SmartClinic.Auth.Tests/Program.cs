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
