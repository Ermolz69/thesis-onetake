using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneTake.Application.DTOs.Comments;
using OneTake.Application.Services;
using OneTake.WebApi.Extensions;

namespace OneTake.WebApi.Controllers
{
    [ApiController]
    [Route("api/posts/{postId}/comments")]
    public class CommentsController : ControllerBase
    {
        private readonly ICommentService _commentService;

        public CommentsController(ICommentService commentService)
        {
            _commentService = commentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetComments(Guid postId)
        {
            var result = await _commentService.GetCommentsByPostIdAsync(postId);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddComment(Guid postId, CreateCommentRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _commentService.CreateCommentAsync(postId, userId, request);
            return result.ToActionResult(HttpContext.TraceIdentifier, Request.Path, Request.Method);
        }
    }
}

