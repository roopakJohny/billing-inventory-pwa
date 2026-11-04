import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  FileText,
  Download,
  BarChart3,
  Boxes,
  IndianRupee,
} from 'lucide-react';
import { reportsApi } from '../../api/reports.api';
import { catalogApi } from '../../api/catalog.api';
import { useAuthStore } from '../../store/auth.store';
import {
  exportToCsv,
  exportToExcel,
  exportReportToPdf,
} from '../../utils/exportUtils';
import { useBusinessMode } from '../../hooks/useBusinessMode';

export const ReportsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { mode, isPharmacy, config } = useBusinessMode();
  const currency = user?.business?.settings?.currencySymbol || '₹';

  const [tab, setTab] = useState<'sales' | 'inventory' | 'financial'>('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories', mode],
    queryFn: () => catalogApi.listCategories(),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers', mode],
    queryFn: () => catalogApi.listSuppliers(),
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      'comprehensive-reports',
      mode,
      startDate,
      endDate,
      categoryId,
      supplierId,
    ],
    queryFn: () =>
      reportsApi.getAnalytics({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        categoryId: categoryId || undefined,
        supplierId: supplierId || undefined,
      }),
  });

  if (isLoading || !data) {
    return (
      <div className="p-10 text-center text-sm text-slate-400">
        Generating {config.label} reports...
      </div>
    );
  }

  const { salesSummary, inventorySummary, financialSummary } = data;

  const getActiveExportRows = () => {
    if (tab === 'sales') {
      return (salesSummary.bills || []).map((b: any) => ({
        Invoice: b.invoiceNumber,
        Date: new Date(b.saleDate).toLocaleDateString(),
        Customer: b.customerName || 'Walk-in',
        ...(isPharmacy ? { Doctor: b.doctorName || '' } : {}),
        Cashier: b.cashier?.fullName || '',
        Subtotal: b.subtotal,
        Discounts: Number(b.itemDiscountTotal) + Number(b.billDiscountAmount),
        Tax: b.taxAmount,
        GrandTotal: b.grandTotal,
        Paid: b.paidAmount,
        Due: b.dueAmount,
        Status: b.status,
      }));
    }
    if (tab === 'inventory') {
      return (inventorySummary.batches || []).map((b: any) => ({
        [config.terms.product]: b.product?.name,
        [config.terms.sku]: b.product?.sku,
        ...(isPharmacy ? { GenericName: b.product?.genericName || '' } : {}),
        Category: b.product?.category?.name,
        BatchNo: b.batchNumber,
        Supplier: b.supplier?.name || 'Direct',
        ExpiryDate: b.expiryDate
          ? new Date(b.expiryDate).toLocaleDateString()
          : 'N/A',
        PurchasePrice: b.purchasePrice,
        ...(isPharmacy ? { MRP: b.mrp || b.sellingPrice } : {}),
        SellingPrice: b.sellingPrice,
        SellableQty: b.availableQuantity,
        DamagedQty: b.damagedQuantity,
        ExpiredQty: b.expiredQuantity,
        Valuation: (b.availableQuantity * Number(b.purchasePrice)).toFixed(2),
      }));
    }
    return (financialSummary.productWiseProfit || []).map((p: any) => ({
      [config.terms.sku]: p.sku,
      [config.terms.product]: p.name,
      ...(isPharmacy
        ? { GenericName: p.genericName || '', Brand: p.brand || '' }
        : {}),
      Category: p.category,
      UnitsSold: p.unitsSold,
      ReturnedUnits: p.returnedUnits,
      NetUnitsSold: p.netUnits,
      NetRevenueExclTax: p.revenueExclTax,
      ActualBatchCost: p.actualPurchaseCost,
      GrossProfit: p.grossProfit,
      MarginPercent: `${p.marginPercent}%`,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {config.terms.reportsTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPharmacy
              ? 'Medicine-wise, Generic-wise, Brand-wise Sales, Batch & Expiry Valuation, and Actual-Batch-Cost Profit Reports.'
              : 'Sales, Batch Inventory Valuation, and Actual-Batch-Cost Gross Profit Reports with PDF, Excel, & CSV export.'}
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              exportToCsv(`apexpos-${mode}-${tab}-report`, getActiveExportRows())
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={() =>
              exportToExcel(
                `apexpos-${mode}-${tab}-report`,
                `ApexPOS (${config.label}) ${tab.toUpperCase()} Report`,
                getActiveExportRows()
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-700"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xls)</span>
          </button>
          <button
            onClick={() =>
              exportReportToPdf(
                `ApexPOS (${config.label}) — ${tab.toUpperCase()} Report`,
                `Currency: ${currency} | Actual Batch Cost Accounting`,
                getActiveExportRows()
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Report Type Tabs & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg bg-slate-200/70 p-1">
            <button
              onClick={() => setTab('sales')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold ${
                tab === 'sales'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>
                {isPharmacy ? 'Medicine Sales Reports' : 'Sales Reports'}
              </span>
            </button>
            <button
              onClick={() => setTab('inventory')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold ${
                tab === 'inventory'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>
                {isPharmacy
                  ? 'Batch, Expiry & Damaged Reports'
                  : 'Inventory & Valuation Reports'}
              </span>
            </button>
            <button
              onClick={() => setTab('financial')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold ${
                tab === 'financial'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>
                {isPharmacy
                  ? 'Medicine Profit Reports'
                  : 'Financial & Profit Reports'}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">All {config.terms.categoryPlural}</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">All Suppliers</option>
              {suppliers?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: SALES REPORTS */}
      {tab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">Gross Sales</p>
              <p className="text-lg font-bold text-slate-900">
                {currency}
                {salesSummary.totalGrossSales.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">Active / Cancelled Bills</p>
              <p className="text-lg font-bold text-slate-900">
                {salesSummary.totalBills} / {salesSummary.cancelledBillsCount}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">Total Discounts</p>
              <p className="text-lg font-bold text-amber-600">
                {currency}
                {salesSummary.totalDiscounts.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">GST / Tax Collected</p>
              <p className="text-lg font-bold text-blue-600">
                {currency}
                {salesSummary.totalTaxCollected.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">Sales Returns</p>
              <p className="text-lg font-bold text-rose-600">
                {currency}
                {salesSummary.totalSalesReturns.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">
                Payment-Method-Wise Sales
              </h4>
              <div className="space-y-2 text-xs">
                {salesSummary.paymentMethodBreakdown.map((pm: any) => (
                  <div
                    key={pm.method}
                    className="flex justify-between py-1.5 border-b border-slate-100"
                  >
                    <span className="font-semibold">{pm.method}</span>
                    <span>
                      {pm.count} txn •{' '}
                      <b>
                        {currency}
                        {pm.amount.toLocaleString('en-IN')}
                      </b>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">
                Cashier-Wise Sales
              </h4>
              <div className="space-y-2 text-xs">
                {salesSummary.cashierBreakdown.map((c: any) => (
                  <div
                    key={c.cashierName}
                    className="flex justify-between py-1.5 border-b border-slate-100"
                  >
                    <span className="font-semibold">{c.cashierName}</span>
                    <span>
                      {c.billCount} bills •{' '}
                      <b>
                        {currency}
                        {c.totalSales.toLocaleString('en-IN')}
                      </b>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">
                {config.terms.category}-Wise Sales
              </h4>
              <div className="space-y-2 text-xs">
                {salesSummary.categoryBreakdown.map((cat: any) => (
                  <div
                    key={cat.category}
                    className="flex justify-between py-1.5 border-b border-slate-100"
                  >
                    <span className="font-semibold">{cat.category}</span>
                    <span>
                      {cat.unitsSold} units •{' '}
                      <b>
                        {currency}
                        {cat.revenue.toLocaleString('en-IN')}
                      </b>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pharmacy-Specific Generic & Brand Sales Breakdowns */}
          {isPharmacy && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase text-emerald-700 mb-3">
                  Generic Medicine (Salt) Sales Report
                </h4>
                <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
                  {(salesSummary.genericBreakdown || []).map((g: any) => (
                    <div
                      key={g.genericName}
                      className="flex justify-between py-1.5 border-b border-slate-100"
                    >
                      <span className="font-semibold text-slate-800">
                        {g.genericName}
                      </span>
                      <span>
                        {g.unitsSold} units •{' '}
                        <b className="text-emerald-700">
                          {currency}
                          {Number(g.revenue).toLocaleString('en-IN')}
                        </b>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase text-blue-700 mb-3">
                  Brand / Manufacturer-Wise Medicine Sales
                </h4>
                <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
                  {(salesSummary.brandBreakdown || []).map((b: any) => (
                    <div
                      key={b.brand}
                      className="flex justify-between py-1.5 border-b border-slate-100"
                    >
                      <span className="font-semibold text-slate-800">
                        {b.brand}
                      </span>
                      <span>
                        {b.unitsSold} units •{' '}
                        <b className="text-blue-700">
                          {currency}
                          {Number(b.revenue).toLocaleString('en-IN')}
                        </b>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVENTORY REPORTS */}
      {tab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">
                Total {config.terms.productPlural} / Batches
              </p>
              <p className="text-lg font-bold text-slate-900">
                {inventorySummary.totalProducts} / {inventorySummary.totalBatches}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">Total Stock Valuation</p>
              <p className="text-lg font-bold text-blue-600">
                {currency}
                {inventorySummary.totalValuation.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">
                Low-Stock {config.terms.productPlural}
              </p>
              <p className="text-lg font-bold text-amber-600">
                {inventorySummary.lowStockProducts.length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">
                Out-of-Stock {config.terms.productPlural}
              </p>
              <p className="text-lg font-bold text-rose-600">
                {inventorySummary.outOfStockProducts.length}
              </p>
            </div>
          </div>

          {/* Pharmacy-Specific Expiry, Near-Expiry, Damaged & Supplier Return Summary */}
          {isPharmacy && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200">
                <h4 className="text-xs font-bold uppercase text-rose-700 mb-2">
                  Expired Medicine Batches ({inventorySummary.expiredBatches?.length || 0})
                </h4>
                <div className="space-y-1.5 text-xs max-h-40 overflow-y-auto">
                  {!(inventorySummary.expiredBatches || []).length ? (
                    <p className="text-slate-400">No expired medicine batches.</p>
                  ) : (
                    inventorySummary.expiredBatches.map((b: any) => (
                      <div key={b.id} className="flex justify-between">
                        <span className="font-medium text-slate-800">
                          {b.product?.name} ({b.batchNumber})
                        </span>
                        <span className="font-bold text-rose-700">
                          Exp Qty: {b.expiredQuantity || b.availableQuantity}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                <h4 className="text-xs font-bold uppercase text-amber-800 mb-2">
                  Near-Expiry (≤ 30 Days) ({inventorySummary.nearExpiryBatches?.length || 0})
                </h4>
                <div className="space-y-1.5 text-xs max-h-40 overflow-y-auto">
                  {!(inventorySummary.nearExpiryBatches || []).length ? (
                    <p className="text-slate-400">No near-expiry batches.</p>
                  ) : (
                    inventorySummary.nearExpiryBatches.map((b: any) => (
                      <div key={b.id} className="flex justify-between">
                        <span className="font-medium text-slate-800">
                          {b.product?.name} ({b.batchNumber})
                        </span>
                        <span className="font-bold text-amber-800">
                          {b.expiryDate
                            ? new Date(b.expiryDate).toLocaleDateString()
                            : ''}{' '}
                          ({b.availableQuantity})
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200">
                <h4 className="text-xs font-bold uppercase text-purple-800 mb-2">
                  Damaged Medicine Batches ({inventorySummary.damagedBatches?.length || 0})
                </h4>
                <div className="space-y-1.5 text-xs max-h-40 overflow-y-auto">
                  {!(inventorySummary.damagedBatches || []).length ? (
                    <p className="text-slate-400">No damaged medicines recorded.</p>
                  ) : (
                    inventorySummary.damagedBatches.map((b: any) => (
                      <div key={b.id} className="flex justify-between">
                        <span className="font-medium text-slate-800">
                          {b.product?.name} ({b.batchNumber})
                        </span>
                        <span className="font-bold text-purple-800">
                          Dmg: {b.damagedQuantity}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Batch-Wise Stock Valuation Report
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-4">{config.terms.product}</th>
                    <th className="py-2.5 px-4">Batch</th>
                    <th className="py-2.5 px-4">Expiry</th>
                    <th className="py-2.5 px-4">Sellable / Dmg / Exp</th>
                    <th className="py-2.5 px-4">
                      {isPharmacy ? 'Purchase / MRP' : 'Purchase Price'}
                    </th>
                    <th className="py-2.5 px-4">Batch Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventorySummary.batches.map((b: any) => (
                    <tr key={b.id}>
                      <td className="py-2.5 px-4 font-semibold">
                        <div>{b.product?.name}</div>
                        {isPharmacy && b.product?.genericName && (
                          <div className="text-[10px] text-emerald-700 font-normal">
                            {b.product.genericName}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono">{b.batchNumber}</td>
                      <td className="py-2.5 px-4">
                        {b.expiryDate
                          ? new Date(b.expiryDate).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="py-2.5 px-4">
                        {b.availableQuantity} / {b.damagedQuantity} /{' '}
                        {b.expiredQuantity}
                      </td>
                      <td className="py-2.5 px-4">
                        {currency}
                        {Number(b.purchasePrice).toFixed(2)}
                        {isPharmacy && b.mrp
                          ? ` / MRP ${currency}${Number(b.mrp).toFixed(2)}`
                          : ''}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {currency}
                        {(
                          b.availableQuantity * Number(b.purchasePrice)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FINANCIAL & PROFIT REPORTS */}
      {tab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">Net Revenue (Excl. Tax)</p>
              <p className="text-lg font-bold text-slate-900">
                {currency}
                {financialSummary.netRevenueExclTax.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">
                Actual Batch Purchase Cost (COGS)
              </p>
              <p className="text-lg font-bold text-slate-700">
                {currency}
                {financialSummary.actualCostOfGoodsSold.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <p className="text-xs text-emerald-700 font-semibold">
                Gross Profit (Actual Cost Basis)
              </p>
              <p className="text-xl font-bold text-emerald-700">
                {currency}
                {financialSummary.grossProfit.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">GST / Tax Collected</p>
              <p className="text-lg font-bold text-blue-600">
                {currency}
                {financialSummary.totalTaxCollected.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Product/Medicine-Wise Profit Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                {config.terms.product}-Wise Gross Profit Report (Using Actual Batch Purchase Costs)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-4">{config.terms.product}</th>
                    {isPharmacy && (
                      <th className="py-2.5 px-4">Generic / Brand</th>
                    )}
                    <th className="py-2.5 px-4">{config.terms.category}</th>
                    <th className="py-2.5 px-4">Net Units Sold</th>
                    <th className="py-2.5 px-4">Net Revenue (Excl Tax)</th>
                    <th className="py-2.5 px-4">Actual Batch Cost</th>
                    <th className="py-2.5 px-4">Gross Profit</th>
                    <th className="py-2.5 px-4">Profit Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {financialSummary.productWiseProfit.map((p: any) => (
                    <tr key={p.productId}>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {p.name} ({p.sku})
                      </td>
                      {isPharmacy && (
                        <td className="py-2.5 px-4 text-slate-600">
                          <div className="text-emerald-700 font-medium">
                            {p.genericName || '—'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {p.brand || ''}
                          </div>
                        </td>
                      )}
                      <td className="py-2.5 px-4 text-slate-600">
                        {p.category}
                      </td>
                      <td className="py-2.5 px-4 font-bold">{p.netUnits}</td>
                      <td className="py-2.5 px-4">
                        {currency}
                        {p.revenueExclTax.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4">
                        {currency}
                        {p.actualPurchaseCost.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-emerald-600">
                        {currency}
                        {p.grossProfit.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 font-semibold">
                        {p.marginPercent}%
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
