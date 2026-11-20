import { useEffect, useState, type FormEvent } from 'react';
import { axiosClient } from '../../services/axiosClient';
import { authErrorMessage } from '../../services/authService';

interface Specialty {
  id: number; name: string; description: string | null; workspaceType: string | null;
  isActive: boolean; doctorCount: number;
}
type Draft = Omit<Specialty, 'id' | 'doctorCount'> & { id?: number };
const field = 'mt-1 w-full rounded-xl border border-slate-300 p-2 text-sm';
const button = 'rounded-xl bg-[#0084c7] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';

export function AdminSpecialtiesPage() {
  const [items, setItems] = useState<Specialty[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const request = new AbortController();
    setLoading(true);
    axiosClient.get<Specialty[]>('/admin/specialties', { signal: request.signal })
      .then(r => { if (!request.signal.aborted) { setItems(r.data); setError(''); } })
      .catch(e => { if (!request.signal.aborted) setError(authErrorMessage(e)); })
      .finally(() => { if (!request.signal.aborted) setLoading(false); });
    return () => request.abort();
  }, [revision]);
  async function mutate(run: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true); setError('');
    try { await run(); setDraft(null); setRevision(x => x + 1); }
    catch (e) { setError(authErrorMessage(e)); }
    finally { setBusy(false); }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    void mutate(() => draft.id
      ? axiosClient.put('/admin/specialties/' + draft.id, draft)
      : axiosClient.post('/admin/specialties', draft));
  }
  const filtered = items.filter(s => s.name.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
  return <section className="flex flex-1 min-h-0 flex-col gap-4">
    <div className="shrink-0 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Danh mục chuyên khoa</h2>
      <button className={button} disabled={busy} onClick={() => { setError(''); setDraft({ name: '', description: '', workspaceType: 'Consultation', isActive: true }); }}>Thêm chuyên khoa</button></div>
    <p className="text-sm text-slate-500">Chuyên khoa dùng khi tạo tài khoản bác sĩ. Khoa là đơn vị công tác và được quản lý riêng tại tab Khoa.</p>
    <input className={field + ' shrink-0'} aria-label="Tìm chuyên khoa" placeholder="Tìm chuyên khoa…" value={search} onChange={e => setSearch(e.target.value)} />
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{error} <button className="underline" onClick={() => setRevision(x => x + 1)}>Tải lại</button></p>}
    {loading ? <p role="status">Đang tải chuyên khoa…</p> : <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm"><thead className="sticky top-0 z-10 bg-slate-50"><tr>{['Chuyên khoa', 'Loại hoạt động', 'Số hồ sơ bác sĩ', 'Trạng thái', 'Thao tác'].map(x => <th key={x} className="p-3">{x}</th>)}</tr></thead>
        <tbody>{filtered.map(s => <tr key={s.id} className="border-t border-slate-100">
          <td className="p-3"><p className="font-semibold">{s.name}</p><p className="max-w-sm whitespace-pre-wrap text-slate-500">{s.description}</p></td>
          <td className="p-3">{s.workspaceType === 'ClinicalService' ? 'Cận lâm sàng' : s.workspaceType === 'Consultation' ? 'Khám bệnh' : 'Chưa cấu hình'}</td>
          <td className="p-3">{s.doctorCount}</td><td className="p-3">{s.isActive ? 'Hoạt động' : 'Ngừng sử dụng'}</td>
          <td className="p-3"><div className="flex flex-wrap gap-3">
            <button disabled={busy} className="text-sky-700" onClick={() => { setError(''); setDraft({ ...s }); }}>Chỉnh sửa</button>
            <button disabled={busy || !s.workspaceType} className="text-amber-700 disabled:opacity-50" onClick={() => {
              if (window.confirm(`${s.isActive ? 'Ngừng sử dụng' : 'Kích hoạt lại'} chuyên khoa ${s.name}?`))
                void mutate(() => axiosClient.put('/admin/specialties/' + s.id, { ...s, isActive: !s.isActive }));
            }}>{s.isActive ? 'Ngừng sử dụng' : 'Kích hoạt lại'}</button>
            {s.doctorCount === 0 && <button disabled={busy} className="text-red-700" onClick={() => {
              if (window.confirm(`Xóa chuyên khoa ${s.name}? Thao tác này không thể hoàn tác.`)) void mutate(() => axiosClient.delete('/admin/specialties/' + s.id));
            }}>Xóa</button>}
          </div></td>
        </tr>)}</tbody></table>
      {filtered.length === 0 && <p className="p-4 text-slate-500">Không có chuyên khoa phù hợp.</p>}
    </div>}
    {draft && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form role="dialog" aria-modal="true" aria-label="Thông tin chuyên khoa" onSubmit={submit} className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6">
        <h3 className="text-lg font-bold">{draft.id ? 'Chỉnh sửa chuyên khoa' : 'Thêm chuyên khoa'}</h3>
        <fieldset disabled={busy} className="space-y-4">
          <label className="block">Tên chuyên khoa *<input autoFocus required maxLength={255} className={field} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
          <label className="block">Mô tả<textarea maxLength={2000} rows={3} className={field} value={draft.description ?? ''} onChange={e => setDraft({ ...draft, description: e.target.value })} /></label>
          <label className="block">Loại hoạt động *<select required className={field} value={draft.workspaceType ?? ''} onChange={e => setDraft({ ...draft, workspaceType: e.target.value })}><option value="">Chọn loại hoạt động</option><option value="Consultation">Khám bệnh</option><option value="ClinicalService">Cận lâm sàng</option></select></label>
          <p className="text-xs text-slate-500">Loại hoạt động quyết định giao diện làm việc của bác sĩ. Khi thay đổi, bác sĩ cần đăng nhập lại.</p>
          <label className="block"><input type="checkbox" checked={draft.isActive} onChange={e => setDraft({ ...draft, isActive: e.target.checked })} /> Hoạt động</label>
        </fieldset>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={() => setDraft(null)}>Hủy</button><button className={button} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu chuyên khoa'}</button></div>
      </form>
    </div>}
  </section>;
}
