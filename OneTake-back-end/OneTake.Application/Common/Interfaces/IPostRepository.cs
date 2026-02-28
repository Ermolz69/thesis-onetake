using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using OneTake.Domain.Entities;

namespace OneTake.Application.Common.Interfaces
{
    public interface IPostRepository : IRepository<Post>
    {
        Task<Post?> GetByIdWithDetailsAsync(Guid id);
        Task<(List<Post> Posts, bool HasMore)> GetPostsWithCursorAsync(string? cursor, int pageSize);
        Task<(List<Post> Posts, bool HasMore)> GetByAuthorIdWithCursorAsync(Guid authorId, string? cursor, int pageSize);
        Task<(List<Post> Posts, bool HasMore)> GetByAuthorIdsWithCursorAsync(IEnumerable<Guid> authorIds, string? cursor, int pageSize);
        Task<(List<Post> Posts, bool HasMore)> GetByTagWithCursorAsync(string tagName, string? cursor, int pageSize);
        Task<(List<Post> Posts, bool HasMore)> SearchAsync(string query, string? cursor, int pageSize);
    }
}

