using System.Security.Cryptography;
using System.Text;
using OneTake.Application.Common.Interfaces;

namespace OneTake.Infrastructure.Services
{
    public class RefreshTokenHasher : IRefreshTokenHasher
    {
        public string Hash(string refreshToken)
        {
            byte[] bytes = Encoding.UTF8.GetBytes(refreshToken);
            byte[] hash = SHA256.HashData(bytes);
            return Convert.ToHexString(hash);
        }
    }
}
