using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneTake.Application.Services;
using OneTake.Domain.Enums;
using OneTake.WebApi.Extensions;

namespace OneTake.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var result = await _adminService.GetAllUsersAsync();
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(Guid id, [FromBody] UserRole newRole)
        {
            var result = await _adminService.UpdateUserRoleAsync(id, newRole);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }
    }
}

