import React, { isValidElement } from 'react';
import { LucideIcon } from 'lucide-react';

interface RevealCTAProps {
  label: string;
  icon?: LucideIcon | React.ReactNode;
  summary?: string;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
}

export const RevealCTA: React.FC<RevealCTAProps> = ({
  label,
  icon,
  summary,
  onPress,
  disabled = false,
  className = '',
}) => {
  const renderIcon = () => {
    if (!icon) return null;
    if (isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as React.ElementType;
    return <IconComponent className="w-4 h-4 text-[#0B1E3E]" strokeWidth={2.2} />;
  };

  return (
    <div className={`shrink-0 flex flex-col items-center select-none animate-fade-in ${className}`}>
      {/* Centered Gold Gradient Pill Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={onPress}
        className="editorial-cta-btn flex items-center justify-center gap-2 rounded-full px-8 py-3.5 min-w-[200px] text-sm font-semibold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-base"
      >
        <span>{label}</span>
        {renderIcon()}
      </button>

      {/* Summary line */}
      {summary && (
        <p className="font-serif italic text-text-tertiary text-[0.75rem] mt-3 tracking-wide">
          {summary}
        </p>
      )}
    </div>
  );
};
