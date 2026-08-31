import React from 'react';
import { cn } from '../../lib/utils';
import { ArrowLeft, Menu, X, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon | React.ReactNode;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  className,
  size = 'md',
  type = 'button',
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-[44px] h-[44px] p-2.5', // 44px touch target
    lg: 'w-12 h-12 p-3',
  }[size];

  const renderIcon = () => {
    if (children) return children;
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="w-[18px] h-[18px] text-mist-300 group-hover:text-gold-300 transition-colors" />;
  };

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'group relative inline-flex items-center justify-center rounded-full select-none transition-all active:scale-95 shrink-0',
        sizeStyles,
        className
      )}
      {...props}
    >
      {/* 34px Visual Circle container */}
      <div className="w-[34px] h-[34px] rounded-full bg-ink-900/70 dark:bg-ink-900/60 backdrop-blur-md border border-gold-dim flex items-center justify-center group-hover:border-gold-400/50 group-hover:bg-ink-850/80 shadow-sm transition-all">
        {renderIcon()}
      </div>
    </button>
  );
};

export const BackButton: React.FC<{
  to?: string;
  onClick?: () => void;
  label?: string;
  className?: string;
}> = ({ to, onClick, label = 'Back to Home', className }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <IconButton
      icon={ArrowLeft}
      label={label}
      onClick={handleClick}
      className={className}
    />
  );
};

export const MenuButton: React.FC<{
  onClick?: () => void;
  label?: string;
  className?: string;
}> = ({ onClick, label = 'Open Menu', className }) => {
  return (
    <IconButton
      icon={Menu}
      label={label}
      onClick={onClick}
      className={className}
    />
  );
};

export const CloseButton: React.FC<{
  onClick?: () => void;
  label?: string;
  className?: string;
}> = ({ onClick, label = 'Close', className }) => {
  return (
    <IconButton
      icon={X}
      label={label}
      onClick={onClick}
      className={className}
    />
  );
};
