import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { FlightNumberInput } from '../components/FlightNumberInput';
import { DepartureBlock } from '../components/DepartureBlock';
import { RevealCTA } from '../components/RevealCTA';
import { CabinPill } from '../components/CabinPill';
import { FetchInterlude, InterludeMessage } from '../components/FetchInterlude';
import { DishCard } from '../components/DishCard';
import { ImageLightbox } from '../components/ImageLightbox';
import { RouteHero } from '../components/RouteHero';
import { useFlightValidation } from '../hooks/useFlightValidation';
import { getCabinConfig, getMenu, getKnownFlightSectors, SectorLegOption } from '../lib/sq/endpoints';
import { CabinCode, MenuData, LegMenuData } from '../lib/sq/types';
import { motion } from 'framer-motion';
import {
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
  // Screen Stages: 'form' | 'loading' | 'result'
  const [stage, setStage] = useState<'form' | 'loading' | 'result'>('form');

  // Flight validation
  const validation = useFlightValidation('');

  // Step 2: Departure Date (not selected by default)
  const [dateISO, setDateISO] = useState<string>('');
  const [dateDisplay, setDateDisplay] = useState<string>('');

  // Special multi-sector flight detection (e.g. SQ12, SQ11, SQ26, SQ25)
  const [multiSectors, setMultiSectors] = useState<SectorLegOption[] | null>(null);
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);

  // Step 4: Cabin detection & Multi-selection (not selected by default)
  const [isDetectingCabins, setIsDetectingCabins] = useState(false);
  const [availableCabins, setAvailableCabins] = useState<CabinCode[]>([]);
  const [selectedCabins, setSelectedCabins] = useState<CabinCode[]>([]);
  const [aircraftType, setAircraftType] = useState<string>('');
  const [flightNotFoundError, setFlightNotFoundError] = useState<string | null>(null);

  // Result Menu states
  const [activeCabinView, setActiveCabinView] = useState<CabinCode>('BUSINESS');
  const [menuByCabin, setMenuByCabin] = useState<Record<string, MenuData>>({});
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

  // 1. Live change: when flight number changes, reset all downstream selections
  useEffect(() => {
    setDateISO('');
    setDateDisplay('');
    setSelectedSectorIds([]);
    setAvailableCabins([]);
    setSelectedCabins([]);
    setAircraftType('');
    setFlightNotFoundError(null);

    if (validation.isValid && validation.flightNo) {
      const known = getKnownFlightSectors(validation.flightNo);
      setMultiSectors(known);
    } else {
      setMultiSectors(null);
    }
  }, [validation.flightNo, validation.isValid]);

  const isMultiSector = Boolean(multiSectors && multiSectors.length > 1);

  // 2. Live change: when date is selected, trigger cabin detection (for standard flights) or wait for sector selection
  useEffect(() => {
    if (!validation.flightNo || !validation.isValid || !dateISO) {
      setAvailableCabins([]);
      setSelectedCabins([]);
      setAircraftType('');
      setFlightNotFoundError(null);
      return;
    }

    // For multi-sector flights, cabin detection runs after sector is chosen or when date is set
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
        } else {
          setAvailableCabins([]);
          setAircraftType('');
          setFlightNotFoundError(
            config.error || `Flight SQ${validation.cleanFlightNo} is not operating on ${dateDisplay}.`
          );
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

  // Handle Sector Toggle
  const handleToggleSector = (sectorId: string) => {
    setSelectedSectorIds((prev) => {
      const next = prev.includes(sectorId) ? prev.filter((id) => id !== sectorId) : [...prev, sectorId];
      return next;
    });
  };

  // Handle Cabin Toggle (Multi-select)
  const handleToggleCabin = (code: CabinCode) => {
    setSelectedCabins((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleStartFetch = () => {
    setStage('loading');
  };

  const executeMenuFetch = async () => {
    const cabinsToFetch = selectedCabins.length > 0 ? selectedCabins : (['BUSINESS'] as CabinCode[]);
    const menus = await Promise.all(
      cabinsToFetch.map((c) => getMenu(validation.flightNo, dateISO, c))
    );

    const mapping: Record<string, MenuData> = {};
    cabinsToFetch.forEach((c, idx) => {
      const menu = menus[idx];
      // If specific sectors were chosen, filter legs to only the selected sectors
      if (selectedSectorIds.length > 0 && menu.legs && menu.legs.length > 0) {
        const filtered = menu.legs.filter((leg) => {
          const legKey = `${leg.origin}-${leg.destination}`;
          return (
            selectedSectorIds.includes(legKey) ||
            selectedSectorIds.some((id) => id.includes(leg.origin) && id.includes(leg.destination))
          );
        });
        if (filtered.length > 0) {
          menu.legs = filtered;
        }
      }
      mapping[c] = menu;
    });

    return { mapping, cabins: cabinsToFetch };
  };

  const handleFetchSuccess = (result: { mapping: Record<string, MenuData>; cabins: CabinCode[] }) => {
    setMenuByCabin(result.mapping);
    const initialCabin = result.cabins[0] || 'BUSINESS';
    setActiveCabinView(initialCabin);
    setActiveLegIndex(0);
    setActiveSegment('dining');

    // Default selection to International/Western menu if multiple selections exist
    const primary = result.mapping[initialCabin];
    const initialSelections: Record<string, string> = {};
    if (primary && primary.legs && primary.legs.length > 0) {
      primary.legs.forEach((leg) => {
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

  const activeMenuData: MenuData | null = menuByCabin[activeCabinView] || Object.values(menuByCabin)[0] || null;

  const activeCabinLabel =
    activeCabinView === 'PREMIUM_ECONOMY'
      ? 'Premium Economy'
      : activeCabinView.charAt(0) + activeCabinView.slice(1).toLowerCase();

  const activeCabinShort =
    activeCabinView === 'PREMIUM_ECONOMY'
      ? 'Prem Econ'
      : activeCabinView.charAt(0) + activeCabinView.slice(1).toLowerCase();

  const currentLeg: LegMenuData | null =
    activeMenuData && activeMenuData.legs && activeMenuData.legs.length > 0
      ? activeMenuData.legs[activeLegIndex] || activeMenuData.legs[0]
      : null;

  const flightSummaryLine = [
    `SQ${validation.cleanFlightNo}`,
    selectedSectorIds.length > 0 ? selectedSectorIds.join(' & ') : '',
    dateDisplay,
    selectedCabins.length > 1
      ? `${selectedCabins.length} Cabins`
      : selectedCabins[0] === 'PREMIUM_ECONOMY'
      ? 'Prem Econ'
      : selectedCabins[0]
      ? selectedCabins[0].charAt(0) + selectedCabins[0].slice(1).toLowerCase()
      : '',
  ]
    .filter(Boolean)
    .join(' · ');

  // Visibility flags strictly adhering to workflow:
  const showDateStep = validation.isValid && validation.flightNo.length > 0;
  const showSectorStep = showDateStep && Boolean(dateISO) && isMultiSector;
  const showCabinStep =
    showDateStep &&
    Boolean(dateISO) &&
    (!isMultiSector || selectedSectorIds.length > 0) &&
    !isDetectingCabins &&
    availableCabins.length > 0 &&
    !flightNotFoundError;
  const showFetchButton = showCabinStep && selectedCabins.length > 0;

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

      {/* 2. FORM FLOW (PROGRESSIVE STEP-BY-STEP WORKFLOW) */}
      {stage === 'form' && (
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar pt-4 sm:pt-6 pb-8 px-1 animate-cabin-in">
          <div className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-8">
            {/* Editorial Hero */}
            <div className="space-y-1">
              <span className="font-display italic text-gold-300 text-base sm:text-lg tracking-wide block">
                Menu of the day,
              </span>

              <h2 className="font-display text-3xl sm:text-4xl font-normal text-ivory-100 tracking-tight leading-snug">
                What are we serving?
              </h2>
            </div>

            {/* STEP 1: Flight Number Input */}
            <div className="w-full text-left">
              <FlightNumberInput
                value={validation.flightNo}
                onChange={validation.setFlightNo}
                isValid={validation.isValid && !flightNotFoundError}
                error={validation.error || flightNotFoundError}
                placeholder="3 2 2"
              />
            </div>

            {/* STEP 2: Departure Date (Appears only if valid flight number; none selected by default) */}
            {showDateStep && (
              <div className="w-full text-left animate-cabin-in">
                <DepartureBlock
                  selectedDateISO={dateISO}
                  onDateSelect={(iso, display) => {
                    setDateISO(iso);
                    setDateDisplay(display);
                    // Reset downstream selections on date change
                    setSelectedSectorIds([]);
                    setSelectedCabins([]);
                  }}
                />
              </div>
            )}

            {/* STEP 3 (For SQ12, SQ11, SQ26, SQ25): Sector Legs Multi-Select (none selected by default) */}
            {showSectorStep && multiSectors && (
              <div className="w-full text-left animate-cabin-in space-y-2">
                <label className="block text-[0.65rem] font-sans font-medium uppercase tracking-[0.2em] text-mist-400 mb-2 select-none">
                  SECTOR
                </label>

                <div className="grid grid-cols-1 gap-2">
                  {multiSectors.map((sec) => {
                    const isSelected = selectedSectorIds.includes(sec.id);
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => handleToggleSector(sec.id)}
                        className={`flex items-center justify-between p-3 rounded-well border transition-all text-left ${
                          isSelected
                            ? 'bg-ink-850 border-gold-400/35 text-ivory-100 shadow-[0_0_20px_rgba(201,168,76,0.15)]'
                            : 'bg-ink-850 text-mist-300 border-gold-dim hover:border-gold-400/60 hover:text-ivory-100'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span
                            className={`font-display text-lg font-light ${
                              isSelected ? 'text-gold-300 font-normal' : 'text-ivory-100'
                            }`}
                          >
                            {sec.label}
                          </span>
                          <span className="text-[11px] text-mist-400 font-ui truncate mt-0.5">
                            {sec.description}
                          </span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs transition-all ${
                            isSelected
                              ? 'bg-gold-400 border-gold-400 text-onyx-900 font-bold'
                              : 'border-gold-dim bg-ink-900/60 text-transparent'
                          }`}
                        >
                          ✓
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Friendly "not on our radar" state when Gate 2 Existence fails */}
            {flightNotFoundError && Boolean(dateISO) && !isDetectingCabins && (
              <div className="w-full p-4 rounded-well bg-ink-850/90 border border-gold-dim text-left animate-fade-in space-y-1.5">
                <div className="flex items-center gap-2 text-gold-300 font-sans font-medium text-xs">
                  <span className="w-2 h-2 rounded-full bg-gold-400 animate-ping shrink-0" />
                  <span>Not on our radar for this date</span>
                </div>
                <p className="font-sans text-xs text-mist-300 leading-relaxed">
                  {flightNotFoundError}
                </p>
                <p className="font-sans text-[0.68rem] text-mist-400 pt-1 select-none">
                  Tip: Singapore Airlines publishes digital menus between today and 6 weeks ahead. Try selecting another date or checking your flight number.
                </p>
              </div>
            )}

            {/* Loading skeleton while detecting cabins */}
            {isDetectingCabins && Boolean(dateISO) && (!isMultiSector || selectedSectorIds.length > 0) && (
              <div className="w-full text-left animate-fade-in">
                <label className="block text-[0.65rem] font-sans font-medium uppercase tracking-[0.2em] text-mist-400 mb-2 select-none">
                  CABIN
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

            {/* STEP 4: Cabin Classes Multi-Select (none selected by default) */}
            {showCabinStep && (
              <div className="w-full text-left animate-cabin-in">
                <div className="flex items-center justify-between mb-2 select-none">
                  <label className="block text-[0.65rem] font-sans font-medium uppercase tracking-[0.2em] text-mist-400 select-none">
                    CABIN
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
                      isSelected={selectedCabins.includes(code)}
                      delayIndex={idx}
                      onToggle={handleToggleCabin}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: Reveal CTA (Appears only after cabin class/classes are selected) */}
            {showFetchButton && (
              <div className="w-full pt-2 mt-10">
                <RevealCTA
                  label="Fetch Menu ✨"
                  summary={flightSummaryLine}
                  onPress={handleStartFetch}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. RESULT SCREEN — EDITORIAL LUXURY MENU WITH CABIN & SECTOR SWITCHING */}
      {stage === 'result' && activeMenuData && (
        <div className="flex flex-col h-full overflow-hidden animate-cabin-in text-left">
          {/* STICKY LUXURY HEADER */}
          <div className="shrink-0 sticky top-0 z-20 backdrop-blur-md bg-ink-950/85 pb-3 pt-1 border-b border-gold-dim">
            {/* Row 1: Multi-Cabin Selector Tabs (if multiple cabins were selected) */}
            {selectedCabins.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 pb-2 overflow-x-auto no-scrollbar">
                {selectedCabins.map((cabinCode) => {
                  const label =
                    cabinCode === 'PREMIUM_ECONOMY'
                      ? 'Prem Econ'
                      : cabinCode.charAt(0) + cabinCode.slice(1).toLowerCase();
                  const isActive = activeCabinView === cabinCode;
                  return (
                    <button
                      key={cabinCode}
                      type="button"
                      onClick={() => {
                        setActiveCabinView(cabinCode);
                        setActiveLegIndex(0);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-ui uppercase tracking-wider font-semibold transition-all shrink-0 ${
                        isActive
                          ? 'bg-gold-400 text-onyx-900 shadow-sm'
                          : 'text-mist-300 hover:text-ivory-100 bg-ink-850/60 border border-gold-dim'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Row 2: Multi-Leg Sector Tabs */}
            {activeMenuData.legs && activeMenuData.legs.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 pb-2.5 overflow-x-auto no-scrollbar">
                {activeMenuData.legs.map((leg, idx) => (
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
                    <span>
                      {leg.origin} → {leg.destination}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Row 3: Category Tabs with Framer Motion Sliding Pill */}
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
                flightDate={currentLeg.depDateLocal || dateISO}
                cabinLabel={activeCabinLabel}
                cabinShort={activeCabinShort}
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
                legCount={activeMenuData.legs?.length || 1}
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
                        {/* Service Title */}
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
                                        cabin={activeCabinView}
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
                      <div className="flex items-center justify-between pb-2 border-b border-gold-dim">
                        <h3 className="font-display text-2xl text-ivory-100">{sec.title}</h3>
                        <Wine className="w-4 h-4 text-gold-400" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-1">
                        {sec.items.map((it) => (
                          <DishCard
                            key={it.id}
                            item={it}
                            courseCategory={sec.title}
                            cabin={activeCabinView}
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
                          cabin={activeCabinView}
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
                      <h3 className="font-display text-2xl text-ivory-100">Cabin Amenities</h3>
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
                          cabin={activeCabinView}
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
