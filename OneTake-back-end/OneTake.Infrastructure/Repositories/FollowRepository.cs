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
    public class FollowRepository : Repository<Follow>, IFollowRepository
    {
        public FollowRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Follow?> GetByFollowerAndFollowedAsync(Guid followerId, Guid followedId)
        {
            return await _dbSet
                .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowedId == followedId);
        }

        public async Task<List<Follow>> GetFollowersAsync(Guid userId)
        {
            return await _dbSet
                .Where(f => f.FollowedId == userId)
                .ToListAsync();
        }

        public async Task<List<Follow>> GetFollowingAsync(Guid userId)
        {
            return await _dbSet
                .Where(f => f.FollowerId == userId)
                .ToListAsync();
        }

        public async Task<bool> IsFollowingAsync(Guid followerId, Guid followedId)
        {
            return await _dbSet
                .AnyAsync(f => f.FollowerId == followerId && f.FollowedId == followedId);
        }
    }
}

