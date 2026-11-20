import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { request } from '../api/client';
import { loadSlots, clinicTime, type ClinicAppointment, type ClinicSlot } from '../api/clinic';

export function AppointmentActions({ appointment: a, token, onSaved }: { appointment: ClinicAppointment; token: string; onSaved: () => void }) {
  const [mode, setMode] = useState<'cancel' | 'reschedule' | null>(null);
  const [date, setDate] = useState(''), [slot, setSlot] = useState(''), [slots, setSlots] = useState<ClinicSlot[]>([]);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    let live = true; setSlots([]); setSlot(''); setError(''); setLoading(false);
    if (mode !== 'reschedule' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    setLoading(true);
    loadSlots(a.doctorId, date).then(s => { if (live) setSlots(s); }).catch(e => { if (live) setError(e instanceof Error ? e.message : 'Không tải được giờ khám.'); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [mode, date, a.doctorId]);
  async function save() {
    if (!mode || busy || (mode === 'reschedule' && !slot)) return;
    setBusy(true); setError('');
    try { await request(`/api/clinic/appointments/${a.id}/${mode}`, { method: 'PUT', ...(mode === 'reschedule' ? { body: JSON.stringify({ timeSlotId: slot }) } : {}) }, token); setMode(null); onSaved(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể cập nhật lịch hẹn.'); }
    finally { setBusy(false); }
  }
  if (!['Pending', 'Confirmed'].includes(a.status) || new Date(/Z$|[+-]\d\d:\d\d$/.test(a.startTime) ? a.startTime : a.startTime + 'Z').getTime() <= Date.now()) return null;
  return <><View style={s.actions}><TouchableOpacity onPress={() => { setError(''); setMode('reschedule'); }}><Text style={s.link}>Đổi lịch</Text></TouchableOpacity><TouchableOpacity onPress={() => { setError(''); setMode('cancel'); }}><Text style={s.danger}>Hủy lịch</Text></TouchableOpacity></View>
    <Modal visible={mode !== null} transparent animationType="fade" onRequestClose={() => { if (!busy) setMode(null); }}><View style={s.overlay}><View style={s.dialog} accessibilityViewIsModal>
      <ScrollView contentContainerStyle={{ gap: 14 }}><Text style={s.title}>{mode === 'cancel' ? 'Hủy lịch khám' : 'Đổi lịch khám'}</Text><Text style={s.name}>{a.doctorName}</Text><Text>{clinicTime(a.startTime)}</Text>
        {mode === 'cancel' ? <Text>Bạn muốn hủy lịch này? Khung giờ sẽ được mở lại cho người khác đặt.</Text> : <><Text>Chọn ngày và giờ mới của bác sĩ. Lịch mới cần được xác nhận lại.</Text><TextInput accessibilityLabel="Ngày khám mới" editable={!busy} style={s.input} placeholder="YYYY-MM-DD" value={date} maxLength={10} keyboardType="numbers-and-punctuation" onChangeText={setDate} />{loading ? <ActivityIndicator /> : slots.map(t => <TouchableOpacity disabled={busy} key={t.id} style={[s.slot, slot === t.id && s.selected]} onPress={() => setSlot(t.id)}><Text>{slot === t.id ? '✓ ' : ''}{clinicTime(t.startTime)} · Phòng {t.room}</Text></TouchableOpacity>)}{date.length === 10 && !loading && slots.length === 0 && <Text>Ngày này chưa có giờ trống.</Text>}</>}
        {!!error && <Text style={s.danger}>{error}</Text>}
      </ScrollView><View style={s.footer}><TouchableOpacity disabled={busy} onPress={() => setMode(null)} style={s.secondary}><Text>Quay lại</Text></TouchableOpacity><TouchableOpacity disabled={busy || (mode === 'reschedule' && !slot)} onPress={() => void save()} style={[s.primary, (busy || (mode === 'reschedule' && !slot)) && { opacity: .5 }]}><Text style={{ color: 'white', fontWeight: '700' }}>{busy ? 'Đang xử lý…' : 'Xác nhận'}</Text></TouchableOpacity></View>
    </View></View></Modal>
  </>;
}
const s = StyleSheet.create({ actions: { flexDirection: 'row', gap: 24, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 14 }, link: { color: '#0084c7', fontWeight: '600' }, danger: { color: '#be123c' }, overlay: { flex: 1, backgroundColor: '#0f172a88', justifyContent: 'center', padding: 20 }, dialog: { maxHeight: '85%', backgroundColor: 'white', borderRadius: 20, padding: 22, gap: 18 }, title: { fontSize: 20, fontWeight: '700', color: '#16415a' }, name: { fontWeight: '600', color: '#16415a' }, input: { borderWidth: 1, borderColor: '#cbd5e1', padding: 12, borderRadius: 12 }, slot: { padding: 12, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12 }, selected: { borderColor: '#0084c7', backgroundColor: '#eaf7ff' }, footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }, secondary: { padding: 12 }, primary: { padding: 12, backgroundColor: '#0084c7', borderRadius: 12 } });
