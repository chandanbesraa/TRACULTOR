import React, { useState } from 'react';
import { Play, Pause, Square, RotateCcw, Clock, Timer as TimerIcon, Plus, Minus, Volume2, VolumeX, Edit3, XCircle, AlertTriangle } from 'lucide-react';
import StopwatchDisplay from './StopwatchDisplay';
import CircularCountdown from './CircularCountdown';
import ManualWorkForm from './ManualWorkForm';
import { calculateWorkAmount } from '../utils/calculations';
import { playClickFeedback } from '../utils/timer';

export default function TimerControl({
  activeCustomer,
  activeTimerState, // global background-safe timer state from App.jsx
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onCancelWork,
  onEndWork,
  onUpdateCustomerMode,
  onAdjustCountdownDuration,
  onSaveCompletedJob,
}) {
  const mode = activeCustomer?.timerMode || activeTimerState?.mode || 'stopwatch';
  const ratePerMinute = Number(activeCustomer?.ratePerMinute) || 0;

  const isRunning = activeTimerState?.isRunning || false;
  const elapsedSeconds = activeTimerState?.elapsedSeconds || 0;
  const targetSeconds = activeTimerState?.targetSeconds ?? ((activeCustomer?.durationMinutesPreset || 20) * 60);
  const accruedAmount = activeTimerState?.accruedAmount || calculateWorkAmount(ratePerMinute, elapsedSeconds);
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleSwitchMode = (newMode) => {
    if (isRunning) return; // Prevent mode switch while timer is actively running
    playClickFeedback();
    if (onUpdateCustomerMode) {
      onUpdateCustomerMode({ timerMode: newMode });
    }
  };

  const handleAdjustTarget = (deltaMinutes) => {
    playClickFeedback();
    const currentMins = Math.max(1, Math.round(targetSeconds / 60));
    const newMins = Math.max(1, currentMins + deltaMinutes);
    if (onAdjustCountdownDuration) {
      onAdjustCountdownDuration(newMins);
    } else if (onUpdateCustomerMode) {
      onUpdateCustomerMode({ durationMinutesPreset: newMins });
    }
  };

  const handleReset = () => {
    playClickFeedback();
    if (onResetTimer) {
      onResetTimer();
    }
  };

  const handleConfirmCancel = () => {
    playClickFeedback();
    setShowCancelConfirm(false);
    if (onCancelWork) {
      onCancelWork();
    }
  };

  const handleEnd = () => {
    playClickFeedback();
    if (onEndWork) {
      onEndWork({
        durationSeconds: elapsedSeconds,
        startTime: activeTimerState?.startTime || new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
        endTime: new Date().toISOString(),
        ratePerMinute,
        workAmount: accruedAmount,
      });
    }
  };

  return (
    <div className="card-base border-2 border-[#1F5E3B]/20 bg-white">
      {/* 3 Main Mode Switcher Options: Stopwatch | Count Down | Manual */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#E2E2DC] gap-2">
        <div className="flex items-center bg-[#F7F7F5] p-1 rounded-xl border border-[#E2E2DC] overflow-x-auto max-w-full">
          {/* 1. Stopwatch */}
          <button
            onClick={() => handleSwitchMode('stopwatch')}
            disabled={isRunning}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              mode === 'stopwatch'
                ? 'bg-[#1F5E3B] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 disabled:opacity-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Stopwatch
          </button>

          {/* 2. Count Down */}
          <button
            onClick={() => handleSwitchMode('countdown')}
            disabled={isRunning}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              mode === 'countdown'
                ? 'bg-[#1F5E3B] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 disabled:opacity-50'
            }`}
          >
            <TimerIcon className="w-3.5 h-3.5" /> Count Down
          </button>

          {/* 3. Manual */}
          <button
            onClick={() => handleSwitchMode('manual')}
            disabled={isRunning}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              mode === 'manual'
                ? 'bg-[#1F5E3B] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 disabled:opacity-50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Manual
          </button>
        </div>

        {/* Audio Alert Toggle & Reset Icon */}
        <div className="flex items-center gap-1.5">
          {mode !== 'manual' && (
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                soundEnabled ? 'text-[#1F5E3B] bg-emerald-50' : 'text-gray-400 bg-gray-100'
              }`}
              title={soundEnabled ? 'Timer Sound Alert Enabled' : 'Timer Sound Alert Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-[11px] hidden sm:inline">{soundEnabled ? 'Sound ON' : 'Muted'}</span>
            </button>
          )}

          {elapsedSeconds > 0 && mode !== 'manual' && (
            <button
              onClick={handleReset}
              className="p-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 bg-[#F7F7F5] border border-gray-200 flex items-center gap-1"
              title="Reset current session (History records remain safe)"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Specific Views */}
      {mode === 'manual' ? (
        <div className="pt-2">
          <ManualWorkForm
            activeCustomer={activeCustomer}
            onSaveCompletedJob={onSaveCompletedJob}
            onResetSession={handleReset}
          />
        </div>
      ) : (
        <>
          {/* Countdown Quick Duration Adjuster (+ / - updates time immediately on every tap) */}
          {mode === 'countdown' && !isRunning && (
            <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 my-3">
              <span className="text-xs font-bold text-[#1F5E3B]">Set Duration:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAdjustTarget(-1)}
                  className="w-9 h-9 rounded-lg bg-white border border-emerald-300 font-bold text-gray-800 flex items-center justify-center active:scale-95 shadow-sm hover:bg-emerald-50"
                  title="Decrease 1 minute"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm sm:text-base font-black font-timer text-[#1F5E3B] min-w-[70px] text-center">
                  {Math.round(targetSeconds / 60)} Mins
                </span>
                <button
                  type="button"
                  onClick={() => handleAdjustTarget(1)}
                  className="w-9 h-9 rounded-lg bg-white border border-emerald-300 font-bold text-gray-800 flex items-center justify-center active:scale-95 shadow-sm hover:bg-emerald-50"
                  title="Increase 1 minute"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Timer Visual Display */}
          {mode === 'stopwatch' ? (
            <StopwatchDisplay
              elapsedSeconds={elapsedSeconds}
              isRunning={isRunning}
              ratePerMinute={ratePerMinute}
              accruedAmount={accruedAmount}
            />
          ) : (
            <CircularCountdown
              remainingSeconds={remainingSeconds}
              totalTargetSeconds={targetSeconds}
              elapsedSeconds={elapsedSeconds}
              isRunning={isRunning}
              ratePerMinute={ratePerMinute}
              accruedAmount={accruedAmount}
              startTime={activeTimerState?.startTime}
            />
          )}

          {/* Action Buttons (Large Outdoor Touch Targets) */}
          <div className="mt-4 pt-4 border-t border-[#E2E2DC] flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!isRunning ? (
                <button
                  onClick={onStartTimer}
                  className="btn-primary text-lg py-4 shadow-md flex-1"
                >
                  <Play className="w-6 h-6 fill-current" />
                  {elapsedSeconds > 0 ? 'RESUME WORK' : 'START WORK'}
                </button>
              ) : (
                <button
                  onClick={onPauseTimer}
                  className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-md flex items-center justify-center gap-2 flex-1"
                >
                  <Pause className="w-6 h-6 fill-current" />
                  PAUSE WORK
                </button>
              )}

              <button
                onClick={handleEnd}
                disabled={elapsedSeconds === 0}
                className={`btn-danger text-lg py-4 shadow-md flex-1 ${
                  elapsedSeconds === 0 ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <Square className="w-5 h-5 fill-current" />
                END WORK
              </button>
            </div>

            {/* Cancel / Don't Save Button (for Stopwatch & Count Down ONLY) */}
            {(isRunning || elapsedSeconds > 0) && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors border border-red-200"
                >
                  <XCircle className="w-4 h-4 text-red-600" /> Cancel / Don’t Save
                </button>

                {!isRunning && (
                  <button
                    onClick={handleReset}
                    className="text-xs font-bold text-gray-500 hover:text-gray-800 py-1.5 flex items-center justify-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Session to 0:00
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Cancel / Don't Save Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="text-base font-bold text-red-700">Discard Current Work?</h4>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to completely cancel and discard this work session? It will <strong>NOT</strong> be saved to History, Today’s Jobs, Queue, or PDF.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Keep Working
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-red-700 text-white font-bold hover:bg-red-800"
              >
                Discard & Don’t Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
