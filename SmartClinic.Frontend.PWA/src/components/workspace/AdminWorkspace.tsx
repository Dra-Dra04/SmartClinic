import React, { useState } from 'react';
import { useClinicStore } from '../../store/useClinicStore';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  SPECIALTIES_DATA, 
  DOCTORS_DATA, 
  CLINICAL_SERVICES_CATALOG, 
  MEDICINES_CATALOG 
} from '../../services/mockData';
import { AuditLog, HospitalUser, HospitalArticle, UserRole } from '../../types';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Clock, 
  Calendar, 
  Sparkles, 
  Database, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  FileText, 
  Eye, 
  ToggleLeft, 
  ToggleRight, 
  ShieldCheck, 
  X, 
  TrendingUp,
  Cpu,
  Layers,
  ArrowUpRight,
  FileCheck,
  Newspaper,
  UserPlus,
  Key,
  Lock,
  Unlock,
  Shield,
  Edit3,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  Globe,
  Pin,
  Image as ImageIcon,
  Check
} from 'lucide-react';

export const AdminWorkspace: React.FC = () => {
  const { 
    currentWorkspaceNav, 
    ragDocuments, 
    auditLogs, 
    timeSlots,
    visits,
    appointments,
    users,
    articles,
    toggleRagDocActive, 
    approveAndIndexRagDoc, 
    addRagDoc,
    updateTimeSlotCapacity,
    updateUserRole,
    toggleUserStatus,
    createUser,
    deleteUser,
    createArticle,
    updateArticle,
    deleteArticle,
    togglePublishArticle,
    toggleFeatureArticle
  } = useClinicStore();
  const { currentUser } = useAuthStore();

  // Audit Diff Modal State
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);

  // New RAG Doc Modal State
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<'Phác đồ điều trị' | 'Quy trình lâm sàng' | 'Hướng dẫn sử dụng thuốc' | 'Quy định bảo hiểm & viện phí'>('Phác đồ điều trị');
  const [newDocSummary, setNewDocSummary] = useState('');
  const [newDocSource, setNewDocSource] = useState('Bộ Y Tế Việt Nam');
  const [newDocChunks, setNewDocChunks] = useState(42);

  // Master Data sub-tab
  const [masterSubTab, setMasterSubTab] = useState<'slots' | 'specialties' | 'doctors' | 'services' | 'medicines'>('slots');

  // =========================================================================
  // STATE: USER & ROLE PERMISSION MANAGEMENT
  // =========================================================================
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');

  // Modal: Role Change / Permissions Granting
  const [selectedUserForRole, setSelectedUserForRole] = useState<HospitalUser | null>(null);
  const [tempNewRole, setTempNewRole] = useState<UserRole>('patient');
  const [tempDepartment, setTempDepartment] = useState('');

  // Modal: Add New User
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('doctor_primary');
  const [newUserDept, setNewUserDept] = useState('Khoa Nội Tổng Quát');
  const [newUserIdCard, setNewUserIdCard] = useState('');

  // =========================================================================
  // STATE: NEWS & ARTICLES MANAGEMENT
  // =========================================================================
  const [newsSearchQuery, setNewsSearchQuery] = useState('');
  const [newsCategoryFilter, setNewsCategoryFilter] = useState<string>('all');
  const [newsStatusFilter, setNewsStatusFilter] = useState<string>('all');

  // Modal: Add / Edit Article
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleCategory, setArticleCategory] = useState<HospitalArticle['category']>('Hoạt động Bệnh viện');
  const [articleAuthor, setArticleAuthor] = useState('Phòng Kế hoạch Tổng hợp');
  const [articleDate, setArticleDate] = useState(new Date().toLocaleDateString('vi-VN'));
  const [articleImage, setArticleImage] = useState('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80');
  const [articleSummary, setArticleSummary] = useState('');
  const [articleContentText, setArticleContentText] = useState('');
  const [articleIsPublished, setArticleIsPublished] = useState(true);
  const [articleIsFeatured, setArticleIsFeatured] = useState(true);

  // Modal: Preview Article
  const [previewArticle, setPreviewArticle] = useState<HospitalArticle | null>(null);

  // Presets of medical article images
  const sampleArticleImages = [
    { name: 'Kỹ thuật y khoa', url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80' },
    { name: 'Bác sĩ & Khám bệnh', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80' },
    { name: 'Hội nghị khoa học', url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80' },
    { name: 'Phòng phẫu thuật', url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80' },
    { name: 'Cấp cứu 24/7', url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80' },
  ];

  // In-app Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // User Handlers
  const handleOpenRoleModal = (u: HospitalUser) => {
    setSelectedUserForRole(u);
    setTempNewRole(u.role);
    setTempDepartment(u.department || '');
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForRole) return;
    updateUserRole(selectedUserForRole.id, tempNewRole, tempDepartment, currentUser.fullName);
    showToast(`Đã cập nhật quyền thành công cho người dùng "${selectedUserForRole.fullName}"!`, 'success');
    setSelectedUserForRole(null);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showToast('Vui lòng nhập họ tên và email', 'error');
      return;
    }
    createUser({
      fullName: newUserName,
      email: newUserEmail,
      phone: newUserPhone || '0901234567',
      role: newUserRole,
      status: 'ACTIVE',
      department: newUserDept,
      idCardNumber: newUserIdCard,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    }, currentUser.fullName);

    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserIdCard('');
    showToast(`Đã tạo tài khoản cho "${newUserName}" thành công!`, 'success');
  };

  // Article Handlers
  const handleOpenAddArticle = () => {
    setEditingArticleId(null);
    setArticleTitle('');
    setArticleCategory('Hoạt động Bệnh viện');
    setArticleAuthor('Phòng Kế hoạch Tổng hợp');
    setArticleDate(new Date().toLocaleDateString('vi-VN'));
    setArticleImage(sampleArticleImages[0].url);
    setArticleSummary('');
    setArticleContentText('');
    setArticleIsPublished(true);
    setArticleIsFeatured(true);
    setShowArticleModal(true);
  };

  const handleOpenEditArticle = (art: HospitalArticle) => {
    setEditingArticleId(art.id);
    setArticleTitle(art.title);
    setArticleCategory(art.category);
    setArticleAuthor(art.author);
    setArticleDate(art.date);
    setArticleImage(art.image);
    setArticleSummary(art.summary);
    setArticleContentText(art.content.join('\n\n'));
    setArticleIsPublished(art.isPublished);
    setArticleIsFeatured(art.isFeaturedOnHome);
    setShowArticleModal(true);
  };

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleTitle.trim() || !articleSummary.trim()) {
      showToast('Vui lòng nhập tiêu đề và tóm tắt bài viết', 'error');
      return;
    }
    const paragraphs = articleContentText
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const contentArray = paragraphs.length > 0 ? paragraphs : [articleSummary];

    if (editingArticleId) {
      updateArticle(editingArticleId, {
        title: articleTitle,
        category: articleCategory,
        author: articleAuthor,
        date: articleDate,
        image: articleImage,
        summary: articleSummary,
        content: contentArray,
        isPublished: articleIsPublished,
        isFeaturedOnHome: articleIsFeatured,
      }, currentUser.fullName);
      showToast('Đã cập nhật bài báo thành công!', 'success');
    } else {
      createArticle({
        title: articleTitle,
        category: articleCategory,
        author: articleAuthor,
        date: articleDate,
        image: articleImage,
        summary: articleSummary,
        content: contentArray,
        isPublished: articleIsPublished,
        isFeaturedOnHome: articleIsFeatured,
      }, currentUser.fullName);
      showToast('Đã đăng bài viết mới thành công! Bài viết đã được đồng bộ lên Cổng thông tin trang chủ.', 'success');
    }
    setShowArticleModal(false);
  };

  // User Filter Logic
  const filteredUsers = users.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    const matchSearch =
      !userSearchQuery ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (u.idCardNumber && u.idCardNumber.includes(q));

    const matchRole =
      userRoleFilter === 'all' ||
      (userRoleFilter === 'doctor' && (u.role === 'doctor_primary' || u.role === 'doctor_imaging')) ||
      u.role === userRoleFilter;

    const matchStatus = userStatusFilter === 'all' || u.status === userStatusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  // News Filter Logic
  const filteredArticles = articles.filter((a) => {
    const q = newsSearchQuery.toLowerCase();
    const matchSearch =
      !newsSearchQuery ||
      a.title.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q);

    const matchCat = newsCategoryFilter === 'all' || a.category === newsCategoryFilter;

    const matchStatus =
      newsStatusFilter === 'all' ||
      (newsStatusFilter === 'published' && a.isPublished) ||
      (newsStatusFilter === 'draft' && !a.isPublished) ||
      (newsStatusFilter === 'featured' && a.isFeaturedOnHome);

    return matchSearch && matchCat && matchStatus;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Quản trị viên (Admin)</span>;
      case 'doctor_primary':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#005a8b] border border-blue-200">Bác sĩ Khám chính</span>;
      case 'doctor_imaging':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Bác sĩ Cận lâm sàng</span>;
      case 'receptionist':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">Lễ tân Tiếp đón</span>;
      case 'patient':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Bệnh nhân</span>;
      case 'guest':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Khách vãng lai</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{role}</span>;
    }
  };

  // Handle Add Doc
  const handleCreateRagDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    addRagDoc({
      title: newDocTitle,
      documentCode: 'QD-BYT-2026-' + Math.floor(100 + Math.random() * 900),
      version: 'v1.0',
      category: newDocCategory,
      summary: newDocSummary || 'Tài liệu hướng dẫn lâm sàng bổ sung cho trợ lý AI y tế RAG.',
      source: newDocSource,
      chunkCount: newDocChunks,
      fileType: 'PDF',
      isActive: true,
      uploadedBy: currentUser.fullName,
    }, currentUser.fullName);

    setShowAddDocModal(false);
    setNewDocTitle('');
    setNewDocSummary('');
  };

  // Analytics Calculations
  const totalVisitsCount = visits.length;
  const totalApptsCount = appointments.length;
  const completedVisits = visits.filter(v => v.status === 'COMPLETED').length;
  const inProgressVisits = visits.filter(v => v.status === 'IN_EXAM_PRIMARY' || v.status === 'AWAITING_SUBCLINICAL' || v.status === 'RESULTS_READY').length;
  const estimatedRevenue = 28500000; // 28.5M VNĐ tổng doanh thu ước tính ca sáng
  
  // Format currency
  const formatVnd = (num: number) => num.toLocaleString('vi-VN') + ' đ';

  return (
    <div className="space-y-6">

      {/* =========================================================================
          TAB 1: ANALYTICS HIS DASHBOARD
      ========================================================================= */}
      {currentWorkspaceNav === 'analytics' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-[#0084c7]" />
                Dashboard Báo cáo & Thống kê Hoạt động Bệnh viện
              </h2>
              <p className="text-xs text-slate-500">
                Chỉ số thời gian thực từ phân hệ Tiếp đón, Khám bệnh EMR và Cận lâm sàng.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-medium shadow-2xs">
              <Calendar className="w-4 h-4 text-[#0084c7]" />
              <span>Hôm nay: {new Date().toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Tổng lượt khám */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng lượt đón tiếp</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#005a8b] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{totalVisitsCount + totalApptsCount}</span>
                <span className="text-xs font-bold text-[#0084c7] flex items-center">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +18.4%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {totalVisitsCount} tại chỗ & {totalApptsCount} đặt lịch trước
              </p>
            </div>

            {/* KPI 2: Doanh thu ước tính */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh thu tạm tính</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{formatVnd(estimatedRevenue)}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Bao gồm khám chuyên khoa + cận lâm sàng
              </p>
            </div>

            {/* KPI 3: Tỷ lệ đặt Online */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ đặt khám Online</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">76.5%</span>
                <span className="text-xs font-bold text-[#0084c7]">+5.2%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Giảm 45% thời gian chờ tại bàn lễ tân
              </p>
            </div>

            {/* KPI 4: Thời gian chờ TB */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian chờ TB</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">11.8 phút</span>
                <span className="text-xs font-bold text-[#0084c7]">-3.2p</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Chuẩn chỉ tiêu bệnh viện quốc tế &lt; 20p
              </p>
            </div>
          </div>

          {/* Charts & Status Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Lượt khám theo chuyên khoa */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Phân bổ Lượt khám theo Chuyên khoa</h3>
                  <p className="text-xs text-slate-500">Thống kê số lượng bệnh nhân thực tế trong ngày</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-[#005a8b] rounded-lg border border-blue-200">
                  Hôm nay
                </span>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Khoa Tiêu hóa - Gan mật', count: 48, percentage: 85, color: 'bg-[#0084c7]' },
                  { name: 'Khoa Tim mạch & Huyết áp', count: 36, percentage: 65, color: 'bg-[#0072bc]' },
                  { name: 'Khoa Chẩn đoán hình ảnh', count: 32, percentage: 58, color: 'bg-purple-600' },
                  { name: 'Khoa Nội Tổng Quát', count: 28, percentage: 50, color: 'bg-[#005a8b]' },
                  { name: 'Khoa Tai Mũi Họng', count: 22, percentage: 40, color: 'bg-amber-600' },
                  { name: 'Khoa Cơ Xương Khớp', count: 18, percentage: 32, color: 'bg-indigo-600' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700">{item.name}</span>
                      <span className="text-slate-900 font-bold">{item.count} lượt ({item.percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Tỷ lệ trạng thái khám */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Trạng thái Khám Lâm sàng</h3>
                <p className="text-xs text-slate-500 mb-6">Tiến độ phục vụ bệnh nhân trực tiếp tại các phòng</p>

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-[#0084c7]" />
                      <span className="text-xs font-bold text-[#005a8b]">Đã hoàn tất khám & kê đơn</span>
                    </div>
                    <span className="text-xs font-black text-[#005a8b]">{completedVisits} ca</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-xs font-bold text-blue-950">Đang khám / Chờ CLS</span>
                    </div>
                    <span className="text-xs font-black text-blue-800">{inProgressVisits} ca</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-xs font-bold text-amber-950">Đang trong hàng chờ</span>
                    </div>
                    <span className="text-xs font-black text-amber-800">
                      {visits.filter(v => v.status === 'WAITING_EXAM').length} ca
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-slate-400" />
                      <span className="text-xs font-bold text-slate-700">Lịch hẹn đã đặt trước</span>
                    </div>
                    <span className="text-xs font-black text-slate-800">{appointments.length} hẹn</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Khả năng đáp ứng tải:</span>
                <span className="font-bold text-[#0072bc]">92% công suất</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: USER & ROLE PERMISSION MANAGEMENT (QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN)
      ========================================================================= */}
      {currentWorkspaceNav === 'user_management' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-6 h-6 text-[#0084c7]" />
                Quản lý Tài khoản & Phân quyền Hệ thống HIS
              </h2>
              <p className="text-xs text-slate-500">
                Xem danh sách tài khoản người dùng, cấp quyền vai trò (RBAC), kích hoạt hoặc khóa tài khoản toàn bệnh viện.
              </p>
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0084c7] hover:bg-[#0072bc] text-white rounded-xl font-bold text-xs shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm Tài Khoản Mới</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Tổng tài khoản</span>
              <div className="text-xl font-black text-slate-900 mt-1">{users.length}</div>
              <span className="text-[10px] text-slate-500">Tất cả vai trò</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-blue-600">Bác sĩ & Lâm sàng</span>
              <div className="text-xl font-black text-[#005a8b] mt-1">
                {users.filter(u => u.role === 'doctor_primary' || u.role === 'doctor_imaging').length}
              </div>
              <span className="text-[10px] text-slate-500">Khám chính & CĐHA</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-cyan-600">Lễ tân Tiếp đón</span>
              <div className="text-xl font-black text-cyan-800 mt-1">
                {users.filter(u => u.role === 'receptionist').length}
              </div>
              <span className="text-[10px] text-slate-500">Quầy hành chính</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Bệnh nhân</span>
              <div className="text-xl font-black text-emerald-800 mt-1">
                {users.filter(u => u.role === 'patient').length}
              </div>
              <span className="text-[10px] text-slate-500">Đã đăng ký cổng</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-rose-600">Đang bị khóa</span>
              <div className="text-xl font-black text-rose-700 mt-1">
                {users.filter(u => u.status === 'LOCKED').length}
              </div>
              <span className="text-[10px] text-slate-500">Tạm dừng truy cập</span>
            </div>
          </div>

          {/* User Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Danh sách Tài khoản ({filteredUsers.length} / {users.length})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-[#005a8b] font-bold">
                  HIS RBAC Engine
                </span>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Tìm tên, email, SĐT, CCCD..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none w-52"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                  <option value="doctor">Tất cả Bác sĩ</option>
                  <option value="receptionist">Lễ tân tiếp đón</option>
                  <option value="patient">Bệnh nhân</option>
                  <option value="guest">Khách vãng lai</option>
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="LOCKED">Đã khóa</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Tài khoản & Người dùng</th>
                    <th className="py-3 px-4">Email & SĐT</th>
                    <th className="py-3 px-4">Vai trò (Role)</th>
                    <th className="py-3 px-4">Khoa / Phòng ban</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Lần đăng nhập</th>
                    <th className="py-3 px-4 text-right">Phân quyền & Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                            alt={u.fullName}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{u.fullName}</div>
                            <div className="text-[10px] font-mono text-slate-400">ID: {u.id}</div>
                            {u.idCardNumber && (
                              <div className="text-[10px] text-blue-600 font-medium">CCCD: {u.idCardNumber}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{u.email}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{u.phone}</div>
                      </td>

                      <td className="py-3 px-4">
                        {getRoleBadge(u.role)}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-700 font-medium">{u.department || 'Chưa gán'}</span>
                      </td>

                      <td className="py-3 px-4">
                        {u.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Đã khóa
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {u.lastLogin}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenRoleModal(u)}
                            title="Phân quyền vai trò"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#005a8b] border border-blue-200 rounded-lg font-bold text-[11px] transition shadow-2xs"
                          >
                            <Key className="w-3.5 h-3.5 text-[#0084c7]" />
                            <span>Cấp quyền</span>
                          </button>

                          <button
                            onClick={() => toggleUserStatus(u.id, currentUser.fullName)}
                            title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            className={`p-1.5 rounded-lg border transition ${
                              u.status === 'ACTIVE'
                                ? 'bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border-slate-200'
                                : 'bg-rose-50 hover:bg-emerald-50 text-rose-600 hover:text-emerald-600 border-rose-200'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>

                          {u.role !== 'admin' && (
                            <button
                              onClick={() => {
                                if (confirm(`Bạn có chắc muốn xóa tài khoản "${u.fullName}" khỏi hệ thống?`)) {
                                  deleteUser(u.id, currentUser.fullName);
                                }
                              }}
                              title="Xóa tài khoản"
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: NEWS & ARTICLES MANAGEMENT (QUẢN LÝ TIN TỨC & BÀI BÁO TRANG CHỦ)
      ========================================================================= */}
      {currentWorkspaceNav === 'news_management' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Newspaper className="w-6 h-6 text-[#0084c7]" />
                Quản lý Tin tức, Bài báo & Sự kiện Bệnh viện
              </h2>
              <p className="text-xs text-slate-500">
                Đăng bài viết mới, cập nhật danh mục kỹ thuật và cấu hình ghim bài viết hiển thị tức thì trên Trang chủ Cổng Thông tin bệnh nhân.
              </p>
            </div>

            <button
              onClick={handleOpenAddArticle}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0084c7] hover:bg-[#0072bc] text-white rounded-xl font-bold text-xs shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng Bài Viết Mới</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Tổng bài viết</span>
              <div className="text-xl font-black text-slate-900 mt-1">{articles.length} bài</div>
              <span className="text-[10px] text-slate-500">Toàn bộ danh mục</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-[#0084c7]">Hiển thị Trang chủ</span>
              <div className="text-xl font-black text-[#005a8b] mt-1">
                {articles.filter(a => a.isPublished && a.isFeaturedOnHome).length} bài
              </div>
              <span className="text-[10px] text-slate-500">Ghim mục Tin tức</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Đã xuất bản</span>
              <div className="text-xl font-black text-emerald-800 mt-1">
                {articles.filter(a => a.isPublished).length} bài
              </div>
              <span className="text-[10px] text-slate-500">Công khai cho bạn đọc</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-amber-600">Tổng lượt xem</span>
              <div className="text-xl font-black text-amber-800 mt-1">
                {articles.reduce((acc, a) => acc + a.viewsCount, 0).toLocaleString('vi-VN')}
              </div>
              <span className="text-[10px] text-slate-500">Lượt đọc trang</span>
            </div>
          </div>

          {/* Articles Management Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Danh sách Bài viết & Tin tức ({filteredArticles.length} / {articles.length})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-[#005a8b] font-bold">
                  Live Portal Sync
                </span>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={newsSearchQuery}
                    onChange={(e) => setNewsSearchQuery(e.target.value)}
                    placeholder="Tìm theo tiêu đề, tác giả..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none w-52"
                  />
                </div>

                <select
                  value={newsCategoryFilter}
                  onChange={(e) => setNewsCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                >
                  <option value="all">Tất cả chuyên mục</option>
                  <option value="Hoạt động Bệnh viện">Hoạt động Bệnh viện</option>
                  <option value="Danh mục kỹ thuật">Danh mục kỹ thuật</option>
                  <option value="Sức khỏe Cộng đồng">Sức khỏe Cộng đồng</option>
                  <option value="Khoa học & Đào tạo">Khoa học & Đào tạo</option>
                  <option value="Thông báo Bệnh viện">Thông báo Bệnh viện</option>
                </select>

                <select
                  value={newsStatusFilter}
                  onChange={(e) => setNewsStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="featured">Ghim nổi bật Trang chủ</option>
                  <option value="published">Đã xuất bản</option>
                  <option value="draft">Bản nháp</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Bài viết & Hình ảnh</th>
                    <th className="py-3 px-4">Chuyên mục</th>
                    <th className="py-3 px-4">Tác giả & Ngày đăng</th>
                    <th className="py-3 px-4">Lượt xem</th>
                    <th className="py-3 px-4 text-center">Xuất bản</th>
                    <th className="py-3 px-4 text-center">Ghim Trang chủ</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredArticles.map((art) => (
                    <tr key={art.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 max-w-sm">
                        <div className="flex items-start gap-3">
                          <img
                            src={art.image}
                            alt={art.title}
                            className="w-16 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 line-clamp-1 hover:text-[#0084c7] transition" title={art.title}>
                              {art.title}
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {art.summary}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-[#005a8b] border border-blue-200">
                          {art.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">{art.author}</div>
                        <div className="text-slate-400 text-[10px]">{art.date}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                        {art.viewsCount.toLocaleString('vi-VN')}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => togglePublishArticle(art.id, currentUser.fullName)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                            art.isPublished
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${art.isPublished ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{art.isPublished ? 'Đã xuất bản' : 'Bản nháp'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleFeatureArticle(art.id, currentUser.fullName)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                            art.isFeaturedOnHome
                              ? 'bg-blue-100 text-[#005a8b] border border-blue-300'
                              : 'bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200'
                          }`}
                        >
                          <Pin className={`w-3 h-3 ${art.isFeaturedOnHome ? 'text-[#0084c7] fill-[#0084c7]' : ''}`} />
                          <span>{art.isFeaturedOnHome ? 'Đang ghim' : 'Không ghim'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewArticle(art)}
                            title="Xem trước bài viết"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#0084c7]" />
                          </button>

                          <button
                            onClick={() => handleOpenEditArticle(art)}
                            title="Chỉnh sửa bài viết"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-slate-600 hover:text-[#0084c7] transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa bài viết "${art.title}"?`)) {
                                deleteArticle(art.id, currentUser.fullName);
                              }
                            }}
                            title="Xóa bài viết"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: RAG KNOWLEDGE BASE MANAGER (KHO TRI THỨC Y TẾ & PINECONE)
      ========================================================================= */}
      {currentWorkspaceNav === 'rag_kb' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#0084c7]" />
                Quản trị Kho Tri thức Y tế RAG & Vector Database
              </h2>
              <p className="text-xs text-slate-500">
                Tài liệu y khoa được lập chỉ mục (Embedding) vào Pinecone / Vertex AI Search để làm ngữ cảnh chuẩn xác cho Trợ lý AI y tế.
              </p>
            </div>
            
            <button
              onClick={() => setShowAddDocModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0084c7] text-white rounded-xl font-bold text-xs hover:bg-[#0072bc] shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nạp Tài liệu Y khoa Mới</span>
            </button>
          </div>

          {/* RAG Engine Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Vector Database</span>
                <h4 className="text-sm font-bold text-slate-900">Pinecone (Serverless)</h4>
                <p className="text-[10px] text-[#0084c7] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Đang hoạt động • Chiều vector: 1536
                </p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Tổng số Chunks</span>
                <h4 className="text-sm font-bold text-slate-900">
                  {ragDocuments.reduce((sum, d) => sum + d.chunkCount, 0)} Chunks y khoa
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  {ragDocuments.filter(d => d.isActive).length}/{ragDocuments.length} tài liệu đang kích hoạt
                </p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#005a8b] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Tiêu chuẩn kiểm duyệt</span>
                <h4 className="text-sm font-bold text-slate-900">Chỉ số Grounding 98.4%</h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  100% tài liệu được thẩm định bởi Hội đồng Y khoa
                </p>
              </div>
            </div>
          </div>

          {/* Table of RAG Documents */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Danh sách Tài liệu Phác đồ & Hướng dẫn trong Knowledge Base ({ragDocuments.length})
              </h3>
              <span className="text-[11px] text-slate-400">
                Click vào nút Duyệt để đồng bộ vector embedding mới nhất
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Tên tài liệu & Mã</th>
                    <th className="py-3 px-3">Phân loại</th>
                    <th className="py-3 px-3">Số Chunks</th>
                    <th className="py-3 px-3">Trạng thái Vector DB</th>
                    <th className="py-3 px-3 text-center">Bật cho AI</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ragDocuments.map((doc) => {
                    const isIndexed = doc.vectorDbStatus === 'INDEXED_PINECONE';

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{doc.title}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-medium text-[#005a8b]">Mã: {doc.documentCode}</span>
                            <span>•</span>
                            <span className="text-slate-400">Nguồn: {doc.source}</span>
                            <span>•</span>
                            <span>{doc.updatedAt}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{doc.summary}</div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[10px]">
                            {doc.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-slate-600">
                          <div className="font-bold text-slate-800">{doc.chunkCount} chunks</div>
                          <div className="text-[10px] text-slate-400">{doc.fileType}</div>
                        </td>

                        <td className="py-3.5 px-3">
                          {isIndexed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#005a8b] border border-blue-200 rounded-full font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-[#0084c7]" />
                              Indexed (Pinecone)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold text-[10px]">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Chờ phê duyệt
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => toggleRagDocActive(doc.id, currentUser.fullName)}
                            className="text-slate-400 hover:text-[#0084c7] transition"
                            title={doc.isActive ? 'Tắt tài liệu này khỏi AI' : 'Bật tài liệu này cho AI'}
                          >
                            {doc.isActive ? (
                              <ToggleRight className="w-6 h-6 text-[#0084c7]" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-slate-300" />
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => approveAndIndexRagDoc(doc.id, currentUser.fullName)}
                            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-[#005a8b] border border-blue-300 rounded-lg font-bold text-[11px] shadow-2xs transition"
                          >
                            Duyệt & Đồng bộ
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: MASTER DATA & DOCTOR SCHEDULES
      ========================================================================= */}
      {currentWorkspaceNav === 'master_data' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Database className="w-6 h-6 text-[#0084c7]" />
                Quản lý Danh mục & Điều phối Giờ khám Bác sĩ
              </h2>
              <p className="text-xs text-slate-500">
                Điều chỉnh sức chứa khung giờ khám (Overbooking Guard) và tra cứu danh mục dùng chung.
              </p>
            </div>

            {/* Sub-tabs */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setMasterSubTab('slots')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  masterSubTab === 'slots' ? 'bg-white text-[#005a8b] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Khung giờ & Sức chứa (Slots)
              </button>
              <button
                onClick={() => setMasterSubTab('specialties')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  masterSubTab === 'specialties' ? 'bg-white text-[#005a8b] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chuyên khoa ({SPECIALTIES_DATA.length})
              </button>
              <button
                onClick={() => setMasterSubTab('doctors')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  masterSubTab === 'doctors' ? 'bg-white text-[#005a8b] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bác sĩ ({DOCTORS_DATA.length})
              </button>
              <button
                onClick={() => setMasterSubTab('services')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  masterSubTab === 'services' ? 'bg-white text-[#005a8b] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bảng giá Dịch vụ ({CLINICAL_SERVICES_CATALOG.length})
              </button>
              <button
                onClick={() => setMasterSubTab('medicines')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  masterSubTab === 'medicines' ? 'bg-white text-[#005a8b] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Danh mục Thuốc ({MEDICINES_CATALOG.length})
              </button>
            </div>
          </div>

          {/* Sub-tab 1: Time Slots & Capacity Editor (Overbooking Guard) */}
          {masterSubTab === 'slots' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/70 border border-blue-200/90 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#005a8b] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#0084c7]" />
                    Chống quá tải (Overbooking Guard) theo từng khung giờ 30 phút
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Khi bệnh nhân đặt trực tuyến hoặc lễ tân tiếp đón, hệ thống sẽ tự động khóa khung giờ nếu số lượng đạt mức giới hạn.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {timeSlots.map((slot) => {
                  const isFull = slot.bookedCount >= slot.maxCapacity;
                  const percent = Math.min(100, Math.round((slot.bookedCount / slot.maxCapacity) * 100));

                  return (
                    <div 
                      key={slot.id} 
                      className={`p-4 rounded-2xl bg-white border transition shadow-2xs ${
                        isFull ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-[#0084c7]" />
                          {slot.time}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isFull 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-blue-100 text-[#005a8b]'
                        }`}>
                          {isFull ? 'Đầy suất' : 'Còn trống'}
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Đã đặt: <strong>{slot.bookedCount}</strong></span>
                          <span>Tối đa: <strong>{slot.maxCapacity}</strong></span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isFull ? 'bg-amber-500' : 'bg-[#0084c7]'} rounded-full transition-all`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Controls to increase or decrease capacity */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[11px] text-slate-500 font-medium">Sức chứa tối đa:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateTimeSlotCapacity(slot.id, Math.max(slot.bookedCount, slot.maxCapacity - 1))}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition"
                            title="Giảm sức chứa"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-xs text-slate-800">
                            {slot.maxCapacity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateTimeSlotCapacity(slot.id, slot.maxCapacity + 1)}
                            className="w-7 h-7 rounded-lg bg-blue-100 hover:bg-blue-200 text-[#005a8b] font-bold flex items-center justify-center transition"
                            title="Tăng thêm suất khám"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-tab 2: Specialties Catalog */}
          {masterSubTab === 'specialties' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Danh mục Chuyên khoa Khám bệnh ({SPECIALTIES_DATA.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Mã khoa</th>
                      <th className="py-3 px-4">Tên Chuyên khoa</th>
                      <th className="py-3 px-4">Giá khám niêm yết</th>
                      <th className="py-3 px-4">Số lượng Bác sĩ</th>
                      <th className="py-3 px-4">Điểm nổi bật</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {SPECIALTIES_DATA.map((spec) => (
                      <tr key={spec.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{spec.code}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{spec.name}</td>
                        <td className="py-3 px-4 font-bold text-[#0072bc]">{formatVnd(spec.consultationFee)}</td>
                        <td className="py-3 px-4 text-slate-600">{spec.doctorCount} bác sĩ</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">{spec.highlightPoints.join(' • ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Doctors Catalog */}
          {masterSubTab === 'doctors' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {DOCTORS_DATA.map((doc) => (
                <div key={doc.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-3 mb-3">
                    <img 
                      src={doc.avatarUrl} 
                      alt={doc.fullName} 
                      className="w-12 h-12 rounded-xl object-cover border border-blue-200"
                    />
                    <div>
                      <div className="text-[10px] font-bold text-[#0072bc] uppercase">{doc.title}</div>
                      <h4 className="font-bold text-xs text-slate-900">{doc.fullName}</h4>
                      <p className="text-[10px] text-slate-500">{doc.roomNumber}</p>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <div>Chuyên khoa: <strong>{doc.specialtyName}</strong></div>
                    <div>Kinh nghiệm: <strong>{doc.experienceYears} năm</strong></div>
                    <div>Đánh giá: <strong className="text-amber-600">★ {doc.rating}</strong> ({doc.reviewCount} lượt)</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sub-tab 4: Services Catalog */}
          {masterSubTab === 'services' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Bảng giá Dịch vụ Kỹ thuật & Cận lâm sàng ({CLINICAL_SERVICES_CATALOG.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Mã dịch vụ</th>
                      <th className="py-3 px-4">Tên dịch vụ cận lâm sàng</th>
                      <th className="py-3 px-4">Khoa thực hiện</th>
                      <th className="py-3 px-4">Đơn giá niêm yết</th>
                      <th className="py-3 px-4">Thời gian trả KQ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {CLINICAL_SERVICES_CATALOG.map((svc) => (
                      <tr key={svc.code} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{svc.code}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{svc.name}</td>
                        <td className="py-3 px-4 text-slate-600">{svc.department}</td>
                        <td className="py-3 px-4 font-bold text-[#0072bc]">{formatVnd(svc.price)}</td>
                        <td className="py-3 px-4 text-slate-500 font-medium">{svc.estimatedMinutes} phút</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 5: Medicines Catalog */}
          {masterSubTab === 'medicines' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Danh mục Thuốc & Dược phẩm BHYT ({MEDICINES_CATALOG.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Mã thuốc</th>
                      <th className="py-3 px-4">Tên biệt dược</th>
                      <th className="py-3 px-4">Hàm lượng</th>
                      <th className="py-3 px-4">Đơn vị</th>
                      <th className="py-3 px-4">Liều dùng khuyến nghị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MEDICINES_CATALOG.map((med) => (
                      <tr key={med.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{med.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{med.name}</td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">{med.dosage}</td>
                        <td className="py-3 px-4 text-slate-600">{med.unit}</td>
                        <td className="py-3 px-4 text-slate-500">{med.defaultInstruction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: AUDIT LOGS WITH OLD/NEW JSON DIFF MODAL
      ========================================================================= */}
      {currentWorkspaceNav === 'audit_logs' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <History className="w-6 h-6 text-[#0084c7]" />
                Nhật ký Kiểm toán Hệ thống (Audit Logs)
              </h2>
              <p className="text-xs text-slate-500">
                Lưu vết 100% các hành vi nhạy cảm: Chỉnh sửa chẩn đoán EMR, bổ sung/sửa toa thuốc, hủy lịch và thay đổi cấu hình y khoa.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#005a8b] rounded-xl border border-blue-200 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-[#0084c7]" />
              <span>Tuân thủ Thông tư 46/2018/TT-BYT</span>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Lịch sử Thao tác & Biến động Dữ liệu ({auditLogs.length} bản ghi)
              </span>
              <span className="text-[11px] text-slate-400">
                Nhấp "Xem chi tiết thay đổi" để đối chiếu giá trị cũ vs mới
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Người thực hiện (Actor)</th>
                    <th className="py-3 px-4">Hành động</th>
                    <th className="py-3 px-4">Đối tượng tác động</th>
                    <th className="py-3 px-4">Ghi chú & Lý do</th>
                    <th className="py-3 px-4 text-right">Chi tiết Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {log.timestamp}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{log.actorName}</div>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-semibold uppercase">
                          {log.actorRole}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                          log.action.includes('EDIT') 
                            ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                            : log.action.includes('CANCEL') 
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-blue-50 text-[#005a8b] border border-blue-200'
                        }`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{log.entityType}</div>
                        <div className="text-[10px] font-mono text-slate-400">{log.entityId}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-[220px] truncate" title={log.notes}>
                        {log.notes || '—'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {log.oldValues || log.newValues ? (
                          <button
                            onClick={() => setSelectedAuditLog(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold text-[11px] shadow-2xs transition"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#0084c7]" />
                            <span>Xem Diff</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Không có diff</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: AUDIT LOG SIDE-BY-SIDE DIFF COMPARISON
      ========================================================================= */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#0084c7]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Đối chiếu Biến động Dữ liệu (Audit Diff Viewer)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bản ghi: #{selectedAuditLog.id} • {selectedAuditLog.timestamp} • Bởi {selectedAuditLog.actorName} ({selectedAuditLog.actorRole})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAuditLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Mandatory Reason Box */}
              {selectedAuditLog.notes && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                  <span className="font-bold text-amber-900 block mb-1">
                    Ghi chú / Lý do y khoa giải trình (Mandatory Clinical Justification):
                  </span>
                  <p className="text-amber-800 italic">
                    "{selectedAuditLog.notes}"
                  </p>
                </div>
              )}

              {/* Side-by-Side Comparison Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left: Old Values */}
                <div className="rounded-xl border border-rose-200 bg-rose-50/30 overflow-hidden">
                  <div className="px-3.5 py-2 bg-rose-100/70 border-b border-rose-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-800">
                      GIÁ TRỊ CŨ (Old Values)
                    </span>
                    <span className="text-[10px] text-rose-600 font-semibold">Trước khi sửa</span>
                  </div>
                  <pre className="p-3.5 text-[11px] font-mono text-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-72">
                    {selectedAuditLog.oldValues || '(Không có dữ liệu trước đó)'}
                  </pre>
                </div>

                {/* Right: New Values */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 overflow-hidden">
                  <div className="px-3.5 py-2 bg-emerald-100/70 border-b border-emerald-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800">
                      GIÁ TRỊ MỚI (New Values)
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Sau khi sửa</span>
                  </div>
                  <pre className="p-3.5 text-[11px] font-mono text-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-72">
                    {selectedAuditLog.newValues || '(Không có dữ liệu mới)'}
                  </pre>
                </div>

              </div>

              {/* Regulatory Notice */}
              <div className="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span>
                  Hệ thống tuân thủ nguyên tắc tính toàn vẹn (Data Integrity) theo chuẩn HL7 FHIR và Thông tư 46/2018/TT-BYT. Dữ liệu gốc không bị xóa vật lý mà được lưu vết phiên bản.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition"
              >
                Đóng đối chiếu
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW RAG MEDICAL DOCUMENT
      ========================================================================= */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0084c7]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Nạp Tài liệu Y khoa vào Knowledge Base
                </h3>
              </div>
              <button 
                onClick={() => setShowAddDocModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRagDoc} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên tài liệu y khoa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phác đồ chẩn đoán và điều trị bệnh trào ngược dạ dày thực quản (GERD) 2024"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phân loại tài liệu
                  </label>
                  <select
                    value={newDocCategory}
                    onChange={(e: any) => setNewDocCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none bg-white"
                  >
                    <option value="Phác đồ điều trị">Phác đồ điều trị</option>
                    <option value="Quy trình lâm sàng">Quy trình lâm sàng</option>
                    <option value="Hướng dẫn sử dụng thuốc">Hướng dẫn sử dụng thuốc</option>
                    <option value="Quy định bảo hiểm & viện phí">Quy định bảo hiểm & viện phí</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nguồn thẩm định
                  </label>
                  <input
                    type="text"
                    value={newDocSource}
                    onChange={(e) => setNewDocSource(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả vắn tắt nội dung
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả các nội dung chính để phục vụ metadata tìm kiếm..."
                  value={newDocSummary}
                  onChange={(e) => setNewDocSummary(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                <FileText className="w-8 h-8 text-[#0084c7] mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-700">Tệp tài liệu: huong_dan_lam_sang_gerd_2024.pdf</p>
                <p className="text-[11px] text-slate-400">Dung lượng: 2.4 MB • Tự động phân tách thành {newDocChunks} text chunks</p>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-[#005a8b]">
                Tài liệu sẽ được gửi tới Pinecone Vector DB và mô hình embedding `text-embedding-3-small` để lập chỉ mục phục vụ truy vấn RAG.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0084c7] hover:bg-[#0072bc] text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  Nạp & Lập chỉ mục Vector
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CẤP QUYỀN & PHÂN BỔ VAI TRÒ (ROLE ASSIGNMENT / RBAC)
      ========================================================================= */}
      {selectedUserForRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0084c7]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Cấp Quyền & Phân Bổ Vai Trò (HIS RBAC)
                </h3>
              </div>
              <button 
                onClick={() => setSelectedUserForRole(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="p-6 space-y-4 text-xs">
              {/* Selected User Header */}
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center gap-3">
                <img
                  src={selectedUserForRole.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                  alt={selectedUserForRole.fullName}
                  className="w-11 h-11 rounded-xl object-cover border border-blue-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">{selectedUserForRole.fullName}</div>
                  <div className="text-[11px] text-slate-500">{selectedUserForRole.email} • {selectedUserForRole.phone}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400">Hiện tại:</span>
                    {getRoleBadge(selectedUserForRole.role)}
                  </div>
                </div>
              </div>

              {/* Select Role */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chọn Vai trò Phân quyền mới <span className="text-red-500">*</span>
                </label>
                <select
                  value={tempNewRole}
                  onChange={(e: any) => setTempNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none bg-white font-semibold text-slate-800"
                >
                  <option value="admin">Quản trị viên Hệ thống (Admin - Toàn quyền cấu hình & quản trị)</option>
                  <option value="doctor_primary">Bác sĩ Khám chính (DOC-01: Khám lâm sàng, EMR, kê đơn thuốc, ra chỉ định CLS)</option>
                  <option value="doctor_imaging">Bác sĩ Cận lâm sàng (DOC-02: Khoa CĐHA, chụp X-quang, trả kết luận hình ảnh)</option>
                  <option value="receptionist">Nhân viên Lễ tân (Duyệt lịch hẹn, check-in tiếp đón, điều phối hàng chờ)</option>
                  <option value="patient">Bệnh nhân (Đã định danh CCCD/BHYT, đặt lịch, xem bệnh án EMR cá nhân)</option>
                  <option value="guest">Khách vãng lai (Truy cập cổng thông tin công khai)</option>
                </select>
              </div>

              {/* Department Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Khoa / Phòng ban phân công
                </label>
                <input
                  type="text"
                  value={tempDepartment}
                  onChange={(e) => setTempDepartment(e.target.value)}
                  placeholder="VD: Khoa Tiêu hóa - Gan mật (P102), Quầy Tiếp đón số 1..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none"
                />
              </div>

              {/* Permission Matrix Preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Đặc quyền theo vai trò được chọn:
                </span>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {tempNewRole === 'admin' && (
                    <>
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">Toàn quyền hệ thống</span>
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800">Quản trị người dùng</span>
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800">Đăng tin tức</span>
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800">Nạp kho RAG</span>
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800">Kiểm toán Audit Diff</span>
                    </>
                  )}
                  {tempNewRole === 'doctor_primary' && (
                    <>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-[#005a8b] font-bold">Bệnh án EMR</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-[#005a8b]">Kê đơn ngoại trú</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-[#005a8b]">Chỉ định Cận lâm sàng</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-[#005a8b]">Chuyển khoa</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-[#005a8b]">In đơn thuốc QR</span>
                    </>
                  )}
                  {tempNewRole === 'doctor_imaging' && (
                    <>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">Khoa CĐHA & PACS</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">Tiếp nhận phiếu chỉ định</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">Nhập kết luận X-quang</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">Trả KQ tức thì</span>
                    </>
                  )}
                  {tempNewRole === 'receptionist' && (
                    <>
                      <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-bold">Bàn lễ tân tiếp đón</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">Duyệt lịch hẹn</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">Check-in cấp STT</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">Tiếp đón Walk-in</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">Gọi số phòng khám</span>
                    </>
                  )}
                  {tempNewRole === 'patient' && (
                    <>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Cổng Bệnh nhân</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Đặt lịch hẹn trực tuyến</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Xem bệnh án EMR cá nhân</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Hỏi đáp AI Y tế</span>
                    </>
                  )}
                  {tempNewRole === 'guest' && (
                    <>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700">Xem thông tin giới thiệu</span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700">Xem bảng giá dịch vụ</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedUserForRole(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0084c7] hover:bg-[#0072bc] text-white rounded-xl font-bold shadow-xs transition"
                >
                  Lưu Cập Nhật Phân Quyền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: THÊM TÀI KHOẢN MỚI
      ========================================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0084c7]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Thêm Tài Khoản Người Dùng Mới
                </h3>
              </div>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ và tên người dùng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="VD: TS.BS Lê Thị Ánh Tuyết"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="tuyet.la@phucan.vn"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="0918889900"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Vai trò khởi tạo <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e: any) => setNewUserRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none bg-white font-medium"
                  >
                    <option value="doctor_primary">Bác sĩ Khám chính</option>
                    <option value="doctor_imaging">Bác sĩ Cận lâm sàng</option>
                    <option value="receptionist">Nhân viên Lễ tân</option>
                    <option value="patient">Bệnh nhân</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Khoa / Đơn vị công tác
                  </label>
                  <input
                    type="text"
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    placeholder="VD: Khoa Nhi, Quầy 1..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Số CCCD / Định danh (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={newUserIdCard}
                  onChange={(e) => setNewUserIdCard(e.target.value)}
                  placeholder="12 số căn cước gắn chip"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-[#005a8b]">
                Tài khoản sẽ được tạo ở trạng thái <strong>Hoạt động (Active)</strong> và tự động ghi log vào Nhật ký Kiểm toán Audit Logs theo quy định y tế.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0084c7] hover:bg-[#0072bc] text-white rounded-xl font-bold shadow-xs transition"
                >
                  Tạo Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: THÊM / CHỈNH SỬA BÀI VIẾT TIN TỨC BỆNH VIỆN
      ========================================================================= */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-[#0084c7]" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingArticleId ? 'Chỉnh Sửa Bài Báo / Tin Tức' : 'Đăng Bài Viết Mới Lên Trang Chủ'}
                </h3>
              </div>
              <button 
                onClick={() => setShowArticleModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tiêu đề bài viết <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  placeholder="VD: KHAI TRƯƠNG KHU ĐIỀU TRỊ KỸ THUẬT CAO NĂM 2026..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Chuyên mục <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={articleCategory}
                    onChange={(e: any) => setArticleCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none bg-white font-medium"
                  >
                    <option value="Hoạt động Bệnh viện">Hoạt động Bệnh viện</option>
                    <option value="Danh mục kỹ thuật">Danh mục kỹ thuật</option>
                    <option value="Sức khỏe Cộng đồng">Sức khỏe Cộng đồng</option>
                    <option value="Khoa học & Đào tạo">Khoa học & Đào tạo</option>
                    <option value="Thông báo Bệnh viện">Thông báo Bệnh viện</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tác giả / Ban biên tập
                  </label>
                  <input
                    type="text"
                    value={articleAuthor}
                    onChange={(e) => setArticleAuthor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày đăng bài
                  </label>
                  <input
                    type="text"
                    value={articleDate}
                    onChange={(e) => setArticleDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Image Input & Presets */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hình ảnh đại diện bài viết (URL)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={articleImage}
                    onChange={(e) => setArticleImage(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none text-[11px]"
                  />
                  <img src={articleImage} alt="Preview" className="w-14 h-10 rounded-lg object-cover border border-slate-200" />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Gợi ý ảnh nhanh:</span>
                  {sampleArticleImages.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setArticleImage(img.url)}
                      className={`px-2 py-0.5 rounded-lg border text-[10px] transition ${
                        articleImage === img.url
                          ? 'bg-blue-50 text-[#005a8b] border-blue-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {img.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tóm tắt bài viết (Hiển thị ngoài trang chủ) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={articleSummary}
                  onChange={(e) => setArticleSummary(e.target.value)}
                  placeholder="Mô tả tóm tắt nội dung 1-2 câu để thu hút bạn đọc..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none"
                />
              </div>

              {/* Full Content */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung chi tiết bài viết (Mỗi đoạn cách nhau 1 dòng trống)
                </label>
                <textarea
                  rows={5}
                  value={articleContentText}
                  onChange={(e) => setArticleContentText(e.target.value)}
                  placeholder="Nhập nội dung các đoạn của bài báo..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none"
                />
              </div>

              {/* Publication Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={articleIsPublished}
                    onChange={(e) => setArticleIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0084c7] focus:ring-[#0084c7]"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Xuất bản bài viết</span>
                    <span className="text-[10px] text-slate-500">Cho phép độc giả xem nội dung công khai</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={articleIsFeatured}
                    onChange={(e) => setArticleIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0084c7] focus:ring-[#0084c7]"
                  />
                  <div>
                    <span className="font-bold text-[#005a8b] block">Ghim hiển thị trên Trang chủ</span>
                    <span className="text-[10px] text-slate-500">Đưa vào mục "TIN TỨC HOẠT ĐỘNG" ngoài trang chủ</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowArticleModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0084c7] hover:bg-[#0072bc] text-white rounded-xl font-bold shadow-xs transition"
                >
                  {editingArticleId ? 'Lưu Thay Đổi' : 'Đăng & Xuất Bản Ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: XEM TRƯỚC BÀI VIẾT (PUBLIC PORTAL PREVIEW)
      ========================================================================= */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-[#0084c7] uppercase">
                {previewArticle.category} • {previewArticle.date}
              </span>
              <button 
                onClick={() => setPreviewArticle(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <h2 className="text-xl font-bold text-slate-900 leading-snug">
                {previewArticle.title}
              </h2>

              <div className="flex items-center gap-2 text-xs text-slate-500 pb-2 border-b border-slate-100">
                <span>Tác giả: <strong>{previewArticle.author}</strong></span>
                <span>•</span>
                <span>Lượt xem: <strong>{previewArticle.viewsCount}</strong></span>
                {previewArticle.isFeaturedOnHome && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-[#005a8b] font-bold ml-auto">
                    Đang ghim Trang chủ
                  </span>
                )}
              </div>

              <img
                src={previewArticle.image}
                alt={previewArticle.title}
                className="w-full h-64 object-cover rounded-xl border border-slate-200"
              />

              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed italic">
                {previewArticle.summary}
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {previewArticle.content.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Xem trước hiển thị giao diện độc giả</span>
              <button
                onClick={() => setPreviewArticle(null)}
                className="px-4 py-2 bg-[#0084c7] hover:bg-[#0072bc] text-white text-xs font-bold rounded-xl"
              >
                Đóng xem trước
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating In-App Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-md shadow-2xl rounded-2xl overflow-hidden border border-slate-100">
          <div className={`p-4 flex items-center gap-3 text-white ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-[#005a8b]'
          }`}>
            <ShieldCheck className="w-5 h-5 shrink-0 text-cyan-200" />
            <span className="text-xs font-bold leading-snug">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-white/80 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
