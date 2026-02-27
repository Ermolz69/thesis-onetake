using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using OneTake.Domain.Entities;

namespace OneTake.Application.Common.Interfaces
{
    public interface ICommentRepository : IRepository<Comment>
    {
        Task<List<Comment>> GetByPostIdAsync(Guid postId);
        Task<List<Comment>> GetByPostIdWithUserAsync(Guid postId);
        Task<int> CountByPostIdAsync(Guid postId);
    }
}

