using SmartClinic.Application.Abstractions;

namespace SmartClinic.API.Media;

public sealed class AvatarStorage(IWebHostEnvironment environment, IConfiguration configuration) : IAvatarStorage
{
    public const int MaxBytes = 5 * 1024 * 1024;
    private string Root => Path.GetFullPath(configuration["AvatarMedia:Directory"] ?? "avatar-uploads", environment.ContentRootPath);

    public async Task<StoredAvatar?> StoreAsync(Guid userId, Stream content, long length, CancellationToken ct)
    {
        if (length is < 12 or > MaxBytes) return null;
        var header = new byte[12];
        await content.ReadExactlyAsync(header, ct);
        var type = DetectType(header);
        if (type is null) return null;
        Directory.CreateDirectory(Root);
        var path = Path.Combine(Root, userId.ToString("N"));
        var temporary = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
        try
        {
            await using (var output = new FileStream(temporary, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            {
                await output.WriteAsync(header, ct);
                await content.CopyToAsync(output, ct);
            }
            File.Move(temporary, path, overwrite: true);
            return new StoredAvatar(userId.ToString("N"), type);
        }
        finally
        {
            File.Delete(temporary);
        }
    }

    public Stream? Open(Guid userId, out string contentType)
    {
        contentType = "image/jpeg";
        var path = Path.Combine(Root, userId.ToString("N"));
        try
        {
            var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read | FileShare.Delete);
            Span<byte> header = stackalloc byte[12];
            var read = stream.Read(header);
            contentType = DetectType(header[..read]) ?? "image/jpeg";
            stream.Position = 0;
            return stream;
        }
        catch (FileNotFoundException) { return null; }
        catch (DirectoryNotFoundException) { return null; }
    }

    public void Delete(Guid userId) => File.Delete(Path.Combine(Root, userId.ToString("N")));

    private static string? DetectType(ReadOnlySpan<byte> h)
    {
        if (h.StartsWith(new byte[] { 0xff, 0xd8, 0xff })) return "image/jpeg";
        if (h.StartsWith(new byte[] { 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a })) return "image/png";
        if (h.Length >= 12 && h[..4].SequenceEqual("RIFF"u8) && h[8..12].SequenceEqual("WEBP"u8)) return "image/webp";
        return null;
    }
}
