import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { FlightNumberInput } from '../components/FlightNumberInput';
import { DepartureBlock, getTodayISO, formatDateDisplay } from '../components/DepartureBlock';
import { RevealCTA } from '../components/RevealCTA';
import { CabinPill } from '../components/CabinPill';
import { FlightChip } from '../components/FlightChip';
import { FetchInterlude, InterludeMessage } from '../components/FetchInterlude';
import { useFlightValidation } from '../hooks/useFlightValidation';
import { getCabinConfig, getMenu } from '../lib/sq/endpoints';
import { CabinCode, MenuData, MenuSection } from '../lib/sq/types';
import { exportToPNG } from '../lib/export/png';
import { exportToPDF } from '../lib/export/pdf';
import { exportToDOCX } from '../lib/export/docx';
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
  { text: 'Formatting print receipt…', durationMs: 2000 },
];

export const InkFlight: React.FC = () => {
  const location = useLocation();
  const navState = location.state as {
    flightNo?: string;
    dateISO?: string;
    dateDisplay?: string;
    cabin?: CabinCode;
  } | null;

  const initialTodayISO = navState?.dateISO || getTodayISO();
  const initialTodayDisplay = navState?.dateDisplay || formatDateDisplay(initialTodayISO);

  // Screen Stages: 'form' | 'loading' | 'editor'
  const [stage, setStage] = useState<'form' | 'loading' | 'editor'>('form');

  // Flight validation — start with EMPTY input unless passed from nav state
  const validation = useFlightValidation(navState?.flightNo || '');
  const [dateISO, setDateISO] = useState<string>(initialTodayISO);
  const [dateDisplay, setDateDisplay] = useState<string>(initialTodayDisplay);

  // Cabin detection states — Single Select
  const [isDetectingCabins, setIsDetectingCabins] = useState(false);
  const [availableCabins, setAvailableCabins] = useState<CabinCode[]>([]);
  const [selectedCabin, setSelectedCabin] = useState<CabinCode>(navState?.cabin || 'BUSINESS');
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

  // Receipt DOM element ref for PNG/PDF capture
  const receiptRef = useRef<HTMLDivElement>(null);

  // Cabin Detection
  useEffect(() => {
    if (!validation.flightNo || validation.flightNo.trim().length === 0) {
      setAvailableCabins([]);
      setFlightNotFoundError(null);
      return;
    }

    if (!validation.isValid) {
      setAvailableCabins([]);
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
          if (config.available.includes('BUSINESS')) {
            setSelectedCabin('BUSINESS');
          } else {
            setSelectedCabin(config.available[0]);
          }
        } else {
          setAvailableCabins([]);
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

  // Start Fetch
  const handleStartFetch = () => {
    setStage('loading');
  };

  const executeMenuFetch = async () => {
    const menu = await getMenu(validation.flightNo, dateISO, selectedCabin);
    return menu;
  };

  const handleFetchSuccess = (data: MenuData) => {
    // Deep clone to allow editing
    const cloned = JSON.parse(JSON.stringify(data)) as MenuData;
    setEditableMenu(cloned);
    setStage('editor');
  };

  // Auto-start fetch if navigated with full parameters
  useEffect(() => {
    if (navState?.flightNo && navState?.dateISO && stage === 'form') {
      handleStartFetch();
    }
  }, []);

  // Editor Actions
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

  // Export handlers
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
        selectedCabin,
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

  const cabinLabel =
    selectedCabin === 'PREMIUM_ECONOMY'
      ? 'Prem Econ'
      : selectedCabin.charAt(0) + selectedCabin.slice(1).toLowerCase();

  const flightSummaryLine = `SQ${validation.cleanFlightNo} · ${dateDisplay} · ${cabinLabel}`;

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

      {/* 2. FORM FLOW */}
      {stage === 'form' && (
        <div className="flex flex-col justify-between h-full py-1 animate-fade-in">
          <div className="flex-1 max-h-8 sm:max-h-12" />

          <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center my-auto">
            {/* Eyebrow */}
            <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
              Prep,
            </span>

            {/* Headline */}
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
              Let's ready your homework.
            </h2>

            {/* Flight Number Input */}
            <div className="w-full mt-6 text-left">
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
              </div>
            )}

            {/* Single-Select Cabin Classes */}
            {!isDetectingCabins && availableCabins.length > 0 && !flightNotFoundError && (
              <div className="w-full mt-5 text-left animate-fade-in">
                <label className="block text-[0.7rem] font-medium tracking-[0.2em] uppercase text-text-secondary mb-2 select-none">
                  Cabin Class for Printout
                </label>
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

          {/* Progression CTA */}
          {validation.isValid &&
            validation.flightNo.length > 0 &&
            dateISO &&
            availableCabins.length > 0 &&
            !flightNotFoundError &&
            !isDetectingCabins && (
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

      {/* 3. EDITOR & RECEIPT PREVIEW (Split Layout) */}
      {stage === 'editor' && editableMenu && (
        <div className="flex flex-col h-full overflow-hidden animate-fade-in">
          
          {/* Top Bar with Flight Chip & Mobile Tab Switcher */}
          <div className="shrink-0 flex flex-col items-center pt-1 pb-2 border-b border-border-subtle/50">
            <FlightChip label={flightSummaryLine} />

            {/* Mobile Tab Switcher */}
            <div className="flex sm:hidden items-center p-0.5 mt-2 rounded-full bg-bg-surface border border-border-subtle">
              <button
                type="button"
                onClick={() => setMobileTab('editor')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  mobileTab === 'editor'
                    ? 'bg-accent text-[#0B1E3E] font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Customise</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  mobileTab === 'preview'
                    ? 'bg-accent text-[#0B1E3E] font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Receipt Preview</span>
              </button>
            </div>
          </div>

          {/* Main Content Area (Split Grid on desktop, Tabbed on mobile) */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 sm:grid-cols-2 gap-3 py-2 min-h-0">
            
            {/* LEFT PANEL: Customize Controls & Reordering */}
            <div
              className={`flex-col h-full overflow-y-auto space-y-3 pr-1 ${
                mobileTab === 'editor' ? 'flex' : 'hidden sm:flex'
              }`}
            >
              {/* Global Receipt Toggles Card */}
              <div className="p-3 rounded-card bg-bg-surface border border-border-subtle space-y-2.5 text-xs">
                <div className="font-semibold text-text-primary text-[11px] uppercase tracking-wider pb-1 border-b border-border-subtle/50">
                  Receipt Formatting
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIncludeHeaders(!includeHeaders)}
                    className={`px-2.5 py-1.5 rounded-md border text-left flex items-center justify-between ${
                      includeHeaders
                        ? 'bg-accent/15 border-accent text-accent font-medium'
                        : 'bg-bg-elevated border-border-subtle text-text-secondary'
                    }`}
                  >
                    <span>Headers</span>
                    <span className="text-[10px] font-mono">{includeHeaders ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeDescriptions(!includeDescriptions)}
                    className={`px-2.5 py-1.5 rounded-md border text-left flex items-center justify-between ${
                      includeDescriptions
                        ? 'bg-accent/15 border-accent text-accent font-medium'
                        : 'bg-bg-elevated border-border-subtle text-text-secondary'
                    }`}
                  >
                    <span>Descriptions</span>
                    <span className="text-[10px] font-mono">{includeDescriptions ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeDrinks(!includeDrinks)}
                    className={`px-2.5 py-1.5 rounded-md border text-left flex items-center justify-between ${
                      includeDrinks
                        ? 'bg-accent/15 border-accent text-accent font-medium'
                        : 'bg-bg-elevated border-border-subtle text-text-secondary'
                    }`}
                  >
                    <span>Drinks List</span>
                    <span className="text-[10px] font-mono">{includeDrinks ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompactMode(!compactMode)}
                    className={`px-2.5 py-1.5 rounded-md border text-left flex items-center justify-between ${
                      compactMode
                        ? 'bg-accent/15 border-accent text-accent font-medium'
                        : 'bg-bg-elevated border-border-subtle text-text-secondary'
                    }`}
                  >
                    <span>Compact</span>
                    <span className="text-[10px] font-mono">{compactMode ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Paper Width Selector: 108mm (A6 portrait) vs 210mm (A4 portrait) */}
                  <div className="flex flex-col gap-1.5 col-span-2 pt-1 border-t border-border-subtle/40">
                    <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">
                      Paper Width
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaperWidth('108mm')}
                        className={`px-2.5 py-1.5 rounded-md border text-left flex items-center justify-between transition-all ${
                          paperWidth === '108mm'
                            ? 'bg-accent/15 border-accent text-accent font-semibold'
                            : 'bg-bg-elevated border-border-subtle text-text-secondary'
                        }`}
                      >
                        <span>108mm (A6)</span>
                        <span className="text-[10px] font-mono">{paperWidth === '108mm' ? '✓' : ''}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaperWidth('210mm')}
                        className={`px-2.5 py-1.5 rounded-md border text-left flex items-center justify-between transition-all ${
                          paperWidth === '210mm'
                            ? 'bg-accent/15 border-accent text-accent font-semibold'
                            : 'bg-bg-elevated border-border-subtle text-text-secondary'
                        }`}
                      >
                        <span>210mm (A4)</span>
                        <span className="text-[10px] font-mono">{paperWidth === '210mm' ? '✓' : ''}</span>
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
                      className={`rounded-card bg-bg-surface border transition-opacity ${
                        sec.hidden ? 'opacity-40 border-border-subtle/50' : 'border-border-subtle'
                      }`}
                    >
                      <div className="p-2.5 bg-bg-elevated/70 flex items-center justify-between border-b border-border-subtle/40">
                        <span className="font-serif text-xs font-semibold text-text-primary">
                          {sec.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSectionVisibility(sec.id)}
                          className="p-1 rounded text-text-tertiary hover:text-text-primary"
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
                              className={`flex items-center gap-1.5 p-1.5 rounded-md bg-bg-elevated/40 border border-border-subtle/40 ${
                                it.hidden ? 'opacity-35' : ''
                              }`}
                            >
                              {/* Reorder up/down buttons */}
                              <div className="flex flex-col shrink-0">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => moveItem(sec.id, idx, 'up')}
                                  className="text-text-tertiary hover:text-accent disabled:opacity-20 p-0.5"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === sec.items.length - 1}
                                  onClick={() => moveItem(sec.id, idx, 'down')}
                                  className="text-text-tertiary hover:text-accent disabled:opacity-20 p-0.5"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Editable Title */}
                              <input
                                type="text"
                                value={it.title}
                                onChange={(e) => updateItemTitle(sec.id, it.id, e.target.value)}
                                className="flex-1 bg-transparent border-0 text-text-primary text-[11px] font-sans focus:outline-none focus:ring-1 focus:ring-accent/40 rounded px-1"
                              />

                              {/* Toggle visibility */}
                              <button
                                type="button"
                                onClick={() => toggleItemVisibility(sec.id, it.id)}
                                className="p-1 rounded text-text-tertiary hover:text-text-primary shrink-0"
                              >
                                {it.hidden ? (
                                  <EyeOff className="w-3 h-3 text-red-400" />
                                ) : (
                                  <Eye className="w-3 h-3 text-emerald-400" />
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
              className={`h-full overflow-y-auto flex flex-col items-center justify-start ${
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
                    CLASS: {selectedCabin}
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
          <div className="shrink-0 flex items-center justify-between gap-2 pt-2 pb-1 border-t border-border-subtle/50">
            <button
              type="button"
              onClick={() => setStage('form')}
              className="flex items-center gap-1 px-3 py-2 rounded-full border border-border-subtle hover:border-border-hover text-[11px] font-medium text-text-secondary hover:text-text-primary transition-all active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportPng}
                className="flex items-center gap-1 px-3 py-2 rounded-full bg-bg-surface border border-border-subtle hover:border-accent text-[11px] font-medium text-text-primary transition-all active:scale-95"
                title="Download PNG image"
              >
                <Download className="w-3 h-3 text-accent" />
                <span>PNG</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportPdf}
                className="flex items-center gap-1 px-3 py-2 rounded-full bg-bg-surface border border-border-subtle hover:border-accent text-[11px] font-medium text-text-primary transition-all active:scale-95"
                title={`Download ${paperWidth} PDF document`}
              >
                <FileText className="w-3 h-3 text-accent" />
                <span>PDF ({paperWidth})</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportDocx}
                className="editorial-cta-btn flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold tracking-wide"
                title="Download Microsoft Word document"
              >
                <FileCode className="w-3 h-3 text-[#0B1E3E]" />
                <span>DOCX</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </Layout>
  );
};
