import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { api, routes } from '@/shared/config';
import { storage, storageKeys } from '@/shared/config';
import { authStore } from '@/shared/lib/auth-store';
import { HttpError, type ProblemDetails, type ValidationProblemDetails } from './types';

let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const refreshResponse = await axios.post<{ accessToken: string }>(
        `${api.baseURL}${api.endpoints.auth.refresh}`,
        undefined,
        { withCredentials: true }
      );
      const accessToken = refreshResponse.data.accessToken;
      authStore.setSession(accessToken, authStore.getUser() ?? { id: '', username: '', email: '' });
      const meRes = await axios.get<{ id: string; username: string; email: string }>(
        `${api.baseURL}${api.endpoints.auth.me}`,
        { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } }
      );
      authStore.setSession(accessToken, {
        id: meRes.data.id,
        username: meRes.data.username,
        email: meRes.data.email,
      });
      return accessToken;
    } catch (err) {
      const status = axios.isAxiosError(err) && err.response ? err.response.status : 0;
      const errorBody = axios.isAxiosError(err) && err.response ? err.response.data : null;
      const errorCode = errorBody?.errorCode;
      authStore.clearSession();
      if (
        typeof window !== 'undefined' &&
        (status === 401 || status === 403 || errorCode === 'refresh_reuse_detected')
      ) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `${routes.auth.login}?next=${next}`;
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

class HttpClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: api.baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = authStore.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        const sessionId = storage.get<string>(storageKeys.analytics.sessionId);
        if (sessionId) {
          config.headers['X-Session-Id'] = sessionId;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.instance.interceptors.response.use(
      (response) => {
        const sessionIdHeader = response.headers['x-session-id'];
        if (sessionIdHeader && typeof sessionIdHeader === 'string') {
          const current = storage.get<string>(storageKeys.analytics.sessionId);
          if (!current) {
            storage.set(storageKeys.analytics.sessionId, sessionIdHeader);
          }
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          const url = originalRequest.url ?? '';
          const isRefresh = url.includes(api.endpoints.auth.refresh);
          const isLogout = url.includes(api.endpoints.auth.logout);
          if (isRefresh || isLogout) {
            authStore.clearSession();
            if (isRefresh && typeof window !== 'undefined') {
              window.location.href = `${routes.auth.login}?next=${encodeURIComponent(window.location.pathname)}`;
            }
            return Promise.reject(error);
          }

          const newToken = await doRefresh();
          if (newToken) {
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.instance(originalRequest);
          }
        }

        if (error.response) {
          const { status, data } = error.response;
          const problemDetails = data as ProblemDetails | ValidationProblemDetails;
          const httpError = new HttpError(
            problemDetails?.detail || error.message || 'An error occurred',
            status,
            problemDetails?.errorCode,
            problemDetails
          );
          return Promise.reject(httpError);
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.delete(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.patch(url, data, config);
    return response.data;
  }
}

export const http = new HttpClient();
