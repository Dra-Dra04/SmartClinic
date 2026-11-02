import React, { useState } from 'react';
import { Doctor, Specialty, TimeSlot } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { useClinicStore } from '../../store/useClinicStore';
import { Calendar, Clock, Star, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

interface DoctorSlotChatCardProps {
  doctor: Doctor;
  specialty?: Specialty;
  date?: string;
  slots: TimeSlot[];
  onBookSuccess?: () => void;
}

export const DoctorSlotChatCard: React.FC<DoctorSlotChatCardProps> = ({
  doctor,
  specialty,
  date = '2026-11-01',
  slots,
  onBookSuccess,
}) => {
  const { currentUser, setDemoState, openOnboardingGuard } = useAuthStore();
  const { createAppointment, setPortalNav } = useClinicStore();

  const [selectedChatSlot, setSelectedChatSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedAppt, setConfirmedAppt] = useState<any>(null);

  const morningSlots = slots.filter((s) => s.period === 'morning');
  const afternoonSlots = slots.filter((s) => s.period === 'afternoon');

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedChatSlot(slot.time);
  };

  const handleConfirmBooking = () => {
    if (currentUser.role === 'guest') {
      setDemoState(2);
      return;
    }

    if (!currentUser.isProfileCompleted) {
      openOnboardingGuard('Đặt lịch qua Trợ lý AI');
      setPortalNav('profile');
      return;
    }

    if (!selectedChatSlot) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const appt = createAppointment({
        patientId: currentUser.id,
        patientName: currentUser.fullName,
        patientPhone: currentUser.phone,
        patientDob: currentUser.dateOfBirth,
        patientGender: currentUser.gender,
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        doctorTitle: doctor.title,
        specialtyId: specialty?.id || doctor.specialtyId,
        specialtyName: specialty?.name || doctor.specialtyName,
        date: date || new Date().toISOString().substring(0, 10),
        timeSlot: selectedChatSlot,
        symptoms: 'Đặt qua Trợ lý AI Y tế RAG (triệu chứng tiêu hóa/thượng vị)',
        source: 'AI_CHAT_RAG',
      });

      setConfirmedAppt(appt);
      setIsSubmitting(false);

      if (onBookSuccess) {
        onBookSuccess();
      }
    }, 500);
  };

  if (confirmedAppt) {
    return (
      <div className="mt-3 p-3.5 bg-blue-50 border-2 border-[#0084c7] rounded-2xl shadow-sm text-left animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-2 text-[#005a8b] font-bold text-sm mb-1.5">
          <CheckCircle2 className="w-5 h-5 text-[#0084c7] flex-shrink-0" />
          <span>Đặt lịch thành công qua AI!</span>
        </div>
        <p className="text-xs text-[#005a8b] leading-relaxed">
          Mã cuộc hẹn: <strong className="font-mono bg-blue-200/80 px-1.5 py-0.5 rounded text-[#005a8b]">{confirmedAppt.appointmentCode}</strong>
        </p>
        <div className="mt-2 text-xs text-slate-700 bg-white/90 p-2.5 rounded-xl border border-blue-200 space-y-1">
          <div>👨‍⚕️ <strong>Bác sĩ:</strong> {confirmedAppt.doctorTitle} {confirmedAppt.doctorName}</div>
          <div>📍 <strong>Phòng khám:</strong> {doctor.roomNumber}</div>
          <div>⏰ <strong>Thời gian:</strong> {confirmedAppt.timeSlot} - Ngày {confirmedAppt.date}</div>
          <div>👤 <strong>Bệnh nhân:</strong> {confirmedAppt.patientName} ({confirmedAppt.patientPhone})</div>
        </div>
        <p className="mt-2 text-[11px] text-[#0072bc] font-medium">
          ✓ Thông tin đã được gửi vào Hệ thống điều phối phòng khám (HIS Queue). Bạn chỉ cần đến trước 10 phút để check-in tại quầy lễ tân.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-md text-left">
      {/* Doctor Card Top */}
      <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
        <img
          src={doctor.avatarUrl}
          alt={doctor.fullName}
          className="w-13 h-13 rounded-xl object-cover border-2 border-blue-200 shadow-xs"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#0072bc] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {doctor.title}
            </span>
            <div className="flex items-center text-[11px] text-amber-500 font-bold ml-auto">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
              <span>{doctor.rating}</span>
              <span className="text-slate-400 font-normal">({doctor.reviewCount})</span>
            </div>
          </div>
          <h4 className="text-sm font-bold text-slate-900 truncate mt-0.5">
            {doctor.fullName}
          </h4>
          <p className="text-xs text-slate-600 truncate">{doctor.specialtyName}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
            <MapPin className="w-3 h-3 text-[#0084c7] flex-shrink-0" />
            <span className="truncate">{doctor.roomNumber}</span>
          </div>
        </div>
      </div>

      {/* Date Header */}
      <div className="flex items-center justify-between text-xs text-slate-600 my-2 px-1">
        <span className="flex items-center gap-1 font-semibold text-[#005a8b]">
          <Calendar className="w-3.5 h-3.5 text-[#0084c7]" />
          Hôm nay ({date})
        </span>
        <span className="flex items-center gap-1 text-[11px] text-slate-500">
          <Clock className="w-3 h-3" />
          Chọn khung giờ khám
        </span>
      </div>

      {/* Morning Slots */}
      <div className="mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Buổi Sáng
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {morningSlots.map((slot) => {
            const isSelected = selectedChatSlot === slot.time;
            const remaining = slot.maxCapacity - slot.bookedCount;
            const isFull = !slot.isAvailable || remaining <= 0;

            return (
              <button
                key={slot.id}
                type="button"
                disabled={isFull}
                onClick={() => handleSelectSlot(slot)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-[#0084c7] text-white shadow-sm ring-2 ring-blue-300'
                    : isFull
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through'
                    : 'bg-blue-50/70 hover:bg-blue-100/90 text-[#005a8b] border border-blue-200/80 active:scale-95'
                }`}
              >
                <span>{slot.time}</span>
                {!isFull && remaining === 1 && !isSelected && (
                  <span className="text-[9px] text-amber-600 font-medium">Còn 1 chỗ</span>
                )}
                {isFull && <span className="text-[9px] text-slate-400">Hết chỗ</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Afternoon Slots */}
      <div className="mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Buổi Chiều
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {afternoonSlots.map((slot) => {
            const isSelected = selectedChatSlot === slot.time;
            const remaining = slot.maxCapacity - slot.bookedCount;
            const isFull = !slot.isAvailable || remaining <= 0;

            return (
              <button
                key={slot.id}
                type="button"
                disabled={isFull}
                onClick={() => handleSelectSlot(slot)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-[#0084c7] text-white shadow-sm ring-2 ring-blue-300'
                    : isFull
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through'
                    : 'bg-blue-50/70 hover:bg-blue-100/90 text-[#005a8b] border border-blue-200/80 active:scale-95'
                }`}
              >
                <span>{slot.time}</span>
                {!isFull && remaining === 1 && !isSelected && (
                  <span className="text-[9px] text-amber-600 font-medium">Còn 1 chỗ</span>
                )}
                {isFull && <span className="text-[9px] text-slate-400">Hết chỗ</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Slot Confirmation Bar */}
      {selectedChatSlot && (
        <div className="pt-2 border-t border-slate-100 animate-in fade-in">
          <div className="flex items-center justify-between text-xs mb-2 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 text-[#005a8b]">
            <span className="font-medium">Giờ đã chọn:</span>
            <strong className="font-bold text-[#0072bc] text-sm">{selectedChatSlot}</strong>
          </div>

          {!currentUser.isProfileCompleted && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200 mb-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Hồ sơ chưa có CCCD/BHYT, hệ thống sẽ yêu cầu hoàn tất khi nhấn đặt.</span>
            </div>
          )}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmBooking}
            className="w-full py-2 px-3 bg-[#0084c7] hover:bg-[#0072bc] text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-98 flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Đang đồng bộ HIS...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận đặt lịch ngay</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
