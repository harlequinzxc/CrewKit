export interface ResolveDishImageOptions {
  dishTitle: string;
  sqImageUrl?: string | null;
  cabin?: string;
}

export interface ResolvedDishImageResult {
  thumbUrl: string | null;
  fullUrl: string | null;
  source: 'sq' | 'placeholder';
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

/**
 * Resolve authentic Singapore Airlines image only.
 * If the item has no image from SQ (or it fails to load), returns null to leave it blank.
 */
export async function resolveDishImage(
  opts: ResolveDishImageOptions
): Promise<ResolvedDishImageResult> {
  const { sqImageUrl } = opts;

  if (sqImageUrl && typeof sqImageUrl === 'string' && sqImageUrl.trim().length > 0) {
    const isValidSq = await validateImageUrl(sqImageUrl.trim(), 2500);
    if (isValidSq) {
      return {
        thumbUrl: sqImageUrl.trim(),
        fullUrl: sqImageUrl.trim(),
        source: 'sq',
      };
    }
  }

  // If no picture from SQ or failed to load, leave it blank
  return {
    thumbUrl: null,
    fullUrl: null,
    source: 'placeholder',
  };
}
