import React from 'react';
import { cn } from '../../lib/utils';

export interface GoldHairlineProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * Single source of truth for CrewKit graduated gold hairline dividers.
 * Features a token-based subtle gold gradient: softer/0% at ends, fuller (50%) in the middle.
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
          'linear-gradient(to right, rgba(201,168,76,0.00) 0%, rgba(201,168,76,0.22) 12%, rgba(201,168,76,0.50) 50%, rgba(201,168,76,0.22) 88%, rgba(201,168,76,0.00) 100%)',
        height: '1px',
      }
    : {
        background:
          'linear-gradient(to bottom, rgba(201,168,76,0.00) 0%, rgba(201,168,76,0.22) 12%, rgba(201,168,76,0.50) 50%, rgba(201,168,76,0.22) 88%, rgba(201,168,76,0.00) 100%)',
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
