import React from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

export interface PillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: LucideIcon | React.ReactNode;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const Pill: React.FC<PillProps> = ({
  active = false,
  icon,
  children,
  className,
  size = 'md',
  type = 'button',
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-3 py-1 text-[11px] gap-1.5',
    md: 'px-4 py-1.5 text-xs gap-2',
  }[size];

  const renderIcon = (ic: LucideIcon | React.ReactNode) => {
    if (!ic) return null;
    if (React.isValidElement(ic)) return ic;
    const IconComponent = ic as LucideIcon;
    return <IconComponent className={cn('w-3.5 h-3.5 shrink-0', active ? 'text-onyx-900' : 'text-gold-400')} />;
  };

  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-ui uppercase tracking-wider font-semibold transition-all select-none active:scale-95 shrink-0',
        sizeStyles,
        active
          ? 'bg-gold-400 text-onyx-900 shadow-[0_0_16px_rgba(201,168,76,0.18)]'
          : 'bg-ink-850/80 text-mist-300 hover:text-ivory-100 hover:border-gold-400/50 border border-gold-dim',
        className
      )}
      {...props}
    >
      {icon && renderIcon(icon)}
      <span>{children}</span>
    </button>
  );
};
