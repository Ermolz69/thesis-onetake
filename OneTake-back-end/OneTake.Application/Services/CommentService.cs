using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using OneTake.Application.Common.Errors;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Comments;
using OneTake.Domain.Entities;

namespace OneTake.Application.Services
{
    public interface ICommentService
    {
        Task<Result<List<CommentDto>>> GetCommentsByPostIdAsync(Guid postId);
        Task<Result<CommentDto>> CreateCommentAsync(Guid postId, Guid userId, CreateCommentRequest request);
    }

    public class CommentService : ICommentService
    {
        private readonly IUnitOfWork _unitOfWork;

        public CommentService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<Result<List<CommentDto>>> GetCommentsByPostIdAsync(Guid postId)
        {
            var comments = await _unitOfWork.Comments.GetByPostIdWithUserAsync(postId);

            var commentDtos = comments.Select(c => new CommentDto(
                c.Id,
                c.PostId,
                c.UserId,
                c.User?.Username ?? "Unknown",
                c.Text,
                c.CreatedAt
            )).ToList();

            return Result<List<CommentDto>>.Success(commentDtos);
        }

        public async Task<Result<CommentDto>> CreateCommentAsync(Guid postId, Guid userId, CreateCommentRequest request)
        {
            var postExists = await _unitOfWork.Posts.GetByIdAsync(postId);
            if (postExists == null)
            {
                return Result<CommentDto>.Fail(new NotFoundError("POST_NOT_FOUND", "Post not found"));
            }

            var comment = new Comment
            {
                PostId = postId,
                UserId = userId,
                Text = request.Text
            };

            await _unitOfWork.Comments.AddAsync(comment);
            await _unitOfWork.SaveChangesAsync();

            var user = await _unitOfWork.Users.GetByIdAsync(userId);

            return Result<CommentDto>.Success(new CommentDto(
                comment.Id,
                comment.PostId,
                comment.UserId,
                user?.Username ?? "Unknown",
                comment.Text,
                comment.CreatedAt
            ));
        }
    }
}

