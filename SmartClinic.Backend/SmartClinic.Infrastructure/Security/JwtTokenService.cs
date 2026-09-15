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
        var token = new JwtSecurityToken(settings.Issuer, settings.Audience,
            [new Claim("sub", user.Id.ToString()), new Claim("email", user.Email),
             new Claim("role", user.Role), new Claim("jti", Guid.NewGuid().ToString())],
            now, expires, new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.SigningKey)),
                SecurityAlgorithms.HmacSha256));
        return new(new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}