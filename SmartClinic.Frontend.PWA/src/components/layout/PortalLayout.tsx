import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useClinicStore } from '../../store/useClinicStore';
import { Footer } from './Footer';
import { MessengerAIChatWidget } from '../chat/MessengerAIChatWidget';
import { 
  Home,
  Search,
  Calendar,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  FileText,
  Activity
} from 'lucide-react';

interface PortalLayoutProps {
  children: React.ReactNode;
  onOpenAuthModal: () => void;
  onOpenBookingWizard: () => void;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  onOpenAuthModal,
  onOpenBookingWizard,
}) => {
  const { currentUser, activeRole, openOnboardingGuard, setDemoState } = useAuthStore();
  const { currentPortalNav, setPortalNav } = useClinicStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isIntroDropdownOpen, setIsIntroDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isGuest = activeRole === 'guest';

  const handleBookingCTA = () => {
    if (isGuest) {
      onOpenAuthModal();
      return;
    }
    if (activeRole === 'patient' && !currentUser.isProfileCompleted) {
      openOnboardingGuard('Đặt lịch khám');
      return;
    }
    onOpenBookingWizard();
  };

  const SPECIALTIES_LIST = [
    'Nội tiết - Cơ xương khớp',
    'Tim mạch can thiệp - Ngoại',
    'Các chuyên khoa lẻ (Tai - Mũi - Họng, Mắt, Răng Hàm Mặt)',
    'Thần kinh',
    'Phục hồi chức năng',
    'Sức khỏe tâm thần',
    'Hồi sức cấp cứu & Chống độc',
    'Chẩn đoán hình ảnh',
    'Thăm dò chức năng',
    'Nội tổng hợp',
    'Phẫu thuật tiết niệu',
    'Ung bướu & Điều trị giảm nhẹ'
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans">
      
      {/* 1. TOP HEADER (Chuẩn Bệnh viện Lão khoa Trung ương: Logo + Slogan xanh + Tìm kiếm + Nút Đặt lịch khám) */}
      <div className="bg-white border-b border-slate-100 py-3 px-3 sm:px-5">
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Logo Bệnh viện Đa khoa Quốc tế Phúc An */}
          <div 
            onClick={() => setPortalNav('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 48 48" className="w-12 h-12 text-[#0084c7]" fill="currentColor">
                {/* Stylized medical emblem */}
                <path d="M24 4C14 4 6 12 6 22c0 8 5 15 12 18v-6c-4-2-7-7-7-12 0-7 6-13 13-13s13 6 13 13c0 5-3 10-7 12v6c7-3 12-10 12-18 0-10-8-18-18-18z" />
                <path d="M24 12c-4 0-8 3.5-8 8 0 5 4 8 8 16 4-8 8-11 8-16 0-4.5-4-8-8-8zm0 11c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" />
              </svg>
            </div>
            <div className="leading-tight">
              <span className="text-[10px] tracking-wider font-bold text-slate-500 uppercase block">
                PHUC AN INTERNATIONAL GENERAL HOSPITAL
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#0084c7] tracking-tight">
                Bệnh viện Đa khoa Quốc tế Phúc An
              </h1>
            </div>
          </div>

          {/* Slogan Trung Tâm & Hotline Địa Chỉ */}
          <div className="hidden md:flex flex-col items-center text-center">
            <h2 className="text-base sm:text-lg font-bold text-[#0084c7] tracking-wide">
              Kỷ cương - Trách nhiệm - Chuyên nghiệp - Tận tâm
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#0084c7]" />
                <span>124 Vũ Trọng Phụng, Thanh Xuân, Hà Nội</span>
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#0084c7]">
                <Phone className="w-3.5 h-3.5" />
                <span>1900 6868</span>
              </span>
            </div>
          </div>

          {/* Ô Tìm Kiếm & Nút ĐẶT LỊCH KHÁM & User Profile */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="relative w-44 sm:w-56 hidden sm:block">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 text-xs rounded-full border border-slate-300 focus:outline-none focus:border-[#0084c7] transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <button
              onClick={handleBookingCTA}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0084c7] hover:bg-[#0073ae] text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition active:scale-95 shrink-0"
            >
              <Calendar className="w-4 h-4" />
              <span>ĐẶT LỊCH KHÁM</span>
            </button>

            {/* Auth / Profile */}
            {isGuest ? (
              <button
                onClick={onOpenAuthModal}
                className="p-2 text-slate-600 hover:text-[#0084c7] hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                title="Đăng nhập tài khoản"
              >
                <User className="w-4 h-4 text-[#0084c7]" />
                <span className="hidden xl:inline">Đăng nhập</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-[#0084c7] hidden sm:inline">{currentUser.fullName}</span>
                {currentUser.isProfileCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                )}
                <button
                  onClick={() => setDemoState(1)}
                  title="Đăng xuất"
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-[#0084c7] rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* 2. THANH NAVIGATION BAR XANH DƯƠNG (Exact Color #0084c7 from screenshot) */}
      <nav className="sticky top-0 z-40 bg-[#0084c7] text-white shadow-md">
        <div className="w-full flex items-center justify-between">
          
          {/* Main Desktop Links */}
          <div className="hidden lg:flex items-stretch justify-evenly w-full text-xs font-bold uppercase tracking-wider relative">
            
            {/* Home Icon */}
            <button
              onClick={() => {
                setPortalNav('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center justify-center min-w-[60px] w-[60px] px-2 py-3.5 hover:bg-[#00679c] transition border-r border-[#0092dc] ${
                currentPortalNav === 'home' ? 'bg-[#00679c]' : ''
              }`}
              title="Trang chủ"
            >
              <Home className="w-4 h-4 text-white" />
            </button>

            {/* GIỚI THIỆU - with Hover Mega Menu */}
            <div 
              className="relative flex-1"
              onMouseEnter={() => setIsIntroDropdownOpen(true)}
              onMouseLeave={() => setIsIntroDropdownOpen(false)}
            >
              <button
                onClick={() => {
                  setPortalNav('home');
                  const el = document.getElementById('about-hospital-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`w-full px-3 py-3.5 hover:bg-[#00679c] transition flex items-center gap-1 border-r border-[#0092dc] justify-center ${
                  isIntroDropdownOpen ? 'bg-[#00679c]' : ''
                }`}
              >
                <span>GIỚI THIỆU</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* 2-Column Mega Menu (Y hệt trong screenshot!) */}
              {isIntroDropdownOpen && (
                <div className="absolute top-full left-0 w-[550px] bg-white text-slate-800 shadow-2xl border border-slate-200 z-50 flex divide-x divide-slate-100 normal-case font-normal animate-in fade-in duration-150">
                  {/* Column 1 */}
                  <div className="w-44 py-2 bg-slate-50/70 text-xs">
                    <button
                      onClick={() => {
                        setIsIntroDropdownOpen(false);
                        setPortalNav('home');
                        document.getElementById('about-hospital-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#0084c7] hover:text-white transition font-medium"
                    >
                      Lịch sử hình thành
                    </button>
                    <button
                      onClick={() => {
                        setIsIntroDropdownOpen(false);
                        setPortalNav('home');
                        document.getElementById('about-hospital-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#0084c7] hover:text-white transition font-medium"
                    >
                      Sứ mệnh - tầm nhìn
                    </button>
                    <button
                      onClick={() => {
                        setIsIntroDropdownOpen(false);
                        setPortalNav('home');
                        document.getElementById('about-hospital-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#0084c7] hover:text-white transition font-medium flex items-center justify-between"
                    >
                      <span>Cơ cấu tổ chức</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        setIsIntroDropdownOpen(false);
                        setPortalNav('doctors');
                      }}
                      className="w-full text-left px-4 py-2 bg-[#0084c7] text-white font-bold flex items-center justify-between"
                    >
                      <span>Đội ngũ bác sĩ</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Column 2: 12 Chuyên khoa */}
                  <div className="flex-1 p-3 text-xs space-y-1 max-h-96 overflow-y-auto">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1 border-b border-slate-100">
                      Khoa lâm sàng & Cận lâm sàng
                    </div>
                    {SPECIALTIES_LIST.map((spec, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setIsIntroDropdownOpen(false);
                          setPortalNav('specialties');
                        }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 text-[#0084c7] hover:text-[#005a8b] font-medium transition"
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* DỊCH VỤ KHÁM CHỮA BỆNH */}
            <button
              onClick={() => setPortalNav('pricing')}
              className={`flex-1 px-2 py-3.5 hover:bg-[#00679c] transition border-r border-[#0092dc] flex items-center justify-center ${
                currentPortalNav === 'pricing' ? 'bg-[#00679c]' : ''
              }`}
            >
              DỊCH VỤ KHÁM CHỮA BỆNH
            </button>

            {/* TIN MỚI */}
            <button
              onClick={() => {
                setPortalNav('home');
                document.getElementById('news-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex-1 px-2 py-3.5 hover:bg-[#00679c] transition border-r border-[#0092dc] flex items-center justify-center"
            >
              TIN MỚI
            </button>

            {/* TIN TỨC HOẠT ĐỘNG */}
            <button
              onClick={() => {
                setPortalNav('home');
                document.getElementById('activities-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex-1 px-2 py-3.5 hover:bg-[#00679c] transition border-r border-[#0092dc] flex items-center justify-center"
            >
              TIN TỨC HOẠT ĐỘNG
            </button>

            {/* SỨC KHỎE CỘNG ĐỒNG */}
            <button
              onClick={() => {
                setPortalNav('home');
                document.getElementById('community-health-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex-1 px-2 py-3.5 hover:bg-[#00679c] transition border-r border-[#0092dc] flex items-center justify-center"
            >
              SỨC KHỎE CỘNG ĐỒNG
            </button>

            {/* LIÊN HỆ */}
            <button
              onClick={() => {
                setPortalNav('home');
                document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex-1 px-2 py-3.5 hover:bg-[#00679c] transition border-r border-[#0092dc] flex items-center justify-center"
            >
              LIÊN HỆ
            </button>

            {/* Tab dành cho bệnh nhân đã đăng nhập */}
            {!isGuest && (
              <button
                onClick={() => setPortalNav('my-visits')}
                className={`flex-1 px-2 py-3.5 hover:bg-[#00679c] transition flex items-center gap-1.5 justify-center ${
                  currentPortalNav === 'my-visits' ? 'bg-[#00679c]' : ''
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>HỒ SƠ & EMR</span>
              </button>
            )}

          </div>

          {/* Hotline góc phải của bar */}
          <div className="hidden xl:flex items-center gap-1 text-xs px-5 text-emerald-200 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-white font-bold">Cấp cứu: 024 3577 3888</span>
          </div>

        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0073ae] text-white p-4 space-y-2 text-xs font-bold uppercase">
            <button
              onClick={() => { setPortalNav('home'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 px-3 rounded hover:bg-[#00679c]"
            >
              Trang chủ
            </button>
            <button
              onClick={() => { setPortalNav('home'); setMobileMenuOpen(false); document.getElementById('about-hospital-section')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="block w-full text-left py-2 px-3 rounded hover:bg-[#00679c]"
            >
              Giới thiệu Bệnh viện
            </button>
            <button
              onClick={() => { setPortalNav('specialties'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 px-3 rounded hover:bg-[#00679c]"
            >
              Khoa phòng chuyên môn
            </button>
            <button
              onClick={() => { setPortalNav('pricing'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 px-3 rounded hover:bg-[#00679c]"
            >
              Dịch vụ khám chữa bệnh & Bảng giá
            </button>
            <button
              onClick={() => { setPortalNav('home'); setMobileMenuOpen(false); document.getElementById('news-section')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="block w-full text-left py-2 px-3 rounded hover:bg-[#00679c]"
            >
              Tin mới & Tin tức hoạt động
            </button>
            <button
              onClick={() => { setPortalNav('home'); setMobileMenuOpen(false); document.getElementById('community-health-section')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="block w-full text-left py-2 px-3 rounded hover:bg-[#00679c]"
            >
              Sức khỏe cộng đồng
            </button>
            <button
              onClick={() => { setPortalNav('home'); setMobileMenuOpen(false); document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="block w-full text-left py-2 px-3 rounded hover:bg-[#00679c]"
            >
              Liên hệ
            </button>
            {!isGuest && (
              <button
                onClick={() => { setPortalNav('my-visits'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 px-3 rounded bg-amber-400 text-slate-900"
              >
                Tiến trình ca khám & EMR
              </button>
            )}
          </div>
        )}
      </nav>

      {/* 3. MAIN PORTAL CONTENT */}
      <main className="flex-1 bg-white">
        {children}
      </main>

      {/* 4. FOOTER */}
      <Footer />

      {/* 5. FLOATING MESSENGER-STYLE AI RAG CHAT WIDGET */}
      <MessengerAIChatWidget />

      {/* 6. FLOATING PHONE HOTLINE BUTTON (Chuẩn benhvienlaokhoa.vn góc dưới trái) */}
      <a
        href="tel:02435773888"
        title="Tổng đài Cấp cứu & Tư vấn: (024) 3 577 3888"
        className="fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-[#0084c7] hover:bg-[#0073ae] text-white shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 group border-2 border-white ring-4 ring-[#0084c7]/20"
      >
        <Phone className="w-5 h-5 text-white group-hover:animate-pulse" />
      </a>
    </div>
  );
};
