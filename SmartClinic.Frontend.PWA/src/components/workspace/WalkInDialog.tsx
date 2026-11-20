import { useEffect, useState, type FormEvent } from 'react';
import { axiosClient } from '../../services/axiosClient';
import { clinicTime } from '../../services/clinicService';
import { authErrorMessage } from '../../services/authService';

interface Patient { id: string; fullName: string; phoneNumber: string; dob: string | null; gender: string | null }
interface Slot { id: string; doctorId: string; doctorName: string; departmentName: string; room: string; startTime: string; endTime: string }
const field = 'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm';
export function WalkInDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [search, setSearch] = useState(''), [patients, setPatients] = useState<Patient[]>([]), [patient, setPatient] = useState<Patient | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]), [slotId, setSlotId] = useState(''), [doctor, setDoctor] = useState('');
  const [loading, setLoading] = useState(true), [searching, setSearching] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [lookupError, setLookupError] = useState(''), [revision, setRevision] = useState(0);
  useEffect(() => { const request = new AbortController(); setLoading(true);
    axiosClient.get<Slot[]>('/clinic/staff/walk-in/slots', { signal: request.signal }).then(r => { if (!request.signal.aborted) setSlots(r.data); })
      .catch(e => { if (!request.signal.aborted) setError(authErrorMessage(e)); }).finally(() => { if (!request.signal.aborted) setLoading(false); });
    return () => request.abort();
  }, [revision]);
  useEffect(() => {
    setPatients([]); setLookupError(''); setSearching(false);
    if (mode !== 'existing' || search.trim().length < 2) return;
    const request = new AbortController(); setSearching(true);
    const timer = window.setTimeout(() => { axiosClient.get<Patient[]>('/clinic/staff/patients', { signal: request.signal, params: { search: search.trim() } })
      .then(r => { if (!request.signal.aborted) setPatients(r.data); }).catch(e => { if (!request.signal.aborted) setLookupError(authErrorMessage(e)); })
      .finally(() => { if (!request.signal.aborted) setSearching(false); }); }, 250);
    return () => { request.abort(); window.clearTimeout(timer); };
  }, [mode, search]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy) return;
    if (mode === 'existing' && !patient) { setError('Hãy chọn hồ sơ bệnh nhân.'); return; }
    const data = new FormData(e.currentTarget);
    setBusy(true); setError('');
    try {
      await axiosClient.post('/clinic/staff/walk-in', { timeSlotId: slotId, patientId: mode === 'existing' ? patient!.id : null,
        fullName: data.get('fullName'), phoneNumber: data.get('phoneNumber'), dob: data.get('dob'), gender: data.get('gender'), identityCard: String(data.get('identityCard') ?? '').trim() || null, symptom: data.get('symptom') });
      onSaved();
    } catch (e) { setError(authErrorMessage(e)); setSlotId(''); setRevision(x => x + 1); }
    finally { setBusy(false); }
  }
  const doctors = [...new Map(slots.map(s => [s.doctorId, { name: s.doctorName, department: s.departmentName }])).entries()];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><form role="dialog" aria-modal="true" aria-label="Tiếp nhận bệnh nhân trực tiếp" onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6">
    <h2 className="text-lg font-bold">Tiếp nhận bệnh nhân trực tiếp</h2><p className="text-sm text-slate-500">Chọn hồ sơ và giờ trống trong ca hôm nay. Sau khi lưu, bệnh nhân được chuyển sang Đã tiếp nhận.</p>
    <fieldset disabled={busy} className="space-y-4">
      <div className="flex gap-4 text-sm"><label><input type="radio" checked={mode === 'existing'} onChange={() => setMode('existing')} /> Đã có hồ sơ</label><label><input type="radio" checked={mode === 'new'} onChange={() => setMode('new')} /> Bệnh nhân mới</label></div>
      {mode === 'existing' ? <div><input aria-label="Tìm hồ sơ bệnh nhân" maxLength={100} className={field} placeholder="Nhập tên hoặc số điện thoại (ít nhất 2 ký tự)" value={search} onChange={e => { setSearch(e.target.value); setPatient(null); }} />
        {searching && <p className="text-sm">Đang tìm…</p>}{lookupError && <p role="alert" className="text-sm text-red-700">{lookupError}</p>}
        {!searching && search.trim().length >= 2 && !lookupError && patients.length === 0 && <p className="text-sm text-slate-500">Không tìm thấy hồ sơ. Có thể chọn Bệnh nhân mới.</p>}
        <div className="mt-2 max-h-40 overflow-auto">{patients.map(p => <button type="button" key={p.id} onClick={() => setPatient(p)} className={`mb-1 block w-full rounded-lg border p-3 text-left text-sm ${patient?.id === p.id ? 'border-sky-500 bg-sky-50' : 'border-slate-200'}`}>{p.fullName} · {p.phoneNumber}{p.dob ? ' · ' + p.dob.slice(0, 10) : ''}</button>)}</div>
      </div> : <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Họ và tên *<input name="fullName" required maxLength={100} className={field} /></label><label className="text-sm">Số điện thoại *<input name="phoneNumber" type="tel" required pattern="[+]?[0-9]{9,15}" className={field} /></label><label className="text-sm">Ngày sinh *<input name="dob" type="date" required max={new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10)} className={field} /></label><label className="text-sm">Giới tính *<select name="gender" required className={field}><option value="">Chọn giới tính</option><option>Nam</option><option>Nữ</option><option>Khác</option></select></label><label className="text-sm sm:col-span-2">Số CCCD (tùy chọn)<input name="identityCard" inputMode="numeric" pattern="[0-9]{12}" maxLength={12} placeholder="Nhập 12 số căn cước công dân" title="CCCD phải gồm đúng 12 chữ số" className={field} /></label><p className="text-xs text-slate-500 sm:col-span-2">Tạo hồ sơ tiếp nhận tại quầy, chưa cấp tài khoản đăng nhập. Hãy tìm hồ sơ cũ trước để tránh tạo trùng.</p></div>}
      <label className="block text-sm">Bác sĩ / Khoa<select className={field} value={doctor} onChange={e => { setDoctor(e.target.value); setSlotId(''); }}><option value="">Tất cả bác sĩ</option>{doctors.map(([id, info]) => <option key={id} value={id}>{info.name} — {info.department}</option>)}</select></label>
      <label className="block text-sm">Khung giờ hôm nay *<select required className={field} value={slotId} onChange={e => setSlotId(e.target.value)}><option value="">{loading ? 'Đang tải giờ trống…' : 'Chọn giờ khám'}</option>{slots.filter(s => !doctor || s.doctorId === doctor).map(s => <option key={s.id} value={s.id}>{clinicTime(s.startTime)} · {s.doctorName} · Phòng {s.room}</option>)}</select></label>
      {!loading && slots.length === 0 && <p className="text-sm text-amber-700">Hôm nay chưa có giờ trống. Cần tạo thêm ca khám hoặc chọn ca khác.</p>}
      <label className="block text-sm">Lý do khám<textarea name="symptom" maxLength={2000} rows={2} className={field} /></label>
    </fieldset>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={onClose}>Đóng</button><button disabled={busy || loading || !slotId} className="rounded-xl bg-[#0084c7] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang tiếp nhận…' : 'Tạo lịch & Check-in'}</button></div>
  </form></div>;
}
