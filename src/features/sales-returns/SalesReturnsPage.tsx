import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { billingApi } from '../../api/billing.api';
import { returnsApi } from '../../api/returns.api';
import { useAuthStore } from '../../store/auth.store';

export const SalesReturnsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currency = user?.business?.settings?.currencySymbol || '₹';

  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [foundSale, setFoundSale] = useState<any | null>(null);
  const [refundMethod, setRefundMethod] = useState<
    'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER'
  >('CASH');
  const [returnSelections, setReturnSelections] = useState<
    Record<
      string,
      {
        quantity: number;
        reason: 'CHANGED_MIND' | 'WRONG_PRODUCT' | 'DAMAGED_PRODUCT' | 'OTHER';
        condition: 'GOOD_CONDITION' | 'DAMAGED' | 'EXPIRED' | 'QUARANTINE';
      }
    >
  >({});

  const { data: salesReturns, isLoading } = useQuery({
    queryKey: ['sales-returns'],
    queryFn: () => returnsApi.listSalesReturns(),
  });

  const handleLookupInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceSearch.trim()) return;
    try {
      const sale = await billingApi.getSale(invoiceSearch.trim());
      setFoundSale(sale);
      const initMap: any = {};
      for (const item of sale.items || []) {
        initMap[item.id] = {
          quantity: 0,
          reason: 'CHANGED_MIND',
          condition: 'GOOD_CONDITION',
        };
      }
      setReturnSelections(initMap);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invoice not found');
      setFoundSale(null);
    }
  };

  const createReturnMutation = useMutation({
    mutationFn: returnsApi.createSalesReturn,
    onSuccess: (res) => {
      toast.success(`Sales Return ${res.returnNumber} processed!`);
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
      queryClient.invalidateQueries({ queryKey: ['sales-list'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-batches'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setFoundSale(null);
      setInvoiceSearch('');
    },
    onError: (err: any) =>
      toast.error(
        err.response?.data?.message || 'Failed to process sales return'
      ),
  });

  const submitSalesReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundSale) return;
    const selectedItems = Object.entries(returnSelections)
      .filter(([_, val]) => val.quantity > 0)
      .map(([saleItemId, val]) => ({
        saleItemId,
        quantity: val.quantity,
        reason: val.reason,
        condition: val.condition,
      }));

    if (selectedItems.length === 0) {
      toast.error('Select at least 1 item quantity to return');
      return;
    }

    createReturnMutation.mutate({
      saleId: foundSale.id,
      refundMethod,
      items: selectedItems,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Sales Return Management & Stock Condition Classification
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Returned products are never added to sellable inventory automatically. Classify each item as Good, Damaged, Expired, or Quarantine.
        </p>
      </div>

      {/* Invoice Lookup & Return Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <form onSubmit={handleLookupInvoice} className="flex gap-3 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              placeholder="Enter Invoice Number (e.g., INV-1001)..."
              className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded-lg font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            Lookup Bill
          </button>
        </form>

        {foundSale && (
          <form
            onSubmit={submitSalesReturn}
            className="mt-4 pt-4 border-t border-slate-200 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-blue-600">
                  {foundSale.invoiceNumber}
                </span>{' '}
                • Customer: <b>{foundSale.customerName}</b> • Date:{' '}
                {new Date(foundSale.saleDate).toLocaleString()}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Refund Mode:</span>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value as any)}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white font-semibold"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">CARD</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-2.5 px-3">Product & Batch</th>
                    <th className="py-2.5 px-3">Sold / Returnable</th>
                    <th className="py-2.5 px-3">Return Qty</th>
                    <th className="py-2.5 px-3">Return Reason</th>
                    <th className="py-2.5 px-3">
                      Inventory Classification (Required)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {foundSale.items?.map((item: any) => {
                    const maxReturnable = item.quantity - item.returnedQuantity;
                    const sel = returnSelections[item.id] || {
                      quantity: 0,
                      reason: 'CHANGED_MIND',
                      condition: 'GOOD_CONDITION',
                    };
                    return (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">
                            {item.product?.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            Batch: {item.batchNumber}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          Sold: {item.quantity} | Returnable:{' '}
                          <b>{maxReturnable}</b>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min={0}
                            max={maxReturnable}
                            disabled={maxReturnable <= 0}
                            value={sel.quantity}
                            onChange={(e) =>
                              setReturnSelections({
                                ...returnSelections,
                                [item.id]: {
                                  ...sel,
                                  quantity: Math.min(
                                    maxReturnable,
                                    Math.max(0, Number(e.target.value))
                                  ),
                                },
                              })
                            }
                            className="w-20 px-2 py-1 border border-slate-300 rounded font-bold"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={sel.reason}
                            onChange={(e) =>
                              setReturnSelections({
                                ...returnSelections,
                                [item.id]: {
                                  ...sel,
                                  reason: e.target.value as any,
                                },
                              })
                            }
                            className="px-2 py-1 border border-slate-300 rounded bg-white"
                          >
                            <option value="CHANGED_MIND">
                              Customer Changed Mind
                            </option>
                            <option value="WRONG_PRODUCT">Wrong Product</option>
                            <option value="DAMAGED_PRODUCT">
                              Damaged Product
                            </option>
                            <option value="OTHER">Other</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={sel.condition}
                            onChange={(e) =>
                              setReturnSelections({
                                ...returnSelections,
                                [item.id]: {
                                  ...sel,
                                  condition: e.target.value as any,
                                },
                              })
                            }
                            className="px-2 py-1 border border-blue-300 rounded bg-blue-50/50 font-semibold text-blue-900"
                          >
                            <option value="GOOD_CONDITION">
                              1. Good Condition → Add back to Sellable Stock
                            </option>
                            <option value="DAMAGED">
                              2. Damaged → Move to Damaged Pool
                            </option>
                            <option value="EXPIRED">
                              3. Expired → Move to Expired Pool
                            </option>
                            <option value="QUARANTINE">
                              4. Quarantine → Hold for Inspection
                            </option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createReturnMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Process Sales Return & Update Inventory</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Sales Returns History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Processed Sales Returns Ledger
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                <th className="py-3 px-4">Return Receipt</th>
                <th className="py-3 px-4">Original Bill</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Returned Items & Classification</th>
                <th className="py-3 px-4">Refund Amount</th>
                <th className="py-3 px-4">Processed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading sales returns...
                  </td>
                </tr>
              ) : !salesReturns?.length ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No sales returns processed yet.
                  </td>
                </tr>
              ) : (
                salesReturns.map((sr: any) => (
                  <tr key={sr.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {sr.returnNumber}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      {sr.sale?.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(sr.returnDate).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 space-y-1">
                      {sr.items?.map((i: any) => (
                        <div key={i.id} className="text-[11px]">
                          <span className="font-semibold">
                            {i.product?.name}
                          </span>{' '}
                          (Qty: {i.quantity}) →{' '}
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono font-semibold text-[10px]">
                            {i.condition}
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-600">
                      {currency}
                      {Number(sr.totalRefundAmount).toFixed(2)} ({sr.refundMethod})
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {sr.processedBy?.fullName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

