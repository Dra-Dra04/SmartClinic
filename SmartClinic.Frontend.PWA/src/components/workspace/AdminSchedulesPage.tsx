import { ConfirmDialog } from '../common/ConfirmDialog';
import { useEffect, useState, type FormEvent } from 'react';
import { axiosClient } from '../../services/axiosClient';
import { clinicService, clinicTime, type ClinicDoctor, type Department, type Schedule } from '../../services/clinicService';
import { authErrorMessage } from '../../services/authService';

const field = 'rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm';
const primary = 'rounded-lg bg-[#0084c7] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
const localTime = (value: string) => new Date(/(Z|[+-]\d\d:\d\d)$/.test(value) ? value : value + 'Z').toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(0, 16).replace(' ', 'T');
interface Draft { id?: string; doctorId: string; startTime: string; endTime: string; slotMinutes: number; room: string }
interface Visit { id: string; patientName: string; phoneNumber: string; startTime: string; endTime: string; status: string; symptom: string | null }
const labels: Record<string, string> = { Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Cancelled: 'Đã hủy', Completed: 'Hoàn tất', CheckedIn: 'Đã tiếp nhận', InProgress: 'Đang khám', NoShow: 'Không đến' };

export function AdminSchedulesPage() {
  const [confirmTarget, setConfirmTarget] = useState<Visit | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doctors, setDoctors] = useState<ClinicDoctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const [date, setDate] = useState(''), [doctorId, setDoctorId] = useState(''), [status, setStatus] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [selected, setSelected] = useState<Schedule | null>(null), [visits, setVisits] = useState<Visit[] | null>(null);
  const [detailError, setDetailError] = useState('');
  useEffect(() => {
    let live = true; setLoading(true); setError('');
    Promise.all([clinicService.schedules(), clinicService.doctors(true), clinicService.departments()])
      .then(([s, d, k]) => { if (live) { setSchedules(s); setDoctors(d); setDepartments(k); } })
      .catch(e => { if (live) setError(authErrorMessage(e)); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [revision]);
  useEffect(() => {
    if (!selected) return;
    const request = new AbortController(); setVisits(null); setDetailError('');
    axiosClient.get<Visit[]>('/clinic/admin/schedules/' + selected.id + '/appointments', { signal: request.signal })
      .then(r => { if (!request.signal.aborted) setVisits(r.data); })
      .catch(e => { if (!request.signal.aborted) setDetailError(authErrorMessage(e)); });
    return () => request.abort();
  }, [selected]);
  async function confirmVisit(id: string) {
    if (busy) return;
    setBusy(true); setDetailError('');
    try {
      await axiosClient.put('/clinic/staff/appointments/' + id + '/confirm');
      setConfirmTarget(null);
      setVisits(current => current?.map(v => v.id === id ? { ...v, status: 'Confirmed' } : v) ?? null);
    } catch (e) { setDetailError(authErrorMessage(e)); }
    finally { setBusy(false); }
  }
  const now = Date.now();
  const upcoming = (s: Schedule) => s.isActive && new Date(localTime(s.startTime) + '+07:00').getTime() > now;
  const rows = schedules.filter(s => (!date || localTime(s.startTime).slice(0, 10) === date)
    && (!doctorId || s.doctorId === doctorId)
    && (status === 'all' || (status === 'upcoming' ? upcoming(s) : status === 'cancelled' ? !s.isActive : s.isActive && !upcoming(s)))
    && ((s.doctorName ?? '') + s.room).toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  async function run(action: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try { await action(); setDraft(null); setMessage(success); setRevision(x => x + 1); }
    catch (e) { setError(authErrorMessage(e)); }
    finally { setBusy(false); }
  }
  function submit(e: FormEvent) {
    e.preventDefault(); if (!draft) return;
    const start = new Date(draft.startTime + '+07:00'), end = new Date(draft.endTime + '+07:00');
    const minutes = (end.getTime() - start.getTime()) / 60000;
    if (!Number.isFinite(minutes) || start.getTime() <= Date.now() || minutes <= 0 || minutes > 720 || minutes % draft.slotMinutes !== 0 || !draft.room.trim()) {
      setError('Ca phải ở tương lai, tối đa 12 giờ, chia hết theo thời lượng mỗi lượt và có phòng khám.'); return;
    }
    const body = { ...draft, room: draft.room.trim(), startTime: start.toISOString(), endTime: end.toISOString() };
    void run(() => draft.id ? axiosClient.put('/clinic/admin/schedules/' + draft.id, body) : clinicService.createSchedule(body), draft.id ? 'Đã cập nhật ca khám.' : 'Đã tạo ca khám.');
  }
  return <section className="management-page">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl font-bold">Quản lý Ca khám</h1><p className="text-sm text-slate-500">Phân ca theo bác sĩ và phòng khám. Mỗi khung giờ nhận một bệnh nhân.</p></div>
      <button className={primary} onClick={() => { setError(''); setDraft({ doctorId: '', startTime: '', endTime: '', slotMinutes: 30, room: '' }); }}>Tạo ca khám</button></header>
    <div className="flex flex-wrap gap-4 text-sm"><span>Ca sắp tới: <b>{schedules.filter(upcoming).length}</b></span><span>Lượt đã đặt trong ca sắp tới: <b>{schedules.filter(upcoming).reduce((n, s) => n + s.booked, 0)}</b></span></div>
    {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error} <button className="underline" onClick={() => setRevision(x => x + 1)}>Tải lại</button></p>}
    <div className="management-card rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
        <input aria-label="Ngày khám" type="date" className={field} value={date} onChange={e => setDate(e.target.value)} />
        <select aria-label="Bác sĩ" className={field} value={doctorId} onChange={e => setDoctorId(e.target.value)}><option value="">Tất cả bác sĩ</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}</select>
        <select aria-label="Trạng thái ca" className={field} value={status} onChange={e => setStatus(e.target.value)}><option value="upcoming">Sắp tới</option><option value="all">Tất cả ca</option><option value="past">Đã bắt đầu</option><option value="cancelled">Đã hủy</option></select>
        <input aria-label="Tìm bác sĩ hoặc phòng" placeholder="Tìm bác sĩ, phòng…" className={field} value={search} onChange={e => setSearch(e.target.value)} />
        <button className="text-sm text-sky-700" onClick={() => { setDate(''); setDoctorId(''); setSearch(''); setStatus('all'); }}>Xóa bộ lọc</button>
        <button className="text-sm text-sky-700" onClick={() => setRevision(x => x + 1)}>Làm mới</button>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Bác sĩ', 'Thời gian', 'Phòng', 'Thời lượng', 'Đã đặt / Tổng', 'Còn trống', 'Trạng thái', 'Thao tác'].map(x => <th key={x} className="whitespace-nowrap p-3">{x}</th>)}</tr></thead>
        <tbody>{!loading && rows.map(s => <tr key={s.id} className="border-t border-slate-100"><td className="p-3 font-semibold">{s.doctorName}</td><td className="p-3 whitespace-nowrap">{clinicTime(s.startTime)}<br />{clinicTime(s.endTime)}</td><td className="p-3">{s.room}</td><td className="p-3">{s.slotMinutes} phút</td><td className="p-3">{s.booked} / {s.totalSlots}</td><td className="p-3">{upcoming(s) ? Math.max(0, s.totalSlots - s.booked) : '—'}</td><td className="p-3">{!s.isActive ? 'Đã hủy' : upcoming(s) ? 'Sắp tới' : 'Đã bắt đầu'}</td>
          <td className="p-3"><div className="flex flex-wrap gap-3"><button className="text-sky-700" onClick={() => setSelected(s)}>Bệnh nhân</button>
            {upcoming(s) && <><button disabled={busy || s.hasAppointments} title={s.hasAppointments ? 'Ca có lịch sử đặt khám không thể sửa giờ' : 'Sửa ca khám'} className="text-sky-700 disabled:opacity-40" onClick={() => { setError(''); setDraft({ ...s, startTime: localTime(s.startTime), endTime: localTime(s.endTime) }); }}>Sửa</button>
              <button disabled={busy || s.booked > 0} title={s.booked > 0 ? 'Ca còn lịch hẹn nên không thể hủy' : 'Hủy ca khám'} className="text-red-700 disabled:opacity-40" onClick={() => { if (window.confirm('Hủy ca khám này? Các giờ trong ca sẽ ngừng nhận đặt lịch.')) void run(() => clinicService.removeSchedule(s.id), 'Đã hủy ca khám.'); }}>Hủy ca</button></>}
          </div></td></tr>)}</tbody></table>
        {loading ? <p role="status" className="p-4">Đang tải ca khám…</p> : rows.length === 0 && <p className="p-4 text-slate-500">Không có ca khám phù hợp.</p>}
      </div>
    </div>
    {draft && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><form role="dialog" aria-modal="true" aria-label="Thông tin ca khám" onSubmit={submit} className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6">
      <h2 className="text-lg font-bold">{draft.id ? 'Sửa ca khám' : 'Tạo ca khám'}</h2>
      <fieldset disabled={busy} className="space-y-4">
        <label className="block text-sm">Bác sĩ *<select required disabled={!!draft.id} className={field + ' mt-1 w-full'} value={draft.doctorId} onChange={e => setDraft({ ...draft, doctorId: e.target.value })}><option value="">Chọn bác sĩ</option>{doctors.filter(d => departments.some(k => k.id === d.departmentId && k.isActive)).map(d => <option key={d.id} value={d.id}>{d.fullName} — {d.departmentName}</option>)}</select></label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{(['startTime', 'endTime'] as const).map((key, i) => <label key={key} className="text-sm">{i ? 'Kết thúc' : 'Bắt đầu'} *<input required type="datetime-local" className={field + ' mt-1 w-full'} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>)}</div>
        <label className="block text-sm">Thời lượng mỗi lượt (phút) *<input required type="number" min={5} max={120} className={field + ' mt-1 w-full'} value={draft.slotMinutes} onChange={e => setDraft({ ...draft, slotMinutes: Number(e.target.value) })} /></label>
        <label className="block text-sm">Phòng khám *<input required maxLength={100} className={field + ' mt-1 w-full'} value={draft.room} onChange={e => setDraft({ ...draft, room: e.target.value })} /></label>
        <p className="text-xs text-slate-500">Thời gian theo giờ Việt Nam. Ca tối đa 12 giờ và phải chia hết theo thời lượng mỗi lượt. Chỉ sửa ca chưa có lịch sử đặt khám. Để bệnh nhân đặt lịch, hồ sơ bác sĩ cần được xuất bản và bật nhận đặt khám.</p>
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={() => setDraft(null)}>Đóng</button><button className={primary} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu ca khám'}</button></div>
    </form></div>}
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><section role="dialog" aria-modal="true" aria-label="Bệnh nhân trong ca" className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-4 rounded-2xl bg-white p-6">
      <div className="flex justify-between gap-3"><div><h2 className="text-lg font-bold">Bệnh nhân trong ca — {selected.doctorName}</h2><p className="text-sm text-slate-500">{clinicTime(selected.startTime)} · Phòng {selected.room}</p></div><button onClick={() => setSelected(null)}>Đóng</button></div>
      <div className="min-h-0 overflow-auto">{detailError && <p role="alert" className="text-red-700">{detailError} <button className="underline" onClick={() => setSelected({ ...selected })}>Tải lại</button></p>}{!visits ? <p role="status">Đang tải…</p> : visits.length === 0 ? <p>Ca chưa có bệnh nhân đặt lịch.</p> : <table className="w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50"><tr>{['Giờ khám', 'Bệnh nhân', 'Điện thoại', 'Trạng thái', 'Triệu chứng', 'Thao tác'].map(x => <th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{visits.map(v => <tr key={v.id} className="border-t border-slate-100"><td className="p-3">{clinicTime(v.startTime)}</td><td className="p-3">{v.patientName}</td><td className="p-3">{v.phoneNumber}</td><td className="p-3">{labels[v.status] ?? v.status}</td><td className="p-3 whitespace-pre-wrap">{v.symptom || '—'}</td><td className="p-3">{v.status === 'Pending' && <button disabled={busy} className="whitespace-nowrap text-sky-700 disabled:opacity-50" onClick={() => { setDetailError(''); setConfirmTarget(v); }}>Xác nhận</button>}</td></tr>)}</tbody></table>}</div>
    </section></div>}
    {confirmTarget && <ConfirmDialog title="Xác nhận lịch hẹn" busy={busy} onClose={() => setConfirmTarget(null)} onConfirm={() => void confirmVisit(confirmTarget.id)}><p>Xác nhận lịch khám của <strong>{confirmTarget.patientName}</strong>?</p><p>{clinicTime(confirmTarget.startTime)}</p>{detailError && <p role="alert" className="text-red-700">{detailError}</p>}</ConfirmDialog>}
  </section>;
}
