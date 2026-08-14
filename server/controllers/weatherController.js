import NodeCache from 'node-cache';
import * as weatherService from '../services/weatherService.js';

// Setup Cache (stdTTL is 5 minutes (300s), checkperiod is 120s)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

// Determine demo mode status based on env
const API_KEY = process.env.OPENWEATHER_API_KEY;
const isDemoMode = process.env.DEMO_MODE === 'true';

// Enforce configuration check
const verifyApiConfig = () => {
  if (!isDemoMode && (!API_KEY || API_KEY.trim() === '' || API_KEY.includes('your_'))) {
    const err = new Error("Weather service is not configured. Please contact the administrator.");
    err.status = 503;
    throw err;
  }
};

/**
 * Autocomplete Search controller.
 * Validates inputs, caches queries, and queries Nominatim/OWM.
 */
export const getSearch = async (req, res, next) => {
  try {
    verifyApiConfig();
  } catch (err) {
    return next(err);
  }

  const query = req.query.q;
  if (!query || query.trim().length < 2) {
    return res.json({ results: [] });
  }

  if (query.length > 80) {
    return res.status(400).json({ error: "Search query is too long." });
  }

  // Validate Input: permit letters, numbers, spaces, hyphens, commas, parentheses and standard accents (prevent injection)
  const cityRegex = /^[a-zA-Z0-9\s-,\(\)\u00C0-\u017F]+$/;
  if (!cityRegex.test(query)) {
    return res.status(400).json({ error: "Invalid characters in search input." });
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
        { name: "Hyderabad", latitude: 17.3850, longitude: 78.4867, admin1: "Telangana", country: "IN" },
        { name: "Delhi", latitude: 28.6139, longitude: 77.2090, admin1: "Delhi", country: "IN" },
        { name: "Mumbai", latitude: 19.0760, longitude: 72.8777, admin1: "Maharashtra", country: "IN" },
        { name: "Bengaluru", latitude: 12.9716, longitude: 77.5946, admin1: "Karnataka", country: "IN" },
        { name: "Chennai", latitude: 13.0827, longitude: 80.2707, admin1: "Tamil Nadu", country: "IN" },
        { name: "Kolkata", latitude: 22.5726, longitude: 88.3639, admin1: "West Bengal", country: "IN" },
        { name: "London", latitude: 51.5074, longitude: -0.1278, admin1: "England", country: "GB" },
        { name: "New York", latitude: 40.7128, longitude: -74.0060, admin1: "New York", country: "US" },
        { name: "Tokyo", latitude: 35.6762, longitude: 139.6503, admin1: "Tokyo", country: "JP" },
        { name: "Paris", latitude: 48.8566, longitude: 2.3522, admin1: "Île-de-France", country: "FR" },
        { name: "Sydney", latitude: -33.8688, longitude: 151.2093, admin1: "New South Wales", country: "AU" },
        { name: "Singapore", latitude: 1.3521, longitude: 103.8198, admin1: "Singapore", country: "SG" }
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
  try {
    verifyApiConfig();
  } catch (err) {
    return next(err);
  }

  const { lat, lon, city } = req.query;
  const hasCoordinates = lat && lon;
  
  if (!city && !hasCoordinates) {
    res.status(400);
    return next(new Error("Missing city name or coordinate parameters."));
  }

  // Validate inputs
  if (hasCoordinates) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    if (isNaN(latitude) || latitude < -90 || latitude > 90 || isNaN(longitude) || longitude < -180 || longitude > 180) {
      res.status(400);
      return next(new Error("Invalid coordinates provided."));
    }
  }
  if (city) {
    if (city.length > 80) {
      res.status(400);
      return next(new Error("City name query is too long."));
    }
    const cityRegex = /^[a-zA-Z0-9\s-,\(\)\u00C0-\u017F]+$/;
    if (!cityRegex.test(city)) {
      res.status(400);
      return next(new Error("City name contains invalid characters."));
    }
  }

  // Construct cache key prioritizing coordinates for high accuracy
  const cacheKey = hasCoordinates 
    ? `weather:${parseFloat(lat).toFixed(4)}:${parseFloat(lon).toFixed(4)}`
    : `weather:city:${city.toLowerCase().trim()}`;

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    let payload;
    if (hasCoordinates) {
      // Prioritize direct coordinate lookup to prevent redundant geocoding APIs
      if (isDemoMode) {
        payload = await weatherService.getMockWeatherData(parseFloat(lat), parseFloat(lon), city);
      } else {
        payload = await weatherService.fetchWeatherData(parseFloat(lat), parseFloat(lon), API_KEY, city);
      }
    } else {
      // 1. Resolve coordinates from city name
      let resolved;
      if (isDemoMode) {
        resolved = weatherService.getMockCoordsByCityName(city);
      } else {
        resolved = await weatherService.getCoordsByCityName(city, API_KEY);
      }
      
      // 2. Fetch using resolved coordinates
      if (isDemoMode) {
        payload = await weatherService.getMockWeatherData(resolved.lat, resolved.lon, resolved.name);
      } else {
        payload = await weatherService.fetchWeatherData(resolved.lat, resolved.lon, API_KEY, resolved.name);
      }
    }

    /**
     * Cache Strategy Explanation:
     * 
     * 1. Server-Side Performance Cache:
     *    Implemented here using `node-cache` in Express with a 5-minute (300s) TTL.
     *    Reduces downstream latency, mitigates rate limits, and prevents redundant 
     *    expensive requests to the OpenWeatherMap API for identical city searches.
     * 
     * 2. Client-Side Fallback/Offline Cache:
     *    Stored in the React client's browser `localStorage` on successful fetches.
     *    Acts as a fail-safe backup during network offline states, backend timeouts, 
     *    or server crashes.
     */
    cache.set(cacheKey, payload, 300);
    res.json(payload);
  } catch (error) {
    // Forward error to Express global handler
    next(error);
  }
};
