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
import { FlightSchedule, Sector } from '../lib/sq/types';
import { ArrowRight, Plane, Wallet, RotateCcw, Clock, MapPin } from 'lucide-react';

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

/**
 * Calculate layover duration between arrival in station and departure from station
 */
function calculateStationLayover(
  arrDate: string,
  arrTime: string,
  depDate: string,
  depTime: string
): string | null {
  try {
    const arrIso = `${arrDate}T${arrTime}:00`;
    const depIso = `${depDate}T${depTime}:00`;
    const arrMs = new Date(arrIso).getTime();
    const depMs = new Date(depIso).getTime();
    if (!isNaN(arrMs) && !isNaN(depMs) && depMs > arrMs) {
      const diffMinutes = Math.round((depMs - arrMs) / 60000);
      const h = Math.floor(diffMinutes / 60);
      const m = diffMinutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
  } catch {
    // ignore
  }
  return null;
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

  // Station calculations
  const outboundLastSector: Sector | undefined =
    outboundSchedule && outboundSchedule.sectors.length > 0
      ? outboundSchedule.sectors[outboundSchedule.sectors.length - 1]
      : undefined;

  const inboundFirstSector: Sector | undefined =
    inboundSchedule && inboundSchedule.sectors.length > 0
      ? inboundSchedule.sectors[0]
      : undefined;

  // Total Flight Minutes across all sectors
  const totalOutboundMinutes =
    outboundSchedule?.sectors.reduce((acc, s) => acc + (s.blockMinutes || 0), 0) || 0;
  const totalInboundMinutes =
    inboundSchedule?.sectors.reduce((acc, s) => acc + (s.blockMinutes || 0), 0) || 0;
  const grandTotalFlightMinutes = totalOutboundMinutes + totalInboundMinutes;

  // Station Layover duration
  const stationLayover =
    outboundLastSector &&
    inboundFirstSector &&
    outboundLastSector.arrDateLocal &&
    inboundFirstSector.depDateLocal
      ? calculateStationLayover(
          outboundLastSector.arrDateLocal,
          outboundLastSector.arrLocal,
          inboundFirstSector.depDateLocal,
          inboundFirstSector.depLocal
        )
      : null;

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

            {/* Flight Number Input */}
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

            {/* Departure Block */}
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

          {/* Progression CTA */}
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

      {/* 4. RESULT SCREEN — SECTOR & STATION TIMINGS */}
      {stage === 'result' && outboundSchedule && inboundSchedule && (
        <div className="flex flex-col h-full overflow-hidden py-1 animate-fade-in">
          
          {/* Top Flight Chip */}
          <div className="shrink-0 text-center pt-1 pb-2 border-b border-border-subtle/50">
            <FlightChip label={flightChipSummary} />
          </div>

          {/* Scrollable Sector Cards Container */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3 px-1">
            
            {/* Station Layover & Rest Card */}
            {outboundLastSector && inboundFirstSector && (
              <div className="p-3.5 rounded-card bg-bg-surface border border-accent/40 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
                  <div className="flex items-center gap-1.5 text-accent text-xs font-semibold uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Station Layover · {outboundLastSector.toCity || outboundLastSector.to}</span>
                  </div>
                  {stationLayover && (
                    <span className="text-[11px] font-mono text-text-primary px-2 py-0.5 rounded bg-accent/15 border border-accent/30 font-semibold">
                      {stationLayover} Rest
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  {/* Arrival in Station */}
                  <div className="p-2 rounded bg-bg-elevated/70 border border-border-subtle/40">
                    <span className="text-[10px] text-text-secondary uppercase font-medium block">
                      Arrival in Station ({outboundLastSector.to})
                    </span>
                    <span className="text-base font-serif font-bold text-text-primary block mt-0.5">
                      {outboundLastSector.arrLocal}
                    </span>
                    <span className="text-[10px] font-mono text-text-tertiary block">
                      {outboundLastSector.arrDateLocal ? formatDateDisplay(outboundLastSector.arrDateLocal) : ''}
                    </span>
                  </div>

                  {/* Departure from Station */}
                  <div className="p-2 rounded bg-bg-elevated/70 border border-border-subtle/40">
                    <span className="text-[10px] text-text-secondary uppercase font-medium block">
                      Departure from Station ({inboundFirstSector.from})
                    </span>
                    <span className="text-base font-serif font-bold text-text-primary block mt-0.5">
                      {inboundFirstSector.depLocal}
                    </span>
                    <span className="text-[10px] font-mono text-text-tertiary block">
                      {inboundFirstSector.depDateLocal ? formatDateDisplay(inboundFirstSector.depDateLocal) : ''}
                    </span>
                  </div>
                </div>

                {/* Total Flight Time Pill */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-text-secondary flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-accent" />
                    <span>Total Trip Flight Time</span>
                  </span>
                  <span className="font-serif italic text-accent font-semibold text-xs">
                    {formatBlockTime(grandTotalFlightMinutes)}
                  </span>
                </div>
              </div>
            )}

            {/* Outbound Journey Sectors Card */}
            <div className="p-4 rounded-card bg-bg-surface border border-border-subtle shadow-sm">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle/60 text-xs">
                <span className="font-semibold text-accent tracking-wider uppercase text-[10px]">
                  Outbound &bull; {outboundSchedule.flightNo}
                </span>
                <span className="font-mono text-text-secondary text-[11px]">
                  {outboundSchedule.aircraftType}
                </span>
              </div>

              {outboundSchedule.sectors.map((sec, idx) => (
                <div key={idx} className={idx > 0 ? 'mt-3 pt-3 border-t border-border-subtle/40' : ''}>
                  <div className="flex items-center justify-between">
                    {/* Origin */}
                    <div className="text-left">
                      <span className="text-[10px] text-text-secondary block font-medium">
                        {sec.fromCity || sec.from}
                      </span>
                      <span className="font-serif text-xl sm:text-2xl font-semibold text-text-primary">
                        {sec.from}
                      </span>
                      <span className="text-xs font-mono text-text-primary block mt-0.5 font-semibold">
                        {sec.depLocal}
                      </span>
                      {sec.depDateLocal && (
                        <span className="text-[9px] font-mono text-text-tertiary block">
                          {formatDateDisplay(sec.depDateLocal)}
                        </span>
                      )}
                    </div>

                    {/* Flight Time Duration */}
                    <div className="flex flex-col items-center px-2">
                      <Plane className="w-4 h-4 text-accent rotate-90 my-1" strokeWidth={1.8} />
                      <span className="font-serif italic text-accent text-xs font-medium">
                        {formatBlockTime(sec.blockMinutes)}
                      </span>
                      <span className="text-[9px] text-text-tertiary font-mono">Flight Time</span>
                    </div>

                    {/* Destination / Station Arrival */}
                    <div className="text-right">
                      <span className="text-[10px] text-text-secondary block font-medium">
                        {sec.toCity || sec.to}
                      </span>
                      <span className="font-serif text-xl sm:text-2xl font-semibold text-text-primary">
                        {sec.to}
                      </span>
                      <span className="text-xs font-mono text-text-primary block mt-0.5 font-semibold">
                        {sec.arrLocal}
                      </span>
                      {sec.arrDateLocal && (
                        <span className="text-[9px] font-mono text-text-tertiary block">
                          {formatDateDisplay(sec.arrDateLocal)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Inbound Journey Sectors Card */}
            <div className="p-4 rounded-card bg-bg-surface border border-border-subtle shadow-sm">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle/60 text-xs">
                <span className="font-semibold text-accent tracking-wider uppercase text-[10px]">
                  Inbound &bull; {inboundSchedule.flightNo}
                </span>
                <span className="font-mono text-text-secondary text-[11px]">
                  {inboundSchedule.aircraftType}
                </span>
              </div>

              {inboundSchedule.sectors.map((sec, idx) => (
                <div key={idx} className={idx > 0 ? 'mt-3 pt-3 border-t border-border-subtle/40' : ''}>
                  <div className="flex items-center justify-between">
                    {/* Origin / Station Departure */}
                    <div className="text-left">
                      <span className="text-[10px] text-text-secondary block font-medium">
                        {sec.fromCity || sec.from}
                      </span>
                      <span className="font-serif text-xl sm:text-2xl font-semibold text-text-primary">
                        {sec.from}
                      </span>
                      <span className="text-xs font-mono text-text-primary block mt-0.5 font-semibold">
                        {sec.depLocal}
                      </span>
                      {sec.depDateLocal && (
                        <span className="text-[9px] font-mono text-text-tertiary block">
                          {formatDateDisplay(sec.depDateLocal)}
                        </span>
                      )}
                    </div>

                    {/* Flight Time Duration */}
                    <div className="flex flex-col items-center px-2">
                      <Plane className="w-4 h-4 text-accent rotate-90 my-1" strokeWidth={1.8} />
                      <span className="font-serif italic text-accent text-xs font-medium">
                        {formatBlockTime(sec.blockMinutes)}
                      </span>
                      <span className="text-[9px] text-text-tertiary font-mono">Flight Time</span>
                    </div>

                    {/* Destination */}
                    <div className="text-right">
                      <span className="text-[10px] text-text-secondary block font-medium">
                        {sec.toCity || sec.to}
                      </span>
                      <span className="font-serif text-xl sm:text-2xl font-semibold text-text-primary">
                        {sec.to}
                      </span>
                      <span className="text-xs font-mono text-text-primary block mt-0.5 font-semibold">
                        {sec.arrLocal}
                      </span>
                      {sec.arrDateLocal && (
                        <span className="text-[9px] font-mono text-text-tertiary block">
                          {formatDateDisplay(sec.arrDateLocal)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Bottom Action Footer */}
          <div className="shrink-0 flex items-center justify-between gap-3 pt-2 pb-1 border-t border-border-subtle/50">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-full border border-border-subtle hover:border-border-hover text-xs font-medium text-text-secondary hover:text-text-primary transition-all active:scale-95"
            >
              Back to Home
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="editorial-cta-btn flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide"
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
