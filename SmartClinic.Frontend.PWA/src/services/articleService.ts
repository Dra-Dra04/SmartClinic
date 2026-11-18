import { axiosClient } from './axiosClient';

export type ArticleStatus = 'Draft' | 'Published' | 'Archived';
export interface ArticleCategory { id: number; name: string }
export interface ArticleFields {
  title: string;
  categoryId: number;
  summary: string;
  contentText: string;
  authorDisplayName: string;
}
export interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  categoryName: string;
  summary: string | null;
  authorDisplayName: string | null;
  coverMediaId: string | null;
  createdAtUtc: string;
  publishedAtUtc: string | null;
  status: ArticleStatus;
  isFeatured: boolean;
  viewsCount: number;
  rowVersion: string;
}
export interface ArticleDetail extends Omit<ArticleRow, 'categoryName' | 'createdAtUtc' | 'publishedAtUtc' | 'viewsCount'> {
  categoryId: number;
  contentText: string | null;
}
export interface ArticleList {
  items: ArticleRow[];
  hasMore: boolean;
  filteredTotal: number;
  summary: { total: number; published: number; featured: number; views: number };
}
export interface PublicArticle {
  title: string;
  slug: string;
  summary: string | null;
  categoryName: string;
  publishedAtUtc: string | null;
  coverMediaId: string | null;
  authorDisplayName: string | null;
}

const admin = '/admin/articles';

export const articleService = {
  async list(params: { page: number; search: string; categoryId?: number; status?: ArticleStatus }, signal: AbortSignal) {
    return (await axiosClient.get<ArticleList>(admin, { params, signal })).data;
  },
  async categories(signal: AbortSignal) {
    return (await axiosClient.get<ArticleCategory[]>(admin + '/categories', { signal })).data;
  },
  async get(id: string, signal: AbortSignal) {
    return (await axiosClient.get<ArticleDetail>(admin + '/' + id, { signal })).data;
  },
  async save(fields: ArticleFields, article: ArticleDetail | null, cover: File | null, images: File[]) {
    const body = new FormData();
    body.append('fields', JSON.stringify(fields));
    if (article) body.append('rowVersion', article.rowVersion);
    if (cover) body.append('cover', cover);
    images.forEach(file => body.append('images', file));
    const config = { timeout: 90000 };
    const response = article
      ? await axiosClient.put<ArticleDetail>(admin + '/' + article.id + '/with-images', body, config)
      : await axiosClient.post<ArticleDetail>(admin + '/with-images', body, config);
    return response.data;
  },
  async image(id: string, mediaId: string, signal: AbortSignal) {
    return (await axiosClient.get<Blob>(admin + '/' + id + '/images/' + mediaId, { responseType: 'blob', signal })).data;
  },
  publicImage(slug: string, mediaId: string) {
    return axiosClient.getUri({ url: '/articles/' + encodeURIComponent(slug) + '/images/' + mediaId });
  },
  async status(row: ArticleRow, status: ArticleStatus) {
    await axiosClient.put(admin + '/' + row.id + '/status', { status, rowVersion: row.rowVersion });
  },
  async featured(row: ArticleRow) {
    await axiosClient.put(admin + '/' + row.id + '/featured', { isFeatured: !row.isFeatured, rowVersion: row.rowVersion });
  },
  async cover(id: string, signal: AbortSignal) {
    return (await axiosClient.get<Blob>(admin + '/' + id + '/cover', { responseType: 'blob', signal })).data;
  },
  async publicList(page: number, home: boolean, signal: AbortSignal) {
    return (await axiosClient.get<{ items: PublicArticle[]; hasMore: boolean }>('/articles', { params: { page, home }, signal })).data;
  },
  async read(slug: string, signal: AbortSignal) {
    return (await axiosClient.get<PublicArticle & { contentText: string }>('/articles/' + encodeURIComponent(slug), { signal })).data;
  },
  publicCover(slug: string) {
    return axiosClient.getUri({ url: '/articles/' + encodeURIComponent(slug) + '/cover' });
  },
};

export function formatArticleDate(value?: string | null) {
  if (!value) return '—';
  const utc = /(?:Z|[+-][0-9]{2}:[0-9]{2})$/i.test(value) ? value : value + 'Z';
  return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short' }).format(new Date(utc));
}
