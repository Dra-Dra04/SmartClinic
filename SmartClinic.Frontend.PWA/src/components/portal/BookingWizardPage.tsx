import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useClinicStore } from '../../store/useClinicStore';
import { SPECIALTIES_DATA, DOCTORS_DATA } from '../../services/mockData';
import { Specialty, Doctor } from '../../types';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft,
  Star,
  MapPin
} from 'lucide-react';
interface BookingWizardPageProps {
  initialDoctor?: Doctor;
  onOpenAuthModal?: () => void;
}

export const BookingWizardPage: React.FC<BookingWizardPageProps> = ({ initialDoctor, onOpenAuthModal }) => {
  const { currentUser, setDemoState } = useAuthStore();
  const { timeSlots, createAppointment, setPortalNav } = useClinicStore();

  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty>(
    SPECIALTIES_DATA.find((s) => s.id === initialDoctor?.specialtyId) || SPECIALTIES_DATA[1]
  );
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor>(initialDoctor || DOCTORS_DATA[0]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('08:30 - 09:00');
  const [symptoms, setSymptoms] = useState('');
  const [confirmedApptCode, setConfirmedApptCode] = useState<string | null>(null);

  // GUEST LOGIN PROMPT LOCK
  if (currentUser.role === 'guest') {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border-2 border-[#0084c7] shadow-xl text-center space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#0084c7] mx-auto flex items-center justify-center">
          <User className="w-8 h-8" />
        </div>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#005a8b]">
          Yêu cầu Đăng nhập Tài khoản
        </span>
        <h2 className="text-xl font-black text-slate-900">
          Vui lòng Đăng nhập hoặc Đăng ký Tài khoản
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          Để tiến hành đặt lịch hẹn trực tuyến và đồng bộ hồ sơ bệnh án điện tử tại SmartClinic Phúc An, quý khách vui lòng đăng nhập tài khoản bệnh nhân hoặc đăng ký tài khoản mới.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onOpenAuthModal ? onOpenAuthModal() : setDemoState(2)}
            className="w-full sm:w-auto px-6 py-3 bg-[#0084c7] hover:bg-[#0072bc] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <span>Đăng nhập / Đăng ký ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setDemoState(3)}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          >
            Demo: Đăng nhập mẫu (Trần Văn An)
          </button>
        </div>
      </div>
    );
  }

  // ONBOARDING GUARD LOCK (For registered patients with incomplete CCCD profile)
  if (!currentUser.isProfileCompleted) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border-2 border-amber-300 shadow-xl text-center space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
          Chốt chặn Định danh Hồ sơ Y tế (HIS Onboarding Gate)
        </span>
        <h2 className="text-xl font-black text-slate-900">
          Cần hoàn tất Hồ sơ Cá nhân trước khi Đặt lịch
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          Theo quy định tiếp nhận bệnh nhân điện tử, bạn cần cập nhật <strong>Số Căn cước công dân (CCCD) hoặc Thẻ BHYT</strong> để đồng bộ hồ sơ bệnh án EMR và tránh trùng lặp dữ liệu trước khi chọn giờ khám.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setPortalNav('profile')}
            className="w-full sm:w-auto px-6 py-3 bg-[#0084c7] hover:bg-[#0072bc] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <span>Đi tới cập nhật hồ sơ ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setDemoState(3)}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          >
            Demo: Chuyển sang TK Đủ hồ sơ (Trần Văn An)
          </button>
        </div>
      </div>
    );
  }

  const activeDocList = DOCTORS_DATA.filter((d) => d.specialtyId === selectedSpecialty.id);
  const currentDocs = activeDocList.length > 0 ? activeDocList : DOCTORS_DATA;

  const morningSlots = timeSlots.filter((s) => s.period === 'morning');
  const afternoonSlots = timeSlots.filter((s) => s.period === 'afternoon');

  const handleConfirmBooking = () => {
    const appt = createAppointment({
      patientId: currentUser.id,
      patientName: currentUser.fullName,
      patientPhone: currentUser.phone,
      patientDob: currentUser.dateOfBirth,
      patientGender: currentUser.gender,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.fullName,
      doctorTitle: selectedDoctor.title,
      specialtyId: selectedSpecialty.id,
      specialtyName: selectedSpecialty.name,
      date: selectedDate,
      timeSlot: selectedSlotTime,
      symptoms: symptoms.trim() || 'Khám theo triệu chứng ban đầu',
      source: 'ONLINE_PORTAL',
    });

    setConfirmedApptCode(appt.appointmentCode);
  };

  if (confirmedApptCode) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-[#0084c7] shadow-xl text-center space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-blue-100 text-[#0084c7] mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#005a8b]">
          Đặt lịch thành công • Trạng thái: Chờ xác nhận
        </span>
        <h2 className="text-xl font-black text-slate-900">
          Mã Lịch Hẹn: <span className="font-mono text-[#005a8b] bg-blue-50 px-2 py-0.5 rounded">{confirmedApptCode}</span>
        </h2>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 text-slate-700">
          <div>👤 <strong>Bệnh nhân:</strong> {currentUser.fullName} ({currentUser.phone})</div>
          <div>👨‍⚕️ <strong>Bác sĩ:</strong> {selectedDoctor.title} {selectedDoctor.fullName}</div>
          <div>📍 <strong>Phòng khám:</strong> {selectedDoctor.roomNumber} ({selectedSpecialty.name})</div>
          <div>⏰ <strong>Thời gian:</strong> {selectedSlotTime} • Ngày {selectedDate}</div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setPortalNav('my-visits')}
            className="w-full sm:w-auto px-6 py-3 bg-[#0084c7] hover:bg-[#0072bc] text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Xem trong Tiến trình ca khám của tôi
          </button>
          <button
            onClick={() => {
              setConfirmedApptCode(null);
              setSymptoms('');
            }}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Đặt thêm lịch khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in">
      
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Đặt Lịch Khám Trực Tuyến</h1>
          <p className="text-xs text-slate-500">Quy trình 3 bước gọn gàng trên 1 trang • Chống trùng lặp giờ</p>
        </div>
        <button
          onClick={() => setPortalNav('home')}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về trang chủ</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main 3 Steps (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* BƯỚC 1: CHỌN CHUYÊN KHOA & BÁC SĨ */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#0084c7] text-white font-bold flex items-center justify-center text-xs">1</span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Chọn Chuyên khoa & Bác sĩ Phụ trách
              </h3>
            </div>

            {/* Specialty Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SPECIALTIES_DATA.slice(0, 6).map((spec) => {
                const isSelected = selectedSpecialty.id === spec.id;
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => {
                      setSelectedSpecialty(spec);
                      const docs = DOCTORS_DATA.filter((d) => d.specialtyId === spec.id);
                      if (docs.length > 0) setSelectedDoctor(docs[0]);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition ${
                      isSelected
                        ? 'border-[#0084c7] bg-blue-50/80 font-bold text-[#005a8b] ring-1 ring-blue-300'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate font-semibold">{spec.name}</div>
                    <span className="text-[10px] text-slate-500 font-mono">{spec.consultationFee.toLocaleString('vi-VN')} đ</span>
                  </button>
                );
              })}
            </div>

            {/* Doctor Card Selector */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-700 block mb-2">Bác sĩ thuộc khoa:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentDocs.map((doc) => {
                  const isSelected = selectedDoctor.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                        isSelected
                          ? 'border-[#0084c7] bg-blue-50/80 ring-1 ring-blue-300'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <img
                        src={doc.avatarUrl}
                        alt={doc.fullName}
                        className="w-12 h-12 rounded-xl object-cover border border-blue-300"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <span className="text-[10px] font-bold text-[#005a8b] bg-blue-100/70 px-1.5 py-0.2 rounded">
                          {doc.title}
                        </span>
                        <h4 className="font-bold text-slate-900 truncate mt-0.5">{doc.fullName}</h4>
                        <p className="text-[11px] text-slate-500 truncate">{doc.roomNumber}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BƯỚC 2: CHỌN NGÀY & KHUNG GIỜ TRỐNG (Chống trùng lịch) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#0084c7] text-white font-bold flex items-center justify-center text-xs">2</span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Chọn Ngày Khám & Khung Giờ (Chống trùng lịch)
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
              <label className="font-bold text-slate-700">Ngày khám:</label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().substring(0, 10)}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0084c7]/30"
              />
            </div>

            {/* Morning slots */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Buổi Sáng
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {morningSlots.map((slot) => {
                  const isSelected = selectedSlotTime === slot.time;
                  const remaining = slot.maxCapacity - slot.bookedCount;
                  const isFull = !slot.isAvailable || remaining <= 0;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={isFull}
                      onClick={() => setSelectedSlotTime(slot.time)}
                      className={`p-2.5 rounded-xl text-center text-xs transition flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-[#0084c7] text-white font-bold shadow-xs ring-2 ring-blue-300'
                          : isFull
                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through'
                          : 'bg-blue-50 text-[#005a8b] border border-blue-200 hover:bg-blue-100 font-semibold'
                      }`}
                    >
                      <span>{slot.time}</span>
                      {!isFull ? (
                        <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-[#0072bc]'}`}>
                          {remaining === 1 ? 'Còn 1 chỗ' : `Còn ${remaining}/${slot.maxCapacity} chỗ`}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 mt-0.5">Hết chỗ</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Afternoon slots */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Buổi Chiều
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {afternoonSlots.map((slot) => {
                  const isSelected = selectedSlotTime === slot.time;
                  const remaining = slot.maxCapacity - slot.bookedCount;
                  const isFull = !slot.isAvailable || remaining <= 0;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={isFull}
                      onClick={() => setSelectedSlotTime(slot.time)}
                      className={`p-2.5 rounded-xl text-center text-xs transition flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-[#0084c7] text-white font-bold shadow-xs ring-2 ring-blue-300'
                          : isFull
                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through'
                          : 'bg-blue-50 text-[#005a8b] border border-blue-200 hover:bg-blue-100 font-semibold'
                      }`}
                    >
                      <span>{slot.time}</span>
                      {!isFull ? (
                        <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-[#0072bc]'}`}>
                          {remaining === 1 ? 'Còn 1 chỗ' : `Còn ${remaining}/${slot.maxCapacity} chỗ`}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 mt-0.5">Hết chỗ</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BƯỚC 3: MÔ TẢ TRIỆU CHỨNG */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#0084c7] text-white font-bold flex items-center justify-center text-xs">3</span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Lý do Khám & Triệu chứng Tóm tắt
              </h3>
            </div>

            <textarea
              rows={3}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="VD: Đau rát tức thượng vị sau khi ăn, ợ hơi nhiều, khó tiêu hóa 2 tuần nay..."
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-[#0084c7]/30 text-slate-800"
            />
          </div>

        </div>

        {/* Right Summary Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 sticky top-20">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Tóm Tắt Lịch Hẹn Khám
            </h3>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Bệnh nhân:</span>
                <strong className="text-slate-900">{currentUser.fullName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SĐT:</span>
                <span className="font-mono">{currentUser.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Định danh:</span>
                <span className="text-[#0084c7] font-bold">CCCD/BHYT Đã xác thực</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-500">Chuyên khoa:</span>
                <strong className="text-slate-900">{selectedSpecialty.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bác sĩ:</span>
                <strong className="text-[#005a8b]">{selectedDoctor.title} {selectedDoctor.fullName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phòng khám:</span>
                <span>{selectedDoctor.roomNumber}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-500">Ngày khám:</span>
                <strong>{selectedDate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khung giờ:</span>
                <strong className="text-[#005a8b] font-bold">{selectedSlotTime}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-500">Phí khám ban đầu:</span>
                <strong className="text-[#0072bc] font-mono text-sm">{selectedSpecialty.consultationFee.toLocaleString('vi-VN')} đ</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmBooking}
              className="w-full py-3 bg-gradient-to-r from-[#005a8b] to-[#0084c7] hover:from-[#004a73] hover:to-[#0072bc] text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận Đặt lịch ngay</span>
            </button>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Lịch khám sẽ được ghi nhận vào hàng chờ phòng khám HIS. Vui lòng đến trước 10 phút để nhận STT.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
