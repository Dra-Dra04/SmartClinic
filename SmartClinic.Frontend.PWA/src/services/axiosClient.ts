import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Base Axios Client configured for .NET 8 Web API / HIS Gateway
export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Bearer Token
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('smartclinic_jwt_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 / Token Refresh & Standardized Result
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('smartclinic_refresh_token');
        if (refreshToken) {
          // Simulated Refresh Token Call
          const newAccessToken = 'mock_refreshed_jwt_token_' + Date.now();
          localStorage.setItem('smartclinic_jwt_token', newAccessToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return axiosClient(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem('smartclinic_jwt_token');
        localStorage.removeItem('smartclinic_refresh_token');
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
