using AR_sculptures_API.Models;
using AR_sculptures_API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using Minio;

namespace AR_sculptures_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FileController : ControllerBase
    {
        private readonly IMinioService _minioService;
        public FileController(IMinioService minioService)
        {
            _minioService = minioService;
        }

        [HttpPost("upload")]
        public async Task<ActionResult<FileInfoDto>> UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Файл не предоставлен");
            }

            try
            {
                var fileName = await _minioService.UploadFileAsync(file, "ar-content", "models");
                var fileUrl = await _minioService.GetFileUrlAsync(fileName, "ar-content", "models");

                return Ok(new FileInfoDto
                {
                    FileName = fileName,
                    Url = fileUrl,
                    Size = file.Length,
                    ContentType = file.ContentType,
                });
            }
            catch (Exception ex) 
            {
                return StatusCode(500, $"Ошибка загрузки файла: {ex.Message}");
            }
        }
        [HttpGet("download/{fileName}")]
        public async Task<ActionResult> DownloadFile(string fileName)
        {
            try
            {
                var fileStream = await _minioService.DownloadFileeAsync(fileName, "ar-content", "models");
                return File(fileStream, "application/octet-stream", fileName);
            }
            catch (Exception ex)
            {
                return NotFound($"Файл не найден: {ex.Message}");
            }
        }
        [HttpDelete("{fileName}")]
        public async Task<IActionResult> DeleteFile(string fileName)
        {
            try
            {
                var result = await _minioService.DeleteFileAsync(fileName, "ar-content", "models");
                return result ? NoContent() : NotFound();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка удаления файла: {ex.Message}");
            }
        }
        [HttpGet("url/{fileName}")]
        public async Task<ActionResult<string>> GetFileUrl(string fileName)
        {
            try
            {
                var url = await _minioService.GetFileUrlAsync(fileName, "ar-content", "models");
                return Ok(new { Url = url });
            }
            catch (Exception ex) 
            {
                return NotFound($"Файл не найден: {ex.Message}");
            }
        }
    }
}
