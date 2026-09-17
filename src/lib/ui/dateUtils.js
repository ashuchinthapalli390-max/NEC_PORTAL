/**
 * NEC Portal — Centralized Date Utility
 *
 * All user-visible date formatting must use formatDateDDMMYYYY().
 * Internal storage, API, <input type="date">, and sortable keys remain ISO (YYYY-MM-DD).
 *
 * Rules:
 *  - Never run a date-only string through UTC Date() to avoid day-shift bugs.
 *  - For display-only, split on 'T' and reorder segments directly.
 *  - Multi-day / date range strings (e.g. "11-18-JUN-2026", "29/6 to 4/7/2026")
 *    are automatically parsed into startDate and endDate (last date).
 *  - By default, single-date displays use the LAST DATE (end date) as the default.
 */

const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

/**
 * Parses any date or date-range input into separated startDate, endDate, and lastDate.
 *
 * Supported range formats:
 *  - "11-18-JUN-2026" / "11-18-Jun-2026"
 *  - "29/6 to 4/7/2026" / "6/29 TO 7/4/2026"
 *  - "11 to 18 Jun 2026"
 *  - "2026-06-11 to 2026-06-18" / "2026-06-11 - 2026-06-18"
 *  - "11-06-2026 to 18-06-2026" / "11/06/2026 - 18/06/2026"
 *
 * @param {string|Date|null|undefined} input
 * @returns {{
 *   startDate: string,
 *   endDate: string,
 *   lastDate: string,
 *   startDateDisplay: string,
 *   endDateDisplay: string,
 *   lastDateDisplay: string,
 *   isRange: boolean,
 *   raw: string
 * }}
 */
export function parseDateRange(input) {
  if (!input && input !== 0) {
    return {
      startDate: '',
      endDate: '',
      lastDate: '',
      startDateDisplay: '—',
      endDateDisplay: '—',
      lastDateDisplay: '—',
      isRange: false,
      raw: ''
    };
  }

  if (input instanceof Date) {
    const y = input.getFullYear();
    const m = String(input.getMonth() + 1).padStart(2, '0');
    const d = String(input.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    const display = `${d}-${m}-${y}`;
    return {
      startDate: iso,
      endDate: iso,
      lastDate: iso,
      startDateDisplay: display,
      endDateDisplay: display,
      lastDateDisplay: display,
      isRange: false,
      raw: String(input)
    };
  }

  const str = String(input).trim();

  // Pattern 1: "11-18-JUN-2026" or "11-18-Jun-2026"
  const m1 = str.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})\s*[-–/]\s*([A-Za-z]+)\s*[-–/]\s*(\d{4})$/i);
  if (m1) {
    const d1 = String(m1[1]).padStart(2, '0');
    const d2 = String(m1[2]).padStart(2, '0');
    const month = MONTH_MAP[m1[3].toLowerCase().slice(0, 3)] || '01';
    const year = m1[4];
    const sDate = `${year}-${month}-${d1}`;
    const eDate = `${year}-${month}-${d2}`;
    return {
      startDate: sDate,
      endDate: eDate,
      lastDate: eDate,
      startDateDisplay: `${d1}-${month}-${year}`,
      endDateDisplay: `${d2}-${month}-${year}`,
      lastDateDisplay: `${d2}-${month}-${year}`,
      isRange: true,
      raw: str
    };
  }

  // Pattern 2: "11 to 18 Jun 2026"
  const m2 = str.match(/^(\d{1,2})\s*(?:to|[-–])\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i);
  if (m2) {
    const d1 = String(m2[1]).padStart(2, '0');
    const d2 = String(m2[2]).padStart(2, '0');
    const month = MONTH_MAP[m2[3].toLowerCase().slice(0, 3)] || '01';
    const year = m2[4];
    const sDate = `${year}-${month}-${d1}`;
    const eDate = `${year}-${month}-${d2}`;
    return {
      startDate: sDate,
      endDate: eDate,
      lastDate: eDate,
      startDateDisplay: `${d1}-${month}-${year}`,
      endDateDisplay: `${d2}-${month}-${year}`,
      lastDateDisplay: `${d2}-${month}-${year}`,
      isRange: true,
      raw: str
    };
  }

  // Pattern 3: Range with 'to' or '-' (e.g. "29/6 to 4/7/2026", "6/29 TO 7/4/2026")
  if (/\bto\b/i.test(str)) {
    const parts = str.split(/\s+to\s+/i).map(s => s.trim());
    if (parts.length === 2) {
      const p1 = parts[0];
      const p2 = parts[1];

      const matchP2 = p2.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
      if (matchP2) {
        const year = matchP2[3];
        const n1_2 = Number(matchP2[1]);
        const n2_2 = Number(matchP2[2]);

        const matchP1 = p1.match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{4}))?$/);
        if (matchP1) {
          const n1_1 = Number(matchP1[1]);
          const n2_1 = Number(matchP1[2]);
          const y1 = matchP1[3] || year;

          let d1, mth1, d2, mth2;

          if (n1_1 > 12) {
            d1 = n1_1;
            mth1 = n2_1;
            if (n1_2 > 12) { d2 = n1_2; mth2 = n2_2; }
            else if (n2_2 > 12) { mth2 = n1_2; d2 = n2_2; }
            else { d2 = n1_2; mth2 = n2_2; }
          } else if (n2_1 > 12) {
            mth1 = n1_1;
            d1 = n2_1;
            if (n2_2 > 12) { mth2 = n1_2; d2 = n2_2; }
            else { mth2 = n1_2; d2 = n2_2; }
          } else {
            d1 = n1_1;
            mth1 = n2_1;
            d2 = n1_2;
            mth2 = n2_2;
          }

          const sDate = `${y1}-${String(mth1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`;
          const eDate = `${year}-${String(mth2).padStart(2, '0')}-${String(d2).padStart(2, '0')}`;
          const sDisp = `${String(d1).padStart(2, '0')}-${String(mth1).padStart(2, '0')}-${y1}`;
          const eDisp = `${String(d2).padStart(2, '0')}-${String(mth2).padStart(2, '0')}-${year}`;

          return {
            startDate: sDate,
            endDate: eDate,
            lastDate: eDate,
            startDateDisplay: sDisp,
            endDateDisplay: eDisp,
            lastDateDisplay: eDisp,
            isRange: true,
            raw: str
          };
        }
      }
    }
  }

  // Pattern 4: Full ISO range "YYYY-MM-DD to YYYY-MM-DD" or "YYYY-MM-DD - YYYY-MM-DD"
  const m4 = str.match(/^(\d{4}-\d{2}-\d{2})\s*(?:to|[-–])\s*(\d{4}-\d{2}-\d{2})$/i);
  if (m4) {
    const sDisp = m4[1].split('-').reverse().join('-');
    const eDisp = m4[2].split('-').reverse().join('-');
    return {
      startDate: m4[1],
      endDate: m4[2],
      lastDate: m4[2],
      startDateDisplay: sDisp,
      endDateDisplay: eDisp,
      lastDateDisplay: eDisp,
      isRange: true,
      raw: str
    };
  }

  // Pattern 5: Full DD-MM-YYYY to DD-MM-YYYY
  const m5 = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})\s*(?:to|[-–])\s*(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/i);
  if (m5) {
    const d1 = String(m5[1]).padStart(2, '0');
    const mth1 = String(m5[2]).padStart(2, '0');
    const y1 = m5[3];
    const d2 = String(m5[4]).padStart(2, '0');
    const mth2 = String(m5[5]).padStart(2, '0');
    const y2 = m5[6];
    const sDate = `${y1}-${mth1}-${d1}`;
    const eDate = `${y2}-${mth2}-${d2}`;
    return {
      startDate: sDate,
      endDate: eDate,
      lastDate: eDate,
      startDateDisplay: `${d1}-${mth1}-${y1}`,
      endDateDisplay: `${d2}-${mth2}-${y2}`,
      lastDateDisplay: `${d2}-${mth2}-${y2}`,
      isRange: true,
      raw: str
    };
  }

  // Pattern 6: Single ISO Date or Standard String
  let cleanStr = str.split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [y, m, d] = parts;
    const disp = `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
    return {
      startDate: cleanStr,
      endDate: cleanStr,
      lastDate: cleanStr,
      startDateDisplay: disp,
      endDateDisplay: disp,
      lastDateDisplay: disp,
      isRange: false,
      raw: str
    };
  }

  // DD-MM-YYYY or DD/MM/YYYY single date
  const singleDMY = cleanStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (singleDMY) {
    const d = String(singleDMY[1]).padStart(2, '0');
    const m = String(singleDMY[2]).padStart(2, '0');
    const y = singleDMY[3];
    const iso = `${y}-${m}-${d}`;
    const disp = `${d}-${m}-${y}`;
    return {
      startDate: iso,
      endDate: iso,
      lastDate: iso,
      startDateDisplay: disp,
      endDateDisplay: disp,
      lastDateDisplay: disp,
      isRange: false,
      raw: str
    };
  }

  return {
    startDate: cleanStr,
    endDate: cleanStr,
    lastDate: cleanStr,
    startDateDisplay: cleanStr || '—',
    endDateDisplay: cleanStr || '—',
    lastDateDisplay: cleanStr || '—',
    isRange: false,
    raw: str
  };
}

/**
 * Format any date-like value for user display as DD-MM-YYYY.
 * For date ranges, uses the LAST DATE (end date) as the default format.
 *
 * @param {string|Date|null|undefined} value
 * @returns {string} e.g. "18-06-2026"
 */
export function formatDateDDMMYYYY(value) {
  if (!value && value !== 0) return '—';

  const parsed = parseDateRange(value);
  if (parsed.lastDateDisplay && parsed.lastDateDisplay !== '—') {
    return parsed.lastDateDisplay;
  }

  return String(value);
}

/**
 * Format an ISO date string for use in native <input type="date"> value prop.
 * If a range is provided, defaults to the lastDate.
 *
 * @param {string|Date|null|undefined} value
 * @returns {string} e.g. "2026-06-18" or ""
 */
export function toInputDateValue(value) {
  if (!value) return '';
  const parsed = parseDateRange(value);
  return parsed.lastDate || parsed.startDate || '';
}

/**
 * Get today's date as an ISO string (YYYY-MM-DD) for use as default input values.
 *
 * @returns {string}
 */
export function todayISO() {
  return toInputDateValue(new Date());
}

/**
 * Check if a record date falls within an optional from/to range.
 * If dateStr is a date range, checks for overlap with [fromDate, toDate].
 *
 * @param {string} dateStr
 * @param {string} fromDate
 * @param {string} toDate
 * @returns {boolean}
 */
export function isInDateRange(dateStr, fromDate, toDate) {
  if (!dateStr) return true;

  const parsed = parseDateRange(dateStr);
  const start = parsed.startDate || String(dateStr).split('T')[0];
  const end = parsed.endDate || parsed.lastDate || start;

  if (fromDate && end < fromDate) return false;
  if (toDate && start > toDate) return false;
  return true;
}

/**
 * Alias for isInDateRange — preferred export name for modules.
 */
export const isDateInRange = isInDateRange;
