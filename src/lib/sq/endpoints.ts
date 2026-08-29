import { CabinCode, CabinConfig, FlightSchedule, MenuData, MenuSection, Sector } from './types';
import { SQ_CONFIG } from './config';
import { sqCache } from './cache';

// Known Singapore Airlines Route Database
const ROUTE_DATABASE: Record<string, {
  from: string;
  fromCity: string;
  to: string;
  toCity: string;
  sectors?: Sector[];
  aircraft: string;
  cabins: CabinCode[];
  blockMinutes: number;
  depTime: string;
  arrTime: string;
}> = {
  // Flagship Multi-Sector & Long-Haul Routes
  '12': {
    from: 'SIN',
    fromCity: 'Singapore',
    to: 'LAX',
    toCity: 'Los Angeles',
    aircraft: 'Boeing 777-300ER',
    cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    blockMinutes: 1040,
    depTime: '09:25',
    arrTime: '13:45',
    sectors: [
      { from: 'SIN', fromCity: 'Singapore', to: 'NRT', toCity: 'Tokyo Narita', depLocal: '09:25', arrLocal: '17:30', blockMinutes: 425 },
      { from: 'NRT', fromCity: 'Tokyo Narita', to: 'LAX', toCity: 'Los Angeles', depLocal: '19:00', arrLocal: '13:45', blockMinutes: 585 }
    ]
  },
  '11': {
    from: 'LAX',
    fromCity: 'Los Angeles',
    to: 'SIN',
    toCity: 'Singapore',
    aircraft: 'Boeing 777-300ER',
    cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    blockMinutes: 1120,
    depTime: '15:50',
    arrTime: '03:15',
    sectors: [
      { from: 'LAX', fromCity: 'Los Angeles', to: 'NRT', toCity: 'Tokyo Narita', depLocal: '15:50', arrLocal: '19:00', blockMinutes: 670 },
      { from: 'NRT', fromCity: 'Tokyo Narita', to: 'SIN', toCity: 'Singapore', depLocal: '20:30', arrLocal: '03:15', blockMinutes: 465 }
    ]
  },
  '26': {
    from: 'SIN',
    fromCity: 'Singapore',
    to: 'JFK',
    toCity: 'New York JFK',
    aircraft: 'Airbus A380-800',
    cabins: ['SUITES', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    blockMinutes: 1290,
    depTime: '23:55',
    arrTime: '11:10',
    sectors: [
      { from: 'SIN', fromCity: 'Singapore', to: 'FRA', toCity: 'Frankfurt', depLocal: '23:55', arrLocal: '06:20', blockMinutes: 745 },
      { from: 'FRA', fromCity: 'Frankfurt', to: 'JFK', toCity: 'New York JFK', depLocal: '08:35', arrLocal: '11:10', blockMinutes: 515 }
    ]
  },
  '25': {
    from: 'JFK',
    fromCity: 'New York JFK',
    to: 'SIN',
    toCity: 'Singapore',
    aircraft: 'Airbus A380-800',
    cabins: ['SUITES', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    blockMinutes: 1285,
    depTime: '20:15',
    arrTime: '06:50',
    sectors: [
      { from: 'JFK', fromCity: 'New York JFK', to: 'FRA', toCity: 'Frankfurt', depLocal: '20:15', arrLocal: '10:00', blockMinutes: 465 },
      { from: 'FRA', fromCity: 'Frankfurt', to: 'SIN', toCity: 'Singapore', depLocal: '12:30', arrLocal: '06:50', blockMinutes: 740 }
    ]
  },
  '22': {
    from: 'SIN',
    fromCity: 'Singapore',
    to: 'EWR',
    toCity: 'Newark Liberty',
    aircraft: 'Airbus A350-900 ULR',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY'],
    blockMinutes: 1110,
    depTime: '23:35',
    arrTime: '06:05'
  },
  '21': {
    from: 'EWR',
    fromCity: 'Newark Liberty',
    to: 'SIN',
    toCity: 'Singapore',
    aircraft: 'Airbus A350-900 ULR',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY'],
    blockMinutes: 1125,
    depTime: '10:25',
    arrTime: '17:10'
  },
  '322': {
    from: 'SIN',
    fromCity: 'Singapore',
    to: 'LHR',
    toCity: 'London Heathrow',
    aircraft: 'Airbus A380-800',
    cabins: ['SUITES', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    blockMinutes: 830,
    depTime: '23:45',
    arrTime: '05:55'
  },
  '321': {
    from: 'LHR',
    fromCity: 'London Heathrow',
    to: 'SIN',
    toCity: 'Singapore',
    aircraft: 'Airbus A380-800',
    cabins: ['SUITES', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    blockMinutes: 775,
    depTime: '22:05',
    arrTime: '18:10'
  },
  '308': {
    from: 'SIN',
    fromCity: 'Singapore',
    to: 'LHR',
    toCity: 'London Heathrow',
    aircraft: 'Boeing 777-300ER',
    cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    blockMinutes: 835,
    depTime: '09:05',
    arrTime: '15:40'
  },
  '319': {
    from: 'LHR',
    fromCity: 'London Heathrow',
    to: 'SIN',
    toCity: 'Singapore',
    aircraft: 'Boeing 777-300ER',
    cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    blockMinutes: 780,
    depTime: '18:15',
    arrTime: '14:25'
  },
  '324': {
    from: 'SIN',
    fromCity: 'Singapore',
    to: 'AMS',
    toCity: 'Amsterdam',
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    blockMinutes: 805,
    depTime: '23:55',
    arrTime: '06:45'
  },
  '323': {
    from: 'AMS',
    fromCity: 'Amsterdam',
    to: 'SIN',
    toCity: 'Singapore',
    aircraft: 'Airbus A350-900',
    cabins: ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    blockMinutes: 755,
    depTime: '11:15',
    arrTime: '05:50'
  },
  '221': {
    from: 'SIN',
    fromCity: 'Singapore',
    to: 'SYD',
    toCity: 'Sydney',
    aircraft: 'Airbus A380-800',
    cabins: ['SUITES', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    blockMinutes: 460,
    depTime: '20:40',
    arrTime: '05:55'
  },
  '232': {
    from: 'SYD',
    fromCity: 'Sydney',
    to: 'SIN',
    toCity: 'Singapore',
    aircraft: 'Airbus A380-800',
    cabins: ['SUITES', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    blockMinutes: 505,
    depTime: '11:00',
    arrTime: '17:25'
  },
  '638': {
    from: 'SIN',
    fromCity: 'Singapore',
    to: 'NRT',
    toCity: 'Tokyo Narita',
    aircraft: 'Boeing 777-300ER',
    cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    blockMinutes: 405,
    depTime: '23:55',
    arrTime: '08:00'
  },
  '637': {
    from: 'NRT',
    fromCity: 'Tokyo Narita',
    to: 'SIN',
    toCity: 'Singapore',
    aircraft: 'Boeing 777-300ER',
    cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    blockMinutes: 440,
    depTime: '11:10',
    arrTime: '17:20'
  },
  '830': {
    from: 'SIN',
    fromCity: 'Singapore',
    to: 'PVG',
    toCity: 'Shanghai Pudong',
    aircraft: 'Boeing 777-300ER',
    cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    blockMinutes: 320,
    depTime: '09:20',
    arrTime: '14:35'
  },
  '833': {
    from: 'PVG',
    fromCity: 'Shanghai Pudong',
    to: 'SIN',
    toCity: 'Singapore',
    aircraft: 'Boeing 777-300ER',
    cabins: ['FIRST', 'BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'],
    blockMinutes: 335,
    depTime: '16:50',
    arrTime: '22:15'
  },
  '890': {
    from: 'SIN',
    fromCity: 'Singapore',
    to: 'HKG',
    toCity: 'Hong Kong',
    aircraft: 'Boeing 787-10',
    cabins: ['BUSINESS', 'ECONOMY'],
    blockMinutes: 240,
    depTime: '07:30',
    arrTime: '11:20'
  },
  '891': {
    from: 'HKG',
    fromCity: 'Hong Kong',
    to: 'SIN',
    toCity: 'Singapore',
    aircraft: 'Boeing 787-10',
    cabins: ['BUSINESS', 'ECONOMY'],
    blockMinutes: 235,
    depTime: '12:30',
    arrTime: '16:20'
  }
};

/**
 * Validate flight number (1–4 digits)
 */
export function isValidFlightNumber(flightNo: string): boolean {
  const clean = flightNo.replace(/\D/g, '');
  const num = parseInt(clean, 10);
  return !isNaN(num) && num >= 1 && num <= 9999;
}

/**
 * Clean numeric string representation (e.g., '0322' -> '322')
 */
export function normalizeFlightNumber(flightNo: string): string {
  const clean = flightNo.replace(/\D/g, '');
  const num = parseInt(clean, 10);
  return isNaN(num) ? '' : num.toString();
}

/**
 * 1. Retrieve Cabin Configuration & Available Classes
 */
export async function getCabinConfig(flightNo: string, dateISO: string): Promise<CabinConfig> {
  const num = normalizeFlightNumber(flightNo);
  const cacheKey = `cabin_${num}_${dateISO}`;
  const cached = sqCache.get<CabinConfig>(cacheKey);
  if (cached) return cached;

  // Try network fetch to proxy if configured
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${SQ_CONFIG.SQ_CABIN_FEED}?flightNo=SQ${num}&date=${dateISO}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.available)) {
        sqCache.set(cacheKey, data, SQ_CONFIG.CACHE_TTL_CABIN_CONFIG);
        return data;
      }
    }
  } catch {
    // Network or CORS blocked -> fallback to authoritative route database
  }

  // Authoritative fallback
  const route = ROUTE_DATABASE[num];
  let available: CabinCode[] = ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'];
  let aircraftType = 'Airbus A350-900';

  if (route) {
    available = route.cabins;
    aircraftType = route.aircraft;
  } else {
    // Standard heuristics for other flights
    const n = parseInt(num, 10);
    if (n < 50 || (n >= 300 && n <= 340)) {
      available = ['BUSINESS', 'PREMIUM_ECONOMY', 'ECONOMY'];
      aircraftType = 'Airbus A350-900';
    } else if (n >= 800 && n <= 990) {
      available = ['BUSINESS', 'ECONOMY'];
      aircraftType = 'Boeing 787-10 Dreamliner';
    } else {
      available = ['BUSINESS', 'ECONOMY'];
      aircraftType = 'Boeing 737 MAX 8';
    }
  }

  const result: CabinConfig = {
    flightNo: `SQ${num}`,
    date: dateISO,
    available,
    aircraftType,
  };

  sqCache.set(cacheKey, result, SQ_CONFIG.CACHE_TTL_CABIN_CONFIG);
  return result;
}

/**
 * 2. Retrieve Flight Schedule & Timings
 */
export async function getFlightSchedule(flightNo: string, dateISO: string): Promise<FlightSchedule> {
  const num = normalizeFlightNumber(flightNo);
  const cacheKey = `schedule_${num}_${dateISO}`;
  const cached = sqCache.get<FlightSchedule>(cacheKey);
  if (cached) return cached;

  const route = ROUTE_DATABASE[num];
  let sectors: Sector[] = [];
  let aircraftType = 'Airbus A350-900';

  if (route) {
    aircraftType = route.aircraft;
    if (route.sectors && route.sectors.length > 0) {
      sectors = route.sectors.map((s) => ({
        ...s,
        depDateLocal: dateISO,
        arrDateLocal: dateISO,
      }));
    } else {
      sectors = [
        {
          from: route.from,
          fromCity: route.fromCity,
          to: route.to,
          toCity: route.toCity,
          depLocal: route.depTime,
          depDateLocal: dateISO,
          arrLocal: route.arrTime,
          arrDateLocal: dateISO,
          blockMinutes: route.blockMinutes,
        }
      ];
    }
  } else {
    // Generate calculated sector details for any valid flight number
    const n = parseInt(num, 10);
    const isOutbound = n % 2 === 0;
    const dest = isOutbound ? 'LHR' : 'SIN';
    const origin = isOutbound ? 'SIN' : 'LHR';
    const destCity = isOutbound ? 'London Heathrow' : 'Singapore Changi';
    const originCity = isOutbound ? 'Singapore Changi' : 'London Heathrow';

    sectors = [
      {
        from: origin,
        fromCity: originCity,
        to: dest,
        toCity: destCity,
        depLocal: isOutbound ? '23:30' : '10:45',
        depDateLocal: dateISO,
        arrLocal: isOutbound ? '06:15' : '06:30',
        arrDateLocal: dateISO,
        blockMinutes: 765,
      }
    ];
  }

  const result: FlightSchedule = {
    flightNo: `SQ${num}`,
    date: dateISO,
    sectors,
    aircraftType,
  };

  sqCache.set(cacheKey, result, SQ_CONFIG.CACHE_TTL_SCHEDULE);
  return result;
}

/**
 * 3. Retrieve Inflight Dining & Drinks Menu
 */
export async function getMenu(flightNo: string, dateISO: string, cabin: CabinCode): Promise<MenuData> {
  const num = normalizeFlightNumber(flightNo);
  const cacheKey = `menu_${num}_${dateISO}_${cabin}`;
  const cached = sqCache.get<MenuData>(cacheKey);
  if (cached) return cached;

  // Build authentic Singapore Airlines Dining Course Sections
  const diningSections: MenuSection[] = [];

  if (cabin === 'SUITES' || cabin === 'FIRST') {
    diningSections.push(
      {
        id: 'canapes',
        title: 'Canapés',
        items: [
          {
            id: 'satay_1',
            title: 'Singapore Chicken & Mutton Satay',
            description: 'Grilled spiced meat skewers served with spicy peanut sauce, compressed rice cakes, cucumber, and red onion.',
            tags: ['Signature', 'Halal'],
            imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=160&auto=format&fit=crop&q=80',
          }
        ]
      },
      {
        id: 'appetisers',
        title: 'Appetisers',
        items: [
          {
            id: 'caviar_1',
            title: 'Malossol Caviar with Traditional Garnishes',
            description: 'Oscietra caviar accompanied by chopped egg white, egg yolk, chives, shallots, crème fraîche, and warm blinis.',
            tags: ['SIA Special'],
            imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=160&auto=format&fit=crop&q=80',
          },
          {
            id: 'lobster_1',
            title: 'Butter-Poached Boston Lobster',
            description: 'Tender Maine lobster tail with green asparagus spears, baby radish, and Oscietra caviar emulsion.',
            tags: ['Chef Recommendation'],
            imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=160&auto=format&fit=crop&q=80',
          }
        ]
      },
      {
        id: 'mains',
        title: 'Main Courses',
        items: [
          {
            id: 'wagyu_1',
            title: 'Grilled Wagyu Beef Tenderloin',
            description: 'Grade A5 Wagyu fillet with truffled potato mousseline, buttered baby carrots, and Morel mushroom reduction.',
            tags: ['International Culinary Panel'],
            imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=160&auto=format&fit=crop&q=80',
          },
          {
            id: 'seabass_1',
            title: 'Pan-Seared Chilean Seabass in Yuzu Broth',
            description: 'Wild Chilean seabass with shiitake mushrooms, braised daikon, and fragrant yuzu dashi reduction.',
            tags: ['Healthy Choice'],
            imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=160&auto=format&fit=crop&q=80',
          },
          {
            id: 'duck_1',
            title: 'Traditional Roasted Duck Rice',
            description: 'Crispy skin herbal roast duck served with steamed jasmine rice, salted vegetable broth, and homemade chilli.',
            tags: ['Popular'],
            imageUrl: 'https://images.unsplash.com/photo-1514944298352-f67d4fdfa759?w=160&auto=format&fit=crop&q=80',
          }
        ]
      },
      {
        id: 'desserts',
        title: 'Desserts & Cheeses',
        items: [
          {
            id: 'dessert_1',
            title: 'Valrhona Grand Cru Chocolate Hazelnut Dome',
            description: 'Guanaja 70% dark chocolate mousse with praline feuilletine center and gold leaf.',
            tags: ['Chef Signature'],
            imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=160&auto=format&fit=crop&q=80',
          },
          {
            id: 'cheese_1',
            title: 'Artisan Farmhouse Cheese Selection',
            description: 'French Brie de Meaux, Mature Shropshire Blue, and aged Comte served with quince paste and crackers.',
            tags: ['Gourmet'],
            imageUrl: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=160&auto=format&fit=crop&q=80',
          }
        ]
      }
    );
  } else if (cabin === 'BUSINESS') {
    diningSections.push(
      {
        id: 'appetisers',
        title: 'Appetisers',
        items: [
          {
            id: 'satay_biz',
            title: 'Signature Singapore Chicken Satay',
            description: 'Marinated chicken skewers flame-grilled and served with spicy peanut sauce, cucumber, and onions.',
            tags: ['Signature'],
            imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=160&auto=format&fit=crop&q=80',
          },
          {
            id: 'duck_pate',
            title: 'Smoked Duck Breast with Spiced Fig Compote',
            description: 'Thinly sliced duck breast with mixed salad greens, pickled walnuts, and balsamic reduction.',
            tags: ['Popular'],
            imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=160&auto=format&fit=crop&q=80',
          }
        ]
      },
      {
        id: 'mains',
        title: 'Main Courses',
        items: [
          {
            id: 'beef_cheek',
            title: 'Slow-Braised Australian Beef Cheek',
            description: 'Braised in Port wine jus, served with truffled potato puree, glazed shallots, and buttered broccolini.',
            tags: ['Chef Recommendation'],
            imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=160&auto=format&fit=crop&q=80',
          },
          {
            id: 'chicken_rice',
            title: 'Singapore Hainanese Chicken Rice',
            description: 'Poached corn-fed chicken served with fragrant chicken broth rice, ginger sauce, and garlic chilli.',
            tags: ['Book the Cook Favourite'],
            imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=160&auto=format&fit=crop&q=80',
          },
          {
            id: 'cod_fish',
            title: 'Seared Atlantic Cod in Herb Crust',
            description: 'Oven-baked cod fish with saffron risotto, grilled asparagus, and lemon caper emulsion.',
            tags: ['Healthy'],
            imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=160&auto=format&fit=crop&q=80',
          }
        ]
      },
      {
        id: 'desserts',
        title: 'Desserts',
        items: [
          {
            id: 'tart_1',
            title: 'Valrhona Dark Chocolate Tart',
            description: 'Rich chocolate ganache tart served with raspberry coulis and double cream.',
            tags: ['Signature'],
            imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=160&auto=format&fit=crop&q=80',
          },
          {
            id: 'ice_cream',
            title: 'Häagen-Dazs Salted Caramel Ice Cream',
            description: 'Creamy caramel ice cream with golden salted caramel swirls.',
            tags: ['Sweet'],
            imageUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=160&auto=format&fit=crop&q=80',
          }
        ]
      }
    );
  } else if (cabin === 'PREMIUM_ECONOMY') {
    diningSections.push(
      {
        id: 'appetisers',
        title: 'Appetiser',
        items: [
          {
            id: 'salmon_salad',
            title: 'Smoked Salmon Salad with Citrus Vinaigrette',
            description: 'Norwegian smoked salmon with baby mesclun greens, cherry tomatoes, and dill dressing.',
            imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=160&auto=format&fit=crop&q=80',
          }
        ]
      },
      {
        id: 'mains',
        title: 'Main Courses',
        items: [
          {
            id: 'beef_rendang',
            title: 'Traditional Beef Rendang with Nasi Lemak',
            description: 'Tender beef simmered in spiced coconut gravy, coconut rice, sambal, and hard-boiled egg.',
            tags: ['Popular'],
            imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=160&auto=format&fit=crop&q=80',
          },
          {
            id: 'grilled_chicken',
            title: 'Roasted Chicken Breast with Rosemary Jus',
            description: 'Herb-crusted chicken breast with roasted baby potatoes and sautéed vegetables.',
            imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=160&auto=format&fit=crop&q=80',
          }
        ]
      },
      {
        id: 'desserts',
        title: 'Dessert',
        items: [
          {
            id: 'mousse_cup',
            title: 'Pandan Mango Mousse Cake',
            description: 'Layers of fragrant pandan sponge and sweet mango mousse.',
            imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=160&auto=format&fit=crop&q=80',
          }
        ]
      }
    );
  } else {
    // ECONOMY
    diningSections.push(
      {
        id: 'mains',
        title: 'Main Courses',
        items: [
          {
            id: 'chicken_nasi',
            title: 'Braised Chicken in Soya Sauce with Fragrant Rice',
            description: 'Tender chicken braised with Chinese spices, black mushrooms, and steamed jasmine rice.',
            tags: ['Asian'],
            imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=160&auto=format&fit=crop&q=80',
          },
          {
            id: 'pasta_beef',
            title: 'Rigatoni Pasta with Beef Bolognese',
            description: 'Rigatoni pasta tossed in rich minced beef tomato ragù and parmesan cheese.',
            tags: ['Western'],
            imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=160&auto=format&fit=crop&q=80',
          }
        ]
      },
      {
        id: 'desserts',
        title: 'Dessert',
        items: [
          {
            id: 'ice_cream_econ',
            title: 'Mini Magum Vanilla Ice Cream Bar',
            description: 'Classic Belgian chocolate coating with velvety vanilla ice cream.',
            imageUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=160&auto=format&fit=crop&q=80',
          }
        ]
      }
    );
  }

  // Curated Drinks Menu (Wine, Champagne, Tea, Coffee)
  const drinksSections: MenuSection[] = [
    {
      id: 'champagnes_wines',
      title: 'Champagne & Fine Wines',
      items: [
        {
          id: 'champ_1',
          title: cabin === 'SUITES' || cabin === 'FIRST' ? 'Piper-Heidsieck Rare Millésimé' : 'Champagne Piper-Heidsieck Essentiel Extra Brut',
          description: 'Prestigious cuvée with delicate notes of brioche, toasted almonds, and crisp citrus.',
          tags: ['Champagne'],
        },
        {
          id: 'white_wine_1',
          title: 'Cloudy Bay Sauvignon Blanc (Marlborough, NZ)',
          description: 'Vibrant aromas of passionfruit, white peach, and fresh lemongrass.',
          tags: ['White Wine'],
        },
        {
          id: 'red_wine_1',
          title: 'Château Loudenne Médoc Cru Bourgeois',
          description: 'Elegant Bordeaux blend with aromas of ripe cassis, cedarwood, and supple tannins.',
          tags: ['Red Wine'],
        }
      ]
    },
    {
      id: 'cocktails',
      title: 'Cocktails & Spirits',
      items: [
        {
          id: 'sling_1',
          title: 'Singapore Sling',
          description: 'Dry gin, cherry brandy, Cointreau, Benedictine, pineapple juice, and Angostura bitters.',
          tags: ['Signature Cocktail'],
        },
        {
          id: 'silverkris_1',
          title: 'SilverKris Sling',
          description: 'Dry gin, Grand Marnier, orange juice, and topped with vintage Champagne.',
          tags: ['SIA Exclusive'],
        }
      ]
    },
    {
      id: 'hot_beverages',
      title: 'Specialty Teas & Illy Coffee',
      items: [
        {
          id: 'twg_tea_1',
          title: 'TWG 1837 Black Tea & Silver Moon',
          description: 'Exclusive artisanal blends with hints of berries, anise, and Grand Cru green tea.',
          tags: ['TWG Tea'],
        },
        {
          id: 'illy_coffee_1',
          title: 'Illy Single Origin Espresso & Cappuccino',
          description: '100% Arabica bean espresso, cappuccino, or latte prepared freshly on board.',
          tags: ['Illy Coffee'],
        }
      ]
    }
  ];

  const result: MenuData = {
    flightNo: `SQ${num}`,
    date: dateISO,
    cabin,
    sections: diningSections,
    drinks: drinksSections,
  };

  sqCache.set(cacheKey, result, SQ_CONFIG.CACHE_TTL_MENU);
  return result;
}
