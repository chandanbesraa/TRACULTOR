import React, { useState, useRef } from 'react';
import { Calendar, Clock, IndianRupee, FileSpreadsheet, History as HistoryIcon, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import History from './History';
import Monthly from './Monthly';
import { playClickFeedback } from '../utils/timer';

export default function HistoryMonthly({
  records = [],
  onViewRecord,
  onDeleteRecord,
}) {
  const [activeSubTab, setActiveSubTab] = useState('history'); // 'history' | 'monthly'

  // Touch swipe gesture state
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current || !touchStartY.current) return;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;

    // Ensure it was predominantly a horizontal swipe (not a vertical scroll)
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX > 0 && activeSubTab === 'history') {
        // Swiped left -> Switch to Monthly
        playClickFeedback();
        setActiveSubTab('monthly');
      } else if (deltaX < 0 && activeSubTab === 'monthly') {
        // Swiped right -> Switch to History
        playClickFeedback();
        setActiveSubTab('history');
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="space-y-3 pb-8 select-none"
    >
      {/* Top Combined Direct Tabs: [ HISTORY | MONTHLY ] */}
      <div className="bg-white border border-[#E2E2DC] rounded-2xl p-1.5 shadow-sm flex items-center gap-1.5 sticky top-14 z-30">
        <button
          type="button"
          onClick={() => {
            playClickFeedback();
            setActiveSubTab('history');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'history'
              ? 'bg-[#1F5E3B] text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 bg-[#F7F7F5]'
          }`}
        >
          <HistoryIcon className="w-4 h-4" />
          <span>HISTORY</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playClickFeedback();
            setActiveSubTab('monthly');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'monthly'
              ? 'bg-[#1F5E3B] text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 bg-[#F7F7F5]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>MONTHLY</span>
        </button>
      </div>

      {/* Swipe Indicator Hint for Mobile */}
      <div className="flex items-center justify-center gap-1 text-[11px] text-gray-400 font-semibold px-1">
        <span>👈 Swipe left/right to toggle 👉</span>
      </div>

      {/* Render Active View Directly Without Nested Navigation */}
      {activeSubTab === 'history' ? (
        <History
          records={records}
          onViewRecord={onViewRecord}
          onDeleteRecord={onDeleteRecord}
        />
      ) : (
        <Monthly
          records={records}
          onViewRecord={onViewRecord}
        />
      )}
    </div>
  );
}
