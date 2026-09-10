import { MenuItem } from '../sq/types';

export const SIA_STATIC_HOST = 'https://inflightmenu.singaporeair.com';

export interface ResolveDishImageOptions {
  dishTitle?: string;
  dishId?: string;
  sqImageUrl?: string | null;
  imagePathIfeHigh?: string | null;
  imagePathIfeLow?: string | null;
  cabin?: string;
}

/**
 * Normalises an arbitrary cabin code / name to SIA 3-letter cabin code (FCL, JCL, SCL, YCL)
 */
export function normalizeSiaCabin(cabin?: string): 'FCL' | 'JCL' | 'SCL' | 'YCL' {
  const upper = String(cabin || '').toUpperCase().trim();
  if (upper.includes('FIRST') || upper.includes('SUITE') || upper === 'FCL' || upper === 'R' || upper === 'F') {
    return 'FCL';
  }
  if (upper.includes('PREM') || upper === 'SCL' || upper === 'W' || upper === 'S') {
    return 'SCL';
  }
  if (upper.includes('ECON') || upper === 'YCL' || upper === 'Y') {
    return 'YCL';
  }
  return 'JCL';
}

/**
 * Formats and absolutises a Singapore Airlines relative or absolute asset path
 */
export function absolutiseSiaUrl(path?: string | null): string | null {
  if (!path || typeof path !== 'string') return null;
  const clean = path.trim();
  if (!clean || clean === 'null' || clean === 'undefined') return null;

  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  if (clean.startsWith('//')) {
    return `https:${clean}`;
  }

  const stripped = clean.replace(/^\/+/, '');
  // Encode URI while preserving slashes
  const encoded = stripped
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${SIA_STATIC_HOST}/${encoded}`;
}

/**
 * Computes authentic Singapore Airlines photo candidate URLs in strict priority order.
 * Per the SIA In-Flight Menu reverse-engineered specification:
 * 1. Explicit `imagePathIfeHigh` or `imageUrl` if linked by the API
 * 2. Constructed HIGH photo from dish `id` (e.g. "DH021259-v3-FCL" -> "DH021259_FCL.png") (75% hit rate on SIA CDN)
 * 3. Constructed LOW photo from dish `id`
 * 4. Explicit `imagePathIfeLow`
 */
export function getSiaPhotoCandidates(item: Partial<MenuItem> | null | undefined, cabin?: string): string[] {
  if (!item) return [];

  const candidates: string[] = [];
  const seen = new Set<string>();

  const add = (url: string | null | undefined) => {
    if (!url) return;
    const abs = absolutiseSiaUrl(url);
    if (!abs) return;

    // Filter known malformed placeholders (empty filename or junk)
    if (
      !seen.has(abs) &&
      !abs.endsWith('/.jpg') &&
      !abs.endsWith('/.png') &&
      !abs.includes('/DISH_SPECIALTY/.jpg') &&
      !abs.includes('/assets/satay.jpg') &&
      !abs.includes('/assets/lobster.jpg') &&
      !abs.includes('/assets/beef.jpg') &&
      !abs.includes('/assets/chicken_rice.jpg') &&
      !abs.includes('/assets/seabass.jpg') &&
      !abs.includes('/assets/risotto.jpg') &&
      !abs.includes('/assets/garlic_bread.jpg') &&
      !abs.includes('/assets/sourdough.jpg') &&
      !abs.includes('/assets/chocolate.jpg') &&
      !abs.includes('/assets/cheese.jpg') &&
      !abs.includes('/assets/krug.jpg') &&
      !abs.includes('/assets/taittinger.jpg') &&
      !abs.includes('/assets/bordeaux.jpg') &&
      !abs.includes('/assets/twg_tea.jpg') &&
      !abs.includes('/assets/twg_green.jpg') &&
      !abs.includes('/assets/twg_jasmine.jpg') &&
      !abs.includes('/assets/illy_coffee.jpg') &&
      !abs.includes('/assets/brewed_coffee.jpg') &&
      !abs.includes('/assets/truffle_nuts.jpg') &&
      !abs.includes('/assets/cookies.jpg') &&
      !abs.includes('/assets/penhaligons.jpg') &&
      !abs.includes('/assets/lalique.jpg')
    ) {
      seen.add(abs);
      candidates.push(abs);
    }
  };

  // 1. Explicit high-resolution / API linked image
  add(item.imagePathIfeHigh);
  add(item.imageUrl);

  // 2. Constructed from dish ID if present
  const idStr = item.dishId || item.id || '';
  const match = idStr.match(/^([A-Z]{2}\d{6}(?:-\d{3})?)(?:-v\d+)?/i);
  const siaCabin = normalizeSiaCabin(cabin);

  if (match && match[1]) {
    const idBase = match[1].toUpperCase();
    // High-res IFE photo
    add(`${SIA_STATIC_HOST}/fabs/IFE/INFM/${siaCabin}/HIGH/${idBase}_${siaCabin}.png`);
    // Low-res IFE photo
    add(`${SIA_STATIC_HOST}/fabs/IFE/INFM/${siaCabin}/LOW/${idBase}_${siaCabin}.png`);
  }

  // 3. Explicit low-resolution path
  add(item.imagePathIfeLow);

  return candidates;
}
