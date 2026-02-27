using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;
using OneTake.Infrastructure.Persistence;
using Xunit;

namespace OneTake.IntegrationTests.Database
{
    public class DbContextTests : IClassFixture<WebApiFactory>
    {
        private readonly WebApiFactory _factory;

        public DbContextTests(WebApiFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task SaveChanges_ShouldSaveUser_WhenUserIsValid()
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = "TestUser",
                Email = "test@example.com",
                PasswordHash = "hashed_password",
                Role = UserRole.Author
            };

            context.Users.Add(user);
            await context.SaveChangesAsync();

            var savedUser = await context.Users.FirstOrDefaultAsync(u => u.Id == user.Id);
            
            Assert.NotNull(savedUser);
            Assert.Equal(user.Username, savedUser.Username);
            Assert.Equal(user.Email, savedUser.Email);
        }

        [Fact]
        public async Task Users_DbSet_ShouldBeQueryable()
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var users = await context.Users.ToListAsync();
            
            Assert.NotNull(users);
        }
    }
}

