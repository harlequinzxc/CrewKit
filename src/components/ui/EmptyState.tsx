import React from 'react';
import { Text } from './Text';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string;
  heading?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | React.ReactNode;
  className?: string;
}

/**
 * Standard CrewKit Empty State container for unpopulated categories/sections.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  heading,
  icon,
  className,
  ...props
}) => {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="w-8 h-8 text-mist-400 mb-3 opacity-60" />;
  };

  return (
    <div
      className={cn(
        'py-16 sm:py-20 text-center my-auto flex flex-col items-center justify-center select-none px-4',
        className
      )}
      {...props}
    >
      {renderIcon()}
      {heading && (
        <h3 className="font-display font-light text-xl sm:text-2xl text-ivory-100 mb-2">
          {heading}
        </h3>
      )}
      <Text
        variant="secondary"
        className="text-xs sm:text-sm text-mist-300 max-w-sm leading-relaxed"
      >
        {message}
      </Text>
    </div>
  );
};
