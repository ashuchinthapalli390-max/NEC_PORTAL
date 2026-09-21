/**
 * departmentNormalizer.js
 * Canonical Emerging Technologies departments and institutional normalizer.
 *
 * Canonical Emerging Technologies departments:
 * 42 -> CSE(AIML)
 * 43 -> CSE(AI)
 * 44 -> CSE(DS)
 * 46 -> CSE(CS)
 * 61 -> AIML
 * Common -> Emerging Technologies / Institutional Common records
 */

export const CANONICAL_DEPARTMENTS = {
  'CSE(AIML)': {
    code: 'CSE(AIML)',
    numberCode: '42',
    aliasCode: 'CSM',
    name: 'Computer Science & Engineering (Artificial Intelligence & Machine Learning)',
    shortName: 'AI & ML',
    canonicalId: 'csm'
  },
  'CSE(AI)': {
    code: 'CSE(AI)',
    numberCode: '43',
    aliasCode: 'AI',
    name: 'Computer Science & Engineering (Artificial Intelligence)',
    shortName: 'AI',
    canonicalId: 'ai'
  },
  'CSE(DS)': {
    code: 'CSE(DS)',
    numberCode: '44',
    aliasCode: 'CSD',
    name: 'Computer Science & Engineering (Data Science)',
    shortName: 'Data Science',
    canonicalId: 'ds'
  },
  'CSE(CS)': {
    code: 'CSE(CS)',
    numberCode: '46',
    aliasCode: 'CSC',
    name: 'Computer Science & Engineering (Cyber Security)',
    shortName: 'Cyber Security',
    canonicalId: 'cys'
  },
  'AIML': {
    code: 'AIML',
    numberCode: '61',
    aliasCode: 'AIML',
    name: 'Artificial Intelligence & Machine Learning',
    shortName: 'AIML',
    canonicalId: 'aiml'
  },
  'Common': {
    code: 'Institution Level',
    numberCode: 'ET',
    aliasCode: 'INST',
    name: 'Institution Level',
    shortName: 'Institution Level',
    canonicalId: 'institution_level'
  }
};

/**
 * Normalizes any department alias, number code, or folder name to a canonical department.
 */
export function normalizeDepartment(raw) {
  if (!raw && raw !== 0) {
    return {
      canonicalCode: 'Institution Level',
      name: 'Institution Level',
      isET: true,
      raw: ''
    };
  }

  const s = String(raw).trim().toLowerCase().replace(/[\s\-_/\\()&]+/g, ' ');

  // 1. AIML (Independent branch 61 or explicit mention)
  if (
    s === '61' ||
    s === 'aiml' ||
    s === 'department of aiml' ||
    s === 'dept of aiml' ||
    s === 'b tech aiml'
  ) {
    return {
      code: 'AIML',
      canonicalCode: 'AIML',
      shortName: 'AIML',
      name: CANONICAL_DEPARTMENTS['AIML'].name,
      isET: true,
      raw: String(raw).trim()
    };
  }

  // 2. CSE(AIML) (Branch 42, CSM)
  if (
    s === '42' ||
    s === 'csm' ||
    s.includes('csm') ||
    s.includes('cse aiml') ||
    s.includes('cse ai ml') ||
    s.includes('cse ai and ml') ||
    s.includes('cse ai machine learning') ||
    s.includes('cse artificial intelligence and machine learning') ||
    s.includes('cse artificial intelligence machine learning')
  ) {
    return {
      code: 'CSE(AIML)',
      canonicalCode: 'CSE(AIML)',
      shortName: 'CSE(AIML)',
      name: CANONICAL_DEPARTMENTS['CSE(AIML)'].name,
      isET: true,
      raw: String(raw).trim()
    };
  }

  // 3. CSE(AI) (Branch 43)
  if (
    s === '43' ||
    s === 'ai' ||
    s === 'cse ai' ||
    s === 'cse artificial intelligence' ||
    s.includes('cse ai') ||
    s.includes('cse artificial intelligence')
  ) {
    return {
      code: 'CSE(AI)',
      canonicalCode: 'CSE(AI)',
      shortName: 'CSE(AI)',
      name: CANONICAL_DEPARTMENTS['CSE(AI)'].name,
      isET: true,
      raw: String(raw).trim()
    };
  }

  // 4. CSE(DS) (Branch 44, CSD)
  if (
    s === '44' ||
    s === 'csd' ||
    s === 'ds' ||
    s.includes('csd') ||
    s.includes('cse ds') ||
    s.includes('cse data science') ||
    s.includes('data science')
  ) {
    return {
      code: 'CSE(DS)',
      canonicalCode: 'CSE(DS)',
      shortName: 'CSE(DS)',
      name: CANONICAL_DEPARTMENTS['CSE(DS)'].name,
      isET: true,
      raw: String(raw).trim()
    };
  }

  // 5. CSE(CS) (Branch 46, CSC, CYS)
  if (
    s === '46' ||
    s === 'csc' ||
    s === 'cys' ||
    s === 'cs' ||
    s.includes('csc') ||
    s.includes('cys') ||
    s.includes('cyber') ||
    s.includes('cse cs') ||
    s.includes('cse cyber')
  ) {
    return {
      code: 'CSE(CS)',
      canonicalCode: 'CSE(CS)',
      shortName: 'CSE(CS)',
      name: CANONICAL_DEPARTMENTS['CSE(CS)'].name,
      isET: true,
      raw: String(raw).trim()
    };
  }

  // 6. Common / Central / ET / Institutional
  if (
    s === 'common' ||
    s === 'et' ||
    s === 'cse et' ||
    s === 'cse emerging technologies' ||
    s.includes('emerging technologies') ||
    s === 'all' ||
    s === 'institution' ||
    s === 'institutional' ||
    s === 'institution level' ||
    s === 'college'
  ) {
    return {
      code: 'Institution Level',
      canonicalCode: 'Institution Level',
      shortName: 'Institution Level',
      name: 'Institution Level',
      isET: true,
      raw: String(raw).trim()
    };
  }

  // 7. General CSE (non-ET or unspecified)
  if (s === 'cse' || s === 'computer science and engineering') {
    return {
      code: 'Institution Level',
      canonicalCode: 'Institution Level',
      shortName: 'Institution Level',
      name: 'Computer Science & Engineering (Central/Unspecified ET)',
      isET: true,
      raw: String(raw).trim(),
      needsMapping: true
    };
  }

  // Default fallback
  const fallbackStr = String(raw).trim();
  return {
    code: fallbackStr,
    canonicalCode: fallbackStr,
    shortName: fallbackStr,
    name: fallbackStr,
    isET: false,
    raw: fallbackStr
  };
}

/**
 * Validates whether two department representations refer to the same canonical department.
 */
export function isSameDepartment(depA, depB) {
  const normA = normalizeDepartment(depA).canonicalCode;
  const normB = normalizeDepartment(depB).canonicalCode;
  return normA === normB;
}
