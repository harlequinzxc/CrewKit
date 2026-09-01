import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export interface PulseCTAProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: () => void;
  className?: string;
  label?: string;
}

export const PulseCTA: React.FC<PulseCTAProps> = ({
  onClick,
  className,
  label: customLabel,
  disabled,
  ...props
}) => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkPointer = () => {
      const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      setIsTouch(!isFinePointer);
    };

    checkPointer();
    window.addEventListener('resize', checkPointer);
    return () => window.removeEventListener('resize', checkPointer);
  }, []);

  const defaultLabel = isTouch ? 'Tap to begin' : 'Click to begin';
  const labelText = customLabel || defaultLabel;

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-4 rounded-full font-sans font-semibold text-xs sm:text-sm uppercase tracking-wider text-onyx-900 bg-gradient-to-r from-gold-100 via-gold-300 to-gold-500 cursor-pointer outline-none select-none transition-all pulse-breathing-halo',
        disabled && 'opacity-40 cursor-not-allowed hover:scale-100 shadow-none',
        className
      )}
      {...(props as any)}
    >
      <span>{labelText}</span>
      <ArrowRight className="w-4 h-4 text-onyx-900 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.2} />
    </motion.button>
  );
};
