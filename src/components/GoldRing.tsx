import React from 'react';

interface GoldRingProps {
  isError?: boolean;
}

export const GoldRing: React.FC<GoldRingProps> = ({ isError = false }) => {
  return (
    <div className="relative flex items-center justify-center w-20 h-20 select-none">
      {/* Breathing Halo */}
      <div
        className={`absolute inset-0 rounded-full blur-xl transition-all duration-700 animate-pulse ${
          isError ? 'bg-danger/30' : 'bg-accent/25'
        }`}
      />

      {/* Rotating Gold Ring */}
      {!isError ? (
        <svg
          className="w-16 h-16 animate-spin"
          viewBox="0 0 64 64"
          style={{ animationDuration: '1.2s' }}
        >
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="2.5"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="50 120"
          />
        </svg>
      ) : (
        <div className="w-14 h-14 rounded-full border-2 border-danger/60 flex items-center justify-center text-danger font-serif text-xl font-bold">
          !
        </div>
      )}
    </div>
  );
};
