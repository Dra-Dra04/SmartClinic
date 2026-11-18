import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { ProfileRequest } from '../../services/profileService';
import { DemoOnboardingProfilePage } from './DemoOnboardingProfilePage';

const empty: ProfileRequest = {
  fullName: '', phone: '', dateOfBirth: '', gender: '', idCardNumber: null,
  healthInsuranceNumber: null, address: '', heightCm: null, weightKg: null,
  bloodType: null, allergies: null, medicalHistory: null,
};
export const OnboardingProfilePage: React.FC = () => {
  const { isDemo, activeRole } = useAuthStore();
  if (isDemo) return <DemoOnboardingProfilePage />;
  if (activeRole !== 'patient') return <p>Vui lòng đăng nhập tài khoản bệnh nhân để cập nhật hồ sơ.</p>;
  return <RealProfileForm />;
};
const RealProfileForm: React.FC = () => {
  const { profile, profileLoading, profileError, loadProfile, saveProfile } = useAuthStore();
  const [form, setForm] = useState<ProfileRequest>(empty);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (profile) setForm({ ...profile, gender: profile.gender || empty.gender });
  }, [profile]);
  const change = <K extends keyof ProfileRequest>(key: K, value: ProfileRequest[K]) => {
    setNotice(''); setForm(previous => ({ ...previous, [key]: value }));
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setNotice('');
    if (!form.idCardNumber?.trim() && !form.healthInsuranceNumber?.trim()) {
      setNotice('Cần nhập CCCD hoặc BHYT.'); return;
    }
    try {
      const { fullName, phone, dateOfBirth, gender, idCardNumber, healthInsuranceNumber,
        address, heightCm, weightKg, bloodType, allergies, medicalHistory } = form;
      await saveProfile({ fullName, phone, dateOfBirth, gender, idCardNumber,
        healthInsuranceNumber, address, heightCm, weightKg, bloodType, allergies, medicalHistory });
      setNotice('Đã lưu hồ sơ vào hệ thống.');
    } catch { /* API errors are displayed below. */ }
  };
  if (!profile) return <div className="p-6 space-y-3"><p role="alert">{profileError || 'Đang tải hồ sơ…'}</p><button disabled={profileLoading} onClick={() => void loadProfile()}>Tải lại hồ sơ</button></div>;
  const textField = (key: 'fullName' | 'phone' | 'dateOfBirth' | 'idCardNumber' | 'healthInsuranceNumber' | 'address', label: string, required = false, maxLength?: number, type = 'text') =>
    <label className="block text-sm">{label}{required && ' *'}<input className="block w-full border rounded-lg p-2 mt-1" type={type} required={required} maxLength={maxLength} value={form[key] || ''} onChange={e => change(key, e.target.value)} /></label>;
  return <form onSubmit={submit} className="max-w-3xl mx-auto p-6 bg-white border rounded-2xl space-y-5">
    <h2 className="font-bold text-xl">Hồ sơ cá nhân</h2>
    <p className="text-sm">Email tài khoản: {profile.email}</p>
    <p className="text-sm">{profile.isProfileCompleted ? 'Đã hoàn thiện hồ sơ khai báo.' : 'Vui lòng bổ sung thông tin bắt buộc và CCCD hoặc BHYT.'}</p>
    <fieldset disabled={profileLoading} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {textField('fullName', 'Họ và tên', true, 100)}
        {textField('phone', 'Số điện thoại', true, 16, 'tel')}
        {textField('dateOfBirth', 'Ngày sinh', true, undefined, 'date')}
        <label className="text-sm">Giới tính *<select required className="block w-full border rounded-lg p-2 mt-1" value={form.gender} onChange={e => change('gender', e.target.value as ProfileRequest['gender'])}><option value="">Chọn giới tính</option>{['Nam', 'Nữ', 'Khác'].map(value => <option key={value}>{value}</option>)}</select></label>
        {textField('idCardNumber', 'CCCD (hoặc BHYT)', false, 20)}
        {textField('healthInsuranceNumber', 'BHYT (hoặc CCCD)', false, 100)}
      </div>
      {textField('address', 'Địa chỉ', true, 500)}
      <div className="grid sm:grid-cols-3 gap-4">
        {(['heightCm', 'weightKg'] as const).map(key => <label key={key} className="text-sm">{key === 'heightCm' ? 'Chiều cao tham khảo (cm)' : 'Cân nặng tham khảo (kg)'}<input className="block w-full border rounded-lg p-2 mt-1" type="number" min="0.01" max="9999.99" step="0.01" value={form[key] ?? ''} onChange={e => change(key, e.target.value === '' ? null : Number(e.target.value))} /></label>)}
        <label className="text-sm">Nhóm máu<select className="block w-full border rounded-lg p-2 mt-1" value={form.bloodType || ''} onChange={e => change('bloodType', e.target.value || null)}><option value="">Chưa khai báo</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Chưa rõ'].map(value => <option key={value}>{value}</option>)}</select></label>
      </div>
      {(['allergies', 'medicalHistory'] as const).map(key => <label key={key} className="block text-sm">{key === 'allergies' ? 'Dị ứng thuốc / thực phẩm' : 'Bệnh nền / tiền sử'}<textarea className="block w-full border rounded-lg p-2 mt-1" maxLength={4000} value={form[key] || ''} onChange={e => change(key, e.target.value || null)} /></label>)}
      <button className="bg-emerald-600 text-white rounded-lg px-5 py-3 disabled:opacity-50" type="submit">{profileLoading ? 'Đang lưu…' : 'Lưu hồ sơ'}</button>
    </fieldset>
    {profileError && <p role="alert" className="text-red-700">{profileError}</p>}
    {notice && <p role="status">{notice}</p>}
  </form>;
};
