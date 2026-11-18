import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useClinicStore } from '../../store/useClinicStore';
import { X, Lock, Mail, Phone, UserCheck, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  noticeMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, noticeMessage }) => {
  const { loginUser, registerUser, isLoading, error, clearError, isDemo } = useAuthStore();
  const { setPortalNav } = useClinicStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isDemo) return;
    clearError(); setMessage('');
    try {
      await loginUser(emailOrPhone, password);
      const { activeRole, profile, profileError } = useAuthStore.getState();
      const needsProfile = activeRole === 'patient' && !profileError && profile?.isProfileCompleted === false;
      setPassword(''); onClose();
      setPortalNav(needsProfile ? 'profile' : 'home');
    } catch { /* Keep form open; API error is displayed. */ }
  };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isDemo) return;
    clearError(); setMessage('');
    if (regPass !== confirmPassword) { setMessage('Mật khẩu xác nhận không khớp.'); return; }
    try {
      await registerUser({ email: regEmail, phoneNumber: regPhone, password: regPass, confirmPassword });
      setEmailOrPhone(regEmail); setRegPass(''); setConfirmPassword(''); setPassword('');
      setMode('login'); setMessage('Đăng ký thành công. Vui lòng đăng nhập.');
    } catch { /* Keep registration values so the user can correct errors. */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-100 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {mode === 'login' ? 'Đăng Nhập Tài Khoản Bệnh Nhân' : 'Đăng Ký Tài Khoản Bệnh Nhân Mới'}
            </h3>
            <p className="text-[11px] text-slate-500">
              Hệ thống Quản lý Phòng khám Đa khoa SmartClinic
            </p>
          </div>
          <button disabled={isLoading} onClick={() => { setPassword(''); setRegPass(''); setConfirmPassword(''); clearError(); onClose(); }} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Message if redirected from booking CTA */}
        {noticeMessage && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900">
            <UserCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed font-semibold">
              {noticeMessage}
            </span>
          </div>
        )}

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
          <button
            type="button"
            disabled={isLoading || isDemo}
            onClick={() => { setMode('login'); clearError(); setMessage(''); }}
            className={`flex-1 py-2 rounded-lg font-bold transition text-xs ${
              mode === 'login' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            disabled={isLoading || isDemo}
            onClick={() => { setMode('register'); clearError(); setMessage(''); }}
            className={`flex-1 py-2 rounded-lg font-bold transition text-xs ${
              mode === 'register' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Đăng ký mới
          </button>
        </div>

        {isDemo && <p role="status">Đang ở chế độ demo. Quay về chế độ thật để đăng ký hoặc đăng nhập.</p>}
        {error && <p role="alert" className="text-red-700 mb-3">{error}</p>}
        {message && <p role="status" className="mb-3">{message}</p>}
        {isLoading && <p role="status">Đang xử lý…</p>}
        {/* LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                maxLength={255}
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="Email đăng nhập"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mật khẩu *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || isDemo}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Đăng nhập vào Hệ thống</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
              <input
                type="tel"
                required
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="0988776655"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Địa chỉ Email *</label>
              <input
                type="email"
                required
                maxLength={255}
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="ngan.hk@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mật khẩu *</label>
              <input
                type="password"
                required
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                minLength={10}
                maxLength={128}
                placeholder="Từ 10 đến 128 ký tự"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <label className="block font-bold text-slate-700">Xác nhận mật khẩu *
              <input className="block w-full border rounded-xl p-3" type="password" required minLength={10} maxLength={128} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </label>
            <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              📌 <strong>Lưu ý:</strong> Đăng ký thành công sẽ quay về form đăng nhập. Sau khi đăng nhập, bạn có thể cập nhật hồ sơ cá nhân.
            </p>

            <button
              type="submit"
              disabled={isLoading || isDemo}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Đăng ký tài khoản</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
