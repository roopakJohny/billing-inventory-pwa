import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoryApi } from '../../api/inventory.api';
import { catalogApi } from '../../api/catalog.api';
import { useAuthStore } from '../../store/auth.store';
import { useBusinessMode } from '../../hooks/useBusinessMode';

export const PurchasesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { mode, isPharmacy, config } = useBusinessMode();
  const currency = user?.business?.settings?.currencySymbol || '₹';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [purchaseInvoiceNumber, setPurchaseInvoiceNumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    {
      productId: '',
      batchNumber: '',
      quantityReceived: 10,
      purchasePrice: 0,
      sellingPrice: 0,
      taxPercentage: 18,
      manufacturingDate: '',
      expiryDate: '',
    },
  ]);

  const { data: purchases, isLoading } = useQuery({
    queryKey: ['purchases', mode],
    queryFn: () => inventoryApi.listPurchases(),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers', mode],
    queryFn: () => catalogApi.listSuppliers(),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-all', mode],
    queryFn: () => catalogApi.listProducts({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: inventoryApi.createPurchase,
    onSuccess: () => {
      toast.success('Stock purchase recorded & batches updated');
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-batches'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsModalOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to record purchase'),
  });

  const handleProductSelect = (idx: number, prodId: string) => {
    const prod = productsData?.items.find((p) => p.id === prodId);
    const next = [...items];
    next[idx] = {
      ...next[idx],
      productId: prodId,
      purchasePrice: prod ? Number(prod.purchasePrice) : 0,
      sellingPrice: prod ? Number(prod.sellingPrice) : 0,
      taxPercentage: prod ? Number(prod.taxPercentage) : 18,
      batchNumber: prod
        ? `B-${prod.sku.slice(-4)}-${Math.floor(100 + Math.random() * 900)}`
        : '',
    };
    setItems(next);
  };

  const addLineItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        batchNumber: '',
        quantityReceived: 10,
        purchasePrice: 0,
        sellingPrice: 0,
        taxPercentage: 18,
        manufacturingDate: '',
        expiryDate: '',
      },
    ]);
  };

  const removeLineItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const calculatedTotal = items.reduce((sum, item) => {
    const sub = item.quantityReceived * item.purchasePrice;
    const tax = (sub * (item.taxPercentage || 0)) / 100;
    return sum + sub + tax;
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      purchaseInvoiceNumber,
      supplierId,
      paidAmount,
      notes,
      items,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {isPharmacy
              ? 'Medicine Purchases & Batch Receiving'
              : 'Stock Purchases & Batch Receiving'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Record supplier purchase invoices and receive batch-tracked{' '}
            {config.terms.productPlural.toLowerCase()} with expiry dates.
          </p>
        </div>

        <button
          onClick={() => {
            setPurchaseInvoiceNumber(`PINV-${Date.now().toString().slice(-5)}`);
            setSupplierId(suppliers?.[0]?.id || '');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Receive New Stock Purchase</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                <th className="py-3 px-4">Purchase Invoice</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Batches / {config.terms.productPlural}</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Paid / Due</th>
                <th className="py-3 px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading purchases...
                  </td>
                </tr>
              ) : !purchases?.length ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No stock purchases recorded yet.
                  </td>
                </tr>
              ) : (
                purchases.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {p.purchaseInvoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(p.purchaseDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {p.supplier?.name}
                    </td>
                    <td className="py-3 px-4">
                      {p.purchaseItems?.map((pi: any) => (
                        <div key={pi.id} className="text-[11px] text-slate-600">
                          {pi.product?.name} •{' '}
                          <span className="font-mono font-semibold">
                            {pi.batchNumber}
                          </span>{' '}
                          (Qty: {pi.quantityReceived})
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {currency}
                      {Number(p.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-600 font-semibold">
                        Paid: {currency}
                        {Number(p.paidAmount).toFixed(2)}
                      </span>
                      {Number(p.dueAmount) > 0 && (
                        <span className="block text-rose-600 font-semibold">
                          Due: {currency}
                          {Number(p.dueAmount).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {p.createdBy?.fullName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">
                Receive Stock Purchase & Create Batches
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 max-h-[82vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier Invoice Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={purchaseInvoiceNumber}
                    onChange={(e) => setPurchaseInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
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
                    <option value="">Select Supplier</option>
                    {suppliers?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount Paid Now ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-500">
                    Batch Items Received
                  </h4>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    + Add Another Batch Row
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-2.5 items-end"
                  >
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {config.terms.product} *
                      </label>
                      <select
                        required
                        value={item.productId}
                        onChange={(e) =>
                          handleProductSelect(idx, e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="">Select {config.terms.product}</option>
                        {productsData?.items.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Batch No *
                      </label>
                      <input
                        type="text"
                        required
                        value={item.batchNumber}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx].batchNumber = e.target.value;
                          setItems(next);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Qty *
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={item.quantityReceived}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx].quantityReceived = Number(e.target.value);
                          setItems(next);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Cost / Sell ({currency})
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.purchasePrice}
                          onChange={(e) => {
                            const next = [...items];
                            next[idx].purchasePrice = Number(e.target.value);
                            setItems(next);
                          }}
                          className="w-1/2 px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                          placeholder="Cost"
                        />
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.sellingPrice}
                          onChange={(e) => {
                            const next = [...items];
                            next[idx].sellingPrice = Number(e.target.value);
                            setItems(next);
                          }}
                          className="w-1/2 px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                          placeholder="Sell"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="flex-1">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Expiry Date {isPharmacy ? '*' : ''}
                        </label>
                        <input
                          type="date"
                          required={isPharmacy}
                          value={item.expiryDate}
                          onChange={(e) => {
                            const next = [...items];
                            next[idx].expiryDate = e.target.value;
                            setItems(next);
                          }}
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded mt-4"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="text-sm font-bold text-slate-900">
                  Estimated Invoice Total (incl. Tax): {currency}
                  {calculatedTotal.toFixed(2)}
                </div>
                <div className="flex gap-2">
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
                    <span>Save Purchase & Receive Stock</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
