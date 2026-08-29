/**
 * Singapore Airlines live endpoints & proxy configuration
 */
export const SQ_CONFIG = {
  // Live unauthenticated menu feed from Singapore Airlines
  LIVE_MENU_API: "https://cifp.auto.prod.c0.singaporeair.com/api/menu",
  ALT_MENU_API: "https://inflightmenu.singaporeair.com/api/menu",
  PROXY_MENU_API: "/api/sq-menu",

  // Public SQ inflight menu endpoints
  SQ_MENU_BASE: "https://inflightmenu.singaporeair.com/home",
  
  // Cache TTLs in milliseconds
  CACHE_TTL_CABIN_CONFIG: 24 * 60 * 60 * 1000, // 24 hours
  CACHE_TTL_MENU: 24 * 60 * 60 * 1000,         // 24 hours
  CACHE_TTL_SCHEDULE: 1 * 60 * 60 * 1000,      // 1 hour
};
