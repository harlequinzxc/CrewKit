import { useState, useCallback } from 'react';
import { isValidFlightNumber, normalizeFlightNumber } from '../lib/sq/endpoints';

export function useFlightValidation(initialValue = '') {
  const [flightNo, setRawFlightNo] = useState(() => {
    return initialValue ? initialValue.replace(/\D/g, '').slice(0, 4) : '';
  });

  const cleanFlightNo = normalizeFlightNumber(flightNo);
  const isValid = isValidFlightNumber(flightNo);

  // Show helpful validation feedback:
  // - Empty or 1 digit: no error while typing
  // - 2+ digits and invalid: informative error
  let error: string | null = null;
  if (flightNo === '0') {
    error = 'Please enter a valid flight number (e.g. 12, 322)';
  } else if (flightNo.length >= 2 && !isValid) {
    error = `SQ${flightNo} is not an active Singapore Airlines flight`;
  }

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
