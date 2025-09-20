using System.ComponentModel.DataAnnotations;

namespace AR_sculptures_API.Models
{
    public class Sculpture
    {
        public int Id { get; set; }
        [Required]
        [MaxLength(100)]
        public string Name { get; set; }
        [MaxLength(500)]
        public string Description { get; set; }
        [Required]
        [Url]
        public string MarkerUrl { get; set; }//путь к файлу .patt
        [Required]
        [Url]
        public string ModeUrl { get; set; }//путь к файлу .glb
        public List<string> Animations { get; set; } = new();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
