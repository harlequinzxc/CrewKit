import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { WizardStepper, StepItem } from '../components/WizardStepper';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  DollarSign,
  MapPin,
  Sparkles
} from 'lucide-react';

const STEPS: StepItem[] = [
  { id: 1, label: 'Flight Input' },
  { id: 2, label: 'Sector Overview' },
  { id: 3, label: 'Breakdown' },
];

export const CrewCash: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [flightNo, setFlightNo] = useState<string>('12');

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

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
          
          {/* STEP 1: Flight Input */}
          {currentStep === 1 && (
            <div className="w-full max-w-sm mx-auto flex flex-col items-center animate-fade-in">
              <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
                Flight Roster,
              </span>

              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
                Calculate your allowance.
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
                      placeholder="1 2"
                      className="w-full h-14 px-4 rounded-well bg-bg-elevated border border-border-subtle text-text-primary placeholder:text-text-tertiary text-lg tracking-[0.15em] font-medium focus:outline-none focus:border-accent/80 focus:ring-1 focus:ring-accent/50 transition-all"
                    />
                  </div>
                </div>

                {/* Route Chain Whisper Node */}
                <div className="mt-4 p-3 rounded-well bg-bg-elevated/70 border border-border-subtle flex items-center justify-between text-xs">
                  <span className="font-semibold text-accent">SIN</span>
                  <ArrowRight className="w-3 h-3 text-text-tertiary" />
                  <span className="text-text-primary">NRT</span>
                  <ArrowRight className="w-3 h-3 text-text-tertiary" />
                  <span className="text-text-primary">LAX</span>
                  <ArrowRight className="w-3 h-3 text-text-tertiary" />
                  <span className="text-text-primary">NRT</span>
                  <ArrowRight className="w-3 h-3 text-text-tertiary" />
                  <span className="font-semibold text-accent">SIN</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Sector Overview */}
          {currentStep === 2 && (
            <div className="w-full max-w-sm mx-auto flex flex-col items-center animate-fade-in">
              <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
                Duty Sectors,
              </span>

              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
                Here is your journey.
              </h2>

              {/* Sector Cards Stack (Clean without heavy borders) */}
              <div className="w-full mt-5 space-y-2 text-left">
                {[
                  { route: 'SIN → NRT', time: '6h 45m', loc: 'Tokyo (24h layover)', rate: '$140' },
                  { route: 'NRT → LAX', time: '9h 55m', loc: 'Los Angeles (48h layover)', rate: '$180' },
                  { route: 'LAX → NRT', time: '11h 20m', loc: 'Tokyo (24h layover)', rate: '$140' },
                  { route: 'NRT → SIN', time: '7h 15m', loc: 'Singapore Base', rate: 'Base' },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-well bg-bg-elevated border border-border-subtle flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-accent/15 text-accent text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-xs font-semibold text-text-primary">{s.route}</span>
                        <span className="text-[10px] text-text-secondary ml-2">{s.time}</span>
                        <span className="text-[10px] text-text-tertiary block flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" /> {s.loc}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-accent font-medium">{s.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Allowance Breakdown */}
          {currentStep === 3 && (
            <div className="w-full max-w-sm mx-auto flex flex-col items-center animate-fade-in">
              <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
                Summary,
              </span>

              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
                Your estimated payout.
              </h2>

              <div className="w-full mt-5 space-y-2.5 text-left">
                <div className="p-3 rounded-well bg-bg-elevated border border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="text-xs font-medium text-text-primary">Inflight Hourly Allowance</span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-text-primary">$0.00</span>
                </div>

                <div className="p-3 rounded-well bg-bg-elevated border border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="w-4 h-4 text-accent" />
                    <span className="text-xs font-medium text-text-primary">Station Meal Per Diem</span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-text-primary">$0.00</span>
                </div>

                <div className="p-3.5 rounded-well bg-gradient-to-r from-bg-elevated to-bg-surface border border-accent/40 flex items-center justify-between shadow-[0_0_20px_rgba(201,168,76,0.15)]">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-accent block">
                      Total Estimated
                    </span>
                    <span className="text-[11px] text-text-secondary">All sectors combined</span>
                  </div>
                  <span className="font-mono text-2xl font-bold text-accent">$0.00</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Generous empty bottom spacer */}
        <div className="flex-1 max-h-16 sm:max-h-24" />

        {/* Centered Primary Pill CTA */}
        <div className="shrink-0 flex flex-col items-center gap-2 pb-2">
          {currentStep < 3 ? (
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
              <span>Recalculate</span>
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
