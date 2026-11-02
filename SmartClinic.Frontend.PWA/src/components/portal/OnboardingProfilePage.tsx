import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useClinicStore } from '../../store/useClinicStore';
import { 
  IdCard, 
  Heart, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft 
} from 'lucide-react';

export const OnboardingProfilePage: React.FC = () => {
  const { currentUser, updateProfile, setProfileCompleted } = useAuthStore();
  const { setPortalNav } = useClinicStore();

  const [formData, setFormData] = useState({
    fullName: currentUser.fullName || '',
    phone: currentUser.phone || '',
    email: currentUser.email || '',
    dateOfBirth: currentUser.dateOfBirth || '',
    gender: currentUser.gender || 'Nam',
    idCardNumber: currentUser.idCardNumber || '',
    healthInsuranceNumber: currentUser.healthInsuranceNumber || '',
    address: currentUser.address || '',
    heightCm: currentUser.heightCm || 170,
    weightKg: currentUser.weightKg || 65,
    bloodType: currentUser.bloodType || 'O+',
    allergies: currentUser.allergies?.join(', ') || '',
    medicalHistory: currentUser.medicalHistory?.join(', ') || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = 'Vui lòng nhập họ và tên';
    if (!formData.phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại';
    if (!formData.dateOfBirth) errs.dateOfBirth = 'Vui lòng chọn ngày sinh';
    if (!formData.idCardNumber.trim() && !formData.healthInsuranceNumber.trim()) {
      errs.idCardNumber = 'Cần nhập ít nhất Số CCCD hoặc Thẻ BHYT để định danh hồ sơ y tế';
    }
    if (!formData.address.trim()) errs.address = 'Vui lòng nhập địa chỉ cư trú';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    updateProfile({
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender as any,
      idCardNumber: formData.idCardNumber,
      healthInsuranceNumber: formData.healthInsuranceNumber,
      address: formData.address,
      heightCm: Number(formData.heightCm),
      weightKg: Number(formData.weightKg),
      bloodType: formData.bloodType as any,
      allergies: formData.allergies ? formData.allergies.split(',').map((s) => s.trim()) : [],
      medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',').map((s) => s.trim()) : [],
      isProfileCompleted: true,
    });

    setProfileCompleted(true);
    setSaveSuccess(true);

    setTimeout(() => {
      setPortalNav('my-visits');
    }, 1200);
  };

  const handleSkip = () => {
    setProfileCompleted(false);
    setPortalNav('home');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in">
      
      {/* Top Banner Alert if Incomplete */}
      {!currentUser.isProfileCompleted ? (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-3xl flex items-start gap-3 text-amber-950 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-900 text-sm">Chốt chặn Định danh Y tế (Onboarding Gate)</h4>
            <p className="mt-0.5 leading-relaxed">
              Vui lòng hoàn thiện thông tin hành chính bắt buộc (Số CCCD hoặc BHYT) để mở khóa tính năng Đặt lịch khám và đồng bộ Bệnh án Điện tử EMR.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-3xl flex items-center gap-3 text-[#005a8b] text-xs shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-[#0084c7] flex-shrink-0" />
          <span>Hồ sơ y tế của bạn đã hoàn tất và được xác thực hợp lệ trên hệ thống Bệnh viện Đa khoa Quốc tế Phúc An.</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-[#0084c7] text-white font-bold rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>Đã lưu hồ sơ thành công! Đang chuyển đến màn hình Ca khám & EMR...</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-8">
        
        {/* Khối 1: Thông tin hành chính (Bắt buộc) */}
        <div>
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
            <IdCard className="w-5 h-5 text-[#0084c7]" />
            <h3 className="text-base font-bold text-slate-900">
              Khối 1: Thông tin Hành chính Định danh <span className="text-red-500">* (Bắt buộc)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Họ và tên bệnh nhân <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="VD: Trần Văn An"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0084c7]/30 ${
                  errors.fullName ? 'border-red-400 bg-red-50' : 'border-slate-200'
                }`}
              />
              {errors.fullName && <p className="text-red-500 text-[11px] mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Số điện thoại liên hệ <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912888999"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0084c7]/30 ${
                  errors.phone ? 'border-red-400 bg-red-50' : 'border-slate-200'
                }`}
              />
              {errors.phone && <p className="text-red-500 text-[11px] mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ngày sinh <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0084c7]/30 ${
                  errors.dateOfBirth ? 'border-red-400 bg-red-50' : 'border-slate-200'
                }`}
              />
              {errors.dateOfBirth && <p className="text-red-500 text-[11px] mt-1">{errors.dateOfBirth}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Giới tính *</label>
              <div className="flex gap-4 pt-1.5">
                {(['Nam', 'Nữ', 'Khác'] as const).map((g) => (
                  <label key={g} className="flex items-center gap-1.5 cursor-pointer text-slate-800 text-xs font-semibold">
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={formData.gender === g}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="accent-[#0084c7]"
                    />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Số Căn cước công dân (CCCD) <span className="text-[#0072bc] font-semibold">(Hoặc Thẻ BHYT)</span>
              </label>
              <input
                type="text"
                value={formData.idCardNumber}
                onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
                placeholder="12 chữ số CCCD gắn chip"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0084c7]/30 ${
                  errors.idCardNumber ? 'border-red-400 bg-red-50' : 'border-slate-200'
                }`}
              />
              {errors.idCardNumber && <p className="text-red-500 text-[11px] mt-1">{errors.idCardNumber}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Số Thẻ Bảo hiểm Y tế (BHYT)</label>
              <input
                type="text"
                value={formData.healthInsuranceNumber}
                onChange={(e) => setFormData({ ...formData, healthInsuranceNumber: e.target.value })}
                placeholder="VD: DN4018899123456"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0084c7]/30"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Địa chỉ cư trú hiện tại <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0084c7]/30 ${
                  errors.address ? 'border-red-400 bg-red-50' : 'border-slate-200'
                }`}
              />
              {errors.address && <p className="text-red-500 text-[11px] mt-1">{errors.address}</p>}
            </div>
          </div>
        </div>

        {/* Khối 2: Hồ sơ sức khỏe nền (Tùy chọn) */}
        <div>
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
            <Heart className="w-5 h-5 text-[#0084c7]" />
            <h3 className="text-base font-bold text-slate-900">
              Khối 2: Hồ sơ Sức khỏe Nền & Tiền sử <span className="text-slate-400 text-xs font-normal">(Tùy chọn)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Chiều cao tham khảo (cm)</label>
              <input
                type="number"
                value={formData.heightCm}
                onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cân nặng tham khảo (kg)</label>
              <input
                type="number"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nhóm máu</label>
              <select
                value={formData.bloodType}
                onChange={(e) => setFormData({ ...formData, bloodType: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
              >
                {['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-', 'Chưa rõ'].map((b) => (
                  <option key={b} value={b}>Nhóm máu {b}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">
                Tiền sử Dị ứng thuốc / Thức ăn (Ngăn cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="VD: Penicillin (nổi mề đay), Aspirin, hải sản..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
              <p className="text-[11px] text-amber-700 font-medium mt-1">
                ⚠️ Bác sĩ sẽ được cảnh báo đỏ trên bàn khám EMR nếu kê đơn thuốc chứa thành phần gây dị ứng này.
              </p>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">
                Bệnh lý nền mãn tính & Phẫu thuật trước đây
              </label>
              <textarea
                rows={2}
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                placeholder="VD: Viêm dạ dày HP(+) năm 2022, Tăng huyết áp 2 năm..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Hai nút dưới cùng */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          >
            Tạm thời bỏ qua
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-[#0084c7] hover:bg-[#0072bc] text-white font-bold text-sm rounded-xl shadow-md transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Lưu & Hoàn tất hồ sơ</span>
          </button>
        </div>

      </form>

    </div>
  );
};
