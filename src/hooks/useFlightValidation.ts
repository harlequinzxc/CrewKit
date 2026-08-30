import { useState, useCallback, useMemo } from 'react';
import { validateFlightSyntax, normalizeFlightNumber } from '../lib/sq/endpoints';

export function useFlightValidation(initialValue = '') {
  const [flightNo, setRawFlightNo] = useState(() => {
    return initialValue ? normalizeFlightNumber(initialValue) : '';
  });

  // Gate 1: Instant client-side syntax evaluation
  const syntax = useMemo(() => validateFlightSyntax(flightNo), [flightNo]);

  const handleFlightChange = useCallback((value: string) => {
    // Strip non-digits live and cap at 4 digits for the numeric input field
    const digitsOnly = value.replace(/\D/g, '').slice(0, 4);
    setRawFlightNo(digitsOnly);
  }, []);

  return {
    flightNo,
    cleanFlightNo: syntax.flightNumber || normalizeFlightNumber(flightNo),
    isValid: syntax.valid,
    error: syntax.error,
    setFlightNo: handleFlightChange,
  };
}
