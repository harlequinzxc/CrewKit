import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';

interface DepartureBlockProps {
  onDateSelect: (dateISO: string, formattedDisplay: string) => void;
  selectedDateISO?: string;
  className?: string;
}

// Helpers for formatted date representations
function getTodayISO(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getTomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getMaxDateISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 42); // 6 weeks
  return d.toISOString().split('T')[0];
}

function formatDateDisplay(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const DepartureBlock: React.FC<DepartureBlockProps> = ({
  onDateSelect,
  selectedDateISO,
  className = '',
}) => {
  const todayISO = getTodayISO();
  const tomorrowISO = getTomorrowISO();
  const maxDateISO = getMaxDateISO();

  const [activePreset, setActivePreset] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(todayISO);

  useEffect(() => {
    if (selectedDateISO) {
      if (selectedDateISO === todayISO) {
        setActivePreset('today');
      } else if (selectedDateISO === tomorrowISO) {
        setActivePreset('tomorrow');
      } else {
        setActivePreset('custom');
        setCustomDate(selectedDateISO);
      }
    } else {
      // default today
      onDateSelect(todayISO, formatDateDisplay(todayISO));
    }
  }, []);

  const handleSelectToday = () => {
    setActivePreset('today');
    onDateSelect(todayISO, formatDateDisplay(todayISO));
  };

  const handleSelectTomorrow = () => {
    setActivePreset('tomorrow');
    onDateSelect(tomorrowISO, formatDateDisplay(tomorrowISO));
  };

  const handleCustomDateChange = (val: string) => {
    setCustomDate(val);
    onDateSelect(val, formatDateDisplay(val));
  };

  return (
    <div className={`w-full text-left transition-all duration-400 animate-fade-in ${className}`}>
      {/* Overline Label */}
      <label className="block text-[0.7rem] font-medium tracking-[0.2em] uppercase text-text-secondary mb-2.5 select-none">
        Departure
      </label>

      {/* Mode 1: 3-Pill Row (Today / Tomorrow / Pick date) */}
      {activePreset !== 'custom' ? (
        <div className="flex items-center gap-2 select-none">
          {/* Today Pill */}
          <button
            type="button"
            onClick={handleSelectToday}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
              activePreset === 'today'
                ? 'bg-accent text-[#0B1E3E] font-semibold shadow-gold-glow'
                : 'bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-subtle'
            }`}
          >
            Today
          </button>

          {/* Tomorrow Pill */}
          <button
            type="button"
            onClick={handleSelectTomorrow}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
              activePreset === 'tomorrow'
                ? 'bg-accent text-[#0B1E3E] font-semibold shadow-gold-glow'
                : 'bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-subtle'
            }`}
          >
            Tomorrow
          </button>

          {/* Pick date button */}
          <button
            type="button"
            onClick={() => {
              setActivePreset('custom');
              onDateSelect(customDate, formatDateDisplay(customDate));
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-bg-elevated text-text-secondary hover:text-accent border border-border-subtle transition-all duration-200"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Pick date</span>
          </button>
        </div>
      ) : (
        /* Mode 2: Custom Date Picker Input with back link */
        <div className="flex items-center gap-2 animate-fade-in">
          <button
            type="button"
            onClick={() => {
              handleSelectToday();
            }}
            className="w-10 h-10 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-secondary hover:text-accent shrink-0 active:scale-95 transition-all"
            aria-label="Back to quick presets"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 relative">
            <input
              type="date"
              min={todayISO}
              max={maxDateISO}
              value={customDate}
              onChange={(e) => handleCustomDateChange(e.target.value)}
              className="w-full h-11 px-3.5 rounded-well bg-bg-elevated border border-border-subtle text-text-primary text-xs font-mono focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/40"
            />
          </div>
        </div>
      )}
    </div>
  );
};
