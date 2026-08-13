/**
 * Client API services to interact with Express backend weather proxy routes.
 */

/**
 * Fetch detailed weather, forecast, and air pollution metrics for a coordinate set.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<object>} Adapted weather dashboard payload.
 */
export const fetchWeather = async (lat, lon) => {
  const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
  if (!response.ok) {
    throw new Error("Could not download atmospheric data.");
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
    throw new Error("Failed to query location suggestions.");
  }
  return response.json();
};
