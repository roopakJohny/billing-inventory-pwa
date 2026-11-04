import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authApi.forgotPassword(email);
      toast.success(res.message);
      if (res.resetToken) {
        setGeneratedToken(res.resetToken);
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to generate reset token'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to login</span>
        </Link>

        <h2 className="text-xl font-bold text-slate-900">Forgot Password</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Enter your registered email address to request a password reset token.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Registered Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@store.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-xs"
          >
            {loading ? 'Generating Token...' : 'Send Reset Token'}
          </button>
        </form>

        {generatedToken && (
          <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-800">
              <KeyRound className="w-4 h-4" />
              <span>Development Reset Token Generated:</span>
            </div>
            <code className="block p-2 rounded bg-white border border-blue-100 text-xs font-mono break-all text-slate-800">
              {generatedToken}
            </code>
            <button
              type="button"
              onClick={() =>
                navigate(`/reset-password?token=${encodeURIComponent(generatedToken)}`)
              }
              className="w-full py-2 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              Proceed to Reset Password →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

