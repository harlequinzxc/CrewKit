import React from 'react';
import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';

export interface RouteLegData {
  from: string; // Origin IATA e.g. "SIN"
  to: string; // Destination IATA e.g. "LHR"
  fromCity?: string; // Origin City e.g. "Singapore"
  toCity?: string; // Destination City e.g. "London (Heathrow)"
  depTime?: string; // Local departure time e.g. "09:00"
  arrTime?: string; // Local arrival time e.g. "15:40"
  depUtc?: string; // UTC datetime e.g. "2026-08-29 01:00:00"
  arrUtc?: string; // UTC datetime e.g. "2026-08-29 14:40:00"
  depDateLocal?: string; // e.g. "2026-08-29"
  arrDateLocal?: string; // e.g. "2026-08-29"
  arrDayShift?: number; // e.g. 0, 1, 2
  status?: string;
}

export interface RouteHeroProps {
  flightNumber: string; // e.g. "SQ 11" or "SQ11"
  flightDate: string; // ISO date string e.g. "2026-08-29"
  cabinLabel: string; // "Business Class"
  cabinShort: string; // "Business"
  leg: RouteLegData;
  legCount?: number; // multi-leg flights pass one leg at a time; legCount > 1 additionally surfaces cabinShort
  className?: string;
}

/**
 * Compute flight duration from UTC timestamp pair only.
 * Never subtract local times (they cross time zones).
 */
function computeFlightDuration(depUtc?: string, arrUtc?: string): string | null {
  if (!depUtc || !arrUtc) return null;
  try {
    const normalize = (s: string) => {
      const clean = s.trim().replace(' ', 'T');
      return clean.endsWith('Z') ? clean : `${clean}Z`;
    };
    const depMs = Date.parse(normalize(depUtc));
    const arrMs = Date.parse(normalize(arrUtc));
    if (isNaN(depMs) || isNaN(arrMs) || arrMs <= depMs) return null;
    const diffMinutes = Math.round((arrMs - depMs) / 60000);
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;
    return m > 0 ? `${h}h ${m < 10 ? '0' : ''}${m}m` : `${h}h 00m`;
  } catch {
    return null;
  }
}

/**
 * Compare calendar-date portion of local datetime strings or arrDayShift.
 */
function computeDayShift(leg: RouteLegData): number {
  if (typeof leg.arrDayShift === 'number' && leg.arrDayShift > 0) {
    return leg.arrDayShift;
  }
  if (leg.depDateLocal && leg.arrDateLocal) {
    const d1 = new Date(leg.depDateLocal).getTime();
    const d2 = new Date(leg.arrDateLocal).getTime();
    if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
      return Math.round((d2 - d1) / (24 * 3600 * 1000));
    }
  }
  return 0;
}

/**
 * Format long-form date e.g. "Saturday, 29 August 2026"
 */
function formatLongDate(iso: string): string {
  if (!iso) return '';
  try {
    const parts = iso.split('-').map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return iso;
  } catch {
    return iso;
  }
}

export const RouteHero: React.FC<RouteHeroProps> = ({
  flightNumber,
  flightDate,
  cabinLabel,
  cabinShort,
  leg,
  legCount = 1,
  className = '',
}) => {
  const duration = computeFlightDuration(leg.depUtc, leg.arrUtc);
  const dayShift = computeDayShift(leg);
  const longDate = formatLongDate(flightDate);

  // Normalize flight number string: "SQ 322" format
  const normalizedFlightNo = flightNumber.toUpperCase().startsWith('SQ')
    ? flightNumber.toUpperCase().replace(/^SQ\s*/, 'SQ ')
    : `SQ ${flightNumber.trim()}`;

  return (
    <div
      className={`rounded-3xl bg-gradient-to-b from-ink-850 to-ink-900/60 border border-gold-400/15 p-7 sm:p-9 shadow-2xl shadow-black/40 relative overflow-hidden select-none text-left ${className}`}
    >
      {/* Decorative Radial Glows (cool blue top-right, warm gold bottom-left) */}
      <div
        className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-gold-400/12 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* 1. Header Row (Centered, Hairline Gold Separators) */}
      <div className="flex items-center justify-center flex-wrap gap-2.5 pb-5 text-center text-xs font-ui relative z-10">
        <span className="uppercase tracking-eyebrow font-bold text-gold-300">
          {normalizedFlightNo}
        </span>

        <span className="w-1 h-1 rounded-full bg-gold-400/50" aria-hidden="true" />

        <span className="tracking-wide text-mist-300 font-medium">
          {longDate}
        </span>

        {legCount > 1 && (
          <>
            <span className="w-1 h-1 rounded-full bg-gold-400/50" aria-hidden="true" />
            <span className="uppercase tracking-eyebrow font-semibold text-gold-300">
              {cabinShort}
            </span>
          </>
        )}
      </div>

      {/* 2. Main Route Display (3-Column Grid [1fr_auto_1fr], Bottom-Aligned) */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 sm:gap-4 my-2 relative z-10">
        
        {/* Origin Column (Right-Aligned) */}
        <motion.div
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-end text-right min-w-0"
        >
          <span className="font-display text-[clamp(2.6rem,9vw,4.4rem)] font-light text-ivory-100 tracking-tight leading-none block">
            {leg.from}
          </span>
          <span className="font-ui text-[11px] uppercase tracking-[0.22em] text-mist-300 truncate max-w-full block mt-1.5">
            {leg.fromCity || leg.from}
          </span>
          {leg.depTime && (
            <span className="font-display text-lg sm:text-xl font-normal text-gold-300 block mt-1">
              {leg.depTime}
            </span>
          )}
        </motion.div>

        {/* Middle Column (Animated Dashed Arc + Plane Coin + Duration Pill) */}
        <div className="flex flex-col items-center justify-end w-24 sm:w-36 md:w-56 min-w-[96px] max-w-[224px] px-1 pb-1">
          {/* Animated SVG Arc */}
          <div className="w-full relative flex flex-col items-center">
            <svg
              viewBox="0 0 200 60"
              className="w-full h-auto overflow-visible"
              aria-hidden="true"
            >
              <motion.path
                d="M 4 52 C 60 6, 140 6, 196 52"
                fill="none"
                stroke="rgba(201, 168, 76, 0.45)"
                strokeWidth="1.4"
                strokeDasharray="4 5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  duration: 1.6,
                  delay: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </svg>

            {/* Plane Coin (Spring-Pop at Apex) */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
                delay: 0.9,
              }}
              className="w-8 h-8 rounded-full border border-gold-400/40 bg-ink-850 flex items-center justify-center shadow-md absolute top-[-10px] sm:top-[-12px] z-20"
            >
              <Plane
                className="w-3.5 h-3.5 text-gold-300 transform rotate-24"
                strokeWidth={1.8}
              />
            </motion.div>
          </div>

          {/* Duration Pill (Computed strictly from UTC pair) */}
          {duration && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="mt-2.5 px-3 py-0.5 rounded-full border border-gold-dim bg-ink-850/90 shadow-sm"
            >
              <span className="font-ui text-[9px] uppercase tracking-[0.26em] text-mist-300 font-semibold block">
                {duration}
              </span>
            </motion.div>
          )}
        </div>

        {/* Destination Column (Left-Aligned) */}
        <motion.div
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-start text-left min-w-0"
        >
          <span className="font-display text-[clamp(2.6rem,9vw,4.4rem)] font-light text-ivory-100 tracking-tight leading-none block">
            {leg.to}
          </span>
          <span className="font-ui text-[11px] uppercase tracking-[0.22em] text-mist-300 truncate max-w-full block mt-1.5">
            {leg.toCity || leg.to}
          </span>
          {leg.arrTime && (
            <div className="flex items-baseline mt-1">
              <span className="font-display text-lg sm:text-xl font-normal text-gold-300">
                {leg.arrTime}
              </span>
              {dayShift > 0 && (
                <span className="font-ui font-bold text-xs text-gold-400 ml-1.5 align-super">
                  +{dayShift}d
                </span>
              )}
            </div>
          )}
        </motion.div>

      </div>

      {/* 3. Footer (Hairline Gold Gradient Rule & Italic Serif Caption) */}
      <div className="mt-6 pt-3 relative z-10">
        <div className="gold-hairline mb-3" />
        <p className="font-display italic text-mist-300 text-sm sm:text-base text-center tracking-wide">
          The {cabinLabel} cellar &amp; kitchen
        </p>
      </div>
    </div>
  );
};
