import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit3,
  Eye,
  IndianRupee,
  X,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { catalogApi, SupplierRecord } from '../../api/catalog.api';
import { useAuthStore } from '../../store/auth.store';

export const SuppliersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuthStore();
  const canManage = hasPermission('suppliers:manage');
  const currency = user?.business?.settings?.currencySymbol || '₹';

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierRecord | null>(null);
  const [supplierDetail, setSupplierDetail] = useState<any | null>(null);
  const [paySupplier, setPaySupplier] = useState<SupplierRecord | null>(null);
  const [payAmount, setPayAmount] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    notes: '',
    outstandingBalance: 0,
  });

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => catalogApi.listSuppliers(search || undefined),
  });

  const createMutation = useMutation({
    mutationFn: catalogApi.createSupplier,
    onSuccess: () => {
      toast.success('Supplier added');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsModalOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to add supplier'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      catalogApi.updateSupplier(id, payload),
    onSuccess: () => {
      toast.success('Supplier updated');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsModalOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to update supplier'),
  });

  const payMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      catalogApi.paySupplierBalance(id, amount),
    onSuccess: () => {
      toast.success('Supplier payment recorded');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setPaySupplier(null);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Payment failed'),
  });

  const openCreate = () => {
    setEditing(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      gstin: '',
      notes: '',
      outstandingBalance: 0,
    });
    setIsModalOpen(true);
  };

  const openEdit = (s: SupplierRecord) => {
    setEditing(s);
    setFormData({
      name: s.name,
      contactPerson: s.contactPerson || '',
      phone: s.phone,
      email: s.email || '',
      address: s.address || '',
      gstin: s.gstin || '',
      notes: s.notes || '',
      outstandingBalance: s.outstandingBalance,
    });
    setIsModalOpen(true);
  };

  const openDetails = async (id: string) => {
    try {
      const detail = await catalogApi.getSupplierDetails(id);
      setSupplierDetail(detail);
    } catch {
      toast.error('Failed to load supplier history');
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Supplier Directory & Payables
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track supplier contacts, GSTIN, supplied batches, purchase history, and outstanding balances.
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
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
            placeholder="Search supplier name, contact person, phone, or GSTIN..."
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                <th className="py-3 px-4">Supplier / GSTIN</th>
                <th className="py-3 px-4">Contact Person & Phone</th>
                <th className="py-3 px-4">Purchases / Batches</th>
                <th className="py-3 px-4">Total Purchased</th>
                <th className="py-3 px-4">Outstanding Payable</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading suppliers...
                  </td>
                </tr>
              ) : (
                suppliers?.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-sm">
                        {s.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        GSTIN: {s.gstin || 'Unregistered'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-700">
                        {s.contactPerson || '—'}
                      </div>
                      <div className="text-[11px] text-slate-500">{s.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      {s.purchaseCount} Purchase(s) • {s.batchCount} Batch(es)
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {currency}
                      {s.totalPurchased.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold ${
                          s.outstandingBalance > 0
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {currency}
                        {s.outstandingBalance.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => openDetails(s.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ledger
                      </button>
                      {canManage && s.outstandingBalance > 0 && (
                        <button
                          onClick={() => {
                            setPaySupplier(s);
                            setPayAmount(s.outstandingBalance);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold"
                        >
                          <IndianRupee className="w-3 h-3" />
                          Pay
                        </button>
                      )}
                      {canManage && (
                        <button
                          onClick={() => openEdit(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">
                {editing ? 'Edit Supplier' : 'Add Supplier'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier Name *
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
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactPerson: e.target.value,
                      })
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
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) =>
                      setFormData({ ...formData, gstin: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg uppercase"
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
                    Outstanding Balance ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.outstandingBalance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        outstandingBalance: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
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
                  <span>Save Supplier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Balance Modal */}
      {paySupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900">
              Record Payment to {paySupplier.name}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Amount ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPaySupplier(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  payMutation.mutate({ id: paySupplier.id, amount: payAmount })
                }
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier History Modal */}
      {supplierDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900">
                  {supplierDetail.name} — Purchase & Batch Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  GSTIN: {supplierDetail.gstin || 'N/A'} • Phone: {supplierDetail.phone}
                </p>
              </div>
              <button onClick={() => setSupplierDetail(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <h4 className="font-bold uppercase text-slate-500">
                Supplied Product Batches ({supplierDetail.batches?.length || 0})
              </h4>
              <table className="w-full text-left border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-3">Batch No</th>
                    <th className="py-2 px-3">Received Qty</th>
                    <th className="py-2 px-3">Available</th>
                    <th className="py-2 px-3">Purchase Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supplierDetail.batches?.map((b: any) => (
                    <tr key={b.id}>
                      <td className="py-2 px-3 font-semibold">
                        {b.product?.name}
                      </td>
                      <td className="py-2 px-3 font-mono">{b.batchNumber}</td>
                      <td className="py-2 px-3">{b.initialQuantity}</td>
                      <td className="py-2 px-3 font-bold text-emerald-600">
                        {b.availableQuantity}
                      </td>
                      <td className="py-2 px-3">
                        {currency}
                        {Number(b.purchasePrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

