import { useState } from 'react';
import { UserRound } from 'lucide-react';

export function AccountAvatar({ src, className }: { src?: string | null; className: string }) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const url = src?.trim();
  const showImage = url && url !== failedSrc && (/^https?:\/\//i.test(url) || /^\/(?![\/\\])/.test(url));

  return <span aria-hidden="true" className={`inline-grid shrink-0 place-items-center overflow-hidden border border-blue-100 bg-blue-50 text-blue-700 ${className}`}>
    {showImage ? <img src={url} alt="" className="size-full object-cover" referrerPolicy="no-referrer"
      onError={() => setFailedSrc(url)} /> : <UserRound className="size-1/2" />}
  </span>;
}
