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
    if (url !== '/api/getcabin' && url !== '/api/menu') {
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

    if (req.method !== 'POST') {
      return next();
    }

    const body = await parseJsonBody(req);
    const flightNumber = (body.flightNumber || '').toString().replace(/\D/g, '');
    const flightDate = (body.flightDate || new Date().toISOString().split('T')[0]).toString();
    const num = parseInt(flightNumber, 10);

    // Singapore Airlines commercial flight validation: 11-998
    const isValidSq =
      !isNaN(num) &&
      num >= 11 &&
      num <= 998 &&
      ((num >= 11 && num <= 38) || (num >= 51 && num <= 52) || (num >= 100 && num <= 998));

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
          message: `Flight SQ${flightNumber} not found on ${flightDate}.`,
          cabinClasses: [],
          legs: [],
        })
      );
    }

    // Resolve accurate SIA Aircraft and Sector Route
    let aircraftType = '359'; // A350-900 default
    let cabinClasses = ['YCL', 'SCL', 'JCL'];
    let legs: any[] = [];

    if (num === 12) {
      aircraftType = '77W';
      cabinClasses = ['YCL', 'SCL', 'JCL', 'FCL'];
      legs = [
        {
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
      aircraftType = '77W';
      cabinClasses = ['YCL', 'SCL', 'JCL', 'FCL'];
      legs = [
        {
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
      aircraftType = '77W';
      cabinClasses = ['YCL', 'SCL', 'JCL', 'FCL'];
      legs = [
        {
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
      aircraftType = '77W';
      cabinClasses = ['YCL', 'SCL', 'JCL', 'FCL'];
      legs = [
        {
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
    } else if (num === 322 || num === 308 || num === 221 || num === 830) {
      aircraftType = '388'; // A380-800
      cabinClasses = ['YCL', 'SCL', 'JCL', 'FCL'];
      const dest = num === 322 || num === 308 ? 'LHR' : num === 221 ? 'SYD' : 'PVG';
      const depT = num === 322 ? '23:30' : num === 308 ? '09:00' : num === 221 ? '20:40' : '09:45';
      const arrT = num === 322 ? '05:55' : num === 308 ? '15:40' : num === 221 ? '06:30' : '15:05';
      legs = [
        {
          flightDetails: {
            departureAirportCode: 'SIN',
            arrivalAirportCode: dest,
            departureDate: flightDate,
            departureTime: depT,
            departureLocalDate: `${flightDate} ${depT}:00`,
            arrivalLocalDate: `${flightDate} ${arrT}:00`,
            departureUtcDate: `${flightDate} 15:30:00`,
            arrivalUtcDate: `${flightDate} 04:55:00`,
          },
        },
      ];
    } else {
      // General SQ routes
      legs = [
        {
          flightDetails: {
            departureAirportCode: 'SIN',
            arrivalAirportCode: num >= 100 && num <= 199 ? 'KUL' : num >= 200 && num <= 299 ? 'MEL' : 'LHR',
            departureDate: flightDate,
            departureTime: '10:15',
            departureLocalDate: `${flightDate} 10:15:00`,
            arrivalLocalDate: `${flightDate} 18:40:00`,
            departureUtcDate: `${flightDate} 02:15:00`,
            arrivalUtcDate: `${flightDate} 10:40:00`,
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
      const from = leg.flightDetails.departureAirportCode;
      const to = leg.flightDetails.arrivalAirportCode;
      return {
        ...leg,
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
                            },
                            {
                              name: 'Taittinger Comtes de Champagne Blanc de Blancs',
                              description: 'Refined minerality, white peach, toasted brioche, and crisp citrus finish.',
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
                      specialities: [
                        {
                          items: [
                            {
                              name: '1837 Black Tea by TWG',
                              description: 'A unique blend of black tea with notes of fruits and flowers from the Bermuda triangle.',
                            },
                            {
                              name: 'Silver Moon Tea by TWG',
                              description: 'Green tea accented with a grand berry and vanilla bouquet.',
                            },
                            {
                              name: 'Grand Jasmine Green Tea by TWG',
                              description: 'Delicate green tea leaves scented with night-blooming jasmine blossoms.',
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
                      specialities: [
                        {
                          items: [
                            {
                              name: 'Single Origin Arabica Espresso & Cappuccino',
                              description: 'Freshly pulled illy 100% Arabica with rich crema and velvety microfoam.',
                            },
                            {
                              name: 'Jamaican Blue Mountain Brewed Coffee',
                              description: 'Mild flavour, delicate body, and clean sweetness.',
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
        drySnack: {
          subcategories: [
            {
              items: [
                {
                  name: 'Artisanal Mixed Truffle Nuts',
                  description: 'Roasted almonds, cashews, and pecans dusted with Italian black summer truffle.',
                },
                {
                  name: 'Gourmet Light Bites & Cookies',
                  description: 'Warm chocolate chip cookies and butter shortbreads.',
                },
              ],
            },
          ],
        },
        amenities: {
          items: [
            {
              itemName: 'Penhaligon’s Luxury Amenity Kit',
              description: 'Bespoke Luna fragrance lip balm, hand lotion, and facial hydrating mist.',
            },
            {
              itemName: 'Lalique Signature Sleepwear & Slippers',
              description: 'Plush unisex lounge sleep suit with matching eye mask.',
            },
          ],
        },
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
