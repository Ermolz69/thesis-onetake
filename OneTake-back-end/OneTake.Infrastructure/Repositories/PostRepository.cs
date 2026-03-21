using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using OneTake.Application.Common.Interfaces;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;
using OneTake.Infrastructure.Persistence;

namespace OneTake.Infrastructure.Repositories
{
    public class PostRepository : Repository<Post>, IPostRepository
    {
        public PostRepository(AppDbContext context) : base(context)
        {
        }

        private static (DateTime CursorDate, Guid CursorId)? ParseCursor(string? cursor)
        {
            if (string.IsNullOrEmpty(cursor))
            {
                return null;
            }

            string[] cursorParts = cursor.Split('|');
            if (cursorParts.Length != 2 ||
                !DateTime.TryParse(cursorParts[0], CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out DateTime cursorDate) ||
                !Guid.TryParse(cursorParts[1], out Guid cursorId))
            {
                return null;
            }

            return (cursorDate, cursorId);
        }

        private static DateTime NormalizeUtc(DateTime value)
        {
            return value.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
                : value.ToUniversalTime();
        }

        private static (List<Post> Posts, bool HasMore) ApplyCursorPage(List<Post> posts, (DateTime CursorDate, Guid CursorId)? cursorData, int pageSize)
        {
            IEnumerable<Post> filtered = posts;
            if (cursorData.HasValue)
            {
                DateTime cursorDateUtc = NormalizeUtc(cursorData.Value.CursorDate);
                filtered = filtered.Where(p =>
                {
                    DateTime createdAtUtc = NormalizeUtc(p.CreatedAt);
                    return createdAtUtc < cursorDateUtc ||
                           (createdAtUtc == cursorDateUtc && p.Id.CompareTo(cursorData.Value.CursorId) < 0);
                });
            }

            List<Post> page = filtered.Take(pageSize + 1).ToList();
            bool hasMore = page.Count > pageSize;
            if (hasMore)
            {
                page = page.Take(pageSize).ToList();
            }

            return (page, hasMore);
        }

        public async Task<Post?> GetByIdWithDetailsAsync(Guid id)
        {
            return await _dbSet
                .Include(p => p.Author)
                .Include(p => p.Media)
                .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<(List<Post> Posts, bool HasMore)> GetPostsWithCursorAsync(string? cursor, int pageSize)
        {
            (DateTime CursorDate, Guid CursorId)? cursorData = ParseCursor(cursor);
            IQueryable<Post> query = _dbSet
                .Include(p => p.Author)
                .Include(p => p.Media)
                .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
                .Where(p => p.Visibility == Visibility.Public)
                .OrderByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id)
                .AsQueryable();

            List<Post> posts = await query.ToListAsync();
            return ApplyCursorPage(posts, cursorData, pageSize);
        }

        public async Task<(List<Post> Posts, bool HasMore)> GetByAuthorIdWithCursorAsync(Guid authorId, string? cursor, int pageSize)
        {
            (DateTime CursorDate, Guid CursorId)? cursorData = ParseCursor(cursor);
            IQueryable<Post> query = _dbSet
                .Include(p => p.Author)
                .Include(p => p.Media)
                .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
                .Where(p => p.AuthorId == authorId && p.Visibility == Visibility.Public)
                .OrderByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id)
                .AsQueryable();

            List<Post> posts = await query.ToListAsync();
            return ApplyCursorPage(posts, cursorData, pageSize);
        }

        public async Task<(List<Post> Posts, bool HasMore)> GetByAuthorIdsWithCursorAsync(IEnumerable<Guid> authorIds, string? cursor, int pageSize)
        {
            List<Guid> idList = authorIds.ToList();
            if (idList.Count == 0)
            {
                return (new List<Post>(), false);
            }

            (DateTime CursorDate, Guid CursorId)? cursorData = ParseCursor(cursor);
            IQueryable<Post> query = _dbSet
                .Include(p => p.Author)
                .Include(p => p.Media)
                .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
                .Where(p => idList.Contains(p.AuthorId) && p.Visibility == Visibility.Public)
                .OrderByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id)
                .AsQueryable();

            List<Post> posts = await query.ToListAsync();
            return ApplyCursorPage(posts, cursorData, pageSize);
        }

        public async Task<(List<Post> Posts, bool HasMore)> GetByTagWithCursorAsync(string tagName, string? cursor, int pageSize)
        {
            (DateTime CursorDate, Guid CursorId)? cursorData = ParseCursor(cursor);
            IQueryable<Post> query = _dbSet
                .Include(p => p.Author)
                .Include(p => p.Media)
                .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
                .Where(p => p.Visibility == Visibility.Public && p.PostTags.Any(pt => pt.Tag!.Name == tagName))
                .OrderByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id)
                .AsQueryable();

            List<Post> posts = await query.ToListAsync();
            return ApplyCursorPage(posts, cursorData, pageSize);
        }

        public async Task<(List<Post> Posts, bool HasMore)> SearchAsync(string query, string? cursor, int pageSize)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return (new List<Post>(), false);
            }

            string term = query.Trim();
            string pattern = $"%{term}%";

            IQueryable<Post> queryable = _dbSet
                .Include(p => p.Author).ThenInclude(a => a!.Profile)
                .Include(p => p.Media)
                .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
                .Where(p => p.Visibility == Visibility.Public)
                .Where(p =>
                    EF.Functions.ILike(p.ContentText, pattern) ||
                    p.PostTags.Any(pt => pt.Tag != null && EF.Functions.ILike(pt.Tag.Name, pattern)) ||
                    (p.Author != null && EF.Functions.ILike(p.Author.Username, pattern)) ||
                    (p.Author != null && p.Author.Profile != null && EF.Functions.ILike(p.Author.Profile.FullName, pattern)))
                .OrderByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id);

            if (!string.IsNullOrEmpty(cursor))
            {
                string[] cursorParts = cursor.Split('|');
                if (cursorParts.Length == 2 &&
                    DateTime.TryParse(cursorParts[0], out var cursorDate) &&
                    Guid.TryParse(cursorParts[1], out var cursorId))
                {
                    queryable = queryable.Where(p =>
                        p.CreatedAt < cursorDate ||
                        (p.CreatedAt == cursorDate && p.Id.CompareTo(cursorId) < 0));
                }
            }

            List<Post> posts = await queryable
                .Take(pageSize + 1)
                .ToListAsync();

            bool hasMore = posts.Count > pageSize;
            if (hasMore)
            {
                posts = posts.Take(pageSize).ToList();
            }

            return (posts, hasMore);
        }
    }
}
