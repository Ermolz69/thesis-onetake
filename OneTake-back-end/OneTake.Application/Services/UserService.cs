using System.Threading;
using System.Threading.Tasks;
using OneTake.Application.Common.Errors;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using System.Collections.Generic;
using OneTake.Application.DTOs.Users;
using OneTake.Domain.Entities;

namespace OneTake.Application.Services
{
    public interface IUserService
    {
        Task<Result<ProfileDto>> GetProfileAsync(Guid userId, Guid? viewerId = null, CancellationToken cancellationToken = default);
        Task<Result> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken = default);
    }

    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;

        public UserService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<Result<ProfileDto>> GetProfileAsync(Guid userId, Guid? viewerId = null, CancellationToken cancellationToken = default)
        {
            User? user = await _unitOfWork.Users.GetByIdWithProfileAsync(userId);
            if (user == null)
            {
                return Result<ProfileDto>.Fail(new NotFoundError("USER_NOT_FOUND", "User not found"));
            }

            List<Follow> followersCount = await _unitOfWork.Follows.GetFollowersAsync(userId);
            List<Follow> followingCount = await _unitOfWork.Follows.GetFollowingAsync(userId);
            bool? isFollowing = null;
            if (viewerId.HasValue && viewerId.Value != userId)
            {
                isFollowing = await _unitOfWork.Follows.IsFollowingAsync(viewerId.Value, userId);
            }

            return Result<ProfileDto>.Success(new ProfileDto(
                user.Id,
                user.Username,
                user.Profile?.FullName ?? "",
                user.Profile?.Bio,
                user.Profile?.AvatarUrl,
                followersCount.Count,
                followingCount.Count,
                isFollowing
            ));
        }

        public async Task<Result> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken = default)
        {
            Profile? profile = await _unitOfWork.Profiles.GetByUserIdAsync(userId);
            if (profile == null)
            {
                return Result.Fail(new NotFoundError("PROFILE_NOT_FOUND", "Profile not found"));
            }

            profile.FullName = request.FullName;
            profile.Bio = request.Bio;
            profile.AvatarUrl = request.AvatarUrl;

            _unitOfWork.Profiles.Update(profile);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Result.Success();
        }
    }
}

