import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button, Text } from './ui';
import { cn } from '../lib/utils';

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
  return (
    <div className={cn('shrink-0 flex flex-col items-center select-none animate-cabin-in', className)}>
      <Button
        variant="primary"
        size="md"
        disabled={disabled}
        onClick={onPress}
        rightIcon={icon}
        className="min-w-[220px]"
      >
        {label}
      </Button>

      {summary && (
        <Text variant="tertiary" className="italic text-mist-400 text-[0.72rem] mt-2.5 text-center">
          {summary}
        </Text>
      )}
    </div>
  );
};
