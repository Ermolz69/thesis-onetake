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
    public class PostRepository : Repository<Post>, IPostRepository
    {
        public PostRepository(AppDbContext context) : base(context)
        {
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
            var query = _dbSet
                .Include(p => p.Author)
                .Include(p => p.Media)
                .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
                .OrderByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id)
                .AsQueryable();

            if (!string.IsNullOrEmpty(cursor))
            {
                var cursorParts = cursor.Split('|');
                if (cursorParts.Length == 2 && 
                    DateTime.TryParse(cursorParts[0], out var cursorDate) &&
                    Guid.TryParse(cursorParts[1], out var cursorId))
                {
                    query = query.Where(p => 
                        p.CreatedAt < cursorDate || 
                        (p.CreatedAt == cursorDate && p.Id.CompareTo(cursorId) < 0));
                }
            }

            var posts = await query
                .Take(pageSize + 1)
                .ToListAsync();

            var hasMore = posts.Count > pageSize;
            if (hasMore)
            {
                posts = posts.Take(pageSize).ToList();
            }

            return (posts, hasMore);
        }

        public async Task<(List<Post> Posts, bool HasMore)> GetByAuthorIdWithCursorAsync(Guid authorId, string? cursor, int pageSize)
        {
            var query = _dbSet
                .Include(p => p.Author)
                .Include(p => p.Media)
                .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
                .Where(p => p.AuthorId == authorId)
                .OrderByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id)
                .AsQueryable();

            if (!string.IsNullOrEmpty(cursor))
            {
                var cursorParts = cursor.Split('|');
                if (cursorParts.Length == 2 && 
                    DateTime.TryParse(cursorParts[0], out var cursorDate) &&
                    Guid.TryParse(cursorParts[1], out var cursorId))
                {
                    query = query.Where(p => 
                        p.CreatedAt < cursorDate || 
                        (p.CreatedAt == cursorDate && p.Id.CompareTo(cursorId) < 0));
                }
            }

            var posts = await query
                .Take(pageSize + 1)
                .ToListAsync();

            var hasMore = posts.Count > pageSize;
            if (hasMore)
            {
                posts = posts.Take(pageSize).ToList();
            }

            return (posts, hasMore);
        }

        public async Task<(List<Post> Posts, bool HasMore)> GetByTagWithCursorAsync(string tagName, string? cursor, int pageSize)
        {
            var query = _dbSet
                .Include(p => p.Author)
                .Include(p => p.Media)
                .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
                .Where(p => p.PostTags.Any(pt => pt.Tag!.Name == tagName))
                .OrderByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id)
                .AsQueryable();

            if (!string.IsNullOrEmpty(cursor))
            {
                var cursorParts = cursor.Split('|');
                if (cursorParts.Length == 2 && 
                    DateTime.TryParse(cursorParts[0], out var cursorDate) &&
                    Guid.TryParse(cursorParts[1], out var cursorId))
                {
                    query = query.Where(p => 
                        p.CreatedAt < cursorDate || 
                        (p.CreatedAt == cursorDate && p.Id.CompareTo(cursorId) < 0));
                }
            }

            var posts = await query
                .Take(pageSize + 1)
                .ToListAsync();

            var hasMore = posts.Count > pageSize;
            if (hasMore)
            {
                posts = posts.Take(pageSize).ToList();
            }

            return (posts, hasMore);
        }
    }
}

