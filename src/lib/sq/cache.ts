interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const CACHE_PREFIX = 'crewkit_sq_v3_';

export const sqCache = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!raw) return null;
      const parsed: CacheItem<T> = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  },

  set<T>(key: string, data: T, ttl: number): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
    } catch (e) {
      console.warn('Unable to write to sqCache', e);
    }
  },

  clear(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('crewkit_sq_')) {
          localStorage.removeItem(k);
        }
      });
    } catch {
      // ignore
    }
  },
};
