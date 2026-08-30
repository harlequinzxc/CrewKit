import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  to?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

/**
 * Master Brand Mark:
 * A simple Champagne-Gold folded paper plane.
 * Clean, flat vector origami geometry with lit upper wing, shaded lower wing,
 * subtle underside keel fold, and delicate spine highlight.
 */
export const LogoMark: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 32,
}) => {
  const glowId = `planeGlow-${size}`;
  const litId = `litWing-${size}`;
  const mainId = `mainWing-${size}`;
  const keelId = `keelShadow-${size}`;

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      className={`shrink-0 flex items-center justify-center overflow-visible relative select-none ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        aria-hidden="true"
      >
        <defs>
          {/* Ambient Warm Glow */}
          <radialGradient id={glowId} cx="50%" cy="52%" r="40%">
            <stop offset="0%" stopColor="#D4AF7A" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#B78D55" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#B78D55" stopOpacity="0" />
          </radialGradient>

          {/* Lit Upper Wing Gradient */}
          <linearGradient id={litId} x1="20" y1="44" x2="86" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF6E5" />
            <stop offset="45%" stopColor="#ECD0A2" />
            <stop offset="100%" stopColor="#D4AF7A" />
          </linearGradient>

          {/* Lower Main Wing Gradient */}
          <linearGradient id={mainId} x1="48" y1="64" x2="86" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#B88D52" />
            <stop offset="55%" stopColor="#D4AF7A" />
            <stop offset="100%" stopColor="#E4C494" />
          </linearGradient>

          {/* Keel / Underside Shadow Gradient */}
          <linearGradient id={keelId} x1="34" y1="60" x2="48" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5A3D14" />
            <stop offset="100%" stopColor="#8C6328" />
          </linearGradient>
        </defs>

        {/* 1. Ambient Glow Pooling Beneath */}
        <circle cx="50" cy="52" r="36" fill={`url(#${glowId})`} />

        {/* 2. Underside Keel / Fold Shadow */}
        <path d="M 48 64 L 34 60 L 40 70 Z" fill={`url(#${keelId})`} />

        {/* 3. Lit Upper Wing Facet */}
        <path d="M 86 18 L 18 44 L 48 64 Z" fill={`url(#${litId})`} />

        {/* 4. Lower Main Wing Facet */}
        <path d="M 86 18 L 48 64 L 66 84 Z" fill={`url(#${mainId})`} />

        {/* 5. Center Spine Fold Line Highlight */}
        <line
          x1="86"
          y1="18"
          x2="48"
          y2="64"
          stroke="#FFF8EC"
          strokeWidth="0.75"
          strokeLinecap="round"
          opacity="0.8"
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
  const markSize = size === 'lg' ? 44 : size === 'md' ? 36 : 30;
  const textSize =
    size === 'lg'
      ? 'text-3xl'
      : size === 'md'
      ? 'text-2xl'
      : 'text-xl';

  const content = (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Master Mark: Champagne-Gold Folded Paper Plane */}
      <LogoMark size={markSize} />

      {/* Live CSS Wordmark: "Crew" roman in warm off-white + "Kit" gold italic */}
      {showWordmark && (
        <span
          className={`font-display ${textSize} tracking-tight leading-none text-ivory-100 flex items-center`}
        >
          <span className="font-normal">Crew</span>
          <span className="italic gold-gradient-text font-normal ml-[1px]">Kit</span>
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
