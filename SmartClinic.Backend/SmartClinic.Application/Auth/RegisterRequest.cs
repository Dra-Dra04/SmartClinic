using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartClinic.Application.Auth
{
    public sealed record RegisterRequest(
        string Email,
        string Password,
        string ConfirmPassword,
        string PhoneNumber);
}
