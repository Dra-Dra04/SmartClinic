import React, { useState } from 'react';
import { CLINICAL_SERVICES_CATALOG } from '../../../services/mockData';
import { 
  ArrowLeft, 
  Search, 
  Receipt, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  CalendarPlus 
} from 'lucide-react';

interface PricingServicesTemplateProps {
  onBack: () => void;
  onBookService?: () => void;
}

export const PricingServicesTemplate: React.FC<PricingServicesTemplateProps> = ({
  onBack,
  onBookService,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'X-Quang kỹ thuật số', 'Siêu âm màu', 'Nội soi tiêu hóa', 'Xét nghiệm máu', 'Xét nghiệm sinh hóa'];

  const filteredServices = CLINICAL_SERVICES_CATALOG.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 shadow-2xs hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Bảng Giá Dịch Vụ & Cận Lâm Sàng</h1>
            <p className="text-xs text-slate-500">Công khai minh bạch theo quy định của Sở Y tế Hà Nội • Cập nhật quý IV/2026</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm tên dịch vụ, xét nghiệm, nội soi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0084c7]/30"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategory === cat
                ? 'bg-[#0084c7] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat === 'all' ? 'Tất cả dịch vụ' : cat}
          </button>
        ))}
      </div>

      {/* Pricing Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mã DV</th>
                <th className="py-3 px-4">Tên dịch vụ kỹ thuật</th>
                <th className="py-3 px-4">Khoa thực hiện</th>
                <th className="py-3 px-4">Thời gian trả KQ</th>
                <th className="py-3 px-4">BHYT hỗ trợ</th>
                <th className="py-3 px-4 text-right">Đơn giá niêm yết</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.map((serv) => (
                <tr key={serv.code} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#005a8b]">{serv.code}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{serv.name}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{serv.description}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{serv.department}</td>
                  <td className="py-3.5 px-4 text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{serv.estimatedMinutes} phút</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#005a8b] border border-blue-200">
                      <CheckCircle2 className="w-3 h-3 text-[#0084c7]" /> Có thanh toán
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0072bc] text-sm">
                    {serv.price.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={onBookService}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-[#005a8b] border border-blue-200 rounded-lg font-bold text-[11px] transition"
                    >
                      Đặt khám
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
