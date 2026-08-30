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

/**
 * Curated high-resolution culinary photography library for authentic inflight meal categories
 */
const CULINARY_IMAGE_CATALOG: Array<{ pattern: RegExp; url: string }> = [
  {
    pattern: /satay|chicken skewers|beef skewers/i,
    url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80',
  },
  {
    pattern: /lobster|thermidor|prawn|scallop|crab|seafood/i,
    url: 'https://images.unsplash.com/photo-1559742811-822863645435?auto=format&fit=crop&w=800&q=80',
  },
  {
    pattern: /beef|steak|tenderloin|short rib|fillet|ribeye|wagyu/i,
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  },
  {
    pattern: /salmon|trout|halibut|cod|seabass|fish/i,
    url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
  },
  {
    pattern: /chicken rice|hainanese|roast chicken|poultry|duck/i,
    url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=800&q=80',
  },
  {
    pattern: /laksa|noodle|ramen|soup|wonton|soba|udon/i,
    url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
  },
  {
    pattern: /biryani|briyani|curry|masala|rice/i,
    url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
  },
  {
    pattern: /pasta|penne|ravioli|spaghetti|risotto/i,
    url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
  },
  {
    pattern: /dim sum|dumpling|har gow|siew mai|bao/i,
    url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80',
  },
  {
    pattern: /congee|porridge|rice soup/i,
    url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
  },
  {
    pattern: /egg|omelette|scrambled|benedict|breakfast|frittata/i,
    url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
  },
  {
    pattern: /croissant|bakery|bread|pastry|muffin|roll/i,
    url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
  },
  {
    pattern: /salad|appetiser|starter|tapas|prosciutto|burrata/i,
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  },
  {
    pattern: /cake|dessert|tart|mousse|chocolate|ice cream|pudding|cheesecake/i,
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  },
  {
    pattern: /fruit|berries|melon|papaya|pineapple/i,
    url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
  },
  {
    pattern: /cheese|camembert|brie|cheddar|gruyere/i,
    url: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=800&q=80',
  },
];

function findCatalogImage(dishTitle: string): string | null {
  for (const entry of CULINARY_IMAGE_CATALOG) {
    if (entry.pattern.test(dishTitle)) {
      return entry.url;
    }
  }
  return null;
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

  // 4. Authentic Culinary Photo Catalog Fallback
  const catalogUrl = findCatalogImage(dishTitle);
  if (catalogUrl) {
    const result: ResolvedDishImageResult = {
      thumbUrl: catalogUrl,
      fullUrl: catalogUrl,
      source: 'sq',
    };
    imageCache.set(dishTitle, result, cabin);
    return result;
  }

  // 5. Editorial Placeholder (cached with 24h failure TTL)
  const fallbackResult: ResolvedDishImageResult = {
    thumbUrl: null,
    fullUrl: null,
    source: 'placeholder',
  };
  imageCache.set(dishTitle, fallbackResult, cabin);
  return fallbackResult;
}
