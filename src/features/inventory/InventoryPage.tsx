import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Sliders,
  Search,
  Boxes,
  Activity,
  X,
  Save,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoryApi } from '../../api/inventory.api';
import { useAuthStore } from '../../store/auth.store';
import { useBusinessMode } from '../../hooks/useBusinessMode';

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuthStore();
  const { mode, isPharmacy, config } = useBusinessMode();
  const canAdjust = hasPermission('inventory:adjust');
  const currency = user?.business?.settings?.currencySymbol || '₹';

  const [tab, setTab] = useState<'batches' | 'movements' | 'adjustments'>('batches');
  const [search, setSearch] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const [adjForm, setAdjForm] = useState({
    productId: '',
    batchId: '',
    adjustmentType: 'ADDITION' as
      | 'ADDITION'
      | 'DEDUCTION'
      | 'DAMAGE'
      | 'EXPIRY'
      | 'WRITE_OFF'
      | 'AUDIT_CORRECTION',
    quantity: 1,
    reason: '',
    notes: '',
  });

  const { data: batches, isLoading: batchesLoading } = useQuery({
    queryKey: ['inventory-batches', mode, search],
    queryFn: () => inventoryApi.listBatches({ search: search || undefined }),
  });

  const { data: movements } = useQuery({
    queryKey: ['inventory-movements', mode],
    queryFn: () => inventoryApi.listMovements(undefined, 100),
    enabled: tab === 'movements',
  });

  const { data: adjustments } = useQuery({
    queryKey: ['inventory-adjustments', mode],
    queryFn: inventoryApi.listAdjustments,
    enabled: tab === 'adjustments',
  });

  const adjustMutation = useMutation({
    mutationFn: inventoryApi.createAdjustment,
    onSuccess: () => {
      toast.success('Authorized stock adjustment recorded');
      queryClient.invalidateQueries({ queryKey: ['inventory-batches'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsAdjustModalOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Stock adjustment failed'),
  });

  const openAdjustForBatch = (batch: any) => {
    setAdjForm({
      productId: batch.productId,
      batchId: batch.id,
      adjustmentType: 'ADDITION',
      quantity: 1,
      reason: '',
      notes: '',
    });
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adjustMutation.mutate(adjForm);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {config.terms.inventoryTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track sellable, damaged, expired, quarantined, and supplier-return quantities per batch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isPharmacy && (
            <button
              onClick={() => navigate('/expiry-damaged')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Damaged & Expiry Pool</span>
            </button>
          )}
          <div className="inline-flex rounded-lg bg-slate-200/70 p-1">
            <button
              onClick={() => setTab('batches')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold ${
                tab === 'batches' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Batches</span>
            </button>
            <button
              onClick={() => setTab('movements')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold ${
                tab === 'movements' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Movement Ledger</span>
            </button>
            <button
              onClick={() => setTab('adjustments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold ${
                tab === 'adjustments' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Adjustments</span>
            </button>
          </div>
        </div>
      </div>

      {tab === 'batches' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search by batch number, ${config.terms.product.toLowerCase()} name, or ${config.terms.sku}...`}
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-4">{config.terms.product}</th>
                  <th className="py-3 px-4">Batch No</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">
                    {isPharmacy ? 'Cost / MRP / Sell' : 'Cost / Sell'}
                  </th>
                  <th className="py-3 px-4">Sellable</th>
                  <th className="py-3 px-4">Damaged / Exp / Quar</th>
                  {canAdjust && <th className="py-3 px-4 text-right">Adjust</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batchesLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Loading batches...
                    </td>
                  </tr>
                ) : (
                  batches?.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {b.product?.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {b.product?.sku}
                          {isPharmacy && b.product?.genericName
                            ? ` • ${b.product.genericName}`
                            : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {b.supplier?.name || 'Opening / Direct'}
                      </td>
                      <td className="py-3 px-4">
                        {b.expiryDate
                          ? new Date(b.expiryDate).toLocaleDateString()
                          : 'No Expiry'}
                      </td>
                      <td className="py-3 px-4">
                        {currency}
                        {Number(b.purchasePrice).toFixed(2)}
                        {isPharmacy && b.mrp
                          ? ` / ${currency}${Number(b.mrp).toFixed(2)}`
                          : ''}{' '}
                        / {currency}
                        {Number(b.sellingPrice).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700">
                          {b.availableQuantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 space-x-1.5">
                        <span className="text-rose-600 font-semibold">
                          D:{b.damagedQuantity}
                        </span>
                        <span className="text-amber-600 font-semibold">
                          E:{b.expiredQuantity}
                        </span>
                        <span className="text-purple-600 font-semibold">
                          Q:{b.quarantinedQuantity}
                        </span>
                      </td>
                      {canAdjust && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openAdjustForBatch(b)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold"
                          >
                            <Sliders className="w-3 h-3" />
                            Adjust
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
      )}

      {tab === 'movements' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">{config.terms.product} & Batch</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4">Delta</th>
                  <th className="py-3 px-4">Prev → New</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements?.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {m.product?.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {m.batch?.batchNumber}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-blue-600">
                      {m.movementType}
                    </td>
                    <td
                      className={`py-2.5 px-4 font-bold ${
                        m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {m.previousStock} → {m.newStock}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">{m.reason}</td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {m.performedBy?.fullName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'adjustments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-4">Ref Code</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">{config.terms.product} & Batch</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments?.map((adj: any) => (
                  <tr key={adj.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-semibold text-blue-600">
                      {adj.referenceCode}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(adj.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {adj.product?.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {adj.batch?.batchNumber}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-semibold">
                      {adj.adjustmentType}
                    </td>
                    <td className="py-2.5 px-4 font-bold">{adj.quantity}</td>
                    <td className="py-2.5 px-4">{adj.reason}</td>
                    <td className="py-2.5 px-4">{adj.adjustedBy?.fullName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">
                Authorized Batch Stock Adjustment
              </h3>
              <button onClick={() => setIsAdjustModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjustment Type *
                </label>
                <select
                  value={adjForm.adjustmentType}
                  onChange={(e) =>
                    setAdjForm({
                      ...adjForm,
                      adjustmentType: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="ADDITION">ADDITION (Add to Sellable Stock)</option>
                  <option value="DEDUCTION">DEDUCTION (Deduct from Sellable)</option>
                  <option value="DAMAGE">DAMAGE (Move Sellable → Damaged Pool)</option>
                  <option value="EXPIRY">EXPIRY (Move Sellable → Expired Pool)</option>
                  <option value="WRITE_OFF">WRITE_OFF (Permanent Stock Write-Off)</option>
                  <option value="AUDIT_CORRECTION">AUDIT_CORRECTION</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={adjForm.quantity}
                  onChange={(e) =>
                    setAdjForm({ ...adjForm, quantity: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Authorized Reason * (Recorded in Stock Movement Ledger)
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={adjForm.reason}
                  onChange={(e) =>
                    setAdjForm({ ...adjForm, reason: e.target.value })
                  }
                  placeholder="e.g., Physical stock audit count reconciliation"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Confirm Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
