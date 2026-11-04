import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';
import { handleLocalApiRequest } from '../services/localBackendEngine';

export const apiClient = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  adapter: async (config: InternalAxiosRequestConfig) => {
    let parsedBody = config.data;
    if (typeof config.data === 'string' && config.data.trim()) {
      try {
        parsedBody = JSON.parse(config.data);
      } catch {
        parsedBody = config.data;
      }
    }

    const result = await handleLocalApiRequest(
      config.method || 'GET',
      config.url || '',
      parsedBody,
      config.params
    );

    const response = {
      data: result.data,
      status: result.status,
      statusText: result.status < 400 ? 'OK' : 'Error',
      headers: {},
      config,
    };

    if (result.status >= 400) {
      throw new AxiosError(
        result.data?.message || 'Request failed',
        String(result.status),
        config,
        null,
        response
      );
    }

    return response;
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/forgot-password') && !currentPath.startsWith('/reset-password')) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

