import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Menu,
  X,
  Wifi,
  WifiOff,
  LogOut,
  KeyRound,
  Bell,
  ChevronRight,
  ShieldCheck,
  Store,
  Pill,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/auth.api';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { useBusinessMode } from '../hooks/useBusinessMode';

export const AppLayout: React.FC = () => {
  const { user, clearAuth, hasPermission } = useAuthStore();
  const { config, isPharmacy } = useBusinessMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Internet connection restored');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are currently offline');
    };
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    setDeferredInstallPrompt(null);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      clearAuth();
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const navigationItems = config.navigation;

  const visibleNavItems = navigationItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  const activeNav =
    navigationItems.find((item) => location.pathname.startsWith(item.path)) ||
    navigationItems[0];

  const currencySymbol = user?.business?.settings?.currencySymbol || '₹';

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {isPharmacy ? <Pill className="w-5 h-5" /> : <Store className="w-5 h-5" />}
            </div>
            <div className="leading-tight">
              <span className="font-bold text-white tracking-tight block text-sm">
                {config.title}
              </span>
              <span className="text-[11px] text-slate-400">
                {config.label} Mode
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Role & User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-semibold text-xs">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user?.fullName}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{user?.roles?.join(', ')}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Password</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 font-medium hidden sm:inline">
                {config.title}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 hidden sm:inline" />
              <h1 className="font-semibold text-slate-900">
                {activeNav?.label || 'Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {deferredInstallPrompt && (
              <button
                onClick={handleInstallPwa}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white"
              >
                <span>Install PWA</span>
              </button>
            )}

            {/* Active Mode & Currency Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
              <span className="font-semibold text-blue-600">
                {config.label} Mode
              </span>
              <span className="text-slate-300">|</span>
              <span>Currency: {currencySymbol}</span>
              <span className="text-slate-300">|</span>
              <span>
                Batch: {isPharmacy ? 'FEFO' : user?.business?.settings?.fifoOrFefo || 'FIFO'}
              </span>
            </div>

            {/* Network Status Indicator (PWA Requirement) */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Offline Mode</span>
                </>
              )}
            </div>

            {/* Quick POS Launch Button */}
            {hasPermission('billing:create') && (
              <button
                onClick={() => navigate('/pos')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{isPharmacy ? 'Pharmacy POS' : 'New Bill'}</span>
              </button>
            )}

            {/* Notifications Bell */}
            <button
              onClick={() =>
                navigate(isPharmacy ? '/expiry-management' : '/inventory')
              }
              title="Notifications & Stock Alerts"
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

