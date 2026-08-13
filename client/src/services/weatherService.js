/**
 * Client API services to interact with Express backend weather proxy routes.
 */

/**
 * Fetch detailed weather using city name queries.
 * @param {string} city - Name of target city.
 * @returns {Promise<object>} Adapted weather dashboard payload.
 */
export const fetchWeatherByCity = async (city) => {
  const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "City not found. Please check the city name and try again.");
  }
  return response.json();
};

/**
 * Fetch detailed weather, forecast, and air pollution metrics for a coordinate set.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<object>} Adapted weather dashboard payload.
 */
export const fetchWeather = async (lat, lon) => {
  const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Could not download atmospheric data.");
  }
  return response.json();
};

/**
 * Autocomplete search for matching cities.
 * @param {string} query - Autocomplete characters.
 * @returns {Promise<object>} Autocomplete matches list.
 */
export const searchLocations = async (query) => {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to query location suggestions.");
  }
  return response.json();
};
