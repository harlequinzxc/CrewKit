export type CabinCode = "SUITES" | "FIRST" | "BUSINESS" | "PREMIUM_ECONOMY" | "ECONOMY";

export type CabinConfig = {
  flightNo: string;
  date: string;
  available: CabinCode[];
  aircraftType?: string;
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

export type MenuData = {
  flightNo: string;
  date: string;
  cabin: CabinCode;
  aircraftType?: string;
  sections: MenuSection[];
  drinks: MenuSection[];
};
