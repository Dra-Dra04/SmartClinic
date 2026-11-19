import { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';
import { axiosClient } from '../../services/axiosClient';
import { useAuthStore } from '../../store/useAuthStore';

export function AccountAvatar({ src, className }: { src?: string | null; className: string }) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const [loaded, setLoaded] = useState<{ key: string; url: string }>();
  const { currentUser, isDemo } = useAuthStore();
  const url = src?.trim();
  const protectedImage = !!url && /^\/api\/(patients\/me|admin\/accounts\/[a-f0-9-]+)\/avatar(?:\?|$)/i.test(url);
  const key = currentUser.id + ':' + isDemo + ':' + url;
  useEffect(() => {
    if (!protectedImage || !url || isDemo) return;
    const request = new AbortController();
    let objectUrl = '';
    axiosClient.get<Blob>(url.slice(4), { responseType: 'blob', signal: request.signal }).then(response => {
      if (request.signal.aborted) return;
      objectUrl = URL.createObjectURL(response.data);
      setLoaded({ key, url: objectUrl });
    }).catch(() => { /* Fall back to the basic avatar if the image is unavailable. */ });
    return () => {
      request.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, key, protectedImage, isDemo]);

  const image = protectedImage ? (loaded?.key === key ? loaded.url : undefined) :
    url && (/^https?:\/\//i.test(url) || /^\/(?![\/\\])/.test(url)) ? url : undefined;

  return <span aria-hidden="true" className={`inline-grid shrink-0 place-items-center overflow-hidden border border-blue-100 bg-blue-50 text-blue-700 ${className}`}>
    {image && image !== failedSrc ? <img src={image} alt="" className="size-full object-cover" referrerPolicy="no-referrer"
      onError={() => setFailedSrc(image)} /> : <UserRound className="size-1/2" />}
  </span>;
}
