import { apiClient } from './axiosClient';
import { ApiResponse } from '../types';
import { ProductBatchRecord } from './catalog.api';

export const inventoryApi = {
  listBatches: async (params?: {
    productId?: string;
    supplierId?: string;
    filter?: string;
    search?: string;
  }) => {
    const { data } = await apiClient.get<ApiResponse<ProductBatchRecord[]>>(
      '/inventory/batches',
      { params }
    );
    return data.data;
  },

  listPurchases: async (params?: { search?: string; supplierId?: string }) => {
    const { data } = await apiClient.get<ApiResponse<any[]>>(
      '/inventory/purchases',
      { params }
    );
    return data.data;
  },

  createPurchase: async (payload: {
    purchaseInvoiceNumber: string;
    supplierId: string;
    purchaseDate?: string;
    discountAmount?: number;
    paidAmount?: number;
    notes?: string;
    items: Array<{
      productId: string;
      batchNumber: string;
      quantityReceived: number;
      purchasePrice: number;
      sellingPrice: number;
      taxPercentage?: number;
      manufacturingDate?: string;
      expiryDate?: string;
    }>;
  }) => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      '/inventory/purchases',
      payload
    );
    return data.data;
  },

  listAdjustments: async () => {
    const { data } = await apiClient.get<ApiResponse<any[]>>(
      '/inventory/adjustments'
    );
    return data.data;
  },

  createAdjustment: async (payload: {
    productId: string;
    batchId: string;
    adjustmentType:
      | 'ADDITION'
      | 'DEDUCTION'
      | 'DAMAGE'
      | 'EXPIRY'
      | 'WRITE_OFF'
      | 'AUDIT_CORRECTION';
    quantity: number;
    reason: string;
    notes?: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      '/inventory/adjustments',
      payload
    );
    return data.data;
  },

  inspectQuarantine: async (
    batchId: string,
    payload: {
      quantity: number;
      decision: 'RELEASE_TO_SELLABLE' | 'MOVE_TO_DAMAGED';
      reason: string;
    }
  ) => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      `/inventory/batches/${batchId}/release-quarantine`,
      payload
    );
    return data.data;
  },

  listMovements: async (productId?: string, limit = 100) => {
    const { data } = await apiClient.get<ApiResponse<any[]>>(
      '/inventory/movements',
      { params: { productId, limit } }
    );
    return data.data;
  },
};

