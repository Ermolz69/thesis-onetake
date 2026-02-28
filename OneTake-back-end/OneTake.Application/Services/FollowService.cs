using System;
using System.Collections.Generic;
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
    public interface IFollowService
    {
        Task<Result> FollowAsync(Guid followerId, Guid followedId, CancellationToken cancellationToken = default);
        Task<Result> UnfollowAsync(Guid followerId, Guid followedId, CancellationToken cancellationToken = default);
        Task<Result<PagedPostResponse>> GetFollowingFeedAsync(Guid userId, string? cursor, int pageSize, CancellationToken cancellationToken = default);
    }

    public class FollowService : IFollowService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAnalyticsIngestClient _analyticsIngest;
        private readonly INotificationService _notificationService;
        private readonly ICurrentRequestContext _requestContext;

        public FollowService(IUnitOfWork unitOfWork, IAnalyticsIngestClient analyticsIngest, INotificationService notificationService, ICurrentRequestContext requestContext)
        {
            _unitOfWork = unitOfWork;
            _analyticsIngest = analyticsIngest;
            _notificationService = notificationService;
            _requestContext = requestContext;
        }

        public async Task<Result> FollowAsync(Guid followerId, Guid followedId, CancellationToken cancellationToken = default)
        {
            if (followerId == followedId)
            {
                return Result.Fail(new ValidationError("VALIDATION", "Cannot follow yourself"));
            }

            User? userExists = await _unitOfWork.Users.GetByIdAsync(followedId);
            if (userExists == null)
            {
                return Result.Fail(new NotFoundError("USER_NOT_FOUND", "User not found"));
            }

            Follow? existing = await _unitOfWork.Follows.GetByFollowerAndFollowedAsync(followerId, followedId);
            if (existing != null)
            {
                return Result.Success();
            }

            Follow follow = new Follow { FollowerId = followerId, FollowedId = followedId };
            await _unitOfWork.Follows.AddAsync(follow);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _ = _notificationService.CreateAsync(
                followedId,
                OneTake.Domain.Enums.NotificationType.NewFollower,
                "New follower",
                "Someone started following you",
                "user",
                followerId);

            OneTake.GrpcContracts.Analytics.V1.TrackEventRequest req = new OneTake.GrpcContracts.Analytics.V1.TrackEventRequest
            {
                EventId = Guid.NewGuid().ToString(),
                Ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                UserId = followerId.ToString(),
                SessionId = _requestContext.GetSessionId(),
                EventName = "follow",
                Route = "/api/users/follow",
                EntityType = "user",
                EntityId = followedId.ToString(),
                PropsJson = "{}",
                TraceId = _requestContext.GetTraceId()
            };
            _ = Task.Run(async () => { try { await _analyticsIngest.TrackEventAsync(req); } catch { } });

            return Result.Success();
        }

        public async Task<Result> UnfollowAsync(Guid followerId, Guid followedId, CancellationToken cancellationToken = default)
        {
            Follow? follow = await _unitOfWork.Follows.GetByFollowerAndFollowedAsync(followerId, followedId);
            if (follow != null)
            {
                _unitOfWork.Follows.Remove(follow);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }

            OneTake.GrpcContracts.Analytics.V1.TrackEventRequest req = new OneTake.GrpcContracts.Analytics.V1.TrackEventRequest
            {
                EventId = Guid.NewGuid().ToString(),
                Ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                UserId = followerId.ToString(),
                SessionId = _requestContext.GetSessionId(),
                EventName = "unfollow",
                Route = "/api/users/unfollow",
                EntityType = "user",
                EntityId = followedId.ToString(),
                PropsJson = "{}",
                TraceId = _requestContext.GetTraceId()
            };
            _ = Task.Run(async () => { try { await _analyticsIngest.TrackEventAsync(req); } catch { } });

            return Result.Success();
        }

        public async Task<Result<PagedPostResponse>> GetFollowingFeedAsync(Guid userId, string? cursor, int pageSize, CancellationToken cancellationToken = default)
        {
            List<Follow> following = await _unitOfWork.Follows.GetFollowingAsync(userId);
            List<Guid> authorIds = following.Select(f => f.FollowedId).ToList();
            if (authorIds.Count == 0)
            {
                return Result<PagedPostResponse>.Success(new PagedPostResponse(new List<PostDto>(), null, false));
            }

            (List<Post> posts, bool hasMore) = await _unitOfWork.Posts.GetByAuthorIdsWithCursorAsync(authorIds, cursor, pageSize);
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
    }
}
