import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { FlightNumberInput } from '../components/FlightNumberInput';
import { DepartureBlock } from '../components/DepartureBlock';
import { RevealCTA } from '../components/RevealCTA';
import { CabinPill } from '../components/CabinPill';
import { FlightChip } from '../components/FlightChip';
import { FetchInterlude, InterludeMessage } from '../components/FetchInterlude';
import { useFlightValidation } from '../hooks/useFlightValidation';
import { getCabinConfig, getMenu, getKnownFlightSectors, SectorLegOption } from '../lib/sq/endpoints';
import { CabinCode, MenuData, MenuSection } from '../lib/sq/types';
import { exportToPNG } from '../lib/export/png';
import { exportToPDF } from '../lib/export/pdf';
import { exportToDOCX } from '../lib/export/docx';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Printer,
  Download,
  FileText,
  FileCode,
  Eye,
  EyeOff,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const INKFLIGHT_MESSAGES: InterludeMessage[] = [
  { text: 'Retrieving menu from seat pocket…', durationMs: 3000 },
  { text: 'Formatting thermal receipt…', durationMs: 2000 },
];

export const InkFlight: React.FC = () => {
  const location = useLocation();
  const navState = location.state as {
    flightNo?: string;
    dateISO?: string;
    dateDisplay?: string;
    cabin?: CabinCode;
  } | null;

  // Screen Stages: 'form' | 'loading' | 'editor'
  const [stage, setStage] = useState<'form' | 'loading' | 'editor'>('form');

  // Flight validation
  const validation = useFlightValidation(navState?.flightNo || '');

  // Step 2: Departure Date (not selected by default unless passed in navState)
  const [dateISO, setDateISO] = useState<string>(navState?.dateISO || '');
  const [dateDisplay, setDateDisplay] = useState<string>(navState?.dateDisplay || '');

  // Special multi-sector flight detection (e.g. SQ12, SQ11, SQ26, SQ25)
  const [multiSectors, setMultiSectors] = useState<SectorLegOption[] | null>(null);
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);

  // Step 4: Cabin detection & Multi-selection (not selected by default)
  const [isDetectingCabins, setIsDetectingCabins] = useState(false);
  const [availableCabins, setAvailableCabins] = useState<CabinCode[]>([]);
  const [selectedCabins, setSelectedCabins] = useState<CabinCode[]>(
    navState?.cabin ? [navState.cabin] : []
  );
  const [flightNotFoundError, setFlightNotFoundError] = useState<string | null>(null);

  // InkFlight Editor State
  const [editableMenu, setEditableMenu] = useState<MenuData | null>(null);
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [includeDescriptions, setIncludeDescriptions] = useState<boolean>(false);
  const [includeDrinks, setIncludeDrinks] = useState<boolean>(true);
  const [compactMode, setCompactMode] = useState<boolean>(false);
  const [paperWidth, setPaperWidth] = useState<'108mm' | '210mm'>('108mm');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Mobile Tab View: 'editor' | 'preview'
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('preview');

  // Receipt DOM element ref
  const receiptRef = useRef<HTMLDivElement>(null);

  // 1. Live change: when flight number changes, reset all downstream selections
  useEffect(() => {
    if (!navState?.flightNo) {
      setDateISO('');
      setDateDisplay('');
      setSelectedSectorIds([]);
      setAvailableCabins([]);
      setSelectedCabins([]);
      setFlightNotFoundError(null);
    }

    if (validation.isValid && validation.flightNo) {
      const known = getKnownFlightSectors(validation.flightNo);
      setMultiSectors(known);
    } else {
      setMultiSectors(null);
    }
  }, [validation.flightNo, validation.isValid]);

  const isMultiSector = Boolean(multiSectors && multiSectors.length > 1);

  // 2. Live change: when date is selected, trigger cabin detection
  useEffect(() => {
    if (!validation.flightNo || !validation.isValid || !dateISO) {
      setAvailableCabins([]);
      setSelectedCabins([]);
      setFlightNotFoundError(null);
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
          setFlightNotFoundError(null);
        } else {
          setAvailableCabins([]);
          setFlightNotFoundError(
            `Flight SQ${validation.cleanFlightNo} not found or does not operate on ${dateDisplay}.`
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
    setSelectedSectorIds((prev) =>
      prev.includes(sectorId) ? prev.filter((id) => id !== sectorId) : [...prev, sectorId]
    );
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

    // Merge sections & drinks across selected cabins
    const allSections: MenuSection[] = [];
    const allDrinks: MenuSection[] = [];

    menus.forEach((m, cIdx) => {
      const cabinTag = cabinsToFetch[cIdx];
      const prefix = cabinsToFetch.length > 1 ? `[${cabinTag}] ` : '';

      // Filter legs if specific sectors were chosen
      let legsToUse = m.legs;
      if (selectedSectorIds.length > 0 && legsToUse && legsToUse.length > 0) {
        legsToUse = legsToUse.filter((leg) => {
          const legKey = `${leg.origin}-${leg.destination}`;
          return (
            selectedSectorIds.includes(legKey) ||
            selectedSectorIds.some((id) => id.includes(leg.origin) && id.includes(leg.destination))
          );
        });
      }

      if (legsToUse && legsToUse.length > 0) {
        legsToUse.forEach((leg) => {
          leg.mealServices.forEach((srv) => {
            srv.selections.forEach((sel) => {
              sel.courses.forEach((crs) => {
                allSections.push({
                  id: `${cabinTag}_${leg.legId}_${crs.id}`,
                  title: `${prefix}${leg.origin}→${leg.destination} · ${srv.name} · ${crs.name}`,
                  items: crs.items,
                });
              });
            });
          });

          leg.drinks.forEach((d) => {
            allDrinks.push({
              id: `${cabinTag}_${leg.legId}_${d.id}`,
              title: `${prefix}${leg.origin}→${leg.destination} · ${d.title}`,
              items: d.items,
            });
          });
        });
      } else {
        m.sections.forEach((s) => {
          allSections.push({
            id: `${cabinTag}_${s.id}`,
            title: `${prefix}${s.title}`,
            items: s.items,
          });
        });
        m.drinks.forEach((d) => {
          allDrinks.push({
            id: `${cabinTag}_${d.id}`,
            title: `${prefix}${d.title}`,
            items: d.items,
          });
        });
      }
    });

    const combinedMenu: MenuData = {
      flightNo: `SQ${validation.cleanFlightNo}`,
      date: dateISO,
      cabin: selectedCabins[0] || 'BUSINESS',
      legs: menus[0]?.legs || [],
      sections: allSections,
      drinks: allDrinks,
    };

    return combinedMenu;
  };

  const handleFetchSuccess = (data: MenuData) => {
    const cloned = JSON.parse(JSON.stringify(data)) as MenuData;
    setEditableMenu(cloned);
    setStage('editor');
  };

  const toggleSectionVisibility = (secId: string) => {
    if (!editableMenu) return;
    setEditableMenu({
      ...editableMenu,
      sections: editableMenu.sections.map((sec) =>
        sec.id === secId ? { ...sec, hidden: !sec.hidden } : sec
      ),
      drinks: editableMenu.drinks.map((sec) =>
        sec.id === secId ? { ...sec, hidden: !sec.hidden } : sec
      ),
    });
  };

  const toggleItemVisibility = (secId: string, itemId: string) => {
    if (!editableMenu) return;
    const updateSec = (sections: MenuSection[]) =>
      sections.map((sec) =>
        sec.id === secId
          ? {
              ...sec,
              items: sec.items.map((it) =>
                it.id === itemId ? { ...it, hidden: !it.hidden } : it
              ),
            }
          : sec
      );

    setEditableMenu({
      ...editableMenu,
      sections: updateSec(editableMenu.sections),
      drinks: updateSec(editableMenu.drinks),
    });
  };

  const updateItemTitle = (secId: string, itemId: string, newTitle: string) => {
    if (!editableMenu) return;
    const updateSec = (sections: MenuSection[]) =>
      sections.map((sec) =>
        sec.id === secId
          ? {
              ...sec,
              items: sec.items.map((it) =>
                it.id === itemId ? { ...it, title: newTitle } : it
              ),
            }
          : sec
      );

    setEditableMenu({
      ...editableMenu,
      sections: updateSec(editableMenu.sections),
      drinks: updateSec(editableMenu.drinks),
    });
  };

  const moveItem = (secId: string, itemIdx: number, direction: 'up' | 'down') => {
    if (!editableMenu) return;
    const updateSec = (sections: MenuSection[]) =>
      sections.map((sec) => {
        if (sec.id !== secId) return sec;
        const newItems = [...sec.items];
        const targetIdx = direction === 'up' ? itemIdx - 1 : itemIdx + 1;
        if (targetIdx < 0 || targetIdx >= newItems.length) return sec;
        const temp = newItems[itemIdx];
        newItems[itemIdx] = newItems[targetIdx];
        newItems[targetIdx] = temp;
        return { ...sec, items: newItems };
      });

    setEditableMenu({
      ...editableMenu,
      sections: updateSec(editableMenu.sections),
      drinks: updateSec(editableMenu.drinks),
    });
  };

  const handleExportPng = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    try {
      await exportToPNG(receiptRef.current, `CrewKit_${validation.cleanFlightNo}_Receipt.png`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    try {
      await exportToPDF(
        receiptRef.current,
        `CrewKit_${validation.cleanFlightNo}_Receipt`,
        paperWidth === '108mm' ? 108 : 210
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDocx = async () => {
    if (!editableMenu) return;
    setIsExporting(true);
    try {
      await exportToDOCX(
        `SQ${validation.cleanFlightNo}`,
        dateDisplay,
        selectedCabins.join(', '),
        [...editableMenu.sections, ...(includeDrinks ? editableMenu.drinks : [])],
        includeDescriptions,
        `CrewKit_${validation.cleanFlightNo}_Menu`
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

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
    <Layout>
      {/* 1. LOADING INTERLUDE (5s Minimum Duration) */}
      {stage === 'loading' && (
        <FetchInterlude
          flightChipText={flightSummaryLine}
          messages={INKFLIGHT_MESSAGES}
          fetchTask={executeMenuFetch}
          onSuccess={handleFetchSuccess}
        />
      )}

      {/* 2. FORM FLOW (PROGRESSIVE STEP-BY-STEP WORKFLOW) */}
      {stage === 'form' && (
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar pt-4 sm:pt-6 pb-8 px-1 animate-cabin-in">
          <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center space-y-5">
            <div>
              <span className="font-display italic text-gold-300 text-xl tracking-wide block mb-1">
                Prep,
              </span>

              <h2 className="font-display text-3xl sm:text-4xl font-light text-ivory-100 tracking-tight leading-snug">
                Let's ready your homework.
              </h2>
            </div>

            {/* STEP 1: Flight Number */}
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
                <div className="flex items-center justify-between mb-1 select-none">
                  <label className="block text-[0.72rem] font-ui uppercase tracking-eyebrow text-mist-300">
                    Select Sector Leg(s)
                  </label>
                  <span className="font-ui text-[10px] uppercase tracking-wider text-gold-300 font-semibold">
                    Multi-select
                  </span>
                </div>

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
                            ? 'bg-gold-400/15 border-gold-400 text-ivory-100 ring-1 ring-gold-400/40 shadow-sm'
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
                              : 'border-gold-dim bg-ink-900 text-transparent'
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

            {/* Loading skeleton while detecting cabins */}
            {isDetectingCabins && Boolean(dateISO) && (!isMultiSector || selectedSectorIds.length > 0) && (
              <div className="w-full text-left animate-fade-in">
                <label className="block text-[0.72rem] font-ui uppercase tracking-eyebrow text-mist-300 mb-2 select-none">
                  Available Cabin Classes
                </label>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-20 rounded-full bg-ink-850 animate-pulse border border-gold-dim" />
                  <div className="h-9 w-24 rounded-full bg-ink-850 animate-pulse border border-gold-dim" />
                  <div className="h-9 w-20 rounded-full bg-ink-850 animate-pulse border border-gold-dim" />
                </div>
              </div>
            )}

            {/* STEP 4: Cabin Classes Multi-Select (none selected by default) */}
            {showCabinStep && (
              <div className="w-full text-left animate-cabin-in">
                <label className="block text-[0.72rem] font-ui uppercase tracking-eyebrow text-mist-300 mb-2 select-none">
                  Cabin Class(es) for Printout
                </label>
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

            {/* STEP 5: Progression CTA (Appears only after cabin class/classes are selected) */}
            {showFetchButton && (
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

      {/* 3. EDITOR & RECEIPT PREVIEW (Split Layout) */}
      {stage === 'editor' && editableMenu && (
        <div className="flex flex-col h-full overflow-hidden animate-cabin-in">
          {/* Top Bar with Flight Chip & Mobile Tab Switcher */}
          <div className="shrink-0 flex flex-col items-center pt-1 pb-2 border-b border-gold-dim">
            <FlightChip label={flightSummaryLine} />

            {/* Mobile Tab Switcher with sliding pill */}
            <div className="flex sm:hidden items-center p-0.5 mt-2 rounded-full bg-ink-850 border border-gold-dim relative">
              <button
                type="button"
                onClick={() => setMobileTab('editor')}
                className={`relative flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-ui uppercase tracking-wider font-semibold transition-all ${
                  mobileTab === 'editor' ? 'text-onyx-900' : 'text-mist-300 hover:text-ivory-100'
                }`}
              >
                {mobileTab === 'editor' && (
                  <motion.div
                    layoutId="mobile-inkflight-tab"
                    className="absolute inset-0 bg-gold-400 rounded-full shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Customise</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                className={`relative flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-ui uppercase tracking-wider font-semibold transition-all ${
                  mobileTab === 'preview' ? 'text-onyx-900' : 'text-mist-300 hover:text-ivory-100'
                }`}
              >
                {mobileTab === 'preview' && (
                  <motion.div
                    layoutId="mobile-inkflight-tab"
                    className="absolute inset-0 bg-gold-400 rounded-full shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Receipt Preview</span>
                </span>
              </button>
            </div>
          </div>

          {/* Main Content Area (Split Grid on desktop, Tabbed on mobile) */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 min-h-0">
            {/* LEFT PANEL: Customize Controls & Reordering */}
            <div
              className={`flex-col h-full overflow-y-auto no-scrollbar space-y-3 pr-1 ${
                mobileTab === 'editor' ? 'flex' : 'hidden sm:flex'
              }`}
            >
              {/* Global Receipt Toggles Card */}
              <div className="p-4 rounded-card bg-ink-850/80 border border-gold-dim space-y-3 text-xs text-left">
                <div className="font-ui uppercase tracking-eyebrow font-semibold text-gold-300 text-xs pb-1.5 border-b border-gold-dim">
                  Thermal Receipt Layout Options
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIncludeHeaders(!includeHeaders)}
                    className={`px-3 py-2 rounded-lg border text-left flex items-center justify-between font-ui uppercase tracking-wider text-xs transition-all ${
                      includeHeaders
                        ? 'bg-gold-400/20 border-gold-400 text-gold-300 font-semibold'
                        : 'bg-ink-800 border-gold-dim text-mist-300'
                    }`}
                  >
                    <span>Headers</span>
                    <span className="font-mono text-[10px]">{includeHeaders ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeDescriptions(!includeDescriptions)}
                    className={`px-3 py-2 rounded-lg border text-left flex items-center justify-between font-ui uppercase tracking-wider text-xs transition-all ${
                      includeDescriptions
                        ? 'bg-gold-400/20 border-gold-400 text-gold-300 font-semibold'
                        : 'bg-ink-800 border-gold-dim text-mist-300'
                    }`}
                  >
                    <span>Descriptions</span>
                    <span className="font-mono text-[10px]">{includeDescriptions ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeDrinks(!includeDrinks)}
                    className={`px-3 py-2 rounded-lg border text-left flex items-center justify-between font-ui uppercase tracking-wider text-xs transition-all ${
                      includeDrinks
                        ? 'bg-gold-400/20 border-gold-400 text-gold-300 font-semibold'
                        : 'bg-ink-800 border-gold-dim text-mist-300'
                    }`}
                  >
                    <span>Drinks List</span>
                    <span className="font-mono text-[10px]">{includeDrinks ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompactMode(!compactMode)}
                    className={`px-3 py-2 rounded-lg border text-left flex items-center justify-between font-ui uppercase tracking-wider text-xs transition-all ${
                      compactMode
                        ? 'bg-gold-400/20 border-gold-400 text-gold-300 font-semibold'
                        : 'bg-ink-800 border-gold-dim text-mist-300'
                    }`}
                  >
                    <span>Compact</span>
                    <span className="font-mono text-[10px]">{compactMode ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Paper Width Selector */}
                  <div className="flex flex-col gap-1.5 col-span-2 pt-2 border-t border-gold-dim">
                    <span className="text-[10px] font-ui uppercase tracking-eyebrow text-mist-300">
                      Paper Width Target
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaperWidth('108mm')}
                        className={`px-3 py-2 rounded-lg border text-left flex items-center justify-between font-ui uppercase tracking-wider text-xs transition-all ${
                          paperWidth === '108mm'
                            ? 'bg-gold-400/20 border-gold-400 text-gold-300 font-semibold'
                            : 'bg-ink-800 border-gold-dim text-mist-300'
                        }`}
                      >
                        <span>108mm (A6)</span>
                        <span className="font-mono text-[10px]">{paperWidth === '108mm' ? '✓' : ''}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaperWidth('210mm')}
                        className={`px-3 py-2 rounded-lg border text-left flex items-center justify-between font-ui uppercase tracking-wider text-xs transition-all ${
                          paperWidth === '210mm'
                            ? 'bg-gold-400/20 border-gold-400 text-gold-300 font-semibold'
                            : 'bg-ink-800 border-gold-dim text-mist-300'
                        }`}
                      >
                        <span>210mm (A4)</span>
                        <span className="font-mono text-[10px]">{paperWidth === '210mm' ? '✓' : ''}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Customization List */}
              <div className="space-y-3">
                {[...editableMenu.sections, ...(includeDrinks ? editableMenu.drinks : [])].map(
                  (sec) => (
                    <div
                      key={sec.id}
                      className={`rounded-card bg-ink-850/70 border transition-opacity ${
                        sec.hidden ? 'opacity-40 border-gold-dim' : 'border-gold-dim'
                      }`}
                    >
                      <div className="p-2.5 bg-ink-800/80 flex items-center justify-between border-b border-gold-dim">
                        <span className="font-display text-base font-light text-ivory-100">
                          {sec.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSectionVisibility(sec.id)}
                          className="p-1 rounded text-mist-400 hover:text-gold-300"
                          title={sec.hidden ? 'Show Section' : 'Hide Section'}
                        >
                          {sec.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {!sec.hidden && (
                        <div className="p-2 space-y-1.5">
                          {sec.items.map((it, idx) => (
                            <div
                              key={it.id}
                              className={`flex items-center gap-1.5 p-1.5 rounded-lg bg-ink-900/60 border border-gold-dim/40 ${
                                it.hidden ? 'opacity-35' : ''
                              }`}
                            >
                              {/* Reorder up/down buttons */}
                              <div className="flex flex-col shrink-0">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => moveItem(sec.id, idx, 'up')}
                                  className="text-mist-400 hover:text-gold-300 disabled:opacity-20 p-0.5"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === sec.items.length - 1}
                                  onClick={() => moveItem(sec.id, idx, 'down')}
                                  className="text-mist-400 hover:text-gold-300 disabled:opacity-20 p-0.5"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Editable Title */}
                              <input
                                type="text"
                                value={it.title}
                                onChange={(e) => updateItemTitle(sec.id, it.id, e.target.value)}
                                className="flex-1 bg-transparent border-0 text-ivory-100 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-gold-400 rounded px-1"
                              />

                              {/* Toggle visibility */}
                              <button
                                type="button"
                                onClick={() => toggleItemVisibility(sec.id, it.id)}
                                className="p-1 rounded text-mist-400 hover:text-gold-300 shrink-0"
                              >
                                {it.hidden ? (
                                  <EyeOff className="w-3.5 h-3.5 text-red-400" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* RIGHT PANEL: Live Thermal Receipt Canvas */}
            <div
              className={`h-full overflow-y-auto no-scrollbar flex flex-col items-center justify-start ${
                mobileTab === 'preview' ? 'flex' : 'hidden sm:flex'
              }`}
            >
              <div
                ref={receiptRef}
                className="bg-white text-black p-5 shadow-2xl rounded-sm font-mono text-[11px] leading-tight select-none border border-neutral-300"
                style={{
                  width: paperWidth === '108mm' ? '300px' : '400px',
                  maxWidth: '100%',
                }}
              >
                {/* Receipt Header */}
                <div className="text-center pb-3 border-b-2 border-dashed border-black">
                  <div className="font-bold text-sm tracking-wider uppercase">SINGAPORE AIRLINES</div>
                  <div className="text-[10px] mt-0.5 font-sans font-medium">
                    INFLIGHT MENU RECEIPT ({paperWidth === '108mm' ? '108mm A6' : '210mm A4'})
                  </div>
                  <div className="mt-2 text-[10px] text-neutral-800 flex justify-between">
                    <span>FLIGHT: SQ{validation.cleanFlightNo}</span>
                    <span>{dateDisplay}</span>
                  </div>
                  <div className="text-[9px] text-neutral-600 text-left mt-0.5">
                    CLASS: {selectedCabins.join(', ')}
                  </div>
                </div>

                {/* Receipt Sections & Items */}
                <div className={`py-2.5 ${compactMode ? 'space-y-2' : 'space-y-3'}`}>
                  {editableMenu.sections
                    .filter((sec) => !sec.hidden)
                    .map((sec) => (
                      <div key={sec.id} className={compactMode ? 'space-y-0.5' : 'space-y-1'}>
                        {includeHeaders && (
                          <div className="font-bold uppercase text-[10px] tracking-wide border-b border-black pb-0.5">
                            * {sec.title} *
                          </div>
                        )}
                        <div className="space-y-1 pt-0.5">
                          {sec.items
                            .filter((it) => !it.hidden)
                            .map((it) => (
                              <div key={it.id} className="pl-1">
                                <div className="font-bold">- {it.title}</div>
                                {includeDescriptions && it.description && (
                                  <div className="text-[9px] text-neutral-700 pl-3 leading-snug">
                                    {it.description}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}

                  {/* Drinks Section if enabled */}
                  {includeDrinks &&
                    editableMenu.drinks
                      .filter((sec) => !sec.hidden)
                      .map((sec) => (
                        <div key={sec.id} className={`pt-1 ${compactMode ? 'space-y-0.5' : 'space-y-1'}`}>
                          {includeHeaders && (
                            <div className="font-bold uppercase text-[10px] tracking-wide border-b border-black pb-0.5">
                              * {sec.title} *
                            </div>
                          )}
                          <div className="space-y-1 pt-0.5">
                            {sec.items
                              .filter((it) => !it.hidden)
                              .map((it) => (
                                <div key={it.id} className="pl-1">
                                  <div className="font-bold">- {it.title}</div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                </div>

                {/* Receipt Footer */}
                <div className="pt-3 border-t-2 border-dashed border-black text-center text-[9px] space-y-0.5 text-neutral-600">
                  <div>* CREW STUDY GUIDE ONLY *</div>
                  <div>Generated via CrewKit ({paperWidth === '108mm' ? '108mm Portrait' : '210mm Portrait'})</div>
                  <div className="pt-1">*** HAVE A SAFE FLIGHT ***</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Export Bar */}
          <div className="shrink-0 flex items-center justify-between gap-2 pt-3 pb-1 border-t border-gold-dim">
            <button
              type="button"
              onClick={() => setStage('form')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gold-dim hover:border-gold-400 text-xs font-ui uppercase tracking-wider font-semibold text-mist-300 hover:text-ivory-100 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportPng}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-ink-850 border border-gold-dim hover:border-gold-400 text-xs font-ui uppercase tracking-wider font-semibold text-ivory-100 transition-all active:scale-95"
                title="Download PNG image"
              >
                <Download className="w-3.5 h-3.5 text-gold-400" />
                <span>PNG</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportPdf}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-ink-850 border border-gold-dim hover:border-gold-400 text-xs font-ui uppercase tracking-wider font-semibold text-ivory-100 transition-all active:scale-95"
                title={`Download ${paperWidth} PDF document`}
              >
                <FileText className="w-3.5 h-3.5 text-gold-400" />
                <span>PDF</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportDocx}
                className="gold-pill-button flex items-center gap-1.5 px-4 py-2 text-xs"
                title="Download Microsoft Word document"
              >
                <FileCode className="w-3.5 h-3.5 text-onyx-900" />
                <span>DOCX</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
