export interface CabinOptionItem {
  code: string; // 'FCL' | 'JCL' | 'SCL' | 'YCL'
  label: string; // e.g. 'Suites & First Class', 'Business Class'
  short: string; // e.g. 'First', 'Business', 'Prem Econ', 'Economy'
}

export interface ValidationSuccessData {
  flight: string; // e.g. "11"
  displayFlight: string; // e.g. "SQ 11"
  flightDate: string; // e.g. "2026-08-29"
  aircraftType?: string;
  cabins: CabinOptionItem[];
  legs?: any[];
}

export type ValidationErrorCode =
  | 'BAD_INPUT'
  | 'BAD_DATE'
  | 'NOT_FOUND'
  | 'NO_CABINS'
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_NETWORK'
  | 'UPSTREAM_HTTP'
  | 'UPSTREAM_RESPONSE';

export type LiveCheckResult =
  | {
      ok: true;
      data: ValidationSuccessData;
    }
  | {
      ok: false;
      code: ValidationErrorCode;
      message: string;
      heading?: string;
      guidance?: string;
    };

export interface SyntaxValidationResult {
  valid: boolean;
  flight: string; // Canonical string e.g. "11"
  displayFlight: string; // e.g. "SQ 11"
  error: string | null;
  code?: ValidationErrorCode;
}

export interface DateValidationResult {
  valid: boolean;
  date: string;
  formattedLong: string;
  error: string | null;
  code?: ValidationErrorCode;
}

/**
 * Format ISO date string (YYYY-MM-DD) to Long English Date (e.g. "29 August 2026")
 * Avoids any timezone shift.
 */
export function formatDateLong(isoDate: string): string {
  if (!isoDate) return '';
  try {
    const parts = isoDate.split('-').map(Number);
    if (parts.length !== 3) return isoDate;
    const [year, month, day] = parts;
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

/**
 * Normalization & Syntax Validation (Stage 1)
 *
 * 1. Trim leading and trailing whitespace.
 * 2. Convert input to uppercase.
 * 3. Remove internal whitespace.
 * 4. Remove an optional "SQ" or "SIA" prefix.
 * 5. Verify that the remainder contains only 1–4 digits.
 * 6. Remove unnecessary leading zeroes.
 * 7. Convert the result to a number and verify that it is between 1 and 9999.
 * 8. Return canonical string representation, such as "11".
 *
 * Regex: ^(?:SQ|SIA)?0*(\d{1,4})$
 */
export function validateFlightSyntax(input: string): SyntaxValidationResult {
  if (!input || input.trim() === '') {
    return {
      valid: false,
      flight: '',
      displayFlight: '',
      error: 'Enter a valid Singapore Airlines flight number between SQ1 and SQ9999.',
      code: 'BAD_INPUT',
    };
  }

  // 1. Trim leading & trailing whitespace
  let sanitized = input.trim();

  // 2. Convert to uppercase
  sanitized = sanitized.toUpperCase();

  // 3. Remove internal whitespace
  sanitized = sanitized.replace(/\s+/g, '');

  // 4 & 5 & 6: Match ^(?:SQ|SIA)?0*(\d{1,4})$
  const match = sanitized.match(/^(?:SQ|SIA)?0*(\d{1,4})$/);
  if (!match) {
    return {
      valid: false,
      flight: '',
      displayFlight: '',
      error: 'Enter a valid Singapore Airlines flight number between SQ1 and SQ9999.',
      code: 'BAD_INPUT',
    };
  }

  // 7. Convert to number and verify 1 <= n <= 9999 (n !== 0)
  const digitStr = match[1];
  const num = parseInt(digitStr, 10);

  if (isNaN(num) || num < 1 || num > 9999) {
    return {
      valid: false,
      flight: '',
      displayFlight: '',
      error: 'Enter a valid Singapore Airlines flight number between SQ1 and SQ9999.',
      code: 'BAD_INPUT',
    };
  }

  // 8. Return canonical string representation e.g. "11"
  const canonical = num.toString();
  return {
    valid: true,
    flight: canonical,
    displayFlight: `SQ ${canonical}`,
    error: null,
  };
}

/**
 * Normalizes input directly to canonical digits string or raw sanitized digits
 */
export function normalizeFlightInput(input: string): string {
  const res = validateFlightSyntax(input);
  if (res.valid) return res.flight;
  return input.replace(/\D/g, '').slice(0, 4);
}

/**
 * Departure Date Validation (Stage 2)
 *
 * 1. Date uses YYYY-MM-DD.
 * 2. Represents a real calendar date.
 * 3. Within menu-publication period supported by Singapore Airlines.
 * 4. Not silently changed by timezone conversion.
 */
export function validateFlightDate(dateStr: string): DateValidationResult {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return {
      valid: false,
      date: dateStr,
      formattedLong: '',
      error: 'A valid departure date is required (YYYY-MM-DD).',
      code: 'BAD_DATE',
    };
  }

  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);

  if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) {
    return {
      valid: false,
      date: dateStr,
      formattedLong: '',
      error: 'Invalid calendar date.',
      code: 'BAD_DATE',
    };
  }

  const formattedLong = formatDateLong(dateStr);

  // Check past dates
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  if (dateStr < todayStr) {
    return {
      valid: false,
      date: dateStr,
      formattedLong,
      error: 'Choose an upcoming departure date.',
      code: 'BAD_DATE',
    };
  }

  return {
    valid: true,
    date: dateStr,
    formattedLong,
    error: null,
  };
}

/**
 * Stage 3 & 4: Live Flight Existence Check
 * Calls internal `/api/cabins` (or proxies directly to upstream with 12s timeout)
 */
export async function checkFlightExistence(
  flightInput: string,
  dateInput: string,
  signal?: AbortSignal
): Promise<LiveCheckResult> {
  // 1. Stage 1 Syntax Guard
  const syntax = validateFlightSyntax(flightInput);
  if (!syntax.valid) {
    return {
      ok: false,
      code: 'BAD_INPUT',
      message: syntax.error || 'Enter a valid Singapore Airlines flight number between SQ1 and SQ9999.',
    };
  }

  // 2. Stage 2 Date Guard
  const dateVal = validateFlightDate(dateInput);
  if (!dateVal.valid) {
    return {
      ok: false,
      code: dateVal.code || 'BAD_DATE',
      message: dateVal.error || 'Choose an upcoming departure date.',
    };
  }

  const flightNum = syntax.flight;
  const flightDate = dateVal.date;
  const formattedDate = dateVal.formattedLong;

  // 3. Call Server API
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  // Link external signal if provided
  if (signal) {
    signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      controller.abort();
    });
  }

  try {
    const res = await fetch(`/api/cabins?flight=${encodeURIComponent(flightNum)}&date=${encodeURIComponent(flightDate)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json = await res.json().catch(() => null);

    if (res.ok && json && json.ok) {
      return json as LiveCheckResult;
    }

    if (res.status === 404 || json?.code === 'NOT_FOUND') {
      return {
        ok: false,
        code: 'NOT_FOUND',
        heading: "We couldn't find that flight for this date.",
        message:
          json?.message ||
          `No Singapore Airlines flight or published menu was found for SQ ${flightNum} on ${formattedDate}.`,
        guidance: 'Check the flight number and date. Menus are generally published up to eight days before departure.',
      };
    }

    if (json?.code === 'NO_CABINS') {
      return {
        ok: false,
        code: 'NO_CABINS',
        heading: 'No Cabins Available',
        message: json.message || 'This flight was found, but no inflight-menu cabins are available yet.',
        guidance: 'Menus are generally published up to eight days before departure.',
      };
    }

    if (json?.code === 'BAD_INPUT' || json?.code === 'BAD_DATE') {
      return {
        ok: false,
        code: json.code,
        message: json.message || 'A valid flight number and departure date are required.',
      };
    }

    if (res.status === 504 || json?.code === 'UPSTREAM_TIMEOUT') {
      return {
        ok: false,
        code: 'UPSTREAM_TIMEOUT',
        heading: 'Request Timed Out',
        message: 'Singapore Airlines took too long to respond. Please try again.',
      };
    }

    if (res.status === 502 || json?.code === 'UPSTREAM_NETWORK') {
      return {
        ok: false,
        code: 'UPSTREAM_NETWORK',
        heading: 'Service Unreachable',
        message: 'The Singapore Airlines menu service is temporarily unreachable.',
      };
    }

    return {
      ok: false,
      code: 'UPSTREAM_HTTP',
      heading: 'Unable to Verify',
      message: 'Singapore Airlines could not verify this flight right now.',
    };
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      if (signal?.aborted) {
        // User aborted intentionally by typing a new number or changing date
        return {
          ok: false,
          code: 'BAD_INPUT',
          message: 'Request cancelled.',
        };
      }
      return {
        ok: false,
        code: 'UPSTREAM_TIMEOUT',
        heading: 'Request Timed Out',
        message: 'Singapore Airlines took too long to respond. Please try again.',
      };
    }

    return {
      ok: false,
      code: 'UPSTREAM_NETWORK',
      heading: 'Connection Failed',
      message: 'The Singapore Airlines menu service is temporarily unreachable.',
    };
  }
}
