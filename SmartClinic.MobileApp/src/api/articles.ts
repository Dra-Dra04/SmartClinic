import { HospitalArticle } from '../types';
import { API_URL, request } from './client';
interface ArticleDto { title: string; slug: string; summary: string; categoryName: string;
  publishedAtUtc: string | null; coverMediaId: string | null; authorDisplayName: string; contentText?: string; }
function mapArticle(a: ArticleDto): HospitalArticle {
  return { id: a.slug, title: a.title, category: a.categoryName, author: a.authorDisplayName,
    date: a.publishedAtUtc ? new Date(a.publishedAtUtc).toLocaleDateString('vi-VN') : '',
    image: a.coverMediaId ? `${API_URL}/api/articles/${encodeURIComponent(a.slug)}/cover` : '',
    summary: a.summary, content: a.contentText ? a.contentText.split(/(\[\[image:[a-f0-9]{32}\]\])/i).filter(Boolean) : [] };
}
export async function listArticles(page: number) {
  const result = await request<{ items: ArticleDto[]; hasMore: boolean }>(`/api/articles?page=${page}`);
  return { items: result.items.map(mapArticle), hasMore: result.hasMore };
}
export async function getArticle(slug: string) {
  return mapArticle(await request<ArticleDto>(`/api/articles/${encodeURIComponent(slug)}`));
}
