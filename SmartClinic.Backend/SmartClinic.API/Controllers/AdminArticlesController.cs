using System.Text.Json;
using System.Text.RegularExpressions;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartClinic.API.Media;
using SmartClinic.Domain.Entities;
using SmartClinic.Infrastructure.Data;

namespace SmartClinic.API.Controllers;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
[Route("api/admin/articles")]
public sealed class AdminArticlesController(ApplicationDbContext db, TimeProvider clock, ArticleMediaStorage media) : ControllerBase
{
    private const int PageSize = 20;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery, StringLength(300)] string? search,
        [FromQuery, Range(1, 1000000)] int page = 1, [FromQuery] int? categoryId = null,
        [FromQuery, RegularExpression("^(Draft|Published|Archived)$")] string? status = null, CancellationToken ct = default)
    {
        var query = db.Articles.AsNoTracking();
        var summary = await query.GroupBy(_ => 1).Select(group => new
        {
            total = group.Count(),
            published = group.Count(a => a.Status == Article.Published),
            featured = group.Count(a => a.Status == Article.Published && a.IsFeatured),
            views = group.Sum(a => a.ViewsCount)
        }).SingleOrDefaultAsync(ct) ?? new { total = 0, published = 0, featured = 0, views = 0L };
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(a => a.Title.Contains(term) ||
                (a.AuthorDisplayName != null && a.AuthorDisplayName.Contains(term)));
        }
        if (categoryId.HasValue) query = query.Where(a => a.CategoryId == categoryId);
        if (status is not null) query = query.Where(a => a.Status == status);

        var filteredTotal = await query.CountAsync(ct);
        var items = await query.OrderByDescending(a => a.CreatedAtUtc).ThenBy(a => a.Id)
            .Skip((page - 1) * PageSize).Take(PageSize + 1)
            .Select(a => new { a.Id, a.Title, a.Status, CategoryName = a.Category.Name, a.Slug, a.Summary,
                a.AuthorDisplayName, a.CreatedAtUtc, a.PublishedAtUtc, a.IsFeatured, a.ViewsCount, a.CoverMediaId, a.RowVersion })
            .ToListAsync(ct);
        return Ok(new { items = items.Take(PageSize), hasMore = items.Count > PageSize, filteredTotal, summary });
    }

    [HttpGet("categories")]
    public async Task<IActionResult> Categories(CancellationToken ct) =>
        Ok(await db.ArticleCategories.AsNoTracking().Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Name).Select(c => new { c.Id, c.Name }).ToListAsync(ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var article = await db.Articles.AsNoTracking().SingleOrDefaultAsync(a => a.Id == id, ct);
        return article is null ? NotFound() : Ok(ToDetail(article));
    }

    [HttpPost]
    public async Task<IActionResult> Create(ArticleFields request, CancellationToken ct)
    {
        if (ImageMarker.IsMatch(request.ContentText ?? "")) return BadRequest();
        if (!await CategoryActive(request.CategoryId, ct)) return InvalidCategory();

        var id = Guid.NewGuid();
        var article = new Article
        {
            Id = id, Slug = $"bai-viet-{id:N}", CreatedByUserId = ActorId,
            CreatedAtUtc = clock.GetUtcNow().UtcDateTime
        };
        ApplyFields(article, request);
        db.Articles.Add(article);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id }, ToDetail(article));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, EditArticle request, CancellationToken ct)
    {
        var article = await db.Articles.SingleOrDefaultAsync(a => a.Id == id, ct);
        if (article is null) return NotFound();
        if (!article.RowVersion.SequenceEqual(request.RowVersion)) return StaleArticle();
        if (article.Status == Article.Archived)
            return Problem(statusCode: 409, title: "Hãy khôi phục bản nháp trước khi sửa bài đã lưu trữ.");
        if (!await CategoryActive(request.Fields.CategoryId, ct)) return InvalidCategory();

        if (article.Status == Article.Published &&
            (string.IsNullOrWhiteSpace(request.Fields.Summary) || string.IsNullOrWhiteSpace(request.Fields.ContentText)))
            return Problem(statusCode: 400, title: "Bài đã xuất bản cần có tóm tắt và nội dung.");

        var allowed = ImageMarker.Matches(article.ContentText ?? "").Select(match => match.Value).ToHashSet();
        if (ImageMarker.Matches(request.Fields.ContentText ?? "").Any(match => !allowed.Contains(match.Value)))
            return Problem(statusCode: 400, title: "Ảnh trong bài không hợp lệ.");
        ApplyFields(article, request.Fields);
        return await Save(article, ct);
    }

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, ChangeArticleStatus request, CancellationToken ct)
    {
        var article = await db.Articles.SingleOrDefaultAsync(a => a.Id == id, ct);
        if (article is null) return NotFound();
        if (!article.RowVersion.SequenceEqual(request.RowVersion)) return StaleArticle();
        if (article.Status == request.Status) return Ok(ToDetail(article));

        if (request.Status == Article.Published)
        {
            if (article.Status != Article.Draft || string.IsNullOrWhiteSpace(article.Summary) ||
                string.IsNullOrWhiteSpace(article.ContentText))
                return Problem(statusCode: 400, title: "Hãy lưu bản nháp có tóm tắt và nội dung trước khi xuất bản.");
            if (!await CategoryActive(article.CategoryId, ct)) return InvalidCategory();

            article.PublishedAtUtc = clock.GetUtcNow().UtcDateTime;
            article.PublishedByUserId = ActorId;
        }

        article.Status = request.Status;
        if (article.Status != Article.Published) article.IsFeatured = false;
        return await Save(article, ct);
    }

    [HttpPut("{id:guid}/featured")]
    public async Task<IActionResult> SetFeatured(Guid id, ChangeFeatured request, CancellationToken ct)
    {
        var article = await db.Articles.SingleOrDefaultAsync(a => a.Id == id, ct);
        if (article is null) return NotFound();
        if (!article.RowVersion.SequenceEqual(request.RowVersion)) return StaleArticle();
        if (request.IsFeatured == true && (article.Status != Article.Published ||
            string.IsNullOrWhiteSpace(article.ContentText) || !await CategoryActive(article.CategoryId, ct)))
            return Problem(statusCode: 400, title: "Hãy xuất bản bài viết trước khi ghim lên trang chủ.");
        article.IsFeatured = request.IsFeatured!.Value;
        return await Save(article, ct);
    }

    [HttpGet("{id:guid}/cover")]
    public async Task<IActionResult> GetCover(Guid id, CancellationToken ct)
    {
        var cover = await db.Articles.Where(a => a.Id == id).Select(a => a.CoverMedia).SingleOrDefaultAsync(ct);
        var stream = media.Open(cover);
        if (stream is null) return NotFound();
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(stream, cover!.ContentType);
    }

    [HttpPut("{id:guid}/cover")]
    [RequestSizeLimit(ArticleMediaStorage.MaxBytes + 65536)]
    [RequestFormLimits(MultipartBodyLengthLimit = ArticleMediaStorage.MaxBytes)]
    public async Task<IActionResult> SetCover(Guid id, [FromForm] IFormFile file, [FromForm] string rowVersion, CancellationToken ct)
    {
        var article = await db.Articles.SingleOrDefaultAsync(a => a.Id == id, ct);
        if (article is null) return NotFound();
        if (Convert.ToBase64String(article.RowVersion) != rowVersion) return StaleArticle();
        if (article.Status == Article.Archived)
            return Problem(statusCode: 409, title: "Hãy khôi phục bản nháp trước khi đổi ảnh bìa.");

        var name = Path.GetFileName(file.FileName);
        var cover = new ArticleMedia
        {
            Id = Guid.NewGuid(), UploadedByUserId = ActorId, CreatedAtUtc = clock.GetUtcNow().UtcDateTime,
            OriginalFileName = name.Length > 255 ? name[..255] : name
        };
        if (!await media.StoreAsync(cover, file, ct))
            return Problem(statusCode: 400, title: "Ảnh bìa phải là JPEG, PNG hoặc WebP, tối đa 5 MB.");
        article.CoverMedia = cover;
        db.Add(cover);
        return await Save(article, ct, cover);
    }

    [HttpPost("with-images")]
    [HttpPut("{id:guid}/with-images")]
    [RequestSizeLimit(27 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = ArticleMediaStorage.MaxBytes)]
    public async Task<IActionResult> SaveWithImages([FromRoute] Guid? id, [FromForm] string fields,
        [FromForm] string? rowVersion, [FromForm] IFormFile? cover, [FromForm] List<IFormFile> images,
        CancellationToken ct)
    {
        ArticleFields? input;
        try { input = JsonSerializer.Deserialize<ArticleFields>(fields, new JsonSerializerOptions(JsonSerializerDefaults.Web)); }
        catch (JsonException) { return BadRequest(); }
        if (input is null || !TryValidateModel(input)) return ValidationProblem(ModelState);
        if (!await CategoryActive(input.CategoryId, ct)) return InvalidCategory();
        if (images.Count > 4) return Problem(statusCode: 400, title: "Chọn tối đa 4 ảnh trong bài mỗi lần lưu.");
        if ((input.ContentText?.Length ?? 0) + images.Count * 44 > 50000)
            return Problem(statusCode: 400, title: "Nội dung quá dài để chèn thêm ảnh. Hãy rút gọn nội dung.");

        Article article;
        if (id.HasValue)
        {
            var existing = await db.Articles.SingleOrDefaultAsync(a => a.Id == id, ct);
            if (existing is null) return NotFound();
            if (Convert.ToBase64String(existing.RowVersion) != rowVersion) return StaleArticle();
            if (existing.Status == Article.Archived)
                return Problem(statusCode: 409, title: "Hãy khôi phục bản nháp trước khi sửa.");
            article = existing;
        }
        else
        {
            var newId = Guid.NewGuid();
            article = new Article
            {
                Id = newId, Slug = $"bai-viet-{newId:N}", CreatedByUserId = ActorId,
                CreatedAtUtc = clock.GetUtcNow().UtcDateTime
            };
        }

        if (article.Status == Article.Published &&
            (string.IsNullOrWhiteSpace(input.Summary) || string.IsNullOrWhiteSpace(input.ContentText)))
            return Problem(statusCode: 400, title: "Bài đã xuất bản cần có tóm tắt và nội dung.");

        var allowed = ImageMarker.Matches(article.ContentText ?? "").Select(match => match.Value).ToHashSet();
        if (ImageMarker.Matches(input.ContentText ?? "").Any(match => !allowed.Contains(match.Value)))
            return Problem(statusCode: 400, title: "Ảnh trong bài không hợp lệ.");

        var stored = new List<ArticleMedia>();
        var committed = false;
        try
        {
            ApplyFields(article, input);
            foreach (var file in (cover is null ? images : images.Prepend(cover)))
            {
                var asset = new ArticleMedia
                {
                    Id = Guid.NewGuid(), UploadedByUserId = ActorId,
                    CreatedAtUtc = clock.GetUtcNow().UtcDateTime,
                    OriginalFileName = Path.GetFileName(file.FileName)
                };
                if (asset.OriginalFileName.Length > 255) asset.OriginalFileName = asset.OriginalFileName[..255];
                if (!await media.StoreAsync(asset, file, ct))
                    return Problem(statusCode: 400, title: "Ảnh phải là JPEG, PNG hoặc WebP, tối đa 5 MB mỗi ảnh.");

                stored.Add(asset);
                db.Add(asset);
                if (ReferenceEquals(file, cover)) article.CoverMedia = asset;
                else article.ContentText += $"\n\n[[image:{asset.Id:N}]]";
            }

            if (!id.HasValue) db.Articles.Add(article);
            article.UpdatedByUserId = ActorId;
            article.UpdatedAtUtc = clock.GetUtcNow().UtcDateTime;
            await db.SaveChangesAsync(ct);
            committed = true;
            return id.HasValue ? Ok(ToDetail(article)) : CreatedAtAction(nameof(Get), new { id = article.Id }, ToDetail(article));
        }
        catch (DbUpdateConcurrencyException) { return StaleArticle(); }
        finally
        {
            if (!committed)
                foreach (var asset in stored) media.Discard(asset);
        }
    }

    internal static readonly Regex ImageMarker = new(@"\[\[image:[a-f0-9]{32}\]\]", RegexOptions.CultureInvariant);

    [HttpGet("{id:guid}/images/{mediaId:guid}")]
    public async Task<IActionResult> GetImage(Guid id, Guid mediaId, CancellationToken ct)
    {
        var linked = await db.Articles.AnyAsync(a => a.Id == id &&
            a.ContentText!.Contains($"[[image:{mediaId:N}]]"), ct);
        if (!linked) return NotFound();
        var asset = await db.Set<ArticleMedia>().FindAsync([mediaId], ct);
        var stream = media.Open(asset);
        if (stream is null) return NotFound();
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(stream, asset!.ContentType);
    }

    private Guid ActorId => Guid.Parse(User.FindFirst("sub")!.Value);

    private Task<bool> CategoryActive(int id, CancellationToken ct) =>
        db.ArticleCategories.AnyAsync(c => c.Id == id && c.IsActive, ct);

    private IActionResult InvalidCategory() =>
        Problem(statusCode: 400, title: "Hãy chọn chuyên mục đang hoạt động.");

    private IActionResult StaleArticle() =>
        Problem(statusCode: 409, title: "Bài viết vừa thay đổi. Hãy mở lại bài trước khi lưu.");

    private async Task<IActionResult> Save(Article article, CancellationToken ct, ArticleMedia? uploadedCover = null)
    {
        article.UpdatedByUserId = ActorId;
        article.UpdatedAtUtc = clock.GetUtcNow().UtcDateTime;
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            if (uploadedCover is not null) media.Discard(uploadedCover);
            return StaleArticle();
        }
        return Ok(ToDetail(article));
    }

    private static void ApplyFields(Article article, ArticleFields request)
    {
        article.CategoryId = request.CategoryId;
        article.Title = request.Title.Trim();
        article.Summary = request.Summary?.Trim();
        article.ContentText = request.ContentText?.Trim();
        article.AuthorDisplayName = request.AuthorDisplayName?.Trim();
    }

    private static ArticleDetail ToDetail(Article a) =>
        new(a.Id, a.CategoryId, a.Title, a.Slug, a.Summary, a.ContentText, a.Status, a.RowVersion,
            a.AuthorDisplayName, a.CoverMediaId, a.IsFeatured);

    public sealed record ArticleFields(
        [Range(1, int.MaxValue)] int CategoryId,
        [Required, StringLength(300)] string Title,
        [StringLength(1000)] string? Summary,
        [StringLength(50000)] string? ContentText,
        [StringLength(200)] string? AuthorDisplayName);
    public sealed record EditArticle([Required] ArticleFields Fields, [Required, MinLength(8), MaxLength(8)] byte[] RowVersion);
    public sealed record ChangeArticleStatus(
        [Required, RegularExpression("^(Draft|Published|Archived)$")] string Status,
        [Required, MinLength(8), MaxLength(8)] byte[] RowVersion);
    public sealed record ArticleDetail(Guid Id, int CategoryId, string Title, string Slug,
        string? Summary, string? ContentText, string Status, byte[] RowVersion,
        string? AuthorDisplayName, Guid? CoverMediaId, bool IsFeatured);
    public sealed record ChangeFeatured([Required] bool? IsFeatured, [Required, MinLength(8), MaxLength(8)] byte[] RowVersion);
}
