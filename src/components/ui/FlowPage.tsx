import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ProgressBar } from './ProgressBar';
import { BackButton } from './IconButton';
import { Starfield } from '../Starfield';
import { cn } from '../../lib/utils';

export interface FlowPageProps {
  currentPage: 0 | 1 | 2 | 3 | 4;
  direction?: 'forward' | 'backward';
  onBack?: () => void;
  showBackButton?: boolean;
  hideProgress?: boolean;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export const FlowPage: React.FC<FlowPageProps> = ({
  currentPage,
  direction = 'forward',
  onBack,
  showBackButton = true,
  hideProgress = false,
  children,
  className,
  containerClassName = 'max-w-md w-full',
}) => {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isForward = direction === 'forward';

  const pageVariants: Variants = {
    initial: {
      opacity: 0,
      x: prefersReduced ? 0 : isForward ? 48 : -48,
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: prefersReduced ? 0.2 : 0.38,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
    exit: {
      opacity: 0,
      x: prefersReduced ? 0 : isForward ? -48 : 48,
      transition: {
        duration: prefersReduced ? 0.15 : 0.28,
        ease: [0.4, 0, 1, 1] as [number, number, number, number],
      },
    },
  };

  const shouldShowBack = showBackButton && currentPage > 0 && Boolean(onBack);

  return (
    <div className="h-screen h-[100dvh] w-screen overflow-hidden flex flex-col bg-ink-950 text-ivory-100 cabin-atmosphere select-none relative">
      {/* Dynamic Starfield / Atmospheric Motes */}
      <Starfield />

      {/* 3px Top Progress Bar */}
      {!hideProgress && <ProgressBar currentPage={currentPage} />}

      {/* Top Navigation Bar: Back button only, no hamburger */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-4 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          {shouldShowBack && <BackButton onClick={onBack} label="Back to previous question" />}
        </div>
      </header>

      {/* Main Centered Content Shell with Animated Transitions */}
      <main className="flex-1 w-full h-full flex flex-col items-center justify-center relative z-10 px-4 sm:px-6 pt-[max(4rem,calc(env(safe-area-inset-top)+3.5rem))] pb-[max(1.5rem,env(safe-area-inset-bottom))] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'w-full mx-auto flex flex-col items-center justify-center text-center my-auto',
              containerClassName,
              className
            )}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
