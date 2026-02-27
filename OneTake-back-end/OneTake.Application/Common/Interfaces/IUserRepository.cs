using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using OneTake.Domain.Entities;

namespace OneTake.Application.Common.Interfaces
{
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByUsernameAsync(string username);
        Task<User?> GetByEmailOrUsernameAsync(string emailOrUsername);
        Task<User?> GetByIdWithProfileAsync(Guid id);
        Task<List<User>> GetAllUsersAsync();
        Task<bool> ExistsByEmailOrUsernameAsync(string email, string username);
    }
}

