export interface CachedDishImage {
  thumbUrl: string | null;
  fullUrl: string | null;
  source: 'sq' | 'placeholder';
  ts: number;
}

const SUCCESS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const FAILURE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function normalizeDishTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildCacheKey(dishTitle: string, cabin?: string): string {
  const normTitle = normalizeDishTitle(dishTitle);
  const normCabin = (cabin || 'any').toLowerCase().trim();
  return `img:${normTitle}:${normCabin}`;
}

export const imageCache = {
  get(dishTitle: string, cabin?: string): CachedDishImage | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const key = buildCacheKey(dishTitle, cabin);
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as CachedDishImage;
      if (!parsed || !parsed.ts || !parsed.source) return null;

      const now = Date.now();
      const ttl = parsed.source === 'placeholder' ? FAILURE_TTL_MS : SUCCESS_TTL_MS;

      if (now - parsed.ts > ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  },

  set(
    dishTitle: string,
    data: {
      thumbUrl: string | null;
      fullUrl: string | null;
      source: 'sq' | 'placeholder';
    },
    cabin?: string
  ): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const key = buildCacheKey(dishTitle, cabin);
      const payload: CachedDishImage = {
        thumbUrl: data.thumbUrl,
        fullUrl: data.fullUrl,
        source: data.source,
        ts: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // Storage quota exceeded or disabled
    }
  },
};
