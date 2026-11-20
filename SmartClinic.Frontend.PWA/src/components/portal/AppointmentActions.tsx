import { useEffect, useState } from 'react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { clinicService, clinicTime, type ClinicAppointment, type Slot } from '../../services/clinicService';
import { axiosClient } from '../../services/axiosClient';
import { authErrorMessage } from '../../services/authService';

export function AppointmentActions({ appointment: a, onSaved }: { appointment: ClinicAppointment; onSaved: () => void }) {
  const [mode, setMode] = useState<'cancel' | 'reschedule' | null>(null);
  const [date, setDate] = useState(''), [slotId, setSlotId] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]), [loading, setLoading] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    let live = true; setSlots([]); setSlotId(''); setLoading(false);
    if (mode !== 'reschedule' || !date) return;
    setLoading(true); setError('');
    clinicService.slots(a.doctorId, date).then(s => { if (live) setSlots(s); }).catch(e => { if (live) setError(authErrorMessage(e)); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [mode, date, a.doctorId]);
  async function save() {
    if (busy || !mode || (mode === 'reschedule' && !slotId)) return;
    setBusy(true); setError('');
    try { await axiosClient.put(`/clinic/appointments/${a.id}/${mode}`, mode === 'reschedule' ? { timeSlotId: slotId } : undefined); setMode(null); onSaved(); }
    catch (e) { setError(authErrorMessage(e)); }
    finally { setBusy(false); }
  }
  const eligible = ['Pending', 'Confirmed'].includes(a.status) && new Date(/Z$|[+-]\d\d:\d\d$/.test(a.startTime) ? a.startTime : a.startTime + 'Z').getTime() > Date.now();
  if (!eligible) return null;
  return <><div className="flex gap-4 border-t border-slate-100 pt-3 text-sm"><button className="font-semibold text-sky-700" onClick={() => { setError(''); setMode('reschedule'); }}>Đổi lịch</button><button className="font-semibold text-red-700" onClick={() => { setError(''); setMode('cancel'); }}>Hủy lịch</button></div>
    {mode && <ConfirmDialog title={mode === 'cancel' ? 'Hủy lịch khám' : 'Đổi lịch khám'} busy={busy} confirmDisabled={mode === 'reschedule' && (!slotId || loading)} onClose={() => setMode(null)} onConfirm={() => void save()}>
      <p className="font-semibold">{a.doctorName} · {clinicTime(a.startTime)}</p>
      {mode === 'cancel' ? <p>Bạn muốn hủy lịch này? Khung giờ sẽ được mở lại cho người khác đặt.</p> : <div className="space-y-3"><p>Chọn giờ mới của bác sĩ. Sau khi đổi, lịch mới cần được xác nhận lại.</p><label className="block">Ngày khám<input aria-label="Ngày khám mới" type="date" min={new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10)} value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full rounded-lg border p-2" /></label><select aria-label="Khung giờ mới" value={slotId} onChange={e => setSlotId(e.target.value)} className="w-full rounded-lg border p-2"><option value="">{loading ? 'Đang tải…' : 'Chọn giờ trống'}</option>{slots.map(s => <option key={s.id} value={s.id}>{clinicTime(s.startTime)} · Phòng {s.room}</option>)}</select>{date && !loading && slots.length === 0 && <p>Ngày này chưa có giờ trống.</p>}</div>}
      {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
    </ConfirmDialog>}
  </>;
}
