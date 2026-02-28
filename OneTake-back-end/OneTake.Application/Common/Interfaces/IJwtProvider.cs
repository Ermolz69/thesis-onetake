using OneTake.Domain.Entities;

namespace OneTake.Application.Common.Interfaces
{
    public interface IJwtProvider
    {
        string GenerateAccessToken(User user);
        string GenerateRefreshToken();
    }
}

