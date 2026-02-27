using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using OneTake.Application.Common.Errors;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Domain.Enums;

namespace OneTake.Application.Services
{
    public interface IAdminService
    {
        Task<Result<List<UserInfoDto>>> GetAllUsersAsync();
        Task<Result> UpdateUserRoleAsync(Guid userId, UserRole newRole);
    }

    public record UserInfoDto(
        Guid Id,
        string Username,
        string Email,
        UserRole Role,
        DateTime CreatedAt
    );

    public class AdminService : IAdminService
    {
        private readonly IUnitOfWork _unitOfWork;

        public AdminService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<Result<List<UserInfoDto>>> GetAllUsersAsync()
        {
            var users = await _unitOfWork.Users.GetAllUsersAsync();

            var userDtos = users.Select(u => new UserInfoDto(
                u.Id,
                u.Username,
                u.Email,
                u.Role,
                u.CreatedAt
            )).ToList();

            return Result<List<UserInfoDto>>.Success(userDtos);
        }

        public async Task<Result> UpdateUserRoleAsync(Guid userId, UserRole newRole)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
            {
                return Result.Fail(new NotFoundError("USER_NOT_FOUND", "User not found"));
            }

            user.Role = newRole;
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }
    }
}

