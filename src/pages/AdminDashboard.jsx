import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Briefcase, IndianRupee, TrendingUp, TrendingDown, Search, Filter, LogOut, ArrowLeft, Download, FileDown, Clock, Eye, RefreshCw, CheckCircle2, ChevronRight } from 'lucide-react';
import { fetchAllCustomersForAdmin, fetchAllJobsForAdmin } from '../utils/supabaseStorage';
import { formatCurrency, formatDuration, formatDate } from '../utils/calculations';
import { generateCustomerBillPDF } from '../utils/pdfGenerator';
import { playClickFeedback } from '../utils/timer';

export default function AdminDashboard({
  adminUser,
  onAdminLogout,
  onReturnToCustomerApp,
  onViewRecordDetails,
}) {
  const [activeAdminTab, setActiveAdminTab] = useState('customers'); // 'customers' | 'jobs'
  const [customers, setCustomers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerIdFilter, setSelectedCustomerIdFilter] = useState('all');
  const [selectedModeFilter, setSelectedModeFilter] = useState('all');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [custData, jobData] = await Promise.all([
        fetchAllCustomersForAdmin(),
        fetchAllJobsForAdmin(),
      ]);
      setCustomers(custData || []);
      setJobs(jobData || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Platform Aggregations
  const totalCustomersCount = customers.length;
  const totalJobsCount = jobs.length;
  const totalPlatformGross = jobs.reduce((sum, j) => sum + (Number(j.workAmount) || 0), 0);
  const totalPlatformExpenses = jobs.reduce((sum, j) => sum + (Number(j.totalExpenses) || 0), 0);
  const totalPlatformNet = totalPlatformGross - totalPlatformExpenses;
  const totalPlatformSeconds = jobs.reduce((sum, j) => sum + (Number(j.durationSeconds) || 0), 0);

  // Filtered Customers
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.fullName && c.fullName.toLowerCase().includes(q)) ||
      (c.customerId && c.customerId.toLowerCase().includes(q)) ||
      (c.mobileNumber && c.mobileNumber.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q))
    );
  });

  // Filtered Jobs
  const filteredJobs = jobs.filter((j) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      (j.customerName && j.customerName.toLowerCase().includes(q)) ||
      (j.operatorCustomerId && j.operatorCustomerId.toLowerCase().includes(q)) ||
      (j.location && j.location.toLowerCase().includes(q)) ||
      (j.id && j.id.toLowerCase().includes(q));

    const matchCust =
      selectedCustomerIdFilter === 'all' || j.operatorCustomerId === selectedCustomerIdFilter;

    const matchMode =
      selectedModeFilter === 'all' || j.timerMode === selectedModeFilter;

    return matchQuery && matchCust && matchMode;
  });

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans">
      {/* Admin Top Navigation Header */}
      <header className="bg-[#1E293B] border-b border-slate-700 px-4 sm:px-6 py-3.5 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  TRACULATOR ADMIN
                </h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Master Control
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-Customer Field Monitoring & Financial Records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onReturnToCustomerApp}
              className="text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-slate-600"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Customer App</span>
            </button>
            <button
              onClick={onAdminLogout}
              className="text-xs font-bold bg-red-900/40 hover:bg-red-900/60 text-red-300 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-red-700/60"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Global Summary KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-[#1E293B] border border-slate-700 p-4 rounded-2xl">
            <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" /> Total Customers
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-timer mt-1.5">
              {totalCustomersCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Registered Profiles</div>
          </div>

          <div className="bg-[#1E293B] border border-slate-700 p-4 rounded-2xl">
            <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-400" /> Completed Jobs
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-timer mt-1.5">
              {totalJobsCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{formatDuration(totalPlatformSeconds, 'short')}</div>
          </div>

          <div className="bg-[#1E293B] border border-slate-700 p-4 rounded-2xl">
            <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Platform Income
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-timer mt-1.5">
              {formatCurrency(totalPlatformGross)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Gross Work Value</div>
          </div>

          <div className="bg-[#1E293B] border border-slate-700 p-4 rounded-2xl">
            <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Total Expenses
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 font-timer mt-1.5">
              {formatCurrency(totalPlatformExpenses)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Diesel, Wages, Food</div>
          </div>

          <div className="bg-[#1E293B] border border-emerald-500/40 p-4 rounded-2xl col-span-2 sm:col-span-1 lg:col-span-1 bg-gradient-to-br from-[#1E293B] to-emerald-950/40">
            <div className="text-[11px] uppercase font-bold text-emerald-300 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-400" /> Net Earnings
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-timer mt-1.5">
              {formatCurrency(totalPlatformNet)}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-0.5">Net Operator Profit</div>
          </div>
        </div>

        {/* View Switcher Tabs: [ All Customers | All Work Jobs ] */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#1E293B] p-2 rounded-2xl border border-slate-700">
          <div className="flex bg-slate-900 p-1 rounded-xl">
            <button
              onClick={() => {
                playClickFeedback();
                setActiveAdminTab('customers');
              }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeAdminTab === 'customers'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>All Customers ({customers.length})</span>
            </button>

            <button
              onClick={() => {
                playClickFeedback();
                setActiveAdminTab('jobs');
              }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeAdminTab === 'jobs'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>All Work Jobs ({jobs.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeAdminTab === 'customers' ? 'Search by name, @ID, phone, village...' : 'Search jobs by customer, ID, location...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <button
              onClick={loadAdminData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab 1: All Customers Table */}
        {activeAdminTab === 'customers' && (
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="py-3.5 px-4">Customer / Operator</th>
                    <th className="py-3.5 px-4">Contact Info</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4 text-center">Jobs</th>
                    <th className="py-3.5 px-4 text-right">Work Hours</th>
                    <th className="py-3.5 px-4 text-right">Gross Billing</th>
                    <th className="py-3.5 px-4 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500 text-sm">
                        No customer accounts found matching search.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-800/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-sm">
                              {cust.fullName ? cust.fullName.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div>
                              <div className="text-white font-bold">{cust.fullName}</div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                Joined {cust.createdAt ? formatDate(cust.createdAt) : 'Recently'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-400">
                          {cust.mobileNumber || cust.email || cust.customerId || 'Account Registered'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <div className="text-xs text-slate-300 truncate max-w-[150px]">
                            {cust.location || 'Not Specified'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700">
                            {cust.totalJobs}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-timer font-semibold text-slate-300">
                          {formatDuration(cust.totalDuration, 'short')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-timer font-bold text-slate-200">
                          {formatCurrency(cust.totalIncome)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-timer font-black text-emerald-400">
                          {formatCurrency(cust.totalNet)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: All Jobs Explorer Table */}
        {activeAdminTab === 'jobs' && (
          <div className="space-y-4">
            {/* Secondary Filter Dropdowns */}
            <div className="flex flex-wrap gap-2.5">
              <select
                value={selectedCustomerIdFilter}
                onChange={(e) => setSelectedCustomerIdFilter(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-semibold outline-none focus:border-emerald-500"
              >
                <option value="all">All Customer Accounts</option>
                {customers.map((c) => (
                  <option key={c.id || c.customerId} value={c.id || c.customerId}>
                    {c.fullName || c.mobileNumber || c.customerId}
                  </option>
                ))}
              </select>

              <select
                value={selectedModeFilter}
                onChange={(e) => setSelectedModeFilter(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-semibold outline-none focus:border-emerald-500"
              >
                <option value="all">All Timer Modes</option>
                <option value="stopwatch">Stopwatch</option>
                <option value="countdown">Count Down</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div className="bg-[#1E293B] border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">Job Ref / Date</th>
                      <th className="py-3.5 px-4">Operator</th>
                      <th className="py-3.5 px-4">Customer & Location</th>
                      <th className="py-3.5 px-4">Duration & Mode</th>
                      <th className="py-3.5 px-4 text-right">Work Amount</th>
                      <th className="py-3.5 px-4 text-right">Expenses</th>
                      <th className="py-3.5 px-4 text-right">Net Profit</th>
                      <th className="py-3.5 px-4 text-center">PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-slate-500 text-sm">
                          No job records match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((job) => (
                        <tr
                          key={job.id}
                          onClick={() => onViewRecordDetails && onViewRecordDetails(job)}
                          className="hover:bg-slate-800/60 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white font-timer">{job.id}</div>
                            <div className="text-[10px] text-slate-400">{formatDate(job.date)}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 font-timer font-bold text-xs border border-emerald-800/40">
                              {job.operatorCustomerId || '@operator'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{job.customerName}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                              {job.location || job.workDescription || 'N/A'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-timer font-bold text-slate-200">
                              {formatDuration(job.durationSeconds, 'short')}
                            </div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">
                              {job.timerMode || 'stopwatch'} @ ₹{job.ratePerMinute}/m
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-timer font-bold text-slate-200">
                            {formatCurrency(job.workAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-timer font-semibold text-rose-400">
                            {formatCurrency(job.totalExpenses)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-timer font-black text-emerald-400">
                            {formatCurrency(job.netEarnings)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                generateCustomerBillPDF(job);
                              }}
                              className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30"
                              title="Download PDF Invoice"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
