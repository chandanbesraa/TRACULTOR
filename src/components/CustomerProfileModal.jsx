import React, { useState, useMemo } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  IndianRupee,
  Calendar,
  Clock,
  PlusCircle,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  FileText,
  Save,
  Download,
  Receipt,
  History,
  Briefcase
} from 'lucide-react';
import {
  formatCurrency,
  formatDuration,
  formatDate,
  formatTime,
  formatDateInput,
  formatTimeInput,
  formatDateToDDMMYYYY,
  formatTimeToHHMMSS,
  calculateCustomerBalance
} from '../utils/calculations';
import { generateCustomerBillPDF } from '../utils/pdfGenerator';
import { playClickFeedback } from '../utils/timer';

export default function CustomerProfileModal({
  customer,
  completedRecords = [],
  payments = [],
  onClose,
  onSavePayment,
  onUpdatePayment,
  onDeletePayment,
  onUpdateCustomer,
}) {
  const [activeSubTab, setActiveSubTab] = useState('payments'); // 'payments' | 'jobs'
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  // Edit Customer State
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editName, setEditName] = useState(customer?.customerName || '');
  const [editPhone, setEditPhone] = useState(customer?.mobileNumber || '');
  const [editAddress, setEditAddress] = useState(customer?.address || customer?.location || '');
  const [editRate, setEditRate] = useState(customer?.ratePerMinute !== undefined ? String(customer.ratePerMinute) : '100');

  // Payment Form State (for both Add and Edit)
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(formatDateToDDMMYYYY(new Date()));
  const [payTime, setPayTime] = useState(formatTimeToHHMMSS(new Date()));
  const [payMode, setPayMode] = useState('Cash');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState('');

  // Calculate Balance: Total Amount, Paid Amount, Pending Amount = Total - Paid
  const {
    totalAmount,
    paidAmount,
    pendingAmount,
    netPendingRaw,
    customerJobs,
    paymentHistory
  } = useMemo(() => {
    return calculateCustomerBalance(customer, completedRecords, payments);
  }, [customer, completedRecords, payments]);

  if (!customer) return null;

  // Open Add Payment Form
  const handleOpenAddPayment = () => {
    playClickFeedback();
    setEditingPayment(null);
    setPayAmount(pendingAmount > 0 ? String(pendingAmount) : '');
    setPayDate(formatDateToDDMMYYYY(new Date()));
    setPayTime(formatTimeToHHMMSS(new Date()));
    setPayMode('Cash');
    setPayNotes('');
    setPayError('');
    setShowAddPaymentModal(true);
  };

  // Open Edit Payment Form
  const handleOpenEditPayment = (payment) => {
    playClickFeedback();
    setEditingPayment(payment);
    setPayAmount(String(payment.amount || ''));
    setPayDate(payment.date ? (payment.date.includes('-') ? formatDateToDDMMYYYY(new Date(payment.date)) : payment.date) : formatDateToDDMMYYYY(new Date()));
    setPayTime(payment.time || formatTimeToHHMMSS(new Date()));
    setPayMode(payment.paymentMode || 'Cash');
    setPayNotes(payment.notes || '');
    setPayError('');
    setShowAddPaymentModal(true);
  };

  // Submit Add / Edit Payment
  const handleSavePaymentForm = (e) => {
    e.preventDefault();
    const numAmount = Number(payAmount);
    if (!payAmount || isNaN(numAmount) || numAmount <= 0) {
      setPayError('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    playClickFeedback();

    if (editingPayment) {
      // Update existing payment
      const updated = {
        ...editingPayment,
        amount: numAmount,
        date: payDate,
        time: payTime,
        paymentMode: payMode,
        notes: payNotes.trim(),
        timestamp: new Date().toISOString(),
      };
      if (onUpdatePayment) onUpdatePayment(updated);
    } else {
      // Add new payment
      const newPayment = {
        id: `PAY-${Date.now().toString().slice(-6)}`,
        customerId: customer.id,
        customerName: customer.customerName,
        mobileNumber: customer.mobileNumber || '',
        amount: numAmount,
        date: payDate,
        time: payTime,
        timestamp: new Date().toISOString(),
        paymentMode: payMode,
        notes: payNotes.trim(),
        createdAt: new Date().toISOString(),
      };
      if (onSavePayment) onSavePayment(newPayment);
    }

    setShowAddPaymentModal(false);
    setEditingPayment(null);
  };

  // Confirm Delete Payment
  const handleConfirmDeletePayment = () => {
    if (paymentToDelete && onDeletePayment) {
      playClickFeedback();
      onDeletePayment(paymentToDelete.id);
      setPaymentToDelete(null);
    }
  };

  // Save Customer Details Edit
  const handleSaveCustomerEdit = (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    playClickFeedback();

    const updatedCust = {
      ...customer,
      customerName: editName.trim(),
      mobileNumber: editPhone.trim(),
      address: editAddress.trim(),
      location: editAddress.trim(),
      ratePerMinute: Number(editRate) || 100,
    };

    if (onUpdateCustomer) onUpdateCustomer(updatedCust);
    setIsEditingCustomer(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#F7F7F5] rounded-3xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#1F5E3B] text-white px-5 py-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-lg text-white shadow-inner">
              {customer.customerName ? customer.customerName.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-200">
                Customer Profile & Ledger
              </div>
              <h3 className="text-base sm:text-lg font-black leading-tight text-white">
                {customer.customerName}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsEditingCustomer(!isEditingCustomer)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-colors"
              title="Edit customer info"
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">{isEditingCustomer ? 'Cancel' : 'Edit'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Customer Details Edit Form if toggled */}
          {isEditingCustomer ? (
            <form onSubmit={handleSaveCustomerEdit} className="bg-white border-2 border-[#1F5E3B]/30 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Edit Customer Details</span>
                <button
                  type="submit"
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#F7F7F5] border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold text-gray-900 outline-none focus:border-[#1F5E3B]"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-[#F7F7F5] border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold text-gray-900 outline-none focus:border-[#1F5E3B]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Address / Location</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full bg-[#F7F7F5] border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold text-gray-900 outline-none focus:border-[#1F5E3B]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Default Rate (₹/min)</label>
                  <input
                    type="number"
                    value={editRate}
                    onChange={(e) => setEditRate(e.target.value)}
                    className="w-full bg-[#F7F7F5] border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold text-gray-900 outline-none focus:border-[#1F5E3B]"
                  />
                </div>
              </div>
            </form>
          ) : (
            /* Compact Info Bar */
            <div className="bg-white rounded-2xl p-3.5 border border-[#E2E2DC] shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1F5E3B] flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Mobile</span>
                  {customer.mobileNumber ? (
                    <a href={`tel:${customer.mobileNumber}`} className="font-bold text-[#1F5E3B] hover:underline">
                      {customer.mobileNumber}
                    </a>
                  ) : (
                    <span className="text-gray-500 italic">Not Provided</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1F5E3B] flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Location</span>
                  <span className="font-bold text-gray-800">{customer.address || customer.location || 'Field Work'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1F5E3B] flex items-center justify-center shrink-0">
                  <IndianRupee className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Rate</span>
                  <span className="font-bold text-gray-800">₹{customer.ratePerMinute || 100}/min</span>
                </div>
              </div>
            </div>
          )}

          {/* 3 Core Financial Balance Cards (Total Amount, Paid Amount, Pending Amount) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Total Amount */}
            <div className="bg-white rounded-2xl p-3 border border-emerald-100 shadow-xs flex flex-col justify-between">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Total Amount
              </div>
              <div className="text-base sm:text-xl font-black text-gray-900 font-timer mt-1 truncate">
                {formatCurrency(totalAmount)}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {customerJobs.length} {customerJobs.length === 1 ? 'Job' : 'Jobs'} Done
              </div>
            </div>

            {/* Paid Amount */}
            <div className="bg-white rounded-2xl p-3 border border-blue-100 shadow-xs flex flex-col justify-between">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Paid Amount
              </div>
              <div className="text-base sm:text-xl font-black text-blue-700 font-timer mt-1 truncate">
                {formatCurrency(paidAmount)}
              </div>
              <div className="text-[10px] text-blue-500 mt-0.5">
                {paymentHistory.length} {paymentHistory.length === 1 ? 'Payment' : 'Payments'}
              </div>
            </div>

            {/* Pending Amount = Total - Paid */}
            <div className={`rounded-2xl p-3 border shadow-xs flex flex-col justify-between ${
              pendingAmount > 0
                ? 'bg-red-50/80 border-red-200'
                : 'bg-emerald-50/80 border-emerald-200'
            }`}>
              <div className={`text-[10px] font-bold uppercase tracking-wider ${
                pendingAmount > 0 ? 'text-red-700' : 'text-emerald-700'
              }`}>
                Pending Balance
              </div>
              <div className={`text-base sm:text-xl font-black font-timer mt-1 truncate ${
                pendingAmount > 0 ? 'text-red-700' : 'text-emerald-700'
              }`}>
                {formatCurrency(pendingAmount)}
              </div>
              <div className={`text-[10px] font-bold mt-0.5 ${
                pendingAmount > 0 ? 'text-red-500' : 'text-emerald-600'
              }`}>
                {pendingAmount > 0 ? 'Due for Payment' : 'Fully Settled ✓'}
              </div>
            </div>
          </div>

          {/* Action Row: + Record Payment Button */}
          <div className="flex items-center justify-between pt-1">
            {/* Tab Switches */}
            <div className="flex items-center bg-white border border-[#E2E2DC] rounded-xl p-1 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  playClickFeedback();
                  setActiveSubTab('payments');
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'payments'
                    ? 'bg-[#1F5E3B] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Payments ({paymentHistory.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickFeedback();
                  setActiveSubTab('jobs');
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'jobs'
                    ? 'bg-[#1F5E3B] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Work Jobs ({customerJobs.length})</span>
              </button>
            </div>

            {/* + Add Payment Button */}
            <button
              onClick={handleOpenAddPayment}
              className="btn-primary text-xs py-2 px-3 sm:px-4 shadow-sm flex items-center gap-1.5 bg-[#1F5E3B] hover:bg-[#16452B]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          </div>

          {/* Sub-tab 1: Payment History List */}
          {activeSubTab === 'payments' && (
            <div className="space-y-2.5">
              {paymentHistory.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-300">
                  <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-gray-700">No Payments Recorded Yet</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    Click the <strong>Record Payment</strong> button above to add cash, UPI, or bank payments for this customer.
                  </p>
                  <button
                    onClick={handleOpenAddPayment}
                    className="mt-3 btn-secondary text-xs py-1.5 px-3 mx-auto"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Record First Payment
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentHistory.map((payment) => (
                    <div
                      key={payment.id}
                      className="bg-white rounded-2xl p-3.5 border border-[#E2E2DC] shadow-xs flex items-center justify-between gap-3 hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#1F5E3B] flex items-center justify-center shrink-0 mt-0.5">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">
                              {payment.date || 'Payment'}
                            </span>
                            {payment.time && (
                              <span className="text-[10px] text-gray-400 font-mono">
                                {payment.time}
                              </span>
                            )}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-[#1F5E3B] border border-emerald-200">
                              {payment.paymentMode || 'Cash'}
                            </span>
                          </div>
                          {payment.notes && (
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-1 italic">
                              "{payment.notes}"
                            </p>
                          )}
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Ref: #{payment.id}
                          </div>
                        </div>
                      </div>

                      {/* Amount & Actions */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-base font-black text-[#1F5E3B] font-timer">
                            +{formatCurrency(payment.amount)}
                          </div>
                          <span className="text-[10px] text-emerald-600 font-bold">Received</span>
                        </div>

                        <div className="flex items-center gap-1 border-l border-gray-100 pl-2">
                          <button
                            onClick={() => handleOpenEditPayment(payment)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            title="Edit Payment"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPaymentToDelete(payment)}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Delete Payment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 2: Work / Job Records List */}
          {activeSubTab === 'jobs' && (
            <div className="space-y-2.5">
              {customerJobs.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-300">
                  <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-gray-700">No Completed Jobs Yet</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Completed tractor work sessions for this customer will appear here with calculated amounts.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {customerJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white rounded-2xl p-3.5 border border-[#E2E2DC] shadow-xs flex items-center justify-between gap-3 hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">
                              {job.date ? formatDate(job.date) : 'Job Record'}
                            </span>
                            <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {formatDuration(job.durationSeconds, 'short')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                            {job.workDescription || 'Agricultural Tractor Operation'}
                          </p>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Rate: ₹{job.ratePerMinute}/min
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="text-right">
                          <div className="text-base font-black text-gray-900 font-timer">
                            {formatCurrency(job.workAmount)}
                          </div>
                          <span className="text-[10px] text-gray-400">Billed</span>
                        </div>
                        <button
                          onClick={() => generateCustomerBillPDF(job)}
                          className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                          title="Download PDF Bill"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-5 py-3.5 border-t border-[#E2E2DC] flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500 font-semibold">
            {paymentHistory.length} Payments &bull; {customerJobs.length} Jobs
          </div>
          <button
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-5 font-bold"
          >
            Close
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ADD / EDIT PAYMENT MODAL POPUP */}
      {/* ========================================================= */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="bg-[#1F5E3B] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                <h4 className="text-base font-black">
                  {editingPayment ? 'Edit Payment' : 'Record Payment'}
                </h4>
              </div>
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePaymentForm} className="p-5 space-y-4 text-xs">
              {payError && (
                <div className="bg-red-50 border border-red-200 text-red-700 font-bold p-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{payError}</span>
                </div>
              )}

              {/* Amount Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 text-xs">Payment Amount (₹) *</label>
                  {pendingAmount > 0 && !editingPayment && (
                    <button
                      type="button"
                      onClick={() => setPayAmount(String(pendingAmount))}
                      className="text-[11px] font-bold text-[#1F5E3B] hover:underline"
                    >
                      Fill Full Pending (₹{pendingAmount})
                    </button>
                  )}
                </div>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 1500"
                    value={payAmount}
                    onChange={(e) => {
                      setPayAmount(e.target.value);
                      setPayError('');
                    }}
                    autoFocus
                    className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-base font-black font-timer text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
                    required
                  />
                </div>
              </div>

              {/* Date & Time typing fields with auto-delimiters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-800 text-[11px]">Date (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="DD/MM/YYYY"
                    value={payDate}
                    onChange={(e) => setPayDate(formatDateInput(e.target.value, payDate))}
                    className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-800 text-[11px]">Time (HH:MM:SS)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="HH:MM:SS"
                    value={payTime}
                    onChange={(e) => setPayTime(formatTimeInput(e.target.value, payTime))}
                    className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div className="space-y-1">
                <label className="font-bold text-gray-800 text-[11px]">Payment Mode</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPayMode(mode)}
                      className={`py-2 px-2 rounded-xl font-bold text-[11px] border transition-all ${
                        payMode === mode
                          ? 'bg-[#1F5E3B] text-white border-[#1F5E3B] shadow-xs'
                          : 'bg-[#F7F7F5] text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes / Remarks */}
              <div className="space-y-1">
                <label className="font-bold text-gray-800 text-[11px]">Notes / Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Received via PhonePe / Advance for Rotavator"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="btn-secondary flex-1 text-xs py-2.5 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 text-xs py-2.5 font-bold flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingPayment ? 'Update Payment' : 'Save Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE PAYMENT CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {paymentToDelete && (
        <div className="fixed inset-0 bg-black/75 z-70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-red-200 text-center space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-gray-900">Delete Payment Record?</h4>
              <p className="text-xs text-gray-600 mt-1">
                Are you sure you want to delete this payment of <strong>₹{paymentToDelete.amount}</strong> from <strong>{paymentToDelete.date}</strong>?
              </p>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">
                The customer's Pending Balance will be updated automatically.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaymentToDelete(null)}
                className="btn-secondary flex-1 text-xs py-2.5 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeletePayment}
                className="btn-danger flex-1 text-xs py-2.5 font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
