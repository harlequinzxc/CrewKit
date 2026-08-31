import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  layoutId = 'segmented-pill',
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  const sizeStyles = {
    sm: 'py-1 px-2.5 text-[11px] gap-1.5',
    md: 'py-1.5 px-3.5 text-xs gap-1.5',
  }[size];

  return (
    <div
      className={cn(
        'relative flex items-center p-1 rounded-full bg-ink-900/60 dark:bg-ink-900/70 backdrop-blur-md border border-gold-dim select-none max-w-full overflow-x-auto no-scrollbar',
        className
      )}
    >
      {options.map((opt) => {
        const isActive = opt.id === value;

        const renderIcon = () => {
          if (!opt.icon) return null;
          if (React.isValidElement(opt.icon)) return opt.icon;
          const IconComponent = opt.icon as LucideIcon;
          return <IconComponent className="w-3.5 h-3.5 shrink-0" />;
        };

        return (
          <button
            key={opt.id}
            type="button"
            disabled={opt.disabled}
            onClick={() => onChange(opt.id)}
            className={cn(
              'relative flex items-center justify-center flex-1 rounded-full font-ui uppercase tracking-wider font-semibold transition-colors duration-200 z-10 shrink-0',
              sizeStyles,
              isActive ? 'text-onyx-900' : 'text-mist-300 hover:text-ivory-100 disabled:opacity-30'
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-gold-400 rounded-full shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
              {renderIcon()}
              <span>{opt.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
