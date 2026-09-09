/**
 * Location and Reverse Geocoding Service for TRACULATOR
 * Automatic device GPS detection, human-readable address resolution, and city search.
 */

export const POPULAR_AGRI_DISTRICTS = [
  { name: 'Kolkata, West Bengal', lat: 22.5726, lon: 88.3639 },
  { name: 'Asansol, West Bengal', lat: 23.6889, lon: 86.9661 },
  { name: 'Bardhaman, West Bengal', lat: 23.2324, lon: 87.8615 },
  { name: 'Durgapur, West Bengal', lat: 23.5204, lon: 87.3119 },
  { name: 'Bankura, West Bengal', lat: 23.2323, lon: 87.0715 },
  { name: 'Purulia, West Bengal', lat: 23.3321, lon: 86.3652 },
  { name: 'Patna, Bihar', lat: 25.5941, lon: 85.1376 },
  { name: 'Gaya, Bihar', lat: 24.7914, lon: 85.0002 },
  { name: 'Karnal, Haryana', lat: 29.6857, lon: 76.9905 },
  { name: 'Ludhiana, Punjab', lat: 30.9010, lon: 75.8573 },
  { name: 'Indore, Madhya Pradesh', lat: 22.7196, lon: 75.8577 },
  { name: 'Nashik, Maharashtra', lat: 19.9975, lon: 73.7898 },
  { name: 'Jaipur, Rajasthan', lat: 26.9124, lon: 75.7873 },
];

const CACHE_KEY = 'traculator_cached_location_v1';

/**
 * Get cached location from local storage
 */
export function getCachedLocation() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
      return parsed;
    }
  } catch (e) {
    // Ignore cache parse error
  }
  return null;
}

/**
 * Reverse geocode latitude & longitude to a clean human-readable name/address
 * Example: "Kolkata, West Bengal" or "Burdwan, West Bengal"
 */
export async function reverseGeocodeLocation(lat, lon) {
  // 1. Try BigDataCloud Client Reverse Geocoding API (Fast, Free, No key required)
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const locality = data.locality || data.city || data.principalSubdivision;
      const state = data.principalSubdivision;
      if (locality && state && locality !== state) {
        return `${locality}, ${state}`;
      }
      if (locality || state) {
        return locality || state;
      }
    }
  } catch (err) {
    console.warn('BigDataCloud geocode issue:', err);
  }

  // 2. Fallback to OpenStreetMap Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TraculatorApp/1.0' },
    });
    if (res.ok) {
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.address?.suburb;
      const state = data.address?.state;
      if (city && state) return `${city}, ${state}`;
      if (city || state) return city || state;
    }
  } catch (err) {
    console.warn('Nominatim geocode issue:', err);
  }

  return `Field Location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
}

/**
 * Detect current device GPS location with reverse geocoding
 * Returns { name, lat, lon, isGps: true }
 */
export function detectDeviceGpsLocation(options = { timeout: 10000, maximumAge: 300000 }) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      const cached = getCachedLocation() || POPULAR_AGRI_DISTRICTS[0];
      return resolve(cached);
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const readableName = await reverseGeocodeLocation(latitude, longitude);
          const locationObj = {
            name: readableName,
            lat: latitude,
            lon: longitude,
            isGps: true,
            updatedAt: Date.now(),
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(locationObj));
          resolve(locationObj);
        } catch (e) {
          const fallbackObj = {
            name: `Current Location (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`,
            lat: latitude,
            lon: longitude,
            isGps: true,
            updatedAt: Date.now(),
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(fallbackObj));
          resolve(fallbackObj);
        }
      },
      (error) => {
        console.warn('GPS detection notice:', error.message);
        const cached = getCachedLocation() || POPULAR_AGRI_DISTRICTS[0];
        resolve(cached);
      },
      {
        enableHighAccuracy: true,
        timeout: options.timeout || 10000,
        maximumAge: options.maximumAge || 300000,
      }
    );
  });
}

/**
 * Search cities or districts worldwide via Open-Meteo Geocoding
 */
export async function searchCities(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];

    return data.results.map((r) => {
      const statePart = r.admin1 ? `, ${r.admin1}` : '';
      const countryPart = r.country && r.country !== r.admin1 ? ` (${r.country})` : '';
      return {
        name: `${r.name}${statePart}`,
        cityName: r.name,
        state: r.admin1 || '',
        country: r.country || '',
        lat: r.latitude,
        lon: r.longitude,
        displayName: `${r.name}${statePart}${countryPart}`,
      };
    });
  } catch (err) {
    console.warn('City search error:', err);
    return [];
  }
}
