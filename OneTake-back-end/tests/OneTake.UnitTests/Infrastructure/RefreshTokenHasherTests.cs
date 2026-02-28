using OneTake.Infrastructure.Services;
using Xunit;

namespace OneTake.UnitTests.Infrastructure
{
    public class RefreshTokenHasherTests
    {
        private readonly RefreshTokenHasher _hasher = new RefreshTokenHasher();

        [Fact]
        public void Hash_ReturnsNonEmptyHexString_WhenTokenProvided()
        {
            string token = "refresh-token-value";
            string hash = _hasher.Hash(token);

            Assert.NotNull(hash);
            Assert.NotEmpty(hash);
            Assert.NotEqual(token, hash);
            Assert.True(System.Text.RegularExpressions.Regex.IsMatch(hash, @"^[0-9A-F]+$"), "Hash should be hex string");
        }

        [Fact]
        public void Hash_ReturnsSameHash_WhenCalledTwiceWithSameInput()
        {
            string token = "same-token";
            string hash1 = _hasher.Hash(token);
            string hash2 = _hasher.Hash(token);

            Assert.Equal(hash1, hash2);
        }

        [Fact]
        public void Hash_ReturnsDifferentHash_WhenInputDifferent()
        {
            string hash1 = _hasher.Hash("token-a");
            string hash2 = _hasher.Hash("token-b");

            Assert.NotEqual(hash1, hash2);
        }

        [Fact]
        public void Hash_HandlesEmptyString()
        {
            string hash = _hasher.Hash("");
            Assert.NotNull(hash);
            Assert.NotEmpty(hash);
        }
    }
}
