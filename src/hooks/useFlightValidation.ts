import { useState, useEffect } from 'react';
import { isValidFlightNumber, normalizeFlightNumber } from '../lib/sq/endpoints';

export function useFlightValidation(initialValue = '', debounceMs = 150) {
  const [flightNo, setFlightNo] = useState(initialValue);
  const [isValid, setIsValid] = useState<boolean>(initialValue ? isValidFlightNumber(initialValue) : false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!flightNo || flightNo.trim() === '') {
      setIsValid(false);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      const valid = isValidFlightNumber(flightNo);
      setIsValid(valid);
      if (!valid && flightNo.length > 0) {
        setError('Please enter a valid flight number (1–4 digits)');
      } else {
        setError(null);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [flightNo, debounceMs]);

  const handleFlightChange = (value: string) => {
    // accept only digits, max 4 chars
    const digitsOnly = value.replace(/\D/g, '').slice(0, 4);
    setFlightNo(digitsOnly);
  };

  return {
    flightNo,
    cleanFlightNo: normalizeFlightNumber(flightNo),
    isValid,
    error,
    setFlightNo: handleFlightChange,
  };
}
