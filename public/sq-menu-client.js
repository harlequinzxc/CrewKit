/**
 * Singapore Airlines In-Flight Menu & Schedule API Client
 * ------------------------------------------------------
 * Standalone, zero-dependency JavaScript client for fetching digital inflight menus,
 * cabin classes, beverage lists, snacks, and flight schedules from Singapore Airlines.
 *
 * Compatible with Node.js (v18+), Bun, Deno, Next.js, Vite, React, Vue, Express, and Vanilla JS.
 */

// Singapore Airlines Digital In-Flight Menu Upstream API endpoints
const SIA_CONFIG = {
  BASE_API_URL: 'https://cifp.auto.prod.c0.singaporeair.com/api',
  IMAGE_BASE_URL: 'https://inflightmenu.singaporeair.com/assets/',
  DEFAULT_CARRIER: 'SQ',
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Origin': 'https://inflightmenu.singaporeair.com',
    'Referer': 'https://inflightmenu.singaporeair.com/',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  },
};

/**
 * Standard IATA Airport Code to City Name Lookup Table
 */
export const AIRPORT_CITIES = {
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

/**
 * Generates a standard UUID session ID for SIA API requests
 * @returns {string}
 */
export function generateSessionId() {
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
 * Normalizes user flight number input (e.g., "SQ 012", "sq12", "012", "12" -> "12")
 * @param {string|number} input
 * @returns {string} Digits only (e.g. "12")
 */
export function normalizeFlightNumber(input) {
  if (!input) return '';
  const sanitized = String(input).trim().toUpperCase().replace(/\s+/g, '');
  const match = sanitized.match(/^(?:SQ|SIA)?0*(\d{1,4})$/);
  return match ? match[1] : sanitized.replace(/\D/g, '');
}

/**
 * Resolves full qualified SIA image URL from item, subcategory, or category sources.
 * @param {...(string|object)} sources
 * @returns {string|undefined}
 */
export function extractSqImageUrl(...sources) {
  for (const src of sources) {
    if (!src) continue;
    if (typeof src === 'string') {
      const clean = src.trim();
      if (clean && clean !== 'null' && clean !== 'undefined') {
        if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
        if (clean.startsWith('//')) return `https:${clean}`;
        return `${SIA_CONFIG.IMAGE_BASE_URL}${clean.replace(/^\/+/, '')}`;
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
        src.thumbnailUrl ||
        src.thumbnail;

      if (candidate && typeof candidate === 'string') {
        const clean = candidate.trim();
        if (clean && clean !== 'null' && clean !== 'undefined') {
          if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
          if (clean.startsWith('//')) return `https:${clean}`;
          return `${SIA_CONFIG.IMAGE_BASE_URL}${clean.replace(/^\/+/, '')}`;
        }
      }
    }
  }
  return undefined;
}

/**
 * Strips HTML tags and normalizes whitespace in text strings
 * @param {string} str
 * @returns {string}
 */
function cleanText(str) {
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
 * Maps SIA cabin class aliases to standard 3-letter SIA codes (FCL, JCL, SCL, YCL)
 * @param {string} cabin - 'FIRST', 'SUITES', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY', 'JCL', etc.
 * @returns {'FCL'|'JCL'|'SCL'|'YCL'}
 */
export function normalizeCabinCode(cabin) {
  const upper = String(cabin || '').toUpperCase().trim();
  if (upper.includes('FIRST') || upper.includes('SUITE') || upper === 'FCL' || upper === 'R' || upper === 'F') return 'FCL';
  if (upper.includes('BUS') || upper === 'JCL' || upper === 'C' || upper === 'J') return 'JCL';
  if (upper.includes('PREM') || upper === 'SCL' || upper === 'W' || upper === 'S') return 'SCL';
  return 'YCL'; // Economy
}

/**
 * Extracts English UK content block from SIA localized response
 */
function extractEnUkBlock(obj, keyPrefix) {
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
 * 1. CHECK FLIGHT & GET AVAILABLE CABINS
 * ---------------------------------------
 * Queries Singapore Airlines to check flight validity and discover available cabin classes.
 *
 * @param {string|number} flightNumber - e.g. "11", "SQ12", 322
 * @param {string} departureDateISO - "YYYY-MM-DD"
 * @param {object} [options]
 * @param {string} [options.apiEndpoint] - Custom API proxy endpoint if bypassing browser CORS
 * @param {AbortSignal} [options.signal] - Abort controller signal
 * @returns {Promise<{ ok: boolean, flight: string, date: string, aircraftType?: string, cabins: Array<{ code: string, label: string }>, raw?: any }>}
 */
export async function getFlightCabins(flightNumber, departureDateISO, options = {}) {
  const num = normalizeFlightNumber(flightNumber);
  const date = departureDateISO;
  const endpoint = options.apiEndpoint || `${SIA_CONFIG.BASE_API_URL}/getcabin`;

  const payload = {
    carrierId: SIA_CONFIG.DEFAULT_CARRIER,
    flightNumber: num,
    flightDate: date,
    sessionId: generateSessionId(),
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: SIA_CONFIG.DEFAULT_HEADERS,
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  if (!res.ok) {
    throw new Error(`SIA API Error: HTTP ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const statusCode = Number(data?.statusCode);

  if (statusCode !== 200) {
    return {
      ok: false,
      flight: `SQ${num}`,
      date,
      message: data.message || 'No flight or published menu found for this date.',
      cabins: [],
    };
  }

  const rawCabins = Array.isArray(data.cabinClasses) ? data.cabinClasses : Array.isArray(data.cabins) ? data.cabins : [];
  const aircraftType = data.aircraftType || data.aircraft;

  const CABIN_LABELS = {
    FCL: aircraftType?.includes('380') ? 'Suites' : 'First Class',
    JCL: 'Business Class',
    SCL: 'Premium Economy',
    YCL: 'Economy Class',
  };

  const cabins = rawCabins.map((c) => {
    const code = (typeof c === 'string' ? c : c?.code || c?.name || '').toUpperCase().trim();
    return {
      code,
      label: CABIN_LABELS[code] || code,
    };
  });

  return {
    ok: true,
    flight: `SQ${num}`,
    date,
    aircraftType,
    cabins,
    raw: data,
  };
}

/**
 * 2. FETCH FULL IN-FLIGHT DINING, BEVERAGES & AMENITIES MENU
 * ----------------------------------------------------------
 * Retrieves the comprehensive Singapore Airlines menu:
 * - Dining services (Canapés, Appetisers, Mains, Bakery, Desserts, Cheeses)
 * - Hot & Cold Beverages (TWG Teas, illy Specialty Coffees, Champagnes, Fine Wines, Cocktails, Mocktails, Juices)
 * - Snacks & Noodles on demand
 * - Cabin Amenities (Penhaligon's Kits, Lalique Sleepwear & Slippers)
 *
 * @param {string|number} flightNumber - e.g. "11", "SQ12", 322
 * @param {string} departureDateISO - "YYYY-MM-DD"
 * @param {string} cabinClass - 'FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY', or 'JCL'/'FCL'
 * @param {object} [options]
 * @param {string} [options.apiEndpoint] - Custom API proxy endpoint if bypassing browser CORS
 * @param {AbortSignal} [options.signal] - Abort controller signal
 * @returns {Promise<object>} Structured menu response
 */
export async function getFlightMenu(flightNumber, departureDateISO, cabinClass = 'JCL', options = {}) {
  const num = normalizeFlightNumber(flightNumber);
  const date = departureDateISO;
  const siaCabin = normalizeCabinCode(cabinClass);
  const endpoint = options.apiEndpoint || `${SIA_CONFIG.BASE_API_URL}/menu`;

  const payload = {
    carrierId: SIA_CONFIG.DEFAULT_CARRIER,
    flightNumber: num,
    flightDate: date,
    cabinClass: siaCabin,
    sessionId: generateSessionId(),
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: SIA_CONFIG.DEFAULT_HEADERS,
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  if (!res.ok) {
    throw new Error(`SIA API Error: HTTP ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return parseSiaMenuResponse(data, num, date, siaCabin);
}

/**
 * Parses raw Singapore Airlines /menu JSON response into clean, normalized models
 */
export function parseSiaMenuResponse(data, flightNumber, departureDateISO, cabinClass) {
  const legsList = [];
  const rawLegs = Array.isArray(data.legs) && data.legs.length > 0 ? data.legs : [data];

  rawLegs.forEach((leg, lIdx) => {
    const fd = leg.flightDetails || {};
    const origin = fd.departureAirportCode || fd.origin || 'SIN';
    const destination = fd.arrivalAirportCode || fd.destination || 'SIN';
    const originCity = AIRPORT_CITIES[origin] || origin;
    const destinationCity = AIRPORT_CITIES[destination] || destination;

    // 1. Dining Services & Courses
    const mealServices = [];
    const menuEn = extractEnUkBlock(leg, 'menu');

    if (menuEn && Array.isArray(menuEn.meals)) {
      menuEn.meals.forEach((meal, mIdx) => {
        const mealTitle = cleanText(meal.mealServiceName || meal.name || `Meal Service ${mIdx + 1}`);
        const rawSelections = Array.isArray(meal.selectionDetails) ? meal.selectionDetails : [meal];
        const selections = [];

        rawSelections.forEach((selection, sIdx) => {
          const selectionName = cleanText(selection.name || (rawSelections.length > 1 ? `Option ${sIdx + 1}` : 'Standard Menu'));
          const rawCourses = Array.isArray(selection.mealCourses) ? selection.mealCourses : [];
          const courses = [];

          rawCourses.forEach((course, cIdx) => {
            const courseCategory = cleanText(course.category || course.name || mealTitle);
            const items = [];
            const rawItems = Array.isArray(course.items) ? course.items : [];

            rawItems.forEach((item, iIdx) => {
              const title = cleanText(item.name || item.title || item.dishName || item.itemName || '');
              if (title) {
                items.push({
                  id: `dish_${lIdx}_${mIdx}_${sIdx}_${cIdx}_${iIdx}`,
                  title,
                  description: cleanText(item.description || item.desc || '') || undefined,
                  footnote: cleanText(item.footnote || '') || undefined,
                  tags: Array.isArray(item.icons) ? item.icons.map(cleanText) : [],
                  imageUrl: extractSqImageUrl(item),
                });
              }
            });

            if (items.length > 0) {
              courses.push({
                id: `course_${lIdx}_${mIdx}_${sIdx}_${cIdx}`,
                name: courseCategory,
                items,
              });
            }
          });

          // Breads & Bakery
          const rawBreads = Array.isArray(selection.breadDetails) ? selection.breadDetails : Array.isArray(meal.breadDetails) ? meal.breadDetails : [];
          if (rawBreads.length > 0) {
            const breadItems = rawBreads.map((b, bIdx) => ({
              id: `bread_${lIdx}_${bIdx}`,
              title: cleanText(b.name || b.title || b.itemName || ''),
              description: cleanText(b.description || b.desc || '') || undefined,
              imageUrl: extractSqImageUrl(b, selection),
            })).filter(b => b.title);

            if (breadItems.length > 0) {
              courses.push({
                id: `course_${lIdx}_breads`,
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

    // 2. Hot & Cold Beverages (TWG Teas, illy Coffees, Champagnes, Wines, Cocktails, Spirits, Sodas)
    const drinksSections = [];
    const bevEn = extractEnUkBlock(leg, 'beverage');
    const categories = bevEn?.categories || leg?.beverage?.categories || leg?.beverages || [];

    if (Array.isArray(categories)) {
      categories.forEach((cat, catIdx) => {
        const catName = cleanText(cat.name || 'Drinks & Cellar');
        const subcategories = Array.isArray(cat.subcategories) ? cat.subcategories : [cat];

        subcategories.forEach((sub, subIdx) => {
          const subName = cleanText(sub.name || catName);
          const header = subName !== catName ? `${catName} · ${subName}` : catName;
          const specialities = Array.isArray(sub.specialities) ? sub.specialities : [sub];
          const items = [];

          specialities.forEach((spec) => {
            const rawItems = Array.isArray(spec.items) ? spec.items : (Array.isArray(spec) ? spec : []);
            rawItems.forEach((it, iIdx) => {
              const title = cleanText(it.name || it.title || it.itemName || '');
              if (title) {
                items.push({
                  id: `bev_${lIdx}_${catIdx}_${subIdx}_${iIdx}`,
                  title,
                  description: cleanText(it.description || it.vintage || it.region || it.desc || '') || undefined,
                  category: catName,
                  subcategory: subName,
                  imageUrl: extractSqImageUrl(it, spec, sub, cat),
                });
              }
            });
          });

          if (items.length > 0) {
            drinksSections.push({
              id: `bev_sec_${lIdx}_${catIdx}_${subIdx}`,
              title: header,
              category: catName,
              items,
            });
          }
        });
      });
    }

    // 3. Delectables & Mid-Flight Snacks
    let snacks = null;
    const drySnack = leg.drySnack || leg.drySnacks;
    if (drySnack && typeof drySnack === 'object') {
      const header = cleanText(drySnack.header || '');
      const rawSubs = Array.isArray(drySnack.category?.subcategories)
        ? drySnack.category.subcategories
        : Array.isArray(drySnack.subcategories)
        ? drySnack.subcategories
        : [];

      const groups = rawSubs.map((sub) => {
        const groupName = cleanText(sub.name || sub.title || 'Snacks');
        const rawItems = Array.isArray(sub.items) ? sub.items : [];
        const items = rawItems.map((it) => ({
          name: cleanText(it.name || it.title || it.itemName || ''),
          description: cleanText(it.description || it.desc || '') || undefined,
          imageUrl: extractSqImageUrl(it, sub, drySnack),
        })).filter(i => i.name);

        return { name: groupName, items };
      }).filter(g => g.items.length > 0);

      if (groups.length > 0 || header) {
        snacks = { header: header || undefined, groups };
      }
    }

    // 4. Cabin Amenities
    const amenities = [];
    const amenRoot = extractEnUkBlock(leg, 'amenity') || extractEnUkBlock(leg, 'amenities') || leg.amenities || leg.amenity;
    const rawAmenItems = Array.isArray(amenRoot?.items) ? amenRoot.items : Array.isArray(amenRoot) ? amenRoot : [];

    rawAmenItems.forEach((am, aIdx) => {
      const name = cleanText(am.itemName || am.name || am.title || '');
      if (name) {
        amenities.push({
          id: `amen_${lIdx}_${aIdx}`,
          name,
          description: cleanText(am.description || am.desc || '') || undefined,
          imageUrl: extractSqImageUrl(am, amenRoot),
        });
      }
    });

    legsList.push({
      origin,
      destination,
      originCity,
      destinationCity,
      departureTime: fd.departureTime || fd.departureLocalDate || '',
      arrivalTime: fd.arrivalTime || fd.arrivalLocalDate || '',
      mealServices,
      drinks: drinksSections,
      snacks,
      amenities,
    });
  });

  return {
    flightNumber: `SQ${flightNumber}`,
    departureDate: departureDateISO,
    cabinClass,
    aircraftType: data.aircraftType || data.aircraft,
    legs: legsList,
  };
}

/**
 * 3. FETCH FLIGHT SCHEDULE & SECTOR BLOCK TIMES
 * ---------------------------------------------
 * Queries sector schedules, local departure & arrival times, and calculates flight block minutes.
 *
 * @param {string|number} flightNumber - e.g. "12", "SQ26"
 * @param {string} departureDateISO - "YYYY-MM-DD"
 * @param {object} [options]
 * @returns {Promise<object>}
 */
export async function getFlightSchedule(flightNumber, departureDateISO, options = {}) {
  const cabinsData = await getFlightCabins(flightNumber, departureDateISO, options);
  if (!cabinsData.ok) {
    return { flightNumber: `SQ${flightNumber}`, date: departureDateISO, sectors: [] };
  }

  const legs = Array.isArray(cabinsData.raw?.legs) ? cabinsData.raw.legs : [];
  const sectors = legs.map((leg) => {
    const fd = leg.flightDetails || leg;
    const from = fd.departureAirportCode || 'SIN';
    const to = fd.arrivalAirportCode || 'SIN';
    const depLocal = fd.departureLocalDate ? fd.departureLocalDate.slice(11, 16) : fd.departureTime || '09:00';
    const arrLocal = fd.arrivalLocalDate ? fd.arrivalLocalDate.slice(11, 16) : fd.arrivalTime || '17:00';
    const depDateLocal = fd.departureLocalDate ? fd.departureLocalDate.slice(0, 10) : departureDateISO;
    const arrDateLocal = fd.arrivalLocalDate ? fd.arrivalLocalDate.slice(0, 10) : departureDateISO;

    let blockMinutes = 0;
    try {
      const d1 = new Date(`${depDateLocal}T${depLocal}:00`).getTime();
      const d2 = new Date(`${arrDateLocal}T${arrLocal}:00`).getTime();
      if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
        blockMinutes = Math.round((d2 - d1) / 60000);
      }
    } catch {
      blockMinutes = 360;
    }

    return {
      from,
      fromCity: AIRPORT_CITIES[from] || from,
      to,
      toCity: AIRPORT_CITIES[to] || to,
      depLocal,
      arrLocal,
      depDateLocal,
      arrDateLocal,
      blockMinutes,
    };
  });

  return {
    flightNumber: `SQ${flightNumber}`,
    date: departureDateISO,
    aircraftType: cabinsData.aircraftType,
    sectors,
  };
}

// Export as Default Object as well for easy modular import
export default {
  AIRPORT_CITIES,
  normalizeFlightNumber,
  normalizeCabinCode,
  generateSessionId,
  extractSqImageUrl,
  getFlightCabins,
  getFlightMenu,
  getFlightSchedule,
  parseSiaMenuResponse,
};
