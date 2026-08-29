import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { FlightNumberInput } from '../components/FlightNumberInput';
import { DepartureBlock, getTodayISO, formatDateDisplay } from '../components/DepartureBlock';
import { RevealCTA } from '../components/RevealCTA';
import { CabinPill } from '../components/CabinPill';
import { FlightChip } from '../components/FlightChip';
import { FetchInterlude, InterludeMessage } from '../components/FetchInterlude';
import { useFlightValidation } from '../hooks/useFlightValidation';
import { getCabinConfig, getMenu } from '../lib/sq/endpoints';
import { CabinCode, MenuData, LegMenuData } from '../lib/sq/types';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
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
  const navigate = useNavigate();
  const initialTodayISO = getTodayISO();
  const initialTodayDisplay = formatDateDisplay(initialTodayISO);

  // Screen Stages: 'form' | 'loading' | 'result'
  const [stage, setStage] = useState<'form' | 'loading' | 'result'>('form');

  // Flight validation — start with EMPTY input
  const validation = useFlightValidation('');
  const [dateISO, setDateISO] = useState<string>(initialTodayISO);
  const [dateDisplay, setDateDisplay] = useState<string>(initialTodayDisplay);

  // Cabin detection states — Single Select
  const [isDetectingCabins, setIsDetectingCabins] = useState(false);
  const [availableCabins, setAvailableCabins] = useState<CabinCode[]>([]);
  const [selectedCabin, setSelectedCabin] = useState<CabinCode>('BUSINESS');
  const [aircraftType, setAircraftType] = useState<string>('');

  // Menu results
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [activeLegIndex, setActiveLegIndex] = useState<number>(0);
  const [activeSegment, setActiveSegment] = useState<'dining' | 'cellar' | 'snacks' | 'amenities'>('dining');
  
  // Selection switcher state per meal service (mealServiceId -> selectionId)
  const [selectedMealOption, setSelectedMealOption] = useState<Record<string, string>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // 1. Live Cabin Detection on Flight / Date Change
  useEffect(() => {
    if (!validation.isValid || !dateISO || !validation.flightNo) {
      setAvailableCabins([]);
      setAircraftType('');
      return;
    }

    let isSubscribed = true;
    setIsDetectingCabins(true);

    getCabinConfig(validation.flightNo, dateISO)
      .then((config) => {
        if (!isSubscribed) return;
        setIsDetectingCabins(false);
        setAvailableCabins(config.available);
        setAircraftType(config.aircraftType || '');
        if (config.available.length > 0) {
          if (config.available.includes('BUSINESS')) {
            setSelectedCabin('BUSINESS');
          } else {
            setSelectedCabin(config.available[0]);
          }
        }
      })
      .catch(() => {
        if (!isSubscribed) return;
        setIsDetectingCabins(false);
        setAvailableCabins(['BUSINESS', 'ECONOMY']);
        setSelectedCabin('BUSINESS');
      });

    return () => {
      isSubscribed = false;
    };
  }, [validation.flightNo, validation.isValid, dateISO]);

  // Handle single cabin selection
  const handleSelectCabin = (code: CabinCode) => {
    setSelectedCabin(code);
  };

  // 2. Start Menu Fetch
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

    // Initialize first selection for each meal service
    const initialSelections: Record<string, string> = {};
    if (data.legs && data.legs.length > 0) {
      data.legs.forEach((leg) => {
        leg.mealServices.forEach((srv) => {
          if (srv.selections && srv.selections.length > 0) {
            initialSelections[srv.id] = srv.selections[0].id;
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

  const flightSummaryLine = `SQ${validation.cleanFlightNo} · ${dateDisplay} · ${cabinLabel}`;

  // Current Leg
  const currentLeg: LegMenuData | null =
    menuData && menuData.legs && menuData.legs.length > 0
      ? menuData.legs[activeLegIndex] || menuData.legs[0]
      : null;

  return (
    <Layout>
      {/* 1. LOADING INTERLUDE (5s Minimum Duration) */}
      {stage === 'loading' && (
        <FetchInterlude
          flightChipText={flightSummaryLine}
          messages={SKYMENU_MESSAGES}
          fetchTask={executeMenuFetch}
          onSuccess={handleFetchSuccess}
        />
      )}

      {/* 2. FORM FLOW */}
      {stage === 'form' && (
        <div className="flex flex-col justify-between h-full py-1 animate-fade-in">
          <div className="flex-1 max-h-8 sm:max-h-12" />

          <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center my-auto">
            {/* Eyebrow */}
            <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
              Menu of the day,
            </span>

            {/* Headline */}
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
              What are we serving?
            </h2>

            {/* Flight Number Input */}
            <div className="w-full mt-6 text-left">
              <FlightNumberInput
                value={validation.flightNo}
                onChange={validation.setFlightNo}
                isValid={validation.isValid}
                isChecking={validation.isChecking}
                error={validation.error}
                placeholder="3 2 2"
              />
            </div>

            {/* Departure Block */}
            {validation.isValid && validation.flightNo.length > 0 && (
              <div className="w-full mt-5 text-left">
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
              <div className="w-full mt-5 text-left animate-fade-in">
                <label className="block text-[0.7rem] font-medium tracking-[0.2em] uppercase text-text-secondary mb-2 select-none">
                  Available Cabin Classes
                </label>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-20 rounded-full bg-bg-elevated animate-pulse" />
                  <div className="h-8 w-24 rounded-full bg-bg-elevated animate-pulse" />
                  <div className="h-8 w-20 rounded-full bg-bg-elevated animate-pulse" />
                </div>
                <p className="font-serif italic text-text-tertiary text-xs mt-2">
                  Checking live flight cabin configuration…
                </p>
              </div>
            )}

            {/* Single Select Cabin Class Pills */}
            {!isDetectingCabins && availableCabins.length > 0 && (
              <div className="w-full mt-5 text-left animate-fade-in">
                <div className="flex items-center justify-between mb-2 select-none">
                  <label className="block text-[0.7rem] font-medium tracking-[0.2em] uppercase text-text-secondary">
                    Select Cabin Class
                  </label>
                  {aircraftType && (
                    <span className="text-[10px] text-accent/80 font-mono">
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
          </div>

          <div className="flex-1 max-h-8 sm:max-h-12" />

          {/* Reveal CTA */}
          {validation.isValid && validation.flightNo.length > 0 && dateISO && selectedCabin && (
            <div className="shrink-0 pb-2">
              <RevealCTA
                label="Fetch Menu"
                icon={Sparkles}
                summary={flightSummaryLine}
                onPress={handleStartFetch}
              />
            </div>
          )}
        </div>
      )}

      {/* 3. RESULT SCREEN */}
      {stage === 'result' && menuData && (
        <div className="flex flex-col h-full overflow-hidden animate-fade-in">
          
          {/* Top Header with Flight Chip & Multi-Leg Sector Tabs */}
          <div className="shrink-0 flex flex-col items-center pt-1 pb-2 border-b border-border-subtle/50">
            <FlightChip label={flightSummaryLine} />

            {/* Sector Tabs for Multi-Leg Flights (e.g. LAX → NRT, NRT → SIN) */}
            {menuData.legs && menuData.legs.length > 1 && (
              <div className="flex items-center gap-1.5 mt-2 p-1 rounded-full bg-bg-elevated border border-border-subtle overflow-x-auto max-w-full">
                {menuData.legs.map((leg, idx) => (
                  <button
                    key={leg.legId || idx}
                    type="button"
                    onClick={() => setActiveLegIndex(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      activeLegIndex === idx
                        ? 'bg-accent text-[#0B1E3E] font-semibold shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Plane className="w-3 h-3 rotate-45" />
                    <span>{leg.origin} → {leg.destination}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Segment Controls: Dining | Cellar | Snacks | Amenities */}
            <div className="flex items-center gap-1 mt-2.5 p-0.5 rounded-full bg-bg-surface border border-border-subtle text-xs">
              <button
                type="button"
                onClick={() => setActiveSegment('dining')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full font-medium transition-all ${
                  activeSegment === 'dining'
                    ? 'bg-accent/20 text-accent font-semibold border border-accent/40'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Utensils className="w-3 h-3" />
                <span>Dining</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSegment('cellar')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full font-medium transition-all ${
                  activeSegment === 'cellar'
                    ? 'bg-accent/20 text-accent font-semibold border border-accent/40'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Wine className="w-3 h-3" />
                <span>Cellar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSegment('snacks')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full font-medium transition-all ${
                  activeSegment === 'snacks'
                    ? 'bg-accent/20 text-accent font-semibold border border-accent/40'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Cookie className="w-3 h-3" />
                <span>Snacks</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSegment('amenities')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full font-medium transition-all ${
                  activeSegment === 'amenities'
                    ? 'bg-accent/20 text-accent font-semibold border border-accent/40'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Gift className="w-3 h-3" />
                <span>Amenities</span>
              </button>
            </div>
          </div>

          {/* Main Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-1 py-3 space-y-4">
            
            {/* 1. DINING SERVICE & PACED COURSES */}
            {activeSegment === 'dining' && currentLeg && (
              <>
                {currentLeg.mealServices.length === 0 ? (
                  <div className="p-8 text-center my-auto flex flex-col items-center justify-center">
                    <span className="font-serif italic text-accent text-base mb-1">
                      No Dining Services Published
                    </span>
                    <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
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
                      <div key={service.id} className="space-y-3">
                        {/* Meal Service Header */}
                        <div className="flex items-center justify-between pb-1 border-b border-border-subtle/70">
                          <h3 className="font-serif text-lg font-semibold text-text-primary">
                            {service.name}
                          </h3>

                          {/* Parallel Menu Toggles (e.g. International vs Japanese Kaiseki) */}
                          {service.selections.length > 1 && (
                            <div className="flex items-center gap-1 p-0.5 rounded-full bg-bg-elevated border border-border-subtle">
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
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                                    currentSelectionId === sel.id
                                      ? 'bg-accent text-[#0B1E3E] font-semibold shadow-xs'
                                      : 'text-text-secondary hover:text-text-primary'
                                  }`}
                                >
                                  {sel.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Paced Meal Courses */}
                        {currentSelection?.courses.map((course) => {
                          const isCollapsed = collapsedSections[course.id];
                          return (
                            <div
                              key={course.id}
                              className="rounded-card bg-bg-surface border border-border-subtle overflow-hidden"
                            >
                              <button
                                type="button"
                                onClick={() => toggleSectionCollapse(course.id)}
                                className="w-full px-4 py-2.5 bg-bg-elevated/80 flex items-center justify-between text-left border-b border-border-subtle/50"
                              >
                                <div>
                                  <span className="font-serif text-sm font-semibold text-text-primary">
                                    {course.name}
                                  </span>
                                  {course.maxSequence && (
                                    <span className="text-[10px] text-accent/90 ml-2 font-mono">
                                      (Choice of {course.maxSequence})
                                    </span>
                                  )}
                                </div>
                                {isCollapsed ? (
                                  <ChevronDown className="w-4 h-4 text-text-tertiary" />
                                ) : (
                                  <ChevronUp className="w-4 h-4 text-text-tertiary" />
                                )}
                              </button>

                              {!isCollapsed && (
                                <div className="p-3 space-y-3.5">
                                  {course.items.map((item) => (
                                    <div key={item.id} className="flex gap-3 items-start">
                                      {item.imageUrl && (
                                        <img
                                          src={item.imageUrl}
                                          alt={item.title}
                                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover bg-bg-elevated border border-border-subtle shrink-0 shadow-sm"
                                          loading="lazy"
                                          onError={(e) => {
                                            (e.currentTarget as HTMLElement).style.display = 'none';
                                          }}
                                        />
                                      )}
                                      <div className="flex-1 text-left">
                                        <h4 className="font-serif font-semibold text-xs sm:text-sm text-text-primary leading-snug">
                                          {item.title}
                                        </h4>
                                        {item.description && (
                                          <p className="font-sans text-[0.78rem] text-text-secondary mt-1 leading-relaxed">
                                            {item.description}
                                          </p>
                                        )}
                                        {item.footnote && (
                                          <p className="font-serif italic text-[0.72rem] text-text-tertiary mt-0.5">
                                            {item.footnote}
                                          </p>
                                        )}
                                        {item.tags && item.tags.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-1.5">
                                            {item.tags.map((tag, tIdx) => (
                                              <span
                                                key={tIdx}
                                                className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                                  tag === 'Signature'
                                                    ? 'bg-accent/20 text-accent border border-accent/40 font-semibold'
                                                    : tag === 'Culinary Panel'
                                                    ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                                    : 'bg-bg-elevated text-text-secondary border border-border-subtle'
                                                }`}
                                              >
                                                {tag}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* 2. CELLAR-BOOK DRINKS & BEVERAGES */}
            {activeSegment === 'cellar' && currentLeg && (
              <div className="space-y-3">
                {currentLeg.drinks.length === 0 ? (
                  <div className="p-8 text-center my-auto flex flex-col items-center justify-center">
                    <span className="font-serif italic text-accent text-base mb-1">
                      No Cellar Listing Available
                    </span>
                    <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                      Beverage selections have not been published for this sector yet.
                    </p>
                  </div>
                ) : (
                  currentLeg.drinks.map((sec) => (
                    <div
                      key={sec.id}
                      className="rounded-card bg-bg-surface border border-border-subtle overflow-hidden"
                    >
                      <div className="px-4 py-2.5 bg-bg-elevated/70 border-b border-border-subtle/50 flex items-center justify-between">
                        <span className="font-serif text-sm font-semibold text-text-primary">
                          {sec.title}
                        </span>
                        <Wine className="w-3.5 h-3.5 text-accent" />
                      </div>

                      <div className="p-3 space-y-2.5">
                        {sec.items.map((it) => (
                          <div key={it.id} className="text-left pb-2 border-b border-border-subtle/30 last:border-b-0 last:pb-0">
                            <h4 className="font-sans font-semibold text-xs sm:text-sm text-text-primary leading-snug">
                              {it.title}
                            </h4>
                            {it.description && (
                              <p className="font-sans text-[0.78rem] text-text-secondary mt-0.5 leading-relaxed">
                                {it.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. DELECTABLES & INFLIGHT SNACKS */}
            {activeSegment === 'snacks' && currentLeg && (
              <div>
                {currentLeg.snacks.length === 0 ? (
                  <div className="p-8 text-center my-auto flex flex-col items-center justify-center">
                    <span className="font-serif italic text-accent text-base mb-1">
                      Inflight Snack Basket
                    </span>
                    <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                      Complimentary snacks are available on board upon request.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentLeg.snacks.map((snk) => (
                      <div
                        key={snk.id}
                        className="p-3 rounded-card bg-bg-surface border border-border-subtle text-left space-y-1"
                      >
                        <span className="font-sans font-semibold text-xs text-text-primary block">
                          {snk.title}
                        </span>
                        {snk.description && (
                          <span className="text-[11px] text-text-secondary block">
                            {snk.description}
                          </span>
                        )}
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-bg-elevated text-accent/80 border border-accent/20 inline-block mt-1">
                          Available on Request
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. LUXURY CABIN AMENITIES */}
            {activeSegment === 'amenities' && currentLeg && (
              <div>
                {currentLeg.amenities.length === 0 ? (
                  <div className="p-8 text-center my-auto flex flex-col items-center justify-center">
                    <span className="font-serif italic text-accent text-base mb-1">
                      Amenities
                    </span>
                    <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                      Amenity kits, slippers, and comfort items provided on long-haul flights.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentLeg.amenities.map((am) => (
                      <div
                        key={am.id}
                        className="p-3 rounded-card bg-bg-surface border border-border-subtle text-left flex gap-3 items-start"
                      >
                        {am.imageUrl && (
                          <img
                            src={am.imageUrl}
                            alt={am.name}
                            className="w-14 h-14 rounded-lg object-cover bg-bg-elevated border border-border-subtle shrink-0"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-serif font-semibold text-xs text-text-primary">
                            {am.name}
                          </h4>
                          {am.description && (
                            <p className="text-[11px] text-text-secondary mt-0.5">
                              {am.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Sticky Bottom Action Row */}
          <div className="shrink-0 flex items-center justify-between gap-3 pt-2.5 pb-1 border-t border-border-subtle/50">
            <button
              type="button"
              onClick={() => setStage('form')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border-subtle hover:border-border-hover text-xs font-medium text-text-secondary hover:text-text-primary transition-all active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Flight</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2 rounded-full border border-border-subtle hover:border-border-hover text-xs font-medium text-text-secondary hover:text-text-primary transition-all active:scale-95"
            >
              Back to Home
            </button>
          </div>

        </div>
      )}
    </Layout>
  );
};
