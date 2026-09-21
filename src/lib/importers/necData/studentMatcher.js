/**
 * studentMatcher.js
 * Canonical Student Master registry and activity linker keyed by NEC roll number.
 */

import { decodeNecRollNumber, normalizeRollNumber, isValidNecRollNumber } from './rollNumberDecoder.js';
import { normalizeDepartment } from './departmentNormalizer.js';

/**
 * Creates a Student Registry.
 */
export function createStudentRegistry() {
  const studentsMap = new Map(); // normalized rollNumber -> student object

  /**
   * Reconciles or registers a student.
   */
  function reconcileStudent(rawRoll, rawName = '', rawDept = '', sourceInfo = {}) {
    const roll = normalizeRollNumber(rawRoll);
    if (!roll) return null;

    const decoded = decodeNecRollNumber(roll);
    const existing = studentsMap.get(roll);

    let cleanName = (rawName || '').trim().replace(/\s+/g, ' ');
    // If student name has roll number or invalid prefix, clean it
    cleanName = cleanName.replace(/^[0-9A-Za-z]{10}\s*[-–:]*\s*/, '').trim();

    if (existing) {
      // Enrich name if previously blank or shorter
      if (cleanName && (!existing.name || cleanName.length > existing.name.length)) {
        existing.name = cleanName;
      }
      if (sourceInfo.sourceFile) {
        existing.sourceFiles.add(sourceInfo.sourceFile);
      }
      if (sourceInfo.activityType) {
        existing.activities[sourceInfo.activityType] = (existing.activities[sourceInfo.activityType] || 0) + 1;
      }
      return existing;
    }

    const dept = decoded.isValid
      ? decoded.departmentCode
      : normalizeDepartment(rawDept).canonicalCode;

    const studentRecord = {
      rollNumber: roll,
      name: cleanName || `Student ${roll}`,
      department: dept,
      departmentCode: dept,
      admissionYear: decoded.admissionYear || null,
      batch: decoded.batch || `${rawDept || 'ET'} Batch`,
      entryType: decoded.entryType || 'Regular',
      isLateral: decoded.isLateral || false,
      isValidRoll: decoded.isValid,
      sourceFiles: new Set(sourceInfo.sourceFile ? [sourceInfo.sourceFile] : []),
      activities: {
        csp: 0,
        internships: 0,
        nptel: 0,
        achievements: 0,
        miniProjects: 0,
        placements: 0,
        publications: 0
      }
    };

    if (sourceInfo.activityType && studentRecord.activities[sourceInfo.activityType] !== undefined) {
      studentRecord.activities[sourceInfo.activityType] = 1;
    }

    studentsMap.set(roll, studentRecord);
    return studentRecord;
  }

  function getStudent(roll) {
    return studentsMap.get(normalizeRollNumber(roll)) || null;
  }

  function getAllStudents() {
    return Array.from(studentsMap.values()).map(s => ({
      ...s,
      sourceFiles: Array.from(s.sourceFiles)
    }));
  }

  return {
    reconcileStudent,
    getStudent,
    getAllStudents,
    count: () => studentsMap.size
  };
}
