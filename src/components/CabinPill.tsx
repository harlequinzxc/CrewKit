import React from 'react';
import { Crown, Star, Martini, Wine, Leaf, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { CabinCode } from '../lib/sq/types';
import { Pill } from './ui';

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
  delayIndex = 0,
}) => {
  const info = CABIN_INFO[code] || { label: code, icon: Star };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: delayIndex * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="inline-block"
    >
      <Pill
        active={isSelected}
        icon={info.icon}
        onClick={() => onToggle(code)}
        className="px-4 py-2.5"
      >
        {info.label}
      </Pill>
    </motion.div>
  );
};
