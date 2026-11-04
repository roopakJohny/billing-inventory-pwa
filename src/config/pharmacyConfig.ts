import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  RotateCcw,
  Pill,
  Tags,
  Boxes,
  Truck,
  Undo2,
  Clock,
  AlertTriangle,
  Building2,
  Users2,
  BarChart3,
  UserCog,
  Settings,
} from 'lucide-react';
import type { BusinessModeConfig } from './businessModes';

export const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Cream',
  'Ointment',
  'Drops',
  'Suspension',
  'Inhaler',
  'Powder',
  'Gel',
  'Sachet',
];

export const MEDICINE_TYPES = [
  'Allopathic',
  'OTC',
  'Supplement',
  'Ayurvedic',
  'Surgical',
  'Pediatric',
];

export const SCHEDULE_CATEGORIES = [
  'OTC',
  'Schedule H',
  'Schedule H1',
  'Schedule G',
  'Schedule X',
];

export const pharmacyConfig: BusinessModeConfig = {
  mode: 'pharmacy',
  label: 'Pharmacy',
  title: 'Apex MedCare Pharmacy',
  subtitle: 'Pharmacy Billing, Batch & Expiry PWA',
  heroBadge: 'FEFO Batch Allocation & Rx Compliance',
  heroHeadline: 'Safe dispensing, strict expiry control, and batch-accurate pharmacy billing.',
  heroDescription:
    'Manage generic compositions, dosage forms, Schedule H/H1 prescriptions, FEFO batch selection, near-expiry alerts, and supplier credit notes.',
  loginHeading: 'Sign in to your pharmacy',
  loginSubheading: 'Enter your pharmacist, manager, or admin credentials to continue',
  terms: {
    product: 'Medicine',
    productSingular: 'Medicine',
    productPlural: 'Medicines',
    category: 'Medicine Category',
    categorySingular: 'Medicine Category',
    categoryPlural: 'Medicine Categories',
    sku: 'Med Code',
    posTitle: 'Pharmacy POS',
    catalogTitle: 'Medicines & Formulations Catalog',
    catalogSubtitle:
      'Manage medicines, generic compositions, dosage forms, schedules, MRP, and FEFO batches.',
    inventoryTitle: 'Pharmacy Batch & Expiry Inventory',
    inventorySubtitle:
      'Track batch-wise medicine stock, MRP, expiry dates, damaged stock, and supplier returns.',
    dashboardTitle: 'Pharmacy Live Overview',
    reportsTitle: 'Pharmacy Reports & Financial Analytics',
    searchPlaceholder:
      'Search by medicine name, generic name, brand, composition, or barcode...',
    posSearchPlaceholder:
      'Search medicine by name, generic composition, brand, or barcode...',
  },
  features: {
    showPharmacyFields: true,
    showPrescriptionControls: true,
    showBatchSelectorInPos: true,
    showPharmacyReports: true,
    prioritizeFefo: true,
  },
  units: ['STRIP', 'BOTTLE', 'VIAL', 'TUBE', 'BOX', 'SACHET', 'PACK', 'AMP', 'PCS'],
  navigation: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
    { label: 'Pharmacy POS', path: '/pos', icon: ShoppingCart, permission: 'billing:create', badge: 'Rx POS' },
    { label: 'Bills', path: '/bills', icon: Receipt, permission: 'billing:view_own' },
    { label: 'Sales Returns', path: '/sales-returns', icon: RotateCcw, permission: 'sales_returns:manage' },
    { label: 'Medicines', path: '/products', icon: Pill, permission: 'products:read' },
    { label: 'Medicine Categories', path: '/categories', icon: Tags, permission: 'products:read' },
    { label: 'Inventory', path: '/inventory', icon: Boxes, permission: 'inventory:read' },
    { label: 'Stock Purchases', path: '/purchases', icon: Truck, permission: 'purchases:manage' },
    { label: 'Stock Returns', path: '/supplier-returns', icon: Undo2, permission: 'supplier_returns:manage' },
    { label: 'Expiry Management', path: '/expiry-management', icon: Clock, permission: 'inventory:read' },
    { label: 'Damaged Medicines', path: '/damaged-medicines', icon: AlertTriangle, permission: 'inventory:read' },
    { label: 'Suppliers', path: '/suppliers', icon: Building2, permission: 'suppliers:manage' },
    { label: 'Customers', path: '/customers', icon: Users2, permission: 'customers:manage' },
    { label: 'Reports', path: '/reports', icon: BarChart3, permission: 'reports:view' },
    { label: 'Users', path: '/users', icon: UserCog, permission: 'users:read' },
    { label: 'Settings', path: '/settings', icon: Settings, permission: 'settings:manage' },
  ],
};
