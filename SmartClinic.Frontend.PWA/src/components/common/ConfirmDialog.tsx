import { useEffect, useRef, type ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

export function ConfirmDialog({ title, children, busy, onClose, onConfirm, confirmDisabled = false }: {
  title: string; children: ReactNode; busy: boolean; onClose: () => void; onConfirm: () => void; confirmDisabled?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} aria-label={title} onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}
    className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-2xl border-0 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-900/50">
    <div className="p-6"><div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600"><CheckCircle2 className="size-6" /></div>
      <h2 className="text-lg font-bold">{title}</h2><div className="mt-3 text-sm leading-6 text-slate-600">{children}</div>
    </div>
    <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
      <button autoFocus disabled={busy} onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">Quay lại</button>
      <button disabled={busy || confirmDisabled} onClick={onConfirm} className="rounded-xl bg-[#0084c7] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang xử lý…' : 'Xác nhận'}</button>
    </div>
  </dialog>;
}
