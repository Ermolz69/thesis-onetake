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
    public class CommentRepository : Repository<Comment>, ICommentRepository
    {
        public CommentRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<List<Comment>> GetByPostIdAsync(Guid postId)
        {
            return await _dbSet
                .Where(c => c.PostId == postId)
                .ToListAsync();
        }

        public async Task<List<Comment>> GetByPostIdWithUserAsync(Guid postId)
        {
            return await _dbSet
                .Include(c => c.User)
                .Where(c => c.PostId == postId)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<int> CountByPostIdAsync(Guid postId)
        {
            return await _dbSet
                .CountAsync(c => c.PostId == postId);
        }
    }
}

