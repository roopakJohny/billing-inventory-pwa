import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  Trash2,
  Undo2,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoryApi } from '../../api/inventory.api';
import { useAuthStore } from '../../store/auth.store';
import { useBusinessMode } from '../../hooks/useBusinessMode';

interface ExpiryDamagedPageProps {
  defaultView?: 'expiry' | 'damaged';
}

export const ExpiryDamagedPage: React.FC<ExpiryDamagedPageProps> = ({
  defaultView,
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuthStore();
  const { mode, isPharmacy, config } = useBusinessMode();
  const canAdjust = hasPermission('inventory:adjust');
  const currency = user?.business?.settings?.currencySymbol || '₹';

  const [filter, setFilter] = useState<
    | 'EXPIRED'
    | 'EXPIRING_7'
    | 'EXPIRING_15'
    | 'EXPIRING_30'
    | 'DAMAGED'
    | 'QUARANTINE'
  >(defaultView === 'damaged' ? 'DAMAGED' : 'EXPIRED');

  useEffect(() => {
    if (defaultView === 'damaged') {
      setFilter('DAMAGED');
    } else if (defaultView === 'expiry') {
      setFilter('EXPIRED');
    }
  }, [defaultView]);

  const { data: batches, isLoading } = useQuery({
    queryKey: ['expiry-damaged-batches', mode, filter],
    queryFn: () => inventoryApi.listBatches({ filter }),
  });

  const writeOffMutation = useMutation({
    mutationFn: inventoryApi.createAdjustment,
    onSuccess: () => {
      toast.success('Stock write-off recorded in ledger');
      queryClient.invalidateQueries({ queryKey: ['expiry-damaged-batches'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-batches'] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Write-off failed'),
  });

  const quarantineMutation = useMutation({
    mutationFn: ({
      batchId,
      quantity,
      decision,
    }: {
      batchId: string;
      quantity: number;
      decision: 'RELEASE_TO_SELLABLE' | 'MOVE_TO_DAMAGED';
    }) =>
      inventoryApi.inspectQuarantine(batchId, {
        quantity,
        decision,
        reason: `Quarantine inspection decision: ${decision}`,
      }),
    onSuccess: () => {
      toast.success('Quarantine inspection completed');
      queryClient.invalidateQueries({ queryKey: ['expiry-damaged-batches'] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Inspection update failed'),
  });

  const filterButtons = [
    {
      id: 'EXPIRED',
      label: isPharmacy ? 'Expired Medicines' : 'Expired Stock',
      icon: ShieldAlert,
    },
    { id: 'EXPIRING_7', label: 'Expiring ≤ 7 Days', icon: Clock },
    { id: 'EXPIRING_15', label: 'Expiring ≤ 15 Days', icon: Clock },
    { id: 'EXPIRING_30', label: 'Expiring ≤ 30 Days', icon: Clock },
    {
      id: 'DAMAGED',
      label: isPharmacy ? 'Damaged Medicines' : 'Damaged Stock',
      icon: AlertTriangle,
    },
    { id: 'QUARANTINE', label: 'Quarantine (Inspection)', icon: CheckCircle2 },
  ] as const;

  const pageTitle =
    defaultView === 'damaged'
      ? isPharmacy
        ? 'Damaged Medicines & Quarantine Segregation'
        : 'Damaged & Quarantined Stock Management'
      : defaultView === 'expiry'
      ? isPharmacy
        ? 'Medicine Expiry & Near-Expiry Management'
        : 'Expiry & Near-Expiry Stock Monitoring'
      : 'Expiry & Damaged Stock Monitoring';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{pageTitle}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Expired and damaged {config.terms.productPlural.toLowerCase()} are automatically blocked from POS billing. Initiate supplier returns or write-offs below.
          </p>
        </div>

        <button
          onClick={() => navigate('/supplier-returns')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
        >
          <Undo2 className="w-4 h-4" />
          <span>Initiate Supplier Return</span>
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => {
          const Icon = btn.icon;
          const active = filter === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                active
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Monitoring Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                <th className="py-3 px-4">{config.terms.product}</th>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Pool Quantities</th>
                <th className="py-3 px-4">
                  {isPharmacy ? 'Purchase Cost / MRP' : 'Purchase Cost'}
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Scanning batches...
                  </td>
                </tr>
              ) : !batches?.length ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No batches found in {filter} view.
                  </td>
                </tr>
              ) : (
                batches.map((b) => {
                  const targetQty =
                    filter === 'DAMAGED'
                      ? b.damagedQuantity
                      : filter === 'EXPIRED'
                      ? b.expiredQuantity || b.availableQuantity
                      : filter === 'QUARANTINE'
                      ? b.quarantinedQuantity
                      : b.availableQuantity;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {b.product?.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {b.product?.sku}
                          {isPharmacy && b.product?.genericName
                            ? ` • ${b.product.genericName}`
                            : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {b.supplier?.name || 'Direct'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-rose-600">
                        {b.expiryDate
                          ? new Date(b.expiryDate).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4 space-x-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                          Sellable: {b.availableQuantity}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold">
                          Damaged: {b.damagedQuantity}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold">
                          Expired: {b.expiredQuantity}
                        </span>
                        {b.quarantinedQuantity > 0 && (
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold">
                            Quarantine: {b.quarantinedQuantity}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {currency}
                        {Number(b.purchasePrice).toFixed(2)}
                        {isPharmacy && b.mrp
                          ? ` / MRP ${currency}${Number(b.mrp).toFixed(2)}`
                          : ' / unit'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {filter === 'QUARANTINE' &&
                          canAdjust &&
                          b.quarantinedQuantity > 0 && (
                            <>
                              <button
                                onClick={() =>
                                  quarantineMutation.mutate({
                                    batchId: b.id,
                                    quantity: b.quarantinedQuantity,
                                    decision: 'RELEASE_TO_SELLABLE',
                                  })
                                }
                                className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold"
                              >
                                Approve Good
                              </button>
                              <button
                                onClick={() =>
                                  quarantineMutation.mutate({
                                    batchId: b.id,
                                    quantity: b.quarantinedQuantity,
                                    decision: 'MOVE_TO_DAMAGED',
                                  })
                                }
                                className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold"
                              >
                                Mark Damaged
                              </button>
                            </>
                          )}

                        {canAdjust && targetQty > 0 && filter !== 'QUARANTINE' && (
                          <button
                            onClick={() =>
                              writeOffMutation.mutate({
                                productId: b.productId,
                                batchId: b.id,
                                adjustmentType: 'WRITE_OFF',
                                quantity: targetQty,
                                reason: `Write-off of ${filter} batch ${b.batchNumber}`,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold"
                          >
                            <Trash2 className="w-3 h-3" />
                            Write-Off ({targetQty})
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
