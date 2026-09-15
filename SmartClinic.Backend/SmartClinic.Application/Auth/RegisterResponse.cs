using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartClinic.Application.Auth
{
    public sealed record RegisterResponse(
        Guid UserId,
        string Email,
        string Role
        );
}
