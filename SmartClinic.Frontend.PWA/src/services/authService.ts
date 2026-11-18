import axios from 'axios';
import { axiosClient } from './axiosClient';

export interface CurrentUserDto {
  doctorWorkspace?: 'Consultation' | 'ClinicalService' | null;
  userId: string;
  email: string;
  role: 'Patient' | 'Doctor' | 'Admin' | 'Receptionist';
}
export interface LoginResponse extends CurrentUserDto {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
}
export interface RegisterRequest {
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}
export const authService = {
  async register(request: RegisterRequest) {
    return (await axiosClient.post<CurrentUserDto>('/auth/register', request)).data;
  },
  async login(email: string, password: string) {
    return (await axiosClient.post<LoginResponse>('/auth/login', { email, password })).data;
  },
  async me() {
    return (await axiosClient.get<CurrentUserDto>('/auth/me')).data;
  },
};
export function authErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.';
  if (!error.response) return 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.';
  if (error.response.status === 429) return 'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau một phút.';
  const problem = error.response.data;
  if (problem?.errors && typeof problem.errors === 'object') {
    const messages = Object.values(problem.errors).flat().filter(value => typeof value === 'string');
    if (messages.length) return messages.join(' ');
  }
  if (typeof problem?.title === 'string') return problem.title;
  if (error.response.status === 401) return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
  return 'Máy chủ chưa xử lý được yêu cầu. Vui lòng thử lại.';
}
