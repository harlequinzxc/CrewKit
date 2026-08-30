import React, { useMemo } from 'react';
import { useTheme } from '../hooks/useTheme';

export const Starfield: React.FC = () => {
  const { isNight } = useTheme();

  // Generate deterministic star positions
  const stars = useMemo(() => {
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      top: `${(i * 17 + 7) % 94}%`,
      left: `${(i * 23 + 11) % 96}%`,
      size: i % 4 === 0 ? 2.5 : i % 3 === 0 ? 2 : 1.5,
      delay: `${(i * 0.4) % 3.5}s`,
      duration: `${3 + ((i * 0.7) % 2.5)}s`,
      opacity: i % 2 === 0 ? 0.75 : 0.45,
    }));
  }, []);

  return (
    <div className="starfield-layer" aria-hidden="true">
      {stars.map((star) => (
        <span
          key={star.id}
          className="star-mote"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: star.delay,
            animationDuration: star.duration,
            opacity: star.opacity,
            backgroundColor: isNight ? '#F2DEAE' : '#93702C',
          }}
        />
      ))}
    </div>
  );
};
