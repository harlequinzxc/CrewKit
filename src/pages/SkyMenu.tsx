import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { WizardStepper, StepItem } from '../components/WizardStepper';
import {
  Calendar,
  Plane,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Sparkles,
  Search,
  Coffee,
  Wine
} from 'lucide-react';

const STEPS: StepItem[] = [
  { id: 1, label: 'Flight Selection' },
  { id: 2, label: 'Menu Display' },
];

type CabinClass = 'first' | 'business' | 'premium' | 'economy';

export const SkyMenu: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [flightNo, setFlightNo] = useState<string>('322');
  const [flightDate, setFlightDate] = useState<string>('2026-09-02');
  const [selectedClass, setSelectedClass] = useState<CabinClass>('business');

  const cabinTabs: { id: CabinClass; label: string }[] = [
    { id: 'first', label: 'First' },
    { id: 'business', label: 'Business' },
    { id: 'premium', label: 'Prem Econ' },
    { id: 'economy', label: 'Economy' },
  ];

  return (
    <Layout
      title="SkyMenu"
      subtitle="Inflight Menu Viewer"
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

        {/* Wizard Content Cards */}
        <div className="flex-1 flex flex-col justify-center min-h-0 my-auto">
          
          {/* STEP 1: Flight Selection */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-3 max-w-sm sm:max-w-md mx-auto w-full animate-fade-in">
              <div className="text-center">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
                  Step 1 &bull; Select Flight
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-text-primary mt-0.5">
                  Fetch Inflight Menu
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  Look up meal service menus for any Singapore Airlines scheduled sector.
                </p>
              </div>

              {/* Input Card */}
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
                        placeholder="e.g. 322 or 26"
                        className="w-full px-3.5 py-2.5 rounded-well bg-bg-elevated border border-border-subtle text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                      />
                      <Plane className="w-4 h-4 text-text-tertiary absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-widest text-text-secondary mb-1.5">
                    Flight Date
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

                <div className="mt-1 p-2.5 rounded-well bg-bg-elevated/70 border border-border-subtle/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Search className="w-3.5 h-3.5 text-accent" />
                    <span>Sector route preview:</span>
                  </div>
                  <span className="font-semibold text-accent font-mono">SIN → LHR</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Menu Display */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-2.5 max-w-sm sm:max-w-md mx-auto w-full animate-fade-in">
              <div className="text-center">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
                  Step 2 &bull; SQ{flightNo || '322'} Menu
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-text-primary mt-0.5">
                  Menu Display
                </h2>
                <p className="text-xs text-text-secondary">
                  Browse inflight catering courses by cabin class.
                </p>
              </div>

              {/* Cabin Class Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-bg-elevated border border-border-subtle">
                {cabinTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedClass(tab.id)}
                    className={`py-1.5 text-xs font-medium rounded-full transition-all text-center ${
                      selectedClass === tab.id
                        ? 'bg-accent text-[#070B14] font-semibold shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Menu Content Placeholder Card */}
              <div className="p-3.5 rounded-card bg-bg-surface border border-border-subtle flex flex-col gap-2 shadow-sm min-h-[160px] justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-border-subtle pb-1.5 mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5" />
                      {cabinTabs.find((t) => t.id === selectedClass)?.label} Class Service
                    </span>
                    <span className="text-[10px] text-text-secondary">Supper &bull; Breakfast</span>
                  </div>

                  {/* Mock Menu Courses */}
                  <div className="space-y-2">
                    <div className="p-2 rounded-well bg-bg-elevated/70 border border-border-subtle/60 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-accent text-[10px] font-bold shrink-0 mt-0.5">
                        A
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-medium text-text-primary block">Appetiser / Starter</span>
                        <span className="text-[11px] text-text-secondary italic">Menu content will load automatically from SIA API</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-well bg-bg-elevated/70 border border-border-subtle/60 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-accent text-[10px] font-bold shrink-0 mt-0.5">
                        M
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-medium text-text-primary block">Main Courses</span>
                        <span className="text-[11px] text-text-secondary italic">Selection of Western &amp; Asian culinary specialties</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-text-tertiary pt-1 border-t border-border-subtle/50">
                  <span className="flex items-center gap-1">
                    <Wine className="w-3 h-3 text-accent" /> Sommelier Wine List Included
                  </span>
                  <span className="flex items-center gap-1">
                    <Coffee className="w-3 h-3 text-accent" /> Illy Coffee &amp; TWG Tea
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Wizard Footer Navigation Buttons */}
        <div className="shrink-0 flex items-center justify-between gap-3 pt-2">
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-border-medium text-text-primary hover:bg-bg-surface text-xs font-medium active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 2 ? (
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full gold-gradient-btn text-xs font-semibold active:scale-95 transition-all ml-auto"
            >
              <span>View Menu</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full gold-gradient-btn text-xs font-semibold active:scale-95 transition-all ml-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>New Search</span>
            </button>
          )}
        </div>

      </div>
    </Layout>
  );
};
