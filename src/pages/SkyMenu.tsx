import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { WizardStepper, StepItem } from '../components/WizardStepper';
import {
  ArrowRight,
  ArrowLeft,
  Utensils,
  Wine,
  Sparkles
} from 'lucide-react';

const STEPS: StepItem[] = [
  { id: 1, label: 'Flight' },
  { id: 2, label: 'Menu' },
];

type CabinClass = 'first' | 'business' | 'premium' | 'economy';

export const SkyMenu: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [flightNo, setFlightNo] = useState<string>('322');
  const [selectedClass, setSelectedClass] = useState<CabinClass>('business');

  const cabinTabs: { id: CabinClass; label: string }[] = [
    { id: 'first', label: 'First' },
    { id: 'business', label: 'Business' },
    { id: 'premium', label: 'Prem Econ' },
    { id: 'economy', label: 'Economy' },
  ];

  return (
    <Layout>
      <div className="flex flex-col justify-between h-full py-1 animate-fade-in">
        
        {/* Whisper Stepper */}
        <div className="shrink-0 mt-0.5">
          <WizardStepper
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={(id) => setCurrentStep(id)}
          />
        </div>

        {/* Generous empty top spacer */}
        <div className="flex-1 max-h-16 sm:max-h-24" />

        {/* Editorial Hero & Form Group (Lower-Middle Viewport) */}
        <div className="w-full my-auto flex flex-col items-center text-center">
          
          {/* STEP 1: Flight Selection */}
          {currentStep === 1 && (
            <div className="w-full max-w-sm mx-auto flex flex-col items-center animate-fade-in">
              <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
                Dining Service,
              </span>

              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
                Which flight are you serving?
              </h2>

              {/* Form Input Group (Directly on background, NO card) */}
              <div className="w-full mt-7 sm:mt-8 text-left">
                <label className="block text-[0.7rem] font-medium tracking-[0.2em] uppercase text-text-secondary mb-2.5">
                  Flight Number
                </label>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-well bg-bg-elevated border border-border-subtle flex items-center justify-center text-accent font-semibold text-base tracking-wider shadow-sm shrink-0">
                    SQ
                  </div>

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

                <div className="mt-4 p-3 rounded-well bg-bg-elevated/70 border border-border-subtle flex items-center justify-between text-xs">
                  <span className="text-text-secondary">Detected Route:</span>
                  <span className="font-semibold text-accent font-mono">SIN &rarr; LHR (London Heathrow)</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Menu Display */}
          {currentStep === 2 && (
            <div className="w-full max-w-sm mx-auto flex flex-col items-center animate-fade-in">
              <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
                Inflight Dining,
              </span>

              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
                Explore the dining course.
              </h2>

              {/* Cabin Class Segmented Pill */}
              <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-bg-elevated border border-border-subtle w-full mt-5">
                {cabinTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedClass(tab.id)}
                    className={`py-1.5 text-xs font-medium rounded-full transition-all text-center ${
                      selectedClass === tab.id
                        ? 'bg-accent text-[#0B1E3E] font-semibold shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Course items directly on background */}
              <div className="w-full mt-3 space-y-2 text-left">
                <div className="p-3 rounded-well bg-bg-elevated border border-border-subtle flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-accent text-[10px] font-bold shrink-0 mt-0.5">
                    <Utensils className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-text-primary block">Appetiser &amp; Starter</span>
                    <span className="text-[11px] text-text-secondary italic">Smoked Duck Breast with Spiced Fig Compote</span>
                  </div>
                </div>

                <div className="p-3 rounded-well bg-bg-elevated border border-border-subtle flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-accent text-[10px] font-bold shrink-0 mt-0.5">
                    <Utensils className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-text-primary block">Main Courses</span>
                    <span className="text-[11px] text-text-secondary italic">Seared Chilean Seabass or Slow-Braised Beef Cheek</span>
                  </div>
                </div>

                <div className="p-2 px-3 rounded-well bg-bg-elevated/50 border border-border-subtle flex items-center justify-between text-[10px] text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <Wine className="w-3 h-3 text-accent" /> Premium Champagne &amp; Burgundy List
                  </span>
                  <span>TWG Selection</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Generous empty bottom spacer */}
        <div className="flex-1 max-h-16 sm:max-h-24" />

        {/* Centered Primary Pill CTA */}
        <div className="shrink-0 flex flex-col items-center gap-2 pb-2">
          {currentStep === 1 ? (
            <button
              onClick={() => setCurrentStep(2)}
              className="editorial-cta-btn flex items-center justify-center gap-2 rounded-full px-8 py-3.5 min-w-[200px] text-sm font-semibold tracking-wide"
            >
              <span>View Menu</span>
              <ArrowRight className="w-4 h-4 text-[#0B1E3E]" strokeWidth={2.2} />
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(1)}
              className="editorial-cta-btn flex items-center justify-center gap-2 rounded-full px-8 py-3.5 min-w-[200px] text-sm font-semibold tracking-wide"
            >
              <Sparkles className="w-4 h-4 text-[#0B1E3E]" strokeWidth={2.2} />
              <span>Search Another</span>
            </button>
          )}

          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(1)}
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
