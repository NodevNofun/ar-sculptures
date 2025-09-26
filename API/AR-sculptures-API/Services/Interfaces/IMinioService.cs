using AR_sculptures_API.Models;

namespace AR_sculptures_API.Services.Interfaces
{
    public interface IMinioService
    {
        Task<string> UploadFileAsync(IFormFile file, string bucketName = null, string folderName = null);
        Task<Stream> DownloadFileeAsync(string fileName, string bucketName = null, string folderName = null);
        Task<bool> DeleteFileAsync(string fileName, string bucketName = null, string folderName = null);
        Task<string> GetFileUrlAsync(string fileName, string bucketName = null, string folderName = null);

    }
}
