import path from 'path';
import { readWorkbook } from '../src/lib/importers/necData/workbookReader.js';
import { normalizeRollNumber, decodeNecRollNumber } from '../src/lib/importers/necData/rollNumberDecoder.js';
import { normalizeDepartment } from '../src/lib/importers/necData/departmentNormalizer.js';
import { scanAndIndexDocumentEvidence } from '../src/lib/importers/necData/documentEvidenceImporter.js';

const necDataDir = 'd:/nec portal/nec-data';
const pdfCatalog = scanAndIndexDocumentEvidence(necDataDir);

const cspWorkbooks = [
  { filePath: path.join(necDataDir, 'CSP', 'CSP PROJECT DOCUMENT -  23 - BATCH (Responses).xlsx'), relPath: 'CSP/CSP PROJECT DOCUMENT -  23 - BATCH (Responses).xlsx', defaultBatch: '2023', defaultDept: 'Common' },
  { filePath: path.join(necDataDir, 'CSP', '2023 BATCH', '2023 BATCH CSP DATA  PRINCIPAL.xlsx'), relPath: 'CSP/2023 BATCH/2023 BATCH CSP DATA  PRINCIPAL.xlsx', defaultBatch: '2023', defaultDept: 'Common' },

  { filePath: path.join(necDataDir, 'CSP', '2020 BATCH CSP DATA.xlsx'), relPath: 'CSP/2020 BATCH CSP DATA.xlsx', defaultBatch: '2020', defaultDept: 'CSE(AI)' },
  { filePath: path.join(necDataDir, 'CSP', '2021 BATCH CSP DATA.xlsx'), relPath: 'CSP/2021 BATCH CSP DATA.xlsx', defaultBatch: '2021', defaultDept: 'CSE(AI)' },
  { filePath: path.join(necDataDir, 'CSP', 'AI CSP  2021 batch.xlsx'), relPath: 'CSP/AI CSP  2021 batch.xlsx', defaultBatch: '2021', defaultDept: 'CSE(AI)' },
  { filePath: path.join(necDataDir, 'CSP', 'AI CSP  2022 batch.xlsx'), relPath: 'CSP/AI CSP  2022 batch.xlsx', defaultBatch: '2022', defaultDept: 'CSE(AI)' },
  { filePath: path.join(necDataDir, 'CSP', '2022 BATCH CSP DATA.xlsx'), relPath: 'CSP/2022 BATCH CSP DATA.xlsx', defaultBatch: '2022', defaultDept: 'Common' },
  { filePath: path.join(necDataDir, 'CSP', '2023 BATCH CSP DATA.xlsx'), relPath: 'CSP/2023 BATCH CSP DATA.xlsx', defaultBatch: '2023', defaultDept: 'Common' },
  { filePath: path.join(necDataDir, 'CSP', '2023 BATCH', '2023 BATCH CSP DATA  PRINCIPAL.xlsx'), relPath: 'CSP/2023 BATCH/2023 BATCH CSP DATA  PRINCIPAL.xlsx', defaultBatch: '2023', defaultDept: 'Common' },
  { filePath: path.join(necDataDir, 'CSP', 'CSP PROJECT DOCUMENT -  23 - BATCH (Responses).xlsx'), relPath: 'CSP/CSP PROJECT DOCUMENT -  23 - BATCH (Responses).xlsx', defaultBatch: '2023', defaultDept: 'Common' },
  { filePath: path.join(necDataDir, 'AIML', 'CSP AIML.xlsx'), relPath: 'AIML/CSP AIML.xlsx', defaultBatch: '2023', defaultDept: 'AIML' },
  { filePath: path.join(necDataDir, 'CSE(AI)', 'CSP CSE AI.xlsx'), relPath: 'CSE(AI)/CSP CSE AI.xlsx', defaultBatch: '2023', defaultDept: 'CSE(AI)' },
  { filePath: path.join(necDataDir, 'CSE(AIML)', 'CSP CSE AIML.xlsx'), relPath: 'CSE(AIML)/CSP CSE AIML.xlsx', defaultBatch: '2023', defaultDept: 'CSE(AIML)' },
  { filePath: path.join(necDataDir, 'CSE(CS)', 'CSP CSE CS.xlsx'), relPath: 'CSE(CS)/CSP CSE CS.xlsx', defaultBatch: '2023', defaultDept: 'CSE(CS)' },
  { filePath: path.join(necDataDir, 'CSE(DS)', 'CSP CSE DS.xlsx'), relPath: 'CSE(DS)/CSP CSE DS.xlsx', defaultBatch: '2023', defaultDept: 'CSE(DS)' }
];

const projects = [];
const projectByKey = new Map(); // groupKey -> project
const studentToProject = new Map(); // rollNumber -> project

for (const wbItem of cspWorkbooks) {
  const { filePath, relPath, defaultBatch, defaultDept } = wbItem;
  const wbRes = readWorkbook(filePath);
  if (!wbRes.success) continue;

  for (const [sheetName, rows] of Object.entries(wbRes.sheets)) {
    if (sheetName.toLowerCase().includes('template') || sheetName.toLowerCase().includes('course file')) {
      continue;
    }

    let currentBatchNo = null;
    let currentDomain = null;
    let currentLocation = null;
    let currentGuide = null;

    for (const row of rows) {
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

      const rawRoll = row['Roll Number'] || row['ROLL NUMBER'] || row['H.T NUMBER'] || row['HT NO'] || 
                      row['ROLL NO'] || row['HTNO'] || row['Roll  Numbers of student'] || row['ROLL NUMBERS'] || row['Roll Numbers of student'];
      const normRoll = normalizeRollNumber(rawRoll);
      if (!normRoll || normRoll.length < 9) continue;

      const rawStudentName = row['NAME OF THE STUDENT'] || row['Name of the Student'] || row['STUDENT NAME'] || row['NAME'] || row['STUDENT NAMES'] || row['Student Name'];

      // Department determination - decode from roll if possible
      const decoded = decodeNecRollNumber(normRoll);
      let deptMeta = decoded?.departmentCode ? normalizeDepartment(decoded.departmentCode) : null;
      if (!deptMeta || deptMeta.canonicalCode === 'UNKNOWN') {
        const rawDept = row['DEPT'] || row['Department'] || defaultDept || sheetName;
        deptMeta = normalizeDepartment(rawDept);
      }

      let batchYear = defaultBatch || (normRoll.startsWith('20') ? '2020' :
                                       normRoll.startsWith('21') ? '2021' :
                                       normRoll.startsWith('22') ? '2022' :
                                       normRoll.startsWith('23') ? '2023' :
                                       normRoll.startsWith('24') ? '2024' : '2023');
      batchYear = String(batchYear);

      const title = (currentDomain && currentDomain.length > 2) ? currentDomain : 'Community Service Project';
      const guide = (currentGuide && currentGuide.length > 2) ? currentGuide : 'Not recorded';
      const location = (currentLocation && currentLocation.length > 2) ? currentLocation : 'Not recorded';

      const pdfEvidence = pdfCatalog.getByRoll(normRoll);

      const studentEntry = {
        rollNumber: normRoll,
        studentName: (rawStudentName && String(rawStudentName).trim()) || normRoll,
        name: (rawStudentName && String(rawStudentName).trim()) || normRoll,
        department: deptMeta.canonicalCode,
        hasPdfBook: Boolean(pdfEvidence),
        pdfEvidence: pdfEvidence || null,
        isLeader: false
      };

      // Determine grouping key
      let groupKey = null;
      if (currentBatchNo) {
        groupKey = `BATCH_${deptMeta.canonicalCode}_${batchYear}_${path.basename(filePath)}_${sheetName}_${currentBatchNo}`;
      } else if (title !== 'Community Service Project' && title.length > 5) {
        groupKey = `TITLE_${deptMeta.canonicalCode}_${batchYear}_${title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      }

      if (groupKey && projectByKey.has(groupKey)) {
        const proj = projectByKey.get(groupKey);
        if (!proj.students.some(s => s.rollNumber === normRoll)) {
          proj.students.push(studentEntry);
        }
        if (pdfEvidence && !proj.documents.some(d => d.rollNumber === normRoll)) {
          proj.documents.push(pdfEvidence);
          proj.hasPdfBook = true;
        }
        if (guide !== 'Not recorded' && proj.facultyGuideName === 'Not recorded') {
          proj.facultyGuideName = guide;
        }
        if (location !== 'Not recorded' && proj.village === 'Not recorded') {
          proj.village = location;
          proj.community = location;
        }
        studentToProject.set(normRoll, proj);
        continue;
      }

      // Check if student already in an existing project
      if (studentToProject.has(normRoll)) {
        const existing = studentToProject.get(normRoll);
        if (title !== 'Community Service Project' && existing.title === 'Community Service Project') {
          existing.title = title;
        }
        if (guide !== 'Not recorded' && existing.facultyGuideName === 'Not recorded') {
          existing.facultyGuideName = guide;
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
        facultyGuideName: guide,
        facultyGuideId: null,
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

console.log('Total Unique CSP Projects:', projects.length);
console.log('Total Unique Students in CSP:', studentToProject.size);
const withPdf = projects.filter(p => p.hasPdfBook);
console.log('Projects with PDF Evidence:', withPdf.length);
const genericTitles = projects.filter(p => p.title.includes('Community Service & Social Impact Study'));
console.log('Projects with generic "Social Impact" title:', genericTitles.length);
const genericGuides = projects.filter(p => p.facultyGuideName.includes('Department Faculty Supervisor'));
console.log('Projects with generic "Supervisor" guide:', genericGuides.length);
const fallbackTitles = projects.filter(p => p.title === 'Community Service Project');
console.log('Projects with fallback title:', fallbackTitles.length);
const recordedTitles = projects.filter(p => p.title !== 'Community Service Project');
console.log('Projects with real titles:', recordedTitles.length);

console.log('\nSample Project 0:');
console.log({
  id: projects[0].id,
  projectNumber: projects[0].projectNumber,
  title: projects[0].title,
  guide: projects[0].facultyGuideName,
  village: projects[0].village,
  dept: projects[0].department,
  studentsCount: projects[0].students.length,
  hasPdfBook: projects[0].hasPdfBook
});

console.log('\nSample Multi-student Project:');
const multi = projects.find(p => p.students.length > 1);
if (multi) {
  console.log({
    id: multi.id,
    projectNumber: multi.projectNumber,
    title: multi.title,
    guide: multi.facultyGuideName,
    village: multi.village,
    dept: multi.department,
    studentsCount: multi.students.length,
    students: multi.students.map(s => `${s.rollNumber} (${s.name})`),
    hasPdfBook: multi.hasPdfBook
  });
}
