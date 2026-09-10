import React from 'react';
import { cn } from '../../lib/utils';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  variant?: 'hero' | 'section' | 'subsection';
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'div';
  children: React.ReactNode;
  className?: string;
}

export const HeadingHighlight: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <span
      className={cn(
        'font-display italic text-gold-300 font-normal',
        className
      )}
    >
      {children}
    </span>
  );
};

export const Heading: React.FC<HeadingProps> & {
  Highlight: typeof HeadingHighlight;
} = ({ variant = 'section', as, children, className, ...props }) => {
  const Component = as || (variant === 'hero' ? 'h1' : variant === 'section' ? 'h2' : 'h3');

  const variantStyles = {
    hero: 'font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-ivory-100 tracking-tight leading-snug [&>em]:font-display [&>em]:italic [&>em]:text-gold-300 [&>em]:not-italic',
    section: 'font-sans text-lg sm:text-xl font-semibold text-ivory-100 tracking-normal leading-snug [&>em]:font-display [&>em]:italic [&>em]:text-gold-300 [&>em]:not-italic',
    subsection: 'font-sans text-base font-medium text-ivory-100 leading-snug [&>em]:font-display [&>em]:italic [&>em]:text-gold-300 [&>em]:not-italic',
  }[variant];

  return (
    <Component className={cn(variantStyles, className)} {...props}>
      {children}
    </Component>
  );
};

Heading.Highlight = HeadingHighlight;
