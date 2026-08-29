/**
 * Singapore Airlines public endpoints & proxy configuration
 * The app remains fully stateless and client-side only.
 */
export const SQ_CONFIG = {
  // Configurable proxy URL (e.g., Cloudflare Worker or Vercel serverless proxy if direct CORS is blocked)
  PROXY_BASE_URL:
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SQ_PROXY_URL) ||
    "https://api.crewkit.internal/sq-proxy",
  
  // Public SQ inflight menu endpoints
  SQ_MENU_BASE: "https://www.singaporeair.com/en_UK/sg/flying-with-us/dining/inflight-menus/",
  SQ_CABIN_FEED: "https://www.singaporeair.com/getcabin",
  
  // Cache TTLs in milliseconds
  CACHE_TTL_CABIN_CONFIG: 24 * 60 * 60 * 1000, // 24 hours
  CACHE_TTL_MENU: 24 * 60 * 60 * 1000,         // 24 hours
  CACHE_TTL_SCHEDULE: 1 * 60 * 60 * 1000,      // 1 hour
};
