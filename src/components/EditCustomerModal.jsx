import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Wrench, IndianRupee, Clock, Timer as TimerIcon, Save, X, Edit3 } from 'lucide-react';
import { playClickFeedback } from '../utils/timer';

export default function EditCustomerModal({
  customer,
  onSave,
  onClose,
}) {
  const [customerName, setCustomerName] = useState(customer?.customerName || '');
  const [mobileNumber, setMobileNumber] = useState(customer?.mobileNumber || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [location, setLocation] = useState(customer?.location || '');
  const [workDescription, setWorkDescription] = useState(customer?.workDescription || '');
  const [ratePerMinute, setRatePerMinute] = useState(customer?.ratePerMinute ?? '');
  const [timerMode, setTimerMode] = useState(customer?.timerMode || 'stopwatch');
  const [durationMinutes, setDurationMinutes] = useState(customer?.durationMinutesPreset || 20);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (customer) {
      setCustomerName(customer.customerName || '');
      setMobileNumber(customer.mobileNumber || '');
      setAddress(customer.address || '');
      setLocation(customer.location || '');
      setWorkDescription(customer.workDescription || '');
      setRatePerMinute(customer.ratePerMinute ?? '');
      setTimerMode(customer.timerMode || 'stopwatch');
      setDurationMinutes(customer.durationMinutesPreset || 20);
    }
  }, [customer]);

  const validate = () => {
    const newErrors = {};
    if (!customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    if (!ratePerMinute || Number(ratePerMinute) <= 0) {
      newErrors.ratePerMinute = 'Valid rate per minute is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    playClickFeedback();

    const updated = {
      ...customer,
      customerName: customerName.trim(),
      mobileNumber: mobileNumber.trim(),
      address: address.trim(),
      location: location.trim() || address.trim(),
      workDescription: workDescription.trim(),
      ratePerMinute: Number(ratePerMinute) || 0,
      timerMode,
      durationMinutesPreset: timerMode === 'countdown' ? Number(durationMinutes) || 20 : null,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1F5E3B] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <h3 className="text-base font-bold">Edit Customer Details</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-sm">
          {/* Customer Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-800">Customer Name *</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-2.5 text-base font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
            />
            {errors.customerName && (
              <p className="text-xs text-red-600 font-semibold">{errors.customerName}</p>
            )}
          </div>

          {/* Phone & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-800">Mobile Number</label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-800">Village / Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-800">Field / Work Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
            />
          </div>

          {/* Work Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-800">Work Description</label>
            <input
              type="text"
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
            />
          </div>

          {/* Rate & Mode */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2E2DC]">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-800">Rate per Min (₹) *</label>
              <input
                type="number"
                min="0"
                placeholder="Rate"
                value={ratePerMinute}
                onFocus={(e) => {
                  if (e.target.value === '0') e.target.select();
                }}
                onChange={(e) => {
                  const val = e.target.value.replace(/^0+(?=\d)/, '');
                  setRatePerMinute(val);
                }}
                className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3 py-2 text-sm font-black font-timer text-gray-900 outline-none focus:bg-white focus:border-[#1F5E3B]"
              />
              {errors.ratePerMinute && (
                <p className="text-xs text-red-600 font-semibold">{errors.ratePerMinute}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-800">Timer Mode</label>
              <select
                value={timerMode}
                onChange={(e) => setTimerMode(e.target.value)}
                className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 outline-none cursor-pointer"
              >
                <option value="stopwatch">Stopwatch</option>
                <option value="countdown">Count Down</option>
                <option value="manual">Manual Entry</option>
              </select>
            </div>
          </div>

          {timerMode === 'countdown' && (
            <div className="space-y-1 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <label className="text-xs font-bold text-[#1F5E3B]">Duration (Minutes)</label>
              <input
                type="number"
                min="0"
                max="600"
                placeholder="0"
                value={durationMinutes === 0 ? '0' : (durationMinutes || '')}
                onFocus={(e) => {
                  if (e.target.value === '0') e.target.select();
                }}
                onChange={(e) => {
                  const val = e.target.value.replace(/^0+(?=\d)/, '');
                  setDurationMinutes(val === '' ? '' : Math.max(0, Number(val)));
                }}
                className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-sm font-bold font-timer text-gray-900 outline-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-gray-200 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 py-3"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
