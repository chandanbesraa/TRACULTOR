import React from 'react';
import { formatDigitalTime } from '../utils/timer';

export default function StopwatchDisplay({
  elapsedSeconds = 0,
  isRunning = false,
  ratePerMinute = 0,
  accruedAmount = 0,
}) {
  const timeFormatted = formatDigitalTime(elapsedSeconds, elapsedSeconds >= 3600);

  return (
    <div className="flex flex-col items-center justify-center py-4 sm:py-6">
      {/* Visual Status Indicator */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`inline-block w-3 h-3 rounded-full ${
            isRunning
              ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-200'
              : elapsedSeconds > 0
              ? 'bg-amber-500'
              : 'bg-gray-400'
          }`}
        />
        <span className="text-xs font-black uppercase tracking-wider text-gray-700">
          {isRunning ? 'TRACTOR AT WORK' : elapsedSeconds > 0 ? 'WORK PAUSED' : 'READY TO START'}
        </span>
      </div>

      {/* Large Digital Stopwatch Display */}
      <div className="bg-white border-2 border-[#1F5E3B] rounded-3xl px-8 py-5 shadow-sm text-center min-w-[280px] sm:min-w-[320px]">
        <div className="text-5xl sm:text-6xl font-black font-timer tracking-tight text-[#1F5E3B] select-none">
          {timeFormatted}
        </div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">
          {elapsedSeconds >= 3600 ? 'Hours : Minutes : Seconds' : 'Minutes : Seconds'}
        </div>
      </div>

      {/* Live Accrued Amount Pill */}
      {ratePerMinute > 0 && (
        <div className="mt-4 inline-flex items-center gap-2 bg-[#F7F7F5] border border-[#E2E2DC] px-4 py-2 rounded-xl text-center shadow-inner">
          <span className="text-xs font-bold text-gray-600">Accrued Amount:</span>
          <span className="text-base font-black text-[#1F5E3B] font-timer">
            ₹{accruedAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-gray-500 font-medium">
            (@ ₹{ratePerMinute}/min)
          </span>
        </div>
      )}
    </div>
  );
}
