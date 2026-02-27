using System.IO;
using System.Threading.Tasks;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;

namespace OneTake.Application.Common.Interfaces
{
    public interface IFileStorage
    {
        Task<MediaObject> SaveFileAsync(Stream fileStream, string fileName, MediaType mediaType);
        Task DeleteFileAsync(string path);
    }
}

