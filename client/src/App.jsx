import React, { useState, useEffect, useRef } from 'react';
import { SunDim, AlertCircle } from 'lucide-react';

import BackgroundParticles from './components/BackgroundParticles';
import { useOffline } from './hooks/useOffline';
import { useFavorites } from './hooks/useFavorites';
import * as apiService from './services/weatherService';
import Dashboard from './pages/Dashboard';
import FallbackPrompt from './pages/FallbackPrompt';

const POPULAR_CITIES = [
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "New York", lat: 40.7128, lon: -74.0060 },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093 },
  { name: "Singapore", lat: 1.3521, lon: 103.8198 }
];

export default function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Detecting your location...");
  const [showPrompt, setShowPrompt] = useState(false);
  const [isCelsius, setIsCelsius] = useState(true);
  const [isLightning, setIsLightning] = useState(false);

  // Connection & Offline trackers
  const isOffline = useOffline();
  const [hasError, setHasError] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const lastCoords = useRef({ lat: 51.5074, lon: -0.1278 });

  // Abort Controllers Refs
  const weatherAbortRef = useRef(null);
  const suggestionsAbortRef = useRef(null);
  const modalSuggestionsAbortRef = useRef(null);

  // Favorites & Search History Hook
  const { 
    favorites, 
    searchHistory, 
    toggleFavorite: handleToggleFavorite, 
    isFavorite: checkIsFavorite, 
    addToHistory 
  } = useFavorites();

  // Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsActive, setIsSuggestionsActive] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(null);
  const searchContainerRef = useRef(null);

  // Modal Search States
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalSuggestions, setModalSuggestions] = useState([]);
  const [isModalSuggestionsActive, setIsModalSuggestionsActive] = useState(false);
  const [isModalSuggestionsLoading, setIsModalSuggestionsLoading] = useState(false);
  const [modalSuggestionsError, setModalSuggestionsError] = useState(null);
  const modalSearchContainerRef = useRef(null);

  // Error Toast States
  const [toastMsg, setToastMsg] = useState('');
  const [isToastActive, setIsToastActive] = useState(false);

  const showError = (msg) => {
    setToastMsg(msg);
    setIsToastActive(true);
    setTimeout(() => {
      setIsToastActive(false);
    }, 4500);
  };

  // Conversions helper functions
  const toFahrenheit = (c) => (c * 9) / 5 + 32;
  const formatTemp = (tempC) => {
    const val = isCelsius ? tempC : toFahrenheit(tempC);
    return `${Math.round(val)}°${isCelsius ? 'C' : 'F'}`;
  };

  const getOfflineFallback = (queryCityName) => {
    try {
      let targetCity = queryCityName ? queryCityName.toLowerCase() : '';
      if (!targetCity) {
        const cachedMeta = localStorage.getItem('cached_weather_city');
        if (cachedMeta) {
          targetCity = JSON.parse(cachedMeta).name.toLowerCase();
        }
      }
      if (!targetCity) {
        targetCity = localStorage.getItem('last_queried_city') || '';
      }
      if (targetCity) {
        let cachedPayload = localStorage.getItem(`weather_cache_${targetCity}`);
        if (!cachedPayload) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('weather_cache_') && key.includes(targetCity.split(',')[0].trim())) {
              cachedPayload = localStorage.getItem(key);
              break;
            }
          }
        }
        if (cachedPayload) {
          return JSON.parse(cachedPayload);
        }
      }
    } catch (err) {
      console.error("Error reading offline fallback:", err);
    }
    return null;
  };

  // API Call Coordinator
  const fetchWeather = async (lat, lon, cityName = '') => {
    if (weatherAbortRef.current) {
      weatherAbortRef.current.abort();
    }
    const controller = new AbortController();
    weatherAbortRef.current = controller;

    if (!navigator.onLine) {
      setHasError(true);
      const fallbackData = getOfflineFallback(cityName);
      if (fallbackData) {
        setWeatherData(fallbackData);
        setIsFallback(true);
        showError("Offline Mode: Showing cached weather.");
      } else {
        setWeatherData(null);
        setShowPrompt(true);
        showError("Offline Mode: No local backup found.");
      }
      return;
    }

    setLoadingText(cityName ? `Searching ${cityName.split(',')[0]}...` : "Loading weather details...");
    setLoading(true);
    setShowPrompt(false);
    lastCoords.current = { lat, lon };

    try {
      const data = await apiService.fetchWeather(lat, lon, controller.signal);
      setWeatherData(data);
      setHasError(false);
      setIsFallback(false);

      // Cache search coordinates locally
      localStorage.setItem('cached_weather_city', JSON.stringify({
        lat,
        lon,
        name: cityName || data.cityName
      }));

      // Cache full weather payload
      const normalName = (cityName || data.cityName).toLowerCase();
      localStorage.setItem(`weather_cache_${normalName}`, JSON.stringify(data));
      localStorage.setItem('last_queried_city', normalName);

      // Append successfully resolved query to history
      addToHistory(cityName || data.cityName, lat, lon);
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.error("Fetch weather details error:", e);
      setHasError(true);
      const fallbackData = getOfflineFallback(cityName);
      if (fallbackData) {
        setWeatherData(fallbackData);
        setIsFallback(true);
        showError(`Weather service is temporarily unavailable. Showing cached data for ${fallbackData.cityName}.`);
      } else {
        setWeatherData(null);
        setShowPrompt(true);
        showError(e.message || `${cityName || "Selected location"} weather is currently unavailable.`);
      }
    } finally {
      if (weatherAbortRef.current === controller) {
        setLoading(false);
      }
    }
  };

  const fetchWeatherByCity = async (city) => {
    if (weatherAbortRef.current) {
      weatherAbortRef.current.abort();
    }
    const controller = new AbortController();
    weatherAbortRef.current = controller;

    if (!navigator.onLine) {
      setHasError(true);
      const fallbackData = getOfflineFallback(city);
      if (fallbackData) {
        setWeatherData(fallbackData);
        setIsFallback(true);
        showError("Offline Mode: Showing cached weather.");
      } else {
        setWeatherData(null);
        setShowPrompt(true);
        showError("Offline Mode: No local backup found.");
      }
      return;
    }

    setLoadingText(`Searching ${city.split(',')[0]}...`);
    setLoading(true);
    setShowPrompt(false);

    try {
      const data = await apiService.fetchWeatherByCity(city, controller.signal);
      setWeatherData(data);
      setHasError(false);
      setIsFallback(false);

      lastCoords.current = { lat: data.latitude, lon: data.longitude };

      // Cache search coordinates locally
      localStorage.setItem('cached_weather_city', JSON.stringify({
        lat: data.latitude,
        lon: data.longitude,
        name: data.cityName
      }));

      // Cache full weather payload
      const normalName = data.cityName.toLowerCase();
      localStorage.setItem(`weather_cache_${normalName}`, JSON.stringify(data));
      localStorage.setItem('last_queried_city', normalName);

      // Append successfully resolved query to history
      addToHistory(data.cityName, data.latitude, data.longitude);
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.error("Fetch weather by city error:", e);
      setHasError(true);
      const fallbackData = getOfflineFallback(city);
      if (fallbackData) {
        setWeatherData(fallbackData);
        setIsFallback(true);
        showError(`Weather service is temporarily unavailable. Showing cached data for ${fallbackData.cityName}.`);
      } else {
        setWeatherData(null);
        setShowPrompt(true);
        showError(e.message || `${city} weather is currently unavailable.`);
      }
    } finally {
      if (weatherAbortRef.current === controller) {
        setLoading(false);
      }
    }
  };

  const handleFetchWeather = async (target) => {
    if (typeof target === 'string') {
      await fetchWeatherByCity(target);
    } else if (target && target.lat && target.lon) {
      await fetchWeather(target.lat, target.lon, target.name || '');
    }
  };

  // Automatic GPS Geolocation lookup
  const getUserLocation = () => {
    setLoadingText("Detecting your location...");
    setLoading(true);
    setShowPrompt(false);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("GPS location access denied:", error);
          setLoading(false);
          setShowPrompt(true);
          showError("GPS location access denied. Please choose a city below or search.");
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setLoading(false);
      setShowPrompt(true);
      showError("GPS Location is not supported on this browser.");
    }
  };

  // Load Initial City Coordinates
  useEffect(() => {
    try {
      const cached = localStorage.getItem('cached_weather_city');
      if (cached) {
        const parsed = JSON.parse(cached);
        fetchWeather(parsed.lat, parsed.lon, parsed.name);
      } else {
        getUserLocation();
      }
    } catch (e) {
      getUserLocation();
    }
  }, []);

  // Automatic connection restoration listener
  useEffect(() => {
    const handleOnlineStatus = () => {
      showError("Connection restored! Refreshing weather data...");
      if (lastCoords.current) {
        fetchWeather(lastCoords.current.lat, lastCoords.current.lon);
      }
    };
    window.addEventListener('online', handleOnlineStatus);
    return () => window.removeEventListener('online', handleOnlineStatus);
  }, [weatherData]);
  // Header Auto-complete Suggestion Debouncer
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSuggestions([]);
      setIsSuggestionsActive(false);
      setIsSuggestionsLoading(false);
      setSuggestionsError(null);
      return;
    }

    setIsSuggestionsLoading(true);
    setIsSuggestionsActive(true);
    setSuggestionsError(null);

    const timer = setTimeout(async () => {
      if (suggestionsAbortRef.current) {
        suggestionsAbortRef.current.abort();
      }
      const controller = new AbortController();
      suggestionsAbortRef.current = controller;

      try {
        const data = await apiService.searchLocations(searchTerm, controller.signal);
        if (data && data.results) {
          setSuggestions(data.results);
          setSuggestionsError(null);
        } else {
          setSuggestions([]);
        }
      } catch (e) {
        if (e.name === 'AbortError') return;
        console.error("Autocomplete search error:", e);
        setSuggestions([]);
        setSuggestionsError("Location search is temporarily unavailable. Please try again.");
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (suggestionsAbortRef.current) {
        suggestionsAbortRef.current.abort();
      }
    };
  }, [searchTerm]);

  // Fallback Modal Autocomplete Suggestion Debouncer
  useEffect(() => {
    if (modalSearchTerm.trim().length < 2) {
      setModalSuggestions([]);
      setIsModalSuggestionsActive(false);
      setIsModalSuggestionsLoading(false);
      setModalSuggestionsError(null);
      return;
    }

    setIsModalSuggestionsLoading(true);
    setIsModalSuggestionsActive(true);
    setModalSuggestionsError(null);

    const timer = setTimeout(async () => {
      if (modalSuggestionsAbortRef.current) {
        modalSuggestionsAbortRef.current.abort();
      }
      const controller = new AbortController();
      modalSuggestionsAbortRef.current = controller;

      try {
        const data = await apiService.searchLocations(modalSearchTerm, controller.signal);
        if (data && data.results) {
          setModalSuggestions(data.results);
          setModalSuggestionsError(null);
        } else {
          setModalSuggestions([]);
        }
      } catch (e) {
        if (e.name === 'AbortError') return;
        console.error("Modal autocomplete search error:", e);
        setModalSuggestions([]);
        setModalSuggestionsError("Location search is temporarily unavailable. Please try again.");
      } finally {
        setIsModalSuggestionsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (modalSuggestionsAbortRef.current) {
        modalSuggestionsAbortRef.current.abort();
      }
    };
  }, [modalSearchTerm]);
  // Click listeners to close suggestions boxes on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSuggestionsActive(false);
      }
      if (modalSearchContainerRef.current && !modalSearchContainerRef.current.contains(e.target)) {
        setIsModalSuggestionsActive(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Storm lighting screen flashes
  useEffect(() => {
    if (!weatherData) return;
    const isStorm = [95, 96, 99].includes(weatherData.current.weather_code);
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

  // Input validation handlers
  const handleSearchChange = (val) => {
    const filtered = val.replace(/[^a-zA-Z0-9\s-,\u00C0-\u017F]/g, '');
    setSearchTerm(filtered);
  };

  const handleModalSearchChange = (val) => {
    const filtered = val.replace(/[^a-zA-Z0-9\s-,\u00C0-\u017F]/g, '');
    setModalSearchTerm(filtered);
  };

  const toggleFavorite = () => {
    if (!weatherData) return;
    handleToggleFavorite(weatherData.cityName, lastCoords.current.lat, lastCoords.current.lon);
  };

  const isCurrentFavorite = weatherData ? checkIsFavorite(weatherData.cityName) : false;

  return (
    <div style={{ filter: isLightning ? 'brightness(2.2) saturate(1.2)' : undefined, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Offline Warning Banner */}
      {isOffline && (
        <div className="offline-banner" style={{
          width: '100%',
          background: 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          textAlign: 'center',
          padding: '0.65rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          position: 'sticky',
          top: 0,
          zIndex: 3000,
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <AlertCircle style={{ width: 16, height: 16 }} />
          <span>You are currently offline. Displaying cached weather details.</span>
        </div>
      )}

      {/* Background Particle Layer */}
      {weatherData && (
        <BackgroundParticles 
          code={weatherData.current.weather_code} 
          isDay={weatherData.current.is_day} 
        />
      )}

      {/* 1. Full Screen Loader overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loader-content">
            <SunDim className="loader-spinner" />
            <h2>{loadingText}</h2>
            <p>Gathering real-time atmospheric data</p>
          </div>
        </div>
      )}

      {/* 2. Geolocation permissions fallback modal */}
      {showPrompt && !loading && (
        <FallbackPrompt 
          popularCities={POPULAR_CITIES}
          fetchWeather={handleFetchWeather}
          modalSearchTerm={modalSearchTerm}
          handleModalSearchChange={handleModalSearchChange}
          isModalSuggestionsActive={isModalSuggestionsActive}
          modalSuggestions={modalSuggestions}
          setModalSearchTerm={setModalSearchTerm}
          setIsModalSuggestionsActive={setIsModalSuggestionsActive}
          modalSearchContainerRef={modalSearchContainerRef}
          hasError={hasError}
          lastCoords={lastCoords}
          isModalSuggestionsLoading={isModalSuggestionsLoading}
          modalSuggestionsError={modalSuggestionsError}
        />
      )}

      {/* 3. Main Dashboard grid */}
      {weatherData && !loading && (
        <Dashboard 
          weatherData={weatherData}
          isCelsius={isCelsius}
          setIsCelsius={setIsCelsius}
          favorites={favorites}
          searchHistory={searchHistory}
          toggleFavorite={toggleFavorite}
          isCurrentFavorite={isCurrentFavorite}
          searchTerm={searchTerm}
          handleSearchChange={handleSearchChange}
          isSuggestionsActive={isSuggestionsActive}
          suggestions={suggestions}
          setSearchTerm={setSearchTerm}
          setIsSuggestionsActive={setIsSuggestionsActive}
          searchContainerRef={searchContainerRef}
          getUserLocation={getUserLocation}
          fetchWeather={handleFetchWeather}
          hasError={hasError}
          isFallback={isFallback}
          lastCoords={lastCoords}
          toFahrenheit={toFahrenheit}
          formatTemp={formatTemp}
          isSuggestionsLoading={isSuggestionsLoading}
          suggestionsError={suggestionsError}
        />
      )}

      {/* 4. Global Floating Warning Toast alerts */}
      <div className={`error-toast ${isToastActive ? 'active' : ''}`}>
        <AlertCircle className="toast-icon" />
        <span className="toast-message">{toastMsg}</span>
      </div>
    </div>
  );
}
