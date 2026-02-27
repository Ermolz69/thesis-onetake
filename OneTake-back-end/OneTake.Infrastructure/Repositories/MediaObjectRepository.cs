using OneTake.Application.Common.Interfaces;
using OneTake.Domain.Entities;
using OneTake.Infrastructure.Persistence;

namespace OneTake.Infrastructure.Repositories
{
    public class MediaObjectRepository : Repository<MediaObject>, IMediaObjectRepository
    {
        public MediaObjectRepository(AppDbContext context) : base(context)
        {
        }
    }
}

