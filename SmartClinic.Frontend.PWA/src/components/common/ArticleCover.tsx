import { useEffect, useState } from 'react';
import { Image } from 'lucide-react';
import { articleService } from '../../services/articleService';

export function ArticleCover({ src, className }: { src?: string; className: string }) {
  const [failed, setFailed] = useState<string>();
  return <span className={'grid shrink-0 place-items-center overflow-hidden bg-slate-100 text-slate-400 ' + className}>
    {src && src !== failed ? <img src={src} alt="" className="size-full object-cover"
      onError={() => setFailed(src)} /> : <Image className="size-6" aria-hidden="true" />}
  </span>;
}

export function AdminArticleCover({ id, coverId, className }: { id: string; coverId: string | null; className: string }) {
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    setSrc(undefined);
    if (!coverId) return;

    const request = new AbortController();
    let objectUrl: string | undefined;
    articleService.cover(id, request.signal).then(blob => {
      if (request.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob);
      setSrc(objectUrl);
    }).catch(() => { /* Missing or unavailable images use the placeholder. */ });
    return () => {
      request.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, coverId]);

  return <ArticleCover src={src} className={className} />;
}
