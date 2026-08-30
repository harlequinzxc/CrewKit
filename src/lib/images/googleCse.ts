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
      const cabinHint = cabin ? `${cabin} ` : '';
      const q = `"${dishTitle}" ${cabinHint}("singapore airlines" OR inflight OR "airline meal") food -recipe -pdf`;

      const params = new URLSearchParams({
        key: apiKey,
        cx: cx,
        q: q,
        searchType: 'image',
        num: '1',
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
        const item = data.items[0];
        const fullUrl = item.link || item.image?.contextLink || null;
        const thumbUrl = item.image?.thumbnailLink || fullUrl;

        if (fullUrl) {
          return { thumbUrl, fullUrl };
        }
      }

      return null;
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
