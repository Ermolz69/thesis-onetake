using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
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
        Task<Result<PostDto>> CreatePostAsync(Guid userId, CreatePostRequest request, Stream fileStream, string fileName, string contentType);
        Task<Result<PostDto>> GetPostByIdAsync(Guid id);
        Task<Result<PagedPostResponse>> GetPostsAsync(string? tag, Guid? authorId, string? cursor, int pageSize);
        Task<Result> DeletePostAsync(Guid id, Guid userId, bool canDelete);
        Task<Result> LikePostAsync(Guid postId, Guid userId);
        Task<Result> UnlikePostAsync(Guid postId, Guid userId);
    }

    public class PostService : IPostService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IFileStorage _fileStorage;

        public PostService(IUnitOfWork unitOfWork, IFileStorage fileStorage)
        {
            _unitOfWork = unitOfWork;
            _fileStorage = fileStorage;
        }

        public async Task<Result<PostDto>> CreatePostAsync(Guid userId, CreatePostRequest request, Stream fileStream, string fileName, string contentType)
        {
            MediaType mediaType = contentType.StartsWith("video") ? MediaType.Video : MediaType.Audio;
            
            var media = await _fileStorage.SaveFileAsync(fileStream, fileName, mediaType);
            await _unitOfWork.MediaObjects.AddAsync(media);

            var post = new Post
            {
                AuthorId = userId,
                ContentText = request.ContentText,
                MediaType = mediaType,
                MediaId = media.Id,
                Media = media
            };

            if (request.Tags != null)
            {
                foreach (var tagName in request.Tags)
                {
                    var tag = await _unitOfWork.Tags.GetOrCreateByNameAsync(tagName);
                    post.PostTags.Add(new PostTag { Tag = tag });
                }
            }

            await _unitOfWork.Posts.AddAsync(post);
            await _unitOfWork.SaveChangesAsync();

            var result = await GetPostByIdAsync(post.Id);
            return result;
        }

        public async Task<Result<PostDto>> GetPostByIdAsync(Guid id)
        {
            var post = await _unitOfWork.Posts.GetByIdWithDetailsAsync(id);

            if (post == null)
                return Result<PostDto>.Fail(new NotFoundError("POST_NOT_FOUND", "Post not found"));

            var likes = await _unitOfWork.Reactions.CountByPostAndTypeAsync(id, ReactionType.Like);
            var comments = await _unitOfWork.Comments.CountByPostIdAsync(id);

            return Result<PostDto>.Success(new PostDto(
                post.Id,
                post.ContentText,
                post.Media?.Url ?? "",
                post.MediaType,
                post.Author?.Username ?? "Unknown",
                post.AuthorId,
                post.CreatedAt,
                likes,
                comments,
                post.PostTags.Select(pt => pt.Tag!.Name).ToList()
            ));
        }

        public async Task<Result<PagedPostResponse>> GetPostsAsync(string? tag, Guid? authorId, string? cursor, int pageSize)
        {
            List<Post> posts;
            bool hasMore;

            if (!string.IsNullOrEmpty(tag))
            {
                var result = await _unitOfWork.Posts.GetByTagWithCursorAsync(tag, cursor, pageSize);
                posts = result.Posts;
                hasMore = result.HasMore;

                if (authorId.HasValue)
                {
                    posts = posts.Where(p => p.AuthorId == authorId.Value).ToList();
                }
            }
            else if (authorId.HasValue)
            {
                var result = await _unitOfWork.Posts.GetByAuthorIdWithCursorAsync(authorId.Value, cursor, pageSize);
                posts = result.Posts;
                hasMore = result.HasMore;
            }
            else
            {
                var result = await _unitOfWork.Posts.GetPostsWithCursorAsync(cursor, pageSize);
                posts = result.Posts;
                hasMore = result.HasMore;
            }

            var postDtos = new List<PostDto>();
            foreach (var post in posts)
            {
                var likeCount = await _unitOfWork.Reactions.CountByPostAndTypeAsync(post.Id, ReactionType.Like);
                var commentCount = await _unitOfWork.Comments.CountByPostIdAsync(post.Id);

                postDtos.Add(new PostDto(
                    post.Id,
                    post.ContentText,
                    post.Media?.Url ?? "",
                    post.MediaType,
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
                var lastPost = posts.Last();
                nextCursor = $"{lastPost.CreatedAt:O}|{lastPost.Id}";
            }

            return Result<PagedPostResponse>.Success(new PagedPostResponse(postDtos, nextCursor, hasMore));
        }

        public async Task<Result> DeletePostAsync(Guid id, Guid userId, bool canDelete)
        {
            var post = await _unitOfWork.Posts.GetByIdAsync(id);
            if (post == null)
                return Result.Fail(new NotFoundError("POST_NOT_FOUND", "Post not found"));

            if (post.AuthorId != userId && !canDelete)
            {
                return Result.Fail(new ForbiddenError("FORBIDDEN", "You do not have permission to delete this post"));
            }

            if (post.MediaId.HasValue)
            {
               var media = await _unitOfWork.MediaObjects.GetByIdAsync(post.MediaId.Value);
               if (media != null)
               {
                   await _fileStorage.DeleteFileAsync(media.Path);
                   _unitOfWork.MediaObjects.Remove(media);
               }
            }

            _unitOfWork.Posts.Remove(post);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result> LikePostAsync(Guid postId, Guid userId)
        {
            if (await _unitOfWork.Reactions.ExistsByPostAndUserAsync(postId, userId, ReactionType.Like))
                return Result.Success();

            var reaction = new Reaction
            {
                PostId = postId,
                UserId = userId,
                Type = ReactionType.Like
            };
            await _unitOfWork.Reactions.AddAsync(reaction);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result> UnlikePostAsync(Guid postId, Guid userId)
        {
            var reaction = await _unitOfWork.Reactions.GetByPostAndUserAsync(postId, userId, ReactionType.Like);
            
            if (reaction != null)
            {
                _unitOfWork.Reactions.Remove(reaction);
                await _unitOfWork.SaveChangesAsync();
            }

            return Result.Success();
        }
    }
}
