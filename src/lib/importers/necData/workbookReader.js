/**
 * workbookReader.js
 * Robust Excel workbook and sheet reader with dynamic header row discovery.
 * Prevents title banner headers (common in institutional sheets) from corrupting tabular data.
 */

import * as xlsxModule from 'xlsx';
const XLSX = xlsxModule.default || xlsxModule;

/**
 * Common column header keywords across institutional workbooks.
 */
const HEADER_KEYWORDS = [
  's.no', 's. no', 'sno', 'sl.no', 'roll number', 'roll no', 'ht no', 'hall ticket',
  'name of the student', 'student name', 'faculty name', 'name of the faculty',
  'title', 'project title', 'name of the program', 'name of the event',
  'author', 'department', 'dept', 'batch', 'course', 'score', 'package',
  'company', 'organization', 'mou', 'regulations', 'date', 'venue', 'designation'
];

/**
 * Discovers the real header row index in a sheet array of arrays.
 */
export function findHeaderRowIndex(rows, maxScan = 10) {
  if (!rows || rows.length === 0) return 0;
  
  let bestRow = 0;
  let maxScore = 0;

  for (let i = 0; i < Math.min(rows.length, maxScan); i++) {
    const row = rows[i];
    if (!Array.isArray(row) || row.length === 0) continue;

    let score = 0;
    for (const cell of row) {
      if (typeof cell === 'string') {
        const norm = cell.trim().toLowerCase().replace(/[\s\-_.]+/g, ' ');
        if (HEADER_KEYWORDS.some(kw => norm.includes(kw))) {
          score++;
        }
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestRow = i;
    }
  }

  return maxScore > 0 ? bestRow : 0;
}

/**
 * Checks if a row contains only formula zeros or empty cells.
 */
export function isFormulaZeroOrEmptyRow(rowObj) {
  if (!rowObj || typeof rowObj !== 'object') return true;
  const values = Object.values(rowObj);
  if (values.length === 0) return true;

  let hasMeaningfulData = false;
  for (const v of values) {
    if (v !== null && v !== undefined && v !== '') {
      if (typeof v === 'string') {
        const trimmed = v.trim();
        if (trimmed.length > 0 && trimmed !== '0') {
          hasMeaningfulData = true;
          break;
        }
      } else if (typeof v === 'number' && v !== 0) {
        hasMeaningfulData = true;
        break;
      }
    }
  }
  return !hasMeaningfulData;
}

/**
 * Reads a sheet into structured, sanitized object rows with normalized headers.
 */
export function readSheetRows(sheet, sheetName = '') {
  if (!sheet || !sheet['!ref']) return [];

  // Parse as raw 2D array first to dynamically locate headers
  const rawGrid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
  if (rawGrid.length === 0) return [];

  const headerIdx = findHeaderRowIndex(rawGrid);
  const rawHeaders = rawGrid[headerIdx] || [];

  // Deduplicate and clean headers
  const headers = [];
  const headerCounts = {};

  for (let c = 0; c < rawHeaders.length; c++) {
    const hCell = rawHeaders[c];
    let hName = (hCell !== null && hCell !== undefined) ? String(hCell).trim() : `COL_${c + 1}`;
    if (!hName) hName = `COL_${c + 1}`;

    if (headerCounts[hName]) {
      headerCounts[hName]++;
      headers.push(`${hName}_${headerCounts[hName]}`);
    } else {
      headerCounts[hName] = 1;
      headers.push(hName);
    }
  }

  const resultRows = [];
  for (let r = headerIdx + 1; r < rawGrid.length; r++) {
    const row = rawGrid[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const rowObj = {};
    let hasAnyValue = false;

    for (let c = 0; c < headers.length; c++) {
      const colKey = headers[c];
      const val = row[c];
      if (val !== null && val !== undefined && val !== '') {
        hasAnyValue = true;
        rowObj[colKey] = typeof val === 'string' ? val.trim() : val;
      } else {
        rowObj[colKey] = null;
      }
    }

    // Filter out completely blank or zero-only placeholder rows
    if (hasAnyValue && !isFormulaZeroOrEmptyRow(rowObj)) {
      rowObj.__rowNum = r + 1;
      rowObj.__sheetName = sheetName;
      resultRows.push(rowObj);
    }
  }

  return resultRows;
}

/**
 * Loads an entire workbook and extracts all sheets into an object map: { [sheetName]: rows[] }
 */
export function readWorkbook(filePath) {
  try {
    const wb = XLSX.readFile(filePath, { cellDates: false });
    const sheetsData = {};
    for (const sName of wb.SheetNames) {
      sheetsData[sName] = readSheetRows(wb.Sheets[sName], sName);
    }
    return {
      success: true,
      sheetNames: wb.SheetNames,
      sheets: sheetsData
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      sheetNames: [],
      sheets: {}
    };
  }
}
