/**
 * facultyMatcher.js
 * Multi-tier faculty matcher, entity deduplicator, and profile reconciler.
 */

import { normalizeDepartment } from './departmentNormalizer.js';

/**
 * Normalizes a person's name for robust matching:
 * - strips honorific titles (Dr., Prof., Mr., Mrs., Ms., Smt., Sri)
 * - removes dots, commas, dashes, excess whitespace
 * - converts to lowercase
 */
export function cleanFacultyName(raw) {
  if (!raw) return '';
  let s = String(raw).trim().toLowerCase();
  
  // Strip honorific prefixes
  s = s.replace(/\b(dr|prof|professor|mr|mrs|ms|smt|sri|dr\.|prof\.|mr\.|mrs\.|ms\.|smt\.|sri\.)\b/gi, ' ');
  
  // Replace dots, punctuation with spaces
  s = s.replace(/[.,\-_/\\()]+/g, ' ');
  
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Generates initials and surname key for matching names like "P. Srinivasarao" vs "P. Srinivasa Rao"
 * or "G.V. NeeliMadhavi" vs "G.V.Neeli Madhavi".
 */
export function getFacultyFuzzyKey(raw) {
  const cleaned = cleanFacultyName(raw);
  // Remove all internal spaces to equate "srinivasarao" and "srinivasa rao", "neelimadhavi" and "neeli madhavi"
  const compressed = cleaned.replace(/\s+/g, '');
  return compressed;
}

/**
 * Creates a Faculty Registry with indexed lookups.
 */
export function createFacultyRegistry(existingFacultyList = []) {
  const registry = new Map(); // id -> faculty object
  const byId = new Map();
  const byExactName = new Map();
  const byCompressedName = new Map();
  const byCompressedAndDept = new Map();

  function register(faculty) {
    if (!faculty || !faculty.name) return;
    const id = faculty.id || `FAC_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const fObj = {
      ...faculty,
      id,
      name: faculty.name.trim(),
      cleanName: cleanFacultyName(faculty.name),
      compressedName: getFacultyFuzzyKey(faculty.name),
      department: normalizeDepartment(faculty.department || faculty.dept).canonicalCode,
      aliases: new Set(faculty.aliases || []),
      sourceWorkbooks: new Set(faculty.sourceWorkbooks || []),
      activeYears: new Set(faculty.activeYears || [])
    };

    registry.set(id, fObj);
    byId.set(id.toLowerCase(), fObj);
    
    if (fObj.cleanName) {
      byExactName.set(fObj.cleanName, fObj);
    }
    if (fObj.compressedName) {
      byCompressedName.set(fObj.compressedName, fObj);
      const deptKey = `${fObj.compressedName}::${fObj.department}`;
      byCompressedAndDept.set(deptKey, fObj);
    }
    return fObj;
  }

  // Pre-seed with existing faculty
  for (const f of existingFacultyList) {
    register(f);
  }

  /**
   * Matches a raw faculty name and optional department against the registry.
   */
  function matchFaculty(rawName, rawDept = '') {
    if (!rawName) return null;
    const clean = cleanFacultyName(rawName);
    const compressed = getFacultyFuzzyKey(rawName);
    const deptNorm = rawDept ? normalizeDepartment(rawDept).canonicalCode : '';

    // 1. Check if rawName is an exact faculty ID
    const byIdMatch = byId.get(String(rawName).trim().toLowerCase());
    if (byIdMatch) return byIdMatch;

    // 2. Exact match on compressed name + department
    if (deptNorm && compressed) {
      const deptKey = `${compressed}::${deptNorm}`;
      if (byCompressedAndDept.has(deptKey)) {
        return byCompressedAndDept.get(deptKey);
      }
    }

    // 3. Exact clean name match
    if (clean && byExactName.has(clean)) {
      return byExactName.get(clean);
    }

    // 4. Compressed name match (handles spaces/initials variations)
    if (compressed && byCompressedName.has(compressed)) {
      return byCompressedName.get(compressed);
    }

    // 5. Check alias sets
    for (const f of registry.values()) {
      if (f.aliases.has(rawName) || f.aliases.has(clean) || f.aliases.has(compressed)) {
        return f;
      }
    }

    // 6. Cautious token substring match (e.g. "Dr. S. V. N. Sreenivasu" vs "SVN SRINIVASU")
    if (clean.length >= 4) {
      for (const f of registry.values()) {
        if (
          (f.compressedName.includes(compressed) || compressed.includes(f.compressedName)) &&
          (!deptNorm || f.department === deptNorm || f.department === 'Common' || deptNorm === 'Common')
        ) {
          return f;
        }
      }
    }

    return null;
  }

  /**
   * Reconciles or adds a faculty record from an institutional source.
   */
  function reconcileFaculty(record, sourceInfo = {}) {
    let matched = matchFaculty(record.name || record.facultyName, record.department || record.dept);
    
    if (matched) {
      if (record.name) matched.aliases.add(record.name);
      if (sourceInfo.sourceFile) matched.sourceWorkbooks.add(sourceInfo.sourceFile);
      if (record.activeYears) {
        for (const yr of record.activeYears) matched.activeYears.add(yr);
      }
      if (record.designation && (!matched.designation || matched.designation === 'Faculty')) {
        matched.designation = record.designation;
      }
      if (record.doj && !matched.dateOfJoining) {
        matched.dateOfJoining = record.doj;
      }
      return matched;
    }

    // If completely new verified faculty, register
    const newFaculty = register({
      name: record.name || record.facultyName,
      department: record.department || record.dept || 'Common',
      designation: record.designation || 'Assistant Professor',
      dateOfJoining: record.doj || null,
      activeYears: record.activeYears || [],
      aliases: [record.name || record.facultyName],
      sourceWorkbooks: sourceInfo.sourceFile ? [sourceInfo.sourceFile] : []
    });
    return newFaculty;
  }

  function getAllFaculty() {
    return Array.from(registry.values()).map(f => ({
      ...f,
      aliases: Array.from(f.aliases),
      sourceWorkbooks: Array.from(f.sourceWorkbooks),
      activeYears: Array.from(f.activeYears)
    }));
  }

  return {
    register,
    matchFaculty,
    reconcileFaculty,
    getAllFaculty,
    count: () => registry.size
  };
}
