using System.Collections.Generic;
using Moq;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Posts;
using OneTake.Application.Services;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;
using Xunit;

namespace OneTake.UnitTests.Services
{
    public class FollowServiceTests
    {
        private static IFollowService CreateService(
            Mock<IUnitOfWork>? unitOfWorkMock = null,
            Mock<IAnalyticsIngestClient>? analyticsMock = null,
            Mock<INotificationService>? notificationMock = null,
            Mock<ICurrentRequestContext>? requestContextMock = null)
        {
            unitOfWorkMock ??= new Mock<IUnitOfWork>();
            analyticsMock ??= new Mock<IAnalyticsIngestClient>();
            notificationMock ??= new Mock<INotificationService>();
            requestContextMock ??= new Mock<ICurrentRequestContext>();
            requestContextMock.Setup(c => c.GetSessionId()).Returns("sess");
            requestContextMock.Setup(c => c.GetTraceId()).Returns("trace");
            return new FollowService(unitOfWorkMock.Object, analyticsMock.Object, notificationMock.Object, requestContextMock.Object);
        }

        [Fact]
        public async Task GetFollowingFeedAsync_ReturnsSuccessWithEmptyPosts_WhenUserFollowsNoOne()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IFollowRepository> followsMock = new Mock<IFollowRepository>();
            followsMock.Setup(r => r.GetFollowingAsync(It.IsAny<Guid>())).ReturnsAsync(new List<Follow>());
            unitOfWorkMock.Setup(u => u.Follows).Returns(followsMock.Object);

            IFollowService service = CreateService(unitOfWorkMock: unitOfWorkMock);
            Result<PagedPostResponse> result = await service.GetFollowingFeedAsync(Guid.NewGuid(), null, 10);

            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Empty(result.Value.Posts);
            Assert.False(result.Value.HasMore);
        }

        [Fact]
        public async Task FollowAsync_ReturnsValidationError_WhenFollowingSelf()
        {
            Guid userId = Guid.NewGuid();
            IFollowService service = CreateService();
            Result result = await service.FollowAsync(userId, userId);
            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task FollowAsync_ReturnsNotFound_WhenFollowedUserDoesNotExist()
        {
            Guid followerId = Guid.NewGuid();
            Guid followedId = Guid.NewGuid();
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.GetByIdAsync(followedId)).ReturnsAsync((User?)null);
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);
            Mock<IFollowRepository> followsMock = new Mock<IFollowRepository>();
            unitOfWorkMock.Setup(u => u.Follows).Returns(followsMock.Object);

            IFollowService service = CreateService(unitOfWorkMock: unitOfWorkMock);
            Result result = await service.FollowAsync(followerId, followedId);

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task FollowAsync_ReturnsSuccess_WhenAlreadyFollowing()
        {
            Guid followerId = Guid.NewGuid();
            Guid followedId = Guid.NewGuid();
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.GetByIdAsync(followedId)).ReturnsAsync(new User());
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);
            Mock<IFollowRepository> followsMock = new Mock<IFollowRepository>();
            followsMock.Setup(r => r.GetByFollowerAndFollowedAsync(followerId, followedId)).ReturnsAsync(new Follow());
            unitOfWorkMock.Setup(u => u.Follows).Returns(followsMock.Object);

            IFollowService service = CreateService(unitOfWorkMock: unitOfWorkMock);
            Result result = await service.FollowAsync(followerId, followedId);

            Assert.True(result.IsSuccess);
        }

        [Fact]
        public async Task FollowAsync_ReturnsSuccess_WhenNotYetFollowing()
        {
            Guid followerId = Guid.NewGuid();
            Guid followedId = Guid.NewGuid();
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.GetByIdAsync(followedId)).ReturnsAsync(new User());
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);
            Mock<IFollowRepository> followsMock = new Mock<IFollowRepository>();
            followsMock.Setup(r => r.GetByFollowerAndFollowedAsync(followerId, followedId)).ReturnsAsync((Follow?)null);
            unitOfWorkMock.Setup(u => u.Follows).Returns(followsMock.Object);

            IFollowService service = CreateService(unitOfWorkMock: unitOfWorkMock);
            Result result = await service.FollowAsync(followerId, followedId);

            Assert.True(result.IsSuccess);
        }

        [Fact]
        public async Task UnfollowAsync_ReturnsSuccess()
        {
            Guid followerId = Guid.NewGuid();
            Guid followedId = Guid.NewGuid();
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IFollowRepository> followsMock = new Mock<IFollowRepository>();
            followsMock.Setup(r => r.GetByFollowerAndFollowedAsync(followerId, followedId)).ReturnsAsync(new Follow());
            unitOfWorkMock.Setup(u => u.Follows).Returns(followsMock.Object);

            IFollowService service = CreateService(unitOfWorkMock: unitOfWorkMock);
            Result result = await service.UnfollowAsync(followerId, followedId);

            Assert.True(result.IsSuccess);
        }

        [Fact]
        public async Task GetFollowingFeedAsync_ReturnsSuccessWithPosts_WhenFollowingNonEmpty()
        {
            Guid userId = Guid.NewGuid();
            Guid followedId = Guid.NewGuid();
            List<Follow> following = new List<Follow> { new Follow { FollowerId = userId, FollowedId = followedId } };
            Post post = new Post { AuthorId = followedId, Author = new User { Username = "followed" }, PostTags = new List<PostTag>() };
            List<Post> posts = new List<Post> { post };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IFollowRepository> followsMock = new Mock<IFollowRepository>();
            followsMock.Setup(r => r.GetFollowingAsync(userId)).ReturnsAsync(following);
            unitOfWorkMock.Setup(u => u.Follows).Returns(followsMock.Object);
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetByAuthorIdsWithCursorAsync(It.IsAny<IEnumerable<Guid>>(), It.IsAny<string?>(), It.IsAny<int>())).ReturnsAsync((posts, false));
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<IReactionRepository> reactionsMock = new Mock<IReactionRepository>();
            reactionsMock.Setup(r => r.CountByPostAndTypeAsync(It.IsAny<Guid>(), It.IsAny<ReactionType>())).ReturnsAsync(0);
            unitOfWorkMock.Setup(u => u.Reactions).Returns(reactionsMock.Object);
            Mock<ICommentRepository> commentsMock = new Mock<ICommentRepository>();
            commentsMock.Setup(c => c.CountByPostIdAsync(It.IsAny<Guid>())).ReturnsAsync(0);
            unitOfWorkMock.Setup(u => u.Comments).Returns(commentsMock.Object);

            IFollowService service = CreateService(unitOfWorkMock: unitOfWorkMock);
            Result<PagedPostResponse> result = await service.GetFollowingFeedAsync(userId, null, 10);

            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Single(result.Value.Posts);
            Assert.Equal("followed", result.Value.Posts[0].AuthorName);
        }
    }
}
