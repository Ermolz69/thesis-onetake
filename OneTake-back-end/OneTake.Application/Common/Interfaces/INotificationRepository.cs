using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using OneTake.Domain.Entities;

namespace OneTake.Application.Common.Interfaces
{
    public interface INotificationRepository : IRepository<Notification>
    {
        Task<int> GetUnreadCountAsync(Guid userId);
        Task<(List<Notification> Items, bool HasMore)> GetPagedAsync(Guid userId, string? cursor, int pageSize);
    }
}
