import React, { useState } from 'react';
import { CheckCircle2, Download, Save, X, Clock, IndianRupee, Fuel, UserCheck, Utensils, MoreHorizontal, XCircle, AlertTriangle } from 'lucide-react';
import { calculateWorkAmount, calculateTotalExpenses, calculateNetEarnings, formatCurrency, formatDuration, formatDate, formatTime } from '../utils/calculations';
import { generateCustomerBillPDF } from '../utils/pdfGenerator';
import { playClickFeedback } from '../utils/timer';

export default function CompleteJobModal({
  customer,
  jobData,
  onSave,
  onClose,
  onCancel,
}) {
  const [expenses, setExpenses] = useState(
    customer?.expenses || { diesel: 0, driver: 0, food: 0, other: 0 }
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const durationSeconds = jobData?.durationSeconds || 0;
  const ratePerMinute = Number(customer?.ratePerMinute) || 0;
  const workAmount = calculateWorkAmount(ratePerMinute, durationSeconds);
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

  const buildFinalRecord = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    return {
      id: `TRAC-${todayStr.replace(/-/g, '')}-${String(timestamp).slice(-4)}`,
      customerName: customer?.customerName || 'Customer',
      mobileNumber: customer?.mobileNumber || '',
      address: customer?.address || '',
      location: customer?.location || customer?.address || '',
      workDescription: customer?.workDescription || 'Agricultural Tractor Operation',
      ratePerMinute,
      timerMode: customer?.timerMode || 'stopwatch',
      durationMinutesPreset: customer?.durationMinutesPreset || null,
      startTime: jobData?.startTime || new Date(Date.now() - durationSeconds * 1000).toISOString(),
      endTime: jobData?.endTime || new Date().toISOString(),
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
    const finalRecord = buildFinalRecord();
    onSave(finalRecord, false);
  };

  const handleSaveAndPDF = () => {
    playClickFeedback();
    const finalRecord = buildFinalRecord();
    generateCustomerBillPDF(finalRecord);
    onSave(finalRecord, true);
  };

  const handleConfirmCancel = () => {
    playClickFeedback();
    setShowCancelConfirm(false);
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#1F5E3B] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight">Job Completed!</h3>
              <p className="text-xs text-emerald-100">Review work summary and generate bill</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-sm">
          {/* Customer & Field Info */}
          <div className="bg-[#F7F7F5] border border-[#E2E2DC] rounded-2xl p-3.5 space-y-1">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500">Customer</span>
                <div className="font-bold text-gray-900 text-base">{customer?.customerName}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gray-500">Mobile</span>
                <div className="font-bold text-[#1F5E3B]">{customer?.mobileNumber || 'N/A'}</div>
              </div>
            </div>
            <div className="text-xs text-gray-600 pt-1 border-t border-gray-200">
              <strong>Location:</strong> {customer?.location || customer?.address || 'N/A'}
            </div>
          </div>

          {/* Time & Work Amount Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card-base bg-emerald-50/50 border-emerald-200 p-3">
              <div className="text-[10px] uppercase font-bold text-gray-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#1F5E3B]" /> Working Time
              </div>
              <div className="text-lg font-black text-[#1F5E3B] font-timer mt-1">
                {formatDuration(durationSeconds, 'short')}
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                {Math.round((durationSeconds / 60) * 10) / 10} Total Minutes
              </div>
            </div>

            <div className="card-base bg-emerald-50/50 border-emerald-200 p-3">
              <div className="text-[10px] uppercase font-bold text-gray-600 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-[#1F5E3B]" /> Work Amount
              </div>
              <div className="text-lg font-black text-[#1F5E3B] font-timer mt-1">
                {formatCurrency(workAmount)}
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                @ ₹{ratePerMinute} / min
              </div>
            </div>
          </div>

          {/* Quick Expense Adjustments */}
          <div className="space-y-2 border-t border-[#E2E2DC] pt-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700">Deduct Job Expenses (₹):</span>
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

          {/* Final Net Summary Banner */}
          <div className="bg-[#1F5E3B] text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
            <div>
              <div className="text-[11px] uppercase font-bold text-emerald-200">
                Operator Net Earnings
              </div>
              <div className="text-xs text-emerald-100 mt-0.5">
                Work ({formatCurrency(workAmount)}) - Exp ({formatCurrency(totalExpenses)})
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-timer text-white">
              {formatCurrency(netEarnings)}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleSaveAndPDF}
              className="btn-primary flex-1 py-3.5 text-sm"
            >
              <Download className="w-4 h-4" /> Download PDF Bill
            </button>
            <button
              onClick={handleSaveOnly}
              className="btn-outline flex-1 py-3.5 text-sm"
            >
              <Save className="w-4 h-4" /> Save Record Only
            </button>
          </div>

          {/* Cancel / Don't Save Button */}
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors border border-red-200"
          >
            <XCircle className="w-4 h-4 text-red-600" /> Cancel / Don’t Save
          </button>
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/75 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="text-base font-bold text-red-700">Discard Completed Work?</h4>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to completely discard this completed work? It will <strong>NOT</strong> be saved to History, Today’s Jobs, Queue, or PDF.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Keep Record
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-red-700 text-white font-bold hover:bg-red-800"
              >
                Discard & Don’t Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
