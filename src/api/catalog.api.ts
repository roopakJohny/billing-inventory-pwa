import { apiClient } from './axiosClient';
import { ApiResponse, PaginatedResponse } from '../types';

export interface CategoryRecord {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  productCount: number;
  totalStock: number;
  stockValuation: number;
  totalSalesAmount: number;
  totalUnitsSold: number;
}

export type ProductBatch = ProductBatchRecord;

export interface ProductBatchRecord {
  id: string;
  productId: string;
  batchNumber: string;
  supplierId: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
  receivedDate: string;
  purchasePrice: number;
  mrp?: number | null;
  sellingPrice: number;
  initialQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  expiredQuantity: number;
  quarantinedQuantity: number;
  returnedToSupplierQty: number;
  isExpiredMarked: boolean;
  product?: {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    unitOfMeasurement: string;
    genericName?: string | null;
    dosageForm?: string | null;
    strength?: string | null;
    manufacturer?: string | null;
    prescriptionRequired?: boolean;
    category?: { id: string; name: string };
  };
  supplier?: { id: string; name: string } | null;
}

export interface ProductRecord {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  categoryId: string;
  brand: string | null;
  variant?: string | null;
  description: string | null;
  unitOfMeasurement: string;
  purchasePrice: number;
  mrp?: number | null;
  sellingPrice: number;
  taxPercentage: number;
  hsnCode?: string | null;
  minimumStockLevel: number;
  currentStock: number;
  hasExpiry: boolean;
  imageUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  // Pharmacy-specific fields
  genericName?: string | null;
  medicineType?: string | null;
  dosageForm?: string | null;
  strength?: string | null;
  manufacturer?: string | null;
  composition?: string | null;
  scheduleCategory?: string | null;
  prescriptionRequired?: boolean;
  category?: { id: string; name: string; code: string | null };
  batches?: ProductBatchRecord[];
  stockMovements?: any[];
}

export interface SupplierRecord {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  gstin: string | null;
  notes: string | null;
  outstandingBalance: number;
  isActive: boolean;
  purchaseCount: number;
  batchCount: number;
  returnCount: number;
  totalPurchased: number;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  gstin: string | null;
  outstandingBalance: number;
  loyaltyPoints: number;
  billCount: number;
  returnCount: number;
  totalSpent: number;
}

export const catalogApi = {
  // Categories
  listCategories: async (search?: string) => {
    const { data } = await apiClient.get<ApiResponse<CategoryRecord[]>>(
      '/categories',
      { params: { search } }
    );
    return data.data;
  },
  createCategory: async (payload: {
    name: string;
    code?: string;
    description?: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<CategoryRecord>>(
      '/categories',
      payload
    );
    return data.data;
  },
  updateCategory: async (
    id: string,
    payload: {
      name?: string;
      code?: string;
      description?: string;
      isActive?: boolean;
    }
  ) => {
    const { data } = await apiClient.put<ApiResponse<CategoryRecord>>(
      `/categories/${id}`,
      payload
    );
    return data.data;
  },
  deleteCategory: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(
      `/categories/${id}`
    );
    return data.data;
  },

  // Products
  listProducts: async (params?: {
    search?: string;
    categoryId?: string;
    availability?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await apiClient.get<
      ApiResponse<PaginatedResponse<ProductRecord>>
    >('/products', { params });
    return data.data;
  },
  lookupProductByCode: async (code: string) => {
    const { data } = await apiClient.get<ApiResponse<ProductRecord>>(
      `/products/lookup/${encodeURIComponent(code)}`
    );
    return data.data;
  },
  getProductById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<ProductRecord>>(
      `/products/${id}`
    );
    return data.data;
  },
  createProduct: async (payload: any) => {
    const { data } = await apiClient.post<ApiResponse<ProductRecord>>(
      '/products',
      payload
    );
    return data.data;
  },
  updateProduct: async (id: string, payload: any) => {
    const { data } = await apiClient.put<ApiResponse<ProductRecord>>(
      `/products/${id}`,
      payload
    );
    return data.data;
  },
  bulkImportProducts: async (products: any[]) => {
    const { data } = await apiClient.post<
      ApiResponse<{ importedCount: number; updatedCount: number }>
    >('/products/bulk-import', { products });
    return data.data;
  },

  // Suppliers
  listSuppliers: async (search?: string) => {
    const { data } = await apiClient.get<ApiResponse<SupplierRecord[]>>(
      '/suppliers',
      { params: { search } }
    );
    return data.data;
  },
  getSupplierDetails: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/suppliers/${id}`);
    return data.data;
  },
  createSupplier: async (payload: any) => {
    const { data } = await apiClient.post<ApiResponse<SupplierRecord>>(
      '/suppliers',
      payload
    );
    return data.data;
  },
  updateSupplier: async (id: string, payload: any) => {
    const { data } = await apiClient.put<ApiResponse<SupplierRecord>>(
      `/suppliers/${id}`,
      payload
    );
    return data.data;
  },
  paySupplierBalance: async (id: string, amount: number, notes?: string) => {
    const { data } = await apiClient.post<ApiResponse<SupplierRecord>>(
      `/suppliers/${id}/pay`,
      { amount, notes }
    );
    return data.data;
  },

  // Customers
  listCustomers: async (search?: string) => {
    const { data } = await apiClient.get<ApiResponse<CustomerRecord[]>>(
      '/customers',
      { params: { search } }
    );
    return data.data;
  },
  getCustomerById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/customers/${id}`);
    return data.data;
  },
  createCustomer: async (payload: any) => {
    const { data } = await apiClient.post<ApiResponse<CustomerRecord>>(
      '/customers',
      payload
    );
    return data.data;
  },
  updateCustomer: async (id: string, payload: any) => {
    const { data } = await apiClient.put<ApiResponse<CustomerRecord>>(
      `/customers/${id}`,
      payload
    );
    return data.data;
  },
};

