using System.ComponentModel.DataAnnotations;

namespace AR_sculptures_API.Models
{
	public class CreateSculptureWithFileDTO
	{
		[Required]
		[StringLength(100)]
		public string Name { get; set; } = string.Empty;
		[StringLength(500)]
		public string Description { get; set; } = string.Empty;
		[Required]
		public IFormFile ModeFile { get; set; }
	}
}
