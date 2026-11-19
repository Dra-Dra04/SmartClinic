using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartClinic.Application.Patients;
using SmartClinic.Application.Abstractions;
using SmartClinic.API.Media;

namespace SmartClinic.API.Controllers;

[ApiController]
[Authorize(Policy = "PatientOnly")]
[Route("api/patients/me")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class PatientProfileController(IPatientProfileService profiles, IAvatarStorage avatars) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirst("sub")?.Value, out var userId)) return Unauthorized();
        var result = await profiles.GetAsync(userId, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("avatar")]
    [RequestSizeLimit(AvatarStorage.MaxBytes + 65536)]
    [RequestFormLimits(MultipartBodyLengthLimit = AvatarStorage.MaxBytes)]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file, CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirst("sub")?.Value, out var userId)) return Unauthorized();
        if (file is null) return BadRequest(new { message = "Vui lòng chọn file ảnh." });
        try
        {
            await using var stream = file.OpenReadStream();
            var url = await profiles.UploadAvatarAsync(userId, stream, file.Length, ct);
            return url is null ? NotFound() : Ok(new { avatarUrl = url });
        }
        catch (ValidationException error)
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = error.Message });
        }
    }

    [HttpGet("avatar")]
    public IActionResult Avatar()
    {
        if (!Guid.TryParse(User.FindFirst("sub")?.Value, out var userId)) return Unauthorized();
        var stream = avatars.Open(userId, out var contentType);
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return stream is null ? NotFound() : File(stream, contentType);
    }

    [HttpPut]
    public async Task<IActionResult> Update(UpdatePatientProfileRequest request, CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirst("sub")?.Value, out var userId)) return Unauthorized();
        try
        {
            var result = await profiles.UpdateAsync(userId, request, ct);
            return result is null ? NotFound() : Ok(result);
        }
        catch (ValidationException error)
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = error.Message });
        }
    }
}
