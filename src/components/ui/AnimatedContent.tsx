import React from 'react';
import { motion, AnimatePresence, useReducedMotion, Variants } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface AnimatedContentProps {
  value: string | number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable animated wrapper for cross-fading content mounts.
 * Delivers subtle luxury motion (150ms exit, 200ms enter) with reduced-motion support.
 */
export const AnimatedContent: React.FC<AnimatedContentProps> = ({
  value,
  children,
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const variants: Variants = {
    initial: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 8,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : -4,
      transition: {
        duration: 0.15,
        ease: 'easeIn',
      },
    },
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={value}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn('w-full', className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
