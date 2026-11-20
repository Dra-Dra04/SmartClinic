import { ConfirmDialog } from '../common/ConfirmDialog';
import { WalkInDialog } from './WalkInDialog';
import { useClinicStore } from '../../store/useClinicStore';
import { useEffect, useState } from 'react';
import { axiosClient } from '../../services/axiosClient';
import { clinicTime } from '../../services/clinicService';
import { authErrorMessage } from '../../services/authService';

interface Appointment {
  id: string; patientName: string; phoneNumber: string; doctorId: string; doctorName: string;
  startTime: string; endTime: string; room: string | null; status: string; symptom: string | null;
}
const labels: Record<string, string> = { Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Cancelled: 'Đã hủy', Completed: 'Hoàn tất', CheckedIn: 'Đã tiếp nhận', InProgress: 'Đang khám', NoShow: 'Không đến' };
const field = 'h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm';

export function StaffAppointmentsPage() {
  const { currentWorkspaceNav } = useClinicStore();
  const [tab, setTab] = useState('appointments');
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ item: Appointment; action: 'confirm' | 'check-in' } | null>(null);
  function changeTab(next: string) { setTab(next); setDoctorId(''); setSearch(''); setMessage(''); setDate(next === 'appointments' ? '' : new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10)); setStatus(next === 'appointments' ? 'Pending' : ''); if (next === 'walkin') setWalkInOpen(true); }
  useEffect(() => { if (['appointments', 'walkin', 'queue'].includes(currentWorkspaceNav)) changeTab(currentWorkspaceNav); }, [currentWorkspaceNav]);
  const [items, setItems] = useState<Appointment[]>([]);
  const [date, setDate] = useState(''), [status, setStatus] = useState('Pending'), [search, setSearch] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [revision, setRevision] = useState(0);
  useEffect(() => {
    const request = new AbortController(); setLoading(true); setError('');
    const timer = window.setTimeout(() => {
      axiosClient.get<Appointment[]>('/clinic/staff/appointments', { signal: request.signal, params: { date: date || undefined, status: status || undefined, search: search.trim() || undefined } })
        .then(r => { if (!request.signal.aborted) setItems(r.data); })
        .catch(e => { if (!request.signal.aborted) { setItems([]); setError(authErrorMessage(e)); } })
        .finally(() => { if (!request.signal.aborted) setLoading(false); });
    }, 180);
    return () => { request.abort(); window.clearTimeout(timer); };
  }, [date, status, search, revision]);
  async function confirm() {
    if (busy || !pendingAction) return;
    const { item, action } = pendingAction;
    setBusy(true); setMessage(''); setError('');
    try {
      await axiosClient.put('/clinic/staff/appointments/' + item.id + '/' + action);
      setMessage((action === 'check-in' ? 'Đã tiếp nhận ' : 'Đã xác nhận lịch hẹn của ') + item.patientName + '.');
      setPendingAction(null);
      setRevision(x => x + 1);
    } catch (e) { setError(authErrorMessage(e)); }
    finally { setBusy(false); }
  }
  const doctors = [...new Map(items.map(a => [a.doctorId, a.doctorName])).entries()];
  const rows = items.filter(a => !doctorId || a.doctorId === doctorId);
  return <section className="management-page">
    <div className="flex flex-wrap gap-2">{[['appointments', 'Duyệt lịch hẹn'], ['queue', 'Tiếp nhận & Check-in'], ['walkin', 'Khám trực tiếp']].map(([key, text]) => <button key={key} onClick={() => changeTab(key)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === key ? 'bg-[#0084c7] text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{text}</button>)}</div>
    <header><h1 className="text-xl font-bold text-slate-900">{tab === 'appointments' ? 'Quản lý & Duyệt lịch hẹn' : tab === 'queue' ? 'Tiếp nhận bệnh nhân có lịch hẹn' : 'Tiếp nhận bệnh nhân đến trực tiếp'}</h1><p className="mt-1 text-sm text-slate-500">Xem và xác nhận lịch hẹn bệnh nhân đặt từ web hoặc mobile.</p></header>
    {tab === 'walkin' && <button className="self-start rounded-xl bg-[#0084c7] px-4 py-2 text-sm font-semibold text-white" onClick={() => setWalkInOpen(true)}>+ Tiếp nhận bệnh nhân trực tiếp</button>}
    {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error} <button className="underline" onClick={() => setRevision(x => x + 1)}>Tải lại</button></p>}
    <div className="management-card overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
        <input aria-label="Ngày khám" type="date" className={field} value={date} onChange={e => { setDate(e.target.value); setDoctorId(''); }} />
        <select aria-label="Trạng thái" className={field} value={status} onChange={e => { setStatus(e.target.value); setDoctorId(''); }}><option value="">Tất cả trạng thái</option>{Object.entries(labels).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select>
        <select aria-label="Bác sĩ" className={field} value={doctorId} onChange={e => setDoctorId(e.target.value)}><option value="">Tất cả bác sĩ</option>{doctors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        <input aria-label="Tìm bệnh nhân" maxLength={200} className={field} placeholder="Tên bệnh nhân, số điện thoại…" value={search} onChange={e => { setSearch(e.target.value); setDoctorId(''); }} />
        <button className="text-sm text-sky-700" onClick={() => { setDate(''); setStatus(''); setDoctorId(''); setSearch(''); }}>Xóa bộ lọc</button>
        <button disabled={loading || busy} className="text-sm text-sky-700 disabled:opacity-50" onClick={() => setRevision(x => x + 1)}>Làm mới</button>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Ngày giờ', 'Bệnh nhân', 'Điện thoại', 'Bác sĩ', 'Phòng', 'Triệu chứng', 'Trạng thái', 'Thao tác'].map(x => <th key={x} className="whitespace-nowrap p-3">{x}</th>)}</tr></thead><tbody>
        {!loading && rows.map(a => <tr key={a.id} className="border-t border-slate-100"><td className="whitespace-nowrap p-3">{clinicTime(a.startTime)}</td><td className="p-3 font-semibold">{a.patientName}</td><td className="p-3">{a.phoneNumber}</td><td className="p-3">{a.doctorName}</td><td className="p-3">{a.room ?? '—'}</td><td className="max-w-xs whitespace-pre-wrap p-3">{a.symptom || '—'}</td><td className="whitespace-nowrap p-3">{labels[a.status] ?? a.status}</td><td className="p-3">{a.status === 'Pending' && <button disabled={busy || new Date(/Z$|[+-]\d\d:\d\d$/.test(a.endTime) ? a.endTime : a.endTime + 'Z').getTime() <= Date.now()} className="whitespace-nowrap rounded-lg bg-[#0084c7] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40" onClick={() => { setError(''); setPendingAction({ item: a, action: 'confirm' }); }}>Xác nhận</button>}{['Pending', 'Confirmed'].includes(a.status) && new Date(a.startTime.replace(/Z$/, '') + (/[+-]\d\d:\d\d$/.test(a.startTime) ? '' : 'Z')).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }) === new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }) && <button disabled={busy} className="ml-2 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40" onClick={() => { setError(''); setPendingAction({ item: a, action: 'check-in' }); }}>Check-in</button>}</td></tr>)}
      </tbody></table>{loading ? <p role="status" className="p-4">Đang tải lịch hẹn…</p> : rows.length === 0 && <p className="p-4 text-slate-500">Không có lịch hẹn phù hợp.</p>}</div>
    </div>
    {pendingAction && <ConfirmDialog title={pendingAction.action === 'check-in' ? 'Tiếp nhận bệnh nhân' : 'Xác nhận lịch hẹn'} busy={busy} onClose={() => setPendingAction(null)} onConfirm={() => void confirm()}>
      <p>{pendingAction.action === 'check-in' ? 'Xác nhận bệnh nhân đã đến quầy và sẵn sàng khám?' : 'Xác nhận lịch khám cho bệnh nhân sau?'}</p>
      <div className="mt-3 rounded-xl bg-slate-50 p-3"><p className="font-semibold text-slate-900">{pendingAction.item.patientName}</p><p>{clinicTime(pendingAction.item.startTime)}</p><p>{pendingAction.item.doctorName} · Phòng {pendingAction.item.room}</p></div>
      {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
    </ConfirmDialog>}
    {walkInOpen && <WalkInDialog onClose={() => setWalkInOpen(false)} onSaved={() => { setWalkInOpen(false); setMessage('Đã tạo lịch và tiếp nhận bệnh nhân.'); setStatus('CheckedIn'); setRevision(x => x + 1); }} />}
  </section>;
}
