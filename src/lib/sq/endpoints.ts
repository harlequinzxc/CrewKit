import {
  CabinCode,
  CabinConfig,
  FlightSchedule,
  MenuData,
  MenuSection,
  Sector,
  MenuItem,
  LegMenuData,
  MealService,
  MealSelection,
  MealCourse,
  AmenityItem,
} from './types';
import { SQ_CONFIG } from './config';
import { sqCache } from './cache';

/**
 * Standard IATA Airport Code to City Name Lookup
 */
const AIRPORT_CITIES: Record<string, string> = {
  SIN: 'Singapore',
  LHR: 'London Heathrow',
  FRA: 'Frankfurt',
  JFK: 'New York JFK',
  EWR: 'Newark',
  LAX: 'Los Angeles',
  SFO: 'San Francisco',
  SEA: 'Seattle',
  NRT: 'Tokyo Narita',
  HND: 'Tokyo Haneda',
  KIX: 'Osaka Kansai',
  ICN: 'Seoul Incheon',
  PVG: 'Shanghai Pudong',
  PEK: 'Beijing Capital',
  HKG: 'Hong Kong',
  TPE: 'Taipei',
  BKK: 'Bangkok',
  DPS: 'Bali Denpasar',
  PEN: 'Penang',
  KNO: 'Medan Kualanamu',
  KUL: 'Kuala Lumpur',
  HKT: 'Phuket',
  CGK: 'Jakarta',
  SUB: 'Surabaya',
  SYD: 'Sydney',
  MEL: 'Melbourne',
  BNE: 'Brisbane',
  PER: 'Perth',
  AKL: 'Auckland',
  CDG: 'Paris CDG',
  ZRH: 'Zurich',
  AMS: 'Amsterdam',
  CPH: 'Copenhagen',
  FCO: 'Rome Fiumicino',
  MXP: 'Milan Malpensa',
  BCN: 'Barcelona',
  DXB: 'Dubai',
  BOM: 'Mumbai',
  DEL: 'Delhi',
};

/**
 * Known active Singapore Airlines commercial flight schedules for offline fallback
 */
const KNOWN_ACTIVE_SQ_SCHEDULES: Record<
  string,
  {
    aircraft: string;
    cabins: CabinCode[];
    sectors: Array<{
      from: string;
      to: string;
      depTime: string;
      arrTime: string;
      arrDayOffset: number;
      blockMinutes: number;
    }>;
  }
> = {
  '11': {
    aircraft: 'Boeing 777-300ER',
    cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'LAX', to: 'NRT', depTime: '15:50', arrTime: '19:00', arrDayOffset: 1, blockMinutes: 670 },
      { from: 'NRT', to: 'SIN', depTime: '20:25', arrTime: '03:00', arrDayOffset: 1, blockMinutes: 395 },
    ],
  },
  '12': {
    aircraft: 'Boeing 777-300ER',
    cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'NRT', depTime: '09:25', arrTime: '17:30', arrDayOffset: 0, blockMinutes: 425 },
      { from: 'NRT', to: 'LAX', depTime: '19:00', arrTime: '13:15', arrDayOffset: 0, blockMinutes: 615 },
    ],
  },
  '21': {
    aircraft: 'Airbus A350-900ULR',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY'],
    sectors: [
      { from: 'EWR', to: 'SIN', depTime: '10:25', arrTime: '17:10', arrDayOffset: 1, blockMinutes: 1125 },
    ],
  },
  '22': {
    aircraft: 'Airbus A350-900ULR',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'EWR', depTime: '23:35', arrTime: '06:00', arrDayOffset: 1, blockMinutes: 1105 },
    ],
  },
  '23': {
    aircraft: 'Airbus A350-900ULR',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY'],
    sectors: [
      { from: 'JFK', to: 'SIN', depTime: '22:30', arrTime: '05:20', arrDayOffset: 2, blockMinutes: 1130 },
    ],
  },
  '24': {
    aircraft: 'Airbus A350-900ULR',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'JFK', depTime: '00:05', arrTime: '07:05', arrDayOffset: 0, blockMinutes: 1140 },
    ],
  },
  '25': {
    aircraft: 'Boeing 777-300ER',
    cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'JFK', to: 'FRA', depTime: '20:15', arrTime: '09:50', arrDayOffset: 1, blockMinutes: 455 },
      { from: 'FRA', to: 'SIN', depTime: '11:40', arrTime: '06:50', arrDayOffset: 1, blockMinutes: 730 },
    ],
  },
  '26': {
    aircraft: 'Boeing 777-300ER',
    cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'FRA', depTime: '23:55', arrTime: '06:20', arrDayOffset: 1, blockMinutes: 745 },
      { from: 'FRA', to: 'JFK', depTime: '08:35', arrTime: '11:10', arrDayOffset: 0, blockMinutes: 515 },
    ],
  },
  '33': {
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'SFO', to: 'SIN', depTime: '21:50', arrTime: '05:35', arrDayOffset: 2, blockMinutes: 945 },
    ],
  },
  '34': {
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'SFO', depTime: '17:40', arrTime: '17:35', arrDayOffset: 0, blockMinutes: 895 },
    ],
  },
  '37': {
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'LAX', to: 'SIN', depTime: '23:40', arrTime: '07:30', arrDayOffset: 2, blockMinutes: 1010 },
    ],
  },
  '38': {
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'LAX', depTime: '20:45', arrTime: '21:55', arrDayOffset: 0, blockMinutes: 970 },
    ],
  },
  '106': {
    aircraft: 'Boeing 737-800',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'KUL', depTime: '08:30', arrTime: '09:35', arrDayOffset: 0, blockMinutes: 65 },
    ],
  },
  '107': {
    aircraft: 'Boeing 737-800',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'KUL', to: 'SIN', depTime: '10:25', arrTime: '11:30', arrDayOffset: 0, blockMinutes: 65 },
    ],
  },
  '118': {
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'KUL', depTime: '18:40', arrTime: '19:40', arrDayOffset: 0, blockMinutes: 60 },
    ],
  },
  '119': {
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'KUL', to: 'SIN', depTime: '20:30', arrTime: '21:30', arrDayOffset: 0, blockMinutes: 60 },
    ],
  },
  '133': {
    aircraft: 'Boeing 737 MAX 8',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'PEN', to: 'SIN', depTime: '10:45', arrTime: '12:10', arrDayOffset: 0, blockMinutes: 85 },
    ],
  },
  '134': {
    aircraft: 'Boeing 737 MAX 8',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'PEN', depTime: '08:30', arrTime: '09:55', arrDayOffset: 0, blockMinutes: 85 },
    ],
  },
  '135': {
    aircraft: 'Boeing 737 MAX 8',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'PEN', to: 'SIN', depTime: '14:55', arrTime: '16:20', arrDayOffset: 0, blockMinutes: 85 },
    ],
  },
  '136': {
    aircraft: 'Boeing 737 MAX 8',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'PEN', depTime: '12:40', arrTime: '14:05', arrDayOffset: 0, blockMinutes: 85 },
    ],
  },
  '137': {
    aircraft: 'Boeing 737 MAX 8',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'PEN', to: 'SIN', depTime: '17:15', arrTime: '18:40', arrDayOffset: 0, blockMinutes: 85 },
    ],
  },
  '138': {
    aircraft: 'Boeing 737 MAX 8',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'PEN', depTime: '15:00', arrTime: '16:25', arrDayOffset: 0, blockMinutes: 85 },
    ],
  },
  '221': {
    aircraft: 'Airbus A380-800',
    cabins: ['SUITES', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'SYD', depTime: '20:40', arrTime: '06:15', arrDayOffset: 1, blockMinutes: 455 },
    ],
  },
  '222': {
    aircraft: 'Airbus A380-800',
    cabins: ['SUITES', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'SYD', to: 'SIN', depTime: '15:00', arrTime: '21:20', arrDayOffset: 0, blockMinutes: 500 },
    ],
  },
  '237': {
    aircraft: 'Boeing 777-300ER',
    cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'MEL', depTime: '23:55', arrTime: '09:15', arrDayOffset: 1, blockMinutes: 440 },
    ],
  },
  '238': {
    aircraft: 'Boeing 777-300ER',
    cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'MEL', to: 'SIN', depTime: '11:30', arrTime: '17:35', arrDayOffset: 0, blockMinutes: 485 },
    ],
  },
  '306': {
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'LHR', depTime: '01:10', arrTime: '07:45', arrDayOffset: 0, blockMinutes: 815 },
    ],
  },
  '305': {
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'LHR', to: 'SIN', depTime: '15:05', arrTime: '11:15', arrDayOffset: 1, blockMinutes: 790 },
    ],
  },
  '308': {
    aircraft: 'Airbus A380-800',
    cabins: ['SUITES', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'LHR', depTime: '09:00', arrTime: '15:40', arrDayOffset: 0, blockMinutes: 820 },
    ],
  },
  '318': {
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'LHR', depTime: '12:45', arrTime: '19:10', arrDayOffset: 0, blockMinutes: 805 },
    ],
  },
  '321': {
    aircraft: 'Airbus A380-800',
    cabins: ['SUITES', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'LHR', to: 'SIN', depTime: '22:05', arrTime: '18:10', arrDayOffset: 1, blockMinutes: 785 },
    ],
  },
  '322': {
    aircraft: 'Airbus A380-800',
    cabins: ['SUITES', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'LHR', depTime: '23:45', arrTime: '06:25', arrDayOffset: 1, blockMinutes: 820 },
    ],
  },
  '325': {
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'FRA', to: 'SIN', depTime: '22:00', arrTime: '16:45', arrDayOffset: 1, blockMinutes: 705 },
    ],
  },
  '326': {
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'FRA', depTime: '13:55', arrTime: '20:40', arrDayOffset: 0, blockMinutes: 765 },
    ],
  },
  '631': {
    aircraft: 'Boeing 787-10',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'HND', to: 'SIN', depTime: '09:15', arrTime: '15:15', arrDayOffset: 0, blockMinutes: 420 },
    ],
  },
  '632': {
    aircraft: 'Boeing 787-10',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'HND', depTime: '08:00', arrTime: '15:55', arrDayOffset: 0, blockMinutes: 415 },
    ],
  },
  '637': {
    aircraft: 'Boeing 777-300ER',
    cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'NRT', to: 'SIN', depTime: '11:10', arrTime: '17:45', arrDayOffset: 0, blockMinutes: 455 },
    ],
  },
  '638': {
    aircraft: 'Boeing 777-300ER',
    cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'NRT', depTime: '23:55', arrTime: '08:00', arrDayOffset: 1, blockMinutes: 425 },
    ],
  },
  '707': {
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'BKK', to: 'SIN', depTime: '12:15', arrTime: '15:50', arrDayOffset: 0, blockMinutes: 155 },
    ],
  },
  '708': {
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'BKK', depTime: '09:30', arrTime: '11:00', arrDayOffset: 0, blockMinutes: 150 },
    ],
  },
  '725': {
    aircraft: 'Boeing 737-800',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'HKT', to: 'SIN', depTime: '14:10', arrTime: '17:05', arrDayOffset: 0, blockMinutes: 115 },
    ],
  },
  '726': {
    aircraft: 'Boeing 737-800',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'HKT', depTime: '12:20', arrTime: '13:10', arrDayOffset: 0, blockMinutes: 110 },
    ],
  },
  '830': {
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'PVG', depTime: '09:45', arrTime: '15:05', arrDayOffset: 0, blockMinutes: 320 },
    ],
  },
  '833': {
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    sectors: [
      { from: 'PVG', to: 'SIN', depTime: '16:25', arrTime: '21:50', arrDayOffset: 0, blockMinutes: 325 },
    ],
  },
  '890': {
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'HKG', depTime: '07:30', arrTime: '11:20', arrDayOffset: 0, blockMinutes: 230 },
    ],
  },
  '891': {
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'HKG', to: 'SIN', depTime: '12:30', arrTime: '16:20', arrDayOffset: 0, blockMinutes: 230 },
    ],
  },
  '942': {
    aircraft: 'Boeing 787-10',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'DPS', depTime: '09:15', arrTime: '12:05', arrDayOffset: 0, blockMinutes: 170 },
    ],
  },
  '943': {
    aircraft: 'Boeing 787-10',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'DPS', to: 'SIN', depTime: '13:05', arrTime: '15:55', arrDayOffset: 0, blockMinutes: 170 },
    ],
  },
  '994': {
    aircraft: 'Boeing 737 MAX 8',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'SIN', to: 'KNO', depTime: '07:40', arrTime: '08:10', arrDayOffset: 0, blockMinutes: 90 },
    ],
  },
  '995': {
    aircraft: 'Boeing 737 MAX 8',
    cabins: ['BUSINESS', 'ECONOMY'],
    sectors: [
      { from: 'KNO', to: 'SIN', depTime: '08:55', arrTime: '11:25', arrDayOffset: 0, blockMinutes: 90 },
    ],
  },
};

/**
 * Generate client-side UUID for SIA Session
 */
function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Clean numeric string representation (e.g. 'SQ0322' -> '322', 'SQ11' -> '11')
 */
export function normalizeFlightNumber(flightNo: string): string {
  if (!flightNo) return '';
  const clean = flightNo.replace(/\D/g, '');
  const num = parseInt(clean, 10);
  return isNaN(num) ? '' : num.toString();
}

/**
 * Validate flight number format (1–4 digits)
 */
export function isValidFlightNumber(flightNo: string): boolean {
  if (!flightNo) return false;
  const num = parseInt(normalizeFlightNumber(flightNo), 10);
  return !isNaN(num) && num >= 1 && num <= 9999;
}

/**
 * Map internal CabinCode to SIA API Cabin Class ('FCL' | 'JCL' | 'SCL' | 'YCL')
 */
export function cabinCodeToSia(cabin: CabinCode): 'FCL' | 'JCL' | 'SCL' | 'YCL' {
  switch (cabin) {
    case 'SUITES':
    case 'FIRST':
      return 'FCL';
    case 'BUSINESS':
      return 'JCL';
    case 'PREMIUM_ECONOMY':
      return 'SCL';
    case 'ECONOMY':
    default:
      return 'YCL';
  }
}

/**
 * Map SIA API Cabin Class ('FCL' | 'JCL' | 'SCL' | 'YCL') to internal CabinCode
 */
export function siaToCabinCode(siaClass: string): CabinCode | null {
  if (!siaClass) return null;
  const code = siaClass.toUpperCase().trim();
  if (code.includes('FCL') || code === 'FIRST' || code === 'SUITES' || code === 'R' || code === 'F') return 'FIRST';
  if (code.includes('JCL') || code === 'BUSINESS' || code === 'C' || code === 'J') return 'BUSINESS';
  if (code.includes('SCL') || code === 'PREMIUM_ECONOMY' || code === 'PREM' || code === 'S' || code === 'W') return 'PREMIUM_ECONOMY';
  if (code.includes('YCL') || code === 'ECONOMY' || code === 'Y') return 'ECONOMY';
  return null;
}

/**
 * Map tag codes (e.g. 'WLSGD', 'ICP', 'VGT') to user-friendly badge labels
 */
function mapIconTag(icon: string): string {
  const upper = (icon || '').toUpperCase().trim();
  if (upper === 'WLSGD' || upper === 'SIGNATURE') return 'Signature';
  if (upper === 'ICP' || upper === 'CULINARY_PANEL') return 'Culinary Panel';
  if (upper === 'VGT' || upper === 'VEG' || upper === 'VEGETARIAN') return 'Vegetarian';
  if (upper === 'BTC' || upper === 'BOOK_THE_COOK') return 'Book the Cook';
  if (upper === 'HAL' || upper === 'HALAL') return 'Halal';
  if (upper === 'GF' || upper === 'GLUTEN_FREE') return 'Gluten Free';
  return icon;
}

/**
 * Clean text strings & HTML entities
 */
function cleanText(str: any): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 1. Retrieve Available Cabin Configuration from Live SIA Feed (/getcabin)
 * Strictly verifies whether the flight exists. Returns available: [] if not found.
 */
export async function getCabinConfig(flightNo: string, dateISO: string): Promise<CabinConfig> {
  const num = normalizeFlightNumber(flightNo);
  if (!num) {
    return { flightNo: '', date: dateISO, available: [] };
  }

  const cacheKey = `sq_cabin_${num}_${dateISO}`;
  const cached = sqCache.get<CabinConfig>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(SQ_CONFIG.GET_CABIN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        carrierId: 'SQ',
        flightNumber: num,
        flightDate: dateISO,
        sessionId: generateSessionId(),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.statusCode === 200) {
        const foundCabins: CabinCode[] = [];
        
        const rawCabins = data.cabinClasses || data.cabins || [];
        if (Array.isArray(rawCabins)) {
          rawCabins.forEach((c: any) => {
            const rawCode = typeof c === 'string' ? c : c.code || c.cabinClass || c.name || '';
            const mapped = siaToCabinCode(rawCode);
            if (mapped && !foundCabins.includes(mapped)) {
              foundCabins.push(mapped);
            }
          });
        }

        const aircraft = data.aircraftType || data.aircraft || '';

        const result: CabinConfig = {
          flightNo: `SQ${num}`,
          date: dateISO,
          available: foundCabins,
          aircraftType: aircraft || undefined,
        };

        sqCache.set(cacheKey, result, SQ_CONFIG.CACHE_TTL_CABIN_CONFIG);
        return result;
      }

      if (data && data.statusCode === 101) {
        const notFound: CabinConfig = {
          flightNo: `SQ${num}`,
          date: dateISO,
          available: [],
        };
        sqCache.set(cacheKey, notFound, SQ_CONFIG.CACHE_TTL_CABIN_CONFIG);
        return notFound;
      }
    }
  } catch (err) {
    console.warn('Live /getcabin fetch error:', err);
  }

  // Offline fallback for testing
  if (KNOWN_ACTIVE_SQ_SCHEDULES[num]) {
    const match = KNOWN_ACTIVE_SQ_SCHEDULES[num];
    const offlineResult: CabinConfig = {
      flightNo: `SQ${num}`,
      date: dateISO,
      available: match.cabins,
      aircraftType: match.aircraft,
    };
    return offlineResult;
  }

  // Flight does not exist
  return {
    flightNo: `SQ${num}`,
    date: dateISO,
    available: [],
  };
}

/**
 * 2. Retrieve Flight Schedule, Sector Timings, & Station Times from Live SIA Feed
 */
export async function getFlightSchedule(flightNo: string, dateISO: string): Promise<FlightSchedule> {
  const num = normalizeFlightNumber(flightNo);
  if (!num) {
    return { flightNo: '', date: dateISO, sectors: [] };
  }

  const cacheKey = `sq_sched_${num}_${dateISO}`;
  const cached = sqCache.get<FlightSchedule>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(SQ_CONFIG.GET_CABIN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        carrierId: 'SQ',
        flightNumber: num,
        flightDate: dateISO,
        sessionId: generateSessionId(),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.statusCode === 200 && Array.isArray(data.legs) && data.legs.length > 0) {
        const sectors: Sector[] = [];

        data.legs.forEach((leg: any) => {
          const fd = leg.flightDetails || leg;
          const from = fd.departureAirportCode || fd.origin || 'SIN';
          const to = fd.arrivalAirportCode || fd.destination || 'SIN';
          const depIso = fd.departureLocalDate || fd.departureDate || dateISO;
          const arrIso = fd.arrivalLocalDate || fd.arrivalDate || dateISO;

          const depTime = depIso.includes('T') ? depIso.split('T')[1].substring(0, 5) : '09:00';
          const arrTime = arrIso.includes('T') ? arrIso.split('T')[1].substring(0, 5) : '17:00';
          const depDate = depIso.includes('T') ? depIso.split('T')[0] : dateISO;
          const arrDate = arrIso.includes('T') ? arrIso.split('T')[0] : dateISO;

          let blockMinutes = 480;
          if (fd.departureUtcDate && fd.arrivalUtcDate) {
            const depUtc = new Date(fd.departureUtcDate).getTime();
            const arrUtc = new Date(fd.arrivalUtcDate).getTime();
            if (!isNaN(depUtc) && !isNaN(arrUtc) && arrUtc > depUtc) {
              blockMinutes = Math.round((arrUtc - depUtc) / 60000);
            }
          }

          sectors.push({
            from,
            fromCity: AIRPORT_CITIES[from] || from,
            to,
            toCity: AIRPORT_CITIES[to] || to,
            depLocal: depTime,
            depDateLocal: depDate,
            arrLocal: arrTime,
            arrDateLocal: arrDate,
            blockMinutes,
          });
        });

        if (sectors.length > 0) {
          const scheduleResult: FlightSchedule = {
            flightNo: `SQ${num}`,
            date: dateISO,
            sectors,
            aircraftType: data.aircraftType || data.aircraft,
          };
          sqCache.set(cacheKey, scheduleResult, SQ_CONFIG.CACHE_TTL_SCHEDULE);
          return scheduleResult;
        }
      }
    }
  } catch (err) {
    console.warn('Live schedule fetch error:', err);
  }

  // Fallback offline schedule matching exact route
  if (KNOWN_ACTIVE_SQ_SCHEDULES[num]) {
    const known = KNOWN_ACTIVE_SQ_SCHEDULES[num];
    const sectors: Sector[] = known.sectors.map((sec) => {
      const depDate = dateISO;
      const dObj = new Date(dateISO);
      dObj.setDate(dObj.getDate() + sec.arrDayOffset);
      const arrDate = dObj.toISOString().split('T')[0];

      return {
        from: sec.from,
        fromCity: AIRPORT_CITIES[sec.from] || sec.from,
        to: sec.to,
        toCity: AIRPORT_CITIES[sec.to] || sec.to,
        depLocal: sec.depTime,
        depDateLocal: depDate,
        arrLocal: sec.arrTime,
        arrDateLocal: arrDate,
        blockMinutes: sec.blockMinutes,
      };
    });

    const offlineSchedule: FlightSchedule = {
      flightNo: `SQ${num}`,
      date: dateISO,
      sectors,
      aircraftType: known.aircraft,
    };
    return offlineSchedule;
  }

  return {
    flightNo: `SQ${num}`,
    date: dateISO,
    sectors: [],
  };
}

/**
 * 3. Retrieve Full Inflight Menu for a Cabin Class from Live SIA Feed (/menu)
 */
export async function getMenu(flightNo: string, dateISO: string, cabin: CabinCode): Promise<MenuData> {
  const num = normalizeFlightNumber(flightNo);
  const siaCabin = cabinCodeToSia(cabin);
  const cacheKey = `sq_menu_${num}_${dateISO}_${cabin}`;
  const cached = sqCache.get<MenuData>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(SQ_CONFIG.MENU_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        carrierId: 'SQ',
        flightNumber: num,
        flightDate: dateISO,
        cabinClass: siaCabin,
        sessionId: generateSessionId(),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && (data.statusCode === 200 || Array.isArray(data.legs))) {
        const parsed = parseSiaMenuResponse(data, num, dateISO, cabin);
        sqCache.set(cacheKey, parsed, SQ_CONFIG.CACHE_TTL_MENU);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Live menu fetch error:', err);
  }

  const emptyMenu: MenuData = {
    flightNo: `SQ${num}`,
    date: dateISO,
    cabin,
    legs: [],
    sections: [],
    drinks: [],
  };
  sqCache.set(cacheKey, emptyMenu, SQ_CONFIG.CACHE_TTL_MENU);
  return emptyMenu;
}

/**
 * Helper to safely extract English language object from nested leg keys
 */
function extractEnUkBlock(obj: any, keyPrefix: string): any {
  if (!obj) return null;
  if (obj[`${keyPrefix}.language.EN_UK`]) return obj[`${keyPrefix}.language.EN_UK`];
  if (obj[`${keyPrefix}.language.en_UK`]) return obj[`${keyPrefix}.language.en_UK`];
  if (obj[`${keyPrefix}.language.EN`]) return obj[`${keyPrefix}.language.EN`];
  
  const root = obj[keyPrefix] || obj;
  const lang = root?.language || root?.languages || root;
  return lang?.EN_UK || lang?.en_UK || lang?.EN || lang?.en || null;
}

/**
 * Parse live SIA /menu response JSON structure
 */
function parseSiaMenuResponse(data: any, flightNo: string, dateISO: string, cabin: CabinCode): MenuData {
  const allFlatDining: MenuSection[] = [];
  const allFlatDrinks: MenuSection[] = [];
  const legsList: LegMenuData[] = [];

  const rawLegs = Array.isArray(data.legs) && data.legs.length > 0 ? data.legs : [data];

  rawLegs.forEach((leg: any, lIdx: number) => {
    const fd = leg.flightDetails || {};
    const origin = fd.departureAirportCode || fd.origin || 'SIN';
    const destination = fd.arrivalAirportCode || fd.destination || 'SIN';
    const legId = `${origin}-${destination}`;

    const mealServices: MealService[] = [];
    const drinksSections: MenuSection[] = [];
    const snacksList: MenuItem[] = [];
    const amenitiesList: AmenityItem[] = [];

    // 1. MEAL SERVICES (menu.language.EN_UK)
    const menuEn = extractEnUkBlock(leg, 'menu');
    if (menuEn && Array.isArray(menuEn.meals)) {
      menuEn.meals.forEach((meal: any, mIdx: number) => {
        const mealTitle = cleanText(meal.mealServiceName || meal.name || `Meal Service ${mIdx + 1}`);
        const rawSelections = Array.isArray(meal.selectionDetails) ? meal.selectionDetails : [meal];

        const selections: MealSelection[] = [];

        rawSelections.forEach((selection: any, sIdx: number) => {
          const selectionName = cleanText(selection.name || (rawSelections.length > 1 ? `Option ${sIdx + 1}` : 'Standard Menu'));
          const rawCourses = Array.isArray(selection.mealCourses) ? selection.mealCourses : [];

          const courses: MealCourse[] = [];

          rawCourses.forEach((course: any, cIdx: number) => {
            const courseCategory = cleanText(course.category || course.name || mealTitle);
            const maxSequence = typeof course.maxSequence === 'number' ? course.maxSequence : undefined;

            const items: MenuItem[] = [];
            const rawItems = Array.isArray(course.items) ? course.items : [];

            rawItems.forEach((item: any, iIdx: number) => {
              const name = cleanText(item.name || item.title || item.dishName || '');
              if (name) {
                const desc = cleanText(item.description || item.desc || '');
                const footnote = cleanText(item.footnote || '');

                const tags: string[] = [];
                if (Array.isArray(item.icons)) {
                  item.icons.forEach((ic: string) => tags.push(mapIconTag(ic)));
                }

                let imageUrl: string | undefined = undefined;
                const rawImg = item.imagePathIfeHigh || item.imagePath || item.imageUrl || item.image;
                if (rawImg && typeof rawImg === 'string') {
                  imageUrl = rawImg.startsWith('http')
                    ? rawImg
                    : `${SQ_CONFIG.IMAGE_BASE_URL}${rawImg.replace(/^\/+/, '')}`;
                }

                items.push({
                  id: `leg_${lIdx}_m_${mIdx}_s_${sIdx}_c_${cIdx}_i_${iIdx}`,
                  title: name,
                  description: desc || undefined,
                  footnote: footnote || undefined,
                  tags: tags.length > 0 ? Array.from(new Set(tags)) : undefined,
                  imageUrl,
                });
              }
            });

            if (items.length > 0) {
              courses.push({
                id: `course_${lIdx}_${mIdx}_${sIdx}_${cIdx}`,
                name: courseCategory,
                maxSequence,
                items,
              });

              allFlatDining.push({
                id: `flat_dining_${lIdx}_${mIdx}_${sIdx}_${cIdx}`,
                title: rawLegs.length > 1
                  ? `${origin}→${destination} · ${mealTitle} · ${courseCategory}`
                  : `${mealTitle} · ${courseCategory}`,
                items,
              });
            }
          });

          if (courses.length > 0) {
            selections.push({
              id: `sel_${lIdx}_${mIdx}_${sIdx}`,
              name: selectionName,
              courses,
            });
          }
        });

        if (selections.length > 0) {
          mealServices.push({
            id: `service_${lIdx}_${mIdx}`,
            name: mealTitle,
            selections,
          });
        }
      });
    }

    // 2. BEVERAGES (beverage.language.EN_UK.categories[])
    const bevEn = extractEnUkBlock(leg, 'beverage');
    const categories = bevEn?.categories || leg?.beverage?.categories || leg?.beverages || [];

    if (Array.isArray(categories)) {
      categories.forEach((cat: any, catIdx: number) => {
        const catName = cleanText(cat.name || 'Cellar & Beverages');
        const subcategories = Array.isArray(cat.subcategories) ? cat.subcategories : [cat];

        subcategories.forEach((sub: any, subIdx: number) => {
          const subName = cleanText(sub.name || catName);
          const header = subName !== catName ? `${catName} · ${subName}` : catName;
          const specialities = Array.isArray(sub.specialities) ? sub.specialities : [sub];

          const items: MenuItem[] = [];

          specialities.forEach((spec: any) => {
            const rawItems = Array.isArray(spec.items) ? spec.items : (Array.isArray(spec) ? spec : []);
            rawItems.forEach((it: any, iIdx: number) => {
              const name = cleanText(it.name || it.title || '');
              if (name) {
                const desc = cleanText(it.description || it.vintage || it.region || '');
                items.push({
                  id: `bev_${lIdx}_${catIdx}_${subIdx}_${iIdx}`,
                  title: name,
                  description: desc || undefined,
                  tags: [catName],
                });
              }
            });
          });

          if (items.length > 0) {
            drinksSections.push({
              id: `bev_sec_${lIdx}_${catIdx}_${subIdx}`,
              title: header,
              items,
            });

            allFlatDrinks.push({
              id: `flat_bev_${lIdx}_${catIdx}_${subIdx}`,
              title: rawLegs.length > 1 ? `${origin}→${destination} · ${header}` : header,
              items,
            });
          }
        });
      });
    }

    // 3. DRY SNACKS (drySnack)
    if (leg.drySnack) {
      const snackSubcats = leg.drySnack?.category?.subcategories || leg.drySnack?.subcategories || [];
      if (Array.isArray(snackSubcats)) {
        snackSubcats.forEach((sub: any) => {
          const rawItems = Array.isArray(sub.items) ? sub.items : [];
          rawItems.forEach((it: any, iIdx: number) => {
            const name = cleanText(it.name || it.itemName || '');
            if (name) {
              snacksList.push({
                id: `snack_${lIdx}_${iIdx}`,
                title: name,
                description: cleanText(it.description || '') || undefined,
                tags: ['Delectables'],
              });
            }
          });
        });
      }
    }

    // 4. AMENITIES (amenities)
    if (leg.amenities) {
      const rawAmenityItems = Array.isArray(leg.amenities.items) ? leg.amenities.items : [];
      rawAmenityItems.forEach((it: any, aIdx: number) => {
        const name = cleanText(it.itemName || it.name || '');
        if (name) {
          let imageUrl: string | undefined = undefined;
          const rawImg = it.imagePath || it.imageUrl;
          if (rawImg && typeof rawImg === 'string') {
            imageUrl = rawImg.startsWith('http')
              ? rawImg
              : `${SQ_CONFIG.IMAGE_BASE_URL}${rawImg.replace(/^\/+/, '')}`;
          }

          amenitiesList.push({
            id: `amenity_${lIdx}_${aIdx}`,
            name,
            description: cleanText(it.description || '') || undefined,
            imageUrl,
          });
        }
      });
    }

    legsList.push({
      legId,
      origin,
      destination,
      departureLocalDate: fd.departureLocalDate,
      arrivalLocalDate: fd.arrivalLocalDate,
      mealServices,
      drinks: drinksSections,
      snacks: snacksList,
      amenities: amenitiesList,
    });
  });

  return {
    flightNo: `SQ${flightNo}`,
    date: dateISO,
    cabin,
    aircraftType: data.aircraftType || data.aircraft,
    legs: legsList,
    sections: allFlatDining,
    drinks: allFlatDrinks,
  };
}
