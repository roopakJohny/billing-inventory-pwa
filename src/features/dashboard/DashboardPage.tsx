import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingCart,
  Package,
  Pill,
  Boxes,
  AlertTriangle,
  Clock,
  ShieldAlert,
  TrendingUp,
  ArrowUpRight,
  Receipt,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { reportsApi } from '../../api/reports.api';
import { useAuthStore } from '../../store/auth.store';
import { useBusinessMode } from '../../hooks/useBusinessMode';

export const DashboardPage: React.FC = () => {
  const { user, hasPermission } = useAuthStore();
  const { mode, isPharmacy, config } = useBusinessMode();
  const navigate = useNavigate();
  const currency = user?.business?.settings?.currencySymbol || '₹';

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-analytics', mode],
    queryFn: reportsApi.getDashboard,
  });

  if (isLoading || !data) {
    return (
      <div className="p-10 text-center text-sm text-slate-400">
        Loading real-time {config.label.toLowerCase()} analytics...
      </div>
    );
  }

  const { kpis, charts, recentTransactions, recentMovements, alerts } = data;

  const kpiCards = isPharmacy
    ? [
        {
          label: 'Total Pharmacy Sales Today',
          value: `${currency}${Number(kpis.totalSalesToday).toLocaleString('en-IN')}`,
          sub: `${kpis.billsTodayCount} Pharmacy bill(s) today • Month: ${currency}${Number(
            kpis.totalSalesThisMonth
          ).toLocaleString('en-IN')}`,
          icon: IndianRupee,
          color: 'bg-blue-50 text-blue-600',
          onClick: () => navigate('/bills'),
        },
        {
          label: 'Total Medicines & Available Stock',
          value: `${kpis.totalAvailableStock} Units`,
          sub: `Across ${kpis.totalProducts} active medicines`,
          icon: Pill,
          color: 'bg-indigo-50 text-indigo-600',
          onClick: () => navigate('/products'),
        },
        {
          label: 'Low-Stock Medicines',
          value: `${kpis.lowStockCount} Medicines`,
          sub: `${kpis.outOfStockCount} out-of-stock medicine(s)`,
          icon: AlertTriangle,
          color: 'bg-amber-50 text-amber-600',
          onClick: () => navigate('/products'),
        },
        {
          label: 'Medicines Expiring Soon',
          value: `${kpis.approachingExpiryCount} Batch(es)`,
          sub: 'Expiring within 30 days (FEFO prioritized)',
          icon: Clock,
          color: 'bg-orange-50 text-orange-600',
          onClick: () => navigate('/expiry-management'),
        },
        {
          label: 'Expired Medicines',
          value: `${kpis.expiredProductsCount} Batch(es)`,
          sub: 'Blocked from dispensing • Return / Write-off',
          icon: ShieldAlert,
          color: 'bg-rose-50 text-rose-600',
          onClick: () => navigate('/expiry-management'),
        },
        {
          label: 'Damaged Medicine Stock',
          value: `${kpis.damagedStockQuantity} Units`,
          sub: `Valuation: ${currency}${Number(
            kpis.totalPurchaseValuation
          ).toLocaleString('en-IN')}`,
          icon: Boxes,
          color: 'bg-purple-50 text-purple-600',
          onClick: () => navigate('/damaged-medicines'),
        },
      ]
    : [
        {
          label: 'Total Sales Today',
          value: `${currency}${Number(kpis.totalSalesToday).toLocaleString('en-IN')}`,
          sub: `${kpis.billsTodayCount} Bill(s) generated today`,
          icon: IndianRupee,
          color: 'bg-blue-50 text-blue-600',
          onClick: () => navigate('/bills'),
        },
        {
          label: 'Total Sales This Month',
          value: `${currency}${Number(kpis.totalSalesThisMonth).toLocaleString('en-IN')}`,
          sub: 'Active monthly store revenue',
          icon: TrendingUp,
          color: 'bg-emerald-50 text-emerald-600',
          onClick: () => navigate('/reports'),
        },
        {
          label: 'Total Products & Available Stock',
          value: `${kpis.totalAvailableStock} Units`,
          sub: `Across ${kpis.totalProducts} active store products`,
          icon: Package,
          color: 'bg-indigo-50 text-indigo-600',
          onClick: () => navigate('/products'),
        },
        {
          label: 'Low-Stock Products',
          value: `${kpis.lowStockCount} Products`,
          sub: 'Below minimum stock threshold',
          icon: AlertTriangle,
          color: 'bg-amber-50 text-amber-600',
          onClick: () => navigate('/products'),
        },
        {
          label: 'Out-of-Stock Products',
          value: `${kpis.outOfStockCount} Products`,
          sub: 'Requires immediate replenishment',
          icon: ShieldAlert,
          color: 'bg-rose-50 text-rose-600',
          onClick: () => navigate('/products'),
        },
        {
          label: 'Inventory Valuation & Damaged',
          value: `${currency}${Number(kpis.totalPurchaseValuation).toLocaleString('en-IN')}`,
          sub: `Damaged Stock: ${kpis.damagedStockQuantity} units`,
          icon: Boxes,
          color: 'bg-purple-50 text-purple-600',
          onClick: () => navigate('/inventory'),
        },
      ];

  return (
    <div className="space-y-6">
      {/* Top Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold">
            {config.title} — {config.terms.dashboardTitle}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Signed in as <span className="font-semibold text-white">{user?.fullName}</span> ({user?.roles.join(', ')}) • Mode:{' '}
            <span className="font-semibold text-blue-300">{config.label}</span> • Batch Allocation:{' '}
            <span className="font-semibold text-emerald-300">
              {isPharmacy ? 'FEFO (Earliest Expiry First)' : user?.business?.settings?.fifoOrFefo || 'FIFO'}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {hasPermission('billing:create') && (
            <button
              onClick={() => navigate('/pos')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Launch {config.terms.posTitle}</span>
            </button>
          )}
          {hasPermission('purchases:manage') && (
            <button
              onClick={() => navigate('/purchases')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
            >
              <Boxes className="w-4 h-4" />
              <span>Record Stock Purchase</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Alerts & Notifications Strip */}
      {alerts && alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {alerts.map((alert: any) => (
            <div
              key={alert.id}
              onClick={() => navigate(alert.link)}
              className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-transform hover:-translate-y-0.5 ${
                alert.severity === 'high'
                  ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                  : alert.severity === 'medium'
                  ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                  : 'bg-blue-50/90 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">{alert.title}</p>
                  <p className="text-[11px] opacity-80 mt-0.5">{alert.message}</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 shrink-0 opacity-60" />
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              onClick={card.onClick}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex items-start justify-between cursor-pointer hover:border-blue-300 transition-colors"
            >
              <div>
                <p className="text-xs font-medium text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {card.value}
                </p>
                <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1: Daily Sales vs Returns & Monthly Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Daily Sales vs Returns (Last 14 Days)
            </h3>
            <p className="text-xs text-slate-500">
              Gross sales revenue compared against customer sales returns
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name={`Sales (${currency})`}
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="returns"
                  name={`Returns (${currency})`}
                  stroke="#e11d48"
                  fill="#f43f5e"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Monthly Sales vs Returns Trend
            </h3>
            <p className="text-xs text-slate-500">
              6-month historical revenue comparison
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="sales"
                  name={`Sales (${currency})`}
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="returns"
                  name={`Returns (${currency})`}
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Top Selling & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Top-Selling {config.terms.productPlural}
            </h3>
            <p className="text-xs text-slate-500">
              Ranked by net revenue and units sold
            </p>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={charts.topSellingProducts}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={130}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip />
                <Bar
                  dataKey="revenue"
                  name={`Revenue (${currency})`}
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              {config.terms.categorySingular} Stock Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Inventory units & purchase valuation by {config.terms.categorySingular.toLowerCase()}
            </p>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.categoryDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="units"
                  name="Sellable Units"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="value"
                  name={`Valuation (${currency})`}
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions & Recent Stock Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {isPharmacy ? 'Recent Pharmacy Bills' : 'Recent Bills'}
              </h3>
            </div>
            <button
              onClick={() => navigate('/bills')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-4">Invoice</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Total</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-semibold text-blue-600">
                      {tx.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {tx.customerName || 'Walk-in'}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {currency}
                      {Number(tx.grandTotal).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          tx.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : tx.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Recent Stock Movements
              </h3>
            </div>
            <button
              onClick={() => navigate('/inventory')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Full Ledger →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-4">Product / Batch</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Qty</th>
                  <th className="py-2.5 px-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentMovements.map((mv: any) => (
                  <tr key={mv.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {mv.product?.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Batch: {mv.batch?.batchNumber}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[10px] text-slate-600">
                      {mv.movementType}
                    </td>
                    <td
                      className={`py-2.5 px-4 font-bold ${
                        mv.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {mv.quantity > 0 ? `+${mv.quantity}` : mv.quantity}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 truncate max-w-[160px]">
                      {mv.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
