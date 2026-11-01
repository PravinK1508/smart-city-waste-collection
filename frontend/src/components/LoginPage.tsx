import React, { useState } from 'react';
import {
  Recycle,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { api } from '../api/client';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.login(trimmedEmail, password);
      if (response.success && response.user) {
        onLoginSuccess(response.user);
      } else {
        setErrorMessage(response.message || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect to backend authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-slate-50 to-teal-50 flex flex-col justify-between font-sans">
      {/* Top Header Brand */}
      <header className="px-6 py-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Recycle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-tight text-slate-900">
                Smart<span className="text-emerald-600">Waste</span>
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Optimizer
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Municipal Waste Collection &amp; Recycling Management System
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Government Enterprise Portal</span>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          {/* Card Header Accent */}
          <div className="bg-linear-to-r from-emerald-600 via-emerald-700 to-teal-700 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-emerald-400/20 rounded-full blur-lg pointer-events-none"></div>

            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 mb-3 shadow-inner">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">System Login</h1>
            <p className="text-emerald-100 text-xs mt-1 font-medium">
              Enter your authorized credentials to access the optimization dashboard
            </p>
          </div>

          {/* Form Body */}
          <div className="p-8">
            {errorMessage && (
              <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 flex items-start space-x-3 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Official Email Address
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="e.g. admin@smartcity.gov"
                    className="block w-full pl-10 pr-3 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-slate-400 font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter account password"
                    className="block w-full pl-10 pr-10 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-slate-400 font-medium text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center space-x-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-emerald-200" />
                  </>
                )}
              </button>
            </form>

            {/* Demo Quick-Fill Section */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Test Credentials (MySQL Stored)
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-100">
                  1-Click Fill
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoFill('admin@smartcity.gov', 'Admin@123')}
                  className="flex flex-col text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Admin</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">admin@smartcity.gov</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoFill('driver@smartcity.gov', 'Driver@123')}
                  className="flex flex-col text-left p-2.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 group-hover:text-amber-700">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Driver</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">driver@smartcity.gov</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoFill('pravin@gmail.com', 'Citizen@123')}
                  className="flex flex-col text-left p-2.5 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 group-hover:text-teal-700">
                    <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Citizen</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">pravin@gmail.com</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="py-4 text-center text-xs text-slate-400">
        Smart City Waste Collection Optimization &amp; Recycling Management System &bull; Secure MySQL Backend Authentication
      </footer>
    </div>
  );
};
