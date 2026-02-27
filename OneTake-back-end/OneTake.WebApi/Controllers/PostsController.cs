using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneTake.Application.Common.Errors;
using OneTake.Application.DTOs.Posts;
using OneTake.Application.Services;
using OneTake.WebApi.Extensions;

namespace OneTake.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostsController : ControllerBase
    {
        private readonly IPostService _postService;

        public PostsController(IPostService postService)
        {
            _postService = postService;
        }

        [HttpGet]
        public async Task<IActionResult> GetPosts([FromQuery] string? tag, [FromQuery] Guid? authorId, [FromQuery] string? cursor, [FromQuery] int pageSize = 10)
        {
            var result = await _postService.GetPostsAsync(tag, authorId, cursor, pageSize);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPost(Guid id)
        {
            var result = await _postService.GetPostByIdAsync(id);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreatePost([FromForm] CreatePostRequest request, IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                var error = new ValidationError("FILE_REQUIRED", "File is required");
                return error.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
            }

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            using var stream = file.OpenReadStream();
            var result = await _postService.CreatePostAsync(userId, request, stream, file.FileName, file.ContentType);
            
            return result.Match(
                success => CreatedAtAction(nameof(GetPost), new { id = success.Id }, success),
                error => error.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method)
            );
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePost(Guid id)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var role = User.FindFirstValue("role");
            var canDelete = role == "Admin" || role == "Moderator";

            var result = await _postService.DeletePostAsync(id, userId, canDelete);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [Authorize]
        [HttpPost("{id}/like")]
        public async Task<IActionResult> LikePost(Guid id)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _postService.LikePostAsync(id, userId);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [Authorize]
        [HttpDelete("{id}/like")]
        public async Task<IActionResult> UnlikePost(Guid id)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _postService.UnlikePostAsync(id, userId);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }
    }
}

