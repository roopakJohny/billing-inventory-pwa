import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Receipt,
  Sliders,
  History,
  Save,
  Store,
  Pill,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi, UpdateSettingsPayload } from '../../api/settings.api';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { useBusinessMode } from '../../hooks/useBusinessMode';
import { resetCurrentModeDb } from '../../services/localBackendEngine';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const { mode, setMode, isPharmacy, config } = useBusinessMode();
  const [activeTab, setActiveTab] = useState<'config' | 'audit'>('config');

  const { data: business, isLoading } = useQuery({
    queryKey: ['business-settings', mode],
    queryFn: settingsApi.getSettings,
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['audit-logs', mode],
    queryFn: () => settingsApi.getAuditLogs(40),
    enabled: activeTab === 'audit',
  });

  const [formData, setFormData] = useState<UpdateSettingsPayload>({
    name: '',
    legalName: '',
    logoUrl: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    gstin: '',
    currencyCode: 'INR',
    currencySymbol: '₹',
    invoicePrefix: 'INV-',
    invoiceStartingNumber: 1001,
    defaultTaxPercentage: 18,
    enableTaxInclusive: false,
    defaultPaymentMethods: ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER'],
    receiptFooter: '',
    printerPaperSize: '80mm',
    autoPrintReceipt: false,
    globalLowStockThreshold: 10,
    expiryAlertDays: [7, 15, 30],
    enableOfflineBilling: true,
    fifoOrFefo: 'FEFO',
  });

  useEffect(() => {
    if (business) {
      const s = business.settings;
      setFormData({
        name: business.name || '',
        legalName: business.legalName || '',
        logoUrl: business.logoUrl || '',
        address: business.address || '',
        city: business.city || '',
        state: business.state || '',
        pincode: business.pincode || '',
        phone: business.phone || '',
        email: business.email || '',
        gstin: business.gstin || '',
        currencyCode: s?.currencyCode || 'INR',
        currencySymbol: s?.currencySymbol || '₹',
        invoicePrefix: s?.invoicePrefix || 'INV-',
        invoiceStartingNumber: s?.invoiceStartingNumber || 1001,
        defaultTaxPercentage: Number(s?.defaultTaxPercentage ?? 18),
        enableTaxInclusive: s?.enableTaxInclusive ?? false,
        defaultPaymentMethods: s?.defaultPaymentMethods || [
          'CASH',
          'CARD',
          'UPI',
          'BANK_TRANSFER',
        ],
        receiptFooter: s?.receiptFooter || '',
        printerPaperSize: (s?.printerPaperSize as any) || '80mm',
        autoPrintReceipt: s?.autoPrintReceipt ?? false,
        globalLowStockThreshold: s?.globalLowStockThreshold || 10,
        expiryAlertDays: s?.expiryAlertDays || [7, 15, 30],
        enableOfflineBilling: s?.enableOfflineBilling ?? true,
        fifoOrFefo: (s?.fifoOrFefo as 'FEFO' | 'FIFO') || 'FEFO',
      });
    }
  }, [business]);

  const mutation = useMutation({
    mutationFn: settingsApi.updateSettings,
    onSuccess: async () => {
      toast.success('Business settings updated');
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
      const refreshedProfile = await authApi.getMe();
      updateUser(refreshedProfile);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-slate-400">
        Loading business configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Business Settings & Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure {isPharmacy ? 'pharmacy' : 'store'} identity, GSTIN, currency (₹), invoice numbering, batch deduction rules, and view security logs.
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-200/70 p-1">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold ${
              activeTab === 'config'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configuration</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold ${
              activeTab === 'audit'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {activeTab === 'config' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Mode Switcher Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Active Business Mode ({config.label})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Switch between General Store Mode and Pharmacy Mode. Each mode preserves its own separate product/medicine catalog and transactions.
              </p>
            </div>
            <div className="inline-flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMode('store');
                  queryClient.invalidateQueries();
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  mode === 'store'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-blue-600" />
                <span>Store Mode</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('pharmacy');
                  queryClient.invalidateQueries();
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  mode === 'pharmacy'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Pill className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pharmacy Mode</span>
              </button>
            </div>
          </div>

          {/* Business Identity Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                {isPharmacy ? 'Pharmacy & Legal Profile' : 'Store & Legal Profile'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Legal Entity Name
                </label>
                <input
                  type="text"
                  value={formData.legalName || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, legalName: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  value={formData.gstin || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, gstin: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg uppercase"
                  placeholder="29AABCA1234F1Z5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Billing, Currency & Inventory Rules */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Receipt className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Billing, Currency & Inventory Thresholds
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency Code
                </label>
                <input
                  type="text"
                  value={formData.currencyCode}
                  onChange={(e) =>
                    setFormData({ ...formData, currencyCode: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={formData.currencySymbol}
                  onChange={(e) =>
                    setFormData({ ...formData, currencySymbol: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Prefix
                </label>
                <input
                  type="text"
                  value={formData.invoicePrefix}
                  onChange={(e) =>
                    setFormData({ ...formData, invoicePrefix: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default GST / Tax (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.defaultTaxPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultTaxPercentage: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batch Deduction Strategy
                </label>
                <select
                  value={formData.fifoOrFefo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fifoOrFefo: e.target.value as 'FEFO' | 'FIFO',
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="FEFO">FEFO (First Expiry, First Out)</option>
                  <option value="FIFO">FIFO (First In, First Out)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Global Low-Stock Threshold
                </label>
                <input
                  type="number"
                  value={formData.globalLowStockThreshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      globalLowStockThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Printer Paper Size
                </label>
                <select
                  value={formData.printerPaperSize}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      printerPaperSize: e.target.value as any,
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="80mm">80mm Thermal Receipt</option>
                  <option value="58mm">58mm Thermal Receipt</option>
                  <option value="A4">A4 Standard Invoice</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableOfflineBilling}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        enableOfflineBilling: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                  />
                  <span>Enable Offline POS Billing</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receipt Footer Note
              </label>
              <textarea
                rows={2}
                value={formData.receiptFooter || ''}
                onChange={(e) =>
                  setFormData({ ...formData, receiptFooter: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `Reset local ${config.label} demo database back to initial seed state?`
                  )
                ) {
                  resetCurrentModeDb(mode);
                  toast.success(`${config.label} database reset! Reloading...`);
                  setTimeout(() => window.location.reload(), 600);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
            >
              Reset {config.label} Demo Database
            </button>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>
                {mutation.isPending ? 'Saving...' : 'Save Configuration'}
              </span>
            </button>
          </div>
        </form>
      ) : (
        /* Audit Logs Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">
              Recent Security & Operational Audit Trail
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {!auditLogs?.length ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        {log.user?.fullName || 'System'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                          {log.module}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-blue-600">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {log.entityType || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
