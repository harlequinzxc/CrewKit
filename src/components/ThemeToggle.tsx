import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ showLabel = true }) => {
  const { theme, setTheme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      onClick={toggleTheme}
      className="flex items-center justify-between w-full p-4 rounded-card bg-bg-surface border border-border-subtle cursor-pointer hover:border-border-hover transition-all"
    >
      {showLabel && (
        <div className="flex flex-col select-none pr-3">
          <span className="font-sans font-semibold text-sm sm:text-base text-text-primary">
            Dark Mode
          </span>
          <span className="text-xs text-text-secondary mt-0.5">
            Quiet luxury deep navy palette
          </span>
        </div>
      )}

      {/* Segmented / Switch Pill */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center p-1 bg-bg-elevated border border-border-subtle rounded-full relative shrink-0"
      >
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            isDark
              ? 'bg-accent text-[#0B1E3E] font-semibold shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          aria-label="Select dark mode"
        >
          <Moon className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Dark</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            !isDark
              ? 'bg-accent text-[#0B1E3E] font-semibold shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          aria-label="Select light mode"
        >
          <Sun className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Light</span>
        </button>
      </div>
    </div>
  );
};
