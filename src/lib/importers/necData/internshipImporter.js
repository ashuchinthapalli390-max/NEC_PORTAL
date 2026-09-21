/**
 * internshipImporter.js
 * Ingests and deduplicates student internships and industry training records.
 */

import { readWorkbook } from './workbookReader.js';
import { normalizeRollNumber } from './rollNumberDecoder.js';
import { normalizeDepartment } from './departmentNormalizer.js';
import { normalizeDate, deriveAcademicYearFromDate } from './dateNormalizer.js';

export function importInternships(internshipFiles, studentRegistry, auditLog) {
  const internships = [];
  const uniqueKeyMap = new Map(); // roll + org + domain + startDate -> record
  let duplicateCount = 0;

  for (const item of internshipFiles) {
    const { filePath, relPath, defaultDept } = item;
    const wbRes = readWorkbook(filePath);
    if (!wbRes.success) continue;

    for (const [sheetName, rows] of Object.entries(wbRes.sheets)) {
      for (const row of rows) {
        const rawRoll = row['Roll Number'] || row['ROLL NUMBER'] || row['Roll No'] || row['ROLL NO'] || row['HT NO'];
        const normRoll = normalizeRollNumber(rawRoll);
        if (!normRoll || normRoll.length < 9) continue;

        const rawStudent = row['Name of the Student'] || row['Student Name'] || row['NAME OF THE STUDENT'] || '';
        const rawOrg = row['Name of the Organization'] || row['Organization'] || row['Company'] || 'Industry Partner';
        const rawDomain = row['Internship Title/Domain'] || row['Domain'] || row['Title'] || 'Technical Internship';
        const rawMode = row['Online/Offlilne'] || row['Online/Offline'] || row['Mode'] || 'Virtual';
        const rawDate = row['Starting Date'] || row['Start Date'] || row['Date'] || '';
        const dateMeta = normalizeDate(rawDate);

        const rawDept = row['Department'] || row['Dept'] || defaultDept || 'Common';
        const deptMeta = normalizeDepartment(rawDept);

        const cleanOrg = String(rawOrg).trim();
        const cleanDomain = String(rawDomain).trim().toUpperCase();
        const startDateStr = dateMeta.isoDate || dateMeta.displayDate || '2024';

        const dedupKey = `${normRoll}::${cleanOrg.toLowerCase()}::${cleanDomain.toLowerCase()}::${startDateStr}`;

        if (uniqueKeyMap.has(dedupKey)) {
          duplicateCount++;
          continue;
        }

        // Reconcile student
        const student = studentRegistry.reconcileStudent(normRoll, rawStudent, deptMeta.canonicalCode, {
          sourceFile: relPath,
          activityType: 'internships'
        });

        const academicYear = dateMeta.isoDate
          ? deriveAcademicYearFromDate(dateMeta.isoDate)
          : (normRoll.startsWith('22') ? '2024-25' : normRoll.startsWith('23') ? '2024-25' : '2023-24');

        const sName = student ? student.name : (String(rawStudent).trim() || normRoll);
        const record = {
          id: `INT_${deptMeta.canonicalCode.toLowerCase()}_${internships.length + 1}`,
          rollNumber: normRoll,
          studentName: sName,
          name: sName,
          title: `${cleanDomain} Internship at ${cleanOrg}`,
          department: deptMeta.canonicalCode,
          branch: deptMeta.canonicalCode,
          departmentName: deptMeta.name,
          organization: cleanOrg,
          domain: cleanDomain,
          mode: String(rawMode).trim(),
          startDate: dateMeta.isoDate || dateMeta.displayDate || null,
          endDate: null,
          weeks: 4,
          durationWeeks: 4,
          academicYear,
          status: 'Completed',
          workflowStatus: 'APPROVED',
          verificationStatus: 'Verified',
          provenance: {
            sourceFile: relPath,
            sheetName,
            rowNum: row.__rowNum
          }
        };

        uniqueKeyMap.set(dedupKey, record);
        internships.push(record);
      }
    }
  }

  auditLog.duplicatesMerged += duplicateCount;
  return {
    internships,
    count: internships.length
  };
}
