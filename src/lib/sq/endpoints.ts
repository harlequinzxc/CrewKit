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
 * Get known multi-sector / 4-sector legs for flights like SQ12, SQ11, SQ26, SQ25
 */
export function getKnownFlightSectors(flightNo: string): SectorLegOption[] | null {
  const num = normalizeFlightNumber(flightNo);
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
 * Clean numeric string representation (e.g. 'SQ0322' -> '322', 'SQ12' -> '12')
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
 * Extract time string formatted as HH:MM from any SIA API datetime/time string
 * Handles "YYYY-MM-DD HH:MM:SS", "YYYY-MM-DDTHH:MM:SS", "HH:MM", "HHMM", etc.
 */
export function extractTimeHHMM(raw: any): string {
  if (!raw || typeof raw !== 'string') return '';
  const clean = raw.trim();

  // Pattern 1: "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DDTHH:MM:SS"
  const matchDateTime = clean.match(/\d{4}-\d{2}-\d{2}[T\s](\d{1,2}):(\d{2})/);
  if (matchDateTime) {
    return `${matchDateTime[1].padStart(2, '0')}:${matchDateTime[2]}`;
  }

  // Pattern 2: "HH:MM" or "HH:MM:SS"
  const matchTime = clean.match(/^(\d{1,2}):(\d{2})/);
  if (matchTime) {
    return `${matchTime[1].padStart(2, '0')}:${matchTime[2]}`;
  }

  // Pattern 3: 4 digits "1840"
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

  // Match YYYY-MM-DD
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
 * Strictly queries the Singapore Airlines API dynamically with zero hardcoded schedules.
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
    }
  } catch (err) {
    console.warn('Live /getcabin fetch error:', err);
  }

  return {
    flightNo: `SQ${num}`,
    date: dateISO,
    available: [],
  };
}

/**
 * 2. Retrieve Flight Schedule, Sector Timings, & Station Times from Live SIA Feed
 * All flight times, dates, and sector details are pulled dynamically from SQ.
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

          const rawDep = fd.departureLocalDate || fd.departureDate || fd.departureTime || fd.std || dateISO;
          const rawArr = fd.arrivalLocalDate || fd.arrivalDate || fd.arrivalTime || fd.sta || dateISO;
          const rawDepUtc = fd.departureUtcDate || fd.departureUtc;
          const rawArrUtc = fd.arrivalUtcDate || fd.arrivalUtc;

          const depLocal = extractTimeHHMM(rawDep) || (rawDepUtc ? extractTimeHHMM(rawDepUtc) : '09:00');
          const arrLocal = extractTimeHHMM(rawArr) || (rawArrUtc ? extractTimeHHMM(rawArrUtc) : '17:00');
          const depDateLocal = extractDateISO(rawDep, dateISO);
          const arrDateLocal = extractDateISO(rawArr, dateISO);
          const depUtc = extractUtcString(rawDepUtc);
          const arrUtc = extractUtcString(rawArrUtc);

          let blockMinutes = 0;
          if (depUtc && arrUtc) {
            const normalize = (s: string) => {
              const c = s.trim().replace(' ', 'T');
              return c.endsWith('Z') ? c : `${c}Z`;
            };
            const dUtc = Date.parse(normalize(depUtc));
            const aUtc = Date.parse(normalize(arrUtc));
            if (!isNaN(dUtc) && !isNaN(aUtc) && aUtc > dUtc) {
              blockMinutes = Math.round((aUtc - dUtc) / 60000);
            }
          }

          if (blockMinutes <= 0 && depDateLocal && arrDateLocal && depLocal && arrLocal) {
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

  return {
    flightNo: `SQ${num}`,
    date: dateISO,
    sectors: [],
  };
}

/**
 * 3. Retrieve Full Inflight Menu for a Cabin Class from Live SIA Feed (/menu)
 * Includes dishes, coffees, TWG teas, wines, cocktails, snacks, and amenities.
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
 * Parse live SIA /menu response JSON structure into strongly-typed menu objects
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

    // 2. BEVERAGES (beverage.language.EN_UK.categories[]) — Coffees, TWG Teas, Wines, Cocktails
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
              const name = cleanText(it.name || it.title || it.itemName || '');
              if (name) {
                const desc = cleanText(it.description || it.vintage || it.region || it.desc || '');

                let imageUrl: string | undefined = undefined;
                const rawImg = it.imagePathIfeHigh || it.imagePath || it.imageUrl || it.image || spec.imagePath || spec.imageUrl || sub.imagePath;
                if (rawImg && typeof rawImg === 'string') {
                  imageUrl = rawImg.startsWith('http')
                    ? rawImg
                    : `${SQ_CONFIG.IMAGE_BASE_URL}${rawImg.replace(/^\/+/, '')}`;
                }

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

    // 3. DRY SNACKS (drySnack)
    if (leg.drySnack) {
      const snackSubcats = leg.drySnack?.category?.subcategories || leg.drySnack?.subcategories || [];
      if (Array.isArray(snackSubcats)) {
        snackSubcats.forEach((sub: any) => {
          const rawItems = Array.isArray(sub.items) ? sub.items : [];
          rawItems.forEach((it: any, iIdx: number) => {
            const name = cleanText(it.name || it.itemName || '');
            if (name) {
              let imageUrl: string | undefined = undefined;
              const rawImg = it.imagePathIfeHigh || it.imagePath || it.imageUrl || it.image;
              if (rawImg && typeof rawImg === 'string') {
                imageUrl = rawImg.startsWith('http')
                  ? rawImg
                  : `${SQ_CONFIG.IMAGE_BASE_URL}${rawImg.replace(/^\/+/, '')}`;
              }

              snacksList.push({
                id: `snack_${lIdx}_${iIdx}`,
                title: name,
                description: cleanText(it.description || '') || undefined,
                tags: ['Delectables'],
                imageUrl,
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
      originCity,
      destinationCity,
      depTime,
      arrTime,
      depUtc,
      arrUtc,
      depDateLocal,
      arrDateLocal,
      departureLocalDate: fd.departureLocalDate,
      arrivalLocalDate: fd.arrivalLocalDate,
      arrDayShift,
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
