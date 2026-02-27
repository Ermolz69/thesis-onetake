using OneTake.Domain.Entities;

namespace OneTake.Application.Common.Interfaces
{
    public interface IJwtProvider
    {
        string Generate(User user);
    }
}

