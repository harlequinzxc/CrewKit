import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface InlineDropdownOption<T extends string = string> {
  id: T;
  label: string; // Full label for expanded menu list (e.g. "Hanakoireki by Yoshihiro Murata" or "Business")
  shortLabel?: string; // Compact fallback label for trigger button (e.g. "Ethnic" or "Biz")
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
 * Text measurement helper for smart label fitting.
 */
let measureCanvas: HTMLCanvasElement | null = null;
function measureTextWidth(text: string, font: string = '500 11.5px Inter, system-ui, sans-serif'): number {
  if (typeof document === 'undefined') return text.length * 7;
  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas');
  }
  const ctx = measureCanvas.getContext('2d');
  if (!ctx) return text.length * 7;
  ctx.font = font;
  return ctx.measureText(text).width;
}

/**
 * Individual smart trigger button that evaluates if full label fits without overflow.
 */
interface TriggerButtonProps {
  dim: InlineDropdownDimension;
  isOpen: boolean;
  onToggle: (id: string) => void;
}

const TriggerButton: React.FC<TriggerButtonProps> = ({ dim, isOpen, onToggle }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [useFullLabel, setUseFullLabel] = useState<boolean>(true);

  const currentOption =
    dim.options.find((opt) => opt.id === dim.value) || dim.options[0];

  const fullLabel = currentOption?.label || dim.label;
  const shortLabel = currentOption?.shortLabel || fullLabel;

  // Smart fit evaluation for Cabin dimension
  useLayoutEffect(() => {
    if (dim.id !== 'cabin') {
      // For menu-type and others, respect shortLabel ("Ethnic" / "Route")
      setUseFullLabel(false);
      return;
    }

    const checkFit = () => {
      if (!buttonRef.current) return;
      const width = buttonRef.current.clientWidth;
      if (width <= 0) return;

      // Available space inside button: width - (padding 24px + chevron 14px + gap 6px + safety margin 4px)
      const availableTextSpace = width - 48;
      const fullTextWidth = measureTextWidth(fullLabel, '500 11.5px Inter, system-ui, sans-serif');

      setUseFullLabel(fullTextWidth <= availableTextSpace);
    };

    checkFit();

    const resizeObserver = new ResizeObserver(() => {
      checkFit();
    });

    if (buttonRef.current) {
      resizeObserver.observe(buttonRef.current);
    }

    window.addEventListener('resize', checkFit);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkFit);
    };
  }, [dim.id, dim.value, fullLabel]);

  const displayLabel =
    dim.id === 'cabin'
      ? (useFullLabel ? fullLabel : shortLabel)
      : shortLabel;

  return (
    <button
      ref={buttonRef}
      key={dim.id}
      type="button"
      onClick={() => onToggle(dim.id)}
      aria-expanded={isOpen}
      className={cn(
        'flex-1 min-w-0 h-[34px] px-3 rounded-full border text-[0.7rem] sm:text-[0.72rem] font-medium font-sans flex items-center justify-between gap-1.5 transition-all outline-none active:scale-[0.98]',
        isOpen
          ? 'bg-ink-800 border-gold-400/40 text-gold-300 shadow-sm'
          : 'bg-ink-850/60 hover:bg-ink-800 text-ivory-100 hover:text-ivory-100 border-gold-400/15'
      )}
    >
      <span className="truncate font-sans font-medium text-[0.7rem] sm:text-[0.72rem] tracking-tight text-ivory-100">
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
};

/**
 * Native Push-Down Inline Dropdown System.
 * Renders a compact horizontal row of triggers (Inter Medium, Title Case / abbreviations).
 * Tapping any trigger expands an accordion options panel that smoothly pushes down
 * everything below it (category pills, tabs, and main menu content).
 */
export const InlineDropdownGroup: React.FC<InlineDropdownGroupProps> = ({
  dimensions,
  className,
  activeDropdownId: controlledActiveId,
  onActiveDropdownChange: controlledOnChange,
}) => {
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);

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
    <div className={cn('relative w-full select-none', className)}>
      {/* Trigger Row (Uniform text-[0.7rem] sm:text-[0.72rem] font, --text-primary for value, --text-secondary for chevron) */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full">
        {visibleDimensions.map((dim) => (
          <TriggerButton
            key={dim.id}
            dim={dim}
            isOpen={activeId === dim.id}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {/* Push-Down Accordion Panel (Smoothly expands and pushes down content below) */}
      <AnimatePresence>
        {activeDimension && (
          <motion.div
            key={activeDimension.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden w-full mt-2"
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
        )}
      </AnimatePresence>
    </div>
  );
};
