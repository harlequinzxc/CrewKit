import React from 'react';
import { cn } from '../../lib/utils';

export interface StickyHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  withFade?: boolean;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({
  children,
  className,
  withFade = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        'sticky top-0 z-20 bg-ink-950/90 backdrop-blur-md pt-2 pb-2',
        className
      )}
      {...props}
    >
      {children}
      {withFade && (
        <div className="absolute left-0 right-0 -bottom-6 h-6 bg-gradient-to-b from-ink-950/90 to-transparent pointer-events-none" />
      )}
    </div>
  );
};
