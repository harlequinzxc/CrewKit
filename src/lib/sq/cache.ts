interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const CACHE_PREFIX = 'crewkit_sq_cache_';

export const sqCache = {
  get<T>(key: string): T | null {
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
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(k);
        }
      });
    } catch {
      // ignore
    }
  }
};
