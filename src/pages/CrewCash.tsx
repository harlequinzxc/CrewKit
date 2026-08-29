import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { WizardStepper, StepItem } from '../components/WizardStepper';
import {
  Calendar,
  Plane,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  MapPin,
  Sparkles,
  Info
} from 'lucide-react';

const STEPS: StepItem[] = [
  { id: 1, label: 'Flight Input' },
  { id: 2, label: 'Sector Overview' },
  { id: 3, label: 'Breakdown' },
];

export const CrewCash: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [flightNo, setFlightNo] = useState<string>('12');
  const [flightDate, setFlightDate] = useState<string>('2026-09-01');

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <Layout
      title="CrewCash"
      subtitle="Allowance Calculator"
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

        {/* Wizard Content Cards (Single Viewport container) */}
        <div className="flex-1 flex flex-col justify-center min-h-0 my-auto">
          
          {/* STEP 1: Flight Input */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-3 max-w-sm sm:max-w-md mx-auto w-full animate-fade-in">
              <div className="text-center">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
                  Step 1 &bull; Route Details
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-text-primary mt-0.5">
                  Enter your flight details
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  Type your flight number to calculate inflight and location allowances.
                </p>
              </div>

              {/* Input Form Fields */}
              <div className="p-4 rounded-card bg-bg-surface border border-border-subtle flex flex-col gap-3 shadow-sm">
                
                {/* Flight Number Input with SQ Badge */}
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
                        placeholder="e.g. 12 or 322"
                        className="w-full px-3.5 py-2.5 rounded-well bg-bg-elevated border border-border-subtle text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                      />
                      <Plane className="w-4 h-4 text-text-tertiary absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* Date Picker Input */}
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

                {/* Route Chain Visualization */}
                <div className="mt-1 pt-3 border-t border-border-subtle">
                  <div className="flex items-center justify-between text-[11px] text-text-secondary mb-2">
                    <span className="font-medium">Detected Route Chain:</span>
                    <span className="text-accent font-mono">4 Sectors</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-well bg-bg-elevated/70 border border-border-subtle/80 text-xs">
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
            </div>
          )}

          {/* STEP 2: Sector Overview */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-2.5 max-w-sm sm:max-w-md mx-auto w-full animate-fade-in">
              <div className="text-center">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
                  Step 2 &bull; Sector Itinerary
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-text-primary mt-0.5">
                  Sector Timeline
                </h2>
                <p className="text-xs text-text-secondary">
                  SQ{flightNo || '12'} multi-sector flight leg breakdowns.
                </p>
              </div>

              {/* Sector Cards Stack */}
              <div className="grid grid-cols-1 gap-2">
                {[
                  { sector: 'Sector 1', route: 'SIN → NRT', time: '6h 45m', loc: 'Tokyo (Layover 24h)', rate: '$140 / day' },
                  { sector: 'Sector 2', route: 'NRT → LAX', time: '9h 55m', loc: 'Los Angeles (Layover 48h)', rate: '$180 / day' },
                  { sector: 'Sector 3', route: 'LAX → NRT', time: '11h 20m', loc: 'Tokyo (Layover 24h)', rate: '$140 / day' },
                  { sector: 'Sector 4', route: 'NRT → SIN', time: '7h 15m', loc: 'Singapore (Base)', rate: 'Home' },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 sm:p-3 rounded-card bg-bg-surface border border-border-subtle flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-bg-elevated border border-border-subtle flex items-center justify-center text-xs font-bold text-accent">
                        {idx + 1}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs sm:text-sm text-text-primary">
                            {s.route}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-secondary border border-border-subtle">
                            {s.time}
                          </span>
                        </div>
                        <span className="text-[11px] text-text-secondary mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-text-tertiary" />
                          {s.loc}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono text-accent">
                        {s.rate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Allowance Breakdown */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-3 max-w-sm sm:max-w-md mx-auto w-full animate-fade-in">
              <div className="text-center">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
                  Step 3 &bull; Estimated Payout
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-text-primary mt-0.5">
                  Allowance Breakdown
                </h2>
                <p className="text-xs text-text-secondary">
                  Estimated calculation for SQ{flightNo || '12'} pattern.
                </p>
              </div>

              {/* Breakdown Cards */}
              <div className="flex flex-col gap-2.5">
                <div className="p-3 rounded-card bg-bg-surface border border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-accent">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-text-primary block">Inflight Allowance</span>
                      <span className="text-[10px] text-text-secondary">Flight duty hours rate</span>
                    </div>
                  </div>
                  <span className="font-mono text-base font-semibold text-text-primary">$0.00</span>
                </div>

                <div className="p-3 rounded-card bg-bg-surface border border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-accent">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-text-primary block">Meal Allowance</span>
                      <span className="text-[10px] text-text-secondary">Station layover per diems</span>
                    </div>
                  </div>
                  <span className="font-mono text-base font-semibold text-text-primary">$0.00</span>
                </div>

                {/* Total Pill Box */}
                <div className="p-4 rounded-card bg-gradient-to-r from-bg-surface to-bg-elevated border border-accent/30 flex items-center justify-between shadow-gold-glow/20">
                  <div>
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-accent block">
                      Total Estimated
                    </span>
                    <span className="text-xs text-text-secondary">All sectors + meal per diems</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-2xl font-bold text-accent">$0.00</span>
                    <span className="block text-[10px] text-text-tertiary">SGD Estimated</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated/60 border border-border-subtle text-[11px] text-text-secondary">
                <Info className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>Calculations will be activated in upcoming chunk logic.</span>
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

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full gold-gradient-btn text-xs font-semibold active:scale-95 transition-all ml-auto"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full gold-gradient-btn text-xs font-semibold active:scale-95 transition-all ml-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Recalculate</span>
            </button>
          )}
        </div>

      </div>
    </Layout>
  );
};
