using System.Threading.Tasks;
using OneTake.Application.Common.Errors;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Users;

namespace OneTake.Application.Services
{
    public interface IUserService
    {
        Task<Result<ProfileDto>> GetProfileAsync(Guid userId);
        Task<Result> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
    }

    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;

        public UserService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<Result<ProfileDto>> GetProfileAsync(Guid userId)
        {
            var user = await _unitOfWork.Users.GetByIdWithProfileAsync(userId);
            if (user == null)
            {
                return Result<ProfileDto>.Fail(new NotFoundError("USER_NOT_FOUND", "User not found"));
            }

            var followersCount = await _unitOfWork.Follows.GetFollowersAsync(userId);
            var followingCount = await _unitOfWork.Follows.GetFollowingAsync(userId);

            return Result<ProfileDto>.Success(new ProfileDto(
                user.Id,
                user.Username,
                user.Profile?.FullName ?? "",
                user.Profile?.Bio,
                user.Profile?.AvatarUrl,
                followersCount.Count,
                followingCount.Count
            ));
        }

        public async Task<Result> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
        {
            var profile = await _unitOfWork.Profiles.GetByUserIdAsync(userId);
            if (profile == null)
            {
                return Result.Fail(new NotFoundError("PROFILE_NOT_FOUND", "Profile not found"));
            }

            profile.FullName = request.FullName;
            profile.Bio = request.Bio;
            profile.AvatarUrl = request.AvatarUrl;

            _unitOfWork.Profiles.Update(profile);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }
    }
}

