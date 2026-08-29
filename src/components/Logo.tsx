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
 * - Rounded square (radius 24%), fill #0B1E3E.
 * - Flat champagne-gold geometric abstract paper plane (#C9A84C) matching --accent.
 * - Wordmark: Inter SemiBold — "Crew" in --text-primary, "Kit" in --accent gold (No serif).
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
        backgroundColor: '#0B1E3E',
      }}
      className={`shrink-0 flex items-center justify-center shadow-sm overflow-hidden border border-border-subtle/50 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.62}
        height={size * 0.62}
        className="text-accent fill-current translate-x-[0.5px] -translate-y-[0.5px]"
        aria-hidden="true"
      >
        {/* Geometric Abstract Paper Plane */}
        {/* Main Left Wing */}
        <path
          d="M 21 3 L 3 11 L 11.5 13.5 L 21 3 Z"
          fill="currentColor"
        />
        {/* Bottom Right Wing */}
        <path
          d="M 21 3 L 11.5 13.5 L 14 21 L 21 3 Z"
          fill="currentColor"
        />
        {/* Inner Fold */}
        <path
          d="M 11.5 13.5 L 11.5 17 L 14 13.5 Z"
          fill="var(--accent-dim, #8A7333)"
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
      {/* Mark: 28px rounded square (24% radius) */}
      <LogoMark size={markSize} />

      {/* Wordmark: Inter SemiBold — "Crew" text-primary, "Kit" accent gold (NO SERIF) */}
      {showWordmark && (
        <span className={`font-sans font-semibold ${textSize} tracking-tight leading-none text-text-primary flex items-center`}>
          Crew<span className="text-accent ml-[1px]">Kit</span>
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="group inline-flex items-center focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-base rounded-lg"
        aria-label="CrewKit Home"
      >
        {content}
      </Link>
    );
  }

  return content;
};
