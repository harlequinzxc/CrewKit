import { useState, useEffect } from 'react';
import { isValidFlightNumber, normalizeFlightNumber } from '../lib/sq/endpoints';

export function useFlightValidation(initialValue = '322', debounceMs = 400) {
  const [flightNo, setFlightNo] = useState(initialValue);
  const [isChecking, setIsChecking] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If empty
    if (!flightNo || flightNo.trim() === '') {
      setIsChecking(false);
      setIsValid(null);
      setError(null);
      return;
    }

    setIsChecking(true);
    const timer = setTimeout(() => {
      const valid = isValidFlightNumber(flightNo);
      setIsChecking(false);
      setIsValid(valid);
      if (!valid) {
        setError('Flight not found for this route');
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
    isValid: isValid === true,
    isChecking,
    error,
    setFlightNo: handleFlightChange,
  };
}
