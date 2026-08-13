import axios from 'axios';

// Map OpenWeatherMap Condition ID to WMO (Open-Meteo) weather codes
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

// Estimate UV Index based on weather code
function estimateUvIndex(code) {
  if ([0].includes(code)) return (5.5 + Math.random() * 2);
  if ([1, 2].includes(code)) return (3.5 + Math.random() * 1.5);
  if ([3, 45].includes(code)) return (1.5 + Math.random() * 1.0);
  return (0.5 + Math.random() * 0.5);
}

// Helper to reverse geocode coordinate to city name using OSM Nominatim
export const reverseGeocode = async (lat, lon) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'AtmosphereWeatherProxy/1.0' },
      timeout: 8000
    });
    const data = response.data;
    if (data && data.address) {
      const city = data.address.city || data.address.town || data.address.village || data.address.suburb;
      const country = data.address.country;
      return city ? `${city}, ${country}` : (data.address.state || country || "My Location");
    }
  } catch (e) {
    console.error("Reverse geocode error:", e.message);
  }
  return "My Location";
};

// Resolve city name query to lat/lon coordinates
export const getCoordsByCityName = async (city, apiKey) => {
  if (!city || city.trim().length === 0) {
    throw new Error("Missing city parameter.");
  }
  const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`;
  try {
    const response = await axios.get(geoUrl, { timeout: 8000 });
    const data = response.data;
    if (!data || data.length === 0) {
      throw new Error("City not found. Please check the city name and try again.");
    }
    return {
      lat: data[0].lat,
      lon: data[0].lon,
      name: `${data[0].name}, ${data[0].country}`
    };
  } catch (error) {
    if (error.response) {
      const err = new Error(error.response.status === 401 
        ? "Invalid API key. Please check your OpenWeatherMap API credentials."
        : (error.response.data?.message || "Geocoding check failed."));
      err.status = error.response.status;
      throw err;
    } else if (error.request) {
      const err = new Error("Network failure. OpenWeatherMap geocoder is unreachable.");
      err.status = 503;
      throw err;
    }
    throw error;
  }
};

// Fallback Mock resolver
export const getMockCoordsByCityName = (city) => {
  if (city.toLowerCase() === 'invalid' || city.toLowerCase() === 'error') {
    throw new Error("City not found. Please check the city name and try again.");
  }
  return {
    lat: 51.5074,
    lon: -0.1278,
    name: `${city.charAt(0).toUpperCase() + city.slice(1)} (Demo)`
  };
};

// 1. Search locations via OWM Geocoding API
export const searchLocations = async (query, apiKey) => {
  try {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;
    const response = await axios.get(geoUrl, { timeout: 8000 });
    const data = response.data;

    return data.map(item => ({
      name: item.name,
      latitude: item.lat,
      longitude: item.lon,
      admin1: item.state || '',
      country: item.country
    }));
  } catch (error) {
    if (error.response) {
      const err = new Error(error.response.status === 401
        ? "Invalid API key. Please check your OpenWeatherMap API credentials."
        : (error.response.data?.message || "Geocoding query error."));
      err.status = error.response.status;
      throw err;
    } else if (error.request) {
      const err = new Error("Network failure. Geocoding endpoints are currently unreachable.");
      err.status = 503;
      throw err;
    }
    throw error;
  }
};

// 2. Fetch all weather data from OWM and structure it
export const fetchWeatherData = async (lat, lon, apiKey) => {
  const cityName = await reverseGeocode(lat, lon);

  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const pollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

  let currentRes, forecastRes, pollutionRes;
  try {
    // Async parallel requests using axios
    [currentRes, forecastRes, pollutionRes] = await Promise.all([
      axios.get(currentUrl, { timeout: 8000 }),
      axios.get(forecastUrl, { timeout: 8000 }),
      axios.get(pollutionUrl, { timeout: 8000 })
    ]);
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      let msg = "Request failed.";
      if (status === 401) {
        msg = "Invalid API key. Please check your OpenWeatherMap API credentials.";
      } else if (status === 404) {
        msg = "City not found. Please check the coordinates and try again.";
      } else if (status === 429) {
        msg = "OpenWeatherMap API rate limit exceeded. Please try again later.";
      } else {
        msg = `OpenWeatherMap API error: ${error.response.data?.message || "Request failed"}`;
      }
      const err = new Error(msg);
      err.status = status;
      throw err;
    } else if (error.request) {
      const err = new Error("API unavailable. OpenWeatherMap servers are currently unreachable.");
      err.status = 503;
      throw err;
    } else {
      const err = new Error(error.message || "Unexpected response during weather fetch.");
      err.status = 500;
      throw err;
    }
  }

  const currentData = currentRes.data;
  const forecastData = forecastRes.data;
  const pollutionData = pollutionRes.data;

  // Validate response data structures
  if (!currentData || !currentData.main || !forecastData || !forecastData.list) {
    throw new Error("Unexpected response: Weather data is missing or incomplete.");
  }

  // Map Current Conditions
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

  // Map Hourly Conditions (24 hours -> next 8 slots of 3-hour blocks)
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

  // Group 3-hour forecasts by calendar date
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

  // Group stats calculations
  Object.keys(dailyGroups).slice(0, 7).forEach(dateStr => {
    const daySlots = dailyGroups[dateStr];
    const temps = daySlots.map(s => s.main.temp);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const maxPop = Math.max(...daySlots.map(s => s.pop || 0)) * 100;
    
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

  // Parse AQI
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

  return {
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
};

// High-fidelity Mock payload for Keyless Demo Mode
export const getMockWeatherData = async (lat, lon) => {
  const cityName = await reverseGeocode(lat, lon);
  const mockAqiIndex = Math.floor(Math.random() * 3) + 1; // 1 to 3
  const aqiLabels = { 1: "Good", 2: "Fair", 3: "Moderate" };

  return {
    cityName: `${cityName} (Demo)`,
    latitude: lat,
    longitude: lon,
    current: {
      temperature_2m: Math.round((16.5 + (Math.random() - 0.5) * 4) * 10) / 10,
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
    },
    aqi: {
      index: mockAqiIndex,
      label: aqiLabels[mockAqiIndex],
      pm25: Math.round((8 + Math.random() * 12) * 10) / 10,
      pm10: Math.round((15 + Math.random() * 20) * 10) / 10
    },
    fetchedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
};
