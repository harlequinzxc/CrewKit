import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

export const ThemeMorphButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isNight = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isNight ? 'Switch to Day Cabin mood' : 'Switch to Night Cabin mood'}
      title={isNight ? 'Switch to Day Cabin' : 'Switch to Night Cabin'}
      className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-ink-900/80 backdrop-blur-md border border-gold-dim hover:border-gold-400 flex items-center justify-center transition-all duration-300 active:scale-95 text-gold-300 shadow-sm ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isNight ? (
          <motion.div
            key="night-moon"
            initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center"
          >
            <Moon className="w-4 h-4 text-gold-300" strokeWidth={1.75} />
          </motion.div>
        ) : (
          <motion.div
            key="day-sun"
            initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center"
          >
            <Sun className="w-4 h-4 text-gold-400" strokeWidth={1.75} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};
