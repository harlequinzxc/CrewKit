import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    body = body || {};

    const flightNumber = (body.flightNumber || req.query.flightNumber || req.query.flightNo || '').toString().replace(/\D/g, '');
    const flightDate = (body.flightDate || req.query.flightDate || req.query.date || new Date().toISOString().split('T')[0]).toString();
    const cabinClass = (body.cabinClass || req.query.cabinClass || req.query.cabin || 'JCL').toString();
    const carrierId = (body.carrierId || req.query.carrierId || 'SQ').toString();
    const sessionId = (body.sessionId || req.query.sessionId || 'f47ac10b-58cc-4372-a567-0e02b2c3d479').toString();

    const payload = {
      carrierId,
      flightNumber,
      flightDate,
      cabinClass,
      sessionId,
    };

    const upstream = await fetch('https://cifp.auto.prod.c0.singaporeair.com/api/menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://inflightmenu.singaporeair.com',
        'Referer': 'https://inflightmenu.singaporeair.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      body: JSON.stringify(payload),
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal proxy error' });
  }
}
