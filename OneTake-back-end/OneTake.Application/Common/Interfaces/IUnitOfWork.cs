using System.Threading.Tasks;

namespace OneTake.Application.Common.Interfaces
{
    public interface IUnitOfWork
    {
        IUserRepository Users { get; }
        IPostRepository Posts { get; }
        ICommentRepository Comments { get; }
        IReactionRepository Reactions { get; }
        ITagRepository Tags { get; }
        IProfileRepository Profiles { get; }
        IMediaObjectRepository MediaObjects { get; }
        IFollowRepository Follows { get; }
        Task<int> SaveChangesAsync();
    }
}

