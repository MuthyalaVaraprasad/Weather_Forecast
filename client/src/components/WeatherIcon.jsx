import React from 'react';
import { 
  Sun, Moon, CloudSun, CloudMoon, Cloud, CloudFog, 
  CloudDrizzle, CloudRain, Snowflake, CloudLightning 
} from 'lucide-react';

// WMO Weather Codes mapping to description, icons, and body background classes
export const WEATHER_CODES = {
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
export const ICON_COMPONENTS = {
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

/**
 * Reusable WeatherIcon component mapping icons by shorthand strings.
 */
export default function WeatherIcon({ name, ...props }) {
  const IconComp = ICON_COMPONENTS[name] || Cloud;
  return <IconComp {...props} />;
}
