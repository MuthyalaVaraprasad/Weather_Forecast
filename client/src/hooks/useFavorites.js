import { useState, useEffect } from 'react';

/**
 * Custom React Hook to manage bookmarked favorite cities and recent searches.
 * Handles loading/storing data in localStorage.
 */
export const useFavorites = () => {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('weather_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('weather_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Sync favorites changes with localStorage
  useEffect(() => {
    localStorage.setItem('weather_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (cityName, lat, lon) => {
    if (!cityName) return;
    const isFav = favorites.some(f => f.name.toLowerCase() === cityName.toLowerCase());
    if (isFav) {
      setFavorites(favorites.filter(f => f.name.toLowerCase() !== cityName.toLowerCase()));
    } else {
      setFavorites([...favorites, { name: cityName, lat, lon }]);
    }
  };

  const isFavorite = (cityName) => {
    if (!cityName) return false;
    return favorites.some(f => f.name.toLowerCase() === cityName.toLowerCase());
  };

  const addToHistory = (cityName, lat, lon) => {
    if (!cityName || cityName.includes('Demo') || cityName.includes('undefined')) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.name.toLowerCase() !== cityName.toLowerCase());
      const updated = [{ name: cityName, lat, lon }, ...filtered].slice(0, 5);
      localStorage.setItem('weather_search_history', JSON.stringify(updated));
      return updated;
    });
  };

  return {
    favorites,
    searchHistory,
    toggleFavorite,
    isFavorite,
    addToHistory
  };
};
