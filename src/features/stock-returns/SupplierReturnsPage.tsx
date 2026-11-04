import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { returnsApi } from '../../api/returns.api';
import { catalogApi } from '../../api/catalog.api';
import { inventoryApi } from '../../api/inventory.api';
import { useAuthStore } from '../../store/auth.store';

export const SupplierReturnsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currency = user?.business?.settings?.currencySymbol || '₹';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusModalTarget, setStatusModalTarget] = useState<any | null>(null);
  const [nextStatus, setNextStatus] = useState('ACCEPTED');
  const [creditNoteNumber, setCreditNoteNumber] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);

  // Create Supplier Return Form
  const [supplierId, setSupplierId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [sourceStockPool, setSourceStockPool] = useState<
    'SELLABLE' | 'DAMAGED' | 'EXPIRED' | 'QUARANTINE'
  >('EXPIRED');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<
    | 'EXPIRED'
    | 'DAMAGED'
    | 'DEFECTIVE'
    | 'INCORRECTLY_SUPPLIED'
    | 'NEAR_EXPIRY'
    | 'OTHER'
  >('EXPIRED');
  const [notes, setNotes] = useState('');

  const { data: supplierReturns, isLoading } = useQuery({
    queryKey: ['supplier-returns'],
    queryFn: () => returnsApi.listSupplierReturns(),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => catalogApi.listSuppliers(),
  });

  const { data: batches } = useQuery({
    queryKey: ['inventory-batches-all'],
    queryFn: () => inventoryApi.listBatches(),
  });

  const createMutation = useMutation({
    mutationFn: returnsApi.createSupplierReturn,
    onSuccess: (res) => {
      toast.success(
        `Supplier Return ${res.returnNumber} initiated & stock deducted`
      );
      queryClient.invalidateQueries({ queryKey: ['supplier-returns'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-batches-all'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
    },
    onError: (err: any) =>
      toast.error(
        err.response?.data?.message || 'Failed to initiate supplier return'
      ),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      returnsApi.updateSupplierReturnStatus(id, payload),
    onSuccess: () => {
      toast.success('Supplier return status & credit note updated');
      queryClient.invalidateQueries({ queryKey: ['supplier-returns'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setStatusModalTarget(null);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const batch = batches?.find((b) => b.id === selectedBatchId);
    if (!batch) {
      toast.error('Please select a valid batch');
      return;
    }

    createMutation.mutate({
      supplierId,
      notes,
      status: 'SUBMITTED',
      items: [
        {
          productId: batch.productId,
          batchId: batch.id,
          sourceStockPool,
          quantity,
          reason,
          notes,
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Stock Return to Supplier
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Return expired, damaged, defective, or near-expiry batches to suppliers and track credit notes.
          </p>
        </div>

        <button
          onClick={() => {
            setSupplierId(suppliers?.[0]?.id || '');
            setSelectedBatchId(batches?.[0]?.id || '');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Initiate Supplier Return</span>
        </button>
      </div>

      {/* Supplier Returns Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                <th className="py-3 px-4">Return No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Batch & Reason</th>
                <th className="py-3 px-4">Return Value</th>
                <th className="py-3 px-4">Credit Note / Refund</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading supplier returns...
                  </td>
                </tr>
              ) : !supplierReturns?.length ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No supplier returns initiated yet.
                  </td>
                </tr>
              ) : (
                supplierReturns.map((sr: any) => (
                  <tr key={sr.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {sr.returnNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(sr.returnDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {sr.supplier?.name}
                    </td>
                    <td className="py-3 px-4">
                      {sr.items?.map((i: any) => (
                        <div key={i.id}>
                          <span className="font-semibold">
                            {i.product?.name}
                          </span>{' '}
                          • Batch: <span className="font-mono">{i.batch?.batchNumber}</span>{' '}
                          (Qty: {i.quantity}, {i.reason} from {i.sourceStockPool})
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {currency}
                      {Number(sr.totalReturnAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {sr.creditNoteNumber ? (
                        <div>
                          <span className="font-mono font-semibold text-emerald-700">
                            CN: {sr.creditNoteNumber}
                          </span>
                          <div className="text-[11px] text-slate-500">
                            Credit: {currency}
                            {Number(sr.refundAmount).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Awaiting Credit Note</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sr.status === 'COMPLETED' || sr.status === 'ACCEPTED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : sr.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {sr.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setStatusModalTarget(sr);
                          setNextStatus(sr.status);
                          setCreditNoteNumber(sr.creditNoteNumber || '');
                          setRefundAmount(
                            Number(sr.refundAmount || sr.totalReturnAmount)
                          );
                        }}
                        className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Initiate Supplier Return Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">
                Initiate Stock Return to Supplier
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmitCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supplier *
                </label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {suppliers?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Product & Batch *
                </label>
                <select
                  required
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {batches?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.product?.name} — Batch: {b.batchNumber} (Sellable:{' '}
                      {b.availableQuantity}, Damaged: {b.damagedQuantity},
                      Expired: {b.expiredQuantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Source Stock Pool *
                  </label>
                  <select
                    value={sourceStockPool}
                    onChange={(e) => setSourceStockPool(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="EXPIRED">EXPIRED Pool</option>
                    <option value="DAMAGED">DAMAGED Pool</option>
                    <option value="SELLABLE">
                      SELLABLE Pool (Near-Expiry / Defective)
                    </option>
                    <option value="QUARANTINE">QUARANTINE Pool</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Return Quantity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Return Reason *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="EXPIRED">Expired Batch</option>
                  <option value="DAMAGED">Damaged Stock</option>
                  <option value="DEFECTIVE">Manufacturing Defect</option>
                  <option value="NEAR_EXPIRY">Near Expiry Return</option>
                  <option value="INCORRECTLY_SUPPLIED">
                    Incorrectly Supplied
                  </option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Reference Document
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional debit note or transport ref"
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
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Initiate Return</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status & Credit Note Modal */}
      {statusModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-900">
              Update Supplier Return — {statusModalTarget.returnNumber}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Return Status
              </label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PENDING">PENDING</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="PARTIALLY_ACCEPTED">PARTIALLY ACCEPTED</option>
                <option value="COMPLETED">COMPLETED (Credit Adjusted)</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier Credit Note Number
              </label>
              <input
                type="text"
                value={creditNoteNumber}
                onChange={(e) => setCreditNoteNumber(e.target.value)}
                placeholder="e.g., CN-2026-889"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Credit / Refund Amount ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setStatusModalTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: statusModalTarget.id,
                    payload: {
                      status: nextStatus,
                      creditNoteNumber,
                      refundAmount,
                    },
                  })
                }
                className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg"
              >
                Save Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

