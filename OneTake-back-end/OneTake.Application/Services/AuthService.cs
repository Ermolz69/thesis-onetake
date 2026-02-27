using System.Threading.Tasks;
using OneTake.Application.Common.Errors;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Auth;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;

namespace OneTake.Application.Services
{
    public interface IAuthService
    {
        Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request);
        Task<Result<AuthResponse>> LoginAsync(LoginRequest request);
    }

    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtProvider _jwtProvider;

        public AuthService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher, IJwtProvider jwtProvider)
        {
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
            _jwtProvider = jwtProvider;
        }

        public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request)
        {
            if (await _unitOfWork.Users.ExistsByEmailOrUsernameAsync(request.Email, request.Username))
            {
                return Result<AuthResponse>.Fail(new ConflictError("USER_ALREADY_EXISTS", "User already exists."));
            }

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = _passwordHasher.Hash(request.Password),
                Role = UserRole.Author
            };

            var profile = new Profile
            {
                UserId = user.Id,
                FullName = request.Username
            };

            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.Profiles.AddAsync(profile);
            await _unitOfWork.SaveChangesAsync();

            var token = _jwtProvider.Generate(user);

            return Result<AuthResponse>.Success(new AuthResponse(user.Id, user.Username, user.Email, token));
        }

        public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request)
        {
            var user = await _unitOfWork.Users.GetByEmailOrUsernameAsync(request.Login);

            if (user == null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
            {
                return Result<AuthResponse>.Fail(new UnauthorizedError("INVALID_CREDENTIALS", "Invalid credentials."));
            }

            var token = _jwtProvider.Generate(user);

            return Result<AuthResponse>.Success(new AuthResponse(user.Id, user.Username, user.Email, token));
        }
    }
}

