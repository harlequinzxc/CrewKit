import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface ChoiceCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title?: string;
  label?: string;
  description?: string;
  emoji?: string;
  icon?: LucideIcon | React.ReactNode;
  selected?: boolean;
  variant?: 'default' | 'square' | 'tool';
  children?: React.ReactNode;
  className?: string;
}

export const ChoiceCard: React.FC<ChoiceCardProps> = ({
  title,
  label,
  description,
  emoji,
  icon,
  selected = false,
  variant = 'default',
  children,
  className,
  onClick,
  disabled,
  ...props
}) => {
  const displayTitle = title || label;

  const renderIcon = () => {
    if (emoji) {
      return (
        <span className="text-3xl sm:text-4xl leading-none select-none drop-shadow-sm">
          {emoji}
        </span>
      );
    }
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="w-8 h-8 text-gold-400 shrink-0" strokeWidth={1.75} />;
  };

  const isSquare = variant === 'square';

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileHover={{ scale: disabled ? 1 : 1.015 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group relative w-full rounded-[20px] bg-ink-900/60 dark:bg-ink-900/55 backdrop-blur-md border text-left select-none transition-all duration-300 outline-none cursor-pointer',
        selected
          ? 'border-gold-400 bg-ink-850/85 shadow-[0_0_28px_rgba(201,168,76,0.22)] ring-1 ring-gold-400/40'
          : 'border-gold-dim hover:border-gold-400/40 hover:bg-ink-850/60 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
        isSquare
          ? 'aspect-square flex flex-col items-center justify-center p-6 text-center max-w-[180px] sm:max-w-[190px] mx-auto'
          : 'p-5 sm:py-6 sm:px-7 flex items-center justify-between gap-4 min-h-[76px]',
        disabled && 'opacity-40 cursor-not-allowed hover:scale-100 hover:border-gold-dim',
        className
      )}
      {...(props as any)}
    >
      {/* Top-Right Checkmark Badge when Selected */}
      {selected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 w-5 h-5 rounded-full bg-gold-400 text-onyx-900 flex items-center justify-center text-xs font-bold shadow-md z-10"
          aria-hidden="true"
        >
          ✓
        </motion.div>
      )}

      {children ? (
        children
      ) : isSquare ? (
        <div className="flex flex-col items-center justify-center gap-2">
          {renderIcon()}
          {displayTitle && (
            <span className="font-display text-4xl sm:text-5xl font-light text-ivory-100 group-hover:text-gold-300 transition-colors">
              {displayTitle}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-mist-400 font-ui tracking-wide">
              {description}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
          {renderIcon() && (
            <div className="shrink-0 flex items-center justify-center">
              {renderIcon()}
            </div>
          )}

          <div className="flex flex-col min-w-0 flex-1">
            <span
              className={cn(
                'font-display text-lg sm:text-xl font-normal leading-snug tracking-tight text-ivory-100 transition-colors',
                selected ? 'text-gold-300' : 'group-hover:text-gold-200'
              )}
            >
              {displayTitle}
            </span>
            {description && (
              <span className="text-xs sm:text-[0.82rem] text-mist-300 mt-0.5 leading-relaxed truncate font-sans">
                {description}
              </span>
            )}
          </div>
        </div>
      )}
    </motion.button>
  );
};
