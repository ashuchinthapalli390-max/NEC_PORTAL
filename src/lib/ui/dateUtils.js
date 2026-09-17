/**
 * NEC Portal — Centralized Date Utility
 *
 * All user-visible date formatting must use formatDateDDMMYYYY().
 * Internal storage, API, <input type="date">, and sortable keys remain ISO (YYYY-MM-DD).
 *
 * Rules:
 *  - Never run a date-only string through UTC Date() to avoid day-shift bugs.
 *  - For display-only, split on 'T' and reorder segments directly.
 *  - For full ISO timestamps the time portion is discarded for display.
 */

/**
 * Format any date-like value for user display as DD-MM-YYYY.
 * Accepts: ISO string (YYYY-MM-DD or YYYY-MM-DDTHH:...), Date object, or null/undefined.
 * Returns '—' for empty/invalid values.
 *
 * @param {string|Date|null|undefined} value
 * @returns {string}
 */
export function formatDateDDMMYYYY(value) {
  if (!value && value !== 0) return '—';

  let dateStr;

  if (value instanceof Date) {
    // Avoid UTC shift: use local date components
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${d}-${m}-${y}`;
  }

  dateStr = String(value).trim();

  // Strip time component from ISO timestamps (e.g. 2026-09-17T10:00:00Z)
  dateStr = dateStr.split('T')[0];

  const parts = dateStr.split('-');
  if (parts.length !== 3) return value; // Return raw if unparseable

  const [year, month, day] = parts;

  // Validate: year should be 4-digit, month 1-12, day 1-31
  if (!year || year.length !== 4 || !month || !day) return value;

  return `${day}-${month}-${year}`;
}

/**
 * Format an ISO date string for use in native <input type="date"> value prop.
 * Returns the first 10 characters (YYYY-MM-DD) of any ISO-like string.
 * Converts Date objects to local ISO date.
 *
 * @param {string|Date|null|undefined} value
 * @returns {string} e.g. "2026-09-17" or ""
 */
export function toInputDateValue(value) {
  if (!value) return '';
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(value).split('T')[0].slice(0, 10);
}

/**
 * Get today's date as an ISO string (YYYY-MM-DD) for use as default input values.
 * Uses local timezone to avoid UTC offset date shifts.
 *
 * @returns {string}
 */
export function todayISO() {
  return toInputDateValue(new Date());
}

/**
 * Check if a record date falls within an optional from/to range.
 * dateStr: ISO date string (YYYY-MM-DD)
 * fromDate: ISO date string or '' (inclusive)
 * toDate: ISO date string or '' (inclusive)
 * Returns true if dateStr is within [fromDate, toDate].
 *
 * @param {string} dateStr
 * @param {string} fromDate
 * @param {string} toDate
 * @returns {boolean}
 */
export function isInDateRange(dateStr, fromDate, toDate) {
  if (!dateStr) return true; // Records without dates are not filtered out
  const d = String(dateStr).split('T')[0];
  if (fromDate && d < fromDate) return false;
  if (toDate && d > toDate) return false;
  return true;
}

/**
 * Alias for isInDateRange — preferred export name for modules.
 */
export const isDateInRange = isInDateRange;
