using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartClinic.Application.Patients;

namespace SmartClinic.API.Controllers;

[ApiController]
[Authorize(Policy = "PatientOnly")]
[Route("api/patients/me")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class PatientProfileController(IPatientProfileService profiles) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirst("sub")?.Value, out var userId)) return Unauthorized();
        var result = await profiles.GetAsync(userId, ct);
        return result is null ? NotFound() : Ok(result);
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
