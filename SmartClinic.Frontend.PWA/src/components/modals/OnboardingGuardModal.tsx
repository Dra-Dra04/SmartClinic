import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useClinicStore } from '../../store/useClinicStore';
import { ShieldAlert, ArrowRight, UserCheck, X } from 'lucide-react';

export const OnboardingGuardModal: React.FC = () => {
  const { showOnboardingGuardModal, closeOnboardingGuard, onboardingActionPrompt } = useAuthStore();
  const { setPortalNav } = useClinicStore();

  if (!showOnboardingGuardModal) return null;

  const handleGoToProfile = () => {
    closeOnboardingGuard();
    setPortalNav('profile');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-emerald-100 text-center">
        <button
          onClick={closeOnboardingGuard}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-sm">
          <ShieldAlert className="h-9 w-9 text-amber-500 animate-pulse" />
        </div>

        <span className="inline-block px-3 py-1 text-xs font-bold text-amber-800 bg-amber-100 rounded-full mb-2">
          Chốt chặn Nghiệp vụ Y tế HIS
        </span>

        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Cần hoàn tất Hồ sơ Bệnh nhân
        </h3>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Để thực hiện thao tác <strong className="text-emerald-700 font-semibold">"{onboardingActionPrompt || 'Đặt lịch khám'}"</strong>, hệ thống HIS của SmartClinic yêu cầu định danh bệnh nhân bắt buộc với <strong>Số CCCD hoặc Thẻ BHYT</strong> nhằm đồng bộ hồ sơ bệnh án điện tử và đảm bảo an toàn đơn thuốc.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleGoToProfile}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition active:scale-98"
          >
            <UserCheck className="w-5 h-5" />
            <span>Cập nhật Hồ sơ cá nhân ngay</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={closeOnboardingGuard}
            className="w-full py-2.5 px-4 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            Tạm dừng thao tác, quay lại sau
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
          <span>🔒 Bảo mật thông tin chuẩn ISO 27001 & Nghị định 13/2023/NĐ-CP</span>
        </div>
      </div>
    </div>
  );
};
