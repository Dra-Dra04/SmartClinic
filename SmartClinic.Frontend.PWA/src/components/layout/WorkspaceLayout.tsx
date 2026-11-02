import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useClinicStore } from '../../store/useClinicStore';
import { 
  Activity, 
  CalendarCheck, 
  UserPlus, 
  Clock, 
  Stethoscope, 
  Scan, 
  BarChart3, 
  Sparkles, 
  Database, 
  History, 
  ShieldCheck, 
  LogOut,
  ChevronRight,
  Server,
  Users,
  Newspaper
} from 'lucide-react';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ children }) => {
  const { currentUser, activeRole, activeDoctorId, setActiveDoctorId, setDemoState } = useAuthStore();
  const { currentWorkspaceNav, setWorkspaceNav } = useClinicStore();

  const isReceptionist = activeRole === 'receptionist';
  const isDoctor = activeRole === 'doctor_primary' || activeRole === 'doctor_imaging';
  const isAdmin = activeRole === 'admin';

  // Navigation Items per Role
  const receptionistMenu = [
    { id: 'appointments', label: 'Quản lý & Duyệt lịch hẹn', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'walkin', label: 'Đón tiếp Khách vãng lai (Walk-in)', icon: <UserPlus className="w-4 h-4" /> },
    { id: 'queue', label: 'Bảng Điều phối Hàng chờ', icon: <Clock className="w-4 h-4" /> },
  ];

  const doctorMenu = [
    { id: 'emr_workspace', label: 'Bàn khám Bệnh án EMR', icon: <Stethoscope className="w-4 h-4" /> },
    { id: 'subclinical_orders', label: 'Phiếu Cận lâm sàng Khoa', icon: <Scan className="w-4 h-4" /> },
  ];

  const adminMenu = [
    { id: 'analytics', label: 'Dashboard Thống kê HIS', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'user_management', label: 'Quản lý Tài khoản & Phân quyền', icon: <Users className="w-4 h-4" /> },
    { id: 'news_management', label: 'Quản lý Tin tức & Bài báo', icon: <Newspaper className="w-4 h-4" /> },
    { id: 'rag_kb', label: 'Quản trị Kho tri thức RAG', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'master_data', label: 'Quản lý Danh mục & Lịch trực', icon: <Database className="w-4 h-4" /> },
    { id: 'audit_logs', label: 'Nhật ký Kiểm toán (Audit Logs)', icon: <History className="w-4 h-4" /> },
  ];

  const activeMenuItems = isReceptionist ? receptionistMenu : isDoctor ? doctorMenu : adminMenu;

  return (
    <div className="min-h-screen flex bg-[#F4F6F8] text-slate-800">
      
      {/* 1. FIXED LEFT SIDEBAR (260px) */}
      <aside className="w-[260px] flex-shrink-0 bg-white border-r border-slate-200/90 flex flex-col justify-between shadow-xs z-30">
        
        {/* Top Branding & Context Section */}
        <div>
          {/* Logo Workspace Lockup */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#005a8b] to-[#0084c7] flex items-center justify-center text-white shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-[#005a8b] tracking-tight">BV Phúc An</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-100 text-[#005a8b] rounded">
                  HIS PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {isReceptionist ? 'Phân hệ Tiếp đón Lễ tân' : isDoctor ? 'Phân hệ Lâm sàng EMR' : 'Trung tâm Quản trị'}
              </p>
            </div>
          </div>

          {/* DOCTOR CONTEXT SWITCHER: On top of Doctor Sidebar! */}
          {isDoctor && (
            <div className="p-3 bg-slate-50 border-b border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                Ngữ cảnh Bác sĩ đăng nhập
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveDoctorId('DOC-01')}
                  className={`p-2 rounded-xl text-left transition flex flex-col ${
                    activeDoctorId === 'DOC-01'
                      ? 'bg-[#0084c7] text-white shadow-xs ring-1 ring-blue-300'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[11px] font-bold">BS. Tuấn</span>
                  <span className={`text-[9px] ${activeDoctorId === 'DOC-01' ? 'text-blue-100' : 'text-slate-500'}`}>
                    Khám chính (DOC-01)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDoctorId('DOC-02')}
                  className={`p-2 rounded-xl text-left transition flex flex-col ${
                    activeDoctorId === 'DOC-02'
                      ? 'bg-purple-600 text-white shadow-xs ring-1 ring-purple-300'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[11px] font-bold">BS. Hoàng</span>
                  <span className={`text-[9px] ${activeDoctorId === 'DOC-02' ? 'text-purple-100' : 'text-slate-500'}`}>
                    Cận lâm sàng (DOC-02)
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 block mb-1">
              Chức năng chuyên môn
            </span>
            {activeMenuItems.map((item) => {
              const isActive = currentWorkspaceNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setWorkspaceNav(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition ${
                    isActive
                      ? 'bg-blue-50 text-[#005a8b] font-bold border-l-4 border-[#0084c7] shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={isActive ? 'text-[#0084c7]' : 'text-slate-400'}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Info & Back to Public Portal */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200/80">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80'}
              alt={currentUser.fullName}
              className="w-8 h-8 rounded-lg object-cover border border-blue-300"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">{currentUser.fullName}</h4>
              <p className="text-[10px] text-[#0072bc] font-semibold truncate">
                {isReceptionist ? 'Lễ tân tiếp đón' : isDoctor ? `Bác sĩ (${activeDoctorId})` : 'Quản trị viên'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setDemoState(1)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Về Cổng thông tin (Portal)</span>
          </button>
        </div>

      </aside>

      {/* 2. RIGHT WORKSPACE CONTENT VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* THIN TOPBAR */}
        <header className="h-12 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between gap-4 flex-shrink-0">
          
          {/* Left Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="font-bold text-slate-800">
              {isReceptionist ? 'Bàn Lễ tân' : isDoctor ? `Bàn khám ${activeDoctorId}` : 'Quản trị Hệ thống'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[#005a8b] font-bold capitalize">
              {activeMenuItems.find(i => i.id === currentWorkspaceNav)?.label || currentWorkspaceNav}
            </span>
          </div>

          {/* Right Status Badges */}
          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-[#005a8b] rounded-lg border border-blue-200 text-[11px] font-bold">
              <Server className="w-3.5 h-3.5 text-[#0084c7]" />
              <span>Gateway .NET 8: Đã kết nối</span>
            </div>

            <div className="text-slate-500 text-[11px]">
              Phòng khám: <strong>{isDoctor ? (activeDoctorId === 'DOC-01' ? 'P.102 Tiêu hóa' : 'P.204 CĐHA') : 'Khu vực Tiếp đón'}</strong>
            </div>
          </div>

        </header>

        {/* WORKSPACE MAIN BODY */}
        <div className="flex-1 p-6">
          {children}
        </div>

      </div>

    </div>
  );
};
