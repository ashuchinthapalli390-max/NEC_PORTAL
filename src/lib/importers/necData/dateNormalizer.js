/**
 * dateNormalizer.js
 * High precision date, date-range, and academic year normalizer for NEC institutional data.
 */

/**
 * Converts Excel serial dates (e.g., 45195) to ISO YYYY-MM-DD string.
 * Accounts for Excel's 1900 leap year bug.
 */
export function excelSerialToDate(serial) {
  if (typeof serial !== 'number' || isNaN(serial) || serial <= 0) return null;
  // Excel base date: 1899-12-30 (accounts for the fictional 1900-02-29 leap day)
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const msPerDay = 86400000;
  const dateObj = new Date(excelEpoch.getTime() + Math.round(serial * msPerDay));
  
  if (isNaN(dateObj.getTime())) return null;
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes an academic year string into standard "YYYY-YY" format (e.g. "2025-26").
 */
export function normalizeAcademicYear(raw) {
  if (!raw) return '';
  const s = String(raw).trim().toUpperCase().replace(/AY|ACD|YEAR|ACADEMIC|\s+/g, '');
  
  // Format: "2025-2026" or "2025-26"
  const m = s.match(/(\d{4})[-/](\d{2,4})/);
  if (m) {
    const startYr = parseInt(m[1], 10);
    let endYrStr = m[2];
    if (endYrStr.length === 4) {
      endYrStr = endYrStr.slice(2);
    }
    return `${startYr}-${endYrStr}`;
  }

  // Format: "2025"
  const single = s.match(/^(\d{4})$/);
  if (single) {
    const startYr = parseInt(single[1], 10);
    const endYrStr = String(startYr + 1).slice(2);
    return `${startYr}-${endYrStr}`;
  }

  return String(raw).trim();
}

/**
 * Derives academic year from a given date string or year.
 * In Indian universities, the academic year starts in June/July (e.g. July 2025 is AY 2025-26).
 */
export function deriveAcademicYearFromDate(dateStr) {
  if (!dateStr) return '';
  // Try parsing YYYY-MM-DD
  const m = String(dateStr).match(/^(\d{4})-(\d{2})/);
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    if (month >= 6) {
      return `${year}-${String(year + 1).slice(2)}`;
    } else {
      return `${year - 1}-${String(year).slice(2)}`;
    }
  }
  return '';
}

/**
 * Normalizes diverse date expressions (serial, DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, month ranges).
 * Returns: { isoDate, displayDate, startDate, endDate, academicYear, rawText }
 */
export function normalizeDate(raw) {
  if (raw === null || raw === undefined || raw === '') {
    return {
      isoDate: null,
      displayDate: '',
      startDate: null,
      endDate: null,
      rawText: ''
    };
  }

  // If number, treat as Excel serial date
  if (typeof raw === 'number') {
    const iso = excelSerialToDate(raw);
    if (iso) {
      const [y, m, d] = iso.split('-');
      return {
        isoDate: iso,
        displayDate: `${d}-${m}-${y}`,
        startDate: iso,
        endDate: iso,
        rawText: String(raw)
      };
    }
  }

  const str = String(raw).trim().replace(/\.$/, ''); // remove trailing dot

  // Check if string is actually numeric serial
  if (/^\d{5}$/.test(str)) {
    const iso = excelSerialToDate(parseInt(str, 10));
    if (iso) {
      const [y, m, d] = iso.split('-');
      return {
        isoDate: iso,
        displayDate: `${d}-${m}-${y}`,
        startDate: iso,
        endDate: iso,
        rawText: str
      };
    }
  }

  // YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    return {
      isoDate: iso,
      displayDate: `${d}-${m}-${y}`,
      startDate: iso,
      endDate: iso,
      rawText: str
    };
  }

  // DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    const iso = `${y}-${m}-${d}`;
    return {
      isoDate: iso,
      displayDate: `${d}-${m}-${y}`,
      startDate: iso,
      endDate: iso,
      rawText: str
    };
  }

  // DD-MM-YY (2-digit year) e.g. 15-03.25 or 15/03/25
  const dmyShort = str.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{2})$/);
  if (dmyShort) {
    const d = dmyShort[1].padStart(2, '0');
    const m = dmyShort[2].padStart(2, '0');
    const y = 2000 + parseInt(dmyShort[3], 10);
    const iso = `${y}-${m}-${d}`;
    return {
      isoDate: iso,
      displayDate: `${d}-${m}-${y}`,
      startDate: iso,
      endDate: iso,
      rawText: str
    };
  }

  // Month range e.g. "Jul-Aug 2023" or "July 2023"
  const monthNames = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const monthRangeMatch = str.match(/([a-zA-Z]{3,9})[-to\s]+([a-zA-Z]{3,9})\s+(\d{4})/i);
  if (monthRangeMatch) {
    const m1 = monthNames[monthRangeMatch[1].toLowerCase().slice(0, 3)] || '01';
    const m2 = monthNames[monthRangeMatch[2].toLowerCase().slice(0, 3)] || '01';
    const yr = monthRangeMatch[3];
    return {
      isoDate: `${yr}-${m1}`,
      displayDate: str,
      startDate: `${yr}-${m1}-01`,
      endDate: `${yr}-${m2}-28`,
      rawText: str
    };
  }

  // Just Year (e.g. "2025")
  if (/^\d{4}$/.test(str)) {
    return {
      isoDate: str,
      displayDate: str,
      startDate: `${str}-01-01`,
      endDate: `${str}-12-31`,
      rawText: str
    };
  }

  // Return raw text safely without fabricating days
  return {
    isoDate: null,
    displayDate: str,
    startDate: null,
    endDate: null,
    rawText: str
  };
}
