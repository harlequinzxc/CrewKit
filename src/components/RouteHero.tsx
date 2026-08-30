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
}

export interface FlightHeroProps {
  flightNumber: string; // "SQ 11"
  flightDate: string; // "2026-08-29"
  cabinShort: string; // "Business"
  cabinLabel: string; // "Business Class"
  leg: NormalizedLeg;
  legCount: number; // total legs of the flight
}

export type RouteHeroProps = FlightHeroProps;

/**
 * Format long-form date e.g. "Saturday, 29 August 2026" (en-GB, weekday long)
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
 * Compute duration from UTC pair only.
 * Never subtract local times (they cross time zones).
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

export const RouteHero: React.FC<FlightHeroProps> = ({
  flightNumber,
  flightDate,
  cabinShort,
  cabinLabel,
  leg,
  legCount,
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

  return (
    <section className="relative overflow-hidden rounded-3xl border border-gold-500/15 bg-gradient-to-b from-ink-850 to-ink-900/60 px-6 py-8 shadow-cabin sm:px-10">
      {/* ambient glows — same fixed RGBA in both themes, decorative */}
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(36,66,126,0.35),transparent)] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(200,164,93,0.12),transparent)] blur-2xl" />

      <div className="relative">
        {/* ── header line ── */}
        <div className="mb-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center">
          <span className="eyebrow">{flightNumber}</span>
          <span className="h-px w-6 bg-gold-500/40" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-mist-400">
            {prettyDateLong(flightDate)}
          </span>
          {legCount > 1 && (
            <>
              <span className="h-px w-6 bg-gold-500/40" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold-400">
                {cabinShort}
              </span>
            </>
          )}
        </div>

        {/* ── route arc ── 3-col grid, bottom-aligned ── */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 sm:gap-4">
          {/* origin column (right aligned) */}
          <div className="text-right">
            <motion.p
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-[clamp(2.6rem,9vw,4.4rem)] font-medium leading-none text-ivory-100"
            >
              {route.from}
            </motion.p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-mist-400">
              {route.fromCity}
            </p>
            <p className="mt-1 font-display text-xl text-gold-300">{route.depTime}</p>
          </div>

          {/* arc column */}
          <div className="relative flex w-24 flex-col items-center pb-1 sm:w-40 md:w-56">
            <svg viewBox="0 0 200 60" className="w-full overflow-visible" aria-hidden="true">
              <motion.path
                d="M4 52 C 60 6, 140 6, 196 52"
                fill="none"
                stroke="rgba(212,175,122,0.45)"
                strokeWidth="1"
                strokeDasharray="4 5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.35 }}
              />
            </svg>
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute -top-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-gold-500/40 bg-ink-800"
            >
              <Plane className="h-3.5 w-3.5 rotate-[24deg] text-gold-400" />
            </motion.div>
            {dur && (
              <p className="mt-2 rounded-full border border-ink-600/70 bg-ink-850/80 px-3 py-1 text-[9px] uppercase tracking-[0.26em] text-mist-400">
                {dur}
              </p>
            )}
          </div>

          {/* destination column (left aligned, mirror of origin) */}
          <div className="text-left">
            <motion.p
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-[clamp(2.6rem,9vw,4.4rem)] font-medium leading-none text-ivory-100"
            >
              {route.to}
            </motion.p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-mist-400">
              {route.toCity}
            </p>
            <p className="mt-1 font-display text-xl text-gold-300">
              {route.arrTime}
              {route.arrDayShift > 0 && (
                <sup className="ml-1 text-[11px] text-gold-500">+{route.arrDayShift}d</sup>
              )}
            </p>
          </div>
        </div>

        {/* ── footer ── */}
        <div className="gold-rule mx-auto mt-8 w-56" />
        <p className="mt-5 text-center font-display text-lg italic text-mist-400">
          The {cabinLabel} cellar &amp; kitchen
        </p>
      </div>
    </section>
  );
};

export const FlightHero = RouteHero;
