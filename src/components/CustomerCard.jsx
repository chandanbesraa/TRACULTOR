import React, { useMemo } from 'react';
import { User, Phone, MapPin, Wrench, IndianRupee, Clock, ChevronDown, CheckCircle2, Edit3, Calendar, Receipt, UserCheck } from 'lucide-react';
import { formatCurrency, calculateCustomerBalance } from '../utils/calculations';

export default function CustomerCard({
  customer,
  allCustomers = [],
  completedRecords = [],
  payments = [],
  onSelectCustomer,
  onEditCustomer,
  onOpenCustomerProfile,
}) {
  if (!customer) {
    return (
      <div className="card-base text-center py-8">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <h3 className="text-base font-bold text-gray-700">No Active Customer Selected</h3>
        <p className="text-xs text-gray-500 mt-1">
          Add a new customer or select from the queue below to start tractor work.
        </p>
      </div>
    );
  }

  const modeLabel = customer.timerMode === 'countdown'
    ? `Count Down (${customer.durationMinutesPreset || 20}m)`
    : customer.timerMode === 'manual'
    ? 'Manual Entry'
    : 'Stopwatch';

  // Calculate live customer financial balance: Total Amount, Paid Amount, Pending Amount
  const { totalAmount, paidAmount, pendingAmount, customerJobs, paymentHistory } = useMemo(() => {
    return calculateCustomerBalance(customer, completedRecords, payments);
  }, [customer, completedRecords, payments]);

  return (
    <div className="card-base border-2 border-[#1F5E3B]/30 bg-white relative overflow-hidden space-y-3">
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E2DC]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1F5E3B] text-white flex items-center justify-center font-black text-sm">
            {customer.customerName ? customer.customerName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Active Customer
            </span>
            <h2 className="text-lg sm:text-xl font-black text-[#1A1A1A] leading-tight">
              {customer.customerName}
            </h2>
          </div>
        </div>

        {/* Action button & Customer Selector */}
        <div className="flex items-center gap-1.5">
          {onOpenCustomerProfile && (
            <button
              onClick={() => onOpenCustomerProfile(customer)}
              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1F5E3B] text-xs font-bold flex items-center gap-1 border border-emerald-200 shadow-xs"
              title="View Customer Profile & Payments"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span className="text-[11px]">Ledger</span>
            </button>
          )}

          {onEditCustomer && (
            <button
              onClick={() => onEditCustomer(customer)}
              className="p-1.5 rounded-lg bg-[#F7F7F5] hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1 border border-gray-200"
              title="Edit customer details"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}

          {allCustomers.length > 1 && (
            <div className="relative">
              <select
                value={customer.id}
                onChange={(e) => onSelectCustomer(e.target.value)}
                className="text-xs font-bold bg-[#F7F7F5] border border-gray-300 rounded-lg px-2 py-1.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1F5E3B] cursor-pointer"
              >
                {allCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerName} ({c.status === 'in_progress' ? 'Active' : 'Queue'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Customer Financial Summary Bar (Total, Paid, Pending Balance) */}
      <div
        onClick={() => onOpenCustomerProfile && onOpenCustomerProfile(customer)}
        className="bg-[#F7F7F5] rounded-xl p-2.5 border border-[#E2E2DC] hover:border-emerald-300 cursor-pointer transition-colors flex items-center justify-between gap-2 text-xs"
        title="Click to manage payments & full profile"
      >
        <div className="flex-1 text-center border-r border-gray-200 pr-1">
          <span className="text-[9px] uppercase font-bold text-gray-500 block">Total Work</span>
          <span className="font-black text-gray-900 font-timer text-xs sm:text-sm">
            {formatCurrency(totalAmount)}
          </span>
        </div>
        <div className="flex-1 text-center border-r border-gray-200 pr-1">
          <span className="text-[9px] uppercase font-bold text-blue-600 block">Paid</span>
          <span className="font-black text-blue-700 font-timer text-xs sm:text-sm">
            {formatCurrency(paidAmount)}
          </span>
        </div>
        <div className="flex-1 text-center">
          <span className={`text-[9px] uppercase font-bold block ${pendingAmount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
            Pending
          </span>
          <span className={`font-black font-timer text-xs sm:text-sm ${pendingAmount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {formatCurrency(pendingAmount)}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-1 text-sm">
        {/* Mobile Number with Direct Call Action */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-emerald-50 text-[#1F5E3B] flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Mobile Number</div>
            <a
              href={`tel:${customer.mobileNumber}`}
              className="font-bold text-[#1F5E3B] hover:underline text-xs sm:text-sm"
            >
              {customer.mobileNumber || 'Not Provided'}
            </a>
          </div>
        </div>

        {/* Rate Per Minute */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-emerald-50 text-[#1F5E3B] flex items-center justify-center shrink-0">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase">Agreed Rate</div>
            <div className="font-black text-[#1A1A1A] font-timer text-xs sm:text-sm">
              ₹{customer.ratePerMinute} <span className="text-xs font-normal text-gray-600">/ min</span>
            </div>
          </div>
        </div>

        {/* Work Location */}
        <div className="flex items-start gap-2 sm:col-span-2">
          <div className="w-7 h-7 rounded-md bg-emerald-50 text-[#1F5E3B] flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Field / Location</div>
            <div className="font-semibold text-gray-900 truncate text-xs">
              {customer.location || customer.address || 'Field Location Not Specified'}
            </div>
          </div>
        </div>

        {/* Work Description */}
        <div className="flex items-start gap-2 sm:col-span-2">
          <div className="w-7 h-7 rounded-md bg-emerald-50 text-[#1F5E3B] flex items-center justify-center shrink-0 mt-0.5">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Work Description</div>
            <div className="font-medium text-gray-800 text-xs truncate">
              {customer.workDescription || 'Standard agricultural field preparation'}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Pill with Mode & Status & Profile shortcut */}
      <div className="pt-2 border-t border-[#E2E2DC] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-gray-600 font-semibold">
          <Clock className="w-3.5 h-3.5 text-[#1F5E3B]" />
          <span>
            Mode: <strong className="text-gray-900">{modeLabel}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={() => onOpenCustomerProfile && onOpenCustomerProfile(customer)}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1F5E3B] hover:underline"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>View Ledger & Payments &rarr;</span>
        </button>
      </div>
    </div>
  );
}
