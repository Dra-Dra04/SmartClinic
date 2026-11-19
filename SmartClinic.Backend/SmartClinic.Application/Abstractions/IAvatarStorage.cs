namespace SmartClinic.Application.Abstractions;

public sealed record StoredAvatar(string StorageKey, string ContentType);

public interface IAvatarStorage
{
    Task<StoredAvatar?> StoreAsync(Guid userId, Stream content, long length, CancellationToken ct);
    Stream? Open(Guid userId, out string contentType);
    void Delete(Guid userId);
}
