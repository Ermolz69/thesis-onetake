using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using OneTake.Application.Common.Errors;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Notifications;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;

namespace OneTake.Application.Services
{
    public interface INotificationService
    {
        Task CreateAsync(Guid userId, NotificationType type, string title, string body, string? entityType, Guid? entityId, CancellationToken cancellationToken = default);
        Task<Result<int>> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<Result<PagedNotificationsResponse>> GetPagedAsync(Guid userId, string? cursor, int pageSize, CancellationToken cancellationToken = default);
        Task<Result> MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken = default);
        Task<Result> MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default);
    }

    public class NotificationService : INotificationService
    {
        private readonly IUnitOfWork _unitOfWork;

        public NotificationService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task CreateAsync(Guid userId, NotificationType type, string title, string body, string? entityType, Guid? entityId, CancellationToken cancellationToken = default)
        {
            Notification notification = new Notification
            {
                UserId = userId,
                Type = type,
                Title = title,
                Body = body,
                EntityType = entityType,
                EntityId = entityId,
                IsRead = false
            };
            await _unitOfWork.Notifications.AddAsync(notification);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        public async Task<Result<int>> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            int count = await _unitOfWork.Notifications.GetUnreadCountAsync(userId);
            return Result<int>.Success(count);
        }

        public async Task<Result<PagedNotificationsResponse>> GetPagedAsync(Guid userId, string? cursor, int pageSize, CancellationToken cancellationToken = default)
        {
            (List<Notification> items, bool hasMore) = await _unitOfWork.Notifications.GetPagedAsync(userId, cursor, pageSize);
            List<NotificationDto> dtos = items.Select(n => new NotificationDto(
                n.Id,
                n.Type.ToString(),
                n.Title,
                n.Body,
                n.EntityType,
                n.EntityId,
                n.IsRead,
                n.CreatedAt
            )).ToList();
            string? nextCursor = null;
            if (hasMore && items.Count > 0)
            {
                Notification last = items.Last();
                nextCursor = $"{last.CreatedAt:O}|{last.Id}";
            }
            return Result<PagedNotificationsResponse>.Success(new PagedNotificationsResponse(dtos, nextCursor, hasMore));
        }

        public async Task<Result> MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken = default)
        {
            Notification? notification = await _unitOfWork.Notifications.GetByIdAsync(notificationId);
            if (notification == null)
            {
                return Result.Fail(new NotFoundError("NOTIFICATION_NOT_FOUND", "Notification not found"));
            }

            if (notification.UserId != userId)
            {
                return Result.Fail(new ForbiddenError("FORBIDDEN", "Not your notification"));
            }
            notification.IsRead = true;
            _unitOfWork.Notifications.Update(notification);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }

        public async Task<Result> MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            List<Notification> unread = await _unitOfWork.Notifications.FindAsync(n => n.UserId == userId && !n.IsRead);
            foreach (Notification n in unread)
            {
                n.IsRead = true;
                _unitOfWork.Notifications.Update(n);
            }
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
    }
}
