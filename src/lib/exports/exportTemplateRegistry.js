/**
 * exportTemplateRegistry.js
 * Central Registry of Official Institutional Report Formats for Narasaraopeta Engineering College.
 *
 * Maps every portal module to its official source workbook/report template from nec-data,
 * preserving exact column order, headings, and sheet layouts for Excel, CSV, and PDF exports.
 */

export const MODULE_EXPORT_TEMPLATES = {
  publications: {
    moduleKey: 'publications',
    sourceTemplateName: 'PUBLICATIONS FACULTY.xlsx',
    reportTitle: 'Faculty Research Publications Repository',
    sheetName: 'Publications',
    excelColumns: [
      'S.No',
      'Department',
      'Author(s)',
      'Title of the Paper',
      'Publication Type',
      'Journal / Conference Name',
      'ISSN / ISBN',
      'Year of Publication',
      'Publication Date',
      'Indexing Status',
      'DOI / Link',
      'Approval Status'
    ],
    mapToTemplateRow: (p, idx) => ({
      'S.No': idx + 1,
      'Department': p.department || p.dept || 'Institution Level',
      'Author(s)': Array.isArray(p.authors) ? p.authors.map(a => a.name || a).join(', ') : (p.author || p.authors || 'Not recorded'),
      'Title of the Paper': p.title || p.paperTitle || '—',
      'Publication Type': p.publicationType || p.type || 'Journal Article',
      'Journal / Conference Name': p.venue || p.journal || p.conference || '—',
      'ISSN / ISBN': p.issn || p.isbn || '—',
      'Year of Publication': p.year || (p.publicationDate ? p.publicationDate.slice(0, 4) : '—'),
      'Publication Date': p.publicationDate || p.date || '—',
      'Indexing Status': p.scopusIndexed ? 'Verified in Scopus' : (p.indexing || 'Institutional Sheet'),
      'DOI / Link': p.doi || p.link || p.url || '—',
      'Approval Status': p.workflowStatus || p.status || 'Approval Not Recorded'
    }),
    pdfColumns: ['S.No', 'Dept', 'Authors', 'Paper Title', 'Type', 'Journal / Conference', 'Year', 'Indexing'],
    mapToPdfRow: (p, idx) => [
      idx + 1,
      p.department || 'All',
      Array.isArray(p.authors) ? p.authors.slice(0, 2).map(a => a.name || a).join(', ') + (p.authors.length > 2 ? ` +${p.authors.length - 2}` : '') : (p.author || '—'),
      p.title || '—',
      p.publicationType || 'Journal',
      p.venue || p.journal || '—',
      p.year || '—',
      p.scopusIndexed ? 'Scopus' : (p.indexing || 'Institutional')
    ]
  },

  patents: {
    moduleKey: 'patents',
    sourceTemplateName: 'Patents filed by the faculty .xlsx',
    reportTitle: 'Patents & Intellectual Property Rights Register',
    sheetName: 'Patents',
    excelColumns: [
      'S.No.',
      'Name of the Faculty',
      'Dept',
      'Title of the patent',
      'Application  No',
      'Date of Fililng',
      'Publication  Date',
      'Acd-Year',
      'Status'
    ],
    mapToTemplateRow: (p, idx) => ({
      'S.No.': idx + 1,
      'Name of the Faculty': Array.isArray(p.inventors) ? p.inventors.map(i => i.name || i).join(', ') : (p.inventorName || p.leadInventor || 'Not recorded'),
      'Dept': p.department || 'Institution Level',
      'Title of the patent': p.title || p.patentTitle || '—',
      'Application  No': p.applicationNumber || p.patentNumber || '—',
      'Date of Fililng': p.filingDate || '—',
      'Publication  Date': p.publicationDate || '—',
      'Acd-Year': p.academicYear || '—',
      'Status': p.status || 'Published'
    }),
    pdfColumns: ['S.No', 'Application No', 'Patent Title', 'Dept', 'Inventors', 'Filing Date', 'Status'],
    mapToPdfRow: (p, idx) => [
      idx + 1,
      p.applicationNumber || '—',
      p.title || '—',
      p.department || 'Institution Level',
      Array.isArray(p.inventors) ? p.inventors.slice(0, 2).map(i => i.name || i).join(', ') + (p.inventors.length > 2 ? ` (+${p.inventors.length - 2})` : '') : (p.inventorName || '—'),
      p.filingDate || '—',
      p.status || 'Published'
    ]
  },

  mous: {
    moduleKey: 'mous',
    sourceTemplateName: 'MoUs.xlsx',
    reportTitle: 'Industry MoUs & Institutional Collaborations Register',
    sheetName: 'MoUs',
    excelColumns: [
      'S.NO',
      'Name of the Organization/Institution with whom MoU is being signed',
      'Partner Type',
      'Department / Level',
      'Duration/Validity',
      'StartDate',
      'EndDate',
      'Purpose / Activity',
      'Status'
    ],
    mapToTemplateRow: (m, idx) => ({
      'S.NO': idx + 1,
      'Name of the Organization/Institution with whom MoU is being signed': m.organization || m.partnerName || m.company || 'Not recorded',
      'Partner Type': m.partnerType || 'Corporate / Industry',
      'Department / Level': m.department || 'Institution Level',
      'Duration/Validity': m.validityPeriod || m.duration || 'Validity Not Recorded',
      'StartDate': m.startDate || m.signedDate || '—',
      'EndDate': m.endDate || m.expiryDate || '—',
      'Purpose / Activity': m.purpose || m.title || m.activity || 'Academic & Technical Collaboration',
      'Status': m.status || 'Active'
    }),
    pdfColumns: ['S.No', 'Organization / Partner', 'Type', 'Level', 'Validity', 'Signed Date', 'Expiry Date', 'Status'],
    mapToPdfRow: (m, idx) => [
      idx + 1,
      m.organization || m.partnerName || 'Partner',
      m.partnerType || 'Industry',
      m.department || 'Institution Level',
      m.validityPeriod || m.duration || 'Validity Not Recorded',
      m.startDate || m.signedDate || '—',
      m.endDate || m.expiryDate || '—',
      m.status || 'Active'
    ]
  },

  fdpsOrganized: {
    moduleKey: 'fdpsOrganized',
    sourceTemplateName: 'FDPS ORGANIZED.xlsx',
    reportTitle: 'Faculty Development Programs & Workshops Organized',
    sheetName: 'FDPs_Organized',
    excelColumns: [
      'S.No',
      'Department',
      'Title of the FDP',
      'Name of the Coordinator(s)',
      'Dates (From - To)',
      'Resource Persons',
      'No. of Participants',
      'Mode',
      'Status'
    ],
    mapToTemplateRow: (f, idx) => ({
      'S.No': idx + 1,
      'Department': f.department || 'Institution Level',
      'Title of the FDP': f.title || 'Needs Review',
      'Name of the Coordinator(s)': Array.isArray(f.coordinators) ? f.coordinators.map(c => c.name || c).join(', ') : (f.coordinator || 'Not recorded'),
      'Dates (From - To)': f.startDate && f.endDate ? `${f.startDate} to ${f.endDate}` : (f.dates || 'Not recorded'),
      'Resource Persons': Array.isArray(f.resourcePersons) ? f.resourcePersons.map(r => r.name || r).join(', ') : (f.resourcePerson || '—'),
      'No. of Participants': f.participantCount !== undefined && f.participantCount !== null ? f.participantCount : '—',
      'Mode': f.mode || 'Offline / Virtual',
      'Status': f.status || 'Conducted'
    }),
    pdfColumns: ['S.No', 'Program Title', 'Dept', 'Coordinators', 'Dates', 'Resource Persons', 'Participants'],
    mapToPdfRow: (f, idx) => [
      idx + 1,
      f.title || '—',
      f.department || 'Institution Level',
      Array.isArray(f.coordinators) ? f.coordinators.map(c => c.name || c).join(', ') : (f.coordinator || 'Not recorded'),
      f.startDate && f.endDate ? `${f.startDate} to ${f.endDate}` : '—',
      Array.isArray(f.resourcePersons) ? f.resourcePersons.map(r => r.name || r).join(', ') : (f.resourcePerson || '—'),
      f.participantCount || '—'
    ]
  },

  workshopsAttended: {
    moduleKey: 'workshopsAttended',
    sourceTemplateName: 'Faculty Achiements - Workshops Attended.xlsx',
    reportTitle: 'Faculty Achievements & Programs Attended',
    sheetName: 'Workshops_Attended',
    excelColumns: [
      'S.No',
      'Department',
      'Name of the Faculty',
      'Type of Activity',
      'Title of the Program',
      'Dates (From - To)',
      'Organizing Institution',
      'Duration'
    ],
    mapToTemplateRow: (w, idx) => ({
      'S.No': idx + 1,
      'Department': w.department || 'Institution Level',
      'Name of the Faculty': w.facultyName || w.name || 'Not recorded',
      'Type of Activity': w.activityType || w.type || 'FDP / Workshop',
      'Title of the Program': w.title || w.programTitle || '—',
      'Dates (From - To)': w.dates || (w.startDate && w.endDate ? `${w.startDate} to ${w.endDate}` : '—'),
      'Organizing Institution': w.organizer || w.hostInstitution || '—',
      'Duration': w.duration || '—'
    }),
    pdfColumns: ['S.No', 'Faculty Name', 'Dept', 'Type', 'Program Title', 'Dates', 'Organizing Body'],
    mapToPdfRow: (w, idx) => [
      idx + 1,
      w.facultyName || 'Faculty',
      w.department || 'N/A',
      w.activityType || 'FDP',
      w.title || '—',
      w.dates || '—',
      w.organizer || '—'
    ]
  },

  csp: {
    moduleKey: 'csp',
    sourceTemplateName: '2022 BATCH CSP DATA.xlsx',
    reportTitle: 'Community Service Projects (CSP) Institutional Register',
    sheetName: 'CSP_Projects',
    excelColumns: [
      'S.No',
      'Roll Number',
      'Name of the Student',
      'Department',
      'Batch',
      'Title of the Project',
      'Name of the Guide',
      'Village / Community',
      'Document Evidence',
      'Status'
    ],
    mapToTemplateRow: (c, idx) => {
      const leadStudent = Array.isArray(c.students) && c.students.length > 0 ? c.students[0] : null;
      const allStudents = Array.isArray(c.students) ? c.students.map(s => `${s.rollNumber} (${s.studentName || s.name})`).join(', ') : '';
      return {
        'S.No': idx + 1,
        'Roll Number': leadStudent ? leadStudent.rollNumber : (c.rollNumber || '—'),
        'Name of the Student': allStudents || c.studentName || '—',
        'Department': c.department || '—',
        'Batch': c.batch || c.batchYear || '—',
        'Title of the Project': c.title || 'Community Service Project',
        'Name of the Guide': c.facultyGuideName || c.guideName || 'Not recorded',
        'Village / Community': c.community || c.village || 'Palnadu Region',
        'Document Evidence': c.hasPdfBook ? 'CSP Project Book Linked' : 'No document linked',
        'Status': c.status || 'Submitted'
      };
    },
    pdfColumns: ['S.No', 'Roll No', 'Student(s)', 'Dept', 'Batch', 'Project Title', 'Guide', 'Evidence', 'Status'],
    mapToPdfRow: (c, idx) => {
      const leadStudent = Array.isArray(c.students) && c.students.length > 0 ? c.students[0] : null;
      return [
        idx + 1,
        leadStudent ? leadStudent.rollNumber : (c.rollNumber || '—'),
        leadStudent ? leadStudent.studentName || leadStudent.name : (c.studentName || '—'),
        c.department || '—',
        c.batchYear || c.batch || '—',
        c.title || '—',
        c.facultyGuideName || '—',
        c.hasPdfBook ? 'Book Linked' : '—',
        c.status || 'Submitted'
      ];
    }
  },

  bos: {
    moduleKey: 'bos',
    sourceTemplateName: 'BOS CSE CS.xlsx',
    reportTitle: 'Board of Studies (BoS) Meeting Proceedings & Governance',
    sheetName: 'BoS_Meetings',
    excelColumns: [
      'S.No',
      'Department',
      'Meeting Number',
      'Regulations',
      'Meeting Date',
      'Meeting Mode',
      'University Nominee',
      'External Expert 1',
      'External Expert 2',
      'Industry Member',
      'Alumni Representative',
      'Workflow Status',
      'Linked Documents'
    ],
    mapToTemplateRow: (b, idx) => {
      const attendees = Array.isArray(b.attendees) ? b.attendees : [];
      const getAtt = (role) => {
        const found = attendees.find(a => a.role?.toLowerCase().includes(role.toLowerCase()));
        return found ? found.name : '—';
      };
      const docCount = Array.isArray(b.documents) ? b.documents.length : 0;
      return {
        'S.No': idx + 1,
        'Department': b.department || '—',
        'Meeting Number': b.meetingNumber || 'Meeting I',
        'Regulations': b.regulation || 'R23',
        'Meeting Date': b.meetingDate || b.date || '—',
        'Meeting Mode': b.mode || b.meetingMode || 'Offline',
        'University Nominee': getAtt('University Nominee'),
        'External Expert 1': getAtt('External Expert 1') !== '—' ? getAtt('External Expert 1') : getAtt('Ext. Mem1'),
        'External Expert 2': getAtt('External Expert 2') !== '—' ? getAtt('External Expert 2') : getAtt('Ext. Mem2'),
        'Industry Member': getAtt('Industry'),
        'Alumni Representative': getAtt('Alumni'),
        'Workflow Status': b.workflowStatus || 'Approval Not Recorded',
        'Linked Documents': docCount > 0 ? `${docCount} Official Document(s) Linked` : 'No linked document'
      };
    },
    pdfColumns: ['S.No', 'Dept', 'Meeting', 'Regulation', 'Date', 'Mode', 'University Nominee', 'Approval', 'Documents'],
    mapToPdfRow: (b, idx) => [
      idx + 1,
      b.department || '—',
      b.meetingNumber || 'Meeting I',
      b.regulation || 'R23',
      b.meetingDate || '—',
      b.meetingMode || 'In-Person',
      (b.attendees || []).find(a => a.role?.includes('Nominee'))?.name || '—',
      b.workflowStatus || 'Recorded',
      b.documents?.length > 0 ? `${b.documents.length} File(s)` : 'None'
    ]
  },

  placements: {
    moduleKey: 'placements',
    sourceTemplateName: 'CAMPUS PLACEMENTS.xlsx',
    reportTitle: 'Campus Recruitment & Placement Offers Register',
    sheetName: 'Placements',
    excelColumns: [
      'S.No.',
      'Roll Number',
      'Name of the Student',
      'Branch',
      'Company',
      'Package (LPA)',
      'Academic Year',
      'Status'
    ],
    mapToTemplateRow: (p, idx) => ({
      'S.No.': idx + 1,
      'Roll Number': p.studentRollNumber || p.rollNumber || '—',
      'Name of the Student': p.studentName || '—',
      'Branch': p.department || p.branch || '—',
      'Company': p.company || '—',
      'Package (LPA)': p.packageLpa !== undefined && p.packageLpa !== null ? p.packageLpa : '—',
      'Academic Year': p.academicYear || '—',
      'Status': p.placementStatus || p.status || 'Placed'
    }),
    pdfColumns: ['S.No', 'Roll Number', 'Student Name', 'Branch', 'Company', 'Package (LPA)', 'Academic Year'],
    mapToPdfRow: (p, idx) => [
      idx + 1,
      p.studentRollNumber || p.rollNumber || '—',
      p.studentName || '—',
      p.department || p.branch || '—',
      p.company || '—',
      p.packageLpa ? `${p.packageLpa} LPA` : '—',
      p.academicYear || '—'
    ]
  },

  placementDrives: {
    moduleKey: 'placementDrives',
    sourceTemplateName: 'DRIVES - COMPANIES LIST.xlsx',
    reportTitle: 'Placement Recruitment Drives & Companies Visited',
    sheetName: 'Placement_Drives',
    excelColumns: [
      'S.No',
      'Company Name',
      'Drive Date',
      'Eligible Branches',
      'Package Offered',
      'Job Role',
      'Status'
    ],
    mapToTemplateRow: (d, idx) => ({
      'S.No': idx + 1,
      'Company Name': d.companyName || d.company || '—',
      'Drive Date': d.driveDate || d.date || '—',
      'Eligible Branches': Array.isArray(d.branches) ? d.branches.join(', ') : (d.branch || 'ET Branches'),
      'Package Offered': d.packageOffered || d.package || '—',
      'Job Role': d.role || d.designation || 'Associate Software Engineer',
      'Status': d.status || 'Completed'
    }),
    pdfColumns: ['S.No', 'Company Name', 'Drive Date', 'Branches', 'Package', 'Role', 'Status'],
    mapToPdfRow: (d, idx) => [
      idx + 1,
      d.companyName || d.company || '—',
      d.driveDate || '—',
      Array.isArray(d.branches) ? d.branches.join(', ') : 'ET',
      d.packageOffered || '—',
      d.role || 'Associate',
      d.status || 'Completed'
    ]
  },

  studentNptel: {
    moduleKey: 'studentNptel',
    sourceTemplateName: 'NPTEL AIML.xlsx',
    reportTitle: 'Student NPTEL / SWAYAM MOOC Certifications Register',
    sheetName: 'Student_NPTEL',
    excelColumns: [
      'S.No',
      'Roll Number',
      'Name of the Student',
      'Department',
      'Course Name',
      'Internal (25)',
      'External (75)',
      'Total Score',
      'Award Category',
      'Academic Year',
      'Certificate Status'
    ],
    mapToTemplateRow: (n, idx) => ({
      'S.No': idx + 1,
      'Roll Number': n.rollNumber || n.studentRollNo || '—',
      'Name of the Student': n.studentName || n.name || '—',
      'Department': n.department || '—',
      'Course Name': n.courseName || n.course || n.title || '—',
      'Internal (25)': n.internalScore !== undefined && n.internalScore !== null ? n.internalScore : '—',
      'External (75)': n.externalScore !== undefined && n.externalScore !== null ? n.externalScore : '—',
      'Total Score': n.score !== undefined && n.score !== null ? n.score : '—',
      'Award Category': n.awardCategory || 'Successfully Completed',
      'Academic Year': n.academicYear || '—',
      'Certificate Status': n.hasCertificate ? 'Certificate Uploaded' : 'Certificate not uploaded'
    }),
    pdfColumns: ['S.No', 'Roll Number', 'Student Name', 'Dept', 'Course Name', 'Score', 'Award', 'Certificate'],
    mapToPdfRow: (n, idx) => [
      idx + 1,
      n.rollNumber || '—',
      n.studentName || '—',
      n.department || '—',
      n.courseName || '—',
      n.score !== undefined ? String(n.score) : '—',
      n.awardCategory || 'Completed',
      n.hasCertificate ? 'Uploaded' : 'Certificate not uploaded'
    ]
  },

  facultyNptel: {
    moduleKey: 'facultyNptel',
    sourceTemplateName: 'FACULLTY NPTEL.xlsx',
    reportTitle: 'Faculty NPTEL Certifications Register',
    sheetName: 'Faculty_NPTEL',
    excelColumns: [
      'S.No',
      'Name of the Faculty',
      'Department',
      'Course Name',
      'Score',
      'Result',
      'Session / Period'
    ],
    mapToTemplateRow: (f, idx) => ({
      'S.No': idx + 1,
      'Name of the Faculty': f.facultyName || f.name || '—',
      'Department': f.department || 'Institution Level',
      'Course Name': f.courseName || f.course || '—',
      'Score': f.score !== undefined && f.score !== null ? f.score : '—',
      'Result': f.result || f.awardCategory || 'Successfully Completed',
      'Session / Period': f.session || f.academicYear || '—'
    }),
    pdfColumns: ['S.No', 'Faculty Name', 'Dept', 'Course Name', 'Score', 'Result', 'Session'],
    mapToPdfRow: (f, idx) => [
      idx + 1,
      f.facultyName || 'Faculty',
      f.department || '—',
      f.courseName || '—',
      f.score !== undefined ? String(f.score) : '—',
      f.result || 'Completed',
      f.session || '—'
    ]
  },

  miniProjects: {
    moduleKey: 'miniProjects',
    sourceTemplateName: '23 BATCH AIML MINI PROJECTS.xlsx',
    reportTitle: 'Student Mini Projects & Team Project Register',
    sheetName: 'Mini_Projects',
    excelColumns: [
      'Team No',
      'Title of the Project',
      'Guide Name',
      'Roll Number',
      'Student Name',
      'Department',
      'Batch',
      'Status'
    ],
    mapToTemplateRow: (p, idx) => {
      const leader = Array.isArray(p.teamMembers) && p.teamMembers.length > 0 ? p.teamMembers[0] : null;
      const allMembers = Array.isArray(p.teamMembers) ? p.teamMembers.map(m => `${m.rollNumber} (${m.studentName || m.name})`).join(', ') : '—';
      return {
        'Team No': p.teamNumber || `Team_${idx + 1}`,
        'Title of the Project': p.title || p.projectTitle || '—',
        'Guide Name': p.guideName || (p.guide?.name) || 'Not recorded',
        'Roll Number': leader ? leader.rollNumber : '—',
        'Student Name': allMembers,
        'Department': p.department || '—',
        'Batch': p.batch || '—',
        'Status': p.status || 'Recorded'
      };
    },
    pdfColumns: ['Team No', 'Project Title', 'Guide', 'Leader Roll', 'Student(s)', 'Dept', 'Status'],
    mapToPdfRow: (p, idx) => [
      p.teamNumber || `Team_${idx + 1}`,
      p.title || '—',
      p.guideName || 'Faculty',
      p.teamMembers?.[0]?.rollNumber || '—',
      p.teamMembers?.[0]?.studentName || '—',
      p.department || '—',
      p.status || 'Recorded'
    ]
  },

  internships: {
    moduleKey: 'internships',
    sourceTemplateName: 'INTERNSHIP AIML.xlsx',
    reportTitle: 'Student Industry Internships Register',
    sheetName: 'Internships',
    excelColumns: [
      'S.No',
      'Roll Number',
      'Student Name',
      'Department',
      'Organization / Company',
      'Domain',
      'Duration',
      'Academic Year',
      'Status'
    ],
    mapToTemplateRow: (i, idx) => ({
      'S.No': idx + 1,
      'Roll Number': i.rollNumber || i.studentRollNo || '—',
      'Student Name': i.studentName || '—',
      'Department': i.department || '—',
      'Organization / Company': i.organization || i.company || '—',
      'Domain': i.domain || 'Technical Engineering',
      'Duration': i.duration || '—',
      'Academic Year': i.academicYear || '—',
      'Status': i.internshipStatus || i.status || 'Completed'
    }),
    pdfColumns: ['S.No', 'Roll Number', 'Student Name', 'Dept', 'Company', 'Domain', 'Duration', 'Status'],
    mapToPdfRow: (i, idx) => [
      idx + 1,
      i.rollNumber || '—',
      i.studentName || '—',
      i.department || '—',
      i.organization || '—',
      i.domain || '—',
      i.duration || '—',
      i.status || 'Completed'
    ]
  },

  studentAchievements: {
    moduleKey: 'studentAchievements',
    sourceTemplateName: 'Student Achievements  AIML.xlsx',
    reportTitle: 'Student Achievements, Hackathons & Awards Register',
    sheetName: 'Achievements',
    excelColumns: [
      'S.No',
      'Roll Number',
      'Student Name',
      'Department',
      'Event / Contest',
      'Organizing Body',
      'Award / Position',
      'Date'
    ],
    mapToTemplateRow: (a, idx) => ({
      'S.No': idx + 1,
      'Roll Number': a.rollNumber || a.studentRollNo || '—',
      'Student Name': a.studentName || '—',
      'Department': a.department || '—',
      'Event / Contest': a.eventName || a.title || '—',
      'Organizing Body': a.organizer || '—',
      'Award / Position': a.awardPosition || a.position || 'First Prize / Winner',
      'Date': a.eventDate || a.date || '—'
    }),
    pdfColumns: ['S.No', 'Roll Number', 'Student Name', 'Dept', 'Event', 'Organizer', 'Award Position', 'Date'],
    mapToPdfRow: (a, idx) => [
      idx + 1,
      a.rollNumber || '—',
      a.studentName || '—',
      a.department || '—',
      a.eventName || '—',
      a.organizer || '—',
      a.awardPosition || 'Winner',
      a.eventDate || '—'
    ]
  }
};

/**
 * Detects module key from filename or raw object attributes.
 */
export function detectModuleFromFilenameOrData(filenameOrKey, rows = []) {
  if (typeof filenameOrKey === 'string') {
    const lower = filenameOrKey.toLowerCase();
    if (lower.includes('pub') || lower.includes('paper')) return 'publications';
    if (lower.includes('patent')) return 'patents';
    if (lower.includes('mou')) return 'mous';
    if (lower.includes('fdp') && (lower.includes('org') || lower.includes('fdps'))) return 'fdpsOrganized';
    if (lower.includes('workshop') || lower.includes('attend')) return 'workshopsAttended';
    if (lower.includes('csp') || lower.includes('community')) return 'csp';
    if (lower.includes('bos') || lower.includes('studies')) return 'bos';
    if (lower.includes('placement') && lower.includes('drive')) return 'placementDrives';
    if (lower.includes('placement') || lower.includes('campus')) return 'placements';
    if (lower.includes('nptel') && lower.includes('fac')) return 'facultyNptel';
    if (lower.includes('nptel') || lower.includes('cert')) return 'studentNptel';
    if (lower.includes('mini') || lower.includes('proj')) return 'miniProjects';
    if (lower.includes('intern')) return 'internships';
    if (lower.includes('achieve') || lower.includes('award')) return 'studentAchievements';
  }

  // Inspect first record keys
  if (Array.isArray(rows) && rows.length > 0) {
    const r = rows[0];
    if (r.applicationNumber || r.inventors || r['Application  No']) return 'patents';
    if (r.doi || r.scopusIndexed || r.publicationType) return 'publications';
    if (r.partnerName || (r.organization && r.validityPeriod)) return 'mous';
    if (r.hasPdfBook || r.community || r.village) return 'csp';
    if (r.bosNumber || r.regulation || r.meetingNumber) return 'bos';
    if (r.teamNumber || r.teamMembers) return 'miniProjects';
    if (r.internalScore !== undefined || r.awardCategory) return 'studentNptel';
    if (r.packageLpa !== undefined || r.company) return 'placements';
  }

  return null;
}

/**
 * Formats an array of records into the exact official template format.
 */
export function formatRowsForOfficialTemplate(moduleKey, records = []) {
  const template = MODULE_EXPORT_TEMPLATES[moduleKey];
  if (!template) return records;
  return records.map((rec, idx) => template.mapToTemplateRow(rec, idx));
}

/**
 * Returns PDF table headers and formatted data rows for the official template.
 */
export function formatPdfForOfficialTemplate(moduleKey, records = []) {
  const template = MODULE_EXPORT_TEMPLATES[moduleKey];
  if (!template) {
    const sample = records[0] || {};
    const cols = Object.keys(sample);
    return {
      title: 'Institutional Report',
      columns: cols,
      rows: records.map(r => Object.values(r))
    };
  }
  return {
    title: template.reportTitle,
    columns: template.pdfColumns,
    rows: records.map((rec, idx) => template.mapToPdfRow(rec, idx))
  };
}
