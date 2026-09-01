import { CabinCode } from '../sq/types';

export const KNOWN_4_SECTOR_CHAINS: Record<
  string,
  {
    flightNumbers: string[];
    description: string;
    routeLabel: string;
  }
> = {
  '12': {
    flightNumbers: ['12', '12', '11', '11'],
    description: 'SIN → NRT → LAX → NRT → SIN',
    routeLabel: 'SQ12 / SQ11 (Tokyo Narita & Los Angeles)',
  },
  '0012': {
    flightNumbers: ['12', '12', '11', '11'],
    description: 'SIN → NRT → LAX → NRT → SIN',
    routeLabel: 'SQ12 / SQ11 (Tokyo Narita & Los Angeles)',
  },
  '11': {
    flightNumbers: ['11', '11', '12', '12'],
    description: 'LAX → NRT → SIN → NRT → LAX',
    routeLabel: 'SQ11 / SQ12 (Los Angeles & Tokyo Narita)',
  },
  '0011': {
    flightNumbers: ['11', '11', '12', '12'],
    description: 'LAX → NRT → SIN → NRT → LAX',
    routeLabel: 'SQ11 / SQ12 (Los Angeles & Tokyo Narita)',
  },
  '26': {
    flightNumbers: ['26', '26', '25', '25'],
    description: 'SIN → FRA → JFK → FRA → SIN',
    routeLabel: 'SQ26 / SQ25 (Frankfurt & New York JFK)',
  },
  '0026': {
    flightNumbers: ['26', '26', '25', '25'],
    description: 'SIN → FRA → JFK → FRA → SIN',
    routeLabel: 'SQ26 / SQ25 (Frankfurt & New York JFK)',
  },
  '25': {
    flightNumbers: ['25', '25', '26', '26'],
    description: 'JFK → FRA → SIN → FRA → JFK',
    routeLabel: 'SQ25 / SQ26 (New York JFK & Frankfurt)',
  },
  '0025': {
    flightNumbers: ['25', '25', '26', '26'],
    description: 'JFK → FRA → SIN → FRA → JFK',
    routeLabel: 'SQ25 / SQ26 (New York JFK & Frankfurt)',
  },
};

export const CABIN_ORDER: Array<{ code: CabinCode; label: string }> = [
  { code: 'SUITES', label: 'Suites' },
  { code: 'FIRST', label: 'First' },
  { code: 'BUSINESS', label: 'Business' },
  { code: 'PREMIUM_ECONOMY', label: 'Prem' },
  { code: 'ECONOMY', label: 'Econ' },
];

export function getGreetingForHour(hour: number): string {
  if (hour >= 0 && hour < 12) return 'Good morning,';
  if (hour >= 12 && hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export function getTodayDateISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowDateISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
