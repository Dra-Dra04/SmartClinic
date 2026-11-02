import React, { useState } from 'react';
import { DOCTORS_DATA, SPECIALTIES_DATA } from '../../../services/mockData';
import { Doctor } from '../../../types';
import { 
  ArrowLeft, 
  Search, 
  Star, 
  MapPin, 
  Calendar, 
  Award, 
  Stethoscope,
  Filter
} from 'lucide-react';

interface DoctorsDirectoryTemplateProps {
  onSelectDoctor: (doctor: Doctor) => void;
  onBack: () => void;
}

export const DoctorsDirectoryTemplate: React.FC<DoctorsDirectoryTemplateProps> = ({
  onSelectDoctor,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>('all');

  const filteredDoctors = DOCTORS_DATA.filter((doc) => {
    const matchesSearch = 
      doc.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialtyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialtyId === 'all' || doc.specialtyId === selectedSpecialtyId;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 shadow-2xs hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Đội Ngũ Bác Sĩ Chuyên Khoa</h1>
            <p className="text-xs text-slate-500">Giàu kinh nghiệm từ các bệnh viện tuyến trung ương (Bạch Mai, Việt Đức, ĐH Y Hà Nội)</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên bác sĩ, chuyên khoa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0084c7]/30"
            />
          </div>

          <select
            value={selectedSpecialtyId}
            onChange={(e) => setSelectedSpecialtyId(e.target.value)}
            className="py-2 px-3 text-xs border border-slate-200 rounded-xl bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0084c7]/30"
          >
            <option value="all">Tất cả chuyên khoa</option>
            {SPECIALTIES_DATA.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doc) => (
          <div
            key={doc.id}
            className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xl hover:-translate-y-1 hover:border-[#0084c7] transition-all duration-300 flex flex-col justify-between group"
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
                  <span>Kinh nghiệm: <strong>{doc.experienceYears} năm</strong></span>
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

    </div>
  );
};
