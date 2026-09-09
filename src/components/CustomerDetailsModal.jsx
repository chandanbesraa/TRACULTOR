import React, { useState } from 'react';
import { X, Download, Trash2, Calendar, Clock, MapPin, Phone, IndianRupee, FileText, CheckCircle2, Fuel, UserCheck, Utensils, MoreHorizontal, Edit3, Save, Receipt } from 'lucide-react';
import { formatCurrency, formatDuration, formatDate, formatTime, calculateTotalExpenses, calculateNetEarnings } from '../utils/calculations';
import { generateCustomerBillPDF } from '../utils/pdfGenerator';

export default function CustomerDetailsModal({
  record,
  onClose,
  onDelete,
  onUpdateRecord,
  onOpenCustomerProfile,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [customerName, setCustomerName] = useState(record?.customerName || '');
  const [mobileNumber, setMobileNumber] = useState(record?.mobileNumber || '');
  const [location, setLocation] = useState(record?.location || '');
  const [workDescription, setWorkDescription] = useState(record?.workDescription || '');
  const [expenses, setExpenses] = useState(record?.expenses || { diesel: 0, driver: 0, food: 0, other: 0 });

  if (!record) return null;

  const actualDurationMinutes = Math.round(((record.durationSeconds || 0) / 60) * 10) / 10;

  const handleDownload = () => {
    generateCustomerBillPDF(record);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(record.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const handleExpenseEditChange = (field, valStr) => {
    if (valStr === '' || valStr === undefined) {
      setExpenses((prev) => ({ ...prev, [field]: 0 }));
      return;
    }
    const sanitized = String(valStr).replace(/^0+(?=\d)/, '');
    const num = Math.max(0, Number(sanitized) || 0);
    setExpenses((prev) => ({ ...prev, [field]: num }));
  };

  const handleSaveEdit = () => {
    const totalExp = calculateTotalExpenses(expenses);
    const net = calculateNetEarnings(record.workAmount, totalExp);

    const updated = {
      ...record,
      customerName: customerName.trim() || record.customerName,
      mobileNumber: mobileNumber.trim(),
      location: location.trim() || record.location,
      workDescription: workDescription.trim() || record.workDescription,
      expenses,
      totalExpenses: totalExp,
      netEarnings: net,
    };

    if (onUpdateRecord) {
      onUpdateRecord(updated);
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1F5E3B] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight">Job Record Details</h3>
              <p className="text-xs text-emerald-100">Ref: #{record.id || 'TRAC-RECORD'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-colors"
              title="Edit record details"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditing ? 'Cancel' : 'Edit'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-sm">
          {/* Customer Overview */}
          <div className="bg-[#F7F7F5] border border-[#E2E2DC] rounded-2xl p-4 space-y-2">
            {!isEditing ? (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500">Customer</span>
                    <h4 className="text-lg font-black text-gray-900 leading-snug">
                      {record.customerName}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {onOpenCustomerProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenCustomerProfile({
                            id: record.customerId || record.id,
                            customerName: record.customerName,
                            mobileNumber: record.mobileNumber,
                            address: record.address,
                            location: record.location,
                            ratePerMinute: record.ratePerMinute,
                          });
                        }}
                        className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 text-[#1F5E3B]"
                        title="View full customer profile and payments"
                      >
                        <IndianRupee className="w-3.5 h-3.5" /> Ledger / Profile
                      </button>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-[#1F5E3B]">
                      <CheckCircle2 className="w-3 h-3" /> Completed
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-200 text-xs text-gray-700">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#1F5E3B]" />
                    <a href={`tel:${record.mobileNumber}`} className="font-bold text-[#1F5E3B] hover:underline">
                      {record.mobileNumber || 'N/A'}
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <span className="font-semibold">{formatDate(record.date || record.createdAt)}</span>
                  </div>
                  <div className="flex items-start gap-1.5 sm:col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-[#1F5E3B] mt-0.5 shrink-0" />
                    <span>
                      <strong>Field:</strong> {record.location || record.address || 'Not specified'}
                    </span>
                  </div>
                </div>

                {record.workDescription && (
                  <div className="text-xs text-gray-600 bg-white p-2.5 rounded-xl border border-gray-200">
                    <strong>Work Done:</strong> {record.workDescription}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-600">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold text-sm text-gray-900 outline-none focus:border-[#1F5E3B]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-600">Mobile</label>
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-900 outline-none focus:border-[#1F5E3B]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-600">Field Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-[#1F5E3B]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-600">Work Description</label>
                  <input
                    type="text"
                    value={workDescription}
                    onChange={(e) => setWorkDescription(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-[#1F5E3B]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Time & Rates */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl">
              <div className="text-[10px] uppercase font-bold text-gray-500">Duration</div>
              <div className="text-base font-black text-[#1F5E3B] font-timer mt-0.5">
                {formatDuration(record.durationSeconds, 'short')}
              </div>
              <div className="text-[10px] text-gray-500">({actualDurationMinutes} mins)</div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl">
              <div className="text-[10px] uppercase font-bold text-gray-500">Rate / Min</div>
              <div className="text-base font-black text-gray-900 font-timer mt-0.5">
                ₹{record.ratePerMinute}
              </div>
              <div className="text-[10px] text-gray-500">Agreed Rate</div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl col-span-2 sm:col-span-1">
              <div className="text-[10px] uppercase font-bold text-gray-500">Total Income</div>
              <div className="text-base font-black text-[#1F5E3B] font-timer mt-0.5">
                {formatCurrency(record.workAmount)}
              </div>
              <div className="text-[10px] text-gray-500">Gross Bill</div>
            </div>
          </div>

          {/* Time stamps */}
          <div className="flex justify-between text-xs text-gray-600 px-1">
            <span>
              <strong>Start:</strong> {record.startTime ? formatTime(record.startTime) : '--'}
            </span>
            <span>
              <strong>End:</strong> {record.endTime ? formatTime(record.endTime) : '--'}
            </span>
          </div>

          {/* Expenses Breakdown */}
          <div className="border border-gray-200 rounded-2xl p-3.5 bg-amber-50/30 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-gray-800">
              <span>Job Expenses:</span>
              <span className="text-amber-900 font-timer">
                {formatCurrency(calculateTotalExpenses(isEditing ? expenses : record.expenses))}
              </span>
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                <div className="bg-white p-2 rounded-lg border border-amber-200">
                  <div className="text-[10px] text-gray-500">Diesel</div>
                  <div className="font-bold font-timer">{formatCurrency(record.expenses?.diesel || 0)}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-amber-200">
                  <div className="text-[10px] text-gray-500">Driver</div>
                  <div className="font-bold font-timer">{formatCurrency(record.expenses?.driver || 0)}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-amber-200">
                  <div className="text-[10px] text-gray-500">Food</div>
                  <div className="font-bold font-timer">{formatCurrency(record.expenses?.food || 0)}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-amber-200">
                  <div className="text-[10px] text-gray-500">Other</div>
                  <div className="font-bold font-timer">{formatCurrency(record.expenses?.other || 0)}</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 font-bold">Diesel (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={expenses.diesel === 0 ? '0' : (expenses.diesel || '')}
                    onFocus={(e) => {
                      if (e.target.value === '0') e.target.select();
                    }}
                    onChange={(e) => handleExpenseEditChange('diesel', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded p-1 text-xs font-bold font-timer outline-none focus:border-[#1F5E3B]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold">Driver (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={expenses.driver === 0 ? '0' : (expenses.driver || '')}
                    onFocus={(e) => {
                      if (e.target.value === '0') e.target.select();
                    }}
                    onChange={(e) => handleExpenseEditChange('driver', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded p-1 text-xs font-bold font-timer outline-none focus:border-[#1F5E3B]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold">Food (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={expenses.food === 0 ? '0' : (expenses.food || '')}
                    onFocus={(e) => {
                      if (e.target.value === '0') e.target.select();
                    }}
                    onChange={(e) => handleExpenseEditChange('food', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded p-1 text-xs font-bold font-timer outline-none focus:border-[#1F5E3B]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold">Other (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={expenses.other === 0 ? '0' : (expenses.other || '')}
                    onFocus={(e) => {
                      if (e.target.value === '0') e.target.select();
                    }}
                    onChange={(e) => handleExpenseEditChange('other', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded p-1 text-xs font-bold font-timer outline-none focus:border-[#1F5E3B]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Net Earnings Banner */}
          <div className="bg-[#1F5E3B] text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
            <div>
              <div className="text-[11px] uppercase font-bold text-emerald-200">
                Net Operator Earnings
              </div>
              <div className="text-xs text-emerald-100">
                Total Income - Total Expenses
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-timer text-white">
              {formatCurrency(
                isEditing
                  ? calculateNetEarnings(record.workAmount, calculateTotalExpenses(expenses))
                  : record.netEarnings
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold text-xs flex items-center gap-1"
            title="Delete this record"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>

          <div className="flex gap-2">
            {isEditing ? (
              <button
                onClick={handleSaveEdit}
                className="btn-primary py-2.5 px-5 text-sm"
              >
                <Save className="w-4 h-4" /> Save Record
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 text-sm"
                >
                  Close
                </button>
                <button
                  onClick={handleDownload}
                  className="btn-primary py-2.5 px-5 text-sm"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200">
            <h4 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Job Record?
            </h4>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete the record for <strong>{record.customerName}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-700 text-white font-bold hover:bg-red-800"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
