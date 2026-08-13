import React, { useMemo } from 'react';

/**
 * Animated background particle element generator. Renders snowflakes, falling rain drops, twinkling stars, and sunburst rays.
 */
export default function BackgroundParticles({ code, isDay }) {
  const particles = useMemo(() => {
    const list = [];
    const isRain = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code);
    const isSnow = [56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code);
    const isStorm = [95, 96, 99].includes(code);
    const isClear = [0, 1].includes(code);

    if (isRain || isStorm) {
      const count = isStorm ? 45 : 30;
      for (let i = 0; i < count; i++) {
        list.push({
          id: `rain-${i}`,
          type: 'rain',
          style: {
            left: `${Math.random() * 100}%`,
            animationDuration: `${0.5 + Math.random() * 0.7}s`,
            animationDelay: `${Math.random() * 2}s`
          }
        });
      }
    } else if (isSnow) {
      const count = 35;
      for (let i = 0; i < count; i++) {
        const size = 3 + Math.random() * 6;
        list.push({
          id: `snow-${i}`,
          type: 'snow',
          style: {
            left: `${Math.random() * 100}%`,
            width: `${size}px`,
            height: `${size}px`,
            animationDuration: `${6 + Math.random() * 7}s`,
            animationDelay: `${Math.random() * 5}s`
          }
        });
      }
    } else if (isClear) {
      if (isDay) {
        list.push({
          id: 'sun-ray',
          type: 'sun-ray',
          style: {}
        });
      } else {
        const count = 40;
        for (let i = 0; i < count; i++) {
          const size = 1 + Math.random() * 3;
          list.push({
            id: `star-${i}`,
            type: 'star',
            style: {
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 80}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDuration: `${2 + Math.random() * 3}s`,
              animationDelay: `${Math.random() * 3}s`
            }
          });
        }
      }
    }
    return list;
  }, [code, isDay]);

  return (
    <div className="particles-container">
      {particles.map(p => {
        if (p.type === 'rain') return <div key={p.id} className="rain-drop" style={p.style} />;
        if (p.type === 'snow') return <div key={p.id} className="snowflake-particle" style={p.style} />;
        if (p.type === 'sun-ray') return <div key={p.id} className="sun-ray" />;
        if (p.type === 'star') return <div key={p.id} className="star-particle" style={p.style} />;
        return null;
      })}
    </div>
  );
}
