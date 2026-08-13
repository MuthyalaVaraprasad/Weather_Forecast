import NodeCache from 'node-cache';
import * as weatherService from '../services/weatherService.js';

// Setup Cache (stdTTL is 10 minutes (600s))
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Determine demo mode status based on env
const API_KEY = process.env.OPENWEATHER_API_KEY;
const isDemoMode = !API_KEY || API_KEY.trim() === '' || API_KEY.includes('your_');

/**
 * Autocomplete Search controller.
 * Validates inputs, caches queries, and queries Nominatim/OWM.
 */
export const getSearch = async (req, res, next) => {
  const query = req.query.q;
  if (!query || query.trim().length < 2) {
    return res.json({ results: [] });
  }

  // Validate Input: permit letters, spaces, hyphens, and standard accents (prevent injection)
  const cityRegex = /^[a-zA-Z\s-,\u00C0-\u017F]+$/;
  if (!cityRegex.test(query)) {
    return res.json({ results: [], warning: "Invalid characters in search input." });
  }

  const cacheKey = `search:${query.toLowerCase()}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json({ results: cachedData });
  }

  try {
    if (isDemoMode) {
      // Return predefined demo cities in demo mode
      const demoCities = [
        { name: "London", lat: 51.5074, lon: -0.1278, admin1: "England", country: "GB" },
        { name: "New York", lat: 40.7128, lon: -74.0060, admin1: "New York", country: "US" },
        { name: "Tokyo", lat: 35.6762, lon: 139.6503, admin1: "Tokyo", country: "JP" },
        { name: "Paris", lat: 48.8566, lon: 2.3522, admin1: "Île-de-France", country: "FR" },
        { name: "Sydney", lat: -33.8688, lon: 151.2093, admin1: "New South Wales", country: "AU" },
        { name: "Singapore", lat: 1.3521, lon: 103.8198, admin1: "Singapore", country: "SG" }
      ];
      const filtered = demoCities.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
      return res.json({ results: filtered });
    }

    const results = await weatherService.searchLocations(query, API_KEY);
    
    // Store in cache for 30 minutes (1800 seconds)
    cache.set(cacheKey, results, 1800);
    res.json({ results });
  } catch (error) {
    // Pass execution error to the Express errorHandler middleware
    next(error);
  }
};

/**
 * Weather details controller.
 * Feeds query coordinates to adapters and manages cache hits.
 */
export const getWeather = async (req, res, next) => {
  const { lat, lon } = req.query;
  
  if (!lat || !lon) {
    res.status(400);
    return next(new Error("Latitude and longitude query parameters are required."));
  }

  const cacheKey = `weather:${lat}:${lon}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    let payload;
    if (isDemoMode) {
      payload = await weatherService.getMockWeatherData(lat, lon);
    } else {
      payload = await weatherService.fetchWeatherData(lat, lon, API_KEY);
    }

    // Cache weather payload for 10 minutes (600 seconds)
    cache.set(cacheKey, payload, 600);
    res.json(payload);
  } catch (error) {
    // Forward error to Express global handler
    next(error);
  }
};
