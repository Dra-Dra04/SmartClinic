import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { DemoStateId } from '../../types';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  ClipboardList, 
  Stethoscope, 
  ShieldCheck, 
  Sparkles,
  Layers
} from 'lucide-react';

export const DemoRoleSwitcherBar: React.FC = () => {
  const { demoStateId, setDemoState, activeDoctorId, setActiveDoctorId } = useAuthStore();

  const demoRoles: {
    id: DemoStateId;
    label: string;
    subtext: string;
    icon: React.ReactNode;
    colorClass: string;
    layoutType: 'PORTAL' | 'WORKSPACE';
  }[] = [
    {
      id: 1,
      label: '1. Khách (Guest)',
      subtext: 'Chưa đăng nhập • Cổng thông tin',
      icon: <Users className="w-3.5 h-3.5" />,
      colorClass: 'hover:bg-slate-700',
      layoutType: 'PORTAL',
    },
    {
      id: 2,
      label: '2. Bệnh nhân (Mới ĐK)',
      subtext: 'Chưa hồ sơ • Chốt Onboarding Gate',
      icon: <UserPlus className="w-3.5 h-3.5" />,
      colorClass: 'hover:bg-amber-600',
      layoutType: 'PORTAL',
    },
    {
      id: 3,
      label: '3. Bệnh nhân (Đủ hồ sơ)',
      subtext: 'Trần Văn An • Đặt lịch & EMR',
      icon: <UserCheck className="w-3.5 h-3.5" />,
      colorClass: 'hover:bg-emerald-600',
      layoutType: 'PORTAL',
    },
    {
      id: 4,
      label: '4. Lễ tân (Receptionist)',
      subtext: 'Check-in STT & Điều phối Hàng chờ',
      icon: <ClipboardList className="w-3.5 h-3.5" />,
      colorClass: 'hover:bg-blue-600',
      layoutType: 'WORKSPACE',
    },
    {
      id: 5,
      label: '5. Bác sĩ (Khoa Nội / CĐHA)',
      subtext: 'EMR, Cận lâm sàng & Kê đơn',
      icon: <Stethoscope className="w-3.5 h-3.5" />,
      colorClass: 'hover:bg-purple-600',
      layoutType: 'WORKSPACE',
    },
    {
      id: 6,
      label: '6. Quản trị viên (Admin)',
      subtext: 'KPIs, Tri thức RAG & Audit Logs',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      colorClass: 'hover:bg-rose-600',
      layoutType: 'WORKSPACE',
    },
  ];

  return (
    <div className="sticky top-0 z-50 bg-slate-950 text-white text-[11px] border-b border-slate-800 shadow-md">
      <div className="w-full px-2 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        
        {/* Left Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/20 text-sky-300 font-bold border border-blue-500/30">
            <Layers className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider text-[10px]">Demo Role Switcher</span>
          </div>
          <span className="hidden xl:inline text-slate-400 text-[10px]">
            Chuyển nhanh ngữ cảnh để chấm điểm bảo vệ đồ án:
          </span>
        </div>

        {/* 6 Quick Pill Buttons */}
        <div className="flex items-center flex-wrap gap-1.5">
          {demoRoles.map((role) => {
            const isActive = demoStateId === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setDemoState(role.id)}
                title={role.subtext}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition active:scale-95 text-[11px] ${
                  isActive
                    ? 'bg-[#0084c7] text-white shadow-xs font-bold ring-1 ring-blue-300'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 ' + role.colorClass
                }`}
              >
                {role.icon}
                <span>{role.label}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                  role.layoutType === 'PORTAL' ? 'bg-slate-800 text-sky-300' : 'bg-slate-800 text-blue-300'
                }`}>
                  {role.layoutType}
                </span>
              </button>
            );
          })}
        </div>

        {/* Fast Doctor Context Quick-Switch when in Doctor Role (5) */}
        {demoStateId === 5 && (
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-purple-500/30">
            <span className="text-[10px] text-purple-300 font-bold">Bác sĩ:</span>
            <button
              onClick={() => setActiveDoctorId('DOC-01')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activeDoctorId === 'DOC-01' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              DOC-01 (Tiêu hóa)
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => setActiveDoctorId('DOC-02')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activeDoctorId === 'DOC-02' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              DOC-02 (CĐHA)
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
