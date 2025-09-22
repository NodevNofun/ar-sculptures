namespace AR_sculptures_API.Models
{
    public class FileInfoDto
    {
        public string FileName {  get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public long Size { get; set; }
        public DateTime LastModified { get; set; }
        public string ContentType { get; set; } = string.Empty;
    }
}
