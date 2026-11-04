import { apiClient } from './axiosClient';
import { ApiResponse } from '../types';

export const reportsApi = {
  getDashboard: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/reports/dashboard');
    return data.data;
  },

  getAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    supplierId?: string;
    cashierId?: string;
  }) => {
    const { data } = await apiClient.get<ApiResponse<any>>(
      '/reports/analytics',
      { params }
    );
    return data.data;
  },
};

