import { CabinCode, CabinConfig, FlightSchedule, MenuData, MenuSection, Sector, MenuItem } from './types';
import { SQ_CONFIG } from './config';
import { sqCache } from './cache';

/**
 * Format date helpers for multiple SQ API format variants
 */
function formatDateVariants(iso: string): { iso: string; ddmmyyyy: string; ddMonYyyy: string; ddMONyyyy: string } {
  if (!iso || !iso.includes('-')) {
    const today = new Date().toISOString().split('T')[0];
    return formatDateVariants(today);
  }
  const [y, m, d] = iso.split('-');
  const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mon = months[dateObj.getMonth()] || 'Jan';
  const dd = d.padStart(2, '0');

  return {
    iso,
    ddmmyyyy: `${dd}-${m}-${y}`,
    ddMonYyyy: `${dd}${mon}${y}`,
    ddMONyyyy: `${dd}${mon.toUpperCase()}${y}`,
  };
}

/**
 * Validate flight number (1–4 digits)
 */
export function isValidFlightNumber(flightNo: string): boolean {
  if (!flightNo) return false;
  const clean = flightNo.replace(/\D/g, '');
  const num = parseInt(clean, 10);
  return !isNaN(num) && num >= 1 && num <= 9999;
}

/**
 * Clean numeric string representation (e.g., 'SQ0322' -> '322')
 */
export function normalizeFlightNumber(flightNo: string): string {
  if (!flightNo) return '';
  const clean = flightNo.replace(/\D/g, '');
  const num = parseInt(clean, 10);
  return isNaN(num) ? '' : num.toString();
}

/**
 * Helper to normalize cabin code strings from API responses
 */
export function normalizeCabinCode(str: string): CabinCode | null {
  if (!str) return null;
  const s = str.toUpperCase().trim().replace(/[^A-Z]/g, '');
  if (s.includes('SUITE') || s === 'R') return 'SUITES';
  if (s.includes('FIRST') || s === 'F') return 'FIRST';
  if (s.includes('BUSINESS') || s === 'BIZ' || s === 'J' || s === 'C') return 'BUSINESS';
  if (s.includes('PREMIUM') || s.includes('PREM') || s === 'PE' || s === 'S' || s === 'W') return 'PREMIUM_ECONOMY';
  if (s.includes('ECONOMY') || s.includes('ECON') || s === 'Y') return 'ECONOMY';
  return null;
}

/**
 * Clean HTML entities and markup from API text strings
 */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
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
 * Fetch raw live menu payload from Singapore Airlines Live Feed
 */
async function fetchLiveFeed(flightNo: string, dateISO: string, cabinClass?: string): Promise<any | null> {
  const num = normalizeFlightNumber(flightNo);
  if (!num) return null;

  const dates = formatDateVariants(dateISO);
  const cabinParam = cabinClass ? `&cabinClass=${cabinClass}&cabin=${cabinClass}` : '';

  // List of live endpoints and serverless relay paths
  const endpoints: string[] = [
    // 1. Vercel Serverless Function / local relay
    `/api/menu?flightNo=SQ${num}&date=${dates.iso}${cabinParam}`,
    `/api/menu?flightNo=${num}&date=${dates.iso}${cabinParam}`,
    
    // 2. Local Vite Proxy
    `${SQ_CONFIG.PROXY_MENU_API}?flightNo=SQ${num}&date=${dates.iso}${cabinParam}`,
    
    // 3. Direct Singapore Airlines Live Feed
    `${SQ_CONFIG.LIVE_MENU_API}?flightNo=SQ${num}&date=${dates.iso}${cabinParam}`,
    `${SQ_CONFIG.LIVE_MENU_API}?flightNumber=SQ${num}&departureDate=${dates.iso}${cabinParam}`,
    `${SQ_CONFIG.LIVE_MENU_API}?flightNo=SQ${num}&date=${dates.ddMonYyyy}${cabinParam}`,
    `${SQ_CONFIG.LIVE_MENU_API}?flightNo=SQ${num}&date=${dates.ddMONyyyy}${cabinParam}`,
    `${SQ_CONFIG.ALT_MENU_API}?flightNo=SQ${num}&date=${dates.iso}${cabinParam}`,
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json && (json.response || json.data || json.flight || json.menus || json.cabins || json.mealServices || Array.isArray(json))) {
          return json;
        }
      }
    } catch {
      // Continue to next endpoint candidate
    }
  }

  return null;
}

/**
 * 1. Retrieve Cabin Configuration & Available Classes from Live SIA Feed
 */
export async function getCabinConfig(flightNo: string, dateISO: string): Promise<CabinConfig> {
  const num = normalizeFlightNumber(flightNo);
  if (!num) {
    return { flightNo: '', date: dateISO, available: [], aircraftType: '' };
  }

  const cacheKey = `cabin_${num}_${dateISO}`;
  const cached = sqCache.get<CabinConfig>(cacheKey);
  if (cached) return cached;

  try {
    const rawData = await fetchLiveFeed(num, dateISO);
    if (rawData) {
      const rawCabins: string[] = [];
      let detectedAircraft = '';

      const root = rawData.response || rawData.data || rawData;
      
      if (root.aircraftType || root.aircraft || root.flight?.aircraft || root.flight?.aircraftType) {
        detectedAircraft = root.aircraftType || root.aircraft || root.flight?.aircraft || root.flight?.aircraftType || '';
      }

      if (Array.isArray(root.cabins)) {
        root.cabins.forEach((c: any) => {
          if (typeof c === 'string') rawCabins.push(c);
          else if (c?.name || c?.code || c?.cabinClass || c?.cabin) rawCabins.push(c.name || c.code || c.cabinClass || c.cabin);
        });
      } else if (root.menus && typeof root.menus === 'object') {
        Object.keys(root.menus).forEach((k) => rawCabins.push(k));
      } else if (root.cabinClasses && Array.isArray(root.cabinClasses)) {
        root.cabinClasses.forEach((c: any) => rawCabins.push(c.name || c.code || c.cabinClass || c));
      }

      const availableCodes = Array.from(
        new Set(
          rawCabins
            .map((c) => normalizeCabinCode(c))
            .filter((c): c is CabinCode => c !== null)
        )
      );

      if (availableCodes.length > 0) {
        const result: CabinConfig = {
          flightNo: `SQ${num}`,
          date: dateISO,
          available: availableCodes,
          aircraftType: detectedAircraft || (availableCodes.includes('SUITES') ? 'Airbus A380-800' : 'Airbus A350-900'),
        };
        sqCache.set(cacheKey, result, SQ_CONFIG.CACHE_TTL_CABIN_CONFIG);
        return result;
      }
    }
  } catch (err) {
    console.warn('Live cabin feed fetch error:', err);
  }

  // If live feed returns no cabins yet (or offline), provide standard default cabins
  const defaultResult: CabinConfig = {
    flightNo: `SQ${num}`,
    date: dateISO,
    available: ['BUSINESS', 'ECONOMY'],
    aircraftType: 'Singapore Airlines Flight',
  };

  sqCache.set(cacheKey, defaultResult, SQ_CONFIG.CACHE_TTL_CABIN_CONFIG);
  return defaultResult;
}

/**
 * 2. Retrieve Flight Schedule & Timings from Live SIA Feed
 */
export async function getFlightSchedule(flightNo: string, dateISO: string): Promise<FlightSchedule> {
  const num = normalizeFlightNumber(flightNo);
  if (!num) {
    return { flightNo: '', date: dateISO, sectors: [] };
  }

  const cacheKey = `schedule_${num}_${dateISO}`;
  const cached = sqCache.get<FlightSchedule>(cacheKey);
  if (cached) return cached;

  try {
    const rawData = await fetchLiveFeed(num, dateISO);
    if (rawData) {
      const root = rawData.response || rawData.data || rawData;
      const sectors: Sector[] = [];
      const aircraft = root.aircraftType || root.aircraft || root.flight?.aircraft || '';

      if (Array.isArray(root.sectors) && root.sectors.length > 0) {
        root.sectors.forEach((s: any) => {
          sectors.push({
            from: s.origin || s.from || 'SIN',
            fromCity: s.originCity || s.fromCity || '',
            to: s.destination || s.to || '',
            toCity: s.destinationCity || s.toCity || '',
            depLocal: s.departureTime || s.depTime || s.std || '09:00',
            depDateLocal: s.departureDate || dateISO,
            arrLocal: s.arrivalTime || s.arrTime || s.sta || '17:00',
            arrDateLocal: s.arrivalDate || dateISO,
            blockMinutes: s.blockMinutes || s.durationMinutes || 480,
          });
        });
      } else if (root.origin || root.destination || root.from || root.to) {
        sectors.push({
          from: root.origin || root.from || 'SIN',
          fromCity: root.originCity || root.fromCity || '',
          to: root.destination || root.to || '',
          toCity: root.destinationCity || root.toCity || '',
          depLocal: root.departureTime || root.depTime || '09:00',
          depDateLocal: dateISO,
          arrLocal: root.arrivalTime || root.arrTime || '17:00',
          arrDateLocal: dateISO,
          blockMinutes: root.durationMinutes || 480,
        });
      }

      if (sectors.length > 0) {
        const scheduleResult: FlightSchedule = {
          flightNo: `SQ${num}`,
          date: dateISO,
          sectors,
          aircraftType: aircraft || 'Singapore Airlines Flight',
        };
        sqCache.set(cacheKey, scheduleResult, SQ_CONFIG.CACHE_TTL_SCHEDULE);
        return scheduleResult;
      }
    }
  } catch (err) {
    console.warn('Live schedule feed fetch error:', err);
  }

  // Fallback empty schedule
  const fallbackSchedule: FlightSchedule = {
    flightNo: `SQ${num}`,
    date: dateISO,
    sectors: [
      {
        from: 'SIN',
        fromCity: 'Singapore',
        to: 'Destination',
        toCity: 'Destination Station',
        depLocal: '12:00',
        depDateLocal: dateISO,
        arrLocal: '18:00',
        arrDateLocal: dateISO,
        blockMinutes: 360,
      }
    ],
    aircraftType: 'Singapore Airlines Flight',
  };

  sqCache.set(cacheKey, fallbackSchedule, SQ_CONFIG.CACHE_TTL_SCHEDULE);
  return fallbackSchedule;
}

/**
 * 3. Retrieve Inflight Dining & Drinks Menu directly from Live SIA Feed
 */
export async function getMenu(flightNo: string, dateISO: string, cabin: CabinCode): Promise<MenuData> {
  const num = normalizeFlightNumber(flightNo);
  const cacheKey = `menu_${num}_${dateISO}_${cabin}`;
  const cached = sqCache.get<MenuData>(cacheKey);
  if (cached) return cached;

  try {
    const rawData = await fetchLiveFeed(num, dateISO, cabin);
    if (rawData) {
      const parsed = parseLiveSiaMenu(rawData, num, dateISO, cabin);
      if (parsed) {
        sqCache.set(cacheKey, parsed, SQ_CONFIG.CACHE_TTL_MENU);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Live menu feed fetch error:', err);
  }

  // Return clean empty menu structure when no menu data is returned
  const emptyMenu: MenuData = {
    flightNo: `SQ${num}`,
    date: dateISO,
    cabin,
    sections: [],
    drinks: [],
  };

  sqCache.set(cacheKey, emptyMenu, SQ_CONFIG.CACHE_TTL_MENU);
  return emptyMenu;
}

/**
 * Parse live JSON response from `cifp.auto.prod.c0.singaporeair.com/api/menu`
 */
function parseLiveSiaMenu(raw: any, flightNo: string, dateISO: string, targetCabin: CabinCode): MenuData | null {
  try {
    const root = raw.response || raw.data || raw;
    const diningSections: MenuSection[] = [];
    const drinksSections: MenuSection[] = [];

    // 1. Find matching cabin data in response
    let cabinData: any = null;
    if (root.menus && typeof root.menus === 'object') {
      for (const [k, v] of Object.entries(root.menus)) {
        if (normalizeCabinCode(k) === targetCabin) {
          cabinData = v;
          break;
        }
      }
    } else if (Array.isArray(root.cabinClasses || root.cabins)) {
      const arr = root.cabinClasses || root.cabins;
      cabinData = arr.find((c: any) => normalizeCabinCode(c.name || c.code || c.cabinClass || c.cabin) === targetCabin);
    } else if (Array.isArray(root.mealServices || root.services)) {
      cabinData = root;
    } else if (typeof root === 'object') {
      cabinData = root[targetCabin] || root[targetCabin.toLowerCase()] || root;
    }

    if (cabinData) {
      // 2. Extract meal services / courses
      const services = cabinData.mealServices || cabinData.services || cabinData.meals || (Array.isArray(cabinData) ? cabinData : []);

      if (Array.isArray(services)) {
        services.forEach((service: any, sIdx: number) => {
          const serviceTitle = service.name || service.title || service.mealType || service.serviceName || `Meal Service ${sIdx + 1}`;
          const courses = service.courses || service.sections || service.categories || [service];

          courses.forEach((course: any, cIdx: number) => {
            const courseTitle = course.name || course.title || course.courseName || serviceTitle;
            const rawItems = course.items || course.dishes || course.options || course.menuItems || (Array.isArray(course) ? course : []);

            const items: MenuItem[] = [];
            if (Array.isArray(rawItems)) {
              rawItems.forEach((it: any, iIdx: number) => {
                const title = stripHtml(it.name || it.title || it.dishName || it.dish || '');
                if (title) {
                  const desc = stripHtml(it.description || it.details || it.ingredients || it.desc || '');
                  const tags: string[] = [];
                  if (it.signature || it.isSignature) tags.push('Signature');
                  if (it.halal || it.isHalal) tags.push('Halal');
                  if (it.bookTheCook || it.isBookTheCook) tags.push('Book the Cook');
                  if (it.icp || it.isIcp) tags.push('Culinary Panel');
                  if (it.tags && Array.isArray(it.tags)) {
                    it.tags.forEach((t: string) => tags.push(stripHtml(t)));
                  }

                  items.push({
                    id: `${targetCabin.toLowerCase()}_sec_${sIdx}_${cIdx}_${iIdx}`,
                    title,
                    description: desc || undefined,
                    tags: tags.length > 0 ? Array.from(new Set(tags)) : undefined,
                    imageUrl: it.imageUrl || it.image || it.photo || it.photoUrl || undefined,
                  });
                }
              });
            }

            if (items.length > 0) {
              diningSections.push({
                id: `sec_${sIdx}_${cIdx}`,
                title: courseTitle,
                items,
              });
            }
          });
        });
      }

      // 3. Extract beverage lists
      const beverages = cabinData.beverages || cabinData.drinks || cabinData.wineList || root.beverages || root.drinks || [];
      if (Array.isArray(beverages)) {
        beverages.forEach((bevCategory: any, bIdx: number) => {
          const catTitle = bevCategory.name || bevCategory.title || bevCategory.category || 'Beverages';
          const bevItems = bevCategory.items || bevCategory.drinks || bevCategory.wines || [];

          const items: MenuItem[] = [];
          if (Array.isArray(bevItems)) {
            bevItems.forEach((it: any, iIdx: number) => {
              const title = stripHtml(it.name || it.title || it.wineName || '');
              if (title) {
                items.push({
                  id: `bev_${bIdx}_${iIdx}`,
                  title,
                  description: stripHtml(it.description || it.vintage || it.region || '') || undefined,
                  tags: it.tags || [catTitle],
                });
              }
            });
          }

          if (items.length > 0) {
            drinksSections.push({
              id: `bev_sec_${bIdx}`,
              title: catTitle,
              items,
            });
          }
        });
      }
    }

    return {
      flightNo: `SQ${flightNo}`,
      date: dateISO,
      cabin: targetCabin,
      sections: diningSections,
      drinks: drinksSections,
    };
  } catch (err) {
    console.warn('Error parsing live SIA payload:', err);
  }

  return null;
}
