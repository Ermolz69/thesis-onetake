using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using OneTake.Application.Common.Interfaces;
using OneTake.Domain.Entities;
using OneTake.Infrastructure.Persistence;

namespace OneTake.Infrastructure.Repositories
{
    public class TagRepository : Repository<Tag>, ITagRepository
    {
        public TagRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Tag?> GetByNameAsync(string name)
        {
            return await _dbSet.FirstOrDefaultAsync(t => t.Name == name);
        }

        public async Task<Tag> GetOrCreateByNameAsync(string name)
        {
            Tag? tag = await GetByNameAsync(name);
            if (tag == null)
            {
                tag = new Tag { Name = name };
                await AddAsync(tag);
            }
            return tag;
        }
    }
}

