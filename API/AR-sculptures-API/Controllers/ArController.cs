using AR_sculptures_API.Context;
using AR_sculptures_API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Query.Internal;

namespace AR_sculptures_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ArController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public ArController(ApplicationDbContext context)
        {
            _context = context;
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

            var response = new SculptureApiResponse
            {
                Id = sculpture.Id,
                Name = sculpture.Name,
                ArContent = new ArContent
                {
                    ModelUrl = sculpture.ModeUrl,
                    MarkerUrl = sculpture.MarkerUrl,
                    Animations = sculpture.Animations
                }
            };

            return Ok(response);
        }
    }
}
