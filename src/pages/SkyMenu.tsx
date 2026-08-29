import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { FlightNumberInput } from '../components/FlightNumberInput';
import { DepartureBlock } from '../components/DepartureBlock';
import { RevealCTA } from '../components/RevealCTA';
import { CabinPill } from '../components/CabinPill';
import { FlightChip } from '../components/FlightChip';
import { FetchInterlude, InterludeMessage } from '../components/FetchInterlude';
import { useFlightValidation } from '../hooks/useFlightValidation';
import { getCabinConfig, getMenu } from '../lib/sq/endpoints';
import { CabinCode, MenuData } from '../lib/sq/types';
import { Sparkles, ChevronDown, ChevronUp, Printer, ArrowLeft, Utensils, Wine } from 'lucide-react';

const SKYMENU_MESSAGES: InterludeMessage[] = [
  { text: 'Retrieving menu from seat pocket…', durationMs: 3000 },
  { text: 'Almost ready…', durationMs: 2000 },
];

export const SkyMenu: React.FC = () => {
  const navigate = useNavigate();

  // Screen Stages: 'form' | 'loading' | 'result'
  const [stage, setStage] = useState<'form' | 'loading' | 'result'>('form');

  // Flight validation
  const validation = useFlightValidation('322');
  const [dateISO, setDateISO] = useState<string>('');
  const [dateDisplay, setDateDisplay] = useState<string>('');

  // Cabin detection states
  const [isDetectingCabins, setIsDetectingCabins] = useState(false);
  const [availableCabins, setAvailableCabins] = useState<CabinCode[]>([]);
  const [selectedCabins, setSelectedCabins] = useState<CabinCode[]>([]);
  const [aircraftType, setAircraftType] = useState<string>('');

  // Menu results
  const [menusByCabin, setMenusByCabin] = useState<Record<CabinCode, MenuData>>({} as Record<CabinCode, MenuData>);
  const [activeTabCabin, setActiveTabCabin] = useState<CabinCode>('BUSINESS');
  const [menuSegment, setMenuSegment] = useState<'dining' | 'drinks'>('dining');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // 1. Run Cabin Detection whenever flightNo or dateISO changes
  useEffect(() => {
    if (!validation.isValid || !dateISO || !validation.flightNo) {
      setAvailableCabins([]);
      setSelectedCabins([]);
      return;
    }

    let isSubscribed = true;
    setIsDetectingCabins(true);
    setSelectedCabins([]);

    getCabinConfig(validation.flightNo, dateISO)
      .then((config) => {
        if (!isSubscribed) return;
        setIsDetectingCabins(false);
        setAvailableCabins(config.available);
        setAircraftType(config.aircraftType || '');
        // default select first available class (e.g. BUSINESS)
        if (config.available.includes('BUSINESS')) {
          setSelectedCabins(['BUSINESS']);
        } else if (config.available.length > 0) {
          setSelectedCabins([config.available[0]]);
        }
      })
      .catch(() => {
        if (!isSubscribed) return;
        setIsDetectingCabins(false);
        setAvailableCabins(['BUSINESS', 'ECONOMY']);
        setSelectedCabins(['BUSINESS']);
      });

    return () => {
      isSubscribed = false;
    };
  }, [validation.flightNo, validation.isValid, dateISO]);

  const handleToggleCabin = (code: CabinCode) => {
    if (selectedCabins.includes(code)) {
      if (selectedCabins.length > 1) {
        setSelectedCabins(selectedCabins.filter((c) => c !== code));
      }
    } else {
      setSelectedCabins([...selectedCabins, code]);
    }
  };

  // 2. Start Menu Fetch
  const handleStartFetch = () => {
    setStage('loading');
  };

  const executeMenuFetch = async () => {
    const results = await Promise.all(
      selectedCabins.map(async (cab) => {
        const menu = await getMenu(validation.flightNo, dateISO, cab);
        return { cabin: cab, menu };
      })
    );

    const map: Record<CabinCode, MenuData> = {} as Record<CabinCode, MenuData>;
    results.forEach((r) => {
      map[r.cabin] = r.menu;
    });
    return map;
  };

  const handleFetchSuccess = (data: Record<CabinCode, MenuData>) => {
    setMenusByCabin(data);
    if (selectedCabins.length > 0) {
      setActiveTabCabin(selectedCabins[0]);
    }
    setStage('result');
  };

  const toggleSectionCollapse = (secId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  // Format cabin summary for CTA
  const cabinLabels = selectedCabins
    .map((c) => (c === 'PREMIUM_ECONOMY' ? 'Prem Econ' : c.charAt(0) + c.slice(1).toLowerCase()))
    .join(', ');

  const flightSummaryLine = `SQ${validation.cleanFlightNo} · ${dateDisplay}${cabinLabels ? ` · ${cabinLabels}` : ''}`;

  const currentMenu = menusByCabin[activeTabCabin];
  const activeSections = currentMenu ? (menuSegment === 'dining' ? currentMenu.sections : currentMenu.drinks) : [];

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

            {/* Pattern A: Flight Number Input */}
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

            {/* Pattern B: Departure Block */}
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
                  Detected Cabin Classes
                </label>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-20 rounded-full bg-bg-elevated animate-pulse" />
                  <div className="h-8 w-24 rounded-full bg-bg-elevated animate-pulse" />
                  <div className="h-8 w-20 rounded-full bg-bg-elevated animate-pulse" />
                </div>
                <p className="font-serif italic text-text-tertiary text-xs mt-2">
                  Checking aircraft configuration…
                </p>
              </div>
            )}

            {/* Detected Cabin Classes Pills */}
            {!isDetectingCabins && availableCabins.length > 0 && (
              <div className="w-full mt-5 text-left animate-fade-in">
                <div className="flex items-center justify-between mb-2 select-none">
                  <label className="block text-[0.7rem] font-medium tracking-[0.2em] uppercase text-text-secondary">
                    Detected Cabin Classes
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
                      isSelected={selectedCabins.includes(code)}
                      hasAnySelection={selectedCabins.length > 0}
                      delayIndex={idx}
                      onToggle={handleToggleCabin}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 max-h-8 sm:max-h-12" />

          {/* Pattern C: Progression CTA */}
          {validation.isValid && validation.flightNo.length > 0 && dateISO && selectedCabins.length > 0 && (
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

      {/* 3. RESULT SCREEN — MENU DISPLAY (Single Viewport with Inner Scrollable Content) */}
      {stage === 'result' && currentMenu && (
        <div className="flex flex-col h-full overflow-hidden animate-fade-in">
          
          {/* Sticky Top Header */}
          <div className="shrink-0 flex flex-col items-center pt-1 pb-2 border-b border-border-subtle/50">
            <FlightChip label={flightSummaryLine} />

            {/* Cabin Tab Bar (If multiple cabins selected) */}
            {selectedCabins.length > 1 && (
              <div className="flex items-center gap-1.5 mt-2.5 p-1 rounded-full bg-bg-elevated border border-border-subtle">
                {selectedCabins.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setActiveTabCabin(c)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      activeTabCabin === c
                        ? 'bg-accent text-[#0B1E3E] font-semibold shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {c === 'PREMIUM_ECONOMY' ? 'Prem Econ' : c.charAt(0) + c.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            )}

            {/* Dining / Drinks Segmented Switch */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center p-0.5 rounded-full bg-bg-surface border border-border-subtle">
                <button
                  type="button"
                  onClick={() => setMenuSegment('dining')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    menuSegment === 'dining'
                      ? 'bg-accent/20 text-accent font-semibold border border-accent/40'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Dining</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMenuSegment('drinks')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    menuSegment === 'drinks'
                      ? 'bg-accent/20 text-accent font-semibold border border-accent/40'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Wine className="w-3.5 h-3.5" />
                  <span>Drinks</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Menu Items Container (The ONLY scrollable zone) */}
          <div className="flex-1 overflow-y-auto px-1 py-3 space-y-4">
            {activeSections.map((section) => {
              const isCollapsed = collapsedSections[section.id];
              return (
                <div key={section.id} className="rounded-card bg-bg-surface border border-border-subtle overflow-hidden">
                  {/* Section Title Header */}
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse(section.id)}
                    className="w-full px-4 py-2.5 bg-bg-elevated/80 flex items-center justify-between text-left border-b border-border-subtle/50"
                  >
                    <span className="font-serif text-sm font-semibold text-text-primary">
                      {section.title}
                    </span>
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-text-tertiary" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-text-tertiary" />
                    )}
                  </button>

                  {/* Section Item Cards */}
                  {!isCollapsed && (
                    <div className="p-3 space-y-3">
                      {section.items.map((item) => (
                        <div key={item.id} className="flex gap-3 items-start">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-14 h-14 rounded-lg object-cover bg-bg-elevated border border-border-subtle shrink-0"
                              loading="lazy"
                            />
                          )}
                          <div className="flex-1 text-left">
                            <h4 className="font-sans font-semibold text-xs sm:text-sm text-text-primary leading-snug">
                              {item.title}
                            </h4>
                            {item.description && (
                              <p className="font-sans text-[0.78rem] text-text-secondary mt-0.5 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {item.tags.map((tag, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="text-[9px] px-1.5 py-0.5 rounded bg-bg-elevated text-accent/90 border border-accent/25"
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

          {/* Sticky Bottom Action Row */}
          <div className="shrink-0 flex items-center justify-between gap-3 pt-2.5 pb-1 border-t border-border-subtle/50">
            <button
              type="button"
              onClick={() => setStage('form')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-border-subtle hover:border-border-hover text-xs font-medium text-text-secondary hover:text-text-primary transition-all active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigate('/inkflight', {
                  state: {
                    flightNo: validation.cleanFlightNo,
                    dateISO,
                    dateDisplay,
                    cabins: selectedCabins,
                  },
                });
              }}
              className="editorial-cta-btn flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide"
            >
              <Printer className="w-3.5 h-3.5 text-[#0B1E3E]" />
              <span>Reformat for print &rarr;</span>
            </button>
          </div>

        </div>
      )}
    </Layout>
  );
};
