import { Platform } from 'react-native';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5296' : 'http://localhost:5296')).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const headers = new Headers(options.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
    const response = await fetch(`${API_URL}${path}`, { ...options, headers, signal: controller.signal });
    const raw = await response.text();
    let data: any;
    try { data = raw ? JSON.parse(raw) : undefined; } catch {
      if (response.ok) throw new ApiError(response.status, 'Máy chủ trả về dữ liệu không hợp lệ. Vui lòng thử lại.');
    }
    if (!response.ok) {
      const validation = data?.errors ? Object.values(data.errors).flat().join('\n') : '';
      throw new ApiError(response.status, validation || data?.title || data?.message ||
        (response.status === 401 ? 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.' :
          response.status === 429 ? 'Bạn thao tác quá nhanh. Vui lòng thử lại sau một phút.' :
          response.status === 404 ? 'Không tìm thấy dữ liệu.' : 'Không thể thực hiện yêu cầu. Vui lòng thử lại.'));
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error('Không kết nối được máy chủ hoặc yêu cầu quá thời gian. Kiểm tra kết nối và địa chỉ API.');
  } finally { clearTimeout(timeout); }
}
