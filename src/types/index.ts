export type RoleCode = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface BusinessSettingsData {
  id: string;
  businessId: string;
  currencyCode: string;
  currencySymbol: string;
  invoicePrefix: string;
  invoiceStartingNumber: number;
  currentInvoiceSequence: number;
  defaultTaxPercentage: number;
  enableTaxInclusive: boolean;
  defaultPaymentMethods: string[];
  receiptFooter: string | null;
  printerPaperSize: '58mm' | '80mm' | 'A4';
  autoPrintReceipt: boolean;
  globalLowStockThreshold: number;
  expiryAlertDays: number[];
  enableOfflineBilling: boolean;
  fifoOrFefo: 'FEFO' | 'FIFO';
}

export interface BusinessProfile {
  id: string;
  name: string;
  legalName: string | null;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  settings: BusinessSettingsData | null;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  businessId: string | null;
  business: BusinessProfile | null;
  roles: RoleCode[];
  permissions: string[];
}

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: Array<{
    id: string;
    code: RoleCode;
    name: string;
  }>;
}

export interface RoleWithPermissions {
  id: string;
  code: RoleCode;
  name: string;
  description: string | null;
  userCount: number;
  permissions: string[];
}

export interface PermissionItem {
  id: string;
  code: string;
  module: string;
  name: string;
  description: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

