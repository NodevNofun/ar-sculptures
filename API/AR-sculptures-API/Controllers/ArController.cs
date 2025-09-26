using AR_sculptures_API.Context;
using AR_sculptures_API.Models;
using AR_sculptures_API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Query.Internal;

namespace AR_sculptures_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ArController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMinioService _minioservice;
        public ArController(ApplicationDbContext context, IMinioService minioService)
        {
            _context = context;
            _minioservice = minioService;
        }

        //GET: api/sculptures/5
        [HttpGet("{id}")]
        public async Task<ActionResult<SculptureApiResponse>> GetSculpture(int id)
        {
            var sculpture = await _context.Sculptures.FindAsync(id);

            if (sculpture == null)
            {
                return NotFound();
            }

            string fileUrl = null;
            if (!string.IsNullOrEmpty(fileUrl))
            {
                fileUrl = await _minioservice.GetFileUrlAsync(sculpture.ModelUrl, "ar-content", "models");
            }

            var response = new SculptureApiResponse
            {
                Id = sculpture.Id,
                Name = sculpture.Name,
                ArContent = new ArContent
                {
                    ModelUrl = sculpture.ModelUrl,
                    Animations = sculpture.Animations
                }
            };

            return Ok(response);
        }
        [HttpPost]
        public async Task<ActionResult<SculptureDto>> CreateSculpture([FromForm] CreateSculptureWithFileDTO createDto)
        {
            string modelFileName = null;
            if(createDto.ModeFile != null)
            {
                modelFileName = await _minioservice.UploadFileAsync(createDto.ModeFile, "ar-content", "models");
            }

            var modelUrl = await _minioservice.GetFileUrlAsync(modelFileName);
            var sculpture = new Sculpture
            {
                Name = createDto.Name,
                Description = createDto.Description,
                ModelUrl = modelUrl,
                CreatedAt = DateTime.UtcNow,
            };

            await _context.Sculptures.AddAsync(sculpture);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSculpture),
                "Ar",
                new { id = sculpture.Id },
                sculpture);
        }
    }
}
