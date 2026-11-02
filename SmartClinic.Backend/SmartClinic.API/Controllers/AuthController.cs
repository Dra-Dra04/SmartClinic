using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SmartClinic.Application.Auth;
namespace SmartClinic.API.Controllers;
[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken ct)
    {
        var result = await authService.RegisterAsync(request, ct);
        return result.IsSuccess ? StatusCode(201, result.Value) : Failure(result.Error!.Value, result.Message);
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken ct)
    {
        var result = await authService.LoginAsync(request, ct);
        return result.IsSuccess ? Ok(result.Value) : Failure(result.Error!.Value, result.Message);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirst("sub")?.Value, out var userId)) return Unauthorized();
        var result = await authService.GetCurrentUserAsync(userId, ct);
        return result.IsSuccess ? Ok(result.Value) : Failure(result.Error!.Value, result.Message);
    }

    private ObjectResult Failure(AuthError error, string? message)
    {
        var status = error switch { AuthError.Validation => 400, AuthError.EmailAlreadyExists => 409, _ => 401 };
        var problem = new ProblemDetails { Status = status, Title = message };
        problem.Extensions["code"] = error.ToString();
        return new ObjectResult(problem) { StatusCode = status };
    }
}
