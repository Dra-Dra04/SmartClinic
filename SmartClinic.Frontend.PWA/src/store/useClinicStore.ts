import { create } from 'zustand';
import { 
  Appointment, 
  Visit, 
  ClinicalOrder, 
  RagDocument, 
  AuditLog, 
  TimeSlot, 
  VitalSigns,
  Prescription,
  DepartmentReferral,
  HospitalUser,
  HospitalArticle,
  UserRole
} from '../types';
import { 
  INITIAL_APPOINTMENTS, 
  INITIAL_VISITS, 
  INITIAL_RAG_DOCS, 
  INITIAL_AUDIT_LOGS, 
  TIME_SLOTS_DATA,
  DOCTORS_DATA,
  INITIAL_USERS,
  INITIAL_ARTICLES
} from '../services/mockData';

interface ClinicState {
  appointments: Appointment[];
  visits: Visit[];
  timeSlots: TimeSlot[];
  ragDocuments: RagDocument[];
  auditLogs: AuditLog[];
  users: HospitalUser[];
  articles: HospitalArticle[];
  selectedPatientVisitId: string;
  currentPortalNav: 'home' | 'specialties' | 'doctors' | 'pricing' | 'instructions' | 'profile' | 'booking' | 'my-visits';
  currentWorkspaceNav: string;

  // User Management Actions
  updateUserRole: (userId: string, newRole: UserRole, department?: string, adminName?: string) => void;
  toggleUserStatus: (userId: string, adminName?: string) => void;
  createUser: (userData: Omit<HospitalUser, 'id' | 'createdAt' | 'lastLogin'>, adminName?: string) => HospitalUser;
  deleteUser: (userId: string, adminName?: string) => void;

  // News & Articles Management Actions
  createArticle: (articleData: Omit<HospitalArticle, 'id' | 'viewsCount' | 'createdAt'>, authorName?: string) => HospitalArticle;
  updateArticle: (id: string, updates: Partial<HospitalArticle>, authorName?: string) => void;
  deleteArticle: (id: string, adminName?: string) => void;
  togglePublishArticle: (id: string, adminName?: string) => void;
  toggleFeatureArticle: (id: string, adminName?: string) => void;

  // Navigation
  setPortalNav: (nav: ClinicState['currentPortalNav']) => void;
  setWorkspaceNav: (nav: string) => void;
  setSelectedPatientVisitId: (id: string) => void;

  // Appointments
  createAppointment: (apptData: Omit<Appointment, 'id' | 'appointmentCode' | 'createdAt' | 'status'>) => Appointment;
  cancelAppointment: (id: string, reason?: string) => void;
  confirmAppointment: (id: string) => void;
  changeAppointmentTime: (id: string, newDate: string, newSlot: string) => void;

  // Receptionist Desk
  checkInAppointment: (appointmentId: string) => Visit;
  registerWalkIn: (patientName: string, phone: string, specialtyId: string, doctorId: string, symptoms: string) => Visit;
  callNextPatient: (visitId: string) => void;
  togglePatientAbsent: (visitId: string) => void;

  // Primary Doctor (DOC-01)
  updateVitalSigns: (visitId: string, vitals: VitalSigns, doctorName: string) => void;
  updateEmrDiagnosis: (visitId: string, preliminaryDiagnosis: string, icd10: string, conclusion: string, doctorName: string) => void;
  createClinicalOrder: (
    visitId: string, 
    serviceName: string, 
    serviceCode: string, 
    department: ClinicalOrder['targetDepartment'], 
    clinicalReason: string, 
    orderingDoctorId: string,
    orderingDoctorName: string
  ) => ClinicalOrder;
  createPrescription: (visitId: string, prescription: Omit<Prescription, 'id' | 'code' | 'createdAt'>, doctorName: string) => void;
  editCompletedEmrOrPrescription: (visitId: string, updatedDiagnosis: string, editReason: string, doctorName: string) => void;
  createDepartmentReferral: (visitId: string, toDepartment: string, reason: string, referralType: 'CHUYEN_KHOA' | 'NHAP_VIEN_NOI_TRU', doctorId: string) => void;

  // Subclinical Doctor (DOC-02 - Chẩn đoán hình ảnh)
  acceptClinicalOrder: (orderId: string, doctorId: string, doctorName: string) => void;
  submitSubclinicalResult: (orderId: string, imageUrl: string, findings: string, conclusion: string, doctorName: string) => void;

  // Admin
  toggleRagDocActive: (docId: string, adminName: string) => void;
  approveAndIndexRagDoc: (docId: string, adminName: string) => void;
  addRagDoc: (doc: Omit<RagDocument, 'id' | 'updatedAt' | 'vectorDbStatus'>, adminName: string) => void;
  updateTimeSlotCapacity: (slotId: string, newMax: number) => void;
  recordAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

export const useClinicStore = create<ClinicState>((set, get) => ({
  appointments: INITIAL_APPOINTMENTS,
  visits: INITIAL_VISITS,
  timeSlots: TIME_SLOTS_DATA,
  ragDocuments: INITIAL_RAG_DOCS,
  auditLogs: INITIAL_AUDIT_LOGS,
  users: INITIAL_USERS,
  articles: INITIAL_ARTICLES,
  selectedPatientVisitId: 'vis_an_01',
  currentPortalNav: 'home',
  currentWorkspaceNav: 'appointments',

  setPortalNav: (nav) => set({ currentPortalNav: nav }),
  setWorkspaceNav: (nav) => set({ currentWorkspaceNav: nav }),
  setSelectedPatientVisitId: (id) => set({ selectedPatientVisitId: id }),

  recordAuditLog: (logData) => {
    const newLog: AuditLog = {
      ...logData,
      id: 'aud_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    set((state) => ({
      auditLogs: [newLog, ...state.auditLogs],
    }));
  },

  createAppointment: (apptData) => {
    const newCode = `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAppt: Appointment = {
      ...apptData,
      id: 'apt_' + Date.now(),
      appointmentCode: newCode,
      createdAt: new Date().toISOString(),
      status: 'PENDING_CONFIRMATION',
    };

    set((state) => ({
      appointments: [newAppt, ...state.appointments],
      timeSlots: state.timeSlots.map((s) => {
        if (s.time === apptData.timeSlot) {
          const booked = s.bookedCount + 1;
          return { ...s, bookedCount: booked, isAvailable: booked < s.maxCapacity };
        }
        return s;
      }),
    }));

    get().recordAuditLog({
      actorName: apptData.patientName,
      actorRole: 'Bệnh nhân',
      action: 'BOOK_APPOINTMENT',
      entityType: 'Appointment',
      entityId: newAppt.id,
      newValues: JSON.stringify(newAppt, null, 2),
      notes: `Đăng ký lịch khám qua ${apptData.source}. Bác sĩ: ${apptData.doctorName}`,
    });

    return newAppt;
  },

  cancelAppointment: (id, reason = 'Bệnh nhân bận việc đột xuất') => {
    const target = get().appointments.find((a) => a.id === id);
    if (!target) return;

    set((state) => ({
      appointments: state.appointments.map((a) => (a.id === id ? { ...a, status: 'CANCELLED' } : a)),
    }));

    get().recordAuditLog({
      actorName: 'Bệnh nhân / Lễ tân',
      actorRole: 'Hệ thống',
      action: 'CANCEL_APPOINTMENT',
      entityType: 'Appointment',
      entityId: id,
      oldValues: JSON.stringify({ status: target.status }, null, 2),
      newValues: JSON.stringify({ status: 'CANCELLED', reason }, null, 2),
      notes: `Hủy lịch hẹn ${target.appointmentCode}: ${reason}`,
    });
  },

  confirmAppointment: (id) => {
    const target = get().appointments.find((a) => a.id === id);
    if (!target) return;

    set((state) => ({
      appointments: state.appointments.map((a) => (a.id === id ? { ...a, status: 'CONFIRMED' } : a)),
    }));

    get().recordAuditLog({
      actorName: 'Lễ tân',
      actorRole: 'Tiếp đón',
      action: 'CONFIRM_APPOINTMENT',
      entityType: 'Appointment',
      entityId: id,
      oldValues: JSON.stringify({ status: target.status }, null, 2),
      newValues: JSON.stringify({ status: 'CONFIRMED' }, null, 2),
      notes: `Lễ tân phê duyệt xác nhận lịch hẹn ${target.appointmentCode}`,
    });
  },

  changeAppointmentTime: (id, newDate, newSlot) => {
    const target = get().appointments.find((a) => a.id === id);
    if (!target) return;

    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, date: newDate, timeSlot: newSlot } : a
      ),
    }));

    get().recordAuditLog({
      actorName: 'Bệnh nhân',
      actorRole: 'Người dùng',
      action: 'RESCHEDULE_APPOINTMENT',
      entityType: 'Appointment',
      entityId: id,
      oldValues: JSON.stringify({ date: target.date, timeSlot: target.timeSlot }, null, 2),
      newValues: JSON.stringify({ date: newDate, timeSlot: newSlot }, null, 2),
      notes: `Đổi lịch hẹn sang ${newSlot} ngày ${newDate}`,
    });
  },

  checkInAppointment: (appointmentId) => {
    const appt = get().appointments.find((a) => a.id === appointmentId);
    if (!appt) throw new Error('Không tìm thấy lịch hẹn');

    const doctor = DOCTORS_DATA.find((d) => d.id === appt.doctorId) || DOCTORS_DATA[0];
    const queueNum = get().visits.length + 1;
    const prefix = doctor.id === 'DOC-01' ? 'A' : 'B';
    const visitCode = `${prefix}-${String(queueNum).padStart(3, '0')}`;

    const newVisit: Visit = {
      id: 'vis_' + Date.now(),
      visitCode,
      queueNumber: queueNum,
      appointmentId: appt.id,
      patientId: appt.patientId,
      patientName: appt.patientName,
      patientPhone: appt.patientPhone,
      patientDob: appt.patientDob || '1990-01-01',
      patientGender: appt.patientGender || 'Nam',
      patientAllergies: [],
      bloodType: 'O+',
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      roomNumber: doctor.roomNumber,
      specialtyName: doctor.specialtyName,
      checkInTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      status: 'WAITING_EXAM',
      currentStepMessage: `Đang đợi gọi vào ${doctor.roomNumber} - BS. ${doctor.title} ${doctor.fullName}`,
      emr: {
        id: 'emr_' + Date.now(),
        visitId: 'vis_' + Date.now(),
        patientId: appt.patientId,
        chiefComplaint: appt.symptoms,
        medicalHistory: 'Chưa có tiền sử dị ứng đặc biệt',
        presentIllness: appt.symptoms,
        physicalExam: '',
        preliminaryDiagnosis: '',
        icd10Code: '',
        vitalSigns: {
          heightCm: 168,
          weightKg: 62,
          bmi: 22.0,
          bmiCategory: 'Bình thường (WHO)',
          pulseBpm: 76,
          systolicBp: 118,
          diastolicBp: 78,
          temperatureC: 36.6,
          spo2Percent: 99,
        },
        conclusion: '',
        clinicalOrders: [],
        updatedAt: new Date().toISOString(),
      },
    };

    set((state) => ({
      appointments: state.appointments.map((a) => (a.id === appointmentId ? { ...a, status: 'ARRIVED' } : a)),
      visits: [newVisit, ...state.visits],
      selectedPatientVisitId: newVisit.id,
    }));

    get().recordAuditLog({
      actorName: 'Phạm Thu Hà',
      actorRole: 'Lễ tân tiếp đón',
      action: 'CHECK_IN_TO_VISIT',
      entityType: 'Visit',
      entityId: newVisit.id,
      oldValues: JSON.stringify({ appointmentStatus: appt.status }, null, 2),
      newValues: JSON.stringify({
        visitCode,
        roomNumber: doctor.roomNumber,
        status: 'WAITING_EXAM',
      }, null, 2),
      notes: `Tiếp đón bệnh nhân ${appt.patientName}, cấp STT: ${visitCode}`,
    });

    return newVisit;
  },

  registerWalkIn: (patientName, phone, specialtyId, doctorId, symptoms) => {
    const doctor = DOCTORS_DATA.find((d) => d.id === doctorId) || DOCTORS_DATA[0];
    const queueNum = get().visits.length + 1;
    const visitCode = `W-${String(queueNum).padStart(3, '0')}`;
    const newVisitId = 'vis_walkin_' + Date.now();

    const newVisit: Visit = {
      id: newVisitId,
      visitCode,
      queueNumber: queueNum,
      patientId: 'usr_walkin_' + Date.now(),
      patientName,
      patientPhone: phone,
      patientDob: '1988-01-01',
      patientGender: 'Nam',
      patientAllergies: [],
      bloodType: 'Chưa rõ',
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      roomNumber: doctor.roomNumber,
      specialtyName: doctor.specialtyName,
      checkInTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      status: 'WAITING_EXAM',
      currentStepMessage: `Đang đợi gọi vào ${doctor.roomNumber} - BS. ${doctor.title} ${doctor.fullName}`,
      emr: {
        id: 'emr_' + Date.now(),
        visitId: newVisitId,
        patientId: 'usr_walkin_' + Date.now(),
        chiefComplaint: symptoms,
        medicalHistory: 'Khách đến khám trực tiếp tại quầy, chưa có bệnh án cũ',
        presentIllness: symptoms,
        physicalExam: '',
        preliminaryDiagnosis: '',
        icd10Code: '',
        vitalSigns: {
          heightCm: 170,
          weightKg: 65,
          bmi: 22.5,
          bmiCategory: 'Bình thường (WHO)',
          pulseBpm: 80,
          systolicBp: 120,
          diastolicBp: 80,
          temperatureC: 36.7,
          spo2Percent: 98,
        },
        conclusion: '',
        clinicalOrders: [],
        updatedAt: new Date().toISOString(),
      },
    };

    set((state) => ({
      visits: [newVisit, ...state.visits],
      selectedPatientVisitId: newVisit.id,
    }));

    get().recordAuditLog({
      actorName: 'Phạm Thu Hà',
      actorRole: 'Lễ tân tiếp đón',
      action: 'WALK_IN_REGISTRATION',
      entityType: 'Visit',
      entityId: newVisit.id,
      newValues: JSON.stringify({
        patientName,
        phone,
        visitCode,
        roomNumber: doctor.roomNumber,
      }, null, 2),
      notes: `Đón tiếp khách vãng lai (Walk-in trực tiếp): ${patientName}`,
    });

    return newVisit;
  },

  callNextPatient: (visitId) => {
    set((state) => ({
      visits: state.visits.map((v) =>
        v.id === visitId
          ? {
              ...v,
              status: 'IN_EXAM_PRIMARY',
              currentStepMessage: `Mời vào phòng ${v.roomNumber} - BS. ${v.doctorName}`,
            }
          : v
      ),
      selectedPatientVisitId: visitId,
    }));
  },

  togglePatientAbsent: (visitId) => {
    set((state) => ({
      visits: state.visits.map((v) =>
        v.id === visitId ? { ...v, isAbsent: !v.isAbsent } : v
      ),
    }));
  },

  updateVitalSigns: (visitId, vitals, doctorName) => {
    const current = get().visits.find((v) => v.id === visitId);
    const oldV = current?.emr?.vitalSigns;

    set((state) => ({
      visits: state.visits.map((v) => {
        if (v.id === visitId && v.emr) {
          return {
            ...v,
            status: v.status === 'WAITING_EXAM' ? 'IN_EXAM_PRIMARY' : v.status,
            currentStepMessage: `Đang được BS. ${doctorName} thăm khám tại ${v.roomNumber}`,
            emr: {
              ...v.emr,
              vitalSigns: vitals,
              updatedAt: new Date().toISOString(),
            },
          };
        }
        return v;
      }),
    }));

    get().recordAuditLog({
      actorName: doctorName,
      actorRole: 'Bác sĩ khám chính',
      action: 'UPDATE_VITAL_SIGNS',
      entityType: 'MedicalRecord',
      entityId: visitId,
      oldValues: JSON.stringify(oldV || {}, null, 2),
      newValues: JSON.stringify(vitals, null, 2),
      notes: `Cập nhật chỉ số sinh tồn: HA ${vitals.systolicBp}/${vitals.diastolicBp} mmHg, BMI: ${vitals.bmi.toFixed(1)}`,
    });
  },

  updateEmrDiagnosis: (visitId, preliminaryDiagnosis, icd10, conclusion, doctorName) => {
    const current = get().visits.find((v) => v.id === visitId);
    const oldDiagnosis = current?.emr?.preliminaryDiagnosis;

    set((state) => ({
      visits: state.visits.map((v) => {
        if (v.id === visitId && v.emr) {
          return {
            ...v,
            emr: {
              ...v.emr,
              preliminaryDiagnosis,
              icd10Code: icd10,
              conclusion,
              updatedAt: new Date().toISOString(),
            },
          };
        }
        return v;
      }),
    }));

    get().recordAuditLog({
      actorName: doctorName,
      actorRole: 'Bác sĩ khám chính',
      action: 'UPDATE_EMR_DIAGNOSIS',
      entityType: 'MedicalRecord',
      entityId: visitId,
      oldValues: JSON.stringify({ preliminaryDiagnosis: oldDiagnosis }, null, 2),
      newValues: JSON.stringify({ preliminaryDiagnosis, icd10Code: icd10, conclusion }, null, 2),
      notes: `Lưu chẩn đoán sơ bộ: ${preliminaryDiagnosis} (${icd10})`,
    });
  },

  createClinicalOrder: (visitId, serviceName, serviceCode, department, clinicalReason, orderingDoctorId, orderingDoctorName) => {
    const orderCode = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const targetVisit = get().visits.find((v) => v.id === visitId);

    const newOrder: ClinicalOrder = {
      id: 'ord_' + Date.now(),
      orderCode,
      visitId,
      patientId: targetVisit?.patientId || 'usr_pat_01',
      patientName: targetVisit?.patientName || 'Bệnh nhân',
      orderingDoctorId,
      orderingDoctorName,
      targetDepartment: department,
      serviceName,
      serviceCode,
      clinicalReason,
      status: 'ORDERED',
      orderedAt: new Date().toISOString(),
    };

    set((state) => ({
      visits: state.visits.map((v) => {
        if (v.id === visitId) {
          const updatedOrders = v.emr ? [...v.emr.clinicalOrders, newOrder] : [newOrder];
          return {
            ...v,
            status: 'AWAITING_SUBCLINICAL', // Bệnh nhân rời phòng đi cận lâm sàng!
            currentStepMessage: `Đang thực hiện ${serviceName} tại ${department}`,
            emr: v.emr ? { ...v.emr, clinicalOrders: updatedOrders } : undefined,
          };
        }
        return v;
      }),
    }));

    get().recordAuditLog({
      actorName: orderingDoctorName,
      actorRole: 'Bác sĩ khám chính',
      action: 'CREATE_CLINICAL_ORDER',
      entityType: 'ClinicalOrder',
      entityId: newOrder.id,
      newValues: JSON.stringify({
        orderCode,
        serviceName,
        targetDepartment: department,
        clinicalReason,
        status: 'ORDERED',
      }, null, 2),
      notes: `Chỉ định cận lâm sàng liên khoa gửi ${department}`,
    });

    return newOrder;
  },

  acceptClinicalOrder: (orderId, doctorId, doctorName) => {
    set((state) => ({
      visits: state.visits.map((v) => {
        if (!v.emr) return v;
        const updated = v.emr.clinicalOrders.map((o) =>
          o.id === orderId
            ? { ...o, status: 'IN_PROGRESS' as const, assignedDoctorId: doctorId, assignedDoctorName: doctorName }
            : o
        );
        return {
          ...v,
          emr: { ...v.emr, clinicalOrders: updated },
        };
      }),
    }));

    get().recordAuditLog({
      actorName: doctorName,
      actorRole: 'Bác sĩ Cận lâm sàng',
      action: 'ACCEPT_SUBCLINICAL_ORDER',
      entityType: 'ClinicalOrder',
      entityId: orderId,
      newValues: JSON.stringify({ assignedDoctorId: doctorId, status: 'IN_PROGRESS' }, null, 2),
      notes: `Bác sĩ CĐHA tiếp nhận thực hiện phiếu chỉ định`,
    });
  },

  submitSubclinicalResult: (orderId, imageUrl, findings, conclusion, doctorName) => {
    let orderMatched = false;
    let visitIdMatched = '';

    set((state) => ({
      visits: state.visits.map((v) => {
        if (!v.emr) return v;
        const updated = v.emr.clinicalOrders.map((o) => {
          if (o.id === orderId) {
            orderMatched = true;
            visitIdMatched = v.id;
            return {
              ...o,
              status: 'COMPLETED' as const,
              resultImageUrl: imageUrl,
              findingsDescription: findings,
              conclusion,
              completedAt: new Date().toISOString(),
              assignedDoctorName: doctorName,
            };
          }
          return o;
        });

        if (orderMatched && visitIdMatched === v.id) {
          return {
            ...v,
            status: 'RESULTS_READY', // Báo đèn tím nhấp nháy cho DOC-01!
            currentStepMessage: 'Đã có kết quả Cận lâm sàng - Đang chờ Bác sĩ khám chính kết luận',
            emr: { ...v.emr, clinicalOrders: updated },
          };
        }
        return v;
      }),
    }));

    get().recordAuditLog({
      actorName: doctorName,
      actorRole: 'Bác sĩ Cận lâm sàng',
      action: 'SUBMIT_SUBCLINICAL_RESULT',
      entityType: 'ClinicalOrder',
      entityId: orderId,
      newValues: JSON.stringify({
        status: 'COMPLETED',
        findings,
        conclusion,
        completedAt: new Date().toISOString(),
      }, null, 2),
      notes: `Khoa CĐHA hoàn tất mô tả hình ảnh và trả kết quả về Bác sĩ khám chính (DOC-01)`,
    });
  },

  createPrescription: (visitId, prescriptionData, doctorName) => {
    const code = `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRx: Prescription = {
      ...prescriptionData,
      id: 'rx_' + Date.now(),
      code,
      visitId,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      visits: state.visits.map((v) => {
        if (v.id === visitId && v.emr) {
          return {
            ...v,
            status: 'COMPLETED',
            currentStepMessage: 'Hoàn tất lượt khám - Bệnh nhân nhận đơn thuốc và kết thúc ca khám',
            emr: {
              ...v.emr,
              prescription: newRx,
              updatedAt: new Date().toISOString(),
            },
          };
        }
        return v;
      }),
    }));

    get().recordAuditLog({
      actorName: doctorName,
      actorRole: 'Bác sĩ khám chính',
      action: 'PRESCRIBE_MEDICATION',
      entityType: 'Prescription',
      entityId: newRx.id,
      newValues: JSON.stringify(newRx, null, 2),
      notes: `Kê đơn thuốc ngoại trú ${code} và hoàn tất ca khám`,
    });
  },

  editCompletedEmrOrPrescription: (visitId, updatedDiagnosis, editReason, doctorName) => {
    const target = get().visits.find((v) => v.id === visitId);
    if (!target || !target.emr) return;

    const oldEMR = {
      preliminaryDiagnosis: target.emr.preliminaryDiagnosis,
      conclusion: target.emr.conclusion,
      prescriptionDiagnosis: target.emr.prescription?.diagnosis,
    };

    const newEMR = {
      preliminaryDiagnosis: updatedDiagnosis,
      conclusion: `${target.emr.conclusion} [Đã điều chỉnh: ${editReason}]`,
      prescriptionDiagnosis: updatedDiagnosis,
    };

    set((state) => ({
      visits: state.visits.map((v) => {
        if (v.id === visitId && v.emr) {
          return {
            ...v,
            emr: {
              ...v.emr,
              preliminaryDiagnosis: updatedDiagnosis,
              conclusion: newEMR.conclusion,
              prescription: v.emr.prescription
                ? { ...v.emr.prescription, diagnosis: updatedDiagnosis }
                : undefined,
              updatedAt: new Date().toISOString(),
            },
          };
        }
        return v;
      }),
    }));

    get().recordAuditLog({
      actorName: doctorName,
      actorRole: 'Bác sĩ khám chính',
      action: 'EDIT_COMPLETED_EMR_RECORD',
      entityType: 'MedicalRecord',
      entityId: target.emr.id,
      oldValues: JSON.stringify(oldEMR, null, 2),
      newValues: JSON.stringify(newEMR, null, 2),
      notes: `Bác sĩ chỉnh sửa hồ sơ/đơn thuốc đã hoàn tất. Lý do: "${editReason}"`,
    });
  },

  createDepartmentReferral: (visitId, toDepartment, reason, referralType, doctorId) => {
    const referral: DepartmentReferral = {
      id: 'ref_' + Date.now(),
      visitId,
      fromDoctorId: doctorId,
      toDepartmentName: toDepartment,
      reason,
      referralType,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      visits: state.visits.map((v) => {
        if (v.id === visitId && v.emr) {
          return {
            ...v,
            emr: { ...v.emr, referral },
          };
        }
        return v;
      }),
    }));

    get().recordAuditLog({
      actorName: 'BS.CKII Nguyễn Minh Tuấn',
      actorRole: 'Bác sĩ khám chính',
      action: 'CREATE_DEPARTMENT_REFERRAL',
      entityType: 'MedicalRecord',
      entityId: referral.id,
      newValues: JSON.stringify(referral, null, 2),
      notes: `Lập phiếu chuyển viện / chuyển chuyên khoa: ${toDepartment}. Lý do: ${reason}`,
    });
  },

  toggleRagDocActive: (docId, adminName) => {
    const doc = get().ragDocuments.find((d) => d.id === docId);
    if (!doc) return;

    set((state) => ({
      ragDocuments: state.ragDocuments.map((d) =>
        d.id === docId ? { ...d, isActive: !d.isActive } : d
      ),
    }));

    get().recordAuditLog({
      actorName: adminName,
      actorRole: 'Quản trị viên RAG',
      action: 'TOGGLE_RAG_DOCUMENT_ACTIVE',
      entityType: 'RagDocument',
      entityId: docId,
      oldValues: JSON.stringify({ isActive: doc.isActive }, null, 2),
      newValues: JSON.stringify({ isActive: !doc.isActive }, null, 2),
      notes: `Thay đổi hiệu lực tài liệu RAG: ${doc.title}`,
    });
  },

  approveAndIndexRagDoc: (docId, adminName) => {
    const doc = get().ragDocuments.find((d) => d.id === docId);
    if (!doc) return;

    set((state) => ({
      ragDocuments: state.ragDocuments.map((d) =>
        d.id === docId
          ? { ...d, vectorDbStatus: 'INDEXED_PINECONE', isActive: true }
          : d
      ),
    }));

    get().recordAuditLog({
      actorName: adminName,
      actorRole: 'Quản trị viên RAG',
      action: 'INDEX_RAG_DOCUMENT_PINECONE',
      entityType: 'RagDocument',
      entityId: docId,
      oldValues: JSON.stringify({ vectorDbStatus: doc.vectorDbStatus, isActive: doc.isActive }, null, 2),
      newValues: JSON.stringify({ vectorDbStatus: 'INDEXED_PINECONE', isActive: true }, null, 2),
      notes: `Phê duyệt băm đoạn & Lập chỉ mục Vector Pinecone thành công: ${doc.title}`,
    });
  },

  addRagDoc: (docData, adminName) => {
    const newDoc: RagDocument = {
      ...docData,
      id: 'RAG-DOC-' + Date.now(),
      updatedAt: new Date().toISOString().substring(0, 10),
      vectorDbStatus: 'INDEXED_PINECONE',
    };

    set((state) => ({
      ragDocuments: [newDoc, ...state.ragDocuments],
    }));

    get().recordAuditLog({
      actorName: adminName,
      actorRole: 'Quản trị viên RAG',
      action: 'UPLOAD_RAG_DOCUMENT',
      entityType: 'RagDocument',
      entityId: newDoc.id,
      newValues: JSON.stringify(newDoc, null, 2),
      notes: `Tải lên và lập chỉ mục Vector tài liệu mới: ${newDoc.title} (${newDoc.version})`,
    });
  },

  updateTimeSlotCapacity: (slotId, newMax) => {
    set((state) => ({
      timeSlots: state.timeSlots.map((s) =>
        s.id === slotId
          ? {
              ...s,
              maxCapacity: newMax,
              isAvailable: s.bookedCount < newMax,
            }
          : s
      ),
    }));
  },

  // =========================================================================
  // USER & ROLE PERMISSION MANAGEMENT
  // =========================================================================
  updateUserRole: (userId, newRole, department, adminName = 'Quản trị viên') => {
    const targetUser = get().users.find((u) => u.id === userId);
    if (!targetUser) return;
    const oldRole = targetUser.role;

    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId
          ? {
              ...u,
              role: newRole,
              department: department !== undefined ? department : u.department,
            }
          : u
      ),
    }));

    get().recordAuditLog({
      actorName: adminName,
      actorRole: 'Quản trị viên Hệ thống',
      action: 'UPDATE_USER_ROLE_PERMISSION',
      entityType: 'User',
      entityId: userId,
      oldValues: JSON.stringify({ role: oldRole, department: targetUser.department }, null, 2),
      newValues: JSON.stringify({ role: newRole, department: department ?? targetUser.department }, null, 2),
      notes: `Phân quyền người dùng: Thay đổi vai trò của ${targetUser.fullName} từ [${oldRole}] sang [${newRole}]`,
    });
  },

  toggleUserStatus: (userId, adminName = 'Quản trị viên') => {
    const targetUser = get().users.find((u) => u.id === userId);
    if (!targetUser) return;
    const nextStatus = targetUser.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';

    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, status: nextStatus } : u
      ),
    }));

    get().recordAuditLog({
      actorName: adminName,
      actorRole: 'Quản trị viên Hệ thống',
      action: nextStatus === 'LOCKED' ? 'LOCK_USER_ACCOUNT' : 'UNLOCK_USER_ACCOUNT',
      entityType: 'User',
      entityId: userId,
      oldValues: JSON.stringify({ status: targetUser.status }, null, 2),
      newValues: JSON.stringify({ status: nextStatus }, null, 2),
      notes: `${nextStatus === 'LOCKED' ? 'Khóa' : 'Kích hoạt mở khóa'} tài khoản người dùng: ${targetUser.fullName} (${targetUser.email})`,
    });
  },

  createUser: (userData, adminName = 'Quản trị viên') => {
    const newUser: HospitalUser = {
      ...userData,
      id: 'usr_' + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString().substring(0, 10),
      lastLogin: 'Chưa đăng nhập',
    };

    set((state) => ({
      users: [newUser, ...state.users],
    }));

    get().recordAuditLog({
      actorName: adminName,
      actorRole: 'Quản trị viên Hệ thống',
      action: 'CREATE_USER_ACCOUNT',
      entityType: 'User',
      entityId: newUser.id,
      newValues: JSON.stringify(newUser, null, 2),
      notes: `Tạo tài khoản người dùng mới: ${newUser.fullName} (${newUser.email}) - Vai trò: [${newUser.role}]`,
    });

    return newUser;
  },

  deleteUser: (userId, adminName = 'Quản trị viên') => {
    const targetUser = get().users.find((u) => u.id === userId);
    if (!targetUser) return;

    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
    }));

    get().recordAuditLog({
      actorName: adminName,
      actorRole: 'Quản trị viên Hệ thống',
      action: 'DELETE_USER_ACCOUNT',
      entityType: 'User',
      entityId: userId,
      oldValues: JSON.stringify(targetUser, null, 2),
      notes: `Xóa tài khoản người dùng: ${targetUser.fullName} (${targetUser.email})`,
    });
  },

  // =========================================================================
  // NEWS & ARTICLES MANAGEMENT
  // =========================================================================
  createArticle: (articleData, authorName = 'Ban Biên tập') => {
    const newArticle: HospitalArticle = {
      ...articleData,
      id: 'art_' + Date.now().toString().slice(-6),
      viewsCount: 0,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    set((state) => ({
      articles: [newArticle, ...state.articles],
    }));

    get().recordAuditLog({
      actorName: authorName,
      actorRole: 'Ban Quản trị Nội dung',
      action: 'PUBLISH_HOSPITAL_ARTICLE',
      entityType: 'Article',
      entityId: newArticle.id,
      newValues: JSON.stringify(newArticle, null, 2),
      notes: `Đăng bài viết mới: "${newArticle.title}" - Chuyên mục: ${newArticle.category}${newArticle.isFeaturedOnHome ? ' (Nổi bật trang chủ)' : ''}`,
    });

    return newArticle;
  },

  updateArticle: (id, updates, authorName = 'Ban Biên tập') => {
    const target = get().articles.find((a) => a.id === id);
    if (!target) return;

    set((state) => ({
      articles: state.articles.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));

    get().recordAuditLog({
      actorName: authorName,
      actorRole: 'Ban Quản trị Nội dung',
      action: 'UPDATE_HOSPITAL_ARTICLE',
      entityType: 'Article',
      entityId: id,
      oldValues: JSON.stringify(target, null, 2),
      newValues: JSON.stringify({ ...target, ...updates }, null, 2),
      notes: `Cập nhật bài viết: "${target.title}"`,
    });
  },

  deleteArticle: (id, adminName = 'Quản trị viên') => {
    const target = get().articles.find((a) => a.id === id);
    if (!target) return;

    set((state) => ({
      articles: state.articles.filter((a) => a.id !== id),
    }));

    get().recordAuditLog({
      actorName: adminName,
      actorRole: 'Ban Quản trị Nội dung',
      action: 'DELETE_HOSPITAL_ARTICLE',
      entityType: 'Article',
      entityId: id,
      oldValues: JSON.stringify(target, null, 2),
      notes: `Xóa bài viết: "${target.title}" khỏi hệ thống`,
    });
  },

  togglePublishArticle: (id, adminName = 'Quản trị viên') => {
    const target = get().articles.find((a) => a.id === id);
    if (!target) return;
    const nextPublished = !target.isPublished;

    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === id ? { ...a, isPublished: nextPublished } : a
      ),
    }));

    get().recordAuditLog({
      actorName: adminName,
      actorRole: 'Ban Quản trị Nội dung',
      action: nextPublished ? 'PUBLISH_ARTICLE' : 'UNPUBLISH_ARTICLE',
      entityType: 'Article',
      entityId: id,
      newValues: JSON.stringify({ isPublished: nextPublished }, null, 2),
      notes: `${nextPublished ? 'Xuất bản công khai' : 'Gỡ bỏ (chuyển bản nháp)'} bài viết "${target.title}"`,
    });
  },

  toggleFeatureArticle: (id, adminName = 'Quản trị viên') => {
    const target = get().articles.find((a) => a.id === id);
    if (!target) return;
    const nextFeatured = !target.isFeaturedOnHome;

    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === id ? { ...a, isFeaturedOnHome: nextFeatured } : a
      ),
    }));

    get().recordAuditLog({
      actorName: adminName,
      actorRole: 'Ban Quản trị Nội dung',
      action: nextFeatured ? 'FEATURE_ARTICLE_ON_HOME' : 'UNFEATURE_ARTICLE_ON_HOME',
      entityType: 'Article',
      entityId: id,
      newValues: JSON.stringify({ isFeaturedOnHome: nextFeatured }, null, 2),
      notes: `${nextFeatured ? 'Ghim bài viết lên vị trí Nổi bật Trang chủ' : 'Bỏ ghim khỏi Trang chủ'}: "${target.title}"`,
    });
  },
}));
