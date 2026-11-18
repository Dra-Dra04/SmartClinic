import { axiosClient } from './axiosClient';
export interface ProfileRequest {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: '' | 'Nam' | 'Nữ' | 'Khác';
  idCardNumber: string | null;
  healthInsuranceNumber: string | null;
  address: string;
  heightCm: number | null;
  weightKg: number | null;
  bloodType: string | null;
  allergies: string | null;
  medicalHistory: string | null;
}
export interface ProfileResponse extends ProfileRequest {
  id: string;
  email: string;
  isProfileCompleted: boolean;
}
export const profileService = {
  async get() { return (await axiosClient.get<ProfileResponse>('/patients/me')).data; },
  async update(request: ProfileRequest) {
    return (await axiosClient.put<ProfileResponse>('/patients/me', request)).data;
  },
};
