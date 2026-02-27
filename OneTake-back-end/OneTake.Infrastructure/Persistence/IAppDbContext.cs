using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using OneTake.Domain.Entities;

namespace OneTake.Infrastructure.Persistence
{
    public interface IAppDbContext
    {
        DbSet<User> Users { get; }
        DbSet<Profile> Profiles { get; }
        DbSet<Post> Posts { get; }
        DbSet<MediaObject> MediaObjects { get; }
        DbSet<Comment> Comments { get; }
        DbSet<Reaction> Reactions { get; }
        DbSet<Follow> Follows { get; }
        DbSet<Tag> Tags { get; }
        DbSet<PostTag> PostTags { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}

