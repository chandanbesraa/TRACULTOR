import React, { useState, useMemo, useEffect } from 'react';
import { User, Phone, MapPin, Wrench, IndianRupee, Clock, Timer as TimerIcon, Play, Save, CheckCircle2, RotateCcw, Edit3, Receipt, Users } from 'lucide-react';
import { playClickFeedback } from '../utils/timer';
import { formatCurrency, calculateCustomerBalance } from '../utils/calculations';
import { detectDeviceGpsLocation, getCachedLocation } from '../utils/locationService';

export default function AddCustomer({
  savedProfiles = [],
  completedRecords = [],
  payments = [],
  onStartCustomerWork,
  onSaveToQueue,
  onOpenCustomerProfile,
}) {
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [ratePerMinute, setRatePerMinute] = useState(''); // Default empty with placeholder "Rate"
  const [timerMode, setTimerMode] = useState('stopwatch'); // 'stopwatch' | 'countdown' | 'manual'
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Auto-fill field location if empty and cached location exists
  useEffect(() => {
    if (!location && !address) {
      const cached = getCachedLocation();
      if (cached?.name) {
        setLocation(cached.name);
      }
    }
  }, []);

  const handleUseGpsLocation = async () => {
    playClickFeedback();
    setIsDetectingGps(true);
    try {
      const loc = await detectDeviceGpsLocation({ timeout: 10000, maximumAge: 0 });
      if (loc?.name) {
        setLocation(loc.name);
        if (!address) setAddress(loc.name);
      }
    } catch (err) {
      console.warn('GPS location detection error:', err);
    } finally {
      setIsDetectingGps(false);
    }
  };

  const [errors, setErrors] = useState({});

  const ratePresets = [25, 30, 35, 40, 45, 50];
  const workSuggestions = [
    'Rotavator & Soil Tilth',
    'Deep Disc Ploughing',
    'Laser Land Leveling',
    'Paddy Puddling & Bunds',
    'Seed Drill Sowing',
    'Harrow & Cultivator Pass',
    'Wheat / Crop Harvesting',
  ];
  const durationPresets = [15, 20, 25, 30, 45, 60];

  // Active matched saved customer profile if any
  const matchedCustomerProfile = useMemo(() => {
    if (selectedProfileId) {
      return savedProfiles.find(p => p.id === selectedProfileId);
    }
    const cleanName = customerName.trim().toLowerCase();
    if (cleanName) {
      return savedProfiles.find(p => (p.customerName || '').trim().toLowerCase() === cleanName);
    }
    return null;
  }, [selectedProfileId, customerName, savedProfiles]);

  // Calculate live financial balance if existing customer matched
  const customerBalance = useMemo(() => {
    if (!matchedCustomerProfile) return null;
    return calculateCustomerBalance(matchedCustomerProfile, completedRecords, payments);
  }, [matchedCustomerProfile, completedRecords, payments]);

  const handleSelectSavedProfile = (profileId) => {
    setSelectedProfileId(profileId);
    if (!profileId) return;

    const profile = savedProfiles.find(p => p.id === profileId);
    if (profile) {
      playClickFeedback();
      setCustomerName(profile.customerName || '');
      setMobileNumber(profile.mobileNumber || '');
      setAddress(profile.address || '');
      setLocation(profile.location || profile.address || '');
      setWorkDescription(profile.workDescription || 'Standard Agricultural Tractor Work');
      setRatePerMinute(profile.ratePerMinute ? String(profile.ratePerMinute) : '100');
      if (profile.timerMode) setTimerMode(profile.timerMode);
      if (profile.durationMinutesPreset) setDurationMinutes(profile.durationMinutesPreset);
      setErrors({});
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    if (!ratePerMinute || Number(ratePerMinute) <= 0) {
      newErrors.ratePerMinute = 'Valid rate per minute is required';
    }
    if (timerMode === 'countdown' && (!durationMinutes || Number(durationMinutes) <= 0)) {
      newErrors.durationMinutes = 'Please set duration in minutes';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createCustomerObject = () => {
    const todayStr = new Date().toISOString();
    return {
      id: matchedCustomerProfile?.id || `CUST-${Date.now().toString().slice(-6)}`,
      customerName: customerName.trim(),
      mobileNumber: mobileNumber.trim(),
      address: address.trim(),
      location: location.trim() || address.trim(),
      workDescription: workDescription.trim() || 'Standard Agricultural Tractor Work',
      ratePerMinute: Number(ratePerMinute) || 0,
      timerMode,
      durationMinutesPreset: timerMode === 'countdown' ? Number(durationMinutes) || 20 : null,
      status: 'in_progress',
      createdAt: matchedCustomerProfile?.createdAt || todayStr,
      expenses: {
        diesel: 0,
        driver: 0,
        food: 0,
        other: 0,
      }
    };
  };

  const handleStartWork = (e) => {
    e.preventDefault();
    if (!validate()) return;
    playClickFeedback();
    const newCustomer = createCustomerObject();
    onStartCustomerWork(newCustomer);
  };

  const handleSaveOnly = (e) => {
    e.preventDefault();
    if (!validate()) return;
    playClickFeedback();
    const newCustomer = {
      ...createCustomerObject(),
      status: 'pending',
    };
    onSaveToQueue(newCustomer);
  };

  const handleResetForm = () => {
    playClickFeedback();
    setSelectedProfileId('');
    setCustomerName('');
    setMobileNumber('');
    setAddress('');
    setLocation('');
    setWorkDescription('');
    setRatePerMinute('');
    setTimerMode('stopwatch');
    setDurationMinutes(20);
    setErrors({});
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="bg-white border-b border-[#E2E2DC] -mx-4 -mt-4 px-4 py-3 sm:py-3.5 mb-2">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
              New Job Setup
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#1A1A1A]">
              Add Tractor Customer
            </h2>
          </div>
          <button
            type="button"
            onClick={handleResetForm}
            className="text-xs font-bold text-gray-500 hover:text-gray-800 bg-[#F7F7F5] border border-gray-300 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
            title="Reset form fields (Saved history is not deleted)"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Form
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleStartWork} className="card-base bg-white space-y-4 border-2 border-[#1F5E3B]/20">
        {/* Saved Customers Quick Selector if existing customers exist */}
        {savedProfiles.length > 0 && (
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#1F5E3B] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Select Existing Customer Profile
              </label>
              <span className="text-[10px] text-emerald-800 font-semibold">
                {savedProfiles.length} Saved Profiles
              </span>
            </div>
            <select
              value={selectedProfileId}
              onChange={(e) => handleSelectSavedProfile(e.target.value)}
              className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1F5E3B] cursor-pointer"
            >
              <option value="">-- Choose an existing customer (or enter new below) --</option>
              {savedProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.customerName} {p.mobileNumber ? `(${p.mobileNumber})` : ''} - ₹{p.ratePerMinute || 100}/min
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Existing Customer Live Balance Banner if customer matched */}
        {customerBalance && (
          <div className="bg-white rounded-2xl p-3 border-2 border-[#1F5E3B]/30 shadow-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#1F5E3B] text-white flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Saved Customer Balance</span>
                  <div className="font-bold text-gray-900 text-xs">{matchedCustomerProfile.customerName}</div>
                </div>
              </div>
                {onOpenCustomerProfile && (
                  <button
                    type="button"
                    onClick={() => onOpenCustomerProfile(matchedCustomerProfile)}
                    className="text-[11px] font-bold text-[#1F5E3B] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1"
                  >
                    <IndianRupee className="w-3.5 h-3.5 text-[#1F5E3B]" /> Ledger / Profile
                  </button>
                )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-gray-100">
              <div className="bg-[#F7F7F5] rounded-lg p-1.5">
                <span className="text-[9px] uppercase font-bold text-gray-500 block">Total Work</span>
                <span className="font-black text-gray-900 font-timer">
                  {formatCurrency(customerBalance.totalAmount)}
                </span>
              </div>
              <div className="bg-[#F7F7F5] rounded-lg p-1.5">
                <span className="text-[9px] uppercase font-bold text-blue-600 block">Paid</span>
                <span className="font-black text-blue-700 font-timer">
                  {formatCurrency(customerBalance.paidAmount)}
                </span>
              </div>
              <div className={`rounded-lg p-1.5 ${customerBalance.pendingAmount > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                <span className="text-[9px] uppercase font-bold block">Pending</span>
                <span className="font-black font-timer">
                  {formatCurrency(customerBalance.pendingAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Customer Name */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <User className="w-4 h-4 text-[#1F5E3B]" /> Customer Name *
          </label>
          <input
            type="text"
            placeholder="Enter Customer Name"
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              setSelectedProfileId('');
              if (errors.customerName) setErrors({ ...errors, customerName: null });
            }}
            className={`w-full bg-[#F7F7F5] border rounded-xl px-3.5 py-3 text-base font-bold text-gray-900 focus:bg-white outline-none transition-colors ${
              errors.customerName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-[#1F5E3B]'
            }`}
          />
          {errors.customerName && (
            <p className="text-xs text-red-600 font-semibold">{errors.customerName}</p>
          )}
        </div>

        {/* Mobile Number & Address Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-[#1F5E3B]" /> Mobile Number
            </label>
            <input
              type="tel"
              placeholder="+91 8xxxxxxxx8"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-3 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#1F5E3B]" /> Village / Address
            </label>
            <input
              type="text"
              placeholder="Asansol"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
            />
          </div>
        </div>

        {/* Field / Work Location */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#1F5E3B]" /> Field / Work Location
            </label>
            <button
              type="button"
              onClick={handleUseGpsLocation}
              disabled={isDetectingGps}
              className="text-[11px] font-bold text-[#1F5E3B] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all active:scale-95"
              title="Detect current GPS location"
            >
              <MapPin className={`w-3 h-3 ${isDetectingGps ? 'animate-bounce' : ''}`} />
              <span>{isDetectingGps ? 'Detecting...' : 'Use GPS'}</span>
            </button>
          </div>
          <input
            type="text"
            placeholder="e.g. Kolkata, West Bengal or Field Locality"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
          />
        </div>

        {/* Work Description */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-[#1F5E3B]" /> Work Description
          </label>
          <input
            type="text"
            placeholder="Rotavator tillage, deep ploughing, laser leveling"
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            className="w-full bg-[#F7F7F5] border border-gray-300 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-900 focus:bg-white focus:border-[#1F5E3B] outline-none"
          />

          {/* Quick Work Suggestions */}
          <div className="flex flex-wrap gap-1.5 pt-1.5">
            {workSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setWorkDescription(item)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                  workDescription === item
                    ? 'bg-[#1F5E3B] text-white border-[#1F5E3B]'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Rate Per Minute (₹) */}
        <div className="space-y-1.5 pt-2 border-t border-[#E2E2DC]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-[#1F5E3B]" /> Rate Per Minute (₹) *
            </label>
            {ratePerMinute !== '' && Number(ratePerMinute) > 0 && (
              <span className="text-xs font-black text-[#1F5E3B] font-timer">
                ₹{ratePerMinute}/min (₹{Number(ratePerMinute) * 60}/hour)
              </span>
            )}
          </div>

          <input
            type="number"
            min="0"
            placeholder="Rate"
            value={ratePerMinute}
            onFocus={(e) => {
              if (e.target.value === '0') e.target.select();
            }}
            onChange={(e) => {
              const val = e.target.value.replace(/^0+(?=\d)/, '');
              setRatePerMinute(val);
              if (errors.ratePerMinute) setErrors({ ...errors, ratePerMinute: null });
            }}
            className={`w-full bg-[#F7F7F5] border rounded-xl px-3.5 py-3 text-lg font-black text-gray-900 font-timer focus:bg-white outline-none ${
              errors.ratePerMinute ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-[#1F5E3B]'
            }`}
          />
          {errors.ratePerMinute && (
            <p className="text-xs text-red-600 font-semibold">{errors.ratePerMinute}</p>
          )}

          {/* Rate Quick Presets */}
          <div className="flex flex-wrap gap-2 pt-1">
            {ratePresets.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRatePerMinute(String(r));
                  if (errors.ratePerMinute) setErrors({ ...errors, ratePerMinute: null });
                }}
                className={`flex-1 min-w-[50px] py-2 rounded-xl text-xs font-black font-timer transition-all border ${
                  String(ratePerMinute) === String(r)
                    ? 'bg-[#1F5E3B] text-white border-[#1F5E3B] shadow-sm'
                    : 'bg-[#F7F7F5] text-gray-800 border-gray-300 hover:bg-gray-200'
                }`}
              >
                ₹{r}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Main Mode Options: Stopwatch | Count Down | Manual */}
        <div className="space-y-2 pt-2 border-t border-[#E2E2DC]">
          <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#1F5E3B]" /> Select Operation Mode
          </label>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* 1. Stopwatch Mode */}
            <button
              type="button"
              onClick={() => setTimerMode('stopwatch')}
              className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                timerMode === 'stopwatch'
                  ? 'border-[#1F5E3B] bg-emerald-50/60 shadow-sm'
                  : 'border-gray-300 bg-[#F7F7F5] text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <Clock className={`w-4 h-4 ${timerMode === 'stopwatch' ? 'text-[#1F5E3B]' : 'text-gray-400'}`} />
                {timerMode === 'stopwatch' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1F5E3B]" />
                )}
              </div>
              <div className="mt-2">
                <div className="font-bold text-xs sm:text-sm text-gray-900 leading-tight">Stopwatch</div>
                <div className="text-[10px] text-gray-500 mt-0.5 hidden sm:block">Count up from 00:00</div>
              </div>
            </button>

            {/* 2. Count Down Mode */}
            <button
              type="button"
              onClick={() => setTimerMode('countdown')}
              className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                timerMode === 'countdown'
                  ? 'border-[#1F5E3B] bg-emerald-50/60 shadow-sm'
                  : 'border-gray-300 bg-[#F7F7F5] text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <TimerIcon className={`w-4 h-4 ${timerMode === 'countdown' ? 'text-[#1F5E3B]' : 'text-gray-400'}`} />
                {timerMode === 'countdown' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1F5E3B]" />
                )}
              </div>
              <div className="mt-2">
                <div className="font-bold text-xs sm:text-sm text-gray-900 leading-tight">Count Down</div>
                <div className="text-[10px] text-gray-500 mt-0.5 hidden sm:block">Circular gauge timer</div>
              </div>
            </button>

            {/* 3. Manual Mode */}
            <button
              type="button"
              onClick={() => setTimerMode('manual')}
              className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                timerMode === 'manual'
                  ? 'border-[#1F5E3B] bg-emerald-50/60 shadow-sm'
                  : 'border-gray-300 bg-[#F7F7F5] text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <Edit3 className={`w-4 h-4 ${timerMode === 'manual' ? 'text-[#1F5E3B]' : 'text-gray-400'}`} />
                {timerMode === 'manual' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1F5E3B]" />
                )}
              </div>
              <div className="mt-2">
                <div className="font-bold text-xs sm:text-sm text-gray-900 leading-tight">Manual</div>
                <div className="text-[10px] text-gray-500 mt-0.5 hidden sm:block">Enter start & end time</div>
              </div>
            </button>
          </div>
        </div>

        {/* If Countdown: Set Duration in Minutes */}
        {timerMode === 'countdown' && (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
            <label className="text-xs font-bold text-[#1F5E3B] flex items-center justify-between">
              <span>Set Duration in Minutes *</span>
              <span className="font-black text-sm font-timer text-[#1F5E3B]">
                {durationMinutes || 0} Minutes {ratePerMinute ? `(₹${(Number(durationMinutes) || 0) * Number(ratePerMinute)})` : ''}
              </span>
            </label>

            <input
              type="number"
              min="0"
              max="600"
              placeholder="0"
              value={durationMinutes === 0 ? '0' : (durationMinutes || '')}
              onFocus={(e) => {
                if (e.target.value === '0') e.target.select();
              }}
              onChange={(e) => {
                const val = e.target.value.replace(/^0+(?=\d)/, '');
                setDurationMinutes(val === '' ? '' : Math.max(0, Number(val)));
              }}
              className="w-full bg-white border border-emerald-300 rounded-xl px-3.5 py-2.5 text-base font-black font-timer text-gray-900 outline-none"
            />

            {/* Quick Duration Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {durationPresets.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMinutes(m)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    Number(durationMinutes) === m
                      ? 'bg-[#1F5E3B] text-white border-[#1F5E3B]'
                      : 'bg-white text-gray-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        )}

        {/* If Manual Mode Selected */}
        {timerMode === 'manual' && (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 text-xs text-gray-700">
            <p className="font-semibold text-[#1F5E3B]">
              ℹ️ Manual mode selected.
            </p>
            <p className="text-gray-600 mt-0.5">
              Clicking "OPEN MANUAL WORK ENTRY" will open the Manual Entry form in your Diary where you can enter exact start and end times and download the PDF bill!
            </p>
          </div>
        )}

        {/* Action Buttons (Large Outdoor Touch Targets) */}
        <div className="pt-3 border-t border-[#E2E2DC] space-y-2.5">
          <button
            type="submit"
            className="btn-primary w-full py-4 text-base sm:text-lg shadow-lg"
          >
            <Play className="w-5 h-5 fill-current" />
            {timerMode === 'manual' ? 'OPEN MANUAL WORK ENTRY' : 'START CUSTOMER WORK'}
          </button>

          <button
            type="button"
            onClick={handleSaveOnly}
            className="btn-outline w-full py-3 text-sm"
          >
            <Save className="w-4 h-4" /> Save Customer to Queue
          </button>
        </div>
      </form>
    </div>
  );
}
