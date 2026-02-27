using System;
using System.Threading.Tasks;
using OneTake.Domain.Entities;

namespace OneTake.Application.Common.Interfaces
{
    public interface IProfileRepository : IRepository<Profile>
    {
        Task<Profile?> GetByUserIdAsync(Guid userId);
    }
}

