import { UserProfile } from '../types';
import { API_URL, request } from './client';

export interface PatientDto {
  id: string; email: string; phone: string; fullName: string | null;
  dateOfBirth: string | null; gender: UserProfile['gender'] | null;
  idCardNumber: string | null; healthInsuranceNumber: string | null; address: string | null;
  heightCm: number | null; weightKg: number | null; bloodType: string | null;
  allergies: string | null; medicalHistory: string | null;
  isProfileCompleted: boolean; avatarUrl: string | null;
}
export function toProfile(p: PatientDto): UserProfile {
  return { id: p.id, email: p.email, phone: p.phone, fullName: p.fullName ?? '', role: 'patient',
    dateOfBirth: p.dateOfBirth ?? undefined, gender: p.gender ?? undefined,
    idCardNumber: p.idCardNumber ?? '', healthInsuranceNumber: p.healthInsuranceNumber ?? '',
    address: p.address ?? '', heightCm: p.heightCm ?? undefined, weightKg: p.weightKg ?? undefined,
    bloodType: p.bloodType ?? '', allergies: p.allergies ? p.allergies.split('\n') : [],
    medicalHistory: p.medicalHistory ? p.medicalHistory.split('\n') : [],
    isProfileCompleted: p.isProfileCompleted, avatarUrl: p.avatarUrl ?? undefined };
}
export function profilePayload(p: UserProfile) {
  if (!p.fullName.trim() || !p.address?.trim() || !p.gender) throw new Error('Vui lòng nhập họ tên, địa chỉ và giới tính.');
  if (!/^\+?[0-9]{9,15}$/.test(p.phone)) throw new Error('Số điện thoại cần từ 9 đến 15 chữ số.');
  const dob = p.dateOfBirth || '';
  const parsed = new Date(`${dob}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== dob || parsed.getTime() > Date.now())
    throw new Error('Ngày sinh phải hợp lệ, theo định dạng YYYY-MM-DD và không ở tương lai.');
  if (!p.idCardNumber?.trim() && !p.healthInsuranceNumber?.trim()) throw new Error('Vui lòng nhập CCCD hoặc mã BHYT.');
  for (const value of [p.heightCm, p.weightKg]) if (value != null && (!Number.isFinite(value) || value <= 0 || value > 9999.99)) throw new Error('Chiều cao và cân nặng phải là số dương hợp lệ.');
  return { fullName: p.fullName.trim(), phone: p.phone.trim(), dateOfBirth: dob, gender: p.gender,
    idCardNumber: p.idCardNumber?.trim() || null, healthInsuranceNumber: p.healthInsuranceNumber?.trim() || null,
    address: p.address.trim(), heightCm: p.heightCm ?? null, weightKg: p.weightKg ?? null,
    bloodType: p.bloodType?.trim() || null, allergies: p.allergies?.join('\n') || null,
    medicalHistory: p.medicalHistory?.join('\n') || null };
}
export const getPatient = async (token: string) => toProfile(await request<PatientDto>('/api/patients/me', {}, token));
export const savePatient = async (token: string, user: UserProfile) =>
  toProfile(await request<PatientDto>('/api/patients/me', { method: 'PUT', body: JSON.stringify(profilePayload(user)) }, token));

export function patientAvatarSource(token: string | undefined, user: UserProfile, refresh: number) {
  if (!token || !user.avatarUrl) return undefined;
  return {
    uri: API_URL + '/api/patients/me/avatar?version=' + encodeURIComponent(user.avatarUrl) +
      '&refresh=' + refresh + '&u=' + encodeURIComponent(user.id),
    headers: { Authorization: 'Bearer ' + token },
  };
}
