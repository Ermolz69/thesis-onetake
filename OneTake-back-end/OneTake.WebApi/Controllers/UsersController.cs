using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneTake.Application.DTOs.Users;
using OneTake.Application.Services;
using OneTake.WebApi.Extensions;

namespace OneTake.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProfile(Guid id)
        {
            var result = await _userService.GetProfileAsync(id);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [Authorize]
        [HttpPut("me/profile")]
        public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _userService.UpdateProfileAsync(userId, request);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }
    }
}

