using AR_sculptures_API.Models;
using AR_sculptures_API.Services.Interfaces;
using Minio;
using Minio.ApiEndpoints;
using Minio.DataModel.Args;
using System.Reactive.Linq;
using System.Reflection;

namespace AR_sculptures_API.Services
{
    public class MinioService : IMinioService
    {
        private readonly IMinioClient _minioClient;
        private readonly string _defaultBucket;
        public MinioService(IConfiguration configuration) 
        {
            var endpoint = configuration["Minio:Endpoint"];
            var accessKey = configuration["Minio:AccessKey"];
            var secretKey = configuration["Minio:SecretKey"];
            var withSsl = configuration.GetValue<bool>("Minio:WithSSL");
            _defaultBucket = configuration["Minio:DefaultBucket"];

            _minioClient = new MinioClient()
                .WithEndpoint(endpoint)
                .WithCredentials(accessKey, secretKey)
                .WithSSL(withSsl)
                .Build();
        }

        public async Task<bool> DeleteFileAsync(string fileName, string bucketName = null, string folderName = null)
        {
            bucketName ??= _defaultBucket;

            if (!string.IsNullOrEmpty(folderName))
            {
                fileName = $"{folderName}/{fileName}";
            }

            try
            {
                var removeObjectArgs = new RemoveObjectArgs()
                    .WithBucket(bucketName)
                    .WithObject(fileName);

                await _minioClient.RemoveObjectAsync(removeObjectArgs);
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<Stream> DownloadFileeAsync(string fileName, string bucketName = null, string folderName = null)
        {
            bucketName ??= _defaultBucket;

            if (!string.IsNullOrEmpty(folderName))
            {
                fileName = $"{folderName}/{fileName}";
            }

            var memoryStream = new MemoryStream();

            var getObjectArgs = new GetObjectArgs()
                .WithBucket(bucketName)
                .WithObject(fileName)
                .WithCallbackStream(stream => stream.CopyTo(memoryStream));

            await _minioClient.GetObjectAsync(getObjectArgs);
            memoryStream.Position = 0;

            return memoryStream;    
        }

        public async Task<string> GetFileUrlAsync(string fileName, string bucketName = null, string folderName = null)
        {
            bucketName ??= _defaultBucket;

            if (!string.IsNullOrEmpty(folderName))
            {
                fileName = $"{folderName}/{fileName}";
            }

            var presignedGetObjectArgs = new PresignedGetObjectArgs()
                .WithBucket(bucketName)
                .WithObject(fileName)
                .WithExpiry(24 * 60 * 60);

            return await _minioClient.PresignedGetObjectAsync(presignedGetObjectArgs);
        }

        public async Task<string> UploadFileAsync(IFormFile file, string bucketName = null, string folderName = null)
        {
            bucketName ??= _defaultBucket;
            var fileName = $"{Guid.NewGuid()}_{file.FileName}";

            if (!string.IsNullOrEmpty(folderName))
            {
                fileName = $"{folderName}/{fileName}";
            }

            var bucketExist = await _minioClient.BucketExistsAsync(
                new BucketExistsArgs().WithBucket(bucketName));

            if (!bucketExist)
            {
                await _minioClient.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucketName));
            }

            using var stream = file.OpenReadStream();
            var putObjectArgs = new PutObjectArgs()
                .WithBucket(bucketName)
                .WithObject(fileName)
                .WithStreamData(stream)
                .WithObjectSize(stream.Length)
                .WithContentType(file.ContentType);

            await _minioClient.PutObjectAsync(putObjectArgs);

            return fileName;
        }
    }
}
