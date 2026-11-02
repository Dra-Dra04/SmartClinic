import React from 'react';
import { Activity, Phone, Mail, MapPin, Clock, ShieldCheck, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 text-xs border-t border-slate-800">
      {/* Top Footer Banner */}
      <div className="bg-[#0072bc] text-white py-6 border-b border-[#005a8b]">
        <div className="w-full px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/30">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Bệnh viện Đa khoa Quốc tế Phúc An • SmartClinic</h3>
              <p className="text-blue-100 text-xs">
                Cổng Thông tin Điện tử Khám chữa bệnh & Trợ lý Y tế AI RAG theo tiêu chuẩn HIS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-blue-100">
              <Award className="w-4 h-4 text-amber-300" /> Chứng nhận ISO 15189:2022
            </span>
            <span className="flex items-center gap-1.5 text-blue-100">
              <ShieldCheck className="w-4 h-4 text-emerald-300" /> Giấy phép BYT: 0458/BYT-GPHĐ
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="w-full px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Col 1: About */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00a8e8]" />
            <span>Về Bệnh Viện Phúc An</span>
          </h4>
          <p className="text-slate-400 leading-relaxed text-xs">
            Bệnh viện Đa khoa Quốc tế Phúc An là cơ sở y tế đa khoa uy tín chất lượng cao trực thuộc Bộ Y Tế, tiên phong số hóa bệnh án điện tử EMR và ứng dụng Trợ lý AI Y tế RAG tư vấn phác đồ chuẩn mực.
          </p>
          <div className="text-slate-400 space-y-1 text-xs">
            <p><strong>Cơ quan chủ quản:</strong> BỘ Y TẾ</p>
            <p><strong>Giám đốc chuyên môn:</strong> PGS.TS.BS Nguyễn Minh Tuấn</p>
            <p><strong>Giấy phép BYT:</strong> Số 0458/BYT-GPHĐ cấp ngày 15/01/2021</p>
          </div>
        </div>

        {/* Col 2: Contact */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00a8e8]" />
            <span>Thông tin & Đường dây nóng</span>
          </h4>
          <ul className="space-y-2 text-slate-400 text-xs">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#00a8e8] shrink-0 mt-0.5" />
              <span>Số 124 Vũ Trọng Phụng, Thanh Xuân, Hà Nội</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Cấp cứu 24/7: <strong className="text-amber-300 font-mono">1900 6868</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Khám theo yêu cầu: <strong className="text-white font-mono">0963 590 006 / 0243 225 2442</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Khám BHYT: <strong className="text-white font-mono">0962 535 329</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>hotro@smartclinic.vn</span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Thứ 2 - Thứ 6: 07:30 - 17:00 | T7: 07:30 - 12:00</span>
            </li>
          </ul>
        </div>

        {/* Col 3: Key Specialties */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Chuyên khoa mũi nhọn</h4>
          <ul className="space-y-1.5 text-slate-400">
            <li>• Khoa Tiêu hóa - Gan mật (Nội soi NBI)</li>
            <li>• Khoa Tim mạch & Quản lý Huyết áp</li>
            <li>• Khoa Tai Mũi Họng (Nội soi ống mềm)</li>
            <li>• Khoa Cơ Xương Khớp & Thoái hóa</li>
            <li>• Khoa Nội Thần Kinh & Phòng ngừa Đột quỵ</li>
            <li>• Trung tâm Xét nghiệm & Chẩn đoán hình ảnh</li>
          </ul>
        </div>

        {/* Col 4: Medical Disclaimer */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Miễn trừ Y tế & Trợ lý AI</h4>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px] leading-relaxed text-slate-400">
            Trợ lý AI Y tế sử dụng mô hình RAG chỉ nhằm mục đích cung cấp thông tin y khoa tham khảo và hỗ trợ định hướng chuyên khoa, đặt lịch khám. Trợ lý AI không thay thế cho chẩn đoán hoặc phác đồ kê đơn trực tiếp từ bác sĩ chuyên môn.
          </div>
          <p className="text-slate-500 text-[11px]">
            Hệ thống hỗ trợ PWA cài đặt tức thì trên điện thoại không cần qua App Store/Google Play.
          </p>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="w-full px-4 sm:px-6 py-4 border-t border-slate-800 text-center text-slate-500 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 SmartClinic HIS. Bản quyền thuộc về Đồ án Hệ thống Quản lý Phòng khám Đa khoa Thông minh.</p>
        <p>Tuân thủ Quyết định 4888/QĐ-BYT về Tiêu chí CNTT Bệnh viện & Phòng khám Đa khoa.</p>
      </div>
    </footer>
  );
};
