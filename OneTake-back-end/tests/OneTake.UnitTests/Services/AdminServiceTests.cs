using System.Collections.Generic;
using Moq;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.Services;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;
using Xunit;

namespace OneTake.UnitTests.Services
{
    public class AdminServiceTests
    {
        [Fact]
        public async Task GetAllUsersAsync_ReturnsSuccessWithEmptyList_WhenNoUsers()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.GetAllUsersAsync()).ReturnsAsync(new List<User>());
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);

            IAdminService service = new AdminService(unitOfWorkMock.Object);
            Result<List<UserInfoDto>> result = await service.GetAllUsersAsync();

            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Empty(result.Value);
        }

        [Fact]
        public async Task GetAllUsersAsync_ReturnsSuccessWithUsers_WhenUsersExist()
        {
            User user = new User { Username = "admin", Email = "a@e.com", Role = UserRole.Admin };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.GetAllUsersAsync()).ReturnsAsync(new List<User> { user });
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);

            IAdminService service = new AdminService(unitOfWorkMock.Object);
            Result<List<UserInfoDto>> result = await service.GetAllUsersAsync();

            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Single(result.Value);
            Assert.Equal("admin", result.Value[0].Username);
            Assert.Equal(UserRole.Admin, result.Value[0].Role);
        }

        [Fact]
        public async Task UpdateUserRoleAsync_ReturnsNotFound_WhenUserDoesNotExist()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((User?)null);
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);

            IAdminService service = new AdminService(unitOfWorkMock.Object);
            Result result = await service.UpdateUserRoleAsync(Guid.NewGuid(), UserRole.Admin);

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task UpdateUserRoleAsync_ReturnsSuccess_WhenUserExists()
        {
            User user = new User { Username = "u", Email = "u@e.com", Role = UserRole.Author };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(user);
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);

            IAdminService service = new AdminService(unitOfWorkMock.Object);
            Result result = await service.UpdateUserRoleAsync(user.Id, UserRole.Admin);

            Assert.True(result.IsSuccess);
            Assert.Equal(UserRole.Admin, user.Role);
        }
    }
}
