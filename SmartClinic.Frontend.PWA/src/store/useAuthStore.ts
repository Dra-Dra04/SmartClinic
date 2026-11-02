import { create } from 'zustand';
import { UserProfile, UserRole, DemoStateId } from '../types';
import { GUEST_USER, PATIENT_INCOMPLETE, PATIENT_COMPLETED } from '../services/mockData';

interface AuthState {
  currentUser: UserProfile;
  activeRole: UserRole;
  demoStateId: DemoStateId;
  activeDoctorId: 'DOC-01' | 'DOC-02';
  showOnboardingGuardModal: boolean;
  onboardingActionPrompt: string;

  // Actions
  setDemoState: (stateId: DemoStateId) => void;
  switchRole: (role: UserRole) => void;
  setActiveDoctorId: (docId: 'DOC-01' | 'DOC-02') => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  setProfileCompleted: (status: boolean) => void;
  openOnboardingGuard: (actionName?: string) => void;
  closeOnboardingGuard: () => void;
  loginUser: (emailOrPhone: string) => void;
  registerUser: (email: string, phone: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: PATIENT_COMPLETED,
  activeRole: 'patient',
  demoStateId: 3, // Default to completed patient for initial view
  activeDoctorId: 'DOC-01',
  showOnboardingGuardModal: false,
  onboardingActionPrompt: 'Đặt lịch khám',

  setDemoState: (stateId: DemoStateId) => {
    switch (stateId) {
      case 1: // Khách (Guest)
        set({
          demoStateId: 1,
          activeRole: 'guest',
          currentUser: GUEST_USER,
        });
        break;
      case 2: // Bệnh nhân mới ĐK - Chưa hoàn thiện hồ sơ
        set({
          demoStateId: 2,
          activeRole: 'patient',
          currentUser: PATIENT_INCOMPLETE,
        });
        break;
      case 3: // Bệnh nhân đã đủ hồ sơ (Trần Văn An)
        set({
          demoStateId: 3,
          activeRole: 'patient',
          currentUser: PATIENT_COMPLETED,
        });
        break;
      case 4: // Lễ tân tiếp đón
        set({
          demoStateId: 4,
          activeRole: 'receptionist',
          currentUser: {
            id: 'usr_rec_01',
            fullName: 'Phạm Thu Hà',
            email: 'thuha.reception@smartclinic.vn',
            phone: '0981122334',
            role: 'receptionist',
            isProfileCompleted: true,
            avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
          },
        });
        break;
      case 5: // Bác sĩ (Mặc định DOC-01)
        set({
          demoStateId: 5,
          activeRole: 'doctor_primary',
          activeDoctorId: 'DOC-01',
          currentUser: {
            id: 'DOC-01',
            fullName: 'BS.CKII Nguyễn Minh Tuấn',
            email: 'tuan.nm@smartclinic.vn',
            phone: '0912111222',
            role: 'doctor_primary',
            isProfileCompleted: true,
            avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80',
          },
        });
        break;
      case 6: // Quản trị viên
        set({
          demoStateId: 6,
          activeRole: 'admin',
          currentUser: {
            id: 'usr_adm_01',
            fullName: 'Quản trị viên Hệ thống (Admin)',
            email: 'admin@smartclinic.vn',
            phone: '0909998877',
            role: 'admin',
            isProfileCompleted: true,
            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
          },
        });
        break;
    }
  },

  switchRole: (role: UserRole) => {
    set({ activeRole: role });
  },

  setActiveDoctorId: (docId: 'DOC-01' | 'DOC-02') => {
    if (docId === 'DOC-01') {
      set({
        activeDoctorId: 'DOC-01',
        activeRole: 'doctor_primary',
        currentUser: {
          id: 'DOC-01',
          fullName: 'BS.CKII Nguyễn Minh Tuấn',
          email: 'tuan.nm@smartclinic.vn',
          phone: '0912111222',
          role: 'doctor_primary',
          isProfileCompleted: true,
          avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80',
        },
      });
    } else {
      set({
        activeDoctorId: 'DOC-02',
        activeRole: 'doctor_imaging',
        currentUser: {
          id: 'DOC-02',
          fullName: 'TS.BS Lê Hoàng (CĐHA)',
          email: 'hoang.le@smartclinic.vn',
          phone: '0913222333',
          role: 'doctor_imaging',
          isProfileCompleted: true,
          avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=200&q=80',
        },
      });
    }
  },

  updateProfile: (data) => {
    set((state) => ({
      currentUser: {
        ...state.currentUser,
        ...data,
      },
    }));
  },

  setProfileCompleted: (status) => {
    set((state) => ({
      currentUser: {
        ...state.currentUser,
        isProfileCompleted: status,
      },
      showOnboardingGuardModal: false,
      demoStateId: status ? 3 : 2,
    }));
  },

  openOnboardingGuard: (actionName = 'Đặt lịch khám') => {
    set({
      showOnboardingGuardModal: true,
      onboardingActionPrompt: actionName,
    });
  },

  closeOnboardingGuard: () => {
    set({ showOnboardingGuardModal: false });
  },

  loginUser: (emailOrPhone) => {
    set({
      activeRole: 'patient',
      demoStateId: 3,
      currentUser: {
        ...PATIENT_COMPLETED,
        email: emailOrPhone.includes('@') ? emailOrPhone : 'tranvanan@gmail.com',
        phone: !emailOrPhone.includes('@') ? emailOrPhone : '0912888999',
      },
    });
  },

  registerUser: (email, phone) => {
    set({
      activeRole: 'patient',
      demoStateId: 2,
      currentUser: {
        id: 'usr_new_' + Date.now(),
        fullName: 'Bệnh nhân Mới',
        email,
        phone,
        role: 'patient',
        isProfileCompleted: false, // Immediately uncompleted to route to Onboarding!
      },
    });
  },
}));
