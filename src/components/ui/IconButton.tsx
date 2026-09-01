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

/**
 * Global circular IconButton primitive.
 * Perfectly round (border-radius: 9999px), equal 34px visual diameter with >= 44px hit target.
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  className,
  size = 'md',
  type = 'button',
  children,
  ...props
}) => {
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
        'group relative inline-flex items-center justify-center rounded-full w-[44px] h-[44px] min-w-[44px] min-h-[44px] p-0 select-none transition-all active:scale-95 shrink-0 outline-none',
        className
      )}
      {...props}
    >
      {/* 34px Visual Circle container */}
      <div className="w-[34px] h-[34px] min-w-[34px] min-h-[34px] rounded-full bg-ink-900/80 dark:bg-ink-900/70 backdrop-blur-md border border-gold-dim flex items-center justify-center group-hover:border-gold-400/50 group-hover:bg-ink-850/90 shadow-sm transition-all aspect-square">
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
}> = ({ to, onClick, label = 'Back', className }) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick();
      return;
    }
    // Router-level back with fallback guard
    if (window.history.length > 1) {
      navigate(-1);
    } else if (to) {
      navigate(to);
    } else {
      navigate('/');
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
