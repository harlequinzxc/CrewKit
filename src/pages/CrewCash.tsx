import React, { useState, useEffect } from 'react';
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
  Layers,
  Edit3,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const CREWCASH_MESSAGES: InterludeMessage[] = [
  { text: 'Checking flight time with Tech Crew…', durationMs: 2000 },
  { text: 'Checking arrival time with Tech Crew…', durationMs: 2000 },
  { text: 'Checking departure time…', durationMs: 2000 },
  { text: 'Almost ready…', durationMs: 2000 },
];

export type TripMode = 'standard' | 'double_turn';

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

/**
 * Compute block minutes from HH:mm times on same or next day
 */
function computeBlockMinutes(dep: string, arr: string): number {
  if (!dep || !arr) return 90;
  const [dh, dm] = dep.split(':').map(Number);
  const [ah, am] = arr.split(':').map(Number);
  if (isNaN(dh) || isNaN(dm) || isNaN(ah) || isNaN(am)) return 90;
  let depTotal = dh * 60 + dm;
  let arrTotal = ah * 60 + am;
  if (arrTotal <= depTotal) {
    arrTotal += 24 * 60; // Crosses midnight
  }
  return arrTotal - depTotal;
}

export const CrewCash: React.FC = () => {
  const navigate = useNavigate();
  const initialTodayISO = getTodayISO();
  const initialTodayDisplay = formatDateDisplay(initialTodayISO);

  // Trip Mode: Standard (Long-haul / Multi-sector e.g. SQ12/SQ11) vs Double Turn (4-sector e.g. SQ134/133 + SQ138/137)
  const [tripMode, setTripMode] = useState<TripMode>('standard');

  // Wizard Stages: 'step1' -> 'step2' -> 'loading' -> 'result'
  const [stage, setStage] = useState<'step1' | 'step2' | 'loading' | 'result'>('step1');

  // STEP 1: First Two Sectors (or Outbound flight)
  const step1ValidationA = useFlightValidation('');
  const step1ValidationB = useFlightValidation(''); // Used for 2nd turnaround leg if in double turn mode
  const [step1DateISO, setStep1DateISO] = useState<string>(initialTodayISO);
  const [step1DateDisplay, setStep1DateDisplay] = useState<string>(initialTodayDisplay);
  const [showStep1TimeInputs, setShowStep1TimeInputs] = useState<boolean>(false);
  const [step1CustomSector1Dep, setStep1CustomSector1Dep] = useState<string>('09:25');
  const [step1CustomSector1Arr, setStep1CustomSector1Arr] = useState<string>('17:30');
  const [step1CustomSector2Dep, setStep1CustomSector2Dep] = useState<string>('19:00');
  const [step1CustomSector2Arr, setStep1CustomSector2Arr] = useState<string>('13:15');

  // STEP 2: Next Two Sectors (or Inbound flight)
  const step2ValidationA = useFlightValidation('');
  const step2ValidationB = useFlightValidation(''); // Used for 4th turnaround leg if in double turn mode
  const [step2DateISO, setStep2DateISO] = useState<string>(initialTodayISO);
  const [step2DateDisplay, setStep2DateDisplay] = useState<string>(initialTodayDisplay);
  const [showStep2TimeInputs, setShowStep2TimeInputs] = useState<boolean>(false);
  const [step2CustomSector3Dep, setStep2CustomSector3Dep] = useState<string>('15:50');
  const [step2CustomSector3Arr, setStep2CustomSector3Arr] = useState<string>('19:00');
  const [step2CustomSector4Dep, setStep2CustomSector4Dep] = useState<string>('20:25');
  const [step2CustomSector4Arr, setStep2CustomSector4Arr] = useState<string>('03:00');

  // Calculated Schedules & Combined Sectors
  const [allSectors, setAllSectors] = useState<Sector[]>([]);
  const [stationName, setStationName] = useState<string>('');
  const [stationCity, setStationCity] = useState<string>('');
  const [stationArrTime, setStationArrTime] = useState<string>('');
  const [stationArrDate, setStationArrDate] = useState<string>('');
  const [stationDepTime, setStationDepTime] = useState<string>('');
  const [stationDepDate, setStationDepDate] = useState<string>('');
  const [rankSelection, setRankSelection] = useState<'FS/EY' | 'LS/LSS' | 'CS/CSS' | 'IFS'>('FS/EY');
  const [isEditingTimes, setIsEditingTimes] = useState<boolean>(false);

  // Auto-sync turnaround return flight number
  useEffect(() => {
    if (tripMode === 'double_turn') {
      const numA = parseInt(step1ValidationA.flightNo, 10);
      if (!isNaN(numA) && !step1ValidationB.flightNo) {
        const retNum = numA % 2 === 0 ? (numA - 1).toString() : (numA + 1).toString();
        step1ValidationB.setFlightNo(retNum);
      }
    }
  }, [step1ValidationA.flightNo, tripMode]);

  useEffect(() => {
    if (tripMode === 'double_turn') {
      const numA = parseInt(step2ValidationA.flightNo, 10);
      if (!isNaN(numA) && !step2ValidationB.flightNo) {
        const retNum = numA % 2 === 0 ? (numA - 1).toString() : (numA + 1).toString();
        step2ValidationB.setFlightNo(retNum);
      }
    }
  }, [step2ValidationA.flightNo, tripMode]);

  // Handle Step 1 -> Step 2
  const handleProceedToStep2 = () => {
    const num = parseInt(step1ValidationA.flightNo, 10);
    if (!isNaN(num) && (!step2ValidationA.flightNo || step2ValidationA.flightNo === '')) {
      const returnNum = num % 2 === 0 ? (num - 1).toString() : (num + 1).toString();
      step2ValidationA.setFlightNo(returnNum);
    }
    setStage('step2');
  };

  // Trigger Full-Screen Fetch Interlude
  const handleStartCalculation = () => {
    setStage('loading');
  };

  // Execute Fetch for all sectors
  const executeSchedulesFetch = async () => {
    if (tripMode === 'double_turn') {
      const [s1, s2, s3, s4] = await Promise.all([
        getFlightSchedule(step1ValidationA.flightNo, step1DateISO),
        getFlightSchedule(step1ValidationB.flightNo || step1ValidationA.flightNo, step1DateISO),
        getFlightSchedule(step2ValidationA.flightNo, step2DateISO),
        getFlightSchedule(step2ValidationB.flightNo || step2ValidationA.flightNo, step2DateISO),
      ]);
      return { s1, s2, s3, s4, mode: 'double_turn' as const };
    } else {
      const [outSched, inSched] = await Promise.all([
        getFlightSchedule(step1ValidationA.flightNo, step1DateISO),
        getFlightSchedule(step2ValidationA.flightNo, step2DateISO),
      ]);
      return { outSched, inSched, mode: 'standard' as const };
    }
  };

  const handleFetchSuccess = (data: any) => {
    const sectors: Sector[] = [];

    if (data.mode === 'double_turn') {
      // 4 distinct turnaround sectors
      const schedList = [data.s1, data.s2, data.s3, data.s4];
      schedList.forEach((sch, idx) => {
        if (sch && sch.sectors && sch.sectors.length > 0) {
          sectors.push(sch.sectors[0]);
        } else {
          // Fallback dummy sector with custom key-in times if provided
          const dep = idx === 0 ? step1CustomSector1Dep : idx === 1 ? step1CustomSector1Arr : idx === 2 ? step2CustomSector3Dep : step2CustomSector4Dep;
          const arr = idx === 0 ? step1CustomSector1Arr : idx === 1 ? step1CustomSector2Arr : idx === 2 ? step2CustomSector3Arr : step2CustomSector4Arr;
          sectors.push({
            from: idx % 2 === 0 ? 'SIN' : 'PEN',
            fromCity: idx % 2 === 0 ? 'Singapore' : 'Penang',
            to: idx % 2 === 0 ? 'PEN' : 'SIN',
            toCity: idx % 2 === 0 ? 'Penang' : 'Singapore',
            depLocal: dep,
            depDateLocal: idx < 2 ? step1DateISO : step2DateISO,
            arrLocal: arr,
            arrDateLocal: idx < 2 ? step1DateISO : step2DateISO,
            blockMinutes: computeBlockMinutes(dep, arr),
          });
        }
      });
    } else {
      // Standard / Multi-leg pairing (e.g. SQ12 SIN-NRT-LAX + SQ11 LAX-NRT-SIN)
      if (data.outSched?.sectors) {
        sectors.push(...data.outSched.sectors);
      }
      if (data.inSched?.sectors) {
        sectors.push(...data.inSched.sectors);
      }
    }

    // Apply custom keyed-in time overrides if user enabled them
    if (showStep1TimeInputs && sectors.length >= 1) {
      sectors[0].depLocal = step1CustomSector1Dep;
      sectors[0].arrLocal = step1CustomSector1Arr;
      sectors[0].blockMinutes = computeBlockMinutes(step1CustomSector1Dep, step1CustomSector1Arr);
      if (sectors.length >= 2) {
        sectors[1].depLocal = step1CustomSector2Dep;
        sectors[1].arrLocal = step1CustomSector2Arr;
        sectors[1].blockMinutes = computeBlockMinutes(step1CustomSector2Dep, step1CustomSector2Arr);
      }
    }

    if (showStep2TimeInputs) {
      if (sectors.length === 2) {
        sectors[1].depLocal = step2CustomSector3Dep;
        sectors[1].arrLocal = step2CustomSector3Arr;
        sectors[1].blockMinutes = computeBlockMinutes(step2CustomSector3Dep, step2CustomSector3Arr);
      } else if (sectors.length >= 4) {
        sectors[2].depLocal = step2CustomSector3Dep;
        sectors[2].arrLocal = step2CustomSector3Arr;
        sectors[2].blockMinutes = computeBlockMinutes(step2CustomSector3Dep, step2CustomSector3Arr);
        sectors[3].depLocal = step2CustomSector4Dep;
        sectors[3].arrLocal = step2CustomSector4Arr;
        sectors[3].blockMinutes = computeBlockMinutes(step2CustomSector4Dep, step2CustomSector4Arr);
      }
    }

    setAllSectors(sectors);

    // Derive station arrival, departure, layover
    if (sectors.length >= 2) {
      const midpoint = Math.floor(sectors.length / 2);
      const outboundStationSector = sectors[midpoint - 1];
      const inboundStationSector = sectors[midpoint];

      setStationName(outboundStationSector.to);
      setStationCity(outboundStationSector.toCity || outboundStationSector.to);
      setStationArrTime(outboundStationSector.arrLocal);
      setStationArrDate(outboundStationSector.arrDateLocal || step1DateISO);
      setStationDepTime(inboundStationSector.depLocal);
      setStationDepDate(inboundStationSector.depDateLocal || step2DateISO);
    }

    setStage('result');
  };

  const handleReset = () => {
    step1ValidationA.setFlightNo('');
    step1ValidationB.setFlightNo('');
    step2ValidationA.setFlightNo('');
    step2ValidationB.setFlightNo('');
    setShowStep1TimeInputs(false);
    setShowStep2TimeInputs(false);
    setAllSectors([]);
    setStage('step1');
  };

  // Update sector time directly on results screen
  const handleUpdateSectorTime = (idx: number, field: 'depLocal' | 'arrLocal', value: string) => {
    const updated = [...allSectors];
    if (updated[idx]) {
      updated[idx] = {
        ...updated[idx],
        [field]: value,
      };
      updated[idx].blockMinutes = computeBlockMinutes(updated[idx].depLocal, updated[idx].arrLocal);
      setAllSectors(updated);

      // Re-derive station times if it affects station
      const midpoint = Math.floor(updated.length / 2);
      if (idx === midpoint - 1) {
        setStationArrTime(updated[midpoint - 1].arrLocal);
      } else if (idx === midpoint) {
        setStationDepTime(updated[midpoint].depLocal);
      }
    }
  };

  // Total Flight Minutes across all sectors
  const grandTotalFlightMinutes = allSectors.reduce((acc, s) => acc + (s.blockMinutes || 0), 0);
  const totalFlightHoursDecimal = grandTotalFlightMinutes / 60;

  // Station Layover duration
  const stationLayover =
    stationArrDate && stationArrTime && stationDepDate && stationDepTime
      ? calculateStationLayover(stationArrDate, stationArrTime, stationDepDate, stationDepTime)
      : null;

  // Allowance calculation based on crew rank hourly rates (SIA rates)
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
    tripMode === 'double_turn'
      ? `Duty 1: SQ${step1ValidationA.cleanFlightNo}/${step1ValidationB.cleanFlightNo || step1ValidationA.cleanFlightNo} · Duty 2: SQ${step2ValidationA.cleanFlightNo}/${step2ValidationB.cleanFlightNo || step2ValidationA.cleanFlightNo}`
      : `SQ${step1ValidationA.cleanFlightNo} → SQ${step2ValidationA.cleanFlightNo} · ${step1DateDisplay} → ${step2DateDisplay}`;

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

      {/* 2. STEP 1: FIRST TWO SECTORS / OUTBOUND */}
      {stage === 'step1' && (
        <div className="flex flex-col justify-between h-full py-1 animate-fade-in">
          
          {/* Trip Mode Switcher (Standard vs Double Turnaround 4-Sectors) */}
          <div className="shrink-0 flex justify-center pt-1">
            <div className="flex items-center p-0.5 rounded-full bg-bg-surface border border-border-subtle text-xs select-none">
              <button
                type="button"
                onClick={() => setTripMode('standard')}
                className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-medium transition-all ${
                  tripMode === 'standard'
                    ? 'bg-accent text-[#0B1E3E] font-semibold shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Plane className="w-3.5 h-3.5 rotate-45" />
                <span>Round-Trip / Multi-Sector</span>
              </button>
              <button
                type="button"
                onClick={() => setTripMode('double_turn')}
                className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-medium transition-all ${
                  tripMode === 'double_turn'
                    ? 'bg-accent text-[#0B1E3E] font-semibold shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Double Turn (4 Sectors)</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-h-4 sm:max-h-8" />

          {/* Editorial Hero Block */}
          <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center my-auto">
            <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
              {tripMode === 'double_turn' ? 'Turn 1 (Sectors 1 & 2),' : 'Departing,'}
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
              {tripMode === 'double_turn' ? 'First two turnaround sectors.' : 'Singapore to station.'}
            </h2>

            {/* Flight Input Fields */}
            {tripMode === 'standard' ? (
              <div className="w-full mt-6 text-left">
                <FlightNumberInput
                  value={step1ValidationA.flightNo}
                  onChange={step1ValidationA.setFlightNo}
                  isValid={step1ValidationA.isValid}
                  isChecking={step1ValidationA.isChecking}
                  error={step1ValidationA.error}
                  placeholder="1 2"
                />
              </div>
            ) : (
              <div className="w-full mt-5 grid grid-cols-2 gap-2 text-left">
                <div>
                  <label className="block text-[0.68rem] font-medium tracking-[0.15em] uppercase text-text-secondary mb-1">
                    Sector 1 (Out)
                  </label>
                  <FlightNumberInput
                    value={step1ValidationA.flightNo}
                    onChange={step1ValidationA.setFlightNo}
                    isValid={step1ValidationA.isValid}
                    isChecking={step1ValidationA.isChecking}
                    error={step1ValidationA.error}
                    placeholder="1 3 4"
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] font-medium tracking-[0.15em] uppercase text-text-secondary mb-1">
                    Sector 2 (In)
                  </label>
                  <FlightNumberInput
                    value={step1ValidationB.flightNo}
                    onChange={step1ValidationB.setFlightNo}
                    isValid={step1ValidationB.isValid}
                    isChecking={step1ValidationB.isChecking}
                    error={step1ValidationB.error}
                    placeholder="1 3 3"
                  />
                </div>
              </div>
            )}

            {/* Departure Block */}
            {step1ValidationA.isValid && step1ValidationA.flightNo.length > 0 && (
              <div className="w-full mt-4 text-left">
                <DepartureBlock
                  selectedDateISO={step1DateISO}
                  onDateSelect={(iso, display) => {
                    setStep1DateISO(iso);
                    setStep1DateDisplay(display);
                  }}
                />
              </div>
            )}

            {/* Option to Key in Custom Times for First Two Sectors */}
            {step1ValidationA.isValid && step1ValidationA.flightNo.length > 0 && (
              <div className="w-full mt-3.5 text-left">
                <button
                  type="button"
                  onClick={() => setShowStep1TimeInputs(!showStep1TimeInputs)}
                  className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent font-medium py-1"
                >
                  <Edit3 className="w-3.5 h-3.5 text-accent" />
                  <span>{showStep1TimeInputs ? 'Hide custom sector times' : 'Key in times for first 2 sectors'}</span>
                  {showStep1TimeInputs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showStep1TimeInputs && (
                  <div className="mt-2 p-3 rounded-card bg-bg-surface border border-border-subtle space-y-2.5 animate-fade-in text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-accent uppercase tracking-wider block mb-1">
                        Sector 1 Timings (Dep / Arr)
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          value={step1CustomSector1Dep}
                          onChange={(e) => setStep1CustomSector1Dep(e.target.value)}
                          className="px-2.5 py-1.5 rounded bg-bg-elevated border border-border-subtle text-text-primary text-xs font-mono"
                        />
                        <input
                          type="time"
                          value={step1CustomSector1Arr}
                          onChange={(e) => setStep1CustomSector1Arr(e.target.value)}
                          className="px-2.5 py-1.5 rounded bg-bg-elevated border border-border-subtle text-text-primary text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-accent uppercase tracking-wider block mb-1">
                        Sector 2 Timings (Dep / Arr)
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          value={step1CustomSector2Dep}
                          onChange={(e) => setStep1CustomSector2Dep(e.target.value)}
                          className="px-2.5 py-1.5 rounded bg-bg-elevated border border-border-subtle text-text-primary text-xs font-mono"
                        />
                        <input
                          type="time"
                          value={step1CustomSector2Arr}
                          onChange={(e) => setStep1CustomSector2Arr(e.target.value)}
                          className="px-2.5 py-1.5 rounded bg-bg-elevated border border-border-subtle text-text-primary text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 max-h-4 sm:max-h-8" />

          {/* Progression CTA */}
          {step1ValidationA.isValid && step1ValidationA.flightNo.length > 0 && step1DateISO && (
            <div className="shrink-0 pb-2">
              <RevealCTA
                label="Proceed to Next 2 Sectors"
                icon={ArrowRight}
                summary={`SQ${step1ValidationA.cleanFlightNo} · ${step1DateDisplay}`}
                onPress={handleProceedToStep2}
              />
            </div>
          )}
        </div>
      )}

      {/* 3. STEP 2: NEXT TWO SECTORS / INBOUND */}
      {stage === 'step2' && (
        <div className="flex flex-col justify-between h-full py-1 animate-fade-in">
          
          {/* Top Step 1 Summary Chip (Tappable to edit) */}
          <div className="shrink-0 text-center pt-1">
            <FlightChip
              label={`First 2 Sectors · SQ${step1ValidationA.cleanFlightNo} · ${step1DateDisplay}`}
              onClick={() => setStage('step1')}
            />
          </div>

          <div className="flex-1 max-h-4 sm:max-h-8" />

          {/* Editorial Hero Block */}
          <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center my-auto">
            <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
              {tripMode === 'double_turn' ? 'Turn 2 (Sectors 3 & 4),' : 'Returning,'}
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
              {tripMode === 'double_turn' ? 'Next two turnaround sectors.' : 'Station back to Singapore.'}
            </h2>

            {/* Flight Input Fields */}
            {tripMode === 'standard' ? (
              <div className="w-full mt-6 text-left">
                <FlightNumberInput
                  value={step2ValidationA.flightNo}
                  onChange={step2ValidationA.setFlightNo}
                  isValid={step2ValidationA.isValid}
                  isChecking={step2ValidationA.isChecking}
                  error={step2ValidationA.error}
                  placeholder="1 1"
                />
              </div>
            ) : (
              <div className="w-full mt-5 grid grid-cols-2 gap-2 text-left">
                <div>
                  <label className="block text-[0.68rem] font-medium tracking-[0.15em] uppercase text-text-secondary mb-1">
                    Sector 3 (Out)
                  </label>
                  <FlightNumberInput
                    value={step2ValidationA.flightNo}
                    onChange={step2ValidationA.setFlightNo}
                    isValid={step2ValidationA.isValid}
                    isChecking={step2ValidationA.isChecking}
                    error={step2ValidationA.error}
                    placeholder="1 3 8"
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] font-medium tracking-[0.15em] uppercase text-text-secondary mb-1">
                    Sector 4 (In)
                  </label>
                  <FlightNumberInput
                    value={step2ValidationB.flightNo}
                    onChange={step2ValidationB.setFlightNo}
                    isValid={step2ValidationB.isValid}
                    isChecking={step2ValidationB.isChecking}
                    error={step2ValidationB.error}
                    placeholder="1 3 7"
                  />
                </div>
              </div>
            )}

            {/* Inbound Departure Block */}
            {step2ValidationA.isValid && step2ValidationA.flightNo.length > 0 && (
              <div className="w-full mt-4 text-left">
                <DepartureBlock
                  selectedDateISO={step2DateISO}
                  onDateSelect={(iso, display) => {
                    setStep2DateISO(iso);
                    setStep2DateDisplay(display);
                  }}
                />
              </div>
            )}

            {/* Option to Key in Custom Times for Next Two Sectors */}
            {step2ValidationA.isValid && step2ValidationA.flightNo.length > 0 && (
              <div className="w-full mt-3.5 text-left">
                <button
                  type="button"
                  onClick={() => setShowStep2TimeInputs(!showStep2TimeInputs)}
                  className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent font-medium py-1"
                >
                  <Edit3 className="w-3.5 h-3.5 text-accent" />
                  <span>{showStep2TimeInputs ? 'Hide custom sector times' : 'Key in times for next 2 sectors'}</span>
                  {showStep2TimeInputs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showStep2TimeInputs && (
                  <div className="mt-2 p-3 rounded-card bg-bg-surface border border-border-subtle space-y-2.5 animate-fade-in text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-accent uppercase tracking-wider block mb-1">
                        Sector 3 Timings (Dep / Arr)
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          value={step2CustomSector3Dep}
                          onChange={(e) => setStep2CustomSector3Dep(e.target.value)}
                          className="px-2.5 py-1.5 rounded bg-bg-elevated border border-border-subtle text-text-primary text-xs font-mono"
                        />
                        <input
                          type="time"
                          value={step2CustomSector3Arr}
                          onChange={(e) => setStep2CustomSector3Arr(e.target.value)}
                          className="px-2.5 py-1.5 rounded bg-bg-elevated border border-border-subtle text-text-primary text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-accent uppercase tracking-wider block mb-1">
                        Sector 4 Timings (Dep / Arr)
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          value={step2CustomSector4Dep}
                          onChange={(e) => setStep2CustomSector4Dep(e.target.value)}
                          className="px-2.5 py-1.5 rounded bg-bg-elevated border border-border-subtle text-text-primary text-xs font-mono"
                        />
                        <input
                          type="time"
                          value={step2CustomSector4Arr}
                          onChange={(e) => setStep2CustomSector4Arr(e.target.value)}
                          className="px-2.5 py-1.5 rounded bg-bg-elevated border border-border-subtle text-text-primary text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 max-h-4 sm:max-h-8" />

          {/* Calculate CTA */}
          {step2ValidationA.isValid && step2ValidationA.flightNo.length > 0 && step2DateISO && (
            <div className="shrink-0 pb-2">
              <RevealCTA
                label="Calculate 4 Sectors"
                icon={<Wallet className="w-4 h-4 text-[#0B1E3E]" />}
                summary={`SQ${step2ValidationA.cleanFlightNo} · ${step2DateDisplay}`}
                onPress={handleStartCalculation}
              />
            </div>
          )}
        </div>
      )}

      {/* 4. RESULT SCREEN — ALL SECTORS, STATION TIMINGS, AND ALLOWANCES */}
      {stage === 'result' && allSectors.length > 0 && (
        <div className="flex flex-col h-full overflow-hidden py-1 animate-fade-in">
          
          {/* Top Flight Chip */}
          <div className="shrink-0 text-center pt-1 pb-2 border-b border-border-subtle/50">
            <FlightChip label={flightChipSummary} />
          </div>

          {/* Scrollable Sector Cards Container */}
          <div className="flex-1 overflow-y-auto py-2.5 space-y-3 px-1">
            
            {/* Station Layover & Station Rest Summary */}
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

                {/* Total Flight Time Pill */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-text-secondary flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    <span>Total Flight Time across {allSectors.length} Sectors</span>
                  </span>
                  <span className="font-serif italic text-accent font-semibold text-xs sm:text-sm">
                    {formatBlockTime(grandTotalFlightMinutes)}
                  </span>
                </div>
              </div>
            )}

            {/* Individual Sectors Breakdown (All Sectors clearly numbered 1 through 4) */}
            <div className="p-3.5 rounded-card bg-bg-surface border border-border-subtle shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle/60 text-xs">
                <span className="font-semibold text-accent tracking-wider uppercase text-[10px] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Sector Breakdown ({allSectors.length} Sectors)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingTimes(!isEditingTimes)}
                  className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-accent font-medium"
                >
                  <Edit3 className="w-3 h-3 text-accent" />
                  <span>{isEditingTimes ? 'Done editing' : 'Adjust timings'}</span>
                </button>
              </div>

              {allSectors.map((sec, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg bg-bg-elevated/50 border border-border-subtle/50 transition-all ${
                    idx > 0 ? 'mt-2' : ''
                  }`}
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
                      {isEditingTimes ? (
                        <input
                          type="time"
                          value={sec.depLocal}
                          onChange={(e) => handleUpdateSectorTime(idx, 'depLocal', e.target.value)}
                          className="mt-1 px-1.5 py-0.5 rounded bg-bg-surface border border-accent/40 text-text-primary text-xs font-mono w-20"
                        />
                      ) : (
                        <span className="text-xs font-mono text-text-primary block font-semibold">
                          {sec.depLocal}
                        </span>
                      )}
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
                      {isEditingTimes ? (
                        <input
                          type="time"
                          value={sec.arrLocal}
                          onChange={(e) => handleUpdateSectorTime(idx, 'arrLocal', e.target.value)}
                          className="mt-1 px-1.5 py-0.5 rounded bg-bg-surface border border-accent/40 text-text-primary text-xs font-mono w-20 ml-auto"
                        />
                      ) : (
                        <span className="text-xs font-mono text-text-primary block font-semibold">
                          {sec.arrLocal}
                        </span>
                      )}
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
