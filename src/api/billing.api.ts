import { apiClient } from './axiosClient';
import { ApiResponse } from '../types';

export interface CreateSalePayload {
  offlineTempId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  doctorName?: string;
  prescriptionReference?: string;
  billDiscountAmount?: number;
  notes?: string;
  items: Array<{
    productId: string;
    batchId?: string;
    quantity: number;
    unitPrice?: number;
    discountAmount?: number;
  }>;
  payments: Array<{
    paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
    amount: number;
    referenceNumber?: string;
  }>;
}

export const billingApi = {
  createSale: async (payload: CreateSalePayload) => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      '/billing/sales',
      payload
    );
    return data.data;
  },

  syncOfflineBills: async (bills: CreateSalePayload[]) => {
    const { data } = await apiClient.post<
      ApiResponse<{
        synced: Array<{
          offlineTempId?: string;
          invoiceNumber: string;
          id: string;
        }>;
        conflicts: Array<{ offlineTempId?: string; error: string }>;
      }>
    >('/billing/sync-offline', { bills });
    return data.data;
  },

  listSales: async (params?: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/billing/sales', {
      params,
    });
    return data.data;
  },

  getSale: async (idOrInvoice: string) => {
    const { data } = await apiClient.get<ApiResponse<any>>(
      `/billing/sales/${encodeURIComponent(idOrInvoice)}`
    );
    return data.data;
  },

  recordDuePayment: async (
    saleId: string,
    payload: {
      paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
      amount: number;
      referenceNumber?: string;
    }
  ) => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      `/billing/sales/${saleId}/payments`,
      payload
    );
    return data.data;
  },

  cancelSale: async (saleId: string, reason: string) => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      `/billing/sales/${saleId}/cancel`,
      { reason }
    );
    return data.data;
  },
};

