import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, RoleCode } from '../types';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  updateUser: (user: AuthUser) => void;
  clearAuth: () => void;
  hasRole: (...roles: RoleCode[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (user) => set({ user }),
      clearAuth: () => set({ token: null, user: null }),
      hasRole: (...roles) => {
        const user = get().user;
        if (!user) return false;
        return user.roles.some((r) => roles.includes(r));
      },
      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        if (user.roles.includes('ADMIN')) return true;
        return user.permissions.includes(permission);
      },
    }),
    {
      name: 'apexpos-auth-storage',
    }
  )
);

