import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, ArrowLeft, Key } from 'lucide-react';
import { signInAdmin } from '../utils/supabaseClient';
import { playClickFeedback } from '../utils/timer';

export default function AdminLogin({ onAdminLoginSuccess, onReturnToCustomerApp }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    playClickFeedback();

    try {
      if (!email.trim()) throw new Error('Please enter admin email or username');
      if (!password) throw new Error('Please enter admin password');

      const res = await signInAdmin({
        email: email.trim(),
        password,
      });

      onAdminLoginSuccess(res.user);
    } catch (err) {
      console.error('Admin login error:', err);
      setErrorMsg(err.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] text-white flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-[#1F2937] border border-gray-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">TRACULATOR ADMIN</h2>
          <p className="text-xs text-gray-400">
            Dedicated Administrative Portal & Multi-Customer Management
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" /> Admin Email / Identifier
            </label>
            <input
              type="text"
              placeholder="admin@traculator.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#111827] border border-gray-600 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> Admin Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#111827] border border-gray-600 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:border-emerald-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <span>Verifying Admin Authorization...</span>
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>Log In to Admin Panel</span>
              </>
            )}
          </button>
        </form>

        {/* Return to Customer App */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onReturnToCustomerApp}
            className="text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Customer App
          </button>
        </div>
      </div>
    </div>
  );
}
