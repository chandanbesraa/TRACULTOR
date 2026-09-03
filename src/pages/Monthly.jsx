import React, { useState, useMemo } from 'react';
import { Calendar, Users, Clock, TrendingUp, TrendingDown, IndianRupee, Download, ChevronRight, FileSpreadsheet, MapPin } from 'lucide-react';
import SummaryCard from '../components/SummaryCard';
import { formatCurrency, formatDuration, formatDate, formatTime } from '../utils/calculations';
import { generateMonthlyReportPDF, generateCustomerBillPDF } from '../utils/pdfGenerator';

export default function Monthly({
  records = [],
  onViewRecord,
}) {
  // Generate list of available months from existing records or current date
  const availableMonths = useMemo(() => {
    const monthsMap = {};
    const now = new Date();
    
    // Add current and previous 3 months by default
    for (let i = 0; i < 4; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      monthsMap[key] = label;
    }

    // Add any months found in records
    records.forEach((r) => {
      const dateStr = r.date || r.createdAt;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
          monthsMap[key] = label;
        }
      }
    });

    return Object.entries(monthsMap)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, label]) => ({ key, label }));
  }, [records]);

  // Current selected month
  const [selectedMonthKey, setSelectedMonthKey] = useState(
    availableMonths[0]?.key || new Date().toISOString().slice(0, 7)
  );

  const selectedMonthLabel = availableMonths.find((m) => m.key === selectedMonthKey)?.label || new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // Filter records for the selected month
  const monthlyRecords = useMemo(() => {
    return records.filter((r) => {
      const dateStr = r.date || r.createdAt;
      if (!dateStr) return false;
      return dateStr.startsWith(selectedMonthKey);
    }).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }, [records, selectedMonthKey]);

  // Monthly aggregated KPIs
  const totalCustomers = monthlyRecords.length;
  const totalSeconds = monthlyRecords.reduce((sum, r) => sum + (r.durationSeconds || 0), 0);
  const totalIncome = monthlyRecords.reduce((sum, r) => sum + (r.workAmount || 0), 0);
  const totalExpenses = monthlyRecords.reduce((sum, r) => sum + (r.totalExpenses || 0), 0);
  const netEarnings = totalIncome - totalExpenses;

  const handleDownloadMonthlyPDF = () => {
    generateMonthlyReportPDF(
      selectedMonthLabel,
      {
        totalCustomers,
        totalSeconds,
        totalIncome,
        totalExpenses,
        netEarnings,
      },
      monthlyRecords
    );
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header & Month Selector */}
      <div className="bg-white border-b border-[#E2E2DC] -mx-4 -mt-4 px-4 py-3 sm:py-3.5 mb-2">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
              Financial & Work Analytics
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#1A1A1A]">
              Monthly Tractor Report
            </h2>
          </div>

          {/* Month Dropdown Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1F5E3B]" />
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="bg-[#F7F7F5] border border-gray-300 font-bold text-sm text-gray-900 rounded-xl px-3 py-2 outline-none focus:border-[#1F5E3B] focus:ring-1 focus:ring-[#1F5E3B] cursor-pointer shadow-xs"
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5 Monthly KPI Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {selectedMonthLabel} Overview
          </span>
          <span className="text-[11px] font-bold text-[#1F5E3B]">
            {totalCustomers} Customer Jobs
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <SummaryCard
            title="Total Customers"
            value={totalCustomers}
            subtitle="Tractor Bookings"
            icon={Users}
          />
          <SummaryCard
            title="Total Work Time"
            value={formatDuration(totalSeconds, 'short')}
            subtitle="Operating Hours"
            icon={Clock}
          />
          <SummaryCard
            title="Total Income"
            value={formatCurrency(totalIncome)}
            subtitle="Gross Field Billing"
            icon={TrendingUp}
            variant="income"
          />
          <SummaryCard
            title="Total Expenses"
            value={formatCurrency(totalExpenses)}
            subtitle="Fuel, Wages & Food"
            icon={TrendingDown}
            variant="expense"
          />
          <div className="col-span-2 sm:col-span-2">
            <SummaryCard
              title="Net Operator Earnings"
              value={formatCurrency(netEarnings)}
              subtitle="Net Profit for the Month"
              icon={IndianRupee}
              variant="net"
              size="lg"
            />
          </div>
        </div>
      </div>

      {/* Prominent Download Monthly Report PDF Button */}
      <div className="pt-1">
        <button
          onClick={handleDownloadMonthlyPDF}
          className="btn-primary w-full py-4 text-sm sm:text-base shadow-md flex items-center justify-center gap-2.5"
        >
          <Download className="w-5 h-5" />
          <span>DOWNLOAD MONTHLY REPORT PDF ({selectedMonthLabel})</span>
        </button>
      </div>

      {/* Itemized Customer Jobs for Selected Month */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-[#1F5E3B]" /> Detailed Job Breakdown ({monthlyRecords.length})
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            Click to view or reprint
          </span>
        </div>

        {monthlyRecords.length === 0 ? (
          <div className="card-base text-center py-10 bg-white">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-gray-700">No Jobs Recorded in {selectedMonthLabel}</h4>
            <p className="text-xs text-gray-500 mt-1">
              Select another month or complete new tractor work in the Diary.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {monthlyRecords.map((job) => (
              <div
                key={job.id}
                onClick={() => onViewRecord(job)}
                className="card-base p-3.5 bg-white hover:border-[#1F5E3B] transition-all cursor-pointer shadow-xs space-y-2"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {formatDate(job.date || job.createdAt)}
                    </span>
                    <h4 className="text-base font-black text-gray-900 leading-snug">
                      {job.customerName}
                    </h4>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-[#1F5E3B] font-timer">
                      {formatCurrency(job.netEarnings)}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-gray-400">Net Profit</div>
                  </div>
                </div>

                {/* Location & work */}
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#1F5E3B] shrink-0" />
                  <span className="truncate">{job.location || job.address || 'Field Location'}</span>
                </div>

                {/* Footer specs */}
                <div className="pt-2 border-t border-[#E2E2DC] flex items-center justify-between text-xs font-timer">
                  <div className="text-gray-600 space-x-2">
                    <span><strong>Time:</strong> {formatDuration(job.durationSeconds, 'short')}</span>
                    <span className="text-gray-300">|</span>
                    <span><strong>Rate:</strong> ₹{job.ratePerMinute}/m</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-amber-800"><strong>Exp:</strong> {formatCurrency(job.totalExpenses)}</span>
                  </div>

                  <span className="text-xs font-bold text-[#1F5E3B] flex items-center gap-0.5">
                    Details <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
