export interface ResolveDishImageOptions {
  dishTitle: string;
  sqImageUrl?: string | null;
  cabin?: string;
}

export interface ResolvedDishImageResult {
  thumbUrl: string | null;
  fullUrl: string | null;
  source: 'sq' | 'catalog' | 'placeholder';
}

/**
 * Curated In-Flight Fine Dining Photography Catalog
 * Mapped to authentic Singapore Airlines signature menu dishes, courses, drinks, and amenities.
 */
const DISH_IMAGE_CATALOG: Array<{ keywords: string[]; url: string }> = [
  // 1. Signature Satay Canapés
  {
    keywords: ['satay', 'skewer', 'peanut sauce', 'mutton satay', 'chicken satay'],
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  },
  // 2. Boston Lobster Tail with Caviar
  {
    keywords: ['lobster', 'caviar', 'oscietra', 'prawn', 'shrimp', 'scallop', 'seafood appetiser'],
    url: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=800&q=80',
  },
  // 3. Pan Seared Angus Beef Fillet / Tenderloin Steak
  {
    keywords: ['beef', 'steak', 'tenderloin', 'fillet', 'angus', 'wagyu', 'short rib', 'ribeye', 'sirloin', 'beef jus'],
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  },
  // 4. Singapore Hainanese Chicken Rice
  {
    keywords: ['chicken rice', 'hainanese', 'poached chicken', 'ginger rice'],
    url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
  },
  // 5. Poultry & Chicken Mains
  {
    keywords: ['chicken', 'poultry', 'roast chicken', 'chicken breast', 'supreme of chicken'],
    url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
  },
  // 6. Chilean Sea Bass & Fish
  {
    keywords: ['sea bass', 'seabass', 'salmon', 'cod', 'halibut', 'trout', 'fish fillet', 'yuzu soy'],
    url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
  },
  // 7. Artisanal Plant-Based Truffle Mushroom Risotto
  {
    keywords: ['risotto', 'mushroom', 'truffle risotto', 'carnaroli', 'wild mushroom'],
    url: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80',
  },
  // 8. Gourmet Pasta & Noodles
  {
    keywords: ['pasta', 'noodle', 'noodles', 'spaghetti', 'linguine', 'penne', 'ravioli', 'fettuccine', 'lasagna'],
    url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
  },
  // 9. Signature Singapore Airlines Garlic Bread
  {
    keywords: ['garlic bread', 'garlic baguette', 'herb and garlic', 'garlic toast'],
    url: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=800&q=80',
  },
  // 10. Artisanal Sourdough & Warm Bakery
  {
    keywords: ['sourdough', 'bread', 'breads', 'bakery', 'croissant', 'roll', 'baguette', 'brioche', 'lavosh', 'pastry'],
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  },
  // 11. Valrhona Dark Chocolate Ganache Tart
  {
    keywords: ['chocolate', 'ganache', 'tart', 'valrhona', 'chocolate cake', 'brownie', 'mousse', 'coulis'],
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  },
  // 12. Farmhouse Gourmet Cheese Board
  {
    keywords: ['cheese', 'cheeses', 'comte', 'brie', 'stilton', 'cheese board', 'farmhouse cheese', 'crackers'],
    url: 'https://images.unsplash.com/photo-1631379578550-7038263db699?auto=format&fit=crop&w=800&q=80',
  },
  // 13. Desserts & Patisserie
  {
    keywords: ['dessert', 'ice cream', 'panna cotta', 'cheesecake', 'sorbet', 'pudding', 'creme brulee', 'parfait', 'cake'],
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
  },
  // 14. Singapore Nasi Lemak
  {
    keywords: ['nasi lemak', 'coconut rice', 'sambal prawn', 'sambal'],
    url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
  },
  // 15. Singapore Laksa & Curries
  {
    keywords: ['laksa', 'curry', 'coconut curry', 'roti prata', 'rendang'],
    url: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?auto=format&fit=crop&w=800&q=80',
  },
  // 16. Breakfast Omelette & Eggs
  {
    keywords: ['omelette', 'egg', 'eggs', 'scrambled', 'frittata', 'benedict', 'poached egg'],
    url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
  },
  // 17. Waffles, Pancakes & French Toast
  {
    keywords: ['waffle', 'waffles', 'pancake', 'pancakes', 'french toast', 'maple syrup'],
    url: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=800&q=80',
  },
  // 18. Dim Sum & Dumplings
  {
    keywords: ['dim sum', 'dumpling', 'dumplings', 'siew mai', 'har gow', 'bao', 'steamed bun'],
    url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
  },
  // 19. Krug & Prestige Champagne
  {
    keywords: ['krug', 'taittinger', 'champagne', 'sparkling', 'brut', 'blanc de blancs', 'cuvee'],
    url: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=800&q=80',
  },
  // 20. Grand Cru Red Wine & Bordeaux
  {
    keywords: ['wine', 'bordeaux', 'cabernet', 'merlot', 'pinot noir', 'shiraz', 'syrah', 'red wine', 'estournel'],
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
  },
  // 21. Fine White Wine & Chardonnay
  {
    keywords: ['white wine', 'chardonnay', 'sauvignon', 'riesling', 'pinot grigio', 'chablis'],
    url: 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?auto=format&fit=crop&w=800&q=80',
  },
  // 22. TWG Artisan Teas
  {
    keywords: ['twg', 'tea', 'black tea', 'green tea', 'jasmine', 'earl grey', 'chamomile', 'silver moon', '1837'],
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
  },
  // 23. Specialty illy Coffees & Espresso
  {
    keywords: ['coffee', 'espresso', 'cappuccino', 'latte', 'illy', 'blue mountain', 'americano', 'arabica'],
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  },
  // 24. Singapore Sling & Cocktails
  {
    keywords: ['cocktail', 'singapore sling', 'sling', 'aperitif', 'mocktail', 'gin', 'vodka', 'whisky'],
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
  },
  // 25. Mixed Truffle Nuts
  {
    keywords: ['nuts', 'truffle nuts', 'almonds', 'cashews', 'peanuts', 'pecans'],
    url: 'https://images.unsplash.com/photo-1536591375315-1b836890ba4e?auto=format&fit=crop&w=800&q=80',
  },
  // 26. Cookies & Light Bites
  {
    keywords: ['cookies', 'biscuit', 'biscuits', 'shortbread', 'snack', 'snacks', 'treats', 'chips'],
    url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80',
  },
  // 27. Penhaligon’s Luxury Amenity Kit
  {
    keywords: ['penhaligon', 'amenity', 'amenities', 'skincare', 'lotion', 'mist', 'lip balm'],
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  },
  // 28. Lalique Sleepwear & Slippers
  {
    keywords: ['lalique', 'sleepwear', 'slippers', 'pyjama', 'pyjamas', 'bedding', 'lounge suit'],
    url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
  },
];

/**
 * Finds matching curated photography for a dish title
 */
export function getCatalogImageUrl(dishTitle: string): string | null {
  if (!dishTitle) return null;
  const lower = dishTitle.toLowerCase().trim();

  for (const entry of DISH_IMAGE_CATALOG) {
    const isMatch = entry.keywords.some((kw) => lower.includes(kw));
    if (isMatch) {
      return entry.url;
    }
  }

  return null;
}

/**
 * Resolve authentic Singapore Airlines or curated in-flight fine dining image.
 */
export function resolveDishImage(
  opts: ResolveDishImageOptions
): ResolvedDishImageResult {
  const { dishTitle, sqImageUrl } = opts;

  // 1. If valid SQ upstream image URL exists (and is not an unresolvable dummy path)
  if (sqImageUrl && typeof sqImageUrl === 'string' && sqImageUrl.trim().length > 0) {
    const clean = sqImageUrl.trim();
    if (
      clean !== 'null' &&
      clean !== 'undefined' &&
      !clean.includes('assets/satay.jpg') &&
      !clean.includes('assets/lobster.jpg') &&
      !clean.includes('assets/beef.jpg') &&
      !clean.includes('assets/chicken_rice.jpg') &&
      !clean.includes('assets/seabass.jpg') &&
      !clean.includes('assets/risotto.jpg') &&
      !clean.includes('assets/garlic_bread.jpg') &&
      !clean.includes('assets/sourdough.jpg') &&
      !clean.includes('assets/chocolate.jpg') &&
      !clean.includes('assets/cheese.jpg') &&
      !clean.includes('assets/krug.jpg') &&
      !clean.includes('assets/taittinger.jpg') &&
      !clean.includes('assets/bordeaux.jpg') &&
      !clean.includes('assets/twg_tea.jpg') &&
      !clean.includes('assets/twg_green.jpg') &&
      !clean.includes('assets/twg_jasmine.jpg') &&
      !clean.includes('assets/illy_coffee.jpg') &&
      !clean.includes('assets/brewed_coffee.jpg') &&
      !clean.includes('assets/truffle_nuts.jpg') &&
      !clean.includes('assets/cookies.jpg') &&
      !clean.includes('assets/penhaligons.jpg') &&
      !clean.includes('assets/lalique.jpg')
    ) {
      return {
        thumbUrl: clean,
        fullUrl: clean,
        source: 'sq',
      };
    }
  }

  // 2. Look up curated fine-dining catalog image
  const catalogUrl = getCatalogImageUrl(dishTitle);
  if (catalogUrl) {
    return {
      thumbUrl: catalogUrl,
      fullUrl: catalogUrl,
      source: 'catalog',
    };
  }

  return {
    thumbUrl: null,
    fullUrl: null,
    source: 'placeholder',
  };
}
