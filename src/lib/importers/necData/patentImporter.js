/**
 * patentImporter.js
 * Ingests and collapses multi-row patent records keyed by Application Number.
 */

import { readWorkbook } from './workbookReader.js';
import { normalizeDepartment } from './departmentNormalizer.js';
import { normalizeDate } from './dateNormalizer.js';

export function importPatents(filePath, relPath, facultyRegistry, auditLog) {
  const wbRes = readWorkbook(filePath);
  if (!wbRes.success) {
    auditLog.warnings.push({
      file: relPath,
      reason: `Failed to read patents workbook: ${wbRes.error}`
    });
    return { patents: [], count: 0 };
  }

  const patentsByAppNum = new Map();

  for (const [sheetName, rows] of Object.entries(wbRes.sheets)) {
    for (const row of rows) {
      const rawAppNum = Object.entries(row).find(([k, v]) => /^application\s*no/i.test(k.trim()))?.[1];
      const rawTitle = Object.entries(row).find(([k, v]) => /^title/i.test(k.trim()))?.[1];

      if (!rawAppNum && !rawTitle) continue;
      if (!rawTitle || typeof rawTitle !== 'string' || rawTitle.trim().length < 5) continue;

      const appNum = rawAppNum ? String(rawAppNum).trim() : `APP_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const title = rawTitle.trim();

      const rawFaculty = Object.entries(row).find(([k, v]) => /^(name\s*of\s*the\s*faculty|faculty\s*name|inventor)/i.test(k.trim()))?.[1];
      const rawDept = Object.entries(row).find(([k, v]) => /^(dept|department)/i.test(k.trim()))?.[1] || 'Institution Level';
      const deptMeta = normalizeDepartment(rawDept);

      const filingDateRaw = Object.entries(row).find(([k, v]) => /date\s*of\s*fil/i.test(k.trim()))?.[1];
      const pubDateRaw = Object.entries(row).find(([k, v]) => /pub.*date/i.test(k.trim()))?.[1];
      const filingDateMeta = normalizeDate(filingDateRaw);
      const pubDateMeta = normalizeDate(pubDateRaw);
      const academicYear = row['Acd-Year'] || row['Academic Year'] || (pubDateMeta.isoDate ? pubDateMeta.isoDate.slice(0, 4) : '2025-26');

      let existing = patentsByAppNum.get(appNum);

      if (!existing) {
        const patentState = pubDateMeta.isoDate ? 'Published' : 'Filed';
        existing = {
          id: `PAT_${appNum.replace(/[^0-9A-Za-z]/g, '_')}`,
          applicationNumber: appNum,
          applicationNo: appNum,
          title,
          department: deptMeta.canonicalCode,
          departmentName: deptMeta.name,
          filingDate: filingDateMeta.isoDate || filingDateMeta.displayDate || null,
          publicationDate: pubDateMeta.isoDate || pubDateMeta.displayDate || null,
          academicYear: String(academicYear).trim(),
          status: patentState,
          patentStatus: patentState,
          legalStatus: patentState,
          patentType: 'Indian Utility Patent',
          applicantName: 'Narasaraopeta Engineering College (Autonomous)',
          source: 'Institutional Excel',
          workflowStatus: 'Approved',
          verificationStatus: 'Verified in Official Gazette',
          facultyName: '',
          inventors: [],
          documents: [],
          documentStatus: 'Document not available',
          provenance: []
        };
        patentsByAppNum.set(appNum, existing);
      }

      // Add inventor if present and not already listed
      if (rawFaculty) {
        const invName = String(rawFaculty).trim();
        const matchedFac = facultyRegistry.matchFaculty(invName, deptMeta.canonicalCode);
        const alreadyListed = existing.inventors.some(inv => inv.name.toLowerCase() === invName.toLowerCase());

        if (!alreadyListed) {
          existing.inventors.push({
            name: invName,
            department: deptMeta.canonicalCode,
            facultyId: matchedFac ? matchedFac.id : null,
            role: existing.inventors.length === 0 ? 'Principal Inventor' : 'Co-Inventor'
          });
          if (!existing.facultyName) {
            existing.facultyName = invName;
          }
        }
      }

      existing.provenance.push({
        sourceFile: relPath,
        sheetName,
        rowNum: row.__rowNum
      });
    }
  }

  const result = Array.from(patentsByAppNum.values());
  return {
    patents: result,
    count: result.length
  };
}
