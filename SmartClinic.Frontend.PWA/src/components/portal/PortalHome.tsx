import React, { useState, useRef } from 'react';
import { SPECIALTIES_DATA, DOCTORS_DATA, CLINICAL_SERVICES_CATALOG } from '../../services/mockData';
import { Doctor, Specialty, HospitalArticle } from '../../types';
import { useClinicStore } from '../../store/useClinicStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { 
  CalendarPlus, 
  Calendar,
  Bot, 
  Search, 
  Receipt, 
  ArrowRight, 
  ArrowLeft,
  Star, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  HeartPulse, 
  HelpCircle,
  FileText,
  Activity,
  Minimize2,
  Maximize2,
  X,
  ChevronRight,
  Stethoscope,
  Award,
  MapPin,
  Building2,
  Newspaper,
  PhoneCall,
  UserCheck,
  Check,
  Users,
  Play,
  FileCheck,
  Cross
} from 'lucide-react';

interface PortalHomeProps {
  onOpenBookingWizard: (doctor?: Doctor) => void;
  onSelectSpecialty: (specialty: Specialty) => void;
  onOpenAuthModal?: () => void;
}

export const PortalHome: React.FC<PortalHomeProps> = ({ 
  onOpenBookingWizard,
  onSelectSpecialty,
  onOpenAuthModal,
}) => {
  const { setPortalNav, articles } = useClinicStore();
  const { activeRole } = useAuthStore();
  const { sendPresetPrompt } = useChatStore();

  // In-place expanded specialty state on the Home page with zoom animation
  const [expandedSpecialty, setExpandedSpecialty] = useState<Specialty | null>(null);
  const specialtySectionRef = useRef<HTMLDivElement>(null);

  // Selected article for reading modal
  const [selectedNews, setSelectedNews] = useState<HospitalArticle | null>(null);

  // Video preview modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const handleBooking = (doctor?: Doctor) => {
    if (activeRole === 'guest') {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      } else {
        onOpenBookingWizard(doctor);
      }
      return;
    }
    onOpenBookingWizard(doctor);
  };

  const [priceSearch, setPriceSearch] = useState('');
  const [selectedPriceCategory, setSelectedPriceCategory] = useState<string>('all');

  const filteredServices = CLINICAL_SERVICES_CATALOG.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(priceSearch.toLowerCase()) || s.code.toLowerCase().includes(priceSearch.toLowerCase());
    const matchesCat = selectedPriceCategory === 'all' || s.category === selectedPriceCategory;
    return matchesSearch && matchesCat;
  });

  const categories = ['all', 'X-Quang kỹ thuật số', 'Siêu âm màu', 'Nội soi tiêu hóa', 'Xét nghiệm máu', 'Xét nghiệm sinh hóa'];

  // Dynamic News from Admin News Management
  const featuredArticles = articles.filter((a) => a.isPublished && a.isFeaturedOnHome);
  const displayNews = featuredArticles.length > 0 ? featuredArticles : articles.filter((a) => a.isPublished).slice(0, 3);

  return (
    <div className="space-y-12 pb-16 bg-white">
      
      {/* =========================================================================
          1. HERO SECTION (Y hệt 100% Screenshot 1)
          Left: Welcome photo elderly patients at entrance
          Right: Hospital name + Big headline + Cyan Blue Hotline Box + Address
      ========================================================================= */}
      <section className="w-full px-0 sm:px-2 pt-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-items-center lg:justify-items-stretch">
          
          {/* Left Column: Real photo of elderly couple being welcomed at hospital doors */}
          <div className="lg:col-span-6 w-full flex justify-center lg:justify-end">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-4/3 sm:aspect-16/10 w-full max-w-[760px]">
              <img
                src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=900&q=80"
                alt="Tiếp đón bệnh nhân tại Bệnh viện Lão khoa Trung ương"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold text-[#0084c7] shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0084c7] animate-ping" />
                <span>Tiếp đón chu đáo • Tận tâm phục vụ</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hospital Logo, Big Title, Blue Box, Address */}
          <div className="lg:col-span-6 w-full space-y-4 text-center flex flex-col items-center justify-center lg:items-center">
            
            {/* Hospital Emblem & Text */}
            <div className="flex items-center gap-2.5 justify-center">
              <div className="w-10 h-10 text-[#0084c7]">
                <svg viewBox="0 0 48 48" className="w-full h-full fill-current">
                  <path d="M24 4C14 4 6 12 6 22c0 8 5 15 12 18v-6c-4-2-7-7-7-12 0-7 6-13 13-13s13 6 13 13c0 5-3 10-7 12v6c7-3 12-10 12-18 0-10-8-18-18-18z" />
                  <path d="M24 12c-4 0-8 3.5-8 8 0 5 4 8 8 16 4-8 8-11 8-16 0-4.5-4-8-8-8zm0 11c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" />
                </svg>
              </div>
              <div className="text-left">
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase block">NATIONAL GERIATRIC HOSPITAL</span>
                <span className="text-sm font-bold text-[#0084c7]">Bệnh viện Lão khoa Trung ương</span>
              </div>
            </div>

            {/* Big Headline in Cyan Blue */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0084c7] tracking-tight leading-tight uppercase">
              CHĂM SÓC SỨC KHỎE <br />
              NGƯỜI CAO TUỔI
            </h2>

            {/* Large Rounded Ocean Blue Box (Screenshot 1) */}
            <div className="w-full max-w-md bg-[#0084c7] text-white rounded-3xl p-5 sm:p-6 shadow-md text-left space-y-2.5 border border-[#0073ae] mx-auto">
              {/* Giant Hotline Phone */}
              <div className="flex items-center gap-2 pb-2 border-b border-white/20">
                <PhoneCall className="w-6 h-6 text-white" />
                <span className="text-xl sm:text-2xl font-black font-mono tracking-wider">
                  (024) 3 577 3888
                </span>
              </div>

              {/* Departments phone numbers */}
              <div className="space-y-1.5 text-xs sm:text-sm font-bold">
                <div className="flex items-center justify-between">
                  <span className="text-white/90">KHÁM YÊU CẦU:</span>
                  <span className="font-mono text-base tracking-wider text-amber-200">0963 580 006</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/90">KHÁM THƯỜNG & BHYT:</span>
                  <span className="font-mono text-base tracking-wider text-white">0962 535 329</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/90">PHÒNG TIÊM CHỦNG:</span>
                  <span className="font-mono text-base tracking-wider text-white">0985 827 961</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
                  <span className="text-emerald-200 flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" /> TRỢ LÝ Y TẾ AI RAG:
                  </span>
                  <span className="font-mono text-amber-300">1900 6868</span>
                </div>
              </div>
            </div>

            {/* Address with red/orange pin */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 pt-1">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span>124 Vũ Trọng Phụng, Thanh Xuân, Hà Nội</span>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          2. 6 CIRCULAR QUICK ACTION BADGES (Y hệt Screenshot 1)
          Row of 6 pastel circles with text underneath:
          1. Đặt lịch khám (Green)
          2. Quy trình khám (Pink)
          3. Lịch khám (Yellow)
          4. Bảng giá dịch vụ kỹ thuật (Red)
          5. Tìm bác sĩ (Blue)
          6. Địa điểm (Cyan)
      ========================================================================= */}
      <section className="w-full px-0 sm:px-2">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-6 text-center">
          
          {/* 1. Đặt lịch khám (Green tint) */}
          <div 
            onClick={() => handleBooking()}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#e6fbf4] text-[#00bfa5] flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:shadow-md transition-all duration-200">
              <CalendarPlus className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 mt-2.5 group-hover:text-[#0084c7] transition">
              Đặt lịch khám
            </span>
          </div>

          {/* 2. Quy trình khám (Pink tint) */}
          <div 
            onClick={() => {
              const el = document.getElementById('instructions-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#ffe8f0] text-[#ff4081] flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:shadow-md transition-all duration-200">
              <Stethoscope className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 mt-2.5 group-hover:text-[#0084c7] transition">
              Quy trình khám
            </span>
          </div>

          {/* 3. Lịch khám (Yellow tint) */}
          <div 
            onClick={() => setPortalNav('doctors')}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#fff8e1] text-[#ffb300] flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:shadow-md transition-all duration-200">
              <Calendar className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 mt-2.5 group-hover:text-[#0084c7] transition">
              Lịch khám
            </span>
          </div>

          {/* 4. Bảng giá dịch vụ kỹ thuật (Red tint) */}
          <div 
            onClick={() => {
              const el = document.getElementById('pricing-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#fdeeed] text-[#f44336] flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:shadow-md transition-all duration-200">
              <Receipt className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 mt-2.5 group-hover:text-[#0084c7] transition max-w-[110px] leading-tight">
              Bảng giá dịch vụ kỹ thuật
            </span>
          </div>

          {/* 5. Tìm bác sĩ (Blue tint) */}
          <div 
            onClick={() => setPortalNav('doctors')}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#e3f2fd] text-[#2196f3] flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:shadow-md transition-all duration-200">
              <Users className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 mt-2.5 group-hover:text-[#0084c7] transition">
              Tìm bác sĩ
            </span>
          </div>

          {/* 6. Địa điểm (Cyan tint) */}
          <div 
            onClick={() => {
              const el = document.getElementById('about-hospital-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#e0f7fa] text-[#00bcd4] flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:shadow-md transition-all duration-200">
              <MapPin className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 mt-2.5 group-hover:text-[#0084c7] transition">
              Địa điểm
            </span>
          </div>

        </div>
      </section>

      {/* =========================================================================
          3. SECTION "BỆNH VIỆN ĐA KHOA QUỐC TẾ PHÚC AN"
          Light gray background #F4F6F8
          Left: Title in navy + Subtitle in blue + Logo + Description
          Right: Hospital facade photo with Play button ▶ in center
      ========================================================================= */}
      <section id="about-hospital-section" className="bg-[#F4F6F8] py-12 px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-6 space-y-4 text-center lg:text-left flex flex-col items-center lg:items-start">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#005a8b] tracking-wide uppercase">
                BỆNH VIỆN ĐA KHOA QUỐC TẾ PHÚC AN
              </h2>
              <h3 className="text-sm sm:text-base font-bold text-[#0084c7] tracking-wider uppercase">
                ĐỊA CHỈ TIN CẬY CHO SỨC KHỎE MỌI GIA ĐÌNH VIỆT NAM
              </h3>

              {/* Logo Emblem */}
              <div className="w-16 h-16 text-[#0084c7] py-1">
                <svg viewBox="0 0 48 48" className="w-full h-full fill-current">
                  <path d="M24 4C14 4 6 12 6 22c0 8 5 15 12 18v-6c-4-2-7-7-7-12 0-7 6-13 13-13s13 6 13 13c0 5-3 10-7 12v6c7-3 12-10 12-18 0-10-8-18-18-18z" />
                  <path d="M24 12c-4 0-8 3.5-8 8 0 5 4 8 8 16 4-8 8-11 8-16 0-4.5-4-8-8-8zm0 11c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" />
                </svg>
              </div>

              {/* Description Paragraph */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                Bệnh viện Đa khoa Quốc tế Phúc An là tổ hợp y tế chất lượng cao, trang bị cơ sở vật chất và công nghệ tiên tiến hàng đầu theo tiêu chuẩn quốc tế. Với tôn chỉ "Kỷ cương - Trách nhiệm - Chuyên nghiệp - Tận tâm", Phúc An quy tụ đội ngũ Giáo sư, Tiến sĩ, Bác sĩ đầu ngành cùng giải pháp số hóa bệnh án điện tử và Trợ lý AI Y tế hỗ trợ người bệnh chu đáo nhất.
              </p>
            </div>

            {/* Right Column: Hospital Facade Image with Video Play Icon */}
            <div className="lg:col-span-6">
              <div 
                onClick={() => setIsVideoModalOpen(true)}
                className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-white bg-slate-200 aspect-16/10 cursor-pointer group"
              >
                <img
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80"
                  alt="Khuôn viên Bệnh viện Đa khoa Quốc tế Phúc An"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-slate-900/30 group-hover:bg-slate-900/40 transition" />
                
                {/* Central Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-slate-900/60 border-2 border-white text-white flex items-center justify-center group-hover:scale-110 transition shadow-lg">
                    <Play className="w-8 h-8 fill-white ml-1" />
                  </div>
                </div>

                <div className="absolute bottom-3 left-4 text-white text-xs font-semibold">
                  <span>Xem video giới thiệu Bệnh viện Đa khoa Quốc tế Phúc An</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Video Modal Preview */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-4 relative shadow-2xl">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shadow"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-16/9 bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center text-white p-6 text-center space-y-3">
              <Building2 className="w-16 h-16 text-[#0084c7]" />
              <h4 className="text-lg font-bold">Phim Giới Thiệu Bệnh Viện Đa Khoa Quốc Tế Phúc An</h4>
              <p className="text-xs text-slate-300 max-w-md">
                Hệ thống chuyên khoa mũi nhọn, cơ sở hạ tầng hiện đại và đội ngũ Giáo sư, Bác sĩ tận tụy vì sức khỏe người bệnh.
              </p>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="px-5 py-2 rounded-lg bg-[#0084c7] text-white font-bold text-xs"
              >
                Đóng video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. TWO PROMOTIONAL BANNERS SIDE-BY-SIDE (Y hệt Screenshot 3)
          Banner 1 (White & Cyan): TẦM SOÁT TIM MẠCH + Doctors team photo
          Banner 2 (Vibrant Blue): ĐẶT LỊCH ONLINE ƯU TIÊN KHÁM TRƯỚC + Button
      ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Banner 1: TẦM SOÁT TIM MẠCH (Screenshot 3) */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-2 z-10 text-left">
              <div className="flex items-center gap-1.5 text-[#0084c7]">
                <Activity className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Bệnh viện Đa khoa Quốc tế Phúc An</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#0084c7] tracking-tight">
                TẦM SOÁT <br />
                TIM MẠCH
              </h3>
              <p className="text-xs font-bold text-slate-700">
                Hotline: <strong className="text-[#0084c7] font-mono text-sm">024 35764558</strong>
              </p>
              <button
                onClick={() => handleBooking()}
                className="mt-2 px-4 py-2 bg-[#0084c7] hover:bg-[#0073ae] text-white text-xs font-bold rounded-lg transition"
              >
                Đăng ký gói khám →
              </button>
            </div>

            {/* Doctors photo */}
            <div className="w-full sm:w-56 h-40 rounded-xl overflow-hidden shrink-0">
              <img
                src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=500&q=80"
                alt="Đội ngũ bác sĩ tim mạch"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Banner 2: ĐẶT LỊCH ONLINE ƯU TIÊN KHÁM TRƯỚC (Screenshot 3) */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0084c7] to-[#009ae8] text-white shadow-md p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-3 z-10 text-left">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                ĐẶT LỊCH ONLINE <br />
                ƯU TIÊN KHÁM TRƯỚC
              </h3>
              <p className="text-xs text-blue-100">
                Chủ động chọn giờ khám, giảm thiểu tối đa thời gian chờ đợi tại viện.
              </p>
              <button
                onClick={() => handleBooking()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0084c7] hover:bg-blue-50 font-black text-xs sm:text-sm rounded-lg shadow-sm transition active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>ĐẶT LỊCH KHÁM</span>
              </button>
            </div>

            {/* Patient consultation photo */}
            <div className="w-full sm:w-52 h-40 rounded-xl overflow-hidden shrink-0 border-2 border-white/30">
              <img
                src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=500&q=80"
                alt="Bệnh nhân đặt hẹn tại quầy tiếp đón"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          5. SECTION PILL HEADER: "TIN TỨC HOẠT ĐỘNG" (Đưa lên trên danh mục kỹ thuật)
          Cyan Blue rounded pill badge: TIN TỨC HOẠT ĐỘNG
          Row of 3 News Cards matching Screenshot 3
      ========================================================================= */}
      <section id="activities-section" className="max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-20">
        
        {/* Cyan Blue Pill Header (Screenshot 3) */}
        <div className="text-center my-6">
          <span className="inline-block px-10 py-2.5 rounded-full bg-[#00a8e8] text-white font-extrabold uppercase text-sm tracking-wider shadow-xs">
            TIN TỨC HOẠT ĐỘNG
          </span>
        </div>

        {/* 3 News Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayNews.map((news) => (
            <div
              key={news.id}
              onClick={() => setSelectedNews(news)}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-lg hover:border-[#0084c7] transition overflow-hidden cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="aspect-16/10 overflow-hidden bg-slate-100">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <span className="text-[10px] font-bold text-[#0084c7] uppercase">
                    {news.category} • {news.date}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#0084c7] transition line-clamp-2 leading-snug">
                    {news.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {news.summary}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 text-xs font-bold text-[#0084c7] flex items-center justify-between border-t border-slate-100">
                <span>Xem chi tiết</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Article Detail Modal */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedNews(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-[#0084c7] uppercase">{selectedNews.category} • {selectedNews.date}</span>
            <h3 className="text-xl font-bold text-slate-900">{selectedNews.title}</h3>
            <img src={selectedNews.image} alt={selectedNews.title} className="w-full h-64 object-cover rounded-xl" />
            <div className="space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-800">{selectedNews.summary}</p>
              {selectedNews.content.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedNews(null)}
                className="px-4 py-2 bg-[#0084c7] text-white text-xs font-bold rounded-lg"
              >
                Đóng bài viết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. SECTION PILL HEADER: "DANH MỤC KỸ THUẬT" (Y hệt Screenshot 2)
          Cyan Blue rounded pill badge: DANH MỤC KỸ THUẬT
          Technical services & Specialties grid (with in-place zoom/shrink)
      ========================================================================= */}
      <section ref={specialtySectionRef} id="specialties-section" className="max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-20">
        
        {/* Cyan Blue Pill Header (Screenshot 2) */}
        <div className="text-center my-6">
          <span className="inline-block px-10 py-2.5 rounded-full bg-[#00a8e8] text-white font-extrabold uppercase text-sm tracking-wider shadow-xs">
            DANH MỤC KỸ THUẬT
          </span>
        </div>

        {/* TRƯỜNG HỢP 1: ĐANG PHÓNG TO XEM CHI TIẾT CHUYÊN KHOA VÀ BÁC SĨ TRỰC TIẾP TẠI TRANG CHỦ */}
        {expandedSpecialty ? (
          <div className="bg-white rounded-2xl border-2 border-[#0084c7] shadow-xl p-6 sm:p-8 animate-in zoom-in-95 fade-in duration-300 space-y-6">
            
            {/* Thanh điều khiển thu nhỏ */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <button
                onClick={() => {
                  setExpandedSpecialty(null);
                  specialtySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0084c7] font-bold text-xs sm:text-sm transition active:scale-95 border border-blue-200"
              >
                <ArrowLeft className="w-4 h-4 text-[#0084c7]" />
                <Minimize2 className="w-4 h-4 text-[#0084c7]" />
                <span>Thu nhỏ & Trở về danh mục kỹ thuật</span>
              </button>

              <button
                onClick={() => {
                  setExpandedSpecialty(null);
                  specialtySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
                title="Đóng / Thu nhỏ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Banner giới thiệu chuyên khoa */}
            <div className="bg-[#0084c7] text-white rounded-xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                  MÃ CHUYÊN KHOA: {expandedSpecialty.code}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold">{expandedSpecialty.name}</h3>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                  {expandedSpecialty.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {expandedSpecialty.highlightPoints.map((pt, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded bg-white/20 text-xs text-white">
                      ✓ {pt}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white/10 p-4 rounded-xl border border-white/20 min-w-[220px] text-center space-y-2">
                <span className="text-xs text-blue-100 block">Phí khám ban đầu</span>
                <span className="text-2xl font-black text-amber-300 font-mono">
                  {expandedSpecialty.consultationFee.toLocaleString('vi-VN')} đ
                </span>
                <button
                  onClick={() => handleBooking()}
                  className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs rounded-lg transition"
                >
                  Đặt lịch khám tại khoa
                </button>
              </div>
            </div>

            {/* Danh sách Bác sĩ trực thuộc khoa */}
            <div className="space-y-3">
              <h4 className="text-base sm:text-lg font-bold text-[#005a8b] flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#0084c7]" />
                <span>Đội ngũ Bác sĩ hiện có trong {expandedSpecialty.name}</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  const deptDocs = DOCTORS_DATA.filter(
                    (d) => d.specialtyId === expandedSpecialty.id || d.specialtyName.includes(expandedSpecialty.name.replace('Khoa ', ''))
                  );
                  const displayDocs = deptDocs.length > 0 ? deptDocs : [DOCTORS_DATA[0]];

                  return displayDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 hover:border-[#0084c7] transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start gap-3 mb-2">
                          <img
                            src={doc.avatarUrl}
                            alt={doc.fullName}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-300"
                          />
                          <div>
                            <span className="text-[10px] font-bold text-[#0084c7] bg-blue-50 px-1.5 py-0.5 rounded">
                              {doc.title}
                            </span>
                            <h5 className="font-bold text-slate-900 text-sm">{doc.fullName}</h5>
                            <p className="text-xs text-slate-500">{doc.roomNumber}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">
                          {doc.bio}
                        </p>
                      </div>

                      <button
                        onClick={() => handleBooking(doc)}
                        className="w-full py-1.5 bg-[#0084c7] hover:bg-[#0073ae] text-white font-bold text-xs rounded-lg transition"
                      >
                        Đặt lịch với BS này
                      </button>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Nút thu nhỏ */}
            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => {
                  setExpandedSpecialty(null);
                  specialtySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                ← Thu nhỏ khung chuyên khoa
              </button>
            </div>

          </div>
        ) : (
          /* TRƯỜNG HỢP 2: LƯỚI DANH MỤC KỸ THUẬT & KHOA PHÒNG (Giao diện sạch sẽ, thoáng mắt) */
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {SPECIALTIES_DATA.map((spec) => (
              <div
                key={spec.id}
                onClick={() => {
                  setExpandedSpecialty(spec);
                  onSelectSpecialty(spec);
                  specialtySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-lg hover:border-[#0084c7] transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0084c7] flex items-center justify-center font-bold mb-2 group-hover:bg-[#0084c7] group-hover:text-white transition">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-[#0084c7] transition text-sm">
                    {spec.name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {spec.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0084c7]">
                    {spec.consultationFee.toLocaleString('vi-VN')} đ
                  </span>
                  <span className="font-semibold text-slate-500 group-hover:text-[#0084c7] flex items-center gap-0.5">
                    <span>Xem chi tiết</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          7. SECTION QUY TRÌNH KHÁM BỆNH (INSTRUCTIONS)
      ========================================================================= */}
      <section id="instructions-section" className="bg-[#F4F6F8] py-12 px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold text-[#0084c7] uppercase tracking-wider">Chỉ Dẫn Người Bệnh</span>
            <h3 className="text-2xl font-extrabold text-[#005a8b] mt-1">Quy Trình Khám Bệnh 5 Bước</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {[
              { num: '01', title: 'Tiếp đón & Lấy số', desc: 'Quét mã QR đặt lịch hẹn hoặc lấy số thứ tự tự động.' },
              { num: '02', title: 'Khám lâm sàng', desc: 'Bác sĩ chuyên khoa trực tiếp khám bệnh tại phòng khám.' },
              { num: '03', title: 'Cận lâm sàng', desc: 'Xét nghiệm, siêu âm, chụp X-quang theo chỉ định.' },
              { num: '04', title: 'Kết luận & Kê đơn', desc: 'Bác sĩ kết luận, giải thích và kê đơn thuốc EMR.' },
              { num: '05', title: 'Lĩnh thuốc & Ra về', desc: 'Thanh toán BHYT, nhận thuốc tại quầy dược bệnh viện.' },
            ].map((step, idx) => (
              <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 text-center space-y-1.5 shadow-2xs">
                <span className="text-2xl font-black text-[#0084c7] font-mono">{step.num}</span>
                <h5 className="font-bold text-slate-900 text-xs sm:text-sm">{step.title}</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. SECTION BẢNG GIÁ DỊCH VỤ NIÊM YẾT (PRICING)
      ========================================================================= */}
      <section id="pricing-section" className="max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-20">
        <div className="text-center my-6">
          <span className="inline-block px-10 py-2.5 rounded-full bg-[#00a8e8] text-white font-extrabold uppercase text-sm tracking-wider shadow-xs">
            BẢNG GIÁ VIỆN PHÍ & DỊCH VỤ
          </span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedPriceCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                    selectedPriceCategory === cat
                      ? 'bg-[#0084c7] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'Tất cả dịch vụ' : cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={priceSearch}
                onChange={(e) => setPriceSearch(e.target.value)}
                placeholder="Tìm tên dịch vụ, mã kỹ thuật..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#0084c7]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0084c7] text-white font-bold">
                <tr>
                  <th className="p-3 rounded-l-lg">Mã kỹ thuật</th>
                  <th className="p-3">Tên dịch vụ</th>
                  <th className="p-3">Khoa thực hiện</th>
                  <th className="p-3">Thời gian trả KQ</th>
                  <th className="p-3 text-right rounded-r-lg">Giá niêm yết (VNĐ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map((serv) => (
                  <tr key={serv.code} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-[#0084c7]">{serv.code}</td>
                    <td className="p-3 font-bold text-slate-900">{serv.name}</td>
                    <td className="p-3 text-slate-600">{serv.department}</td>
                    <td className="p-3 text-slate-600">{serv.estimatedMinutes} phút</td>
                    <td className="p-3 text-right font-mono font-bold text-[#0084c7] text-sm">
                      {serv.price.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. SECTION FAQ
      ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6">
          <span className="text-xs font-bold text-[#0084c7] uppercase tracking-wider">Hỏi Đáp</span>
          <h4 className="text-xl font-extrabold text-[#005a8b] mt-1">Câu Hỏi Thường Gặp Của Người Bệnh</h4>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Khám BHYT tại Bệnh viện Lão khoa Trung ương có cần giấy chuyển viện không?',
              a: 'Bệnh viện áp dụng khám BHYT theo quy định hiện hành. Bệnh nhân có thẻ BHYT đăng ký ban đầu tại các cơ sở khám chữa bệnh được hưởng đầy đủ quyền lợi BHYT khi có giấy chuyển tuyến hoặc theo diện thông tuyến khám ngoại trú.',
            },
            {
              q: 'Làm thế nào để đặt lịch khám theo yêu cầu?',
              a: 'Quý người bệnh có thể nhấn vào nút "ĐẶT LỊCH KHÁM" ở đầu trang hoặc gọi trực tiếp đến số tổng đài Khám theo yêu cầu: 0963 580 006 hoặc (024) 3 577 3888 để được tiếp đón ưu tiên.',
            },
            {
              q: 'Trợ lý AI Y tế RAG hoạt động như thế nào?',
              a: 'Trợ lý AI được tích hợp phác đồ điều trị Bộ Y Tế, sẵn sàng giải đáp 24/7 thắc mắc về triệu chứng, hướng dẫn chuẩn bị nhịn ăn trước xét nghiệm và hỗ trợ kết nối đặt lịch khám với bác sĩ chuyên khoa.',
            },
          ].map((faq, i) => (
            <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
              <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-1">
                <HelpCircle className="w-4 h-4 text-[#0084c7] shrink-0" />
                <span>{faq.q}</span>
              </h5>
              <p className="text-slate-600 leading-relaxed pl-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
