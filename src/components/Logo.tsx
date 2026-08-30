import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  to?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

/**
 * Geometric Abstract Paper Plane Emblem
 * - Rounded square (radius 24%), fill ink-900.
 * - Flat champagne-gold geometric abstract paper plane (#C9A84C) matching gold-400.
 * - Wordmark: Jost / Inter SemiBold — "Crew" in ivory-100, "Kit" in gold-400.
 */
export const LogoMark: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 28,
}) => {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '24%',
      }}
      className={`shrink-0 flex items-center justify-center shadow-sm overflow-hidden bg-ink-900 border border-gold-dim ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.62}
        height={size * 0.62}
        className="text-gold-400 fill-current translate-x-[0.5px] -translate-y-[0.5px]"
        aria-hidden="true"
      >
        {/* Geometric Abstract Paper Plane */}
        <path
          d="M 21 3 L 3 11 L 11.5 13.5 L 21 3 Z"
          fill="currentColor"
        />
        <path
          d="M 21 3 L 11.5 13.5 L 14 21 L 21 3 Z"
          fill="currentColor"
        />
        <path
          d="M 11.5 13.5 L 11.5 17 L 14 13.5 Z"
          fill="var(--gold-dim, #8A7333)"
          opacity="0.9"
        />
      </svg>
    </div>
  );
};

export const Logo: React.FC<LogoProps> = ({
  to = '/',
  className = '',
  size = 'sm',
  showWordmark = true,
}) => {
  const markSize = size === 'lg' ? 40 : size === 'md' ? 34 : 28;
  const textSize =
    size === 'lg'
      ? 'text-2xl'
      : size === 'md'
      ? 'text-xl'
      : 'text-lg';

  const content = (
    <div className={`flex items-center gap-[9px] select-none ${className}`}>
      {/* Mark: 28px rounded square */}
      <LogoMark size={markSize} />

      {/* Wordmark */}
      {showWordmark && (
        <span className={`font-ui font-semibold ${textSize} tracking-tight leading-none text-ivory-100 flex items-center`}>
          Crew<span className="text-gold-400 ml-[1px]">Kit</span>
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="group inline-flex items-center focus:outline-none focus:ring-1 focus:ring-gold-400 rounded-lg"
        aria-label="CrewKit Home"
      >
        {content}
      </Link>
    );
  }

  return content;
};
