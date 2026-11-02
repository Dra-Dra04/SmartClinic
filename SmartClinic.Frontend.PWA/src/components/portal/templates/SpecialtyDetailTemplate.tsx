import React from 'react';
import { Specialty, Doctor } from '../../../types';
import { DOCTORS_DATA, CLINICAL_SERVICES_CATALOG } from '../../../services/mockData';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Star, 
  MapPin, 
  Activity, 
  Award, 
  HeartPulse,
  Sparkles,
  ChevronRight,
  Stethoscope
} from 'lucide-react';

interface SpecialtyDetailTemplateProps {
  specialty: Specialty;
  onBack: () => void;
  onSelectDoctor: (doctor: Doctor) => void;
  onBookSpecialty: (specialty: Specialty) => void;
}

export const SpecialtyDetailTemplate: React.FC<SpecialtyDetailTemplateProps> = ({
  specialty,
  onBack,
  onSelectDoctor,
  onBookSpecialty,
}) => {
  // Doctors in this specialty
  const doctorsInSpecialty = DOCTORS_DATA.filter(
    (d) => d.specialtyId === specialty.id || d.specialtyName.includes(specialty.name)
  );

  // Fallback if none directly matched, show top relevant
  const displayedDoctors = doctorsInSpecialty.length > 0 ? doctorsInSpecialty : DOCTORS_DATA.slice(0, 2);

  // Relevant clinical services
  const relevantServices = CLINICAL_SERVICES_CATALOG.filter(
    (s) => s.department.toLowerCase().includes(specialty.name.toLowerCase().replace('khoa ', '')) ||
           specialty.name.toLowerCase().includes(s.department.toLowerCase().replace('khoa ', ''))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10 animate-in fade-in duration-300">
      
      {/* 1. TOP BREADCRUMB & BACK BUTTON */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#0084c7] transition shadow-2xs group"
        >
          <ArrowLeft className="w-4 h-4 text-[#0084c7] group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại Cổng thông tin</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span className="text-slate-400">Trang chủ</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-400">Chuyên khoa</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-[#0084c7]">{specialty.name}</span>
        </div>
      </div>

      {/* 2. SPECIALTY HERO BANNER (Chuyển sang màu xanh dương chuẩn bệnh viện #0084c7) */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#005a8b] via-[#0072bc] to-[#0084c7] text-white p-8 sm:p-10 shadow-lg">
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
              MÃ KHOA: {specialty.code}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white">
              {displayedDoctors.length} Bác sĩ chuyên gia
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {specialty.name}
          </h1>

          <p className="text-sm sm:text-base text-blue-100 leading-relaxed font-normal">
            {specialty.description}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
            <div className="bg-white/15 backdrop-blur-xs px-3.5 py-2 rounded-xl flex items-center gap-2 border border-white/20">
              <Clock className="w-4 h-4 text-amber-300" />
              <span>Thời gian tiếp nhận: <strong>07:30 - 17:00 (T2 - T7)</strong></span>
            </div>
            <div className="bg-white/15 backdrop-blur-xs px-3.5 py-2 rounded-xl flex items-center gap-2 border border-white/20">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Chi phí khám ban đầu: <strong className="font-mono text-amber-300">{specialty.consultationFee.toLocaleString('vi-VN')} đ</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KEY HIGHLIGHTS & MEDICAL SCOPE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084c7] flex items-center justify-center font-bold">
            <HeartPulse className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Phạm Vi Chẩn Đoán & Điều Trị</h3>
          <ul className="space-y-2 text-xs text-slate-600">
            {specialty.highlightPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0084c7] mt-1.5 shrink-0" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084c7] flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Trang Thiết Bị Hiện Đại</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hệ thống máy móc nhập khẩu từ Đức, Thụy Sĩ và Nhật Bản (Olympus NBI phóng đại 100 lần, máy chụp X-quang kỹ thuật số DR liều tia thấp, siêu âm Doppler màu 4D).
          </p>
          <div className="text-[11px] font-semibold text-[#0084c7]">
            ✓ Trả kết quả số hóa qua hệ thống PACS
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Đặt Lịch Nhanh Chóng</h3>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              Đặt lịch trực tuyến trước để giảm tối đa thời gian chờ đợi. Lựa chọn đúng bác sĩ và khung giờ 30 phút theo yêu cầu.
            </p>
          </div>
          <button
            onClick={() => onBookSpecialty(specialty)}
            className="w-full py-2.5 bg-[#0084c7] hover:bg-[#0073ae] text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95"
          >
            Đặt lịch khám khoa này ngay
          </button>
        </div>
      </div>

      {/* 4. DOCTORS CURRENTLY IN THIS SPECIALTY (Đội ngũ bác sĩ hiện có trong khoa) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold text-[#0084c7] uppercase tracking-widest bg-blue-50 px-3 py-0.5 rounded-full border border-blue-200">
              Đội Ngũ Chuyên Môn
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Bác Sĩ Hiện Có Trong {specialty.name}
            </h2>
            <p className="text-xs text-slate-500">
              Đội ngũ bác sĩ đầu ngành, tu nghiệp trong và ngoài nước trực tiếp thăm khám và kê đơn.
            </p>
          </div>

          <button
            onClick={() => onBookSpecialty(specialty)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-[#0084c7] hover:bg-blue-100 border border-blue-200 rounded-xl font-bold text-xs transition"
          >
            <Calendar className="w-4 h-4 text-[#0084c7]" />
            <span>Xem lịch khám cả khoa</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedDoctors.map((doc) => (
            <div
              key={doc.id}
              className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between group hover:border-[#0084c7]"
            >
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={doc.avatarUrl}
                    alt={doc.fullName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#0084c7] group-hover:scale-105 transition"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-[#0084c7] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {doc.title}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{doc.fullName}</h3>
                    <p className="text-xs text-slate-500 font-semibold">{doc.specialtyName}</p>
                    <div className="flex items-center text-amber-500 text-xs font-bold mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                      <span>{doc.rating}</span>
                      <span className="text-slate-400 font-normal ml-1">({doc.reviewCount} đánh giá)</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">
                  {doc.bio}
                </p>

                <div className="space-y-1.5 text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#0084c7] shrink-0" />
                    <span>Phòng khám: <strong>{doc.roomNumber}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-[#0084c7] shrink-0" />
                    <span>Kinh nghiệm: <strong>{doc.experienceYears} năm lâm sàng</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#0084c7] shrink-0" />
                    <span>Lịch trực: <strong>{doc.availableDays.join(', ')}</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectDoctor(doc)}
                className="w-full py-2.5 bg-[#0084c7] hover:bg-[#0073ae] text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Đặt lịch với {doc.title} {doc.fullName.split(' ').slice(-1)[0]}</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 5. SERVICES OF THIS SPECIALTY */}
      {relevantServices.length > 0 && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Dịch vụ Kỹ thuật & Cận lâm sàng Thuộc Khoa
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0084c7] text-white font-bold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Mã kỹ thuật</th>
                  <th className="py-2.5 px-3">Tên dịch vụ</th>
                  <th className="py-2.5 px-3">Thời gian trả KQ</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Đơn giá niêm yết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {relevantServices.map((serv) => (
                  <tr key={serv.code} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{serv.code}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{serv.name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{serv.estimatedMinutes} phút</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#0084c7] text-sm">
                      {serv.price.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </div>
  );
};
