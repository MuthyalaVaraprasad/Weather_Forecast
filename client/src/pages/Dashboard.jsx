import React, { useState, useEffect } from 'react';
import { 
  SunDim, MapPin, Clock, Calendar, Map as MapIcon, 
  Wind, Thermometer, Droplets, Gauge, AlertCircle, RefreshCw 
} from 'lucide-react';

import WeatherIcon, { WEATHER_CODES } from '../components/WeatherIcon';
import MetricCard from '../components/MetricCard';
import HourlyForecast from '../components/HourlyForecast';
import DailyForecast from '../components/DailyForecast';

/**
 * Main dashboard layout coordination screen.
 */
export default function Dashboard({
  weatherData,
  isCelsius,
  setIsCelsius,
  favorites,
  searchHistory,
  toggleFavorite,
  isCurrentFavorite,
  searchTerm,
  handleSearchChange,
  isSuggestionsActive,
  suggestions,
  setSearchTerm,
  setIsSuggestionsActive,
  searchContainerRef,
  getUserLocation,
  fetchWeather,
  hasError,
  isFallback,
  lastCoords,
  toFahrenheit,
  formatTemp,
  isSuggestionsLoading,
  suggestionsError
}) {
  const current = weatherData.current;
  const daily = weatherData.daily;
  const hourly = weatherData.hourly;

  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // Reset active suggestion index when suggestions list updates
  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [suggestions]);

  const currentIcon = WEATHER_CODES[current.weather_code]?.icon || 'cloud';
  const currentCodeLabel = WEATHER_CODES[current.weather_code]?.label || 'Cloudy';

  const activeLat = weatherData.latitude || 51.5074;
  const activeLon = weatherData.longitude || -0.1278;

  // Map state hooks for loading and error UI
  const [mapError, setMapError] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    setMapLoading(true);
    setMapError(false);

    if (!navigator.onLine) {
      setMapError(true);
      setMapLoading(false);
      return;
    }

    // Backup loader timeout - if iframe blocks loading for 8s, trigger fallback UI
    const timer = setTimeout(() => {
      setMapLoading(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, [activeLat, activeLon]);



  return (
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
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-label="Search for a city"
                role="combobox"
                aria-autocomplete="list"
                aria-controls="suggestions-list"
                aria-expanded={isSuggestionsActive && (isSuggestionsLoading || suggestions.length > 0 || suggestionsError !== null)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!isSuggestionsActive) {
                      setIsSuggestionsActive(true);
                    } else if (suggestions.length > 0) {
                      setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
                    }
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (isSuggestionsActive && suggestions.length > 0) {
                      setActiveSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
                    }
                  } else if (e.key === 'Escape') {
                    setIsSuggestionsActive(false);
                    setActiveSuggestionIndex(-1);
                  } else if (e.key === 'Enter') {
                    if (isSuggestionsActive && activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
                      const selectedCity = suggestions[activeSuggestionIndex];
                      fetchWeather({ 
                        lat: selectedCity.latitude, 
                        lon: selectedCity.longitude, 
                        name: `${selectedCity.name}, ${selectedCity.country}` 
                      });
                      setSearchTerm('');
                      setIsSuggestionsActive(false);
                      setActiveSuggestionIndex(-1);
                    } else {
                      const trimmed = searchTerm.trim();
                      if (trimmed !== '') {
                        fetchWeather(trimmed);
                        setSearchTerm('');
                        setIsSuggestionsActive(false);
                        setActiveSuggestionIndex(-1);
                      }
                    }
                  }
                }}
              />
              <button 
                className="btn-locate" 
                title="Use current location"
                aria-label="Use current location"
                onClick={getUserLocation}
              >
                <MapPin />
              </button>
            </div>
            <div 
              id="suggestions-list"
              role="listbox"
              className={`suggestions-box ${isSuggestionsActive ? 'active' : ''}`}
            >
              {isSuggestionsLoading && (
                <div className="suggestion-status">
                  <RefreshCw className="spinner-icon" style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                  <span>Searching locations...</span>
                </div>
              )}
              {suggestionsError && (
                <div className="suggestion-status error-text">
                  <span>{suggestionsError}</span>
                </div>
              )}
              {!isSuggestionsLoading && !suggestionsError && suggestions.length === 0 && searchTerm.trim().length >= 2 && (
                <div className="suggestion-status">
                  <span>No locations found</span>
                </div>
              )}
              {!isSuggestionsLoading && !suggestionsError && suggestions.map((city, idx) => (
                <div 
                  key={idx} 
                  id={`suggestion-item-${idx}`}
                  role="option"
                  aria-selected={idx === activeSuggestionIndex}
                  className={`suggestion-item ${idx === activeSuggestionIndex ? 'active-highlight' : ''}`}
                  onClick={() => {
                    fetchWeather({ lat: city.latitude, lon: city.longitude, name: `${city.name}, ${city.country}` });
                    setSearchTerm('');
                    setIsSuggestionsActive(false);
                    setActiveSuggestionIndex(-1);
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

          <button 
            className="btn-unit-toggle" 
            onClick={() => setIsCelsius(!isCelsius)}
            aria-label={`Switch to ${isCelsius ? 'Fahrenheit' : 'Celsius'}`}
          >
            <span className={isCelsius ? 'active' : ''}>°C</span>
            <span className="unit-divider">|</span>
            <span className={!isCelsius ? 'active' : ''}>°F</span>
          </button>
        </div>
      </header>

      {/* Starred & Recent Locations Bar */}
      {(favorites.length > 0 || searchHistory.length > 0) && (
        <div className="favorites-bar-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%', marginTop: '0.25rem' }}>
          {favorites.length > 0 && (
            <div className="favorites-bar" style={{ margin: 0 }}>
              <span className="favorites-title">Starred:</span>
              <div className="favorites-list">
                {favorites.map((city, idx) => (
                  <button 
                    key={idx} 
                    className="favorite-chip"
                    onClick={() => fetchWeather({ lat: city.lat, lon: city.lon, name: city.name })}
                  >
                    <MapPin style={{ width: 11, height: 11, marginRight: 4, color: 'var(--accent-yellow)' }} />
                    {city.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchHistory.length > 0 && (
            <div className="favorites-bar" style={{ margin: 0 }}>
              <span className="favorites-title">Recent:</span>
              <div className="favorites-list">
                {searchHistory.map((city, idx) => (
                  <button 
                    key={idx} 
                    className="favorite-chip"
                    onClick={() => fetchWeather({ lat: city.lat, lon: city.lon, name: city.name })}
                  >
                    <Clock style={{ width: 11, height: 11, marginRight: 4, color: 'var(--accent-blue)' }} />
                    {city.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
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
                aria-label={isCurrentFavorite ? "Remove from Favorites" : "Add to Favorites"}
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
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            {weatherData.fetchedAt && (
              <div className="last-updated" style={{ fontSize: '0.78rem', color: isFallback ? 'var(--accent-yellow)' : 'var(--text-subtle)', marginTop: '-1.35rem', marginBottom: '1.25rem', opacity: 0.95, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', fontWeight: isFallback ? 600 : 400 }}>
                <span>{isFallback ? `Showing cached data (from: ${weatherData.fetchedAt})` : `Last updated at: ${weatherData.fetchedAt}`}</span>
                {hasError && (
                  <button 
                    onClick={() => fetchWeather({ lat: lastCoords.current.lat, lon: lastCoords.current.lon, name: weatherData.cityName })}
                    style={{
                      background: 'rgba(239, 68, 68, 0.25)',
                      border: '1px solid var(--accent-red)',
                      color: 'white',
                      borderRadius: '999px',
                      padding: '0.15rem 0.5rem',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      borderWidth: '1px'
                    }}
                    title="Retry loading weather data"
                  >
                    <RefreshCw style={{ width: 10, height: 10 }} /> Retry
                  </button>
                )}
              </div>
            )}
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
                <span>H: {Math.round(isCelsius ? daily.temperature_2m_max[0] : toFahrenheit(daily.temperature_2m_max[0]))}°</span>
                <span>L: {Math.round(isCelsius ? daily.temperature_2m_min[0] : toFahrenheit(daily.temperature_2m_min[0]))}°</span>
              </div>
            )}
          </section>

          {/* Details Panel Grid */}
          <section className="details-grid">
            <MetricCard 
              icon={<Thermometer style={{ color: 'var(--accent-orange)' }} />}
              title="Feels Like"
              value={formatTemp(current.apparent_temperature)}
              subtitle="Humidity effect matches standard ambient"
            />
            <MetricCard 
              icon={<Droplets style={{ color: 'var(--accent-blue)' }} />}
              title="Humidity"
              value={`${current.relative_humidity_2m}%`}
              subtitle={`Precipitation: ${current.precipitation} mm`}
            />
            <MetricCard 
              icon={<Wind style={{ color: 'var(--accent-teal)' }} />}
              title="Wind Speed"
              value={`${Math.round(current.wind_speed_10m)} km/h`}
              subtitle={`Dir: ${current.wind_direction_10m}°`}
            />
            <MetricCard 
              icon={<Gauge style={{ color: 'var(--accent-purple)' }} />}
              title="Barometer"
              value={`${current.pressure_msl} hPa`}
              subtitle="Standard sea-level atmospheric force"
            />
            
            {/* Air Quality Index Card */}
            {weatherData.aqi && (
              <MetricCard 
                icon={<AlertCircle style={{ color: weatherData.aqi.index <= 2 ? 'var(--accent-teal)' : 'var(--accent-orange)' }} />}
                title="Air Quality"
                value={weatherData.aqi.label}
                subtitle={`Index status rating: ${weatherData.aqi.index} / 5`}
              />
            )}

            {/* PM2.5 Fine Particles Card */}
            {weatherData.aqi && (
              <MetricCard 
                icon={<AlertCircle style={{ color: weatherData.aqi.pm25 < 15 ? 'var(--accent-teal)' : 'var(--accent-orange)' }} />}
                title="PM 2.5 Density"
                value={`${Math.round(weatherData.aqi.pm25)} µg/m³`}
                subtitle="Fine respirable particles density"
              />
            )}
          </section>

          {/* Hourly Forecast Scrolling Card */}
          <HourlyForecast 
            hourly={hourly}
            isCelsius={isCelsius}
            toFahrenheit={toFahrenheit}
          />
        </div>

        {/* Right Column: Radar Map & 5-Day Forecast */}
        <div className="side-column">
          {/* Interactive Radar Map widget */}
          <section className="glass-panel map-card">
            <h2 className="card-title">
              <MapIcon />
              <span>Wind Radar Map</span>
            </h2>
            <div className="map-wrapper" style={{ position: 'relative' }}>
              {mapError ? (
                <div className="map-fallback-ui" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: '12px',
                  color: 'var(--text-subtle)',
                  padding: '2rem',
                  textAlign: 'center'
                }}>
                  <AlertCircle style={{ width: 40, height: 40, color: 'var(--accent-red)' }} />
                  <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Wind radar is temporarily unavailable.</p>
                  <button 
                    onClick={() => {
                      setMapError(false);
                      setMapLoading(true);
                    }}
                    className="favorite-chip"
                    style={{
                      padding: '0.4rem 0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white',
                      cursor: 'pointer',
                      borderRadius: '8px'
                    }}
                  >
                    <RefreshCw style={{ width: 12, height: 12 }} /> Retry Load
                  </button>
                </div>
              ) : (
                <>
                  {mapLoading && (
                    <div className="map-loader" style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#0f172a',
                      borderRadius: '16px',
                      zIndex: 10
                    }}>
                      <RefreshCw className="loader-spinner" style={{ width: 24, height: 24, color: 'var(--accent-blue)', animation: 'spin 1.5s linear infinite' }} />
                    </div>
                  )}
                  <iframe 
                    id="windy-map"
                    title="Windy Weather Radar Map"
                    src={`https://embed.windy.com/embed2.html?lat=${activeLat}&lon=${activeLon}&zoom=5&level=surface&overlay=wind&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&detailLat=${activeLat}&detailLon=${activeLon}&metricWind=default&metricTemp=default&radarRange=-1`}
                    onLoad={() => setMapLoading(false)}
                    onError={() => setMapError(true)}
                  />
                </>
              )}
            </div>
          </section>

          {/* 5-Day Forecast relative bars card */}
          <DailyForecast 
            daily={daily}
            isCelsius={isCelsius}
            toFahrenheit={toFahrenheit}
          />
        </div>
      </main>

      {/* Footer */}
      <footer>
        <p>Designed by Muthyala Varaprasad | Weather dashboard client architecture v1.3.0</p>
      </footer>
    </div>
  );
}
