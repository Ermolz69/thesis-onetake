using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using OneTake.Application.Common.Interfaces;
using OneTake.Domain.Entities;
using OneTake.Infrastructure.Persistence;

namespace OneTake.Infrastructure.Repositories
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _dbSet.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            return await _dbSet.FirstOrDefaultAsync(u => u.Username == username);
        }

        public async Task<User?> GetByEmailOrUsernameAsync(string emailOrUsername)
        {
            return await _dbSet.FirstOrDefaultAsync(u => u.Email == emailOrUsername || u.Username == emailOrUsername);
        }

        public async Task<bool> ExistsByEmailOrUsernameAsync(string email, string username)
        {
            return await _dbSet.AnyAsync(u => u.Email == email || u.Username == username);
        }

        public async Task<User?> GetByIdWithProfileAsync(Guid id)
        {
            return await _dbSet
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<List<User>> GetAllUsersAsync()
        {
            return await _dbSet.ToListAsync();
        }
    }
}

