import React, { useState } from 'react';
import { Lock, Mail, Phone, Tractor, AlertCircle, ArrowRight, User, CheckCircle2, ChevronLeft } from 'lucide-react';
import { signUpCustomer, signInCustomer, signInWithGoogle, resetPassword } from '../utils/supabaseClient';
import { playClickFeedback } from '../utils/timer';

export default function AuthModal({ onAuthSuccess, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Sign In state
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Email or Phone Number
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up state (Only 4 fields: Full Name, Email Address, Phone Number, Password)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Forgot Password state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleNormalSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    playClickFeedback();

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Please enter your Full Name');
        }
        if (!email.trim() && !phone.trim()) {
          throw new Error('Please enter your Email Address or Phone Number');
        }
        if (!signupPassword || signupPassword.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        const res = await signUpCustomer({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password: signupPassword,
        });
        onAuthSuccess(res.user);
      } else {
        const cleanIdentifier = loginIdentifier.trim();
        if (!cleanIdentifier) {
          throw new Error('Please enter your registered Email or Phone Number');
        }
        if (!loginPassword) {
          throw new Error('Please enter your Password');
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

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    playClickFeedback();

    try {
      await signInWithGoogle();
      // Browser redirects to Google OAuth
    } catch (err) {
      console.error('Google auth error:', err);
      setErrorMsg(err.message || 'Failed to initiate Google Login.');
      setGoogleLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setForgotSuccessMsg('');
    setLoading(true);
    playClickFeedback();

    try {
      const clean = forgotIdentifier.trim();
      if (!clean) {
        throw new Error('Please enter your registered Email or Phone Number');
      }

      await resetPassword({ identifier: clean });
      setForgotSuccessMsg('Password reset instructions have been sent to your registered email.');
    } catch (err) {
      console.error('Reset password error:', err);
      setErrorMsg(err.message || 'Could not send reset email. Please verify your address.');
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
            {isForgotPassword
              ? 'Password Recovery'
              : isSignUp
              ? 'Create your Account'
              : 'Account Login'}
          </p>

          {/* Toggle Tab (Hidden when in Forgot Password mode) */}
          {!isForgotPassword && (
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
          )}
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-sm">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}

          {forgotSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="flex-1">{forgotSuccessMsg}</span>
            </div>
          )}

          {/* ================= FORGOT PASSWORD VIEW ================= */}
          {isForgotPassword ? (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#1F5E3B]" /> Registered Email or Phone Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. operator@gmail.com or 9876543210"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  required
                  className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm font-bold shadow-md flex items-center justify-center gap-2"
              >
                {loading ? 'Sending Instructions...' : 'Send Password Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrorMsg('');
                  setForgotSuccessMsg('');
                }}
                className="w-full py-2 text-xs font-bold text-[#1F5E3B] hover:text-[#16452B] flex items-center justify-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </button>
            </form>
          ) : !isSignUp ? (
            /* ================= SIGN IN TAB ================= */
            <form onSubmit={handleNormalSubmit} className="space-y-3.5">
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

              {/* Password & Forgot Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#1F5E3B]" /> Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setForgotIdentifier(loginIdentifier);
                      setErrorMsg('');
                      setForgotSuccessMsg('');
                    }}
                    className="text-[11px] font-bold text-[#1F5E3B] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="btn-primary w-full py-3 text-sm font-bold shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Logging in...</span>
                  ) : (
                    <>
                      <span>Log In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-gray-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  OR
                </span>
                <div className="border-t border-gray-200 w-full"></div>
              </div>

              {/* Google Login */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading || googleLoading}
                className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-2xl py-2.5 px-4 font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
              >
                {googleLoading ? (
                  <span className="text-xs">Connecting to Google...</span>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Future OTP Login Options (Disabled with Coming Soon Badge) */}
              <div className="space-y-2 pt-1">
                {/* Email OTP */}
                <div className="relative flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-gray-50/75 opacity-75 cursor-not-allowed select-none">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Login with Email OTP</span>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    Coming Soon
                  </span>
                </div>

                {/* Phone OTP */}
                <div className="relative flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-gray-50/75 opacity-75 cursor-not-allowed select-none">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Login with Phone OTP</span>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    Coming Soon
                  </span>
                </div>
              </div>
            </form>
          ) : (
            /* ================= CREATE ACCOUNT TAB ================= */
            <form onSubmit={handleNormalSubmit} className="space-y-3">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#1F5E3B]" /> Full Name *
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

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#1F5E3B]" /> Email Address *
                </label>
                <input
                  type="email"
                  placeholder="e.g. operator@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#1F5E3B]" /> Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#1F5E3B]" /> Password (min 6 characters) *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="btn-primary w-full py-3 text-sm font-bold shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Creating Account...</span>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2.5">
                <div className="border-t border-gray-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  OR
                </span>
                <div className="border-t border-gray-200 w-full"></div>
              </div>

              {/* Create Account with Google */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading || googleLoading}
                className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-2xl py-2.5 px-4 font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
              >
                {googleLoading ? (
                  <span className="text-xs">Connecting to Google...</span>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Create Account with Google</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
