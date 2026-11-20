import { ArticleBody } from '../common/ArticleBody';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Archive, Edit3, Eye, Newspaper, Pin, Plus, Search, X } from 'lucide-react';
import { AdminArticleCover } from '../common/ArticleCover';
import { articleService, formatArticleDate } from '../../services/articleService';
import type { ArticleCategory, ArticleDetail, ArticleFields, ArticleList, ArticleRow, ArticleStatus } from '../../services/articleService';
import { authErrorMessage } from '../../services/authService';

const statusLabels: Record<ArticleStatus, string> = {
  Draft: 'Bản nháp', Published: 'Đã xuất bản', Archived: 'Đã lưu trữ',
};
const fieldClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500';
const buttonClass = 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50';
const filterClass = 'h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500';
const primaryClass = 'inline-flex items-center gap-1.5 rounded-xl bg-[#0084c7] px-4 py-2 text-xs font-bold text-white hover:bg-[#0072bc] disabled:opacity-50';
type Selection = { mode: 'edit' | 'preview'; row: ArticleRow | null };

export function AdminArticlesPage() {
  const [categories, setCategories] = useState<ArticleCategory[] | null>(null);
  const [categoriesError, setCategoriesError] = useState('');
  const [list, setList] = useState<ArticleList | null>(null);
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState(0);
  const [status, setStatus] = useState<ArticleStatus | ''>('');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [categoriesRevision, setCategoriesRevision] = useState(0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const request = new AbortController();
    setCategoriesError('');
    articleService.categories(request.signal).then(result => {
      if (!request.signal.aborted) setCategories(result);
    }).catch(error => {
      if (!request.signal.aborted) setCategoriesError(authErrorMessage(error));
    });
    return () => request.abort();
  }, [categoriesRevision]);

  useEffect(() => {
    const request = new AbortController();
    setList(null);
    setListError('');
    const timer = window.setTimeout(() => {
      articleService.list({ page, search: search.trim(), categoryId: categoryId || undefined,
        status: status || undefined }, request.signal)
        .then(result => { if (!request.signal.aborted) setList(result); })
        .catch(error => { if (!request.signal.aborted) setListError(authErrorMessage(error)); });
    }, 180);
    return () => {
      window.clearTimeout(timer);
      request.abort();
    };
  }, [search, categoryId, status, page, revision]);

  function reload() {
    setRevision(value => value + 1);
  }

  async function apply(action: () => Promise<void>, success: string) {
    if (busy) return;
    setBusy(true);
    setMessage('');
    setActionError('');
    try {
      await action();
      setMessage(success);
    } catch (error) {
      setActionError(authErrorMessage(error));
    } finally {
      setBusy(false);
      reload();
    }
  }

  function setPublication(row: ArticleRow, next: ArticleStatus) {
    if (next === 'Archived' && !window.confirm('Lưu trữ bài “' + row.title + '”?')) return;
    const success = next === 'Published' ? 'Đã xuất bản bài viết.'
      : next === 'Archived' ? 'Đã lưu trữ bài viết.' : 'Đã đưa bài viết về bản nháp.';
    void apply(() => articleService.status(row, next), success);
  }

  const metrics = [
    { label: 'Tổng bài viết', value: list?.summary.total, caption: 'Toàn bộ danh mục', color: 'text-slate-900' },
    { label: 'Hiển thị trang chủ', value: list?.summary.featured, caption: 'Bài đã xuất bản và được ghim', color: 'text-sky-800' },
    { label: 'Đã xuất bản', value: list?.summary.published, caption: 'Công khai cho bạn đọc', color: 'text-emerald-800' },
    { label: 'Tổng lượt xem', value: list?.summary.views, caption: 'Lượt mở bài công khai', color: 'text-amber-800' },
  ];

  return <section className="management-page">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Newspaper className="size-6 text-[#0084c7]" /> Quản lý Tin tức, Bài báo & Sự kiện Bệnh viện
        </h2>
        <p className="text-xs text-slate-500">Soạn bài, xuất bản và ghim tin tức lên trang chủ cổng bệnh nhân.</p>
      </div>
      <button type="button" className={primaryClass} disabled={busy || !categories?.length}
        onClick={() => setSelection({ mode: 'edit', row: null })}><Plus className="size-4" /> Tạo bài viết mới</button>
    </header>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map(metric => <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <p className="text-[10px] font-bold uppercase text-slate-500">{metric.label}</p>
        <p className={'mt-1 text-xl font-black ' + metric.color}>{metric.value?.toLocaleString('vi-VN') ?? '—'}</p>
        <p className="text-[10px] text-slate-500">{metric.caption}</p>
      </div>)}
    </div>

    {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
    {actionError && <p role="alert" className="text-sm text-rose-700">{actionError}</p>}
    {categoriesError && <div role="alert" className="flex items-center gap-3 text-sm text-rose-700">
      <span>Không tải được chuyên mục. {categoriesError}</span>
      <button type="button" className={buttonClass} onClick={() => setCategoriesRevision(value => value + 1)}>Thử lại</button>
    </div>}
    {categories?.length === 0 && <p className="text-sm text-slate-600">Chưa có chuyên mục đang hoạt động để tạo bài viết.</p>}

    <div className="management-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h3 className="shrink-0 text-xs font-bold uppercase tracking-wider">Danh sách bài viết & tin tức ({list?.filteredTotal ?? '—'} / {list?.summary.total ?? '—'})</h3>
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          <label className="relative min-w-0 flex-1 sm:flex-none sm:w-52">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-slate-400" aria-hidden="true" />
            <input type="search" aria-label="Tìm bài viết" placeholder="Tìm tiêu đề, tác giả…" maxLength={300}
              className={filterClass + ' w-full pl-8 pr-3'} value={search}
              onChange={event => { setPage(1); setSearch(event.target.value); }} />
          </label>
          <select aria-label="Chuyên mục" className={filterClass + ' w-44 max-w-full'} value={categoryId}
            onChange={event => { setPage(1); setCategoryId(Number(event.target.value)); }}>
            <option value={0}>Tất cả chuyên mục</option>
            {categories?.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <select aria-label="Trạng thái" className={filterClass + ' w-36 max-w-full'} value={status}
            onChange={event => { setPage(1); setStatus(event.target.value as ArticleStatus | ''); }}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
      </div>

      {listError && <div role="alert" className="flex items-center gap-3 p-4 text-sm text-rose-700">
        <span>{listError}</span><button type="button" className={buttonClass} onClick={reload}>Tải lại</button>
      </div>}
      {!listError && !list && <p role="status" className="p-4 text-sm">Đang tải bài viết…</p>}
      {list && !list.items.length && <p className="p-4 text-sm text-slate-600">Không tìm thấy bài viết.</p>}
      {!!list?.items.length && <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-700"><tr>
            <th className="p-4">Bài viết & ảnh bìa</th><th className="p-4">Chuyên mục</th>
            <th className="p-4">Tác giả & ngày đăng</th><th className="p-4">Lượt xem</th>
            <th className="p-4">Xuất bản</th><th className="p-4">Ghim trang chủ</th><th className="p-4">Thao tác</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">{list.items.map(row => <tr key={row.id} className="hover:bg-slate-50">
            <td className="p-4">
              <div className="flex items-center gap-3">
                <AdminArticleCover id={row.id} coverId={row.coverMediaId} className="h-12 w-16 rounded-lg" />
                <div className="max-w-md">
                  <p className="font-bold">{row.title}</p>
                  <p className="line-clamp-1 text-slate-500">{row.summary}</p>
                </div>
              </div>
            </td>
            <td className="p-4"><span className="inline-flex whitespace-nowrap rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-sky-800">{row.categoryName}</span></td>
            <td className="p-4">
              <p>{row.authorDisplayName || '—'}</p>
              <p className="text-[10px] text-slate-500">{formatArticleDate(row.publishedAtUtc ?? row.createdAtUtc)}</p>
            </td>
            <td className="p-4 tabular-nums">{row.viewsCount.toLocaleString('vi-VN')}</td>
            <td className="p-4">
              <button type="button" disabled={busy}
                className={buttonClass + (row.status === 'Published' ? ' bg-emerald-50 text-emerald-800' : ' bg-slate-50')}
                title={row.status === 'Draft' ? 'Xuất bản' : row.status === 'Published' ? 'Gỡ xuất bản' : 'Khôi phục bản nháp'}
                onClick={() => setPublication(row, row.status === 'Draft' ? 'Published' : 'Draft')}>
                {statusLabels[row.status]}
              </button>
            </td>
            <td className="p-4">
              <button type="button" disabled={busy || row.status !== 'Published'}
                className={buttonClass + (row.isFeatured ? ' bg-sky-50 text-sky-800' : '')}
                onClick={() => void apply(() => articleService.featured(row), row.isFeatured ? 'Đã bỏ ghim.' : 'Đã ghim lên trang chủ.')}>
                <Pin className="size-3.5" /> {row.isFeatured ? 'Đang ghim' : 'Không ghim'}
              </button>
            </td>
            <td className="p-4">
              <div className="flex items-center gap-1">
                <button type="button" className={buttonClass} aria-label="Xem trước" onClick={() => setSelection({ mode: 'preview', row })}><Eye className="size-3.5" /></button>
                <button type="button" className={buttonClass} aria-label="Chỉnh sửa" disabled={busy || row.status === 'Archived' || !categories}
                  onClick={() => setSelection({ mode: 'edit', row })}><Edit3 className="size-3.5" /></button>
                <button type="button" className={buttonClass} aria-label="Lưu trữ" disabled={busy || row.status === 'Archived'}
                  onClick={() => setPublication(row, 'Archived')}><Archive className="size-3.5" /></button>
              </div>
            </td>
          </tr>)}</tbody>
        </table>
      </div>}
      {list && (page > 1 || list.hasMore) && <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-4 text-xs">
        <button type="button" className={buttonClass} disabled={page === 1} onClick={() => setPage(value => value - 1)}>Trang trước</button>
        <span>Trang {page}</span>
        <button type="button" className={buttonClass} disabled={!list.hasMore} onClick={() => setPage(value => value + 1)}>Trang sau</button>
      </div>}
    </div>
    {selection && <ArticleDialog key={selection.mode + (selection.row?.id ?? 'new')} selection={selection}
      categories={categories ?? []} onClose={() => setSelection(null)} onSaved={reload} />}
  </section>;
}

function ArticleDialog({ selection, categories, onClose, onSaved }: {
  selection: Selection;
  categories: ArticleCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { row, mode } = selection;
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [fields, setFields] = useState<ArticleFields>({
    title: '', categoryId: categories[0]?.id ?? 0, summary: '', contentText: '', authorDisplayName: '',
  });
  const [loading, setLoading] = useState(!!row);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [cover, setCover] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);

  function fill(value: ArticleDetail) {
    setArticle(value);
    setFields({
      title: value.title, categoryId: value.categoryId, summary: value.summary ?? '',
      contentText: value.contentText ?? '', authorDisplayName: value.authorDisplayName ?? '',
    });
    setDirty(false);
  }

  useEffect(() => {
    if (!row) return;
    const request = new AbortController();
    articleService.get(row.id, request.signal).then(result => {
      if (!request.signal.aborted) fill(result);
    }).catch(failure => {
      if (!request.signal.aborted) setLoadError(authErrorMessage(failure));
    }).finally(() => {
      if (!request.signal.aborted) setLoading(false);
    });
    return () => request.abort();
  }, [row]);

  function edit<K extends keyof ArticleFields>(key: K, value: ArticleFields[K]) {
    setFields(previous => ({ ...previous, [key]: value }));
    setDirty(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      fill(await articleService.save(fields, article, cover, images));
      setCover(null);
      setImages([]);
      setNotice(article ? 'Đã lưu thay đổi.' : 'Đã tạo bản nháp.');
      onSaved();
    } catch (failure) {
      setError(authErrorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  function selectImages(files: File[], isCover: boolean) {
    setError('');
    if (files.length > (isCover ? 1 : 4) || files.some(file => file.size > 5 * 1024 * 1024)) {
      setError('Chọn tối đa 4 ảnh trong bài, mỗi ảnh tối đa 5 MB.');
      return;
    }
    if (isCover) setCover(files[0] ?? null);
    else setImages(files);
  }

  const isPublished = article?.status === 'Published';
  const isArchived = article?.status === 'Archived';
  const activeCategory = categories.some(category => category.id === fields.categoryId);
  const title = mode === 'preview' ? 'Xem trước bài viết' : article ? 'Chỉnh sửa bài viết' : 'Tạo bản nháp';
  const close = () => {
    if (!busy && (!(dirty || cover || images.length) || window.confirm('Đóng và bỏ thay đổi chưa lưu?'))) onClose();
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
    <section role="dialog" aria-modal="true" aria-label={title}
      className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <header className="flex items-center justify-between border-b border-slate-100 p-5">
        <h3 className="font-bold">{title}</h3>
        <button type="button" aria-label="Đóng" disabled={busy} className={buttonClass} onClick={close}><X className="size-4" /></button>
      </header>
      {loading ? <p role="status" className="p-5 text-sm">Đang tải nội dung…</p>
        : loadError ? <p role="alert" className="p-5 text-sm text-rose-700">{loadError}</p>
        : mode === 'preview' && article ? <article className="space-y-4 p-5">
          <p className="text-xs font-bold text-sky-800">{row?.categoryName} · {statusLabels[article.status]}</p>
          <h4 className="text-xl font-bold">{article.title}</h4>
          <p className="text-sm text-slate-600">{article.authorDisplayName}</p>
          {article.coverMediaId && <AdminArticleCover id={article.id} coverId={article.coverMediaId} className="h-56 w-full rounded-xl" />}
          <p className="text-sm font-semibold">{article.summary}</p>
          <ArticleBody text={article.contentText || 'Chưa có nội dung văn bản.'} articleId={article.id} />
        </article> : <form className="space-y-4 p-5 text-sm" onSubmit={save}>
          {isArchived && <p>Bài đã lưu trữ. Khôi phục về nháp từ danh sách để chỉnh sửa.</p>}
          <fieldset disabled={busy || isArchived} className="space-y-4">
            <label className="block">Tiêu đề<input autoFocus className={fieldClass} required maxLength={300} value={fields.title}
              onChange={event => edit('title', event.target.value)} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>Chuyên mục<select className={fieldClass} required value={fields.categoryId || ''}
                onChange={event => edit('categoryId', Number(event.target.value))}>
                <option value="">Chọn chuyên mục</option>
                {fields.categoryId > 0 && !activeCategory && <option value={fields.categoryId} disabled>Chuyên mục đã ngừng hoạt động</option>}
                {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select></label>
              <label>Tác giả<input className={fieldClass} maxLength={200} value={fields.authorDisplayName}
                onChange={event => edit('authorDisplayName', event.target.value)} /></label>
            </div>
            <label className="block">Tóm tắt<textarea className={fieldClass} required={isPublished} rows={3} maxLength={1000}
              value={fields.summary} onChange={event => edit('summary', event.target.value)} /></label>
            <label className="block">Nội dung văn bản<textarea className={fieldClass} required={isPublished} rows={10} maxLength={50000}
              value={fields.contentText} onChange={event => edit('contentText', event.target.value)} /></label>
            <div className="flex flex-wrap items-center gap-3">
              {article?.coverMediaId && <AdminArticleCover id={article.id} coverId={article.coverMediaId} className="h-16 w-24 rounded-lg" />}
              <label>Ảnh bìa (tối đa 5 MB)
                <input type="file" className="block text-xs" accept="image/jpeg,image/png,image/webp" onChange={event => {
                  selectImages(Array.from(event.currentTarget.files ?? []), true);
                  event.currentTarget.value = '';
                }} />
              </label>
              {cover && <button type="button" className={buttonClass} onClick={() => setCover(null)}>{cover.name} · Bỏ chọn</button>}
            </div>
            <label className="block">Ảnh trong bài (tối đa 4 ảnh mỗi lần lưu, 5 MB mỗi ảnh)
              <input type="file" multiple className="block text-xs" accept="image/jpeg,image/png,image/webp" onChange={event => {
                selectImages(Array.from(event.currentTarget.files ?? []), false);
                event.currentTarget.value = '';
              }} />
            </label>
            {images.length > 0 && <ul className="space-y-1 text-xs">
              {images.map((file, index) => <li key={index} className="flex items-center gap-2">
                <span>{file.name}</span>
                <button type="button" className="underline" onClick={() => setImages(previous => previous.filter((_, i) => i !== index))}>Bỏ chọn</button>
              </li>)}
            </ul>}
            <p className="text-xs text-slate-500">Ảnh mới sẽ được chèn cuối nội dung theo thứ tự đã chọn.</p>
          </fieldset>
          {error && <p role="alert" className="text-rose-700">{error}</p>}
          {notice && <p role="status" className="text-emerald-700">{notice}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass} disabled={busy} onClick={close}>Đóng</button>
            <button type="submit" className={primaryClass} disabled={busy || isArchived || !activeCategory}>
              {busy ? 'Đang xử lý…' : article ? 'Lưu thay đổi' : 'Lưu bản nháp'}
            </button>
          </div>
        </form>}
    </section>
  </div>;
}
