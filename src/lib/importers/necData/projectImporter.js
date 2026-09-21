/**
 * projectImporter.js
 * Ingests and groups departmental Mini Projects, parsing team numbers, guides, and relational student members.
 */

import { readWorkbook } from './workbookReader.js';
import { normalizeRollNumber } from './rollNumberDecoder.js';
import { normalizeDepartment } from './departmentNormalizer.js';

export function importMiniProjects(miniProjectFiles, studentRegistry, facultyRegistry, auditLog) {
  const projects = [];

  for (const item of miniProjectFiles) {
    const { filePath, relPath, defaultDept, defaultBatch } = item;
    const wbRes = readWorkbook(filePath);
    if (!wbRes.success) continue;

    const deptMeta = normalizeDepartment(defaultDept);

    for (const [sheetName, rows] of Object.entries(wbRes.sheets)) {
      let currentProject = null;

      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];

        const rawBatch = row['BATCHES'] || row['Batch'] || row['BATCH'] || row['Team No'];
        const rawTitle = row['NAME OF THE TITLE'] || row['PROJECT TITLE'] || row['Project Title'] || row['Title'];
        const rawGuide = row['NAME OF THE GUIDE'] || row['Guide Name'] || row['Name of the Guide'];

        const rawRoll = row['HTNO'] || row['HT NO'] || row['Roll Number'] || row['Roll No'];
        const normRoll = normalizeRollNumber(rawRoll);
        const rawStudent = row['NAME'] || row['Student Name'] || row['Name of the Student'] || '';

        // Check if a new team / project starts here
        const isNewTeam = Boolean(rawBatch || (rawTitle && typeof rawTitle === 'string' && rawTitle.trim().length > 3));

        if (isNewTeam) {
          // If we already have an active team, finalize and save it
          if (currentProject && currentProject.teamMembers.length > 0) {
            projects.push(currentProject);
          }

          const teamCode = rawBatch ? String(rawBatch).trim() : `Team_${projects.length + 1}`;
          const title = rawTitle && typeof rawTitle === 'string' && rawTitle.trim().length > 3
            ? rawTitle.trim()
            : (currentProject ? currentProject.title : 'Emerging Technologies Mini Project');

          let guideName = rawGuide ? String(rawGuide).trim() : (currentProject ? currentProject.guideName : 'Faculty Supervisor');
          const matchedGuide = facultyRegistry.matchFaculty(guideName, deptMeta.canonicalCode);
          if (matchedGuide) guideName = matchedGuide.name;

          currentProject = {
            id: `MINI_${deptMeta.canonicalCode.toLowerCase()}_${defaultBatch}_${projects.length + 1}`,
            projectNumber: `MP-${deptMeta.canonicalCode}-${defaultBatch}-${String(projects.length + 1).padStart(3, '0')}`,
            teamNumber: teamCode,
            title,
            projectTitle: title,
            projectType: 'Mini Project',
            department: deptMeta.canonicalCode,
            departmentName: deptMeta.name,
            batch: `${defaultBatch} Batch`,
            academicYear: `${defaultBatch}-${String(parseInt(defaultBatch, 10) + 1).slice(2)}`,
            domain: 'Artificial Intelligence & Software Engineering',
            guideName,
            guideFacultyId: matchedGuide ? matchedGuide.id : null,
            guide: {
              name: guideName,
              facultyId: matchedGuide ? matchedGuide.id : null,
              department: deptMeta.canonicalCode
            },
            status: 'Recorded',
            stage: 'RECORDED',
            workflowStatus: 'Approval Not Recorded',
            verificationStatus: 'Recorded',
            teamMembers: [],
            provenance: {
              sourceFile: relPath,
              sheetName,
              startRow: row.__rowNum
            }
          };
        }

        // Add student to current project
        if (normRoll && currentProject) {
          const student = studentRegistry.reconcileStudent(normRoll, rawStudent, deptMeta.canonicalCode, {
            sourceFile: relPath,
            activityType: 'miniProjects'
          });

          const isLeader = currentProject.teamMembers.length === 0;
          const sName = student ? student.name : (String(rawStudent).trim() || normRoll);
          currentProject.teamMembers.push({
            rollNumber: normRoll,
            studentName: sName,
            name: sName,
            isLeader
          });
        }
      }

      // Finalize last project in sheet
      if (currentProject && currentProject.teamMembers.length > 0) {
        projects.push(currentProject);
      }
    }
  }

  return {
    miniProjects: projects,
    count: projects.length
  };
}
