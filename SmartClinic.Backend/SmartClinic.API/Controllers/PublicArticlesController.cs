using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartClinic.API.Media;
using SmartClinic.Domain.Entities;
using SmartClinic.Infrastructure.Data;

namespace SmartClinic.API.Controllers;

[ApiController]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
[Route("api/articles")]
public sealed class PublicArticlesController(ApplicationDbContext db, ArticleMediaStorage media) : ControllerBase
{
    private const int PageSize = 20;
    private IQueryable<Article> Published => db.Articles.AsNoTracking().Where(a =>
        a.Status == Article.Published && a.ContentText != null && a.Category.IsActive);

    [HttpGet]
    public async Task<IActionResult> List([FromQuery, Range(1, 1000000)] int page = 1,
        [FromQuery] bool home = false, CancellationToken ct = default)
    {
        var size = home ? 3 : PageSize;
        var items = await Published.OrderByDescending(a => a.IsFeatured).ThenByDescending(a => a.PublishedAtUtc).ThenBy(a => a.Id)
            .Skip((page - 1) * size).Take(size + 1)
            .Select(a => new { a.Title, a.Slug, a.Summary, CategoryName = a.Category.Name,
                a.PublishedAtUtc, a.CoverMediaId, a.AuthorDisplayName })
            .ToListAsync(ct);
        return Ok(new { items = items.Take(size), hasMore = items.Count > size });
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> Get([FromRoute, StringLength(350)] string slug, CancellationToken ct)
    {
        var article = await Published.Where(a => a.Slug == slug)
            .Select(a => new { a.Title, a.Slug, a.Summary, a.ContentText, CategoryName = a.Category.Name,
                a.PublishedAtUtc, a.CoverMediaId, a.AuthorDisplayName })
            .SingleOrDefaultAsync(ct);
        if (article is null) return NotFound();

        var counted = await Published.Where(a => a.Slug == slug)
            .ExecuteUpdateAsync(update => update.SetProperty(a => a.ViewsCount, a => a.ViewsCount + 1), ct);
        return counted == 0 ? NotFound() : Ok(article);
    }

    [HttpGet("{slug}/images/{mediaId:guid}")]
    public async Task<IActionResult> GetImage(string slug, Guid mediaId, CancellationToken ct)
    {
        var linked = await Published.AnyAsync(a => a.Slug == slug &&
            a.ContentText!.Contains($"[[image:{mediaId:N}]]"), ct);
        if (!linked) return NotFound();
        var asset = await db.Set<ArticleMedia>().FindAsync([mediaId], ct);
        var stream = media.Open(asset);
        if (stream is null) return NotFound();
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(stream, asset!.ContentType);
    }

    [HttpGet("{slug}/cover")]
    public async Task<IActionResult> GetCover([FromRoute, StringLength(350)] string slug, CancellationToken ct)
    {
        var cover = await Published.Where(a => a.Slug == slug).Select(a => a.CoverMedia).SingleOrDefaultAsync(ct);
        var stream = media.Open(cover);
        if (stream is null) return NotFound();
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(stream, cover!.ContentType);
    }
}
