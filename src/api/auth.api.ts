import { apiClient } from './axiosClient';
import { ApiResponse, AuthUser } from '../types';

export const authApi = {
  login: async (payload: { email: string; password: string }) => {
    const { data } = await apiClient.post<
      ApiResponse<{ token: string; user: AuthUser }>
    >('/auth/login', payload);
    return data.data;
  },

  logout: async () => {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/logout');
    return data;
  },

  getMe: async () => {
    const { data } = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
    return data.data;
  },

  forgotPassword: async (email: string) => {
    const { data } = await apiClient.post<
      ApiResponse<{ message: string; resetToken?: string; expiresAt?: string }>
    >('/auth/forgot-password', { email });
    return data.data;
  },

  resetPassword: async (payload: { token: string; newPassword: string }) => {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/reset-password',
      payload
    );
    return data.data;
  },

  changePassword: async (payload: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/change-password',
      payload
    );
    return data.data;
  },
};

