import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface TextTabOption {
  id: string;
  label: string;
  badge?: string | number;
}

export interface TextTabsProps {
  options: TextTabOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  align?: 'center' | 'left';
  layoutId?: string;
}

/**
 * Minimal underline-based text tab row.
 * Used for lightweight section switching (e.g. meal services Dinner vs Breakfast).
 */
export const TextTabs: React.FC<TextTabsProps> = ({
  options,
  value,
  onChange,
  className,
  align = 'center',
  layoutId = 'text-tabs-active-indicator',
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-5 sm:gap-7 overflow-x-auto no-scrollbar py-0.5 select-none',
        align === 'center' ? 'justify-center' : 'justify-start',
        className
      )}
      role="tablist"
    >
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={cn(
              'relative py-1 text-[0.75rem] font-sans tracking-wide transition-colors whitespace-nowrap outline-none',
              isActive
                ? 'text-gold-300 font-medium'
                : 'text-mist-400 hover:text-ivory-100 font-normal'
            )}
          >
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full bg-ink-800 text-mist-400 border border-gold-dim">
                {option.badge}
              </span>
            )}
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gold-400 rounded-full shadow-[0_0_6px_rgba(201,168,76,0.4)]"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
