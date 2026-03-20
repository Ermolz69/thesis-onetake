using System.Threading;
using System.Collections.Generic;
using Moq;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Comments;
using OneTake.Application.Services;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;
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
            commentsMock.Verify(r => r.AddAsync(It.Is<Comment>(c => c.PostId == postId && c.UserId == userId && c.Text == "Nice post")), Times.Once);
            unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
            notificationMock.Verify(
                n => n.CreateAsync(post.AuthorId, NotificationType.CommentOnPost, "New comment", "commenter commented on your post", "post", postId, It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task CreateCommentAsync_DoesNotNotify_WhenAuthorCommentsOwnPost()
        {
            Guid postId = Guid.NewGuid();
            Guid userId = Guid.NewGuid();
            Post post = new Post { Id = postId, AuthorId = userId };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<ICommentRepository> commentsMock = new Mock<ICommentRepository>();
            unitOfWorkMock.Setup(u => u.Comments).Returns(commentsMock.Object);
            Mock<IUserRepository> usersMock = new Mock<IUserRepository>();
            usersMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(new User { Username = "owner" });
            unitOfWorkMock.Setup(u => u.Users).Returns(usersMock.Object);
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();

            ICommentService service = new CommentService(unitOfWorkMock.Object, notificationMock.Object);
            Result<CommentDto> result = await service.CreateCommentAsync(postId, userId, new CreateCommentRequest("Owner note"));

            Assert.True(result.IsSuccess);
            notificationMock.Verify(
                n => n.CreateAsync(It.IsAny<Guid>(), It.IsAny<NotificationType>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()),
                Times.Never);
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

        [Fact]
        public async Task DeleteCommentAsync_ReturnsForbidden_WhenUserIsNotCommentOwnerOrPostOwner()
        {
            Guid postId = Guid.NewGuid();
            Guid commentOwnerId = Guid.NewGuid();
            Guid postOwnerId = Guid.NewGuid();
            Guid currentUserId = Guid.NewGuid();
            Comment comment = new Comment { Id = Guid.NewGuid(), PostId = postId, UserId = commentOwnerId, Text = "x" };
            Post post = new Post { Id = postId, AuthorId = postOwnerId };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<ICommentRepository> commentsMock = new Mock<ICommentRepository>();
            commentsMock.Setup(r => r.GetByIdAsync(comment.Id)).ReturnsAsync(comment);
            unitOfWorkMock.Setup(u => u.Comments).Returns(commentsMock.Object);
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();

            ICommentService service = new CommentService(unitOfWorkMock.Object, notificationMock.Object);
            Result result = await service.DeleteCommentAsync(postId, comment.Id, currentUserId, false);

            Assert.False(result.IsSuccess);
            commentsMock.Verify(r => r.Remove(It.IsAny<Comment>()), Times.Never);
        }

        [Fact]
        public async Task DeleteCommentAsync_ReturnsSuccess_WhenPostOwnerDeletesAnotherUsersComment()
        {
            Guid postId = Guid.NewGuid();
            Guid commentOwnerId = Guid.NewGuid();
            Guid postOwnerId = Guid.NewGuid();
            Comment comment = new Comment { Id = Guid.NewGuid(), PostId = postId, UserId = commentOwnerId, Text = "x" };
            Post post = new Post { Id = postId, AuthorId = postOwnerId };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<ICommentRepository> commentsMock = new Mock<ICommentRepository>();
            commentsMock.Setup(r => r.GetByIdAsync(comment.Id)).ReturnsAsync(comment);
            unitOfWorkMock.Setup(u => u.Comments).Returns(commentsMock.Object);
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();

            ICommentService service = new CommentService(unitOfWorkMock.Object, notificationMock.Object);
            Result result = await service.DeleteCommentAsync(postId, comment.Id, postOwnerId, false);

            Assert.True(result.IsSuccess);
            commentsMock.Verify(r => r.Remove(comment), Times.Once);
            unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
