import axios from 'axios';

export const TOKEN_KEY = 'smartclinic_jwt_token';
export const AUTH_EXPIRED_EVENT = 'smartclinic:auth-expired';

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://localhost:7295/api',
  headers: { Accept: 'application/json' },
  timeout: 10000,
});

axiosClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const currentToken = sessionStorage.getItem(TOKEN_KEY);
    if (error.response?.status === 401 && currentToken &&
        error.config?.headers?.Authorization === `Bearer ${currentToken}` &&
        error.config?.url !== '/auth/login' && error.config?.url !== '/auth/register') {
      sessionStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  },
);

export default axiosClient;