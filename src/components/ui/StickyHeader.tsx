import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface StickyHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  withFade?: boolean;
}

/**
 * Shared sticky header container congruent with the page background family (--bg-base).
 * Features subtle blur elevation and a 24px bottom dissolve gradient with no hard 1px bottom border.
 */
export const StickyHeader = forwardRef<HTMLDivElement, StickyHeaderProps>(
  ({ children, className, withFade = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'sticky top-0 z-30 bg-ink-950/95 backdrop-blur-md pt-1 pb-2 transition-colors',
          className
        )}
        {...props}
      >
        {children}
        {withFade && (
          <div
            className="absolute left-0 right-0 -bottom-6 h-6 pointer-events-none z-10"
            style={{
              background:
                'linear-gradient(to bottom, rgb(var(--ink-950-rgb) / 0.95), transparent)',
            }}
          />
        )}
      </div>
    );
  }
);

StickyHeader.displayName = 'StickyHeader';
