import React from 'react';
import { formatDigitalTime } from '../utils/timer';
import { formatDuration, formatTime } from '../utils/calculations';
import { Clock, CheckCircle2 } from 'lucide-react';

export default function CircularCountdown({
  remainingSeconds = 0,
  totalTargetSeconds = 1200, // e.g. 20 mins = 1200
  elapsedSeconds = 0,
  isRunning = false,
  ratePerMinute = 0,
  accruedAmount = 0,
  startTime = null,
  endTime = null,
}) {
  const size = 260; // diameter in px
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate Working Hours using Start Time and End Time / Elapsed Duration
  const workingHoursDecimal = (elapsedSeconds / 3600).toFixed(2);
  const workingMinutes = Math.round((elapsedSeconds / 60) * 10) / 10;
  const targetMinutes = Math.round((totalTargetSeconds / 60) * 10) / 10;

  // Working Hours Progress (Fills up as work hours accrue towards target)
  const progressRatio = totalTargetSeconds > 0
    ? Math.max(0, Math.min(1, elapsedSeconds / totalTargetSeconds))
    : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const isCompleted = totalTargetSeconds > 0 && elapsedSeconds >= totalTargetSeconds;
  const timeDisplay = formatDigitalTime(elapsedSeconds, elapsedSeconds >= 3600 || totalTargetSeconds >= 3600);

  // Formatted Start & Current/End Time stamps
  const startStamp = startTime ? formatTime(startTime) : (isRunning || elapsedSeconds > 0 ? formatTime(new Date(Date.now() - elapsedSeconds * 1000)) : '--');
  const currentStamp = endTime ? formatTime(endTime) : (isRunning || elapsedSeconds > 0 ? formatTime(new Date()) : '--');

  return (
    <div className="flex flex-col items-center justify-center py-2 sm:py-4">
      {/* Visual Working Hours Status Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`inline-block w-3 h-3 rounded-full ${
            isRunning
              ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-200'
              : isCompleted
              ? 'bg-emerald-600 ring-4 ring-emerald-200'
              : elapsedSeconds > 0
              ? 'bg-amber-500'
              : 'bg-gray-400'
          }`}
        />
        <span className="text-xs font-black uppercase tracking-wider text-gray-700">
          {isCompleted
            ? 'TARGET WORK HOURS COMPLETED'
            : isRunning
            ? 'WORKING HOURS IN PROGRESS'
            : elapsedSeconds > 0
            ? 'WORKING HOURS PAUSED'
            : 'READY TO START WORK'}
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

          {/* Foreground Working Hours Ring (Fills up with working hours) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isCompleted ? '#16452B' : '#1F5E3B'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-linear"
          />
        </svg>

        {/* Center Working Hours Content (Replacing Countdown) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <div className="text-[11px] font-black text-[#1F5E3B] uppercase tracking-widest flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Working Hours
          </div>

          <div className="text-4xl sm:text-5xl font-black font-timer tracking-tight text-[#1F5E3B] my-1">
            {timeDisplay}
          </div>

          <div className="text-xs font-bold text-gray-800">
            {workingHoursDecimal} Hours ({workingMinutes} mins)
          </div>

          {targetMinutes > 0 && (
            <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
              Target: {targetMinutes} mins
            </div>
          )}
        </div>
      </div>

      {/* Start Time & End/Current Time Info Card */}
      {(isRunning || elapsedSeconds > 0) && (
        <div className="mt-3 flex items-center justify-center gap-4 text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-4 py-1.5 rounded-xl shadow-xs">
          <span><strong>Start Time:</strong> {startStamp}</span>
          <span className="text-gray-300">|</span>
          <span><strong>{isRunning ? 'Current Time' : 'End Time'}:</strong> {currentStamp}</span>
        </div>
      )}

      {/* Live Accrued Work Amount Pill */}
      {ratePerMinute > 0 && (
        <div className="mt-3 inline-flex items-center gap-2 bg-[#F7F7F5] border border-[#E2E2DC] px-4 py-2 rounded-xl text-center shadow-inner">
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
