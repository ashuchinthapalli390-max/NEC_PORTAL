/**
 * validation.js
 * Comprehensive quality auditing, row validation, and rejection logger.
 */

export const VALIDATION_CODES = {
  VALID: 'VALID',
  WARNING: 'WARNING',
  REJECTED: 'REJECTED'
};

export const REASON_CODES = {
  UNMATCHED_STUDENT: 'UNMATCHED_STUDENT',
  UNMATCHED_FACULTY: 'UNMATCHED_FACULTY',
  DEPARTMENT_CONFLICT: 'DEPARTMENT_CONFLICT',
  DUPLICATE: 'DUPLICATE',
  MISSING_DATE: 'MISSING_DATE',
  AMBIGUOUS_DATE: 'AMBIGUOUS_DATE',
  INVALID_ROLL_NUMBER: 'INVALID_ROLL_NUMBER',
  MISSING_TITLE: 'MISSING_TITLE',
  ACADEMIC_YEAR_CONFLICT: 'ACADEMIC_YEAR_CONFLICT',
  UNKNOWN_PUBLICATION_TYPE: 'UNKNOWN_PUBLICATION_TYPE',
  INVALID_DOI: 'INVALID_DOI',
  INCOMPLETE_RECORD: 'INCOMPLETE_RECORD',
  FORMULA_ZEROS_ONLY: 'FORMULA_ZEROS_ONLY',
  BLANK_ROW: 'BLANK_ROW'
};

export function createAuditLogger() {
  const warnings = [];
  const rejections = [];
  const stats = {
    totalFilesScanned: 0,
    workbooksProcessed: 0,
    sheetsProcessed: 0,
    pdfEvidenceIndexed: 0,
    docxProcessed: 0,
    rowsProcessed: 0,
    rowsImported: 0,
    duplicatesMerged: 0,
    unmatchedStudents: 0,
    unmatchedFaculty: 0,
    departmentConflicts: 0
  };

  function logWarning(file, sheet, row, code, details) {
    warnings.push({
      file,
      sheet,
      row,
      status: VALIDATION_CODES.WARNING,
      code,
      details,
      timestamp: new Date().toISOString()
    });
  }

  function logRejection(file, sheet, row, code, details) {
    rejections.push({
      file,
      sheet,
      row,
      status: VALIDATION_CODES.REJECTED,
      code,
      details,
      timestamp: new Date().toISOString()
    });
  }

  function getReport() {
    return {
      summary: stats,
      warningsCount: warnings.length,
      rejectionsCount: rejections.length,
      warnings: warnings.slice(0, 150), // Cap preview
      rejections: rejections.slice(0, 150)
    };
  }

  return {
    stats,
    warnings,
    rejections,
    logWarning,
    logRejection,
    getReport
  };
}
