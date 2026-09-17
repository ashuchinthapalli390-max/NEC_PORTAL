/**
 * NEC Portal — Mid Exam Template Parser
 *
 * Canonical template structure (matches generateBlankMidTemplateXLSX):
 *   Sheet: INFO (or SUMMARY)        — metadata key-value pairs
 *   Sheet: ASSIGNMENT-1             — S.No, H.T.NO, ..., Reduced (/5)
 *   Sheet: MID-1                    — S.No, H.T.NO, ..., DES Reduced (/15), SAQ Total (/10)
 *   Sheet: ASSIGNMENT-2             — S.No, H.T.NO, ..., Reduced (/5)
 *   Sheet: MID-2                    — S.No, H.T.NO, ..., DES Reduced (/15), SAQ Total (/10)
 *
 * The parser is tolerant of extra derived sheets (ANALYSIS-1, WEAK STUDENTS, etc.).
 * It reads raw marks only from the authoritative source sheets above.
 */

import * as XLSX from 'xlsx';

// ─── Schema Definition ────────────────────────────────────────────────────────

/**
 * Canonical Mid Exam Template Schema
 */
export const MID_EXAM_TEMPLATE_SCHEMA = {
  infoSheets: ['INFO', 'SUMMARY', 'METADATA', 'COURSE INFO'],

  marksSheets: {
    ASSIGNMENT_1: ['ASSIGNMENT-1', 'ASS-1', 'ASSIGNMENT 1', 'ASSIGNMENT1', 'ASS1'],
    MID_1:        ['MID-1', 'MID1', 'MID I', 'MID-I', 'MIDTERM-1'],
    ASSIGNMENT_2: ['ASSIGNMENT-2', 'ASS-2', 'ASSIGNMENT 2', 'ASSIGNMENT2', 'ASS2'],
    MID_2:        ['MID-2', 'MID2', 'MID II', 'MID-II', 'MIDTERM-2'],
  },

  rollNumberColumns: ['H.T.NO', 'HTNO', 'ROLL NO', 'ROLL NUMBER', 'HALLTICKET', 'HALL TICKET NO', 'REG NO', 'REGD NO'],

  // For assignment sheets: the reduced/final mark is in the last numeric column or named 'Reduced'
  assignmentReducedColumns: ['REDUCED (/5)', 'REDUCED', 'REDUCED MARKS', 'TOTAL (/5)', '/5', 'ASS MARKS', 'ASSIGNMENT MARKS'],

  // For mid exam sheets
  desReducedColumns:        ['DES REDUCED (/15)', 'DES REDUCED', 'DESCRIPTIVE (/15)', 'DESCRIPTIVE REDUCED', '/15', 'DES MARKS'],
  saqTotalColumns:          ['SAQ TOTAL (/10)', 'SAQ TOTAL', 'SAQ (/10)', 'SAQ MARKS', '/10', 'SAQ'],

  // Info sheet metadata keys
  metadataMap: {
    department:         ['DEPARTMENT', 'DEPT', 'DEPT NAME', 'DEPARTMENT NAME'],
    departmentCode:     ['DEPARTMENT CODE', 'DEPT CODE', 'DEPT COD'],
    academicYear:       ['ACADEMIC YEAR', 'AY', 'ACAD YEAR', 'ACADEMIC YEAR:'],
    regulation:         ['REGULATION', 'REG', 'REGULATIONS'],
    batch:              ['BATCH', 'ADMISSION BATCH', 'ENTRY BATCH'],
    year:               ['YEAR', 'ACADEMIC LEVEL', 'STUDENT YEAR'],
    semester:           ['SEMESTER', 'SEM', 'SEMESTER:'],
    subjectName:        ['SUBJECT NAME', 'SUBJECT', 'COURSE NAME', 'COURSE'],
    subjectCode:        ['SUBJECT CODE', 'COURSE CODE', 'SUBJECT CODE:', 'SUB CODE'],
    mid1Date:           ['MID-I EXAMINATION DATE', 'MID-1 EXAMINATION DATE', 'MID1 DATE', 'MID I DATE'],
    mid2Date:           ['MID-II EXAMINATION DATE', 'MID-2 EXAMINATION DATE', 'MID2 DATE', 'MID II DATE'],
  },

  maxMarks: {
    assignment: 5,
    saq: 10,
    descriptive: 15,
    total: 30,
  },

  thresholds: {
    advanced: 80,   // >= 80% = Advanced Learner
    weak: 50,       // < 50% = Weak Learner
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeSheetName(name) {
  return String(name || '').trim().toUpperCase();
}

function normalizeHeader(h) {
  return String(h || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function normalizeRoll(r) {
  return String(r || '').trim().toUpperCase().replace(/\s+/g, '');
}

function findSheet(workbook, candidates) {
  const names = workbook.SheetNames.map(n => ({ orig: n, norm: normalizeSheetName(n) }));
  for (const candidate of candidates) {
    const norm = normalizeSheetName(candidate);
    const found = names.find(n => n.norm === norm || n.norm.includes(norm) || norm.includes(n.norm));
    if (found) return workbook.Sheets[found.orig];
  }
  return null;
}

function findColumnIndex(headers, candidates) {
  for (const candidate of candidates) {
    const norm = normalizeHeader(candidate);
    const idx = headers.findIndex(h => normalizeHeader(h) === norm || normalizeHeader(h).includes(norm) || norm.includes(normalizeHeader(h)));
    if (idx >= 0) return idx;
  }
  return -1;
}

/**
 * Parse a cell value as a mark — number, absent flag, or null.
 * Returns: number | 'AB' | null
 */
function parseMarkValue(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const s = String(raw).trim().toUpperCase();
  if (s === 'AB' || s === 'A' || s === 'ABSENT' || s === '-') return 'AB';
  const n = Number(raw);
  if (!isNaN(n)) return n;
  return null; // Unparseable
}

/**
 * Convert a worksheet to an array of row arrays.
 * skipEmpty: whether to skip rows where ALL cells are empty
 */
function sheetToRows(sheet, skipEmpty = true) {
  if (!sheet) return [];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false });
  if (!skipEmpty) return data;
  return data.filter(row => row.some(cell => cell !== null && cell !== ''));
}

/**
 * Find the actual header row (first row containing a roll-number-column candidate).
 * Returns { headerRowIdx, headers, rollColIdx } or null if not found.
 */
function findHeaderRow(rows) {
  const { rollNumberColumns } = MID_EXAM_TEMPLATE_SCHEMA;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!row) continue;
    const rollIdx = findColumnIndex(row, rollNumberColumns);
    if (rollIdx >= 0) {
      return { headerRowIdx: i, headers: row, rollColIdx: rollIdx };
    }
  }
  return null;
}

// ─── Info Sheet Parser ────────────────────────────────────────────────────────

function parseInfoSheet(sheet) {
  const rows = sheetToRows(sheet, false);
  const meta = {};
  const { metadataMap } = MID_EXAM_TEMPLATE_SCHEMA;

  rows.forEach(row => {
    if (!row || row.length < 2) return;
    const key = normalizeHeader(row[0]);
    const val = row[1] !== null && row[1] !== undefined ? String(row[1]).trim() : null;
    if (!val) return;

    for (const [field, candidates] of Object.entries(metadataMap)) {
      if (meta[field]) continue; // Already found
      if (candidates.some(c => normalizeHeader(c) === key || normalizeHeader(c).includes(key) || key.includes(normalizeHeader(c)))) {
        meta[field] = val;
      }
    }
  });

  return meta;
}

// ─── Assignment Sheet Parser ──────────────────────────────────────────────────

/**
 * Parses ASSIGNMENT-1 or ASSIGNMENT-2 sheet.
 * Returns Map<rollNumber, mark | 'AB' | null>
 */
function parseAssignmentSheet(sheet) {
  const marks = new Map();
  if (!sheet) return marks;

  const rows = sheetToRows(sheet);
  const headerInfo = findHeaderRow(rows);
  if (!headerInfo) return marks;

  const { headerRowIdx, headers, rollColIdx } = headerInfo;
  const reducedColIdx = findColumnIndex(headers, MID_EXAM_TEMPLATE_SCHEMA.assignmentReducedColumns);

  // If no explicit 'Reduced' column, fall back to last numeric-looking column
  const lastNumericColIdx = headers.reduce((acc, h, i) => {
    if (i > rollColIdx && normalizeHeader(h) !== 'S.NO' && normalizeHeader(h) !== 'SNO') {
      return i;
    }
    return acc;
  }, reducedColIdx);

  const finalColIdx = reducedColIdx >= 0 ? reducedColIdx : lastNumericColIdx;

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const rollRaw = row[rollColIdx];
    if (!rollRaw) continue;
    const roll = normalizeRoll(rollRaw);
    if (!roll || roll === 'S.NO' || roll === 'SNO' || roll === 'TOTAL') continue;

    const markRaw = finalColIdx >= 0 ? row[finalColIdx] : null;
    marks.set(roll, parseMarkValue(markRaw));
  }

  return marks;
}

// ─── Mid Sheet Parser ─────────────────────────────────────────────────────────

/**
 * Parses MID-1 or MID-2 sheet.
 * Returns Map<rollNumber, { saq: number|'AB'|null, des: number|'AB'|null }>
 */
function parseMidSheet(sheet) {
  const data = new Map();
  if (!sheet) return data;

  const rows = sheetToRows(sheet);
  const headerInfo = findHeaderRow(rows);
  if (!headerInfo) return data;

  const { headerRowIdx, headers, rollColIdx } = headerInfo;

  const saqColIdx = findColumnIndex(headers, MID_EXAM_TEMPLATE_SCHEMA.saqTotalColumns);
  const desColIdx = findColumnIndex(headers, MID_EXAM_TEMPLATE_SCHEMA.desReducedColumns);

  // Fallback: if header columns not found, try to use the last two numeric columns
  // (DES Reduced is typically second-to-last, SAQ Total is typically last)
  let resolvedDesIdx = desColIdx;
  let resolvedSaqIdx = saqColIdx;

  if (resolvedDesIdx < 0 || resolvedSaqIdx < 0) {
    const numericCols = headers
      .map((h, i) => i)
      .filter(i => i > rollColIdx && normalizeHeader(headers[i]) !== 'S.NO');
    if (numericCols.length >= 2 && resolvedDesIdx < 0) {
      resolvedDesIdx = numericCols[numericCols.length - 2];
    }
    if (numericCols.length >= 1 && resolvedSaqIdx < 0) {
      resolvedSaqIdx = numericCols[numericCols.length - 1];
    }
  }

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const rollRaw = row[rollColIdx];
    if (!rollRaw) continue;
    const roll = normalizeRoll(rollRaw);
    if (!roll || roll === 'S.NO' || roll === 'SNO' || roll === 'TOTAL') continue;

    const saqRaw = resolvedSaqIdx >= 0 ? row[resolvedSaqIdx] : null;
    const desRaw = resolvedDesIdx >= 0 ? row[resolvedDesIdx] : null;

    data.set(roll, {
      saq: parseMarkValue(saqRaw),
      des: parseMarkValue(desRaw),
    });
  }

  return data;
}

// ─── Student Classification ───────────────────────────────────────────────────

function classifyStudent(mid1Total, mid1Percentage) {
  if (mid1Percentage >= MID_EXAM_TEMPLATE_SCHEMA.thresholds.advanced) return 'Advanced Learner';
  if (mid1Percentage < MID_EXAM_TEMPLATE_SCHEMA.thresholds.weak) return 'Weak Learner';
  return 'Regular';
}

function isAbsent(v) {
  return v === 'AB' || v === null;
}

function toNum(v) {
  if (isAbsent(v)) return 0;
  return typeof v === 'number' ? v : Number(v) || 0;
}

// ─── Student Matching ─────────────────────────────────────────────────────────

/**
 * Match parsed roll numbers against the Student Master.
 * Returns enriched student data.
 * 
 * @param {string[]} rollNumbers
 * @param {Array} studentsMaster
 * @returns {{ matched: Map, unmatchedRolls: string[] }}
 */
function matchStudents(rollNumbers, studentsMaster = []) {
  const matchMap = new Map(); // roll -> { fullName, departmentCode }
  const unmatchedRolls = [];

  for (const roll of rollNumbers) {
    const found = studentsMaster.find(sm =>
      normalizeRoll(sm.rollNumber || sm.registrationNumber || '') === roll
    );
    if (found) {
      matchMap.set(roll, {
        fullName: found.fullName || found.name || null,
        departmentCode: found.departmentCode || found.department || null,
      });
    } else {
      unmatchedRolls.push(roll);
    }
  }

  return { matchMap, unmatchedRolls };
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

/**
 * Parse a Mid Exam Excel workbook ArrayBuffer.
 *
 * @param {ArrayBuffer} arrayBuffer
 * @param {Array} studentsMaster — from getStudents()
 * @returns {ParseResult}
 *
 * ParseResult = {
 *   status: 'SUCCESS' | 'WARNING' | 'ERROR',
 *   errors: string[],
 *   warnings: string[],
 *   metadata: {
 *     department, departmentCode, academicYear, regulation, batch,
 *     year, semester, subjectName, subjectCode, mid1Date, mid2Date
 *   },
 *   sheetsFound: { info, assignment1, mid1, assignment2, mid2 },
 *   students: StudentRecord[],
 *   stats: { total, matched, unmatched, advanced, weak, regular }
 *   stableKey: string — for duplicate detection
 * }
 *
 * StudentRecord = {
 *   rollNumber, studentName, isMatched,
 *   assignment1, mid1Saq, mid1Descriptive, mid1Total, mid1Percentage,
 *   assignment2, mid2Saq, mid2Descriptive, mid2Total, mid2Percentage,
 *   classification, isAbsentMid1, absenceNote
 * }
 */
export function parseMidExamWorkbook(arrayBuffer, studentsMaster = []) {
  const errors = [];
  const warnings = [];

  // 1. Read workbook
  let workbook;
  try {
    workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellFormula: false, // Use computed values
      cellDates: true,
      cellNF: false,
    });
  } catch (err) {
    return {
      status: 'ERROR',
      errors: [`Could not read workbook: ${err.message}`],
      warnings: [],
      metadata: {},
      sheetsFound: {},
      students: [],
      stats: { total: 0, matched: 0, unmatched: 0, advanced: 0, weak: 0, regular: 0 },
      stableKey: null,
    };
  }

  const { infoSheets, marksSheets } = MID_EXAM_TEMPLATE_SCHEMA;

  // 2. Identify sheets
  const infoSheet = findSheet(workbook, infoSheets);
  const ass1Sheet = findSheet(workbook, marksSheets.ASSIGNMENT_1);
  const mid1Sheet = findSheet(workbook, marksSheets.MID_1);
  const ass2Sheet = findSheet(workbook, marksSheets.ASSIGNMENT_2);
  const mid2Sheet = findSheet(workbook, marksSheets.MID_2);

  const sheetsFound = {
    info: !!infoSheet,
    assignment1: !!ass1Sheet,
    mid1: !!mid1Sheet,
    assignment2: !!ass2Sheet,
    mid2: !!mid2Sheet,
  };

  // 3. Required: at least MID-1 must be present
  if (!mid1Sheet) {
    errors.push('Required sheet MID-1 (or MID-I) not found. Workbook structure is not recognized.');
  }
  if (!ass1Sheet) {
    warnings.push('ASSIGNMENT-1 sheet not found; assignment marks will be treated as missing.');
  }
  if (!ass2Sheet) {
    warnings.push('ASSIGNMENT-2 sheet not found; Mid-II assignment marks unavailable.');
  }
  if (!mid2Sheet) {
    warnings.push('MID-2 sheet not found; Mid-II exam marks unavailable.');
  }
  if (!infoSheet) {
    warnings.push('INFO/SUMMARY sheet not found; subject metadata will need manual confirmation.');
  }

  if (errors.length > 0) {
    return {
      status: 'ERROR',
      errors,
      warnings,
      metadata: {},
      sheetsFound,
      students: [],
      stats: { total: 0, matched: 0, unmatched: 0, advanced: 0, weak: 0, regular: 0 },
      stableKey: null,
    };
  }

  // 4. Parse metadata
  const metadata = infoSheet ? parseInfoSheet(infoSheet) : {};

  // 5. Parse marks
  const ass1Marks = parseAssignmentSheet(ass1Sheet);  // Map<roll, mark|'AB'|null>
  const mid1Data  = parseMidSheet(mid1Sheet);         // Map<roll, {saq, des}>
  const ass2Marks = parseAssignmentSheet(ass2Sheet);  // Map<roll, mark|'AB'|null>
  const mid2Data  = parseMidSheet(mid2Sheet);         // Map<roll, {saq, des}>

  // 6. Collect all unique roll numbers (from MID-1 as primary)
  const allRolls = Array.from(new Set([
    ...Array.from(mid1Data.keys()),
    ...Array.from(ass1Marks.keys()),
  ])).filter(Boolean);

  if (allRolls.length === 0) {
    errors.push('No student roll numbers detected in the workbook. Ensure the H.T.NO column is correctly populated.');
    return {
      status: 'ERROR',
      errors,
      warnings,
      metadata,
      sheetsFound,
      students: [],
      stats: { total: 0, matched: 0, unmatched: 0, advanced: 0, weak: 0, regular: 0 },
      stableKey: null,
    };
  }

  // 7. Match against student master
  const { matchMap, unmatchedRolls } = matchStudents(allRolls, studentsMaster);

  if (unmatchedRolls.length > 0) {
    warnings.push(
      `${unmatchedRolls.length} roll number(s) not found in Student Master: ${unmatchedRolls.slice(0, 5).join(', ')}${unmatchedRolls.length > 5 ? ' …' : ''}. Records are included but names will be unavailable.`
    );
  }

  // 8. Validate for duplicates within the workbook
  const rollSet = new Set();
  const duplicateRolls = [];
  for (const roll of allRolls) {
    if (rollSet.has(roll)) duplicateRolls.push(roll);
    rollSet.add(roll);
  }
  if (duplicateRolls.length > 0) {
    errors.push(`Duplicate roll numbers detected: ${duplicateRolls.join(', ')}. Please fix the source file.`);
  }

  if (errors.length > 0) {
    return {
      status: 'ERROR', errors, warnings, metadata, sheetsFound,
      students: [], stats: { total: 0, matched: 0, unmatched: 0, advanced: 0, weak: 0, regular: 0 },
      stableKey: null,
    };
  }

  // 9. Build student records
  const students = allRolls.map(roll => {
    const masterInfo = matchMap.get(roll);
    const ass1 = ass1Marks.get(roll) ?? null;
    const mid1 = mid1Data.get(roll) || { saq: null, des: null };
    const ass2 = ass2Marks.get(roll) ?? null;
    const mid2 = mid2Data.get(roll) || { saq: null, des: null };

    const ass1IsAbsent = isAbsent(ass1);
    const saqIsAbsent  = isAbsent(mid1.saq);
    const desIsAbsent  = isAbsent(mid1.des);

    const ass1Num = toNum(ass1);
    const saqNum  = toNum(mid1.saq);
    const desNum  = toNum(mid1.des);

    const mid1Total = ass1Num + saqNum + desNum;
    const mid1Pct   = Number(((mid1Total / MID_EXAM_TEMPLATE_SCHEMA.maxMarks.total) * 100).toFixed(2));

    const classification = classifyStudent(mid1Total, mid1Pct);

    const absenceParts = [];
    if (ass1IsAbsent) absenceParts.push('Absent in Assignment-1');
    if (saqIsAbsent) absenceParts.push('Absent in SAQ');
    if (desIsAbsent) absenceParts.push('Absent in Descriptive');
    const absenceNote = absenceParts.join('; ');

    // Excel total cross-validation
    // (No explicit total column parsed; recalculated from components — always safe)

    return {
      rollNumber:       roll,
      studentName:      masterInfo?.fullName || null,
      isMatched:        !!masterInfo,
      assignment1:      ass1IsAbsent ? 'AB' : ass1Num,
      mid1Saq:          saqIsAbsent  ? 'AB' : saqNum,
      mid1Descriptive:  desIsAbsent  ? 'AB' : desNum,
      mid1Total,
      mid1Percentage:   mid1Pct,
      classification,
      isAbsentMid1:     ass1IsAbsent || saqIsAbsent || desIsAbsent,
      absenceNote,
      // Mid-II (optional)
      assignment2:      ass2 !== undefined && ass2 !== null ? (isAbsent(ass2) ? 'AB' : toNum(ass2)) : null,
      mid2Saq:          mid2.saq !== null ? (isAbsent(mid2.saq) ? 'AB' : toNum(mid2.saq)) : null,
      mid2Descriptive:  mid2.des !== null ? (isAbsent(mid2.des) ? 'AB' : toNum(mid2.des)) : null,
      mid2Total:        null,
      mid2Percentage:   null,
    };
  });

  // 10. Compute stats
  const total     = students.length;
  const matched   = students.filter(s => s.isMatched).length;
  const unmatched = total - matched;
  const advanced  = students.filter(s => s.mid1Percentage >= MID_EXAM_TEMPLATE_SCHEMA.thresholds.advanced).length;
  const weak      = students.filter(s => s.mid1Percentage < MID_EXAM_TEMPLATE_SCHEMA.thresholds.weak).length;
  const regular   = total - advanced - weak;

  // 11. Build stable key for duplicate analysis detection
  const stableKey = [
    metadata.departmentCode || metadata.department || 'DEPT',
    metadata.academicYear   || 'AY',
    metadata.year           || 'YEAR',
    metadata.semester       || 'SEM',
    metadata.subjectCode    || 'SUBJ',
  ].join('_').toLowerCase().replace(/\s+/g, '-');

  const finalStatus = errors.length > 0 ? 'ERROR' : warnings.length > 0 ? 'WARNING' : 'SUCCESS';

  return {
    status: finalStatus,
    errors,
    warnings,
    metadata,
    sheetsFound,
    students,
    stats: { total, matched, unmatched, advanced, weak, regular },
    stableKey,
  };
}
