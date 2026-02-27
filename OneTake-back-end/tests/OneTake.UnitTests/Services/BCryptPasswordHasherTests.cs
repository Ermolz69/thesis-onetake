using OneTake.Infrastructure.Services;
using Xunit;

namespace OneTake.UnitTests.Services
{
    public class BCryptPasswordHasherTests
    {
        private readonly BCryptPasswordHasher _hasher;

        public BCryptPasswordHasherTests()
        {
            _hasher = new BCryptPasswordHasher();
        }

        [Fact]
        public void Hash_ShouldReturnHash_WhenPasswordProvided()
        {
            var password = "TestPassword123";
            
            var hash = _hasher.Hash(password);
            
            Assert.NotNull(hash);
            Assert.NotEmpty(hash);
            Assert.NotEqual(password, hash);
        }

        [Fact]
        public void Hash_ShouldReturnDifferentHash_WhenCalledTwice()
        {
            var password = "TestPassword123";
            
            var hash1 = _hasher.Hash(password);
            var hash2 = _hasher.Hash(password);
            
            Assert.NotEqual(hash1, hash2);
        }

        [Fact]
        public void Verify_ShouldReturnTrue_WhenPasswordMatchesHash()
        {
            var password = "TestPassword123";
            var hash = _hasher.Hash(password);
            
            var result = _hasher.Verify(password, hash);
            
            Assert.True(result);
        }

        [Fact]
        public void Verify_ShouldReturnFalse_WhenPasswordDoesNotMatchHash()
        {
            var password = "TestPassword123";
            var wrongPassword = "WrongPassword123";
            var hash = _hasher.Hash(password);
            
            var result = _hasher.Verify(wrongPassword, hash);
            
            Assert.False(result);
        }

        [Fact]
        public void Verify_ShouldReturnFalse_WhenHashIsInvalid()
        {
            var password = "TestPassword123";
            var invalidHash = "invalid_hash_string";
            
            var result = _hasher.Verify(password, invalidHash);
            
            Assert.False(result);
        }
    }
}

