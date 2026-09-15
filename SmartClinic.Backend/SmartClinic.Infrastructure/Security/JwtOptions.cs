namespace SmartClinic.Infrastructure.Security;
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";
    public string Issuer { get; set; } = "SmartClinic";
    public string Audience { get; set; } = "SmartClinic.Client";
    public string SigningKey { get; set; } = "";
    public int AccessTokenMinutes { get; set; } = 15;
}