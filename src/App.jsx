import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  SunDim, MapPin, MapPinOff, Thermometer, Droplets, Wind, Sun, 
  CloudRain, Gauge, Clock, Calendar, Map as MapIcon, AlertCircle, 
  ArrowUp, ArrowDown, Moon, CloudSun, CloudMoon, Cloud, CloudFog, 
  CloudDrizzle, Snowflake, CloudLightning, Droplet
} from 'lucide-react';

// WMO Weather Codes mapping to description, icons, and body background classes
const WEATHER_CODES = {
  0: { label: 'Clear Sky', icon: 'sun', iconNight: 'moon', bg: 'weather-clear-day', bgNight: 'weather-clear-night' },
  1: { label: 'Mainly Clear', icon: 'cloud-sun', iconNight: 'cloud-moon', bg: 'weather-clear-day', bgNight: 'weather-clear-night' },
  2: { label: 'Partly Cloudy', icon: 'cloud-sun', iconNight: 'cloud-moon', bg: 'weather-cloudy-day', bgNight: 'weather-cloudy-night' },
  3: { label: 'Overcast', icon: 'cloud', iconNight: 'cloud', bg: 'weather-cloudy-day', bgNight: 'weather-cloudy-night' },
  45: { label: 'Foggy', icon: 'cloud-fog', iconNight: 'cloud-fog', bg: 'weather-foggy', bgNight: 'weather-foggy' },
  48: { label: 'Depositing Rime Fog', icon: 'cloud-fog', iconNight: 'cloud-fog', bg: 'weather-foggy', bgNight: 'weather-foggy' },
  51: { label: 'Light Drizzle', icon: 'cloud-drizzle', iconNight: 'cloud-drizzle', bg: 'weather-rainy', bgNight: 'weather-rainy' },
  53: { label: 'Moderate Drizzle', icon: 'cloud-drizzle', iconNight: 'cloud-drizzle', bg: 'weather-rainy', bgNight: 'weather-rainy' },
  55: { label: 'Heavy Drizzle', icon: 'cloud-drizzle', iconNight: 'cloud-drizzle', bg: 'weather-rainy', bgNight: 'weather-rainy' },
  56: { label: 'Light Freezing Drizzle', icon: 'cloud-drizzle', iconNight: 'cloud-drizzle', bg: 'weather-snowy', bgNight: 'weather-snowy' },
  57: { label: 'Dense Freezing Drizzle', icon: 'cloud-drizzle', iconNight: 'cloud-drizzle', bg: 'weather-snowy', bgNight: 'weather-snowy' },
  61: { label: 'Slight Rain', icon: 'cloud-rain', iconNight: 'cloud-rain', bg: 'weather-rainy', bgNight: 'weather-rainy' },
  63: { label: 'Moderate Rain', icon: 'cloud-rain', iconNight: 'cloud-rain', bg: 'weather-rainy', bgNight: 'weather-rainy' },
  65: { label: 'Heavy Rain', icon: 'cloud-rain', iconNight: 'cloud-rain', bg: 'weather-rainy', bgNight: 'weather-rainy' },
  66: { label: 'Light Freezing Rain', icon: 'cloud-rain', iconNight: 'cloud-rain', bg: 'weather-snowy', bgNight: 'weather-snowy' },
  67: { label: 'Heavy Freezing Rain', icon: 'cloud-rain', iconNight: 'cloud-rain', bg: 'weather-snowy', bgNight: 'weather-snowy' },
  71: { label: 'Slight Snowfall', icon: 'snowflake', iconNight: 'snowflake', bg: 'weather-snowy', bgNight: 'weather-snowy' },
  73: { label: 'Moderate Snowfall', icon: 'snowflake', iconNight: 'snowflake', bg: 'weather-snowy', bgNight: 'weather-snowy' },
  75: { label: 'Heavy Snowfall', icon: 'snowflake', iconNight: 'snowflake', bg: 'weather-snowy', bgNight: 'weather-snowy' },
  77: { label: 'Snow Grains', icon: 'snowflake', iconNight: 'snowflake', bg: 'weather-snowy', bgNight: 'weather-snowy' },
  80: { label: 'Slight Rain Showers', icon: 'cloud-rain', iconNight: 'cloud-rain', bg: 'weather-rainy', bgNight: 'weather-rainy' },
  81: { label: 'Moderate Rain Showers', icon: 'cloud-rain', iconNight: 'cloud-rain', bg: 'weather-rainy', bgNight: 'weather-rainy' },
  82: { label: 'Violent Rain Showers', icon: 'cloud-rain', iconNight: 'cloud-rain', bg: 'weather-rainy', bgNight: 'weather-rainy' },
  85: { label: 'Slight Snow Showers', icon: 'snowflake', iconNight: 'snowflake', bg: 'weather-snowy', bgNight: 'weather-snowy' },
  86: { label: 'Heavy Snow Showers', icon: 'snowflake', iconNight: 'snowflake', bg: 'weather-snowy', bgNight: 'weather-snowy' },
  95: { label: 'Thunderstorm', icon: 'cloud-lightning', iconNight: 'cloud-lightning', bg: 'weather-stormy', bgNight: 'weather-stormy' },
  96: { label: 'Thunderstorm with Hail', icon: 'cloud-lightning', iconNight: 'cloud-lightning', bg: 'weather-stormy', bgNight: 'weather-stormy' },
  99: { label: 'Thunderstorm with Heavy Hail', icon: 'cloud-lightning', iconNight: 'cloud-lightning', bg: 'weather-stormy', bgNight: 'weather-stormy' }
};

// Lucide React Icon Mapping
const ICON_COMPONENTS = {
  'sun': Sun,
  'moon': Moon,
  'cloud-sun': CloudSun,
  'cloud-moon': CloudMoon,
  'cloud': Cloud,
  'cloud-fog': CloudFog,
  'cloud-drizzle': CloudDrizzle,
  'cloud-rain': CloudRain,
  'snowflake': Snowflake,
  'cloud-lightning': CloudLightning
};

function WeatherIcon({ name, ...props }) {
  const IconComp = ICON_COMPONENTS[name] || Cloud;
  return <IconComp {...props} />;
}

// Background Particle Rendering Subcomponent
function BackgroundParticles({ code, isDay }) {
  const particles = useMemo(() => {
    const list = [];
    const isRain = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code);
    const isSnow = [56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code);
    const isStorm = [95, 96, 99].includes(code);
    const isClear = [0, 1].includes(code);

    if (isRain || isStorm) {
      const count = isStorm ? 45 : 30;
      for (let i = 0; i < count; i++) {
        list.push({
          id: `rain-${i}`,
          type: 'rain',
          style: {
            left: `${Math.random() * 100}%`,
            animationDuration: `${0.5 + Math.random() * 0.7}s`,
            animationDelay: `${Math.random() * 2}s`
          }
        });
      }
    } else if (isSnow) {
      const count = 35;
      for (let i = 0; i < count; i++) {
        const size = 3 + Math.random() * 6;
        list.push({
          id: `snow-${i}`,
          type: 'snow',
          style: {
            left: `${Math.random() * 100}%`,
            width: `${size}px`,
            height: `${size}px`,
            animationDuration: `${6 + Math.random() * 7}s`,
            animationDelay: `${Math.random() * 5}s`
          }
        });
      }
    } else if (isClear) {
      if (isDay) {
        list.push({
          id: 'sun-ray',
          type: 'sun-ray',
          style: {}
        });
      } else {
        const count = 40;
        for (let i = 0; i < count; i++) {
          const size = 1 + Math.random() * 3;
          list.push({
            id: `star-${i}`,
            type: 'star',
            style: {
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 80}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDuration: `${2 + Math.random() * 3}s`,
              animationDelay: `${Math.random() * 3}s`
            }
          });
        }
      }
    }
    return list;
  }, [code, isDay]);

  return (
    <div className="particles-container">
      {particles.map(p => {
        if (p.type === 'rain') return <div key={p.id} className="rain-drop" style={p.style} />;
        if (p.type === 'snow') return <div key={p.id} className="snowflake-particle" style={p.style} />;
        if (p.type === 'sun-ray') return <div key={p.id} className="sun-ray" />;
        if (p.type === 'star') return <div key={p.id} className="star-particle" style={p.style} />;
        return null;
      })}
    </div>
  );
}

export default function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isCelsius, setIsCelsius] = useState(true);
  const [isLightning, setIsLightning] = useState(false);

  // Favorites state and logic
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('weather_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('weather_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const getActiveCoords = () => {
    if (weatherData?.latitude && weatherData?.longitude) {
      return { lat: weatherData.latitude, lon: weatherData.longitude };
    }
    try {
      const cached = localStorage.getItem('cached_weather_city');
      if (cached) {
        const parsed = JSON.parse(cached);
        return { lat: parsed.lat, lon: parsed.lon };
      }
    } catch (e) {}
    return { lat: 51.5074, lon: -0.1278 };
  };

  const toggleFavorite = () => {
    if (!weatherData) return;
    const cityName = weatherData.cityName;
    const { lat, lon } = getActiveCoords();

    const isFav = favorites.some(f => f.name === cityName);
    if (isFav) {
      setFavorites(favorites.filter(f => f.name !== cityName));
    } else {
      setFavorites([...favorites, { name: cityName, lat, lon }]);
    }
  };

  const isCurrentFavorite = weatherData ? favorites.some(f => f.name === weatherData.cityName) : false;

  // Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsActive, setIsSuggestionsActive] = useState(false);
  const searchContainerRef = useRef(null);

  // Modal Search States
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalSuggestions, setModalSuggestions] = useState([]);
  const [isModalSuggestionsActive, setIsModalSuggestionsActive] = useState(false);
  const modalSearchContainerRef = useRef(null);

  // Error Toast State
  const [toastMsg, setToastMsg] = useState('');
  const [isToastActive, setIsToastActive] = useState(false);

  const showError = (msg) => {
    setToastMsg(msg);
    setIsToastActive(true);
    setTimeout(() => {
      setIsToastActive(false);
    }, 4500);
  };

  // Helper conversions
  const toFahrenheit = (c) => (c * 9) / 5 + 32;
  const formatTemp = (tempC) => {
    const val = isCelsius ? tempC : toFahrenheit(tempC);
    return `${Math.round(val)}°${isCelsius ? 'C' : 'F'}`;
  };

  // Fetch API proxy helper
  const fetchWeather = async (lat, lon, cityName = '') => {
    setLoading(true);
    setShowPrompt(false);
    try {
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!response.ok) throw new Error("Could not download weather data");
      const data = await response.json();
      
      setWeatherData(data);
      // Cache coordinates and backend resolved city name
      localStorage.setItem('cached_weather_city', JSON.stringify({
        lat,
        lon,
        name: cityName || data.cityName
      }));
    } catch (e) {
      console.error(e);
      showError("Connection failed. Operating in fallback mode.");
      if (!weatherData) setShowPrompt(true);
    } finally {
      setLoading(false);
    }
  };

  // Trigger automatic location detection
  const getUserLocation = () => {
    setLoading(true);
    setShowPrompt(false);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("GPS access denied:", error);
          setLoading(false);
          setShowPrompt(true);
          showError("GPS location access denied. Please search or pick a city below.");
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setLoading(false);
      setShowPrompt(true);
      showError("GPS Geolocation is unsupported on your browser.");
    }
  };

  // Header Autocomplete Debounce
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSuggestions([]);
      setIsSuggestionsActive(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        if (data && data.results) {
          setSuggestions(data.results);
          setIsSuggestionsActive(true);
        }
      } catch (e) {
        console.error(e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Modal Autocomplete Debounce
  useEffect(() => {
    if (modalSearchTerm.trim().length < 2) {
      setModalSuggestions([]);
      setIsModalSuggestionsActive(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(modalSearchTerm)}`);
        const data = await response.json();
        if (data && data.results) {
          setModalSuggestions(data.results);
          setIsModalSuggestionsActive(true);
        }
      } catch (e) {
        console.error(e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [modalSearchTerm]);

  // Sync click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSuggestionsActive(false);
      }
      if (modalSearchContainerRef.current && !modalSearchContainerRef.current.contains(e.target)) {
        setIsModalSuggestionsActive(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Initial load
  useEffect(() => {
    const cached = localStorage.getItem('cached_weather_city');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        fetchWeather(parsed.lat, parsed.lon, parsed.name);
      } catch (e) {
        getUserLocation();
      }
    } else {
      getUserLocation();
    }
  }, []);

  // Sync Body Classes and Lightning Intervals
  useEffect(() => {
    if (!weatherData) return;
    const current = weatherData.current;
    const isDay = current.is_day;
    const codeMeta = WEATHER_CODES[current.weather_code] || { bg: 'weather-clear-day' };
    const bgClass = isDay ? codeMeta.bg : (codeMeta.bgNight || codeMeta.bg);
    
    document.body.className = '';
    document.body.classList.add(bgClass);

    // Setup lightning flashes for storms
    const isStorm = [95, 96, 99].includes(current.weather_code);
    if (!isStorm) {
      setIsLightning(false);
      return;
    }

    const interval = setInterval(() => {
      if (Math.random() > 0.4) {
        setIsLightning(true);
        const timer = setTimeout(() => {
          setIsLightning(false);
        }, 80 + Math.random() * 120);
        return () => clearTimeout(timer);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [weatherData]);

  // Popular Quick select cities coordinates
  const POPULAR_CITIES = [
    { name: "London", lat: 51.5074, lon: -0.1278 },
    { name: "New York", lat: 40.7128, lon: -74.0060 },
    { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
    { name: "Paris", lat: 48.8566, lon: 2.3522 },
    { name: "Sydney", lat: -33.8688, lon: 151.2093 },
    { name: "Singapore", lat: 1.3521, lon: 103.8198 }
  ];

  // Process data parameters safely
  const current = weatherData?.current;
  const daily = weatherData?.daily;
  const hourly = weatherData?.hourly;
  const activeLat = weatherData?.latitude || (localStorage.getItem('cached_weather_city') ? JSON.parse(localStorage.getItem('cached_weather_city')).lat : 51.5074);
  const activeLon = weatherData?.longitude || (localStorage.getItem('cached_weather_city') ? JSON.parse(localStorage.getItem('cached_weather_city')).lon : -0.1278);

  const currentIcon = current ? (current.is_day ? (WEATHER_CODES[current.weather_code]?.icon || 'sun') : (WEATHER_CODES[current.weather_code]?.iconNight || WEATHER_CODES[current.weather_code]?.icon || 'moon')) : 'sun';
  const currentCodeLabel = current ? (WEATHER_CODES[current.weather_code]?.label || 'Cloudy') : 'Cloudy';

  // Wind metrics
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const windDirIndex = current ? Math.round(current.wind_direction_10m / 22.5) % 16 : 0;
  const windDir = directions[windDirIndex];

  // UV index evaluation
  const uvVal = daily ? daily.uv_index_max[0] : 0;
  let uvTextStr = 'Low';
  if (uvVal > 2) uvTextStr = 'Moderate';
  if (uvVal > 5) uvTextStr = 'High';
  if (uvVal > 7) uvTextStr = 'Very High';
  if (uvVal > 10) uvTextStr = 'Extreme';

  // Apple temperature bar range calculations
  const weekMin = daily ? Math.min(...daily.temperature_2m_min) : 0;
  const weekMax = daily ? Math.max(...daily.temperature_2m_max) : 100;

  return (
    <div style={{ filter: isLightning ? 'brightness(2.2) saturate(1.2)' : undefined, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Background Particle Layer */}
      {current && <BackgroundParticles code={current.weather_code} isDay={current.is_day} />}

      {/* 1. Full Screen Loader */}
      {loading && (
        <div className="loading-overlay">
          <div class="loader-content">
            <SunDim className="loader-spinner" />
            <h2>Detecting your location...</h2>
            <p>Gathering real-time atmospheric data</p>
          </div>
        </div>
      )}

      {/* 2. Geolocation prompt fallback */}
      {showPrompt && !loading && (
        <div className="location-prompt-overlay">
          <div className="glass-panel prompt-card">
            <div className="prompt-icon-wrapper">
              <MapPinOff className="pulse-icon" />
            </div>
            <h2>Location Access Required</h2>
            <p>We couldn't automatically detect your location. Please grant location access in your browser or choose a city below to open the dashboard.</p>
            
            <div className="quick-cities-title">Popular Cities</div>
            <div className="quick-cities-grid">
              {POPULAR_CITIES.map(city => (
                <button 
                  key={city.name} 
                  className="btn-quick-city"
                  onClick={() => fetchWeather(city.lat, city.lon, city.name)}
                >
                  {city.name}
                </button>
              ))}
            </div>

            <div className="prompt-search-wrapper" ref={modalSearchContainerRef}>
              <div className="search-bar">
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Or search for a city manually..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                />
              </div>
              <div className={`suggestions-box ${isModalSuggestionsActive ? 'active' : ''}`}>
                {modalSuggestions.map((city, idx) => (
                  <div 
                    key={idx} 
                    className="suggestion-item"
                    onClick={() => {
                      fetchWeather(city.latitude, city.longitude, `${city.name}, ${city.country}`);
                      setModalSearchTerm('');
                      setIsModalSuggestionsActive(false);
                    }}
                  >
                    <MapPin style={{ width: 16, color: 'var(--accent-blue)' }} />
                    <div>
                      <div className="city-name">{city.name}</div>
                      <div className="city-details">{city.admin1} {city.country}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Dashboard */}
      {weatherData && !loading && (
        <div className="app-container">
          {/* Header */}
          <header>
            <div className="brand">
              <SunDim className="brand-icon" />
              <span>Atmosphere</span>
            </div>
            
            <div className="header-controls">
              <div className="search-box-wrapper" ref={searchContainerRef}>
                <div className="search-bar">
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Search for a city..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button 
                    className="btn-locate" 
                    title="Use current location"
                    onClick={getUserLocation}
                  >
                    <MapPin />
                  </button>
                </div>
                <div className={`suggestions-box ${isSuggestionsActive ? 'active' : ''}`}>
                  {suggestions.map((city, idx) => (
                    <div 
                      key={idx} 
                      className="suggestion-item"
                      onClick={() => {
                        fetchWeather(city.latitude, city.longitude, `${city.name}, ${city.country}`);
                        setSearchTerm('');
                        setIsSuggestionsActive(false);
                      }}
                    >
                      <MapPin style={{ width: 16, color: 'var(--accent-blue)' }} />
                      <div>
                        <div className="city-name">{city.name}</div>
                        <div className="city-details">{city.admin1} {city.country}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Celsius/Fahrenheit Unit Toggle */}
              <button 
                className="btn-unit-toggle" 
                title="Toggle unit"
                onClick={() => setIsCelsius(!isCelsius)}
              >
                <span className={isCelsius ? 'active' : ''}>°C</span>
                <span className="unit-divider">|</span>
                <span className={!isCelsius ? 'active' : ''}>°F</span>
              </button>
            </div>
          </header>

          {/* Starred Locations Quick Bar */}
          {favorites.length > 0 && (
            <div className="favorites-bar">
              <span className="favorites-title">Starred:</span>
              <div className="favorites-list">
                {favorites.map((city, idx) => (
                  <button 
                    key={idx} 
                    className="favorite-chip"
                    onClick={() => fetchWeather(city.lat, city.lon, city.name)}
                  >
                    <MapPin style={{ width: 11, height: 11, marginRight: 4, color: 'var(--accent-blue)' }} />
                    {city.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grid Layout */}
          <main className="dashboard-grid">
            {/* Left Column */}
            <div className="main-column">
              {/* Current Weather Card */}
              <section className="glass-panel current-weather-card">
                <div className="location">
                  <MapPin style={{ width: 20, height: 20, color: 'var(--accent-blue)' }} />
                  <span>{weatherData.cityName}</span>
                  <button 
                    onClick={toggleFavorite} 
                    className={`btn-favorite ${isCurrentFavorite ? 'starred' : ''}`}
                    title={isCurrentFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: 8 }}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill={isCurrentFavorite ? "var(--accent-yellow)" : "none"} 
                      stroke={isCurrentFavorite ? "var(--accent-yellow)" : "var(--text-muted)"} 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      style={{ transition: 'all 0.2s ease' }}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                </div>
                <div className="date">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="weather-hero">
                  <WeatherIcon name={currentIcon} className="weather-hero-icon" />
                  <div className="current-temp-container">
                    <span className="current-temp">
                      {Math.round(isCelsius ? current.temperature_2m : toFahrenheit(current.temperature_2m))}
                      <span className="temp-unit">°{isCelsius ? 'C' : 'F'}</span>
                    </span>
                    <span className="weather-description">{currentCodeLabel}</span>
                  </div>
                </div>
                {daily && (
                  <div className="temp-range">
                    <span className="high">
                      <ArrowUp style={{ width: 14, height: 14 }} /> H: {formatTemp(daily.temperature_2m_max[0])}
                    </span>
                    <span className="low">
                      <ArrowDown style={{ width: 14, height: 14 }} /> L: {formatTemp(daily.temperature_2m_min[0])}
                    </span>
                  </div>
                )}
              </section>

              {/* Windy Map Integration */}
              <section className="glass-panel map-card">
                <h2 className="card-title">
                  <MapIcon />
                  <span>Live Wind Map</span>
                </h2>
                <div className="map-wrapper">
                  <iframe 
                    id="windy-map" 
                    src={`https://embed.windy.com/embed2.html?lat=${activeLat}&lon=${activeLon}&zoom=6&level=surface&overlay=wind&menu=&message=&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=${activeLat}&detailLon=${activeLon}&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`}
                    frameBorder="0"
                    title="Interactive Windy Weather Map"
                    loading="lazy"
                  />
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div className="side-column">
              {/* Detailed metrics grid */}
              <section className="details-grid">
                {/* Feels Like */}
                <div className="glass-panel detail-card">
                  <div className="detail-icon-wrapper">
                    <Thermometer />
                  </div>
                  <div className="detail-info">
                    <span className="detail-label">Feels Like</span>
                    <span className="detail-value">{formatTemp(current.apparent_temperature)}</span>
                  </div>
                </div>

                {/* Humidity */}
                <div className="glass-panel detail-card">
                  <div className="detail-icon-wrapper">
                    <Droplets />
                  </div>
                  <div className="detail-info">
                    <span className="detail-label">Humidity</span>
                    <span className="detail-value">{current.relative_humidity_2m}%</span>
                  </div>
                </div>

                {/* Wind */}
                <div className="glass-panel detail-card">
                  <div className="detail-icon-wrapper">
                    <Wind />
                  </div>
                  <div className="detail-info">
                    <span className="detail-label">Wind</span>
                    <span className="detail-value">{Math.round(current.wind_speed_10m)} km/h</span>
                    <span className="detail-subtext">{windDir}</span>
                  </div>
                </div>

                {/* UV Index */}
                <div className="glass-panel detail-card">
                  <div className="detail-icon-wrapper">
                    <Sun />
                  </div>
                  <div className="detail-info">
                    <span className="detail-label">UV Index</span>
                    <span className="detail-value">{uvVal.toFixed(1)}</span>
                    <span className="detail-subtext">{uvTextStr}</span>
                  </div>
                </div>

                {/* Precipitation */}
                <div className="glass-panel detail-card">
                  <div className="detail-icon-wrapper">
                    <CloudRain />
                  </div>
                  <div className="detail-info">
                    <span className="detail-label">Rainfall</span>
                    <span className="detail-value">{current.precipitation.toFixed(1)} mm</span>
                  </div>
                </div>

                {/* Pressure */}
                <div className="glass-panel detail-card">
                  <div className="detail-icon-wrapper">
                    <Gauge />
                  </div>
                  <div className="detail-info">
                    <span className="detail-label">Pressure</span>
                    <span className="detail-value">{Math.round(current.pressure_msl)} hPa</span>
                  </div>
                </div>

                {/* Air Quality (AQI) */}
                {weatherData.aqi && (
                  <div className="glass-panel detail-card">
                    <div className="detail-icon-wrapper">
                      <Wind style={{ width: 22, height: 22 }} />
                    </div>
                    <div className="detail-info">
                      <span className="detail-label">Air Quality</span>
                      <span className="detail-value">{weatherData.aqi.label}</span>
                      <span className="detail-subtext">Index: {weatherData.aqi.index}/5</span>
                    </div>
                  </div>
                )}

                {/* PM2.5 Dust */}
                {weatherData.aqi && (
                  <div className="glass-panel detail-card">
                    <div className="detail-icon-wrapper">
                      <CloudFog style={{ width: 22, height: 22 }} />
                    </div>
                    <div className="detail-info">
                      <span className="detail-label">PM2.5 Dust</span>
                      <span className="detail-value">{weatherData.aqi.pm25.toFixed(1)} µg/m³</span>
                      <span className="detail-subtext">Fine particles</span>
                    </div>
                  </div>
                )}
              </section>

              {/* Hourly Forecast */}
              {hourly && (
                <section className="glass-panel hourly-card">
                  <h2 className="card-title">
                    <Clock />
                    <span>Hourly Forecast (24h)</span>
                  </h2>
                  <div className="hourly-scroll">
                    {hourly.time.map((timeStr, idx) => {
                      const temp = hourly.temperature_2m[idx];
                      const code = hourly.weather_code[idx];
                      const pop = hourly.precipitation_probability[idx];
                      
                      const date = new Date(timeStr);
                      let hrs = date.getHours();
                      const ampm = hrs >= 12 ? 'PM' : 'AM';
                      hrs = hrs % 12 || 12;
                      const timeFormatted = `${hrs} ${ampm}`;

                      const hourIcon = WEATHER_CODES[code]?.icon || 'cloud';

                      return (
                        <div key={idx} className="hourly-item">
                          <span className="hourly-time">{idx === 0 ? 'Now' : timeFormatted}</span>
                          <WeatherIcon name={hourIcon} className="hourly-icon" />
                          <span className="hourly-temp">{Math.round(isCelsius ? temp : toFahrenheit(temp))}°</span>
                          <span className="hourly-pop">{pop > 0 ? `${pop}%` : ''}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 7-Day Forecast */}
              {daily && (
                <section className="glass-panel daily-card">
                  <h2 className="card-title">
                    <Calendar />
                    <span>7-Day Forecast</span>
                  </h2>
                  <div className="daily-forecast-list">
                    {daily.time.map((timeStr, idx) => {
                      const code = daily.weather_code[idx];
                      const min = daily.temperature_2m_min[idx];
                      const max = daily.temperature_2m_max[idx];
                      const pop = daily.precipitation_probability_max[idx];

                      const dayLabel = idx === 0 ? 'Today' : new Date(timeStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
                      const dailyIcon = WEATHER_CODES[code]?.icon || 'cloud';

                      // Apple weather progress bars
                      const leftPercent = ((min - weekMin) / (weekMax - weekMin)) * 100;
                      const widthPercent = ((max - min) / (weekMax - weekMin)) * 100;

                      return (
                        <div key={idx} className="daily-row">
                          <span className="daily-day">{dayLabel}</span>
                          <span className="daily-pop-container">
                            {pop > 10 ? (
                              <>
                                <Droplet style={{ width: 10, height: 10 }} /> <span>{pop}%</span>
                              </>
                            ) : ''}
                          </span>
                          <WeatherIcon name={dailyIcon} className="daily-row-icon" />
                          <div className="daily-temp-bar-container">
                            <span className="min-temp">{Math.round(isCelsius ? min : toFahrenheit(min))}°</span>
                            <div className="temp-bar">
                              <div className="temp-bar-fill" style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }} />
                            </div>
                            <span className="max-temp">{Math.round(isCelsius ? max : toFahrenheit(max))}°</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          </main>

          {/* Footer */}
          <footer>
            <p>Designed by Muthyala Varaprasad</p>
          </footer>
        </div>
      )}

      {/* Toast Alert Notification */}
      <div className={`error-toast ${isToastActive ? 'active' : ''}`}>
        <AlertCircle />
        <span>{toastMsg}</span>
      </div>
    </div>
  );
}
