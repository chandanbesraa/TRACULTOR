import React from 'react';
import { User, Phone, MapPin, Wrench, IndianRupee, Clock, ChevronDown, CheckCircle2, Edit3, Calendar } from 'lucide-react';

export default function CustomerCard({
  customer,
  allCustomers = [],
  onSelectCustomer,
  onEditCustomer,
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

  return (
    <div className="card-base border-2 border-[#1F5E3B]/30 bg-white relative overflow-hidden">
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
        <div className="flex items-center gap-2">
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
                className="text-xs font-bold bg-[#F7F7F5] border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1F5E3B] cursor-pointer"
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

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 text-sm">
        {/* Mobile Number with Direct Call Action */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-emerald-50 text-[#1F5E3B] flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Mobile Number</div>
            <a
              href={`tel:${customer.mobileNumber}`}
              className="font-bold text-[#1F5E3B] hover:underline"
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
            <div className="font-black text-[#1A1A1A] font-timer">
              ₹{customer.ratePerMinute} <span className="text-xs font-normal text-gray-600">/ minute</span>
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
            <div className="font-semibold text-gray-900 truncate">
              {customer.location || customer.address || 'Field Location Not Specified'}
            </div>
            {customer.address && customer.location && customer.address !== customer.location && (
              <div className="text-xs text-gray-500 truncate mt-0.5">
                Address: {customer.address}
              </div>
            )}
          </div>
        </div>

        {/* Work Description */}
        <div className="flex items-start gap-2 sm:col-span-2">
          <div className="w-7 h-7 rounded-md bg-emerald-50 text-[#1F5E3B] flex items-center justify-center shrink-0 mt-0.5">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Work Description</div>
            <div className="font-medium text-gray-800 text-xs sm:text-sm">
              {customer.workDescription || 'Standard agricultural field preparation'}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Pill with Mode & Status */}
      <div className="pt-2.5 border-t border-[#E2E2DC] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-gray-600 font-semibold">
          <Clock className="w-3.5 h-3.5 text-[#1F5E3B]" />
          <span>
            Mode: <strong className="text-gray-900">{modeLabel}</strong>
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-[#1F5E3B]">
          <CheckCircle2 className="w-3 h-3" /> Ready
        </span>
      </div>
    </div>
  );
}
