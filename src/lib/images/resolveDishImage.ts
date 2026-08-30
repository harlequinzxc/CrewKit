import { imageCache, CachedDishImage } from './imageCache';
import { fetchGoogleDishImage } from './googleCse';

export interface ResolveDishImageOptions {
  dishTitle: string;
  sqImageUrl?: string | null;
  cabin?: string;
}

export interface ResolvedDishImageResult {
  thumbUrl: string | null;
  fullUrl: string | null;
  source: 'sq' | 'google' | 'placeholder';
}

function validateImageUrl(url: string, timeoutMs = 2500): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return resolve(false);
    }

    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      return resolve(true);
    }

    const img = new Image();
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        img.src = '';
        resolve(false);
      }
    }, timeoutMs);

    img.onload = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        // Reject 1x1 tracking pixels or zero-dimension stubs
        if (img.naturalWidth > 1 && img.naturalHeight > 1) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    };

    img.onerror = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(false);
      }
    };

    img.src = url;
  });
}

export async function resolveDishImage(
  opts: ResolveDishImageOptions
): Promise<ResolvedDishImageResult> {
  const { dishTitle, sqImageUrl, cabin } = opts;

  if (!dishTitle || !dishTitle.trim()) {
    return { thumbUrl: null, fullUrl: null, source: 'placeholder' };
  }

  // 1. Check persistent cache
  const cached: CachedDishImage | null = imageCache.get(dishTitle, cabin);
  if (cached) {
    return {
      thumbUrl: cached.thumbUrl,
      fullUrl: cached.fullUrl,
      source: cached.source,
    };
  }

  // 2. Validate and use SQ source image if provided
  if (sqImageUrl && sqImageUrl.trim().length > 0) {
    const isValidSq = await validateImageUrl(sqImageUrl, 2500);
    if (isValidSq) {
      const result: ResolvedDishImageResult = {
        thumbUrl: sqImageUrl,
        fullUrl: sqImageUrl,
        source: 'sq',
      };
      imageCache.set(dishTitle, result, cabin);
      return result;
    }
  }

  // 3. Google CSE Image Fallback
  const googleResult = await fetchGoogleDishImage(dishTitle, cabin);
  if (googleResult && googleResult.fullUrl) {
    const isValidGoogle = await validateImageUrl(googleResult.fullUrl, 3000);
    if (isValidGoogle) {
      const result: ResolvedDishImageResult = {
        thumbUrl: googleResult.thumbUrl || googleResult.fullUrl,
        fullUrl: googleResult.fullUrl,
        source: 'google',
      };
      imageCache.set(dishTitle, result, cabin);
      return result;
    }
  }

  // 4. Editorial Placeholder (cached with 24h failure TTL)
  const fallbackResult: ResolvedDishImageResult = {
    thumbUrl: null,
    fullUrl: null,
    source: 'placeholder',
  };
  imageCache.set(dishTitle, fallbackResult, cabin);
  return fallbackResult;
}
