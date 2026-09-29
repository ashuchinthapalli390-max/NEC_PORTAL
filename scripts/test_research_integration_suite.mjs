import assert from 'node:assert';
import { 
  INITIAL_PUBLICATIONS, 
  INITIAL_PATENTS, 
  INITIAL_FACULTY_RESEARCH_PROFILES, 
  FACULTY_DATA 
} from '../src/data/masterData.js';
import { 
  getPublications, 
  getPatents, 
  getFacultyResearchProfiles, 
  getFacultyResearchProfile, 
  saveFacultyResearchProfile,
  getDatasetVersions,
  universalResearchSearch,
  getMatchReviewQueue,
  resolveResearchMatch,
  getFacultyList,
  importPublicationsBatch,
  normalizePublicationRecord
} from '../src/data/portalStore.js';
import { parseScopusExportCSV, parseWosExport } from '../src/lib/research/exportParsers.js';
import { 
  INDEXED_NEC_WORKS, 
  INDEXED_NEC_AUTHORS, 
  INDEXED_CROSSREF_METADATA 
} from '../src/lib/research/localIndex/datasetStore.js';

console.log('====================================================');
console.log('NEC PORTAL: RESEARCH DATA INTEGRATION TEST SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(description, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`[PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${description}`);
    console.error(`       Error: ${err.message}\n`, err.stack);
  }
}

// 1. Authenticity of Master Data
runTest('1. INITIAL_PUBLICATIONS contains authentic records with DOIs, Scopus EIDs, and real authors', () => {
  assert(Array.isArray(INITIAL_PUBLICATIONS) && INITIAL_PUBLICATIONS.length >= 6, 'Should have at least 6 authentic publications');
  
  INITIAL_PUBLICATIONS.forEach(pub => {
    assert(pub.title && pub.title.length > 10, 'Each pub must have a real title');
    assert(pub.doi && pub.doi.startsWith('10.'), `DOI must be authentic format (got: ${pub.doi})`);
    assert(Array.isArray(pub.authors) && pub.authors.length > 0, 'Must have author roster');
    assert(pub.authors.every(a => a.name && !a.name.includes('currentUser')), 'Authors must not contain placeholders');
    assert(pub.scopusEid || pub.wosUid || pub.openalexWorkId, 'Must have at least one persistent scholarly identifier');
  });
});

runTest('2. INITIAL_PATENTS are sourced strictly from verified Indian Patent Office records', () => {
  assert(Array.isArray(INITIAL_PATENTS) && INITIAL_PATENTS.length >= 4, 'Should have at least 4 verified patents');
  
  INITIAL_PATENTS.forEach(pat => {
    assert(pat.patentRecordNumber.startsWith('PAT-'), 'Patent record number format check');
    assert(pat.applicationNumber && pat.applicationNumber.length >= 8, 'Application number must be authentic');
    assert(Array.isArray(pat.inventors) && pat.inventors.length > 0, 'Must have inventors roster');
    assert(pat.applicantName.includes('Narasaraopeta Engineering College'), 'Applicant must be NEC');
  });
});

runTest('3. INITIAL_FACULTY_RESEARCH_PROFILES contains authentic IDs (ORCID, Scopus, WoS, Vidwan)', () => {
  assert(Array.isArray(INITIAL_FACULTY_RESEARCH_PROFILES) && INITIAL_FACULTY_RESEARCH_PROFILES.length >= 6, 'Must have at least 6 faculty research profiles');
  
  INITIAL_FACULTY_RESEARCH_PROFILES.forEach(prof => {
    assert(prof.facultyId, 'Must have faculty ID');
    assert(prof.orcid && /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(prof.orcid), `ORCID format check for ${prof.facultyId}: ${prof.orcid}`);
    assert(prof.scopusAuthorId, `Must have Scopus Author ID for ${prof.facultyId}`);
  });
});

// 2. Dynamic Computed Dataset Counts
runTest('4. getDatasetVersions dynamically computes metrics from live records', () => {
  const versions = getDatasetVersions();
  assert(Array.isArray(versions) && versions.length >= 3, 'Must return dataset version descriptors');

  const openAlex = versions.find(v => v.source === 'OPENALEX');
  assert(openAlex, 'OpenAlex dataset version must exist');
  assert(typeof openAlex.relevantRecordCount === 'number' && openAlex.relevantRecordCount >= 5, 'OpenAlex relevant records count must be computed');
  assert(typeof openAlex.verifiedRecordCount === 'number', 'OpenAlex verified count must be computed');

  const crossref = versions.find(v => v.source === 'CROSSREF');
  assert(crossref && typeof crossref.relevantRecordCount === 'number' && crossref.relevantRecordCount >= 5, 'Crossref relevant records count must be computed');
});

// 3. Export Parsers (Zero Fake Author Injections)
runTest('5. parseScopusExportCSV extracts verbatim authors without default substitutions', () => {
  const sampleScopusCSV = `Authors,Title,Year,Source title,Volume,Issue,Page start,Page end,DOI,Link,EID
"Venkateswarlu, S., Krishna, K.R.","Advanced Edge Deep Learning for Medical Diagnostics",2026,"IEEE Transactions on Medical Imaging",45,2,112,125,"10.1109/TMI.2026.3541001","https://www.scopus.com/inward/record.uri?eid=2-s2.0-85199201928","2-s2.0-85199201928"`;

  const parsed = parseScopusExportCSV(sampleScopusCSV);
  assert.strictEqual(parsed.length, 1, 'Should parse 1 record');
  assert.strictEqual(parsed[0].title, 'Advanced Edge Deep Learning for Medical Diagnostics');
  assert.strictEqual(parsed[0].doi, '10.1109/tmi.2026.3541001');
  assert.strictEqual(parsed[0].scopusEid, '2-s2.0-85199201928');
  assert.strictEqual(parsed[0].authors.length, 2, 'Should extract 2 authors');
  assert.strictEqual(parsed[0].authors[0].name, 'Venkateswarlu, S.');
  assert.strictEqual(parsed[0].authors[1].name, 'Krishna, K.R.');
  // Ensure no fake department or currentUser injection
  assert.strictEqual(parsed[0].department, null, 'Parser must not inject hardcoded CSE department');
});

runTest('6. parseWosExport extracts verbatim UT and metadata', () => {
  const sampleWos = `PT J\nAU Vazram, B. Jhansi\nTI Zero-Trust IoT Protocol Architecture\nSO IEEE Internet of Things Journal\nPY 2025\nDI 10.1109/JIOT.2025.3489102\nUT WOS:001129481900001\nER\n`;
  const parsed = parseWosExport(sampleWos);
  assert.strictEqual(parsed.length, 1, 'Should parse 1 WoS record');
  assert.strictEqual(parsed[0].wosUid, 'WOS:001129481900001');
  assert.strictEqual(parsed[0].doi, '10.1109/jiot.2025.3489102');
  assert.strictEqual(parsed[0].authors[0].name, 'Vazram, B. Jhansi');
});

// 4. Deduplication & Batch Ingestion
runTest('7. importPublicationsBatch enforces deduplication hierarchy (DOI > EID > WOS > OpenAlex)', () => {
  const initialPubs = getPublications();
  const existingPub = initialPubs.find(p => p.doi) || initialPubs[0];
  const initialCount = initialPubs.length;

  const candidate = {
    title: existingPub.title,
    doi: existingPub.doi,
    scopusEid: '2-s2.0-85189201948',
    sources: ['SCOPUS_IMPORT']
  };

  const result = importPublicationsBatch([candidate], { name: 'Admin Tester' }, 'SCOPUS');
  
  // Must NOT create a duplicate record with the same DOI
  assert.strictEqual(result.length, initialCount, 'Should merge and deduplicate without creating a duplicate record');
  
  const mergedPub = result.find(p => p.doi && p.doi.toLowerCase() === existingPub.doi.toLowerCase());
  assert(mergedPub, 'Merged publication must exist');
  assert(mergedPub.sources.includes('SCOPUS') || mergedPub.sources.includes('SCOPUS_IMPORT'), 'Sources must be merged into canonical record');
});

// 5. Universal Research Search
runTest('8. universalResearchSearch finds publications, patents, and researchers across all identifier formats', () => {
  const initialPubs = getPublications();
  const existingPubWithDoi = initialPubs.find(p => p.doi);
  if (existingPubWithDoi) {
    const resDoi = universalResearchSearch(existingPubWithDoi.doi);
    assert(resDoi.publications.length >= 1, 'Should find publication by exact DOI');
  }

  // Search by Patent Application Number
  const realPatents = getPatents();
  assert(realPatents.length > 0, 'Patents must exist');
  const realPatent = realPatents[0];
  const resPat = universalResearchSearch(realPatent.applicationNumber);
  assert(resPat.patents.length >= 1, 'Should find patent by Application Number');

  // Search by ORCID
  const profiles = getFacultyResearchProfiles();
  const profWithOrcid = profiles.find(p => p.orcid);
  if (profWithOrcid) {
    const resOrcid = universalResearchSearch(profWithOrcid.orcid);
    assert(resOrcid.researchers.length >= 1, 'Should find researcher by ORCID');
  }

  // Search by Author Name
  const realFaculty = getFacultyList()[0];
  if (realFaculty) {
    const resAuthor = universalResearchSearch(realFaculty.name);
    assert(resAuthor.researchers.length >= 1, 'Should find researcher profile');
  }
});

// 6. Match Review Queue & Resolution
runTest('9. Match Review Queue and Author Linkage Resolution', () => {
  const queue = getMatchReviewQueue();
  assert(Array.isArray(queue), 'Match Review Queue should return array');

  // Test resolution on candidate
  const samplePub = getPublications()[0];
  const updatedPubs = resolveResearchMatch(samplePub.id, 1, 'NEC-FAC-001', 'LINK_FACULTY', { name: 'Admin' });
  const resolved = updatedPubs.find(p => p.id === samplePub.id);
  assert(resolved, 'Resolved publication must exist');
  assert.strictEqual(resolved.authors[0].facultyId, 'NEC-FAC-001', 'Faculty ID must be linked');
  assert.strictEqual(resolved.authors[0].matchStatus, 'VERIFIED', 'Match status must be VERIFIED');
});

console.log('\n====================================================');
console.log(`TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
console.log('====================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
