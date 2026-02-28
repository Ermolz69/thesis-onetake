using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
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
        Task<Result<LoginResult>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
        Task<Result<LoginResult>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
        Task<Result<RefreshResult>> RefreshAsync(string? refreshTokenFromCookie, CancellationToken cancellationToken = default);
        Task RevokeRefreshTokenAsync(string? refreshTokenFromCookie, CancellationToken cancellationToken = default);
        Task<Result<AuthUserDto>> GetMeAsync(Guid userId, CancellationToken cancellationToken = default);
    }

    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtProvider _jwtProvider;
        private readonly IRefreshTokenHasher _refreshTokenHasher;
        private readonly IConfiguration _configuration;

        public AuthService(
            IUnitOfWork unitOfWork,
            IPasswordHasher passwordHasher,
            IJwtProvider jwtProvider,
            IRefreshTokenHasher refreshTokenHasher,
            IConfiguration configuration)
        {
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
            _jwtProvider = jwtProvider;
            _refreshTokenHasher = refreshTokenHasher;
            _configuration = configuration;
        }

        public async Task<Result<LoginResult>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
        {
            if (await _unitOfWork.Users.ExistsByEmailOrUsernameAsync(request.Email, request.Username))
            {
                return Result<LoginResult>.Fail(new ConflictError("USER_ALREADY_EXISTS", "User already exists."));
            }

            User user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = _passwordHasher.Hash(request.Password),
                Role = UserRole.Author
            };

            Profile profile = new Profile
            {
                UserId = user.Id,
                FullName = request.Username
            };

            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.Profiles.AddAsync(profile);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return await CreateLoginResultAsync(user, cancellationToken);
        }

        public async Task<Result<LoginResult>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
        {
            User? user = await _unitOfWork.Users.GetByEmailOrUsernameAsync(request.Login);

            if (user == null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
            {
                return Result<LoginResult>.Fail(new UnauthorizedError("INVALID_CREDENTIALS", "Invalid credentials."));
            }

            return await CreateLoginResultAsync(user, cancellationToken);
        }

        private async Task<Result<LoginResult>> CreateLoginResultAsync(User user, CancellationToken cancellationToken = default)
        {
            string accessToken = _jwtProvider.GenerateAccessToken(user);
            string refreshTokenValue = _jwtProvider.GenerateRefreshToken();
            int refreshExpirationDays = int.Parse(_configuration["Jwt:RefreshExpirationDays"] ?? "14");
            DateTime expiresAt = DateTime.UtcNow.AddDays(refreshExpirationDays);

            RefreshToken refreshTokenEntity = new RefreshToken
            {
                UserId = user.Id,
                TokenHash = _refreshTokenHasher.Hash(refreshTokenValue),
                ExpiresAt = expiresAt
            };

            await _unitOfWork.RefreshTokens.AddAsync(refreshTokenEntity);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            AuthResponse authResponse = new AuthResponse(
                accessToken,
                new AuthUserDto(user.Id, user.Username, user.Email));
            LoginResult loginResult = new LoginResult(authResponse, refreshTokenValue);

            return Result<LoginResult>.Success(loginResult);
        }

        public async Task<Result<RefreshResult>> RefreshAsync(string? refreshTokenFromCookie, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(refreshTokenFromCookie))
            {
                return Result<RefreshResult>.Fail(new UnauthorizedError("invalid_refresh", "Invalid or missing refresh token."));
            }

            string tokenHash = _refreshTokenHasher.Hash(refreshTokenFromCookie);
            RefreshToken? existing = await _unitOfWork.RefreshTokens.FindByTokenHashAsync(tokenHash);

            if (existing == null)
            {
                return Result<RefreshResult>.Fail(new UnauthorizedError("invalid_refresh", "Invalid or missing refresh token."));
            }

            if (existing.ExpiresAt < DateTime.UtcNow || existing.RevokedAt != null)
            {
                return Result<RefreshResult>.Fail(new UnauthorizedError("invalid_refresh", "Invalid or expired refresh token."));
            }

            if (existing.UsedAt != null)
            {
                await _unitOfWork.RefreshTokens.RevokeAllForUserAsync(existing.UserId);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                return Result<RefreshResult>.Fail(new ForbiddenError("refresh_reuse_detected", "Refresh token reuse detected. All sessions have been revoked."));
            }

            User? user = existing.User;
            if (user == null)
            {
                return Result<RefreshResult>.Fail(new UnauthorizedError("invalid_refresh", "Invalid refresh token."));
            }

            string accessToken = _jwtProvider.GenerateAccessToken(user);
            string newRefreshValue = _jwtProvider.GenerateRefreshToken();
            int refreshExpirationDays = int.Parse(_configuration["Jwt:RefreshExpirationDays"] ?? "14");
            DateTime expiresAt = DateTime.UtcNow.AddDays(refreshExpirationDays);

            RefreshToken newRefreshToken = new RefreshToken
            {
                UserId = user.Id,
                TokenHash = _refreshTokenHasher.Hash(newRefreshValue),
                ExpiresAt = expiresAt
            };

            await _unitOfWork.RefreshTokens.AddAsync(newRefreshToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            existing.UsedAt = DateTime.UtcNow;
            existing.ReplacedByTokenId = newRefreshToken.Id;
            _unitOfWork.RefreshTokens.Update(existing);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            RefreshResult refreshResult = new RefreshResult(new RefreshTokenResponse(accessToken), newRefreshValue);
            return Result<RefreshResult>.Success(refreshResult);
        }

        public async Task RevokeRefreshTokenAsync(string? refreshTokenFromCookie, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(refreshTokenFromCookie)) return;

            string tokenHash = _refreshTokenHasher.Hash(refreshTokenFromCookie);
            RefreshToken? existing = await _unitOfWork.RefreshTokens.FindByTokenHashAsync(tokenHash);
            if (existing == null) return;

            existing.RevokedAt = DateTime.UtcNow;
            _unitOfWork.RefreshTokens.Update(existing);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        public async Task<Result<AuthUserDto>> GetMeAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            User? user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
            {
                return Result<AuthUserDto>.Fail(new UnauthorizedError("INVALID_USER", "User not found."));
            }

            return Result<AuthUserDto>.Success(new AuthUserDto(user.Id, user.Username, user.Email));
        }
    }
}

