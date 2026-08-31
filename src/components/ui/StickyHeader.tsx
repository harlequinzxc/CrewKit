import React from 'react';
import { cn } from '../../lib/utils';

export interface StickyHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  withFade?: boolean;
}

/**
 * Shared sticky header container congruent with the page background family.
 * Features subtle blur elevation, hairline border, and bottom dissolve gradient.
 */
export const StickyHeader: React.FC<StickyHeaderProps> = ({
  children,
  className,
  withFade = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        'sticky top-0 z-20 bg-ink-950/85 backdrop-blur-md border-b border-gold-400/[0.08] pt-2 pb-2.5 transition-colors',
        className
      )}
      {...props}
    >
      {children}
      {withFade && (
        <div
          className="absolute left-0 right-0 -bottom-5 h-5 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgb(var(--ink-950-rgb) / 0.85), transparent)',
          }}
        />
      )}
    </div>
  );
};
