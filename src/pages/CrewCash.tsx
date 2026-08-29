import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { FlightNumberInput } from '../components/FlightNumberInput';
import { DepartureBlock, getTodayISO, formatDateDisplay } from '../components/DepartureBlock';
import { RevealCTA } from '../components/RevealCTA';
import { FlightChip } from '../components/FlightChip';
import { FetchInterlude, InterludeMessage } from '../components/FetchInterlude';
import { useFlightValidation } from '../hooks/useFlightValidation';
import { getFlightSchedule } from '../lib/sq/endpoints';
import { FlightSchedule } from '../lib/sq/types';
import { ArrowRight, Plane, Wallet, RotateCcw } from 'lucide-react';

const CREWCASH_MESSAGES: InterludeMessage[] = [
  { text: 'Checking flight time with Tech Crew…', durationMs: 2000 },
  { text: 'Checking arrival time with Tech Crew…', durationMs: 2000 },
  { text: 'Checking departure time…', durationMs: 2000 },
  { text: 'Almost ready…', durationMs: 2000 },
];

function formatBlockTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export const CrewCash: React.FC = () => {
  const navigate = useNavigate();
  const initialTodayISO = getTodayISO();
  const initialTodayDisplay = formatDateDisplay(initialTodayISO);

  // Wizard States: 'outbound' -> 'inbound' -> 'loading' -> 'result'
  const [stage, setStage] = useState<'outbound' | 'inbound' | 'loading' | 'result'>('outbound');

  // Step 1: Outbound — initialized empty
  const outboundValidation = useFlightValidation('');
  const [outboundDateISO, setOutboundDateISO] = useState<string>(initialTodayISO);
  const [outboundDateDisplay, setOutboundDateDisplay] = useState<string>(initialTodayDisplay);

  // Step 2: Inbound — initialized empty
  const inboundValidation = useFlightValidation('');
  const [inboundDateISO, setInboundDateISO] = useState<string>(initialTodayISO);
  const [inboundDateDisplay, setInboundDateDisplay] = useState<string>(initialTodayDisplay);

  // Results
  const [outboundSchedule, setOutboundSchedule] = useState<FlightSchedule | null>(null);
  const [inboundSchedule, setInboundSchedule] = useState<FlightSchedule | null>(null);

  // Handle Step 1 -> Step 2
  const handleProceedToInbound = () => {
    const num = parseInt(outboundValidation.flightNo, 10);
    if (!isNaN(num) && (!inboundValidation.flightNo || inboundValidation.flightNo === '')) {
      const returnNum = num % 2 === 0 ? (num - 1).toString() : (num + 1).toString();
      inboundValidation.setFlightNo(returnNum);
    }
    setStage('inbound');
  };

  // Trigger Full-Screen Fetch Interlude
  const handleStartCalculation = () => {
    setStage('loading');
  };

  const executeSchedulesFetch = async () => {
    const [outSched, inSched] = await Promise.all([
      getFlightSchedule(outboundValidation.flightNo, outboundDateISO),
      getFlightSchedule(inboundValidation.flightNo, inboundDateISO),
    ]);
    return { outSched, inSched };
  };

  const handleFetchSuccess = (data: { outSched: FlightSchedule; inSched: FlightSchedule }) => {
    setOutboundSchedule(data.outSched);
    setInboundSchedule(data.inSched);
    setStage('result');
  };

  const handleReset = () => {
    outboundValidation.setFlightNo('');
    inboundValidation.setFlightNo('');
    setStage('outbound');
  };

  const flightChipSummary = `SQ${outboundValidation.cleanFlightNo} → SQ${inboundValidation.cleanFlightNo} · ${outboundDateDisplay} → ${inboundDateDisplay}`;

  return (
    <Layout>
      {/* 1. LOADING INTERLUDE (8s Minimum Duration) */}
      {stage === 'loading' && (
        <FetchInterlude
          flightChipText={flightChipSummary}
          messages={CREWCASH_MESSAGES}
          fetchTask={executeSchedulesFetch}
          onSuccess={handleFetchSuccess}
        />
      )}

      {/* 2. STEP 1: OUTBOUND FORM */}
      {stage === 'outbound' && (
        <div className="flex flex-col justify-between h-full py-1 animate-fade-in">
          <div className="flex-1 max-h-12 sm:max-h-16" />

          {/* Editorial Hero Block */}
          <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center my-auto">
            <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
              Departing,
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
              Singapore to station.
            </h2>

            {/* Pattern A: Flight Number Input */}
            <div className="w-full mt-7 text-left">
              <FlightNumberInput
                value={outboundValidation.flightNo}
                onChange={outboundValidation.setFlightNo}
                isValid={outboundValidation.isValid}
                isChecking={outboundValidation.isChecking}
                error={outboundValidation.error}
                placeholder="3 2 2"
              />
            </div>

            {/* Pattern B: Departure Block */}
            {outboundValidation.isValid && outboundValidation.flightNo.length > 0 && (
              <div className="w-full mt-5 text-left">
                <DepartureBlock
                  selectedDateISO={outboundDateISO}
                  onDateSelect={(iso, display) => {
                    setOutboundDateISO(iso);
                    setOutboundDateDisplay(display);
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex-1 max-h-12 sm:max-h-16" />

          {/* Pattern C: Progression CTA */}
          {outboundValidation.isValid && outboundValidation.flightNo.length > 0 && outboundDateISO && (
            <div className="shrink-0 pb-2">
              <RevealCTA
                label="Proceed"
                icon={ArrowRight}
                summary={`SQ${outboundValidation.cleanFlightNo} · ${outboundDateDisplay}`}
                onPress={handleProceedToInbound}
              />
            </div>
          )}
        </div>
      )}

      {/* 3. STEP 2: INBOUND FORM */}
      {stage === 'inbound' && (
        <div className="flex flex-col justify-between h-full py-1 animate-fade-in">
          {/* Top Outbound Summary Chip (Tappable to edit) */}
          <div className="shrink-0 text-center pt-1">
            <FlightChip
              label={`Outbound · SQ${outboundValidation.cleanFlightNo} · ${outboundDateDisplay}`}
              onClick={() => setStage('outbound')}
            />
          </div>

          <div className="flex-1 max-h-8 sm:max-h-12" />

          {/* Editorial Hero Block */}
          <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center my-auto">
            <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
              Returning,
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
              Station back to Singapore.
            </h2>

            {/* Inbound Flight Number Input */}
            <div className="w-full mt-6 text-left">
              <FlightNumberInput
                value={inboundValidation.flightNo}
                onChange={inboundValidation.setFlightNo}
                isValid={inboundValidation.isValid}
                isChecking={inboundValidation.isChecking}
                error={inboundValidation.error}
                placeholder="3 2 1"
              />
            </div>

            {/* Inbound Departure Block */}
            {inboundValidation.isValid && inboundValidation.flightNo.length > 0 && (
              <div className="w-full mt-5 text-left">
                <DepartureBlock
                  selectedDateISO={inboundDateISO}
                  onDateSelect={(iso, display) => {
                    setInboundDateISO(iso);
                    setInboundDateDisplay(display);
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex-1 max-h-8 sm:max-h-12" />

          {/* Calculate CTA */}
          {inboundValidation.isValid && inboundValidation.flightNo.length > 0 && inboundDateISO && (
            <div className="shrink-0 pb-2">
              <RevealCTA
                label="Calculate"
                icon={<Wallet className="w-4 h-4 text-[#0B1E3E]" />}
                summary={`SQ${inboundValidation.cleanFlightNo} · ${inboundDateDisplay}`}
                onPress={handleStartCalculation}
              />
            </div>
          )}
        </div>
      )}

      {/* 4. RESULT SCREEN (Single Viewport) */}
      {stage === 'result' && outboundSchedule && inboundSchedule && (
        <div className="flex flex-col justify-between h-full py-2 animate-fade-in">
          {/* Flight Chip at top */}
          <div className="shrink-0 text-center pt-1">
            <FlightChip label={flightChipSummary} />
          </div>

          {/* Sector Cards Stack */}
          <div className="my-auto w-full max-w-md mx-auto space-y-3 px-1">
            
            {/* Outbound Journey Card */}
            <div className="p-4 rounded-card bg-bg-surface border border-border-subtle shadow-sm">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle/60 text-xs">
                <span className="font-semibold text-accent tracking-wider uppercase text-[10px]">
                  Outbound Flight
                </span>
                <span className="font-mono text-text-secondary text-[11px]">
                  {outboundSchedule.flightNo} &bull; {outboundSchedule.aircraftType}
                </span>
              </div>

              {outboundSchedule.sectors.map((sec, idx) => (
                <div key={idx} className={idx > 0 ? 'mt-3 pt-3 border-t border-border-subtle/40' : ''}>
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-xs text-text-secondary block">{sec.fromCity || sec.from}</span>
                      <span className="font-serif text-xl sm:text-2xl font-semibold text-text-primary">
                        {sec.from}
                      </span>
                      <span className="text-xs font-mono text-text-primary block mt-0.5">
                        {sec.depLocal}
                      </span>
                    </div>

                    <div className="flex flex-col items-center px-3">
                      <Plane className="w-4 h-4 text-accent rotate-90 my-1" strokeWidth={1.8} />
                      <span className="font-serif italic text-accent text-xs">
                        {formatBlockTime(sec.blockMinutes)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-text-secondary block">{sec.toCity || sec.to}</span>
                      <span className="font-serif text-xl sm:text-2xl font-semibold text-text-primary">
                        {sec.to}
                      </span>
                      <span className="text-xs font-mono text-text-primary block mt-0.5">
                        {sec.arrLocal}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Inbound Journey Card */}
            <div className="p-4 rounded-card bg-bg-surface border border-border-subtle shadow-sm">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle/60 text-xs">
                <span className="font-semibold text-accent tracking-wider uppercase text-[10px]">
                  Inbound Flight
                </span>
                <span className="font-mono text-text-secondary text-[11px]">
                  {inboundSchedule.flightNo} &bull; {inboundSchedule.aircraftType}
                </span>
              </div>

              {inboundSchedule.sectors.map((sec, idx) => (
                <div key={idx} className={idx > 0 ? 'mt-3 pt-3 border-t border-border-subtle/40' : ''}>
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-xs text-text-secondary block">{sec.fromCity || sec.from}</span>
                      <span className="font-serif text-xl sm:text-2xl font-semibold text-text-primary">
                        {sec.from}
                      </span>
                      <span className="text-xs font-mono text-text-primary block mt-0.5">
                        {sec.depLocal}
                      </span>
                    </div>

                    <div className="flex flex-col items-center px-3">
                      <Plane className="w-4 h-4 text-accent rotate-90 my-1" strokeWidth={1.8} />
                      <span className="font-serif italic text-accent text-xs">
                        {formatBlockTime(sec.blockMinutes)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-text-secondary block">{sec.toCity || sec.to}</span>
                      <span className="font-serif text-xl sm:text-2xl font-semibold text-text-primary">
                        {sec.to}
                      </span>
                      <span className="text-xs font-mono text-text-primary block mt-0.5">
                        {sec.arrLocal}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Action Buttons Footer */}
          <div className="shrink-0 flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-3 rounded-full border border-border-subtle hover:border-border-hover text-xs font-medium text-text-secondary hover:text-text-primary transition-all active:scale-95"
            >
              Back to Home
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="editorial-cta-btn flex items-center gap-1.5 px-6 py-3 rounded-full text-xs font-semibold tracking-wide"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Calculation</span>
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};
