import React from 'react';

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
 * Sticky RouteHero block — sits as Layer 2 of the sticky stack.
 * Purely informational display with prominent editorial scale and balanced internal spread.
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
    <section className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-gold-dim bg-ink-900/60 md:bg-ink-900/40 backdrop-blur-md px-5 py-3.5 sm:px-6 sm:py-4 shadow-sm text-left select-none transition-colors">
      {/* Subtle ambient glows */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(36,66,126,0.14),transparent)] blur-xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(200,164,93,0.06),transparent)] blur-xl" />

      <div className="relative max-w-[38rem] mx-auto w-full px-4 sm:px-6">
        {/* ── Whisper Meta Overline (Flight · Date) ── */}
        <div className="mb-2.5 sm:mb-3 flex items-center justify-center gap-2.5 text-center select-none">
          <span className="font-ui text-[10px] tracking-[0.22em] text-gold-400 font-semibold uppercase">
            {flightNumber}
          </span>
          <span className="h-px w-4 bg-gold-400/35" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-mist-400 font-ui font-medium">
            {prettyDateLong(flightDate)}
          </span>
        </div>

        {/* ── Route Arc ── 3-col grid with internal spread ── */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 md:gap-6">
          {/* Left Zone: Origin */}
          <div className="text-right flex flex-col items-end">
            <p className="font-display text-3xl sm:text-4xl md:text-[2.5rem] font-light leading-none text-ivory-100">
              {route.from}
            </p>
            <p className="mt-1 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-mist-400 truncate max-w-[130px] sm:max-w-[180px] font-medium">
              {route.fromCity}
            </p>
            {depTimeFormatted && (
              <p className="mt-0.5 font-display text-base sm:text-lg text-gold-400 font-light">
                {depTimeFormatted}
              </p>
            )}
          </div>

          {/* Center Zone: Plane + Arc + Duration (Guaranteed min-width 92–130px) */}
          <div className="relative flex min-w-[92px] sm:min-w-[112px] md:min-w-[130px] flex-col items-center justify-center pb-0.5 shrink-0">
            {/* SVG containing both the dashed arc and plane badge locked to midpoint apex (80, 15) */}
            <svg
              viewBox="0 0 160 46"
              className="w-full overflow-visible max-w-[140px]"
              aria-hidden="true"
            >
              {/* Dashed Route Arc */}
              <path
                d="M 6 36 C 44 8, 116 8, 154 36"
                fill="none"
                stroke="var(--route-arc-stroke)"
                strokeWidth="1.25"
                strokeDasharray="3 4"
              />

              {/* Plane Badge centered horizontally and vertically on arc midpoint apex (80, 15) */}
              <g transform="translate(80, 15)">
                {/* Background disc */}
                <circle
                  r="9.5"
                  className="fill-ink-850 stroke-gold-400/40"
                  strokeWidth="1"
                />
                {/* Plane icon centered at (0, 0) with slight nose-up pitch */}
                <g transform="translate(-5.5, -5.5) scale(0.46) rotate(15, 12, 12)">
                  <path
                    d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
                    className="stroke-gold-400 fill-gold-400/25"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              </g>
            </svg>

            {/* Duration Chip sitting below the arc+plane unit */}
            {dur && (
              <p className="mt-1 rounded-full border border-gold-dim bg-ink-850/80 px-2 sm:px-2.5 py-0.5 text-[8px] sm:text-[8.5px] uppercase tracking-[0.2em] text-mist-400 font-ui font-medium select-none whitespace-nowrap">
                {dur}
              </p>
            )}
          </div>

          {/* Right Zone: Destination */}
          <div className="text-left flex flex-col items-start">
            <p className="font-display text-3xl sm:text-4xl md:text-[2.5rem] font-light leading-none text-ivory-100">
              {route.to}
            </p>
            <p className="mt-1 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-mist-400 truncate max-w-[130px] sm:max-w-[180px] font-medium">
              {route.toCity}
            </p>
            {arrTimeFormatted && (
              <p className="mt-0.5 font-display text-base sm:text-lg text-gold-400 font-light">
                {arrTimeFormatted}
                {route.arrDayShift > 0 && (
                  <sup className="ml-0.5 text-[9px] sm:text-[10px] text-gold-400 font-medium">+{route.arrDayShift}d</sup>
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
