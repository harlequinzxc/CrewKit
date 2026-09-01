import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow } from '../context/FlowContext';
import { Layout } from '../components/ui/Layout';
import { FlightChip } from '../components/FlightChip';
import { getMenu } from '../lib/sq/endpoints';
import { MenuData, MenuSection } from '../lib/sq/types';
import { exportToPNG } from '../lib/export/png';
import { exportToPDF } from '../lib/export/pdf';
import { exportToDOCX } from '../lib/export/docx';
import { Heading, Button, SegmentedControl } from '../components/ui';
import {
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

export const InkFlight: React.FC = () => {
  const navigate = useNavigate();
  const { state: flowState, isFlowConfigured, goToPage, resetFlow } = useFlow();

  // Navigation menu open state (controlled on Layout)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // Redirect to flow start if accessed directly without configured state
  useEffect(() => {
    if (!isFlowConfigured) {
      navigate('/', { replace: true });
    }
  }, [isFlowConfigured, navigate]);

  // Load menu data on mount
  useEffect(() => {
    if (!isFlowConfigured) return;

    let isMounted = true;

    const cabinToFetch = flowState.cabinClass || 'BUSINESS';
    const activeSectors = flowState.sectors.filter((s) => !s.paxing);
    const sectorsToFetch = activeSectors.length > 0 ? activeSectors : flowState.sectors;

    const fetchAllMenus = async () => {
      const menus = await Promise.all(
        sectorsToFetch.map((s) => getMenu(s.flightNumber, s.date, cabinToFetch))
      );

      if (!isMounted) return;

      const allSections: MenuSection[] = [];
      const allDrinks: MenuSection[] = [];

      menus.forEach((m, sIdx) => {
        const secInfo = sectorsToFetch[sIdx];
        const flightTag = `SQ${secInfo.flightNumber.replace(/\D/g, '')}`;

        if (m.legs && m.legs.length > 0) {
          m.legs.forEach((leg) => {
            leg.mealServices.forEach((srv) => {
              srv.selections.forEach((sel) => {
                sel.courses.forEach((crs) => {
                  allSections.push({
                    id: `${flightTag}_${leg.legId}_${crs.id}`,
                    title: `${flightTag} · ${leg.origin}→${leg.destination} · ${srv.name} · ${crs.name}`,
                    items: crs.items,
                  });
                });
              });
            });

            leg.drinks.forEach((d) => {
              allDrinks.push({
                id: `${flightTag}_${leg.legId}_${d.id}`,
                title: `${flightTag} · ${leg.origin}→${leg.destination} · ${d.title}`,
                items: d.items,
              });
            });
          });
        } else {
          m.sections.forEach((s) => {
            allSections.push({
              id: `${flightTag}_${s.id}`,
              title: `${flightTag} · ${s.title}`,
              items: s.items,
            });
          });
          m.drinks.forEach((d) => {
            allDrinks.push({
              id: `${flightTag}_${d.id}`,
              title: `${flightTag} · ${d.title}`,
              items: d.items,
            });
          });
        }
      });

      const combinedMenu: MenuData = {
        flightNo: sectorsToFetch.map((s) => `SQ${s.flightNumber.replace(/\D/g, '')}`).join(' / '),
        date: sectorsToFetch[0]?.date || '',
        cabin: cabinToFetch,
        legs: menus[0]?.legs || [],
        sections: allSections,
        drinks: allDrinks,
      };

      setEditableMenu(combinedMenu);
    };

    fetchAllMenus();

    return () => {
      isMounted = false;
    };
  }, [isFlowConfigured, flowState.sectors, flowState.cabinClass]);

  if (!isFlowConfigured) {
    return null;
  }

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
      await exportToPNG(receiptRef.current, `CrewKit_Thermal_Receipt.png`);
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
        `CrewKit_Thermal_Receipt`,
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
        editableMenu.flightNo,
        editableMenu.date,
        editableMenu.cabin,
        [...editableMenu.sections, ...(includeDrinks ? editableMenu.drinks : [])],
        includeDescriptions,
        `CrewKit_Menu_StudyGuide`
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const flightSummaryLine = `${flowState.sectors
    .map((s) => `SQ${s.flightNumber.replace(/\D/g, '')}${s.paxing ? ' (Pax)' : ''}`)
    .join(' · ')} · ${flowState.cabinClass || 'Business'}`;

  const mobileTabOptions = [
    { id: 'editor' as const, label: 'Customise', icon: Sliders },
    { id: 'preview' as const, label: 'Receipt Preview', icon: Printer },
  ];

  return (
    <Layout
      containerClassName="w-full md:w-[85%] max-w-6xl"
      onBack={() => {
        goToPage(4, 'backward');
        navigate('/');
      }}
      menuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
    >
      {editableMenu && (
        <div className="flex flex-col h-full overflow-hidden animate-cabin-in text-left">
          {/* Top Bar with Flight Chip & Mobile Tab Switcher */}
          <div className="shrink-0 flex flex-col items-center pt-1 pb-2 border-b border-gold-dim">
            <FlightChip label={flightSummaryLine} />

            {/* Mobile Tab Switcher */}
            <div className="sm:hidden mt-2">
              <SegmentedControl
                options={mobileTabOptions}
                value={mobileTab}
                onChange={(val) => setMobileTab(val as any)}
                layoutId="mobile-inkflight-tab"
                size="sm"
              />
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
                        <Heading variant="subsection" as="span" className="text-base font-light font-display text-ivory-100">
                          {sec.title}
                        </Heading>
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
                    <span>FLIGHT: {editableMenu.flightNo}</span>
                    <span>{editableMenu.date}</span>
                  </div>
                  <div className="text-[9px] text-neutral-600 text-left mt-0.5">
                    CLASS: {editableMenu.cabin}
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
            <Button
              variant="ghost"
              size="sm"
              leftIcon={RotateCcw}
              onClick={() => {
                resetFlow();
                navigate('/');
              }}
            >
              Start Over
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={isExporting}
                leftIcon={<Download className="w-3.5 h-3.5 text-gold-400" />}
                onClick={handleExportPng}
                title="Download PNG image"
              >
                PNG
              </Button>

              <Button
                variant="secondary"
                size="sm"
                disabled={isExporting}
                leftIcon={<FileText className="w-3.5 h-3.5 text-gold-400" />}
                onClick={handleExportPdf}
                title={`Download ${paperWidth} PDF document`}
              >
                PDF
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={isExporting}
                leftIcon={<FileCode className="w-3.5 h-3.5 text-onyx-900" />}
                onClick={handleExportDocx}
                title="Download Microsoft Word document"
              >
                DOCX
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};