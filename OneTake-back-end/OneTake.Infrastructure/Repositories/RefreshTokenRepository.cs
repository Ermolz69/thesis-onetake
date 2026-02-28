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
    public class RefreshTokenRepository : Repository<RefreshToken>, IRefreshTokenRepository
    {
        public RefreshTokenRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<RefreshToken?> FindByTokenHashAsync(string tokenHash)
        {
            return await _dbSet
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);
        }

        public async Task RevokeAllForUserAsync(Guid userId)
        {
            List<RefreshToken> tokens = await _dbSet.Where(rt => rt.UserId == userId && rt.RevokedAt == null).ToListAsync();
            DateTime now = DateTime.UtcNow;
            foreach (RefreshToken t in tokens)
            {
                t.RevokedAt = now;
                _dbSet.Update(t);
            }
        }
    }
}
