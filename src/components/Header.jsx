import React from 'react';
import { Tractor, Wifi } from 'lucide-react';

export default function Header({ onOpenProfile }) {
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="bg-[#1F5E3B] text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-2xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between">
        {/* Brand & Clickable Tractor Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenProfile}
            title="Customer Profile"
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center border border-white/20 shadow-inner cursor-pointer"
          >
            <Tractor className="w-6 h-6 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white">
                TRACULATOR
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-white/20 text-emerald-100 px-1.5 py-0.5 rounded">
                <Wifi className="w-2.5 h-2.5" /> Cloud Sync
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 font-medium tracking-wide mt-0.5">
              Track Time. Calculate Earnings.
            </p>
          </div>
        </div>

        {/* Top Right Date Display */}
        <div className="text-right">
          <div className="text-xs font-semibold text-emerald-100">{todayFormatted}</div>
          <div className="text-[11px] text-emerald-200/80">Field Operations</div>
        </div>
      </div>
    </header>
  );
}
