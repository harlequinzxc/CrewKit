/**
 * Google Programmable Search Engine (Custom Search JSON API) image fallback
 */

let sessionGoogleBlocked = false;
let activeGoogleRequests = 0;
const MAX_CONCURRENT_REQUESTS = 2;
const pendingQueue: Array<() => void> = [];
const inFlightRequests = new Map<string, Promise<{ thumbUrl: string | null; fullUrl: string | null } | null>>();

function runNextInQueue() {
  if (activeGoogleRequests < MAX_CONCURRENT_REQUESTS && pendingQueue.length > 0) {
    const next = pendingQueue.shift();
    if (next) {
      activeGoogleRequests++;
      next();
    }
  }
}

function acquireSlot(): Promise<void> {
  return new Promise((resolve) => {
    if (activeGoogleRequests < MAX_CONCURRENT_REQUESTS) {
      activeGoogleRequests++;
      resolve();
    } else {
      pendingQueue.push(resolve);
    }
  });
}

function releaseSlot() {
  activeGoogleRequests = Math.max(0, activeGoogleRequests - 1);
  runNextInQueue();
}

/**
 * Extract core dish search terms (e.g. strip long garnish descriptions)
 */
export function extractCoreDishKeywords(dishTitle: string): string {
  if (!dishTitle) return '';
  // Split on "with", "served with", "accompanied by", "in", "and", "on"
  const clean = dishTitle
    .replace(/\s+/g, ' ')
    .trim();

  const parts = clean.split(/\s+(?:with|served with|accompanied by|in a|in|on a|on|and)\s+/i);
  const primaryName = parts[0] || clean;
  return primaryName.replace(/[^\w\s-]/g, '').trim();
}

async function executeCseQuery(
  apiKey: string,
  cx: string,
  query: string
): Promise<{ thumbUrl: string | null; fullUrl: string | null } | null> {
  const params = new URLSearchParams({
    key: apiKey,
    cx: cx,
    q: query,
    searchType: 'image',
    num: '3',
    safe: 'active',
    imgType: 'photo',
    imgSize: 'medium',
  });

  const url = `https://www.googleapis.com/customsearch/v1?${params.toString()}`;
  const res = await fetch(url);

  if (res.status === 429 || res.status === 403) {
    console.warn('Google CSE quota exceeded or forbidden. Falling back to editorial placeholders for this session.');
    sessionGoogleBlocked = true;
    return null;
  }

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  if (data && Array.isArray(data.items) && data.items.length > 0) {
    for (const item of data.items) {
      const fullUrl = item.link || item.image?.contextLink || null;
      const thumbUrl = item.image?.thumbnailLink || fullUrl;
      if (fullUrl && typeof fullUrl === 'string' && fullUrl.startsWith('http')) {
        return { thumbUrl, fullUrl };
      }
    }
  }

  return null;
}

export async function fetchGoogleDishImage(
  dishTitle: string,
  cabin?: string
): Promise<{ thumbUrl: string | null; fullUrl: string | null } | null> {
  if (sessionGoogleBlocked) return null;

  const apiKey = (import.meta.env.VITE_GOOGLE_CSE_API_KEY as string | undefined)?.trim();
  const cx = (import.meta.env.VITE_GOOGLE_CSE_CX as string | undefined)?.trim();

  if (!apiKey || !cx) {
    // Silently skip if Google CSE is not configured
    return null;
  }

  const queryKey = `${dishTitle}::${cabin || ''}`;
  if (inFlightRequests.has(queryKey)) {
    return inFlightRequests.get(queryKey)!;
  }

  const promise = (async () => {
    await acquireSlot();
    try {
      const coreName = extractCoreDishKeywords(dishTitle);
      const cabinHint = cabin ? `${cabin} ` : '';

      // Tier 1: Search for exact dish name with Singapore Airlines
      let result = await executeCseQuery(
        apiKey,
        cx,
        `"${coreName}" ${cabinHint}"singapore airlines" food`
      );

      // Tier 2: Search without strict quotes if Tier 1 had 0 results
      if (!result) {
        result = await executeCseQuery(
          apiKey,
          cx,
          `${coreName} singapore airlines inflight meal food`
        );
      }

      // Tier 3: Search for core dish name in gourmet food presentation
      if (!result) {
        result = await executeCseQuery(
          apiKey,
          cx,
          `${coreName} gourmet food fine dining`
        );
      }

      return result;
    } catch (err) {
      console.warn('Google CSE fetch failed:', err);
      return null;
    } finally {
      releaseSlot();
      inFlightRequests.delete(queryKey);
    }
  })();

  inFlightRequests.set(queryKey, promise);
  return promise;
}
