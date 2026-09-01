import React, { createContext, useContext, useState, useEffect } from 'react';
import { CabinCode } from '../lib/sq/types';

export interface FlowSector {
  flightNumber: string;
  date: string;
  paxing: boolean;
}

export interface FlowState {
  currentPage: 0 | 1 | 2 | 3 | 4;
  flightType: 'turnaround' | 'layover' | null;
  sectorCount: 2 | 4 | null;
  sectors: FlowSector[];
  cabinClass: CabinCode | null;
  selectedTool: 'crewcash' | 'skymenu' | 'inkflight' | null;
}

export interface FlowContextValue {
  state: FlowState;
  direction: 'forward' | 'backward';
  goToPage: (page: 0 | 1 | 2 | 3 | 4, customDirection?: 'forward' | 'backward') => void;
  goBack: () => void;
  setFlightType: (type: 'turnaround' | 'layover') => void;
  setSectorCount: (count: 2 | 4) => void;
  updateSector: (index: number, data: Partial<FlowSector>) => void;
  setSectors: (sectors: FlowSector[]) => void;
  setCabinClass: (cabin: CabinCode) => void;
  setSelectedTool: (tool: 'crewcash' | 'skymenu' | 'inkflight' | null) => void;
  resetFlow: () => void;
  isFlowConfigured: boolean;
}

const DEFAULT_FLOW_STATE: FlowState = {
  currentPage: 0,
  flightType: null,
  sectorCount: null,
  sectors: [
    { flightNumber: '', date: '', paxing: false },
    { flightNumber: '', date: '', paxing: false },
  ],
  cabinClass: null,
  selectedTool: null,
};

const STORAGE_KEY = 'crewkit_flow_state_v1';

const FlowContext = createContext<FlowContextValue | undefined>(undefined);

export const FlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FlowState>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return DEFAULT_FLOW_STATE;
  });

  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  // Persist state in sessionStorage for session durability
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const goToPage = (page: 0 | 1 | 2 | 3 | 4, customDirection?: 'forward' | 'backward') => {
    setDirection(customDirection || (page > state.currentPage ? 'forward' : 'backward'));
    setState((prev) => ({ ...prev, currentPage: page }));
  };

  const goBack = () => {
    if (state.currentPage > 0) {
      goToPage((state.currentPage - 1) as 0 | 1 | 2 | 3 | 4, 'backward');
    }
  };

  const setFlightType = (type: 'turnaround' | 'layover') => {
    setState((prev) => ({ ...prev, flightType: type }));
  };

  const setSectorCount = (count: 2 | 4) => {
    setState((prev) => {
      let newSectors = [...prev.sectors];
      if (count === 2) {
        newSectors = newSectors.slice(0, 2);
        while (newSectors.length < 2) {
          newSectors.push({ flightNumber: '', date: '', paxing: false });
        }
      } else {
        while (newSectors.length < 4) {
          newSectors.push({ flightNumber: '', date: '', paxing: false });
        }
      }
      return { ...prev, sectorCount: count, sectors: newSectors };
    });
  };

  const updateSector = (index: number, data: Partial<FlowSector>) => {
    setState((prev) => {
      const updated = [...prev.sectors];
      if (updated[index]) {
        updated[index] = { ...updated[index], ...data };
      }
      return { ...prev, sectors: updated };
    });
  };

  const setSectors = (sectors: FlowSector[]) => {
    setState((prev) => ({ ...prev, sectors }));
  };

  const setCabinClass = (cabin: CabinCode) => {
    setState((prev) => ({ ...prev, cabinClass: cabin }));
  };

  const setSelectedTool = (tool: 'crewcash' | 'skymenu' | 'inkflight' | null) => {
    setState((prev) => ({ ...prev, selectedTool: tool }));
  };

  const resetFlow = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setDirection('backward');
    setState(DEFAULT_FLOW_STATE);
  };

  const isFlowConfigured = Boolean(
    state.sectors.length > 0 &&
      state.sectors[0].flightNumber.trim().length > 0 &&
      state.sectors[0].date.trim().length > 0 &&
      state.cabinClass
  );

  return (
    <FlowContext.Provider
      value={{
        state,
        direction,
        goToPage,
        goBack,
        setFlightType,
        setSectorCount,
        updateSector,
        setSectors,
        setCabinClass,
        setSelectedTool,
        resetFlow,
        isFlowConfigured,
      }}
    >
      {children}
    </FlowContext.Provider>
  );
};

export const useFlow = (): FlowContextValue => {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  return context;
};
