import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  BusinessMode,
  BusinessModeConfig,
  BUSINESS_MODE_CONFIGS,
  getStoredBusinessMode,
  setStoredBusinessMode,
} from '../config/businessModes';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/auth.api';

interface BusinessModeContextValue {
  mode: BusinessMode;
  setMode: (mode: BusinessMode) => void;
  isPharmacy: boolean;
  isStore: boolean;
  config: BusinessModeConfig;
}

export const BusinessModeContext = createContext<BusinessModeContextValue>({
  mode: 'store',
  setMode: () => {},
  isPharmacy: false,
  isStore: true,
  config: BUSINESS_MODE_CONFIGS.store,
});

export const BusinessModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setModeState] = useState<BusinessMode>(() =>
    getStoredBusinessMode()
  );
  const queryClient = useQueryClient();
  const { token, updateUser } = useAuthStore();

  const setMode = useCallback(
    async (nextMode: BusinessMode) => {
      setStoredBusinessMode(nextMode);
      setModeState(nextMode);

      // Refresh active user business profile for the newly selected mode and clear stale queries
      if (token) {
        try {
          const refreshedUser = await authApi.getMe();
          updateUser(refreshedUser);
        } catch {
          // Ignore if unauthenticated
        }
      }
      queryClient.invalidateQueries();
    },
    [queryClient, token, updateUser]
  );

  // Sync across tabs if localStorage changes externally
  useEffect(() => {
    const onStorageChange = (e: StorageEvent) => {
      if (
        e.key === 'apexpos_business_mode' &&
        (e.newValue === 'store' || e.newValue === 'pharmacy')
      ) {
        setModeState(e.newValue);
        queryClient.invalidateQueries();
      }
    };
    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, [queryClient]);

  const value: BusinessModeContextValue = {
    mode,
    setMode,
    isPharmacy: mode === 'pharmacy',
    isStore: mode === 'store',
    config: BUSINESS_MODE_CONFIGS[mode],
  };

  return (
    <BusinessModeContext.Provider value={value}>
      {children}
    </BusinessModeContext.Provider>
  );
};

export function useBusinessModeContext(): BusinessModeContextValue {
  return useContext(BusinessModeContext);
}

