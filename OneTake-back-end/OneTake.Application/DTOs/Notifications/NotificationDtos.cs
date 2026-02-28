using System;

namespace OneTake.Application.DTOs.Notifications
{
    public record NotificationDto(
        Guid Id,
        string Type,
        string Title,
        string Body,
        string? EntityType,
        Guid? EntityId,
        bool IsRead,
        DateTime CreatedAt
    );

    public record PagedNotificationsResponse(
        System.Collections.Generic.List<NotificationDto> Items,
        string? NextCursor,
        bool HasMore
    );
}
