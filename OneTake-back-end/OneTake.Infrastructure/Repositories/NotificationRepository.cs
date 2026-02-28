using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using OneTake.Application.Common.Interfaces;
using OneTake.Domain.Entities;
using OneTake.Infrastructure.Persistence;

namespace OneTake.Infrastructure.Repositories
{
    public class NotificationRepository : Repository<Notification>, INotificationRepository
    {
        public NotificationRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<int> GetUnreadCountAsync(Guid userId)
        {
            return await _dbSet.CountAsync(n => n.UserId == userId && !n.IsRead);
        }

        public async Task<(List<Notification> Items, bool HasMore)> GetPagedAsync(Guid userId, string? cursor, int pageSize)
        {
            IQueryable<Notification> query = _dbSet
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ThenByDescending(n => n.Id)
                .AsQueryable();

            if (!string.IsNullOrEmpty(cursor))
            {
                string[] cursorParts = cursor.Split('|');
                if (cursorParts.Length == 2 &&
                    DateTime.TryParse(cursorParts[0], out var cursorDate) &&
                    Guid.TryParse(cursorParts[1], out var cursorId))
                {
                    query = query.Where(n =>
                        n.CreatedAt < cursorDate ||
                        (n.CreatedAt == cursorDate && n.Id.CompareTo(cursorId) < 0));
                }
            }

            List<Notification> items = await query.Take(pageSize + 1).ToListAsync();
            bool hasMore = items.Count > pageSize;
            if (hasMore)
                items = items.Take(pageSize).ToList();

            return (items, hasMore);
        }
    }
}
