import React, { useState } from 'react';
import { Calendar, Users, Clock, TrendingUp, TrendingDown, IndianRupee, PlusCircle, CheckCircle2, ChevronRight, FileDown, Trash2 } from 'lucide-react';
import SummaryCard from '../components/SummaryCard';
import CustomerCard from '../components/CustomerCard';
import TimerControl from '../components/TimerControl';
import ExpenseForm from '../components/ExpenseForm';
import { formatCurrency, formatDuration, formatDate } from '../utils/calculations';
import { generateCustomerBillPDF } from '../utils/pdfGenerator';

export default function Diary({
  activeCustomer,
  customersQueue,
  completedRecords,
  activeTimerState,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onCancelWork,
  onSelectCustomer,
  onUpdateCustomer,
  onEditCustomer,
  onEndWork,
  onAdjustCountdownDuration,
  onSaveCompletedJob,
  onOpenAddCustomer,
  onViewRecordDetails,
  onDeleteRecord,
}) {
  const [activeExpenses, setActiveExpenses] = useState(
    activeCustomer?.expenses || { diesel: 0, driver: 0, food: 0, other: 0 }
  );

  const [recordToDelete, setRecordToDelete] = useState(null);

  // Filter today's records
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = completedRecords.filter((r) => r.date === todayStr);

  // Today's summary calculations
  const todayCustomersCount = todayRecords.length;
  const todayTotalSeconds = todayRecords.reduce((acc, r) => acc + (r.durationSeconds || 0), 0);
  const todayTotalIncome = todayRecords.reduce((acc, r) => acc + (r.workAmount || 0), 0);
  const todayTotalExpenses = todayRecords.reduce((acc, r) => acc + (r.totalExpenses || 0), 0);
  const todayNetEarnings = todayTotalIncome - todayTotalExpenses;

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleExpenseUpdate = (newExpenses) => {
    setActiveExpenses(newExpenses);
    if (activeCustomer && onUpdateCustomer) {
      onUpdateCustomer({
        ...activeCustomer,
        expenses: newExpenses,
      });
    }
  };

  const confirmDeleteRecord = () => {
    if (recordToDelete && onDeleteRecord) {
      onDeleteRecord(recordToDelete.id);
      setRecordToDelete(null);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Top Date Header */}
      <div className="bg-white border-b border-[#E2E2DC] -mx-4 -mt-4 px-4 py-3 sm:py-3.5 mb-2 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-800">
            <Calendar className="w-5 h-5 text-[#1F5E3B]" />
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                Today's Work Diary
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#1A1A1A]">
                {todayFormatted}
              </h2>
            </div>
          </div>
          <button
            onClick={onOpenAddCustomer}
            className="btn-secondary text-xs py-2 px-3 sm:px-4 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Today's 5 Summary Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Today's Summary
          </span>
          <span className="text-[11px] font-semibold text-[#1F5E3B]">
            {todayCustomersCount} Jobs Finished Today
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <SummaryCard
            title="Today's Jobs"
            value={todayCustomersCount}
            subtitle="Completed"
            icon={Users}
          />
          <SummaryCard
            title="Work Time"
            value={formatDuration(todayTotalSeconds, 'short')}
            subtitle="Total Tractor Hours"
            icon={Clock}
          />
          <SummaryCard
            title="Total Income"
            value={formatCurrency(todayTotalIncome)}
            subtitle="Gross Billing"
            icon={TrendingUp}
            variant="income"
          />
          <SummaryCard
            title="Total Expenses"
            value={formatCurrency(todayTotalExpenses)}
            subtitle="Diesel & Wages"
            icon={TrendingDown}
            variant="expense"
          />
          <div className="col-span-2 sm:col-span-2">
            <SummaryCard
              title="Today's Net Earnings"
              value={formatCurrency(todayNetEarnings)}
              subtitle="Income Minus Expenses"
              icon={IndianRupee}
              variant="net"
              size="lg"
            />
          </div>
        </div>
      </div>

      {/* Prominent Active Customer Card */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1F5E3B] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#1F5E3B] animate-ping"></span>
            Active Field Operation
          </span>
          {customersQueue.length > 1 && (
            <span className="text-xs font-semibold text-gray-500">
              Queue: {customersQueue.length} customers
            </span>
          )}
        </div>

        <CustomerCard
          customer={activeCustomer}
          allCustomers={customersQueue}
          onSelectCustomer={onSelectCustomer}
          onEditCustomer={onEditCustomer}
        />
      </div>

      {/* Prominent Timer Interface (Stopwatch / Count Down / Manual) */}
      {activeCustomer && (
        <div className="space-y-2">
          <div className="px-1 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Tractor Work Engine
            </span>
            <span className="text-xs font-semibold text-emerald-800">
              Rate: ₹{activeCustomer.ratePerMinute || 0}/min
            </span>
          </div>

          <TimerControl
            activeCustomer={activeCustomer}
            activeTimerState={activeTimerState}
            onStartTimer={onStartTimer}
            onPauseTimer={onPauseTimer}
            onResetTimer={onResetTimer}
            onCancelWork={onCancelWork}
            onEndWork={onEndWork}
            onAdjustCountdownDuration={onAdjustCountdownDuration}
            onSaveCompletedJob={onSaveCompletedJob}
            onUpdateCustomerMode={(updates) => {
              if (onUpdateCustomer && activeCustomer) {
                onUpdateCustomer({ ...activeCustomer, ...updates });
              }
            }}
          />
        </div>
      )}

      {/* Job Operational Expenses Form (for timer modes) */}
      {activeCustomer && activeCustomer.timerMode !== 'manual' && (
        <div className="space-y-2">
          <ExpenseForm
            expenses={activeExpenses}
            onChange={handleExpenseUpdate}
            workAmount={activeCustomer?.ratePerMinute ? activeCustomer.ratePerMinute * 10 : 0}
          />
        </div>
      )}

      {/* Today's Completed Work Log */}
      {todayRecords.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1F5E3B]" /> Completed Today ({todayRecords.length})
            </h3>
          </div>

          <div className="space-y-2">
            {todayRecords.map((job) => (
              <div
                key={job.id}
                onClick={() => onViewRecordDetails(job)}
                className="card-base p-3.5 hover:border-[#1F5E3B] transition-colors cursor-pointer flex items-center justify-between gap-3 bg-white"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 truncate text-sm">
                      {job.customerName}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-[#1F5E3B]">
                      {formatDuration(job.durationSeconds, 'short')}
                    </span>
                    {job.timerMode === 'manual' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                        Manual
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {job.location || job.workDescription}
                  </div>
                </div>

                <div className="text-right flex items-center gap-2 shrink-0">
                  <div>
                    <div className="text-sm font-black text-[#1F5E3B] font-timer">
                      {formatCurrency(job.netEarnings)}
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium">Net Profit</div>
                  </div>

                  {/* Direct PDF Download */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      generateCustomerBillPDF(job);
                    }}
                    title="Download Bill PDF"
                    className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1F5E3B]"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>

                  {/* Direct Single Job Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRecordToDelete(job);
                    }}
                    title="Delete this record only"
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Single Record Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200">
            <h4 className="text-base font-bold text-red-700 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Today's Record?
            </h4>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to delete the record for <strong>{recordToDelete.customerName}</strong>? Other records and history remain untouched.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRecordToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRecord}
                className="flex-1 py-2.5 rounded-xl bg-red-700 text-white font-bold hover:bg-red-800"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
