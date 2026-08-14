import React from 'react';
import { MapPinOff, MapPin, RefreshCw } from 'lucide-react';

/**
 * Screen fallback overlay displayed when Geolocator permissions are denied or search needs manual input.
 */
export default function FallbackPrompt({
  popularCities,
  fetchWeather,
  modalSearchTerm,
  handleModalSearchChange,
  isModalSuggestionsActive,
  modalSuggestions,
  setModalSearchTerm,
  setIsModalSuggestionsActive,
  modalSearchContainerRef,
  hasError,
  lastCoords
}) {
  return (
    <div className="location-prompt-overlay">
      <div className="glass-panel prompt-card">
        <div className="prompt-icon-wrapper">
          <MapPinOff className="pulse-icon" />
        </div>
        <h2>Location Access Required</h2>
        <p>We couldn't automatically detect your location. Please grant location access in your browser or choose a city below to open the dashboard.</p>
        
        <div className="quick-cities-title">Popular Cities</div>
        <div className="quick-cities-grid">
          {popularCities.map(city => (
            <button 
              key={city.name} 
              className="btn-quick-city"
              onClick={() => fetchWeather({ lat: city.lat, lon: city.lon, name: city.name })}
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
              onChange={(e) => handleModalSearchChange(e.target.value)}
              aria-label="Search for a city manually"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const trimmed = modalSearchTerm.trim();
                  if (trimmed !== '') {
                    fetchWeather(trimmed);
                    setModalSearchTerm('');
                    setIsModalSuggestionsActive(false);
                  }
                }
              }}
            />
          </div>
          <div className={`suggestions-box ${isModalSuggestionsActive ? 'active' : ''}`}>
            {modalSuggestions.map((city, idx) => (
              <div 
                key={idx} 
                className="suggestion-item"
                onClick={() => {
                  fetchWeather({ lat: city.latitude, lon: city.longitude, name: `${city.name}, ${city.country}` });
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
        
        {hasError && (
          <button 
            onClick={() => fetchWeather({ lat: lastCoords.current.lat, lon: lastCoords.current.lon })}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--accent-red)',
              color: 'white',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '1.25rem',
              transition: 'all 0.2s ease',
              width: '100%'
            }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} /> Retry Connection
          </button>
        )}
      </div>
    </div>
  );
}
