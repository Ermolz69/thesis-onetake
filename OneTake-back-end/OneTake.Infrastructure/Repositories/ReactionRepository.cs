using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using OneTake.Application.Common.Interfaces;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;
using OneTake.Infrastructure.Persistence;

namespace OneTake.Infrastructure.Repositories
{
    public class ReactionRepository : Repository<Reaction>, IReactionRepository
    {
        public ReactionRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Reaction?> GetByPostAndUserAsync(Guid postId, Guid userId, ReactionType type)
        {
            return await _dbSet
                .FirstOrDefaultAsync(r => r.PostId == postId && r.UserId == userId && r.Type == type);
        }

        public async Task<bool> ExistsByPostAndUserAsync(Guid postId, Guid userId, ReactionType type)
        {
            return await _dbSet
                .AnyAsync(r => r.PostId == postId && r.UserId == userId && r.Type == type);
        }

        public async Task<int> CountByPostAndTypeAsync(Guid postId, ReactionType type)
        {
            return await _dbSet
                .CountAsync(r => r.PostId == postId && r.Type == type);
        }
    }
}

