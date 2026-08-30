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
import { Sector } from '../lib/sq/types';
import {
  ArrowRight,
  Plane,
  Wallet,
  RotateCcw,
  Clock,
  MapPin,
  DollarSign,
} from 'lucide-react';

const CREWCASH_MESSAGES: InterludeMessage[] = [
  { text: 'Checking flight time with Tech Crew…', durationMs: 2000 },
  { text: 'Checking arrival time with Tech Crew…', durationMs: 2000 },
  { text: 'Checking departure time…', durationMs: 2000 },
  { text: 'Almost ready…', durationMs: 2000 },
];

function formatBlockTime(minutes: number): string {
  if (isNaN(minutes) || minutes < 0) return '0h 00m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m < 10 ? '0' : ''}${m}m` : `${h}h 00m`;
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
      return m > 0 ? `${h}h ${m < 10 ? '0' : ''}${m}m` : `${h}h 00m`;
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

  // Wizard Stages: 'sector1' -> 'sector2' -> 'sector3' -> 'sector4' -> 'loading' -> 'result'
  const [stage, setStage] = useState<'sector1' | 'sector2' | 'sector3' | 'sector4' | 'loading' | 'result'>('sector1');
  const [activeSectorCount, setActiveSectorCount] = useState<2 | 4>(4);

  // Sector 1: Flight Number & Departure Date
  const sector1Validation = useFlightValidation('');
  const [sector1DateISO, setSector1DateISO] = useState<string>(initialTodayISO);
  const [sector1DateDisplay, setSector1DateDisplay] = useState<string>(initialTodayDisplay);

  // Sector 2: Flight Number & Departure Date
  const sector2Validation = useFlightValidation('');
  const [sector2DateISO, setSector2DateISO] = useState<string>(initialTodayISO);
  const [sector2DateDisplay, setSector2DateDisplay] = useState<string>(initialTodayDisplay);

  // Sector 3: Flight Number & Departure Date
  const sector3Validation = useFlightValidation('');
  const [sector3DateISO, setSector3DateISO] = useState<string>(initialTodayISO);
  const [sector3DateDisplay, setSector3DateDisplay] = useState<string>(initialTodayDisplay);

  // Sector 4: Flight Number & Departure Date
  const sector4Validation = useFlightValidation('');
  const [sector4DateISO, setSector4DateISO] = useState<string>(initialTodayISO);
  const [sector4DateDisplay, setSector4DateDisplay] = useState<string>(initialTodayDisplay);

  // Results State
  const [allSectors, setAllSectors] = useState<Sector[]>([]);
  const [stationName, setStationName] = useState<string>('');
  const [stationCity, setStationCity] = useState<string>('');
  const [stationArrTime, setStationArrTime] = useState<string>('');
  const [stationArrDate, setStationArrDate] = useState<string>('');
  const [stationDepTime, setStationDepTime] = useState<string>('');
  const [stationDepDate, setStationDepDate] = useState<string>('');
  const [rankSelection, setRankSelection] = useState<'FS/EY' | 'LS/LSS' | 'CS/CSS' | 'IFS'>('FS/EY');

  // Auto-fill smart return flight numbers when proceeding
  const handleProceedToSector2 = () => {
    const num1 = parseInt(sector1Validation.flightNo, 10);
    if (!isNaN(num1) && (!sector2Validation.flightNo || sector2Validation.flightNo === '')) {
      const returnNum = num1 % 2 === 0 ? (num1 - 1).toString() : (num1 + 1).toString();
      sector2Validation.setFlightNo(returnNum);
    }
    setStage('sector2');
  };

  const handleProceedToSector3 = () => {
    setStage('sector3');
  };

  const handleProceedToSector4 = () => {
    const num3 = parseInt(sector3Validation.flightNo, 10);
    if (!isNaN(num3) && (!sector4Validation.flightNo || sector4Validation.flightNo === '')) {
      const returnNum = num3 % 2 === 0 ? (num3 - 1).toString() : (num3 + 1).toString();
      sector4Validation.setFlightNo(returnNum);
    }
    setStage('sector4');
  };

  // Trigger Calculation
  const handleStartCalculation = (sectorCount: 2 | 4) => {
    setActiveSectorCount(sectorCount);
    setStage('loading');
  };

  // Fetch Schedules & derive timings by pulling data from the flight numbers keyed in
  const executeSchedulesFetch = async () => {
    if (activeSectorCount === 2) {
      const [s1, s2] = await Promise.all([
        getFlightSchedule(sector1Validation.flightNo, sector1DateISO),
        getFlightSchedule(sector2Validation.flightNo, sector2DateISO),
      ]);
      return { schedules: [s1, s2], count: 2 };
    } else {
      const [s1, s2, s3, s4] = await Promise.all([
        getFlightSchedule(sector1Validation.flightNo, sector1DateISO),
        getFlightSchedule(sector2Validation.flightNo, sector2DateISO),
        getFlightSchedule(sector3Validation.flightNo, sector3DateISO),
        getFlightSchedule(sector4Validation.flightNo, sector4DateISO),
      ]);
      return { schedules: [s1, s2, s3, s4], count: 4 };
    }
  };

  const handleFetchSuccess = (data: { schedules: any[]; count: number }) => {
    const sectors: Sector[] = [];

    data.schedules.forEach((sch) => {
      if (sch && sch.sectors && sch.sectors.length > 0) {
        // Add all sectors from the schedule (handles single leg and multi-leg routes)
        sectors.push(...sch.sectors);
      }
    });

    setAllSectors(sectors);

    // Derive station arrival, departure, and layover
    if (sectors.length >= 2) {
      const midpoint = Math.floor(sectors.length / 2);
      const outboundStationSector = sectors[midpoint - 1];
      const inboundStationSector = sectors[midpoint];

      setStationName(outboundStationSector.to);
      setStationCity(outboundStationSector.toCity || outboundStationSector.to);
      setStationArrTime(outboundStationSector.arrLocal);
      setStationArrDate(outboundStationSector.arrDateLocal || sector1DateISO);
      setStationDepTime(inboundStationSector.depLocal);
      setStationDepDate(inboundStationSector.depDateLocal || (data.count === 4 ? sector3DateISO : sector2DateISO));
    }

    setStage('result');
  };

  const handleReset = () => {
    sector1Validation.setFlightNo('');
    sector2Validation.setFlightNo('');
    sector3Validation.setFlightNo('');
    sector4Validation.setFlightNo('');
    setAllSectors([]);
    setStage('sector1');
  };

  // Total Flight Minutes across all sectors
  const grandTotalFlightMinutes = allSectors.reduce((acc, s) => acc + (s.blockMinutes || 0), 0);
  const totalFlightHoursDecimal = grandTotalFlightMinutes / 60;

  // Station Layover duration
  const stationLayover =
    stationArrDate && stationArrTime && stationDepDate && stationDepTime
      ? calculateStationLayover(stationArrDate, stationArrTime, stationDepDate, stationDepTime)
      : null;

  // Allowance calculation based on crew rank hourly rates (SIA standard rates)
  const rankHourlyRates: Record<string, number> = {
    'FS/EY': 12.8,
    'LS/LSS': 16.5,
    'CS/CSS': 22.0,
    IFS: 28.5,
  };
  const hourlyRate = rankHourlyRates[rankSelection] || 12.8;
  const estimatedFlyingPay = Math.round(totalFlightHoursDecimal * hourlyRate);
  const estimatedMealAllowance = allSectors.length * 45; // ~S$45 per sector meal allowance
  const estimatedTotalEarnings = estimatedFlyingPay + estimatedMealAllowance;

  const flightChipSummary =
    activeSectorCount === 4 && sector3Validation.cleanFlightNo
      ? `SQ${sector1Validation.cleanFlightNo} · SQ${sector2Validation.cleanFlightNo} · SQ${sector3Validation.cleanFlightNo} · SQ${sector4Validation.cleanFlightNo}`
      : `SQ${sector1Validation.cleanFlightNo} → SQ${sector2Validation.cleanFlightNo} · ${sector1DateDisplay} → ${sector2DateDisplay}`;

  return (
    <Layout>
      {/* 1. LOADING INTERLUDE (8s Minimum Duration, 4 messages @ 2s each) */}
      {stage === 'loading' && (
        <FetchInterlude
          flightChipText={flightChipSummary}
          messages={CREWCASH_MESSAGES}
          fetchTask={executeSchedulesFetch}
          onSuccess={handleFetchSuccess}
        />
      )}

      {/* 2. STEP 1: SECTOR 1 */}
      {stage === 'sector1' && (
        <div className="flex flex-col justify-between h-full py-1 animate-fade-in">
          {/* Sector Step Indicator */}
          <div className="shrink-0 flex justify-center pt-1">
            <span className="text-[11px] font-mono tracking-widest uppercase text-accent font-semibold px-3 py-0.5 rounded-full bg-accent/10 border border-accent/20">
              Sector 1 of 4
            </span>
          </div>

          <div className="flex-1 max-h-8 sm:max-h-12" />

          {/* Editorial Hero Block */}
          <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center my-auto">
            <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
              Departing,
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
              First sector flight &amp; date.
            </h2>

            {/* Flight Number Input */}
            <div className="w-full mt-6 text-left">
              <FlightNumberInput
                value={sector1Validation.flightNo}
                onChange={sector1Validation.setFlightNo}
                isValid={sector1Validation.isValid}
                isChecking={sector1Validation.isChecking}
                error={sector1Validation.error}
                placeholder="1 3 4"
              />
            </div>

            {/* Departure Block */}
            {sector1Validation.isValid && sector1Validation.flightNo.length > 0 && (
              <div className="w-full mt-5 text-left">
                <DepartureBlock
                  selectedDateISO={sector1DateISO}
                  onDateSelect={(iso, display) => {
                    setSector1DateISO(iso);
                    setSector1DateDisplay(display);
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex-1 max-h-8 sm:max-h-12" />

          {/* Progression CTA */}
          {sector1Validation.isValid && sector1Validation.flightNo.length > 0 && sector1DateISO && (
            <div className="shrink-0 pb-2">
              <RevealCTA
                label="Proceed to Sector 2"
                icon={ArrowRight}
                summary={`SQ${sector1Validation.cleanFlightNo} · ${sector1DateDisplay}`}
                onPress={handleProceedToSector2}
              />
            </div>
          )}
        </div>
      )}

      {/* 3. STEP 2: SECTOR 2 */}
      {stage === 'sector2' && (
        <div className="flex flex-col justify-between h-full py-1 animate-fade-in">
          {/* Top Previous Sector Pill */}
          <div className="shrink-0 flex items-center justify-center gap-2 pt-1">
            <FlightChip
              label={`Sector 1: SQ${sector1Validation.cleanFlightNo} · ${sector1DateDisplay}`}
              onClick={() => setStage('sector1')}
            />
            <span className="text-[11px] font-mono tracking-widest uppercase text-accent font-semibold px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20">
              Sector 2 of 4
            </span>
          </div>

          <div className="flex-1 max-h-6 sm:max-h-10" />

          {/* Editorial Hero Block */}
          <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center my-auto">
            <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
              Returning / Next,
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
              Second sector flight &amp; date.
            </h2>

            {/* Flight Number Input */}
            <div className="w-full mt-6 text-left">
              <FlightNumberInput
                value={sector2Validation.flightNo}
                onChange={sector2Validation.setFlightNo}
                isValid={sector2Validation.isValid}
                isChecking={sector2Validation.isChecking}
                error={sector2Validation.error}
                placeholder="1 3 3"
              />
            </div>

            {/* Departure Block */}
            {sector2Validation.isValid && sector2Validation.flightNo.length > 0 && (
              <div className="w-full mt-5 text-left">
                <DepartureBlock
                  selectedDateISO={sector2DateISO}
                  onDateSelect={(iso, display) => {
                    setSector2DateISO(iso);
                    setSector2DateDisplay(display);
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex-1 max-h-6 sm:max-h-10" />

          {/* Progression CTA to Sector 3 or 2-Sector Calculate */}
          {sector2Validation.isValid && sector2Validation.flightNo.length > 0 && sector2DateISO && (
            <div className="shrink-0 pb-2 space-y-2 text-center">
              <RevealCTA
                label="Proceed to Sector 3"
                icon={ArrowRight}
                summary={`SQ${sector2Validation.cleanFlightNo} · ${sector2DateDisplay}`}
                onPress={handleProceedToSector3}
              />
              
              <button
                type="button"
                onClick={() => handleStartCalculation(2)}
                className="text-[11px] text-text-secondary hover:text-accent font-medium underline underline-offset-4 transition-colors"
              >
                Or calculate 2 sectors only (SQ{sector1Validation.cleanFlightNo} &amp; SQ{sector2Validation.cleanFlightNo})
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. STEP 3: SECTOR 3 */}
      {stage === 'sector3' && (
        <div className="flex flex-col justify-between h-full py-1 animate-fade-in">
          {/* Top Previous Sectors Pills */}
          <div className="shrink-0 flex flex-wrap items-center justify-center gap-1.5 pt-1">
            <FlightChip
              label={`S1: SQ${sector1Validation.cleanFlightNo}`}
              onClick={() => setStage('sector1')}
            />
            <FlightChip
              label={`S2: SQ${sector2Validation.cleanFlightNo}`}
              onClick={() => setStage('sector2')}
            />
            <span className="text-[10px] font-mono tracking-widest uppercase text-accent font-semibold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
              Sector 3 of 4
            </span>
          </div>

          <div className="flex-1 max-h-6 sm:max-h-10" />

          {/* Editorial Hero Block */}
          <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center my-auto">
            <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
              Third Duty,
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
              Third sector flight &amp; date.
            </h2>

            {/* Flight Number Input */}
            <div className="w-full mt-6 text-left">
              <FlightNumberInput
                value={sector3Validation.flightNo}
                onChange={sector3Validation.setFlightNo}
                isValid={sector3Validation.isValid}
                isChecking={sector3Validation.isChecking}
                error={sector3Validation.error}
                placeholder="1 3 8"
              />
            </div>

            {/* Departure Block */}
            {sector3Validation.isValid && sector3Validation.flightNo.length > 0 && (
              <div className="w-full mt-5 text-left">
                <DepartureBlock
                  selectedDateISO={sector3DateISO}
                  onDateSelect={(iso, display) => {
                    setSector3DateISO(iso);
                    setSector3DateDisplay(display);
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex-1 max-h-6 sm:max-h-10" />

          {/* Progression CTA */}
          {sector3Validation.isValid && sector3Validation.flightNo.length > 0 && sector3DateISO && (
            <div className="shrink-0 pb-2">
              <RevealCTA
                label="Proceed to Sector 4"
                icon={ArrowRight}
                summary={`SQ${sector3Validation.cleanFlightNo} · ${sector3DateDisplay}`}
                onPress={handleProceedToSector4}
              />
            </div>
          )}
        </div>
      )}

      {/* 5. STEP 4: SECTOR 4 */}
      {stage === 'sector4' && (
        <div className="flex flex-col justify-between h-full py-1 animate-fade-in">
          {/* Top Previous Sectors Pills */}
          <div className="shrink-0 flex flex-wrap items-center justify-center gap-1 pt-1">
            <FlightChip
              label={`S1: SQ${sector1Validation.cleanFlightNo}`}
              onClick={() => setStage('sector1')}
            />
            <FlightChip
              label={`S2: SQ${sector2Validation.cleanFlightNo}`}
              onClick={() => setStage('sector2')}
            />
            <FlightChip
              label={`S3: SQ${sector3Validation.cleanFlightNo}`}
              onClick={() => setStage('sector3')}
            />
            <span className="text-[10px] font-mono tracking-widest uppercase text-accent font-semibold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
              Sector 4 of 4
            </span>
          </div>

          <div className="flex-1 max-h-6 sm:max-h-10" />

          {/* Editorial Hero Block */}
          <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center my-auto">
            <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
              Final Sector,
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
              Fourth sector flight &amp; date.
            </h2>

            {/* Flight Number Input */}
            <div className="w-full mt-6 text-left">
              <FlightNumberInput
                value={sector4Validation.flightNo}
                onChange={sector4Validation.setFlightNo}
                isValid={sector4Validation.isValid}
                isChecking={sector4Validation.isChecking}
                error={sector4Validation.error}
                placeholder="1 3 7"
              />
            </div>

            {/* Departure Block */}
            {sector4Validation.isValid && sector4Validation.flightNo.length > 0 && (
              <div className="w-full mt-5 text-left">
                <DepartureBlock
                  selectedDateISO={sector4DateISO}
                  onDateSelect={(iso, display) => {
                    setSector4DateISO(iso);
                    setSector4DateDisplay(display);
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex-1 max-h-6 sm:max-h-10" />

          {/* Calculate CTA */}
          {sector4Validation.isValid && sector4Validation.flightNo.length > 0 && sector4DateISO && (
            <div className="shrink-0 pb-2">
              <RevealCTA
                label="Calculate 4 Sectors"
                icon={<Wallet className="w-4 h-4 text-[#0B1E3E]" />}
                summary={`SQ${sector4Validation.cleanFlightNo} · ${sector4DateDisplay}`}
                onPress={() => handleStartCalculation(4)}
              />
            </div>
          )}
        </div>
      )}

      {/* 6. RESULT SCREEN — ALL SECTORS, STATION TIMINGS, AND ALLOWANCES */}
      {stage === 'result' && allSectors.length > 0 && (
        <div className="flex flex-col h-full overflow-hidden py-1 animate-fade-in">
          
          {/* Top Flight Summary Chip */}
          <div className="shrink-0 text-center pt-1 pb-2 border-b border-border-subtle/50">
            <FlightChip label={flightChipSummary} />
          </div>

          {/* Scrollable Sector Cards Container */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-2.5 space-y-3 px-1">
            
            {/* Station Layover & Station Rest Summary Card */}
            {stationName && stationArrTime && stationDepTime && (
              <div className="p-3.5 rounded-card bg-bg-surface border border-accent/40 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
                  <div className="flex items-center gap-1.5 text-accent text-xs font-semibold uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Station Layover · {stationCity} ({stationName})</span>
                  </div>
                  {stationLayover && (
                    <span className="text-[11px] font-mono text-text-primary px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 font-semibold">
                      {stationLayover} Layover
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-left">
                  {/* Arrival in Station */}
                  <div className="p-2.5 rounded bg-bg-elevated/70 border border-border-subtle/40">
                    <span className="text-[10px] text-text-secondary uppercase font-medium block">
                      Local Arrival in Station ({stationName})
                    </span>
                    <span className="text-base sm:text-lg font-serif font-bold text-text-primary block mt-0.5">
                      {stationArrTime}
                    </span>
                    <span className="text-[10px] font-mono text-text-tertiary block mt-0.5">
                      {formatDateDisplay(stationArrDate)}
                    </span>
                  </div>

                  {/* Departure from Station */}
                  <div className="p-2.5 rounded bg-bg-elevated/70 border border-border-subtle/40">
                    <span className="text-[10px] text-text-secondary uppercase font-medium block">
                      Local Departure from Station ({stationName})
                    </span>
                    <span className="text-base sm:text-lg font-serif font-bold text-text-primary block mt-0.5">
                      {stationDepTime}
                    </span>
                    <span className="text-[10px] font-mono text-text-tertiary block mt-0.5">
                      {formatDateDisplay(stationDepDate)}
                    </span>
                  </div>
                </div>

                {/* Total Flight Time Across All Sectors */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-text-secondary flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    <span>Total Flight Time ({allSectors.length} Sectors)</span>
                  </span>
                  <span className="font-serif italic text-accent font-semibold text-xs sm:text-sm">
                    {formatBlockTime(grandTotalFlightMinutes)}
                  </span>
                </div>
              </div>
            )}

            {/* Individual Sectors Breakdown (All Sectors clearly numbered 1 through 4) */}
            <div className="p-3.5 rounded-card bg-bg-surface border border-border-subtle shadow-sm space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle/60 text-xs">
                <span className="font-semibold text-accent tracking-wider uppercase text-[10px]">
                  Sector Timings Breakdown ({allSectors.length} Sectors)
                </span>
                <span className="text-[10px] text-text-tertiary font-mono">
                  Pulled from flight schedule
                </span>
              </div>

              {allSectors.map((sec, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-bg-elevated/50 border border-border-subtle/50"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-accent/90 uppercase tracking-wider font-mono">
                      Sector {idx + 1}
                    </span>
                    <span className="text-[10px] text-text-tertiary font-mono">
                      {sec.depDateLocal ? formatDateDisplay(sec.depDateLocal) : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Origin */}
                    <div className="text-left w-1/3">
                      <span className="text-[10px] text-text-secondary block truncate font-medium">
                        {sec.fromCity || sec.from}
                      </span>
                      <span className="font-serif text-lg sm:text-xl font-bold text-text-primary">
                        {sec.from}
                      </span>
                      <span className="text-xs font-mono text-text-primary block font-semibold mt-0.5">
                        {sec.depLocal}
                      </span>
                    </div>

                    {/* Flight Time Duration */}
                    <div className="flex flex-col items-center px-1 w-1/3 text-center">
                      <Plane className="w-3.5 h-3.5 text-accent rotate-90 my-0.5" strokeWidth={1.8} />
                      <span className="font-serif italic text-accent text-xs font-semibold">
                        {formatBlockTime(sec.blockMinutes)}
                      </span>
                      <span className="text-[9px] text-text-tertiary font-mono">Flight Time</span>
                    </div>

                    {/* Destination */}
                    <div className="text-right w-1/3">
                      <span className="text-[10px] text-text-secondary block truncate font-medium">
                        {sec.toCity || sec.to}
                      </span>
                      <span className="font-serif text-lg sm:text-xl font-bold text-text-primary">
                        {sec.to}
                      </span>
                      <span className="text-xs font-mono text-text-primary block font-semibold mt-0.5">
                        {sec.arrLocal}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Crew Flying & Meal Allowance Calculator Card */}
            <div className="p-3.5 rounded-card bg-bg-surface border border-border-subtle shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-border-subtle/50">
                <span className="font-semibold text-accent uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Allowance &amp; Flying Pay Estimate</span>
                </span>
                
                {/* Rank Selector */}
                <div className="flex items-center gap-1 p-0.5 rounded bg-bg-elevated border border-border-subtle text-[10px]">
                  {(['FS/EY', 'LS/LSS', 'CS/CSS', 'IFS'] as const).map((rk) => (
                    <button
                      key={rk}
                      type="button"
                      onClick={() => setRankSelection(rk)}
                      className={`px-1.5 py-0.5 rounded font-medium transition-all ${
                        rankSelection === rk
                          ? 'bg-accent text-[#0B1E3E] font-bold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {rk}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-left">
                <div className="p-2 rounded bg-bg-elevated/70 border border-border-subtle/30">
                  <span className="text-[9px] text-text-secondary uppercase block">Flying Pay</span>
                  <span className="font-serif text-sm sm:text-base font-bold text-text-primary block mt-0.5">
                    S${estimatedFlyingPay}
                  </span>
                  <span className="text-[9px] text-text-tertiary font-mono block">
                    {totalFlightHoursDecimal.toFixed(1)}h @ S${hourlyRate}/h
                  </span>
                </div>

                <div className="p-2 rounded bg-bg-elevated/70 border border-border-subtle/30">
                  <span className="text-[9px] text-text-secondary uppercase block">Meal Allowance</span>
                  <span className="font-serif text-sm sm:text-base font-bold text-text-primary block mt-0.5">
                    S${estimatedMealAllowance}
                  </span>
                  <span className="text-[9px] text-text-tertiary font-mono block">
                    {allSectors.length} sectors
                  </span>
                </div>

                <div className="p-2 rounded bg-accent/15 border border-accent/40">
                  <span className="text-[9px] text-accent uppercase font-bold block">Est. Total</span>
                  <span className="font-serif text-sm sm:text-base font-bold text-accent block mt-0.5">
                    S${estimatedTotalEarnings}
                  </span>
                  <span className="text-[9px] text-text-tertiary font-mono block">
                    SGD Gross
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Action Footer */}
          <div className="shrink-0 flex items-center justify-between gap-3 pt-2 pb-1 border-t border-border-subtle/50">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-full border border-border-subtle hover:border-border-hover text-xs font-medium text-text-secondary hover:text-text-primary transition-all active:scale-95"
            >
              Back to Home
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="editorial-cta-btn flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold tracking-wide"
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
