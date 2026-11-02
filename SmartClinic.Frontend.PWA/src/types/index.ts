export type UserRole = 'guest' | 'patient' | 'receptionist' | 'doctor_primary' | 'doctor_imaging' | 'admin';

export type DemoStateId = 1 | 2 | 3 | 4 | 5 | 6;

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác';
  idCardNumber?: string; // CCCD
  healthInsuranceNumber?: string; // BHYT
  address?: string;
  heightCm?: number;
  weightKg?: number;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Chưa rõ';
  allergies?: string[];
  medicalHistory?: string[];
  role: UserRole;
  isProfileCompleted: boolean;
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
  title: string; // TS.BS, BS.CKII, ThS.BS
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
  time: string; // "08:00", "08:30"
  period: 'morning' | 'afternoon';
  maxCapacity: number;
  bookedCount: number;
  isAvailable: boolean;
}

export interface Appointment {
  id: string;
  appointmentCode: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientDob?: string;
  patientGender?: string;
  doctorId: string;
  doctorName: string;
  doctorTitle: string;
  specialtyId: string;
  specialtyName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // "08:30"
  symptoms: string;
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'ARRIVED' | 'CANCELLED';
  createdAt: string;
  source: 'ONLINE_PORTAL' | 'AI_CHAT_RAG' | 'RECEPTIONIST_WALKIN' | 'HOTLINE';
}

export type VisitStatus = 
  | 'WAITING_EXAM'               // Chờ khám tại phòng BS
  | 'IN_EXAM_PRIMARY'            // Đang khám lâm sàng tại BS Khám chính (DOC-01)
  | 'AWAITING_SUBCLINICAL'       // Đang đi làm cận lâm sàng tại Khoa CĐHA/XN
  | 'RESULTS_READY'              // Đã có kết quả cận lâm sàng - Chờ BS kết luận
  | 'COMPLETED';                 // Hoàn tất lượt khám

export interface VitalSigns {
  heightCm: number;
  weightKg: number;
  bmi: number;
  bmiCategory: string;
  pulseBpm: number;
  systolicBp: number;
  diastolicBp: number;
  temperatureC: number;
  spo2Percent: number;
}

export interface ClinicalOrder {
  id: string;
  orderCode: string;
  visitId: string;
  patientId: string;
  patientName: string;
  orderingDoctorId: string;
  orderingDoctorName: string;
  targetDepartment: 'Khoa Chẩn đoán hình ảnh' | 'Khoa Xét nghiệm Hóa sinh' | 'Khoa Thăm dò chức năng';
  serviceName: string;
  serviceCode: string;
  clinicalReason: string;
  status: 'ORDERED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  resultImageUrl?: string;
  findingsDescription?: string;
  conclusion?: string;
  orderedAt: string;
  completedAt?: string;
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string; // e.g. "40mg"
  unit: string;   // "Viên", "Gói"
  quantity: number;
  schedule: {
    morning?: string;
    noon?: string;
    afternoon?: string;
    evening?: string;
  };
  instructions: string; // "Uống trước ăn 30 phút"
}

export interface Prescription {
  id: string;
  code: string;
  visitId: string;
  patientName: string;
  doctorName: string;
  diagnosis: string;
  icd10Code: string;
  items: PrescriptionItem[];
  doctorAdvice: string;
  reExamDate?: string;
  createdAt: string;
}

export interface DepartmentReferral {
  id: string;
  visitId: string;
  fromDoctorId: string;
  toDepartmentName: string;
  reason: string;
  referralType: 'CHUYEN_KHOA' | 'NHAP_VIEN_NOI_TRU';
  createdAt: string;
}

export interface MedicalRecordEMR {
  id: string;
  visitId: string;
  patientId: string;
  chiefComplaint: string; // Lý do khám
  medicalHistory: string;  // Tiền sử
  presentIllness: string;  // Bệnh sử
  physicalExam: string;    // Khám thực thể
  preliminaryDiagnosis: string;
  icd10Code: string;
  vitalSigns: VitalSigns;
  conclusion: string;
  clinicalOrders: ClinicalOrder[];
  prescription?: Prescription;
  referral?: DepartmentReferral;
  updatedAt: string;
}

export interface Visit {
  id: string;
  visitCode: string; // STT ví dụ: "A-01", "B-03"
  queueNumber: number;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientDob: string;
  patientGender: string;
  patientAllergies?: string[];
  bloodType?: string;
  doctorId: string;
  doctorName: string;
  roomNumber: string;
  specialtyName: string;
  checkInTime: string;
  status: VisitStatus;
  currentStepMessage: string;
  isAbsent?: boolean;
  emr?: MedicalRecordEMR;
}

export interface RagDocument {
  id: string;
  title: string;
  documentCode: string;
  version: string;
  category: 'Quy trình lâm sàng' | 'Phác đồ điều trị' | 'Hướng dẫn sử dụng thuốc' | 'Quy định bảo hiểm & viện phí';
  source: string;
  fileType: 'PDF' | 'DOCX';
  chunkCount: number;
  vectorDbStatus: 'INDEXED_PINECONE' | 'PENDING_APPROVAL' | 'REMOVED';
  isActive: boolean;
  uploadedBy: string;
  updatedAt: string;
  summary: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: 'Appointment' | 'Visit' | 'ClinicalOrder' | 'MedicalRecord' | 'Prescription' | 'RagDocument' | 'User' | 'Article';
  entityId: string;
  oldValues?: string; // JSON string
  newValues?: string; // JSON string
  notes: string;
}

export interface HospitalUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'ACTIVE' | 'LOCKED';
  avatarUrl?: string;
  department?: string;
  idCardNumber?: string;
  healthInsuranceNumber?: string;
  createdAt: string;
  lastLogin: string;
  permissions?: string[];
}

export interface HospitalArticle {
  id: string;
  title: string;
  category: 'Hoạt động Bệnh viện' | 'Danh mục kỹ thuật' | 'Sức khỏe Cộng đồng' | 'Khoa học & Đào tạo' | 'Thông báo Bệnh viện';
  author: string;
  date: string;
  image: string;
  summary: string;
  content: string[];
  isPublished: boolean;
  isFeaturedOnHome: boolean;
  viewsCount: number;
  createdAt: string;
}

export interface SourceCitation {
  docTitle: string;
  version: string;
  page?: number;
  section: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: SourceCitation[];
  isMedicalSafeFallback?: boolean;
  interactiveType?: 'DOCTOR_SLOT_SELECT';
  interactiveData?: {
    specialty?: Specialty;
    doctor?: Doctor;
    slots?: TimeSlot[];
    selectedSlot?: string;
    date?: string;
    confirmedAppointment?: Appointment;
  };
  feedback?: 'like' | 'dislike';
}
