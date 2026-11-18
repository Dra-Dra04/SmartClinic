import { profileService, ProfileRequest, ProfileResponse } from '../services/profileService';
import { authService, authErrorMessage, CurrentUserDto, RegisterRequest } from '../services/authService';
import { TOKEN_KEY } from '../services/axiosClient';
import { create } from 'zustand';
import { UserProfile, UserRole, DemoStateId } from '../types';
import { GUEST_USER, PATIENT_INCOMPLETE, PATIENT_COMPLETED } from '../services/mockData';

let sessionGeneration = 0;
const fromAccount = (user: CurrentUserDto): UserProfile => ({
  id: user.userId, email: user.email, fullName: user.email, phone: '',
  role: user.role === 'Patient' ? 'patient' : user.role === 'Admin' ? 'admin' : user.role === 'Receptionist' ? 'receptionist' : user.doctorWorkspace === 'Consultation' ? 'doctor_primary' : user.doctorWorkspace === 'ClinicalService' ? 'doctor_imaging' : 'doctor',
  isProfileCompleted: false,
});

interface AuthState {
  profile: ProfileResponse | null;
  profileLoading: boolean;
  profileError: string | null;
  loadProfile: () => Promise<void>;
  saveProfile: (request: ProfileRequest) => Promise<void>;
  isDemo: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  initializeAuth: () => Promise<void>;
  enterDemo: () => void;
  exitDemo: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
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
  loginUser: (email: string, password: string) => Promise<void>;
  registerUser: (request: RegisterRequest) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  profileLoading: false,
  profileError: null,
  loadProfile: async () => {
    if (get().isDemo || get().activeRole !== 'patient') return;
    const generation = sessionGeneration;
    set({ profileLoading: true, profileError: null });
    try {
      const profile = await profileService.get();
      if (generation !== sessionGeneration) return;
      set({ profile, currentUser: { ...get().currentUser,
        fullName: profile.fullName || '', phone: profile.phone,
        isProfileCompleted: profile.isProfileCompleted,
      } });
    } catch (error) {
      if (generation === sessionGeneration) set({ profileError: authErrorMessage(error) });
    } finally {
      if (generation === sessionGeneration) set({ profileLoading: false });
    }
  },
  saveProfile: async (request) => {
    if (get().isDemo || get().activeRole !== 'patient' || get().profileLoading) return;
    const generation = sessionGeneration;
    set({ profileLoading: true, profileError: null });
    try {
      const profile = await profileService.update(request);
      if (generation !== sessionGeneration) return;
      set({ profile, currentUser: { ...get().currentUser,
        fullName: profile.fullName, phone: profile.phone,
        isProfileCompleted: profile.isProfileCompleted,
      } });
    } catch (error) {
      if (generation === sessionGeneration) set({ profileError: authErrorMessage(error) });
      throw error;
    } finally {
      if (generation === sessionGeneration) set({ profileLoading: false });
    }
  },
  isDemo: false,
  isLoading: false,
  isInitializing: true,
  error: null,
  clearError: () => set({ error: null }),
  enterDemo: () => {
    if (get().isLoading || get().isInitializing || get().profileLoading) return;
    sessionGeneration++;
    set({ isDemo: true, error: null, showOnboardingGuardModal: false, profile: null, profileError: null, profileLoading: false });
    get().setDemoState(1);
  },
  exitDemo: async () => {
    set({ isDemo: false });
    await get().initializeAuth();
  },
  logout: () => {
    sessionGeneration++;
    sessionStorage.removeItem(TOKEN_KEY);
    set({ currentUser: GUEST_USER, activeRole: 'guest', demoStateId: 1,
      profile: null, profileError: null, profileLoading: false,
      isLoading: false, isInitializing: false, error: null, showOnboardingGuardModal: false });
  },
  initializeAuth: async () => {
    const generation = ++sessionGeneration;
    set({ isInitializing: true, currentUser: GUEST_USER, activeRole: 'guest', error: null, profile: null, profileError: null, profileLoading: false });
    if (!sessionStorage.getItem(TOKEN_KEY)) {
      set({ isInitializing: false });
      return;
    }
    try {
      const account = await authService.me();
      if (generation !== sessionGeneration) return;
      const currentUser = fromAccount(account);
      set({ currentUser, activeRole: currentUser.role, activeDoctorId: currentUser.role === 'doctor_imaging' ? 'DOC-02' : 'DOC-01' });
      if (currentUser.role === 'patient') await get().loadProfile();
    } catch (error) {
      if (generation === sessionGeneration) set({ error: authErrorMessage(error) });
    } finally {
      if (generation === sessionGeneration) set({ isInitializing: false });
    }
  },
  currentUser: GUEST_USER,
  activeRole: 'guest',
  demoStateId: 1, // Demo state does not establish a real session.
  activeDoctorId: 'DOC-01',
  showOnboardingGuardModal: false,
  onboardingActionPrompt: 'Đặt lịch khám',

  setDemoState: (stateId: DemoStateId) => {
    if (!get().isDemo) return;
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
    if (!get().isDemo) return;
    set({ activeRole: role });
  },

  setActiveDoctorId: (docId: 'DOC-01' | 'DOC-02') => {
    if (!get().isDemo) return;
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
    if (!get().isDemo) return;
    set((state) => ({
      currentUser: {
        ...state.currentUser,
        ...data,
      },
    }));
  },

  setProfileCompleted: (status) => {
    if (!get().isDemo) return;
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

  loginUser: async (email, password) => {
    if (get().isDemo || get().isLoading) return;
    const generation = ++sessionGeneration;
    set({ isLoading: true, error: null });
    try {
      const account = await authService.login(email, password);
      if (generation !== sessionGeneration) return;
      sessionStorage.setItem(TOKEN_KEY, account.accessToken);
      const currentUser = fromAccount(account);
      set({ currentUser, activeRole: currentUser.role, activeDoctorId: currentUser.role === 'doctor_imaging' ? 'DOC-02' : 'DOC-01' });
      if (currentUser.role === 'patient') await get().loadProfile();
    } catch (error) {
      if (generation === sessionGeneration) set({ error: authErrorMessage(error) });
      throw error;
    } finally {
      if (generation === sessionGeneration) set({ isLoading: false });
    }
  },
  registerUser: async (request) => {
    if (get().isDemo || get().isLoading) return;
    const generation = ++sessionGeneration;
    set({ isLoading: true, error: null });
    try {
      await authService.register(request);
    } catch (error) {
      if (generation === sessionGeneration) set({ error: authErrorMessage(error) });
      throw error;
    } finally {
      if (generation === sessionGeneration) set({ isLoading: false });
    }
  },
}));
