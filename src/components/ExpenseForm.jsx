import React from 'react';
import { Fuel, UserCheck, Utensils, MoreHorizontal, IndianRupee, Plus } from 'lucide-react';
import { calculateTotalExpenses, formatCurrency } from '../utils/calculations';

export default function ExpenseForm({
  expenses = { diesel: 0, driver: 0, food: 0, other: 0 },
  onChange,
  workAmount = 0,
}) {
  const handleFieldChange = (field, valStr) => {
    if (valStr === '' || valStr === undefined) {
      onChange({
        ...expenses,
        [field]: 0,
      });
      return;
    }
    // Remove leading zeros when followed by other digits (e.g. "025" -> "25")
    const sanitized = String(valStr).replace(/^0+(?=\d)/, '');
    const num = Math.max(0, Number(sanitized) || 0);
    onChange({
      ...expenses,
      [field]: num,
    });
  };

  const handleQuickAdd = (field, delta) => {
    const current = Number(expenses[field]) || 0;
    handleFieldChange(field, String(current + delta));
  };

  const totalExpenses = calculateTotalExpenses(expenses);
  const netEarnings = Math.max(-100000, (Number(workAmount) || 0) - totalExpenses);

  return (
    <div className="card-base bg-white border border-[#E2E2DC]">
      <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E2DC]">
        <div>
          <h3 className="text-sm font-bold text-[#1A1A1A]">Operational Expenses (₹)</h3>
          <p className="text-[11px] text-gray-500">Record field expenses for this job</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase font-bold text-gray-500">Total Expenses</div>
          <div className="text-sm font-black text-amber-900 font-timer">
            {formatCurrency(totalExpenses)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
        {/* Diesel Expense */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-amber-700" /> Diesel Expense (₹)
            </span>
            <span className="text-[10px] text-gray-400 font-normal">Tractor Fuel</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              placeholder="0"
              value={expenses.diesel === 0 ? '0' : (expenses.diesel || '')}
              onFocus={(e) => {
                if (e.target.value === '0') e.target.select();
              }}
              onChange={(e) => handleFieldChange('diesel', e.target.value)}
              className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 font-timer focus:bg-white focus:border-[#1F5E3B] focus:ring-1 focus:ring-[#1F5E3B] outline-none"
            />
          </div>
          {/* Quick presets */}
          <div className="flex gap-1.5 pt-0.5">
            {[200, 500, 1000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAdd('diesel', amt)}
                className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded border border-gray-200"
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Driver Expense */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-700" /> Driver Allowance (₹)
            </span>
            <span className="text-[10px] text-gray-400 font-normal">Wages/Batta</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              placeholder="0"
              value={expenses.driver === 0 ? '0' : (expenses.driver || '')}
              onFocus={(e) => {
                if (e.target.value === '0') e.target.select();
              }}
              onChange={(e) => handleFieldChange('driver', e.target.value)}
              className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 font-timer focus:bg-white focus:border-[#1F5E3B] outline-none"
            />
          </div>
          <div className="flex gap-1.5 pt-0.5">
            {[100, 200, 500].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAdd('driver', amt)}
                className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded border border-gray-200"
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Food Expense */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-orange-700" /> Food & Tea (₹)
            </span>
            <span className="text-[10px] text-gray-400 font-normal">Refreshment</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              placeholder="0"
              value={expenses.food === 0 ? '0' : (expenses.food || '')}
              onFocus={(e) => {
                if (e.target.value === '0') e.target.select();
              }}
              onChange={(e) => handleFieldChange('food', e.target.value)}
              className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 font-timer focus:bg-white focus:border-[#1F5E3B] outline-none"
            />
          </div>
          <div className="flex gap-1.5 pt-0.5">
            {[50, 100].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAdd('food', amt)}
                className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded border border-gray-200"
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Other Expenses */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MoreHorizontal className="w-3.5 h-3.5 text-gray-700" /> Other Expenses (₹)
            </span>
            <span className="text-[10px] text-gray-400 font-normal">Repairs/Grease</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              placeholder="0"
              value={expenses.other === 0 ? '0' : (expenses.other || '')}
              onFocus={(e) => {
                if (e.target.value === '0') e.target.select();
              }}
              onChange={(e) => handleFieldChange('other', e.target.value)}
              className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 font-timer focus:bg-white focus:border-[#1F5E3B] outline-none"
            />
          </div>
          <div className="flex gap-1.5 pt-0.5">
            {[50, 100, 200].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAdd('other', amt)}
                className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded border border-gray-200"
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Net Earnings Live Preview Bar */}
      <div className="mt-4 pt-3 border-t border-[#E2E2DC] flex items-center justify-between bg-[#F7F7F5] p-3 rounded-xl">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Net Earnings (Income - Expenses)
          </div>
          <div className="text-xs text-gray-600 font-medium">
            {formatCurrency(workAmount)} - {formatCurrency(totalExpenses)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-[#1F5E3B] font-timer">
            {formatCurrency(netEarnings)}
          </div>
        </div>
      </div>
    </div>
  );
}
