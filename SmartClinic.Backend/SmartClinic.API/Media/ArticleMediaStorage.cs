using SmartClinic.Domain.Entities;

namespace SmartClinic.API.Media;

public sealed class ArticleMediaStorage(IWebHostEnvironment environment, IConfiguration configuration)
{
    public const int MaxBytes = 5 * 1024 * 1024;

    private string DirectoryPath => Path.GetFullPath(
        configuration["ArticleMedia:Directory"] ?? "article-uploads", environment.ContentRootPath);

    public async Task<bool> StoreAsync(ArticleMedia media, IFormFile upload, CancellationToken ct)
    {
        if (upload.Length is < 12 or > MaxBytes) return false;
        using var input = upload.OpenReadStream();
        var header = new byte[12];
        await input.ReadExactlyAsync(header, ct);
        var type = DetectType(header);
        if (type is null) return false;

        media.ContentType = type;
        media.StorageKey = media.Id.ToString("N");
        media.SizeBytes = upload.Length;
        Directory.CreateDirectory(DirectoryPath);
        var path = Path.Combine(DirectoryPath, media.StorageKey);
        var output = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        try
        {
            await using (output)
            {
                await output.WriteAsync(header, ct);
                await input.CopyToAsync(output, ct);
            }
            return true;
        }
        catch
        {
            File.Delete(path);
            throw;
        }
    }

    public FileStream? Open(ArticleMedia? media)
    {
        if (media is null || media.StorageKey != media.Id.ToString("N") ||
            media.ContentType is not ("image/jpeg" or "image/png" or "image/webp")) return null;
        try
        {
            return File.OpenRead(Path.Combine(DirectoryPath, media.StorageKey));
        }
        catch (FileNotFoundException) { return null; }
        catch (DirectoryNotFoundException) { return null; }
    }

    public void Discard(ArticleMedia media) => File.Delete(Path.Combine(DirectoryPath, media.StorageKey));

    private static string? DetectType(ReadOnlySpan<byte> header)
    {
        if (header.StartsWith(new byte[] { 0xff, 0xd8, 0xff })) return "image/jpeg";
        if (header.StartsWith(new byte[] { 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a })) return "image/png";
        if (header.StartsWith("RIFF"u8) && header[8..].SequenceEqual("WEBP"u8)) return "image/webp";
        return null;
    }
}
