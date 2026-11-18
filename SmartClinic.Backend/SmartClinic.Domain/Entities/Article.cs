namespace SmartClinic.Domain.Entities;

public sealed class Article
{
    public const string Draft = "Draft";
    public const string Published = "Published";
    public const string Archived = "Archived";

    public Guid Id { get; set; }
    public int CategoryId { get; set; }
    public ArticleCategory Category { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Summary { get; set; }
    public string? ContentText { get; set; }
    public string? AuthorDisplayName { get; set; }
    public Guid? CoverMediaId { get; set; }
    public ArticleMedia? CoverMedia { get; set; }
    public bool IsFeatured { get; set; }
    public long ViewsCount { get; set; }
    public string Status { get; set; } = Draft;
    public Guid CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }
    public Guid? PublishedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public DateTime? PublishedAtUtc { get; set; }
    public byte[] RowVersion { get; set; } = null!;
}

public sealed class ArticleCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}


public sealed class ArticleMedia
{
    public Guid Id { get; set; }
    public string StorageKey { get; set; } = null!;
    public string OriginalFileName { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public long SizeBytes { get; set; }
    public Guid UploadedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
