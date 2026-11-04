import { apiClient } from './axiosClient';
import { ApiResponse } from '../types';

export const returnsApi = {
  listSalesReturns: async (search?: string) => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/returns/sales', {
      params: { search },
    });
    return data.data;
  },

  createSalesReturn: async (payload: {
    saleId: string;
    refundMethod: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
    notes?: string;
    items: Array<{
      saleItemId: string;
      quantity: number;
      reason: 'CHANGED_MIND' | 'WRONG_PRODUCT' | 'DAMAGED_PRODUCT' | 'OTHER';
      condition: 'GOOD_CONDITION' | 'DAMAGED' | 'EXPIRED' | 'QUARANTINE';
      notes?: string;
    }>;
  }) => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      '/returns/sales',
      payload
    );
    return data.data;
  },

  listSupplierReturns: async (params?: {
    supplierId?: string;
    status?: string;
  }) => {
    const { data } = await apiClient.get<ApiResponse<any[]>>(
      '/returns/supplier',
      { params }
    );
    return data.data;
  },

  createSupplierReturn: async (payload: {
    supplierId: string;
    notes?: string;
    supportingDocUrl?: string;
    status?: string;
    items: Array<{
      productId: string;
      batchId: string;
      sourceStockPool: 'SELLABLE' | 'DAMAGED' | 'EXPIRED' | 'QUARANTINE';
      quantity: number;
      reason:
        | 'EXPIRED'
        | 'DAMAGED'
        | 'DEFECTIVE'
        | 'INCORRECTLY_SUPPLIED'
        | 'NEAR_EXPIRY'
        | 'OTHER';
      notes?: string;
    }>;
  }) => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      '/returns/supplier',
      payload
    );
    return data.data;
  },

  updateSupplierReturnStatus: async (
    id: string,
    payload: {
      status: string;
      creditNoteNumber?: string;
      refundAmount?: number;
      notes?: string;
    }
  ) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(
      `/returns/supplier/${id}/status`,
      payload
    );
    return data.data;
  },
};

