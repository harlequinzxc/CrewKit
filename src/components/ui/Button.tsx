import React from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: LucideIcon | React.ReactNode;
  rightIcon?: LucideIcon | React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  type = 'button',
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-4 py-2 text-xs gap-1.5',
    md: 'px-8 py-3.5 text-xs sm:text-sm gap-2',
    lg: 'px-10 py-4 text-sm sm:text-base gap-2.5',
  }[size];

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-gold-100 via-gold-300 to-gold-500 text-onyx-900 font-sans font-semibold tracking-wider uppercase rounded-full shadow-[0_0_32px_rgba(201,168,76,0.2)] hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
    ghost:
      'bg-transparent border border-gold-dim hover:border-gold-400/50 hover:bg-ink-850/70 text-ivory-100 font-sans font-medium uppercase tracking-wider rounded-full transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed',
    secondary:
      'bg-ink-850 border border-gold-dim hover:border-gold-400/40 text-ivory-100 font-sans font-medium tracking-wider rounded-full transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed',
  }[variant];

  const renderIcon = (icon: LucideIcon | React.ReactNode) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="w-4 h-4 shrink-0" />;
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center select-none text-center',
        sizeStyles,
        variantStyles,
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {leftIcon && renderIcon(leftIcon)}
      <span>{children}</span>
      {rightIcon && renderIcon(rightIcon)}
    </button>
  );
};
