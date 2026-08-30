import React from 'react';

interface FlightNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
  isChecking?: boolean;
  error?: string | null;
  placeholder?: string;
  className?: string;
}

export const FlightNumberInput: React.FC<FlightNumberInputProps> = ({
  value,
  onChange,
  isValid,
  isChecking = false,
  error = null,
  placeholder = '3 2 2',
  className = '',
}) => {
  return (
    <div className={`w-full text-left ${className}`}>
      {/* Overline Label (Jost uppercase) */}
      <label className="block text-[0.72rem] font-ui uppercase tracking-eyebrow text-mist-300 mb-2 select-none">
        Flight Number
      </label>

      {/* Two side-by-side elements, gap-3 */}
      <div className="flex items-center gap-3">
        {/* SQ Prefix Badge */}
        <div className="w-13 sm:w-14 h-13 sm:h-14 rounded-well bg-ink-850 border border-gold-dim flex items-center justify-center text-gold-300 font-ui font-bold text-base tracking-widest shadow-sm shrink-0 select-none">
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
            className={`w-full h-13 sm:h-14 px-4 rounded-well bg-ink-850 text-ivory-100 placeholder:text-mist-500 font-display text-2xl tracking-[0.25em] focus:outline-none transition-all ${
              error
                ? 'border border-danger focus:ring-1 focus:ring-danger'
                : isValid && value.length > 0
                ? 'border border-gold-400 focus:ring-1 focus:ring-gold-400/40 shadow-sm'
                : 'border border-gold-dim focus:border-gold-400'
            }`}
          />
          {isChecking && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gold-dim border-t-gold-300 rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Error helper */}
      {error && (
        <p className="text-[0.75rem] text-danger mt-1.5 ml-1 animate-fade-in font-sans font-medium">
          {error}
        </p>
      )}
    </div>
  );
};
