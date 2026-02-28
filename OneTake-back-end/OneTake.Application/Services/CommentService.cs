using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using OneTake.Application.Common.Errors;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Comments;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;

namespace OneTake.Application.Services
{
    public interface ICommentService
    {
        Task<Result<List<CommentDto>>> GetCommentsByPostIdAsync(Guid postId, CancellationToken cancellationToken = default);
        Task<Result<CommentDto>> CreateCommentAsync(Guid postId, Guid userId, CreateCommentRequest request, CancellationToken cancellationToken = default);
        Task<Result> DeleteCommentAsync(Guid postId, Guid commentId, Guid userId, bool canDeleteAny, CancellationToken cancellationToken = default);
    }

    public class CommentService : ICommentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notificationService;

        public CommentService(IUnitOfWork unitOfWork, INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
        }

        public async Task<Result<List<CommentDto>>> GetCommentsByPostIdAsync(Guid postId, CancellationToken cancellationToken = default)
        {
            List<Comment> comments = await _unitOfWork.Comments.GetByPostIdWithUserAsync(postId);

            List<CommentDto> commentDtos = comments.Select(c => new CommentDto(
                c.Id,
                c.PostId,
                c.UserId,
                c.User?.Username ?? "Unknown",
                c.Text,
                c.CreatedAt
            )).ToList();

            return Result<List<CommentDto>>.Success(commentDtos);
        }

        public async Task<Result<CommentDto>> CreateCommentAsync(Guid postId, Guid userId, CreateCommentRequest request, CancellationToken cancellationToken = default)
        {
            Post? postExists = await _unitOfWork.Posts.GetByIdAsync(postId);
            if (postExists == null)
            {
                return Result<CommentDto>.Fail(new NotFoundError("POST_NOT_FOUND", "Post not found"));
            }

            Comment comment = new Comment
            {
                PostId = postId,
                UserId = userId,
                Text = request.Text
            };

            await _unitOfWork.Comments.AddAsync(comment);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            User? user = await _unitOfWork.Users.GetByIdAsync(userId);
            string username = user?.Username ?? "Someone";

            if (postExists.AuthorId != userId)
            {
                _ = _notificationService.CreateAsync(
                    postExists.AuthorId,
                    NotificationType.CommentOnPost,
                    "New comment",
                    $"{username} commented on your post",
                    "post",
                    postId);
            }

            return Result<CommentDto>.Success(new CommentDto(
                comment.Id,
                comment.PostId,
                comment.UserId,
                user?.Username ?? "Unknown",
                comment.Text,
                comment.CreatedAt
            ));
        }

        public async Task<Result> DeleteCommentAsync(Guid postId, Guid commentId, Guid userId, bool canDeleteAny, CancellationToken cancellationToken = default)
        {
            Comment? comment = await _unitOfWork.Comments.GetByIdAsync(commentId);
            if (comment == null || comment.PostId != postId)
            {
                return Result.Fail(new NotFoundError("COMMENT_NOT_FOUND", "Comment not found"));
            }

            Post? post = await _unitOfWork.Posts.GetByIdAsync(postId);
            if (post == null)
            {
                return Result.Fail(new NotFoundError("POST_NOT_FOUND", "Post not found"));
            }

            if (!canDeleteAny && comment.UserId != userId && post.AuthorId != userId)
            {
                return Result.Fail(new ForbiddenError("FORBIDDEN", "You do not have permission to delete this comment"));
            }

            _unitOfWork.Comments.Remove(comment);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
    }
}

