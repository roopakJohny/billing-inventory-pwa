import React from 'react';
import { storeConfig } from './storeConfig';
import { pharmacyConfig } from './pharmacyConfig';

export type BusinessMode = 'store' | 'pharmacy';

export const BUSINESS_MODE_STORAGE_KEY = 'apexpos_business_mode';

export interface NavItemConfig {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string;
}

export interface BusinessModeConfig {
  mode: BusinessMode;
  label: string;
  title: string;
  subtitle: string;
  heroBadge: string;
  heroHeadline: string;
  heroDescription: string;
  loginHeading: string;
  loginSubheading: string;
  terms: {
    product: string;
    productSingular: string;
    productPlural: string;
    category: string;
    categorySingular: string;
    categoryPlural: string;
    sku: string;
    posTitle: string;
    catalogTitle: string;
    catalogSubtitle: string;
    inventoryTitle: string;
    inventorySubtitle: string;
    dashboardTitle: string;
    reportsTitle: string;
    searchPlaceholder: string;
    posSearchPlaceholder: string;
  };
  features: {
    showPharmacyFields: boolean;
    showPrescriptionControls: boolean;
    showBatchSelectorInPos: boolean;
    showPharmacyReports: boolean;
    prioritizeFefo: boolean;
  };
  units: string[];
  navigation: NavItemConfig[];
}

export const BUSINESS_MODE_CONFIGS: Record<BusinessMode, BusinessModeConfig> = {
  store: storeConfig,
  pharmacy: pharmacyConfig,
};

export function getStoredBusinessMode(): BusinessMode {
  try {
    const saved = localStorage.getItem(BUSINESS_MODE_STORAGE_KEY);
    if (saved === 'pharmacy' || saved === 'store') {
      return saved;
    }
  } catch {
    // Fallback to default store mode
  }
  return 'store';
}

export function setStoredBusinessMode(mode: BusinessMode): void {
  try {
    localStorage.setItem(BUSINESS_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore storage errors
  }
}
