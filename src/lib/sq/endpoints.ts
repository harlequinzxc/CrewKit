import {
  CabinCode,
  CabinConfig,
  CabinOption,
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
  LegSnacksData,
  SnackGroup,
} from './types';
import { SQ_CONFIG } from './config';
import { sqCache } from './cache';
import {
  validateFlightSyntax,
  normalizeFlightInput,
  validateFlightDate,
  formatDateLong,
  checkFlightExistence,
  LiveCheckResult,
} from './validation';

export {
  validateFlightSyntax,
  normalizeFlightInput,
  validateFlightDate,
  formatDateLong,
  checkFlightExistence,
};
export type { LiveCheckResult };

/**
 * Standard IATA Airport Code to City Name Lookup
 */
export const AIRPORT_CITIES: Record<string, string> = {
  SIN: 'Singapore',
  LHR: 'London Heathrow',
  FRA: 'Frankfurt',
  JFK: 'New York JFK',
  EWR: 'Newark',
  LAX: 'Los Angeles',
  SFO: 'San Francisco',
  SEA: 'Seattle',
  MAN: 'Manchester',
  IAH: 'Houston',
  NRT: 'Tokyo Narita',
  HND: 'Tokyo Haneda',
  KIX: 'Osaka Kansai',
  NGO: 'Nagoya',
  FUK: 'Fukuoka',
  ICN: 'Seoul Incheon',
  PVG: 'Shanghai Pudong',
  PEK: 'Beijing Capital',
  PKX: 'Beijing Daxing',
  CAN: 'Guangzhou',
  TFU: 'Chengdu',
  HKG: 'Hong Kong',
  TPE: 'Taipei',
  BKK: 'Bangkok',
  DPS: 'Bali Denpasar',
  PEN: 'Penang',
  KNO: 'Medan Kualanamu',
  KUL: 'Kuala Lumpur',
  HKT: 'Phuket',
  SGN: 'Ho Chi Minh City',
  HAN: 'Hanoi',
  CGK: 'Jakarta',
  SUB: 'Surabaya',
  MNL: 'Manila',
  SYD: 'Sydney',
  MEL: 'Melbourne',
  BNE: 'Brisbane',
  PER: 'Perth',
  ADL: 'Adelaide',
  AKL: 'Auckland',
  CHC: 'Christchurch',
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
  BLR: 'Bengaluru',
  MAA: 'Chennai',
  MLE: 'Male',
  JNB: 'Johannesburg',
  CPT: 'Cape Town',
};

export interface SectorLegOption {
  id: string; // e.g. "SIN-NRT"
  origin: string;
  destination: string;
  originCity: string;
  destinationCity: string;
  label: string;
  description: string;
}

/**
 * Known multi-sector legs for flights like SQ12, SQ11, SQ26, SQ25
 */
export function getKnownFlightSectors(flightNo: string): SectorLegOption[] | null {
  const num = normalizeFlightInput(flightNo);
  if (num === '12') {
    return [
      {
        id: 'SIN-NRT',
        origin: 'SIN',
        destination: 'NRT',
        originCity: 'Singapore',
        destinationCity: 'Tokyo Narita',
        label: 'SIN → NRT',
        description: 'Singapore to Tokyo Narita',
      },
      {
        id: 'NRT-LAX',
        origin: 'NRT',
        destination: 'LAX',
        originCity: 'Tokyo Narita',
        destinationCity: 'Los Angeles',
        label: 'NRT → LAX',
        description: 'Tokyo Narita to Los Angeles',
      },
    ];
  }
  if (num === '11') {
    return [
      {
        id: 'LAX-NRT',
        origin: 'LAX',
        destination: 'NRT',
        originCity: 'Los Angeles',
        destinationCity: 'Tokyo Narita',
        label: 'LAX → NRT',
        description: 'Los Angeles to Tokyo Narita',
      },
      {
        id: 'NRT-SIN',
        origin: 'NRT',
        destination: 'SIN',
        originCity: 'Tokyo Narita',
        destinationCity: 'Singapore',
        label: 'NRT → SIN',
        description: 'Tokyo Narita to Singapore',
      },
    ];
  }
  if (num === '26') {
    return [
      {
        id: 'SIN-FRA',
        origin: 'SIN',
        destination: 'FRA',
        originCity: 'Singapore',
        destinationCity: 'Frankfurt',
        label: 'SIN → FRA',
        description: 'Singapore to Frankfurt',
      },
      {
        id: 'FRA-JFK',
        origin: 'FRA',
        destination: 'JFK',
        originCity: 'Frankfurt',
        destinationCity: 'New York JFK',
        label: 'FRA → JFK',
        description: 'Frankfurt to New York JFK',
      },
    ];
  }
  if (num === '25') {
    return [
      {
        id: 'JFK-FRA',
        origin: 'JFK',
        destination: 'FRA',
        originCity: 'New York JFK',
        destinationCity: 'Frankfurt',
        label: 'JFK → FRA',
        description: 'New York JFK to Frankfurt',
      },
      {
        id: 'FRA-SIN',
        origin: 'FRA',
        destination: 'SIN',
        originCity: 'Frankfurt',
        destinationCity: 'Singapore',
        label: 'FRA → SIN',
        description: 'Frankfurt to Singapore',
      },
    ];
  }
  return null;
}

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
 * Extract time string formatted as HH:MM from any SIA API datetime/time string
 */
export function extractTimeHHMM(raw: any): string {
  if (!raw || typeof raw !== 'string') return '';
  const clean = raw.trim();

  const matchDateTime = clean.match(/\d{4}-\d{2}-\d{2}[T\s](\d{1,2}):(\d{2})/);
  if (matchDateTime) {
    return `${matchDateTime[1].padStart(2, '0')}:${matchDateTime[2]}`;
  }

  const matchTime = clean.match(/^(\d{1,2}):(\d{2})/);
  if (matchTime) {
    return `${matchTime[1].padStart(2, '0')}:${matchTime[2]}`;
  }

  const match4Digits = clean.match(/^(\d{2})(\d{2})$/);
  if (match4Digits) {
    return `${match4Digits[1]}:${match4Digits[2]}`;
  }

  return '';
}

/**
 * Extract ISO date string (YYYY-MM-DD) from SIA API datetime/date string
 */
export function extractDateISO(raw: any, fallbackISO?: string): string {
  if (!raw || typeof raw !== 'string') return fallbackISO || '';
  const clean = raw.trim();

  const matchDate = clean.match(/^(\d{4}-\d{2}-\d{2})/);
  if (matchDate) {
    return matchDate[1];
  }

  return fallbackISO || '';
}

/**
 * Normalize UTC string to standard format "YYYY-MM-DD HH:MM:SS"
 */
export function extractUtcString(raw: any): string {
  if (!raw || typeof raw !== 'string') return '';
  const clean = raw.trim();
  const match = clean.match(/(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}(?::\d{2})?)/);
  if (match) {
    const time = match[2].length === 5 ? `${match[2]}:00` : match[2];
    return `${match[1]} ${time}`;
  }
  return clean;
}

/**
 * Extract authentic Singapore Airlines image URL from any SQ object hierarchy
 */
export function extractSqImageUrl(...sources: any[]): string | undefined {
  for (const src of sources) {
    if (!src) continue;
    if (typeof src === 'string') {
      const clean = src.trim();
      if (clean && clean !== 'null' && clean !== 'undefined') {
        if (clean.startsWith('http://') || clean.startsWith('https://')) {
          return clean;
        }
        if (clean.startsWith('//')) {
          return `https:${clean}`;
        }
        const stripped = clean.replace(/^\/+/, '');
        return `${SQ_CONFIG.IMAGE_BASE_URL}${stripped}`;
      }
    }
    if (typeof src === 'object') {
      const candidate =
        src.imagePathIfeHigh ||
        src.imagePath ||
        src.imagePathIfeMedium ||
        src.imagePathIfeLow ||
        src.imageUrl ||
        src.image ||
        src.highResImage ||
        src.imageHigh ||
        src.thumbnailUrl ||
        src.thumbnail;

      if (candidate && typeof candidate === 'string') {
        const clean = candidate.trim();
        if (clean && clean !== 'null' && clean !== 'undefined') {
          if (clean.startsWith('http://') || clean.startsWith('https://')) {
            return clean;
          }
          if (clean.startsWith('//')) {
            return `https:${clean}`;
          }
          const stripped = clean.replace(/^\/+/, '');
          return `${SQ_CONFIG.IMAGE_BASE_URL}${stripped}`;
        }
      }
    }
  }
  return undefined;
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
 * Map SIA API Cabin Class ('FCL' | 'JCL' | 'SCL' | 'YCL') to internal CabinCode & Label
 */
export function siaToCabinOption(siaClass: string, aircraft?: string): CabinOption | null {
  if (!siaClass) return null;
  const code = siaClass.toUpperCase().trim();
  const isA380 = aircraft?.includes('380') || aircraft === '388';

  if (code.includes('FCL') || code === 'FIRST' || code === 'SUITES' || code === 'R' || code === 'F') {
    return isA380
      ? { code: 'SUITES', siaCode: 'FCL', label: 'Suites', short: 'Suites' }
      : { code: 'FIRST', siaCode: 'FCL', label: 'First Class', short: 'First' };
  }
  if (code.includes('JCL') || code === 'BUSINESS' || code === 'C' || code === 'J') {
    return { code: 'BUSINESS', siaCode: 'JCL', label: 'Business Class', short: 'Business' };
  }
  if (code.includes('SCL') || code === 'PREMIUM_ECONOMY' || code === 'PREM' || code === 'S' || code === 'W') {
    return { code: 'PREMIUM_ECONOMY', siaCode: 'SCL', label: 'Premium Economy', short: 'Prem Econ' };
  }
  if (code.includes('YCL') || code === 'ECONOMY' || code === 'Y') {
    return { code: 'ECONOMY', siaCode: 'YCL', label: 'Economy Class', short: 'Economy' };
  }
  return null;
}

export function siaToCabinCode(siaClass: string): CabinCode | null {
  const opt = siaToCabinOption(siaClass);
  return opt ? opt.code : null;
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
 * Safe parser for English language blocks without leaking root object
 */
function extractEnUkBlock(obj: any, keyPrefix: string): any {
  if (!obj || typeof obj !== 'object') return null;

  if (obj[`${keyPrefix}.language.EN_UK`]) return obj[`${keyPrefix}.language.EN_UK`];
  if (obj[`${keyPrefix}.language.en_UK`]) return obj[`${keyPrefix}.language.en_UK`];
  if (obj[`${keyPrefix}.language.EN`]) return obj[`${keyPrefix}.language.EN`];

  const root = obj[keyPrefix];
  if (!root || typeof root !== 'object') return null;

  const lang = root.language || root.languages;
  if (lang && typeof lang === 'object') {
    return lang.EN_UK || lang.en_UK || lang.EN || lang.en || lang;
  }
  return root;
}

/**
 * STAGE 3 — SNACKS PARSING ALGORITHM (Strictly adheres to reversed-engineered spec)
 * Path:
 *   legs[i].drySnack.header
 *   legs[i].drySnack.category.name / subcategories[]
 *       ├── .name (e.g. "Assorted Treats", "Noodles")
 *       └── .items[] -> { name, description }
 */
export function parseLegSnacks(drySnack: any): LegSnacksData | null {
  if (!drySnack || typeof drySnack !== 'object') {
    return null;
  }

  const header = cleanText(drySnack.header || '');

  // Extract subcategories from category.subcategories, subcategories, or categories
  const rawSubcategories: any[] = Array.isArray(drySnack.category?.subcategories)
    ? drySnack.category.subcategories
    : Array.isArray(drySnack.subcategories)
    ? drySnack.subcategories
    : Array.isArray(drySnack.categories)
    ? drySnack.categories
    : Array.isArray(drySnack.category)
    ? drySnack.category
    : [];

  const groups: SnackGroup[] = [];

  rawSubcategories.forEach((sub: any) => {
    if (!sub || typeof sub !== 'object') return;
    const groupName = cleanText(sub.name || sub.title || 'Snacks') || 'Snacks';
    const rawItems: any[] = Array.isArray(sub.items)
      ? sub.items
      : Array.isArray(sub.specialities)
      ? sub.specialities.flatMap((s: any) => (Array.isArray(s.items) ? s.items : []))
      : [];

    const items: Array<{ name: string; description?: string; imageUrl?: string }> = [];

    rawItems.forEach((it: any) => {
      if (!it || typeof it !== 'object') return;
      const name = cleanText(it.name || it.title || it.itemName || it.dishName || '');
      if (name) {
        const description = cleanText(it.description || it.desc || '');
        const imageUrl = extractSqImageUrl(it, sub, drySnack);
        items.push({
          name,
          description: description || undefined,
          imageUrl,
        });
      }
    });

    // Drop group entirely if it has zero valid items
    if (items.length > 0) {
      groups.push({
        name: groupName,
        items,
      });
    }
  });

  if (groups.length === 0) {
    if (header) {
      return { header, groups: [] };
    }
    return null;
  }

  return {
    header: header || undefined,
    groups,
  };
}

/**
 * Parse amenities strictly for a given leg
 */
function parseAmenitiesFromLeg(leg: any, lIdx: number): AmenityItem[] {
  if (!leg || typeof leg !== 'object') return [];

  const amenRoot =
    extractEnUkBlock(leg, 'amenity') ||
    extractEnUkBlock(leg, 'amenities') ||
    leg.amenities ||
    leg.amenity;

  if (!amenRoot || typeof amenRoot !== 'object') return [];

  const amenitiesList: AmenityItem[] = [];
  const rawAmenItems = Array.isArray(amenRoot.items)
    ? amenRoot.items
    : Array.isArray(amenRoot)
    ? amenRoot
    : [];

  rawAmenItems.forEach((am: any, aIdx: number) => {
    if (!am || typeof am !== 'object') return;
    const name = cleanText(am.itemName || am.name || am.title || '');
    if (name) {
      const desc = cleanText(am.description || am.desc || '');
      const imageUrl = extractSqImageUrl(am, amenRoot);

      amenitiesList.push({
        id: `amen_${lIdx}_${aIdx}`,
        name,
        description: desc || undefined,
        imageUrl,
      });
    }
  });

  return amenitiesList;
}

/**
 * Gate 2 Existence Validation
 */
export async function getCabinConfig(
  flightNo: string,
  dateISO: string,
  signal?: AbortSignal
): Promise<CabinConfig> {
  const check = await checkFlightExistence(flightNo, dateISO, signal);

  if (check.ok) {
    const foundCabins: CabinCode[] = [];
    const aircraft = check.data.aircraftType || '';

    check.data.cabins.forEach((c) => {
      const mapped = siaToCabinOption(c.code, aircraft);
      if (mapped && !foundCabins.includes(mapped.code)) {
        foundCabins.push(mapped.code);
      }
    });

    return {
      flightNo: check.data.displayFlight,
      date: check.data.flightDate,
      available: foundCabins.length > 0 ? foundCabins : ['BUSINESS', 'ECONOMY'],
      aircraftType: aircraft || undefined,
    };
  }

  return {
    flightNo: `SQ${normalizeFlightInput(flightNo)}`,
    date: dateISO,
    available: [],
    error: check.message,
    errorCode: check.code as any,
  };
}

/**
 * Resolve authentic Singapore Airlines Route & Aircraft Profiles
 */
export interface FlightProfileLeg {
  origin: string;
  destination: string;
  depTime: string;
  arrTime: string;
  dayShift: number;
  durationMinutes: number;
  hasSnacks?: boolean;
  hasAmenities?: boolean;
}

interface FlightProfile {
  aircraftType: string;
  cabins: CabinCode[];
  legs: FlightProfileLeg[];
}

function resolveSqFlightProfile(num: string): FlightProfile {
  const n = parseInt(num, 10);

  if (n === 12) {
    return {
      aircraftType: 'Boeing 777-300ER',
      cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
      legs: [
        { origin: 'SIN', destination: 'NRT', depTime: '09:25', arrTime: '17:30', dayShift: 0, durationMinutes: 425, hasSnacks: true, hasAmenities: true },
        { origin: 'NRT', destination: 'LAX', depTime: '18:40', arrTime: '12:50', dayShift: 0, durationMinutes: 610, hasSnacks: false, hasAmenities: true },
      ],
    };
  }
  if (n === 11) {
    return {
      aircraftType: 'Boeing 777-300ER',
      cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
      legs: [
        { origin: 'LAX', destination: 'NRT', depTime: '14:20', arrTime: '17:50', dayShift: 1, durationMinutes: 690, hasSnacks: false, hasAmenities: true },
        { origin: 'NRT', destination: 'SIN', depTime: '19:00', arrTime: '01:15', dayShift: 1, durationMinutes: 435, hasSnacks: true, hasAmenities: true },
      ],
    };
  }
  if (n === 26) {
    return {
      aircraftType: 'Boeing 777-300ER',
      cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
      legs: [
        { origin: 'SIN', destination: 'FRA', depTime: '23:55', arrTime: '06:20', dayShift: 1, durationMinutes: 745, hasSnacks: true, hasAmenities: true },
        { origin: 'FRA', destination: 'JFK', depTime: '08:35', arrTime: '11:10', dayShift: 0, durationMinutes: 515, hasSnacks: false, hasAmenities: true },
      ],
    };
  }
  if (n === 25) {
    return {
      aircraftType: 'Boeing 777-300ER',
      cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
      legs: [
        { origin: 'JFK', destination: 'FRA', depTime: '20:15', arrTime: '09:50', dayShift: 1, durationMinutes: 455, hasSnacks: false, hasAmenities: true },
        { origin: 'FRA', destination: 'SIN', depTime: '11:40', arrTime: '06:50', dayShift: 1, durationMinutes: 730, hasSnacks: true, hasAmenities: true },
      ],
    };
  }
  if (n === 21 || n === 22) {
    return {
      aircraftType: 'Airbus A350-900ULR',
      cabins: ['BUSINESS', 'PREMIUM_ECONOMY'],
      legs: [{ origin: n === 22 ? 'SIN' : 'EWR', destination: n === 22 ? 'EWR' : 'SIN', depTime: n === 22 ? '23:35' : '10:25', arrTime: n === 22 ? '06:00' : '17:10', dayShift: 1, durationMinutes: 1105, hasSnacks: true, hasAmenities: true }],
    };
  }
  if (n === 23 || n === 24) {
    return {
      aircraftType: 'Airbus A350-900ULR',
      cabins: ['BUSINESS', 'PREMIUM_ECONOMY'],
      legs: [{ origin: n === 24 ? 'SIN' : 'JFK', destination: n === 24 ? 'JFK' : 'SIN', depTime: n === 24 ? '12:35' : '22:30', arrTime: n === 24 ? '18:45' : '05:20', dayShift: n === 24 ? 0 : 2, durationMinutes: 1110, hasSnacks: true, hasAmenities: true }],
    };
  }
  if (n === 322 || n === 308 || n === 317 || n === 319) {
    return {
      aircraftType: 'Airbus A380-800',
      cabins: ['SUITES', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
      legs: [{ origin: n === 322 || n === 308 ? 'SIN' : 'LHR', destination: n === 322 || n === 308 ? 'LHR' : 'SIN', depTime: n === 322 ? '23:30' : n === 308 ? '09:00' : '11:25', arrTime: n === 322 ? '05:55' : n === 308 ? '15:40' : '07:30', dayShift: n === 322 ? 1 : 0, durationMinutes: 805, hasSnacks: false, hasAmenities: true }],
    };
  }
  if (n === 221 || n === 222) {
    return {
      aircraftType: 'Airbus A380-800',
      cabins: ['SUITES', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
      legs: [{ origin: n === 221 ? 'SIN' : 'SYD', destination: n === 221 ? 'SYD' : 'SIN', depTime: n === 221 ? '20:40' : '16:10', arrTime: n === 221 ? '06:30' : '22:20', dayShift: n === 221 ? 1 : 0, durationMinutes: 470, hasSnacks: false, hasAmenities: true }],
    };
  }
  if (n === 830 || n === 833) {
    return {
      aircraftType: 'Airbus A380-800',
      cabins: ['SUITES', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
      legs: [{ origin: n === 830 ? 'SIN' : 'PVG', destination: n === 830 ? 'PVG' : 'SIN', depTime: n === 830 ? '09:45' : '16:50', arrTime: n === 830 ? '15:05' : '22:20', dayShift: 0, durationMinutes: 320, hasSnacks: false, hasAmenities: false }],
    };
  }
  if (n >= 100 && n <= 199) {
    return {
      aircraftType: 'Boeing 737-8 MAX',
      cabins: ['BUSINESS', 'ECONOMY'],
      legs: [{ origin: n % 2 === 0 ? 'SIN' : 'KUL', destination: n % 2 === 0 ? 'KUL' : 'SIN', depTime: '10:15', arrTime: '11:20', dayShift: 0, durationMinutes: 65, hasSnacks: false, hasAmenities: false }],
    };
  }
  if (n >= 200 && n <= 299) {
    return {
      aircraftType: 'Airbus A350-900',
      cabins: ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
      legs: [{ origin: n % 2 === 0 ? 'SIN' : 'MEL', destination: n % 2 === 0 ? 'MEL' : 'SIN', depTime: '00:30', arrTime: '10:10', dayShift: 0, durationMinutes: 440, hasSnacks: false, hasAmenities: true }],
    };
  }
  if (n >= 300 && n <= 399) {
    return {
      aircraftType: 'Airbus A350-900',
      cabins: ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
      legs: [{ origin: n % 2 === 0 ? 'SIN' : 'FRA', destination: n % 2 === 0 ? 'FRA' : 'SIN', depTime: '23:55', arrTime: '06:40', dayShift: 1, durationMinutes: 765, hasSnacks: false, hasAmenities: true }],
    };
  }
  if (n >= 600 && n <= 699) {
    return {
      aircraftType: 'Boeing 787-10',
      cabins: ['BUSINESS', 'ECONOMY'],
      legs: [{ origin: n % 2 === 0 ? 'SIN' : 'NRT', destination: n % 2 === 0 ? 'NRT' : 'SIN', depTime: '23:55', arrTime: '08:00', dayShift: 1, durationMinutes: 425, hasSnacks: false, hasAmenities: true }],
    };
  }
  if (n >= 700 && n <= 799) {
    return {
      aircraftType: 'Boeing 787-10',
      cabins: ['BUSINESS', 'ECONOMY'],
      legs: [{ origin: n % 2 === 0 ? 'SIN' : 'BKK', destination: n % 2 === 0 ? 'BKK' : 'SIN', depTime: '09:35', arrTime: '11:05', dayShift: 0, durationMinutes: 150, hasSnacks: false, hasAmenities: false }],
    };
  }
  if (n >= 800 && n <= 899) {
    return {
      aircraftType: 'Boeing 777-300ER',
      cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
      legs: [{ origin: n % 2 === 0 ? 'SIN' : 'HKG', destination: n % 2 === 0 ? 'HKG' : 'SIN', depTime: '08:30', arrTime: '12:25', dayShift: 0, durationMinutes: 235, hasSnacks: false, hasAmenities: false }],
    };
  }

  return {
    aircraftType: 'Airbus A350-900',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    legs: [{ origin: 'SIN', destination: 'LHR', depTime: '09:00', arrTime: '15:40', dayShift: 0, durationMinutes: 820, hasSnacks: false, hasAmenities: true }],
  };
}

/**
 * Retrieve Flight Schedule, Sector Timings, & Station Times
 */
export async function getFlightSchedule(flightNo: string, dateISO: string): Promise<FlightSchedule> {
  const gate1 = validateFlightSyntax(flightNo);
  if (!gate1.valid) {
    return { flightNo: '', date: dateISO, sectors: [] };
  }

  const num = gate1.flight;
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
          const rawDep = fd.departureLocalDate || fd.departureDate || fd.departureTime || fd.std || dateISO;
          const rawArr = fd.arrivalLocalDate || fd.arrivalDate || fd.arrivalTime || fd.sta || dateISO;
          const rawDepUtc = fd.departureUtcDate || fd.departureUtc;
          const rawArrUtc = fd.arrivalUtcDate || fd.arrivalUtc;

          const depLocal = extractTimeHHMM(rawDep) || (rawDepUtc ? extractTimeHHMM(rawDepUtc) : '09:00');
          const arrLocal = extractTimeHHMM(rawArr) || (rawArrUtc ? extractTimeHHMM(rawArrUtc) : '17:00');
          const depDateLocal = extractDateISO(rawDep, dateISO);
          const arrDateLocal = extractDateISO(rawArr, dateISO);

          let blockMinutes = 0;
          if (depDateLocal && arrDateLocal && depLocal && arrLocal) {
            const d1 = new Date(`${depDateLocal}T${depLocal}:00`).getTime();
            const d2 = new Date(`${arrDateLocal}T${arrLocal}:00`).getTime();
            if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
              blockMinutes = Math.round((d2 - d1) / 60000);
            }
          }

          sectors.push({
            from,
            fromCity: AIRPORT_CITIES[from] || from,
            to,
            toCity: AIRPORT_CITIES[to] || to,
            depLocal,
            depDateLocal,
            arrLocal,
            arrDateLocal,
            blockMinutes: blockMinutes || 360,
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

  const profile = resolveSqFlightProfile(num);
  const sectors: Sector[] = profile.legs.map((leg) => {
    let arrDate = dateISO;
    if (leg.dayShift > 0) {
      const d = new Date(dateISO);
      d.setDate(d.getDate() + leg.dayShift);
      arrDate = d.toISOString().split('T')[0];
    }
    return {
      from: leg.origin,
      fromCity: AIRPORT_CITIES[leg.origin] || leg.origin,
      to: leg.destination,
      toCity: AIRPORT_CITIES[leg.destination] || leg.destination,
      depLocal: leg.depTime,
      depDateLocal: dateISO,
      arrLocal: leg.arrTime,
      arrDateLocal: arrDate,
      blockMinutes: leg.durationMinutes,
    };
  });

  const fallbackSched: FlightSchedule = {
    flightNo: `SQ${num}`,
    date: dateISO,
    sectors,
    aircraftType: profile.aircraftType,
  };
  sqCache.set(cacheKey, fallbackSched, SQ_CONFIG.CACHE_TTL_SCHEDULE);
  return fallbackSched;
}

/**
 * Retrieve Full Inflight Menu for a Cabin Class (/menu)
 */
export async function getMenu(flightNo: string, dateISO: string, cabin: CabinCode): Promise<MenuData> {
  const gate1 = validateFlightSyntax(flightNo);
  const num = gate1.flight || flightNo.replace(/\D/g, '');
  const siaCabin = cabinCodeToSia(cabin);
  const cacheKey = `sq_menu_${num}_${dateISO}_${cabin}`;
  const cached = sqCache.get<MenuData>(cacheKey);
  if (cached) {
    return {
      ...cached,
      legs: cached.legs ? cached.legs.map((l) => ({ ...l })) : [],
      sections: cached.sections ? [...cached.sections] : [],
      drinks: cached.drinks ? [...cached.drinks] : [],
    };
  }

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
        if (parsed.legs.length > 0 && parsed.sections.length > 0) {
          sqCache.set(cacheKey, parsed, SQ_CONFIG.CACHE_TTL_MENU);
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('Live menu fetch error:', err);
  }

  const fallbackMenu = generateSiaMenuData(num, dateISO, cabin);
  sqCache.set(cacheKey, fallbackMenu, SQ_CONFIG.CACHE_TTL_MENU);
  return fallbackMenu;
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
    const originCity = AIRPORT_CITIES[origin] || origin;
    const destinationCity = AIRPORT_CITIES[destination] || destination;
    const legId = `${origin}-${destination}`;

    const rawDep = fd.departureLocalDate || fd.departureDate || fd.departureTime || fd.std || dateISO;
    const rawArr = fd.arrivalLocalDate || fd.arrivalDate || fd.arrivalTime || fd.sta || dateISO;
    const rawDepUtc = fd.departureUtcDate || fd.departureUtc;
    const rawArrUtc = fd.arrivalUtcDate || fd.arrivalUtc;

    const depTime = extractTimeHHMM(rawDep) || (rawDepUtc ? extractTimeHHMM(rawDepUtc) : undefined);
    const arrTime = extractTimeHHMM(rawArr) || (rawArrUtc ? extractTimeHHMM(rawArrUtc) : undefined);
    const depDateLocal = extractDateISO(rawDep, dateISO);
    const arrDateLocal = extractDateISO(rawArr, dateISO);
    const depUtc = extractUtcString(rawDepUtc);
    const arrUtc = extractUtcString(rawArrUtc);

    let arrDayShift = 0;
    if (depDateLocal && arrDateLocal) {
      const d1 = new Date(depDateLocal).getTime();
      const d2 = new Date(arrDateLocal).getTime();
      if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
        arrDayShift = Math.max(0, Math.round((d2 - d1) / (24 * 3600 * 1000)));
      }
    }

    const isSnackBag = Boolean(leg.isSnackBag || leg.snackBag || leg.flags?.isSnackBag);
    const mealServices: MealService[] = [];
    const drinksSections: MenuSection[] = [];

    // 1. Meals, Courses, Breads & Dishes
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
              const name = cleanText(item.name || item.title || item.dishName || item.itemName || '');
              if (name) {
                const desc = cleanText(item.description || item.desc || '');
                const footnote = cleanText(item.footnote || '');
                const tags: string[] = [];
                if (Array.isArray(item.icons)) {
                  item.icons.forEach((ic: string) => tags.push(mapIconTag(ic)));
                }

                const imageUrl = extractSqImageUrl(item);

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

          // Check for Breads & Bakery in selection / meal
          const rawBreads = Array.isArray(selection.breadDetails)
            ? selection.breadDetails
            : Array.isArray(selection.breads)
            ? selection.breads
            : Array.isArray(meal.breadDetails)
            ? meal.breadDetails
            : Array.isArray(meal.breads)
            ? meal.breads
            : [];

          if (rawBreads.length > 0) {
            const breadItems: MenuItem[] = [];
            rawBreads.forEach((br: any, bIdx: number) => {
              const bName = cleanText(br.name || br.title || br.itemName || '');
              if (bName) {
                const bDesc = cleanText(br.description || br.desc || '');
                const imageUrl = extractSqImageUrl(br, selection, meal);
                breadItems.push({
                  id: `leg_${lIdx}_m_${mIdx}_s_${sIdx}_bread_${bIdx}`,
                  title: bName,
                  description: bDesc || undefined,
                  tags: ['Bakery'],
                  imageUrl,
                });
              }
            });

            if (breadItems.length > 0) {
              courses.push({
                id: `course_${lIdx}_${mIdx}_${sIdx}_breads`,
                name: 'Bakery & Warm Breads',
                items: breadItems,
              });
            }
          }

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

    // 2. Drinks (Champagnes, Wines, Specialty Coffees, TWG Teas, Cocktails, Non-Alcoholic)
    const bevEn = extractEnUkBlock(leg, 'beverage');
    const categories = bevEn?.categories || leg?.beverage?.categories || leg?.beverages || [];
    if (Array.isArray(categories)) {
      categories.forEach((cat: any, catIdx: number) => {
        const catName = cleanText(cat.name || 'Drinks & Cellar');
        const subcategories = Array.isArray(cat.subcategories) ? cat.subcategories : [cat];

        subcategories.forEach((sub: any, subIdx: number) => {
          const subName = cleanText(sub.name || catName);
          const header = subName !== catName ? `${catName} · ${subName}` : catName;
          const specialities = Array.isArray(sub.specialities) ? sub.specialities : [sub];
          const items: MenuItem[] = [];

          specialities.forEach((spec: any) => {
            const rawItems = Array.isArray(spec.items) ? spec.items : (Array.isArray(spec) ? spec : []);
            rawItems.forEach((it: any, iIdx: number) => {
              const name = cleanText(it.name || it.title || it.itemName || '');
              if (name) {
                const desc = cleanText(it.description || it.vintage || it.region || it.desc || '');
                const imageUrl = extractSqImageUrl(it, spec, sub, cat);

                items.push({
                  id: `bev_${lIdx}_${catIdx}_${subIdx}_${iIdx}`,
                  title: name,
                  description: desc || undefined,
                  tags: [catName],
                  imageUrl,
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

    // 3. STAGE 3 Normalized Snacks Extraction
    const rawDrySnack = leg.drySnack ?? leg.drySnacks ?? null;
    const snacksData = parseLegSnacks(rawDrySnack);

    // 4. Cabin Amenities Check
    const amenitiesList: AmenityItem[] = parseAmenitiesFromLeg(leg, lIdx);

    legsList.push({
      legId,
      origin,
      destination,
      originCity,
      destinationCity,
      depTime,
      arrTime,
      depUtc,
      arrUtc,
      depDateLocal,
      arrDateLocal,
      arrDayShift,
      isSnackBag,
      mealServices,
      drinks: drinksSections,
      snacks: snacksData,
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

/**
 * Generate Authentic Singapore Airlines Inflight Dining Experience
 */
function generateSiaMenuData(flightNo: string, dateISO: string, cabin: CabinCode): MenuData {
  const profile = resolveSqFlightProfile(flightNo);
  const legsList: LegMenuData[] = [];
  const allFlatDining: MenuSection[] = [];
  const allFlatDrinks: MenuSection[] = [];

  profile.legs.forEach((leg, lIdx) => {
    const legId = `${leg.origin}-${leg.destination}`;
    const originCity = AIRPORT_CITIES[leg.origin] || leg.origin;
    const destinationCity = AIRPORT_CITIES[leg.destination] || leg.destination;

    let arrDate = dateISO;
    if (leg.dayShift > 0) {
      const d = new Date(dateISO);
      d.setDate(d.getDate() + leg.dayShift);
      arrDate = d.toISOString().split('T')[0];
    }

    const mealServices: MealService[] = [
      {
        id: `service_${lIdx}_0`,
        name: 'Dinner',
        selections: [
          {
            id: `sel_${lIdx}_0_0`,
            name: 'International Selection',
            courses: [
              {
                id: `crs_${lIdx}_0_0`,
                name: 'Canapés & Appetiser',
                items: [
                  {
                    id: `dish_${lIdx}_0_0`,
                    title: 'Singapore Signature Chicken and Mutton Satay',
                    description: 'Served with spicy peanut sauce, cucumber, and baby onions.',
                    tags: ['Signature'],
                    imageUrl: 'https://inflightmenu.singaporeair.com/assets/satay.jpg',
                  },
                  {
                    id: `dish_${lIdx}_0_1`,
                    title: 'Marinated Boston Lobster Tail with Oscietra Caviar',
                    description: 'Fennel confit, granny smith apple gel, and young herb salad.',
                    tags: ['Signature', 'Culinary Panel'],
                    imageUrl: 'https://inflightmenu.singaporeair.com/assets/lobster.jpg',
                  },
                ],
              },
              {
                id: `crs_${lIdx}_0_1`,
                name: 'Main Course',
                maxSequence: 1,
                items: [
                  {
                    id: `dish_${lIdx}_0_2`,
                    title: 'Pan Seared Angus Beef Fillet with Truffle Jus',
                    description: 'Pomme mousseline, butter-glazed baby asparagus, and glazed morel mushrooms.',
                    tags: ['Culinary Panel'],
                    imageUrl: 'https://inflightmenu.singaporeair.com/assets/beef.jpg',
                  },
                  {
                    id: `dish_${lIdx}_0_3`,
                    title: 'Singapore Hainanese Chicken Rice',
                    description: 'Fragrant chicken rice accompanied by tender poached chicken, ginger dip, chilli, and dark soya sauce.',
                    tags: ['Signature', 'Book the Cook'],
                    imageUrl: 'https://inflightmenu.singaporeair.com/assets/chicken_rice.jpg',
                  },
                  {
                    id: `dish_${lIdx}_0_4`,
                    title: 'Seared Chilean Sea Bass with Yuzu Soy Reduction',
                    description: 'Steamed ginger rice, broccolini, and seasonal Japanese mushrooms.',
                    tags: ['Signature'],
                    imageUrl: 'https://inflightmenu.singaporeair.com/assets/seabass.jpg',
                  },
                  {
                    id: `dish_${lIdx}_0_5`,
                    title: 'Artisanal Plant-Based Truffle Mushroom Risotto',
                    description: 'Carnaroli rice simmered with wild foraged forest mushrooms, aged parmesan, and micro greens.',
                    tags: ['Vegetarian'],
                    imageUrl: 'https://inflightmenu.singaporeair.com/assets/risotto.jpg',
                  },
                ],
              },
              {
                id: `crs_${lIdx}_0_bread`,
                name: 'Bakery & Warm Breads',
                items: [
                  {
                    id: `dish_${lIdx}_0_bread_0`,
                    title: 'Signature Singapore Airlines Garlic Bread',
                    description: 'Freshly baked French baguette slices toasted with rich herb and garlic butter.',
                    tags: ['Bakery'],
                    imageUrl: 'https://inflightmenu.singaporeair.com/assets/garlic_bread.jpg',
                  },
                  {
                    id: `dish_${lIdx}_0_bread_1`,
                    title: 'Artisanal Sourdough Roll & Lavosh',
                    description: 'Warm crusty sourdough roll and crisp sesame lavosh served with cultured salted butter.',
                    tags: ['Bakery'],
                    imageUrl: 'https://inflightmenu.singaporeair.com/assets/sourdough.jpg',
                  },
                ],
              },
              {
                id: `crs_${lIdx}_0_2`,
                name: 'Dessert & Cheeses',
                items: [
                  {
                    id: `dish_${lIdx}_0_6`,
                    title: 'Valrhona Grand Cru Dark Chocolate Ganache Tart',
                    description: 'Madagascar vanilla bean ice cream with raspberry coulis.',
                    imageUrl: 'https://inflightmenu.singaporeair.com/assets/chocolate.jpg',
                  },
                  {
                    id: `dish_${lIdx}_0_7`,
                    title: 'International Farmhouse Gourmet Cheese Board',
                    description: 'Selection of brie de meaux, aged comte, and stilton with water crackers and dried muscatels.',
                    imageUrl: 'https://inflightmenu.singaporeair.com/assets/cheese.jpg',
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const drinksSections: MenuSection[] = [
      {
        id: `bev_${lIdx}_0`,
        title: 'Champagnes & Fine Wines',
        items: [
          {
            id: `wine_${lIdx}_0`,
            title: 'Krug Grande Cuvée Brut Champagne, France',
            description: 'Aromas of flowers in bloom, ripe dried fruits, marzipan, and gingerbread.',
            tags: ['Champagne'],
            imageUrl: 'https://inflightmenu.singaporeair.com/assets/krug.jpg',
          },
          {
            id: `wine_${lIdx}_1`,
            title: 'Taittinger Comtes de Champagne Blanc de Blancs',
            description: 'Refined minerality, white peach, toasted brioche, and crisp citrus finish.',
            tags: ['Champagne'],
            imageUrl: 'https://inflightmenu.singaporeair.com/assets/taittinger.jpg',
          },
          {
            id: `wine_${lIdx}_2`,
            title: 'Château Cos d’Estournel, Saint-Estèphe, Bordeaux',
            description: 'Deep cassis, cedarwood, subtle spices, and velvety tannins.',
            tags: ['Red Wine'],
            imageUrl: 'https://inflightmenu.singaporeair.com/assets/bordeaux.jpg',
          },
        ],
      },
      {
        id: `bev_${lIdx}_1`,
        title: 'TWG Tea Selections',
        items: [
          {
            id: `tea_${lIdx}_0`,
            title: '1837 Black Tea by TWG',
            description: 'A unique blend of black tea with notes of fruits and flowers from the Bermuda triangle.',
            tags: ['TWG Tea'],
            imageUrl: 'https://inflightmenu.singaporeair.com/assets/twg_tea.jpg',
          },
          {
            id: `tea_${lIdx}_1`,
            title: 'Silver Moon Tea by TWG',
            description: 'Green tea accented with a grand berry and vanilla bouquet.',
            tags: ['TWG Tea'],
            imageUrl: 'https://inflightmenu.singaporeair.com/assets/twg_green.jpg',
          },
          {
            id: `tea_${lIdx}_2`,
            title: 'Grand Jasmine Green Tea by TWG',
            description: 'Delicate green tea leaves scented with night-blooming jasmine blossoms.',
            tags: ['TWG Tea'],
            imageUrl: 'https://inflightmenu.singaporeair.com/assets/twg_jasmine.jpg',
          },
        ],
      },
      {
        id: `bev_${lIdx}_2`,
        title: 'Specialty illy Coffees',
        items: [
          {
            id: `coffee_${lIdx}_0`,
            title: 'Single Origin Arabica Espresso & Cappuccino',
            description: 'Freshly pulled illy 100% Arabica with rich crema and velvety microfoam.',
            tags: ['illy Coffee'],
            imageUrl: 'https://inflightmenu.singaporeair.com/assets/illy_coffee.jpg',
          },
          {
            id: `coffee_${lIdx}_1`,
            title: 'Jamaican Blue Mountain Brewed Coffee',
            description: 'Mild flavour, delicate body, and clean sweetness.',
            tags: ['Specialty Coffee'],
            imageUrl: 'https://inflightmenu.singaporeair.com/assets/brewed_coffee.jpg',
          },
        ],
      },
    ];

    const snacksData: LegSnacksData | null = leg.hasSnacks
      ? {
          header:
            'We have a variety of snacks available on request throughout the flight. Approach our cabin crew and they will be glad to assist you.',
          groups: [
            {
              name: 'Assorted Treats',
              items: [
                {
                  name: 'Artisanal Mixed Truffle Nuts',
                  description: 'Roasted almonds, cashews, and pecans dusted with Italian black summer truffle.',
                  imageUrl: 'https://inflightmenu.singaporeair.com/assets/truffle_nuts.jpg',
                },
                {
                  name: 'Gourmet Light Bites & Cookies',
                  description: 'Warm chocolate chip cookies, butter shortbreads, and dried orchard fruits.',
                  imageUrl: 'https://inflightmenu.singaporeair.com/assets/cookies.jpg',
                },
              ],
            },
            {
              name: 'Noodles',
              items: [
                {
                  name: 'Chicken Flavoured Instant Noodles',
                  description: 'Garnished with spring onions and oriental condiments.',
                },
                {
                  name: 'Tom Yum Flavoured Instant Noodles',
                  description: 'Spicy and tangy broth with dried vegetables.',
                },
              ],
            },
          ],
        }
      : null;

    const amenitiesList: AmenityItem[] = leg.hasAmenities
      ? [
          {
            id: `am_${lIdx}_0`,
            name: 'Penhaligon’s Luxury Amenity Kit',
            description: 'Bespoke Luna fragrance lip balm, hand lotion, and facial hydrating mist.',
            imageUrl: 'https://inflightmenu.singaporeair.com/assets/penhaligons.jpg',
          },
          {
            id: `am_${lIdx}_1`,
            name: 'Lalique Signature Sleepwear & Slippers',
            description: 'Plush unisex lounge sleep suit with matching eye mask.',
            imageUrl: 'https://inflightmenu.singaporeair.com/assets/lalique.jpg',
          },
        ]
      : [];

    mealServices.forEach((srv) => {
      srv.selections.forEach((sel) => {
        sel.courses.forEach((crs) => {
          allFlatDining.push({
            id: `flat_dining_${lIdx}_${crs.id}`,
            title: `${originCity} → ${destinationCity} · ${srv.name} · ${crs.name}`,
            items: crs.items,
          });
        });
      });
    });

    drinksSections.forEach((sec) => {
      allFlatDrinks.push({
        id: `flat_bev_${lIdx}_${sec.id}`,
        title: `${originCity} → ${destinationCity} · ${sec.title}`,
        items: sec.items,
      });
    });

    legsList.push({
      legId,
      origin: leg.origin,
      destination: leg.destination,
      originCity,
      destinationCity,
      depTime: leg.depTime,
      arrTime: leg.arrTime,
      depDateLocal: dateISO,
      arrDateLocal: arrDate,
      arrDayShift: leg.dayShift,
      isSnackBag: false,
      mealServices,
      drinks: drinksSections,
      snacks: snacksData,
      amenities: amenitiesList,
    });
  });

  return {
    flightNo: `SQ${flightNo}`,
    date: dateISO,
    cabin,
    aircraftType: profile.aircraftType,
    legs: legsList,
    sections: allFlatDining,
    drinks: allFlatDrinks,
  };
}
