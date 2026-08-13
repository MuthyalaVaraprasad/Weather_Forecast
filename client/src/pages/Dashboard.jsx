import React from 'react';
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
  lastCoords,
  toFahrenheit,
  formatTemp
}) {
  const current = weatherData.current;
  const daily = weatherData.daily;
  const hourly = weatherData.hourly;

  const currentIcon = WEATHER_CODES[current.weather_code]?.icon || 'cloud';
  const currentCodeLabel = WEATHER_CODES[current.weather_code]?.label || 'Cloudy';

  const activeLat = weatherData.latitude || 51.5074;
  const activeLon = weatherData.longitude || -0.1278;

  // UV evaluation
  const uvVal = daily ? daily.uv_index_max[0] : 0;
  let uvTextStr = 'Low';
  if (uvVal > 2) uvTextStr = 'Moderate';
  if (uvVal > 5) uvTextStr = 'High';
  if (uvVal > 7) uvTextStr = 'Very High';
  if (uvVal > 10) uvTextStr = 'Extreme';

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

          <button 
            className="btn-unit-toggle" 
            onClick={() => setIsCelsius(!isCelsius)}
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
                    onClick={() => fetchWeather(city.lat, city.lon, city.name)}
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
                    onClick={() => fetchWeather(city.lat, city.lon, city.name)}
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
              <div className="last-updated" style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '-1.35rem', marginBottom: '1.25rem', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <span>Last updated at: {weatherData.fetchedAt}</span>
                {hasError && (
                  <button 
                    onClick={() => fetchWeather(lastCoords.current.lat, lastCoords.current.lon)}
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

        {/* Right Column: Radar Map & 7-Day Forecast */}
        <div className="side-column">
          {/* Interactive Radar Map widget */}
          <section className="glass-panel map-card">
            <h2 className="card-title">
              <MapIcon />
              <span>Wind Radar Map</span>
            </h2>
            <div className="map-iframe-container">
              <iframe 
                title="Windy Weather Radar Map"
                src={`https://node.windy.com/iframe/three/index.html?lat=${activeLat}&lon=${activeLon}&zoom=5&level=surface&overlay=wind&menu=&message=&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=${activeLat}&detailLon=${activeLon}&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`}
              />
            </div>
          </section>

          {/* 7-Day Forecast relative bars card */}
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
