import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  Edit3,
  Save,
  X,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { userApi } from '../../api/user.api';
import { RoleCode, UserRecord } from '../../types';
import { useAuthStore } from '../../store/auth.store';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManageUsers = hasPermission('users:manage');

  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  // User Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<RoleCode[]>(['STAFF']);
  const [isActive, setIsActive] = useState(true);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', search, roleFilter],
    queryFn: () =>
      userApi.listUsers({
        search: search || undefined,
        role: roleFilter || undefined,
      }),
  });

  const { data: rolesPermData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles-permissions'],
    queryFn: () => userApi.getRolesAndPermissions(),
  });

  const createMutation = useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['roles-permissions'] });
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      userApi.updateUser(id, payload),
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['roles-permissions'] });
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update user');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: boolean }) =>
      userApi.toggleUserStatus(id, status),
    onSuccess: () => {
      toast.success('Account status updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    },
  });

  const updateRolePermsMutation = useMutation({
    mutationFn: ({
      roleId,
      permissionCodes,
    }: {
      roleId: string;
      permissionCodes: string[];
    }) => userApi.updateRolePermissions(roleId, permissionCodes),
    onSuccess: () => {
      toast.success('Role permissions saved & enforced on backend');
      queryClient.invalidateQueries({ queryKey: ['roles-permissions'] });
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || 'Failed to update role permissions'
      );
    },
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setSelectedRoles(['STAFF']);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (u: UserRecord) => {
    setEditingUser(u);
    setFullName(u.fullName);
    setEmail(u.email);
    setPhone(u.phone || '');
    setPassword('');
    setSelectedRoles(u.roles.map((r) => r.code));
    setIsActive(u.isActive);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleRoleCheckbox = (code: RoleCode) => {
    setSelectedRoles((prev) =>
      prev.includes(code)
        ? prev.length > 1
          ? prev.filter((c) => c !== code)
          : prev
        : [...prev, code]
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        payload: {
          fullName,
          phone,
          roleCodes: selectedRoles,
          isActive,
          ...(password ? { password } : {}),
        },
      });
    } else {
      createMutation.mutate({
        fullName,
        email,
        phone,
        password,
        roleCodes: selectedRoles,
        isActive,
      });
    }
  };

  const togglePermissionForRole = (
    roleId: string,
    currentPerms: string[],
    permCode: string
  ) => {
    if (!canManageUsers) return;
    const nextPerms = currentPerms.includes(permCode)
      ? currentPerms.filter((p) => p !== permCode)
      : [...currentPerms, permCode];
    updateRolePermsMutation.mutate({ roleId, permissionCodes: nextPerms });
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Users & Role-Based Access Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage store staff accounts and configure granular backend-enforced role permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-200/70 p-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'users'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff Accounts</span>
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'permissions'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Role Permissions Matrix</span>
            </button>
          </div>

          {canManageUsers && activeTab === 'users' && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff / Cashier</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Roles</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Login</th>
                  {canManageUsers && (
                    <th className="py-3 px-4 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {usersLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Loading users...
                    </td>
                  </tr>
                ) : !usersData?.items.length ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No users found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  usersData.items.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">
                          {u.fullName}
                        </p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {u.roles.map((r) => (
                            <span
                              key={r.id}
                              className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                                r.code === 'ADMIN'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : r.code === 'MANAGER'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {r.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {u.phone || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleString()
                          : 'Never'}
                      </td>
                      {canManageUsers && (
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: u.id,
                                status: !u.isActive,
                              })
                            }
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Role Permissions Matrix Tab */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-900">
              Configurable Role-Based Permissions Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Toggle permissions below for Manager and Staff/Cashier roles. Changes are immediately enforced on all backend API endpoints.
            </p>
          </div>

          {rolesLoading || !rolesPermData ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Loading permissions matrix...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Permission</th>
                    {rolesPermData.roles.map((role) => (
                      <th key={role.id} className="py-3 px-4 text-center">
                        <div>{role.name}</div>
                        <div className="text-[10px] font-normal text-slate-400">
                          {role.userCount} user(s)
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rolesPermData.permissions.map((perm) => (
                    <tr key={perm.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-semibold text-slate-500">
                        {perm.module}
                      </td>
                      <td className="py-2.5 px-4">
                        <p className="font-semibold text-slate-900">
                          {perm.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {perm.description} ({perm.code})
                        </p>
                      </td>
                      {rolesPermData.roles.map((role) => {
                        const checked =
                          role.code === 'ADMIN' ||
                          role.permissions.includes(perm.code);
                        const disabled =
                          role.code === 'ADMIN' || !canManageUsers;
                        return (
                          <td
                            key={role.id}
                            className="py-2.5 px-4 text-center"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() =>
                                togglePermissionForRole(
                                  role.id,
                                  role.permissions,
                                  perm.code
                                )
                              }
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">
                {editingUser ? 'Edit Staff Account' : 'Create New Staff Account'}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  placeholder="e.g.,Vikram Singh"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg disabled:bg-slate-100"
                  placeholder="staff@store.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {editingUser
                    ? 'New Password (leave blank to keep unchanged)'
                    : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  placeholder="Min 8 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Assign Roles *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ADMIN', 'MANAGER', 'STAFF'] as RoleCode[]).map((code) => (
                    <label
                      key={code}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                        selectedRoles.includes(code)
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(code)}
                        onChange={() => handleRoleCheckbox(code)}
                        className="sr-only"
                      />
                      <span>{code}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingUser ? 'Save Changes' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

