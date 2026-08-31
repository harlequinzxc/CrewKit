import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface InlineDropdownOption<T extends string = string> {
  id: T;
  label: string; // Full label for expanded menu list (e.g. "Hanakoireki by Yoshihiro Murata")
  shortLabel?: string; // Compact label for trigger button (e.g. "Ethnic" or "Biz")
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
 * Native Overlay Inline Dropdown System.
 * Renders a compact horizontal row of triggers (12px Inter Medium, Title Case / abbreviations).
 * Tapping any trigger opens an overlay options panel hovering directly over the content below
 * without pushing down the page layout.
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

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeId) {
        setActiveId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeId]);

  const activeDimension = dimensions.find((d) => d.id === activeId);

  // Filter dimensions with at least 2 options
  const visibleDimensions = dimensions.filter((d) => d.options.length >= 2);

  if (visibleDimensions.length === 0) return null;

  return (
    <div className={cn('relative w-full max-w-md mx-auto select-none', className)}>
      {/* Trigger Row (Uniform 12px / text-[0.75rem] font, --text-primary for value, --text-secondary for chevron) */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full">
        {visibleDimensions.map((dim) => {
          const isOpen = activeId === dim.id;
          const currentOption =
            dim.options.find((opt) => opt.id === dim.value) || dim.options[0];
          // Trigger button displays shortLabel when available (e.g., "Ethnic" or "Biz")
          const displayLabel =
            currentOption?.shortLabel || currentOption?.label || dim.label;

          return (
            <button
              key={dim.id}
              type="button"
              onClick={() => handleToggle(dim.id)}
              aria-expanded={isOpen}
              className={cn(
                'flex-1 min-w-0 h-7.5 px-3 rounded-full border text-[0.75rem] font-medium font-sans flex items-center justify-between gap-1.5 transition-all outline-none active:scale-[0.98]',
                isOpen
                  ? 'bg-ink-800 border-gold-400/40 text-gold-300 shadow-sm'
                  : 'bg-ink-850/60 hover:bg-ink-800 text-ivory-100 hover:text-ivory-100 border-gold-400/15'
              )}
            >
              <span className="truncate font-sans font-medium text-[0.75rem] tracking-tight text-ivory-100">
                {displayLabel}
              </span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 text-mist-400 shrink-0 transition-transform duration-200',
                  isOpen && 'rotate-180 text-gold-300'
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Overlay Dropdown Options Panel (Floats over content without pushing layout down) */}
      <AnimatePresence>
        {activeDimension && (
          <>
            {/* Click-outside backdrop dismissal */}
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setActiveId(null)}
              aria-hidden="true"
            />

            {/* Floating popover panel */}
            <motion.div
              key={activeDimension.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute top-full left-0 right-0 mt-1.5 z-50"
            >
              <div className="p-2 sm:p-2.5 rounded-xl bg-ink-900/95 backdrop-blur-md border border-gold-400/25 shadow-cabin flex flex-col gap-1 text-left max-h-[60vh] overflow-y-auto no-scrollbar">
                <div className="px-1.5 py-0.5 flex items-center justify-between border-b border-gold-dim/40 pb-1 mb-0.5">
                  <span className="text-[10px] font-ui uppercase tracking-[0.2em] text-gold-400/90 font-semibold">
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
                          'flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-sans transition-all text-left group',
                          isSelected
                            ? 'bg-ink-800 border border-gold-400/35 text-gold-300 font-medium shadow-sm'
                            : 'hover:bg-ink-800/60 text-ivory-100 hover:text-gold-300 border border-transparent'
                        )}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          {/* List displays full descriptive label (e.g., "Hanakoireki by Yoshihiro Murata") */}
                          <span className="truncate leading-snug font-medium text-[0.8rem] text-ivory-100 group-hover:text-gold-300">
                            {opt.label}
                          </span>
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
