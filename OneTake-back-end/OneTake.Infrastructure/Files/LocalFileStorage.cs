using System;
using System.IO;
using System.Threading.Tasks;
using OneTake.Application.Common.Interfaces;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;

namespace OneTake.Infrastructure.Files
{
    public class LocalFileStorage : IFileStorage
    {
        private readonly string _webRootPath;

        public LocalFileStorage(string webRootPath)
        {
            _webRootPath = webRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }

        public async Task<MediaObject> SaveFileAsync(Stream fileStream, string fileName, MediaType mediaType)
        {
            var uploadsFolder = Path.Combine(_webRootPath, "media");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await fileStream.CopyToAsync(stream);
            }

            var relativeUrl = $"/media/{uniqueFileName}";
            
            return new MediaObject
            {
                Id = Guid.NewGuid(),
                Url = relativeUrl,
                Path = filePath,
                MediaType = mediaType,
                FileSize = fileStream.Length,
                UploadedAt = DateTime.UtcNow
            };
        }

        public Task DeleteFileAsync(string path)
        {
            if (File.Exists(path))
            {
                File.Delete(path);
            }
            return Task.CompletedTask;
        }
    }
}

