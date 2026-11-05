import { useAuthStore } from '../store/auth.store';
import { RoleCode } from '../types';
import { BusinessMode, getStoredBusinessMode } from '../config/businessModes';

const STORAGE_KEYS: Record<BusinessMode, string> = {
  store: 'apexpos_store_db_v1',
  pharmacy: 'apexpos_pharmacy_db_v1',
};

const PERMISSIONS_CATALOG = [
  { id: 'perm-1', code: 'dashboard:view', module: 'DASHBOARD', name: 'View Dashboard', description: 'Access main business overview and KPIs' },
  { id: 'perm-2', code: 'billing:create', module: 'BILLING', name: 'Create Bills (POS)', description: 'Generate customer invoices in POS' },
  { id: 'perm-3', code: 'billing:view_own', module: 'BILLING', name: 'View Own Bills', description: 'View bills created by the logged-in cashier' },
  { id: 'perm-4', code: 'billing:view_all', module: 'BILLING', name: 'View All Bills', description: 'View billing history across all staff' },
  { id: 'perm-5', code: 'billing:cancel', module: 'BILLING', name: 'Cancel Bills', description: 'Cancel invoices and reverse stock deductions' },
  { id: 'perm-6', code: 'sales_returns:manage', module: 'SALES_RETURNS', name: 'Process Sales Returns', description: 'Process customer returns and classify stock condition' },
  { id: 'perm-7', code: 'products:read', module: 'PRODUCTS', name: 'View Products & Stock', description: 'View product catalog, batches, and sellable stock' },
  { id: 'perm-8', code: 'products:manage', module: 'PRODUCTS', name: 'Manage Products & Categories', description: 'Create, edit, import, and deactivate products and categories' },
  { id: 'perm-9', code: 'inventory:read', module: 'INVENTORY', name: 'View Inventory & Batches', description: 'View batch inventory, expiry, and stock movements' },
  { id: 'perm-10', code: 'inventory:adjust', module: 'INVENTORY', name: 'Perform Stock Adjustments', description: 'Execute authorized stock additions, deductions, and write-offs' },
  { id: 'perm-11', code: 'purchases:manage', module: 'INVENTORY', name: 'Manage Stock Purchases', description: 'Record incoming supplier stock purchases and batches' },
  { id: 'perm-12', code: 'supplier_returns:manage', module: 'INVENTORY', name: 'Manage Supplier Returns', description: 'Initiate and track stock returns to suppliers' },
  { id: 'perm-13', code: 'suppliers:manage', module: 'SUPPLIERS', name: 'Manage Suppliers', description: 'Create and edit suppliers and track balances' },
  { id: 'perm-14', code: 'customers:manage', module: 'CUSTOMERS', name: 'Manage Customers', description: 'Create and edit customer records' },
  { id: 'perm-15', code: 'reports:view', module: 'REPORTS', name: 'View Business Reports', description: 'Access sales, inventory, and financial analytics and exports' },
  { id: 'perm-16', code: 'users:read', module: 'USERS', name: 'View Users & Roles', description: 'View user accounts and role permission matrix' },
  { id: 'perm-17', code: 'users:manage', module: 'USERS', name: 'Manage Users & Permissions', description: 'Create/edit users and configure role permissions' },
  { id: 'perm-18', code: 'settings:manage', module: 'SETTINGS', name: 'Manage Business Settings', description: 'Configure business profile, tax, invoice numbering, and alerts' },
];

const DEFAULT_ROLE_PERMS: Record<RoleCode, string[]> = {
  ADMIN: PERMISSIONS_CATALOG.map((p) => p.code),
  MANAGER: [
    'dashboard:view',
    'billing:create',
    'billing:view_own',
    'billing:view_all',
    'billing:cancel',
    'sales_returns:manage',
    'products:read',
    'products:manage',
    'inventory:read',
    'inventory:adjust',
    'purchases:manage',
    'supplier_returns:manage',
    'suppliers:manage',
    'customers:manage',
    'reports:view',
  ],
  STAFF: [
    'dashboard:view',
    'billing:create',
    'billing:view_own',
    'products:read',
    'inventory:read',
    'customers:manage',
  ],
};

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createSharedUsersAndRoles(daysFromNow: (d: number) => string, nowIso: string) {
  const roles = [
    {
      id: 'role-admin',
      code: 'ADMIN' as RoleCode,
      name: 'Administrator',
      description: 'Complete access to all modules, users, permissions, and business settings.',
      permissions: [...DEFAULT_ROLE_PERMS.ADMIN],
    },
    {
      id: 'role-manager',
      code: 'MANAGER' as RoleCode,
      name: 'Manager',
      description: 'Manage catalog, inventory, purchases, billing, stock returns, and reports.',
      permissions: [...DEFAULT_ROLE_PERMS.MANAGER],
    },
    {
      id: 'role-staff',
      code: 'STAFF' as RoleCode,
      name: 'Staff / Cashier',
      description: 'Create customer bills, view available stock, and view own billing history.',
      permissions: [...DEFAULT_ROLE_PERMS.STAFF],
    },
  ];

  const users = [
    {
      id: 'usr-admin',
      fullName: 'Rajesh Sharma (Admin)',
      email: 'admin@store.com',
      phone: '+91 98765 00001' as string | null,
      password: 'Password@123',
      isActive: true,
      lastLoginAt: nowIso as string | null,
      createdAt: daysFromNow(-60),
      roleCodes: ['ADMIN'] as RoleCode[],
      resetToken: null as string | null,
    },
    {
      id: 'usr-manager',
      fullName: 'Priya Nair (Manager)',
      email: 'manager@store.com',
      phone: '+91 98765 00002' as string | null,
      password: 'Password@123',
      isActive: true,
      lastLoginAt: daysFromNow(-1) as string | null,
      createdAt: daysFromNow(-45),
      roleCodes: ['MANAGER'] as RoleCode[],
      resetToken: null as string | null,
    },
    {
      id: 'usr-cashier',
      fullName: 'Arjun Verma (Cashier)',
      email: 'cashier@store.com',
      phone: '+91 98765 00003' as string | null,
      password: 'Password@123',
      isActive: true,
      lastLoginAt: daysFromNow(-2) as string | null,
      createdAt: daysFromNow(-30),
      roleCodes: ['STAFF'] as RoleCode[],
      resetToken: null as string | null,
    },
  ];

  return { roles, users };
}

export interface SeedProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  categoryId: string;
  brand: string | null;
  variant: string | null;
  description: string | null;
  unitOfMeasurement: string;
  purchasePrice: number;
  mrp: number | null;
  sellingPrice: number;
  taxPercentage: number;
  hsnCode: string | null;
  minimumStockLevel: number;
  currentStock: number;
  hasExpiry: boolean;
  imageUrl: string | null;
  status: string;
  genericName: string | null;
  medicineType: string | null;
  dosageForm: string | null;
  strength: string | null;
  manufacturer: string | null;
  composition: string | null;
  scheduleCategory: string | null;
  prescriptionRequired: boolean;
}

export interface SeedBatch {
  id: string;
  productId: string;
  batchNumber: string;
  supplierId: string;
  manufacturingDate: string | null;
  expiryDate: string | null;
  receivedDate: string;
  purchasePrice: number;
  mrp: number | null;
  sellingPrice: number;
  initialQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  expiredQuantity: number;
  quarantinedQuantity: number;
  returnedToSupplierQty: number;
  isExpiredMarked: boolean;
}

function createInitialStoreDb() {
  const now = new Date();
  const daysFromNow = (d: number) =>
    new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();
  const { roles, users } = createSharedUsersAndRoles(daysFromNow, now.toISOString());

  const business = {
    id: 'biz-store',
    name: 'Retail Store',
    legalName: 'Retail Store Pvt. Ltd.',
    logoUrl: null,
    address: '42, MG Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    phone: '+91 98765 43210',
    email: 'store@retailstore.in',
    gstin: '29AABCA1234F1Z5',
    settings: {
      id: 'set-store',
      businessId: 'biz-store',
      currencyCode: 'INR',
      currencySymbol: '₹',
      invoicePrefix: 'INV-',
      invoiceStartingNumber: 1001,
      currentInvoiceSequence: 1002,
      defaultTaxPercentage: 18,
      enableTaxInclusive: false,
      defaultPaymentMethods: ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER'],
      receiptFooter:
        'Thank you for shopping at Retail Store! Exchange within 7 days with original invoice.',
      printerPaperSize: '80mm' as '58mm' | '80mm' | 'A4',
      autoPrintReceipt: false,
      globalLowStockThreshold: 10,
      expiryAlertDays: [7, 15, 30],
      enableOfflineBilling: true,
      fifoOrFefo: 'FIFO' as 'FEFO' | 'FIFO',
    },
  };

  const categories = [
    {
      id: 'cat-grocery',
      name: 'Packaged Grocery & Staples',
      code: 'GROC',
      description: 'Organic staples, honey, olive oil, oats, and dry fruits',
      isActive: true,
      createdAt: daysFromNow(-50),
    },
    {
      id: 'cat-dairy',
      name: 'Dairy & Beverages',
      code: 'DAIRY',
      description: 'Milk shakes, yogurt, juices, and specialty beverages',
      isActive: true,
      createdAt: daysFromNow(-50),
    },
    {
      id: 'cat-personal',
      name: 'Personal Care & Home',
      code: 'PCARE',
      description: 'Skincare lotions, body wash, and home essentials',
      isActive: true,
      createdAt: daysFromNow(-50),
    },
    {
      id: 'cat-appliances',
      name: 'Kitchen & Accessories',
      code: 'KITCH',
      description: 'Kitchen scales, insulated flasks, and smart accessories',
      isActive: true,
      createdAt: daysFromNow(-50),
    },
  ];

  const suppliers = [
    {
      id: 'sup-s1',
      name: 'FreshHarvest Agro & FMCG Supply',
      contactPerson: 'Anitha Rao' as string | null,
      phone: '+91 98450 44556',
      email: 'supply@freshharvest.in' as string | null,
      address: 'Yeshwanthpur APMC Yard, Bengaluru' as string | null,
      gstin: '29AABCF7766L1Z9' as string | null,
      notes: 'Primary grocery & dairy distributor' as string | null,
      outstandingBalance: 8500,
      isActive: true,
      createdAt: daysFromNow(-45),
    },
    {
      id: 'sup-s2',
      name: 'Metro Consumer Goods Distributors',
      contactPerson: 'Vikram Hegde' as string | null,
      phone: '+91 98450 88990',
      email: 'orders@metroconsumer.in' as string | null,
      address: 'Peenya Industrial Area, Bengaluru' as string | null,
      gstin: '29AABCM9988K1Z1' as string | null,
      notes: 'Personal care & home accessories supplier' as string | null,
      outstandingBalance: 0,
      isActive: true,
      createdAt: daysFromNow(-40),
    },
  ];

  const customers = [
    {
      id: 'cust-1',
      name: 'Karthik Subramanian',
      phone: '9880123456',
      email: 'karthik.s@gmail.com',
      address: '100 Feet Road, Indiranagar, Bengaluru',
      gstin: null,
      outstandingBalance: 450,
      loyaltyPoints: 120,
      createdAt: daysFromNow(-20),
    },
    {
      id: 'cust-2',
      name: 'Meera Krishnan',
      phone: '9880654321',
      email: 'meera.k@yahoo.com',
      address: 'Koramangala 4th Block, Bengaluru',
      gstin: null,
      outstandingBalance: 0,
      loyaltyPoints: 85,
      createdAt: daysFromNow(-15),
    },
  ];

  const products: SeedProduct[] = [
    {
      id: 'sprod-1',
      name: 'Organic Wild Forest Honey 500g',
      sku: 'GRC-HNY-500',
      barcode: '890123450001',
      categoryId: 'cat-grocery',
      brand: 'NaturePure',
      variant: '500g Glass Jar',
      description: '100% pure NMR-tested forest honey',
      unitOfMeasurement: 'JAR',
      purchasePrice: 240,
      mrp: 380,
      sellingPrice: 350,
      taxPercentage: 5,
      hsnCode: '04090000',
      minimumStockLevel: 12,
      currentStock: 46,
      hasExpiry: true,
      imageUrl: null,
      status: 'ACTIVE',
      genericName: null,
      medicineType: null,
      dosageForm: null,
      strength: null,
      manufacturer: null,
      composition: null,
      scheduleCategory: null,
      prescriptionRequired: false,
    },
    {
      id: 'sprod-2',
      name: 'Almond Protein Milk Shake 500ml',
      sku: 'DRY-ALMP-500',
      barcode: '890123450002',
      categoryId: 'cat-dairy',
      brand: 'NutriSip',
      variant: '500ml Bottle',
      description: 'Ready-to-drink roasted almond protein shake',
      unitOfMeasurement: 'BOTTLE',
      purchasePrice: 65,
      mrp: 110,
      sellingPrice: 95,
      taxPercentage: 12,
      hsnCode: '22029930',
      minimumStockLevel: 20,
      currentStock: 18,
      hasExpiry: true,
      imageUrl: null,
      status: 'ACTIVE',
      genericName: null,
      medicineType: null,
      dosageForm: null,
      strength: null,
      manufacturer: null,
      composition: null,
      scheduleCategory: null,
      prescriptionRequired: false,
    },
    {
      id: 'sprod-3',
      name: 'Extra Virgin Cold-Pressed Olive Oil 1L',
      sku: 'GRC-OLV-1L',
      barcode: '890123450003',
      categoryId: 'cat-grocery',
      brand: 'OlivaGold',
      variant: '1 Litre Tin',
      description: 'Imported Spanish cold-pressed olive oil',
      unitOfMeasurement: 'BOTTLE',
      purchasePrice: 610,
      mrp: 950,
      sellingPrice: 849,
      taxPercentage: 5,
      hsnCode: '15091000',
      minimumStockLevel: 10,
      currentStock: 6,
      hasExpiry: true,
      imageUrl: null,
      status: 'ACTIVE',
      genericName: null,
      medicineType: null,
      dosageForm: null,
      strength: null,
      manufacturer: null,
      composition: null,
      scheduleCategory: null,
      prescriptionRequired: false,
    },
    {
      id: 'sprod-4',
      name: 'Smart Digital Kitchen Scale Pro',
      sku: 'KIT-SCL-01',
      barcode: '890123450004',
      categoryId: 'cat-appliances',
      brand: 'ChefMate',
      variant: 'Stainless Steel 10kg',
      description: 'High-precision digital kitchen & postage scale',
      unitOfMeasurement: 'PCS',
      purchasePrice: 750,
      mrp: 1499,
      sellingPrice: 1199,
      taxPercentage: 18,
      hsnCode: '84231000',
      minimumStockLevel: 5,
      currentStock: 14,
      hasExpiry: false,
      imageUrl: null,
      status: 'ACTIVE',
      genericName: null,
      medicineType: null,
      dosageForm: null,
      strength: null,
      manufacturer: null,
      composition: null,
      scheduleCategory: null,
      prescriptionRequired: false,
    },
    {
      id: 'sprod-5',
      name: 'Probiotic Greek Yogurt 400g',
      sku: 'DRY-YOG-400',
      barcode: '890123450005',
      categoryId: 'cat-dairy',
      brand: 'DailyFresh',
      variant: '400g Tub',
      description: 'High-protein unsweetened Greek yogurt cup',
      unitOfMeasurement: 'CUP',
      purchasePrice: 55,
      mrp: 95,
      sellingPrice: 85,
      taxPercentage: 5,
      hsnCode: '04031000',
      minimumStockLevel: 10,
      currentStock: 0,
      hasExpiry: true,
      imageUrl: null,
      status: 'ACTIVE',
      genericName: null,
      medicineType: null,
      dosageForm: null,
      strength: null,
      manufacturer: null,
      composition: null,
      scheduleCategory: null,
      prescriptionRequired: false,
    },
    {
      id: 'sprod-6',
      name: 'DermaCare Moisturizing Body Lotion 250ml',
      sku: 'PCR-LOT-250',
      barcode: '890123450006',
      categoryId: 'cat-personal',
      brand: 'DermaCare',
      variant: '250ml Pump',
      description: 'Ceramide & shea butter daily moisturizing lotion',
      unitOfMeasurement: 'BOTTLE',
      purchasePrice: 190,
      mrp: 325,
      sellingPrice: 299,
      taxPercentage: 18,
      hsnCode: '33049910',
      minimumStockLevel: 10,
      currentStock: 42,
      hasExpiry: true,
      imageUrl: null,
      status: 'ACTIVE',
      genericName: null,
      medicineType: null,
      dosageForm: null,
      strength: null,
      manufacturer: null,
      composition: null,
      scheduleCategory: null,
      prescriptionRequired: false,
    },
  ];

  const batches: SeedBatch[] = [
    {
      id: 'sbat-1',
      productId: 'sprod-1',
      batchNumber: 'BATCH-HNY-26A',
      supplierId: 'sup-s1',
      manufacturingDate: daysFromNow(-60),
      expiryDate: daysFromNow(240),
      receivedDate: daysFromNow(-20),
      purchasePrice: 240,
      mrp: 380,
      sellingPrice: 350,
      initialQuantity: 50,
      availableQuantity: 46,
      reservedQuantity: 0,
      damagedQuantity: 0,
      expiredQuantity: 0,
      quarantinedQuantity: 0,
      returnedToSupplierQty: 0,
      isExpiredMarked: false,
    },
    {
      id: 'sbat-2',
      productId: 'sprod-2',
      batchNumber: 'BATCH-ALM-05D',
      supplierId: 'sup-s1',
      manufacturingDate: daysFromNow(-60),
      expiryDate: daysFromNow(6),
      receivedDate: daysFromNow(-25),
      purchasePrice: 65,
      mrp: 110,
      sellingPrice: 95,
      initialQuantity: 25,
      availableQuantity: 18,
      reservedQuantity: 0,
      damagedQuantity: 3,
      expiredQuantity: 0,
      quarantinedQuantity: 1,
      returnedToSupplierQty: 0,
      isExpiredMarked: false,
    },
    {
      id: 'sbat-3',
      productId: 'sprod-3',
      batchNumber: 'BATCH-OLV-19',
      supplierId: 'sup-s1',
      manufacturingDate: daysFromNow(-90),
      expiryDate: daysFromNow(180),
      receivedDate: daysFromNow(-40),
      purchasePrice: 610,
      mrp: 950,
      sellingPrice: 849,
      initialQuantity: 20,
      availableQuantity: 6,
      reservedQuantity: 0,
      damagedQuantity: 0,
      expiredQuantity: 0,
      quarantinedQuantity: 0,
      returnedToSupplierQty: 0,
      isExpiredMarked: false,
    },
    {
      id: 'sbat-4',
      productId: 'sprod-4',
      batchNumber: 'BATCH-SCL-2026',
      supplierId: 'sup-s2',
      manufacturingDate: daysFromNow(-100),
      expiryDate: null,
      receivedDate: daysFromNow(-30),
      purchasePrice: 750,
      mrp: 1499,
      sellingPrice: 1199,
      initialQuantity: 15,
      availableQuantity: 14,
      reservedQuantity: 0,
      damagedQuantity: 0,
      expiredQuantity: 0,
      quarantinedQuantity: 0,
      returnedToSupplierQty: 0,
      isExpiredMarked: false,
    },
    {
      id: 'sbat-5-exp',
      productId: 'sprod-5',
      batchNumber: 'BATCH-YOG-EXP1',
      supplierId: 'sup-s1',
      manufacturingDate: daysFromNow(-40),
      expiryDate: daysFromNow(-3),
      receivedDate: daysFromNow(-35),
      purchasePrice: 55,
      mrp: 95,
      sellingPrice: 85,
      initialQuantity: 10,
      availableQuantity: 0,
      reservedQuantity: 0,
      damagedQuantity: 0,
      expiredQuantity: 10,
      quarantinedQuantity: 0,
      returnedToSupplierQty: 0,
      isExpiredMarked: true,
    },
    {
      id: 'sbat-6',
      productId: 'sprod-6',
      batchNumber: 'BATCH-DRM-25',
      supplierId: 'sup-s2',
      manufacturingDate: daysFromNow(-120),
      expiryDate: daysFromNow(150),
      receivedDate: daysFromNow(-20),
      purchasePrice: 190,
      mrp: 325,
      sellingPrice: 299,
      initialQuantity: 50,
      availableQuantity: 42,
      reservedQuantity: 0,
      damagedQuantity: 0,
      expiredQuantity: 0,
      quarantinedQuantity: 0,
      returnedToSupplierQty: 0,
      isExpiredMarked: false,
    },
  ];

  const sales = [
    {
      id: 'sale-s1001',
      invoiceNumber: 'INV-1001',
      offlineTempId: null as string | null,
      customerId: 'cust-1' as string | null,
      customerName: 'Karthik Subramanian',
      customerPhone: '9880123456' as string | null,
      doctorName: null as string | null,
      prescriptionReference: null as string | null,
      saleDate: now.toISOString(),
      subtotal: 1549,
      itemDiscountTotal: 0,
      billDiscountAmount: 0,
      taxAmount: 77.45,
      grandTotal: 1626.45,
      paidAmount: 1626.45,
      dueAmount: 0,
      changeReturned: 0,
      status: 'PAID',
      cashierId: 'usr-admin',
      items: [
        {
          id: 'ssi-1',
          saleId: 'sale-s1001',
          productId: 'sprod-1',
          batchId: 'sbat-1',
          batchNumber: 'BATCH-HNY-26A',
          quantity: 2,
          returnedQuantity: 0,
          purchasePrice: 240,
          unitPrice: 350,
          discountAmount: 0,
          taxPercentage: 5,
          taxAmount: 35,
          totalAmount: 735,
        },
        {
          id: 'ssi-2',
          saleId: 'sale-s1001',
          productId: 'sprod-3',
          batchId: 'sbat-3',
          batchNumber: 'BATCH-OLV-19',
          quantity: 1,
          returnedQuantity: 0,
          purchasePrice: 610,
          unitPrice: 849,
          discountAmount: 0,
          taxPercentage: 5,
          taxAmount: 42.45,
          totalAmount: 891.45,
        },
      ],
      payments: [
        {
          id: 'spay-1',
          saleId: 'sale-s1001',
          paymentMethod: 'UPI',
          amount: 1626.45,
          referenceNumber: 'UPI-431998212' as string | null,
          paidAt: now.toISOString(),
        },
      ],
    },
    {
      id: 'sale-s1002',
      invoiceNumber: 'INV-1002',
      offlineTempId: null as string | null,
      customerId: 'cust-2' as string | null,
      customerName: 'Meera Krishnan',
      customerPhone: '9880654321' as string | null,
      doctorName: null as string | null,
      prescriptionReference: null as string | null,
      saleDate: daysFromNow(-1),
      subtotal: 1498,
      itemDiscountTotal: 0,
      billDiscountAmount: 50,
      taxAmount: 269.64,
      grandTotal: 1717.64,
      paidAmount: 1717.64,
      dueAmount: 0,
      changeReturned: 0,
      status: 'PAID',
      cashierId: 'usr-manager',
      items: [
        {
          id: 'ssi-3',
          saleId: 'sale-s1002',
          productId: 'sprod-4',
          batchId: 'sbat-4',
          batchNumber: 'BATCH-SCL-2026',
          quantity: 1,
          returnedQuantity: 0,
          purchasePrice: 750,
          unitPrice: 1199,
          discountAmount: 0,
          taxPercentage: 18,
          taxAmount: 215.82,
          totalAmount: 1414.82,
        },
        {
          id: 'ssi-4',
          saleId: 'sale-s1002',
          productId: 'sprod-6',
          batchId: 'sbat-6',
          batchNumber: 'BATCH-DRM-25',
          quantity: 1,
          returnedQuantity: 0,
          purchasePrice: 190,
          unitPrice: 299,
          discountAmount: 0,
          taxPercentage: 18,
          taxAmount: 53.82,
          totalAmount: 352.82,
        },
      ],
      payments: [
        {
          id: 'spay-2',
          saleId: 'sale-s1002',
          paymentMethod: 'CARD',
          amount: 1717.64,
          referenceNumber: 'AUTH-9918' as string | null,
          paidAt: daysFromNow(-1),
        },
      ],
    },
  ];

  const purchases = [
    {
      id: 'spur-1',
      purchaseInvoiceNumber: 'PINV-STR-01',
      supplierId: 'sup-s1',
      purchaseDate: daysFromNow(-10),
      subtotal: 12000,
      taxAmount: 600,
      discountAmount: 0,
      totalAmount: 12600,
      paidAmount: 12600,
      dueAmount: 0,
      notes: 'Monthly Organic Honey stock replenishment',
      createdById: 'usr-admin',
      purchaseItems: [
        {
          id: 'spi-1',
          purchaseId: 'spur-1',
          productId: 'sprod-1',
          batchId: 'sbat-1',
          batchNumber: 'BATCH-HNY-26A',
          quantityReceived: 50,
          purchasePrice: 240,
          sellingPrice: 350,
          taxPercentage: 5,
          taxAmount: 600,
          totalAmount: 12600,
          expiryDate: daysFromNow(240) as string | null,
        },
      ],
    },
  ];

  const stockMovements = [
    {
      id: 'smv-1',
      productId: 'sprod-1',
      batchId: 'sbat-1',
      movementType: 'PURCHASE_RECEIPT',
      quantity: 50,
      previousStock: 0,
      newStock: 50,
      reason: 'Purchase Invoice PINV-STR-01',
      referenceType: 'PURCHASE',
      referenceId: 'spur-1',
      performedById: 'usr-admin',
      createdAt: daysFromNow(-10),
    },
    {
      id: 'smv-2',
      productId: 'sprod-1',
      batchId: 'sbat-1',
      movementType: 'SALE_DEDUCTION',
      quantity: -2,
      previousStock: 48,
      newStock: 46,
      reason: 'Sold on Invoice INV-1001',
      referenceType: 'SALE',
      referenceId: 'sale-s1001',
      performedById: 'usr-admin',
      createdAt: now.toISOString(),
    },
  ];

  return {
    business,
    roles,
    permissions: PERMISSIONS_CATALOG,
    users,
    categories,
    suppliers,
    customers,
    products,
    batches,
    sales,
    purchases,
    stockMovements,
    stockAdjustments: [] as any[],
    salesReturns: [] as any[],
    supplierReturns: [] as any[],
    auditLogs: [
      {
        id: 'aud-s1',
        userId: 'usr-admin',
        action: 'STORE_MODE_INITIALIZED',
        module: 'SETTINGS',
        entityType: 'Business',
        entityId: 'biz-store',
        createdAt: daysFromNow(-30),
      },
    ],
  };
}

function createInitialPharmacyDb() {
  const now = new Date();
  const daysFromNow = (d: number) =>
    new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();
  const { roles, users } = createSharedUsersAndRoles(daysFromNow, now.toISOString());

  const business = {
    id: 'biz-pharmacy',
    name: 'Medical Pharmacy',
    legalName: 'Medical Pharmacy Pvt. Ltd.',
    logoUrl: null,
    address: '18, Residency Road, Ashok Nagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560025',
    phone: '+91 98765 11220',
    email: 'rx@medicalpharmacy.in',
    gstin: '29AABCA8899P1Z2',
    settings: {
      id: 'set-pharmacy',
      businessId: 'biz-pharmacy',
      currencyCode: 'INR',
      currencySymbol: '₹',
      invoicePrefix: 'RX-',
      invoiceStartingNumber: 2001,
      currentInvoiceSequence: 2002,
      defaultTaxPercentage: 12,
      enableTaxInclusive: false,
      defaultPaymentMethods: ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER'],
      receiptFooter:
        'Medical Pharmacy — Keep medicines out of reach of children. Schedule H/H1 drugs sold only against valid prescription.',
      printerPaperSize: '80mm' as '58mm' | '80mm' | 'A4',
      autoPrintReceipt: false,
      globalLowStockThreshold: 15,
      expiryAlertDays: [7, 15, 30],
      enableOfflineBilling: true,
      fifoOrFefo: 'FEFO' as 'FEFO' | 'FIFO',
    },
  };

  const categories = [
    {
      id: 'pcat-antibiotics',
      name: 'Antibiotics & Anti-Infectives',
      code: 'ANTIB',
      description: 'Broad-spectrum oral & systemic antibacterial formulations',
      isActive: true,
      createdAt: daysFromNow(-60),
    },
    {
      id: 'pcat-analgesics',
      name: 'Pain Relief & Antipyretics',
      code: 'PAIN',
      description: 'Analgesic, antipyretic, and anti-inflammatory medicines',
      isActive: true,
      createdAt: daysFromNow(-60),
    },
    {
      id: 'pcat-cardiodiab',
      name: 'Cardiac & Diabetic Care',
      code: 'CARDI',
      description: 'Oral hypoglycemics, statins, and antihypertensives',
      isActive: true,
      createdAt: daysFromNow(-60),
    },
    {
      id: 'pcat-respiratory',
      name: 'Cough, Cold & Respiratory',
      code: 'RESP',
      description: 'Expectorants, antihistamines, and inhalers',
      isActive: true,
      createdAt: daysFromNow(-60),
    },
    {
      id: 'pcat-vitamins',
      name: 'Vitamins & Supplements',
      code: 'VITA',
      description: 'Multivitamins, calcium, zinc, and immunity supplements',
      isActive: true,
      createdAt: daysFromNow(-60),
    },
  ];

  const suppliers = [
    {
      id: 'sup-p1',
      name: 'MedLife Pharma Distributors',
      contactPerson: 'Suresh Menon' as string | null,
      phone: '+91 98450 11223',
      email: 'orders@medlifedist.in' as string | null,
      address: 'Industrial Area Phase 2, Peenya, Bengaluru' as string | null,
      gstin: '29AABCM9988K1Z1' as string | null,
      notes: 'Authorized distributor for GSK, Cipla, and Micro Labs' as string | null,
      outstandingBalance: 18400,
      isActive: true,
      createdAt: daysFromNow(-50),
    },
    {
      id: 'sup-p2',
      name: 'SunCare Formulations Wholesale',
      contactPerson: 'Dr. Ramesh Pai' as string | null,
      phone: '+91 98450 33445',
      email: 'dispatch@suncarepharma.in' as string | null,
      address: 'Rajajinagar Pharma Hub, Bengaluru' as string | null,
      gstin: '29AABCS5544D1Z8' as string | null,
      notes: 'Cardiac, diabetic & cold-chain formulation distributor' as string | null,
      outstandingBalance: 0,
      isActive: true,
      createdAt: daysFromNow(-45),
    },
  ];

  const customers = [
    {
      id: 'pcust-1',
      name: 'Anand Kulkarni',
      phone: '9880112233',
      email: 'anand.k@gmail.com',
      address: 'Richmond Town, Bengaluru',
      gstin: null,
      outstandingBalance: 0,
      loyaltyPoints: 160,
      createdAt: daysFromNow(-25),
    },
    {
      id: 'pcust-2',
      name: 'Lakshmi Narayanan',
      phone: '9880445566',
      email: 'lakshmi.n@yahoo.com',
      address: 'Jayanagar 4th Block, Bengaluru',
      gstin: null,
      outstandingBalance: 320,
      loyaltyPoints: 95,
      createdAt: daysFromNow(-18),
    },
  ];

  const products: SeedProduct[] = [
    {
      id: 'pmed-1',
      name: 'Augmentin 625 Duo Tablet (10s)',
      sku: 'MED-AUG-625',
      barcode: '890111220001',
      categoryId: 'pcat-antibiotics',
      brand: 'Augmentin',
      variant: 'Strip of 10 Tablets',
      description: 'Broad-spectrum beta-lactamase inhibitor antibiotic',
      unitOfMeasurement: 'STRIP',
      purchasePrice: 142,
      mrp: 223,
      sellingPrice: 205,
      taxPercentage: 12,
      hsnCode: '30041000',
      minimumStockLevel: 20,
      currentStock: 85,
      hasExpiry: true,
      imageUrl: null,
      status: 'ACTIVE',
      genericName: 'Amoxicillin + Clavulanic Acid',
      medicineType: 'Allopathic',
      dosageForm: 'Tablet',
      strength: '500mg + 125mg',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
      composition: 'Amoxicillin Trihydrate IP 500mg + Potassium Clavulanate IP 125mg',
      scheduleCategory: 'Schedule H',
      prescriptionRequired: true,
    },
    {
      id: 'pmed-2',
      name: 'Dolo 650mg Tablet Strip (15s)',
      sku: 'MED-DOLO-650',
      barcode: '890111220002',
      categoryId: 'pcat-analgesics',
      brand: 'Dolo',
      variant: 'Strip of 15 Tablets',
      description: 'Antipyretic and analgesic for fever and pain relief',
      unitOfMeasurement: 'STRIP',
      purchasePrice: 21,
      mrp: 34,
      sellingPrice: 30,
      taxPercentage: 12,
      hsnCode: '30049061',
      minimumStockLevel: 30,
      currentStock: 140,
      hasExpiry: true,
      imageUrl: null,
      status: 'ACTIVE',
      genericName: 'Paracetamol',
      medicineType: 'OTC',
      dosageForm: 'Tablet',
      strength: '650 mg',
      manufacturer: 'Micro Labs Ltd',
      composition: 'Paracetamol IP 650mg',
      scheduleCategory: 'OTC',
      prescriptionRequired: false,
    },
    {
      id: 'pmed-3',
      name: 'Glycomet-GP 2 Forte Tablet (15s)',
      sku: 'MED-GLYC-GP2',
      barcode: '890111220003',
      categoryId: 'pcat-cardiodiab',
      brand: 'Glycomet',
      variant: 'Strip of 15 Tablets',
      description: 'Dual oral anti-diabetic therapy for Type 2 Diabetes Mellitus',
      unitOfMeasurement: 'STRIP',
      purchasePrice: 135,
      mrp: 215,
      sellingPrice: 195,
      taxPercentage: 12,
      hsnCode: '30049079',
      minimumStockLevel: 15,
      currentStock: 8,
      hasExpiry: true,
      imageUrl: null,
      status: 'ACTIVE',
      genericName: 'Glimepiride + Metformin',
      medicineType: 'Allopathic',
      dosageForm: 'Tablet',
      strength: '2mg + 1000mg',
      manufacturer: 'USV Private Limited',
      composition: 'Glimepiride IP 2mg + Metformin Hydrochloride Prolonged-Release IP 1000mg',
      scheduleCategory: 'Schedule G',
      prescriptionRequired: true,
    },
    {
      id: 'pmed-4',
      name: 'Benadryl Cough Formula Syrup 150ml',
      sku: 'MED-BENA-150',
      barcode: '890111220004',
      categoryId: 'pcat-respiratory',
      brand: 'Benadryl',
      variant: '150ml Amber Bottle',
      description: 'Cough expectorant and antihistamine syrup',
      unitOfMeasurement: 'BOTTLE',
      purchasePrice: 92,
      mrp: 145,
      sellingPrice: 135,
      taxPercentage: 12,
      hsnCode: '30049039',
      minimumStockLevel: 15,
      currentStock: 22,
      hasExpiry: true,
      imageUrl: null,
      status: 'ACTIVE',
      genericName: 'Diphenhydramine + Ammonium Chloride',
      medicineType: 'OTC',
      dosageForm: 'Syrup',
      strength: '14mg/5ml',
      manufacturer: 'JNTL Consumer Health India',
      composition: 'Diphenhydramine HCl 14.08mg + Ammonium Chloride 138mg + Sodium Citrate 57.03mg',
      scheduleCategory: 'OTC',
      prescriptionRequired: false,
    },
    {
      id: 'pmed-5',
      name: 'Azithral 500mg Film-Coated Tablet (5s)',
      sku: 'MED-AZIT-500',
      barcode: '890111220005',
      categoryId: 'pcat-antibiotics',
      brand: 'Azithral',
      variant: 'Strip of 5 Tablets',
      description: 'Macrolide antibiotic for respiratory and skin infections',
      unitOfMeasurement: 'STRIP',
      purchasePrice: 84,
      mrp: 132,
      sellingPrice: 119,
      taxPercentage: 12,
      hsnCode: '30042011',
      minimumStockLevel: 15,
      currentStock: 0,
      hasExpiry: true,
      imageUrl: null,
      status: 'ACTIVE',
      genericName: 'Azithromycin',
      medicineType: 'Allopathic',
      dosageForm: 'Tablet',
      strength: '500 mg',
      manufacturer: 'Alembic Pharmaceuticals Ltd',
      composition: 'Azithromycin Dihydrate IP eq. to Anhydrous Azithromycin 500mg',
      scheduleCategory: 'Schedule H',
      prescriptionRequired: true,
    },
    {
      id: 'pmed-6',
      name: 'Shelcal 500mg Calcium + Vit D3 (15s)',
      sku: 'MED-SHLC-500',
      barcode: '890111220006',
      categoryId: 'pcat-vitamins',
      brand: 'Shelcal',
      variant: 'Strip of 15 Tablets',
      description: 'Elemental calcium and vitamin D3 bone health supplement',
      unitOfMeasurement: 'STRIP',
      purchasePrice: 95,
      mrp: 148,
      sellingPrice: 136,
      taxPercentage: 12,
      hsnCode: '30049099',
      minimumStockLevel: 20,
      currentStock: 54,
      hasExpiry: true,
      imageUrl: null,
      status: 'ACTIVE',
      genericName: 'Calcium + Vitamin D3',
      medicineType: 'Supplement',
      dosageForm: 'Tablet',
      strength: '500mg + 250 IU',
      manufacturer: 'Torrent Pharmaceuticals Ltd',
      composition: 'Calcium Carbonate 1250mg (Elemental Calcium 500mg) + Vitamin D3 250 IU',
      scheduleCategory: 'OTC',
      prescriptionRequired: false,
    },
  ];

  const batches: SeedBatch[] = [
    {
      id: 'pbat-1a',
      productId: 'pmed-1',
      batchNumber: 'AUG-26A-NEAR',
      supplierId: 'sup-p1',
      manufacturingDate: daysFromNow(-300),
      expiryDate: daysFromNow(11), // Expiring within 15 days — FEFO prioritized!
      receivedDate: daysFromNow(-60),
      purchasePrice: 140,
      mrp: 223,
      sellingPrice: 205,
      initialQuantity: 40,
      availableQuantity: 25,
      reservedQuantity: 0,
      damagedQuantity: 0,
      expiredQuantity: 0,
      quarantinedQuantity: 0,
      returnedToSupplierQty: 0,
      isExpiredMarked: false,
    },
    {
      id: 'pbat-1b',
      productId: 'pmed-1',
      batchNumber: 'AUG-26B-FRESH',
      supplierId: 'sup-p1',
      manufacturingDate: daysFromNow(-30),
      expiryDate: daysFromNow(240),
      receivedDate: daysFromNow(-10),
      purchasePrice: 142,
      mrp: 223,
      sellingPrice: 205,
      initialQuantity: 60,
      availableQuantity: 60,
      reservedQuantity: 0,
      damagedQuantity: 0,
      expiredQuantity: 0,
      quarantinedQuantity: 0,
      returnedToSupplierQty: 0,
      isExpiredMarked: false,
    },
    {
      id: 'pbat-2',
      productId: 'pmed-2',
      batchNumber: 'DOLO-B901',
      supplierId: 'sup-p1',
      manufacturingDate: daysFromNow(-45),
      expiryDate: daysFromNow(310),
      receivedDate: daysFromNow(-20),
      purchasePrice: 21,
      mrp: 34,
      sellingPrice: 30,
      initialQuantity: 150,
      availableQuantity: 140,
      reservedQuantity: 0,
      damagedQuantity: 0,
      expiredQuantity: 0,
      quarantinedQuantity: 0,
      returnedToSupplierQty: 0,
      isExpiredMarked: false,
    },
    {
      id: 'pbat-3',
      productId: 'pmed-3',
      batchNumber: 'GLYC-2604',
      supplierId: 'sup-p2',
      manufacturingDate: daysFromNow(-90),
      expiryDate: daysFromNow(210),
      receivedDate: daysFromNow(-35),
      purchasePrice: 135,
      mrp: 215,
      sellingPrice: 195,
      initialQuantity: 30,
      availableQuantity: 8, // Low stock!
      reservedQuantity: 0,
      damagedQuantity: 0,
      expiredQuantity: 0,
      quarantinedQuantity: 0,
      returnedToSupplierQty: 0,
      isExpiredMarked: false,
    },
    {
      id: 'pbat-4',
      productId: 'pmed-4',
      batchNumber: 'BEN-SYR-07D',
      supplierId: 'sup-p1',
      manufacturingDate: daysFromNow(-150),
      expiryDate: daysFromNow(5), // Expiring within 7 days + damaged units!
      receivedDate: daysFromNow(-45),
      purchasePrice: 92,
      mrp: 145,
      sellingPrice: 135,
      initialQuantity: 30,
      availableQuantity: 22,
      reservedQuantity: 0,
      damagedQuantity: 5,
      expiredQuantity: 0,
      quarantinedQuantity: 2,
      returnedToSupplierQty: 0,
      isExpiredMarked: false,
    },
    {
      id: 'pbat-5-exp',
      productId: 'pmed-5',
      batchNumber: 'AZT-EXP-09',
      supplierId: 'sup-p2',
      manufacturingDate: daysFromNow(-365),
      expiryDate: daysFromNow(-5), // Expired medicine batch!
      receivedDate: daysFromNow(-120),
      purchasePrice: 84,
      mrp: 132,
      sellingPrice: 119,
      initialQuantity: 18,
      availableQuantity: 0,
      reservedQuantity: 0,
      damagedQuantity: 2,
      expiredQuantity: 16,
      quarantinedQuantity: 0,
      returnedToSupplierQty: 0,
      isExpiredMarked: true,
    },
    {
      id: 'pbat-6',
      productId: 'pmed-6',
      batchNumber: 'SHLC-26M',
      supplierId: 'sup-p2',
      manufacturingDate: daysFromNow(-80),
      expiryDate: daysFromNow(24), // Expiring within 30 days
      receivedDate: daysFromNow(-20),
      purchasePrice: 95,
      mrp: 148,
      sellingPrice: 136,
      initialQuantity: 60,
      availableQuantity: 54,
      reservedQuantity: 0,
      damagedQuantity: 0,
      expiredQuantity: 0,
      quarantinedQuantity: 0,
      returnedToSupplierQty: 0,
      isExpiredMarked: false,
    },
  ];

  const sales = [
    {
      id: 'sale-p2001',
      invoiceNumber: 'RX-2001',
      offlineTempId: null as string | null,
      customerId: 'pcust-1' as string | null,
      customerName: 'Anand Kulkarni',
      customerPhone: '9880112233' as string | null,
      doctorName: 'Dr. S. Venkataraman (MD)' as string | null,
      prescriptionReference: 'KMC-REG-44821' as string | null,
      saleDate: now.toISOString(),
      subtotal: 470,
      itemDiscountTotal: 10,
      billDiscountAmount: 0,
      taxAmount: 55.2,
      grandTotal: 515.2,
      paidAmount: 515.2,
      dueAmount: 0,
      changeReturned: 0,
      status: 'PAID',
      cashierId: 'usr-admin',
      items: [
        {
          id: 'psi-1',
          saleId: 'sale-p2001',
          productId: 'pmed-1',
          batchId: 'pbat-1a',
          batchNumber: 'AUG-26A-NEAR',
          quantity: 2,
          returnedQuantity: 0,
          purchasePrice: 140,
          unitPrice: 205,
          discountAmount: 10,
          taxPercentage: 12,
          taxAmount: 48,
          totalAmount: 448,
        },
        {
          id: 'psi-2',
          saleId: 'sale-p2001',
          productId: 'pmed-2',
          batchId: 'pbat-2',
          batchNumber: 'DOLO-B901',
          quantity: 2,
          returnedQuantity: 0,
          purchasePrice: 21,
          unitPrice: 30,
          discountAmount: 0,
          taxPercentage: 12,
          taxAmount: 7.2,
          totalAmount: 67.2,
        },
      ],
      payments: [
        {
          id: 'ppay-1',
          saleId: 'sale-p2001',
          paymentMethod: 'UPI',
          amount: 515.2,
          referenceNumber: 'UPI-RX992011' as string | null,
          paidAt: now.toISOString(),
        },
      ],
    },
    {
      id: 'sale-p2002',
      invoiceNumber: 'RX-2002',
      offlineTempId: null as string | null,
      customerId: 'pcust-2' as string | null,
      customerName: 'Lakshmi Narayanan',
      customerPhone: '9880445566' as string | null,
      doctorName: 'Dr. Kavitha Murthy (Diabetologist)' as string | null,
      prescriptionReference: 'RX-DIAB-882' as string | null,
      saleDate: daysFromNow(-1),
      subtotal: 662,
      itemDiscountTotal: 0,
      billDiscountAmount: 20,
      taxAmount: 77.04,
      grandTotal: 719.04,
      paidAmount: 719.04,
      dueAmount: 0,
      changeReturned: 0,
      status: 'PAID',
      cashierId: 'usr-manager',
      items: [
        {
          id: 'psi-3',
          saleId: 'sale-p2002',
          productId: 'pmed-3',
          batchId: 'pbat-3',
          batchNumber: 'GLYC-2604',
          quantity: 2,
          returnedQuantity: 0,
          purchasePrice: 135,
          unitPrice: 195,
          discountAmount: 0,
          taxPercentage: 12,
          taxAmount: 46.8,
          totalAmount: 436.8,
        },
        {
          id: 'psi-4',
          saleId: 'sale-p2002',
          productId: 'pmed-6',
          batchId: 'pbat-6',
          batchNumber: 'SHLC-26M',
          quantity: 2,
          returnedQuantity: 0,
          purchasePrice: 95,
          unitPrice: 136,
          discountAmount: 0,
          taxPercentage: 12,
          taxAmount: 32.64,
          totalAmount: 304.64,
        },
      ],
      payments: [
        {
          id: 'ppay-2',
          saleId: 'sale-p2002',
          paymentMethod: 'CARD',
          amount: 719.04,
          referenceNumber: 'CARD-7712' as string | null,
          paidAt: daysFromNow(-1),
        },
      ],
    },
  ];

  const purchases = [
    {
      id: 'ppur-1',
      purchaseInvoiceNumber: 'PHM-INV-2026-01',
      supplierId: 'sup-p1',
      purchaseDate: daysFromNow(-10),
      subtotal: 8520,
      taxAmount: 1022.4,
      discountAmount: 0,
      totalAmount: 9542.4,
      paidAmount: 9542.4,
      dueAmount: 0,
      notes: 'Augmentin 625 Duo fresh batch replenishment',
      createdById: 'usr-admin',
      purchaseItems: [
        {
          id: 'ppi-1',
          purchaseId: 'ppur-1',
          productId: 'pmed-1',
          batchId: 'pbat-1b',
          batchNumber: 'AUG-26B-FRESH',
          quantityReceived: 60,
          purchasePrice: 142,
          sellingPrice: 205,
          taxPercentage: 12,
          taxAmount: 1022.4,
          totalAmount: 9542.4,
          expiryDate: daysFromNow(240) as string | null,
        },
      ],
    },
  ];

  const stockMovements = [
    {
      id: 'pmv-1',
      productId: 'pmed-1',
      batchId: 'pbat-1b',
      movementType: 'PURCHASE_RECEIPT',
      quantity: 60,
      previousStock: 0,
      newStock: 60,
      reason: 'Purchase Invoice PHM-INV-2026-01',
      referenceType: 'PURCHASE',
      referenceId: 'ppur-1',
      performedById: 'usr-admin',
      createdAt: daysFromNow(-10),
    },
    {
      id: 'pmv-2',
      productId: 'pmed-1',
      batchId: 'pbat-1a',
      movementType: 'SALE_DEDUCTION',
      quantity: -2,
      previousStock: 27,
      newStock: 25,
      reason: 'Dispensed on Prescription Invoice RX-2001 (FEFO)',
      referenceType: 'SALE',
      referenceId: 'sale-p2001',
      performedById: 'usr-admin',
      createdAt: now.toISOString(),
    },
  ];

  return {
    business,
    roles,
    permissions: PERMISSIONS_CATALOG,
    users,
    categories,
    suppliers,
    customers,
    products,
    batches,
    sales,
    purchases,
    stockMovements,
    stockAdjustments: [] as any[],
    salesReturns: [] as any[],
    supplierReturns: [] as any[],
    auditLogs: [
      {
        id: 'aud-p1',
        userId: 'usr-admin',
        action: 'PHARMACY_MODE_INITIALIZED',
        module: 'SETTINGS',
        entityType: 'Business',
        entityId: 'biz-pharmacy',
        createdAt: daysFromNow(-30),
      },
    ],
  };
}

type LocalDB = ReturnType<typeof createInitialStoreDb>;

function loadDb(mode: BusinessMode = getStoredBusinessMode()): LocalDB {
  const key = STORAGE_KEYS[mode];
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed: LocalDB = JSON.parse(raw);
      if (parsed?.business?.name?.startsWith('Apex ')) {
        if (mode === 'pharmacy') {
          parsed.business.name = 'Medical Pharmacy';
          parsed.business.legalName = 'Medical Pharmacy Pvt. Ltd.';
        } else {
          parsed.business.name = 'Retail Store';
          parsed.business.legalName = 'Retail Store Pvt. Ltd.';
        }
        saveDb(parsed, mode);
      }
      return parsed;
    }
  } catch {
    // Fallback to fresh seed
  }
  const initial =
    mode === 'pharmacy' ? createInitialPharmacyDb() : createInitialStoreDb();
  saveDb(initial, mode);
  return initial;
}

function saveDb(db: LocalDB, mode: BusinessMode = getStoredBusinessMode()) {
  const key = STORAGE_KEYS[mode];
  try {
    localStorage.setItem(key, JSON.stringify(db));
  } catch (e) {
    console.error('Failed to persist local DB:', e);
  }
}

export function resetCurrentModeDb(mode: BusinessMode = getStoredBusinessMode()) {
  const key = STORAGE_KEYS[mode];
  localStorage.removeItem(key);
}

function syncProductStock(db: LocalDB, productId: string) {
  const now = new Date();
  let total = 0;
  for (const b of db.batches) {
    if (b.productId !== productId) continue;
    const isExp =
      b.isExpiredMarked ||
      (b.expiryDate !== null && new Date(b.expiryDate) <= now);
    if (!isExp) {
      total += b.availableQuantity;
    } else if (b.availableQuantity > 0) {
      b.expiredQuantity += b.availableQuantity;
      b.availableQuantity = 0;
      b.isExpiredMarked = true;
    }
  }
  const prod = db.products.find((p) => p.id === productId);
  if (prod) {
    prod.currentStock = total;
  }
}

function buildAuthUser(db: LocalDB, user: LocalDB['users'][0]) {
  const permSet = new Set<string>();
  for (const rc of user.roleCodes) {
    const r = db.roles.find((role) => role.code === rc);
    if (r) {
      r.permissions.forEach((p) => permSet.add(p));
    }
  }
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    businessId: db.business.id,
    business: db.business,
    roles: user.roleCodes,
    permissions: Array.from(permSet),
  };
}

function getCurrentActor(db: LocalDB) {
  const storeUser = useAuthStore.getState().user;
  if (storeUser) {
    const found = db.users.find((u) => u.id === storeUser.id);
    if (found) return found;
  }
  return db.users[0];
}

function recordAudit(
  db: LocalDB,
  action: string,
  module: string,
  entityType?: string,
  entityId?: string
) {
  const actor = getCurrentActor(db);
  db.auditLogs.unshift({
    id: uid('aud'),
    userId: actor.id,
    action,
    module,
    entityType: entityType || '',
    entityId: entityId || '',
    createdAt: new Date().toISOString(),
  });
}

function hydrateBatch(db: LocalDB, b: LocalDB['batches'][0]) {
  const product = db.products.find((p) => p.id === b.productId);
  const category = product
    ? db.categories.find((c) => c.id === product.categoryId)
    : undefined;
  const supplier = db.suppliers.find((s) => s.id === b.supplierId);
  return {
    ...b,
    product: product
      ? {
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          unitOfMeasurement: product.unitOfMeasurement,
          genericName: product.genericName,
          dosageForm: product.dosageForm,
          strength: product.strength,
          manufacturer: product.manufacturer,
          prescriptionRequired: product.prescriptionRequired,
          category: category ? { id: category.id, name: category.name } : undefined,
        }
      : undefined,
    supplier: supplier ? { id: supplier.id, name: supplier.name } : null,
  };
}

function hydrateSale(db: LocalDB, s: LocalDB['sales'][0]) {
  const cashier = db.users.find((u) => u.id === s.cashierId);
  const customer = db.customers.find((c) => c.id === s.customerId);
  return {
    ...s,
    cashier: cashier ? { id: cashier.id, fullName: cashier.fullName } : { id: '', fullName: 'Staff' },
    customer: customer || null,
    items: (s.items || []).map((i) => {
      const product = db.products.find((p) => p.id === i.productId);
      const category = product
        ? db.categories.find((c) => c.id === product.categoryId)
        : undefined;
      const batch = db.batches.find((b) => b.id === i.batchId);
      return {
        ...i,
        product: product
          ? {
              ...product,
              category: category ? { id: category.id, name: category.name } : undefined,
            }
          : undefined,
        batch: batch
          ? {
              id: batch.id,
              batchNumber: batch.batchNumber,
              expiryDate: batch.expiryDate,
              mrp: batch.mrp,
            }
          : undefined,
      };
    }),
  };
}

export async function handleLocalApiRequest(
  method: string,
  url: string,
  body?: any,
  params?: Record<string, any>
): Promise<{ status: number; data: any }> {
  const activeMode = getStoredBusinessMode();
  const db = loadDb(activeMode);
  const cleanPath = url.replace(/^\/api\/v1/, '').split('?')[0];
  const m = method.toUpperCase();

  const ok = (data: any, message = 'Success', status = 200) => {
    saveDb(db, activeMode);
    return {
      status,
      data: {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
      },
    };
  };

  const fail = (message: string, status = 400) => ({
    status,
    data: {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    },
  });

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================
  if (cleanPath === '/auth/login' && m === 'POST') {
    const email = String(body?.email || '').toLowerCase().trim();
    const password = String(body?.password || '');
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user || user.password !== password) {
      return fail('Invalid email or password', 401);
    }
    if (!user.isActive) {
      return fail('Your account has been deactivated.', 403);
    }
    user.lastLoginAt = new Date().toISOString();
    recordAudit(db, 'USER_LOGIN', 'AUTH', 'User', user.id);
    return ok(
      {
        token: `local-jwt-${user.id}-${Date.now()}`,
        user: buildAuthUser(db, user),
      },
      'Login successful'
    );
  }

  if (cleanPath === '/auth/logout' && m === 'POST') {
    recordAudit(db, 'USER_LOGOUT', 'AUTH', 'User');
    return ok(null, 'Logged out successfully');
  }

  if (cleanPath === '/auth/me' && m === 'GET') {
    const actor = getCurrentActor(db);
    return ok(buildAuthUser(db, actor));
  }

  if (cleanPath === '/auth/forgot-password' && m === 'POST') {
    const email = String(body?.email || '').toLowerCase().trim();
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    const token = `RST-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    if (user) {
      user.resetToken = token;
      recordAudit(db, 'PASSWORD_RESET_REQUESTED', 'AUTH', 'User', user.id);
    }
    return ok(
      {
        message: 'Password reset token generated successfully.',
        resetToken: token,
      },
      'Password reset token generated'
    );
  }

  if (cleanPath === '/auth/reset-password' && m === 'POST') {
    const { token, newPassword } = body || {};
    const user = db.users.find((u) => u.resetToken && u.resetToken === token);
    if (!user) {
      return fail('Invalid or expired password reset token', 400);
    }
    user.password = newPassword;
    user.resetToken = null;
    recordAudit(db, 'PASSWORD_RESET_COMPLETED', 'AUTH', 'User', user.id);
    return ok({ message: 'Password has been reset successfully.' });
  }

  if (cleanPath === '/auth/change-password' && m === 'POST') {
    const actor = getCurrentActor(db);
    if (actor.password !== body?.currentPassword) {
      return fail('Current password is incorrect', 400);
    }
    actor.password = body.newPassword;
    recordAudit(db, 'PASSWORD_CHANGED', 'AUTH', 'User', actor.id);
    return ok({ message: 'Password changed successfully' });
  }

  // ==========================================================================
  // USERS & ROLES / PERMISSIONS
  // ==========================================================================
  if (cleanPath === '/users/roles-permissions' && m === 'GET') {
    return ok({
      roles: db.roles.map((r) => ({
        ...r,
        userCount: db.users.filter((u) => u.roleCodes.includes(r.code)).length,
      })),
      permissions: db.permissions,
    });
  }

  const rolePermMatch = cleanPath.match(/^\/users\/roles\/([^/]+)\/permissions$/);
  if (rolePermMatch && m === 'PUT') {
    const roleId = rolePermMatch[1];
    const role = db.roles.find((r) => r.id === roleId);
    if (!role) return fail('Role not found', 404);
    role.permissions = body?.permissionCodes || [];
    recordAudit(db, 'ROLE_PERMISSIONS_UPDATED', 'USERS', 'Role', role.id);

    const actor = getCurrentActor(db);
    useAuthStore.getState().updateUser(buildAuthUser(db, actor));

    return ok({
      roles: db.roles.map((r) => ({
        ...r,
        userCount: db.users.filter((u) => u.roleCodes.includes(r.code)).length,
      })),
      permissions: db.permissions,
    });
  }

  if (cleanPath === '/users' && m === 'GET') {
    const search = String(params?.search || '').toLowerCase();
    const role = String(params?.role || '');
    const filtered = db.users
      .filter((u) => {
        if (role && !u.roleCodes.includes(role as RoleCode)) return false;
        if (!search) return true;
        return (
          u.fullName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          (u.phone && u.phone.toLowerCase().includes(search))
        );
      })
      .map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        roles: u.roleCodes.map((rc) => {
          const r = db.roles.find((roleObj) => roleObj.code === rc);
          return {
            id: r?.id || rc,
            code: rc,
            name: r?.name || rc,
          };
        }),
      }));

    return ok({
      items: filtered,
      meta: { total: filtered.length, page: 1, limit: 50, totalPages: 1 },
    });
  }

  if (cleanPath === '/users' && m === 'POST') {
    const email = String(body.email || '').toLowerCase().trim();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      return fail('A user with this email address already exists', 409);
    }
    const newUser = {
      id: uid('usr'),
      fullName: body.fullName,
      email,
      phone: body.phone || null,
      password: body.password || 'Password@123',
      isActive: body.isActive ?? true,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      roleCodes: (body.roleCodes || ['STAFF']) as RoleCode[],
      resetToken: null,
    };
    db.users.unshift(newUser);
    recordAudit(db, 'USER_CREATED', 'USERS', 'User', newUser.id);
    return ok(newUser, 'User created', 201);
  }

  const userStatusMatch = cleanPath.match(/^\/users\/([^/]+)\/status$/);
  if (userStatusMatch && m === 'PATCH') {
    const target = db.users.find((u) => u.id === userStatusMatch[1]);
    if (!target) return fail('User not found', 404);
    target.isActive = Boolean(body.isActive);
    recordAudit(db, 'USER_STATUS_UPDATED', 'USERS', 'User', target.id);
    return ok(target);
  }

  const userIdMatch = cleanPath.match(/^\/users\/([^/]+)$/);
  if (userIdMatch && m === 'PUT') {
    const target = db.users.find((u) => u.id === userIdMatch[1]);
    if (!target) return fail('User not found', 404);
    if (body.fullName) target.fullName = body.fullName;
    if (body.phone !== undefined) target.phone = body.phone;
    if (body.roleCodes) target.roleCodes = body.roleCodes;
    if (typeof body.isActive === 'boolean') target.isActive = body.isActive;
    if (body.password) target.password = body.password;
    recordAudit(db, 'USER_UPDATED', 'USERS', 'User', target.id);
    return ok(target);
  }

  // ==========================================================================
  // SETTINGS & AUDIT LOGS
  // ==========================================================================
  if (cleanPath === '/settings' && m === 'GET') {
    return ok(db.business);
  }

  if (cleanPath === '/settings' && m === 'PUT') {
    db.business = {
      ...db.business,
      name: body.name || db.business.name,
      legalName: body.legalName ?? db.business.legalName,
      address: body.address ?? db.business.address,
      phone: body.phone ?? db.business.phone,
      email: body.email ?? db.business.email,
      gstin: body.gstin ?? db.business.gstin,
      settings: {
        ...db.business.settings,
        currencyCode: body.currencyCode || 'INR',
        currencySymbol: body.currencySymbol || '₹',
        invoicePrefix: body.invoicePrefix || 'INV-',
        invoiceStartingNumber: Number(body.invoiceStartingNumber || 1001),
        defaultTaxPercentage: Number(body.defaultTaxPercentage ?? 18),
        enableTaxInclusive: Boolean(body.enableTaxInclusive),
        defaultPaymentMethods:
          body.defaultPaymentMethods || db.business.settings.defaultPaymentMethods,
        receiptFooter: body.receiptFooter ?? db.business.settings.receiptFooter,
        printerPaperSize: body.printerPaperSize || '80mm',
        autoPrintReceipt: Boolean(body.autoPrintReceipt),
        globalLowStockThreshold: Number(body.globalLowStockThreshold || 10),
        expiryAlertDays: body.expiryAlertDays || [7, 15, 30],
        enableOfflineBilling: Boolean(body.enableOfflineBilling),
        fifoOrFefo: body.fifoOrFefo || 'FEFO',
      },
    };
    recordAudit(db, 'BUSINESS_SETTINGS_UPDATED', 'SETTINGS', 'Business', db.business.id);
    return ok(db.business, 'Business settings updated');
  }

  if (cleanPath === '/settings/audit-logs' && m === 'GET') {
    const logs = db.auditLogs.slice(0, 50).map((l) => {
      const u = db.users.find((usr) => usr.id === l.userId);
      return {
        ...l,
        user: u ? { id: u.id, fullName: u.fullName, email: u.email } : null,
      };
    });
    return ok(logs);
  }

  // ==========================================================================
  // CATEGORIES
  // ==========================================================================
  if (cleanPath === '/categories' && m === 'GET') {
    const list = db.categories.map((cat) => {
      const catProds = db.products.filter((p) => p.categoryId === cat.id);
      const totalStock = catProds.reduce((s, p) => s + p.currentStock, 0);
      const stockValuation = catProds.reduce(
        (s, p) => s + p.currentStock * Number(p.purchasePrice),
        0
      );
      let totalSalesAmount = 0;
      let totalUnitsSold = 0;
      for (const sale of db.sales) {
        if (sale.status === 'CANCELLED') continue;
        for (const item of sale.items) {
          if (catProds.some((cp) => cp.id === item.productId)) {
            totalSalesAmount += Number(item.totalAmount);
            totalUnitsSold += item.quantity - item.returnedQuantity;
          }
        }
      }
      return {
        ...cat,
        productCount: catProds.length,
        totalStock,
        stockValuation: Number(stockValuation.toFixed(2)),
        totalSalesAmount: Number(totalSalesAmount.toFixed(2)),
        totalUnitsSold,
      };
    });
    return ok(list);
  }

  if (cleanPath === '/categories' && m === 'POST') {
    const newCat = {
      id: uid('cat'),
      name: body.name.trim(),
      code: body.code ? body.code.trim().toUpperCase() : 'CAT',
      description: body.description || '',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    db.categories.push(newCat);
    recordAudit(db, 'CATEGORY_CREATED', 'CATEGORIES', 'Category', newCat.id);
    return ok(newCat, 'Category created', 201);
  }

  const catIdMatch = cleanPath.match(/^\/categories\/([^/]+)$/);
  if (catIdMatch && m === 'PUT') {
    const cat = db.categories.find((c) => c.id === catIdMatch[1]);
    if (!cat) return fail('Category not found', 404);
    if (body.name) cat.name = body.name.trim();
    if (body.code !== undefined) cat.code = body.code;
    if (body.description !== undefined) cat.description = body.description;
    return ok(cat);
  }
  if (catIdMatch && m === 'DELETE') {
    const catId = catIdMatch[1];
    if (db.products.some((p) => p.categoryId === catId)) {
      return fail('Cannot delete category with assigned items.', 400);
    }
    db.categories = db.categories.filter((c) => c.id !== catId);
    return ok({ deleted: true });
  }

  // ==========================================================================
  // PRODUCTS / MEDICINES
  // ==========================================================================
  if (cleanPath === '/products' && m === 'GET') {
    for (const p of db.products) {
      syncProductStock(db, p.id);
    }
    const search = String(params?.search || '').toLowerCase();
    const categoryId = String(params?.categoryId || '');
    const availability = String(params?.availability || '');

    const items = db.products
      .filter((p) => {
        if (categoryId && p.categoryId !== categoryId) return false;
        if (availability === 'IN_STOCK' && p.currentStock <= 0) return false;
        if (
          availability === 'LOW_STOCK' &&
          !(p.currentStock > 0 && p.currentStock <= p.minimumStockLevel)
        )
          return false;
        if (availability === 'OUT_OF_STOCK' && p.currentStock > 0) return false;
        if (!search) return true;
        return (
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          (p.barcode && p.barcode.toLowerCase().includes(search)) ||
          (p.brand && p.brand.toLowerCase().includes(search)) ||
          (p.genericName && p.genericName.toLowerCase().includes(search)) ||
          (p.composition && p.composition.toLowerCase().includes(search)) ||
          (p.manufacturer && p.manufacturer.toLowerCase().includes(search)) ||
          (p.hsnCode && p.hsnCode.toLowerCase().includes(search))
        );
      })
      .map((p) => {
        const category = db.categories.find((c) => c.id === p.categoryId);
        const batches = db.batches
          .filter((b) => b.productId === p.id)
          .sort((a, b) =>
            (a.expiryDate || '9999').localeCompare(b.expiryDate || '9999')
          );
        return {
          ...p,
          category: category
            ? { id: category.id, name: category.name, code: category.code }
            : undefined,
          batches,
        };
      });

    return ok({
      items,
      meta: { total: items.length, page: 1, limit: 100, totalPages: 1 },
    });
  }

  if (cleanPath === '/products/bulk-import' && m === 'POST') {
    const rows = body?.products || [];
    let importedCount = 0;
    let updatedCount = 0;

    for (const row of rows) {
      if (!row.name || !row.sku) continue;
      let cat = db.categories.find(
        (c) => c.name.toLowerCase() === String(row.categoryName || 'General').toLowerCase()
      );
      if (!cat) {
        cat = {
          id: uid('cat'),
          name: row.categoryName || 'General',
          code: String(row.categoryName || 'GEN').slice(0, 5).toUpperCase(),
          description: '',
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        db.categories.push(cat);
      }

      const existing = db.products.find(
        (p) => p.sku.toLowerCase() === String(row.sku).trim().toLowerCase()
      );
      if (existing) {
        existing.name = row.name;
        existing.purchasePrice = Number(row.purchasePrice || existing.purchasePrice);
        existing.sellingPrice = Number(row.sellingPrice || existing.sellingPrice);
        if (row.mrp) existing.mrp = Number(row.mrp);
        if (row.genericName) existing.genericName = row.genericName;
        updatedCount++;
      } else {
        const openQty = Math.max(0, Number(row.openingStock || 0));
        const prodId = uid('prod');
        const sellPrice = Number(row.sellingPrice || 0);
        const mrpVal = row.mrp ? Number(row.mrp) : sellPrice;
        db.products.push({
          id: prodId,
          name: row.name.trim(),
          sku: String(row.sku).trim().toUpperCase(),
          barcode: row.barcode || null,
          categoryId: cat.id,
          brand: row.brand || null,
          variant: row.variant || null,
          description: row.description || null,
          unitOfMeasurement: row.unitOfMeasurement || (activeMode === 'pharmacy' ? 'STRIP' : 'PCS'),
          purchasePrice: Number(row.purchasePrice || 0),
          mrp: mrpVal,
          sellingPrice: sellPrice,
          taxPercentage: Number(row.taxPercentage ?? (activeMode === 'pharmacy' ? 12 : 18)),
          hsnCode: row.hsnCode || null,
          minimumStockLevel: Number(row.minimumStockLevel ?? 10),
          currentStock: openQty,
          hasExpiry: true,
          imageUrl: null,
          status: 'ACTIVE',
          genericName: row.genericName || null,
          medicineType: row.medicineType || (activeMode === 'pharmacy' ? 'Allopathic' : null),
          dosageForm: row.dosageForm || (activeMode === 'pharmacy' ? 'Tablet' : null),
          strength: row.strength || null,
          manufacturer: row.manufacturer || null,
          composition: row.composition || null,
          scheduleCategory: row.scheduleCategory || (activeMode === 'pharmacy' ? 'OTC' : null),
          prescriptionRequired: Boolean(row.prescriptionRequired),
        });

        if (openQty > 0) {
          const batchId = uid('bat');
          db.batches.push({
            id: batchId,
            productId: prodId,
            batchNumber: row.batchNumber || `IMP-${row.sku}`,
            supplierId: db.suppliers[0]?.id || '',
            manufacturingDate: new Date().toISOString(),
            expiryDate: row.expiryDate
              ? new Date(row.expiryDate).toISOString()
              : null,
            receivedDate: new Date().toISOString(),
            purchasePrice: Number(row.purchasePrice || 0),
            mrp: mrpVal,
            sellingPrice: sellPrice,
            initialQuantity: openQty,
            availableQuantity: openQty,
            reservedQuantity: 0,
            damagedQuantity: 0,
            expiredQuantity: 0,
            quarantinedQuantity: 0,
            returnedToSupplierQty: 0,
            isExpiredMarked: false,
          });
        }
        importedCount++;
      }
    }
    return ok({ importedCount, updatedCount });
  }

  if (cleanPath === '/products' && m === 'POST') {
    const initialQty = Math.max(0, Number(body.initialStock || 0));
    const sellPrice = Number(body.sellingPrice || 0);
    const mrpVal = body.mrp ? Number(body.mrp) : sellPrice;
    const newProd: SeedProduct = {
      id: uid('prod'),
      name: body.name.trim(),
      sku: String(body.sku).trim().toUpperCase(),
      barcode: body.barcode || null,
      categoryId: body.categoryId || db.categories[0]?.id,
      brand: body.brand || null,
      variant: body.variant || null,
      description: body.description || null,
      unitOfMeasurement: body.unitOfMeasurement || (activeMode === 'pharmacy' ? 'STRIP' : 'PCS'),
      purchasePrice: Number(body.purchasePrice || 0),
      mrp: mrpVal,
      sellingPrice: sellPrice,
      taxPercentage: Number(body.taxPercentage ?? 12),
      hsnCode: body.hsnCode || null,
      minimumStockLevel: Number(body.minimumStockLevel ?? 10),
      currentStock: initialQty,
      hasExpiry: true,
      imageUrl: null,
      status: body.status || 'ACTIVE',
      genericName: body.genericName || null,
      medicineType: body.medicineType || null,
      dosageForm: body.dosageForm || null,
      strength: body.strength || null,
      manufacturer: body.manufacturer || null,
      composition: body.composition || null,
      scheduleCategory: body.scheduleCategory || null,
      prescriptionRequired: Boolean(body.prescriptionRequired),
    };
    db.products.unshift(newProd);

    if (initialQty > 0) {
      const batchId = uid('bat');
      const batchNumber =
        body.initialBatchNumber?.trim() || `OPEN-${newProd.sku}`;
      db.batches.push({
        id: batchId,
        productId: newProd.id,
        batchNumber,
        supplierId: db.suppliers[0]?.id || '',
        manufacturingDate: body.initialManufacturingDate
          ? new Date(body.initialManufacturingDate).toISOString()
          : new Date().toISOString(),
        expiryDate: body.initialExpiryDate
          ? new Date(body.initialExpiryDate).toISOString()
          : null,
        receivedDate: new Date().toISOString(),
        purchasePrice: newProd.purchasePrice,
        mrp: mrpVal,
        sellingPrice: newProd.sellingPrice,
        initialQuantity: initialQty,
        availableQuantity: initialQty,
        reservedQuantity: 0,
        damagedQuantity: 0,
        expiredQuantity: 0,
        quarantinedQuantity: 0,
        returnedToSupplierQty: 0,
        isExpiredMarked: false,
      });

      db.stockMovements.unshift({
        id: uid('mv'),
        productId: newProd.id,
        batchId,
        movementType: 'ADJUSTMENT_ADD',
        quantity: initialQty,
        previousStock: 0,
        newStock: initialQty,
        reason: 'Initial opening stock',
        referenceType: 'OPENING_STOCK',
        referenceId: newProd.id,
        performedById: getCurrentActor(db).id,
        createdAt: new Date().toISOString(),
      });
    }
    recordAudit(db, 'PRODUCT_CREATED', 'PRODUCTS', 'Product', newProd.id);
    return ok(newProd, 'Created successfully', 201);
  }

  const prodIdMatch = cleanPath.match(/^\/products\/([^/]+)$/);
  if (prodIdMatch && m === 'GET') {
    const prod = db.products.find((p) => p.id === prodIdMatch[1]);
    if (!prod) return fail('Item not found', 404);
    const batches = db.batches
      .filter((b) => b.productId === prod.id)
      .map((b) => hydrateBatch(db, b));
    const stockMovements = db.stockMovements
      .filter((mv) => mv.productId === prod.id)
      .map((mv) => {
        const b = db.batches.find((bat) => bat.id === mv.batchId);
        const u = db.users.find((usr) => usr.id === mv.performedById);
        return {
          ...mv,
          batch: { batchNumber: b?.batchNumber || '—' },
          performedBy: { fullName: u?.fullName || 'Staff' },
        };
      });
    return ok({ ...prod, batches, stockMovements });
  }

  if (prodIdMatch && m === 'PUT') {
    const prod = db.products.find((p) => p.id === prodIdMatch[1]);
    if (!prod) return fail('Item not found', 404);
    Object.assign(prod, {
      name: body.name ?? prod.name,
      sku: body.sku ? String(body.sku).toUpperCase() : prod.sku,
      barcode: body.barcode !== undefined ? body.barcode : prod.barcode,
      categoryId: body.categoryId ?? prod.categoryId,
      brand: body.brand !== undefined ? body.brand : prod.brand,
      variant: body.variant !== undefined ? body.variant : prod.variant,
      description: body.description !== undefined ? body.description : prod.description,
      unitOfMeasurement: body.unitOfMeasurement ?? prod.unitOfMeasurement,
      purchasePrice: Number(body.purchasePrice ?? prod.purchasePrice),
      mrp: body.mrp !== undefined ? Number(body.mrp) : prod.mrp,
      sellingPrice: Number(body.sellingPrice ?? prod.sellingPrice),
      taxPercentage: Number(body.taxPercentage ?? prod.taxPercentage),
      hsnCode: body.hsnCode !== undefined ? body.hsnCode : prod.hsnCode,
      minimumStockLevel: Number(body.minimumStockLevel ?? prod.minimumStockLevel),
      status: body.status ?? prod.status,
      genericName: body.genericName !== undefined ? body.genericName : prod.genericName,
      medicineType: body.medicineType !== undefined ? body.medicineType : prod.medicineType,
      dosageForm: body.dosageForm !== undefined ? body.dosageForm : prod.dosageForm,
      strength: body.strength !== undefined ? body.strength : prod.strength,
      manufacturer: body.manufacturer !== undefined ? body.manufacturer : prod.manufacturer,
      composition: body.composition !== undefined ? body.composition : prod.composition,
      scheduleCategory:
        body.scheduleCategory !== undefined ? body.scheduleCategory : prod.scheduleCategory,
      prescriptionRequired:
        body.prescriptionRequired !== undefined
          ? Boolean(body.prescriptionRequired)
          : prod.prescriptionRequired,
    });
    recordAudit(db, 'PRODUCT_UPDATED', 'PRODUCTS', 'Product', prod.id);
    return ok(prod);
  }

  // ==========================================================================
  // SUPPLIERS & CUSTOMERS
  // ==========================================================================
  if (cleanPath === '/suppliers' && m === 'GET') {
    const search = String(params?.search || '').toLowerCase();
    const list = db.suppliers
      .filter(
        (s) =>
          !search ||
          s.name.toLowerCase().includes(search) ||
          s.phone.toLowerCase().includes(search) ||
          (s.gstin && s.gstin.toLowerCase().includes(search))
      )
      .map((s) => {
        const supPurchases = db.purchases.filter((p) => p.supplierId === s.id);
        const supBatches = db.batches.filter((b) => b.supplierId === s.id);
        const totalPurchased = supPurchases.reduce(
          (sum, p) => sum + Number(p.totalAmount),
          0
        );
        return {
          ...s,
          purchaseCount: supPurchases.length,
          batchCount: supBatches.length,
          returnCount: db.supplierReturns.filter((sr) => sr.supplierId === s.id)
            .length,
          totalPurchased,
        };
      });
    return ok(list);
  }

  if (cleanPath === '/suppliers' && m === 'POST') {
    const sup = {
      id: uid('sup'),
      name: body.name,
      contactPerson: body.contactPerson || null,
      phone: body.phone,
      email: body.email || null,
      address: body.address || null,
      gstin: body.gstin ? String(body.gstin).toUpperCase() : null,
      notes: body.notes || null,
      outstandingBalance: Number(body.outstandingBalance || 0),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    db.suppliers.push(sup);
    return ok(sup, 'Supplier created', 201);
  }

  const supPayMatch = cleanPath.match(/^\/suppliers\/([^/]+)\/pay$/);
  if (supPayMatch && m === 'POST') {
    const sup = db.suppliers.find((s) => s.id === supPayMatch[1]);
    if (!sup) return fail('Supplier not found', 404);
    sup.outstandingBalance = Math.max(
      0,
      Number(sup.outstandingBalance) - Number(body.amount || 0)
    );
    recordAudit(db, 'SUPPLIER_PAYMENT_RECORDED', 'SUPPLIERS', 'Supplier', sup.id);
    return ok(sup);
  }

  const supIdMatch = cleanPath.match(/^\/suppliers\/([^/]+)$/);
  if (supIdMatch && m === 'GET') {
    const sup = db.suppliers.find((s) => s.id === supIdMatch[1]);
    if (!sup) return fail('Supplier not found', 404);
    return ok({
      ...sup,
      batches: db.batches
        .filter((b) => b.supplierId === sup.id)
        .map((b) => hydrateBatch(db, b)),
      purchases: db.purchases.filter((p) => p.supplierId === sup.id),
    });
  }
  if (supIdMatch && m === 'PUT') {
    const sup = db.suppliers.find((s) => s.id === supIdMatch[1]);
    if (!sup) return fail('Supplier not found', 404);
    Object.assign(sup, body);
    return ok(sup);
  }

  if (cleanPath === '/customers' && m === 'GET') {
    const search = String(params?.search || '').toLowerCase();
    const list = db.customers
      .filter(
        (c) =>
          !search ||
          c.name.toLowerCase().includes(search) ||
          c.phone.toLowerCase().includes(search)
      )
      .map((c) => {
        const custSales = db.sales.filter(
          (s) => s.customerId === c.id && s.status !== 'CANCELLED'
        );
        return {
          ...c,
          billCount: custSales.length,
          returnCount: 0,
          totalSpent: custSales.reduce((sum, s) => sum + Number(s.grandTotal), 0),
        };
      });
    return ok(list);
  }

  if (cleanPath === '/customers' && m === 'POST') {
    const cust = {
      id: uid('cust'),
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      address: body.address || null,
      gstin: body.gstin || null,
      outstandingBalance: 0,
      loyaltyPoints: 0,
      createdAt: new Date().toISOString(),
    };
    db.customers.unshift(cust);
    return ok(cust, 'Customer created', 201);
  }

  const custIdMatch = cleanPath.match(/^\/customers\/([^/]+)$/);
  if (custIdMatch && m === 'PUT') {
    const cust = db.customers.find((c) => c.id === custIdMatch[1]);
    if (!cust) return fail('Customer not found', 404);
    Object.assign(cust, body);
    return ok(cust);
  }

  // ==========================================================================
  // INVENTORY, BATCHES, PURCHASES, ADJUSTMENTS & MOVEMENTS
  // ==========================================================================
  if (cleanPath === '/inventory/batches' && m === 'GET') {
    for (const p of db.products) {
      syncProductStock(db, p.id);
    }
    const filter = String(params?.filter || '');
    const search = String(params?.search || '').toLowerCase();
    const now = new Date();
    const inDays = (d: number) =>
      new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

    const list = db.batches
      .map((b) => hydrateBatch(db, b))
      .filter((b) => {
        if (search) {
          const hit =
            b.batchNumber.toLowerCase().includes(search) ||
            (b.product?.name && b.product.name.toLowerCase().includes(search)) ||
            (b.product?.sku && b.product.sku.toLowerCase().includes(search)) ||
            (b.product?.genericName &&
              b.product.genericName.toLowerCase().includes(search));
          if (!hit) return false;
        }
        const isExpired =
          b.isExpiredMarked ||
          (b.expiryDate !== null && new Date(b.expiryDate) <= now) ||
          b.expiredQuantity > 0;

        if (filter === 'EXPIRED') return isExpired;
        if (filter === 'EXPIRING_7')
          return (
            b.expiryDate !== null &&
            new Date(b.expiryDate) > now &&
            new Date(b.expiryDate) <= inDays(7) &&
            b.availableQuantity > 0
          );
        if (filter === 'EXPIRING_15')
          return (
            b.expiryDate !== null &&
            new Date(b.expiryDate) > now &&
            new Date(b.expiryDate) <= inDays(15) &&
            b.availableQuantity > 0
          );
        if (filter === 'EXPIRING_30')
          return (
            b.expiryDate !== null &&
            new Date(b.expiryDate) > now &&
            new Date(b.expiryDate) <= inDays(30) &&
            b.availableQuantity > 0
          );
        if (filter === 'DAMAGED') return b.damagedQuantity > 0;
        if (filter === 'QUARANTINE') return b.quarantinedQuantity > 0;
        return true;
      });

    return ok(list);
  }

  if (cleanPath === '/inventory/purchases' && m === 'GET') {
    const list = db.purchases.map((p) => {
      const supplier = db.suppliers.find((s) => s.id === p.supplierId);
      const createdBy = db.users.find((u) => u.id === p.createdById);
      return {
        ...p,
        supplier: supplier ? { id: supplier.id, name: supplier.name, phone: supplier.phone } : null,
        createdBy: createdBy ? { id: createdBy.id, fullName: createdBy.fullName } : null,
        purchaseItems: (p.purchaseItems || []).map((pi: any) => ({
          ...pi,
          product: db.products.find((prod) => prod.id === pi.productId),
        })),
      };
    });
    return ok(list);
  }

  if (cleanPath === '/inventory/purchases' && m === 'POST') {
    const actor = getCurrentActor(db);
    let subtotal = 0;
    let taxAmount = 0;
    const purchaseId = uid('pur');
    const purchaseItems: any[] = [];

    for (const item of body.items || []) {
      const qty = Number(item.quantityReceived || 0);
      const cost = Number(item.purchasePrice || 0);
      const sell = Number(item.sellingPrice || 0);
      const mrp = item.mrp !== undefined ? Number(item.mrp) : sell;
      const taxPct = Number(item.taxPercentage || 0);
      const lineSub = qty * cost;
      const lineTax = (lineSub * taxPct) / 100;
      subtotal += lineSub;
      taxAmount += lineTax;

      const batchId = uid('bat');
      db.batches.unshift({
        id: batchId,
        productId: item.productId,
        batchNumber: String(item.batchNumber).toUpperCase(),
        supplierId: body.supplierId,
        manufacturingDate: item.manufacturingDate || new Date().toISOString(),
        expiryDate: item.expiryDate
          ? new Date(item.expiryDate).toISOString()
          : null,
        receivedDate: new Date().toISOString(),
        purchasePrice: cost,
        mrp,
        sellingPrice: sell,
        initialQuantity: qty,
        availableQuantity: qty,
        reservedQuantity: 0,
        damagedQuantity: 0,
        expiredQuantity: 0,
        quarantinedQuantity: 0,
        returnedToSupplierQty: 0,
        isExpiredMarked: false,
      });

      const prod = db.products.find((p) => p.id === item.productId);
      if (prod) {
        prod.purchasePrice = cost;
        prod.sellingPrice = sell;
        if (mrp) prod.mrp = mrp;
      }
      syncProductStock(db, item.productId);

      db.stockMovements.unshift({
        id: uid('mv'),
        productId: item.productId,
        batchId,
        movementType: 'PURCHASE_RECEIPT',
        quantity: qty,
        previousStock: 0,
        newStock: qty,
        reason: `Purchase Invoice ${body.purchaseInvoiceNumber}`,
        referenceType: 'PURCHASE',
        referenceId: purchaseId,
        performedById: actor.id,
        createdAt: new Date().toISOString(),
      });

      purchaseItems.push({
        id: uid('pi'),
        purchaseId,
        productId: item.productId,
        batchId,
        batchNumber: String(item.batchNumber).toUpperCase(),
        quantityReceived: qty,
        purchasePrice: cost,
        sellingPrice: sell,
        taxPercentage: taxPct,
        taxAmount: lineTax,
        totalAmount: lineSub + lineTax,
        expiryDate: item.expiryDate || null,
      });
    }

    const totalAmount = subtotal + taxAmount;
    const paidAmount = Number(body.paidAmount ?? totalAmount);
    const dueAmount = Math.max(0, totalAmount - paidAmount);

    const purchase = {
      id: purchaseId,
      purchaseInvoiceNumber: body.purchaseInvoiceNumber,
      supplierId: body.supplierId,
      purchaseDate: new Date().toISOString(),
      subtotal,
      taxAmount,
      discountAmount: 0,
      totalAmount,
      paidAmount,
      dueAmount,
      notes: body.notes || '',
      createdById: actor.id,
      purchaseItems,
    };
    db.purchases.unshift(purchase);

    if (dueAmount > 0) {
      const sup = db.suppliers.find((s) => s.id === body.supplierId);
      if (sup) sup.outstandingBalance += dueAmount;
    }

    return ok(purchase, 'Purchase recorded', 201);
  }

  if (cleanPath === '/inventory/adjustments' && m === 'GET') {
    const list = db.stockAdjustments.map((adj) => ({
      ...adj,
      product: db.products.find((p) => p.id === adj.productId),
      batch: db.batches.find((b) => b.id === adj.batchId),
      adjustedBy: db.users.find((u) => u.id === adj.adjustedById),
    }));
    return ok(list);
  }

  if (cleanPath === '/inventory/adjustments' && m === 'POST') {
    const batch = db.batches.find((b) => b.id === body.batchId);
    if (!batch) return fail('Batch not found', 404);
    const qty = Number(body.quantity || 0);
    const prevStock = batch.availableQuantity;

    if (body.adjustmentType === 'ADDITION') {
      batch.availableQuantity += qty;
    } else if (
      body.adjustmentType === 'DEDUCTION' ||
      body.adjustmentType === 'AUDIT_CORRECTION'
    ) {
      if (batch.availableQuantity < qty) {
        return fail(`Insufficient sellable stock in batch (${batch.availableQuantity})`, 400);
      }
      batch.availableQuantity -= qty;
    } else if (body.adjustmentType === 'DAMAGE') {
      if (batch.availableQuantity < qty) {
        return fail(`Insufficient sellable stock in batch (${batch.availableQuantity})`, 400);
      }
      batch.availableQuantity -= qty;
      batch.damagedQuantity += qty;
    } else if (body.adjustmentType === 'EXPIRY') {
      if (batch.availableQuantity < qty) {
        return fail(`Insufficient sellable stock in batch (${batch.availableQuantity})`, 400);
      }
      batch.availableQuantity -= qty;
      batch.expiredQuantity += qty;
    } else if (body.adjustmentType === 'WRITE_OFF') {
      if (batch.damagedQuantity >= qty) {
        batch.damagedQuantity -= qty;
      } else if (batch.expiredQuantity >= qty) {
        batch.expiredQuantity -= qty;
      } else if (batch.availableQuantity >= qty) {
        batch.availableQuantity -= qty;
      } else {
        return fail('Insufficient stock in batch pools for write-off', 400);
      }
    }

    syncProductStock(db, batch.productId);
    const actor = getCurrentActor(db);
    const adj = {
      id: uid('adj'),
      referenceCode: `ADJ-${Date.now().toString().slice(-5)}`,
      productId: batch.productId,
      batchId: batch.id,
      adjustmentType: body.adjustmentType,
      quantity: qty,
      reason: body.reason,
      adjustedById: actor.id,
      createdAt: new Date().toISOString(),
    };
    db.stockAdjustments.unshift(adj);

    db.stockMovements.unshift({
      id: uid('mv'),
      productId: batch.productId,
      batchId: batch.id,
      movementType:
        body.adjustmentType === 'ADDITION' ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_DEDUCT',
      quantity: body.adjustmentType === 'ADDITION' ? qty : -qty,
      previousStock: prevStock,
      newStock: batch.availableQuantity,
      reason: body.reason,
      referenceType: 'ADJUSTMENT',
      referenceId: adj.id,
      performedById: actor.id,
      createdAt: new Date().toISOString(),
    });

    return ok(adj, 'Stock adjustment recorded', 201);
  }

  const quarMatch = cleanPath.match(
    /^\/inventory\/batches\/([^/]+)\/release-quarantine$/
  );
  if (quarMatch && m === 'POST') {
    const batch = db.batches.find((b) => b.id === quarMatch[1]);
    if (!batch) return fail('Batch not found', 404);
    const qty = Number(body.quantity || 0);
    batch.quarantinedQuantity = Math.max(0, batch.quarantinedQuantity - qty);
    if (body.decision === 'RELEASE_TO_SELLABLE') {
      batch.availableQuantity += qty;
    } else {
      batch.damagedQuantity += qty;
    }
    syncProductStock(db, batch.productId);
    return ok(batch);
  }

  if (cleanPath === '/inventory/movements' && m === 'GET') {
    const list = db.stockMovements.map((mv) => ({
      ...mv,
      product: db.products.find((p) => p.id === mv.productId),
      batch: db.batches.find((b) => b.id === mv.batchId),
      performedBy: db.users.find((u) => u.id === mv.performedById),
    }));
    return ok(list);
  }

  // ==========================================================================
  // BILLING / POS (SUPPORTS AUTO FEFO/FIFO AND SPECIFIC BATCH SELECTION)
  // ==========================================================================
  if (cleanPath === '/billing/sales' && m === 'GET') {
    const search = String(params?.search || '').toLowerCase();
    const status = String(params?.status || '');
    const list = db.sales
      .filter((s) => {
        if (status && s.status !== status) return false;
        if (!search) return true;
        return (
          s.invoiceNumber.toLowerCase().includes(search) ||
          (s.customerName && s.customerName.toLowerCase().includes(search)) ||
          (s.customerPhone && s.customerPhone.toLowerCase().includes(search))
        );
      })
      .map((s) => hydrateSale(db, s));
    return ok(list);
  }

  if (cleanPath === '/billing/sales' && m === 'POST') {
    const actor = getCurrentActor(db);
    if (body.offlineTempId) {
      const dup = db.sales.find((s) => s.offlineTempId === body.offlineTempId);
      if (dup) return ok(hydrateSale(db, dup));
    }

    const now = new Date();
    const nextSeq = (db.business.settings.currentInvoiceSequence || 1002) + 1;
    db.business.settings.currentInvoiceSequence = nextSeq;
    const invoiceNumber = `${db.business.settings.invoicePrefix || 'INV-'}${nextSeq}`;

    let subtotal = 0;
    let itemDiscountTotal = 0;
    let taxAmount = 0;
    const saleId = uid('sale');
    const saleItems: any[] = [];

    for (const reqItem of body.items || []) {
      const prod = db.products.find((p) => p.id === reqItem.productId);
      if (!prod) return fail('Item not found', 404);

      let eligibleBatches = db.batches
        .filter(
          (b) =>
            b.productId === prod.id &&
            b.availableQuantity > 0 &&
            !b.isExpiredMarked &&
            (!b.expiryDate || new Date(b.expiryDate) > now)
        )
        .sort((a, b) =>
          (a.expiryDate || '9999').localeCompare(b.expiryDate || '9999')
        );

      // If user explicitly chose a batch in Pharmacy POS, prioritize that batch first
      if (reqItem.batchId) {
        const chosenBatch = db.batches.find((b) => b.id === reqItem.batchId);
        if (!chosenBatch) {
          return fail(`Selected batch not found for "${prod.name}"`, 400);
        }
        const chosenExpired =
          chosenBatch.isExpiredMarked ||
          (chosenBatch.expiryDate !== null && new Date(chosenBatch.expiryDate) <= now);
        if (chosenExpired) {
          return fail(
            `Batch ${chosenBatch.batchNumber} of "${prod.name}" is expired and cannot be billed`,
            400
          );
        }
        eligibleBatches = [
          chosenBatch,
          ...eligibleBatches.filter((b) => b.id !== chosenBatch.id),
        ];
      }

      const avail = eligibleBatches.reduce((s, b) => s + b.availableQuantity, 0);
      if (avail < reqItem.quantity) {
        return fail(
          `Insufficient sellable non-expired stock for "${prod.name}". Available: ${avail}`,
          400
        );
      }

      let rem = Number(reqItem.quantity);
      for (const batch of eligibleBatches) {
        if (rem <= 0) break;
        const take = Math.min(batch.availableQuantity, rem);
        if (take <= 0) continue;
        rem -= take;
        const prev = batch.availableQuantity;
        batch.availableQuantity -= take;

        const unitPrice = Number(reqItem.unitPrice ?? batch.sellingPrice ?? prod.sellingPrice);
        const propDisc =
          (Number(reqItem.discountAmount || 0) * take) / Number(reqItem.quantity);
        const gross = unitPrice * take;
        const taxable = Math.max(0, gross - propDisc);
        const lineTax = (taxable * Number(prod.taxPercentage || 0)) / 100;
        const lineTotal = taxable + lineTax;

        subtotal += gross;
        itemDiscountTotal += propDisc;
        taxAmount += lineTax;

        saleItems.push({
          id: uid('si'),
          saleId,
          productId: prod.id,
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          quantity: take,
          returnedQuantity: 0,
          purchasePrice: Number(batch.purchasePrice),
          unitPrice,
          discountAmount: Number(propDisc.toFixed(2)),
          taxPercentage: Number(prod.taxPercentage),
          taxAmount: Number(lineTax.toFixed(2)),
          totalAmount: Number(lineTotal.toFixed(2)),
        });

        db.stockMovements.unshift({
          id: uid('mv'),
          productId: prod.id,
          batchId: batch.id,
          movementType: 'SALE_DEDUCTION',
          quantity: -take,
          previousStock: prev,
          newStock: batch.availableQuantity,
          reason: `Sold on Invoice ${invoiceNumber}`,
          referenceType: 'SALE',
          referenceId: saleId,
          performedById: actor.id,
          createdAt: now.toISOString(),
        });
      }
      syncProductStock(db, prod.id);
    }

    const billDisc = Number(body.billDiscountAmount || 0);
    const grandTotal = Math.max(
      0,
      Number((subtotal - itemDiscountTotal - billDisc + taxAmount).toFixed(2))
    );
    const totalPaidRaw = (body.payments || []).reduce(
      (s: number, p: any) => s + Number(p.amount || 0),
      0
    );
    const paidAmount = Math.min(grandTotal, totalPaidRaw);
    const dueAmount = Math.max(0, Number((grandTotal - paidAmount).toFixed(2)));
    const status =
      dueAmount === 0 ? 'PAID' : paidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING';

    const newSale = {
      id: saleId,
      invoiceNumber,
      offlineTempId: body.offlineTempId || null,
      customerId: body.customerId || null,
      customerName: body.customerName || 'Walk-in Customer',
      customerPhone: body.customerPhone || null,
      doctorName: body.doctorName || null,
      prescriptionReference: body.prescriptionReference || null,
      saleDate: now.toISOString(),
      subtotal: Number(subtotal.toFixed(2)),
      itemDiscountTotal: Number(itemDiscountTotal.toFixed(2)),
      billDiscountAmount: Number(billDisc.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      grandTotal,
      paidAmount,
      dueAmount,
      changeReturned: Math.max(0, totalPaidRaw - grandTotal),
      status,
      cashierId: actor.id,
      items: saleItems,
      payments: (body.payments || []).map((p: any) => ({
        id: uid('pay'),
        saleId,
        paymentMethod: p.paymentMethod || 'CASH',
        amount: paidAmount,
        referenceNumber: p.referenceNumber || null,
        paidAt: now.toISOString(),
      })),
    };

    db.sales.unshift(newSale);
    recordAudit(db, 'BILL_CREATED', 'BILLING', 'Sale', newSale.id);
    return ok(hydrateSale(db, newSale), 'Invoice generated', 201);
  }

  if (cleanPath === '/billing/sync-offline' && m === 'POST') {
    const synced: any[] = [];
    const conflicts: any[] = [];
    for (const b of body?.bills || []) {
      const res = await handleLocalApiRequest('POST', '/billing/sales', b);
      if (res.status < 300) {
        synced.push({
          offlineTempId: b.offlineTempId,
          invoiceNumber: res.data.data.invoiceNumber,
          id: res.data.data.id,
        });
      } else {
        conflicts.push({
          offlineTempId: b.offlineTempId,
          error: res.data.message,
        });
      }
    }
    return ok({ synced, conflicts });
  }

  const salePayMatch = cleanPath.match(/^\/billing\/sales\/([^/]+)\/payments$/);
  if (salePayMatch && m === 'POST') {
    const sale = db.sales.find((s) => s.id === salePayMatch[1]);
    if (!sale) return fail('Sale not found', 404);
    const amt = Math.min(Number(sale.dueAmount), Number(body.amount || 0));
    sale.paidAmount = Number((Number(sale.paidAmount) + amt).toFixed(2));
    sale.dueAmount = Math.max(0, Number((Number(sale.dueAmount) - amt).toFixed(2)));
    sale.status = sale.dueAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';
    sale.payments.push({
      id: uid('pay'),
      saleId: sale.id,
      paymentMethod: body.paymentMethod || 'CASH',
      amount: amt,
      referenceNumber: body.referenceNumber || null,
      paidAt: new Date().toISOString(),
    });
    return ok(hydrateSale(db, sale));
  }

  const saleCancelMatch = cleanPath.match(/^\/billing\/sales\/([^/]+)\/cancel$/);
  if (saleCancelMatch && m === 'POST') {
    const sale = db.sales.find((s) => s.id === saleCancelMatch[1]);
    if (!sale) return fail('Sale not found', 404);
    for (const item of sale.items) {
      const net = item.quantity - item.returnedQuantity;
      if (net <= 0) continue;
      const batch = db.batches.find((b) => b.id === item.batchId);
      if (batch) {
        const prev = batch.availableQuantity;
        batch.availableQuantity += net;
        db.stockMovements.unshift({
          id: uid('mv'),
          productId: item.productId,
          batchId: batch.id,
          movementType: 'SALE_CANCELLATION_REVERSAL',
          quantity: net,
          previousStock: prev,
          newStock: batch.availableQuantity,
          reason: `Cancelled ${sale.invoiceNumber}: ${body.reason}`,
          referenceType: 'SALE_CANCEL',
          referenceId: sale.id,
          performedById: getCurrentActor(db).id,
          createdAt: new Date().toISOString(),
        });
      }
      syncProductStock(db, item.productId);
    }
    sale.status = 'CANCELLED';
    sale.dueAmount = 0;
    recordAudit(db, 'BILL_CANCELLED', 'BILLING', 'Sale', sale.id);
    return ok(hydrateSale(db, sale));
  }

  const saleIdMatch = cleanPath.match(/^\/billing\/sales\/([^/]+)$/);
  if (saleIdMatch && m === 'GET') {
    const key = decodeURIComponent(saleIdMatch[1]).toLowerCase();
    const sale = db.sales.find(
      (s) => s.id.toLowerCase() === key || s.invoiceNumber.toLowerCase() === key
    );
    if (!sale) return fail('Invoice not found', 404);
    return ok(hydrateSale(db, sale));
  }

  // ==========================================================================
  // SALES RETURNS & SUPPLIER RETURNS
  // ==========================================================================
  if (cleanPath === '/returns/sales' && m === 'GET') {
    const list = db.salesReturns.map((sr) => ({
      ...sr,
      sale: db.sales.find((s) => s.id === sr.saleId),
      processedBy: db.users.find((u) => u.id === sr.processedById),
      items: (sr.items || []).map((i: any) => ({
        ...i,
        product: db.products.find((p) => p.id === i.productId),
        batch: db.batches.find((b) => b.id === i.batchId),
      })),
    }));
    return ok(list);
  }

  if (cleanPath === '/returns/sales' && m === 'POST') {
    const sale = db.sales.find((s) => s.id === body.saleId);
    if (!sale) return fail('Original bill not found', 404);
    const actor = getCurrentActor(db);
    const returnNumber = `SR-${Date.now().toString().slice(-5)}`;
    let totalRefundAmount = 0;
    const items: any[] = [];

    for (const reqItem of body.items || []) {
      const si = sale.items.find((x) => x.id === reqItem.saleItemId);
      if (!si) continue;
      const qty = Number(reqItem.quantity || 0);
      if (qty <= 0) continue;
      si.returnedQuantity += qty;
      const lineRefund = Number(((si.totalAmount / si.quantity) * qty).toFixed(2));
      totalRefundAmount += lineRefund;

      const batch = db.batches.find((b) => b.id === si.batchId);
      if (batch) {
        const prev = batch.availableQuantity;
        if (reqItem.condition === 'GOOD_CONDITION') {
          batch.availableQuantity += qty;
        } else if (reqItem.condition === 'DAMAGED') {
          batch.damagedQuantity += qty;
        } else if (reqItem.condition === 'EXPIRED') {
          batch.expiredQuantity += qty;
        } else {
          batch.quarantinedQuantity += qty;
        }
        syncProductStock(db, si.productId);
        db.stockMovements.unshift({
          id: uid('mv'),
          productId: si.productId,
          batchId: batch.id,
          movementType: `SALES_RETURN_${reqItem.condition}`,
          quantity: qty,
          previousStock: prev,
          newStock: batch.availableQuantity,
          reason: `Sales Return ${returnNumber} (${reqItem.condition})`,
          referenceType: 'SALES_RETURN',
          referenceId: returnNumber,
          performedById: actor.id,
          createdAt: new Date().toISOString(),
        });
      }

      items.push({
        id: uid('sri'),
        saleItemId: si.id,
        productId: si.productId,
        batchId: si.batchId,
        quantity: qty,
        unitPrice: si.unitPrice,
        refundAmount: lineRefund,
        reason: reqItem.reason,
        condition: reqItem.condition,
      });
    }

    const allRet = sale.items.every((si) => si.returnedQuantity >= si.quantity);
    sale.status = allRet ? 'FULLY_RETURNED' : 'PARTIALLY_RETURNED';

    const sr = {
      id: uid('sr'),
      returnNumber,
      saleId: sale.id,
      returnDate: new Date().toISOString(),
      totalRefundAmount: Number(totalRefundAmount.toFixed(2)),
      refundMethod: body.refundMethod || 'CASH',
      processedById: actor.id,
      items,
    };
    db.salesReturns.unshift(sr);
    return ok(sr, 'Sales return processed', 201);
  }

  if (cleanPath === '/returns/supplier' && m === 'GET') {
    const list = db.supplierReturns.map((sr) => ({
      ...sr,
      supplier: db.suppliers.find((s) => s.id === sr.supplierId),
      createdBy: db.users.find((u) => u.id === sr.createdById),
      items: (sr.items || []).map((i: any) => ({
        ...i,
        product: db.products.find((p) => p.id === i.productId),
        batch: db.batches.find((b) => b.id === i.batchId),
      })),
    }));
    return ok(list);
  }

  if (cleanPath === '/returns/supplier' && m === 'POST') {
    const actor = getCurrentActor(db);
    const returnNumber = `PR-${Date.now().toString().slice(-5)}`;
    let totalReturnAmount = 0;
    const items: any[] = [];

    for (const item of body.items || []) {
      const batch = db.batches.find((b) => b.id === item.batchId);
      if (!batch) return fail('Batch not found', 404);
      const qty = Number(item.quantity || 0);
      if (item.sourceStockPool === 'SELLABLE') {
        if (batch.availableQuantity < qty)
          return fail('Insufficient sellable stock in batch', 400);
        batch.availableQuantity -= qty;
      } else if (item.sourceStockPool === 'DAMAGED') {
        if (batch.damagedQuantity < qty)
          return fail('Insufficient damaged stock in batch', 400);
        batch.damagedQuantity -= qty;
      } else if (item.sourceStockPool === 'EXPIRED') {
        if (batch.expiredQuantity < qty)
          return fail('Insufficient expired stock in batch', 400);
        batch.expiredQuantity -= qty;
      } else {
        batch.quarantinedQuantity = Math.max(0, batch.quarantinedQuantity - qty);
      }
      batch.returnedToSupplierQty += qty;
      syncProductStock(db, batch.productId);

      const lineVal = qty * Number(batch.purchasePrice);
      totalReturnAmount += lineVal;
      items.push({
        id: uid('pri'),
        productId: batch.productId,
        batchId: batch.id,
        sourceStockPool: item.sourceStockPool,
        quantity: qty,
        purchasePrice: batch.purchasePrice,
        totalAmount: lineVal,
        reason: item.reason,
      });
    }

    const sr = {
      id: uid('pr'),
      returnNumber,
      supplierId: body.supplierId,
      returnDate: new Date().toISOString(),
      status: body.status || 'SUBMITTED',
      totalReturnAmount,
      creditNoteNumber: null,
      refundAmount: 0,
      notes: body.notes || '',
      createdById: actor.id,
      items,
    };
    db.supplierReturns.unshift(sr);
    return ok(sr, 'Supplier return initiated', 201);
  }

  const supRetStatusMatch = cleanPath.match(
    /^\/returns\/supplier\/([^/]+)\/status$/
  );
  if (supRetStatusMatch && m === 'PATCH') {
    const sr = db.supplierReturns.find((r) => r.id === supRetStatusMatch[1]);
    if (!sr) return fail('Supplier return not found', 404);
    sr.status = body.status;
    if (body.creditNoteNumber !== undefined)
      sr.creditNoteNumber = body.creditNoteNumber;
    if (body.refundAmount !== undefined)
      sr.refundAmount = Number(body.refundAmount);
    return ok(sr);
  }

  // ==========================================================================
  // REPORTS & DASHBOARD ANALYTICS
  // ==========================================================================
  if (cleanPath === '/reports/dashboard' && m === 'GET') {
    for (const p of db.products) {
      syncProductStock(db, p.id);
    }
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const itemNoun = activeMode === 'pharmacy' ? 'Medicine(s)' : 'Product(s)';

    const activeSales = db.sales.filter((s) => s.status !== 'CANCELLED');
    const salesToday = activeSales.filter(
      (s) => s.saleDate.slice(0, 10) === todayStr
    );

    const totalSalesToday = salesToday.reduce(
      (s, x) => s + Number(x.grandTotal),
      0
    );
    const totalSalesThisMonth = activeSales.reduce(
      (s, x) => s + Number(x.grandTotal),
      0
    );
    const totalAvailableStock = db.products.reduce(
      (s, p) => s + p.currentStock,
      0
    );
    const lowStockProducts = db.products.filter(
      (p) => p.currentStock > 0 && p.currentStock <= p.minimumStockLevel
    );
    const outOfStockProducts = db.products.filter((p) => p.currentStock <= 0);

    let expiredProductsCount = 0;
    let approachingExpiryCount = 0;
    let damagedStockQuantity = 0;
    let totalPurchaseValuation = 0;

    for (const b of db.batches) {
      damagedStockQuantity += b.damagedQuantity;
      totalPurchaseValuation += b.availableQuantity * Number(b.purchasePrice);
      const isExp =
        b.isExpiredMarked ||
        (b.expiryDate !== null && new Date(b.expiryDate) <= now) ||
        b.expiredQuantity > 0;
      if (isExp) expiredProductsCount++;
      else if (
        b.expiryDate &&
        new Date(b.expiryDate) > now &&
        new Date(b.expiryDate) <= in30Days &&
        b.availableQuantity > 0
      ) {
        approachingExpiryCount++;
      }
    }

    const dailySales = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(now.getTime() - (6 - idx) * 24 * 60 * 60 * 1000);
      const k = d.toISOString().slice(0, 10);
      const daySales = activeSales
        .filter((s) => s.saleDate.slice(0, 10) === k)
        .reduce((sum, s) => sum + Number(s.grandTotal), 0);
      const dayReturns = db.salesReturns
        .filter((sr) => sr.returnDate.slice(0, 10) === k)
        .reduce((sum, sr) => sum + Number(sr.totalRefundAmount), 0);
      return {
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        sales: Number(daySales.toFixed(2)),
        returns: Number(dayReturns.toFixed(2)),
      };
    });

    const monthlySales = [
      { month: 'Sep', sales: activeMode === 'pharmacy' ? 28400 : 14200, returns: 450 },
      { month: 'Oct', sales: activeMode === 'pharmacy' ? 34900 : 19850, returns: 620 },
      {
        month: 'Nov',
        sales: Number(totalSalesThisMonth.toFixed(2)),
        returns: db.salesReturns.reduce(
          (s, r) => s + Number(r.totalRefundAmount),
          0
        ),
      },
    ];

    const topSellingProducts = db.products.slice(0, 5).map((p) => {
      let revenue = 0;
      let unitsSold = 0;
      for (const s of activeSales) {
        for (const i of s.items) {
          if (i.productId === p.id) {
            revenue += Number(i.totalAmount);
            unitsSold += i.quantity - i.returnedQuantity;
          }
        }
      }
      return {
        name: p.name.slice(0, 22),
        sku: p.sku,
        unitsSold,
        revenue: Number(revenue.toFixed(2)),
      };
    });

    const categoryDistribution = db.categories.map((c) => {
      const prods = db.products.filter((p) => p.categoryId === c.id);
      return {
        name: c.name,
        units: prods.reduce((s, p) => s + p.currentStock, 0),
        value: prods.reduce(
          (s, p) => s + p.currentStock * Number(p.purchasePrice),
          0
        ),
      };
    });

    const alerts = [
      ...(outOfStockProducts.length > 0
        ? [
            {
              id: 'a-oos',
              severity: 'high',
              title: `${outOfStockProducts.length} ${itemNoun} Out of Stock`,
              message: outOfStockProducts.map((p) => p.name).join(', '),
              link: '/products',
            },
          ]
        : []),
      ...(expiredProductsCount > 0
        ? [
            {
              id: 'a-exp',
              severity: 'high',
              title: `${expiredProductsCount} Batch(es) Expired`,
              message: 'Blocked from POS billing. Initiate return or write-off.',
              link: activeMode === 'pharmacy' ? '/expiry-management' : '/expiry-damaged',
            },
          ]
        : []),
      ...(approachingExpiryCount > 0
        ? [
            {
              id: 'a-near',
              severity: 'medium',
              title: `${approachingExpiryCount} Batch(es) Expiring Within 30 Days`,
              message: 'FEFO prioritized for billing.',
              link: activeMode === 'pharmacy' ? '/expiry-management' : '/expiry-damaged',
            },
          ]
        : []),
    ];

    return ok({
      kpis: {
        totalSalesToday: Number(totalSalesToday.toFixed(2)),
        totalSalesThisMonth: Number(totalSalesThisMonth.toFixed(2)),
        billsTodayCount: salesToday.length,
        totalProducts: db.products.length,
        totalAvailableStock,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        expiredProductsCount,
        approachingExpiryCount,
        damagedStockQuantity,
        totalPurchaseValuation: Number(totalPurchaseValuation.toFixed(2)),
      },
      charts: {
        dailySales,
        monthlySales,
        topSellingProducts,
        categoryDistribution,
      },
      recentTransactions: db.sales.slice(0, 8).map((s) => hydrateSale(db, s)),
      recentMovements: db.stockMovements.slice(0, 8).map((mv) => ({
        ...mv,
        product: db.products.find((p) => p.id === mv.productId),
        batch: db.batches.find((b) => b.id === mv.batchId),
        performedBy: db.users.find((u) => u.id === mv.performedById),
      })),
      alerts,
    });
  }

  if (cleanPath === '/reports/analytics' && m === 'GET') {
    const activeSales = db.sales
      .filter((s) => s.status !== 'CANCELLED')
      .map((s) => hydrateSale(db, s));
    const cancelledSales = db.sales
      .filter((s) => s.status === 'CANCELLED')
      .map((s) => hydrateSale(db, s));

    let totalGrossSales = 0;
    let totalTaxCollected = 0;
    let totalDiscounts = 0;
    let netRevenueExclTax = 0;
    let actualCostOfGoodsSold = 0;

    const prodProfitMap = new Map<string, any>();
    const genericSalesMap = new Map<string, { genericName: string; unitsSold: number; revenue: number }>();
    const brandSalesMap = new Map<string, { brand: string; unitsSold: number; revenue: number }>();
    const categorySalesMap = new Map<string, { category: string; unitsSold: number; revenue: number }>();
    const paymentMethodMap = new Map<string, { method: string; count: number; amount: number }>();
    const cashierMap = new Map<string, { cashierName: string; billCount: number; totalSales: number }>();

    for (const s of activeSales) {
      totalGrossSales += Number(s.grandTotal);
      totalTaxCollected += Number(s.taxAmount);
      totalDiscounts +=
        Number(s.itemDiscountTotal) + Number(s.billDiscountAmount);

      const cName = s.cashier?.fullName || 'Staff';
      const cEntry = cashierMap.get(cName) || { cashierName: cName, billCount: 0, totalSales: 0 };
      cEntry.billCount += 1;
      cEntry.totalSales = Number((cEntry.totalSales + Number(s.grandTotal)).toFixed(2));
      cashierMap.set(cName, cEntry);

      for (const pay of s.payments || []) {
        const pm = pay.paymentMethod || 'CASH';
        const pmEntry = paymentMethodMap.get(pm) || { method: pm, count: 0, amount: 0 };
        pmEntry.count += 1;
        pmEntry.amount = Number((pmEntry.amount + Number(pay.amount)).toFixed(2));
        paymentMethodMap.set(pm, pmEntry);
      }

      for (const item of s.items) {
        const netUnits = Math.max(0, item.quantity - item.returnedQuantity);
        const unitRevExclTax =
          (Number(item.totalAmount) - Number(item.taxAmount)) / item.quantity;
        const lineRevExcl = unitRevExclTax * netUnits;
        const lineCost = Number(item.purchasePrice) * netUnits;
        const lineProfit = lineRevExcl - lineCost;

        netRevenueExclTax += lineRevExcl;
        actualCostOfGoodsSold += lineCost;

        const catName = item.product?.category?.name || 'General';
        const catEntry = categorySalesMap.get(catName) || {
          category: catName,
          unitsSold: 0,
          revenue: 0,
        };
        catEntry.unitsSold += netUnits;
        catEntry.revenue = Number((catEntry.revenue + Number(item.totalAmount)).toFixed(2));
        categorySalesMap.set(catName, catEntry);

        const genName = item.product?.genericName || 'Standard Formulation';
        const genEntry = genericSalesMap.get(genName) || {
          genericName: genName,
          unitsSold: 0,
          revenue: 0,
        };
        genEntry.unitsSold += netUnits;
        genEntry.revenue = Number((genEntry.revenue + Number(item.totalAmount)).toFixed(2));
        genericSalesMap.set(genName, genEntry);

        const brandName = item.product?.brand || 'Unbranded';
        const brandEntry = brandSalesMap.get(brandName) || {
          brand: brandName,
          unitsSold: 0,
          revenue: 0,
        };
        brandEntry.unitsSold += netUnits;
        brandEntry.revenue = Number((brandEntry.revenue + Number(item.totalAmount)).toFixed(2));
        brandSalesMap.set(brandName, brandEntry);

        const curr = prodProfitMap.get(item.productId) || {
          productId: item.productId,
          name: item.product?.name || 'Item',
          sku: item.product?.sku || '',
          genericName: item.product?.genericName || null,
          brand: item.product?.brand || null,
          dosageForm: item.product?.dosageForm || null,
          category: catName,
          unitsSold: 0,
          returnedUnits: 0,
          netUnits: 0,
          revenueExclTax: 0,
          actualPurchaseCost: 0,
          grossProfit: 0,
          marginPercent: 0,
        };
        curr.unitsSold += item.quantity;
        curr.returnedUnits += item.returnedQuantity;
        curr.netUnits += netUnits;
        curr.revenueExclTax = Number((curr.revenueExclTax + lineRevExcl).toFixed(2));
        curr.actualPurchaseCost = Number(
          (curr.actualPurchaseCost + lineCost).toFixed(2)
        );
        curr.grossProfit = Number((curr.grossProfit + lineProfit).toFixed(2));
        curr.marginPercent =
          curr.revenueExclTax > 0
            ? Number(((curr.grossProfit / curr.revenueExclTax) * 100).toFixed(1))
            : 0;
        prodProfitMap.set(item.productId, curr);
      }
    }

    const totalSalesReturns = db.salesReturns.reduce(
      (s, r) => s + Number(r.totalRefundAmount),
      0
    );
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const hydratedBatches = db.batches.map((b) => hydrateBatch(db, b));
    const totalValuation = hydratedBatches.reduce(
      (s, b) => s + b.availableQuantity * Number(b.purchasePrice),
      0
    );

    const expiredBatches = hydratedBatches.filter(
      (b) =>
        b.isExpiredMarked ||
        (b.expiryDate !== null && new Date(b.expiryDate) <= now) ||
        b.expiredQuantity > 0
    );
    const nearExpiryBatches = hydratedBatches.filter(
      (b) =>
        b.expiryDate !== null &&
        new Date(b.expiryDate) > now &&
        new Date(b.expiryDate) <= in30Days &&
        b.availableQuantity > 0
    );
    const damagedBatches = hydratedBatches.filter((b) => b.damagedQuantity > 0);

    return ok({
      salesSummary: {
        totalBills: activeSales.length,
        cancelledBillsCount: cancelledSales.length,
        totalGrossSales: Number(totalGrossSales.toFixed(2)),
        totalSalesReturns: Number(totalSalesReturns.toFixed(2)),
        totalDiscounts: Number(totalDiscounts.toFixed(2)),
        totalTaxCollected: Number(totalTaxCollected.toFixed(2)),
        cashierBreakdown: Array.from(cashierMap.values()),
        paymentMethodBreakdown: Array.from(paymentMethodMap.values()),
        categoryBreakdown: Array.from(categorySalesMap.values()),
        genericBreakdown: Array.from(genericSalesMap.values()),
        brandBreakdown: Array.from(brandSalesMap.values()),
        bills: activeSales,
        cancelledBills: cancelledSales,
        salesReturns: db.salesReturns,
      },
      inventorySummary: {
        totalProducts: db.products.length,
        totalBatches: hydratedBatches.length,
        totalValuation: Number(totalValuation.toFixed(2)),
        lowStockProducts: db.products.filter(
          (p) => p.currentStock > 0 && p.currentStock <= p.minimumStockLevel
        ),
        outOfStockProducts: db.products.filter((p) => p.currentStock <= 0),
        products: db.products,
        batches: hydratedBatches,
        expiredBatches,
        nearExpiryBatches,
        damagedBatches,
        purchases: db.purchases.map((p) => ({
          ...p,
          supplier: db.suppliers.find((s) => s.id === p.supplierId),
        })),
        supplierReturns: db.supplierReturns.map((sr) => ({
          ...sr,
          supplier: db.suppliers.find((s) => s.id === sr.supplierId),
        })),
        adjustments: db.stockAdjustments,
      },
      financialSummary: {
        totalSales: Number(totalGrossSales.toFixed(2)),
        netRevenueExclTax: Number(netRevenueExclTax.toFixed(2)),
        actualCostOfGoodsSold: Number(actualCostOfGoodsSold.toFixed(2)),
        grossProfit: Number(
          (netRevenueExclTax - actualCostOfGoodsSold).toFixed(2)
        ),
        totalInventoryPurchaseValue: Number(totalValuation.toFixed(2)),
        totalSalesReturns: Number(totalSalesReturns.toFixed(2)),
        totalDiscounts: Number(totalDiscounts.toFixed(2)),
        totalTaxCollected: Number(totalTaxCollected.toFixed(2)),
        productWiseProfit: Array.from(prodProfitMap.values()),
        outstandingCustomers: db.customers.filter(
          (c) => c.outstandingBalance > 0
        ),
        outstandingSuppliers: db.suppliers.filter(
          (s) => s.outstandingBalance > 0
        ),
      },
    });
  }

  return ok(null, 'Handled by standalone frontend engine');
}
