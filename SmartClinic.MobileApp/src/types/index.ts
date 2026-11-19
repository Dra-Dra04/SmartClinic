export type MobileUserRole = 'guest' | 'patient';

export type MobileTabName = 'home' | 'doctors' | 'booking' | 'visits' | 'profile' | 'pricing' | 'ai-chat';

export interface MobileChatCitation {
  docTitle: string;
  version: string;
  section: string;
}

export interface MobileChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isMedicalSafeFallback?: boolean;
  citations?: MobileChatCitation[];
  recommendedDoctorId?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: MobileUserRole;
  isProfileCompleted: boolean;
  dateOfBirth?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác';
  idCardNumber?: string;
  healthInsuranceNumber?: string;
  address?: string;
  heightCm?: number;
  weightKg?: number;
  bloodType?: string;
  allergies?: string[];
  medicalHistory?: string[];
  avatarUrl?: string;
}

export interface Specialty {
  id: string;
  name: string;
  code: string;
  description: string;
  iconName: string;
  doctorCount: number;
  consultationFee: number;
  highlightPoints: string[];
}

export interface Doctor {
  id: string;
  fullName: string;
  title: string;
  specialtyId: string;
  specialtyName: string;
  roomNumber: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  avatarUrl: string;
  bio: string;
  availableDays: string[];
}

export interface TimeSlot {
  id: string;
  timeRange: string;
  period: 'Sáng' | 'Chiều';
  bookedCount: number;
  maxCapacity: number;
}

export interface Appointment {
  id: string;
  bookingCode: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  specialtyName: string;
  roomNumber: string;
  date: string;
  slotId: string;
  timeRange: string;
  symptoms: string;
  status: 'PENDING_APPROVAL' | 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED';
  createdAt: string;
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  note: string;
}

export interface SubclinicalResult {
  id: string;
  serviceName: string;
  department: string;
  status: 'ORDERED' | 'IN_PROGRESS' | 'COMPLETED';
  findings: string;
  conclusion: string;
  performedBy: string;
  completedAt?: string;
}

export interface Visit {
  id: string;
  visitCode: string;
  patientName: string;
  doctorName: string;
  specialtyName: string;
  roomNumber: string;
  checkInTime: string;
  status: 'WAITING_EXAM' | 'IN_EXAM_PRIMARY' | 'AWAITING_SUBCLINICAL' | 'RESULTS_READY' | 'COMPLETED';
  vitals?: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    spO2: number;
    bmi: number;
  };
  diagnosis?: string;
  clinicalNotes?: string;
  subclinicalOrders: SubclinicalResult[];
  prescriptions: PrescriptionItem[];
}

export interface HospitalArticle {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  image: string;
  summary: string;
  content: string[];
}

export interface TechnicalServicePrice {
  id: string;
  code: string;
  name: string;
  category: 'Khám chuyên khoa' | 'Chẩn đoán hình ảnh' | 'Xét nghiệm Hóa sinh' | 'Thăm dò chức năng';
  bhytPrice: number;
  servicePrice: number;
  turnaroundTime: string;
}
