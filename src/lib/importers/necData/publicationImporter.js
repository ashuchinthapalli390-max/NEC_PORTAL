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

export function normalizePublicationType(rawType, rawVenue, row = {}, isStudentPaper = false) {
  const v = (String(rawVenue || '') + ' ' + String(rawType || '') + ' ' + String(row['Conference/Journal'] || '') + ' ' + String(row['Name of the Conference/Journal'] || '') + ' ' + String(row['National/International'] || '')).toLowerCase();
  
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
    isStudentPaper ||
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
  return 'Other';
}

function parseRawAuthorString(rawStr, defaultDept, facultyRegistry, studentRegistry) {
  if (!rawStr || typeof rawStr !== 'string') return null;
  const trimmed = rawStr.trim();
  if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'nil' || trimmed.toLowerCase() === 'no') return null;

  // Check if string contains comma followed by external affiliation (e.g. "B.RAMESH, GRIET")
  const parts = trimmed.split(',');
  let authorName = parts[0].trim();
  let externalAffiliation = null;
  if (parts.length > 1) {
    const candidateAffil = parts.slice(1).join(',').trim();
    if (/(griet|gnits|women|institute|university|college|technology|engineering)/i.test(candidateAffil)) {
      externalAffiliation = candidateAffil;
    } else {
      // It might just be "Lastname, Firstname"
      authorName = trimmed;
    }
  }

  // Remove leading numbers or labels like "1. ", "Dr. "
  const cleanedName = authorName.replace(/^[0-9]+[.\-)]\s*/, '').trim();
  if (!cleanedName || cleanedName.length < 2) return null;

  // Match faculty
  const matchedFac = facultyRegistry ? facultyRegistry.matchFaculty(cleanedName, defaultDept) : null;
  // Match student
  const matchedStudent = studentRegistry ? studentRegistry.matchStudentByName(cleanedName, defaultDept) : null;

  let authorType = 'Author';
  let affiliation = 'Narasaraopeta Engineering College (Autonomous)';
  let facultyId = null;
  let studentRollNumber = null;
  let department = defaultDept;
  let orcid = null;
  let scopusAuthorId = null;

  if (externalAffiliation) {
    authorType = 'External';
    affiliation = externalAffiliation;
    department = null;
  } else if (matchedFac) {
    authorType = 'Faculty';
    facultyId = matchedFac.id;
    department = matchedFac.department || defaultDept;
    affiliation = 'Narasaraopeta Engineering College (Autonomous)';
    orcid = matchedFac.orcid || null;
    scopusAuthorId = matchedFac.scopusAuthorId || null;
  } else if (matchedStudent) {
    authorType = 'Student';
    studentRollNumber = matchedStudent.rollNumber;
    department = matchedStudent.department || defaultDept;
    affiliation = 'Narasaraopeta Engineering College';
  }

  return {
    name: cleanedName,
    rawName: trimmed,
    authorType,
    facultyId,
    studentRollNumber,
    department,
    affiliation,
    orcid,
    scopusAuthorId
  };
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
      let lastCreatedPub = null;

      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];

        // Flexible header extraction across varying column names
        const rawTitle = row['Title'] || row['PROJECT TITLE'] || row['PAPER TITLE'] || row['Paper Title'] || row['Title of the paper'] || row['NAME OF THE TITLE'];
        
        // Handle merged rows in student batch sheets where Title is only on first row of team
        if ((!rawTitle || typeof rawTitle !== 'string' || rawTitle.trim().length < 5)) {
          const subRoll = row['ROLL  NUMBER'] || row['ROLL NUMBER'] || row['H.T NUMBER'] || row['HT NO'] || row['ROLL NO'];
          const subStudent = row['STUDENT NAMES'] || row['NAME OF THE STUDENT'] || row['STUDENT NAME'] || row['Student Name'];
          
          if (lastCreatedPub && (subRoll || subStudent)) {
            const rollStr = subRoll ? String(subRoll).trim() : null;
            const nameStr = subStudent ? String(subStudent).trim() : null;
            if (nameStr || rollStr) {
              const studentObj = {
                rollNumber: rollStr,
                name: nameStr || rollStr,
                department: lastCreatedPub.department
              };
              if (!lastCreatedPub.internalStudents.some(s => s.rollNumber && s.rollNumber === rollStr)) {
                lastCreatedPub.internalStudents.push(studentObj);
              }
              // If an author matches this student name, attach roll number
              if (nameStr) {
                const normSubName = nameStr.toLowerCase().replace(/[^a-z]/g, '');
                for (const auth of lastCreatedPub.authors) {
                  const normAuthName = auth.name.toLowerCase().replace(/[^a-z]/g, '');
                  if (normAuthName.includes(normSubName) || normSubName.includes(normAuthName)) {
                    auth.studentRollNumber = rollStr;
                    auth.authorType = 'Student';
                  }
                }
              }
            }
          }
          continue; // Skip header remnants or empty rows
        }

        const title = rawTitle.trim();
        const normTitle = cleanTitle(title);
        if (!normTitle) continue;

        const rawDoi = row['DoI'] || row['DOI'] || row['doi'] || row['Digital Object Identifier'];
        const doi = normalizeDoi(rawDoi);

        const rawDept = row['Department'] || row['Dept'] || defaultDept || 'Institution Level';
        const deptMeta = normalizeDepartment(rawDept);

        const isStudentPaper = String(row['Student/Faculty Publication'] || sheetName || '').toLowerCase().includes('student') ||
                               String(sheetName).includes('BATCH') ||
                               Boolean(row['STUDENT NAMES']);

        const rawAuthorCandidates = [];
        // Check Author 1 through 7 and variations
        for (let a = 1; a <= 7; a++) {
          const aVal = row[`Author ${a}`] || 
                       row[`Author${a}`] || 
                       row[`Author ${a} (Name)`] || 
                       row[`Author${a} (Name)`] || 
                       row[`AUTHOR ${a}`] || 
                       row[`Author${a} (Guide)`] ||
                       row[`Author ${a} (Guide)`] ||
                       row[`Author1 (Guide)`] ||
                       row[`Author 1 (Guide)`] ||
                       row[`AUTHOR ${a}          (GUIDE NAME)`];
          if (aVal && typeof aVal === 'string' && aVal.trim()) {
            rawAuthorCandidates.push(aVal.trim());
          }
        }
        if (rawAuthorCandidates.length === 0 && row['GUIDE NAME'] && typeof row['GUIDE NAME'] === 'string') {
          rawAuthorCandidates.push(row['GUIDE NAME'].trim());
        }
        if (row['STUDENT NAMES'] && typeof row['STUDENT NAMES'] === 'string') {
          const stNames = String(row['STUDENT NAMES']).split(/[,;]/).map(s => s.trim()).filter(Boolean);
          for (const s of stNames) {
            if (!rawAuthorCandidates.includes(s)) rawAuthorCandidates.push(s);
          }
        }
        if (rawAuthorCandidates.length === 0 && row['Authors']) {
          rawAuthorCandidates.push(...String(row['Authors']).split(/[,;]/).map(s => s.trim()).filter(Boolean));
        }

        // Parse structured authors
        const parsedAuthors = [];
        for (let i = 0; i < rawAuthorCandidates.length; i++) {
          const parsed = parseRawAuthorString(rawAuthorCandidates[i], deptMeta.canonicalCode, facultyRegistry, studentRegistry);
          if (parsed && !parsedAuthors.some(a => a.name.toLowerCase() === parsed.name.toLowerCase())) {
            parsed.authorOrder = parsedAuthors.length + 1;
            parsed.isFirstAuthor = parsedAuthors.length === 0;
            parsed.isCorresponding = parsedAuthors.length === 0;
            if (isStudentPaper && parsed.authorType === 'Author') {
              parsed.authorType = 'Student';
            }
            parsedAuthors.push(parsed);
          }
        }

        const rawVenue = row['Name of the Conference/Journal'] || row['Conference/Journal'] || row['Journal/Conference Name'] || row['Publisher'] || '';
        const rawDate = row['Date of Publication'] || row['Publication Date'] || row['Date'] || row['Year'];
        const dateMeta = normalizeDate(rawDate);
        
        let pubYear = dateMeta.isoDate ? dateMeta.isoDate.slice(0, 4) : '';
        if (!pubYear && typeof rawDate === 'number' && rawDate >= 2018 && rawDate <= 2030) {
          pubYear = String(rawDate);
        }

        const rawAy = row['Acd. Year'] || row['Academic Year'] || row['Acd Year'] || deriveAcademicYearFromDate(dateMeta.isoDate);
        const academicYear = rawAy ? String(rawAy).trim() : '2023-24';

        const isScopus = String(row['Scopus Indexed (Yes/No)'] || row['Scopus Indexed'] || row['Scopus'] || '').toLowerCase().includes('yes') ||
                         String(row['Conference/Journal'] || '').toLowerCase().includes('scopus');

        const pubType = normalizePublicationType(row['Conference/Journal'], rawVenue, row, isStudentPaper);

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
          for (const newA of parsedAuthors) {
            if (!existing.authors.some(a => a.name.toLowerCase() === newA.name.toLowerCase())) {
              newA.authorOrder = existing.authors.length + 1;
              newA.isFirstAuthor = false;
              newA.isCorresponding = false;
              existing.authors.push(newA);
              existing.authorNames.push(newA.name);
            }
          }
          existing.provenance.push({
            sourceFile: relPath,
            sheetName,
            rowNum: row.__rowNum
          });
          lastCreatedPub = existing;
          continue;
        }

        // Match internal faculty & student authors
        const internalFaculty = parsedAuthors.filter(a => a.authorType === 'Faculty').map(a => ({ id: a.facultyId, name: a.name }));
        const internalStudents = [];
        
        // Check if first row has roll number or student name
        const firstRowRoll = row['ROLL  NUMBER'] || row['ROLL NUMBER'] || row['H.T NUMBER'] || row['HT NO'] || row['ROLL NO'];
        const firstRowStudent = row['STUDENT NAMES'] || row['NAME OF THE STUDENT'] || row['STUDENT NAME'] || row['Student Name'];
        if (firstRowRoll || firstRowStudent) {
          internalStudents.push({
            rollNumber: firstRowRoll ? String(firstRowRoll).trim() : null,
            name: firstRowStudent ? String(firstRowStudent).trim() : (firstRowRoll ? String(firstRowRoll).trim() : ''),
            department: deptMeta.canonicalCode
          });
          // Attach roll number to matching author
          if (firstRowStudent && firstRowRoll) {
            const normFst = String(firstRowStudent).toLowerCase().replace(/[^a-z]/g, '');
            for (const auth of parsedAuthors) {
              const normAuth = auth.name.toLowerCase().replace(/[^a-z]/g, '');
              if (normAuth.includes(normFst) || normFst.includes(normAuth)) {
                auth.studentRollNumber = String(firstRowRoll).trim();
                auth.authorType = 'Student';
              }
            }
          }
        }

        const authorList = parsedAuthors.length > 0 ? parsedAuthors : [{
          name: 'Author Not Recorded',
          rawName: 'Author Not Recorded',
          authorOrder: 1,
          authorType: 'Author',
          facultyId: null,
          studentRollNumber: null,
          department: deptMeta.canonicalCode,
          affiliation: 'Narasaraopeta Engineering College',
          isFirstAuthor: true,
          isCorresponding: true
        }];

        const firstAuthorName = authorList[0].name;
        const primaryVenue = rawVenue ? String(rawVenue).trim() : 'Academic Journal / Conference Proceedings';

        const pubRecord = {
          id: `PUB_${deptMeta.canonicalCode.toLowerCase().replace(/[^a-z0-9]/g, '')}_${canonicalPublications.length + 1}`,
          title,
          doi: doi || null,
          authors: authorList,
          authorNames: authorList.map(a => a.name),
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
          isScopusIndexed: false, // Confirmed by official Scopus API
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
        lastCreatedPub = pubRecord;
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
