import React, { useState, useEffect } from 'react';
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
  lastCoords,
  isModalSuggestionsLoading,
  modalSuggestionsError,
  failedQuery
}) {
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // Reset active suggestion index when suggestions list updates
  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [modalSuggestions]);
  return (
    <div className="location-prompt-overlay">
      <div className="glass-panel prompt-card">
        <div className="prompt-icon-wrapper">
          <MapPinOff className="pulse-icon" />
        </div>
        <h2>{failedQuery ? 'Weather Data Unavailable' : 'Location Access Required'}</h2>
        <p>
          {failedQuery 
            ? `Unable to load weather details for "${typeof failedQuery === 'string' ? failedQuery : failedQuery.name}". Please check your internet connection and try again.`
            : `We couldn't automatically detect your location. Please grant location access in your browser or choose a city below to open the dashboard.`
          }
        </p>
        
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
              role="combobox"
              aria-autocomplete="list"
              aria-controls="modal-suggestions-list"
              aria-expanded={isModalSuggestionsActive && (isModalSuggestionsLoading || modalSuggestions.length > 0 || modalSuggestionsError !== null)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  if (!isModalSuggestionsActive) {
                    setIsModalSuggestionsActive(true);
                  } else if (modalSuggestions.length > 0) {
                    setActiveSuggestionIndex((prev) => (prev + 1) % modalSuggestions.length);
                  }
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  if (isModalSuggestionsActive && modalSuggestions.length > 0) {
                    setActiveSuggestionIndex((prev) => (prev - 1 + modalSuggestions.length) % modalSuggestions.length);
                  }
                } else if (e.key === 'Escape') {
                  setIsModalSuggestionsActive(false);
                  setActiveSuggestionIndex(-1);
                } else if (e.key === 'Enter') {
                  if (isModalSuggestionsActive && activeSuggestionIndex >= 0 && activeSuggestionIndex < modalSuggestions.length) {
                    const selectedCity = modalSuggestions[activeSuggestionIndex];
                    fetchWeather({ 
                      lat: selectedCity.latitude, 
                      lon: selectedCity.longitude, 
                      name: `${selectedCity.name}, ${selectedCity.country}` 
                    });
                    setModalSearchTerm('');
                    setIsModalSuggestionsActive(false);
                    setActiveSuggestionIndex(-1);
                  } else {
                    const trimmed = modalSearchTerm.trim();
                    if (trimmed !== '') {
                      fetchWeather(trimmed);
                      setModalSearchTerm('');
                      setIsModalSuggestionsActive(false);
                      setActiveSuggestionIndex(-1);
                    }
                  }
                }
              }}
            />
          </div>
          <div 
            id="modal-suggestions-list"
            role="listbox"
            className={`suggestions-box ${isModalSuggestionsActive ? 'active' : ''}`}
          >
            {isModalSuggestionsLoading && (
              <div className="suggestion-status">
                <RefreshCw className="spinner-icon" style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                <span>Searching locations...</span>
              </div>
            )}
            {modalSuggestionsError && (
              <div className="suggestion-status error-text">
                <span>{modalSuggestionsError}</span>
              </div>
            )}
            {!isModalSuggestionsLoading && !modalSuggestionsError && modalSuggestions.length === 0 && modalSearchTerm.trim().length >= 2 && (
              <div className="suggestion-status">
                <span>No locations found</span>
              </div>
            )}
            {!isModalSuggestionsLoading && !modalSuggestionsError && modalSuggestions.map((city, idx) => (
              <div 
                key={idx} 
                id={`modal-suggestion-item-${idx}`}
                role="option"
                aria-selected={idx === activeSuggestionIndex}
                className={`suggestion-item ${idx === activeSuggestionIndex ? 'active-highlight' : ''}`}
                onClick={() => {
                  fetchWeather({ lat: city.latitude, lon: city.longitude, name: `${city.name}, ${city.country}` });
                  setModalSearchTerm('');
                  setIsModalSuggestionsActive(false);
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
        
        {hasError && (
          <button 
            onClick={() => {
              if (failedQuery) {
                fetchWeather(failedQuery);
              } else if (lastCoords && lastCoords.current) {
                fetchWeather({ lat: lastCoords.current.lat, lon: lastCoords.current.lon });
              }
            }}
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
            <RefreshCw style={{ width: 14, height: 14 }} /> {failedQuery ? 'Retry Search' : 'Retry Connection'}
          </button>
        )}
      </div>
    </div>
  );
}
