import React from 'react';
import { cn } from '../../lib/utils';

export interface GoldHairlineProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * Single source of truth for CrewKit graduated gold hairline dividers.
 * Features a token-based subtle gold gradient: softer/0% at ends, fuller in the middle.
 * Fully theme-aware with high contrast in both dark and light modes.
 */
export const GoldHairline: React.FC<GoldHairlineProps> = ({
  direction = 'horizontal',
  className,
  style,
  ...props
}) => {
  const isHorizontal = direction === 'horizontal';

  const gradientStyle: React.CSSProperties = isHorizontal
    ? {
        background:
          'linear-gradient(to right, rgba(var(--gold-hairline-rgb), 0) 0%, rgba(var(--gold-hairline-rgb), var(--gold-hairline-opacity-side)) 12%, rgba(var(--gold-hairline-rgb), var(--gold-hairline-opacity-mid)) 50%, rgba(var(--gold-hairline-rgb), var(--gold-hairline-opacity-side)) 88%, rgba(var(--gold-hairline-rgb), 0) 100%)',
        height: '1px',
      }
    : {
        background:
          'linear-gradient(to bottom, rgba(var(--gold-hairline-rgb), 0) 0%, rgba(var(--gold-hairline-rgb), var(--gold-hairline-opacity-side)) 12%, rgba(var(--gold-hairline-rgb), var(--gold-hairline-opacity-mid)) 50%, rgba(var(--gold-hairline-rgb), var(--gold-hairline-opacity-side)) 88%, rgba(var(--gold-hairline-rgb), 0) 100%)',
        width: '1px',
      };

  return (
    <div
      role="separator"
      aria-orientation={direction}
      className={cn(
        isHorizontal
          ? 'w-full h-px shrink-0 pointer-events-none'
          : 'h-full w-px shrink-0 pointer-events-none',
        className
      )}
      style={{ ...gradientStyle, ...style }}
      {...props}
    />
  );
};
