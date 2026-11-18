import { blockPreviewWrite } from '../src/services/previewMode';
import assert from 'node:assert/strict';
import { AxiosError, AxiosHeaders } from 'axios';
import { axiosClient, AUTH_EXPIRED_EVENT, TOKEN_KEY } from '../src/services/axiosClient';
import { useAuthStore } from '../src/store/useAuthStore';

const values = new Map<string, string>();
Object.defineProperty(globalThis, 'sessionStorage', { value: {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
} });
Object.defineProperty(globalThis, 'window', { value: new EventTarget() });
window.addEventListener(AUTH_EXPIRED_EVENT, () => useAuthStore.getState().logout());
const account = { userId: 'real-id', email: 'test@example.com', role: 'Patient', doctorWorkspace: null as string | null };
let profile = { id: 'real-id', email: account.email, phone: '0912345678', fullName: null,
  dateOfBirth: null, gender: null, address: null, idCardNumber: null, healthInsuranceNumber: null,
  heightCm: null, weightKg: null, bloodType: null, allergies: null, medicalHistory: null,
  isProfileCompleted: false };
let scenario = 'normal';
const calls: string[] = [];
axiosClient.defaults.adapter = async config => {
  calls.push(`${config.method} ${config.url}`);
  const response = { data: null as any, status: 200, statusText: 'OK', headers: new AxiosHeaders(), config };
  if (scenario === 'network') throw new AxiosError('Network error', 'ERR_NETWORK', config);
  if (scenario === 'expired') throw new AxiosError('Expired', 'ERR_BAD_REQUEST', config, undefined, { ...response, status: 401 });
  if (config.url === '/auth/register') response.data = account;
  else if (config.url === '/auth/login') response.data = { ...account, accessToken: 'real-token', accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z' };
  else if (config.url === '/auth/me') response.data = account;
  else if (config.url === '/patients/me' && config.method === 'get') response.data = profile;
  else if (config.url === '/patients/me' && config.method === 'put') {
    profile = { ...profile, ...JSON.parse(config.data), isProfileCompleted: true };
    response.data = profile;
  } else throw new Error(`Unexpected API: ${config.url}`);
  return response;
};
async function main() {
  const store = () => useAuthStore.getState();
  await store().initializeAuth();
  assert.equal(store().activeRole, 'guest');
  await store().registerUser({ email: account.email, phoneNumber: '0912345678', password: 'test-password', confirmPassword: 'test-password' });
  assert.equal(store().activeRole, 'guest');
  assert.equal(sessionStorage.getItem(TOKEN_KEY), null);
  assert.ok(!calls.includes('post /auth/login'));
  await store().loginUser(account.email, 'test-password');
  assert.equal(store().currentUser.id, 'real-id');
  assert.equal(store().currentUser.fullName, '');
  assert.equal(store().profile?.heightCm, null);
  assert.equal(store().currentUser.isProfileCompleted, false);
  assert.equal(sessionStorage.getItem(TOKEN_KEY), 'real-token');
  await store().saveProfile({ fullName: 'Test', phone: '0912345678', dateOfBirth: '2000-01-01', gender: 'Nam',
    idCardNumber: '012345678901', healthInsuranceNumber: null, address: 'Test address', heightCm: 170.25,
    weightKg: null, bloodType: null, allergies: null, medicalHistory: null });
  assert.equal(store().currentUser.isProfileCompleted, true);
  store().setDemoState(6);
  assert.equal(store().activeRole, 'patient', 'demo role changes must be blocked in real mode');
  store().enterDemo();
  store().setDemoState(3);
  assert.equal(store().isDemo, true);
  const before = calls.length;
  await store().loadProfile();
  await store().loginUser('demo', 'demo');
  assert.equal(calls.length, before, 'demo must not call real auth/profile API');
  assert.equal(sessionStorage.getItem(TOKEN_KEY), 'real-token');
  await store().exitDemo();
  assert.equal(store().currentUser.id, 'real-id');
  assert.equal(store().profile?.heightCm, 170.25);
  scenario = 'network';
  await store().initializeAuth();
  assert.equal(sessionStorage.getItem(TOKEN_KEY), 'real-token', 'network errors must preserve session');
  assert.ok(store().error);
  scenario = 'normal';
  account.role = 'Doctor';
  await store().initializeAuth();
  assert.equal(store().activeRole, 'doctor', 'do not invent primary/imaging assignment');
  account.doctorWorkspace = 'Consultation';
  await store().loginUser(account.email, 'test-password');
  assert.equal(store().activeRole, 'doctor_primary');
  assert.equal(store().activeDoctorId, 'DOC-01');
  account.doctorWorkspace = 'ClinicalService';
  await store().initializeAuth();
  assert.equal(store().activeRole, 'doctor_imaging');
  assert.equal(store().activeDoctorId, 'DOC-02');
  store().setActiveDoctorId('DOC-01');
  assert.equal(store().activeDoctorId, 'DOC-02', 'real doctor cannot switch workspace');
  account.role = 'Receptionist';
  await store().initializeAuth();
  assert.equal(store().activeRole, 'receptionist');
  let notices = 0;
  window.alert = () => { notices++; };
  assert.equal(blockPreviewWrite(), true);
  assert.equal(notices, 0, 'preview writes are blocked silently');
  store().enterDemo();
  assert.equal(blockPreviewWrite(), false);
  await store().exitDemo();
  scenario = 'expired';
  await store().initializeAuth();
  assert.equal(store().activeRole, 'guest');
  assert.equal(sessionStorage.getItem(TOKEN_KEY), null);
  console.log('PASS: registration, login, profile save, session restore, demo isolation, network error, doctor role, expired session');
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
