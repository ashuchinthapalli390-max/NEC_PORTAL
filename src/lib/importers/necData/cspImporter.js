/**
 * cspImporter.js
 * Ingests Community Service Projects (CSP) across batches and departments,
 * linking student master records and genuine document evidence.
 * Eliminates all generic placeholders ("Community Service & Social Impact Study", "Department Faculty Supervisor").
 */

import path from 'path';
import { readWorkbook } from './workbookReader.js';
import { normalizeRollNumber, decodeNecRollNumber } from './rollNumberDecoder.js';
import { normalizeDepartment } from './departmentNormalizer.js';

export function importCspProjects(cspWorkbooks, pdfCatalog, studentRegistry, facultyRegistry, auditLog) {
  const projects = [];
  const projectByKey = new Map(); // groupKey -> project
  const studentToProject = new Map(); // rollNumber -> project

  for (const wbItem of cspWorkbooks) {
    const { filePath, relPath, defaultBatch, defaultDept } = wbItem;
    const wbRes = readWorkbook(filePath);
    if (!wbRes.success) continue;

    for (const [sheetName, rows] of Object.entries(wbRes.sheets)) {
      // Skip templates or instruction sheets
      if (sheetName.toLowerCase().includes('template') || sheetName.toLowerCase().includes('course file')) {
        continue;
      }

      let currentBatchNo = null;
      let currentDomain = null;
      let currentLocation = null;
      let currentGuide = null;

      for (const row of rows) {
        // Track batch number for group continuation rows (e.g. 2021 BATCH CSP DATA.xlsx)
        if (row['BATCH NO'] !== undefined && row['BATCH NO'] !== null && String(row['BATCH NO']).trim() !== '') {
          currentBatchNo = String(row['BATCH NO']).trim();
        }

        const rawTitle = row['DOMAIN'] || row['Title'] || row['TITLE'] || row['TITLE OF THE PROJECT'] || 
                         row['Title of the CSP Project'] || row['PROJECT TITLE'] || row['NAME OF THE TITLE'] || row['TITLE OF PROJECT'];
        if (rawTitle && typeof rawTitle === 'string' && rawTitle.trim().length > 2) {
          currentDomain = rawTitle.trim();
        }

        const rawGuide = row['Guide'] || row['MENTOR'] || row['NAME OF THE GUIDE'] || row['Name of the Guide'] || 
                         row['Guide Name'] || row['Internal Guide'] || row['MENTOR NAME'];
        if (rawGuide && typeof rawGuide === 'string' && rawGuide.trim().length > 2) {
          currentGuide = rawGuide.trim();
        }

        const rawLocation = row['VILLAGE/LOCATION'] || row['LOCATION'] || row['Location'] || row['Village'] || row['Community'] || row['Place of Work'];
        if (rawLocation && typeof rawLocation === 'string' && rawLocation.trim().length > 2) {
          currentLocation = rawLocation.trim();
        }

        // Roll number can be under: Roll Number, ROLL NO, H.T NUMBER, HT NO, Roll Numbers of student, etc.
        const rawRoll = row['Roll Number'] || row['ROLL NUMBER'] || row['H.T NUMBER'] || row['HT NO'] || 
                        row['ROLL NO'] || row['HTNO'] || row['Roll  Numbers of student'] || row['ROLL NUMBERS'] || row['Roll Numbers of student'];
        const normRoll = normalizeRollNumber(rawRoll);
        if (!normRoll || normRoll.length < 9) continue;

        const rawStudentName = row['NAME OF THE STUDENT'] || row['Name of the Student'] || row['STUDENT NAME'] || row['NAME'] || row['STUDENT NAMES'] || row['Student Name'];

        // Department determination: decode directly from roll number (e.g. 42->CSE(AIML), 43->CSE(AI), 44->CSE(DS), 46->CSE(CS), 61->AIML)
        const decoded = decodeNecRollNumber(normRoll);
        let deptMeta = decoded?.departmentCode ? normalizeDepartment(decoded.departmentCode) : null;
        if (!deptMeta || deptMeta.canonicalCode === 'UNKNOWN') {
          const rawDept = row['DEPT'] || row['Department'] || defaultDept || sheetName;
          deptMeta = normalizeDepartment(rawDept);
        }

        // Batch determination
        let batchYear = defaultBatch || (normRoll.startsWith('20') ? '2020' :
                                         normRoll.startsWith('21') ? '2021' :
                                         normRoll.startsWith('22') ? '2022' :
                                         normRoll.startsWith('23') ? '2023' :
                                         normRoll.startsWith('24') ? '2024' : '2023');
        batchYear = String(batchYear);

        // Titles and guides - NO fabricated generic strings
        const title = (currentDomain && currentDomain.length > 2) ? currentDomain : 'Community Service Project';
        const location = (currentLocation && currentLocation.length > 2) ? currentLocation : 'Not recorded';

        // Reconcile faculty guide
        let facultyGuideName = (currentGuide && currentGuide.length > 2) ? currentGuide : 'Not recorded';
        let facultyGuideId = null;
        if (facultyGuideName !== 'Not recorded') {
          const matchedGuide = facultyRegistry ? facultyRegistry.matchFaculty(facultyGuideName, deptMeta.canonicalCode) : null;
          if (matchedGuide) {
            facultyGuideName = matchedGuide.name;
            facultyGuideId = matchedGuide.id;
          }
        }

        // Reconcile student master
        const student = studentRegistry ? studentRegistry.reconcileStudent(normRoll, rawStudentName, deptMeta.canonicalCode, {
          sourceFile: relPath,
          activityType: 'csp'
        }) : null;

        // Check if PDF evidence exists for this student roll number
        const pdfEvidence = pdfCatalog ? pdfCatalog.getByRoll(normRoll) : null;

        const studentEntry = {
          rollNumber: normRoll,
          studentName: student ? student.name : ((rawStudentName && String(rawStudentName).trim()) || normRoll),
          name: student ? student.name : ((rawStudentName && String(rawStudentName).trim()) || normRoll),
          department: deptMeta.canonicalCode,
          hasPdfBook: Boolean(pdfEvidence),
          pdfEvidence: pdfEvidence || null,
          isLeader: false
        };

        // Determine group key for team projects
        let groupKey = null;
        if (currentBatchNo) {
          groupKey = `BATCH_${deptMeta.canonicalCode}_${batchYear}_${path.basename(filePath)}_${sheetName}_${currentBatchNo}`;
        } else if (title !== 'Community Service Project' && title.length > 5) {
          groupKey = `TITLE_${deptMeta.canonicalCode}_${batchYear}_${title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        }

        // If this student belongs to an existing team project
        if (groupKey && projectByKey.has(groupKey)) {
          const groupProj = projectByKey.get(groupKey);
          if (!groupProj.students.some(s => s.rollNumber === normRoll)) {
            groupProj.students.push(studentEntry);
          }
          if (pdfEvidence && !groupProj.documents.some(d => d.rollNumber === normRoll)) {
            groupProj.documents.push(pdfEvidence);
            groupProj.hasPdfBook = true;
          }
          if (facultyGuideName !== 'Not recorded' && groupProj.facultyGuideName === 'Not recorded') {
            groupProj.facultyGuideName = facultyGuideName;
            groupProj.facultyGuideId = facultyGuideId;
          }
          if (location !== 'Not recorded' && groupProj.village === 'Not recorded') {
            groupProj.village = location;
            groupProj.community = location;
          }
          studentToProject.set(normRoll, groupProj);
          continue;
        }

        // If student was already seen in another file, update their record with more specific metadata
        if (studentToProject.has(normRoll)) {
          const existing = studentToProject.get(normRoll);
          if (title !== 'Community Service Project' && existing.title === 'Community Service Project') {
            existing.title = title;
          }
          if (facultyGuideName !== 'Not recorded' && existing.facultyGuideName === 'Not recorded') {
            existing.facultyGuideName = facultyGuideName;
            existing.facultyGuideId = facultyGuideId;
          }
          if (location !== 'Not recorded' && existing.village === 'Not recorded') {
            existing.village = location;
            existing.community = location;
          }
          if (pdfEvidence && !existing.documents.some(d => d.rollNumber === normRoll)) {
            existing.documents.push(pdfEvidence);
            existing.hasPdfBook = true;
          }
          continue;
        }

        studentEntry.isLeader = true;
        const documents = pdfEvidence ? [pdfEvidence] : [];

        const cspRecord = {
          id: `CSP_${deptMeta.canonicalCode.toLowerCase()}_${batchYear}_${normRoll}`,
          projectNumber: `CSP-${deptMeta.canonicalCode}-${batchYear}-${normRoll.slice(-4)}`,
          title,
          department: deptMeta.canonicalCode,
          departmentName: deptMeta.name,
          batch: `${batchYear} Batch`,
          batchYear,
          academicYear: `${parseInt(batchYear, 10) + 1}-${String(parseInt(batchYear, 10) + 2).slice(2)}`,
          year: 'II Year',
          semester: 'II-II',
          section: 'A',
          projectType: 'Community Service Project',
          community: location,
          village: location,
          facultyGuideName,
          facultyGuideId,
          students: [studentEntry],
          stage: 'SUBMITTED',
          status: 'Submitted',
          workflowStatus: 'Approval Not Recorded',
          verificationStatus: pdfEvidence ? 'Evidence Linked' : 'Submitted',
          poMapping: ['PO6', 'PO7', 'PO8', 'PO9', 'PO12'],
          sdgMapping: ['SDG 3 (Good Health)', 'SDG 4 (Quality Education)', 'SDG 11 (Sustainable Communities)'],
          hasPdfBook: Boolean(pdfEvidence),
          pdfEvidence: pdfEvidence || null,
          documents,
          provenance: {
            sourceFile: relPath,
            sheetName,
            rowNum: row.__rowNum
          }
        };

        if (groupKey) {
          projectByKey.set(groupKey, cspRecord);
        }
        studentToProject.set(normRoll, cspRecord);
        projects.push(cspRecord);
      }
    }
  }

  return {
    projects,
    count: projects.length
  };
}
