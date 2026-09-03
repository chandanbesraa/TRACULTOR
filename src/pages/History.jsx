import React, { useState, useMemo } from 'react';
import { Search, Calendar, Clock, IndianRupee, Download, ChevronRight, FileText, MapPin, Trash2 } from 'lucide-react';
import { formatCurrency, formatDuration, formatDate, formatTime } from '../utils/calculations';
import { generateCustomerBillPDF } from '../utils/pdfGenerator';

export default function History({
  records = [],
  onViewRecord,
  onDeleteRecord,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterDate, setSelectedFilterDate] = useState('');
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Search & filter logic
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.mobileNumber && r.mobileNumber.toLowerCase().includes(q)) ||
        (r.location && r.location.toLowerCase().includes(q)) ||
        (r.address && r.address.toLowerCase().includes(q)) ||
        (r.date && r.date.includes(q)) ||
        (r.workDescription && r.workDescription.toLowerCase().includes(q));

      const matchDate = !selectedFilterDate || r.date === selectedFilterDate;

      return matchSearch && matchDate;
    });
  }, [records, searchQuery, selectedFilterDate]);

  // Group records by Date
  const groupedRecords = useMemo(() => {
    const groups = {};
    filteredRecords.forEach((r) => {
      const dateKey = r.date || (r.createdAt ? r.createdAt.split('T')[0] : 'Other');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(r);
    });

    // Sort dates descending
    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((dateKey) => ({
        date: dateKey,
        items: groups[dateKey],
        totalDayIncome: groups[dateKey].reduce((sum, item) => sum + (item.workAmount || 0), 0),
        totalDayNet: groups[dateKey].reduce((sum, item) => sum + (item.netEarnings || 0), 0),
        totalDaySeconds: groups[dateKey].reduce((sum, item) => sum + (item.durationSeconds || 0), 0),
      }));
  }, [filteredRecords]);

  // Total summary of filtered records
  const totalCount = filteredRecords.length;
  const totalNet = filteredRecords.reduce((sum, r) => sum + (r.netEarnings || 0), 0);

  const confirmDelete = () => {
    if (recordToDelete && onDeleteRecord) {
      onDeleteRecord(recordToDelete.id);
      setRecordToDelete(null);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Top Header */}
      <div className="bg-white border-b border-[#E2E2DC] -mx-4 -mt-4 px-4 py-3 sm:py-3.5 mb-2">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
              Permanent Records
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#1A1A1A]">
              Tractor Work History
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-gray-500">Total Saved</span>
            <div className="text-sm font-black text-[#1F5E3B] font-timer">
              {totalCount} Records ({formatCurrency(totalNet)})
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card-base p-3 bg-white space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, mobile, field, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#1F5E3B] focus:ring-1 focus:ring-[#1F5E3B] outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 px-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Date filter input if needed */}
        {selectedFilterDate && (
          <div className="flex items-center justify-between bg-emerald-50 text-[#1F5E3B] px-3 py-1.5 rounded-lg text-xs font-bold">
            <span>Filter: {formatDate(selectedFilterDate)}</span>
            <button
              onClick={() => setSelectedFilterDate('')}
              className="text-xs underline text-emerald-800"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Grouped Records List */}
      {groupedRecords.length === 0 ? (
        <div className="card-base text-center py-12 bg-white">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-gray-700">No Job Records Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
            {searchQuery
              ? `No records matching "${searchQuery}". Try a different keyword.`
              : 'Complete your first tractor job in the Diary to see permanent records here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedRecords.map((group) => (
            <div key={group.date} className="space-y-2">
              {/* Date Group Header */}
              <div className="flex items-center justify-between px-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                  <Calendar className="w-3.5 h-3.5 text-[#1F5E3B]" />
                  <span>{formatDate(group.date)}</span>
                  <span className="text-[11px] font-normal text-gray-500">
                    ({group.items.length} job{group.items.length > 1 ? 's' : ''})
                  </span>
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  Net: <strong className="text-[#1F5E3B] font-timer">{formatCurrency(group.totalDayNet)}</strong>
                </div>
              </div>

              {/* Items in this Date Group */}
              <div className="space-y-2">
                {group.items.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => onViewRecord(record)}
                    className="card-base p-4 bg-white hover:border-[#1F5E3B] transition-all cursor-pointer shadow-xs space-y-3"
                  >
                    {/* Top Row: Customer & Date/Time */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-gray-900 leading-snug truncate">
                            {record.customerName}
                          </h4>
                          {record.timerMode === 'manual' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                              Manual
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          {record.mobileNumber && (
                            <span className="font-semibold text-[#1F5E3B]">
                              {record.mobileNumber}
                            </span>
                          )}
                          {record.startTime && (
                            <span>• {formatTime(record.startTime)}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base font-black text-[#1F5E3B] font-timer">
                          {formatCurrency(record.netEarnings)}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-gray-400">
                          Net Earnings
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Field & Work */}
                    <div className="text-xs text-gray-600 flex items-start gap-1 bg-[#F7F7F5] p-2 rounded-xl border border-[#E2E2DC]">
                      <MapPin className="w-3.5 h-3.5 text-[#1F5E3B] mt-0.5 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-gray-800">
                          {record.location || record.address || 'Field Location'}
                        </span>
                        {record.workDescription && (
                          <span className="text-gray-500"> — {record.workDescription}</span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Metrics & Actions */}
                    <div className="pt-2 border-t border-[#E2E2DC] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-gray-600 font-semibold font-timer">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {formatDuration(record.durationSeconds, 'short')}
                        </span>
                        <span className="text-gray-400">|</span>
                        <span>Bill: {formatCurrency(record.workAmount)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            generateCustomerBillPDF(record);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1F5E3B] font-bold flex items-center gap-1 text-[11px] transition-colors"
                          title="Download Customer PDF"
                        >
                          <Download className="w-3 h-3" /> PDF
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecordToDelete(record);
                          }}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-colors"
                          title="Delete this record only"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <span className="text-gray-400 text-xs flex items-center gap-0.5 font-bold text-[#1F5E3B]">
                          View <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200">
            <h4 className="text-base font-bold text-red-700 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Job Record?
            </h4>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to delete the record for <strong>{recordToDelete.customerName}</strong>? Other records remain untouched.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRecordToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
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
