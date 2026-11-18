import { useEffect, useState } from 'react';
import { articleService } from '../../services/articleService';

export function ArticleBody({ text, articleId, slug }: {
  text: string;
  articleId?: string;
  slug?: string;
}) {
  return <div className="space-y-4 break-words text-sm leading-relaxed">
    {text.split(/(\[\[image:[a-f0-9]{32}\]\])/).map((part, index) => {
      if (!part.trim()) return null;
      const marker = /^\[\[image:([a-f0-9]{32})\]\]$/.exec(part);
      if (!marker) return <p key={index} className="whitespace-pre-wrap">{part.trim()}</p>;
      if (articleId) return <AdminImage key={index} articleId={articleId} mediaId={marker[1]} />;
      return slug ? <img key={index} src={articleService.publicImage(slug, marker[1])}
        alt="Ảnh minh họa bài viết" className="mx-auto max-h-[65vh] w-auto max-w-full rounded-xl" loading="lazy" /> : null;
    })}
  </div>;
}

function AdminImage({ articleId, mediaId }: { articleId: string; mediaId: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    const request = new AbortController();
    let url = '';
    setSrc('');
    articleService.image(articleId, mediaId, request.signal).then(blob => {
      if (request.signal.aborted) return;
      url = URL.createObjectURL(blob);
      setSrc(url);
    }).catch(() => {});
    return () => {
      request.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [articleId, mediaId]);

  return src ? <img src={src} alt="Ảnh minh họa bài viết"
    className="mx-auto max-h-[65vh] w-auto max-w-full rounded-xl" /> : null;
}
