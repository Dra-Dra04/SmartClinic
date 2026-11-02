import React, { useState } from 'react';
import { useClinicStore } from '../../store/useClinicStore';
import { SPECIALTIES_DATA, DOCTORS_DATA } from '../../services/mockData';
import { 
  CalendarCheck, 
  UserPlus, 
  Clock, 
  Search, 
  CheckCircle2, 
  XCircle, 
  EyeOff, 
  Bell, 
  UserX, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const ReceptionistDesk: React.FC = () => {
  const { 
    appointments, 
    visits, 
    checkInAppointment, 
    confirmAppointment, 
    cancelAppointment, 
    registerWalkIn, 
    callNextPatient, 
    togglePatientAbsent,
    currentWorkspaceNav 
  } = useClinicStore();

  const [dateFilter, setDateFilter] = useState(new Date().toISOString().substring(0, 10));
  const [docFilter, setDocFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Walk-in form state
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInSpecialty, setWalkInSpecialty] = useState(SPECIALTIES_DATA[1].id);
  const [walkInDoctor, setWalkInDoctor] = useState(DOCTORS_DATA[0].id);
  const [walkInSymptoms, setWalkInSymptoms] = useState('');
  const [walkInFeedback, setWalkInFeedback] = useState<string | null>(null);

  const filteredAppts = appointments.filter((a) => {
    const matchesDoc = docFilter === 'all' || a.doctorId === docFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesSearch = a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.patientPhone.includes(searchQuery) || 
                          a.appointmentCode.includes(searchQuery);
    return matchesDoc && matchesStatus && matchesSearch;
  });

  const handleCheckIn = (apptId: string) => {
    const v = checkInAppointment(apptId);
    alert(`Tiếp đón thành công!\nBệnh nhân: ${v.patientName}\nCấp STT: ${v.visitCode}\nPhòng khám: ${v.roomNumber}`);
  };

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim() || !walkInPhone.trim()) {
      alert('Vui lòng nhập tên và số điện thoại');
      return;
    }
    const v = registerWalkIn(walkInName, walkInPhone, walkInSpecialty, walkInDoctor, walkInSymptoms || 'Đến khám trực tiếp tại quầy');
    setWalkInFeedback(`Đã đón tiếp khách vãng lai! Cấp số thứ tự: ${v.visitCode} -> ${v.roomNumber}`);
    setWalkInName('');
    setWalkInPhone('');
    setWalkInSymptoms('');
  };

  return (
    <div className="space-y-6 text-xs animate-in fade-in">
      
      {/* Privacy & Data Masking Badge Bar */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-[#005a8b] font-medium">
        <div className="flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-[#0084c7] flex-shrink-0" />
          <span>
            <strong>Chế độ Bảo vệ Dữ liệu Bệnh án (Data Masking):</strong> Giao diện Lễ tân chỉ hiển thị thông tin tiếp đón hành chính, thời gian và số thứ tự phòng khám. Toàn bộ chẩn đoán chi tiết và đơn thuốc được bảo mật theo quy định HIS.
          </span>
        </div>
        <span className="hidden md:inline-block px-2.5 py-1 bg-white border border-blue-300 rounded-lg text-[10px] font-bold text-[#005a8b]">
          HIS Role: Receptionist
        </span>
      </div>

      {/* =========================================================================
          MÀN HÌNH 4.1: QUẢN LÝ & DUYỆT LỊCH HẸN (Appointments Desk)
         ========================================================================= */}
      {currentWorkspaceNav === 'appointments' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Bảng Quản Lý & Duyệt Lịch Hẹn Đặt Trước</h3>
              <p className="text-[11px] text-slate-500">Xác nhận lịch đặt từ xa hoặc bấm Check-in tiếp đón để chuyển thành lượt khám phòng</p>
            </div>
            
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã APT, tên, SĐT..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Lọc theo Bác sĩ:</label>
              <select
                value={docFilter}
                onChange={(e) => setDocFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="all">Tất cả Bác sĩ</option>
                {DOCTORS_DATA.map((d) => (
                  <option key={d.id} value={d.id}>{d.title} {d.fullName} ({d.roomNumber})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Lọc theo Trạng thái:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="PENDING_CONFIRMATION">Chờ xác nhận</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="ARRIVED">Đã đến (Check-in)</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block font-bold text-slate-600 mb-1">Ngày hẹn:</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">Mã hẹn</th>
                  <th className="p-3">Họ tên Bệnh nhân</th>
                  <th className="p-3">Số điện thoại</th>
                  <th className="p-3">Bác sĩ & Khoa</th>
                  <th className="p-3">Giờ khám</th>
                  <th className="p-3">Kênh đặt</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác Tiếp đón</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppts.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-[#005a8b]">{appt.appointmentCode}</td>
                    <td className="p-3 font-semibold text-slate-900">{appt.patientName}</td>
                    <td className="p-3 font-mono text-slate-600">{appt.patientPhone}</td>
                    <td className="p-3 text-slate-700">
                      <div className="font-semibold">{appt.doctorTitle} {appt.doctorName}</div>
                      <span className="text-[10px] text-slate-400">{appt.specialtyName}</span>
                    </td>
                    <td className="p-3">
                      <strong className="text-[#0072bc]">{appt.timeSlot}</strong>
                      <span className="text-[10px] text-slate-400 block">{appt.date}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {appt.source}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        appt.status === 'ARRIVED'
                          ? 'bg-blue-100 text-[#005a8b]'
                          : appt.status === 'CONFIRMED'
                          ? 'bg-sky-100 text-[#0072bc]'
                          : appt.status === 'CANCELLED'
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {appt.status === 'ARRIVED' ? 'Đã đến' : appt.status === 'CONFIRMED' ? 'Đã xác nhận' : appt.status === 'CANCELLED' ? 'Đã hủy' : 'Chờ xác nhận'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      {appt.status === 'PENDING_CONFIRMATION' && (
                        <button
                          onClick={() => confirmAppointment(appt.id)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold"
                        >
                          Xác nhận
                        </button>
                      )}

                      {appt.status !== 'ARRIVED' && appt.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCheckIn(appt.id)}
                          className="px-3 py-1 bg-[#0084c7] hover:bg-[#0072bc] text-white font-bold rounded-lg shadow-2xs active:scale-95"
                        >
                          Check-in Tiếp đón
                        </button>
                      )}

                      {appt.status !== 'ARRIVED' && appt.status !== 'CANCELLED' && (
                        <button
                          onClick={() => cancelAppointment(appt.id)}
                          className="px-2 py-1 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          Hủy
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MÀN HÌNH 4.2: TIẾP ĐÓN KHÁCH VÃNG LAI (Walk-in Registration)
         ========================================================================= */}
      {currentWorkspaceNav === 'walkin' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Tiếp Đón Khách Vãng Lai & Đăng Ký Khám Hộ (Walk-in Form)
            </h3>
            <p className="text-xs text-slate-500">
              Form 2 cột tiếp nhận bệnh nhân đến trực tiếp tại quầy hoặc gọi điện thoại đến phòng khám
            </p>
          </div>

          {walkInFeedback && (
            <div className="p-4 bg-blue-50 border border-blue-300 rounded-2xl flex items-center gap-3 text-[#005a8b] font-bold text-xs">
              <CheckCircle2 className="w-5 h-5 text-[#0084c7] flex-shrink-0" />
              <span>{walkInFeedback}</span>
            </div>
          )}

          <form onSubmit={handleWalkInSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Cột Trái: Thông tin hành chính */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-[#005a8b]">
                1. Thông tin Hành chính Bệnh nhân
              </h4>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên bệnh nhân *</label>
                <input
                  type="text"
                  required
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="VD: Lê Thị Lan"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
                <input
                  type="tel"
                  required
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  placeholder="VD: 0988112233"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả triệu chứng / Lý do đến khám</label>
                <textarea
                  rows={3}
                  value={walkInSymptoms}
                  onChange={(e) => setWalkInSymptoms(e.target.value)}
                  placeholder="Khai đau tức bụng, ợ chua, yêu cầu kiểm tra nội soi..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Cột Phải: Phân bổ Chuyên khoa & Cấp STT */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-[#005a8b]">
                  2. Điều Phối Chuyên Khoa & Phòng Khám
                </h4>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chuyên khoa khám:</label>
                  <select
                    value={walkInSpecialty}
                    onChange={(e) => {
                      setWalkInSpecialty(e.target.value);
                      const docs = DOCTORS_DATA.filter(d => d.specialtyId === e.target.value);
                      if (docs.length > 0) setWalkInDoctor(docs[0].id);
                    }}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                  >
                    {SPECIALTIES_DATA.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phòng khám & Bác sĩ trực:</label>
                  <select
                    value={walkInDoctor}
                    onChange={(e) => setWalkInDoctor(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                  >
                    {DOCTORS_DATA.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} {d.fullName} • {d.roomNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-[#005a8b]">
                  Số thứ tự sẽ được hệ thống sinh tự động theo định dạng <strong>W-XXX</strong> và gán thẳng vào Hàng chờ Bác sĩ.
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0084c7] hover:bg-[#0072bc] text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Cấp Số Thứ Tự & Đẩy Vào Hàng Chờ Khám</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* =========================================================================
          MÀN HÌNH 4.3: BẢNG ĐIỀU PHỐI HÀNG CHỜ (Live Queue Board)
         ========================================================================= */}
      {currentWorkspaceNav === 'queue' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Bảng Điều Phối Hàng Chờ Phòng Khám (Live Queue Board)
              </h3>
              <p className="text-xs text-slate-500">Giám sát số lượng bệnh nhân đang chờ theo từng phòng khám chuyên khoa</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Phòng 102 - Khoa Tiêu hóa (BS. Tuấn DOC-01) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Phòng 102: Tiêu hóa</h4>
                  <p className="text-[11px] text-slate-500">BS.CKII Nguyễn Minh Tuấn (DOC-01)</p>
                </div>
                <span className="font-mono font-bold text-[#005a8b] bg-blue-100 px-2 py-0.5 rounded text-xs">
                  {visits.filter(v => v.doctorId === 'DOC-01').length} bệnh nhân
                </span>
              </div>

              <div className="space-y-2">
                {visits.filter(v => v.doctorId === 'DOC-01').map((v) => (
                  <div
                    key={v.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between ${
                      v.isAbsent
                        ? 'bg-slate-100 border-slate-300 opacity-60'
                        : v.status === 'IN_EXAM_PRIMARY'
                        ? 'bg-blue-50 border-[#0084c7] ring-1 ring-blue-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black font-mono text-[#005a8b] text-sm">{v.visitCode}</span>
                        <span className="font-bold text-slate-900">{v.patientName}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{v.checkInTime} • {v.currentStepMessage}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => callNextPatient(v.id)}
                        title="Gọi vào phòng"
                        className="p-1.5 bg-[#0084c7] hover:bg-[#0072bc] text-white rounded-lg"
                      >
                        <Bell className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => togglePatientAbsent(v.id)}
                        title={v.isAbsent ? 'Bỏ vắng mặt' : 'Đánh dấu vắng mặt'}
                        className={`p-1.5 rounded-lg ${v.isAbsent ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phòng 204 - Khoa CĐHA (BS. Hoàng DOC-02) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Phòng 204: CĐHA (X-Quang)</h4>
                  <p className="text-[11px] text-slate-500">TS.BS Lê Hoàng (DOC-02)</p>
                </div>
                <span className="font-mono font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded text-xs">
                  {visits.flatMap(v => v.emr?.clinicalOrders || []).length} phiếu
                </span>
              </div>

              <div className="space-y-2">
                {visits.flatMap(v => v.emr?.clinicalOrders || []).map((ord) => (
                  <div key={ord.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-purple-800">{ord.orderCode}</span>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                        ord.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.status === 'COMPLETED' ? 'Đã trả KQ' : 'Chờ chụp'}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900">{ord.serviceName}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">BN: {ord.patientName}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phòng 101 - Khoa Nội tổng quát (BS. Bảo DOC-04) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Phòng 101: Nội Tổng Quát</h4>
                  <p className="text-[11px] text-slate-500">BS.CKI Hoàng Quốc Bảo (DOC-04)</p>
                </div>
                <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">
                  Hàng chờ mở
                </span>
              </div>

              <div className="p-6 text-center text-slate-400 text-xs">
                Chưa có ca khám nào đang chờ tại phòng 101.
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
