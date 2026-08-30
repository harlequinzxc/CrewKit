import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { validateFlightDate } from '../lib/sq/validation';

interface DepartureBlockProps {
  onDateSelect: (dateISO: string, formattedDisplay: string) => void;
  selectedDateISO?: string;
  className?: string;
}

export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMaxDateISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 42); // Allows up to 6 weeks in advance
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateDisplay(iso: string): string {
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

  const [activePreset, setActivePreset] = useState<'today' | 'tomorrow' | 'custom' | null>(() => {
    if (!selectedDateISO) return null;
    if (selectedDateISO === todayISO) return 'today';
    if (selectedDateISO === tomorrowISO) return 'tomorrow';
    return 'custom';
  });

  const [customDate, setCustomDate] = useState<string>(selectedDateISO || '');
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDateISO) {
      setActivePreset(null);
      setCustomDate('');
      setDateError(null);
      return;
    }
    if (selectedDateISO === todayISO) {
      setActivePreset('today');
      setDateError(null);
    } else if (selectedDateISO === tomorrowISO) {
      setActivePreset('tomorrow');
      setDateError(null);
    } else {
      setActivePreset('custom');
      setCustomDate(selectedDateISO);
      const val = validateFlightDate(selectedDateISO);
      setDateError(val.error);
    }
  }, [selectedDateISO, todayISO, tomorrowISO]);

  const handleSelectToday = () => {
    setActivePreset('today');
    setDateError(null);
    onDateSelect(todayISO, formatDateDisplay(todayISO));
  };

  const handleSelectTomorrow = () => {
    setActivePreset('tomorrow');
    setDateError(null);
    onDateSelect(tomorrowISO, formatDateDisplay(tomorrowISO));
  };

  const handleOpenCustomPicker = () => {
    setActivePreset('custom');
    const targetDate = customDate || todayISO;
    setCustomDate(targetDate);
    const val = validateFlightDate(targetDate);
    setDateError(val.error);
    onDateSelect(targetDate, formatDateDisplay(targetDate));
  };

  const handleCustomDateChange = (val: string) => {
    setCustomDate(val);
    const valResult = validateFlightDate(val);
    if (!valResult.valid) {
      setDateError(valResult.error);
    } else {
      setDateError(null);
      onDateSelect(val, formatDateDisplay(val));
    }
  };

  return (
    <div className={`w-full text-left transition-all duration-300 animate-fade-in ${className}`}>
      {/* Overline Label (Whisper quiet) */}
      <label
        htmlFor="departure-date-picker"
        className="block text-[0.65rem] font-sans font-medium uppercase tracking-[0.2em] text-mist-400 mb-2 select-none"
      >
        DEPARTURE DATE
      </label>

      {/* Mode 1: Sliding Pill Selection */}
      {activePreset !== 'custom' ? (
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-ink-850 border border-gold-dim select-none relative">
          {/* Today Button */}
          <button
            type="button"
            onClick={handleSelectToday}
            className={`relative flex-1 py-2 rounded-full text-xs font-ui uppercase tracking-wider font-semibold transition-colors duration-200 z-10 ${
              activePreset === 'today' ? 'text-onyx-900' : 'text-mist-300 hover:text-ivory-100'
            }`}
          >
            {activePreset === 'today' && (
              <motion.div
                layoutId="departure-pill-active"
                className="absolute inset-0 bg-gold-400 rounded-full shadow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Today</span>
          </button>

          {/* Tomorrow Button */}
          <button
            type="button"
            onClick={handleSelectTomorrow}
            className={`relative flex-1 py-2 rounded-full text-xs font-ui uppercase tracking-wider font-semibold transition-colors duration-200 z-10 ${
              activePreset === 'tomorrow' ? 'text-onyx-900' : 'text-mist-300 hover:text-ivory-100'
            }`}
          >
            {activePreset === 'tomorrow' && (
              <motion.div
                layoutId="departure-pill-active"
                className="absolute inset-0 bg-gold-400 rounded-full shadow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Tomorrow</span>
          </button>

          {/* Pick Date Button */}
          <button
            type="button"
            onClick={handleOpenCustomPicker}
            className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-full text-xs font-ui uppercase tracking-wider font-semibold text-mist-300 hover:text-gold-300 transition-colors z-10"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Pick Date</span>
          </button>
        </div>
      ) : (
        /* Mode 2: Custom Date Picker Input */
        <div className="flex items-center gap-2 animate-fade-in">
          <button
            type="button"
            onClick={() => setActivePreset(null)}
            className="w-11 h-11 rounded-full bg-ink-850 border border-gold-dim flex items-center justify-center text-mist-300 hover:text-gold-300 shrink-0 active:scale-95 transition-all shadow-sm"
            aria-label="Back to quick presets"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 relative">
            <input
              id="departure-date-picker"
              type="date"
              min={todayISO}
              max={maxDateISO}
              value={customDate}
              onChange={(e) => handleCustomDateChange(e.target.value)}
              className="w-full h-11 px-4 rounded-well bg-ink-850 border border-gold-dim text-ivory-100 text-xs font-ui tracking-wide focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/40"
            />
          </div>
        </div>
      )}

      {/* Date Validation Error */}
      {dateError && (
        <div role="alert" className="text-[0.75rem] text-danger mt-1.5 ml-1 animate-fade-in font-sans font-medium">
          {dateError}
        </div>
      )}

      {/* Publication window helper */}
      <p className="font-sans text-[0.68rem] text-mist-400 mt-2 ml-0.5 select-none">
        Singapore Airlines menus are normally published up to eight days before departure.
      </p>
    </div>
  );
};
