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
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bg-elevated border border-border-subtle text-[0.75rem] font-mono tracking-wide text-accent shadow-sm select-none transition-all ${
        onClick ? 'cursor-pointer hover:border-accent/60 active:scale-95' : ''
      } ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
      <span>{label}</span>
    </div>
  );
};
