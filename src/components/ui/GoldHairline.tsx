import React from 'react';
import { cn } from '../../lib/utils';

export interface GoldHairlineProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'graduated' | 'centered' | 'solid';
  className?: string;
}

export const GoldHairline: React.FC<GoldHairlineProps> = ({
  variant = 'graduated',
  className,
  ...props
}) => {
  const variantStyles = {
    // Graduated: soft start, present mid-line, fading to 0 opacity on the right
    graduated:
      'h-px bg-gradient-to-r from-gold-400/20 via-gold-400/55 to-transparent',
    // Centered: fades to 0 on both ends, present in middle
    centered:
      'h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent',
    // Solid subtle hairline
    solid: 'h-px bg-gold-400/30',
  }[variant];

  return <div className={cn('w-full', variantStyles, className)} {...props} />;
};
