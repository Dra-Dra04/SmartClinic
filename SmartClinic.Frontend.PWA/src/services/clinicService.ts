import { axiosClient as api } from './axiosClient';
export interface Department { id: number; code: string; name: string; isActive: boolean }
export interface ClinicDoctor {
  id: string; fullName: string; specialtyId: number; departmentId: number | null; departmentName: string | null;
  title: string; position: string; bio: string; expertise: string; education: string; workHistory: string; certificates: string;
  consultationFee: number; isPublished: boolean; isFeatured: boolean; acceptingBookings: boolean; sortOrder: number; hasPhoto: boolean;
}
export interface Schedule { id: string; doctorId: string; doctorName: string; startTime: string; endTime: string; room: string; slotMinutes: number; isActive: boolean; booked: number; totalSlots: number; hasAppointments: boolean }
export interface Slot { id: string; startTime: string; endTime: string; room: string }
export interface ClinicAppointment { doctorId: string;  id: string; status: string; symptom: string; startTime: string; endTime: string; doctorName: string; departmentName: string }
export const clinicService = {
  departments: async () => (await api.get<Department[]>('/clinic/departments')).data,
  saveDepartment: async (data: Partial<Department>) => data.id ? api.put('/clinic/departments/'+data.id,data) : api.post('/clinic/departments',data),
  doctors: async (admin = false, featured = false) => (await api.get<ClinicDoctor[]>(admin ? '/clinic/admin/doctors' : '/clinic/doctors', {params:{featured}})).data,
  saveDoctor: (d: ClinicDoctor) => api.put('/clinic/admin/doctors/'+d.id,d),
  photo: (id: string) => api.getUri({url:'/clinic/doctors/'+id+'/photo'}),
  uploadPhoto: (id: string, file: File) => { const data=new FormData(); data.append('file',file); return api.post('/clinic/admin/doctors/'+id+'/photo',data); },
  schedules: async () => (await api.get<Schedule[]>('/clinic/admin/schedules')).data,
  createSchedule: (data: {doctorId:string;startTime:string;endTime:string;slotMinutes:number;room:string}) => api.post('/clinic/admin/schedules',data),
  removeSchedule: (id: string) => api.delete('/clinic/admin/schedules/'+id),
  slots: async (id: string,date:string) => (await api.get<Slot[]>('/clinic/doctors/'+id+'/slots',{params:{date}})).data,
  book: (timeSlotId:string,symptom:string) => api.post('/clinic/appointments',{timeSlotId,symptom}),
  appointments: async () => (await api.get<ClinicAppointment[]>('/clinic/appointments')).data,
};
export const clinicTime = (value:string) => new Date(/(Z|[+-]\d\d:\d\d)$/.test(value)?value:value+'Z').toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',dateStyle:'short',timeStyle:'short'});
