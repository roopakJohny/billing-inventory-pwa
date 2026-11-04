import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit3, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { catalogApi, CustomerRecord } from '../../api/catalog.api';
import { useAuthStore } from '../../store/auth.store';

export const CustomersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuthStore();
  const canManage = hasPermission('customers:manage');
  const currency = user?.business?.settings?.currencySymbol || '₹';

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRecord | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
  });

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => catalogApi.listCustomers(search || undefined),
  });

  const createMutation = useMutation({
    mutationFn: catalogApi.createCustomer,
    onSuccess: () => {
      toast.success('Customer created');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to create customer'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      catalogApi.updateCustomer(id, payload),
    onSuccess: () => {
      toast.success('Customer updated');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to update customer'),
  });

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: '', phone: '', email: '', address: '', gstin: '' });
    setIsModalOpen(true);
  };

  const openEdit = (c: CustomerRecord) => {
    setEditing(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      address: c.address || '',
      gstin: c.gstin || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Customer Directory & Receivables
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage registered customers, phone lookup, purchase history, and pending receivables.
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer by name, phone number, or email..."
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone / Email</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">Bills</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">Pending Due</th>
                {canManage && <th className="py-3 px-4 text-right">Edit</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading customers...
                  </td>
                </tr>
              ) : (
                customers?.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900 text-sm">
                      {c.name}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-blue-600">
                        {c.phone}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {c.email || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.address || '—'}
                    </td>
                    <td className="py-3 px-4 font-medium">{c.billCount}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {currency}
                      {c.totalSpent.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold ${
                          c.outstandingBalance > 0
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {currency}
                        {c.outstandingBalance.toLocaleString('en-IN')}
                      </span>
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openEdit(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">
                {editing ? 'Edit Customer' : 'New Customer'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

