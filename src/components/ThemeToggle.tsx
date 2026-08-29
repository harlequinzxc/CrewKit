import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ showLabel = true }) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center justify-between w-full p-4 rounded-well bg-bg-elevated border border-border-subtle transition-all">
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-text-primary">
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </span>
          <span className="text-xs text-text-secondary mt-0.5">
            {isDark ? 'Quiet luxury deep navy palette' : 'Warm paper reading palette'}
          </span>
        </div>
      )}

      {/* Segmented / Switch Pill */}
      <div className="flex items-center p-1 bg-bg-surface border border-border-subtle rounded-full relative">
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            isDark
              ? 'bg-accent text-[#070B14] font-semibold shadow-sm'
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
              ? 'bg-accent text-[#070B14] font-semibold shadow-sm'
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
