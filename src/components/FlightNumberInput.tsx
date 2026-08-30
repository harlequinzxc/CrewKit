import React from 'react';

interface FlightNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
  error?: string | null;
  placeholder?: string;
  className?: string;
}

export const FlightNumberInput: React.FC<FlightNumberInputProps> = ({
  value,
  onChange,
  error = null,
  placeholder = '3 2 2',
  className = '',
}) => {
  return (
    <div className={`w-full text-left ${className}`}>
      {/* Overline Label (Whisper quiet) */}
      <label className="block text-[0.65rem] font-sans font-medium uppercase tracking-[0.2em] text-mist-400 mb-2 select-none">
        FLIGHT
      </label>

      {/* Two side-by-side elements, gap-3 */}
      <div className="flex items-center gap-3">
        {/* SQ Prefix Badge */}
        <div className="w-13 sm:w-14 h-13 sm:h-14 rounded-well bg-ink-850 border border-gold-dim flex items-center justify-center text-gold-300 font-sans font-semibold text-base tracking-wider shadow-sm shrink-0 select-none">
          SQ
        </div>

        {/* Numeric Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full h-13 sm:h-14 px-4 rounded-well bg-ink-850 text-ivory-100 placeholder:text-mist-500 font-display text-2xl tracking-[0.15em] focus:outline-none transition-all ${
              error
                ? 'border border-danger focus:ring-1 focus:ring-danger'
                : 'border border-gold-dim focus:border-gold-400 focus:ring-1 focus:ring-gold-400/40'
            }`}
          />
        </div>
      </div>

      {/* Error helper */}
      {error && (
        <p className="text-[0.72rem] text-danger mt-1.5 ml-1 animate-fade-in font-sans font-medium">
          {error}
        </p>
      )}
    </div>
  );
};
