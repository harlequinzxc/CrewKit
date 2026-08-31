import React from 'react';
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
  compact?: boolean;
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
 * Compact, quiet RouteHero block — sits as Layer 1 of the sticky stack.
 * Information-only, capped typography, no controls or heavy borders.
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
    <div className="w-full max-w-md mx-auto px-2 py-1 select-none text-left">
      {/* ── Whisper Meta Overline (Flight · Date) ── */}
      <div className="mb-1 flex items-center justify-center gap-2 text-center select-none">
        <span className="font-ui text-[9px] tracking-[0.2em] text-gold-400/90 font-semibold uppercase">
          {flightNumber}
        </span>
        <span className="h-px w-3 bg-gold-400/25" />
        <span className="text-[9px] uppercase tracking-[0.18em] text-mist-400 font-ui truncate max-w-[180px] sm:max-w-none">
          {prettyDateLong(flightDate)}
        </span>
      </div>

      {/* ── Compact Route Arc: 3-column grid (Origin, Arc, Destination) ── */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-3">
        {/* Origin */}
        <div className="text-right flex flex-col items-end">
          <div className="flex items-baseline gap-1.5 justify-end">
            {depTimeFormatted && (
              <span className="font-display text-xs sm:text-sm text-gold-300/90">
                {depTimeFormatted}
              </span>
            )}
            <span className="font-display text-xl sm:text-2xl font-medium leading-none text-ivory-100">
              {route.from}
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-mist-400 truncate max-w-[100px] sm:max-w-[120px]">
            {route.fromCity}
          </span>
        </div>

        {/* Center Arc & Block Duration */}
        <div className="relative flex w-16 sm:w-20 md:w-24 flex-col items-center pb-0.5">
          <svg viewBox="0 0 120 30" className="w-full overflow-visible" aria-hidden="true">
            <path
              d="M 4 24 C 30 4, 90 4, 116 24"
              fill="none"
              stroke="rgba(212,175,122,0.35)"
              strokeWidth="1"
              strokeDasharray="2.5 3.5"
            />
          </svg>
          <div className="absolute -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-gold-400/30 bg-ink-850">
            <Plane className="h-2 w-2 rotate-[24deg] text-gold-400" />
          </div>
          {dur && (
            <span className="mt-0.5 rounded-full border border-ink-700/50 bg-ink-850/70 px-1.5 py-0.2 text-[8px] uppercase tracking-[0.16em] text-mist-400">
              {dur}
            </span>
          )}
        </div>

        {/* Destination */}
        <div className="text-left flex flex-col items-start">
          <div className="flex items-baseline gap-1.5 justify-start">
            <span className="font-display text-xl sm:text-2xl font-medium leading-none text-ivory-100">
              {route.to}
            </span>
            {arrTimeFormatted && (
              <span className="font-display text-xs sm:text-sm text-gold-300/90">
                {arrTimeFormatted}
                {route.arrDayShift > 0 && (
                  <sup className="ml-0.5 text-[9px] text-gold-400">+{route.arrDayShift}d</sup>
                )}
              </span>
            )}
          </div>
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-mist-400 truncate max-w-[100px] sm:max-w-[120px]">
            {route.toCity}
          </span>
        </div>
      </div>
    </div>
  );
};

export const FlightHero = RouteHero;
