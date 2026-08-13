import NodeCache from 'node-cache';

// Cache weather responses for 10 minutes (600 seconds) by default
const weatherCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

/**
 * Retrieve a value from the cache.
 * @param {string} key - Cache key.
 * @returns {any} Cached value or undefined.
 */
export const getCache = (key) => {
  return weatherCache.get(key);
};

/**
 * Store a value in the cache.
 * @param {string} key - Cache key.
 * @param {any} value - Value to cache.
 * @param {number} [ttl] - Optional time to live in seconds.
 * @returns {boolean} True if successfully cached.
 */
export const setCache = (key, value, ttl) => {
  if (ttl) {
    return weatherCache.set(key, value, ttl);
  }
  return weatherCache.set(key, value);
};
