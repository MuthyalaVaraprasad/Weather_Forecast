import React from 'react';
import { Calendar, Droplet } from 'lucide-react';
import WeatherIcon, { WEATHER_CODES } from './WeatherIcon';

/**
 * 5-Day extended daily forecast mapping list with Apple-style relative bar fills.
 */
export default function DailyForecast({ daily, isCelsius, toFahrenheit }) {
  if (!daily) return null;

  // Relative limits for Apple-style temp sliders
  const weekMin = Math.min(...daily.temperature_2m_min);
  const weekMax = Math.max(...daily.temperature_2m_max);

  return (
    <section className="glass-panel daily-card">
      <h2 className="card-title">
        <Calendar />
        <span>5-Day Forecast</span>
      </h2>
      <div className="daily-forecast-list">
        {daily.time.map((timeStr, idx) => {
          const code = daily.weather_code[idx];
          const min = daily.temperature_2m_min[idx];
          const max = daily.temperature_2m_max[idx];
          const pop = daily.precipitation_probability_max[idx];

          const dayLabel = idx === 0 ? 'Today' : new Date(timeStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
          const dailyIcon = WEATHER_CODES[code]?.icon || 'cloud';

          // Apple weather progress bars
          const leftPercent = weekMax === weekMin ? 0 : ((min - weekMin) / (weekMax - weekMin)) * 100;
          const widthPercent = weekMax === weekMin ? 100 : ((max - min) / (weekMax - weekMin)) * 100;

          return (
            <div key={idx} className="daily-row">
              <span className="daily-day">{dayLabel}</span>
              <span className="daily-pop-container">
                {pop > 10 ? (
                  <>
                    <Droplet style={{ width: 10, height: 10 }} /> <span>{pop}%</span>
                  </>
                ) : ''}
              </span>
              <WeatherIcon name={dailyIcon} className="daily-row-icon" />
              <div className="daily-temp-bar-container">
                <span className="min-temp">{Math.round(isCelsius ? min : toFahrenheit(min))}°</span>
                <div className="temp-bar">
                  <div className="temp-bar-fill" style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }} />
                </div>
                <span className="max-temp">{Math.round(isCelsius ? max : toFahrenheit(max))}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
