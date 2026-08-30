import { useState, useCallback, useMemo, useRef } from 'react';
import { validateFlightSyntax, normalizeFlightInput } from '../lib/sq/validation';

export function useFlightValidation(initialValue = '') {
  const inputRef = useRef<HTMLInputElement>(null);

  const [flightNo, setRawFlightNo] = useState(() => {
    return initialValue ? normalizeFlightInput(initialValue) : '';
  });

  // Stage 1: Local syntax validation
  const syntax = useMemo(() => {
    if (!flightNo) {
      return {
        valid: false,
        flight: '',
        displayFlight: '',
        error: null,
      };
    }
    return validateFlightSyntax(flightNo);
  }, [flightNo]);

  const handleFlightChange = useCallback((value: string) => {
    // If the user pastes a formatted string like "SQ 0011", "sq11", "SIA11", normalize it
    const trimmed = value.trim().toUpperCase();
    if (trimmed.startsWith('SQ') || trimmed.startsWith('SIA')) {
      const parsed = validateFlightSyntax(trimmed);
      if (parsed.valid) {
        setRawFlightNo(parsed.flight);
        return;
      }
    }

    // Live typing: keep numeric digits only, max 4 digits
    const digitsOnly = value.replace(/\D/g, '').slice(0, 4);
    setRawFlightNo(digitsOnly);
  }, []);

  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return {
    flightNo,
    cleanFlightNo: syntax.flight || flightNo,
    displayFlight: syntax.displayFlight || (flightNo ? `SQ ${flightNo}` : ''),
    isValid: syntax.valid,
    error: syntax.error,
    errorCode: syntax.code,
    setFlightNo: handleFlightChange,
    inputRef,
    focusInput,
  };
}
