import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Printer,
  XCircle,
  IndianRupee,
  Eye,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { billingApi } from '../../api/billing.api';
import { useAuthStore } from '../../store/auth.store';
import { printInvoiceReceipt } from '../../utils/exportUtils';
import { useBusinessMode } from '../../hooks/useBusinessMode';

export const BillsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuthStore();
  const { mode, isPharmacy, config } = useBusinessMode();
  const canCancel = hasPermission('billing:cancel');
  const currency = user?.business?.settings?.currencySymbol || '₹';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [payDueTarget, setPayDueTarget] = useState<any | null>(null);
  const [duePayAmount, setDuePayAmount] = useState(0);
  const [duePayMethod, setDuePayMethod] = useState<
    'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER'
  >('CASH');

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales-list', mode, search, statusFilter],
    queryFn: () =>
      billingApi.listSales({
        search: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      billingApi.cancelSale(id, reason),
    onSuccess: () => {
      toast.success('Bill cancelled & stock deductions reversed to batches');
      queryClient.invalidateQueries({ queryKey: ['sales-list'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setCancelTarget(null);
      setCancelReason('');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to cancel bill'),
  });

  const payDueMutation = useMutation({
    mutationFn: ({
      id,
      amount,
      paymentMethod,
    }: {
      id: string;
      amount: number;
      paymentMethod: any;
    }) => billingApi.recordDuePayment(id, { amount, paymentMethod }),
    onSuccess: () => {
      toast.success('Pending payment recorded');
      queryClient.invalidateQueries({ queryKey: ['sales-list'] });
      setPayDueTarget(null);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to record payment'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Invoices & Billing History
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Search customer invoices, print thermal receipts or PDFs, collect due payments, or cancel bills with stock reversal.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number, customer name, or phone..."
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded-lg"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
        >
          <option value="">All Bill Statuses</option>
          <option value="PAID">PAID</option>
          <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
          <option value="PENDING">PENDING</option>
          <option value="PARTIALLY_RETURNED">PARTIALLY RETURNED</option>
          <option value="FULLY_RETURNED">FULLY RETURNED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Date & Cashier</th>
                <th className="py-3 px-4">
                  {isPharmacy ? 'Patient / Doctor' : 'Customer'}
                </th>
                <th className="py-3 px-4">Grand Total</th>
                <th className="py-3 px-4">Paid / Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading bills...
                  </td>
                </tr>
              ) : !sales?.length ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No bills found.
                  </td>
                </tr>
              ) : (
                sales.map((sale: any) => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div>{new Date(sale.saleDate).toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">
                        By: {sale.cashier?.fullName}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {sale.customerName || 'Walk-in'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {sale.customerPhone || ''}
                      </div>
                      {isPharmacy &&
                        (sale.doctorName || sale.prescriptionReference) && (
                          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                            {[
                              sale.doctorName && `Dr: ${sale.doctorName}`,
                              sale.prescriptionReference &&
                                `Rx: ${sale.prescriptionReference}`,
                            ]
                              .filter(Boolean)
                              .join(' • ')}
                          </div>
                        )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {currency}
                      {Number(sale.grandTotal).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-emerald-600 font-semibold">
                        Paid: {currency}
                        {Number(sale.paidAmount).toFixed(2)}
                      </div>
                      {Number(sale.dueAmount) > 0 && (
                        <div className="text-rose-600 font-semibold">
                          Due: {currency}
                          {Number(sale.dueAmount).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : sale.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button
                        onClick={() =>
                          printInvoiceReceipt(
                            sale,
                            user?.business?.name,
                            user?.business?.gstin || '',
                            currency,
                            user?.business?.settings?.receiptFooter || ''
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print / PDF
                      </button>
                      {Number(sale.dueAmount) > 0 &&
                        sale.status !== 'CANCELLED' && (
                          <button
                            onClick={() => {
                              setPayDueTarget(sale);
                              setDuePayAmount(Number(sale.dueAmount));
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold"
                          >
                            <IndianRupee className="w-3 h-3" />
                            Collect Due
                          </button>
                        )}
                      {canCancel && sale.status !== 'CANCELLED' && (
                        <button
                          onClick={() => setCancelTarget(sale)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel
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

      {/* Invoice Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900">
                  Invoice {selectedSale.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {new Date(selectedSale.saleDate).toLocaleString()} • Status:{' '}
                  {selectedSale.status}
                </p>
              </div>
              <button onClick={() => setSelectedSale(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              {isPharmacy &&
                (selectedSale.doctorName || selectedSale.prescriptionReference) && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900">
                    <span>
                      <b>Prescribing Doctor:</b>{' '}
                      {selectedSale.doctorName || 'Not specified'}
                    </span>
                    <span>
                      <b>Prescription Ref:</b>{' '}
                      {selectedSale.prescriptionReference || 'Not specified'}
                    </span>
                  </div>
                )}
              <table className="w-full text-left border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-2 px-3">{config.terms.product}</th>
                    <th className="py-2 px-3">Batch</th>
                    <th className="py-2 px-3">Qty</th>
                    <th className="py-2 px-3">Unit Price</th>
                    <th className="py-2 px-3">Tax</th>
                    <th className="py-2 px-3">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedSale.items?.map((i: any) => (
                    <tr key={i.id}>
                      <td className="py-2 px-3 font-semibold">
                        {i.product?.name}
                      </td>
                      <td className="py-2 px-3 font-mono">{i.batchNumber}</td>
                      <td className="py-2 px-3">
                        {i.quantity}{' '}
                        {i.returnedQuantity > 0 &&
                          `(${i.returnedQuantity} returned)`}
                      </td>
                      <td className="py-2 px-3">
                        {currency}
                        {Number(i.unitPrice).toFixed(2)}
                      </td>
                      <td className="py-2 px-3">
                        {currency}
                        {Number(i.taxAmount).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 font-bold">
                        {currency}
                        {Number(i.totalAmount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Bill Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-900">
              Cancel Invoice {cancelTarget.invoiceNumber}?
            </h3>
            <p className="text-xs text-slate-600">
              Cancelling this bill will automatically reverse all stock deductions back to their respective batches via a recorded stock movement.
            </p>
            <input
              type="text"
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter mandatory cancellation reason..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Close
              </button>
              <button
                onClick={() =>
                  cancelMutation.mutate({
                    id: cancelTarget.id,
                    reason: cancelReason,
                  })
                }
                className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collect Pending Due Payment Modal */}
      {payDueTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900">
              Collect Balance Due — {payDueTarget.invoiceNumber}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                value={duePayAmount}
                onChange={(e) => setDuePayAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={duePayMethod}
                onChange={(e) => setDuePayMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
                <option value="CARD">CARD</option>
                <option value="BANK_TRANSFER">BANK TRANSFER</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPayDueTarget(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  payDueMutation.mutate({
                    id: payDueTarget.id,
                    amount: duePayAmount,
                    paymentMethod: duePayMethod,
                  })
                }
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
