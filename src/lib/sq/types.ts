export type CabinCode = "SUITES" | "FIRST" | "BUSINESS" | "PREMIUM_ECONOMY" | "ECONOMY";

export interface CabinOption {
  code: CabinCode;
  siaCode: 'FCL' | 'JCL' | 'SCL' | 'YCL';
  label: string;
  short: string;
}

export type CabinConfig = {
  flightNo: string;
  date: string;
  available: CabinCode[];
  aircraftType?: string;
  error?: string | null;
  errorCode?: 'BAD_INPUT' | 'NOT_FOUND' | 'UPSTREAM_ERROR';
};

export type Sector = {
  from: string;
  fromCity?: string;
  to: string;
  toCity?: string;
  depLocal: string;
  depDateLocal?: string;
  arrLocal: string;
  arrDateLocal?: string;
  blockMinutes: number;
};

export type FlightSchedule = {
  flightNo: string;
  date: string;
  sectors: Sector[];
  aircraftType?: string;
};

export type MenuItem = {
  id: string;
  title: string;
  description?: string;
  footnote?: string;
  tags?: string[];
  imageUrl?: string;
  hidden?: boolean;
};

export type MenuSection = {
  id: string;
  title: string;
  items: MenuItem[];
  hidden?: boolean;
};

export type MealCourse = {
  id: string;
  name: string;
  maxSequence?: number;
  items: MenuItem[];
};

export type MealSelection = {
  id: string;
  name: string;
  courses: MealCourse[];
};

export type MealService = {
  id: string;
  name: string;
  selections: MealSelection[];
};

export type AmenityItem = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
};

export interface SnackItem {
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface SnackGroup {
  name: string;
  items: SnackItem[];
}

export interface LegSnacksData {
  header?: string;
  groups: SnackGroup[];
}

export type LegMenuData = {
  legId: string;
  origin: string;
  destination: string;
  originCity?: string;
  destinationCity?: string;
  depTime?: string;
  arrTime?: string;
  depUtc?: string;
  arrUtc?: string;
  depDateLocal?: string;
  arrDateLocal?: string;
  departureLocalDate?: string;
  arrivalLocalDate?: string;
  arrDayShift?: number;
  isSnackBag?: boolean;
  mealServices: MealService[];
  drinks: MenuSection[];
  snacks: LegSnacksData | null;
  amenities: AmenityItem[];
};

export type MenuData = {
  flightNo: string;
  date: string;
  cabin: CabinCode;
  aircraftType?: string;
  legs: LegMenuData[];
  sections: MenuSection[];
  drinks: MenuSection[];
};
