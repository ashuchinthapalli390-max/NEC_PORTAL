/**
 * documentEvidenceImporter.js
 * Scans, classifies, and indexes institutional document evidence (PDFs & DOCX)
 * without exposing local filesystem paths.
 */

import fs from 'fs';
import path from 'path';
import { normalizeRollNumber, isValidNecRollNumber } from './rollNumberDecoder.js';
import { normalizeDepartment } from './departmentNormalizer.js';

export function scanAndIndexDocumentEvidence(baseDir) {
  const documents = [];
  const byRollNumber = new Map();

  function scanRecursive(dir) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const ent of entries) {
      const fullPath = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        scanRecursive(fullPath);
      } else {
        const lowerName = ent.name.toLowerCase();
        // Ignore Office lock files
        if (ent.name.startsWith('~$')) continue;

        const isPdf = lowerName.endsWith('.pdf') || lowerName.endsWith('. pdf') || lowerName.includes('pdf');
        const isDocx = lowerName.endsWith('.docx');

        if (isPdf || isDocx) {
          let stat = null;
          try {
            stat = fs.statSync(fullPath);
          } catch {
            // ignore
          }

          const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
          const sizeKb = stat ? Math.round(stat.size / 1024) : 0;

          // Attempt roll number extraction from file name (e.g. "22471A4201.pdf" or "23471A4201 - Priyanka Dupati.pdf")
          const rollMatch = ent.name.match(/\b(2[0-4]47[15][A-Za-z][0-9A-Za-z]{2}[0-9A-Za-z]{2})\b/);
          const rollNumber = rollMatch ? normalizeRollNumber(rollMatch[1]) : null;

          let docType = 'GENERAL_EVIDENCE';
          let entityType = 'INSTITUTIONAL';

          if (relPath.includes('CSP')) {
            docType = 'CSP_PROJECT_BOOK';
            entityType = 'CSP_PROJECT';
          } else if (relPath.includes('GB')) {
            docType = 'GOVERNING_BODY_DOCKET';
            entityType = 'ACADEMIC_GOVERNANCE';
          } else if (relPath.includes('CAC')) {
            docType = 'CAC_MINUTES_DOCKET';
            entityType = 'ACADEMIC_GOVERNANCE';
          } else if (relPath.includes('LIST OF EVENTS')) {
            docType = 'EVENT_PHOTO_EVIDENCE';
            entityType = 'EVENTS_OUTREACH';
          }

          let batch = null;
          if (relPath.includes('2022') || (rollNumber && rollNumber.startsWith('22'))) batch = '2022';
          else if (relPath.includes('2023') || (rollNumber && rollNumber.startsWith('23'))) batch = '2023';

          let fileUrl = `/api/portal/documents/serve?id=DOC_${documents.length + 1}`;
          if (docType === 'CSP_PROJECT_BOOK') {
            if (batch === '2022') {
              fileUrl = `/documents/csp/2022-batch/${encodeURIComponent(ent.name)}`;
            } else if (batch === '2023') {
              fileUrl = `/documents/csp/2023-batch/${encodeURIComponent(ent.name)}`;
            }
          }

          const docRecord = {
            id: `DOC_${documents.length + 1}`,
            fileName: ent.name,
            documentType: docType,
            entityType,
            rollNumber,
            batch,
            sizeKb,
            storageReference: `documents/${relPath}`,
            fileUrl,
            url: fileUrl,
            isVerified: true
          };

          documents.push(docRecord);
          if (rollNumber) {
            byRollNumber.set(rollNumber, docRecord);
          }
        }
      }
    }
  }

  scanRecursive(baseDir);

  return {
    documents,
    count: documents.length,
    getByRoll: (roll) => byRollNumber.get(normalizeRollNumber(roll)) || null
  };
}
