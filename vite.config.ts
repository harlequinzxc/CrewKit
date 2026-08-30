import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

function createSiaMockPlugin(): Plugin {
  const parseJsonBody = (req: IncomingMessage): Promise<any> => {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          resolve(JSON.parse(body || '{}'));
        } catch {
          resolve({});
        }
      });
    });
  };

  const handleApiRequest = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url?.split('?')[0];
    if (url !== '/api/getcabin' && url !== '/api/menu' && url !== '/api/cabins') {
      return next();
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      return res.end();
    }

    // Handle /api/cabins endpoint (GET or POST)
    if (url === '/api/cabins') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');

      let rawFlight = '';
      let rawDate = '';

      if (req.method === 'GET') {
        const fullUrl = new URL(req.url || '', 'http://localhost');
        rawFlight = fullUrl.searchParams.get('flight') || fullUrl.searchParams.get('flightNo') || '';
        rawDate = fullUrl.searchParams.get('date') || fullUrl.searchParams.get('flightDate') || '';
      } else if (req.method === 'POST') {
        const body = await parseJsonBody(req);
        rawFlight = body.flight || body.flightNo || body.flightNumber || '';
        rawDate = body.date || body.flightDate || '';
      }

      // 1. Syntax Validation
      const sanitized = (rawFlight || '').trim().toUpperCase().replace(/\s+/g, '');
      const match = sanitized.match(/^(?:SQ|SIA)?0*(\d{1,4})$/);
      if (!match) {
        res.writeHead(400);
        return res.end(
          JSON.stringify({
            ok: false,
            code: 'BAD_INPUT',
            message: 'No flight found',
          })
        );
      }

      const num = parseInt(match[1], 10);
      if (isNaN(num) || num < 1 || num > 9999) {
        res.writeHead(400);
        return res.end(
          JSON.stringify({
            ok: false,
            code: 'BAD_INPUT',
            message: 'No flight found',
          })
        );
      }
      const flightNum = num.toString();

      // 2. Date Validation
      if (!rawDate || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        res.writeHead(400);
        return res.end(
          JSON.stringify({
            ok: false,
            code: 'BAD_DATE',
            message: 'No flight found',
          })
        );
      }
      const [y, m, d] = rawDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) {
        res.writeHead(400);
        return res.end(
          JSON.stringify({
            ok: false,
            code: 'BAD_DATE',
            message: 'No flight found',
          })
        );
      }

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (rawDate < todayStr) {
        res.writeHead(400);
        return res.end(
          JSON.stringify({
            ok: false,
            code: 'BAD_DATE',
            message: 'No flight found',
          })
        );
      }

      // 3. Try upstream check with 12s timeout
      const CABIN_MAPPING: Record<string, { code: string; label: string; short: string }> = {
        FCL: { code: 'FCL', label: 'Suites & First Class', short: 'First' },
        JCL: { code: 'JCL', label: 'Business Class', short: 'Business' },
        SCL: { code: 'SCL', label: 'Premium Economy', short: 'Prem Econ' },
        YCL: { code: 'YCL', label: 'Economy Class', short: 'Economy' },
        FIRST: { code: 'FCL', label: 'Suites & First Class', short: 'First' },
        SUITES: { code: 'FCL', label: 'Suites & First Class', short: 'First' },
        BUSINESS: { code: 'JCL', label: 'Business Class', short: 'Business' },
        PREMIUM_ECONOMY: { code: 'SCL', label: 'Premium Economy', short: 'Prem Econ' },
        ECONOMY: { code: 'YCL', label: 'Economy Class', short: 'Economy' },
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const upstreamRes = await fetch('https://cifp.auto.prod.c0.singaporeair.com/api/getcabin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://inflightmenu.singaporeair.com',
            'Referer': 'https://inflightmenu.singaporeair.com/',
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          },
          body: JSON.stringify({
            carrierId: 'SQ',
            flightNumber: flightNum,
            flightDate: rawDate,
            sessionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (upstreamRes.ok) {
          const upstreamData = await upstreamRes.json();
          const sc = Number(upstreamData?.statusCode);

          if (sc === 101 || sc === 404) {
            res.writeHead(404);
            return res.end(
              JSON.stringify({
                ok: false,
                code: 'NOT_FOUND',
                message: 'No flight found',
              })
            );
          }

          if (sc === 200) {
            const rawCabins: any[] = Array.isArray(upstreamData?.cabinClasses)
              ? upstreamData.cabinClasses
              : Array.isArray(upstreamData?.cabins)
              ? upstreamData.cabins
              : [];

            if (rawCabins.length === 0) {
              res.writeHead(404);
              return res.end(
                JSON.stringify({
                  ok: false,
                  code: 'NO_CABINS',
                  message: 'No flight found',
                })
              );
            }

            const normalizedCabins: Array<{ code: string; label: string; short: string }> = [];
            const seen = new Set<string>();

            for (const c of rawCabins) {
              const codeStr = (typeof c === 'string' ? c : c?.code || c?.name || '').toUpperCase().trim();
              const mapping = CABIN_MAPPING[codeStr];
              if (mapping && !seen.has(mapping.code)) {
                seen.add(mapping.code);
                normalizedCabins.push(mapping);
              }
            }

            res.writeHead(200);
            return res.end(
              JSON.stringify({
                ok: true,
                data: {
                  flight: flightNum,
                  displayFlight: `SQ ${flightNum}`,
                  flightDate: rawDate,
                  aircraftType: upstreamData.aircraftType || upstreamData.aircraft,
                  cabins: normalizedCabins,
                },
              })
            );
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          res.writeHead(504);
          return res.end(
            JSON.stringify({
              ok: false,
              code: 'UPSTREAM_TIMEOUT',
              message: 'Singapore Airlines took too long to respond. Please try again.',
            })
          );
        }
      }

      // Local fallback ONLY for authentic SQ flagship routes if offline
      const KNOWN_DEV_SQ = [11, 12, 21, 22, 23, 24, 25, 26, 308, 317, 319, 322, 221, 222, 830, 833];
      if (KNOWN_DEV_SQ.includes(num)) {
        const cabins =
          num === 12 || num === 11 || num === 26 || num === 25 || num === 322 || num === 308 || num === 221 || num === 830
            ? [
                { code: 'FCL', label: 'Suites & First Class', short: 'First' },
                { code: 'JCL', label: 'Business Class', short: 'Business' },
                { code: 'SCL', label: 'Premium Economy', short: 'Prem Econ' },
                { code: 'YCL', label: 'Economy Class', short: 'Economy' },
              ]
            : [
                { code: 'JCL', label: 'Business Class', short: 'Business' },
                { code: 'SCL', label: 'Premium Economy', short: 'Prem Econ' },
                { code: 'YCL', label: 'Economy Class', short: 'Economy' },
              ];

        res.writeHead(200);
        return res.end(
          JSON.stringify({
            ok: true,
            data: {
              flight: flightNum,
              displayFlight: `SQ ${flightNum}`,
              flightDate: rawDate,
              aircraftType: num === 322 || num === 308 || num === 221 || num === 830 ? '388' : num === 12 || num === 11 || num === 26 || num === 25 ? '77W' : '359',
              cabins,
            },
          })
        );
      }

      res.writeHead(404);
      return res.end(
        JSON.stringify({
          ok: false,
          code: 'NOT_FOUND',
          message: 'No flight found',
        })
      );
    }

    if (req.method !== 'POST') {
      return next();
    }

    const body = await parseJsonBody(req);
    const flightNumber = (body.flightNumber || '').toString().replace(/\D/g, '');
    const flightDate = (body.flightDate || new Date().toISOString().split('T')[0]).toString();
    const num = parseInt(flightNumber, 10);

    const KNOWN_SQ_NUMS = [11, 12, 21, 22, 23, 24, 25, 26, 308, 317, 319, 322, 221, 222, 830, 833];
    const isValidSq = !isNaN(num) && KNOWN_SQ_NUMS.includes(num);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!isValidSq) {
      res.writeHead(404);
      return res.end(
        JSON.stringify({
          statusCode: 404,
          carrierId: 'SQ',
          flightNumber,
          flightDate,
          message: 'No flight found',
          cabinClasses: [],
          legs: [],
        })
      );
    }

    // Resolve accurate SIA Aircraft and Sector Route
    let aircraftType = num === 322 || num === 308 || num === 221 || num === 830 ? '388' : '77W';
    let cabinClasses = ['YCL', 'SCL', 'JCL', 'FCL'];
    let legs: any[] = [];

    if (num === 12) {
      legs = [
        {
          hasSnacks: true,
          hasAmenities: true,
          flightDetails: {
            departureAirportCode: 'SIN',
            arrivalAirportCode: 'NRT',
            departureDate: flightDate,
            departureTime: '09:25',
            departureLocalDate: `${flightDate} 09:25:00`,
            arrivalLocalDate: `${flightDate} 17:30:00`,
            departureUtcDate: `${flightDate} 01:25:00`,
            arrivalUtcDate: `${flightDate} 08:30:00`,
          },
        },
        {
          hasSnacks: false,
          hasAmenities: true,
          flightDetails: {
            departureAirportCode: 'NRT',
            arrivalAirportCode: 'LAX',
            departureDate: flightDate,
            departureTime: '18:40',
            departureLocalDate: `${flightDate} 18:40:00`,
            arrivalLocalDate: `${flightDate} 12:50:00`,
            departureUtcDate: `${flightDate} 09:40:00`,
            arrivalUtcDate: `${flightDate} 19:50:00`,
          },
        },
      ];
    } else if (num === 11) {
      legs = [
        {
          hasSnacks: false,
          hasAmenities: true,
          flightDetails: {
            departureAirportCode: 'LAX',
            arrivalAirportCode: 'NRT',
            departureDate: flightDate,
            departureTime: '14:20',
            departureLocalDate: `${flightDate} 14:20:00`,
            arrivalLocalDate: `${flightDate} 17:50:00`,
            departureUtcDate: `${flightDate} 21:20:00`,
            arrivalUtcDate: `${flightDate} 08:50:00`,
          },
        },
        {
          hasSnacks: true,
          hasAmenities: true,
          flightDetails: {
            departureAirportCode: 'NRT',
            arrivalAirportCode: 'SIN',
            departureDate: flightDate,
            departureTime: '19:00',
            departureLocalDate: `${flightDate} 19:00:00`,
            arrivalLocalDate: `${flightDate} 01:15:00`,
            departureUtcDate: `${flightDate} 10:00:00`,
            arrivalUtcDate: `${flightDate} 17:15:00`,
          },
        },
      ];
    } else if (num === 26) {
      legs = [
        {
          hasSnacks: true,
          hasAmenities: true,
          flightDetails: {
            departureAirportCode: 'SIN',
            arrivalAirportCode: 'FRA',
            departureDate: flightDate,
            departureTime: '23:55',
            departureLocalDate: `${flightDate} 23:55:00`,
            arrivalLocalDate: `${flightDate} 06:20:00`,
            departureUtcDate: `${flightDate} 15:55:00`,
            arrivalUtcDate: `${flightDate} 04:20:00`,
          },
        },
        {
          hasSnacks: false,
          hasAmenities: true,
          flightDetails: {
            departureAirportCode: 'FRA',
            arrivalAirportCode: 'JFK',
            departureDate: flightDate,
            departureTime: '08:35',
            departureLocalDate: `${flightDate} 08:35:00`,
            arrivalLocalDate: `${flightDate} 11:10:00`,
            departureUtcDate: `${flightDate} 06:35:00`,
            arrivalUtcDate: `${flightDate} 15:10:00`,
          },
        },
      ];
    } else if (num === 25) {
      legs = [
        {
          hasSnacks: false,
          hasAmenities: true,
          flightDetails: {
            departureAirportCode: 'JFK',
            arrivalAirportCode: 'FRA',
            departureDate: flightDate,
            departureTime: '20:15',
            departureLocalDate: `${flightDate} 20:15:00`,
            arrivalLocalDate: `${flightDate} 09:50:00`,
            departureUtcDate: `${flightDate} 00:15:00`,
            arrivalUtcDate: `${flightDate} 07:50:00`,
          },
        },
        {
          hasSnacks: true,
          hasAmenities: true,
          flightDetails: {
            departureAirportCode: 'FRA',
            arrivalAirportCode: 'SIN',
            departureDate: flightDate,
            departureTime: '11:40',
            departureLocalDate: `${flightDate} 11:40:00`,
            arrivalLocalDate: `${flightDate} 06:50:00`,
            departureUtcDate: `${flightDate} 09:40:00`,
            arrivalUtcDate: `${flightDate} 22:50:00`,
          },
        },
      ];
    } else {
      legs = [
        {
          hasSnacks: num !== 830 && num !== 833,
          hasAmenities: num !== 830 && num !== 833,
          flightDetails: {
            departureAirportCode: 'SIN',
            arrivalAirportCode: num === 322 || num === 308 ? 'LHR' : num === 221 ? 'SYD' : 'PVG',
            departureDate: flightDate,
            departureTime: '23:30',
            departureLocalDate: `${flightDate} 23:30:00`,
            arrivalLocalDate: `${flightDate} 05:55:00`,
            departureUtcDate: `${flightDate} 15:30:00`,
            arrivalUtcDate: `${flightDate} 04:55:00`,
          },
        },
      ];
    }

    if (url === '/api/getcabin') {
      res.writeHead(200);
      return res.end(
        JSON.stringify({
          statusCode: 200,
          carrierId: 'SQ',
          flightNumber,
          flightDate,
          aircraftType,
          cabinClasses,
          legs,
        })
      );
    }

    // Endpoint: /api/menu
    const menuLegs = legs.map((leg) => {
      const drySnack = leg.hasSnacks
        ? {
            subcategories: [
              {
                items: [
                  {
                    name: 'Artisanal Mixed Truffle Nuts',
                    description: 'Roasted almonds, cashews, and pecans dusted with Italian black summer truffle.',
                    imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/truffle_nuts.jpg',
                  },
                  {
                    name: 'Gourmet Light Bites & Cookies',
                    description: 'Warm chocolate chip cookies and butter shortbreads.',
                    imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/cookies.jpg',
                  },
                ],
              },
            ],
          }
        : null;

      const amenities = leg.hasAmenities
        ? {
            items: [
              {
                itemName: 'Penhaligon’s Luxury Amenity Kit',
                description: 'Bespoke Luna fragrance lip balm, hand lotion, and facial hydrating mist.',
                imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/penhaligons.jpg',
              },
              {
                itemName: 'Lalique Signature Sleepwear & Slippers',
                description: 'Plush unisex lounge sleep suit with matching eye mask.',
                imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/lalique.jpg',
              },
            ],
          }
        : null;

      return {
        flightDetails: leg.flightDetails,
        menu: {
          language: {
            EN_UK: {
              meals: [
                {
                  mealServiceName: 'Dinner',
                  selectionDetails: [
                    {
                      name: 'International Selection',
                      mealCourses: [
                        {
                          category: 'Appetiser',
                          items: [
                            {
                              name: 'Singapore Signature Chicken and Mutton Satay',
                              description: 'Served with spicy peanut sauce, cucumber, and baby onions.',
                              icons: ['WLSGD'],
                              imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/satay.jpg',
                            },
                            {
                              name: 'Marinated Boston Lobster Tail with Caviar',
                              description: 'Fennel confit, granny smith apple gel, and young herb salad.',
                              icons: ['ICP', 'SIGNATURE'],
                              imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/lobster.jpg',
                            },
                          ],
                        },
                        {
                          category: 'Main Course',
                          maxSequence: 1,
                          items: [
                            {
                              name: 'Pan Seared Angus Beef Fillet with Truffle Jus',
                              description: 'Pomme mousseline, butter-glazed baby asparagus, and glazed morel mushrooms.',
                              icons: ['ICP'],
                              imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/beef.jpg',
                            },
                            {
                              name: 'Singapore Hainanese Chicken Rice',
                              description: 'Fragrant ginger chicken rice with tender poached chicken, chilli, and dark sweet soya sauce.',
                              icons: ['WLSGD', 'BTC'],
                              imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/chicken_rice.jpg',
                            },
                            {
                              name: 'Seared Chilean Sea Bass with Yuzu Soy Reduction',
                              description: 'Steamed ginger rice, broccolini, and seasonal Japanese mushrooms.',
                              icons: ['WLSGD'],
                              imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/seabass.jpg',
                            },
                            {
                              name: 'Artisanal Plant-Based Truffle Mushroom Risotto',
                              description: 'Carnaroli rice simmered with wild forest mushrooms, aged parmesan, and micro herbs.',
                              icons: ['VGT'],
                              imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/risotto.jpg',
                            },
                          ],
                        },
                        {
                          category: 'Bakery & Warm Breads',
                          items: [
                            {
                              name: 'Signature Singapore Airlines Garlic Bread',
                              description: 'Freshly baked French baguette slices toasted with rich herb and garlic butter.',
                              icons: ['WLSGD'],
                              imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/garlic_bread.jpg',
                            },
                            {
                              name: 'Artisanal Sourdough Roll & Lavosh',
                              description: 'Warm crusty sourdough roll and crisp sesame lavosh served with cultured salted butter.',
                              imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/sourdough.jpg',
                            },
                          ],
                        },
                        {
                          category: 'Dessert & Cheeses',
                          items: [
                            {
                              name: 'Valrhona Grand Cru Dark Chocolate Ganache Tart',
                              description: 'Madagascar vanilla bean ice cream with raspberry coulis.',
                              imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/chocolate.jpg',
                            },
                            {
                              name: 'International Farmhouse Gourmet Cheese Board',
                              description: 'Brie de Meaux, aged comte, and stilton with water crackers and dried muscatels.',
                              imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/cheese.jpg',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        beverage: {
          language: {
            EN_UK: {
              categories: [
                {
                  name: 'Champagnes & Fine Wines',
                  subcategories: [
                    {
                      name: 'Champagne',
                      specialities: [
                        {
                          items: [
                            {
                              name: 'Krug Grande Cuvée Brut Champagne, France',
                              description: 'Aromas of flowers in bloom, ripe dried fruits, marzipan, and gingerbread.',
                              imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/krug.jpg',
                            },
                            {
                              name: 'Taittinger Comtes de Champagne Blanc de Blancs',
                              description: 'Refined minerality, white peach, toasted brioche, and crisp citrus finish.',
                              imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/taittinger.jpg',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  name: 'TWG Tea Selections',
                  subcategories: [
                    {
                      name: 'Exclusive Blends',
                      imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/twg_tea.jpg',
                      specialities: [
                        {
                          items: [
                            {
                              name: '1837 Black Tea by TWG',
                              description: 'A unique blend of black tea with notes of fruits and flowers from the Bermuda triangle.',
                              imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/twg_tea.jpg',
                            },
                            {
                              name: 'Silver Moon Tea by TWG',
                              description: 'Green tea accented with a grand berry and vanilla bouquet.',
                              imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/twg_green.jpg',
                            },
                            {
                              name: 'Grand Jasmine Green Tea by TWG',
                              description: 'Delicate green tea leaves scented with night-blooming jasmine blossoms.',
                              imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/twg_jasmine.jpg',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  name: 'Specialty illy Coffees',
                  subcategories: [
                    {
                      name: 'Espresso',
                      imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/illy_coffee.jpg',
                      specialities: [
                        {
                          items: [
                            {
                              name: 'Single Origin Arabica Espresso & Cappuccino',
                              description: 'Freshly pulled illy 100% Arabica with rich crema and velvety microfoam.',
                              imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/illy_coffee.jpg',
                            },
                            {
                              name: 'Jamaican Blue Mountain Brewed Coffee',
                              description: 'Mild flavour, delicate body, and clean sweetness.',
                              imagePathIfeHigh: 'https://inflightmenu.singaporeair.com/assets/brewed_coffee.jpg',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        drySnack,
        amenities,
      };
    });

    res.writeHead(200);
    return res.end(
      JSON.stringify({
        statusCode: 200,
        carrierId: 'SQ',
        flightNumber,
        flightDate,
        legs: menuLegs,
      })
    );
  };

  return {
    name: 'sia-api-handler',
    configureServer(server) {
      server.middlewares.use(handleApiRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleApiRequest);
    },
  };
}

export default defineConfig({
  plugins: [react(), createSiaMockPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
});
