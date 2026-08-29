import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { flightNo, date, departureDate, cabinClass, cabin } = req.query;
  const rawFlight = (flightNo as string) || '';
  const cleanFlight = rawFlight.replace(/\D/g, '');
  const flightQuery = rawFlight.toUpperCase().startsWith('SQ') ? rawFlight.toUpperCase() : `SQ${cleanFlight}`;
  const dateQuery = (date as string) || (departureDate as string) || new Date().toISOString().split('T')[0];

  const targetUrls = [
    `https://cifp.auto.prod.c0.singaporeair.com/api/menu?flightNo=${flightQuery}&date=${dateQuery}`,
    `https://cifp.auto.prod.c0.singaporeair.com/api/menu?flightNumber=${flightQuery}&departureDate=${dateQuery}`,
    `https://inflightmenu.singaporeair.com/api/menu?flightNo=${flightQuery}&date=${dateQuery}`,
    `https://cifp.auto.prod.c0.singaporeair.com/api/menu?flightNo=${cleanFlight}&date=${dateQuery}`,
  ];

  for (const url of targetUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const upstream = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://inflightmenu.singaporeair.com/',
          'Origin': 'https://inflightmenu.singaporeair.com',
        },
      });

      clearTimeout(timeoutId);

      if (upstream.ok) {
        const json = await upstream.json();
        return res.status(200).json(json);
      }
    } catch (err) {
      // Continue to next endpoint
    }
  }

  return res.status(502).json({
    error: 'Upstream menu feed unreachable',
    flightNo: flightQuery,
    date: dateQuery,
  });
}
