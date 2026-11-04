import { apiClient } from './axiosClient';
import {
  ApiResponse,
  PaginatedResponse,
  PermissionItem,
  RoleCode,
  RoleWithPermissions,
  UserRecord,
} from '../types';

export const userApi = {
  listUsers: async (params?: {
    search?: string;
    role?: string;
    isActive?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await apiClient.get<
      ApiResponse<PaginatedResponse<UserRecord>>
    >('/users', { params });
    return data.data;
  },

  createUser: async (payload: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    roleCodes: RoleCode[];
    isActive?: boolean;
  }) => {
    const { data } = await apiClient.post<ApiResponse<UserRecord>>(
      '/users',
      payload
    );
    return data.data;
  },

  updateUser: async (
    id: string,
    payload: {
      fullName?: string;
      phone?: string;
      roleCodes?: RoleCode[];
      isActive?: boolean;
      password?: string;
    }
  ) => {
    const { data } = await apiClient.put<ApiResponse<UserRecord>>(
      `/users/${id}`,
      payload
    );
    return data.data;
  },

  toggleUserStatus: async (id: string, isActive: boolean) => {
    const { data } = await apiClient.patch<ApiResponse<UserRecord>>(
      `/users/${id}/status`,
      { isActive }
    );
    return data.data;
  },

  getRolesAndPermissions: async () => {
    const { data } = await apiClient.get<
      ApiResponse<{
        roles: RoleWithPermissions[];
        permissions: PermissionItem[];
      }>
    >('/users/roles-permissions');
    return data.data;
  },

  updateRolePermissions: async (roleId: string, permissionCodes: string[]) => {
    const { data } = await apiClient.put<
      ApiResponse<{
        roles: RoleWithPermissions[];
        permissions: PermissionItem[];
      }>
    >(`/users/roles/${roleId}/permissions`, { permissionCodes });
    return data.data;
  },
};

