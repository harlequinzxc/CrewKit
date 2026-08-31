import React from 'react';
import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';

export interface RouteData {
  from: string; // e.g. "LAX"
  to: string; // e.g. "NRT"
  fromCity: string; // e.g. "Los Angeles"
  toCity: string; // e.g. "Tokyo"
  depTime: string; // e.g. "14:20"
  arrTime: string; // e.g. "17:50"
  depUtc: string; // e.g. "2026-08-29 21:20:00"
  arrUtc: string; // e.g. "2026-08-30 08:50:00"
  arrDayShift: number; // 0, 1, 2…
  status?: string; // unused visually
}

export interface NormalizedLeg {
  route?: RouteData;
  from?: string;
  to?: string;
  fromCity?: string;
  toCity?: string;
  depTime?: string;
  arrTime?: string;
  depUtc?: string;
  arrUtc?: string;
  depDateLocal?: string;
  arrDateLocal?: string;
  departureLocalDate?: string;
  arrivalLocalDate?: string;
  arrDayShift?: number;
  status?: string;
  origin?: string;
  destination?: string;
  originCity?: string;
  destinationCity?: string;
  legId?: string;
}

export interface FlightHeroProps {
  flightNumber: string; // "SQ 11"
  flightDate: string; // "2026-08-29"
  cabinShort?: string;
  cabinLabel?: string;
  leg: NormalizedLeg;
  legCount?: number;
  legs?: NormalizedLeg[];
  activeLegIndex?: number;
  onSelectLegIndex?: (index: number) => void;
}

export type RouteHeroProps = FlightHeroProps;

/**
 * Format long-form date e.g. "Monday, 31 August 2026" (en-GB, weekday long)
 */
export function prettyDateLong(iso: string): string {
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

/**
 * Format time string strictly as HH:MM
 */
export function formatTimeHHMM(timeStr?: string, utcFallback?: string): string {
  if (timeStr && timeStr.trim()) {
    const s = timeStr.trim();
    if (s.includes('T')) {
      const timePart = s.split('T')[1] || '';
      return timePart.substring(0, 5);
    }
    const match = s.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const h = match[1].padStart(2, '0');
      const m = match[2];
      return `${h}:${m}`;
    }
    return s;
  }
  if (utcFallback && utcFallback.trim()) {
    try {
      const clean = utcFallback.trim().replace(' ', 'T');
      const d = new Date(clean.endsWith('Z') ? clean : `${clean}Z`);
      if (!isNaN(d.getTime())) {
        const h = String(d.getUTCHours()).padStart(2, '0');
        const m = String(d.getUTCMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      }
    } catch {
      // ignore
    }
  }
  return '';
}

/**
 * Compute duration from UTC pair only.
 */
function duration(depUtc?: string, arrUtc?: string): string {
  if (!depUtc || !arrUtc) return '';
  try {
    const parseUtc = (s: string) => {
      const clean = s.trim().replace(' ', 'T');
      return Date.parse(clean.endsWith('Z') ? clean : `${clean}Z`);
    };
    const depMs = parseUtc(depUtc);
    const arrMs = parseUtc(arrUtc);
    if (isNaN(depMs) || isNaN(arrMs) || arrMs <= depMs) return '';
    const min = Math.round((arrMs - depMs) / 60000);
    return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;
  } catch {
    return '';
  }
}

/**
 * Light, quiet RouteHero block — sits topmost under global top bar, scrolls away naturally.
 */
export const RouteHero: React.FC<FlightHeroProps> = ({
  flightNumber,
  flightDate,
  leg,
}) => {
  const route: RouteData = leg.route || {
    from: leg.from || (leg as any).origin || '',
    to: leg.to || (leg as any).destination || '',
    fromCity: leg.fromCity || (leg as any).originCity || leg.from || '',
    toCity: leg.toCity || (leg as any).destinationCity || leg.to || '',
    depTime: leg.depTime || '',
    arrTime: leg.arrTime || '',
    depUtc: leg.depUtc || '',
    arrUtc: leg.arrUtc || '',
    arrDayShift: typeof leg.arrDayShift === 'number' ? leg.arrDayShift : 0,
    status: leg.status || '',
  };

  const dur = duration(route.depUtc, route.arrUtc);
  const depTimeFormatted = formatTimeHHMM(route.depTime, route.depUtc);
  const arrTimeFormatted = formatTimeHHMM(route.arrTime, route.arrUtc);

  return (
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gold-400/[0.08] bg-gradient-to-b from-ink-850/50 to-ink-900/30 px-5 py-5 sm:px-8 sm:py-6 shadow-sm text-left">
      {/* Subtle ambient glows */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(36,66,126,0.2),transparent)] blur-xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(200,164,93,0.08),transparent)] blur-xl" />

      <div className="relative">
        {/* ── Whisper Meta Overline (Flight · Date, deduplicated whisper) ── */}
        <div className="mb-4 flex items-center justify-center gap-2.5 text-center select-none">
          <span className="font-ui text-[10px] tracking-[0.22em] text-gold-400/90 font-medium uppercase">{flightNumber}</span>
          <span className="h-px w-4 bg-gold-400/25" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-mist-400 font-ui">
            {prettyDateLong(flightDate)}
          </span>
        </div>

        {/* ── Route Arc ── 3-col grid, compact refined typography ── */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 sm:gap-3">
          {/* Origin */}
          <div className="text-right">
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-3xl sm:text-4xl md:text-[2.6rem] font-medium leading-none text-ivory-100"
            >
              {route.from}
            </motion.p>
            <p className="mt-1 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-mist-400 truncate">
              {route.fromCity}
            </p>
            {depTimeFormatted && (
              <p className="mt-0.5 font-display text-base sm:text-lg text-gold-300/90">{depTimeFormatted}</p>
            )}
          </div>

          {/* Arc & Duration */}
          <div className="relative flex w-20 sm:w-28 md:w-36 flex-col items-center pb-0.5">
            <svg viewBox="0 0 160 45" className="w-full overflow-visible" aria-hidden="true">
              <motion.path
                d="M4 38 C 45 6, 115 6, 156 38"
                fill="none"
                stroke="rgba(212,175,122,0.35)"
                strokeWidth="1"
                strokeDasharray="3 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.2 }}
              />
            </svg>
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-gold-400/30 bg-ink-800"
            >
              <Plane className="h-2.5 w-2.5 rotate-[24deg] text-gold-400" />
            </motion.div>
            {dur && (
              <p className="mt-1.5 rounded-full border border-ink-700/60 bg-ink-850/60 px-2.5 py-0.5 text-[8.5px] uppercase tracking-[0.2em] text-mist-400 select-none">
                {dur}
              </p>
            )}
          </div>

          {/* Destination */}
          <div className="text-left">
            <motion.p
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-3xl sm:text-4xl md:text-[2.6rem] font-medium leading-none text-ivory-100"
            >
              {route.to}
            </motion.p>
            <p className="mt-1 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-mist-400 truncate">
              {route.toCity}
            </p>
            {arrTimeFormatted && (
              <p className="mt-0.5 font-display text-base sm:text-lg text-gold-300/90">
                {arrTimeFormatted}
                {route.arrDayShift > 0 && (
                  <sup className="ml-0.5 text-[10px] text-gold-400">+{route.arrDayShift}d</sup>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export const FlightHero = RouteHero;
