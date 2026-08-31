import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface InlineDropdownOption<T extends string = string> {
  id: T;
  label: string;
  shortLabel?: string;
  description?: string;
}

export interface InlineDropdownDimension<T extends string = string> {
  id: string;
  label: string;
  value: T;
  options: InlineDropdownOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

export interface InlineDropdownGroupProps {
  dimensions: InlineDropdownDimension[];
  className?: string;
  activeDropdownId?: string | null;
  onActiveDropdownChange?: (id: string | null) => void;
}

/**
 * Native Inline Push-Down Dropdown System.
 * Renders a compact horizontal row of triggers; tapping any trigger smoothly expands
 * an options panel inline directly below the trigger row (pushing subsequent content down).
 */
export const InlineDropdownGroup: React.FC<InlineDropdownGroupProps> = ({
  dimensions,
  className,
  activeDropdownId: controlledActiveId,
  onActiveDropdownChange: controlledOnChange,
}) => {
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const isControlled = controlledActiveId !== undefined;
  const activeId = isControlled ? controlledActiveId : internalActiveId;

  const setActiveId = (id: string | null) => {
    if (isControlled && controlledOnChange) {
      controlledOnChange(id);
    } else {
      setInternalActiveId(id);
    }
  };

  const handleToggle = (dimId: string) => {
    setActiveId(activeId === dimId ? null : dimId);
  };

  const activeDimension = dimensions.find((d) => d.id === activeId);

  // Filter dimensions with at least 2 options (or explicitly shown)
  const visibleDimensions = dimensions.filter((d) => d.options.length >= 2);

  if (visibleDimensions.length === 0) return null;

  return (
    <div className={cn('w-full flex flex-col select-none', className)}>
      {/* Trigger Row */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full max-w-md mx-auto">
        {visibleDimensions.map((dim) => {
          const isOpen = activeId === dim.id;
          const currentOption =
            dim.options.find((opt) => opt.id === dim.value) || dim.options[0];
          const displayLabel =
            currentOption?.shortLabel || currentOption?.label || dim.label;

          return (
            <button
              key={dim.id}
              type="button"
              onClick={() => handleToggle(dim.id)}
              aria-expanded={isOpen}
              className={cn(
                'flex-1 min-w-0 h-7 sm:h-7.5 px-2.5 rounded-full border text-[0.7rem] sm:text-xs font-medium flex items-center justify-between gap-1.5 transition-all outline-none active:scale-[0.98]',
                isOpen
                  ? 'bg-ink-800 border-gold-400/40 text-gold-300 shadow-sm'
                  : 'bg-ink-850/60 hover:bg-ink-800 text-mist-300 hover:text-ivory-100 border-gold-400/15'
              )}
            >
              <span className="truncate font-sans tracking-tight">
                {displayLabel}
              </span>
              <ChevronDown
                className={cn(
                  'w-3 h-3 text-gold-400/80 shrink-0 transition-transform duration-200',
                  isOpen && 'rotate-180 text-gold-300'
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Inline Push-Down Expansion Panel */}
      <AnimatePresence initial={false}>
        {activeDimension && (
          <motion.div
            key={activeDimension.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: 'auto',
              opacity: 1,
              transition: {
                height: { duration: shouldReduceMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.15 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: shouldReduceMotion ? 0 : 0.15, ease: [0.4, 0, 1, 1] },
                opacity: { duration: 0.1 },
              },
            }}
            className="overflow-hidden w-full max-w-md mx-auto"
          >
            <div className="pt-2 pb-1">
              <div className="p-2 sm:p-2.5 rounded-xl bg-ink-850/90 border border-gold-400/20 shadow-inner flex flex-col gap-1 text-left">
                <div className="px-1.5 py-0.5 flex items-center justify-between">
                  <span className="text-[10px] font-ui uppercase tracking-[0.2em] text-gold-400/80 font-semibold">
                    {activeDimension.label}
                  </span>
                </div>

                <div className="flex flex-col gap-1 mt-0.5">
                  {activeDimension.options.map((opt) => {
                    const isSelected = activeDimension.value === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          activeDimension.onChange(opt.id);
                          setActiveId(null);
                        }}
                        className={cn(
                          'flex items-center justify-between px-2.5 py-1.5 sm:py-2 rounded-lg text-xs transition-all text-left group',
                          isSelected
                            ? 'bg-ink-800 border border-gold-400/35 text-gold-300 font-medium shadow-sm'
                            : 'hover:bg-ink-800/60 text-mist-300 hover:text-ivory-100 border border-transparent'
                        )}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="truncate leading-tight">{opt.label}</span>
                          {opt.description && (
                            <span className="text-[10px] text-mist-400 font-ui truncate mt-0.5">
                              {opt.description}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
