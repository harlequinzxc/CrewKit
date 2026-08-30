import React from 'react';

interface GoldRingProps {
  isError?: boolean;
}

export const GoldRing: React.FC<GoldRingProps> = ({ isError = false }) => {
  return (
    <div className="relative flex items-center justify-center w-24 h-24 select-none">
      {/* Breathing Halo */}
      <div
        className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 animate-pulse ${
          isError ? 'bg-danger/30' : 'bg-gold-glow'
        }`}
      />

      {/* Rotating Gold Ring */}
      {!isError ? (
        <svg
          className="w-18 h-18 animate-spin"
          viewBox="0 0 64 64"
          style={{ animationDuration: '1.4s' }}
        >
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="var(--gold-dim)"
            strokeWidth="2"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="var(--gold-400)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="45 130"
          />
        </svg>
      ) : (
        <div className="w-14 h-14 rounded-full border border-danger/60 flex items-center justify-center text-danger font-display text-2xl font-bold">
          !
        </div>
      )}
    </div>
  );
};
