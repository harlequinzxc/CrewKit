import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow } from '../context/FlowContext';
import { Layout } from '../components/ui/Layout';
import { formatDateDisplay } from '../components/DepartureBlock';
import { FlightChip } from '../components/FlightChip';
import { getFlightSchedule } from '../lib/sq/endpoints';
import { Sector } from '../lib/sq/types';
import { Heading, Text, Button, SegmentedControl } from '../components/ui';
import {
  Plane,
  RotateCcw,
  Clock,
  MapPin,
  DollarSign,
} from 'lucide-react';

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
  const { state: flowState, isFlowConfigured, goToPage, resetFlow } = useFlow();

  // Navigation menu open state (controlled on Layout)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Results State
  const [allSectors, setAllSectors] = useState<Sector[]>([]);
  const [stationName, setStationName] = useState<string>('');
  const [stationCity, setStationCity] = useState<string>('');
  const [stationArrTime, setStationArrTime] = useState<string>('');
  const [stationArrDate, setStationArrDate] = useState<string>('');
  const [stationDepTime, setStationDepTime] = useState<string>('');
  const [stationDepDate, setStationDepDate] = useState<string>('');
  const [rankSelection, setRankSelection] = useState<'FS/EY' | 'LS/LSS' | 'CS/CSS' | 'IFS'>('FS/EY');

  // Redirect to flow start if accessed directly without configured state
  useEffect(() => {
    if (!isFlowConfigured) {
      navigate('/', { replace: true });
    }
  }, [isFlowConfigured, navigate]);

  // Load flight schedules on mount
  useEffect(() => {
    if (!isFlowConfigured) return;

    let isMounted = true;

    const fetchSchedules = async () => {
      const promises = flowState.sectors.map((sec) =>
        getFlightSchedule(sec.flightNumber, sec.date)
      );
      const results = await Promise.all(promises);

      if (!isMounted) return;

      const sectors: Sector[] = [];
      results.forEach((sch) => {
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
        setStationArrDate(outboundStationSector.arrDateLocal || flowState.sectors[0]?.date || '');
        setStationDepTime(inboundStationSector.depLocal);
        setStationDepDate(inboundStationSector.depDateLocal || flowState.sectors[midpoint]?.date || '');
      }
    };

    fetchSchedules();

    return () => {
      isMounted = false;
    };
  }, [isFlowConfigured, flowState.sectors]);

  if (!isFlowConfigured) {
    return null;
  }

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

  const flightChipSummary = flowState.sectors
    .map((s) => `SQ${s.flightNumber.replace(/\D/g, '')}`)
    .join(' · ');

  const rankOptions = [
    { id: 'FS/EY' as const, label: 'FS/EY' },
    { id: 'LS/LSS' as const, label: 'LS/LSS' },
    { id: 'CS/CSS' as const, label: 'CS/CSS' },
    { id: 'IFS' as const, label: 'IFS' },
  ];

  return (
    <Layout
      containerClassName="w-full md:w-[85%] max-w-6xl"
      onBack={() => {
        goToPage(4, 'backward');
        navigate('/');
      }}
      menuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
    >
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
                  <Text variant="overline" className="text-mist-300 block">
                    Local Arrival &bull; {stationName}
                  </Text>
                  <Heading variant="subsection" as="span" className="font-display text-2xl sm:text-3xl font-light text-ivory-100 block mt-1">
                    {stationArrTime}
                  </Heading>
                  <span className="text-xs font-ui text-mist-400 block mt-0.5">
                    {formatDateDisplay(stationArrDate)}
                  </span>
                </div>

                <div className="p-4 rounded-card bg-ink-850/70 border border-gold-dim">
                  <Text variant="overline" className="text-mist-300 block">
                    Local Departure &bull; {stationName}
                  </Text>
                  <Heading variant="subsection" as="span" className="font-display text-2xl sm:text-3xl font-light text-ivory-100 block mt-1">
                    {stationDepTime}
                  </Heading>
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

          {/* Individual Sectors Breakdown with GIANT IATA CODES */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gold-dim">
              <Heading variant="section" as="h3" className="text-2xl font-light">
                Sector Timings Breakdown
              </Heading>
              <Text variant="overline" className="text-mist-400">
                {allSectors.length} Sectors Scheduled
              </Text>
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

              {/* Rank Selector */}
              <SegmentedControl
                options={rankOptions}
                value={rankSelection}
                onChange={(val) => setRankSelection(val as any)}
                layoutId="crew-rank-pill"
                size="sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-card bg-ink-850/70 border border-gold-dim">
                <Text variant="overline" className="text-mist-300 block">
                  Flying Pay
                </Text>
                <span className="font-display text-2xl sm:text-3xl font-light text-ivory-100 block mt-1">
                  S${estimatedFlyingPay}
                </span>
                <span className="text-xs font-ui text-mist-400 block mt-0.5">
                  {totalFlightHoursDecimal.toFixed(1)}h @ S${hourlyRate}/h
                </span>
              </div>

              <div className="p-4 rounded-card bg-ink-850/70 border border-gold-dim">
                <Text variant="overline" className="text-mist-300 block">
                  Meal Allowance
                </Text>
                <span className="font-display text-2xl sm:text-3xl font-light text-ivory-100 block mt-1">
                  S${estimatedMealAllowance}
                </span>
                <span className="text-xs font-ui text-mist-400 block mt-0.5">
                  {allSectors.length} sectors scheduled
                </span>
              </div>

              <div className="p-4 rounded-card bg-gold-400/15 border border-gold-400/40">
                <Text variant="overline" className="text-gold-300 font-semibold block">
                  Estimated Total
                </Text>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              goToPage(4, 'backward');
              navigate('/');
            }}
          >
            Back to Tools
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={RotateCcw}
            onClick={() => {
              resetFlow();
              navigate('/');
            }}
          >
            New Calculation
          </Button>
        </div>
      </div>
    </Layout>
  );
};
