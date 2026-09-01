import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface ProgressBarProps {
  currentPage: 0 | 1 | 2 | 3 | 4;
  className?: string;
  hidden?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentPage,
  className,
  hidden = false,
}) => {
  if (hidden || currentPage === 0) return null;

  // 0 -> 0%, 1 -> 25%, 2 -> 50%, 3 -> 75%, 4 -> 100%
  const percentage = Math.min(100, Math.max(0, currentPage * 25));

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'fixed top-0 left-0 right-0 h-[3px] w-full bg-ink-800/40 dark:bg-ink-800/30 z-50 overflow-hidden select-none',
        className
      )}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-300 shadow-[0_0_8px_rgba(217,185,120,0.5)]"
        initial={false}
        animate={{ width: `${percentage}%` }}
        transition={{
          duration: prefersReduced ? 0 : 0.35,
          ease: [0.22, 1, 0.36, 1],
        }}
      />
    </div>
  );
};
