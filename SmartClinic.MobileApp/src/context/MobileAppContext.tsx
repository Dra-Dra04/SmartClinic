import * as SecureStore from 'expo-secure-store';
import { Platform, AppState } from 'react-native';
import { ApiError, request } from '../api/client';
import { getPatient, savePatient, patientAvatarSource } from '../api/patient';
import { listArticles } from '../api/articles';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  MobileTabName,
  Doctor,
  Specialty,
  Appointment,
  Visit,
  TimeSlot,
  HospitalArticle,
} from '../types';
import {
  GUEST_USER,
  DOCTORS_DATA,
  SPECIALTIES_DATA,
  TIME_SLOTS_DATA,
} from '../data/mockData';

export type DemoUserMode = 'guest' | 'patient_incomplete' | 'patient_completed';

interface MobileAppContextValue {
  currentUser: UserProfile;
  demoMode: DemoUserMode;
  activeTab: MobileTabName;
  setActiveTab: (tab: MobileTabName) => void;

  // Data
  specialties: Specialty[];
  doctors: Doctor[];
  articles: HospitalArticle[];
  timeSlots: TimeSlot[];
  appointments: Appointment[];
  visits: Visit[];

  // Selected context for booking
  selectedDoctorForBooking: Doctor | null;
  selectedSpecialtyFilter: string | null;
  setSelectedSpecialtyFilter: (specId: string | null) => void;

  // Auth & Onboarding Modals
  isAuthModalOpen: boolean;
  authPromptMessage: string;
  openAuthModal: (message?: string, mode?: 'login' | 'register') => void;
  authMode: 'login' | 'register';
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, confirmPassword: string, phone: string) => Promise<void>;
  sessionLoading: boolean;
  sessionError: string;
  retrySession: () => Promise<void>;
  avatarSource: { uri: string; headers: { Authorization: string } } | undefined;
  uploadAvatar: (uri: string) => Promise<void>;
  articlesLoading: boolean;
  articlesError: string;
  articlesHasMore: boolean;
  loadArticles: (reset?: boolean) => Promise<void>;
  logoutToGuest: () => void;

  isOnboardingGateOpen: boolean;
  setIsOnboardingGateOpen: (open: boolean) => void;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;

  // Booking trigger (checks Guest login & Onboarding Gate)
  requestStartBooking: (doctor?: Doctor) => void;
  confirmNewAppointment: (payload: {
    doctor: Doctor;
    date: string;
    slot: TimeSlot;
    symptoms: string;
  }) => Appointment;
  cancelAppointment: (aptId: string) => void;
}

const MobileAppContext = createContext<MobileAppContextValue | undefined>(undefined);

export const MobileAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [demoMode, setDemoMode] = useState<DemoUserMode>('guest');
  const [currentUser, setCurrentUser] = useState<UserProfile>(GUEST_USER);
  const [activeTab, setActiveTab] = useState<MobileTabName>('home');

  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState<string | null>(null);

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(TIME_SLOTS_DATA);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [visits] = useState<Visit[]>([]);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState('');

  // Onboarding Gate Modal State
  const [isOnboardingGateOpen, setIsOnboardingGateOpen] = useState(false);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const openAuthModal = (message?: string, mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthPromptMessage(
      message || 'Đăng nhập để quản lý hồ sơ và sử dụng các tiện ích dành cho bệnh nhân.'
    );
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthPromptMessage('');
  };

  const [token, setToken] = useState<string>();
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const epoch = useRef(0);
  const sessionRef = useRef<{ accessToken: string; accessTokenExpiresAtUtc: string }>();
  const persistence = useRef(Promise.resolve());
  const persist = (value: string | null) => {
    const operation = persistence.current.catch(() => {}).then(async () => {
      if (Platform.OS === 'web') return; // Native secure persistence; web uses memory only.
      if (value) await SecureStore.setItemAsync('smartclinic.session', value);
      else await SecureStore.deleteItemAsync('smartclinic.session');
    });
    persistence.current = operation;
    return operation;
  };
  const resetSession = (message = '') => {
    epoch.current++;
    sessionRef.current = undefined;
    setToken(undefined);
    setCurrentUser(GUEST_USER);
    setDemoMode('guest');
    setAppointments([]);
    setTimeSlots(TIME_SLOTS_DATA);
    setSelectedDoctorForBooking(null);
    setSelectedSpecialtyFilter(null);
    setIsOnboardingGateOpen(false);
    setSessionLoading(false);
    setSessionError(message);
    void persist(null).catch(() => setSessionError('Không xóa được phiên đã lưu. Vui lòng thử đăng xuất lại.'));
  };
  const logoutToGuest = () => { resetSession(); setActiveTab('home'); };
  const acceptProfile = (user: UserProfile) => {
    setCurrentUser(user);
    setDemoMode(user.isProfileCompleted ? 'patient_completed' : 'patient_incomplete');
  };
  const authorized = async <T,>(operation: (accessToken: string) => Promise<T>): Promise<T> => {
    const session = sessionRef.current;
    const version = epoch.current;
    if (!session || Date.parse(session.accessTokenExpiresAtUtc) <= Date.now()) {
      resetSession('Phiên đã hết hạn. Vui lòng đăng nhập lại.');
      throw new Error('Vui lòng đăng nhập lại.');
    }
    try {
      const result = await operation(session.accessToken);
      if (version !== epoch.current) throw new Error('Phiên đăng nhập đã thay đổi.');
      return result;
    } catch (error) {
      if (version === epoch.current && error instanceof ApiError && error.status === 401)
        resetSession(error.message);
      throw error;
    }
  };
  const retrySession = async () => {
    const version = epoch.current;
    setSessionLoading(true); setSessionError('');
    try {
      if (!sessionRef.current && Platform.OS !== 'web') {
        const stored = await SecureStore.getItemAsync('smartclinic.session');
        if (version !== epoch.current) return;
        if (stored) {
          const value = JSON.parse(stored);
          if (typeof value.accessToken !== 'string' || !Number.isFinite(Date.parse(value.accessTokenExpiresAtUtc)))
            throw new Error('Phiên đã lưu không hợp lệ. Hãy đăng xuất và đăng nhập lại.');
          sessionRef.current = value;
        }
      }
      if (!sessionRef.current) return;
      const user = await authorized(async key => {
        const identity = await request<{ role: string }>('/api/auth/me', {}, key);
        if (identity.role !== 'Patient') throw new ApiError(401, 'Ứng dụng này dành cho tài khoản bệnh nhân.');
        return getPatient(key);
      });
      if (version === epoch.current) { setToken(sessionRef.current?.accessToken); acceptProfile(user); }
    } catch (error) {
      if (version === epoch.current) setSessionError(error instanceof Error ? error.message : 'Không tải được hồ sơ.');
    } finally { if (version === epoch.current) setSessionLoading(false); }
  };
  useEffect(() => { void retrySession(); }, []);
  useEffect(() => {
    const check = () => {
      const session = sessionRef.current;
      if (session && Date.parse(session.accessTokenExpiresAtUtc) <= Date.now())
        resetSession('Phiên đã hết hạn. Vui lòng đăng nhập lại.');
    };
    const timer = setInterval(check, 15000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') check(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  const login = async (email: string, password: string) => {
    const version = ++epoch.current;
    // Stop a failed restore's old expiry timer from cancelling this login attempt.
    sessionRef.current = undefined;
    setSessionLoading(false);
    const result = await request<{ role: string; accessToken: string; accessTokenExpiresAtUtc: string }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email: email.trim(), password }),
    });
    if (!result.accessToken || !Number.isFinite(Date.parse(result.accessTokenExpiresAtUtc)))
      throw new Error('Máy chủ trả về phiên đăng nhập không hợp lệ.');
    if (result.role !== 'Patient') throw new Error('Ứng dụng này dành cho tài khoản bệnh nhân.');
    const identity = await request<{ role: string }>('/api/auth/me', {}, result.accessToken);
    if (identity.role !== 'Patient') throw new Error('Tài khoản không có quyền bệnh nhân.');
    const user = await getPatient(result.accessToken);
    if (version !== epoch.current) return;
    await persist(JSON.stringify({ accessToken: result.accessToken, accessTokenExpiresAtUtc: result.accessTokenExpiresAtUtc }));
    if (version !== epoch.current) return;
    sessionRef.current = result;
    setToken(result.accessToken); acceptProfile(user); setSessionError(''); setSessionLoading(false);
    setIsAuthModalOpen(false); setActiveTab('profile');
  };
  const register = async (email: string, password: string, confirmPassword: string, phone: string) => {
    await request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email: email.trim(), password, confirmPassword, phoneNumber: phone.trim() }) });
  };
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    const user = await authorized(key => savePatient(key, { ...currentUser, ...data }));
    acceptProfile(user);
  };
  const [avatarVersion, setAvatarVersion] = useState(0);
  const uploadAvatar = async (uri: string) => {
    await authorized(async key => {
      const form = new FormData();
      form.append('file', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
      await request('/api/patients/me/avatar', { method: 'POST', body: form }, key);
    });
    acceptProfile(await authorized(getPatient));
    setAvatarVersion(Date.now());
  };
  const avatarSource = patientAvatarSource(token, currentUser, avatarVersion);
  const [articles, setArticles] = useState<HospitalArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articlesError, setArticlesError] = useState('');
  const [articlesHasMore, setArticlesHasMore] = useState(false);
  const articlePage = useRef(0);
  const articleBusy = useRef(false);
  const loadArticles = async (reset = false) => {
    if (articleBusy.current) return;
    articleBusy.current = true; setArticlesLoading(true); setArticlesError('');
    try {
      const page = reset ? 1 : articlePage.current + 1;
      const result = await listArticles(page);
      setArticles(previous => reset ? result.items : [...previous, ...result.items]);
      articlePage.current = page; setArticlesHasMore(result.hasMore);
    } catch (error) { setArticlesError(error instanceof Error ? error.message : 'Không tải được bài viết.'); }
    finally { articleBusy.current = false; setArticlesLoading(false); }
  };
  useEffect(() => { void loadArticles(true); }, []);

  // Luồng chuẩn: Nếu chưa đăng nhập (guest) -> Hiện thông báo yêu cầu đăng ký/đăng nhập rồi chuyển sang màn hình đăng nhập
  const requestStartBooking = (doctor?: Doctor) => {
    if (currentUser.role === 'guest') {
      if (doctor) setSelectedDoctorForBooking(doctor);
      openAuthModal(
        'Bạn chưa đăng nhập tài khoản! Vui lòng đăng ký hoặc đăng nhập tài khoản bệnh nhân để tiến hành đặt lịch khám.'
      );
      return;
    }

    if (!currentUser.isProfileCompleted) {
      if (doctor) setSelectedDoctorForBooking(doctor);
      setIsOnboardingGateOpen(true);
      return;
    }

    if (doctor) {
      setSelectedDoctorForBooking(doctor);
    }
    setActiveTab('booking');
  };

  const confirmNewAppointment = ({
    doctor,
    date,
    slot,
    symptoms,
  }: {
    doctor: Doctor;
    date: string;
    slot: TimeSlot;
    symptoms: string;
  }) => {
    const newApt: Appointment = {
      id: 'APT-' + Math.floor(1000 + Math.random() * 9000),
      bookingCode: 'PA-2026-' + Math.floor(1000 + Math.random() * 9000),
      patientName: currentUser.fullName,
      patientPhone: currentUser.phone,
      doctorId: doctor.id,
      doctorName: `${doctor.title} ${doctor.fullName}`,
      specialtyName: doctor.specialtyName,
      roomNumber: doctor.roomNumber,
      date,
      slotId: slot.id,
      timeRange: slot.timeRange,
      symptoms: symptoms || 'Khám kiểm tra sức khỏe chuyên khoa',
      status: 'CONFIRMED',
      createdAt: 'Vừa xong',
    };

    setAppointments((prev) => [newApt, ...prev]);
    setTimeSlots((prev) =>
      prev.map((s) => (s.id === slot.id ? { ...s, bookedCount: Math.min(s.maxCapacity, s.bookedCount + 1) } : s))
    );
    return newApt;
  };

  const cancelAppointment = (aptId: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === aptId ? { ...a, status: 'CANCELLED' } : a))
    );
  };

  return (
    <MobileAppContext.Provider
      value={{
        currentUser,
        demoMode,
        activeTab,
        setActiveTab,
        specialties: SPECIALTIES_DATA,
        doctors: DOCTORS_DATA,
        articles,
        timeSlots,
        appointments,
        visits,
        selectedDoctorForBooking,
        selectedSpecialtyFilter,
        setSelectedSpecialtyFilter,
        isAuthModalOpen,
        authMode,
        authPromptMessage,
        openAuthModal,
        closeAuthModal,
        login, register, sessionLoading, sessionError, retrySession, avatarSource, uploadAvatar,
        articlesLoading, articlesError, articlesHasMore, loadArticles,
        logoutToGuest,
        isOnboardingGateOpen,
        setIsOnboardingGateOpen,
        updateUserProfile,
        requestStartBooking,
        confirmNewAppointment,
        cancelAppointment,
      }}
    >
      {children}
    </MobileAppContext.Provider>
  );
};

export const useMobileApp = () => {
  const ctx = useContext(MobileAppContext);
  if (!ctx) throw new Error('useMobileApp must be used inside MobileAppProvider');
  return ctx;
};
