import React from 'react';
import { formatDigitalTime } from '../utils/timer';

export default function CircularCountdown({
  remainingSeconds = 0,
  totalTargetSeconds = 1200, // e.g. 20 mins = 1200
  elapsedSeconds = 0,
  isRunning = false,
  ratePerMinute = 0,
  accruedAmount = 0,
}) {
  const size = 260; // diameter in px
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Percentage remaining: 1 when full, 0 when empty
  const progressRatio = totalTargetSeconds > 0 
    ? Math.max(0, Math.min(1, remainingSeconds / totalTargetSeconds))
    : 0;

  // Stroke dashoffset: empties as remainingSeconds decreases
  const strokeDashoffset = circumference * (1 - progressRatio);

  const isCompleted = remainingSeconds <= 0 && totalTargetSeconds > 0;
  const timeDisplay = formatDigitalTime(remainingSeconds, totalTargetSeconds >= 3600);

  return (
    <div className="flex flex-col items-center justify-center py-2 sm:py-4">
      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`inline-block w-3 h-3 rounded-full ${
            isRunning
              ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-200'
              : isCompleted
              ? 'bg-red-500 ring-4 ring-red-200 animate-bounce'
              : elapsedSeconds > 0
              ? 'bg-amber-500'
              : 'bg-gray-400'
          }`}
        />
        <span className="text-xs font-black uppercase tracking-wider text-gray-700">
          {isCompleted
            ? 'COUNTDOWN COMPLETED'
            : isRunning
            ? 'COUNTDOWN RUNNING'
            : elapsedSeconds > 0
            ? 'COUNTDOWN PAUSED'
            : 'READY TO START'}
        </span>
      </div>

      {/* Circular Progress Gauge */}
      <div className="relative flex items-center justify-center select-none">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E2DC"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Foreground Progress Ring (Empties as remaining time drops) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isCompleted ? '#C53030' : '#1F5E3B'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-linear"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Remaining Time
          </div>

          <div
            className={`text-4xl sm:text-5xl font-black font-timer tracking-tight my-1 ${
              isCompleted ? 'text-red-700 animate-pulse' : 'text-[#1F5E3B]'
            }`}
          >
            {timeDisplay}
          </div>

          <div className="text-[11px] font-semibold text-gray-600">
            Worked: <span className="font-bold text-[#1A1A1A]">{formatDigitalTime(elapsedSeconds)}</span>
          </div>

          <div className="text-[10px] text-gray-500 mt-0.5">
            Target: {Math.round(totalTargetSeconds / 60)} mins
          </div>
        </div>
      </div>

      {/* Live Accrued Amount Pill */}
      {ratePerMinute > 0 && (
        <div className="mt-4 inline-flex items-center gap-2 bg-[#F7F7F5] border border-[#E2E2DC] px-4 py-2 rounded-xl text-center shadow-inner">
          <span className="text-xs font-bold text-gray-600">Actual Work Amount:</span>
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
