/**
 * Singapore Airlines live endpoints & configuration
 */
export const SQ_CONFIG = {
  GET_CABIN_ENDPOINT: '/api/getcabin',
  MENU_ENDPOINT: '/api/menu',
  IMAGE_BASE_URL: 'https://inflightmenu.singaporeair.com/',

  // Cache TTLs in milliseconds
  CACHE_TTL_CABIN_CONFIG: 24 * 60 * 60 * 1000, // 24 hours
  CACHE_TTL_MENU: 24 * 60 * 60 * 1000,         // 24 hours
  CACHE_TTL_SCHEDULE: 1 * 60 * 60 * 1000,      // 1 hour
};
