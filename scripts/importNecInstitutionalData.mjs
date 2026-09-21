/**
 * importNecInstitutionalData.mjs
 * CLI command to ingest the complete nec-data repository into canonical relational JSON datasets.
 * Usage: npm run import:nec-data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runNecInstitutionalDataPipeline } from '../src/lib/importers/necData/index.js';
import { FACULTY_DATA } from '../src/data/masterData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const necDataDir = path.resolve(projectRoot, '..', 'nec-data');
const outDir = path.join(projectRoot, 'src', 'data', 'canonical');

console.log('================================================================');
console.log('NARASARAOPETA ENGINEERING COLLEGE (AUTONOMOUS) - DATA INGESTION');
console.log('================================================================');
console.log(`Project Root: ${projectRoot}`);
console.log(`Source Dataset: ${necDataDir}`);
console.log(`Canonical Output: ${outDir}`);

if (!fs.existsSync(necDataDir)) {
  console.error(`[ERROR] nec-data directory not found at: ${necDataDir}`);
  process.exit(1);
}

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

try {
  const result = runNecInstitutionalDataPipeline(necDataDir, FACULTY_DATA);

  // Write canonical JSON files
  fs.writeFileSync(path.join(outDir, 'departments.json'), JSON.stringify(result.departments, null, 2));
  fs.writeFileSync(path.join(outDir, 'faculty.json'), JSON.stringify(result.faculty, null, 2));
  fs.writeFileSync(path.join(outDir, 'students.json'), JSON.stringify(result.students, null, 2));
  fs.writeFileSync(path.join(outDir, 'publications.json'), JSON.stringify(result.publications, null, 2));
  fs.writeFileSync(path.join(outDir, 'patents.json'), JSON.stringify(result.patents, null, 2));
  fs.writeFileSync(path.join(outDir, 'bosMeetings.json'), JSON.stringify(result.bosMeetings, null, 2));
  fs.writeFileSync(path.join(outDir, 'bosMembers.json'), JSON.stringify(result.bosMembers, null, 2));
  fs.writeFileSync(path.join(outDir, 'governingBody.json'), JSON.stringify(result.governingBody, null, 2));
  fs.writeFileSync(path.join(outDir, 'academicCouncil.json'), JSON.stringify(result.academicCouncil, null, 2));
  fs.writeFileSync(path.join(outDir, 'cspProjects.json'), JSON.stringify(result.cspProjects, null, 2));
  fs.writeFileSync(path.join(outDir, 'internships.json'), JSON.stringify(result.internships, null, 2));
  fs.writeFileSync(path.join(outDir, 'studentNptel.json'), JSON.stringify(result.studentNptel, null, 2));
  fs.writeFileSync(path.join(outDir, 'studentAchievements.json'), JSON.stringify(result.studentAchievements, null, 2));
  fs.writeFileSync(path.join(outDir, 'miniProjects.json'), JSON.stringify(result.miniProjects, null, 2));
  fs.writeFileSync(path.join(outDir, 'placements.json'), JSON.stringify(result.placements, null, 2));
  fs.writeFileSync(path.join(outDir, 'placementDrives.json'), JSON.stringify(result.placementDrives, null, 2));
  fs.writeFileSync(path.join(outDir, 'mous.json'), JSON.stringify(result.mous, null, 2));
  fs.writeFileSync(path.join(outDir, 'events.json'), JSON.stringify(result.events, null, 2));
  fs.writeFileSync(path.join(outDir, 'facultyDevelopment.json'), JSON.stringify({
    workshopsAttended: result.facultyWorkshopsAttended,
    fdpsOrganized: result.fdpsOrganized,
    facultyNptel: result.facultyNptel,
    phdPursuing: result.phdPursuing,
    books: result.books
  }, null, 2));
  fs.writeFileSync(path.join(outDir, 'documentEvidence.json'), JSON.stringify(result.documentEvidence, null, 2));
  fs.writeFileSync(path.join(outDir, 'dataQualityReport.json'), JSON.stringify(result.dataQualityReport, null, 2));

  // Write ES module export index
  const esIndexCode = `// Canonical Ingested Master Datasets for NEC Portal
import departments from './departments.json' with { type: 'json' };
import faculty from './faculty.json' with { type: 'json' };
import students from './students.json' with { type: 'json' };
import publications from './publications.json' with { type: 'json' };
import patents from './patents.json' with { type: 'json' };
import bosMeetings from './bosMeetings.json' with { type: 'json' };
import bosMembers from './bosMembers.json' with { type: 'json' };
import governingBody from './governingBody.json' with { type: 'json' };
import academicCouncil from './academicCouncil.json' with { type: 'json' };
import cspProjects from './cspProjects.json' with { type: 'json' };
import internships from './internships.json' with { type: 'json' };
import studentNptel from './studentNptel.json' with { type: 'json' };
import studentAchievements from './studentAchievements.json' with { type: 'json' };
import miniProjects from './miniProjects.json' with { type: 'json' };
import placements from './placements.json' with { type: 'json' };
import placementDrives from './placementDrives.json' with { type: 'json' };
import mous from './mous.json' with { type: 'json' };
import events from './events.json' with { type: 'json' };
import facultyDevelopment from './facultyDevelopment.json' with { type: 'json' };
import documentEvidence from './documentEvidence.json' with { type: 'json' };
import dataQualityReport from './dataQualityReport.json' with { type: 'json' };

export {
  departments,
  faculty,
  students,
  publications,
  patents,
  bosMeetings,
  bosMembers,
  governingBody,
  academicCouncil,
  cspProjects,
  internships,
  studentNptel,
  studentAchievements,
  miniProjects,
  placements,
  placementDrives,
  mous,
  events,
  facultyDevelopment,
  documentEvidence,
  dataQualityReport
};
`;
  fs.writeFileSync(path.join(outDir, 'index.js'), esIndexCode);

  console.log('\n================================================================');
  console.log('INGESTION SUMMARY & COMPLETION REPORT');
  console.log('================================================================');
  console.log(`Departments:                ${result.dataQualityReport.counts.departments}`);
  console.log(`Faculty Master Records:     ${result.dataQualityReport.counts.faculty}`);
  console.log(`Student Master Records:     ${result.dataQualityReport.counts.students}`);
  console.log(`Research Publications:      ${result.dataQualityReport.counts.publications}`);
  console.log(`Patents & IPR:              ${result.dataQualityReport.counts.patents}`);
  console.log(`BoS Meetings:               ${result.dataQualityReport.counts.bosMeetings}`);
  console.log(`BoS Member Master:          ${result.dataQualityReport.counts.bosMembers}`);
  console.log(`Governing Body Meetings:    ${result.dataQualityReport.counts.governingBody}`);
  console.log(`Academic Council (CAC):     ${result.dataQualityReport.counts.academicCouncil}`);
  console.log(`Community Projects (CSP):   ${result.dataQualityReport.counts.cspProjects}`);
  console.log(`Student Internships:        ${result.dataQualityReport.counts.internships}`);
  console.log(`Student NPTEL MOOCs:        ${result.dataQualityReport.counts.studentNptel}`);
  console.log(`Student Achievements:       ${result.dataQualityReport.counts.studentAchievements}`);
  console.log(`Mini Projects (Teams):      ${result.dataQualityReport.counts.miniProjects}`);
  console.log(`Campus Placement Offers:    ${result.dataQualityReport.counts.placements}`);
  console.log(`Unique Students Placed:     ${result.dataQualityReport.counts.uniqueStudentsPlaced}`);
  console.log(`Placement Drives:           ${result.dataQualityReport.counts.placementDrives}`);
  console.log(`Active Industry MoUs:       ${result.dataQualityReport.counts.mous}`);
  console.log(`Faculty Workshops Attended: ${result.dataQualityReport.counts.facultyWorkshopsAttended}`);
  console.log(`FDPs Organized:             ${result.dataQualityReport.counts.fdpsOrganized}`);
  console.log(`Faculty NPTEL MOOCs:        ${result.dataQualityReport.counts.facultyNptel}`);
  console.log(`Faculty Pursuing PhD:       ${result.dataQualityReport.counts.phdPursuing}`);
  console.log(`Authored Books & Chapters:  ${result.dataQualityReport.counts.books}`);
  console.log(`Indexed Evidence Documents: ${result.dataQualityReport.counts.documentsIndexed}`);
  console.log(`Duplicates Merged:          ${result.dataQualityReport.summary.duplicatesMerged}`);
  console.log(`Warnings / Rejections:      ${result.dataQualityReport.warningsCount} / ${result.dataQualityReport.rejectionsCount}`);
  console.log(`Execution Time:             ${result.dataQualityReport.durationMs}ms`);
  console.log('================================================================\n');

} catch (err) {
  console.error('[FATAL ERROR during data ingestion]:', err);
  process.exit(1);
}
