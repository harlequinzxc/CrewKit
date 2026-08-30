import React, { useState, useEffect, useRef } from 'react';
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
import {
  getMenu,
  getKnownFlightSectors,
  SectorLegOption,
  checkFlightExistence,
  LiveCheckResult,
} from '../lib/sq/endpoints';
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
  AlertCircle,
  Clock,
  WifiOff,
} from 'lucide-react';

const SKYMENU_MESSAGES: InterludeMessage[] = [
  { text: 'Retrieving menu from seat pocket…', durationMs: 3000 },
  { text: 'Almost ready…', durationMs: 2000 },
];

export const SkyMenu: React.FC = () => {
  // Screen Stages: 'form' | 'loading' | 'result'
  const [stage, setStage] = useState<'form' | 'loading' | 'result'>('form');

  // Flight validation hook
  const validation = useFlightValidation('');

  // Step 2: Departure Date (not selected by default)
  const [dateISO, setDateISO] = useState<string>('');
  const [dateDisplay, setDateDisplay] = useState<string>('');

  // Client UX State: 'idle' | 'checking' | 'valid' | 'not-found' | 'error'
  const [checkState, setCheckState] = useState<'idle' | 'checking' | 'valid' | 'not-found' | 'error'>('idle');
  const [checkFeedback, setCheckFeedback] = useState<{
    code?: string;
    heading?: string;
    message?: string;
    guidance?: string;
  } | null>(null);

  // Special multi-sector flight detection (e.g. SQ12, SQ11, SQ26, SQ25)
  const [multiSectors, setMultiSectors] = useState<SectorLegOption[] | null>(null);
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);

  // Step 4: Cabin detection & Multi-selection
  const [availableCabins, setAvailableCabins] = useState<CabinCode[]>([]);
  const [selectedCabins, setSelectedCabins] = useState<CabinCode[]>([]);
  const [aircraftType, setAircraftType] = useState<string>('');

  // Result Menu states
  const [activeCabinView, setActiveCabinView] = useState<CabinCode>('BUSINESS');
  const [menuByCabin, setMenuByCabin] = useState<Record<string, MenuData>>({});
  const [activeLegIndex, setActiveLegIndex] = useState<number>(0);
  const [activeSegment, setActiveSegment] = useState<'dining' | 'drinks' | 'snacks' | 'amenities'>('dining');

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
    isAmenity?: boolean;
  }>({
    open: false,
    src: null,
    title: '',
  });

  // Ref to abort ongoing fetch operations when input/date changes
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Live change: when flight number changes, reset state and downstream selections immediately
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setDateISO('');
    setDateDisplay('');
    setSelectedSectorIds([]);
    setAvailableCabins([]);
    setSelectedCabins([]);
    setAircraftType('');
    setCheckState('idle');
    setCheckFeedback(null);

    if (validation.isValid && validation.flightNo) {
      const known = getKnownFlightSectors(validation.flightNo);
      setMultiSectors(known);
    } else {
      setMultiSectors(null);
    }
  }, [validation.flightNo, validation.isValid]);

  const isMultiSector = Boolean(multiSectors && multiSectors.length > 1);

  // 2. Live change: when date is selected, trigger live flight existence check
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!validation.flightNo || !validation.isValid || !dateISO) {
      setAvailableCabins([]);
      setSelectedCabins([]);
      setAircraftType('');
      setCheckState('idle');
      setCheckFeedback(null);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setCheckState('checking');
    setCheckFeedback(null);

    checkFlightExistence(validation.flightNo, dateISO, controller.signal)
      .then((result: LiveCheckResult) => {
        if (controller.signal.aborted) return;

        if (result.ok) {
          setCheckState('valid');
          setAircraftType(result.data.aircraftType || '');

          const codes: CabinCode[] = [];
          result.data.cabins.forEach((c) => {
            const codeUpper = c.code.toUpperCase();
            if (codeUpper === 'FCL' || codeUpper === 'SUITES' || codeUpper === 'FIRST') {
              const code = result.data.aircraftType?.includes('380') ? 'SUITES' : 'FIRST';
              if (!codes.includes(code)) codes.push(code);
            } else if (codeUpper === 'JCL' || codeUpper === 'BUSINESS') {
              if (!codes.includes('BUSINESS')) codes.push('BUSINESS');
            } else if (codeUpper === 'SCL' || codeUpper === 'PREMIUM_ECONOMY') {
              if (!codes.includes('PREMIUM_ECONOMY')) codes.push('PREMIUM_ECONOMY');
            } else if (codeUpper === 'YCL' || codeUpper === 'ECONOMY') {
              if (!codes.includes('ECONOMY')) codes.push('ECONOMY');
            }
          });

          setAvailableCabins(codes.length > 0 ? codes : ['BUSINESS', 'ECONOMY']);
          setCheckFeedback(null);
        } else {
          setAvailableCabins([]);
          setSelectedCabins([]);
          setAircraftType('');

          if (result.code === 'NOT_FOUND') {
            setCheckState('not-found');
            setCheckFeedback({
              code: 'NOT_FOUND',
              heading: 'No flight found',
              message: 'No flight found',
              guidance: 'Check the flight number and date. Menus are generally published up to eight days before departure.',
            });
          } else if (result.code === 'NO_CABINS') {
            setCheckState('not-found');
            setCheckFeedback({
              code: 'NO_CABINS',
              heading: 'No flight found',
              message: 'No flight found',
              guidance: 'Menus are generally published up to eight days before departure.',
            });
          } else {
            setCheckState('error');
            setCheckFeedback({
              code: result.code,
              heading: 'No flight found',
              message: result.message || 'No flight found',
            });
          }
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setCheckState('error');
        setAvailableCabins([]);
        setSelectedCabins([]);
        setCheckFeedback({
          code: 'UPSTREAM_NETWORK',
          heading: 'Service Unreachable',
          message: 'The Singapore Airlines menu service is temporarily unreachable.',
        });
      });

    return () => {
      controller.abort();
    };
  }, [validation.flightNo, validation.isValid, dateISO]);

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
    checkState === 'valid' &&
    availableCabins.length > 0;
  const showFetchButton = showCabinStep && selectedCabins.length > 0;

  // Check availability for dynamic category list per active leg
  const hasSnacks = Boolean(currentLeg?.snacks && currentLeg.snacks.length > 0);
  const hasAmenities = Boolean(currentLeg?.amenities && currentLeg.amenities.length > 0);

  // Dynamic automatic fallback if active tab is no longer available on active leg
  useEffect(() => {
    if (activeSegment === 'snacks' && !hasSnacks) {
      setActiveSegment('dining');
    }
    if (activeSegment === 'amenities' && !hasAmenities) {
      setActiveSegment('dining');
    }
  }, [activeLegIndex, activeCabinView, hasSnacks, hasAmenities, activeSegment]);

  const availableCategories = [
    { id: 'dining' as const, label: 'Dining', icon: Utensils },
    { id: 'drinks' as const, label: 'Drinks', icon: Wine },
    ...(hasSnacks ? [{ id: 'snacks' as const, label: 'Snacks', icon: Cookie }] : []),
    ...(hasAmenities ? [{ id: 'amenities' as const, label: 'Amenities', icon: Gift }] : []),
  ];

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
                inputRef={validation.inputRef}
                value={validation.flightNo}
                onChange={validation.setFlightNo}
                isValid={validation.isValid}
                error={validation.error}
                placeholder="1 1"
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

            {/* Stage: CHECKING — Progress indicator & spinner */}
            {checkState === 'checking' && Boolean(dateISO) && (
              <div className="w-full text-left animate-fade-in space-y-2">
                <label className="block text-[0.65rem] font-sans font-medium uppercase tracking-[0.2em] text-mist-400 select-none">
                  CABIN
                </label>
                <div className="flex items-center gap-2.5 p-3 rounded-well bg-ink-850/80 border border-gold-dim">
                  <div className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="font-ui text-xs text-mist-300">Checking the flight…</span>
                </div>
              </div>
            )}

            {/* Stage: NOT-FOUND — Accurate heading & guidance */}
            {checkState === 'not-found' && checkFeedback && (
              <div
                role="alert"
                aria-live="polite"
                className="w-full p-4 rounded-well bg-ink-850/95 border border-gold-dim text-left animate-fade-in space-y-2"
              >
                <div className="flex items-center gap-2 text-gold-300 font-sans font-semibold text-xs">
                  <AlertCircle className="w-4 h-4 text-gold-400 shrink-0" />
                  <span>{checkFeedback.heading}</span>
                </div>
                <p className="font-sans text-xs text-ivory-100 leading-relaxed">
                  {checkFeedback.message}
                </p>
                {checkFeedback.guidance && (
                  <p className="font-sans text-[0.72rem] text-mist-400 pt-1 border-t border-gold-dim/40 leading-relaxed select-none">
                    {checkFeedback.guidance}
                  </p>
                )}
              </div>
            )}

            {/* Stage: ERROR — Upstream timeout or network error */}
            {checkState === 'error' && checkFeedback && (
              <div
                role="alert"
                aria-live="polite"
                className="w-full p-4 rounded-well bg-ink-850/95 border border-danger/40 text-left animate-fade-in space-y-2"
              >
                <div className="flex items-center gap-2 text-danger font-sans font-semibold text-xs">
                  {checkFeedback.code === 'UPSTREAM_TIMEOUT' ? (
                    <Clock className="w-4 h-4 text-danger shrink-0" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-danger shrink-0" />
                  )}
                  <span>{checkFeedback.heading}</span>
                </div>
                <p className="font-sans text-xs text-mist-300 leading-relaxed">
                  {checkFeedback.message}
                </p>
              </div>
            )}

            {/* STEP 4: Cabin Classes Multi-Select (Appears when flight check is valid) */}
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

      {/* 3. RESULT SCREEN — EDITORIAL LUXURY MENU WITH SHIFTED ROUTE HERO AT TOP */}
      {stage === 'result' && activeMenuData && (
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar animate-cabin-in text-left pb-16">
          {/* Row 1: Multi-Cabin Selector Tabs (if multiple cabins were selected) */}
          {selectedCabins.length > 1 && (
            <div className="shrink-0 flex items-center justify-center gap-1.5 pt-1 pb-3 overflow-x-auto no-scrollbar">
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
                    className={`px-3.5 py-1.5 rounded-full text-xs font-ui uppercase tracking-wider font-semibold transition-all shrink-0 ${
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

          {/* 1. ROUTE HERO SHIFTED TO THE TOP */}
          {currentLeg && (
            <div className="shrink-0 pt-1 pb-3">
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
            </div>
          )}

          {/* 2. BELOW ROUTE HERO: SECTOR PILLS (IF MULTI SECTOR) */}
          {activeMenuData.legs && activeMenuData.legs.length > 1 && (
            <div className="shrink-0 flex items-center justify-center gap-2 pb-3 overflow-x-auto no-scrollbar">
              {activeMenuData.legs.map((leg, idx) => {
                const isActive = activeLegIndex === idx;
                return (
                  <button
                    key={leg.legId || idx}
                    type="button"
                    onClick={() => {
                      setActiveLegIndex(idx);
                      const targetLeg = activeMenuData.legs[idx];
                      if (activeSegment === 'snacks' && (!targetLeg?.snacks || targetLeg.snacks.length === 0)) {
                        setActiveSegment('dining');
                      }
                      if (activeSegment === 'amenities' && (!targetLeg?.amenities || targetLeg.amenities.length === 0)) {
                        setActiveSegment('dining');
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-ui uppercase tracking-wider font-semibold transition-all shrink-0 ${
                      isActive
                        ? 'bg-gold-400 text-onyx-900 shadow-sm'
                        : 'text-mist-300 hover:text-ivory-100 bg-ink-850/60 border border-gold-dim'
                    }`}
                  >
                    <Plane className="w-3 h-3 rotate-45" />
                    <span>
                      {leg.origin} → {leg.destination}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. BELOW SECTOR PILLS / ROUTE HERO: STICKY TOP BAR OF CATEGORIES */}
          <div className="sticky top-0 z-20 backdrop-blur-md bg-ink-950/90 py-2 border-y border-gold-dim/40 mb-6">
            <div className="flex items-center justify-center gap-1 p-1 rounded-full bg-ink-850 border border-gold-dim max-w-md mx-auto relative select-none">
              {availableCategories.map((tab) => {
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

          {/* MAIN MENU CONTENT SECTIONS */}
          <div className="px-1 sm:px-2 space-y-8">
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

            {/* 2. DRINKS (CELLAR, COFFEE, TEA & BEVERAGES) */}
            {activeSegment === 'drinks' && currentLeg && (
              <div className="space-y-8">
                {currentLeg.drinks.length === 0 ? (
                  <div className="py-16 text-center my-auto flex flex-col items-center justify-center">
                    <span className="font-display text-2xl text-ivory-100 mb-2">
                      No Drinks Listing Available
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

            {/* 3. DELECTABLES & SNACKS (RENDERED IF AVAILABLE) */}
            {activeSegment === 'snacks' && currentLeg && (
              <div className="space-y-6">
                {currentLeg.snacks.length === 0 ? (
                  <div className="py-16 text-center my-auto flex flex-col items-center justify-center">
                    <span className="font-display text-2xl text-ivory-100 mb-2">
                      No Snacks Available
                    </span>
                    <p className="font-sans text-sm text-mist-300 max-w-sm leading-relaxed">
                      Complimentary snacks and refreshments are available on board upon request.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-gold-dim">
                      <h3 className="font-display text-2xl text-ivory-100">
                        Delectables &amp; Snacks
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

            {/* 4. CABIN AMENITIES (FITTED TO FRAME & WHITE BACKGROUND) */}
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
                          imageFit="contain"
                          imageBg="white"
                          onOpenLightbox={(data) => setLightboxData({ ...data, open: true, isAmenity: true })}
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
            isAmenity={lightboxData.isAmenity}
          />
        </div>
      )}
    </Layout>
  );
};
