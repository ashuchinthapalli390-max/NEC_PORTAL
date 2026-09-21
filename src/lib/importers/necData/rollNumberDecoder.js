/**
 * rollNumberDecoder.js
 * Comprehensive decoder and normalizer for Narasaraopeta Engineering College roll numbers.
 *
 * Example Roll Numbers:
 * - 22471A4201: 2022 batch, Regular B.Tech (471), Degree B.Tech (A), Branch 42 (CSE-AIML), Serial 01
 * - 23471A4405: 2023 batch, Regular B.Tech (471), Degree B.Tech (A), Branch 44 (CSE-DS), Serial 05
 * - 23471A4612: 2023 batch, Regular B.Tech (471), Degree B.Tech (A), Branch 46 (CSE-CS), Serial 12
 * - 23471A6101: 2023 batch, Regular B.Tech (471), Degree B.Tech (A), Branch 61 (AIML), Serial 01
 * - 24475A4203: 2024 batch, Lateral Entry (475), Degree B.Tech (A), Branch 42 (CSE-AIML), Serial 03
 */

export const BRANCH_CODES = {
  '42': { code: 'CSE(AIML)', name: 'Computer Science & Engineering (AI & ML)', canonicalId: 'csm' },
  '43': { code: 'CSE(AI)', name: 'Computer Science & Engineering (Artificial Intelligence)', canonicalId: 'ai' },
  '44': { code: 'CSE(DS)', name: 'Computer Science & Engineering (Data Science)', canonicalId: 'ds' },
  '46': { code: 'CSE(CS)', name: 'Computer Science & Engineering (Cyber Security)', canonicalId: 'cys' },
  '61': { code: 'AIML', name: 'Artificial Intelligence & Machine Learning', canonicalId: 'aiml' }
};

/**
 * Normalizes a raw roll number string: trims, uppercases, removes internal spaces.
 */
export function normalizeRollNumber(raw) {
  if (!raw) return '';
  return String(raw).trim().toUpperCase().replace(/[\s\-_]+/g, '');
}

/**
 * Validates whether a string is a standard NEC roll number pattern.
 */
export function isValidNecRollNumber(raw) {
  const norm = normalizeRollNumber(raw);
  return /^2[0-9]47[15][A-Z][0-9A-Z]{2}[0-9A-Z]{2}$/.test(norm);
}

/**
 * Decodes an NEC roll number into structured attributes.
 */
export function decodeNecRollNumber(raw) {
  const rollNumber = normalizeRollNumber(raw);
  if (!rollNumber) {
    return {
      isValid: false,
      rollNumber: '',
      error: 'EMPTY_ROLL_NUMBER'
    };
  }

  // Regex breakdown:
  // (1-2): Admission Year (e.g. "22" -> 2022)
  // (3-5): College & Entry Code ("471" = Regular NEC, "475" = Lateral Entry NEC)
  // (6): Degree ("A" = B.Tech)
  // (7-8): Branch Code ("42", "43", "44", "46", "61")
  // (9-10): Serial identifier (e.g. "01", "A5")
  const match = rollNumber.match(/^(\d{2})(47[15])([A-Za-z])([0-9A-Za-z]{2})([0-9A-Za-z]{2})$/);

  if (!match) {
    return {
      isValid: false,
      rollNumber,
      error: 'INVALID_ROLL_NUMBER_PATTERN'
    };
  }

  const yearDigits = parseInt(match[1], 10);
  const admissionYear = 2000 + yearDigits;
  const entryTypeCode = match[2];
  const isLateral = entryTypeCode === '475';
  const entryType = isLateral ? 'Lateral Entry' : 'Regular Entry';
  const collegeCode = '47'; // NEC JNTUK college identifier
  const degreeChar = match[3].toUpperCase();
  const degree = degreeChar === 'A' ? 'B.Tech' : 'Degree ' + degreeChar;
  const branchCode = match[4].toUpperCase();
  const serial = match[5].toUpperCase();

  const branchMeta = BRANCH_CODES[branchCode] || {
    code: `BRANCH_${branchCode}`,
    name: `Branch Code ${branchCode}`,
    canonicalId: branchCode.toLowerCase()
  };

  // Expected graduation year (Regular: +4 years, Lateral: +3 years)
  const graduationYear = isLateral ? admissionYear + 3 : admissionYear + 4;
  const batchString = isLateral ? `${admissionYear - 1}-${graduationYear}` : `${admissionYear}-${graduationYear}`;

  return {
    isValid: true,
    rollNumber,
    admissionYear,
    entryTypeCode,
    isLateral,
    entryType,
    collegeCode,
    degree,
    branchCode,
    departmentCode: branchMeta.code,
    departmentName: branchMeta.name,
    canonicalDeptId: branchMeta.canonicalId,
    serial,
    batch: `${admissionYear} Batch`,
    batchCohort: batchString
  };
}
