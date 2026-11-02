import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useClinicStore } from '../../store/useClinicStore';
import { VisitStatus, Appointment } from '../../types';
import { 
  Calendar, 
  Clock, 
  Activity, 
  FileText, 
  Pill, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Scan, 
  Printer, 
  MapPin,
  RefreshCw,
  Eye
} from 'lucide-react';

export const PatientVisitsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { 
    appointments, 
    visits, 
    cancelAppointment, 
    changeAppointmentTime, 
    timeSlots 
  } = useClinicStore();

  const [activeSubTab, setActiveSubTab] = useState<'live_tracker' | 'my_appointments' | 'emr_history'>('live_tracker');
  const [rescheduleApptId, setRescheduleApptId] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState('14:00 - 14:30');
  const [newDate, setNewDate] = useState(new Date().toISOString().substring(0, 10));

  // Current active visit of today
  const activeVisit = visits[0]; // Patient Trần Văn An's active visit
  const myAppts = appointments.filter((a) => a.patientId === currentUser.id || a.patientPhone === currentUser.phone);

  const getStepNumber = (status: VisitStatus): number => {
    switch (status) {
      case 'WAITING_EXAM':
        return 1;
      case 'IN_EXAM_PRIMARY':
        return 2;
      case 'AWAITING_SUBCLINICAL':
        return 3;
      case 'RESULTS_READY':
        return 4;
      case 'COMPLETED':
        return 5;
      default:
        return 1;
    }
  };

  const currentStep = activeVisit ? getStepNumber(activeVisit.status) : 1;

  const stepperItems = [
    { num: 1, label: `Đã Check-in (STT: ${activeVisit?.visitCode || 'A-012'})`, sub: 'Lễ tân tiếp đón' },
    { num: 2, label: 'Khám lâm sàng (Phòng 102)', sub: 'BS. Nguyễn Minh Tuấn' },
    { num: 3, label: 'Đang làm Cận lâm sàng', sub: 'Phòng 204 Chụp X-Quang' },
    { num: 4, label: 'Đã có KQ - Chờ BS kết luận', sub: 'Khoa CĐHA đã trả KQ' },
    { num: 5, label: 'Hoàn tất & Nhận đơn thuốc', sub: 'Kết thúc ca khám' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in">
      
      {/* Top Profile Summary Strip */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'}
            alt={currentUser.fullName}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-[#0084c7]"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{currentUser.fullName}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#005a8b]">
                CCCD: {currentUser.idCardNumber || '001085012345'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              SĐT: <strong>{currentUser.phone}</strong> • Giới tính: <strong>{currentUser.gender || 'Nam'}</strong> • Nhóm máu: <strong className="text-[#005a8b]">{currentUser.bloodType || 'O+'}</strong>
            </p>
          </div>
        </div>

        {currentUser.allergies && currentUser.allergies.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>Dị ứng: {currentUser.allergies.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('live_tracker')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'live_tracker'
              ? 'bg-[#0084c7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Tab 2: Tiến trình Ca khám Hôm nay (Live Tracker)</span>
          {activeVisit && <span className="w-2 h-2 rounded-full bg-sky-300 animate-ping" />}
        </button>

        <button
          onClick={() => setActiveSubTab('my_appointments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'my_appointments'
              ? 'bg-[#0084c7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Tab 1: Lịch hẹn của tôi ({myAppts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('emr_history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'emr_history'
              ? 'bg-[#0084c7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Tab 3: Kết quả Cận lâm sàng & Đơn thuốc</span>
        </button>
      </div>

      {/* TAB 2: LIVE VISIT TRACKER (5 Steps) */}
      {activeSubTab === 'live_tracker' && (
        <div className="space-y-6">
          {activeVisit ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Lượt khám đang hoạt động
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-black font-mono text-[#005a8b] bg-blue-100 px-2.5 py-0.5 rounded-xl">
                      {activeVisit.visitCode}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{activeVisit.specialtyName}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  <MapPin className="w-4 h-4 text-[#0084c7]" />
                  <span>Phòng khám chính: <strong>{activeVisit.roomNumber}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>Check-in: <strong>{activeVisit.checkInTime}</strong></span>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-2.5 text-xs text-[#005a8b] font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0084c7] animate-ping flex-shrink-0" />
                <div>
                  <strong className="text-[#005a8b]">Thông báo từ hệ thống HIS: </strong>
                  {activeVisit.currentStepMessage}
                </div>
              </div>

              {/* 5-Step Horizontal Stepper */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {stepperItems.map((step) => {
                  const isDone = step.num < currentStep;
                  const isCurrent = step.num === currentStep;

                  return (
                    <div
                      key={step.num}
                      className={`p-3 rounded-2xl border transition flex flex-col justify-between ${
                        isCurrent
                          ? 'border-[#0084c7] bg-blue-50/80 ring-2 ring-blue-200 shadow-xs'
                          : isDone
                          ? 'border-blue-200 bg-slate-50'
                          : 'border-slate-100 bg-white opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isCurrent
                              ? 'bg-[#0084c7] text-white animate-pulse'
                              : isDone
                              ? 'bg-blue-100 text-[#005a8b]'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {isDone ? '✓' : step.num}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-[#0084c7] bg-blue-100 px-2 py-0.5 rounded-full">
                            Hiện tại
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{step.label}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{step.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Vital Signs Measured Today */}
              {activeVisit.emr?.vitalSigns && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Chỉ số sinh tồn đo tại bàn khám
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block">Huyết áp</span>
                      <strong className="text-base font-mono text-emerald-900 mt-0.5 block">
                        {activeVisit.emr.vitalSigns.systolicBp}/{activeVisit.emr.vitalSigns.diastolicBp} mmHg
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block">Mạch tim</span>
                      <strong className="text-base font-mono text-emerald-900 mt-0.5 block">
                        {activeVisit.emr.vitalSigns.pulseBpm} bpm
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block">Chỉ số BMI</span>
                      <strong className="text-base font-mono text-emerald-900 mt-0.5 block">
                        {activeVisit.emr.vitalSigns.bmi.toFixed(1)}
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block">Thân nhiệt</span>
                      <strong className="text-base font-mono text-emerald-900 mt-0.5 block">
                        {activeVisit.emr.vitalSigns.temperatureC}°C
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-500 text-xs">
              Hiện bạn chưa có lượt khám nào đang hoạt động hôm nay.
            </div>
          )}
        </div>
      )}

      {/* TAB 1: MY APPOINTMENTS */}
      {activeSubTab === 'my_appointments' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
            Lịch Hẹn Khám Đã Đăng Ký
          </h3>

          <div className="space-y-3">
            {myAppts.map((appt) => (
              <div
                key={appt.id}
                className="p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {appt.appointmentCode}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      appt.status === 'CONFIRMED'
                        ? 'bg-blue-100 text-blue-800'
                        : appt.status === 'ARRIVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : appt.status === 'CANCELLED'
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {appt.status === 'CONFIRMED' ? 'Đã xác nhận' : appt.status === 'ARRIVED' ? 'Đã đến khám' : appt.status === 'CANCELLED' ? 'Đã hủy' : 'Chờ xác nhận'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {appt.doctorTitle} {appt.doctorName} - {appt.specialtyName}
                  </h4>
                  <p className="text-slate-600 mt-0.5">
                    Thời gian: <strong className="text-emerald-700">{appt.timeSlot}</strong> • Ngày: <strong>{appt.date}</strong>
                  </p>
                  <p className="text-slate-500 italic mt-0.5">Triệu chứng: {appt.symptoms}</p>
                </div>

                {/* Actions: Reschedule or Cancel */}
                <div className="flex items-center gap-2">
                  {(appt.status === 'PENDING_CONFIRMATION' || appt.status === 'CONFIRMED') && (
                    <>
                      <button
                        onClick={() => setRescheduleApptId(appt.id)}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Đổi giờ</span>
                      </button>

                      <button
                        onClick={() => cancelAppointment(appt.id)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold border border-red-200 flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Hủy lịch</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Modal Đổi giờ khám */}
          {rescheduleApptId && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 space-y-3">
              <h4 className="font-bold text-emerald-950 text-xs">Đổi ngày và khung giờ khám mới</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Chọn ngày:</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Chọn khung giờ:</label>
                  <select
                    value={newSlot}
                    onChange={(e) => setNewSlot(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-semibold"
                  >
                    {timeSlots.filter(s => s.isAvailable).map((s) => (
                      <option key={s.id} value={s.time}>{s.time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setRescheduleApptId(null)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200 rounded-lg"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    changeAppointmentTime(rescheduleApptId, newDate, newSlot);
                    setRescheduleApptId(null);
                    alert('Đã cập nhật khung giờ mới cho lịch hẹn!');
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EMR HISTORY & IMAGING RESULTS */}
      {activeSubTab === 'emr_history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Bệnh Án Điện Tử EMR & Kết Quả Chụp Chiếu</h3>
                <p className="text-xs text-slate-500">Mã ca bệnh: {activeVisit?.visitCode || 'A-012'} • BS phụ trách: BS.CKII Nguyễn Minh Tuấn</p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-200"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Hồ sơ / Đơn thuốc</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
              
              {/* EMR Diagnosis Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                  Khám lâm sàng & Chẩn đoán
                </span>
                <p><strong>Lý do vào viện:</strong> {activeVisit?.emr?.chiefComplaint || 'Đau âm ỉ thượng vị 2 tuần'}</p>
                <p><strong>Bệnh sử & Khám:</strong> {activeVisit?.emr?.presentIllness || 'Bụng mềm, ấn tức thượng vị'}</p>
                <p><strong>Chẩn đoán sơ bộ:</strong> {activeVisit?.emr?.preliminaryDiagnosis || 'Trào ngược dạ dày thực quản (GERD)'}</p>
                <p><strong>Mã ICD-10:</strong> <span className="font-mono font-bold text-emerald-900">{activeVisit?.emr?.icd10Code || 'K21.9 / K29.5'}</span></p>
                <p><strong>Kết luận xử trí:</strong> {activeVisit?.emr?.conclusion || 'Chờ kết quả X-quang'}</p>
              </div>

              {/* Subclinical Result Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider block">
                  Kết quả Cận lâm sàng (Khoa CĐHA P.204)
                </span>
                <p><strong>Kỹ thuật:</strong> Chụp X-Quang ngực thẳng kỹ thuật số (DR)</p>
                <p><strong>Bác sĩ thực hiện:</strong> TS.BS Lê Hoàng (DOC-02)</p>
                <p><strong>Mô tả tổn thương:</strong> Hai phế trường sáng đều, không thấy tổn thương thâm nhiễm nhu mô phổi. Cung sườn bình thường, bóng tim không to.</p>
                <p className="font-bold text-emerald-900">
                  <strong>Kết luận:</strong> Hình ảnh tim phổi thẳng hiện chưa phát hiện bất thường rõ rệt.
                </p>
              </div>

            </div>

            {/* Electronic Prescription */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Đơn thuốc ngoại trú (Mã RX: RX-2026-8819)
              </span>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5">STT</th>
                      <th className="p-2.5">Tên thuốc & Hàm lượng</th>
                      <th className="p-2.5">Số lượng</th>
                      <th className="p-2.5">Đơn vị</th>
                      <th className="p-2.5">Cách dùng & Liều lượng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 font-bold">1</td>
                      <td className="p-2.5 font-semibold text-slate-900">Nexium (Esomeprazole 40mg)</td>
                      <td className="p-2.5 font-bold text-emerald-800">28</td>
                      <td className="p-2.5">Viên</td>
                      <td className="p-2.5 text-slate-600">Uống 1 viên trước bữa ăn sáng 30 phút</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">2</td>
                      <td className="p-2.5 font-semibold text-slate-900">Phosphalugel (Gel nhôm phosphat 20g)</td>
                      <td className="p-2.5 font-bold text-emerald-800">30</td>
                      <td className="p-2.5">Gói</td>
                      <td className="p-2.5 text-slate-600">Uống 1 gói khi đau rát thượng vị hoặc sau ăn 2 giờ</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950">
                <strong>Lời dặn của Bác sĩ:</strong> Ăn uống đúng giờ, tránh đồ cay nóng và rượu bia. Tái khám sau 14 ngày.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
