import React from 'react';
import { Crown, Star, Martini, Wine, Leaf, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
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
  FIRST: { label: 'First Class', icon: Star },
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
    <motion.button
      type="button"
      onClick={() => onToggle(code)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: delayIndex * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.96 }}
      className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-ui uppercase tracking-wider font-semibold transition-all select-none ${
        isSelected
          ? 'bg-gold-400 text-onyx-900 shadow-gold-glow ring-2 ring-gold-400/30'
          : hasAnySelection
          ? 'bg-ink-850 text-mist-300 border border-gold-dim opacity-50 hover:opacity-90'
          : 'bg-ink-850 text-mist-300 border border-gold-dim hover:border-gold-400 hover:text-ivory-100'
      }`}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
      <span>{info.label}</span>
    </motion.button>
  );
};
