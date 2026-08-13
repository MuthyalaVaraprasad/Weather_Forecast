import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getCache, setCache } from './cache.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const API_KEY = process.env.OPENWEATHER_API_KEY;

// Check if OWM API Key is present. If not, activate demo/fallback mode.
const isDemoMode = !API_KEY || API_KEY.trim() === '' || API_KEY.includes('your_');

if (isDemoMode) {
  console.warn("⚠️ WARNING: OPENWEATHER_API_KEY is not configured in .env. Operating in demo mode with fallback weather data.");
}

// Map OpenWeatherMap Condition ID to standard WMO weather codes
function mapOwmIdToWmoCode(id) {
  if (id === 800) return 0; // Clear
  if (id === 801) return 1; // Mainly Clear
  if (id === 802) return 2; // Partly Cloudy
  if (id === 803 || id === 804) return 3; // Overcast
  if (id >= 700 && id < 800) return 45; // Foggy/Mist
  if (id >= 300 && id < 400) return 51; // Drizzle
  if (id >= 500 && id < 600) {
    if (id === 511) return 66; // Freezing Rain
    if (id >= 520 && id <= 531) return 80; // Rain Showers
    if (id === 500) return 61; // Light Rain
    return 63; // Moderate/Heavy Rain
  }
  if (id >= 600 && id < 700) {
    if (id === 602) return 75; // Heavy Snow
    if (id === 611 || id === 612) return 77; // Sleet
    if (id >= 620 && id <= 622) return 85; // Snow Showers
    return 71; // Snow
  }
  if (id >= 200 && id < 300) return 95; // Thunderstorm
  return 3; // Default Overcast
}

// Estimate UV Index based on weather code (as standard OWM forecast API doesn't include UV)
function estimateUvIndex(code) {
  if ([0].includes(code)) return (5.5 + Math.random() * 2);
  if ([1, 2].includes(code)) return (3.5 + Math.random() * 1.5);
  if ([3, 45].includes(code)) return (1.5 + Math.random() * 1.0);
  return (0.5 + Math.random() * 0.5);
}

// Helper to reverse geocode coordinate to city name using OSM Nominatim
async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AtmosphereWeatherProxy/1.0' }
    });
    if (!res.ok) return "My Location";
    const data = await res.json();
    if (data && data.address) {
      const city = data.address.city || data.address.town || data.address.village || data.address.suburb;
      const country = data.address.country;
      return city ? `${city}, ${country}` : (data.address.state || country || "My Location");
    }
  } catch (e) {
    console.error("Reverse geocode error:", e);
  }
  return "My Location";
}

// 1. Search Autocomplete Endpoint
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query || query.trim().length < 2) {
    return res.json({ results: [] });
  }

  // Validate input: permit only letters, spaces, and punctuation
  const cityRegex = /^[a-zA-Z\s-,\u00C0-\u017F]+$/;
  if (!cityRegex.test(query)) {
    return res.json({ results: [], warning: "Invalid input query. Numbers and special characters are forbidden." });
  }

  const cacheKey = `search:${query.toLowerCase()}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return res.json({ results: cachedData });
  }

  // Fallback demo cities if API key is not configured
  if (isDemoMode) {
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

  try {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
    const response = await fetch(geoUrl);
    if (!response.ok) throw new Error("OpenWeatherMap Geocode error");
    const data = await response.json();

    const results = data.map(item => ({
      name: item.name,
      latitude: item.lat,
      longitude: item.lon,
      admin1: item.state || '',
      country: item.country
    }));

    setCache(cacheKey, results, 1800); // cache search for 30 minutes
    res.json({ results });
  } catch (error) {
    console.error("Geocoding fetch error:", error);
    res.status(500).json({ error: "Failed to search locations." });
  }
});

// 2. Weather Details Endpoint (Adapts OWM response to expected Dashboard format)
app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Missing required parameters: lat and lon." });
  }

  const cacheKey = `weather:${lat}:${lon}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  // Return Mock Weather Data in Demo Mode
  if (isDemoMode) {
    const mockData = JSON.parse(JSON.stringify(MOCK_WEATHER_DATA));
    // Set custom coordinates & dates
    const cityName = await reverseGeocode(lat, lon);
    mockData.cityName = `${cityName} (Demo)`;
    mockData.latitude = lat;
    mockData.longitude = lon;
    mockData.fetchedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Set custom simulated AQI
    const mockAqiIndex = Math.floor(Math.random() * 3) + 1; // 1 to 3
    const aqiLabels = { 1: "Good", 2: "Fair", 3: "Moderate" };
    mockData.aqi = {
      index: mockAqiIndex,
      label: aqiLabels[mockAqiIndex],
      pm25: Math.round((8 + Math.random() * 12) * 10) / 10,
      pm10: Math.round((15 + Math.random() * 20) * 10) / 10
    };
    
    // Slight noise to make values feel live
    const noise = (Math.random() - 0.5) * 4;
    mockData.current.temperature_2m = Math.round((mockData.current.temperature_2m + noise) * 10) / 10;
    mockData.current.apparent_temperature = Math.round((mockData.current.temperature_2m - 1) * 10) / 10;
    
    setCache(cacheKey, mockData, 60); // short Cache for demo data
    return res.json(mockData);
  }

  try {
    // Resolve city name first
    const cityName = await reverseGeocode(lat, lon);

    // Call current weather
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    // Call 5-day / 3-hour forecast
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    // Call Air Pollution API
    const pollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    const [currentRes, forecastRes, pollutionRes] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl),
      fetch(pollutionUrl)
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      throw new Error("Failed to fetch weather from OpenWeatherMap");
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();
    let pollutionData = null;
    if (pollutionRes && pollutionRes.ok) {
      try {
        pollutionData = await pollutionRes.json();
      } catch (e) {
        console.error("Failed to parse pollution JSON", e);
      }
    }

    // Map OWM Current Weather
    const currentCode = currentData.weather[0] ? currentData.weather[0].id : 800;
    const wmoCurrentCode = mapOwmIdToWmoCode(currentCode);
    const rainVol = currentData.rain ? (currentData.rain['1h'] || currentData.rain['3h'] || 0) : 0;

    const formattedCurrent = {
      temperature_2m: currentData.main.temp,
      apparent_temperature: currentData.main.feels_like,
      relative_humidity_2m: currentData.main.humidity,
      precipitation: rainVol,
      pressure_msl: currentData.main.pressure,
      wind_speed_10m: currentData.wind.speed * 3.6, // convert m/s to km/h
      wind_direction_10m: currentData.wind.deg,
      weather_code: wmoCurrentCode,
      is_day: currentData.dt > currentData.sys.sunrise && currentData.dt < currentData.sys.sunset ? 1 : 0
    };

    // Parse Hourly (Next 24 Hours, i.e., next 8 slots in the 3-hour forecast)
    const hourlyTimes = [];
    const hourlyTemps = [];
    const hourlyCodes = [];
    const hourlyPops = [];

    const slots = forecastData.list.slice(0, 8);
    slots.forEach(slot => {
      hourlyTimes.push(new Date(slot.dt * 1000).toISOString());
      hourlyTemps.push(slot.main.temp);
      hourlyCodes.push(mapOwmIdToWmoCode(slot.weather[0] ? slot.weather[0].id : 800));
      hourlyPops.push(Math.round((slot.pop || 0) * 100));
    });

    const formattedHourly = {
      time: hourlyTimes,
      temperature_2m: hourlyTemps,
      weather_code: hourlyCodes,
      precipitation_probability: hourlyPops
    };

    // Parse Daily Forecast (Aggregate 3-hour slots into days)
    const dailyGroups = {};
    forecastData.list.forEach(slot => {
      const dateStr = new Date(slot.dt * 1000).toISOString().split('T')[0];
      if (!dailyGroups[dateStr]) {
        dailyGroups[dateStr] = [];
      }
      dailyGroups[dateStr].push(slot);
    });

    const dailyTimes = [];
    const dailyMax = [];
    const dailyMin = [];
    const dailyCodes = [];
    const dailyPops = [];
    const dailyUv = [];

    // Map each group to daily stats
    Object.keys(dailyGroups).slice(0, 7).forEach(dateStr => {
      const daySlots = dailyGroups[dateStr];
      const temps = daySlots.map(s => s.main.temp);
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);
      const maxPop = Math.max(...daySlots.map(s => s.pop || 0)) * 100;
      
      // Use midday slot for the weather code representation
      const midIndex = Math.floor(daySlots.length / 2);
      const repCodeId = daySlots[midIndex].weather[0] ? daySlots[midIndex].weather[0].id : 800;
      const wmoDailyCode = mapOwmIdToWmoCode(repCodeId);

      dailyTimes.push(dateStr);
      dailyMin.push(minTemp);
      dailyMax.push(maxTemp);
      dailyCodes.push(wmoDailyCode);
      dailyPops.push(Math.round(maxPop));
      dailyUv.push(estimateUvIndex(wmoDailyCode));
    });

    const formattedDaily = {
      time: dailyTimes,
      weather_code: dailyCodes,
      temperature_2m_max: dailyMax,
      temperature_2m_min: dailyMin,
      precipitation_probability_max: dailyPops,
      uv_index_max: dailyUv
    };

    const aqiIndex = pollutionData?.list?.[0]?.main?.aqi || 1;
    const pm25 = pollutionData?.list?.[0]?.components?.pm2_5 || 0;
    const pm10 = pollutionData?.list?.[0]?.components?.pm10 || 0;

    const aqiLabels = {
      1: "Good",
      2: "Fair",
      3: "Moderate",
      4: "Poor",
      5: "Very Poor"
    };
    const aqiLabel = aqiLabels[aqiIndex] || "Unknown";

    // Combined Adapted Response
    const responsePayload = {
      cityName,
      latitude: lat,
      longitude: lon,
      current: formattedCurrent,
      hourly: formattedHourly,
      daily: formattedDaily,
      aqi: {
        index: aqiIndex,
        label: aqiLabel,
        pm25,
        pm10
      },
      fetchedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setCache(cacheKey, responsePayload, 600); // Cache weather payload for 10 mins
    res.json(responsePayload);
  } catch (error) {
    console.error("Weather fetch proxy error:", error);
    res.status(500).json({ error: "Failed to fetch weather forecast proxy details." });
  }
});

// Mock weather data payload for Demo fallback mode
const MOCK_WEATHER_DATA = {
  cityName: "London, UK (Demo Mode)",
  current: {
    temperature_2m: 16.5,
    apparent_temperature: 15.2,
    relative_humidity_2m: 78,
    precipitation: 0.1,
    pressure_msl: 1013,
    wind_speed_10m: 14.5,
    wind_direction_10m: 230,
    weather_code: 2,
    is_day: 1
  },
  hourly: {
    time: Array.from({ length: 8 }, (_, i) => new Date(Date.now() + i * 3 * 3600000).toISOString()),
    temperature_2m: [16.5, 15.0, 14.2, 13.8, 14.5, 17.0, 18.2, 17.5],
    weather_code: [2, 3, 3, 45, 1, 0, 2, 2],
    precipitation_probability: [10, 20, 20, 15, 5, 0, 0, 10]
  },
  daily: {
    time: Array.from({ length: 6 }, (_, i) => new Date(Date.now() + i * 86400000).toISOString().split('T')[0]),
    weather_code: [2, 3, 61, 95, 0, 2],
    temperature_2m_max: [19.0, 17.5, 15.2, 16.8, 21.0, 20.2],
    temperature_2m_min: [13.0, 12.2, 11.0, 10.5, 12.0, 13.5],
    precipitation_probability_max: [20, 30, 80, 90, 5, 15],
    uv_index_max: [4.2, 2.5, 1.1, 0.8, 7.2, 5.0]
  }
};

// Start listening if run directly
if (process.env.NODE_ENV !== 'production' && import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`🚀 Weather proxy backend running locally at http://localhost:${PORT}`);
  });
}

// Also listen when triggered from nodemon / command line directly
app.listen(PORT, () => {
  console.log(`🚀 Weather proxy backend running at http://localhost:${PORT}`);
});

export default app;
