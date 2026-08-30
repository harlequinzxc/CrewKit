import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { FlightNumberInput } from '../components/FlightNumberInput';
import { DepartureBlock, getTodayISO, formatDateDisplay } from '../components/DepartureBlock';
import { RevealCTA } from '../components/RevealCTA';
import { CabinPill } from '../components/CabinPill';
import { FetchInterlude, InterludeMessage } from '../components/FetchInterlude';
import { DishCard } from '../components/DishCard';
import { ImageLightbox } from '../components/ImageLightbox';
import { RouteHero } from '../components/RouteHero';
import { useFlightValidation } from '../hooks/useFlightValidation';
import { getCabinConfig, getMenu } from '../lib/sq/endpoints';
import { CabinCode, MenuData, LegMenuData } from '../lib/sq/types';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Utensils,
  Wine,
  Gift,
  Cookie,
  Plane,
} from 'lucide-react';

const SKYMENU_MESSAGES: InterludeMessage[] = [
  { text: 'Retrieving menu from seat pocket…', durationMs: 3000 },
  { text: 'Almost ready…', durationMs: 2000 },
];

export const SkyMenu: React.FC = () => {
  const initialTodayISO = getTodayISO();
  const initialTodayDisplay = formatDateDisplay(initialTodayISO);

  // Screen Stages: 'form' | 'loading' | 'result'
  const [stage, setStage] = useState<'form' | 'loading' | 'result'>('form');

  // Flight validation
  const validation = useFlightValidation('');
  const [dateISO, setDateISO] = useState<string>(initialTodayISO);
  const [dateDisplay, setDateDisplay] = useState<string>(initialTodayDisplay);

  // Cabin detection states
  const [isDetectingCabins, setIsDetectingCabins] = useState(false);
  const [availableCabins, setAvailableCabins] = useState<CabinCode[]>([]);
  const [selectedCabin, setSelectedCabin] = useState<CabinCode>('BUSINESS');
  const [aircraftType, setAircraftType] = useState<string>('');
  const [flightNotFoundError, setFlightNotFoundError] = useState<string | null>(null);

  // Menu results
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [activeLegIndex, setActiveLegIndex] = useState<number>(0);
  const [activeSegment, setActiveSegment] = useState<'dining' | 'cellar' | 'snacks' | 'amenities'>('dining');

  // Selection switcher state per meal service
  const [selectedMealOption, setSelectedMealOption] = useState<Record<string, string>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Lightbox State
  const [lightboxData, setLightboxData] = useState<{
    open: boolean;
    src: string | null;
    title: string;
    description?: string;
    meta?: string;
    credit?: string;
  }>({
    open: false,
    src: null,
    title: '',
  });

  useEffect(() => {
    if (!validation.flightNo || validation.flightNo.trim().length === 0) {
      setAvailableCabins([]);
      setAircraftType('');
      setFlightNotFoundError(null);
      return;
    }

    if (!validation.isValid) {
      setAvailableCabins([]);
      setAircraftType('');
      return;
    }

    let isSubscribed = true;
    setIsDetectingCabins(true);
    setFlightNotFoundError(null);

    getCabinConfig(validation.flightNo, dateISO)
      .then((config) => {
        if (!isSubscribed) return;
        setIsDetectingCabins(false);
        if (config.available && config.available.length > 0) {
          setAvailableCabins(config.available);
          setAircraftType(config.aircraftType || '');
          setFlightNotFoundError(null);
          if (config.available.includes('BUSINESS')) {
            setSelectedCabin('BUSINESS');
          } else {
            setSelectedCabin(config.available[0]);
          }
        } else {
          setAvailableCabins([]);
          setAircraftType('');
          setFlightNotFoundError(`Flight SQ${validation.cleanFlightNo} not found or does not operate on ${dateDisplay}.`);
        }
      })
      .catch(() => {
        if (!isSubscribed) return;
        setIsDetectingCabins(false);
        setAvailableCabins([]);
        setFlightNotFoundError(`Flight SQ${validation.cleanFlightNo} not found.`);
      });

    return () => {
      isSubscribed = false;
    };
  }, [validation.flightNo, validation.isValid, dateISO, dateDisplay]);

  const handleSelectCabin = (code: CabinCode) => {
    setSelectedCabin(code);
  };

  const handleStartFetch = () => {
    setStage('loading');
  };

  const executeMenuFetch = async () => {
    const data = await getMenu(validation.flightNo, dateISO, selectedCabin);
    return data;
  };

  const handleFetchSuccess = (data: MenuData) => {
    setMenuData(data);
    setActiveLegIndex(0);
    setActiveSegment('dining');

    // Default selection to International/Western menu if multiple selections exist
    const initialSelections: Record<string, string> = {};
    if (data.legs && data.legs.length > 0) {
      data.legs.forEach((leg) => {
        leg.mealServices.forEach((srv) => {
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
    }
    setSelectedMealOption(initialSelections);
    setStage('result');
  };

  const toggleSectionCollapse = (secId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  const cabinLabel =
    selectedCabin === 'PREMIUM_ECONOMY'
      ? 'Premium Economy'
      : selectedCabin.charAt(0) + selectedCabin.slice(1).toLowerCase();

  const cabinShort =
    selectedCabin === 'PREMIUM_ECONOMY'
      ? 'Prem Econ'
      : selectedCabin.charAt(0) + selectedCabin.slice(1).toLowerCase();

  const flightSummaryLine = `SQ${validation.cleanFlightNo} · ${dateDisplay} · ${cabinLabel}`;

  const currentLeg: LegMenuData | null =
    menuData && menuData.legs && menuData.legs.length > 0
      ? menuData.legs[activeLegIndex] || menuData.legs[0]
      : null;

  return (
    <Layout containerClassName="w-full md:w-[90%] max-w-6xl">
      {/* 1. LOADING INTERLUDE (5s Minimum Duration) */}
      {stage === 'loading' && (
        <FetchInterlude
          flightChipText={flightSummaryLine}
          messages={SKYMENU_MESSAGES}
          fetchTask={executeMenuFetch}
          onSuccess={handleFetchSuccess}
        />
      )}

      {/* 2. FORM FLOW (PUSH DOWNWARD LAYOUT — NO VERTICAL BOUNCING) */}
      {stage === 'form' && (
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar pt-4 sm:pt-6 pb-8 px-1 animate-cabin-in">
          <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center space-y-5">
            <div>
              <span className="font-display italic text-gold-300 text-xl tracking-wide block mb-1">
                Menu of the day,
              </span>

              <h2 className="font-display text-3xl sm:text-4xl font-light text-ivory-100 tracking-tight leading-snug">
                What are we serving?
              </h2>
            </div>

            {/* Flight Number Input */}
            <div className="w-full text-left">
              <FlightNumberInput
                value={validation.flightNo}
                onChange={validation.setFlightNo}
                isValid={validation.isValid && !flightNotFoundError}
                isChecking={validation.isChecking || isDetectingCabins}
                error={validation.error || flightNotFoundError}
                placeholder="3 2 2"
              />
            </div>

            {/* Departure Block */}
            {validation.isValid && validation.flightNo.length > 0 && (
              <div className="w-full text-left animate-cabin-in">
                <DepartureBlock
                  selectedDateISO={dateISO}
                  onDateSelect={(iso, display) => {
                    setDateISO(iso);
                    setDateDisplay(display);
                  }}
                />
              </div>
            )}

            {/* Cabin Detection Loading Skeleton */}
            {isDetectingCabins && (
              <div className="w-full text-left animate-fade-in">
                <label className="block text-[0.72rem] font-ui uppercase tracking-eyebrow text-mist-300 mb-2 select-none">
                  Available Cabin Classes
                </label>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-20 rounded-full bg-ink-850 animate-pulse border border-gold-dim" />
                  <div className="h-9 w-24 rounded-full bg-ink-850 animate-pulse border border-gold-dim" />
                  <div className="h-9 w-20 rounded-full bg-ink-850 animate-pulse border border-gold-dim" />
                </div>
                <p className="font-display italic text-mist-400 text-xs mt-2">
                  Verifying flight &amp; cabins with Singapore Airlines…
                </p>
              </div>
            )}

            {/* Single Select Cabin Class Pills */}
            {!isDetectingCabins && availableCabins.length > 0 && !flightNotFoundError && (
              <div className="w-full text-left animate-cabin-in">
                <div className="flex items-center justify-between mb-2 select-none">
                  <label className="block text-[0.72rem] font-ui uppercase tracking-eyebrow text-mist-300">
                    Select Cabin Class
                  </label>
                  {aircraftType && (
                    <span className="font-ui text-[10px] uppercase tracking-wider text-gold-300 font-semibold">
                      {aircraftType}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableCabins.map((code, idx) => (
                    <CabinPill
                      key={code}
                      code={code}
                      isSelected={selectedCabin === code}
                      hasAnySelection={true}
                      delayIndex={idx}
                      onToggle={handleSelectCabin}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Reveal CTA */}
            {validation.isValid &&
              validation.flightNo.length > 0 &&
              dateISO &&
              availableCabins.length > 0 &&
              !flightNotFoundError &&
              !isDetectingCabins && (
                <div className="w-full pt-3 pb-4">
                  <RevealCTA
                    label="Fetch Menu"
                    icon={Sparkles}
                    summary={flightSummaryLine}
                    onPress={handleStartFetch}
                  />
                </div>
              )}
          </div>
        </div>
      )}

      {/* 3. RESULT SCREEN — EDITORIAL LUXURY MENU WITH ROUTE HERO */}
      {stage === 'result' && menuData && (
        <div className="flex flex-col h-full overflow-hidden animate-cabin-in text-left">
          {/* STICKY LUXURY HEADER */}
          <div className="shrink-0 sticky top-0 z-20 backdrop-blur-md bg-ink-950/85 pb-3 pt-1 border-b border-gold-dim">
            {/* Multi-Leg Sector Tabs */}
            {menuData.legs && menuData.legs.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 pb-2.5 overflow-x-auto no-scrollbar">
                {menuData.legs.map((leg, idx) => (
                  <button
                    key={leg.legId || idx}
                    type="button"
                    onClick={() => setActiveLegIndex(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-ui uppercase tracking-wider font-semibold transition-all shrink-0 ${
                      activeLegIndex === idx
                        ? 'bg-gold-400 text-onyx-900 shadow-sm'
                        : 'text-mist-300 hover:text-ivory-100 bg-ink-850/60 border border-gold-dim'
                    }`}
                  >
                    <Plane className="w-3 h-3 rotate-45" />
                    <span>{leg.origin} → {leg.destination}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Category Tabs with Framer Motion Sliding Pill */}
            <div className="flex items-center justify-center gap-1 p-1 rounded-full bg-ink-850 border border-gold-dim max-w-md mx-auto relative select-none">
              {(
                [
                  { id: 'dining', label: 'Dining', icon: Utensils },
                  { id: 'cellar', label: 'Cellar & Tea', icon: Wine },
                  { id: 'snacks', label: 'Snacks', icon: Cookie },
                  { id: 'amenities', label: 'Amenities', icon: Gift },
                ] as const
              ).map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeSegment === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSegment(tab.id)}
                    className={`relative flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-full text-xs font-ui uppercase tracking-wider font-semibold transition-colors duration-200 z-10 ${
                      isActive ? 'text-onyx-900' : 'text-mist-300 hover:text-ivory-100'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="skymenu-segment-pill"
                        className="absolute inset-0 bg-gold-400 rounded-full shadow-sm"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <TabIcon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN SCROLLABLE CONTENT (NO BROWSER SCROLLBAR) */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-1 sm:px-2 space-y-8">
            
            {/* ROUTE HERO CARD — CENTERPIECE OF INFLIGHT MENU */}
            {currentLeg && (
              <RouteHero
                flightNumber={`SQ ${validation.cleanFlightNo}`}
                flightDate={dateISO}
                cabinLabel={cabinLabel}
                cabinShort={cabinShort}
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
                legCount={menuData.legs?.length || 1}
              />
            )}

            {/* 1. DINING SERVICE & PACED COURSES */}
            {activeSegment === 'dining' && currentLeg && (
              <>
                {currentLeg.mealServices.length === 0 ? (
                  <div className="py-16 text-center my-auto flex flex-col items-center justify-center">
                    <span className="font-display text-2xl text-ivory-100 mb-2">
                      No Dining Services Published
                    </span>
                    <p className="font-sans text-sm text-mist-300 max-w-sm leading-relaxed">
                      Dining menus for SQ{validation.cleanFlightNo} ({currentLeg.origin} → {currentLeg.destination}) are not available yet.
                    </p>
                  </div>
                ) : (
                  currentLeg.mealServices.map((service) => {
                    const currentSelectionId =
                      selectedMealOption[service.id] || (service.selections[0]?.id ?? '');
                    const currentSelection =
                      service.selections.find((s) => s.id === currentSelectionId) || service.selections[0];

                    return (
                      <div key={service.id} className="space-y-6">
                        {/* Service Title (Cormorant Garamond, 2rem) */}
                        <div className="flex items-center justify-between pb-3 border-b border-gold-dim">
                          <h2 className="font-display text-3xl sm:text-4xl font-light text-ivory-100 tracking-tight">
                            {service.name}
                          </h2>

                          {/* Parallel Menu Toggles */}
                          {service.selections.length > 1 && (
                            <div className="flex items-center gap-1 p-1 rounded-full bg-ink-850 border border-gold-dim">
                              {service.selections.map((sel) => (
                                <button
                                  key={sel.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedMealOption((prev) => ({
                                      ...prev,
                                      [service.id]: sel.id,
                                    }))
                                  }
                                  className={`px-3 py-1 rounded-full text-xs font-ui uppercase tracking-wider font-semibold transition-all ${
                                    currentSelectionId === sel.id
                                      ? 'bg-gold-400 text-onyx-900 shadow-sm'
                                      : 'text-mist-300 hover:text-ivory-100'
                                  }`}
                                >
                                  {sel.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Paced Meal Courses */}
                        <div className="space-y-8">
                          {currentSelection?.courses.map((course) => {
                            const isCollapsed = collapsedSections[course.id];
                            return (
                              <div key={course.id} className="space-y-4">
                                {/* Section Title */}
                                <div
                                  onClick={() => toggleSectionCollapse(course.id)}
                                  className="flex items-center justify-between cursor-pointer py-1 group select-none"
                                >
                                  <div className="flex items-baseline">
                                    <h3 className="font-display text-2xl text-ivory-100 group-hover:text-gold-300 transition-colors">
                                      {course.name}
                                    </h3>
                                    {course.maxSequence && (
                                      <span className="font-ui text-xs uppercase tracking-wider text-mist-400 ml-3">
                                        (Choice of {course.maxSequence})
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    className="p-1 text-mist-400 group-hover:text-gold-300 transition-colors"
                                    aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
                                  >
                                    {isCollapsed ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronUp className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>

                                {/* Dishes Grid */}
                                {!isCollapsed && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-1">
                                    {course.items.map((item) => (
                                      <DishCard
                                        key={item.id}
                                        item={item}
                                        courseCategory={course.name}
                                        cabin={selectedCabin}
                                        onOpenLightbox={(data) => setLightboxData({ ...data, open: true })}
                                      />
                                    ))}
                                  </div>
                                )}

                                <div className="gold-hairline mt-6" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* 2. CELLAR, COFFEE, TEA & BEVERAGES WITH FULL DISH CARDS & PHOTOS */}
            {activeSegment === 'cellar' && currentLeg && (
              <div className="space-y-8">
                {currentLeg.drinks.length === 0 ? (
                  <div className="py-16 text-center my-auto flex flex-col items-center justify-center">
                    <span className="font-display text-2xl text-ivory-100 mb-2">
                      No Beverage Listing Available
                    </span>
                    <p className="font-sans text-sm text-mist-300 max-w-sm leading-relaxed">
                      Beverage, tea, and coffee selections have not been published for this sector yet.
                    </p>
                  </div>
                ) : (
                  currentLeg.drinks.map((sec) => (
                    <div key={sec.id} className="space-y-4">
                      {/* Section Title */}
                      <div className="flex items-center justify-between pb-2 border-b border-gold-dim">
                        <h3 className="font-display text-2xl text-ivory-100">
                          {sec.title}
                        </h3>
                        <Wine className="w-4 h-4 text-gold-400" />
                      </div>

                      {/* Beverage Cards Grid with Photos, Descriptions & Lightbox */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-1">
                        {sec.items.map((it) => (
                          <DishCard
                            key={it.id}
                            item={it}
                            courseCategory={sec.title}
                            cabin={selectedCabin}
                            onOpenLightbox={(data) => setLightboxData({ ...data, open: true })}
                          />
                        ))}
                      </div>

                      <div className="gold-hairline mt-6" />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. DELECTABLES & SNACKS */}
            {activeSegment === 'snacks' && currentLeg && (
              <div className="space-y-6">
                {currentLeg.snacks.length === 0 ? (
                  <div className="py-16 text-center my-auto flex flex-col items-center justify-center">
                    <span className="font-display text-2xl text-ivory-100 mb-2">
                      Inflight Snack Basket
                    </span>
                    <p className="font-sans text-sm text-mist-300 max-w-sm leading-relaxed">
                      Complimentary snacks and refreshments are available on board upon request.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-gold-dim">
                      <h3 className="font-display text-2xl text-ivory-100">
                        Delectables &amp; Light Bites
                      </h3>
                      <Cookie className="w-4 h-4 text-gold-400" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-1">
                      {currentLeg.snacks.map((snk) => (
                        <DishCard
                          key={snk.id}
                          item={snk}
                          courseCategory="Delectables & Snacks"
                          cabin={selectedCabin}
                          onOpenLightbox={(data) => setLightboxData({ ...data, open: true })}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. CABIN AMENITIES */}
            {activeSegment === 'amenities' && currentLeg && (
              <div className="space-y-6">
                {currentLeg.amenities.length === 0 ? (
                  <div className="py-16 text-center my-auto flex flex-col items-center justify-center">
                    <span className="font-display text-2xl text-ivory-100 mb-2">
                      Cabin Comfort &amp; Amenities
                    </span>
                    <p className="font-sans text-sm text-mist-300 max-w-sm leading-relaxed">
                      Amenity kits, slippers, and premium bedding provided on long-haul flights.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-gold-dim">
                      <h3 className="font-display text-2xl text-ivory-100">
                        Cabin Amenities
                      </h3>
                      <Gift className="w-4 h-4 text-gold-400" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-1">
                      {currentLeg.amenities.map((am) => (
                        <DishCard
                          key={am.id}
                          item={{
                            id: am.id,
                            title: am.name,
                            description: am.description,
                            imageUrl: am.imageUrl,
                          }}
                          courseCategory="Cabin Amenities"
                          cabin={selectedCabin}
                          onOpenLightbox={(data) => setLightboxData({ ...data, open: true })}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LIGHTBOX MODAL */}
          <ImageLightbox
            open={lightboxData.open}
            onClose={() => setLightboxData((prev) => ({ ...prev, open: false }))}
            src={lightboxData.src}
            title={lightboxData.title}
            description={lightboxData.description}
            meta={lightboxData.meta}
            credit={lightboxData.credit}
          />
        </div>
      )}
    </Layout>
  );
};
