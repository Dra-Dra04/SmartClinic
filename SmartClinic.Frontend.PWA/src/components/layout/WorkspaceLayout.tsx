import { HospitalBrand } from '../common/HospitalBrand';
import React, { useEffect } from 'react';
import { AccountAvatar } from '../common/AccountAvatar';
import { useAuthStore } from '../../store/useAuthStore';
import { useClinicStore } from '../../store/useClinicStore';
import { 
  Home,
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
  Users,
  Newspaper
} from 'lucide-react';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  onOpenPortal?: () => void;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ children, onOpenPortal }) => {
  const { currentUser, activeRole, activeDoctorId, setActiveDoctorId, setDemoState, isDemo, logout } = useAuthStore();
  const { currentWorkspaceNav, setWorkspaceNav } = useClinicStore();

  const isReceptionist = activeRole === 'receptionist';
  const isDoctor = activeRole === 'doctor_primary' || activeRole === 'doctor_imaging';
  const isAdmin = activeRole === 'admin';
  const hasScrollableTable = (isReceptionist && !isDemo) || isAdmin && ['departments', 'doctors', 'schedules', 'user_management', 'news_management', 'rag_kb', 'master_data', 'audit_logs', 'appointments'].includes(currentWorkspaceNav);

  // Navigation Items per Role
  const receptionistMenu = [
    { id: 'appointments', label: 'Quản lý & Duyệt lịch hẹn', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'walkin', label: 'Đón tiếp Khách vãng lai (Walk-in)', icon: <UserPlus className="w-4 h-4" /> },
    { id: 'queue', label: 'Tiếp nhận & Check-in', icon: <Clock className="w-4 h-4" /> },
  ];

  const doctorMenu = [
    { id: 'emr_workspace', label: 'Bàn khám Bệnh án EMR', icon: <Stethoscope className="w-4 h-4" /> },
    { id: 'subclinical_orders', label: 'Phiếu Cận lâm sàng Khoa', icon: <Scan className="w-4 h-4" /> },
  ];

  const adminMenu = [
    ...(!isDemo ? [{ id: 'appointments', label: 'Quản lý & Duyệt lịch hẹn', icon: <CalendarCheck className="w-4 h-4" /> }] : []),
    { id: 'analytics', label: 'Dashboard Thống kê HIS', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'user_management', label: 'Quản lý Tài khoản & Phân quyền', icon: <Users className="w-4 h-4" /> },
    { id: 'news_management', label: 'Quản lý Tin tức & Bài báo', icon: <Newspaper className="w-4 h-4" /> },
    ...(!isDemo ? [
      { id: 'departments', label: 'Quản lý Khoa', icon: <Database className="w-4 h-4" /> },
      { id: 'doctors', label: 'Quản lý Hồ sơ Bác sĩ', icon: <Stethoscope className="w-4 h-4" /> },
      { id: 'schedules', label: 'Quản lý Ca khám', icon: <CalendarCheck className="w-4 h-4" /> },
    ] : []),
    { id: 'rag_kb', label: 'Quản trị Kho tri thức RAG', icon: <Sparkles className="w-4 h-4" /> },
    ...(isDemo ? [{ id: 'master_data', label: 'Quản lý Danh mục & Lịch trực', icon: <Database className="w-4 h-4" /> }] : []),
    { id: 'audit_logs', label: 'Nhật ký Kiểm toán (Audit Logs)', icon: <History className="w-4 h-4" /> },
  ];

  useEffect(() => {
    if (isDemo) return;
    setWorkspaceNav(isAdmin ? 'user_management' : isReceptionist ? 'appointments' : activeRole === 'doctor_imaging' ? 'subclinical_orders' : 'emr_workspace');
  }, [isDemo, isAdmin, isReceptionist, activeRole, setWorkspaceNav]);

  const activeMenuItems = isReceptionist ? receptionistMenu : isDoctor ? doctorMenu.filter(item => isDemo || item.id === (activeRole === 'doctor_imaging' ? 'subclinical_orders' : 'emr_workspace')) : adminMenu;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-[#F4F6F8] text-slate-800">
      
      {/* 1. FIXED LEFT SIDEBAR (260px) */}
      <aside className="w-[260px] flex-shrink-0 bg-white border-r border-slate-200/90 flex min-h-0 flex-col overflow-hidden shadow-xs z-30">
        
        {/* Top Branding & Context Section */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Logo Workspace Lockup */}
          <div className="p-4 border-b border-slate-100">
            <HospitalBrand compact />
            <p className="mt-1 pl-[50px] text-[10px] text-slate-400">
              {isReceptionist ? 'Phân hệ Tiếp đón Lễ tân' : isDoctor ? 'Phân hệ Lâm sàng EMR' : 'Trung tâm Quản trị'}
            </p>
          </div>

          {/* DOCTOR CONTEXT SWITCHER: On top of Doctor Sidebar! */}
          {isDoctor && isDemo && (
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
        <div className="shrink-0 p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200/80">
            <AccountAvatar src={currentUser.avatarUrl} className="size-8 rounded-lg" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">{currentUser.fullName}</h4>
              <p className="text-[10px] text-[#0072bc] font-semibold truncate">
                {isReceptionist ? 'Lễ tân tiếp đón' : isDoctor ? `Bác sĩ (${activeDoctorId})` : 'Quản trị viên'}
              </p>
            </div>
          </div>

          {isAdmin && onOpenPortal && <button type="button" onClick={onOpenPortal}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-[#0084c7] hover:bg-sky-100">
            <Home className="size-4" /> Về trang chủ
          </button>}

          <button
            onClick={() => isDemo ? setDemoState(1) : logout()}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isDemo ? 'Thoát phiên demo' : 'Đăng xuất'}</span>
          </button>
        </div>

      </aside>

      {/* 2. RIGHT WORKSPACE CONTENT VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        
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
            <div className="text-slate-500 text-[11px]">
              Phòng khám: <strong>{isDoctor ? (activeDoctorId === 'DOC-01' ? 'P.102 Tiêu hóa' : 'P.204 CĐHA') : 'Khu vực Tiếp đón'}</strong>
            </div>
          </div>

        </header>

        {/* WORKSPACE MAIN BODY */}
        <div className={`flex-1 min-h-0 p-6 ${hasScrollableTable ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}>
          {children}
        </div>

      </div>

    </div>
  );
};
