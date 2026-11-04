import { apiClient } from './axiosClient';
import { ApiResponse, BusinessProfile } from '../types';

export interface UpdateSettingsPayload {
  name: string;
  legalName?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  gstin?: string | null;
  currencyCode: string;
  currencySymbol: string;
  invoicePrefix: string;
  invoiceStartingNumber: number;
  defaultTaxPercentage: number;
  enableTaxInclusive: boolean;
  defaultPaymentMethods: string[];
  receiptFooter?: string | null;
  printerPaperSize: '58mm' | '80mm' | 'A4';
  autoPrintReceipt: boolean;
  globalLowStockThreshold: number;
  expiryAlertDays: number[];
  enableOfflineBilling: boolean;
  fifoOrFefo: 'FEFO' | 'FIFO';
}

export interface AuditLogItem {
  id: string;
  action: string;
  module: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export const settingsApi = {
  getSettings: async () => {
    const { data } = await apiClient.get<ApiResponse<BusinessProfile>>('/settings');
    return data.data;
  },

  updateSettings: async (payload: UpdateSettingsPayload) => {
    const { data } = await apiClient.put<ApiResponse<BusinessProfile>>(
      '/settings',
      payload
    );
    return data.data;
  },

  getAuditLogs: async (limit = 30) => {
    const { data } = await apiClient.get<ApiResponse<AuditLogItem[]>>(
      '/settings/audit-logs',
      { params: { limit } }
    );
    return data.data;
  },
};

