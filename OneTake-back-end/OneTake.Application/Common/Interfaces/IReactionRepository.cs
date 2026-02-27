using System;
using System.Threading.Tasks;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;

namespace OneTake.Application.Common.Interfaces
{
    public interface IReactionRepository : IRepository<Reaction>
    {
        Task<Reaction?> GetByPostAndUserAsync(Guid postId, Guid userId, ReactionType type);
        Task<bool> ExistsByPostAndUserAsync(Guid postId, Guid userId, ReactionType type);
        Task<int> CountByPostAndTypeAsync(Guid postId, ReactionType type);
    }
}

