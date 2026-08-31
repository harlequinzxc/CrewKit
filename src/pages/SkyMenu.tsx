import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/ui/Layout';
import { FlightNumberInput } from '../components/FlightNumberInput';
import { DepartureBlock } from '../components/DepartureBlock';
import { RevealCTA } from '../components/RevealCTA';
import { CabinPill } from '../components/CabinPill';
import { FetchInterlude, InterludeMessage } from '../components/FetchInterlude';
import { RouteHero } from '../components/RouteHero';
import {
  Heading,
  Text,
  SegmentedControl,
  StickyHeader,
  GoldHairline,
  MenuItemCard,
  InlineDropdownGroup,
  InlineDropdownDimension,
  TextTabs,
  AnimatedContent,
  EmptyState,
} from '../components/ui';
import { useFlightValidation } from '../hooks/useFlightValidation';
import {
  getMenu,
  getKnownFlightSectors,
  SectorLegOption,
  checkFlightExistence,
  LiveCheckResult,
} from '../lib/sq/endpoints';
import { CabinCode, MenuData, LegMenuData } from '../lib/sq/types';
import { cn } from '../lib/utils';
import {
  Utensils,
  Wine,
  Gift,
  Cookie,
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

  // Active meal service in view (e.g. for multi-service flights like Dinner vs Breakfast)
  const [activeMealServiceId, setActiveMealServiceId] = useState<string>('');

  // Controlled state for open inline dropdown (only 1 open at a time)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Ref to abort ongoing fetch operations when input/date changes
  const abortControllerRef = useRef<AbortController | null>(null);

  // Refs for scroll container and sticky header
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null);

  // Scroll-on-option-change tracking refs
  const isInitialResultRender = useRef<boolean>(true);
  const prevViewKeysRef = useRef({
    activeSegment,
    activeMealServiceId,
    activeLegIndex,
    activeCabinView,
    selectedMealOptionKey: JSON.stringify(selectedMealOption),
  });

  // Scroll-on-option-change behavior (Anchor priority: Title -> Section Header -> First Item -> Empty State)
  useEffect(() => {
    if (stage !== 'result') {
      isInitialResultRender.current = true;
      return;
    }

    const prev = prevViewKeysRef.current;
    const currentKey = {
      activeSegment,
      activeMealServiceId,
      activeLegIndex,
      activeCabinView,
      selectedMealOptionKey: JSON.stringify(selectedMealOption),
    };

    const hasChanged =
      prev.activeSegment !== currentKey.activeSegment ||
      prev.activeMealServiceId !== currentKey.activeMealServiceId ||
      prev.activeLegIndex !== currentKey.activeLegIndex ||
      prev.activeCabinView !== currentKey.activeCabinView ||
      prev.selectedMealOptionKey !== currentKey.selectedMealOptionKey;

    prevViewKeysRef.current = currentKey;

    if (isInitialResultRender.current) {
      isInitialResultRender.current = false;
      return;
    }

    if (!hasChanged) return;

    // If dropdown is open, close it first and wait for collapse animation
    const wasDropdownOpen = Boolean(openDropdownId);
    if (wasDropdownOpen) {
      setOpenDropdownId(null);
    }

    const delay = wasDropdownOpen ? 220 : 50;

    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        const titleEl = document.getElementById('menu-service-title');
        const sectionHeaderEl =
          document.querySelector<HTMLElement>('[data-menu-section-header="true"]') ||
          document.getElementById('menu-first-section');
        const firstItemEl = document.getElementById('menu-first-item');
        const emptyStateEl = document.getElementById('menu-category-empty');

        const targetEl = titleEl || sectionHeaderEl || firstItemEl || emptyStateEl;

        if (targetEl && scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const stickyHeight = stickyHeaderRef.current?.offsetHeight || 280;
          const targetRect = targetEl.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const relativeTop = targetRect.top - containerRect.top + container.scrollTop;
          const scrollPosition = Math.max(0, relativeTop - stickyHeight - 16);

          const prefersReduced =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

          container.scrollTo({
            top: scrollPosition,
            behavior: prefersReduced ? 'auto' : 'smooth',
          });
        }
      });
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [
    stage,
    activeSegment,
    activeMealServiceId,
    activeLegIndex,
    activeCabinView,
    selectedMealOption,
    openDropdownId,
  ]);

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
      const rawMenu = menus[idx];
      const menu: MenuData = {
        ...rawMenu,
        legs: rawMenu.legs ? rawMenu.legs.map((l) => ({ ...l })) : [],
      };

      if (selectedSectorIds.length > 0 && menu.legs.length > 0) {
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

    const primary = result.mapping[initialCabin];
    const initialSelections: Record<string, string> = {};
    let initialServiceId = '';

    if (primary && primary.legs && primary.legs.length > 0) {
      primary.legs.forEach((leg, lIdx) => {
        if (lIdx === 0 && leg.mealServices.length > 0) {
          initialServiceId = leg.mealServices[0].id;
        }
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
    setActiveMealServiceId(initialServiceId);
    setStage('result');
  };

  const handleSelectLegIndex = (idx: number) => {
    setActiveLegIndex(idx);
    const targetLeg = activeMenuData?.legs?.[idx];
    if (targetLeg && targetLeg.mealServices.length > 0) {
      setActiveMealServiceId(targetLeg.mealServices[0].id);
    }
    const targetHasSnacks = Boolean(
      targetLeg?.snacks && targetLeg.snacks.groups && targetLeg.snacks.groups.length > 0
    );
    const targetHasAmenities = Boolean(
      targetLeg?.amenities && targetLeg.amenities.length > 0
    );
    if (activeSegment === 'snacks' && !targetHasSnacks) {
      setActiveSegment('dining');
    }
    if (activeSegment === 'amenities' && !targetHasAmenities) {
      setActiveSegment('dining');
    }
  };

  const activeMenuData: MenuData | null = menuByCabin[activeCabinView] || Object.values(menuByCabin)[0] || null;

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

  // Check availability for dynamic category list strictly per active sector/leg
  const hasSnacks = Boolean(currentLeg?.snacks && currentLeg.snacks.groups && currentLeg.snacks.groups.length > 0);
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

  // STICKY BAR: Categories (Snacks permanently available with dedicated empty state if none exist)
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

  // Dimension 1: Cabin (Strict Priority: First, Suites, Biz, Prem, Econ)
  const CABIN_PRIORITY: Record<string, number> = {
    FIRST: 1,
    SUITES: 2,
    BUSINESS: 3,
    PREMIUM_ECONOMY: 4,
    ECONOMY: 5,
  };

  const rawCabinCodes = (
    selectedCabins.length > 0 ? selectedCabins : (Object.keys(menuByCabin) as CabinCode[])
  );

  const sortedCabinCodes = [...rawCabinCodes].sort(
    (a, b) => (CABIN_PRIORITY[a] || 99) - (CABIN_PRIORITY[b] || 99)
  );

  const cabinOptions = sortedCabinCodes.map((c) => {
    const shortLabel =
      c === 'FIRST'
        ? 'First'
        : c === 'SUITES'
        ? 'Suites'
        : c === 'BUSINESS'
        ? 'Biz'
        : c === 'PREMIUM_ECONOMY'
        ? 'Prem'
        : 'Econ';
    const fullLabel =
      c === 'PREMIUM_ECONOMY'
        ? 'Premium Economy'
        : c.charAt(0) + c.slice(1).toLowerCase();
    return {
      id: c,
      label: fullLabel,
      shortLabel,
    };
  });

  // Dimension 2: Sector (e.g. SIN → NRT, NRT → LAX)
  const sectorOptions = (activeMenuData?.legs || []).map((leg, idx) => ({
    id: String(idx),
    label: `${leg.originCity || leg.origin} to ${leg.destinationCity || leg.destination}`,
    shortLabel: `${leg.origin} → ${leg.destination}`,
    description: `${leg.origin} (${leg.depTime || ''}) → ${leg.destination} (${leg.arrTime || ''})`,
  }));

  // Dimension 3: Menu Type (Strict Priority: 1. Route, 2. Ethnic; Full name in list, "Ethnic"/"Route" on trigger)
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
      label: sel.name, // Full descriptive name in dropdown list
      shortLabel,      // "Ethnic" or "Route" on trigger button
    };
  });

  const dropdownDimensions: InlineDropdownDimension[] = [
    ...(cabinOptions.length >= 2
      ? [
          {
            id: 'cabin',
            label: 'Cabin Class',
            value: activeCabinView,
            options: cabinOptions,
            onChange: (val: string) => {
              setActiveCabinView(val as CabinCode);
            },
          },
        ]
      : []),
    ...(sectorOptions.length >= 2
      ? [
          {
            id: 'sector',
            label: 'Sector Leg',
            value: String(activeLegIndex),
            options: sectorOptions,
            onChange: (val: string) => {
              handleSelectLegIndex(Number(val));
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

  return (
    <Layout containerClassName="w-full md:w-[85%] max-w-6xl">
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
              <Text variant="eyebrow">Menu of the day,</Text>
              <Heading variant="hero" as="h2">
                What are we serving?
              </Heading>
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
                <Text variant="overline">SECTOR</Text>

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
                <Text variant="overline">CABIN</Text>
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
                  <Text variant="overline">CABIN</Text>
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

      {/* 3. RESULT SCREEN — CONSOLIDATED LAYERED STICKY STACK + ANIMATED CONTENT */}
      {stage === 'result' && activeMenuData && (
        <div
          ref={scrollContainerRef}
          className="flex flex-col h-full overflow-y-auto no-scrollbar animate-cabin-in text-left pb-16"
        >
          {/* ── CONSOLIDATED LAYERED STICKY STACK (TOP TO BOTTOM) ── */}
          <StickyHeader ref={stickyHeaderRef} className="mb-4 pb-2">
            <div className="w-full flex flex-col gap-2.5 sm:gap-3">
              {/* Layer 2: Route Hero Card (Info-only, fully sticky) */}
              {currentLeg && (
                <RouteHero
                  flightNumber={`SQ ${validation.cleanFlightNo}`}
                  flightDate={currentLeg.depDateLocal || dateISO}
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

              {/* Layer 3: Dropdown Row (Cabin / Sector / Culinary Line) */}
              {dropdownDimensions.length > 0 && (
                <div className="w-full max-w-xl mx-auto">
                  <InlineDropdownGroup
                    dimensions={dropdownDimensions}
                    activeDropdownId={openDropdownId}
                    onActiveDropdownChange={setOpenDropdownId}
                  />
                </div>
              )}

              {/* Layer 4: Category Pills (Food / Drinks / Snacks / Amenities) */}
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

              {/* Layer 5: Meal Service Text Tabs (Conditional: Food + 2+ services) */}
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
                    message={`Dining menus for SQ${validation.cleanFlightNo} (${currentLeg.origin} → ${currentLeg.destination}) are not available yet.`}
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
                          {/* ── MEAL SERVICE TITLE: Centered, Title text only, NO lines or subtitles ── */}
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
                                {/* Centered Editorial Course Header framed by graduated gold hairlines */}
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
              <div className="pt-2 pb-8 space-y-10">
                {currentLeg.drinks.length === 0 ? (
                  <EmptyState
                    id="menu-category-empty"
                    heading="No Drinks Listing Available"
                    message="Beverage, tea, and coffee selections have not been published for this sector yet."
                  />
                ) : (
                  currentLeg.drinks.map((sec, idx) => (
                    <div key={sec.id} className="w-full">
                      {/* Centered Editorial Drinks Header */}
                      <div
                        data-menu-section-header="true"
                        {...(idx === 0 ? { id: 'menu-first-section' } : {})}
                        className={cn(
                          'flex items-center gap-4 w-full select-none',
                          idx === 0
                            ? 'my-6 md:my-8'
                            : 'my-8 md:my-10'
                        )}
                      >
                        <GoldHairline className="flex-1" />
                        <div className="flex flex-col items-center gap-1 text-center select-none px-2 shrink-0">
                          <Text
                            variant="overline"
                            className="text-gold-300 tracking-[0.25em] text-[0.7rem] font-medium uppercase"
                          >
                            {sec.title}
                          </Text>
                        </div>
                        <GoldHairline className="flex-1" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mt-6">
                        {sec.items.map((it, iIdx) => (
                          <div
                            key={it.id}
                            {...(idx === 0 && iIdx === 0 ? { id: 'menu-first-item' } : {})}
                            className="w-full"
                          >
                            <MenuItemCard
                              item={it}
                              courseCategory={sec.title}
                              cabin={activeCabinView}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. DELECTABLES & SNACKS (EDITORIAL LIST + GRADUATED HAIRLINES) */}
            {activeSegment === 'snacks' && currentLeg && (
              <div className="pt-2 pb-8 space-y-8 max-w-2xl mx-auto w-full">
                {!currentLeg.snacks || currentLeg.snacks.groups.length === 0 ? (
                  <EmptyState
                    id="menu-category-empty"
                    message="Snacks are not available on this sector."
                  />
                ) : (
                  <div className="space-y-8">
                    {/* Intro / Helper Copy */}
                    {currentLeg.snacks.header && (
                      <div className="mb-6 text-center">
                        <Text variant="secondary" className="text-xs sm:text-[0.8rem] text-mist-300 leading-relaxed max-w-xl mx-auto">
                          {currentLeg.snacks.header}
                        </Text>
                      </div>
                    )}

                    {/* Groups */}
                    <div className="space-y-10">
                      {currentLeg.snacks.groups.map((group, gIdx) => (
                        <div
                          key={gIdx}
                          data-menu-section-header="true"
                          {...(gIdx === 0 ? { id: 'menu-first-section' } : {})}
                          className={cn(
                            'w-full',
                            gIdx === 0 ? 'pt-2' : 'mt-8'
                          )}
                        >
                          {/* Section Header: Left-aligned label + Flexible Graduated Hairline */}
                          <div className="flex items-center gap-3 w-full select-none">
                            <Text
                              variant="overline"
                              className="text-gold-300 tracking-[0.22em] text-[0.65rem] sm:text-[0.7rem] font-medium uppercase shrink-0"
                            >
                              {group.name}
                            </Text>
                            <GoldHairline className="flex-1" />
                          </div>

                          {/* Quiet Editorial List Items (Single column, no cards, no pills, no lines between items) */}
                          <div className="mt-4 flex flex-col">
                            {group.items.map((item, iIdx) => (
                              <div
                                key={`snk-${gIdx}-${iIdx}`}
                                {...(gIdx === 0 && iIdx === 0 ? { id: 'menu-first-item' } : {})}
                                className="py-2.5 sm:py-3 flex items-start gap-3 w-full text-left select-none"
                              >
                                {/* Small gold disc marker (6px) vertically aligned with text */}
                                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0 mt-2 shadow-[0_0_8px_rgba(201,168,76,0.3)]" />

                                {/* Text block: Title + optional Description */}
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
                    {/* Centered Editorial Amenities Header */}
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
      )}
    </Layout>
  );
};
