using Moq;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Auth;
using OneTake.Application.Services;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;
using Xunit;

namespace OneTake.UnitTests.Services
{
    public class AuthServiceTests
    {
        private static IAuthService CreateService(
            Mock<IUnitOfWork>? unitOfWorkMock = null,
            Mock<IPasswordHasher>? passwordHasherMock = null,
            Mock<IJwtProvider>? jwtProviderMock = null,
            Mock<IRefreshTokenHasher>? refreshTokenHasherMock = null,
            Mock<Microsoft.Extensions.Configuration.IConfiguration>? configMock = null)
        {
            unitOfWorkMock ??= new Mock<IUnitOfWork>();
            passwordHasherMock ??= new Mock<IPasswordHasher>();
            jwtProviderMock ??= new Mock<IJwtProvider>();
            refreshTokenHasherMock ??= new Mock<IRefreshTokenHasher>();
            configMock ??= new Mock<Microsoft.Extensions.Configuration.IConfiguration>();
            configMock.Setup(c => c["Jwt:RefreshExpirationDays"]).Returns("14");
            return new AuthService(
                unitOfWorkMock.Object,
                passwordHasherMock.Object,
                jwtProviderMock.Object,
                refreshTokenHasherMock.Object,
                configMock.Object);
        }

        [Fact]
        public async Task LoginAsync_ReturnsUnauthorized_WhenUserNotFound()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.GetByEmailOrUsernameAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);

            IAuthService service = CreateService(unitOfWorkMock: unitOfWorkMock);
            Result<LoginResult> result = await service.LoginAsync(new LoginRequest("nonexistent@example.com", "password"));

            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
        }

        [Fact]
        public async Task LoginAsync_ReturnsUnauthorized_WhenPasswordInvalid()
        {
            User user = new User { Username = "u", Email = "u@e.com", PasswordHash = "hash", Role = UserRole.Author };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.GetByEmailOrUsernameAsync(It.IsAny<string>())).ReturnsAsync(user);
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);
            Mock<IPasswordHasher> passwordHasherMock = new Mock<IPasswordHasher>();
            passwordHasherMock.Setup(h => h.Verify(It.IsAny<string>(), It.IsAny<string>())).Returns(false);

            IAuthService service = CreateService(unitOfWorkMock: unitOfWorkMock, passwordHasherMock: passwordHasherMock);
            Result<LoginResult> result = await service.LoginAsync(new LoginRequest("u@e.com", "wrong"));

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task LoginAsync_ReturnsSuccess_WhenCredentialsValid()
        {
            User user = new User { Username = "u", Email = "u@e.com", PasswordHash = "hash", Role = UserRole.Author };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.GetByEmailOrUsernameAsync(It.IsAny<string>())).ReturnsAsync(user);
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);
            Mock<IPasswordHasher> passwordHasherMock = new Mock<IPasswordHasher>();
            passwordHasherMock.Setup(h => h.Verify(It.IsAny<string>(), It.IsAny<string>())).Returns(true);
            Mock<IJwtProvider> jwtProviderMock = new Mock<IJwtProvider>();
            jwtProviderMock.Setup(j => j.GenerateAccessToken(It.IsAny<User>())).Returns("access");
            jwtProviderMock.Setup(j => j.GenerateRefreshToken()).Returns("refresh");
            Mock<IRefreshTokenRepository> refreshMock = new Mock<IRefreshTokenRepository>();
            Mock<IProfileRepository> profileMock = new Mock<IProfileRepository>();
            unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshMock.Object);
            unitOfWorkMock.Setup(u => u.Profiles).Returns(profileMock.Object);

            IAuthService service = CreateService(unitOfWorkMock: unitOfWorkMock, passwordHasherMock: passwordHasherMock, jwtProviderMock: jwtProviderMock);
            Result<LoginResult> result = await service.LoginAsync(new LoginRequest("u@e.com", "pass"));

            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Equal("access", result.Value.Auth.AccessToken);
            Assert.Equal("refresh", result.Value.RefreshTokenValue);
        }

        [Fact]
        public async Task RefreshAsync_ReturnsUnauthorized_WhenTokenMissing()
        {
            IAuthService service = CreateService();
            Result<RefreshResult> result = await service.RefreshAsync(null);
            Assert.False(result.IsSuccess);
            result = await service.RefreshAsync("");
            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task RefreshAsync_ReturnsUnauthorized_WhenTokenNotFound()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IRefreshTokenRepository> refreshMock = new Mock<IRefreshTokenRepository>();
            refreshMock.Setup(r => r.FindByTokenHashAsync(It.IsAny<string>())).ReturnsAsync((RefreshToken?)null);
            unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshMock.Object);
            Mock<IRefreshTokenHasher> hasherMock = new Mock<IRefreshTokenHasher>();
            hasherMock.Setup(h => h.Hash(It.IsAny<string>())).Returns("hash");

            IAuthService service = CreateService(unitOfWorkMock: unitOfWorkMock, refreshTokenHasherMock: hasherMock);
            Result<RefreshResult> result = await service.RefreshAsync("some-token");

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task RefreshAsync_ReturnsUnauthorized_WhenTokenExpired()
        {
            RefreshToken expiredToken = new RefreshToken
            {
                UserId = Guid.NewGuid(),
                ExpiresAt = DateTime.UtcNow.AddMinutes(-1),
                User = new User { Username = "expired", Email = "expired@example.com", Role = UserRole.Author }
            };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IRefreshTokenRepository> refreshMock = new Mock<IRefreshTokenRepository>();
            refreshMock.Setup(r => r.FindByTokenHashAsync(It.IsAny<string>())).ReturnsAsync(expiredToken);
            unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshMock.Object);
            Mock<IRefreshTokenHasher> hasherMock = new Mock<IRefreshTokenHasher>();
            hasherMock.Setup(h => h.Hash(It.IsAny<string>())).Returns("hash");

            IAuthService service = CreateService(unitOfWorkMock: unitOfWorkMock, refreshTokenHasherMock: hasherMock);
            Result<RefreshResult> result = await service.RefreshAsync("expired-token");

            Assert.False(result.IsSuccess);
            refreshMock.Verify(r => r.RevokeAllForUserAsync(It.IsAny<Guid>()), Times.Never);
        }

        [Fact]
        public async Task RefreshAsync_ReturnsUnauthorized_WhenTokenRevoked()
        {
            RefreshToken revokedToken = new RefreshToken
            {
                UserId = Guid.NewGuid(),
                ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                RevokedAt = DateTime.UtcNow.AddMinutes(-1),
                User = new User { Username = "revoked", Email = "revoked@example.com", Role = UserRole.Author }
            };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IRefreshTokenRepository> refreshMock = new Mock<IRefreshTokenRepository>();
            refreshMock.Setup(r => r.FindByTokenHashAsync(It.IsAny<string>())).ReturnsAsync(revokedToken);
            unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshMock.Object);
            Mock<IRefreshTokenHasher> hasherMock = new Mock<IRefreshTokenHasher>();
            hasherMock.Setup(h => h.Hash(It.IsAny<string>())).Returns("hash");

            IAuthService service = CreateService(unitOfWorkMock: unitOfWorkMock, refreshTokenHasherMock: hasherMock);
            Result<RefreshResult> result = await service.RefreshAsync("revoked-token");

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task GetMeAsync_ReturnsFail_WhenUserNotFound()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((User?)null);
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);

            IAuthService service = CreateService(unitOfWorkMock: unitOfWorkMock);
            Result<AuthUserDto> result = await service.GetMeAsync(Guid.NewGuid());

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task GetMeAsync_ReturnsSuccess_WhenUserExists()
        {
            User user = new User { Username = "u", Email = "u@e.com", Role = UserRole.Author };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(user);
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);

            IAuthService service = CreateService(unitOfWorkMock: unitOfWorkMock);
            Result<AuthUserDto> result = await service.GetMeAsync(user.Id);

            Assert.True(result.IsSuccess);
            Assert.Equal(user.Username, result.Value!.Username);
            Assert.Equal(user.Email, result.Value.Email);
        }

        [Fact]
        public async Task RegisterAsync_ReturnsConflict_WhenUserExists()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.ExistsByEmailOrUsernameAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(true);
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);

            IAuthService service = CreateService(unitOfWorkMock: unitOfWorkMock);
            Result<LoginResult> result = await service.RegisterAsync(new RegisterRequest("u", "u@e.com", "password123"));

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task RegisterAsync_ReturnsSuccess_WhenValidRequest()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.ExistsByEmailOrUsernameAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(false);
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);
            Mock<IProfileRepository> profileMock = new Mock<IProfileRepository>();
            unitOfWorkMock.Setup(u => u.Profiles).Returns(profileMock.Object);
            Mock<IRefreshTokenRepository> refreshMock = new Mock<IRefreshTokenRepository>();
            unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshMock.Object);
            Mock<IPasswordHasher> passwordHasherMock = new Mock<IPasswordHasher>();
            passwordHasherMock.Setup(h => h.Hash(It.IsAny<string>())).Returns("hashed");
            Mock<IJwtProvider> jwtProviderMock = new Mock<IJwtProvider>();
            jwtProviderMock.Setup(j => j.GenerateAccessToken(It.IsAny<User>())).Returns("access");
            jwtProviderMock.Setup(j => j.GenerateRefreshToken()).Returns("refresh");
            Mock<IRefreshTokenHasher> refreshHasherMock = new Mock<IRefreshTokenHasher>();
            refreshHasherMock.Setup(h => h.Hash(It.IsAny<string>())).Returns("refreshHash");

            IAuthService service = CreateService(unitOfWorkMock: unitOfWorkMock, passwordHasherMock: passwordHasherMock, jwtProviderMock: jwtProviderMock, refreshTokenHasherMock: refreshHasherMock);
            Result<LoginResult> result = await service.RegisterAsync(new RegisterRequest("newuser", "new@e.com", "password123"));

            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Equal("access", result.Value.Auth.AccessToken);
            Assert.Equal("refresh", result.Value.RefreshTokenValue);
            usersMock.Verify(r => r.AddAsync(It.Is<User>(u => u.Username == "newuser" && u.Email == "new@e.com")), Times.Once);
            profileMock.Verify(
                r => r.AddAsync(It.Is<Profile>(p => p.FullName == "newuser" && p.UserId != Guid.Empty)),
                Times.Once);
            refreshMock.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Once);
            unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
        }

        [Fact]
        public async Task RefreshAsync_ReturnsSuccess_WhenTokenValid()
        {
            User user = new User { Username = "u", Email = "u@e.com", Role = UserRole.Author };
            RefreshToken existingToken = new RefreshToken
            {
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(1),
                UsedAt = null,
                RevokedAt = null,
                User = user
            };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IRefreshTokenRepository> refreshMock = new Mock<IRefreshTokenRepository>();
            refreshMock.Setup(r => r.FindByTokenHashAsync(It.IsAny<string>())).ReturnsAsync(existingToken);
            unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshMock.Object);
            Mock<IRefreshTokenHasher> hasherMock = new Mock<IRefreshTokenHasher>();
            hasherMock.Setup(h => h.Hash(It.IsAny<string>())).Returns("hash");
            Mock<IJwtProvider> jwtProviderMock = new Mock<IJwtProvider>();
            jwtProviderMock.Setup(j => j.GenerateAccessToken(It.IsAny<User>())).Returns("newAccess");
            jwtProviderMock.Setup(j => j.GenerateRefreshToken()).Returns("newRefresh");

            IAuthService service = CreateService(unitOfWorkMock: unitOfWorkMock, refreshTokenHasherMock: hasherMock, jwtProviderMock: jwtProviderMock);
            Result<RefreshResult> result = await service.RefreshAsync("valid-refresh-token");

            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Equal("newAccess", result.Value.Auth.AccessToken);
            Assert.Equal("newRefresh", result.Value.RefreshTokenValue);
            refreshMock.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Once);
            refreshMock.Verify(r => r.Update(existingToken), Times.Once);
            unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
        }

        [Fact]
        public async Task RefreshAsync_RevokesAllSessions_WhenRefreshTokenReuseDetected()
        {
            User user = new User { Username = "reuse", Email = "reuse@example.com", Role = UserRole.Author };
            RefreshToken reusedToken = new RefreshToken
            {
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(1),
                UsedAt = DateTime.UtcNow.AddMinutes(-5),
                User = user
            };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IRefreshTokenRepository> refreshMock = new Mock<IRefreshTokenRepository>();
            refreshMock.Setup(r => r.FindByTokenHashAsync(It.IsAny<string>())).ReturnsAsync(reusedToken);
            unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshMock.Object);
            Mock<IRefreshTokenHasher> hasherMock = new Mock<IRefreshTokenHasher>();
            hasherMock.Setup(h => h.Hash(It.IsAny<string>())).Returns("hash");

            IAuthService service = CreateService(unitOfWorkMock: unitOfWorkMock, refreshTokenHasherMock: hasherMock);
            Result<RefreshResult> result = await service.RefreshAsync("reused-token");

            Assert.False(result.IsSuccess);
            refreshMock.Verify(r => r.RevokeAllForUserAsync(user.Id), Times.Once);
            unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task RefreshAsync_ReturnsUnauthorized_WhenTokenUserIsMissing()
        {
            RefreshToken tokenWithoutUser = new RefreshToken
            {
                UserId = Guid.NewGuid(),
                ExpiresAt = DateTime.UtcNow.AddDays(1)
            };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IRefreshTokenRepository> refreshMock = new Mock<IRefreshTokenRepository>();
            refreshMock.Setup(r => r.FindByTokenHashAsync(It.IsAny<string>())).ReturnsAsync(tokenWithoutUser);
            unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshMock.Object);
            Mock<IRefreshTokenHasher> hasherMock = new Mock<IRefreshTokenHasher>();
            hasherMock.Setup(h => h.Hash(It.IsAny<string>())).Returns("hash");

            IAuthService service = CreateService(unitOfWorkMock: unitOfWorkMock, refreshTokenHasherMock: hasherMock);
            Result<RefreshResult> result = await service.RefreshAsync("token-without-user");

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task RevokeRefreshTokenAsync_Revokes_WhenTokenFound()
        {
            RefreshToken existingToken = new RefreshToken { UserId = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddDays(1) };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IRefreshTokenRepository> refreshMock = new Mock<IRefreshTokenRepository>();
            refreshMock.Setup(r => r.FindByTokenHashAsync(It.IsAny<string>())).ReturnsAsync(existingToken);
            unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshMock.Object);
            Mock<IRefreshTokenHasher> hasherMock = new Mock<IRefreshTokenHasher>();
            hasherMock.Setup(h => h.Hash(It.IsAny<string>())).Returns("hash");

            IAuthService service = CreateService(unitOfWorkMock: unitOfWorkMock, refreshTokenHasherMock: hasherMock);
            await service.RevokeRefreshTokenAsync("token-to-revoke");

            Assert.NotNull(existingToken.RevokedAt);
            refreshMock.Verify(r => r.Update(existingToken), Times.Once);
        }

        [Fact]
        public async Task RevokeRefreshTokenAsync_DoesNothing_WhenTokenIsMissing()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IRefreshTokenRepository> refreshMock = new Mock<IRefreshTokenRepository>();
            unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshMock.Object);
            Mock<IRefreshTokenHasher> hasherMock = new Mock<IRefreshTokenHasher>();

            IAuthService service = CreateService(unitOfWorkMock: unitOfWorkMock, refreshTokenHasherMock: hasherMock);
            await service.RevokeRefreshTokenAsync(null);
            await service.RevokeRefreshTokenAsync("");

            hasherMock.Verify(h => h.Hash(It.IsAny<string>()), Times.Never);
            refreshMock.Verify(r => r.FindByTokenHashAsync(It.IsAny<string>()), Times.Never);
            unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
        }
    }
}
