import React from 'react';
import { cn } from '../../lib/utils';

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'body' | 'secondary' | 'tertiary' | 'overline' | 'eyebrow' | 'italic-secondary';
  as?: 'p' | 'span' | 'div' | 'label' | 'small' | 'caption';
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  as,
  children,
  className,
  htmlFor,
  ...props
}) => {
  const defaultAs =
    variant === 'overline'
      ? (htmlFor ? 'label' : 'span')
      : variant === 'eyebrow' || variant === 'italic-secondary'
      ? 'span'
      : variant === 'tertiary'
      ? 'p'
      : 'p';

  const Component = (as || defaultAs) as React.ElementType;

  const variantStyles = {
    body: 'font-sans text-[0.9rem] text-ivory-100 leading-relaxed',
    secondary: 'font-sans text-[0.85rem] text-mist-300 leading-relaxed',
    tertiary: 'font-sans text-[0.7rem] text-mist-400 leading-normal',
    overline: 'block font-sans text-[0.65rem] font-medium uppercase tracking-[0.2em] text-mist-400 select-none',
    eyebrow: 'font-display italic text-gold-300 text-base sm:text-lg tracking-wide block',
    'italic-secondary': 'font-display italic text-[0.75rem] text-mist-300 normal-case tracking-normal',
  }[variant];

  return (
    <Component
      className={cn(variantStyles, className)}
      {...(htmlFor ? { htmlFor } : {})}
      {...props}
    >
      {children}
    </Component>
  );
};
