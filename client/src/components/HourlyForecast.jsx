import React from 'react';
import { Clock } from 'lucide-react';
import WeatherIcon, { WEATHER_CODES } from './WeatherIcon';

/**
 * Renders the horizontal scrolling 24h temperature and conditions hourly grid.
 */
export default function HourlyForecast({ hourly, isCelsius, toFahrenheit }) {
  if (!hourly) return null;

  return (
    <section className="glass-panel hourly-card">
      <h2 className="card-title">
        <Clock />
        <span>Hourly Forecast (24h)</span>
      </h2>
      <div className="hourly-scroll">
        {hourly.time.map((timeStr, idx) => {
          const temp = hourly.temperature_2m[idx];
          const code = hourly.weather_code[idx];
          const pop = hourly.precipitation_probability[idx];
          
          const date = new Date(timeStr);
          let hrs = date.getHours();
          const ampm = hrs >= 12 ? 'PM' : 'AM';
          hrs = hrs % 12 || 12;
          const timeFormatted = `${hrs} ${ampm}`;

          const hourIcon = WEATHER_CODES[code]?.icon || 'cloud';

          return (
            <div key={idx} className="hourly-item">
              <span className="hourly-time">{idx === 0 ? 'Now' : timeFormatted}</span>
              <WeatherIcon name={hourIcon} className="hourly-icon" />
              <span className="hourly-temp">{Math.round(isCelsius ? temp : toFahrenheit(temp))}°</span>
              <span className="hourly-pop">{pop > 0 ? `${pop}%` : ''}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
