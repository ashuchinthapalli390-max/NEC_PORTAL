/**
 * necData/index.js
 * Master orchestrator for Narasaraopeta Engineering College Institutional Data Ingestion.
 */

import path from 'path';
import fs from 'fs';
import { createAuditLogger } from './validation.js';
import { createStudentRegistry } from './studentMatcher.js';
import { createFacultyRegistry } from './facultyMatcher.js';
import { CANONICAL_DEPARTMENTS } from './departmentNormalizer.js';
import { readWorkbook } from './workbookReader.js';
import { scanAndIndexDocumentEvidence } from './documentEvidenceImporter.js';
import { importPublications } from './publicationImporter.js';
import { importPatents } from './patentImporter.js';
import { importBosMemberMaster, importDepartmentBosMeetings } from './bosImporter.js';
import { importCspProjects } from './cspImporter.js';
import { importInternships } from './internshipImporter.js';
import { importStudentNptel } from './nptelImporter.js';
import { importStudentAchievements } from './achievementImporter.js';
import { importMiniProjects } from './projectImporter.js';
import { importPlacements } from './placementImporter.js';
import { importMous } from './mouImporter.js';
import { importEvents } from './eventImporter.js';
import { importFacultyDevelopment } from './facultyDevelopmentImporter.js';
import { importGovernanceRecords } from './governanceImporter.js';

export function runNecInstitutionalDataPipeline(necDataDir, existingFaculty = []) {
  const auditLog = createAuditLogger();
  const startTime = Date.now();

  console.log(`[ETL] Starting NEC Institutional Data Ingestion from: ${necDataDir}`);

  // 1. Initialize Registries
  const studentRegistry = createStudentRegistry();
  const facultyRegistry = createFacultyRegistry(existingFaculty);

  // 2. Reconcile Faculty Master from "Formats/FACULTY LIST.xlsx"
  const facultyListFile = path.join(necDataDir, 'Formats', 'FACULTY LIST.xlsx');
  if (fs.existsSync(facultyListFile)) {
    const fWb = readWorkbook(facultyListFile);
    if (fWb.success) {
      const sheet1 = fWb.sheets['Sheet1'] || [];
      for (const row of sheet1) {
        if (!row['Name'] || typeof row['Name'] !== 'string' || !row['Designation']) continue;
        const activeYears = [];
        for (const yr of ['2022-23', '2023-24', '2024-25', '2025-26']) {
          if (row[yr] === '*' || row[yr]) activeYears.push(yr);
        }
        facultyRegistry.reconcileFaculty({
          name: row['Name'],
          designation: row['Designation'],
          doj: row['DoJ'],
          activeYears
        }, { sourceFile: 'Formats/FACULTY LIST.xlsx' });
      }
    }
  }

  // 3. Scan and Index Document Evidence (PDFs & DOCX)
  console.log('[ETL] Indexing document evidence (PDF project books & docx)...');
  const pdfCatalog = scanAndIndexDocumentEvidence(necDataDir);
  auditLog.stats.pdfEvidenceIndexed = pdfCatalog.count;
  console.log(`[ETL] Indexed ${pdfCatalog.count} institutional documents and student project books.`);

  // 4. Governance: BoS, Governing Body, Academic Council
  console.log('[ETL] Processing Academic Governance (BoS, Governing Body, CAC)...');
  const bosMemberFile = path.join(necDataDir, 'BoS members updated list.xlsx');
  const bosMembers = fs.existsSync(bosMemberFile)
    ? importBosMemberMaster(bosMemberFile, 'BoS members updated list.xlsx', auditLog)
    : [];

  const deptBosFiles = [
    { filePath: path.join(necDataDir, 'AIML', 'BOS AIML.xlsx'), relPath: 'AIML/BOS AIML.xlsx', department: 'AIML' },
    { filePath: path.join(necDataDir, 'CSE(AI)', 'BOS CSE AI.xlsx'), relPath: 'CSE(AI)/BOS CSE AI.xlsx', department: 'CSE(AI)' },
    { filePath: path.join(necDataDir, 'CSE(AIML)', 'BOS CSE AIML.xlsx'), relPath: 'CSE(AIML)/BOS CSE AIML.xlsx', department: 'CSE(AIML)' },
    { filePath: path.join(necDataDir, 'CSE(CS)', 'BOS CSE CS.xlsx'), relPath: 'CSE(CS)/BOS CSE CS.xlsx', department: 'CSE(CS)' },
    { filePath: path.join(necDataDir, 'CSE(DS)', 'BOS CSE DS.xlsx'), relPath: 'CSE(DS)/BOS CSE DS.xlsx', department: 'CSE(DS)' }
  ].filter(f => fs.existsSync(f.filePath));

  const bosMeetings = importDepartmentBosMeetings(deptBosFiles, auditLog);

  const govRecords = importGovernanceRecords(path.join(necDataDir, 'Formats'));

  // 5. Research & Publications
  console.log('[ETL] Ingesting and deduplicating Research Publications...');
  const pubFiles = [
    { filePath: path.join(necDataDir, 'FACULTY PUBLICATIONS MERGED.xlsx'), relPath: 'FACULTY PUBLICATIONS MERGED.xlsx', defaultDept: 'Common' },
    { filePath: path.join(necDataDir, 'Common', 'PUBLICATIONS FACULTY.xlsx'), relPath: 'Common/PUBLICATIONS FACULTY.xlsx', defaultDept: 'Common' },
    { filePath: path.join(necDataDir, 'AIML', 'Publications - AIML.xlsx'), relPath: 'AIML/Publications - AIML.xlsx', defaultDept: 'AIML' },
    { filePath: path.join(necDataDir, 'CSE(AI)', 'Publications - CSE(AI).xlsx'), relPath: 'CSE(AI)/Publications - CSE(AI).xlsx', defaultDept: 'CSE(AI)' },
    { filePath: path.join(necDataDir, 'CSE(AIML)', 'Publications - CSE AIML.xlsx'), relPath: 'CSE(AIML)/Publications - CSE AIML.xlsx', defaultDept: 'CSE(AIML)' },
    { filePath: path.join(necDataDir, 'CSE(CS)', 'Publications - CSE CS.xlsx'), relPath: 'CSE(CS)/Publications - CSE CS.xlsx', defaultDept: 'CSE(CS)' },
    { filePath: path.join(necDataDir, 'CSE(DS)', 'Publications - CSE DS.xlsx'), relPath: 'CSE(DS)/Publications - CSE DS.xlsx', defaultDept: 'CSE(DS)' }
  ].filter(f => fs.existsSync(f.filePath));

  const publicationResult = importPublications(pubFiles, facultyRegistry, studentRegistry, auditLog);

  // 6. Patents & IPR
  console.log('[ETL] Ingesting Patents & IPR records...');
  const patentFile = path.join(necDataDir, 'Common', 'Patents filed by the faculty .xlsx');
  const patentResult = fs.existsSync(patentFile)
    ? importPatents(patentFile, 'Common/Patents filed by the faculty .xlsx', facultyRegistry, auditLog)
    : { patents: [], count: 0 };

  // 7. Community Service Projects (CSP)
  console.log('[ETL] Ingesting Community Service Projects (CSP) & linking student books...');
  const cspWorkbooks = [
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
  ].filter(f => fs.existsSync(f.filePath));

  const cspResult = importCspProjects(cspWorkbooks, pdfCatalog, studentRegistry, facultyRegistry, auditLog);

  // 8. Student Internships
  console.log('[ETL] Ingesting Student Internships...');
  const internshipFiles = [
    { filePath: path.join(necDataDir, 'AIML', 'INTERNSHIP AIML.xlsx'), relPath: 'AIML/INTERNSHIP AIML.xlsx', defaultDept: 'AIML' },
    { filePath: path.join(necDataDir, 'CSE(AI)', 'INTERNSHIPS - CSE (AI).xlsx'), relPath: 'CSE(AI)/INTERNSHIPS - CSE (AI).xlsx', defaultDept: 'CSE(AI)' },
    { filePath: path.join(necDataDir, 'CSE(AIML)', 'INTERNSHIP CSE AIML.xlsx'), relPath: 'CSE(AIML)/INTERNSHIP CSE AIML.xlsx', defaultDept: 'CSE(AIML)' },
    { filePath: path.join(necDataDir, 'CSE(CS)', 'INTERNSHIP CSE CS.xlsx'), relPath: 'CSE(CS)/INTERNSHIP CSE CS.xlsx', defaultDept: 'CSE(CS)' },
    { filePath: path.join(necDataDir, 'CSE(DS)', 'INTERNSHIP CSE DS.xlsx'), relPath: 'CSE(DS)/INTERNSHIP CSE DS.xlsx', defaultDept: 'CSE(DS)' }
  ].filter(f => fs.existsSync(f.filePath));

  const internshipResult = importInternships(internshipFiles, studentRegistry, auditLog);

  // 9. Student NPTEL Certifications
  console.log('[ETL] Ingesting Student NPTEL Certifications...');
  const nptelFiles = [
    { filePath: path.join(necDataDir, 'AIML', 'NPTEL AIML.xlsx'), relPath: 'AIML/NPTEL AIML.xlsx', defaultDept: 'AIML' },
    { filePath: path.join(necDataDir, 'CSE(AI)', 'NPTEL CSE AI.xlsx'), relPath: 'CSE(AI)/NPTEL CSE AI.xlsx', defaultDept: 'CSE(AI)' },
    { filePath: path.join(necDataDir, 'CSE(AIML)', 'NPTEL CSE AIML.xlsx'), relPath: 'CSE(AIML)/NPTEL CSE AIML.xlsx', defaultDept: 'CSE(AIML)' },
    { filePath: path.join(necDataDir, 'CSE(CS)', 'NPTEL CSE CS.xlsx'), relPath: 'CSE(CS)/NPTEL CSE CS.xlsx', defaultDept: 'CSE(CS)' },
    { filePath: path.join(necDataDir, 'CSE(DS)', 'NPTEL CSE DS.xlsx'), relPath: 'CSE(DS)/NPTEL CSE DS.xlsx', defaultDept: 'CSE(DS)' }
  ].filter(f => fs.existsSync(f.filePath));

  const nptelResult = importStudentNptel(nptelFiles, studentRegistry, auditLog);

  // 10. Student Achievements
  console.log('[ETL] Ingesting Student Achievements...');
  const achievementFiles = [
    { filePath: path.join(necDataDir, 'AIML', 'Student Achievements  AIML.xlsx'), relPath: 'AIML/Student Achievements  AIML.xlsx', defaultDept: 'AIML' },
    { filePath: path.join(necDataDir, 'CSE(AI)', 'Student Achievements  CSE AI.xlsx'), relPath: 'CSE(AI)/Student Achievements  CSE AI.xlsx', defaultDept: 'CSE(AI)' },
    { filePath: path.join(necDataDir, 'CSE(AIML)', 'Student Achievements  CSE AIML.xlsx'), relPath: 'CSE(AIML)/Student Achievements  CSE AIML.xlsx', defaultDept: 'CSE(AIML)' },
    { filePath: path.join(necDataDir, 'CSE(CS)', 'Student Achievements  CSE CS.xlsx'), relPath: 'CSE(CS)/Student Achievements  CSE CS.xlsx', defaultDept: 'CSE(CS)' },
    { filePath: path.join(necDataDir, 'CSE(DS)', 'Student Achievements  CSE DS.xlsx'), relPath: 'CSE(DS)/Student Achievements  CSE DS.xlsx', defaultDept: 'CSE(DS)' }
  ].filter(f => fs.existsSync(f.filePath));

  const achievementResult = importStudentAchievements(achievementFiles, studentRegistry, auditLog);

  // 11. Student Mini Projects
  console.log('[ETL] Ingesting Student Mini Projects...');
  const miniProjectFiles = [
    { filePath: path.join(necDataDir, 'AIML', 'Mini Projects', '23 BATCH AIML MINI PROJECTS.xlsx'), relPath: 'AIML/Mini Projects/23 BATCH AIML MINI PROJECTS.xlsx', defaultDept: 'AIML', defaultBatch: '2023' },
    { filePath: path.join(necDataDir, 'CSE(AIML)', 'Mini Projects', '22 BATCH CSE (AIML) MINI PROJECTS.xlsx'), relPath: 'CSE(AIML)/Mini Projects/22 BATCH CSE (AIML) MINI PROJECTS.xlsx', defaultDept: 'CSE(AIML)', defaultBatch: '2022' },
    { filePath: path.join(necDataDir, 'CSE(AIML)', 'Mini Projects', '23 BATCH CSE (AIML) MINI PROJECTS.xlsx'), relPath: 'CSE(AIML)/Mini Projects/23 BATCH CSE (AIML) MINI PROJECTS.xlsx', defaultDept: 'CSE(AIML)', defaultBatch: '2023' },
    { filePath: path.join(necDataDir, 'CSE(CS)', 'Mini Projects', '23 BATCH CSE (CS) MINI PROJECT TITLES.xlsx'), relPath: 'CSE(CS)/Mini Projects/23 BATCH CSE (CS) MINI PROJECT TITLES.xlsx', defaultDept: 'CSE(CS)', defaultBatch: '2023' },
    { filePath: path.join(necDataDir, 'CSE(DS)', 'Mini Projects', '22 BATCH CSE (DS) MINI PROJECTS TITLES.xlsx'), relPath: 'CSE(DS)/Mini Projects/22 BATCH CSE (DS) MINI PROJECTS TITLES.xlsx', defaultDept: 'CSE(DS)', defaultBatch: '2022' }
  ].filter(f => fs.existsSync(f.filePath));

  const miniProjectResult = importMiniProjects(miniProjectFiles, studentRegistry, facultyRegistry, auditLog);

  // 12. Campus Placements & Drives
  console.log('[ETL] Ingesting Campus Placements & Company Drives...');
  const placementFile = { filePath: path.join(necDataDir, 'Common', 'CAMPUS PLACEMENTS.xlsx'), relPath: 'Common/CAMPUS PLACEMENTS.xlsx' };
  const drivesFile = { filePath: path.join(necDataDir, 'Common', 'DRIVES - COMPANIES LIST.xlsx'), relPath: 'Common/DRIVES - COMPANIES LIST.xlsx' };
  const placementResult = importPlacements(placementFile, drivesFile, studentRegistry, auditLog);

  // 13. Industry MoUs
  console.log('[ETL] Ingesting Industry MoUs...');
  const mouFile = { filePath: path.join(necDataDir, 'Common', 'MoUs.xlsx'), relPath: 'Common/MoUs.xlsx' };
  const mouResult = importMous(mouFile, auditLog);

  // 14. Workshops & Institutional Events
  console.log('[ETL] Ingesting Workshops, Seminars, Hackathons & Events...');
  const eventFiles = [
    { filePath: path.join(necDataDir, '26-27 WORKSHOPS SEMINARS HACKTHONS PROGRAMS ORGANIZED.xlsx'), relPath: '26-27 WORKSHOPS SEMINARS HACKTHONS PROGRAMS ORGANIZED.xlsx', defaultDept: 'Common' },
    { filePath: path.join(necDataDir, 'CSE(AI)', 'WORKSHOPS SEMINARS HACKTHONS PROGRAMS ORGANIZED - CSE AI.xlsx'), relPath: 'CSE(AI)/WORKSHOPS SEMINARS HACKTHONS PROGRAMS ORGANIZED - CSE AI.xlsx', defaultDept: 'CSE(AI)' },
    { filePath: path.join(necDataDir, 'CSE(AIML)', 'WORKSHOPS SEMINARS HACKTHONS PROGRAMS ORGANIZED - CSE AIML.xlsx'), relPath: 'CSE(AIML)/WORKSHOPS SEMINARS HACKTHONS PROGRAMS ORGANIZED - CSE AIML.xlsx', defaultDept: 'CSE(AIML)' },
    { filePath: path.join(necDataDir, 'CSE(CS)', 'WORKSHOPS SEMINARS HACKTHONS PROGRAMS ORGANIZED - CSE CS.xlsx'), relPath: 'CSE(CS)/WORKSHOPS SEMINARS HACKTHONS PROGRAMS ORGANIZED - CSE CS.xlsx', defaultDept: 'CSE(CS)' },
    { filePath: path.join(necDataDir, 'CSE(DS)', 'WORKSHOPS SEMINARS HACKTHONS PROGRAMS ORGANIZED - CSE DS.xlsx'), relPath: 'CSE(DS)/WORKSHOPS SEMINARS HACKTHONS PROGRAMS ORGANIZED - CSE DS.xlsx', defaultDept: 'CSE(DS)' }
  ].filter(f => fs.existsSync(f.filePath));
  const eventResult = importEvents(eventFiles, govRecords.crcEvents, auditLog);

  // 14. Faculty Development, Faculty NPTEL, PhDs, Books
  console.log('[ETL] Ingesting Faculty Development Programs & Research Profiles...');
  const facDevFiles = [
    { filePath: path.join(necDataDir, 'Common', 'Faculty Achiements - Workshops Attended.xlsx'), relPath: 'Common/Faculty Achiements - Workshops Attended.xlsx' },
    { filePath: path.join(necDataDir, 'Common', 'FDPS ORGANIZED.xlsx'), relPath: 'Common/FDPS ORGANIZED.xlsx' },
    { filePath: path.join(necDataDir, 'Common', 'FACULLTY NPTEL.xlsx'), relPath: 'Common/FACULLTY NPTEL.xlsx' },
    { filePath: path.join(necDataDir, 'Common', 'FACULTY PURSING PHD.xlsx'), relPath: 'Common/FACULTY PURSING PHD.xlsx' },
    { filePath: path.join(necDataDir, 'Common', 'Books or Chapter Publications by faculty.xlsx'), relPath: 'Common/Books or Chapter Publications by faculty.xlsx' }
  ].filter(f => fs.existsSync(f.filePath));

  const facDevResult = importFacultyDevelopment(facDevFiles, facultyRegistry, auditLog);

  // 15. All Students & Faculty Master final lists
  const allStudents = studentRegistry.getAllStudents();
  const allFaculty = facultyRegistry.getAllFaculty();

  const elapsedMs = Date.now() - startTime;
  console.log(`[ETL] Ingestion pipeline finished successfully in ${elapsedMs}ms.`);

  return {
    departments: Object.values(CANONICAL_DEPARTMENTS),
    faculty: allFaculty,
    students: allStudents,
    publications: publicationResult.publications,
    patents: patentResult.patents,
    bosMembers,
    bosMeetings,
    governingBody: govRecords.governingBody,
    academicCouncil: govRecords.academicCouncil,
    cspProjects: cspResult.projects,
    internships: internshipResult.internships,
    studentNptel: nptelResult.certifications,
    studentAchievements: achievementResult.achievements,
    miniProjects: miniProjectResult.miniProjects,
    placements: placementResult.offers,
    placementDrives: placementResult.drives,
    mous: mouResult.mous,
    events: eventResult.events,
    facultyWorkshopsAttended: facDevResult.workshopsAttended,
    fdpsOrganized: facDevResult.fdpsOrganized,
    facultyNptel: facDevResult.facultyNptel,
    phdPursuing: facDevResult.phdPursuing,
    books: facDevResult.books,
    documentEvidence: pdfCatalog.documents,
    dataQualityReport: {
      ...auditLog.getReport(),
      durationMs: elapsedMs,
      generatedAt: new Date().toISOString(),
      counts: {
        departments: Object.keys(CANONICAL_DEPARTMENTS).length,
        faculty: allFaculty.length,
        students: allStudents.length,
        publications: publicationResult.publications.length,
        patents: patentResult.patents.length,
        bosMeetings: bosMeetings.length,
        bosMembers: bosMembers.length,
        governingBody: govRecords.governingBody.length,
        academicCouncil: govRecords.academicCouncil.length,
        cspProjects: cspResult.projects.length,
        internships: internshipResult.internships.length,
        studentNptel: nptelResult.certifications.length,
        studentAchievements: achievementResult.achievements.length,
        miniProjects: miniProjectResult.miniProjects.length,
        placements: placementResult.offers.length,
        uniqueStudentsPlaced: placementResult.uniqueStudentsPlaced,
        placementDrives: placementResult.drives.length,
        mous: mouResult.mous.length,
        events: eventResult.events.length,
        facultyWorkshopsAttended: facDevResult.workshopsAttended.length,
        fdpsOrganized: facDevResult.fdpsOrganized.length,
        facultyNptel: facDevResult.facultyNptel.length,
        phdPursuing: facDevResult.phdPursuing.length,
        books: facDevResult.books.length,
        documentsIndexed: pdfCatalog.count
      }
    }
  };
}
