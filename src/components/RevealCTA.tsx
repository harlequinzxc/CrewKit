import React, { isValidElement } from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface RevealCTAProps {
  label: string;
  icon?: LucideIcon | React.ReactNode;
  summary?: string;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
}

export const RevealCTA: React.FC<RevealCTAProps> = ({
  label,
  icon,
  summary,
  onPress,
  disabled = false,
  className = '',
}) => {
  const renderIcon = () => {
    if (!icon) return null;
    if (isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as React.ElementType;
    return <IconComponent className="w-4 h-4 text-onyx-900" strokeWidth={2} />;
  };

  return (
    <div className={`shrink-0 flex flex-col items-center select-none animate-cabin-in ${className}`}>
      {/* Centered Gold Pill Button with Soft Outer Glow & Onyx Text */}
      <motion.button
        type="button"
        disabled={disabled}
        onClick={onPress}
        whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -1 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        style={{
          boxShadow: '0 0 32px rgba(201, 168, 76, 0.2)',
        }}
        className="gold-pill-button flex items-center justify-center gap-2 px-8 py-3.5 min-w-[220px] text-sm font-sans font-medium tracking-normal text-onyx-900 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-ink-950"
      >
        <span>{label}</span>
        {renderIcon()}
      </motion.button>

      {/* Summary line */}
      {summary && (
        <p className="font-sans italic text-mist-400 text-[0.7rem] mt-2.5 tracking-normal text-center">
          {summary}
        </p>
      )}
    </div>
  );
};
