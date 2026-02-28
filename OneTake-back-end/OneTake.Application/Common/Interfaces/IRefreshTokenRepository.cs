using System;
using System.Threading.Tasks;
using OneTake.Domain.Entities;

namespace OneTake.Application.Common.Interfaces
{
    public interface IRefreshTokenRepository : IRepository<RefreshToken>
    {
        Task<RefreshToken?> FindByTokenHashAsync(string tokenHash);
        Task RevokeAllForUserAsync(Guid userId);
    }
}
