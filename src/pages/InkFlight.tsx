import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { WizardStepper, StepItem } from '../components/WizardStepper';
import {
  ArrowRight,
  ArrowLeft,
  Sliders,
  CheckCircle2,
  FileDown,
  Download,
  Printer,
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
  const [flightNo, setFlightNo] = useState<string>('322');

  // Layout toggles
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [includePrices, setIncludePrices] = useState<boolean>(false);
  const [compactMode, setCompactMode] = useState<boolean>(true);

  // Export notification
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
    <Layout>
      <div className="flex flex-col justify-between h-full py-1 animate-fade-in">
        
        {/* Whisper Stepper (≤ 24px tall, thin segmented bar) */}
        <div className="shrink-0 mt-0.5">
          <WizardStepper
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={(id) => setCurrentStep(id)}
          />
        </div>

        {/* Generous empty top spacer (30-40% of viewport) */}
        <div className="flex-1 max-h-16 sm:max-h-24" />

        {/* Editorial Hero & Form Group (Lower-Middle Viewport) */}
        <div className="w-full my-auto flex flex-col items-center text-center">
          
          {/* STEP 1: Flight Selection */}
          {currentStep === 1 && (
            <div className="w-full max-w-sm mx-auto flex flex-col items-center animate-fade-in">
              {/* Editorial Eyebrow */}
              <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
                Good evening,
              </span>

              {/* Serif Headline */}
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
                Where are we flying today?
              </h2>

              {/* Form Input Group (Directly on background, NO card) */}
              <div className="w-full mt-7 sm:mt-8 text-left">
                <label className="block text-[0.7rem] font-medium tracking-[0.2em] uppercase text-text-secondary mb-2.5">
                  Flight Number
                </label>

                <div className="flex items-center gap-3">
                  {/* Elevated SQ Badge Pill */}
                  <div className="w-14 h-14 rounded-well bg-bg-elevated border border-border-subtle flex items-center justify-center text-accent font-semibold text-base tracking-wider shadow-sm shrink-0">
                    SQ
                  </div>

                  {/* Recessed Input Well */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={flightNo}
                      onChange={(e) => setFlightNo(e.target.value)}
                      placeholder="3 2 2"
                      className="w-full h-14 px-4 rounded-well bg-bg-elevated border border-border-subtle text-text-primary placeholder:text-text-tertiary text-lg tracking-[0.15em] font-medium focus:outline-none focus:border-accent/80 focus:ring-1 focus:ring-accent/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Menu Source */}
          {currentStep === 2 && (
            <div className="w-full max-w-sm mx-auto flex flex-col items-center animate-fade-in">
              <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
                Source Data,
              </span>

              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
                Let&apos;s pull your menu.
              </h2>

              <div className="w-full mt-6 space-y-3 text-left">
                <div className="p-4 rounded-well bg-bg-elevated border border-border-subtle flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-text-primary block">
                      SQ {flightNo || '322'} &bull; Singapore &rarr; London
                    </span>
                    <span className="text-[11px] text-text-secondary mt-0.5 block">
                      3 Cabin classes &bull; 14 menu courses detected
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 font-mono">
                    Ready
                  </span>
                </div>

                <p className="text-[11px] text-text-tertiary text-center italic">
                  Raw catering manifest loaded and ready for thermal slip layout formatting.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Customize Layout */}
          {currentStep === 3 && (
            <div className="w-full max-w-sm mx-auto flex flex-col items-center animate-fade-in">
              <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
                Formatting,
              </span>

              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
                Shape it to your taste.
              </h2>

              <div className="w-full mt-6 space-y-2.5 text-left">
                {/* Switch 1 */}
                <div className="flex items-center justify-between p-3 rounded-well bg-bg-elevated border border-border-subtle">
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-accent" />
                    <span className="text-xs font-medium text-text-primary">Include cabin headers</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeHeaders}
                    onChange={(e) => setIncludeHeaders(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded cursor-pointer"
                  />
                </div>

                {/* Switch 2 */}
                <div className="flex items-center justify-between p-3 rounded-well bg-bg-elevated border border-border-subtle">
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-accent" />
                    <span className="text-xs font-medium text-text-primary">Include duty-free prices</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includePrices}
                    onChange={(e) => setIncludePrices(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded cursor-pointer"
                  />
                </div>

                {/* Switch 3 */}
                <div className="flex items-center justify-between p-3 rounded-well bg-bg-elevated border border-border-subtle">
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-accent" />
                    <span className="text-xs font-medium text-text-primary">Compact thermal mode</span>
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
            <div className="w-full max-w-sm mx-auto flex flex-col items-center animate-fade-in">
              <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
                Thermal Slip,
              </span>

              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
                Ready to print.
              </h2>

              {/* Thermal Slip Preview Box */}
              <div className="mt-4 p-3.5 bg-white text-black rounded-lg border border-gray-300 font-mono shadow-md flex flex-col justify-between w-full max-w-[240px] h-[135px] text-[10px] leading-tight select-none">
                <div>
                  <div className="text-center border-b border-black pb-1 mb-1 font-bold tracking-widest text-[11px]">
                    *** SQ {flightNo || '322'} ***
                  </div>
                  <div className="flex justify-between text-[8px] text-gray-700">
                    <span>SIN &rarr; LHR</span>
                    <span>BUSINESS</span>
                  </div>
                  <div className="text-[9px] mt-1 text-gray-800">
                    &bull; APP: Smoked Duck Breast<br />
                    &bull; MAIN: Seared Cod / Beef Cheek<br />
                    &bull; DSRT: Valrhona Chocolate Tart
                  </div>
                </div>

                <div className="text-center text-[8px] text-gray-500 border-t border-dotted border-gray-400 pt-0.5">
                  CREWKIT INKFLIGHT SLIP
                </div>
              </div>

              {/* Export feedback toast */}
              {exportMessage && (
                <div className="flex items-center justify-center gap-1.5 mt-2 py-1 px-3 rounded-full bg-success/15 border border-success/30 text-success text-[11px] font-medium animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{exportMessage}</span>
                </div>
              )}

              {/* Export Pills */}
              <div className="grid grid-cols-3 gap-2 w-full mt-3">
                <button
                  onClick={() => handleExport('PNG Image')}
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-well bg-bg-elevated border border-border-subtle hover:border-accent hover:text-accent active:scale-95 transition-all text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5 text-accent" />
                  <span>PNG</span>
                </button>
                <button
                  onClick={() => handleExport('DOCX File')}
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-well bg-bg-elevated border border-border-subtle hover:border-accent hover:text-accent active:scale-95 transition-all text-xs font-medium"
                >
                  <FileDown className="w-3.5 h-3.5 text-accent" />
                  <span>DOCX</span>
                </button>
                <button
                  onClick={() => handleExport('PDF Slip')}
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-well bg-bg-elevated border border-border-subtle hover:border-accent hover:text-accent active:scale-95 transition-all text-xs font-medium"
                >
                  <Printer className="w-3.5 h-3.5 text-accent" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Generous empty bottom spacer */}
        <div className="flex-1 max-h-16 sm:max-h-24" />

        {/* Centered Primary Pill CTA */}
        <div className="shrink-0 flex flex-col items-center gap-2 pb-2">
          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="editorial-cta-btn flex items-center justify-center gap-2 rounded-full px-8 py-3.5 min-w-[200px] text-sm font-semibold tracking-wide"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 text-[#0B1E3E]" strokeWidth={2.2} />
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(1)}
              className="editorial-cta-btn flex items-center justify-center gap-2 rounded-full px-8 py-3.5 min-w-[200px] text-sm font-semibold tracking-wide"
            >
              <Sparkles className="w-4 h-4 text-[#0B1E3E]" strokeWidth={2.2} />
              <span>Format Another</span>
            </button>
          )}

          {currentStep > 1 && (
            <button
              onClick={handlePrev}
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors py-1 px-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Step</span>
            </button>
          )}
        </div>

      </div>
    </Layout>
  );
};
