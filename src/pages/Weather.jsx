import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Compass, MapPin, RefreshCw, AlertTriangle, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { fetchLiveWeather, POPULAR_AGRI_DISTRICTS } from '../utils/weatherApi';
import { playClickFeedback } from '../utils/timer';

export default function Weather() {
  const [selectedDistrict, setSelectedDistrict] = useState(POPULAR_AGRI_DISTRICTS[0]);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gpsActive, setGpsActive] = useState(false);

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

  useEffect(() => {
    loadWeather(selectedDistrict.lat, selectedDistrict.lon);
  }, [selectedDistrict]);

  const handleDistrictChange = (e) => {
    playClickFeedback();
    const found = POPULAR_AGRI_DISTRICTS.find(d => d.name === e.target.value);
    if (found) {
      setSelectedDistrict(found);
      setGpsActive(false);
    }
  };

  const handleUseGPS = () => {
    playClickFeedback();
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setSelectedDistrict({
          name: 'Current Field GPS Location',
          lat: latitude,
          lon: longitude,
        });
        setGpsActive(true);
        loadWeather(latitude, longitude);
      },
      (err) => {
        console.error('GPS error:', err);
        setLoading(false);
        alert('Could not retrieve GPS location. Using default district.');
      }
    );
  };

  const handleRefresh = () => {
    playClickFeedback();
    loadWeather(selectedDistrict.lat, selectedDistrict.lon);
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
            disabled={loading}
            className="p-2 rounded-xl bg-[#F7F7F5] hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1 border border-gray-300"
            title="Refresh weather data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* District / Location Selector Bar */}
      <div className="card-base bg-white p-3 border border-gray-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MapPin className="w-4 h-4 text-[#1F5E3B] shrink-0" />
          <select
            value={gpsActive ? 'Current Field GPS Location' : selectedDistrict.name}
            onChange={handleDistrictChange}
            className="w-full bg-[#F7F7F5] border border-gray-300 font-bold text-xs sm:text-sm text-gray-900 rounded-xl px-2.5 py-1.5 outline-none focus:border-[#1F5E3B] cursor-pointer"
          >
            {gpsActive && (
              <option value="Current Field GPS Location">📍 Current Field GPS Location</option>
            )}
            {POPULAR_AGRI_DISTRICTS.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleUseGPS}
          className="text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-[#1F5E3B] border border-emerald-200 px-3 py-1.5 rounded-xl shrink-0 flex items-center gap-1"
        >
          <span>Use GPS</span>
        </button>
      </div>

      {/* Main Temperature & Condition Card */}
      {weatherData && (
        <>
          <div className="card-base bg-gradient-to-br from-[#1F5E3B] to-[#16452B] text-white p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                  {selectedDistrict.name}
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
