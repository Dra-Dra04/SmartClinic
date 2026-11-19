import { Camera, Pencil, ClipboardList } from 'lucide-react';
import { useClinicStore } from '../../store/useClinicStore';
import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { AccountAvatar } from '../common/AccountAvatar';
import { authErrorMessage } from '../../services/authService';
import { profileService, ProfileRequest } from '../../services/profileService';
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
  const [editing, setEditing] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarVersion, setAvatarVersion] = useState('');
  const avatarInput = useRef<HTMLInputElement>(null);
  async function uploadAvatar(file?: File) {
    if (!file || avatarBusy || !editing || profileLoading) return;
    setAvatarError('');
    if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Chọn ảnh JPEG, PNG hoặc WebP, tối đa 5 MB.');
      return;
    }
    setAvatarBusy(true);
    try {
      const response = await profileService.uploadAvatar(file);
      setAvatarVersion(response.avatarUrl);
      await loadProfile();
      setNotice('Đã cập nhật ảnh đại diện.');
    } catch (error) {
      setAvatarError(authErrorMessage(error));
    } finally {
      setAvatarBusy(false);
    }
  }
  const setPortalNav = useClinicStore(state => state.setPortalNav);
  useEffect(() => {
    // An avatar refresh must preserve any personal details already typed in the form.
    if (profile && !avatarBusy) setForm({ ...profile, gender: profile.gender || empty.gender });
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
      setEditing(false);
    } catch { /* API errors are displayed below. */ }
  };
  if (!profile) return <div className="p-6 space-y-3"><p role="alert">{profileError || 'Đang tải hồ sơ…'}</p><button disabled={profileLoading} onClick={() => void loadProfile()}>Tải lại hồ sơ</button></div>;
  const textField = (key: 'fullName' | 'phone' | 'dateOfBirth' | 'idCardNumber' | 'healthInsuranceNumber' | 'address', label: string, required = false, maxLength?: number, type = 'text') =>
    <label className={`block text-sm ${key !== 'dateOfBirth' ? 'sm:col-span-2' : ''}`}>{label}{required && ' *'}<input className="mt-1 block w-full rounded-xl border border-sky-100 bg-slate-50 p-3 text-sm text-slate-800 disabled:opacity-100" type={type} required={required} maxLength={maxLength} value={form[key] || ''} onChange={e => change(key, e.target.value)} /></label>;
  const canEdit = editing || !profile.isProfileCompleted;
  return <div className="mx-auto max-w-3xl space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#005a8b] to-[#00a8e8] p-5 text-white shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <AccountAvatar src={avatarVersion || profile.avatarUrl} className="size-14 rounded-xl" />
          {editing && <>
            <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp"
              className="hidden" disabled={avatarBusy || profileLoading} onChange={event => {
                const file = event.target.files?.[0];
                event.target.value = '';
                void uploadAvatar(file);
              }} />
            <button type="button" disabled={avatarBusy || profileLoading} onClick={() => avatarInput.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-50 disabled:opacity-50">
              <Camera className="size-4" /> {avatarBusy ? 'Đang tải…' : 'Thay ảnh'}
            </button>
          </>}
        </div>
        <div><h2 className="font-bold">{profile.fullName || profile.email}</h2><p className="text-xs text-sky-100">Thông tin cá nhân</p></div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setPortalNav('my-visits')} className="flex items-center gap-2 rounded-lg border border-white/30 px-3 py-2 text-xs">
          <ClipboardList className="size-4" /> Hồ sơ & EMR
        </button>
        <button type="button" disabled={profileLoading || avatarBusy} onClick={() => setEditing(true)} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#0084c7]">
          <Pencil className="size-4" /> Chỉnh sửa
        </button>
      </div>
    </header>
    {avatarError && <p role="alert" className="text-sm text-rose-700">{avatarError}</p>}
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
    <h2 className="font-bold text-lg text-[#005a8b]">Thông tin cá nhân & Hồ sơ sức khỏe</h2>
    <label className="block text-sm">Email
      <input readOnly value={profile.email} className="mt-1 block w-full rounded-xl border border-sky-100 bg-slate-50 p-3 text-sm text-slate-800" />
    </label>
    <p className="text-sm">{profile.isProfileCompleted ? 'Đã hoàn thiện hồ sơ khai báo.' : 'Vui lòng bổ sung thông tin bắt buộc và CCCD hoặc BHYT.'}</p>
    <fieldset disabled={profileLoading || avatarBusy || !canEdit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {textField('fullName', 'Họ và tên', true, 100)}
        {textField('phone', 'Số điện thoại', true, 16, 'tel')}
        {textField('dateOfBirth', 'Ngày sinh', true, undefined, 'date')}
        <label className="text-sm">Giới tính *<select required className="mt-1 block w-full rounded-xl border border-sky-100 bg-slate-50 p-3 text-sm text-slate-800 disabled:opacity-100" value={form.gender} onChange={e => change('gender', e.target.value as ProfileRequest['gender'])}><option value="">Chọn giới tính</option>{['Nam', 'Nữ', 'Khác'].map(value => <option key={value}>{value}</option>)}</select></label>
        {textField('idCardNumber', 'CCCD (hoặc BHYT)', false, 20)}
        {textField('healthInsuranceNumber', 'BHYT (hoặc CCCD)', false, 100)}
      </div>
      {textField('address', 'Địa chỉ', true, 500)}
      <div className="grid sm:grid-cols-3 gap-4">
        {(['heightCm', 'weightKg'] as const).map(key => <label key={key} className="text-sm">{key === 'heightCm' ? 'Chiều cao tham khảo (cm)' : 'Cân nặng tham khảo (kg)'}<input className="mt-1 block w-full rounded-xl border border-sky-100 bg-slate-50 p-3 text-sm text-slate-800 disabled:opacity-100" type="number" min="0.01" max="9999.99" step="0.01" value={form[key] ?? ''} onChange={e => change(key, e.target.value === '' ? null : Number(e.target.value))} /></label>)}
        <label className="text-sm">Nhóm máu<select className="mt-1 block w-full rounded-xl border border-sky-100 bg-slate-50 p-3 text-sm text-slate-800 disabled:opacity-100" value={form.bloodType || ''} onChange={e => change('bloodType', e.target.value || null)}><option value="">Chưa khai báo</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Chưa rõ'].map(value => <option key={value}>{value}</option>)}</select></label>
      </div>
      {(['allergies', 'medicalHistory'] as const).map(key => <label key={key} className="block text-sm">{key === 'allergies' ? 'Dị ứng thuốc / thực phẩm' : 'Bệnh nền / tiền sử'}<textarea className="mt-1 block w-full rounded-xl border border-sky-100 bg-slate-50 p-3 text-sm text-slate-800 disabled:opacity-100" maxLength={4000} value={form[key] || ''} onChange={e => change(key, e.target.value || null)} /></label>)}
      {canEdit && <button className="bg-[#0084c7] text-white rounded-lg px-5 py-3 disabled:opacity-50" type="submit">{profileLoading ? 'Đang lưu…' : 'Lưu hồ sơ'}</button>}
    </fieldset>
    {profileError && <p role="alert" className="text-red-700">{profileError}</p>}
    {notice && <p role="status">{notice}</p>}
    <button type="button" onClick={() => setPortalNav('my-visits')}
      className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-[#0084c7]">
      <ClipboardList className="size-4" /> Xem tiến trình khám & Bệnh án điện tử EMR
    </button>
  </form></div>;
};
