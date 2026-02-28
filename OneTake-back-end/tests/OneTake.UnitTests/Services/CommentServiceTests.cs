using System.Collections.Generic;
using Moq;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Comments;
using OneTake.Application.Services;
using OneTake.Domain.Entities;
using Xunit;

namespace OneTake.UnitTests.Services
{
    public class CommentServiceTests
    {
        [Fact]
        public async Task CreateCommentAsync_ReturnsNotFound_WhenPostDoesNotExist()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Post?)null);
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();

            ICommentService service = new CommentService(unitOfWorkMock.Object, notificationMock.Object);
            Result<CommentDto> result = await service.CreateCommentAsync(Guid.NewGuid(), Guid.NewGuid(), new CreateCommentRequest("A comment"));

            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
        }

        [Fact]
        public async Task CreateCommentAsync_ReturnsSuccess_WhenPostExists()
        {
            Guid postId = Guid.NewGuid();
            Guid userId = Guid.NewGuid();
            Post post = new Post { AuthorId = Guid.NewGuid() };
            User user = new User { Username = "commenter" };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<ICommentRepository> commentsMock = new Mock<ICommentRepository>();
            unitOfWorkMock.Setup(u => u.Comments).Returns(commentsMock.Object);
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();

            ICommentService service = new CommentService(unitOfWorkMock.Object, notificationMock.Object);
            Result<CommentDto> result = await service.CreateCommentAsync(postId, userId, new CreateCommentRequest("Nice post"));

            Assert.True(result.IsSuccess);
            Assert.Equal("Nice post", result.Value!.Text);
            Assert.Equal("commenter", result.Value.Username);
        }

        [Fact]
        public async Task GetCommentsByPostIdAsync_ReturnsEmptyList_WhenNoComments()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<ICommentRepository> commentsMock = new Mock<ICommentRepository>();
            commentsMock.Setup(r => r.GetByPostIdWithUserAsync(It.IsAny<Guid>())).ReturnsAsync(new List<Comment>());
            unitOfWorkMock.Setup(u => u.Comments).Returns(commentsMock.Object);
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();

            ICommentService service = new CommentService(unitOfWorkMock.Object, notificationMock.Object);
            Result<List<CommentDto>> result = await service.GetCommentsByPostIdAsync(Guid.NewGuid());

            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Empty(result.Value);
        }

        [Fact]
        public async Task GetCommentsByPostIdAsync_ReturnsList_WhenCommentsExist()
        {
            Comment c = new Comment { PostId = Guid.NewGuid(), UserId = Guid.NewGuid(), Text = "Hi", User = new User { Username = "u" } };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<ICommentRepository> commentsMock = new Mock<ICommentRepository>();
            commentsMock.Setup(r => r.GetByPostIdWithUserAsync(It.IsAny<Guid>())).ReturnsAsync(new List<Comment> { c });
            unitOfWorkMock.Setup(u => u.Comments).Returns(commentsMock.Object);
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();

            ICommentService service = new CommentService(unitOfWorkMock.Object, notificationMock.Object);
            Result<List<CommentDto>> result = await service.GetCommentsByPostIdAsync(c.PostId);

            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Single(result.Value);
            Assert.Equal("Hi", result.Value[0].Text);
        }

        [Fact]
        public async Task DeleteCommentAsync_ReturnsNotFound_WhenCommentNotFound()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<ICommentRepository> commentsMock = new Mock<ICommentRepository>();
            commentsMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Comment?)null);
            unitOfWorkMock.Setup(u => u.Comments).Returns(commentsMock.Object);
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();

            ICommentService service = new CommentService(unitOfWorkMock.Object, notificationMock.Object);
            Result result = await service.DeleteCommentAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), false);

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task DeleteCommentAsync_ReturnsSuccess_WhenOwnerDeletes()
        {
            Guid postId = Guid.NewGuid();
            Guid userId = Guid.NewGuid();
            Comment comment = new Comment { PostId = postId, UserId = userId, Text = "x" };
            Post post = new Post { Id = postId };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<ICommentRepository> commentsMock = new Mock<ICommentRepository>();
            commentsMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(comment);
            unitOfWorkMock.Setup(u => u.Comments).Returns(commentsMock.Object);
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();

            ICommentService service = new CommentService(unitOfWorkMock.Object, notificationMock.Object);
            Result result = await service.DeleteCommentAsync(postId, comment.Id, userId, false);

            Assert.True(result.IsSuccess);
        }
    }
}
