import React from 'react';

interface FlightChipProps {
  label: string;
  onClick?: () => void;
  className?: string;
}

export const FlightChip: React.FC<FlightChipProps> = ({
  label,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-ink-850/80 backdrop-blur-md border border-gold-dim text-[0.72rem] font-ui uppercase tracking-eyebrow text-gold-300 shadow-sm select-none transition-all ${
        onClick ? 'cursor-pointer hover:border-gold-400 hover:text-gold-100 active:scale-95' : ''
      } ${className}`}
    >
      <span>{label}</span>
    </div>
  );
};
