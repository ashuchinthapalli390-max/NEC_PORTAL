/**
 * achievementImporter.js
 * Ingests and deduplicates student co-curricular and extracurricular achievements across departments.
 */

import { readWorkbook } from './workbookReader.js';
import { normalizeRollNumber } from './rollNumberDecoder.js';
import { normalizeDepartment } from './departmentNormalizer.js';
import { normalizeDate, deriveAcademicYearFromDate } from './dateNormalizer.js';

export function classifyAchievementType(eventName, rawType) {
  const norm = `${eventName || ''} ${rawType || ''}`.toLowerCase();
  if (norm.includes('hackathon') || norm.includes('hack-a-thon') || norm.includes('code-a-thon')) return 'Hackathon';
  if (norm.includes('coding') || norm.includes('contest') || norm.includes('leetcode') || norm.includes('codechef')) return 'Coding Contest';
  if (norm.includes('paper') || norm.includes('conference') || norm.includes('presentation')) return 'Paper Presentation';
  if (norm.includes('certif') || norm.includes('infosys') || norm.includes('springboard') || norm.includes('course') || norm.includes('python foundation')) return 'Certification';
  if (norm.includes('sports') || norm.includes('yogasana') || norm.includes('cricket') || norm.includes('badminton') || norm.includes('volleyball')) return 'Sports';
  if (norm.includes('cultural') || norm.includes('dance') || norm.includes('singing') || norm.includes('drama')) return 'Cultural';
  if (norm.includes('workshop') || norm.includes('bootcamp') || norm.includes('seminar')) return 'Technical Workshop';
  return 'Technical Competition';
}

export function importStudentAchievements(achievementFiles, studentRegistry, auditLog) {
  const achievements = [];
  const dedupMap = new Map(); // roll + cleanEventName + date -> record
  let duplicateCount = 0;
  const extraNptelRows = []; // To route misfiled NPTEL sheets

  for (const item of achievementFiles) {
    const { filePath, relPath, defaultDept } = item;
    const wbRes = readWorkbook(filePath);
    if (!wbRes.success) continue;

    for (const [sheetName, rows] of Object.entries(wbRes.sheets)) {
      // Check if sheet is actually NPTEL
      if (sheetName.includes('NPTEL') || (rows.length > 0 && rows[0]['NAME OF THE COURSE'])) {
        for (const r of rows) {
          extraNptelRows.push({ ...r, __sourceFile: relPath, __dept: defaultDept });
        }
        continue;
      }

      for (const row of rows) {
        const rawRoll = row['Roll Number'] || row['ROLL NO'] || row['Roll No'] || row['ROLL NUMBER'] || row['HT NO'];
        const normRoll = normalizeRollNumber(rawRoll);
        if (!normRoll || normRoll.length < 9) continue;

        const rawEvent = row['Name of the Event'] || row['Event Name'] || row['NAME OF THE EVENT'] || row['Event / Certification'];
        if (!rawEvent || typeof rawEvent !== 'string' || rawEvent.trim().length < 3) continue;

        const eventName = rawEvent.trim();
        const rawStudent = row['Name of the Student'] || row['Student Name'] || row['NAME OF THE STUDENT'] || '';
        const rawOrganizer = row['Organized By'] || row['Organizing Institute'] || row['Organizer'] || 'Host Organization';
        const rawType = row['Type(Sports / Academic/ Cultural)'] || row['Type (Sports / Academic/ Cultural)'] || row['Type'] || '';
        const rawLevel = row['State / National / International'] || row['Level'] || 'National';
        const rawDate = row['Date of Event'] || row['Event Date'] || row['Date'];

        const dateMeta = normalizeDate(rawDate);
        const rawDept = row['Department'] || row['Dept'] || defaultDept || 'Common';
        const deptMeta = normalizeDepartment(rawDept);

        const category = classifyAchievementType(eventName, rawType);
        const cleanEventKey = eventName.toLowerCase().replace(/[^a-z0-9]+/g, '');
        const dateKey = dateMeta.isoDate || dateMeta.displayDate || 'any';

        const dedupKey = `${normRoll}::${cleanEventKey}::${dateKey}`;

        if (dedupMap.has(dedupKey)) {
          duplicateCount++;
          continue;
        }

        // Reconcile student
        const student = studentRegistry.reconcileStudent(normRoll, rawStudent, deptMeta.canonicalCode, {
          sourceFile: relPath,
          activityType: 'achievements'
        });

        const academicYear = dateMeta.isoDate
          ? deriveAcademicYearFromDate(dateMeta.isoDate)
          : (sheetName.includes('25-26') ? '2025-26' : sheetName.includes('24-25') ? '2024-25' : '2023-24');

        const sName = student ? student.name : (String(rawStudent).trim() || normRoll);
        const record = {
          id: `ACH_${deptMeta.canonicalCode.toLowerCase()}_${achievements.length + 1}`,
          achievementNumber: `ACH-${deptMeta.canonicalCode}-${academicYear}-${String(achievements.length + 1).padStart(4, '0')}`,
          rollNumber: normRoll,
          studentName: sName,
          name: sName,
          title: eventName,
          department: deptMeta.canonicalCode,
          departmentName: deptMeta.name,
          eventName,
          achievementType: category,
          category,
          organizer: String(rawOrganizer).trim(),
          level: String(rawLevel).trim() || 'Institutional',
          eventDate: dateMeta.isoDate || dateMeta.displayDate || '2024-01-01',
          date: dateMeta.isoDate || dateMeta.displayDate || '2024-01-01',
          academicYear,
          status: 'Approved',
          verificationStatus: 'Verified',
          workflowStatus: 'APPROVED',
          isDeleted: false,
          provenance: {
            sourceFile: relPath,
            sheetName,
            rowNum: row.__rowNum
          }
        };

        dedupMap.set(dedupKey, record);
        achievements.push(record);
      }
    }
  }

  auditLog.duplicatesMerged += duplicateCount;
  return {
    achievements,
    count: achievements.length,
    extraNptelRows
  };
}
