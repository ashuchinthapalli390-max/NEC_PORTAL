/**
 * nptelImporter.js
 * Ingests student NPTEL/SWAYAM MOOC certifications.
 * Strict boundary: Isolates Student NPTEL from Faculty NPTEL.
 */

import { readWorkbook } from './workbookReader.js';
import { normalizeRollNumber } from './rollNumberDecoder.js';
import { normalizeDepartment } from './departmentNormalizer.js';

export function computeNptelAwardCategory(score) {
  const num = typeof score === 'number' ? score : parseFloat(score);
  if (isNaN(num)) return 'Successfully Completed';
  if (num >= 90) return 'Elite + Gold';
  if (num >= 75) return 'Elite + Silver';
  if (num >= 60) return 'Elite';
  if (num >= 40) return 'Successfully Completed';
  return 'Participation';
}

export function importStudentNptel(nptelFiles, studentRegistry, auditLog) {
  const records = [];
  const dedupMap = new Map(); // roll + course -> record
  let duplicateCount = 0;

  for (const item of nptelFiles) {
    const { filePath, relPath, defaultDept } = item;
    const wbRes = readWorkbook(filePath);
    if (!wbRes.success) continue;

    for (const [sheetName, rows] of Object.entries(wbRes.sheets)) {
      for (const row of rows) {
        const rawRoll = row['ROLL NO'] || row['HALL TICKET NO'] || row['HT NO'] || row['Roll Number'] || row['Roll No'];
        const normRoll = normalizeRollNumber(rawRoll);
        if (!normRoll || normRoll.length < 9) continue;

        const rawCourse = row['COURSE'] || row['NAME OF THE COURSE'] || row['Name of the Course'];
        if (!rawCourse || typeof rawCourse !== 'string' || rawCourse.trim().length < 3) continue;

        const cleanCourse = String(rawCourse).trim().toUpperCase();
        const rawStudent = row['NAME OF THE STUDENT'] || row['STUDENT NAME'] || row['Name of the Student'] || '';
        const rawDept = row['Department'] || row['Dept'] || defaultDept || 'Common';
        const deptMeta = normalizeDepartment(rawDept);

        const internalScore = parseFloat(row['INTERNAL (25)'] || row['INTERNAL  (25)  '] || row['INTERNAL     (25)'] || 0) || null;
        const externalScore = parseFloat(row['EXTERNAL    (75)'] || row['EXTERNAL     (75)'] || row['EXTERNAL (75)'] || 0) || null;
        const rawScore = row['SCORE'] || row['Score'] || row['Total Score'];
        const score = typeof rawScore === 'number' ? rawScore : parseFloat(rawScore) || 0;

        const awardCategory = computeNptelAwardCategory(score);
        const dedupKey = `${normRoll}::${cleanCourse.toLowerCase()}`;

        if (dedupMap.has(dedupKey)) {
          duplicateCount++;
          const existing = dedupMap.get(dedupKey);
          if (!existing.score && score) {
            existing.score = score;
            existing.awardCategory = awardCategory;
          }
          continue;
        }

        // Reconcile student
        const student = studentRegistry.reconcileStudent(normRoll, rawStudent, deptMeta.canonicalCode, {
          sourceFile: relPath,
          activityType: 'nptel'
        });

        const batch = row['BATCH'] || row['Batch'] || (normRoll.startsWith('20') ? '2020' : normRoll.startsWith('22') ? '2022' : '2023');
        const academicYear = row['Acd Year'] || row['Academic Year'] || `${batch}-${String(parseInt(batch, 10) + 1).slice(2)}`;

        const sName = student ? student.name : (String(rawStudent).trim() || normRoll);
        const nptelRecord = {
          id: `NPTEL_${deptMeta.canonicalCode.toLowerCase()}_${records.length + 1}`,
          rollNumber: normRoll,
          studentName: sName,
          name: sName,
          title: cleanCourse,
          course: cleanCourse,
          courseName: cleanCourse,
          department: deptMeta.canonicalCode,
          departmentName: deptMeta.name,
          internalScore,
          externalScore,
          score,
          awardCategory,
          academicYear,
          provider: 'NPTEL / SWAYAM',
          status: score >= 40 ? 'Certified' : 'Completed',
          verificationStatus: 'Verified',
          workflowStatus: 'APPROVED',
          provenance: {
            sourceFile: relPath,
            sheetName,
            rowNum: row.__rowNum
          }
        };

        dedupMap.set(dedupKey, nptelRecord);
        records.push(nptelRecord);
      }
    }
  }

  auditLog.duplicatesMerged += duplicateCount;
  return {
    certifications: records,
    count: records.length
  };
}
