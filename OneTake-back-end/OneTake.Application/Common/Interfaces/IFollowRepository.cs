using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using OneTake.Domain.Entities;

namespace OneTake.Application.Common.Interfaces
{
    public interface IFollowRepository : IRepository<Follow>
    {
        Task<Follow?> GetByFollowerAndFollowedAsync(Guid followerId, Guid followedId);
        Task<List<Follow>> GetFollowersAsync(Guid userId);
        Task<List<Follow>> GetFollowingAsync(Guid userId);
        Task<bool> IsFollowingAsync(Guid followerId, Guid followedId);
    }
}

