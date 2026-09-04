import React, { useState } from 'react';
import { User, Phone, MapPin, IndianRupee, ShieldCheck, LogOut, Edit3, Save, CheckCircle2, Clock, Briefcase, Mail } from 'lucide-react';
import { updateUserProfile } from '../utils/supabaseStorage';
import { formatCurrency, formatDuration } from '../utils/calculations';
import { playClickFeedback } from '../utils/timer';

export default function Profile({
  currentUser,
  completedRecords = [],
  onUpdateUser,
  onLogout,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || currentUser?.fullName || currentUser?.full_name || 'Operator');
  const [phone, setPhone] = useState(currentUser?.phone || currentUser?.mobileNumber || currentUser?.mobile_number || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [address, setAddress] = useState(currentUser?.address || currentUser?.location || '');
  const [defaultRate, setDefaultRate] = useState(currentUser?.defaultRate || currentUser?.default_rate || 100);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Calculate user lifetime stats
  const totalJobs = completedRecords.length;
  const totalSeconds = completedRecords.reduce((sum, r) => sum + (Number(r.durationSeconds) || 0), 0);
  const totalNetEarnings = completedRecords.reduce((sum, r) => sum + (Number(r.netEarnings) || 0), 0);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    playClickFeedback();
    setSaving(true);
    try {
      const updates = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        defaultRate: Number(defaultRate) || 100,
        // Legacy compatibility mappings
        fullName: name.trim(),
        mobileNumber: phone.trim(),
        location: address.trim(),
      };

      await updateUserProfile(currentUser.id, updates);
      if (onUpdateUser) {
        onUpdateUser({ ...currentUser, ...updates });
      }
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmLogout = () => {
    playClickFeedback();
    setShowLogoutConfirm(false);
    onLogout();
  };

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* Profile Header Banner */}
      <div className="bg-white border-b border-[#E2E2DC] -mx-4 -mt-4 px-4 py-4 mb-2 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
              Authenticated Profile
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#1A1A1A]">
              Customer Profile
            </h2>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-[#1F5E3B] text-xs font-bold p-3 rounded-2xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#1F5E3B] shrink-0" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="card-base bg-white border-2 border-[#1F5E3B]/20 p-5 space-y-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-[#1F5E3B] text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-emerald-600 shrink-0">
              {name ? name.charAt(0).toUpperCase() : 'O'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
                  {name}
                </h3>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-emerald-100 text-[#1F5E3B] px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Authenticated
                </span>
              </div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">
                {email || phone || 'Registered Account'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-xl bg-[#F7F7F5] hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1 border border-gray-300 shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEditing ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>

        {/* Profile Details or Edit Form */}
        {!isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#E2E2DC] text-xs text-gray-700">
            <div className="flex items-center gap-2 bg-[#F7F7F5] p-3 rounded-xl border border-gray-200">
              <Phone className="w-4 h-4 text-[#1F5E3B]" />
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Phone Number</span>
                <span className="font-bold text-gray-900">{phone || 'Not provided'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#F7F7F5] p-3 rounded-xl border border-gray-200">
              <Mail className="w-4 h-4 text-[#1F5E3B]" />
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Email Address</span>
                <span className="font-bold text-gray-900">{email || 'Not provided'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#F7F7F5] p-3 rounded-xl border border-gray-200 sm:col-span-2">
              <MapPin className="w-4 h-4 text-[#1F5E3B]" />
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Address</span>
                <span className="font-bold text-gray-900">{address || 'Not provided'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#F7F7F5] p-3 rounded-xl border border-gray-200 sm:col-span-2">
              <IndianRupee className="w-4 h-4 text-[#1F5E3B]" />
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Default Agreed Rate</span>
                <span className="font-black text-sm font-timer text-[#1F5E3B]">
                  ₹{defaultRate} / min <span className="text-xs font-normal text-gray-500">(₹{defaultRate * 60}/hr)</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-3 pt-3 border-t border-[#E2E2DC]">
            <div>
              <label className="text-xs font-bold text-gray-800">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none mt-0.5"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-gray-800">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none mt-0.5"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-800">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. operator@gmail.com"
                  className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none mt-0.5"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-800">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Asansol, West Bengal"
                className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none mt-0.5"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-800">Default Agreed Rate (₹/min)</label>
              <input
                type="number"
                min="1"
                value={defaultRate}
                onChange={(e) => setDefaultRate(Math.max(1, Number(e.target.value)))}
                className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2 text-sm font-black font-timer text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none mt-0.5"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1 py-2.5 text-xs shadow-sm"
              >
                <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Lifetime Account Performance Stats */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
          Account Performance
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
          <div className="card-base bg-white p-3 border border-gray-200">
            <Briefcase className="w-5 h-5 text-[#1F5E3B] mx-auto mb-1" />
            <div className="text-[10px] uppercase font-bold text-gray-500">Completed Jobs</div>
            <div className="text-lg font-black text-gray-900 font-timer mt-0.5">
              {totalJobs}
            </div>
          </div>

          <div className="card-base bg-white p-3 border border-gray-200">
            <Clock className="w-5 h-5 text-[#1F5E3B] mx-auto mb-1" />
            <div className="text-[10px] uppercase font-bold text-gray-500">Total Hours</div>
            <div className="text-lg font-black text-gray-900 font-timer mt-0.5">
              {formatDuration(totalSeconds, 'short')}
            </div>
          </div>

          <div className="card-base bg-white p-3 border border-gray-200 col-span-2 sm:col-span-1">
            <IndianRupee className="w-5 h-5 text-[#1F5E3B] mx-auto mb-1" />
            <div className="text-[10px] uppercase font-bold text-gray-500">Net Profit</div>
            <div className="text-lg font-black text-[#1F5E3B] font-timer mt-0.5">
              {formatCurrency(totalNetEarnings)}
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Sync & Security Box */}
      <div className="card-base bg-emerald-50/60 border border-emerald-200 p-3.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-emerald-900 font-semibold">
          <ShieldCheck className="w-4 h-4 text-[#1F5E3B]" />
          <span>Profile Secured with Supabase Row Level Security</span>
        </div>
        <span className="text-[10px] font-bold bg-white text-[#1F5E3B] px-2 py-0.5 rounded-full border border-emerald-200">
          Private
        </span>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
              <LogOut className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-gray-900 mb-1">Log out of TRACULATOR?</h4>
            <p className="text-xs text-gray-600 mb-5">
              Your tractor records, history, and earnings are securely stored in your account and will reload when you sign back in.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 font-semibold text-xs text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
