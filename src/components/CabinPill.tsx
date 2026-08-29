import React from 'react';
import { Crown, Star, Martini, Wine, Leaf, LucideIcon } from 'lucide-react';
import { CabinCode } from '../lib/sq/types';

interface CabinPillProps {
  code: CabinCode;
  isSelected: boolean;
  onToggle: (code: CabinCode) => void;
  hasAnySelection?: boolean;
  delayIndex?: number;
}

const CABIN_INFO: Record<CabinCode, { label: string; icon: LucideIcon }> = {
  SUITES: { label: 'Suites', icon: Crown },
  FIRST: { label: 'First', icon: Star },
  BUSINESS: { label: 'Business', icon: Martini },
  PREMIUM_ECONOMY: { label: 'Prem Econ', icon: Wine },
  ECONOMY: { label: 'Economy', icon: Leaf },
};

export const CabinPill: React.FC<CabinPillProps> = ({
  code,
  isSelected,
  onToggle,
  hasAnySelection = false,
  delayIndex = 0,
}) => {
  const info = CABIN_INFO[code] || { label: code, icon: Star };
  const Icon = info.icon;

  return (
    <button
      type="button"
      onClick={() => onToggle(code)}
      style={{
        animationDelay: `${delayIndex * 50}ms`,
      }}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-300 select-none ${
        isSelected
          ? 'bg-accent text-[#0B1E3E] font-semibold shadow-gold-glow scale-105 opacity-100 ring-2 ring-accent/30'
          : hasAnySelection
          ? 'bg-bg-elevated text-text-secondary border border-border-subtle opacity-40 hover:opacity-80'
          : 'bg-bg-elevated text-text-secondary border border-border-subtle hover:border-accent hover:text-text-primary'
      }`}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
      <span>{info.label}</span>
    </button>
  );
};
