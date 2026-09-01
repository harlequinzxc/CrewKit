import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow, FlowSector } from '../context/FlowContext';
import {
  Heading,
  Text,
  FlowPage,
  ChoiceCard,
  PulseCTA,
  Pill,
  Button,
  FetchInterlude,
  InterludeMessage,
} from '../components/ui';
import {
  getGreetingForHour,
  getTodayDateISO,
  getTomorrowDateISO,
  KNOWN_4_SECTOR_CHAINS,
  CABIN_ORDER,
} from '../lib/flow/constants';
import { getMenu, getFlightSchedule } from '../lib/sq/endpoints';
import { normalizeFlightInput } from '../lib/sq/validation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plane, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const {
    state,
    direction,
    goToPage,
    goBack,
    setFlightType,
    setSectorCount,
    updateSector,
    setSectors,
    setCabinClass,
    setSelectedTool,
    resetFlow,
  } = useFlow();

  const { currentPage, flightType, sectorCount, sectors, cabinClass } = state;

  // Local selection highlight lock state (for 400ms tactile feedback)
  const [lockedFlightType, setLockedFlightType] = useState<'turnaround' | 'layover' | null>(null);
  const [lockedSectorCount, setLockedSectorCount] = useState<2 | 4 | null>(null);
  const [lockedTool, setLockedTool] = useState<'crewcash' | 'skymenu' | 'inkflight' | null>(null);

  // Interlude state on Page 4
  const [showInterlude, setShowInterlude] = useState<boolean>(false);
  const [interludeTool, setInterludeTool] = useState<'crewcash' | 'skymenu' | 'inkflight' | null>(null);

  // Auto-fill detection message
  const [autoFillMsg, setAutoFillMsg] = useState<string | null>(null);

  // Dynamic system greeting
  const [greeting, setGreeting] = useState<string>('Welcome aboard');

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(getGreetingForHour(hour));
  }, []);

  // PAGE 1 Handler: Flight Type selection (400ms lock -> Page 2)
  const handleSelectFlightType = (type: 'turnaround' | 'layover') => {
    setLockedFlightType(type);
    setFlightType(type);
    setTimeout(() => {
      setLockedFlightType(null);
      goToPage(2);
    }, 400);
  };

  // PAGE 2 Handler: Sector Count selection (400ms lock -> Page 3)
  const handleSelectSectorCount = (count: 2 | 4) => {
    setLockedSectorCount(count);
    setSectorCount(count);
    setTimeout(() => {
      setLockedSectorCount(null);
      goToPage(3);
    }, 400);
  };

  // PAGE 3 Helper: Check if a sector row is valid
  const isSectorValid = (s?: FlowSector): boolean => {
    if (!s) return false;
    const cleanNum = s.flightNumber.replace(/\D/g, '');
    return cleanNum.length > 0 && s.date.trim().length > 0;
  };

  const countToDisplay = sectorCount || 2;
  const s0Valid = isSectorValid(sectors[0]);
  const s1Valid = countToDisplay >= 2 && s0Valid && isSectorValid(sectors[1]);
  const s2Valid = countToDisplay >= 4 && s1Valid && isSectorValid(sectors[2]);
  const s3Valid = countToDisplay >= 4 && s2Valid && isSectorValid(sectors[3]);

  const allSectorsValid = countToDisplay === 2 ? s0Valid && s1Valid : s0Valid && s1Valid && s2Valid && s3Valid;
  const canContinueToPage4 = allSectorsValid && Boolean(cabinClass);

  // PAGE 3 Handler: Flight number change with special 4-sector Layover Auto-Fill
  const handleFlightNumberChange = (index: number, val: string) => {
    const cleanDigits = val.replace(/\D/g, '').slice(0, 4);

    // Special auto-fill check on Sector 1 when layover + 4 sectors
    if (index === 0 && flightType === 'layover' && countToDisplay === 4) {
      const known = KNOWN_4_SECTOR_CHAINS[cleanDigits];
      if (known) {
        setAutoFillMsg(`4-sector flight detected (${known.description})`);
        const updated = [...sectors];
        while (updated.length < 4) {
          updated.push({ flightNumber: '', date: '', paxing: false });
        }
        updated[0] = { ...updated[0], flightNumber: known.flightNumbers[0] };
        updated[1] = { ...updated[1], flightNumber: known.flightNumbers[1] };
        updated[2] = { ...updated[2], flightNumber: known.flightNumbers[2] };
        updated[3] = { ...updated[3], flightNumber: known.flightNumbers[3] };
        setSectors(updated);
        return;
      } else {
        setAutoFillMsg(null);
      }
    }

    updateSector(index, { flightNumber: cleanDigits });
  };

  // PAGE 4 Handler: Tool Selection (400ms lock -> Fetch Interlude -> Tool Result)
  const handleSelectTool = (tool: 'crewcash' | 'skymenu' | 'inkflight') => {
    setLockedTool(tool);
    setSelectedTool(tool);
    setTimeout(() => {
      setLockedTool(null);
      setInterludeTool(tool);
      setShowInterlude(true);
    }, 400);
  };

  // Interlude Task Executors based on shared context
  const primaryFlight = sectors[0]?.flightNumber || '11';
  const primaryDate = sectors[0]?.date || getTodayDateISO();
  const primaryCabin = cabinClass || 'BUSINESS';

  const flightSummaryChip = [
    `SQ${normalizeFlightInput(primaryFlight)}`,
    sectors.length > 1 ? `${sectors.length} Sectors` : '',
    primaryCabin.charAt(0) + primaryCabin.slice(1).toLowerCase(),
  ]
    .filter(Boolean)
    .join(' · ');

  const executeSkyMenuTask = async () => {
    return await getMenu(primaryFlight, primaryDate, primaryCabin);
  };

  const executeCrewCashTask = async () => {
    const schedules = await Promise.all(
      sectors.map((s) => getFlightSchedule(s.flightNumber, s.date || primaryDate))
    );
    return schedules;
  };

  const handleInterludeSuccess = () => {
    setShowInterlude(false);
    if (interludeTool === 'skymenu') {
      navigate('/skymenu');
    } else if (interludeTool === 'inkflight') {
      navigate('/inkflight');
    } else if (interludeTool === 'crewcash') {
      navigate('/crewcash');
    }
  };

  const skyMenuMessages: InterludeMessage[] = [
    { text: 'Retrieving menu from seat pocket…', durationMs: 3000 },
    { text: 'Almost ready…', durationMs: 2000 },
  ];

  const crewCashMessages: InterludeMessage[] = [
    { text: 'Checking actual flight time with Tech Crew…', durationMs: 2000 },
    { text: 'Almost ready…', durationMs: 1000 },
  ];

  // If showing fetch interlude, render it full screen
  if (showInterlude && interludeTool) {
    return (
      <FetchInterlude<any>
        flightChipText={flightSummaryChip}
        messages={interludeTool === 'crewcash' ? crewCashMessages : skyMenuMessages}
        minTotalMs={interludeTool === 'crewcash' ? 3000 : 5000}
        fetchTask={async () => {
          if (interludeTool === 'crewcash') {
            return await executeCrewCashTask();
          }
          return await executeSkyMenuTask();
        }}
        onSuccess={handleInterludeSuccess}
      />
    );
  }

  return (
    <FlowPage
      currentPage={currentPage}
      direction={direction}
      onBack={currentPage > 0 ? goBack : undefined}
      showBackButton={currentPage > 0}
      containerClassName={
        currentPage === 3 ? 'max-w-xl w-full' : currentPage === 2 ? 'max-w-md w-full' : 'max-w-md w-full'
      }
    >
      {/* ── PAGE 0: DYNAMIC GREETING & LANDING ── */}
      {currentPage === 0 && (
        <div className="flex flex-col items-center text-center space-y-6 animate-fade-in py-6">
          <div className="space-y-2">
            <p className="font-display italic text-gold-300 text-xl sm:text-2xl font-light">
              {greeting}
            </p>
            <Heading
              variant="hero"
              as="h1"
              className="text-4xl sm:text-5xl md:text-6xl font-light text-ivory-100 tracking-tight leading-[1.05]"
            >
              Welcome aboard
            </Heading>
          </div>

          <p className="text-xs sm:text-sm text-mist-300 max-w-xs sm:max-w-sm leading-relaxed font-sans">
            Your luxury Singapore Airlines companion for dining menus, allowances, and homework prep.
          </p>

          <div className="pt-6 sm:pt-8">
            <PulseCTA onClick={() => goToPage(1)} />
          </div>
        </div>
      )}

      {/* ── PAGE 1: FLIGHT TYPE (Turnaround vs Layover) ── */}
      {currentPage === 1 && (
        <div className="w-full flex flex-col items-center text-center space-y-7 animate-fade-in py-4">
          <div className="space-y-1.5">
            <Heading variant="hero" as="h2" className="text-3xl sm:text-4xl font-light">
              What type of flight?
            </Heading>
            <Text variant="secondary" className="text-xs sm:text-sm">
              Select your operating pattern
            </Text>
          </div>

          <div className="w-full flex flex-col gap-3.5 sm:gap-4 max-w-sm mx-auto">
            <ChoiceCard
              title="Turnaround"
              emoji="🔄"
              description="Same-day return sector"
              selected={lockedFlightType === 'turnaround' || flightType === 'turnaround'}
              onClick={() => handleSelectFlightType('turnaround')}
            />

            <ChoiceCard
              title="Layover"
              emoji="🏨"
              description="Station rest &amp; layover duty"
              selected={lockedFlightType === 'layover' || flightType === 'layover'}
              onClick={() => handleSelectFlightType('layover')}
            />
          </div>
        </div>
      )}

      {/* ── PAGE 2: SECTOR COUNT (2 vs 4) ── */}
      {currentPage === 2 && (
        <div className="w-full flex flex-col items-center text-center space-y-7 animate-fade-in py-4">
          <div className="space-y-1.5">
            <Heading variant="hero" as="h2" className="text-3xl sm:text-4xl font-light">
              How many sectors?
            </Heading>
            <Text variant="secondary" className="text-xs sm:text-sm">
              Choose the number of legs
            </Text>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-xs sm:max-w-sm mx-auto">
            <ChoiceCard
              variant="square"
              title="2"
              description="2 Sectors"
              selected={lockedSectorCount === 2 || sectorCount === 2}
              onClick={() => handleSelectSectorCount(2)}
            />

            <ChoiceCard
              variant="square"
              title="4"
              description="4 Sectors"
              selected={lockedSectorCount === 4 || sectorCount === 4}
              onClick={() => handleSelectSectorCount(4)}
            />
          </div>
        </div>
      )}

      {/* ── PAGE 3: FLIGHT DETAILS & AUTO-FILL ── */}
      {currentPage === 3 && (
        <div className="w-full flex flex-col items-center text-center space-y-5 animate-fade-in py-2 max-h-[85dvh] overflow-y-auto no-scrollbar">
          <div className="space-y-1">
            <Heading variant="hero" as="h2" className="text-2xl sm:text-3xl font-light">
              Flight details
            </Heading>
            <Text variant="secondary" className="text-xs sm:text-sm">
              Fill in each sector
            </Text>
          </div>

          {autoFillMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400/15 border border-gold-400/30 text-gold-300 text-xs font-ui italic"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>{autoFillMsg}</span>
            </motion.div>
          )}

          {/* Sector Input Rows */}
          <div className="w-full space-y-3 sm:space-y-3.5 max-w-lg mx-auto text-left">
            {Array.from({ length: countToDisplay }).map((_, idx) => {
              // Stagger visibility: Row 0 always visible; Row 1 after Row 0 valid; Row 2 after Row 1; Row 3 after Row 2
              const isVisible =
                idx === 0 ||
                (idx === 1 && s0Valid) ||
                (idx === 2 && s1Valid) ||
                (idx === 3 && s2Valid);

              if (!isVisible) return null;

              const sec = sectors[idx] || { flightNumber: '', date: '', paxing: false };
              const todayISO = getTodayDateISO();
              const tomorrowISO = getTomorrowDateISO();
              const showPaxing = countToDisplay === 2;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="p-3.5 sm:p-4 rounded-2xl bg-ink-900/70 border border-gold-dim space-y-2.5 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-ui uppercase tracking-[0.22em] text-gold-300 font-semibold">
                      Sector {idx + 1}
                    </span>

                    {/* Paxing Toggle (Only shown when 2 sectors per rules) */}
                    {showPaxing && (
                      <button
                        type="button"
                        onClick={() => updateSector(idx, { paxing: !sec.paxing })}
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10px] font-ui uppercase tracking-wider font-semibold transition-all border flex items-center gap-1',
                          sec.paxing
                            ? 'bg-gold-400 text-onyx-900 border-gold-400 shadow-sm'
                            : 'bg-ink-850/80 text-mist-300 border-gold-dim hover:text-ivory-100'
                        )}
                      >
                        <Plane className="w-3 h-3" />
                        <span>Paxing</span>
                      </button>
                    )}
                  </div>

                  {/* Flight Number & Date Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2.5 items-center">
                    {/* SQ Input */}
                    <div className="flex items-center rounded-xl bg-ink-850 border border-gold-dim px-3 py-2 focus-within:border-gold-400/60 transition-colors">
                      <span className="font-ui text-xs font-semibold text-gold-400 mr-2 select-none">
                        SQ
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder={idx === 0 ? '11' : idx === 1 ? '12' : '134'}
                        value={sec.flightNumber}
                        onChange={(e) => handleFlightNumberChange(idx, e.target.value)}
                        className="w-full bg-transparent text-sm font-ui font-medium text-ivory-100 placeholder:text-mist-500 focus:outline-none"
                      />
                    </div>

                    {/* Date Pill Selector */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-ink-850 border border-gold-dim">
                      <button
                        type="button"
                        onClick={() => updateSector(idx, { date: todayISO })}
                        className={cn(
                          'flex-1 py-1 rounded-lg text-[10.5px] font-ui uppercase tracking-wider font-semibold transition-all',
                          sec.date === todayISO
                            ? 'bg-gold-400 text-onyx-900 shadow-sm'
                            : 'text-mist-300 hover:text-ivory-100'
                        )}
                      >
                        Today
                      </button>

                      <button
                        type="button"
                        onClick={() => updateSector(idx, { date: tomorrowISO })}
                        className={cn(
                          'flex-1 py-1 rounded-lg text-[10.5px] font-ui uppercase tracking-wider font-semibold transition-all',
                          sec.date === tomorrowISO
                            ? 'bg-gold-400 text-onyx-900 shadow-sm'
                            : 'text-mist-300 hover:text-ivory-100'
                        )}
                      >
                        Tomorrow
                      </button>

                      {/* Custom Date Picker Input */}
                      <div className="relative flex-1">
                        <label className={cn(
                          'flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10.5px] font-ui uppercase tracking-wider font-semibold transition-all cursor-pointer truncate',
                          sec.date && sec.date !== todayISO && sec.date !== tomorrowISO
                            ? 'bg-gold-400 text-onyx-900 shadow-sm'
                            : 'text-mist-300 hover:text-gold-300'
                        )}>
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {sec.date && sec.date !== todayISO && sec.date !== tomorrowISO
                              ? sec.date.slice(5)
                              : 'Pick'}
                          </span>
                          <input
                            type="date"
                            value={sec.date}
                            onChange={(e) => updateSector(idx, { date: e.target.value })}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Cabin Class Selection (Appears only when ALL sectors are valid) */}
          <AnimatePresence>
            {allSectorsValid && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-lg mx-auto pt-1 text-left space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-ui uppercase tracking-[0.22em] text-gold-300 font-semibold">
                    Cabin Class
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {CABIN_ORDER.map(({ code, label }) => (
                    <Pill
                      key={code}
                      active={cabinClass === code}
                      onClick={() => setCabinClass(code)}
                      size="sm"
                      className="px-3.5 py-2"
                    >
                      {label}
                    </Pill>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Continue Button */}
          <div className="w-full max-w-lg mx-auto pt-3 pb-2">
            <Button
              variant="primary"
              size="md"
              fullWidth
              disabled={!canContinueToPage4}
              onClick={() => goToPage(4)}
              className="py-3.5"
            >
              Continue →
            </Button>
          </div>
        </div>
      )}

      {/* ── PAGE 4: TOOL SELECTION ── */}
      {currentPage === 4 && (
        <div className="w-full flex flex-col items-center text-center space-y-6 animate-fade-in py-3">
          <div className="space-y-1.5">
            <Heading variant="hero" as="h2" className="text-3xl sm:text-4xl font-light">
              Cabin Ready ✈️
            </Heading>
            <Text variant="secondary" className="text-xs sm:text-sm">
              Choose your tool
            </Text>
          </div>

          <div className="w-full flex flex-col gap-3.5 max-w-sm mx-auto">
            <ChoiceCard
              title="CrewCash"
              emoji="💰"
              description="Work Hard, Play Hard"
              selected={lockedTool === 'crewcash'}
              onClick={() => handleSelectTool('crewcash')}
            />

            <ChoiceCard
              title="SkyMenu"
              emoji="🍽️"
              description="Dine above the clouds"
              selected={lockedTool === 'skymenu'}
              onClick={() => handleSelectTool('skymenu')}
            />

            <ChoiceCard
              title="InkFlight"
              emoji="🖨️"
              description="Ditch the pen, save your ink"
              selected={lockedTool === 'inkflight'}
              onClick={() => handleSelectTool('inkflight')}
            />
          </div>

          {/* Start Over Action Link */}
          <div className="pt-2">
            <button
              type="button"
              onClick={resetFlow}
              className="text-xs text-mist-400 hover:text-gold-300 font-ui underline underline-offset-4 transition-colors cursor-pointer"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </FlowPage>
  );
};
