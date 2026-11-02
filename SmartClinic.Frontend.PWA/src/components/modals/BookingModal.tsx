import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useClinicStore } from '../../store/useClinicStore';
import { SPECIALTIES_DATA, DOCTORS_DATA } from '../../services/mockData';
import { Specialty, Doctor, TimeSlot } from '../../types';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  Star,
  Activity
} from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, openOnboardingGuard } = useAuthStore();
  const { timeSlots, createAppointment } = useClinicStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty>(SPECIALTIES_DATA[0]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor>(DOCTORS_DATA[0]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('08:30');
  const [symptoms, setSymptoms] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [createdApptCode, setCreatedApptCode] = useState('');

  if (!isOpen) return null;

  const filteredDoctors = DOCTORS_DATA.filter((d) => d.specialtyId === selectedSpecialty.id);
  const activeDocList = filteredDoctors.length > 0 ? filteredDoctors : DOCTORS_DATA;

  const handleFinishBooking = () => {
    // Check onboarding profile
    if (!currentUser.isProfileCompleted) {
      onClose();
      openOnboardingGuard(`Đặt lịch khám tại ${selectedSpecialty.name}`);
      return;
    }

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
      symptoms: symptoms.trim() || 'Khám tổng quát theo triệu chứng',
      source: 'ONLINE_PORTAL',
    });

    setCreatedApptCode(appt.appointmentCode);
    setIsDone(true);
    // Appointment recorded in HIS
  };

  const handleResetAndClose = () => {
    setStep(1);
    setIsDone(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-emerald-100 overflow-hidden text-xs">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-green-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Đặt lịch Khám bệnh Trực tuyến</h3>
              <p className="text-[11px] text-emerald-100">Hệ thống phân bổ lịch tự động, chống trùng lặp giờ</p>
            </div>
          </div>
          <button onClick={handleResetAndClose} className="p-1 rounded-lg text-emerald-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Header (If not finished) */}
        {!isDone && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span className={step >= 1 ? 'text-emerald-700 font-extrabold' : ''}>1. Chọn Chuyên khoa</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className={step >= 2 ? 'text-emerald-700 font-extrabold' : ''}>2. Chọn Bác sĩ</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className={step >= 3 ? 'text-emerald-700 font-extrabold' : ''}>3. Chọn Giờ khám</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className={step >= 4 ? 'text-emerald-700 font-extrabold' : ''}>4. Xác nhận</span>
          </div>
        )}

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* STEP 1: CHỌN CHUYÊN KHOA */}
          {!isDone && step === 1 && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">Bước 1: Chọn Chuyên khoa Khám bệnh</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SPECIALTIES_DATA.map((spec) => {
                  const isSelected = selectedSpecialty.id === spec.id;
                  return (
                    <div
                      key={spec.id}
                      onClick={() => setSelectedSpecialty(spec)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-200'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-xs">{spec.name}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                          {spec.consultationFee.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{spec.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: CHỌN BÁC SĨ */}
          {!isDone && step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-sm">Bước 2: Chọn Bác sĩ Chuyên khoa</h4>
                <span className="text-emerald-700 font-semibold">{selectedSpecialty.name}</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {activeDocList.map((doc) => {
                  const isSelected = selectedDoctor.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center gap-4 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-200'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <img
                        src={doc.avatarUrl}
                        alt={doc.fullName}
                        className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">
                            {doc.title} {doc.fullName}
                          </span>
                          <div className="flex items-center text-amber-500 font-bold text-[11px]">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                            <span>{doc.rating}</span>
                          </div>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{doc.roomNumber} • {doc.experienceYears} năm kinh nghiệm</p>
                        <p className="text-slate-500 text-[11px] line-clamp-1 italic mt-0.5">{doc.bio}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: CHỌN NGÀY VÀ KHUNG GIỜ TRỐNG */}
          {!isDone && step === 3 && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">Bước 3: Chọn Ngày & Khung giờ Khám còn trống</h4>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ngày đến khám *</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().substring(0, 10)}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Khung giờ khám tại {selectedDoctor.roomNumber} (Chống trùng lặp ca)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => {
                    const isSelected = selectedSlotTime === slot.time;
                    const remaining = slot.maxCapacity - slot.bookedCount;
                    const isFull = !slot.isAvailable || remaining <= 0;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isFull}
                        onClick={() => setSelectedSlotTime(slot.time)}
                        className={`p-2.5 rounded-xl text-center transition flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300 font-bold'
                            : isFull
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                            : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 font-semibold'
                        }`}
                      >
                        <span className="text-sm">{slot.time}</span>
                        {!isFull ? (
                          <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-emerald-700'}`}>
                            {remaining === 1 ? 'Còn 1 chỗ' : `Còn ${remaining} chỗ`}
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
          )}

          {/* STEP 4: XÁC NHẬN & GHI CHÚ TRIỆU CHỨNG */}
          {!isDone && step === 4 && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">Bước 4: Kiểm tra Thông tin & Xác nhận Đặt lịch</h4>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 text-slate-800">
                <div className="flex justify-between border-b border-emerald-200 pb-1.5">
                  <span className="text-slate-600">Bệnh nhân:</span>
                  <strong className="text-slate-900">{currentUser.fullName} ({currentUser.phone})</strong>
                </div>
                <div className="flex justify-between border-b border-emerald-200 pb-1.5">
                  <span className="text-slate-600">Chuyên khoa:</span>
                  <strong>{selectedSpecialty.name}</strong>
                </div>
                <div className="flex justify-between border-b border-emerald-200 pb-1.5">
                  <span className="text-slate-600">Bác sĩ khám:</span>
                  <strong>{selectedDoctor.title} {selectedDoctor.fullName} ({selectedDoctor.roomNumber})</strong>
                </div>
                <div className="flex justify-between border-b border-emerald-200 pb-1.5">
                  <span className="text-slate-600">Thời gian hẹn:</span>
                  <strong className="text-emerald-800">{selectedSlotTime} • Ngày {selectedDate}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Phí khám ban đầu:</span>
                  <strong className="text-emerald-800 font-mono">{selectedSpecialty.consultationFee.toLocaleString('vi-VN')} đ</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả triệu chứng bệnh hoặc yêu cầu khám</label>
                <textarea
                  rows={3}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="VD: Đau tức vùng bụng trên, ợ hơi, khó ngủ..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* SUCCESS SCREEN */}
          {isDone && (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Đặt lịch khám thành công!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Mã cuộc hẹn của bạn là: <strong className="font-mono text-emerald-800 text-sm bg-emerald-100 px-2 py-0.5 rounded">{createdApptCode}</strong>
              </p>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto text-left text-xs space-y-1">
                <div>👨‍⚕️ <strong>Bác sĩ:</strong> {selectedDoctor.title} {selectedDoctor.fullName}</div>
                <div>📍 <strong>Phòng:</strong> {selectedDoctor.roomNumber}</div>
                <div>⏰ <strong>Giờ hẹn:</strong> {selectedSlotTime} ngày {selectedDate}</div>
              </div>
              <p className="text-[11px] text-slate-500">
                Vui lòng đến trước 10 phút để quầy lễ tân xác thực CCCD và cấp số thứ tự vào phòng khám.
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {!isDone ? (
            <>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as any)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-bold flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Quay lại</span>
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s + 1) as any)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-sm active:scale-95"
                >
                  <span>Tiếp tục</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishBooking}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-bold shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn tất Đăng ký Lịch</span>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={handleResetAndClose}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
            >
              Đóng và xem trong Hồ sơ Bệnh nhân
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
