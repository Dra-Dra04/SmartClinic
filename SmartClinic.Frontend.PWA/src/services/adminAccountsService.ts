import type { UserRole } from '../types';
import { axiosClient } from './axiosClient';

export interface AdminAccount {
  id: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  specialtyName: string | null;
  specialtyId: number | null;
  fullName: string | null;
  avatarUrl: string | null;
  doctorWorkspace: string | null;
}

export interface AccountList {
  items: AdminAccount[];
  hasMore: boolean;
  filteredTotal: number;
  summary: {
    total: number;
    doctors: number;
    receptionists: number;
    patients: number;
    locked: number;
  };
}

export function accountRole(account: AdminAccount): UserRole | null {
  switch (account.role) {
    case 'Admin': return 'admin';
    case 'Patient': return 'patient';
    case 'Receptionist': return 'receptionist';
    case 'Doctor':
      if (account.doctorWorkspace === 'Consultation') return 'doctor_primary';
      if (account.doctorWorkspace === 'ClinicalService') return 'doctor_imaging';
      return 'doctor';
    default: return null;
  }
}

export async function listAdminAccounts(
  params: { search: string; role?: string; isActive?: boolean; page: number },
  signal: AbortSignal,
) {
  return (await axiosClient.get<AccountList>('/admin/accounts', { params, signal })).data;
}

export type AssignableRole = 'Patient' | 'Doctor' | 'Receptionist';
export interface AccountAssignment {
  role: AssignableRole;
  specialtyId: number | null;
}

export async function listAccountSpecialties(signal: AbortSignal) {
  return (await axiosClient.get<{ id: number; name: string }[]>('/admin/accounts/specialties', { signal })).data;
}

export async function createAdminAccount(fields: AccountAssignment & {
  email: string; phoneNumber: string; password: string;
  fullName: string; department: string | null; identityNumber: string | null;
}) {
  await axiosClient.post('/admin/accounts', fields);
}

export async function assignAccountRole(id: string, assignment: AccountAssignment) {
  await axiosClient.put('/admin/accounts/' + id + '/role', assignment);
}

export async function setAdminAccountStatus(id: string, isActive: boolean) {
  await axiosClient.put('/admin/accounts/' + id + '/status', { isActive });
}

export async function deleteAdminAccount(id: string) {
  await axiosClient.delete('/admin/accounts/' + id);
}
