import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { WizardStepper, StepItem } from '../components/WizardStepper';
import {
  Calendar,
  Plane,
  ChevronLeft,
  ChevronRight,
  FileText,
  Sliders,
  Printer,
  Download,
  CheckCircle2,
  FileDown,
  Sparkles
} from 'lucide-react';

const STEPS: StepItem[] = [
  { id: 1, label: 'Flight' },
  { id: 2, label: 'Source' },
  { id: 3, label: 'Layout' },
  { id: 4, label: 'Export' },
];

export const InkFlight: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [flightNo, setFlightNo] = useState<string>('26');
  const [flightDate, setFlightDate] = useState<string>('2026-09-03');

  // Layout toggles
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [includePrices, setIncludePrices] = useState<boolean>(false);
  const [compactMode, setCompactMode] = useState<boolean>(true);

  // Notification for mock exports
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const handleExport = (type: string) => {
    setExportMessage(`${type} generated successfully (Mock export)`);
    setTimeout(() => {
      setExportMessage(null);
    }, 2500);
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <Layout
      title="InkFlight"
      subtitle="Print Homework Formatter"
      showBack={true}
      backTo="/"
    >
      <div className="flex flex-col justify-between h-full py-1 animate-fade-in">
        
        {/* Wizard Stepper */}
        <div className="shrink-0 mb-1">
          <WizardStepper
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={(id) => setCurrentStep(id)}
          />
        </div>

        {/* Wizard Content Cards (Single Viewport) */}
        <div className="flex-1 flex flex-col justify-center min-h-0 my-auto">
          
          {/* STEP 1: Flight Selection */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-3 max-w-sm sm:max-w-md mx-auto w-full animate-fade-in">
              <div className="text-center">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
                  Step 1 &bull; Flight Information
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-text-primary mt-0.5">
                  Select Flight for Formatter
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  Reformat flight menus into clean, ink-saving thermal slips for prep.
                </p>
              </div>

              <div className="p-4 rounded-card bg-bg-surface border border-border-subtle flex flex-col gap-3 shadow-sm">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-widest text-text-secondary mb-1.5">
                    Flight Number
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center px-3.5 py-2.5 rounded-well bg-bg-elevated border border-border-medium text-accent font-semibold text-sm tracking-wider shadow-inner">
                      SQ
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={flightNo}
                        onChange={(e) => setFlightNo(e.target.value)}
                        placeholder="e.g. 26"
                        className="w-full px-3.5 py-2.5 rounded-well bg-bg-elevated border border-border-subtle text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                      />
                      <Plane className="w-4 h-4 text-text-tertiary absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-widest text-text-secondary mb-1.5">
                    Departure Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={flightDate}
                      onChange={(e) => setFlightDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-well bg-bg-elevated border border-border-subtle text-text-primary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    />
                    <Calendar className="w-4 h-4 text-text-tertiary absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Menu Source */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-2.5 max-w-sm sm:max-w-md mx-auto w-full animate-fade-in">
              <div className="text-center">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
                  Step 2 &bull; Raw Data Source
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-text-primary mt-0.5">
                  Menu Source Data
                </h2>
                <p className="text-xs text-text-secondary">
                  Reviewing raw menu contents for SQ{flightNo || '26'}.
                </p>
              </div>

              <div className="p-4 rounded-card bg-bg-surface border border-border-subtle flex flex-col gap-3 shadow-sm min-h-[160px] justify-between">
                <div className="flex items-center gap-3 p-3 rounded-well bg-bg-elevated/70 border border-border-subtle">
                  <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-accent shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-semibold text-text-primary block">
                      Fetched Menu Data
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      Fetched menu data will appear here for editing
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-well bg-bg-elevated/40 border border-dashed border-border-medium text-center">
                  <span className="text-xs text-text-secondary italic">
                    Ready to format 3 sectors &bull; 12 meal variations detected
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Customize Layout */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-2.5 max-w-sm sm:max-w-md mx-auto w-full animate-fade-in">
              <div className="text-center">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
                  Step 3 &bull; Print Layout
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-text-primary mt-0.5">
                  Customize Layout
                </h2>
                <p className="text-xs text-text-secondary">
                  Drag and arrange menu sections here
                </p>
              </div>

              {/* Layout Config Switches */}
              <div className="p-3.5 rounded-card bg-bg-surface border border-border-subtle flex flex-col gap-2 shadow-sm">
                
                {/* Switch 1: Include headers */}
                <div className="flex items-center justify-between p-2 rounded-well bg-bg-elevated border border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-accent" />
                    <div>
                      <span className="text-xs font-medium text-text-primary block leading-none">Include headers</span>
                      <span className="text-[10px] text-text-secondary">Cabin &amp; sector headers</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeHeaders}
                    onChange={(e) => setIncludeHeaders(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded cursor-pointer"
                  />
                </div>

                {/* Switch 2: Include prices */}
                <div className="flex items-center justify-between p-2 rounded-well bg-bg-elevated border border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-accent" />
                    <div>
                      <span className="text-xs font-medium text-text-primary block leading-none">Include prices</span>
                      <span className="text-[10px] text-text-secondary">Duty-free / retail items</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includePrices}
                    onChange={(e) => setIncludePrices(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded cursor-pointer"
                  />
                </div>

                {/* Switch 3: Compact mode */}
                <div className="flex items-center justify-between p-2 rounded-well bg-bg-elevated border border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-accent" />
                    <div>
                      <span className="text-xs font-medium text-text-primary block leading-none">Compact mode</span>
                      <span className="text-[10px] text-text-secondary">Tight thermal slip margins</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={compactMode}
                    onChange={(e) => setCompactMode(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded cursor-pointer"
                  />
                </div>

              </div>
            </div>
          )}

          {/* STEP 4: Preview & Export */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-2 max-w-sm sm:max-w-md mx-auto w-full animate-fade-in">
              <div className="text-center">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
                  Step 4 &bull; Thermal Slip Preview
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-text-primary mt-0.5">
                  Preview &amp; Export
                </h2>
                <p className="text-xs text-text-secondary">
                  Ready to print or save for inflight reference.
                </p>
              </div>

              {/* Mock Print Preview Rectangle (Receipt-width proportions, Black & White) */}
              <div className="p-3 bg-white text-black rounded-lg border-2 border-dashed border-gray-400 font-mono shadow-md flex flex-col justify-between max-w-[260px] mx-auto w-full h-[155px] text-[10px] leading-tight select-none">
                <div>
                  <div className="text-center border-b border-black pb-1 mb-1 font-bold tracking-widest text-[11px]">
                    *** SQ{flightNo || '26'} MENU ***
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-700">
                    <span>SECTOR: SIN-FRA</span>
                    <span>{flightDate}</span>
                  </div>
                  <div className="mt-1 font-semibold text-[10px] uppercase">
                    [ BUSINESS CLASS ]
                  </div>
                  <div className="text-[9px] mt-0.5 text-gray-800">
                    &bull; APP: Smoked Duck Breast<br />
                    &bull; MAIN: Seared Cod / Beef Cheek<br />
                    &bull; DSRT: Valrhona Chocolate Tart
                  </div>
                </div>

                <div className="text-center text-[8px] text-gray-500 border-t border-dotted border-gray-400 pt-0.5">
                  --- CREWKIT INKFLIGHT THERMAL SLIP ---
                </div>
              </div>

              {/* Toast Feedback for Mock Export */}
              {exportMessage && (
                <div className="flex items-center justify-center gap-1.5 py-1 px-3 rounded-full bg-success/15 border border-success/30 text-success text-[11px] font-medium animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{exportMessage}</span>
                </div>
              )}

              {/* Export Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-1">
                <button
                  onClick={() => handleExport('PNG Image')}
                  className="flex flex-col items-center justify-center p-2 rounded-well bg-bg-surface border border-border-subtle hover:border-accent hover:text-accent active:scale-95 transition-all text-xs font-medium"
                >
                  <Download className="w-4 h-4 mb-1 text-accent" />
                  <span>Export PNG</span>
                </button>
                <button
                  onClick={() => handleExport('DOCX Document')}
                  className="flex flex-col items-center justify-center p-2 rounded-well bg-bg-surface border border-border-subtle hover:border-accent hover:text-accent active:scale-95 transition-all text-xs font-medium"
                >
                  <FileDown className="w-4 h-4 mb-1 text-accent" />
                  <span>Export DOCX</span>
                </button>
                <button
                  onClick={() => handleExport('PDF Document')}
                  className="flex flex-col items-center justify-center p-2 rounded-well bg-bg-surface border border-border-subtle hover:border-accent hover:text-accent active:scale-95 transition-all text-xs font-medium"
                >
                  <Printer className="w-4 h-4 mb-1 text-accent" />
                  <span>Export PDF</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Wizard Footer Navigation Buttons */}
        <div className="shrink-0 flex items-center justify-between gap-3 pt-2">
          {currentStep > 1 ? (
            <button
              onClick={handlePrev}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-border-medium text-text-primary hover:bg-bg-surface text-xs font-medium active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full gold-gradient-btn text-xs font-semibold active:scale-95 transition-all ml-auto"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full gold-gradient-btn text-xs font-semibold active:scale-95 transition-all ml-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Format Another</span>
            </button>
          )}
        </div>

      </div>
    </Layout>
  );
};
