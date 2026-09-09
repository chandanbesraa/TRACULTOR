import React, { useState, useEffect } from 'react';
import { Calendar, Clock, IndianRupee, Download, Save, RotateCcw, AlertCircle, CheckCircle2, Fuel, UserCheck, Utensils, MoreHorizontal } from 'lucide-react';
import {
  calculateDurationBetweenDates,
  calculateWorkAmount,
  calculateTotalExpenses,
  calculateNetEarnings,
  formatCurrency,
  formatDuration,
  formatDate,
  formatTime,
  formatDateInput,
  formatTimeInput,
  formatDateToDDMMYYYY,
  formatTimeToHHMMSS,
  parseDateAndTimeToDate,
} from '../utils/calculations';
import { generateCustomerBillPDF } from '../utils/pdfGenerator';
import { playClickFeedback } from '../utils/timer';

export default function ManualWorkForm({
  activeCustomer,
  onSaveCompletedJob,
  onResetSession,
}) {
  // State: Independent Date (DD/MM/YYYY) and Time (HH:MM:SS / HH:MM:SS:MS) typing fields
  // Both fields start COMPLETELY BLANK as requested (no auto-filled date/time)
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  const [ratePerMinute, setRatePerMinute] = useState(
    activeCustomer?.ratePerMinute !== undefined ? String(activeCustomer.ratePerMinute) : ''
  );
  const [expenses, setExpenses] = useState(
    activeCustomer?.expenses || { diesel: 0, driver: 0, food: 0, other: 0 }
  );
  const [errorMsg, setErrorMsg] = useState('');

  // Sync rate and expenses if active customer changes
  useEffect(() => {
    if (activeCustomer) {
      if (activeCustomer.ratePerMinute !== undefined && activeCustomer.ratePerMinute !== null) {
        setRatePerMinute(String(activeCustomer.ratePerMinute));
      }
      if (activeCustomer.expenses) {
        setExpenses(activeCustomer.expenses);
      }
    }
  }, [activeCustomer?.id]);

  // Parse Date objects from typed DD/MM/YYYY and HH:MM:SS inputs
  const startDateObj = startDate && startTime ? parseDateAndTimeToDate(startDate, startTime) : null;
  const endDateObj = endDate && endTime ? parseDateAndTimeToDate(endDate, endTime) : null;

  // Calculate Working Hours using Start Time and End Time data
  const durationSeconds = startDateObj && endDateObj ? calculateDurationBetweenDates(startDateObj, endDateObj) : 0;
  const workingMinutes = Math.round((durationSeconds / 60) * 10) / 10;
  const workingHours = Math.round((durationSeconds / 3600) * 100) / 100;
  const workingHoursFormatted = formatDuration(durationSeconds, 'short');

  const numRate = Number(ratePerMinute) || 0;
  const workAmount = calculateWorkAmount(numRate, durationSeconds);
  const totalExpenses = calculateTotalExpenses(expenses);
  const netEarnings = calculateNetEarnings(workAmount, totalExpenses);

  const handleExpenseChange = (field, valStr) => {
    if (valStr === '' || valStr === undefined) {
      setExpenses((prev) => ({
        ...prev,
        [field]: 0,
      }));
      return;
    }
    const sanitized = String(valStr).replace(/^0+(?=\d)/, '');
    const num = Math.max(0, Number(sanitized) || 0);
    setExpenses((prev) => ({
      ...prev,
      [field]: num,
    }));
  };

  const handleQuickRate = (r) => {
    playClickFeedback();
    setRatePerMinute(String(r));
  };

  const handleReset = () => {
    playClickFeedback();
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setRatePerMinute(activeCustomer?.ratePerMinute ? String(activeCustomer.ratePerMinute) : '');
    setExpenses({ diesel: 0, driver: 0, food: 0, other: 0 });
    setErrorMsg('');
    if (onResetSession) onResetSession();
  };

  const buildFinalRecord = () => {
    if (!startDate.trim() || !startTime.trim()) {
      setErrorMsg('Please enter both Start Date and Start Time.');
      return null;
    }
    if (!endDate.trim() || !endTime.trim()) {
      setErrorMsg('Please enter both End Date and End Time.');
      return null;
    }
    if (!startDateObj) {
      setErrorMsg('Invalid Start Date or Time format. Use DD/MM/YYYY and HH:MM:SS.');
      return null;
    }
    if (!endDateObj) {
      setErrorMsg('Invalid End Date or Time format. Use DD/MM/YYYY and HH:MM:SS.');
      return null;
    }
    if (durationSeconds <= 0) {
      setErrorMsg('End Date & Time must be after Start Date & Time.');
      return null;
    }
    if (!ratePerMinute || numRate <= 0) {
      setErrorMsg('Please enter a valid rate per minute (₹/min).');
      return null;
    }

    const todayStr = startDateObj.toISOString().split('T')[0];
    const timestamp = Date.now();
    return {
      id: `TRAC-${todayStr.replace(/-/g, '')}-${String(timestamp).slice(-4)}`,
      customerName: activeCustomer?.customerName || 'Customer',
      mobileNumber: activeCustomer?.mobileNumber || '',
      address: activeCustomer?.address || '',
      location: activeCustomer?.location || activeCustomer?.address || '',
      workDescription: activeCustomer?.workDescription || 'Agricultural Tractor Operation (Manual Entry)',
      ratePerMinute: numRate,
      timerMode: 'manual',
      durationMinutesPreset: null,
      startTime: startDateObj.toISOString(),
      endTime: endDateObj.toISOString(),
      durationSeconds,
      workAmount,
      expenses,
      totalExpenses,
      netEarnings,
      date: todayStr,
      createdAt: new Date().toISOString(),
      status: 'completed',
    };
  };

  const handleSaveOnly = () => {
    playClickFeedback();
    const record = buildFinalRecord();
    if (!record) return;
    onSaveCompletedJob(record, false);
  };

  const handleSaveAndDownloadPDF = () => {
    playClickFeedback();
    const record = buildFinalRecord();
    if (!record) return;
    generateCustomerBillPDF(record);
    onSaveCompletedJob(record, true);
  };

  return (
    <div className="card-base border-2 border-[#1F5E3B]/20 bg-white space-y-4">
      {/* Title & Reset Button */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E2DC]">
        <div>
          <h3 className="text-sm sm:text-base font-black text-[#1A1A1A] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#1F5E3B]" /> Manual Tractor Work Entry
          </h3>
          <p className="text-[11px] text-gray-500">
            Type Start & End Date (DD/MM/YYYY) and Time (HH:MM:SS) to calculate working hours
          </p>
        </div>
        <button
          onClick={handleReset}
          className="text-xs font-bold text-gray-500 hover:text-gray-800 bg-[#F7F7F5] border border-gray-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
          title="Reset manual inputs"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Independent Date and Time Typing Fields (Manual typing only, no slider/calendar) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* START SECTION: Separated Date & Time */}
        <div className="bg-[#F7F7F5] border border-gray-200 rounded-2xl p-3.5 space-y-2.5">
          <div className="text-xs font-bold text-[#1F5E3B] flex items-center gap-1.5 uppercase tracking-wide">
            <Clock className="w-3.5 h-3.5 text-[#1F5E3B]" /> Start Details
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Start Date (DD/MM/YYYY - auto '/' insert: 22 -> 22/ -> 22/03 -> 22/03/2026) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#1F5E3B]" /> Start Date
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="DD/MM/YYYY"
                maxLength={10}
                value={startDate}
                onChange={(e) => {
                  const formatted = formatDateInput(e.target.value, startDate);
                  setStartDate(formatted);
                  setErrorMsg('');
                }}
                className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-bold font-timer text-gray-900 focus:border-[#1F5E3B] outline-none"
              />
              <span className="text-[9px] text-gray-400 block">e.g. 22/03/2026</span>
            </div>

            {/* Start Time (HH:MM:SS - auto ':' insert: 10 -> 10: -> 10:30 -> 10:30:05) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#1F5E3B]" /> Start Time
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="HH:MM:SS"
                maxLength={12}
                value={startTime}
                onChange={(e) => {
                  const formatted = formatTimeInput(e.target.value, startTime);
                  setStartTime(formatted);
                  setErrorMsg('');
                }}
                className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-bold font-timer text-gray-900 focus:border-[#1F5E3B] outline-none"
              />
              <span className="text-[9px] text-gray-400 block">e.g. 10:30:00</span>
            </div>
          </div>
        </div>

        {/* END SECTION: Separated Date & Time */}
        <div className="bg-[#F7F7F5] border border-gray-200 rounded-2xl p-3.5 space-y-2.5">
          <div className="text-xs font-bold text-[#1F5E3B] flex items-center gap-1.5 uppercase tracking-wide">
            <Clock className="w-3.5 h-3.5 text-[#1F5E3B]" /> End Details
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* End Date (DD/MM/YYYY - auto '/' insert: 22 -> 22/ -> 22/03 -> 22/03/2026) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#1F5E3B]" /> End Date
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="DD/MM/YYYY"
                maxLength={10}
                value={endDate}
                onChange={(e) => {
                  const formatted = formatDateInput(e.target.value, endDate);
                  setEndDate(formatted);
                  setErrorMsg('');
                }}
                className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-bold font-timer text-gray-900 focus:border-[#1F5E3B] outline-none"
              />
              <span className="text-[9px] text-gray-400 block">e.g. 22/03/2026</span>
            </div>

            {/* End Time (HH:MM:SS - auto ':' insert: 10 -> 10: -> 10:30 -> 10:30:05) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#1F5E3B]" /> End Time
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="HH:MM:SS"
                maxLength={12}
                value={endTime}
                onChange={(e) => {
                  const formatted = formatTimeInput(e.target.value, endTime);
                  setEndTime(formatted);
                  setErrorMsg('');
                }}
                className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-bold font-timer text-gray-900 focus:border-[#1F5E3B] outline-none"
              />
              <span className="text-[9px] text-gray-400 block">e.g. 12:45:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Per Minute (₹) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5 text-[#1F5E3B]" /> Rate Per Minute (₹/min) *
          </label>
          {ratePerMinute !== '' && numRate > 0 && (
            <span className="text-xs font-black text-[#1F5E3B] font-timer">
              ₹{ratePerMinute}/min (₹{numRate * 60}/hr)
            </span>
          )}
        </div>

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
            setErrorMsg('');
          }}
          className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3 py-2.5 text-base font-black font-timer text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
        />

        {/* Quick Rate Presets */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[25, 30, 35, 40, 45, 50].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleQuickRate(r)}
              className={`flex-1 min-w-[50px] py-1.5 rounded-lg text-xs font-black font-timer border transition-all ${
                String(ratePerMinute) === String(r)
                  ? 'bg-[#1F5E3B] text-white border-[#1F5E3B]'
                  : 'bg-[#F7F7F5] text-gray-800 border-gray-300 hover:bg-gray-200'
              }`}
            >
              ₹{r}
            </button>
          ))}
        </div>
      </div>

      {/* Working Hours Display & Auto Calculation Card */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-[#1F5E3B] flex items-center justify-between">
          <span>Working Hours & Billing Summary</span>
          {startTime && endTime && (
            <span className="text-[11px] font-bold text-gray-600 font-timer">
              {startTime} ➔ {endTime}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
          {/* Working Hours (Calculated using Start Time and End Time) */}
          <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
            <div className="text-[10px] uppercase font-bold text-gray-500">Working Hours</div>
            <div className="text-base sm:text-lg font-black text-[#1F5E3B] font-timer mt-0.5">
              {workingHours} Hours
            </div>
            <div className="text-[10px] text-gray-500 font-medium">
              {durationSeconds > 0 ? `${workingHoursFormatted} (${workingMinutes}m)` : '0 mins'}
            </div>
          </div>

          {/* Agreed Rate */}
          <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
            <div className="text-[10px] uppercase font-bold text-gray-500">Agreed Rate</div>
            <div className="text-base sm:text-lg font-black text-gray-900 font-timer mt-0.5">
              ₹{numRate}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">Per Minute</div>
          </div>

          {/* Gross Work Amount */}
          <div className="bg-white p-2.5 rounded-xl border border-emerald-200 col-span-2 sm:col-span-1">
            <div className="text-[10px] uppercase font-bold text-gray-500">Total Work Amount</div>
            <div className="text-base sm:text-lg font-black text-[#1F5E3B] font-timer mt-0.5">
              {formatCurrency(workAmount)}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">
              {workingMinutes}m × ₹{numRate}
            </div>
          </div>
        </div>
      </div>

      {/* Deduct Expenses */}
      <div className="space-y-2 border-t border-[#E2E2DC] pt-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-700">Operational Expenses (₹):</span>
          <span className="text-xs font-bold text-amber-800 font-timer">
            Total Exp: {formatCurrency(totalExpenses)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <label className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
              <Fuel className="w-3 h-3 text-amber-700" /> Diesel (₹)
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={expenses.diesel === 0 ? '0' : (expenses.diesel || '')}
              onFocus={(e) => {
                if (e.target.value === '0') e.target.select();
              }}
              onChange={(e) => handleExpenseChange('diesel', e.target.value)}
              className="w-full bg-[#F7F7F5] border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold font-timer focus:bg-white focus:border-[#1F5E3B] outline-none mt-0.5"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-blue-700" /> Driver (₹)
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={expenses.driver === 0 ? '0' : (expenses.driver || '')}
              onFocus={(e) => {
                if (e.target.value === '0') e.target.select();
              }}
              onChange={(e) => handleExpenseChange('driver', e.target.value)}
              className="w-full bg-[#F7F7F5] border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold font-timer focus:bg-white focus:border-[#1F5E3B] outline-none mt-0.5"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
              <Utensils className="w-3 h-3 text-orange-700" /> Food (₹)
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={expenses.food === 0 ? '0' : (expenses.food || '')}
              onFocus={(e) => {
                if (e.target.value === '0') e.target.select();
              }}
              onChange={(e) => handleExpenseChange('food', e.target.value)}
              className="w-full bg-[#F7F7F5] border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold font-timer focus:bg-white focus:border-[#1F5E3B] outline-none mt-0.5"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
              <MoreHorizontal className="w-3 h-3 text-gray-700" /> Other (₹)
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={expenses.other === 0 ? '0' : (expenses.other || '')}
              onFocus={(e) => {
                if (e.target.value === '0') e.target.select();
              }}
              onChange={(e) => handleExpenseChange('other', e.target.value)}
              className="w-full bg-[#F7F7F5] border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold font-timer focus:bg-white focus:border-[#1F5E3B] outline-none mt-0.5"
            />
          </div>
        </div>
      </div>

      {/* Net Earnings Highlight Box */}
      <div className="bg-[#1F5E3B] text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
        <div>
          <div className="text-[11px] uppercase font-bold text-emerald-200">
            Net Operator Earnings
          </div>
          <div className="text-xs text-emerald-100">
            Work ({formatCurrency(workAmount)}) - Exp ({formatCurrency(totalExpenses)})
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black font-timer text-white">
          {formatCurrency(netEarnings)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
        <button
          onClick={handleSaveAndDownloadPDF}
          disabled={durationSeconds <= 0}
          className={`btn-primary flex-1 py-3.5 text-sm sm:text-base ${
            durationSeconds <= 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Download className="w-5 h-5" /> Download PDF Bill & Save
        </button>

        <button
          onClick={handleSaveOnly}
          disabled={durationSeconds <= 0}
          className={`btn-outline flex-1 py-3.5 text-sm sm:text-base ${
            durationSeconds <= 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Save className="w-5 h-5" /> Save to History Only
        </button>
      </div>
    </div>
  );
}
