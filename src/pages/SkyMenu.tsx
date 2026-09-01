import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow } from '../context/FlowContext';
import { Layout } from '../components/ui/Layout';
import { RouteHero } from '../components/RouteHero';
import {
  Heading,
  Text,
  SegmentedControl,
  StickyHeader,
  GoldHairline,
  MenuItemCard,
  DrinkItem,
  InlineDropdownGroup,
  InlineDropdownDimension,
  TextTabs,
  AnimatedContent,
  EmptyState,
} from '../components/ui';
import {
  getMenu,
} from '../lib/sq/endpoints';
import { CabinCode, MenuData, LegMenuData, MenuItem } from '../lib/sq/types';
import { cn } from '../lib/utils';
import {
  Utensils,
  Wine,
  Gift,
  Cookie,
  AlertCircle,
} from 'lucide-react';

interface NormalizedDrinkSection {
  id: string;
  family: string;
  subtype: string;
  items: MenuItem[];
  hasRichItems: boolean;
}

function parseDrinkSectionTitle(rawTitle: string): { family: string; subtype: string } {
  if (!rawTitle) return { family: '', subtype: '' };

  const clean = rawTitle.trim();

  // 1. Check for explicit delimiters: " · ", " - ", " : ", " / ", " | ", " — ", " – "
  const delimiterMatch = clean.match(/^(.*?)(?:\s+-\s+|\s*·\s*|\s*–\s*|\s*—\s*|\s*:\s*|\s*\/\s*|\s*\|\s*)(.*)$/);
  if (delimiterMatch) {
    const p1 = delimiterMatch[1].trim();
    const p2 = delimiterMatch[2].trim();
    if (p1 && p2) {
      return {
        family: formatFamilyLabel(p1),
        subtype: formatSubtypeLabel(p2),
      };
    }
  }

  // 2. Check for common combined phrases from SIA feeds
  const lower = clean.toLowerCase();
  if (lower.includes('champagne') && lower.includes('wine')) {
    return { family: 'Wines & Champagne', subtype: 'Champagne & Fine Wines' };
  }
  if (lower.includes('champagne')) {
    return { family: 'Wines & Champagne', subtype: 'Champagne' };
  }
  if (lower.includes('white wine')) {
    return { family: 'Wines & Champagne', subtype: 'White Wine' };
  }
  if (lower.includes('red wine')) {
    return { family: 'Wines & Champagne', subtype: 'Red Wine' };
  }
  if (lower.includes('cocktail')) {
    return { family: 'Cocktails & Aperitifs', subtype: 'Cocktails' };
  }
  if (lower.includes('aperitif') || lower.includes('apéritif')) {
    return { family: 'Cocktails & Aperitifs', subtype: 'Apéritifs' };
  }
  if (
    lower.includes('spirit') ||
    lower.includes('liqueur') ||
    lower.includes('whisky') ||
    lower.includes('gin') ||
    lower.includes('vodka')
  ) {
    return { family: 'Spirits & Liqueurs', subtype: clean };
  }
  if (lower.includes('beer') || lower.includes('cider')) {
    return { family: 'Beer & Cider', subtype: clean };
  }
  if (lower.includes('tea')) {
    return {
      family: 'Hot Beverages',
      subtype: clean.replace(/\bselections?\b/gi, '').trim() || clean,
    };
  }
  if (lower.includes('coffee')) {
    return {
      family: 'Hot Beverages',
      subtype: clean.replace(/\bselections?\b/gi, '').trim() || clean,
    };
  }
  if (
    lower.includes('non-alcoholic') ||
    lower.includes('juice') ||
    lower.includes('soft drink') ||
    lower.includes('water') ||
    lower.includes('mocktail')
  ) {
    return { family: 'Non-Alcoholic', subtype: clean };
  }

  return { family: clean, subtype: clean };
}

function formatFamilyLabel(s: string): string {
  return s
    .replace(/^DRINKS\s*&\s*CELLAR$/i, 'Cellar & Drinks')
    .replace(/^BEVERAGES?$/i, 'Beverages')
    .trim();
}

function formatSubtypeLabel(s: string): string {
  return s.trim();
}

export const SkyMenu: React.FC = () => {
  const navigate = useNavigate();
  const { state: flowState, isFlowConfigured, goToPage } = useFlow();

  // Navigation menu open state (controlled on Layout)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Result Menu states
  const initialCabin = flowState.cabinClass || 'BUSINESS';
  const [activeCabinView, setActiveCabinView] = useState<CabinCode>(initialCabin);
  const [menuByCabin, setMenuByCabin] = useState<Record<string, MenuData>>({});
  const [activeLegIndex, setActiveLegIndex] = useState<number>(0);
  const [activeSegment, setActiveSegment] = useState<'dining' | 'drinks' | 'snacks' | 'amenities'>('dining');

  // Selection switcher state per meal service
  const [selectedMealOption, setSelectedMealOption] = useState<Record<string, string>>({});

  // Active meal service in view (e.g. for multi-service flights like Dinner vs Breakfast)
  const [activeMealServiceId, setActiveMealServiceId] = useState<string>('');

  // Controlled state for open inline dropdown (only 1 open at a time)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Refs for scroll container and sticky header
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null);

  // Redirect to flow start if accessed directly without configured state
  useEffect(() => {
    if (!isFlowConfigured) {
      navigate('/', { replace: true });
    }
  }, [isFlowConfigured, navigate]);

  const primaryFlightNo = flowState.sectors[0]?.flightNumber || '11';
  const primaryDateISO = flowState.sectors[0]?.date || '';

  // Load menu data directly on mount
  useEffect(() => {
    if (!isFlowConfigured) return;

    let isMounted = true;
    const cabinToFetch = flowState.cabinClass || 'BUSINESS';

    getMenu(primaryFlightNo, primaryDateISO, cabinToFetch).then((menu) => {
      if (!isMounted) return;
      setMenuByCabin({ [cabinToFetch]: menu });
      setActiveCabinView(cabinToFetch);
      setActiveLegIndex(0);
      setActiveSegment('dining');

      if (menu && menu.legs && menu.legs.length > 0) {
        const leg = menu.legs[0];
        if (leg.mealServices.length > 0) {
          setActiveMealServiceId(leg.mealServices[0].id);
        }
        const initialSelections: Record<string, string> = {};
        menu.legs.forEach((l) => {
          l.mealServices.forEach((srv) => {
            if (srv.selections && srv.selections.length > 0) {
              const preferred = srv.selections.find(
                (s) =>
                  s.name.toLowerCase().includes('international') ||
                  s.name.toLowerCase().includes('western')
              );
              initialSelections[srv.id] = preferred ? preferred.id : srv.selections[0].id;
            }
          });
        });
        setSelectedMealOption(initialSelections);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isFlowConfigured, primaryFlightNo, primaryDateISO, flowState.cabinClass]);

  const activeMenuData: MenuData | null =
    menuByCabin[activeCabinView] || Object.values(menuByCabin)[0] || null;

  const currentLeg: LegMenuData | null =
    activeMenuData && activeMenuData.legs && activeMenuData.legs.length > 0
      ? activeMenuData.legs[activeLegIndex] || activeMenuData.legs[0]
      : null;

  const normalizedDrinks: NormalizedDrinkSection[] = (currentLeg?.drinks || [])
    .map((sec) => {
      const { family, subtype } = parseDrinkSectionTitle(sec.title);
      const validItems = (sec.items || []).filter((it) => it && Boolean(it.title));
      const hasRichItems = validItems.some(
        (it) => Boolean(it.description && it.description.trim().length > 0)
      );
      return {
        id: sec.id,
        family,
        subtype,
        items: validItems,
        hasRichItems,
      };
    })
    .filter((sec) => sec.items.length > 0);

  // Check availability for dynamic category list strictly per active sector/leg
  const hasAmenities = Boolean(currentLeg?.amenities && currentLeg.amenities.length > 0);

  // STICKY BAR: Categories
  const availableCategories = [
    { id: 'dining' as const, label: 'Food', icon: Utensils },
    { id: 'drinks' as const, label: 'Drinks', icon: Wine },
    { id: 'snacks' as const, label: 'Snacks', icon: Cookie },
    ...(hasAmenities ? [{ id: 'amenities' as const, label: 'Amenities', icon: Gift }] : []),
  ];

  // Active meal service & active selection for dining
  const activeMealService =
    currentLeg?.mealServices.find(
      (s) => s.id === (activeMealServiceId || currentLeg?.mealServices[0]?.id)
    ) || currentLeg?.mealServices[0];

  const activeSelectionId =
    activeMealService
      ? selectedMealOption[activeMealService.id] || activeMealService.selections[0]?.id || ''
      : '';

  // Dimension 2: Sector (e.g. SIN → NRT, NRT → LAX)
  const sectorOptions = (activeMenuData?.legs || []).map((leg, idx) => ({
    id: String(idx),
    label: `${leg.originCity || leg.origin} to ${leg.destinationCity || leg.destination}`,
    shortLabel: `${leg.origin} → ${leg.destination}`,
    description: `${leg.origin} (${leg.depTime || ''}) → ${leg.destination} (${leg.arrTime || ''})`,
  }));

  // Dimension 3: Menu Type
  const menuTypeSelections = activeMealService?.selections || [];

  const isEthnicSelection = (name: string) => {
    const n = name.toLowerCase();
    return (
      n.includes('japanese') ||
      n.includes('hanakoireki') ||
      n.includes('kyo-kaiseki') ||
      n.includes('ethnic') ||
      n.includes('korean') ||
      n.includes('chinese') ||
      n.includes('indian') ||
      n.includes('oriental') ||
      n.includes('asian') ||
      n.includes('special')
    );
  };

  const sortedMenuSelections = [...menuTypeSelections].sort((a, b) => {
    const aIsEthnic = isEthnicSelection(a.name);
    const bIsEthnic = isEthnicSelection(b.name);
    if (!aIsEthnic && bIsEthnic) return -1;
    if (aIsEthnic && !bIsEthnic) return 1;
    return 0;
  });

  const menuTypeOptions = sortedMenuSelections.map((sel) => {
    const isEthnic = isEthnicSelection(sel.name);
    const shortLabel = isEthnic ? 'Ethnic' : 'Route';
    return {
      id: sel.id,
      label: sel.name,
      shortLabel,
    };
  });

  const dropdownDimensions: InlineDropdownDimension[] = [
    ...(sectorOptions.length >= 2
      ? [
          {
            id: 'sector',
            label: 'Sector Leg',
            value: String(activeLegIndex),
            options: sectorOptions,
            onChange: (val: string) => {
              const idx = Number(val);
              setActiveLegIndex(idx);
              const targetLeg = activeMenuData?.legs?.[idx];
              if (targetLeg && targetLeg.mealServices.length > 0) {
                setActiveMealServiceId(targetLeg.mealServices[0].id);
              }
            },
          },
        ]
      : []),
    ...(activeSegment === 'dining' && menuTypeOptions.length >= 2
      ? [
          {
            id: 'menu-type',
            label: 'Culinary Line',
            value: activeSelectionId,
            options: menuTypeOptions,
            onChange: (val: string) => {
              if (activeMealService) {
                setSelectedMealOption((prev) => ({
                  ...prev,
                  [activeMealService.id]: val,
                }));
              }
            },
          },
        ]
      : []),
  ];

  if (!isFlowConfigured) {
    return null;
  }

  return (
    <Layout
      containerClassName="w-full md:w-[85%] max-w-6xl"
      onBack={() => {
        if (openDropdownId) {
          setOpenDropdownId(null);
        } else {
          goToPage(4, 'backward');
          navigate('/');
        }
      }}
      menuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
    >
      <div
        ref={scrollContainerRef}
        className="flex flex-col h-full overflow-y-auto no-scrollbar animate-fade-in text-left pb-16 relative w-full"
      >
        {/* ── CONSOLIDATED LAYERED STICKY STACK (TOP TO BOTTOM, FULL BLEED) ── */}
        <StickyHeader ref={stickyHeaderRef} className="pb-2">
          <div className="w-full md:w-[85%] max-w-6xl mx-auto px-4 sm:px-6 relative flex flex-col gap-2.5 sm:gap-3">
            {/* Layer 1: Route Hero Card (Info-only, fully sticky) */}
            {currentLeg && (
              <RouteHero
                flightNumber={`SQ ${primaryFlightNo.replace(/\D/g, '')}`}
                flightDate={currentLeg.depDateLocal || primaryDateISO}
                leg={{
                  from: currentLeg.origin,
                  to: currentLeg.destination,
                  fromCity: currentLeg.originCity,
                  toCity: currentLeg.destinationCity,
                  depTime: currentLeg.depTime,
                  arrTime: currentLeg.arrTime,
                  depUtc: currentLeg.depUtc,
                  arrUtc: currentLeg.arrUtc,
                  depDateLocal: currentLeg.depDateLocal || currentLeg.departureLocalDate,
                  arrDateLocal: currentLeg.arrDateLocal || currentLeg.arrivalLocalDate,
                  arrDayShift: currentLeg.arrDayShift,
                }}
              />
            )}

            {/* Layer 2: Dropdown Row (Sector / Culinary Line) */}
            {dropdownDimensions.length > 0 && (
              <div className="w-full max-w-xl mx-auto">
                <InlineDropdownGroup
                  dimensions={dropdownDimensions}
                  activeDropdownId={openDropdownId}
                  onActiveDropdownChange={setOpenDropdownId}
                />
              </div>
            )}

            {/* Layer 3: Category Pills (Food / Drinks / Snacks / Amenities) */}
            <div className="w-full max-w-xl mx-auto">
              <SegmentedControl
                options={availableCategories}
                value={activeSegment}
                onChange={(val) => {
                  setOpenDropdownId(null);
                  setActiveSegment(val as any);
                }}
                layoutId="skymenu-segment-pill"
                size="sm"
                className="bg-ink-850/60 border-gold-400/15"
              />
            </div>

            {/* Layer 4: Meal Service Text Tabs (Conditional: Food + 2+ services) */}
            {activeSegment === 'dining' && currentLeg && currentLeg.mealServices.length >= 2 && (
              <div className="w-full max-w-xl mx-auto pt-0.5">
                <TextTabs
                  options={currentLeg.mealServices.map((service) => ({
                    id: service.id,
                    label: service.name,
                  }))}
                  value={activeMealServiceId || currentLeg.mealServices[0]?.id || ''}
                  onChange={(serviceId) => {
                    setOpenDropdownId(null);
                    setActiveMealServiceId(serviceId);
                  }}
                  layoutId="skymenu-meal-service-tab"
                />
              </div>
            )}
          </div>
        </StickyHeader>

        {/* ── MAIN MENU CONTENT WRAPPED IN ANIMATED CONTENT (CROSS-FADING TRANSITIONS) ── */}
        <div className="w-full md:w-[85%] max-w-6xl mx-auto px-4 sm:px-6">
          <AnimatedContent
            value={`${activeCabinView}-${activeLegIndex}-${activeSegment}-${activeMealServiceId}-${activeSelectionId}`}
            className="px-1 sm:px-2 space-y-6"
          >
            {/* Snack Bag Service Banner */}
            {currentLeg?.isSnackBag && (
              <div className="mt-2 p-4 rounded-well bg-ink-850/90 border border-gold-400/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <Heading variant="subsection" as="h4" className="text-base text-gold-300">
                    Snack Bag Service
                  </Heading>
                  <Text variant="secondary" className="text-xs">
                    This sector operates a snack bag service instead of a full meal service.
                  </Text>
                </div>
              </div>
            )}

            {/* 1. FOOD SERVICE & PACED COURSES */}
            {activeSegment === 'dining' && currentLeg && (
              <>
                {currentLeg.mealServices.length === 0 ? (
                  <EmptyState
                    id="menu-category-empty"
                    heading="No Dining Services Published"
                    message={`Dining menus for SQ${primaryFlightNo.replace(/\D/g, '')} (${currentLeg.origin} → ${currentLeg.destination}) are not available yet.`}
                  />
                ) : (
                  (() => {
                    const displayServices =
                      currentLeg.mealServices.length >= 2
                        ? currentLeg.mealServices.filter(
                            (s) => s.id === (activeMealServiceId || currentLeg.mealServices[0]?.id)
                          )
                        : currentLeg.mealServices;

                    return displayServices.map((service) => {
                      const currentSelectionId =
                        selectedMealOption[service.id] || (service.selections[0]?.id ?? '');
                      const currentSelection =
                        service.selections.find((s) => s.id === currentSelectionId) ||
                        service.selections[0];

                      return (
                        <div key={service.id} className="pt-2 pb-6">
                          {/* ── MEAL SERVICE TITLE ── */}
                          <div
                            id="menu-service-title"
                            className="pt-2 pb-1 text-center select-none"
                          >
                            <Heading
                              variant="hero"
                              as="h2"
                              className="text-2xl sm:text-3xl md:text-[2rem] font-normal text-ivory-100 tracking-tight text-center"
                            >
                              {service.name}
                            </Heading>
                          </div>

                          {/* ── PACED MEAL COURSES ── */}
                          <div className="space-y-8 mt-6 md:mt-8">
                            {currentSelection?.courses.map((course, cIdx) => (
                              <div key={course.id} className="w-full">
                                <div
                                  data-menu-section-header="true"
                                  {...(cIdx === 0 ? { id: 'menu-first-section' } : {})}
                                  className={cn(
                                    'flex items-center gap-4 w-full select-none',
                                    cIdx === 0
                                      ? 'my-6 md:my-8'
                                      : 'my-8 md:my-10'
                                  )}
                                >
                                  <GoldHairline className="flex-1" />
                                  <div className="flex flex-col items-center gap-0.5 text-center select-none px-2 shrink-0">
                                    <Text
                                      variant="overline"
                                      className="text-gold-300 tracking-[0.25em] text-[0.7rem] font-medium uppercase"
                                    >
                                      {course.name}
                                    </Text>
                                    {course.items.length >= 2 && (
                                      <Text variant="italic-secondary">
                                        Choose one of {course.items.length}
                                      </Text>
                                    )}
                                  </div>
                                  <GoldHairline className="flex-1" />
                                </div>

                                {/* Dishes Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                                  {course.items.map((item, iIdx) => (
                                    <div
                                      key={item.id}
                                      {...(cIdx === 0 && iIdx === 0 ? { id: 'menu-first-item' } : {})}
                                      className="w-full"
                                    >
                                      <MenuItemCard
                                        item={item}
                                        courseCategory={course.name}
                                        cabin={activeCabinView}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </>
            )}

            {/* 2. DRINKS (CELLAR, COFFEE, TEA & BEVERAGES) */}
            {activeSegment === 'drinks' && currentLeg && (
              <div className="pt-2 pb-8 space-y-8 w-full">
                {normalizedDrinks.length === 0 ? (
                  <EmptyState
                    id="menu-category-empty"
                    heading="No Drinks Listing Available"
                    message="Beverage, tea, and coffee selections have not been published for this sector yet."
                  />
                ) : (
                  normalizedDrinks.map((sec, idx) => {
                    const prevSec = idx > 0 ? normalizedDrinks[idx - 1] : null;
                    const isNewFamily =
                      !prevSec ||
                      prevSec.family.toLowerCase() !== sec.family.toLowerCase();
                    const showFamilyEyebrow =
                      isNewFamily &&
                      Boolean(sec.family) &&
                      sec.family.toLowerCase() !== sec.subtype.toLowerCase();

                    return (
                      <div key={sec.id} className="w-full">
                        {/* Centered Editorial Drinks Header */}
                        <div
                          data-menu-section-header="true"
                          {...(idx === 0 ? { id: 'menu-first-section' } : {})}
                          className={cn(
                            'flex items-center gap-4 w-full select-none',
                            idx === 0
                              ? 'my-6 md:my-8'
                              : isNewFamily
                              ? 'mt-10 mb-6 md:mt-12 md:mb-8'
                              : 'my-6 md:my-8'
                          )}
                        >
                          <GoldHairline className="flex-1" />
                          <div className="flex flex-col items-center gap-0.5 text-center select-none px-2 shrink-0">
                            {showFamilyEyebrow && (
                              <Text
                                variant="overline"
                                className="text-mist-400 tracking-[0.2em] text-[0.62rem] font-normal uppercase"
                              >
                                {sec.family}
                              </Text>
                            )}
                            <Text
                              variant="overline"
                              className="text-gold-300 tracking-[0.25em] text-[0.7rem] font-medium uppercase"
                            >
                              {sec.subtype}
                            </Text>
                          </div>
                          <GoldHairline className="flex-1" />
                        </div>

                        {/* Density Ladder */}
                        {sec.hasRichItems ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 max-w-4xl mx-auto w-full mt-4">
                            {sec.items.map((it, iIdx) => (
                              <DrinkItem
                                key={it.id}
                                item={it}
                                isFirstItem={idx === 0 && iIdx === 0}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col max-w-2xl mx-auto w-full mt-2">
                            {sec.items.map((it, iIdx) => (
                              <DrinkItem
                                key={it.id}
                                item={it}
                                isFirstItem={idx === 0 && iIdx === 0}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 3. DELECTABLES & SNACKS */}
            {activeSegment === 'snacks' && currentLeg && (
              <div className="pt-2 pb-8 space-y-8 max-w-2xl mx-auto w-full">
                {!currentLeg.snacks || currentLeg.snacks.groups.length === 0 ? (
                  <EmptyState
                    id="menu-category-empty"
                    message="Snacks are not available on this sector."
                  />
                ) : (
                  <div className="space-y-8">
                    {currentLeg.snacks.header && (
                      <div className="mb-6 text-center">
                        <Text variant="secondary" className="text-xs sm:text-[0.8rem] text-mist-300 leading-relaxed max-w-xl mx-auto">
                          {currentLeg.snacks.header}
                        </Text>
                      </div>
                    )}

                    <div className="space-y-10">
                      {currentLeg.snacks.groups.map((group, gIdx) => (
                        <div
                          key={gIdx}
                          data-menu-section-header="true"
                          {...(gIdx === 0 ? { id: 'menu-first-section' } : {})}
                          className={cn('w-full', gIdx === 0 ? 'pt-2' : 'mt-8')}
                        >
                          <div className="flex items-center gap-3 w-full select-none">
                            <Text
                              variant="overline"
                              className="text-gold-300 tracking-[0.22em] text-[0.65rem] sm:text-[0.7rem] font-medium uppercase shrink-0"
                            >
                              {group.name}
                            </Text>
                            <GoldHairline className="flex-1" />
                          </div>

                          <div className="mt-4 flex flex-col">
                            {group.items.map((item, iIdx) => (
                              <div
                                key={`snk-${gIdx}-${iIdx}`}
                                {...(gIdx === 0 && iIdx === 0 ? { id: 'menu-first-item' } : {})}
                                className="py-2.5 sm:py-3 flex items-start gap-3 w-full text-left select-none"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0 mt-2 shadow-[0_0_8px_rgba(201,168,76,0.3)]" />
                                <div className="flex-1 flex flex-col min-w-0">
                                  <Heading
                                    variant="subsection"
                                    as="h4"
                                    className="text-base sm:text-[0.95rem] font-medium font-sans text-ivory-100 leading-snug tracking-normal"
                                  >
                                    {item.name}
                                  </Heading>
                                  {item.description && (
                                    <Text
                                      variant="secondary"
                                      className="text-xs sm:text-[0.8rem] text-mist-300 mt-0.5 leading-relaxed"
                                    >
                                      {item.description}
                                    </Text>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. CABIN AMENITIES */}
            {activeSegment === 'amenities' && currentLeg && (
              <div className="pt-2 pb-8 space-y-8">
                {currentLeg.amenities.length === 0 ? (
                  <EmptyState
                    id="menu-category-empty"
                    heading="Cabin Comfort &amp; Amenities"
                    message="Amenity kits, slippers, and premium bedding provided on long-haul flights."
                  />
                ) : (
                  <div className="w-full">
                    <div
                      id="menu-first-section"
                      data-menu-section-header="true"
                      className="flex items-center gap-4 my-6 md:my-8 w-full select-none"
                    >
                      <GoldHairline className="flex-1" />
                      <div className="flex flex-col items-center gap-1 text-center select-none px-2 shrink-0">
                        <Text
                          variant="overline"
                          className="text-gold-300 tracking-[0.25em] text-[0.7rem] font-medium uppercase"
                        >
                          Cabin Amenities
                        </Text>
                      </div>
                      <GoldHairline className="flex-1" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mt-6">
                      {currentLeg.amenities.map((am, iIdx) => (
                        <div
                          key={am.id}
                          {...(iIdx === 0 ? { id: 'menu-first-item' } : {})}
                          className="w-full"
                        >
                          <MenuItemCard
                            item={{
                              id: am.id,
                              title: am.name,
                              description: am.description,
                              imageUrl: am.imageUrl,
                            }}
                            courseCategory="Cabin Amenities"
                            cabin={activeCabinView}
                            mediaVariant="amenity"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </AnimatedContent>
        </div>
      </div>
    </Layout>
  );
};
