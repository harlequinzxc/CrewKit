import { useState, useCallback } from 'react';
import { isValidFlightNumber, normalizeFlightNumber } from '../lib/sq/endpoints';

export function useFlightValidation(initialValue = '') {
  const [flightNo, setRawFlightNo] = useState(() => {
    return initialValue ? initialValue.replace(/\D/g, '').slice(0, 4) : '';
  });

  const cleanFlightNo = normalizeFlightNumber(flightNo);
  const isValid = isValidFlightNumber(flightNo);
  const error = flightNo.length > 0 && !isValid
    ? 'Please enter a valid flight number (1–4 digits)'
    : null;

  const handleFlightChange = useCallback((value: string) => {
    // Extract only digits, max 4 chars
    const digitsOnly = value.replace(/\D/g, '').slice(0, 4);
    setRawFlightNo(digitsOnly);
  }, []);

  return {
    flightNo,
    cleanFlightNo,
    isValid,
    error,
    setFlightNo: handleFlightChange,
  };
}
