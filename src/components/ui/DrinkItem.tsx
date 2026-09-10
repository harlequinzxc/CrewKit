import React, { useState, useRef, useLayoutEffect } from 'react';
import { MenuItem } from '../../lib/sq/types';
import { Heading, Text } from './index';
import { cn } from '../../lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

export interface DrinkItemProps {
  item: MenuItem;
  isFirstItem?: boolean;
  className?: string;
}

/**
 * CrewKit Drink Item Primitive — implements the two presentation modes (Density Ladder):
 * - Mode A (Compact List Row): for catalogue lines without descriptions (spirits, beers, soft drinks, juices, waters)
 *     Editorial list row with small gold disc marker, single line heading, minimal vertical padding.
 * - Mode B (Rich Text Block): for items with tasting notes and long descriptions (wines, champagnes, specialty drinks)
 *     Soft surface card with rounded-well radius, quiet subtle border, title on top, clamped description with inline expand/collapse.
 * - In BOTH modes: NO PER-ITEM FAMILY PILLS.
 */
export const DrinkItem: React.FC<DrinkItemProps> = ({
  item,
  isFirstItem = false,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  const cleanDescription = item.description?.trim() || '';
  const hasBody = cleanDescription.length > 0;

  // Responsive overflow measurement using ResizeObserver
  useLayoutEffect(() => {
    if (!hasBody) return;
    const el = textRef.current;
    if (!el) return;

    const checkOverflow = () => {
      if (!el) return;
      const computedStyle = window.getComputedStyle(el);
      const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
      const twoLineMax = lineHeight * 2 + 3;

      const isClampedOverflow = el.scrollHeight > el.clientHeight + 1;
      const isMultiLineOverflow = el.scrollHeight > twoLineMax;

      setIsOverflowing(isClampedOverflow || isMultiLineOverflow);
    };

    checkOverflow();

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(checkOverflow);
    }

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    resizeObserver.observe(el);
    window.addEventListener('resize', checkOverflow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [cleanDescription, hasBody]);

  // Check user preference for reduced motion
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // MODE A — Compact List Row (Catalogue lines without descriptions)
  if (!hasBody) {
    return (
      <div
        {...(isFirstItem ? { id: 'menu-first-item' } : {})}
        className={cn(
          'py-2.5 sm:py-3 flex items-start gap-3 w-full text-left select-none',
          className
        )}
      >
        {/* Small gold disc marker (6px) vertically aligned with text */}
        <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0 mt-2 shadow-[0_0_8px_rgba(201,168,76,0.3)]" />

        {/* Text block: Title + optional Footnote */}
        <div className="flex-1 flex flex-col min-w-0">
          <Heading
            variant="subsection"
            as="h4"
            className="text-base sm:text-[0.95rem] font-medium font-sans text-ivory-100 leading-snug tracking-normal line-clamp-2"
          >
            {item.title}
          </Heading>

          {item.footnote && (
            <Text
              variant="secondary"
              className="text-[0.75rem] text-mist-400 mt-0.5 italic leading-relaxed"
            >
              {item.footnote}
            </Text>
          )}
        </div>
      </div>
    );
  }

  // MODE B — Rich Text Block (Items with tasting notes and descriptions)
  return (
    <div
      {...(isFirstItem ? { id: 'menu-first-item' } : {})}
      className={cn(
        'rounded-well bg-ink-900/70 border border-gold-dim p-4 sm:p-5 flex flex-col justify-between text-left shadow-[0_4px_16px_rgba(0,0,0,0.2)] select-none transition-colors duration-200',
        className
      )}
    >
      <div className="flex flex-col">
        {/* Title */}
        <Heading
          variant="subsection"
          as="h4"
          className="text-base sm:text-[1.02rem] font-medium font-sans text-ivory-100 leading-snug tracking-normal line-clamp-2"
        >
          {item.title}
        </Heading>

        {/* Optional Footnote / Meta */}
        {item.footnote && (
          <Text
            variant="secondary"
            className="text-[0.75rem] text-gold-300/80 font-ui uppercase tracking-wider font-medium mt-1 leading-normal"
          >
            {item.footnote}
          </Text>
        )}

        {/* Description with Clamp & Inline Height Animation */}
        <div className="mt-2 text-left">
          <motion.div
            layout
            transition={{
              duration: prefersReduced ? 0 : isExpanded ? 0.2 : 0.18,
              ease: isExpanded ? [0.16, 1, 0.3, 1] : [0.4, 0, 0.2, 1],
            }}
            className="overflow-hidden"
          >
            <p
              ref={textRef}
              className={cn(
                'text-xs sm:text-[0.85rem] text-mist-300 leading-relaxed font-sans text-left',
                !isExpanded && 'line-clamp-2',
                isExpanded ? 'whitespace-pre-line' : ''
              )}
            >
              {cleanDescription}
            </p>
          </motion.div>

          {isOverflowing && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((prev) => !prev);
              }}
              className="mt-2 text-[0.75rem] sm:text-xs text-gold-400/90 hover:text-gold-300 font-ui font-medium inline-flex items-center gap-1 transition-colors py-0.5 outline-none active:scale-95"
              aria-expanded={isExpanded}
            >
              <span>{isExpanded ? 'Less' : 'More'}</span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-gold-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gold-400" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
