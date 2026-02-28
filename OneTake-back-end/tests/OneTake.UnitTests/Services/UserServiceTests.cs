using System.Collections.Generic;
using Moq;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Users;
using OneTake.Application.Services;
using OneTake.Domain.Entities;
using Xunit;

namespace OneTake.UnitTests.Services
{
    public class UserServiceTests
    {
        [Fact]
        public async Task GetProfileAsync_ReturnsNotFound_WhenUserDoesNotExist()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.GetByIdWithProfileAsync(It.IsAny<Guid>())).ReturnsAsync((User?)null);
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);

            IUserService service = new UserService(unitOfWorkMock.Object);
            Result<ProfileDto> result = await service.GetProfileAsync(Guid.NewGuid());

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task GetProfileAsync_ReturnsSuccess_WhenUserExists()
        {
            User user = new User { Username = "u", Profile = new Profile { FullName = "Full", Bio = "Bio" } };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.GetByIdWithProfileAsync(It.IsAny<Guid>())).ReturnsAsync(user);
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);
            Mock<IFollowRepository> followsMock = new Mock<IFollowRepository>();
            followsMock.Setup(r => r.GetFollowersAsync(It.IsAny<Guid>())).ReturnsAsync(new List<Follow>());
            followsMock.Setup(r => r.GetFollowingAsync(It.IsAny<Guid>())).ReturnsAsync(new List<Follow>());
            unitOfWorkMock.Setup(u => u.Follows).Returns(followsMock.Object);

            IUserService service = new UserService(unitOfWorkMock.Object);
            Result<ProfileDto> result = await service.GetProfileAsync(user.Id);

            Assert.True(result.IsSuccess);
            Assert.Equal("u", result.Value!.Username);
            Assert.Equal("Full", result.Value.FullName);
            Assert.Equal("Bio", result.Value.Bio);
        }

        [Fact]
        public async Task UpdateProfileAsync_ReturnsNotFound_WhenProfileDoesNotExist()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IProfileRepository> profilesMock = new Mock<IProfileRepository>();
            profilesMock.Setup(r => r.GetByUserIdAsync(It.IsAny<Guid>())).ReturnsAsync((Profile?)null);
            unitOfWorkMock.Setup(u => u.Profiles).Returns(profilesMock.Object);

            IUserService service = new UserService(unitOfWorkMock.Object);
            Result result = await service.UpdateProfileAsync(Guid.NewGuid(), new UpdateProfileRequest("Name", null, null));

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task UpdateProfileAsync_ReturnsSuccess_WhenProfileExists()
        {
            Profile profile = new Profile { FullName = "Old", UserId = Guid.NewGuid() };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IProfileRepository> profilesMock = new Mock<IProfileRepository>();
            profilesMock.Setup(r => r.GetByUserIdAsync(It.IsAny<Guid>())).ReturnsAsync(profile);
            unitOfWorkMock.Setup(u => u.Profiles).Returns(profilesMock.Object);

            IUserService service = new UserService(unitOfWorkMock.Object);
            Result result = await service.UpdateProfileAsync(profile.UserId, new UpdateProfileRequest("NewName", "Bio", null));

            Assert.True(result.IsSuccess);
            Assert.Equal("NewName", profile.FullName);
            Assert.Equal("Bio", profile.Bio);
        }
    }
}
