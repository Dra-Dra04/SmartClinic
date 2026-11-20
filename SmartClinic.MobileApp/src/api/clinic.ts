import { API_URL, request } from './client';
export interface ClinicDoctor {
 id:string;fullName:string;departmentId:number;departmentName:string;title:string;position:string;bio:string;expertise:string;education:string;workHistory:string;certificates:string;consultationFee:number;hasPhoto:boolean;acceptingBookings:boolean;isFeatured:boolean;
}
export interface ClinicSlot {id:string;startTime:string;endTime:string;room:string}
export interface ClinicAppointment { doctorId: string; id:string;doctorName:string;departmentName:string;startTime:string;status:string;symptom:string}
export const doctorPhoto=(id:string)=>`${API_URL}/api/clinic/doctors/${id}/photo`;
export const loadDoctors=()=>request<ClinicDoctor[]>('/api/clinic/doctors');
export const loadDepartments=()=>request<{id:number;code:string;name:string}[]>('/api/clinic/departments');
export const loadSlots=(id:string,date:string)=>request<ClinicSlot[]>(`/api/clinic/doctors/${id}/slots?date=${encodeURIComponent(date)}`);
export const bookSlot=(id:string,symptom:string,token:string)=>request('/api/clinic/appointments',{method:'POST',body:JSON.stringify({timeSlotId:id,symptom})},token);
export const loadAppointments=(token:string)=>request<ClinicAppointment[]>('/api/clinic/appointments',{},token);
export const clinicTime=(s:string)=>new Date(/(Z|[+-]\d\d:\d\d)$/.test(s)?s:s+'Z').toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
