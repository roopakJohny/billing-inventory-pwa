import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Printer,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  User,
  FileWarning,
  Pill,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { catalogApi, ProductRecord, ProductBatch } from '../../api/catalog.api';
import { billingApi, CreateSalePayload } from '../../api/billing.api';
import { offlineDb, QueuedOfflineBill } from '../../services/offlineDb';
import { useAuthStore } from '../../store/auth.store';
import { printInvoiceReceipt } from '../../utils/exportUtils';
import { useBusinessMode } from '../../hooks/useBusinessMode';

interface CartItem {
  product: ProductRecord;
  batchId?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
}

const getEligibleBatches = (product: ProductRecord): ProductBatch[] => {
  const now = new Date();
  return (product.batches || [])
    .filter(
      (b) =>
        b.availableQuantity > 0 &&
        !b.isExpiredMarked &&
        (!b.expiryDate || new Date(b.expiryDate) > now)
    )
    .sort((a, b) => {
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });
};

export const PosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { mode, isPharmacy, config } = useBusinessMode();
  const currency = user?.business?.settings?.currencySymbol || '₹';

  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [prescriptionReference, setPrescriptionReference] = useState('');
  const [billDiscount, setBillDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<
    'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER'
  >('CASH');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedProducts, setCachedProducts] = useState<ProductRecord[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<QueuedOfflineBill[]>([]);
  const [syncingOffline, setSyncingOffline] = useState(false);

  // Clear cart when switching business modes
  useEffect(() => {
    setCart([]);
    setSelectedCategory('');
    setSearch('');
  }, [mode]);

  const { data: productsData } = useQuery({
    queryKey: ['pos-products', mode],
    queryFn: () => catalogApi.listProducts({ status: 'ACTIVE', limit: 100 }),
    enabled: isOnline,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', mode],
    queryFn: () => catalogApi.listCategories(),
    enabled: isOnline,
  });

  // Cache products in IndexedDB for Offline POS usage
  useEffect(() => {
    if (productsData?.items?.length) {
      setCachedProducts(productsData.items);
      offlineDb.cacheProducts(productsData.items).catch(() => {});
    }
  }, [productsData]);

  // Load IndexedDB cache & offline queue on mount & connectivity changes
  const refreshOfflineState = async () => {
    const [cached, queued] = await Promise.all([
      offlineDb.getCachedProducts(),
      offlineDb.getQueuedOfflineBills(),
    ]);
    if (cached.length && !productsData?.items?.length) {
      setCachedProducts(cached);
    }
    setOfflineQueue(queued);
  };

  useEffect(() => {
    refreshOfflineState();
    const onOnline = () => {
      setIsOnline(true);
      handleSyncOfflineQueue();
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleSyncOfflineQueue = async () => {
    const queued = await offlineDb.getQueuedOfflineBills();
    if (!queued.length || !navigator.onLine) return;

    try {
      setSyncingOffline(true);
      const res = await billingApi.syncOfflineBills(
        queued.map((q) => q.payload)
      );
      for (const s of res.synced) {
        if (s.offlineTempId) {
          await offlineDb.removeOfflineBill(s.offlineTempId);
        }
      }
      for (const c of res.conflicts) {
        if (c.offlineTempId) {
          await offlineDb.markOfflineBillConflict(c.offlineTempId, c.error);
        }
      }
      await refreshOfflineState();
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['sales-list'] });

      if (res.synced.length > 0) {
        toast.success(`Synced ${res.synced.length} offline bill(s) to server!`);
      }
      if (res.conflicts.length > 0) {
        toast.error(
          `${res.conflicts.length} offline bill(s) had stock conflicts`
        );
      }
    } catch {
      toast.error('Could not sync offline bills yet');
    } finally {
      setSyncingOffline(false);
    }
  };

  const activeProducts = productsData?.items || cachedProducts;

  const filteredProducts = activeProducts.filter((p) => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.genericName && p.genericName.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.composition && p.composition.toLowerCase().includes(q))
    );
  });

  const addToCart = (product: ProductRecord) => {
    const eligible = getEligibleBatches(product);
    if (product.currentStock <= 0 || eligible.length === 0) {
      toast.error(
        `"${product.name}" has 0 sellable non-expired stock available for billing`
      );
      return;
    }

    const fefoBatch = eligible[0];

    setCart((prev) => {
      const existingIdx = prev.findIndex((c) => c.product.id === product.id);
      if (existingIdx > -1) {
        const currentItem = prev[existingIdx];
        const selectedBatchObj = currentItem.batchId
          ? eligible.find((b) => b.id === currentItem.batchId)
          : undefined;
        const maxQty = selectedBatchObj
          ? selectedBatchObj.availableQuantity
          : product.currentStock;

        if (currentItem.quantity + 1 > maxQty) {
          toast.error(`Cannot exceed available sellable stock (${maxQty})`);
          return prev;
        }
        const next = [...prev];
        next[existingIdx].quantity += 1;
        return next;
      }
      return [
        ...prev,
        {
          product,
          batchId: isPharmacy ? fefoBatch?.id : undefined,
          quantity: 1,
          unitPrice: Number(fefoBatch?.sellingPrice ?? product.sellingPrice),
          discountAmount: 0,
        },
      ];
    });
  };

  const handleBarcodeLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const code = barcodeInput.trim().toLowerCase();
    const match = activeProducts.find(
      (p) =>
        p.barcode?.toLowerCase() === code || p.sku.toLowerCase() === code
    );
    if (match) {
      addToCart(match);
      setBarcodeInput('');
    } else {
      toast.error(
        `No ${config.terms.product.toLowerCase()} found with barcode/SKU "${barcodeInput}"`
      );
    }
  };

  const updateCartBatch = (productId: string, batchId: string) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.product.id !== productId) return c;
        const eligible = getEligibleBatches(c.product);
        const targetBatch = eligible.find((b) => b.id === batchId);
        const maxAllowed = targetBatch
          ? targetBatch.availableQuantity
          : c.product.currentStock;
        return {
          ...c,
          batchId: batchId || undefined,
          unitPrice: Number(
            targetBatch?.sellingPrice ?? c.product.sellingPrice
          ),
          quantity: Math.min(c.quantity, maxAllowed),
        };
      })
    );
  };

  const updateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((c) => c.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((c) => {
        if (c.product.id !== productId) return c;
        const eligible = getEligibleBatches(c.product);
        const targetBatch = c.batchId
          ? eligible.find((b) => b.id === c.batchId)
          : undefined;
        const maxAllowed = targetBatch
          ? targetBatch.availableQuantity
          : c.product.currentStock;

        if (newQty > maxAllowed) {
          toast.error(`Max sellable stock is ${maxAllowed}`);
          return c;
        }
        return { ...c, quantity: newQty };
      })
    );
  };

  const requiresPrescription =
    isPharmacy && cart.some((item) => item.product.prescriptionRequired);

  // Totals Calculation
  let subtotal = 0;
  let itemDiscountTotal = 0;
  let totalTax = 0;

  for (const item of cart) {
    const gross = item.unitPrice * item.quantity;
    const disc = Math.min(gross, Number(item.discountAmount || 0));
    const taxable = gross - disc;
    const tax = (taxable * Number(item.product.taxPercentage || 0)) / 100;
    subtotal += gross;
    itemDiscountTotal += disc;
    totalTax += tax;
  }

  const grandTotal = Math.max(
    0,
    Number((subtotal - itemDiscountTotal - billDiscount + totalTax).toFixed(2))
  );

  const effectivePaid =
    paidAmount === '' ? grandTotal : Number(paidAmount);

  const handleCheckout = async (printAfterSave = false) => {
    if (cart.length === 0) {
      toast.error(
        `Add at least one ${config.terms.product.toLowerCase()} to the bill`
      );
      return;
    }

    const offlineTempId = `OFF-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`;

    const payload: CreateSalePayload = {
      offlineTempId,
      customerName:
        customerName.trim() ||
        (isPharmacy ? 'Walk-in Patient' : 'Walk-in Customer'),
      customerPhone: customerPhone.trim() || undefined,
      doctorName: isPharmacy && doctorName.trim() ? doctorName.trim() : undefined,
      prescriptionReference:
        isPharmacy && prescriptionReference.trim()
          ? prescriptionReference.trim()
          : undefined,
      billDiscountAmount: billDiscount,
      items: cart.map((c) => ({
        productId: c.product.id,
        batchId: c.batchId || undefined,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        discountAmount: c.discountAmount,
      })),
      payments: [
        {
          paymentMethod,
          amount: effectivePaid,
          referenceNumber: referenceNumber.trim() || undefined,
        },
      ],
    };

    setSubmitting(true);
    try {
      if (!navigator.onLine) {
        // Offline Mode: Queue in IndexedDB
        await offlineDb.enqueueOfflineBill({
          offlineTempId,
          createdAt: new Date().toISOString(),
          payload,
          grandTotal,
          customerName: payload.customerName || 'Walk-in Customer',
          syncStatus: 'PENDING',
        });
        await refreshOfflineState();
        toast.success(
          `Saved Offline Bill (${offlineTempId}) to IndexedDB sync queue!`
        );
        if (printAfterSave) {
          printInvoiceReceipt(
            {
              invoiceNumber: offlineTempId,
              saleDate: new Date().toISOString(),
              customerName: payload.customerName,
              customerPhone: payload.customerPhone,
              status: 'OFFLINE_QUEUED',
              subtotal,
              itemDiscountTotal,
              billDiscountAmount: billDiscount,
              taxAmount: totalTax,
              grandTotal,
              paidAmount: effectivePaid,
              dueAmount: Math.max(0, grandTotal - effectivePaid),
              items: cart.map((c) => ({
                productName: c.product.name,
                batchNumber: 'FEFO-AUTO',
                taxPercentage: c.product.taxPercentage,
                quantity: c.quantity,
                unitPrice: c.unitPrice,
                totalAmount:
                  (c.unitPrice * c.quantity - c.discountAmount) *
                  (1 + Number(c.product.taxPercentage) / 100),
              })),
            },
            user?.business?.name,
            user?.business?.gstin || '',
            currency,
            user?.business?.settings?.receiptFooter || ''
          );
        }
      } else {
        const createdSale = await billingApi.createSale(payload);
        toast.success(`Invoice ${createdSale.invoiceNumber} generated!`);
        queryClient.invalidateQueries({ queryKey: ['pos-products'] });
        queryClient.invalidateQueries({ queryKey: ['sales-list'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });

        if (printAfterSave || user?.business?.settings?.autoPrintReceipt) {
          printInvoiceReceipt(
            createdSale,
            user?.business?.name,
            user?.business?.gstin || '',
            currency,
            user?.business?.settings?.receiptFooter || ''
          );
        }
      }

      // Reset Cart
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDoctorName('');
      setPrescriptionReference('');
      setBillDiscount(0);
      setPaidAmount('');
      setReferenceNumber('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Offline Queue Synchronization Alert Bar */}
      {offlineQueue.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5 text-amber-900 text-xs">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">
                {offlineQueue.length} Offline Bill(s) Pending Synchronization
              </span>
              <span className="ml-2 text-amber-700">
                Stored safely in IndexedDB. Stock availability will be re-validated on sync.
              </span>
            </div>
          </div>
          <button
            onClick={handleSyncOfflineQueue}
            disabled={!isOnline || syncingOffline}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${syncingOffline ? 'animate-spin' : ''}`}
            />
            <span>{syncingOffline ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Product Lookup & Catalog Grid */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barcode Scanner & Search Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <form onSubmit={handleBarcodeLookup} className="relative sm:w-64">
                <Barcode className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder={`Scan Barcode / ${config.terms.sku} + Enter`}
                  className="w-full pl-9 pr-3 py-1.5 text-xs font-mono border border-blue-300 bg-blue-50/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </form>

              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    isPharmacy
                      ? 'Search medicine by brand, generic salt, composition, code, or barcode...'
                      : 'Search product by name, SKU, brand, or barcode...'
                  }
                  className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Category Quick Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                  selectedCategory === ''
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All {config.terms.productPlural}
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[65vh] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const eligibleBatches = getEligibleBatches(p);
              const outOfStock = p.currentStock <= 0 || eligibleBatches.length === 0;
              const fefoBatch = eligibleBatches[0];

              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => addToCart(p)}
                  className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    outOfStock
                      ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-slate-400">
                      <span>{p.sku}</span>
                      {isPharmacy && p.prescriptionRequired ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-sans font-bold">
                          Rx
                        </span>
                      ) : (
                        <span>GST {Number(p.taxPercentage)}%</span>
                      )}
                    </div>
                    <h4 className="font-semibold text-slate-900 text-xs mt-1 line-clamp-2">
                      {p.name}
                    </h4>
                    {isPharmacy && p.genericName && (
                      <p className="text-[10px] text-emerald-700 font-medium line-clamp-1 mt-0.5">
                        {p.genericName}
                      </p>
                    )}
                    {isPharmacy && (p.dosageForm || p.strength) && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {[p.dosageForm, p.strength].filter(Boolean).join(' • ')}
                      </p>
                    )}
                    {isPharmacy && fefoBatch && (
                      <div className="mt-1.5 text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        <span className="font-mono font-semibold text-slate-700">
                          {fefoBatch.batchNumber}
                        </span>
                        {fefoBatch.expiryDate && (
                          <span className="ml-1 text-slate-500">
                            • Exp{' '}
                            {new Date(fefoBatch.expiryDate).toLocaleDateString(
                              'en-IN',
                              { month: 'short', year: '2-digit' }
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                    <div>
                      <span className="font-bold text-sm text-blue-600">
                        {currency}
                        {Number(p.sellingPrice).toFixed(2)}
                      </span>
                      {isPharmacy && p.mrp && Number(p.mrp) > Number(p.sellingPrice) && (
                        <span className="block text-[10px] text-slate-400 line-through">
                          MRP {currency}
                          {Number(p.mrp).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        outOfStock
                          ? 'bg-rose-100 text-rose-700'
                          : p.currentStock <= p.minimumStockLevel
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {outOfStock ? 'Out of Stock' : `${p.currentStock} left`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 5 Columns: Active POS Cart & Payment Checkout */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            {/* Cart Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPharmacy ? (
                  <Pill className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ShoppingCart className="w-4 h-4 text-blue-400" />
                )}
                <span className="font-bold text-sm">
                  {config.terms.posTitle} ({cart.length} items)
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {isPharmacy
                  ? 'FEFO Earliest-Expiry Priority'
                  : `Auto ${user?.business?.settings?.fifoOrFefo || 'FEFO'} Batch`}
              </span>
            </div>

            {/* Customer / Patient Details Strip */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-2">
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={
                    isPharmacy ? 'Patient / Customer Name' : 'Walk-in Customer Name'
                  }
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Customer Phone (Optional)"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>

            {/* Prescription Warning & Reference Input (Pharmacy Mode) */}
            {requiresPrescription && (
              <div className="p-3 bg-amber-50 border-b border-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 text-xs font-semibold">
                  <FileWarning className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Prescription-Required (Schedule H/H1) Medicine in Cart
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Prescribing Doctor Name"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={prescriptionReference}
                    onChange={(e) => setPrescriptionReference(e.target.value)}
                    placeholder="Prescription Ref / Rx No"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Cart Items List */}
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Click a {config.terms.product.toLowerCase()} or scan a barcode to add items to the bill.
                </div>
              ) : (
                cart.map((item) => {
                  const eligibleBatches = getEligibleBatches(item.product);
                  return (
                    <div key={item.product.id} className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-slate-900">
                              {item.product.name}
                            </p>
                            {isPharmacy && item.product.prescriptionRequired && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold">
                                Rx
                              </span>
                            )}
                          </div>
                          {isPharmacy && item.product.genericName && (
                            <p className="text-[10px] text-emerald-700">
                              {item.product.genericName}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400">
                            {currency}
                            {item.unitPrice.toFixed(2)} × {item.quantity} • GST{' '}
                            {Number(item.product.taxPercentage)}%
                            {isPharmacy && item.product.mrp
                              ? ` • MRP ${currency}${Number(item.product.mrp).toFixed(2)}`
                              : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => updateCartQty(item.product.id, 0)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Batch Selection Dropdown in Pharmacy Mode */}
                      {isPharmacy && eligibleBatches.length > 0 && (
                        <div>
                          <select
                            value={item.batchId || ''}
                            onChange={(e) =>
                              updateCartBatch(item.product.id, e.target.value)
                            }
                            className="w-full px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700"
                          >
                            <option value="">
                              Auto FEFO (Earliest Expiry Across Batches)
                            </option>
                            {eligibleBatches.map((b) => (
                              <option key={b.id} value={b.id}>
                                Batch {b.batchNumber} • Exp:{' '}
                                {b.expiryDate
                                  ? new Date(b.expiryDate).toLocaleDateString()
                                  : 'N/A'}{' '}
                                • {currency}
                                {Number(b.sellingPrice).toFixed(2)} (Avail:{' '}
                                {b.availableQuantity})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex items-center border border-slate-200 rounded-lg">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQty(item.product.id, item.quantity - 1)
                            }
                            className="p-1 text-slate-600 hover:bg-slate-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQty(item.product.id, item.quantity + 1)
                            }
                            className="p-1 text-slate-600 hover:bg-slate-100"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">
                            Disc ({currency}):
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={item.discountAmount}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setCart((prev) =>
                                prev.map((c) =>
                                  c.product.id === item.product.id
                                    ? { ...c, discountAmount: val }
                                    : c
                                )
                              );
                            }}
                            className="w-16 px-2 py-0.5 text-xs border border-slate-200 rounded text-right"
                          />
                        </div>

                        <div className="text-xs font-bold text-slate-900">
                          {currency}
                          {(
                            (item.unitPrice * item.quantity -
                              item.discountAmount) *
                            (1 + Number(item.product.taxPercentage) / 100)
                          ).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Totals & Payment Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>
                  {currency}
                  {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Item Discounts:</span>
                <span className="text-rose-600">
                  -{currency}
                  {itemDiscountTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Bill Discount ({currency}):</span>
                <input
                  type="number"
                  min={0}
                  value={billDiscount}
                  onChange={(e) => setBillDiscount(Number(e.target.value))}
                  className="w-20 px-2 py-0.5 text-xs bg-white border border-slate-300 rounded text-right"
                />
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Applicable GST / Tax:</span>
                <span>
                  +{currency}
                  {totalTax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-blue-600">
                  {currency}
                  {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-1.5">
              {(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border ${
                    paymentMethod === m
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                  Amount Received ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) =>
                    setPaidAmount(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  placeholder={grandTotal.toFixed(2)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                  Txn / UPI Ref (Optional)
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Ref / Auth No"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={submitting || cart.length === 0}
                onClick={() => handleCheckout(false)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isOnline ? 'Save Bill' : 'Queue Offline Bill'}</span>
              </button>
              <button
                type="button"
                disabled={submitting || cart.length === 0}
                onClick={() => handleCheckout(true)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Save & Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
