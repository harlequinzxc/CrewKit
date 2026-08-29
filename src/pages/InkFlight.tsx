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
import { getCabinConfig, getMenu } from '../lib/sq/endpoints';
import { CabinCode, MenuData, MenuSection } from '../lib/sq/types';
import { exportToPNG } from '../lib/export/png';
import { exportToPDF } from '../lib/export/pdf';
import { exportToDOCX } from '../lib/export/docx';
import {
  Sparkles,
  GripVertical,
  Eye,
  EyeOff,
  Image as ImageIcon,
  FileText,
  FileDown,
  RotateCcw,
  Sliders,
  CheckCircle2
} from 'lucide-react';

const INKFLIGHT_MESSAGES: InterludeMessage[] = [
  { text: 'Retrieving menu from seat pocket…', durationMs: 3000 },
  { text: 'Almost ready…', durationMs: 2000 },
];

export const InkFlight: React.FC = () => {
  const location = useLocation();
  const prefill = location.state as { flightNo?: string; dateISO?: string; dateDisplay?: string; cabins?: CabinCode[] } | undefined;

  const [stage, setStage] = useState<'form' | 'loading' | 'editor'>('form');

  // Flight validation
  const validation = useFlightValidation(prefill?.flightNo || '322');
  const [dateISO, setDateISO] = useState<string>(prefill?.dateISO || '');
  const [dateDisplay, setDateDisplay] = useState<string>(prefill?.dateDisplay || '');

  // Cabin detection
  const [isDetectingCabins, setIsDetectingCabins] = useState(false);
  const [availableCabins, setAvailableCabins] = useState<CabinCode[]>([]);
  const [selectedCabins, setSelectedCabins] = useState<CabinCode[]>(prefill?.cabins || ['BUSINESS']);

  // Menu data per cabin
  const [menusByCabin, setMenusByCabin] = useState<Record<CabinCode, MenuData>>({} as Record<CabinCode, MenuData>);
  const [originalMenus, setOriginalMenus] = useState<Record<CabinCode, MenuData>>({} as Record<CabinCode, MenuData>);
  const [activeTabCabin, setActiveTabCabin] = useState<CabinCode>('BUSINESS');

  // Mobile split view tab ('edit' | 'preview')
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('preview');

  // Layout toggles
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [includeDescriptions, setIncludeDescriptions] = useState(true);
  const [includeDrinks, setIncludeDrinks] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [paperWidthMm, setPaperWidthMm] = useState<58 | 80>(80);

  // Export states
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // 1. Run Cabin Detection
  useEffect(() => {
    if (!validation.isValid || !dateISO || !validation.flightNo) {
      setAvailableCabins([]);
      return;
    }

    let isSubscribed = true;
    setIsDetectingCabins(true);

    getCabinConfig(validation.flightNo, dateISO)
      .then((config) => {
        if (!isSubscribed) return;
        setIsDetectingCabins(false);
        setAvailableCabins(config.available);
        if (selectedCabins.length === 0) {
          if (config.available.includes('BUSINESS')) {
            setSelectedCabins(['BUSINESS']);
          } else if (config.available.length > 0) {
            setSelectedCabins([config.available[0]]);
          }
        }
      })
      .catch(() => {
        if (!isSubscribed) return;
        setIsDetectingCabins(false);
        setAvailableCabins(['BUSINESS', 'ECONOMY']);
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

  // 2. Fetch Menu
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
      // deep clone for editing
      map[r.cabin] = JSON.parse(JSON.stringify(r.menu));
    });
    return map;
  };

  const handleFetchSuccess = (data: Record<CabinCode, MenuData>) => {
    setMenusByCabin(JSON.parse(JSON.stringify(data)));
    setOriginalMenus(JSON.parse(JSON.stringify(data)));
    if (selectedCabins.length > 0) {
      setActiveTabCabin(selectedCabins[0]);
    }
    setStage('editor');
  };

  // Editor mutation handlers
  const currentMenu = menusByCabin[activeTabCabin];

  const handleToggleSectionVisibility = (secId: string) => {
    if (!currentMenu) return;
    const updated = { ...menusByCabin };
    const menu = updated[activeTabCabin];
    const target = menu.sections.find((s) => s.id === secId) || menu.drinks.find((s) => s.id === secId);
    if (target) {
      target.hidden = !target.hidden;
      setMenusByCabin(updated);
    }
  };

  const handleToggleItemVisibility = (secId: string, itemId: string) => {
    if (!currentMenu) return;
    const updated = { ...menusByCabin };
    const menu = updated[activeTabCabin];
    const targetSec = menu.sections.find((s) => s.id === secId) || menu.drinks.find((s) => s.id === secId);
    if (targetSec) {
      const item = targetSec.items.find((i) => i.id === itemId);
      if (item) {
        item.hidden = !item.hidden;
        setMenusByCabin(updated);
      }
    }
  };

  const handleMoveSection = (secIndex: number, direction: 'up' | 'down') => {
    if (!currentMenu) return;
    const updated = { ...menusByCabin };
    const menu = updated[activeTabCabin];
    const sections = [...menu.sections];
    const targetIdx = direction === 'up' ? secIndex - 1 : secIndex + 1;
    if (targetIdx >= 0 && targetIdx < sections.length) {
      const temp = sections[secIndex];
      sections[secIndex] = sections[targetIdx];
      sections[targetIdx] = temp;
      menu.sections = sections;
      setMenusByCabin(updated);
    }
  };

  const handleResetEditor = () => {
    if (originalMenus[activeTabCabin]) {
      setMenusByCabin({
        ...menusByCabin,
        [activeTabCabin]: JSON.parse(JSON.stringify(originalMenus[activeTabCabin])),
      });
    }
  };

  // Exports
  const generateFilename = (ext: string) => {
    const cleanDate = (dateDisplay || 'Date').replace(/\s+/g, '');
    return `SQ${validation.cleanFlightNo}-${cleanDate}-${activeTabCabin}.${ext}`;
  };

  const handleExportPNG = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    const success = await exportToPNG(receiptRef.current, generateFilename('png').replace('.png', ''));
    setIsExporting(false);
    if (success) {
      setExportFeedback('PNG Thermal Slip Exported');
      setTimeout(() => setExportFeedback(null), 3000);
    }
  };

  const handleExportPDF = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    const success = await exportToPDF(receiptRef.current, generateFilename('pdf').replace('.pdf', ''), paperWidthMm);
    setIsExporting(false);
    if (success) {
      setExportFeedback('PDF Thermal Slip Exported');
      setTimeout(() => setExportFeedback(null), 3000);
    }
  };

  const handleExportDOCX = async () => {
    if (!currentMenu) return;
    setIsExporting(true);
    const allSections = [...currentMenu.sections, ...(includeDrinks ? currentMenu.drinks : [])];
    const success = await exportToDOCX(
      `SQ${validation.cleanFlightNo}`,
      dateDisplay,
      activeTabCabin,
      allSections,
      includeDescriptions && !compactMode,
      generateFilename('docx').replace('.docx', '')
    );
    setIsExporting(false);
    if (success) {
      setExportFeedback('DOCX Document Exported');
      setTimeout(() => setExportFeedback(null), 3000);
    }
  };

  const flightSummaryLine = `SQ${validation.cleanFlightNo} · ${dateDisplay} · ${activeTabCabin}`;

  // Combined sections for thermal receipt
  const receiptSections: MenuSection[] = currentMenu
    ? [...currentMenu.sections.filter((s) => !s.hidden), ...(includeDrinks ? currentMenu.drinks.filter((s) => !s.hidden) : [])]
    : [];

  return (
    <Layout>
      {/* 1. LOADING INTERLUDE */}
      {stage === 'loading' && (
        <FetchInterlude
          flightChipText={flightSummaryLine}
          messages={INKFLIGHT_MESSAGES}
          fetchTask={executeMenuFetch}
          onSuccess={handleFetchSuccess}
        />
      )}

      {/* 2. FORM STAGE */}
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
              Let&apos;s ready your homework.
            </h2>

            {/* Flight Input */}
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

            {/* Departure Date */}
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

            {/* Cabin Detection skeleton */}
            {isDetectingCabins && (
              <div className="w-full mt-5 text-left animate-fade-in">
                <label className="block text-[0.7rem] font-medium tracking-[0.2em] uppercase text-text-secondary mb-2 select-none">
                  Detected Cabin Classes
                </label>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-20 rounded-full bg-bg-elevated animate-pulse" />
                  <div className="h-8 w-24 rounded-full bg-bg-elevated animate-pulse" />
                </div>
              </div>
            )}

            {/* Detected Cabin Pills */}
            {!isDetectingCabins && availableCabins.length > 0 && (
              <div className="w-full mt-5 text-left animate-fade-in">
                <label className="block text-[0.7rem] font-medium tracking-[0.2em] uppercase text-text-secondary mb-2 select-none">
                  Detected Cabin Classes
                </label>
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

          {/* CTA */}
          {validation.isValid && validation.flightNo.length > 0 && dateISO && selectedCabins.length > 0 && (
            <div className="shrink-0 pb-2">
              <RevealCTA
                label="Fetch Menu"
                icon={Sparkles}
                summary={`SQ${validation.cleanFlightNo} · ${dateDisplay}`}
                onPress={handleStartFetch}
              />
            </div>
          )}
        </div>
      )}

      {/* 3. EDITOR + PREVIEW SPLIT (Single Viewport) */}
      {stage === 'editor' && currentMenu && (
        <div className="flex flex-col h-full overflow-hidden animate-fade-in">
          
          {/* Top Header Row */}
          <div className="shrink-0 flex items-center justify-between pb-2 border-b border-border-subtle/50">
            <FlightChip label={flightSummaryLine} />

            {/* Mobile Edit / Preview Tab Switch */}
            <div className="flex lg:hidden items-center p-0.5 rounded-full bg-bg-elevated border border-border-subtle">
              <button
                type="button"
                onClick={() => setMobileTab('edit')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  mobileTab === 'edit'
                    ? 'bg-accent text-[#0B1E3E] font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  mobileTab === 'preview'
                    ? 'bg-accent text-[#0B1E3E] font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Preview
              </button>
            </div>
          </div>

          {/* Cabin Switcher Tabs (If multi-cabin) */}
          {selectedCabins.length > 1 && (
            <div className="shrink-0 flex items-center gap-1.5 py-1.5 overflow-x-auto select-none">
              {selectedCabins.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveTabCabin(c)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                    activeTabCabin === c
                      ? 'bg-accent text-[#0B1E3E] font-semibold shadow-sm'
                      : 'bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-subtle'
                  }`}
                >
                  {c === 'PREMIUM_ECONOMY' ? 'Prem Econ' : c.charAt(0) + c.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          )}

          {/* Split Workspace Area (Editor Left 40%, Preview Right 60% on Desktop ≥900px) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 my-1 overflow-hidden">
            
            {/* LEFT PANEL: EDITOR (Visible on desktop OR mobileTab === 'edit') */}
            <div
              className={`lg:col-span-5 flex-col h-full overflow-hidden bg-bg-surface rounded-card border border-border-subtle p-3 ${
                mobileTab === 'edit' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              {/* Global Layout Toggles */}
              <div className="shrink-0 pb-2 mb-2 border-b border-border-subtle/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-semibold text-accent text-[11px] uppercase tracking-wider">
                    <Sliders className="w-3.5 h-3.5" /> Thermal Format
                  </span>
                  {/* Paper Width Toggle */}
                  <div className="flex items-center p-0.5 rounded-full bg-bg-elevated border border-border-subtle text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPaperWidthMm(58)}
                      className={`px-2 py-0.5 rounded-full font-mono ${
                        paperWidthMm === 58 ? 'bg-accent text-[#0B1E3E] font-bold' : 'text-text-secondary'
                      }`}
                    >
                      58mm
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaperWidthMm(80)}
                      className={`px-2 py-0.5 rounded-full font-mono ${
                        paperWidthMm === 80 ? 'bg-accent text-[#0B1E3E] font-bold' : 'text-text-secondary'
                      }`}
                    >
                      80mm
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <label className="flex items-center gap-1.5 text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeHeaders}
                      onChange={(e) => setIncludeHeaders(e.target.checked)}
                      className="w-3.5 h-3.5 accent-accent rounded"
                    />
                    <span>Headers</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDescriptions}
                      onChange={(e) => setIncludeDescriptions(e.target.checked)}
                      className="w-3.5 h-3.5 accent-accent rounded"
                    />
                    <span>Descriptions</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDrinks}
                      onChange={(e) => setIncludeDrinks(e.target.checked)}
                      className="w-3.5 h-3.5 accent-accent rounded"
                    />
                    <span>Drinks</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={compactMode}
                      onChange={(e) => setCompactMode(e.target.checked)}
                      className="w-3.5 h-3.5 accent-accent rounded"
                    />
                    <span>Compact Mode</span>
                  </label>
                </div>
              </div>

              {/* Scrollable Reorder & Visibility List */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2 text-left">
                {currentMenu.sections.map((sec, secIdx) => (
                  <div
                    key={sec.id}
                    className={`p-2 rounded-well border text-xs transition-all ${
                      sec.hidden ? 'bg-bg-elevated/40 border-border-subtle/40 opacity-50' : 'bg-bg-elevated border-border-subtle'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <GripVertical className="w-3.5 h-3.5 text-text-tertiary" />
                        <span className="font-semibold text-text-primary">{sec.title}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {secIdx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMoveSection(secIdx, 'up')}
                            className="text-[10px] px-1 text-text-tertiary hover:text-accent"
                          >
                            ▲
                          </button>
                        )}
                        {secIdx < currentMenu.sections.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveSection(secIdx, 'down')}
                            className="text-[10px] px-1 text-text-tertiary hover:text-accent"
                          >
                            ▼
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleSectionVisibility(sec.id)}
                          className="p-1 text-text-secondary hover:text-accent"
                          aria-label="Toggle section"
                        >
                          {sec.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-accent" />}
                        </button>
                      </div>
                    </div>

                    {/* Section items list */}
                    {!sec.hidden && (
                      <div className="mt-1.5 pl-5 space-y-1 border-t border-border-subtle/40 pt-1">
                        {sec.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-[11px]">
                            <span className={item.hidden ? 'line-through text-text-tertiary truncate max-w-[140px]' : 'text-text-secondary truncate max-w-[140px]'}>
                              {item.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleItemVisibility(sec.id, item.id)}
                              className="text-text-tertiary hover:text-accent"
                            >
                              {item.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3 text-accent" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Reset Revert Button */}
              <div className="shrink-0 pt-2 border-t border-border-subtle/50 flex justify-between items-center text-[10px]">
                <button
                  type="button"
                  onClick={handleResetEditor}
                  className="flex items-center gap-1 text-text-secondary hover:text-accent transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Revert to default order</span>
                </button>
              </div>
            </div>

            {/* RIGHT PANEL: THERMAL RECEIPT CANVAS (Visible on desktop OR mobileTab === 'preview') */}
            <div
              className={`lg:col-span-7 flex flex-col items-center justify-center h-full overflow-hidden bg-bg-surface/50 rounded-card border border-border-subtle p-2 sm:p-3 ${
                mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              {/* Receipt Scroll Container */}
              <div className="w-full h-full overflow-y-auto flex justify-center py-2">
                {/* Pure B&W Thermal Canvas Element */}
                <div
                  ref={receiptRef}
                  style={{
                    width: paperWidthMm === 58 ? '260px' : '320px',
                  }}
                  className={`bg-white text-black p-4 font-mono shadow-2xl border border-gray-300 select-none ${
                    compactMode ? 'text-[10px] leading-tight' : 'text-xs leading-normal'
                  }`}
                >
                  {/* Header */}
                  <div className="text-center pb-2 border-b-2 border-dashed border-black">
                    <p className="font-bold text-sm tracking-widest">*** SINGAPORE AIRLINES ***</p>
                    <p className="text-[10px] tracking-wider mt-0.5">INFLIGHT MENU SLIP</p>
                    <div className="flex justify-between text-[10px] font-bold mt-1.5 border-t border-dotted border-black pt-1">
                      <span>SQ {validation.cleanFlightNo}</span>
                      <span>{dateDisplay}</span>
                      <span>{activeTabCabin}</span>
                    </div>
                  </div>

                  {/* Sections and Items */}
                  <div className="py-2 space-y-2.5">
                    {receiptSections.map((sec) => (
                      <div key={sec.id}>
                        {includeHeaders && (
                          <div className="font-bold uppercase tracking-wider text-[11px] border-b border-black pb-0.5 mb-1">
                            [{sec.title}]
                          </div>
                        )}
                        <div className="space-y-1">
                          {sec.items
                            .filter((i) => !i.hidden)
                            .map((item) => (
                              <div key={item.id}>
                                <p className="font-semibold text-[11px]">• {item.title}</p>
                                {includeDescriptions && !compactMode && item.description && (
                                  <p className="text-[9px] text-gray-700 pl-3 leading-tight">{item.description}</p>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="text-center pt-2 border-t-2 border-dashed border-black text-[9px] text-gray-600">
                    <p>— CREWKIT INKFLIGHT SLIP —</p>
                    <p className="text-[8px] mt-0.5">Thermal Print Ready &bull; Non-Official</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Feedback Toast */}
          {exportFeedback && (
            <div className="shrink-0 flex items-center justify-center gap-1.5 py-1 px-3 mb-1 rounded-full bg-success/20 border border-success/40 text-success text-[11px] font-medium animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{exportFeedback}</span>
            </div>
          )}

          {/* EXPORT BAR (Always visible at bottom) */}
          <div className="shrink-0 grid grid-cols-3 gap-2 pt-2 border-t border-border-subtle/50">
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportPNG}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-bg-elevated border border-accent/40 text-accent hover:bg-accent/15 text-xs font-semibold active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              <ImageIcon className="w-4 h-4" />
              <span>PNG</span>
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportDOCX}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-bg-elevated border border-accent/40 text-accent hover:bg-accent/15 text-xs font-semibold active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>DOCX</span>
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-bg-elevated border border-accent/40 text-accent hover:bg-accent/15 text-xs font-semibold active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>

        </div>
      )}
    </Layout>
  );
};
