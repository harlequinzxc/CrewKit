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
      {/* Overline Label */}
      <label className="block text-[0.7rem] font-medium tracking-[0.2em] uppercase text-text-secondary mb-2.5 select-none">
        Flight Number
      </label>

      {/* Two side-by-side elements, gap-3 */}
      <div className="flex items-center gap-3">
        {/* SQ Prefix Badge */}
        <div className="w-12 sm:w-14 h-14 rounded-well bg-bg-elevated border border-border-subtle flex items-center justify-center text-accent font-semibold text-base tracking-wider shadow-sm shrink-0 select-none">
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
            className={`w-full h-14 px-4 rounded-well bg-bg-elevated text-text-primary placeholder:text-text-tertiary text-lg tracking-[0.3em] font-medium focus:outline-none transition-all ${
              error
                ? 'border border-[rgba(196,91,91,0.6)] focus:ring-1 focus:ring-danger'
                : isValid && value.length > 0
                ? 'border border-border-subtle focus:border-accent focus:ring-1 focus:ring-accent/40'
                : 'border border-border-subtle focus:border-accent/80'
            }`}
          />
          {isChecking && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Error / Validation helper */}
      {error && (
        <p className="text-[0.75rem] text-danger mt-1.5 ml-1 animate-fade-in font-medium">
          {error}
        </p>
      )}
    </div>
  );
};
