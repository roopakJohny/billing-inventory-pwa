import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, ArrowRight, Sparkles, Store, Pill } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { useBusinessMode } from '../../hooks/useBusinessMode';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@store.com');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const { mode, setMode, config, isPharmacy } = useBusinessMode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { token, user } = await authApi.login({ email, password });
      setAuth(token, user);
      toast.success(`Welcome back, ${user.fullName} (${config.label} Mode)!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Invalid credentials or server unreachable'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemoRole = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-white">
      {/* Left Hero Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xl shadow-lg">
            S
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Smart POS</h1>
            <p className="text-xs text-slate-400">{config.subtitle}</p>
          </div>
        </div>

        <div className="max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{config.heroBadge}</span>
          </div>
          <h2 className="text-3xl font-bold leading-tight text-white">
            {config.heroHeadline}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            {config.heroDescription}
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
            <div>
              <p className="text-lg font-bold text-white">
                {isPharmacy ? 'FEFO' : 'FEFO / FIFO'}
              </p>
              <p className="text-xs text-slate-400">Batch Deduction</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">RBAC</p>
              <p className="text-xs text-slate-400">Granular Security</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">PWA</p>
              <p className="text-xs text-slate-400">Offline Sync Ready</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Smart POS Billing & Inventory System
        </p>
      </div>

      {/* Right Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50 text-slate-900">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {config.loginHeading}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {config.loginSubheading}
            </p>
          </div>

          {/* Quick Role Switcher for Demo Testing */}
          <div className="mb-6 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Quick Demo Role Credentials (Password@123)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoRole('admin@store.com')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  email === 'admin@store.com'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemoRole('manager@store.com')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  email === 'manager@store.com'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => fillDemoRole('cashier@store.com')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  email === 'cashier@store.com'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Cashier
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@store.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-xs transition-colors"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Subtle Business Mode Toggle at Bottom of Login Card */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Business Environment</span>
            <div
              role="group"
              aria-label="Business Mode Toggle"
              className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200/80"
            >
              <button
                type="button"
                onClick={() => setMode('store')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  mode === 'store'
                    ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Store className="w-3 h-3" />
                <span>Store</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('pharmacy')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  mode === 'pharmacy'
                    ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Pill className="w-3 h-3" />
                <span>Pharmacy</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

