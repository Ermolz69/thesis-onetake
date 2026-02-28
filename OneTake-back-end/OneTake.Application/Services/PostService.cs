using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using OneTake.Application.Common.Errors;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Posts;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;

namespace OneTake.Application.Services
{
    public interface IPostService
    {
        Task<Result<PostDto>> CreatePostAsync(Guid userId, CreatePostRequest request, Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default);
        Task<Result<PostDto>> GetPostByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<Result<PagedPostResponse>> GetPostsAsync(string? tag, Guid? authorId, string? cursor, int pageSize, CancellationToken cancellationToken = default);
        Task<Result<PagedPostResponse>> SearchPostsAsync(string query, string? cursor, int pageSize, CancellationToken cancellationToken = default);
        Task<Result> DeletePostAsync(Guid id, Guid userId, bool canDelete, CancellationToken cancellationToken = default);
        Task<Result> LikePostAsync(Guid postId, Guid userId, CancellationToken cancellationToken = default);
        Task<Result> UnlikePostAsync(Guid postId, Guid userId, CancellationToken cancellationToken = default);
    }

    public class PostService : IPostService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IFileStorage _fileStorage;
        private readonly INotificationService _notificationService;

        public PostService(IUnitOfWork unitOfWork, IFileStorage fileStorage, INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _fileStorage = fileStorage;
            _notificationService = notificationService;
        }

        public async Task<Result<PostDto>> CreatePostAsync(Guid userId, CreatePostRequest request, Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default)
        {
            MediaType mediaType = contentType.StartsWith("video") ? MediaType.Video : MediaType.Audio;

            MediaObject media = await _fileStorage.SaveFileAsync(fileStream, fileName, mediaType);
            await _unitOfWork.MediaObjects.AddAsync(media);

            Visibility visibility = request.Visibility ?? Domain.Enums.Visibility.Public;
            Post post = new Post
            {
                AuthorId = userId,
                ContentText = request.ContentText,
                MediaType = mediaType,
                MediaId = media.Id,
                Media = media,
                Visibility = visibility
            };

            if (request.Tags != null)
            {
                foreach (string tagName in request.Tags)
                {
                    Tag tag = await _unitOfWork.Tags.GetOrCreateByNameAsync(tagName);
                    post.PostTags.Add(new PostTag { Tag = tag });
                }
            }

            await _unitOfWork.Posts.AddAsync(post);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            Result<PostDto> result = await GetPostByIdAsync(post.Id, cancellationToken);
            return result;
        }

        public async Task<Result<PostDto>> GetPostByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            Post? post = await _unitOfWork.Posts.GetByIdWithDetailsAsync(id);

            if (post == null)
            {
                return Result<PostDto>.Fail(new NotFoundError("POST_NOT_FOUND", "Post not found"));
            }

            int likes = await _unitOfWork.Reactions.CountByPostAndTypeAsync(id, ReactionType.Like);
            int comments = await _unitOfWork.Comments.CountByPostIdAsync(id);

            return Result<PostDto>.Success(new PostDto(
                post.Id,
                post.ContentText,
                post.Media?.Url ?? "",
                post.MediaType,
                post.Visibility,
                post.Author?.Username ?? "Unknown",
                post.AuthorId,
                post.CreatedAt,
                likes,
                comments,
                post.PostTags.Select(pt => pt.Tag!.Name).ToList()
            ));
        }

        public async Task<Result<PagedPostResponse>> GetPostsAsync(string? tag, Guid? authorId, string? cursor, int pageSize, CancellationToken cancellationToken = default)
        {
            List<Post> posts;
            bool hasMore;

            if (!string.IsNullOrEmpty(tag))
            {
                (List<Post> Posts, bool HasMore) result = await _unitOfWork.Posts.GetByTagWithCursorAsync(tag, cursor, pageSize);
                posts = result.Posts;
                hasMore = result.HasMore;

                if (authorId.HasValue)
                {
                    posts = posts.Where(p => p.AuthorId == authorId.Value).ToList();
                }
            }
            else if (authorId.HasValue)
            {
                (List<Post> Posts, bool HasMore) result = await _unitOfWork.Posts.GetByAuthorIdWithCursorAsync(authorId.Value, cursor, pageSize);
                posts = result.Posts;
                hasMore = result.HasMore;
            }
            else
            {
                (List<Post> Posts, bool HasMore) result = await _unitOfWork.Posts.GetPostsWithCursorAsync(cursor, pageSize);
                posts = result.Posts;
                hasMore = result.HasMore;
            }

            List<PostDto> postDtos = new List<PostDto>();
            foreach (Post post in posts)
            {
                int likeCount = await _unitOfWork.Reactions.CountByPostAndTypeAsync(post.Id, ReactionType.Like);
                int commentCount = await _unitOfWork.Comments.CountByPostIdAsync(post.Id);

                postDtos.Add(new PostDto(
                    post.Id,
                    post.ContentText,
                    post.Media?.Url ?? "",
                    post.MediaType,
                    post.Visibility,
                    post.Author?.Username ?? "Unknown",
                    post.AuthorId,
                    post.CreatedAt,
                    likeCount,
                    commentCount,
                    post.PostTags.Select(pt => pt.Tag!.Name).ToList()
                ));
            }

            string? nextCursor = null;
            if (hasMore && postDtos.Count > 0)
            {
                Post lastPost = posts.Last();
                nextCursor = $"{lastPost.CreatedAt:O}|{lastPost.Id}";
            }

            return Result<PagedPostResponse>.Success(new PagedPostResponse(postDtos, nextCursor, hasMore));
        }

        public async Task<Result<PagedPostResponse>> SearchPostsAsync(string query, string? cursor, int pageSize, CancellationToken cancellationToken = default)
        {
            (List<Post> posts, bool hasMore) = await _unitOfWork.Posts.SearchAsync(query, cursor, pageSize);
            List<PostDto> postDtos = new List<PostDto>();
            foreach (Post post in posts)
            {
                int likeCount = await _unitOfWork.Reactions.CountByPostAndTypeAsync(post.Id, ReactionType.Like);
                int commentCount = await _unitOfWork.Comments.CountByPostIdAsync(post.Id);
                postDtos.Add(new PostDto(
                    post.Id,
                    post.ContentText,
                    post.Media?.Url ?? "",
                    post.MediaType,
                    post.Visibility,
                    post.Author?.Username ?? "Unknown",
                    post.AuthorId,
                    post.CreatedAt,
                    likeCount,
                    commentCount,
                    post.PostTags.Select(pt => pt.Tag!.Name).ToList()
                ));
            }
            string? nextCursor = null;
            if (hasMore && posts.Count > 0)
            {
                Post lastPost = posts.Last();
                nextCursor = $"{lastPost.CreatedAt:O}|{lastPost.Id}";
            }
            return Result<PagedPostResponse>.Success(new PagedPostResponse(postDtos, nextCursor, hasMore));
        }

        public async Task<Result> DeletePostAsync(Guid id, Guid userId, bool canDelete, CancellationToken cancellationToken = default)
        {
            Post? post = await _unitOfWork.Posts.GetByIdAsync(id);
            if (post == null)
            {
                return Result.Fail(new NotFoundError("POST_NOT_FOUND", "Post not found"));
            }

            if (post.AuthorId != userId && !canDelete)
            {
                return Result.Fail(new ForbiddenError("FORBIDDEN", "You do not have permission to delete this post"));
            }

            if (post.MediaId.HasValue)
            {
                MediaObject? media = await _unitOfWork.MediaObjects.GetByIdAsync(post.MediaId.Value);
                if (media != null)
                {
                    await _fileStorage.DeleteFileAsync(media.Path);
                    _unitOfWork.MediaObjects.Remove(media);
                }
            }

            _unitOfWork.Posts.Remove(post);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Result.Success();
        }

        public async Task<Result> LikePostAsync(Guid postId, Guid userId, CancellationToken cancellationToken = default)
        {
            if (await _unitOfWork.Reactions.ExistsByPostAndUserAsync(postId, userId, ReactionType.Like))
            {
                return Result.Success();
            }

            Post? post = await _unitOfWork.Posts.GetByIdAsync(postId);
            Reaction reaction = new Reaction
            {
                PostId = postId,
                UserId = userId,
                Type = ReactionType.Like
            };
            await _unitOfWork.Reactions.AddAsync(reaction);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            if (post != null && post.AuthorId != userId)
            {
                _ = _notificationService.CreateAsync(
                    post.AuthorId,
                    Domain.Enums.NotificationType.LikeOnPost,
                    "New like",
                    "Someone liked your post",
                    "post",
                    postId);
            }

            return Result.Success();
        }

        public async Task<Result> UnlikePostAsync(Guid postId, Guid userId, CancellationToken cancellationToken = default)
        {
            Reaction? reaction = await _unitOfWork.Reactions.GetByPostAndUserAsync(postId, userId, ReactionType.Like);

            if (reaction != null)
            {
                _unitOfWork.Reactions.Remove(reaction);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }

            return Result.Success();
        }
    }
}
