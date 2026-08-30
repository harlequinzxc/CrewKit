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
 * A champagne-gold paper plane folded like a boarding-pass ticket (#D4AF7A, lit edge #E9CFA5, fold shadow #B78D55)
 * with a perforated tear-line across the wing and five fading runway-light dots, with faint warm glow beneath.
 * Pure flat vector, no 3D, no clouds, no ink bottles, no text in the icon.
 */
export const LogoMark: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 32,
}) => {
  const glowId = `warmGlow-${size}`;
  const litId = `litWing-${size}`;
  const bodyId = `mainBody-${size}`;
  const shadowId = `foldShadow-${size}`;

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
          {/* Faint Warm Glow Pooling Beneath */}
          <radialGradient id={glowId} cx="50%" cy="58%" r="42%">
            <stop offset="0%" stopColor="#D4AF7A" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#B78D55" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#B78D55" stopOpacity="0" />
          </radialGradient>

          {/* Lit Upper Wing Gradient (#E9CFA5 lit edge) */}
          <linearGradient id={litId} x1="44" y1="24" x2="84" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF2DC" />
            <stop offset="50%" stopColor="#E9CFA5" />
            <stop offset="100%" stopColor="#D4AF7A" />
          </linearGradient>

          {/* Main Boarding Pass Wing / Body Gradient (#D4AF7A) */}
          <linearGradient id={bodyId} x1="48" y1="36" x2="74" y2="74" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E2C192" />
            <stop offset="50%" stopColor="#D4AF7A" />
            <stop offset="100%" stopColor="#B78D55" />
          </linearGradient>

          {/* Fold Shadow Gradient (#B78D55) */}
          <linearGradient id={shadowId} x1="37" y1="53" x2="56" y2="65" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#B78D55" />
            <stop offset="100%" stopColor="#785322" />
          </linearGradient>
        </defs>

        {/* 1. Faint Warm Glow Pooling Beneath */}
        <circle cx="50" cy="58" r="38" fill={`url(#${glowId})`} />

        {/* 2. Five Fading Runway-Light Dots */}
        <circle cx="10" cy="88" r="1.3" fill="#B78D55" opacity="0.22" />
        <circle cx="15" cy="84" r="1.6" fill="#B78D55" opacity="0.38" />
        <circle cx="21" cy="79" r="2.0" fill="#D4AF7A" opacity="0.58" />
        <circle cx="27" cy="74" r="2.3" fill="#D4AF7A" opacity="0.78" />
        <circle cx="34" cy="68" r="2.6" fill="#E9CFA5" opacity="0.95" />

        {/* 3. Underbody Fold Shadow */}
        <path d="M 37 65 L 48 53 L 44 61 Z" fill={`url(#${shadowId})`} />
        <path d="M 44 61 L 48 53 L 56 65 Z" fill={`url(#${shadowId})`} />

        {/* 4. Lit Upper Wing Facet */}
        <path d="M 84 18 L 44 24 L 48 53 Z" fill={`url(#${litId})`} />
        {/* Lit Top Edge Highlight */}
        <path d="M 44 24 L 84 18" stroke="#FFF5E4" strokeWidth="0.8" strokeLinecap="round" opacity="0.85" />

        {/* 5. Main Boarding Pass Wing / Body Facet */}
        <path d="M 84 18 L 48 53 L 74 74 Z" fill={`url(#${bodyId})`} />

        {/* 6. Perforated Tear-Line across the Boarding Pass Wing */}
        <line
          x1="60"
          y1="36"
          x2="70"
          y2="58"
          stroke="#0B0E14"
          strokeWidth="1.6"
          strokeDasharray="1.6 2.0"
          strokeLinecap="round"
          opacity="0.85"
        />
        <line
          x1="60"
          y1="36"
          x2="70"
          y2="58"
          stroke="#FFF2DC"
          strokeWidth="0.6"
          strokeDasharray="1.6 2.0"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* 7. Center Spine Fold Line */}
        <line x1="84" y1="18" x2="48" y2="53" stroke="#FFF2DC" strokeWidth="0.6" opacity="0.7" />
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
      {/* Master Mark: Boarding Pass Folded Paper Plane */}
      <LogoMark size={markSize} />

      {/* Live CSS Wordmark: "Ink" roman in warm off-white (#E9EDF5) + "Flight" gold italic */}
      {showWordmark && (
        <span
          className={`font-display ${textSize} tracking-tight leading-none text-[#E9EDF5] dark:text-ivory-100 flex items-center`}
        >
          <span className="font-normal">Ink</span>
          <span className="italic gold-gradient-text font-normal ml-[1px]">Flight</span>
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="group inline-flex items-center focus:outline-none focus:ring-1 focus:ring-gold-400 rounded-lg"
        aria-label="InkFlight Home"
      >
        {content}
      </Link>
    );
  }

  return content;
};
