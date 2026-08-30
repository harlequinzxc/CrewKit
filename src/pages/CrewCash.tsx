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
import { motion } from 'framer-motion';
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

  // Sector 1
  const sector1Validation = useFlightValidation('');
  const [sector1DateISO, setSector1DateISO] = useState<string>(initialTodayISO);
  const [sector1DateDisplay, setSector1DateDisplay] = useState<string>(initialTodayDisplay);

  // Sector 2
  const sector2Validation = useFlightValidation('');
  const [sector2DateISO, setSector2DateISO] = useState<string>(initialTodayISO);
  const [sector2DateDisplay, setSector2DateDisplay] = useState<string>(initialTodayDisplay);

  // Sector 3
  const sector3Validation = useFlightValidation('');
  const [sector3DateISO, setSector3DateISO] = useState<string>(initialTodayISO);
  const [sector3DateDisplay, setSector3DateDisplay] = useState<string>(initialTodayDisplay);

  // Sector 4
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

  const handleStartCalculation = (sectorCount: 2 | 4) => {
    setActiveSectorCount(sectorCount);
    setStage('loading');
  };

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
        sectors.push(...sch.sectors);
      }
    });

    setAllSectors(sectors);

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

  const grandTotalFlightMinutes = allSectors.reduce((acc, s) => acc + (s.blockMinutes || 0), 0);
  const totalFlightHoursDecimal = grandTotalFlightMinutes / 60;

  const stationLayover =
    stationArrDate && stationArrTime && stationDepDate && stationDepTime
      ? calculateStationLayover(stationArrDate, stationArrTime, stationDepDate, stationDepTime)
      : null;

  const rankHourlyRates: Record<string, number> = {
    'FS/EY': 12.8,
    'LS/LSS': 16.5,
    'CS/CSS': 22.0,
    IFS: 28.5,
  };
  const hourlyRate = rankHourlyRates[rankSelection] || 12.8;
  const estimatedFlyingPay = Math.round(totalFlightHoursDecimal * hourlyRate);
  const estimatedMealAllowance = allSectors.length * 45;
  const estimatedTotalEarnings = estimatedFlyingPay + estimatedMealAllowance;

  const flightChipSummary =
    activeSectorCount === 4 && sector3Validation.cleanFlightNo
      ? `SQ${sector1Validation.cleanFlightNo} · SQ${sector2Validation.cleanFlightNo} · SQ${sector3Validation.cleanFlightNo} · SQ${sector4Validation.cleanFlightNo}`
      : `SQ${sector1Validation.cleanFlightNo} → SQ${sector2Validation.cleanFlightNo} · ${sector1DateDisplay} → ${sector2DateDisplay}`;

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

      {/* 2. STEP 1: SECTOR 1 */}
      {stage === 'sector1' && (
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar pt-3 sm:pt-5 pb-8 px-1 animate-cabin-in">
          <div className="shrink-0 flex justify-center pb-4">
            <span className="text-[10px] font-ui uppercase tracking-eyebrow-wide text-gold-300 font-semibold px-3.5 py-1 rounded-full bg-ink-850 border border-gold-dim">
              Sector 1 of 4
            </span>
          </div>

          <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center space-y-5">
            <div>
              <span className="font-display italic text-gold-300 text-xl tracking-wide block mb-1">
                Departing,
              </span>

              <h2 className="font-display text-3xl sm:text-4xl font-light text-ivory-100 tracking-tight leading-snug">
                First sector flight &amp; date.
              </h2>
            </div>

            <div className="w-full text-left">
              <FlightNumberInput
                value={sector1Validation.flightNo}
                onChange={sector1Validation.setFlightNo}
                isValid={sector1Validation.isValid}
                isChecking={sector1Validation.isChecking}
                error={sector1Validation.error}
                placeholder="1 3 4"
              />
            </div>

            {sector1Validation.isValid && sector1Validation.flightNo.length > 0 && (
              <div className="w-full text-left animate-cabin-in">
                <DepartureBlock
                  selectedDateISO={sector1DateISO}
                  onDateSelect={(iso, display) => {
                    setSector1DateISO(iso);
                    setSector1DateDisplay(display);
                  }}
                />
              </div>
            )}

            {sector1Validation.isValid && sector1Validation.flightNo.length > 0 && sector1DateISO && (
              <div className="w-full pt-3 pb-4">
                <RevealCTA
                  label="Proceed to Sector 2"
                  icon={ArrowRight}
                  summary={`SQ${sector1Validation.cleanFlightNo} · ${sector1DateDisplay}`}
                  onPress={handleProceedToSector2}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. STEP 2: SECTOR 2 */}
      {stage === 'sector2' && (
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar pt-3 sm:pt-5 pb-8 px-1 animate-cabin-in">
          <div className="shrink-0 flex items-center justify-center gap-2 pb-4">
            <FlightChip
              label={`Sector 1: SQ${sector1Validation.cleanFlightNo} · ${sector1DateDisplay}`}
              onClick={() => setStage('sector1')}
            />
            <span className="text-[10px] font-ui uppercase tracking-eyebrow-wide text-gold-300 font-semibold px-3 py-1 rounded-full bg-ink-850 border border-gold-dim">
              Sector 2 of 4
            </span>
          </div>

          <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center space-y-5">
            <div>
              <span className="font-display italic text-gold-300 text-xl tracking-wide block mb-1">
                Returning / Next,
              </span>

              <h2 className="font-display text-3xl sm:text-4xl font-light text-ivory-100 tracking-tight leading-snug">
                Second sector flight &amp; date.
              </h2>
            </div>

            <div className="w-full text-left">
              <FlightNumberInput
                value={sector2Validation.flightNo}
                onChange={sector2Validation.setFlightNo}
                isValid={sector2Validation.isValid}
                isChecking={sector2Validation.isChecking}
                error={sector2Validation.error}
                placeholder="1 3 3"
              />
            </div>

            {sector2Validation.isValid && sector2Validation.flightNo.length > 0 && (
              <div className="w-full text-left animate-cabin-in">
                <DepartureBlock
                  selectedDateISO={sector2DateISO}
                  onDateSelect={(iso, display) => {
                    setSector2DateISO(iso);
                    setSector2DateDisplay(display);
                  }}
                />
              </div>
            )}

            {sector2Validation.isValid && sector2Validation.flightNo.length > 0 && sector2DateISO && (
              <div className="w-full pt-3 pb-4 space-y-2 text-center">
                <RevealCTA
                  label="Proceed to Sector 3"
                  icon={ArrowRight}
                  summary={`SQ${sector2Validation.cleanFlightNo} · ${sector2DateDisplay}`}
                  onPress={handleProceedToSector3}
                />
                <button
                  type="button"
                  onClick={() => handleStartCalculation(2)}
                  className="font-ui text-[11px] uppercase tracking-wider text-mist-300 hover:text-gold-300 underline underline-offset-4 transition-colors block mx-auto pt-1"
                >
                  Or calculate 2 sectors only (SQ{sector1Validation.cleanFlightNo} &amp; SQ{sector2Validation.cleanFlightNo})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. STEP 3: SECTOR 3 */}
      {stage === 'sector3' && (
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar pt-3 sm:pt-5 pb-8 px-1 animate-cabin-in">
          <div className="shrink-0 flex flex-wrap items-center justify-center gap-1.5 pb-4">
            <FlightChip label={`S1: SQ${sector1Validation.cleanFlightNo}`} onClick={() => setStage('sector1')} />
            <FlightChip label={`S2: SQ${sector2Validation.cleanFlightNo}`} onClick={() => setStage('sector2')} />
            <span className="text-[10px] font-ui uppercase tracking-eyebrow text-gold-300 font-semibold px-3 py-1 rounded-full bg-ink-850 border border-gold-dim">
              Sector 3 of 4
            </span>
          </div>

          <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center space-y-5">
            <div>
              <span className="font-display italic text-gold-300 text-xl tracking-wide block mb-1">
                Third Duty,
              </span>

              <h2 className="font-display text-3xl sm:text-4xl font-light text-ivory-100 tracking-tight leading-snug">
                Third sector flight &amp; date.
              </h2>
            </div>

            <div className="w-full text-left">
              <FlightNumberInput
                value={sector3Validation.flightNo}
                onChange={sector3Validation.setFlightNo}
                isValid={sector3Validation.isValid}
                isChecking={sector3Validation.isChecking}
                error={sector3Validation.error}
                placeholder="1 3 8"
              />
            </div>

            {sector3Validation.isValid && sector3Validation.flightNo.length > 0 && (
              <div className="w-full text-left animate-cabin-in">
                <DepartureBlock
                  selectedDateISO={sector3DateISO}
                  onDateSelect={(iso, display) => {
                    setSector3DateISO(iso);
                    setSector3DateDisplay(display);
                  }}
                />
              </div>
            )}

            {sector3Validation.isValid && sector3Validation.flightNo.length > 0 && sector3DateISO && (
              <div className="w-full pt-3 pb-4">
                <RevealCTA
                  label="Proceed to Sector 4"
                  icon={ArrowRight}
                  summary={`SQ${sector3Validation.cleanFlightNo} · ${sector3DateDisplay}`}
                  onPress={handleProceedToSector4}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. STEP 4: SECTOR 4 */}
      {stage === 'sector4' && (
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar pt-3 sm:pt-5 pb-8 px-1 animate-cabin-in">
          <div className="shrink-0 flex flex-wrap items-center justify-center gap-1.5 pb-4">
            <FlightChip label={`S1: SQ${sector1Validation.cleanFlightNo}`} onClick={() => setStage('sector1')} />
            <FlightChip label={`S2: SQ${sector2Validation.cleanFlightNo}`} onClick={() => setStage('sector2')} />
            <FlightChip label={`S3: SQ${sector3Validation.cleanFlightNo}`} onClick={() => setStage('sector3')} />
            <span className="text-[10px] font-ui uppercase tracking-eyebrow text-gold-300 font-semibold px-3 py-1 rounded-full bg-ink-850 border border-gold-dim">
              Sector 4 of 4
            </span>
          </div>

          <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center space-y-5">
            <div>
              <span className="font-display italic text-gold-300 text-xl tracking-wide block mb-1">
                Final Sector,
              </span>

              <h2 className="font-display text-3xl sm:text-4xl font-light text-ivory-100 tracking-tight leading-snug">
                Fourth sector flight &amp; date.
              </h2>
            </div>

            <div className="w-full text-left">
              <FlightNumberInput
                value={sector4Validation.flightNo}
                onChange={sector4Validation.setFlightNo}
                isValid={sector4Validation.isValid}
                isChecking={sector4Validation.isChecking}
                error={sector4Validation.error}
                placeholder="1 3 7"
              />
            </div>

            {sector4Validation.isValid && sector4Validation.flightNo.length > 0 && (
              <div className="w-full text-left animate-cabin-in">
                <DepartureBlock
                  selectedDateISO={sector4DateISO}
                  onDateSelect={(iso, display) => {
                    setSector4DateISO(iso);
                    setSector4DateDisplay(display);
                  }}
                />
              </div>
            )}

            {sector4Validation.isValid && sector4Validation.flightNo.length > 0 && sector4DateISO && (
              <div className="w-full pt-3 pb-4">
                <RevealCTA
                  label="Calculate 4 Sectors"
                  icon={<Wallet className="w-4 h-4 text-onyx-900" />}
                  summary={`SQ${sector4Validation.cleanFlightNo} · ${sector4DateDisplay}`}
                  onPress={() => handleStartCalculation(4)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. RESULT SCREEN — EDITORIAL LUXURY VIEW WITH GIANT IATA CODES */}
      {stage === 'result' && allSectors.length > 0 && (
        <div className="flex flex-col h-full overflow-hidden py-1 animate-cabin-in text-left">
          {/* Top Flight Chip Summary */}
          <div className="shrink-0 text-center pt-1 pb-3 border-b border-gold-dim">
            <FlightChip label={flightChipSummary} />
          </div>

          {/* Main Scrollable Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-6 px-1">
            {/* Station Layover & Station Rest Card */}
            {stationName && stationArrTime && stationDepTime && (
              <div className="cabin-glass p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gold-dim">
                  <div className="flex items-center gap-2 text-gold-300 text-xs font-ui uppercase tracking-eyebrow font-semibold">
                    <MapPin className="w-4 h-4 text-gold-400" />
                    <span>Station Layover &bull; {stationCity} ({stationName})</span>
                  </div>
                  {stationLayover && (
                    <span className="text-xs font-ui uppercase tracking-wider text-onyx-900 px-3 py-1 rounded-full bg-gold-400 font-bold shadow-sm">
                      {stationLayover} Layover
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-card bg-ink-850/70 border border-gold-dim">
                    <span className="text-[0.72rem] font-ui uppercase tracking-eyebrow text-mist-300 block">
                      Local Arrival &bull; {stationName}
                    </span>
                    <span className="font-display text-2xl sm:text-3xl font-light text-ivory-100 block mt-1">
                      {stationArrTime}
                    </span>
                    <span className="text-xs font-ui text-mist-400 block mt-0.5">
                      {formatDateDisplay(stationArrDate)}
                    </span>
                  </div>

                  <div className="p-4 rounded-card bg-ink-850/70 border border-gold-dim">
                    <span className="text-[0.72rem] font-ui uppercase tracking-eyebrow text-mist-300 block">
                      Local Departure &bull; {stationName}
                    </span>
                    <span className="font-display text-2xl sm:text-3xl font-light text-ivory-100 block mt-1">
                      {stationDepTime}
                    </span>
                    <span className="text-xs font-ui text-mist-400 block mt-0.5">
                      {formatDateDisplay(stationDepDate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-mist-300 flex items-center gap-2 text-xs font-ui uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-gold-400" />
                    <span>Total Flight Time across {allSectors.length} Sectors</span>
                  </span>
                  <span className="font-display text-2xl font-normal text-gold-300">
                    {formatBlockTime(grandTotalFlightMinutes)}
                  </span>
                </div>
              </div>
            )}

            {/* Individual Sectors Breakdown with GIANT IATA CODES (4rem+) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gold-dim">
                <h3 className="font-display text-2xl font-light text-ivory-100">
                  Sector Timings Breakdown
                </h3>
                <span className="text-xs font-ui uppercase tracking-eyebrow text-mist-400">
                  {allSectors.length} Sectors Scheduled
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allSectors.map((sec, idx) => (
                  <div
                    key={idx}
                    className="cabin-glass p-5 flex flex-col justify-between hover:border-gold-400/40 transition-all"
                  >
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-gold-dim">
                      <span className="text-xs font-ui uppercase tracking-eyebrow text-gold-300 font-semibold">
                        Sector {idx + 1}
                      </span>
                      <span className="text-xs font-ui text-mist-400">
                        {sec.depDateLocal ? formatDateDisplay(sec.depDateLocal) : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Origin with Giant IATA code */}
                      <div className="text-left">
                        <span className="text-xs font-ui text-mist-300 uppercase tracking-wider block">
                          {sec.fromCity || sec.from}
                        </span>
                        <span className="font-display text-4xl sm:text-5xl font-light text-ivory-100 tracking-tight block">
                          {sec.from}
                        </span>
                        <span className="text-sm font-ui text-gold-300 font-semibold block mt-1">
                          {sec.depLocal}
                        </span>
                      </div>

                      {/* Flight Duration Indicator */}
                      <div className="flex flex-col items-center px-3 text-center">
                        <Plane className="w-4 h-4 text-gold-400 rotate-90 my-1" strokeWidth={1.75} />
                        <span className="font-display italic text-gold-300 text-sm font-medium">
                          {formatBlockTime(sec.blockMinutes)}
                        </span>
                        <span className="text-[10px] font-ui uppercase tracking-widest text-mist-400 mt-0.5">
                          Flight Time
                        </span>
                      </div>

                      {/* Destination with Giant IATA code */}
                      <div className="text-right">
                        <span className="text-xs font-ui text-mist-300 uppercase tracking-wider block">
                          {sec.toCity || sec.to}
                        </span>
                        <span className="font-display text-4xl sm:text-5xl font-light text-ivory-100 tracking-tight block">
                          {sec.to}
                        </span>
                        <span className="text-sm font-ui text-gold-300 font-semibold block mt-1">
                          {sec.arrLocal}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Crew Flying & Meal Allowance Calculator Card */}
            <div className="cabin-glass p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gold-dim">
                <span className="font-display text-xl font-light text-ivory-100 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gold-400" />
                  <span>Allowance &amp; Flying Pay Estimate</span>
                </span>

                {/* Rank Selector using sliding pill */}
                <div className="flex items-center gap-1 p-1 rounded-full bg-ink-850 border border-gold-dim">
                  {(['FS/EY', 'LS/LSS', 'CS/CSS', 'IFS'] as const).map((rk) => (
                    <button
                      key={rk}
                      type="button"
                      onClick={() => setRankSelection(rk)}
                      className={`relative px-3 py-1 rounded-full text-xs font-ui uppercase tracking-wider font-semibold transition-all ${
                        rankSelection === rk ? 'text-onyx-900' : 'text-mist-300 hover:text-ivory-100'
                      }`}
                    >
                      {rankSelection === rk && (
                        <motion.div
                          layoutId="crew-rank-pill"
                          className="absolute inset-0 bg-gold-400 rounded-full shadow-sm"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{rk}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="p-4 rounded-card bg-ink-850/70 border border-gold-dim">
                  <span className="text-[0.72rem] font-ui uppercase tracking-eyebrow text-mist-300 block">
                    Flying Pay
                  </span>
                  <span className="font-display text-2xl sm:text-3xl font-light text-ivory-100 block mt-1">
                    S${estimatedFlyingPay}
                  </span>
                  <span className="text-xs font-ui text-mist-400 block mt-0.5">
                    {totalFlightHoursDecimal.toFixed(1)}h @ S${hourlyRate}/h
                  </span>
                </div>

                <div className="p-4 rounded-card bg-ink-850/70 border border-gold-dim">
                  <span className="text-[0.72rem] font-ui uppercase tracking-eyebrow text-mist-300 block">
                    Meal Allowance
                  </span>
                  <span className="font-display text-2xl sm:text-3xl font-light text-ivory-100 block mt-1">
                    S${estimatedMealAllowance}
                  </span>
                  <span className="text-xs font-ui text-mist-400 block mt-0.5">
                    {allSectors.length} sectors scheduled
                  </span>
                </div>

                <div className="p-4 rounded-card bg-gold-400/15 border border-gold-400/40">
                  <span className="text-[0.72rem] font-ui uppercase tracking-eyebrow text-gold-300 font-semibold block">
                    Estimated Total
                  </span>
                  <span className="font-display text-2xl sm:text-3xl font-normal gold-gradient-text block mt-1">
                    S${estimatedTotalEarnings}
                  </span>
                  <span className="text-xs font-ui text-mist-400 block mt-0.5">
                    SGD Gross Estimated
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Clean Action */}
          <div className="shrink-0 flex items-center justify-between gap-3 pt-3 pb-1 border-t border-gold-dim">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-full border border-gold-dim hover:border-gold-400 text-xs font-ui uppercase tracking-wider font-semibold text-mist-300 hover:text-ivory-100 transition-all active:scale-95"
            >
              Back to Home
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="gold-pill-button flex items-center gap-2 px-6 py-2.5 text-xs"
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
