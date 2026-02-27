using System.Threading.Tasks;
using OneTake.Application.Common.Interfaces;
using OneTake.Infrastructure.Persistence;

namespace OneTake.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;

        public UnitOfWork(AppDbContext context)
        {
            _context = context;
            Users = new UserRepository(context);
            Posts = new PostRepository(context);
            Comments = new CommentRepository(context);
            Reactions = new ReactionRepository(context);
            Tags = new TagRepository(context);
            Profiles = new ProfileRepository(context);
            MediaObjects = new MediaObjectRepository(context);
            Follows = new FollowRepository(context);
        }

        public IUserRepository Users { get; }
        public IPostRepository Posts { get; }
        public ICommentRepository Comments { get; }
        public IReactionRepository Reactions { get; }
        public ITagRepository Tags { get; }
        public IProfileRepository Profiles { get; }
        public IMediaObjectRepository MediaObjects { get; }
        public IFollowRepository Follows { get; }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}

