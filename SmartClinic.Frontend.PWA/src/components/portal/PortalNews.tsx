import { ArticleBody } from '../common/ArticleBody';
import { useEffect, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { ArticleCover } from '../common/ArticleCover';
import { articleService, formatArticleDate } from '../../services/articleService';
import type { PublicArticle } from '../../services/articleService';
import { authErrorMessage } from '../../services/authService';

export function PortalNews() {
  const [list, setList] = useState<{ items: PublicArticle[]; hasMore: boolean } | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<PublicArticle | null>(null);

  useEffect(() => {
    const request = new AbortController();
    setList(null);
    setError('');
    articleService.publicList(page, !showAll, request.signal).then(result => {
      if (!request.signal.aborted) setList(result);
    }).catch(failure => {
      if (!request.signal.aborted) setError(authErrorMessage(failure));
    });
    return () => request.abort();
  }, [page, showAll, revision]);

  if (error) return <div role="alert" className="flex items-center gap-3 text-sm text-rose-700">
    <p>Không tải được tin tức. {error}</p>
    <button type="button" className="underline" onClick={() => setRevision(value => value + 1)}>Thử lại</button>
  </div>;
  if (!list) return <p role="status" className="text-center text-sm text-slate-600">Đang tải tin tức…</p>;
  if (!list.items.length) return <p className="text-center text-sm text-slate-600">Chưa có bài viết được xuất bản.</p>;

  return <div className="space-y-4">
    <div className="grid gap-6 md:grid-cols-3">
      {list.items.map(article => <button type="button" key={article.slug}
        onClick={() => setSelected(article)}
        className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-2xs transition hover:border-[#0084c7] hover:shadow-lg">
        <ArticleCover src={article.coverMediaId ? articleService.publicCover(article.slug) : undefined} className="aspect-16/10 w-full" />
        <div className="flex-1 space-y-2 p-4">
          <p className="text-[10px] font-bold uppercase text-[#0084c7]">{article.categoryName} · {formatArticleDate(article.publishedAtUtc)}</p>
          <h3 className="line-clamp-2 text-sm font-bold text-slate-900">{article.title}</h3>
          <p className="line-clamp-2 text-xs text-slate-500">{article.summary}</p>
        </div>
        <span className="flex w-full items-center justify-between border-t border-slate-100 p-4 text-xs font-bold text-[#0084c7]">
          Xem chi tiết <ChevronRight className="size-4" />
        </span>
      </button>)}
    </div>
    {showAll ? <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-sky-800">
      <button type="button" className="underline" onClick={() => { setShowAll(false); setPage(1); }}>Về tin nổi bật</button>
      <button type="button" disabled={page === 1} className="underline disabled:opacity-40" onClick={() => setPage(value => value - 1)}>Trang trước</button>
      <span>Trang {page}</span>
      <button type="button" disabled={!list.hasMore} className="underline disabled:opacity-40" onClick={() => setPage(value => value + 1)}>Trang sau</button>
    </div> : list.hasMore && <div className="text-center">
      <button type="button" className="text-sm font-semibold text-sky-800 underline" onClick={() => setShowAll(true)}>Xem tất cả tin tức</button>
    </div>}
    {selected && <ArticleReader key={selected.slug} article={selected} onClose={() => setSelected(null)} />}
  </div>;
}

function ArticleReader({ article, onClose }: { article: PublicArticle; onClose: () => void }) {
  const [detail, setDetail] = useState<(PublicArticle & { contentText: string }) | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const request = new AbortController();
    articleService.read(article.slug, request.signal).then(result => {
      if (!request.signal.aborted) setDetail(result);
    }).catch(failure => {
      if (!request.signal.aborted) setError(authErrorMessage(failure));
    });
    return () => request.abort();
  }, [article.slug]);

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
    <section role="dialog" aria-modal="true" aria-label={article.title}
      className="max-h-[85vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-bold">{detail?.title ?? article.title}</h3>
        <button type="button" aria-label="Đóng bài viết" onClick={onClose} className="rounded-full bg-slate-100 p-2"><X className="size-4" /></button>
      </div>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {!error && !detail && <p role="status" className="text-sm">Đang tải bài viết…</p>}
      {detail && <>
        <p className="text-xs font-semibold text-sky-800">{detail.categoryName} · {formatArticleDate(detail.publishedAtUtc)}</p>
        {detail.authorDisplayName && <p className="text-sm text-slate-600">{detail.authorDisplayName}</p>}
        {detail.coverMediaId && <ArticleCover src={articleService.publicCover(detail.slug)} className="h-56 w-full rounded-xl" />}
        <p className="text-sm font-semibold">{detail.summary}</p>
        <ArticleBody text={detail.contentText} slug={detail.slug} />
      </>}
    </section>
  </div>;
}
