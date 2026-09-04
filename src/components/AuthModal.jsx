import React, { useState } from 'react';
import { Lock, Mail, Phone, Tractor, AlertCircle, ArrowRight, User, MapPin, IndianRupee } from 'lucide-react';
import { signUpCustomer, signInCustomer } from '../utils/supabaseClient';
import { playClickFeedback } from '../utils/timer';

export default function AuthModal({ onAuthSuccess, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Sign In state
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Email or Phone Number
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [defaultRate, setDefaultRate] = useState(100);
  const [signupPassword, setSignupPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    playClickFeedback();

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Please enter your Name');
        }
        if (!email.trim() && !phone.trim()) {
          throw new Error('Please provide at least an Email or Phone Number');
        }
        if (!signupPassword || signupPassword.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        const res = await signUpCustomer({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          defaultRate: Number(defaultRate) || 100,
          password: signupPassword,
        });
        onAuthSuccess(res.user);
      } else {
        const cleanIdentifier = loginIdentifier.trim();
        if (!cleanIdentifier) {
          throw new Error('Please enter your Email or Phone Number');
        }
        if (!loginPassword || loginPassword.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        const res = await signInCustomer({
          identifier: cleanIdentifier,
          password: loginPassword,
        });
        onAuthSuccess(res.user);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1F5E3B] text-white p-5 text-center relative shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-white/10 mx-auto flex items-center justify-center mb-2 border border-white/20 shadow-inner">
            <Tractor className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">TRACULATOR</h2>
          <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
            {isSignUp ? 'Create your Account' : 'Account Login'}
          </p>

          {/* Toggle Tab */}
          <div className="flex bg-black/20 p-1 rounded-xl mt-4 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg('');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isSignUp ? 'bg-white text-[#1F5E3B] shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg('');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isSignUp ? 'bg-white text-[#1F5E3B] shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1 text-sm">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isSignUp ? (
            /* ================= SIGN IN FIELDS ================= */
            <>
              {/* Email or Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#1F5E3B]" /> Email or Phone Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. operator@gmail.com or 9876543210"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  required
                  className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#1F5E3B]" /> Password *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
                />
              </div>
            </>
          ) : (
            /* ================= SIGN UP / REGISTRATION FIELDS ================= */
            <>
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#1F5E3B]" /> Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Singh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#1F5E3B]" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#1F5E3B]" /> Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="operator@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#1F5E3B]" /> Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Asansol, West Bengal"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
                />
              </div>

              {/* Default Agreed Rate */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-[#1F5E3B]" /> Default Agreed Rate (₹/min)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="100"
                  value={defaultRate}
                  onChange={(e) => setDefaultRate(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-black font-timer text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#1F5E3B]" /> Password (min 6 chars) *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
                />
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm sm:text-base shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Authenticating with Supabase...</span>
              ) : isSignUp ? (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Log In to TRACULATOR</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
