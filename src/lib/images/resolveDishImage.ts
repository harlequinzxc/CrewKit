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

/**
 * Resolve authentic Singapore Airlines image only.
 * If the item has no image from SQ, returns placeholder source to leave it completely blank.
 */
export function resolveDishImage(
  opts: ResolveDishImageOptions
): ResolvedDishImageResult {
  const { sqImageUrl } = opts;

  if (sqImageUrl && typeof sqImageUrl === 'string' && sqImageUrl.trim().length > 0) {
    const clean = sqImageUrl.trim();
    if (clean !== 'null' && clean !== 'undefined') {
      return {
        thumbUrl: clean,
        fullUrl: clean,
        source: 'sq',
      };
    }
  }

  return {
    thumbUrl: null,
    fullUrl: null,
    source: 'placeholder',
  };
}
