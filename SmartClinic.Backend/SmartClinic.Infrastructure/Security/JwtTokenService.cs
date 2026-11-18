using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SmartClinic.Application.Abstractions;
using SmartClinic.Domain.Entities;
namespace SmartClinic.Infrastructure.Security;
public sealed class JwtTokenService(IOptions<JwtOptions> options, TimeProvider clock) : ITokenService
{
    public AccessToken CreateAccessToken(User user)
    {
        var settings = options.Value;
        var now = clock.GetUtcNow().UtcDateTime;
        var expires = now.AddMinutes(settings.AccessTokenMinutes);
        List<Claim> claims = [new("sub", user.Id.ToString()), new("email", user.Email),
            new("role", user.Role), new("jti", Guid.NewGuid().ToString())];
        if (user.SessionVersion is Guid version)
            claims.Add(new("session_version", version.ToString()));
        var token = new JwtSecurityToken(settings.Issuer, settings.Audience, claims,
            now, expires, new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.SigningKey)),
                SecurityAlgorithms.HmacSha256));
        return new(new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}