using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading;
using Moq;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Notifications;
using OneTake.Application.Services;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;
using Xunit;

namespace OneTake.UnitTests.Services
{
    public class NotificationServiceTests
    {
        [Fact]
        public async Task GetUnreadCountAsync_ReturnsSuccess()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<INotificationRepository> notificationsMock = new Mock<INotificationRepository>();
            notificationsMock.Setup(r => r.GetUnreadCountAsync(It.IsAny<Guid>())).ReturnsAsync(3);
            unitOfWorkMock.Setup(u => u.Notifications).Returns(notificationsMock.Object);

            INotificationService service = new NotificationService(unitOfWorkMock.Object);
            Result<int> result = await service.GetUnreadCountAsync(Guid.NewGuid());

            Assert.True(result.IsSuccess);
            Assert.Equal(3, result.Value);
        }

        [Fact]
        public async Task GetPagedAsync_ReturnsSuccessWithEmptyList_WhenNoNotifications()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<INotificationRepository> notificationsMock = new Mock<INotificationRepository>();
            notificationsMock.Setup(r => r.GetPagedAsync(It.IsAny<Guid>(), It.IsAny<string?>(), It.IsAny<int>()))
                .ReturnsAsync((new List<Notification>(), false));
            unitOfWorkMock.Setup(u => u.Notifications).Returns(notificationsMock.Object);

            INotificationService service = new NotificationService(unitOfWorkMock.Object);
            Result<PagedNotificationsResponse> result = await service.GetPagedAsync(Guid.NewGuid(), null, 10);

            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Empty(result.Value.Items);
            Assert.False(result.Value.HasMore);
        }

        [Fact]
        public async Task GetPagedAsync_ReturnsSuccessWithItems_WhenNotificationsExist()
        {
            DateTime createdAt = new DateTime(2026, 3, 20, 10, 30, 0, DateTimeKind.Utc);
            Notification n = new Notification
            {
                Id = Guid.NewGuid(),
                Title = "Hi",
                Body = "Body",
                Type = NotificationType.LikeOnPost,
                CreatedAt = createdAt
            };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<INotificationRepository> notificationsMock = new Mock<INotificationRepository>();
            notificationsMock.Setup(r => r.GetPagedAsync(It.IsAny<Guid>(), It.IsAny<string?>(), It.IsAny<int>()))
                .ReturnsAsync((new List<Notification> { n }, true));
            unitOfWorkMock.Setup(u => u.Notifications).Returns(notificationsMock.Object);

            INotificationService service = new NotificationService(unitOfWorkMock.Object);
            Result<PagedNotificationsResponse> result = await service.GetPagedAsync(Guid.NewGuid(), null, 10);

            Assert.True(result.IsSuccess);
            Assert.Single(result.Value!.Items);
            Assert.Equal("Hi", result.Value.Items[0].Title);
            Assert.True(result.Value.HasMore);
            Assert.Equal($"{createdAt:O}|{n.Id}", result.Value.NextCursor);
        }

        [Fact]
        public async Task MarkAsReadAsync_ReturnsNotFound_WhenNotificationDoesNotExist()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<INotificationRepository> notificationsMock = new Mock<INotificationRepository>();
            notificationsMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Notification?)null);
            unitOfWorkMock.Setup(u => u.Notifications).Returns(notificationsMock.Object);

            INotificationService service = new NotificationService(unitOfWorkMock.Object);
            Result result = await service.MarkAsReadAsync(Guid.NewGuid(), Guid.NewGuid());

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task MarkAsReadAsync_ReturnsForbidden_WhenNotOwner()
        {
            Guid ownerId = Guid.NewGuid();
            Guid userId = Guid.NewGuid();
            Notification n = new Notification { UserId = ownerId };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<INotificationRepository> notificationsMock = new Mock<INotificationRepository>();
            notificationsMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(n);
            unitOfWorkMock.Setup(u => u.Notifications).Returns(notificationsMock.Object);

            INotificationService service = new NotificationService(unitOfWorkMock.Object);
            Result result = await service.MarkAsReadAsync(n.Id, userId);

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task MarkAsReadAsync_ReturnsSuccess_WhenOwner()
        {
            Guid userId = Guid.NewGuid();
            Notification n = new Notification { UserId = userId, IsRead = false };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<INotificationRepository> notificationsMock = new Mock<INotificationRepository>();
            notificationsMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(n);
            unitOfWorkMock.Setup(u => u.Notifications).Returns(notificationsMock.Object);

            INotificationService service = new NotificationService(unitOfWorkMock.Object);
            Result result = await service.MarkAsReadAsync(n.Id, userId);

            Assert.True(result.IsSuccess);
            Assert.True(n.IsRead);
        }

        [Fact]
        public async Task MarkAllAsReadAsync_ReturnsSuccess()
        {
            Guid userId = Guid.NewGuid();
            Notification unreadOne = new Notification { UserId = userId, IsRead = false };
            Notification unreadTwo = new Notification { UserId = userId, IsRead = false };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<INotificationRepository> notificationsMock = new Mock<INotificationRepository>();
            notificationsMock.Setup(r => r.FindAsync(It.IsAny<Expression<Func<Notification, bool>>>()))
                .ReturnsAsync(new List<Notification> { unreadOne, unreadTwo });
            unitOfWorkMock.Setup(u => u.Notifications).Returns(notificationsMock.Object);

            INotificationService service = new NotificationService(unitOfWorkMock.Object);
            Result result = await service.MarkAllAsReadAsync(userId);

            Assert.True(result.IsSuccess);
            Assert.True(unreadOne.IsRead);
            Assert.True(unreadTwo.IsRead);
            notificationsMock.Verify(r => r.Update(It.IsAny<Notification>()), Times.Exactly(2));
            unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task CreateAsync_PersistsNotification()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<INotificationRepository> notificationsMock = new Mock<INotificationRepository>();
            unitOfWorkMock.Setup(u => u.Notifications).Returns(notificationsMock.Object);

            INotificationService service = new NotificationService(unitOfWorkMock.Object);
            await service.CreateAsync(Guid.NewGuid(), NotificationType.CommentOnPost, "Title", "Body", "post", Guid.NewGuid());

            notificationsMock.Verify(r => r.AddAsync(It.Is<Notification>(n => n.Title == "Title" && n.Body == "Body")), Times.Once);
            unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
