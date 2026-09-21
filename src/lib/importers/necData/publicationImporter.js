/**
 * publicationImporter.js
 * Ingests, normalizes, deduplicates, and classifies research publications across NEC datasets.
 */

import { normalizeDepartment } from './departmentNormalizer.js';
import { normalizeDate, deriveAcademicYearFromDate } from './dateNormalizer.js';
import { readWorkbook } from './workbookReader.js';

export function normalizeDoi(doi) {
  if (!doi) return '';
  return String(doi)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .trim();
}

export function cleanTitle(title) {
  if (!title) return '';
  return String(title)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function normalizePublicationType(rawType, rawVenue, row = {}) {
  const v = (String(rawVenue || '') + ' ' + String(rawType || '') + ' ' + String(row['Conference/Journal'] || '') + ' ' + String(row['Name of the Conference/Journal'] || '')).toLowerCase();
  
  if (v.includes('book chapter') || v.includes('chapter')) return 'Book Chapter';
  if (v.includes('book') && !v.includes('facebook') && !v.includes('handbook')) return 'Book';
  if (v.includes('preprint') || v.includes('arxiv') || v.includes('biorxiv') || v.includes('ssrn')) return 'Preprint';
  if (
    v.includes('conference') || 
    v.includes('proceedings') || 
    v.includes('symposium') || 
    v.includes('congress') || 
    v.includes('conferenc') ||
    v.includes('communicated') ||
    Boolean(row['Conference Dates']) ||
    Boolean(row['No. of Conferences Communicated'])
  ) {
    return 'Conference Paper';
  }
  if (
    v.includes('journal') || 
    v.includes('transactions') || 
    v.includes('letters') || 
    v.includes('scopus') || 
    v.includes('scie') || 
    v.includes('ugc') || 
    v.includes('ieee access') || 
    v.includes('springer') || 
    v.includes('elsevier') || 
    v.includes('mdpi') || 
    v.includes('wiley') ||
    Boolean(row['Volume No. & Issue No.']) ||
    Boolean(row['Page Number'])
  ) {
    return 'Journal Article';
  }
  if (rawVenue && rawVenue.trim().length > 3) {
    return 'Journal Article';
  }
  return 'Other Research Output';
}

export function importPublications(publicationFiles, facultyRegistry, studentRegistry, auditLog) {
  const canonicalPublications = [];
  const doiIndex = new Map();
  const titleYearIndex = new Map();
  let duplicateCount = 0;

  for (const fileItem of publicationFiles) {
    const { filePath, relPath, defaultDept } = fileItem;
    const wbRes = readWorkbook(filePath);
    if (!wbRes.success) {
      auditLog.warnings.push({
        file: relPath,
        reason: `Failed to read workbook: ${wbRes.error}`
      });
      continue;
    }

    for (const [sheetName, rows] of Object.entries(wbRes.sheets)) {
      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];

        // Flexible header extraction across varying column names
        const rawTitle = row['Title'] || row['PROJECT TITLE'] || row['PAPER TITLE'] || row['Paper Title'] || row['Title of the paper'] || row['NAME OF THE TITLE'];
        if (!rawTitle || typeof rawTitle !== 'string' || rawTitle.trim().length < 5) {
          continue; // Skip header remnants or empty rows
        }

        const title = rawTitle.trim();
        const normTitle = cleanTitle(title);
        if (!normTitle) continue;

        const rawDoi = row['DoI'] || row['DOI'] || row['doi'] || row['Digital Object Identifier'];
        const doi = normalizeDoi(rawDoi);

        const rawAuthors = [];
        // Check Author 1 through 7, Author1, Author 2 (Name), Guide, Student Names
        for (let a = 1; a <= 7; a++) {
          const aVal = row[`Author ${a}`] || 
                       row[`Author${a}`] || 
                       row[`Author ${a} (Name)`] || 
                       row[`Author${a} (Name)`] || 
                       row[`AUTHOR ${a}`] || 
                       row[`AUTHOR ${a}          (GUIDE NAME)`];
          if (aVal && typeof aVal === 'string' && aVal.trim()) {
            rawAuthors.push(aVal.trim());
          }
        }
        if (rawAuthors.length === 0 && row['GUIDE NAME'] && typeof row['GUIDE NAME'] === 'string') {
          rawAuthors.push(row['GUIDE NAME'].trim());
        }
        if (row['STUDENT NAMES'] && typeof row['STUDENT NAMES'] === 'string') {
          const stNames = String(row['STUDENT NAMES']).split(/[,;]/).map(s => s.trim()).filter(Boolean);
          for (const s of stNames) {
            if (!rawAuthors.includes(s)) rawAuthors.push(s);
          }
        }
        if (rawAuthors.length === 0 && row['Authors']) {
          rawAuthors.push(...String(row['Authors']).split(/[,;]/).map(s => s.trim()).filter(Boolean));
        }

        const rawVenue = row['Name of the Conference/Journal'] || row['Conference/Journal'] || row['Journal/Conference Name'] || row['Publisher'] || '';
        const rawDate = row['Date of Publication'] || row['Publication Date'] || row['Date'] || row['Year'];
        const dateMeta = normalizeDate(rawDate);
        
        let pubYear = dateMeta.isoDate ? dateMeta.isoDate.slice(0, 4) : '';
        if (!pubYear && typeof rawDate === 'number' && rawDate >= 2018 && rawDate <= 2030) {
          pubYear = String(rawDate);
        }

        const rawDept = row['Department'] || row['Dept'] || defaultDept || 'Institution Level';
        const deptMeta = normalizeDepartment(rawDept);

        const rawAy = row['Acd. Year'] || row['Academic Year'] || row['Acd Year'] || deriveAcademicYearFromDate(dateMeta.isoDate);
        const academicYear = rawAy ? String(rawAy).trim() : '2023-24';

        const isScopus = String(row['Scopus Indexed (Yes/No)'] || row['Scopus Indexed'] || row['Scopus'] || '').toLowerCase().includes('yes') ||
                         String(row['Conference/Journal'] || '').toLowerCase().includes('scopus');

        const isStudentPaper = String(row['Student/Faculty Publication'] || sheetName || '').toLowerCase().includes('student') ||
                               String(sheetName).includes('BATCH') ||
                               Boolean(row['STUDENT NAMES']);

        const pubType = normalizePublicationType(row['Conference/Journal'], rawVenue, row);

        // Check deduplication
        let existing = null;
        if (doi && doiIndex.has(doi)) {
          existing = doiIndex.get(doi);
        } else if (normTitle) {
          const tyKey = `${normTitle}::${pubYear || 'any'}`;
          if (titleYearIndex.has(tyKey)) {
            existing = titleYearIndex.get(tyKey);
          }
        }

        if (existing) {
          duplicateCount++;
          // Merge metadata
          if (!existing.doi && doi) existing.doi = doi;
          if (!existing.isClaimedScopus && isScopus) {
            existing.isClaimedScopus = true;
            existing.scopusIndexed = 'Yes (Claimed)';
          }
          if ((!existing.venue || existing.venue === 'Academic Journal / Conference Proceedings') && rawVenue) {
            existing.venue = rawVenue;
            existing.journalName = rawVenue;
          }
          for (const a of rawAuthors) {
            if (!existing.authorNames.includes(a)) {
              existing.authorNames.push(a);
              existing.authors.push({
                name: a,
                authorOrder: existing.authors.length + 1,
                department: deptMeta.canonicalCode,
                departmentCode: deptMeta.canonicalCode,
                designation: 'Author',
                affiliation: 'Narasaraopeta Engineering College (Autonomous)',
                isFirstAuthor: false,
                isCorresponding: false
              });
            }
          }
          existing.provenance.push({
            sourceFile: relPath,
            sheetName,
            rowNum: row.__rowNum
          });
          continue;
        }

        // Match internal faculty & student authors
        const internalFaculty = [];
        const internalStudents = [];
        for (const author of rawAuthors) {
          const matchedFac = facultyRegistry.matchFaculty(author, deptMeta.canonicalCode);
          if (matchedFac) {
            internalFaculty.push({ id: matchedFac.id, name: matchedFac.name });
          }
        }

        const authorList = rawAuthors.length > 0 ? rawAuthors : ['Author Not Recorded'];
        const firstAuthorName = authorList[0] || (internalFaculty[0]?.name) || 'Author Not Recorded';
        const primaryVenue = rawVenue ? String(rawVenue).trim() : 'Academic Journal / Conference Proceedings';

        const pubRecord = {
          id: `PUB_${deptMeta.canonicalCode.toLowerCase().replace(/[^a-z0-9]/g, '')}_${canonicalPublications.length + 1}`,
          title,
          doi: doi || null,
          authors: authorList.map((name, aIdx) => {
            const matchedFac = facultyRegistry.matchFaculty(name, deptMeta.canonicalCode);
            return {
              name,
              authorOrder: aIdx + 1,
              department: deptMeta.canonicalCode,
              departmentCode: deptMeta.canonicalCode,
              designation: matchedFac ? (matchedFac.designation || 'Faculty') : (isStudentPaper ? 'Student Scholar' : 'Author'),
              facultyId: matchedFac ? matchedFac.id : null,
              affiliation: matchedFac ? 'Narasaraopeta Engineering College (Autonomous)' : (isStudentPaper ? 'Narasaraopeta Engineering College' : 'Co-Author Affiliation'),
              isInternal: Boolean(matchedFac),
              isFirstAuthor: aIdx === 0,
              isCorresponding: aIdx === 0
            };
          }),
          authorNames: authorList,
          firstAuthor: firstAuthorName,
          facultyName: internalFaculty[0]?.name || firstAuthorName,
          internalFaculty,
          internalStudents,
          venue: primaryVenue,
          journalName: primaryVenue,
          journalConference: primaryVenue,
          department: deptMeta.canonicalCode,
          departmentCode: deptMeta.canonicalCode,
          departmentName: deptMeta.name,
          publicationYear: pubYear ? parseInt(pubYear, 10) : 2024,
          publicationDate: dateMeta.isoDate || dateMeta.displayDate || pubYear || '2024',
          academicYear,
          publicationType: pubType,
          scopusIndexed: isScopus ? 'Yes (Claimed)' : 'No',
          isClaimedScopus: isScopus,
          isScopusIndexed: false, // Remains false until confirmed by official Scopus API / DOI match
          scopusVerificationStatus: 'Claimed Indexed in Institutional Sheet',
          wosIndexed: 'No',
          isWosIndexed: false,
          openAccess: false,
          isOpenAccess: false,
          indexing: isScopus ? ['Claimed Indexed (Institutional Sheet)'] : ['Peer Reviewed / Communicated'],
          isStudentCoAuthored: isStudentPaper || internalStudents.length > 0,
          source: 'Institutional Excel',
          workflowStatus: 'Approved',
          verificationStatus: 'Institutional Record',
          status: 'Published',
          provenance: [{
            sourceFile: relPath,
            sheetName,
            rowNum: row.__rowNum
          }]
        };

        canonicalPublications.push(pubRecord);
        if (doi) doiIndex.set(doi, pubRecord);
        if (normTitle) {
          titleYearIndex.set(`${normTitle}::${pubYear || 'any'}`, pubRecord);
          titleYearIndex.set(`${normTitle}::any`, pubRecord);
        }
      }
    }
  }

  auditLog.duplicatesMerged += duplicateCount;
  return {
    publications: canonicalPublications,
    uniqueCount: canonicalPublications.length,
    duplicatesMerged: duplicateCount
  };
}
