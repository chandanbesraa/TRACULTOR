import React, { useState, useEffect, useRef } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Compass, MapPin, RefreshCw, AlertTriangle, CheckCircle2, ChevronRight, Sparkles, Search, X } from 'lucide-react';
import { fetchLiveWeather } from '../utils/weatherApi';
import { detectDeviceGpsLocation, getCachedLocation, reverseGeocodeLocation, searchCities, POPULAR_AGRI_DISTRICTS } from '../utils/locationService';
import { playClickFeedback } from '../utils/timer';

export default function Weather() {
  const [selectedLocation, setSelectedLocation] = useState(() => {
    return getCachedLocation() || POPULAR_AGRI_DISTRICTS[0];
  });
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  const loadWeather = async (lat, lon) => {
    setLoading(true);
    try {
      const data = await fetchLiveWeather(lat, lon);
      setWeatherData(data);
    } catch (err) {
      console.error('Weather load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Automatic GPS Location Detection on Component Mount
  useEffect(() => {
    let isMounted = true;

    const autoDetectGpsWeather = async () => {
      // 1. If we have a cached location, load it immediately to prevent delay
      const cached = getCachedLocation();
      if (cached) {
        setSelectedLocation(cached);
        loadWeather(cached.lat, cached.lon);
      }

      // 2. Query device GPS in background to fetch fresh accurate current location
      if (navigator.geolocation) {
        try {
          const detected = await detectDeviceGpsLocation({ timeout: 8000, maximumAge: 60000 });
          if (isMounted && detected) {
            setSelectedLocation(detected);
            loadWeather(detected.lat, detected.lon);
          }
        } catch (e) {
          console.warn('Auto GPS notice:', e);
          if (isMounted && !cached) {
            loadWeather(POPULAR_AGRI_DISTRICTS[0].lat, POPULAR_AGRI_DISTRICTS[0].lon);
          }
        }
      } else if (!cached) {
        if (isMounted) {
          loadWeather(POPULAR_AGRI_DISTRICTS[0].lat, POPULAR_AGRI_DISTRICTS[0].lon);
        }
      }
    };

    autoDetectGpsWeather();
    return () => {
      isMounted = false;
    };
  }, []);

  // Manual GPS Refresh Trigger
  const handleUseGPS = async () => {
    playClickFeedback();
    if (!navigator.geolocation) {
      alert('Geolocation is not supported on this device.');
      return;
    }

    setIsDetectingGps(true);
    setLoading(true);

    try {
      const detected = await detectDeviceGpsLocation({ timeout: 12000, maximumAge: 0 });
      setSelectedLocation(detected);
      await loadWeather(detected.lat, detected.lon);
    } catch (err) {
      console.error('Manual GPS refresh error:', err);
      alert('Could not retrieve current GPS position. Please ensure location permissions are enabled.');
    } finally {
      setIsDetectingGps(false);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    playClickFeedback();
    loadWeather(selectedLocation.lat, selectedLocation.lon);
  };

  // Handle Search Input Change
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!q || q.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchCities(q);
      setSearchResults(results);
      setSearchLoading(false);
    }, 350);
  };

  const handleSelectSearchResult = (loc) => {
    playClickFeedback();
    const locationObj = {
      name: loc.displayName || loc.name,
      lat: loc.lat,
      lon: loc.lon,
      isGps: false,
    };
    setSelectedLocation(locationObj);
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults([]);
    loadWeather(locationObj.lat, locationObj.lon);
  };

  const handleDistrictDropdownChange = (e) => {
    playClickFeedback();
    const val = e.target.value;
    if (val === 'search_other') {
      setIsSearching(true);
      return;
    }
    const found = POPULAR_AGRI_DISTRICTS.find(d => d.name === val);
    if (found) {
      setSelectedLocation(found);
      loadWeather(found.lat, found.lon);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="bg-white border-b border-[#E2E2DC] -mx-4 -mt-4 px-4 py-3 sm:py-3.5 mb-2 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
              Agricultural Meteorology
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#1A1A1A]">
              Tractor Field Weather
            </h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading || isDetectingGps}
            className="p-2 rounded-xl bg-[#F7F7F5] hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1 border border-gray-300 transition-all active:scale-95"
            title="Refresh weather data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || isDetectingGps ? 'animate-spin text-[#1F5E3B]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Location / GPS Selector & Search Bar */}
      <div className="card-base bg-white p-3 border border-gray-200 space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/* Main Location Dropdown / Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MapPin className="w-4 h-4 text-[#1F5E3B] shrink-0" />
            <select
              value={selectedLocation.name}
              onChange={handleDistrictDropdownChange}
              className="w-full bg-[#F7F7F5] border border-gray-300 font-bold text-xs sm:text-sm text-gray-900 rounded-xl px-2.5 py-1.5 outline-none focus:border-[#1F5E3B] cursor-pointer truncate"
            >
              {/* Selected / GPS Location */}
              <option value={selectedLocation.name}>
                📍 {selectedLocation.name} {selectedLocation.isGps ? '(Current GPS)' : ''}
              </option>

              <optgroup label="Popular Agricultural Districts">
                {POPULAR_AGRI_DISTRICTS.filter(d => d.name !== selectedLocation.name).map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </optgroup>

              <option value="search_other">🔍 Search another city / village...</option>
            </select>
          </div>

          {/* Search Button Toggle */}
          <button
            type="button"
            onClick={() => {
              playClickFeedback();
              setIsSearching(!isSearching);
            }}
            className={`p-2 rounded-xl border text-xs font-bold transition-all ${
              isSearching
                ? 'bg-[#1F5E3B] text-white border-[#1F5E3B]'
                : 'bg-[#F7F7F5] text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
            title="Search city or location"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Manual GPS Re-detect Button */}
          <button
            type="button"
            onClick={handleUseGPS}
            disabled={isDetectingGps}
            className="text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-[#1F5E3B] border border-emerald-200 px-3 py-1.5 rounded-xl shrink-0 flex items-center gap-1 transition-all active:scale-95"
            title="Detect current device GPS location"
          >
            <MapPin className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-bounce' : ''}`} />
            <span>{isDetectingGps ? 'Locating...' : 'Use GPS'}</span>
          </button>
        </div>

        {/* Expandable Manual Search Bar */}
        {isSearching && (
          <div className="pt-2 border-t border-gray-100 space-y-2 animate-fadeIn">
            <div className="relative">
              <input
                type="text"
                placeholder="Type city or district (e.g. Kolkata, Patna, Ludhiana, Pune)..."
                value={searchQuery}
                onChange={handleSearchChange}
                autoFocus
                className="w-full bg-[#F7F7F5] border border-[#1F5E3B] font-bold text-xs sm:text-sm text-gray-900 rounded-xl pl-8 pr-8 py-2 outline-none"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Dropdown Results */}
            {searchLoading && (
              <div className="text-xs font-bold text-gray-500 py-1 text-center">
                Searching locations...
              </div>
            )}

            {!searchLoading && searchResults.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-gray-800 hover:bg-emerald-50 hover:text-[#1F5E3B] flex items-center justify-between transition-colors"
                  >
                    <span>{res.displayName}</span>
                    <span className="text-[10px] text-gray-400 font-normal">Select</span>
                  </button>
                ))}
              </div>
            )}

            {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <div className="text-xs text-gray-500 py-1 text-center font-medium">
                No matching location found. Please try another city name.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Temperature & Condition Card */}
      {weatherData && (
        <>
          <div className="card-base bg-gradient-to-br from-[#1F5E3B] to-[#16452B] text-white p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-300" />
                  {selectedLocation.name}
                </span>
                <h3 className="text-2xl font-black text-white mt-0.5">
                  {weatherData.condition}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
                <Sun className="w-7 h-7 text-amber-300" />
              </div>
            </div>

            {/* Big Temp and Quick Metrics */}
            <div className="flex items-baseline justify-between pt-1">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl sm:text-6xl font-black font-timer tracking-tight text-white">
                  {weatherData.temp}°
                </span>
                <span className="text-lg font-bold text-emerald-200">C</span>
              </div>
              <div className="text-right text-xs text-emerald-100 font-medium">
                <div>Feels like <strong>{weatherData.feelsLike}°C</strong></div>
                <div className="text-[10px] text-emerald-300 mt-0.5">Updated: {weatherData.updatedAt}</div>
              </div>
            </div>

            {/* 3 Agri Metric Pillars */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-emerald-600/60 text-center">
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-200 font-semibold uppercase">
                  <Wind className="w-3 h-3" /> Wind Speed
                </div>
                <div className="text-base font-black font-timer text-white mt-0.5">
                  {weatherData.windSpeed} <span className="text-xs font-normal">km/h</span>
                </div>
              </div>

              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-200 font-semibold uppercase">
                  <Droplets className="w-3 h-3" /> Humidity
                </div>
                <div className="text-base font-black font-timer text-white mt-0.5">
                  {weatherData.humidity}%
                </div>
              </div>

              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-200 font-semibold uppercase">
                  <CloudRain className="w-3 h-3" /> Rain Today
                </div>
                <div className="text-base font-black font-timer text-white mt-0.5">
                  {weatherData.precipitation} <span className="text-xs font-normal">mm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Agricultural Field Advisories */}
          <div className="card-base bg-white p-4 border border-gray-200 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#1F5E3B]" /> Tractor Operation Advisories
            </div>

            {/* Spraying Advisory */}
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              weatherData.windSpeed > 20
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              {weatherData.windSpeed > 20 ? (
                <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#1F5E3B] mt-0.5 shrink-0" />
              )}
              <div>
                <strong className="block font-bold">Crop Spraying & Chemical Application:</strong>
                <p className="mt-0.5">{weatherData.sprayAdvisory}</p>
              </div>
            </div>

            {/* Field Condition Advisory */}
            <div className="p-3 rounded-xl border bg-gray-50 border-gray-200 text-xs text-gray-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#1F5E3B] mt-0.5 shrink-0" />
              <div>
                <strong className="block font-bold">Soil & Field Condition:</strong>
                <p className="mt-0.5 text-gray-600">{weatherData.advice}</p>
              </div>
            </div>
          </div>

          {/* 5-Day Agricultural Forecast */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
              5-Day Field Work Forecast
            </div>

            <div className="space-y-1.5">
              {(weatherData.forecast || []).map((day, idx) => (
                <div
                  key={idx}
                  className="card-base bg-white p-3 border border-gray-200 flex items-center justify-between text-xs"
                >
                  <div className="w-24 font-bold text-gray-900">{day.date}</div>
                  <div className="flex-1 text-center font-semibold text-gray-600 truncate px-2">
                    {day.condition}
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-[11px] font-bold text-blue-700">
                      🌧️ {day.rainChance}%
                    </span>
                    <span className="font-black font-timer text-gray-900 min-w-[65px]">
                      {day.maxTemp}° / <span className="text-gray-400 font-normal">{day.minTemp}°</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
