import React, { useState, useMemo } from 'react';
import { 
  HeartHandshake, 
  Search, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  Users, 
  FileText, 
  MapPin, 
  Download,
  X,
  BookOpen
} from 'lucide-react';
import { 
  MotionPage, 
  ModulePageHeader, 
  AnimatedKpiGrid, 
  MotionKpiCard 
} from '../../motion/index.js';
import { ET_DEPARTMENTS } from '../../../data/masterData.js';
import { 
  getCommunityProjects, 
  deleteCommunityProject,
  exportToCSV,
  exportToExcel,
  exportToPDF
} from '../../../data/portalStore.js';
import ConfirmDeleteDialog from '../common/ConfirmDeleteDialog.jsx';

export default function CommunityServiceProjectsManager({ currentUser, onDataChange }) {
  const [dataVersion, setDataVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState(
    currentUser?.role === 'HOD' ? (currentUser.dept || 'ALL') : 'ALL'
  );
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedEvidence, setSelectedEvidence] = useState('ALL'); // 'ALL' | 'WITH_DOCS' | 'WITHOUT_DOCS'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modals State
  const [detailProject, setDetailProject] = useState(null);
  const [activePdfDoc, setActivePdfDoc] = useState(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refresh = () => {
    setDataVersion(v => v + 1);
    if (onDataChange) onDataChange();
  };

  const clearDates = () => {
    setFromDate('');
    setToDate('');
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedDept('ALL');
    setSelectedBatch('ALL');
    setSelectedStage('ALL');
    setSelectedEvidence('ALL');
    setFromDate('');
    setToDate('');
  };

  // Live Data
  const projectsList = useMemo(() => {
    return getCommunityProjects();
  }, [dataVersion]);

  // Client-Side Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projectsList.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (p.title || '').toLowerCase().includes(q) ||
        (p.projectNumber || '').toLowerCase().includes(q) ||
        (p.community || '').toLowerCase().includes(q) ||
        (p.village || '').toLowerCase().includes(q) ||
        (p.facultyGuideName || '').toLowerCase().includes(q) ||
        (p.students || []).some(s => 
          (s.studentName || s.name || '').toLowerCase().includes(q) || 
          (s.rollNumber || '').toLowerCase().includes(q)
        )
      );

      const matchesDept = selectedDept === 'ALL' || p.department === selectedDept;
      const matchesBatch = selectedBatch === 'ALL' || p.batch === selectedBatch || p.batchYear === selectedBatch;
      const matchesStage = selectedStage === 'ALL' || p.stage === selectedStage || p.status === selectedStage;

      const hasDocs = p.hasPdfBook || (p.documents && p.documents.length > 0) || (p.students || []).some(s => s.hasPdfBook);
      const matchesEvidence = selectedEvidence === 'ALL' || 
        (selectedEvidence === 'WITH_DOCS' && hasDocs) ||
        (selectedEvidence === 'WITHOUT_DOCS' && !hasDocs);

      // Date filtering
      let matchesDate = true;
      const pDate = p.startDate || p.activityDate || p.submissionDate;
      if (pDate) {
        if (fromDate && pDate < fromDate) matchesDate = false;
        if (toDate && pDate > toDate) matchesDate = false;
      }

      return matchesSearch && matchesDept && matchesBatch && matchesStage && matchesEvidence && matchesDate;
    });
  }, [projectsList, searchQuery, selectedDept, selectedBatch, selectedStage, selectedEvidence, fromDate, toDate]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept, selectedBatch, selectedStage, selectedEvidence, fromDate, toDate, pageSize]);

  const totalPages = pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(filteredProjects.length / Number(pageSize)));
  const paginatedProjects = useMemo(() => {
    if (pageSize === 'ALL') return filteredProjects;
    const numSize = Number(pageSize);
    const start = (currentPage - 1) * numSize;
    return filteredProjects.slice(start, start + numSize);
  }, [filteredProjects, currentPage, pageSize]);

  // Real KPIs (strictly calculated from canonical data)
  const stats = useMemo(() => {
    const total = filteredProjects.length;
    const submitted = filteredProjects.filter(p => p.stage === 'SUBMITTED' || p.status === 'Submitted').length;
    
    // Unique participating students
    const participatingRolls = new Set();
    let evidenceCount = 0;

    filteredProjects.forEach(p => {
      let projectHasEvidence = Boolean(p.hasPdfBook || (p.documents && p.documents.length > 0));
      (p.students || []).forEach(s => {
        if (s.rollNumber) participatingRolls.add(s.rollNumber);
        if (s.hasPdfBook) projectHasEvidence = true;
      });
      if (projectHasEvidence) evidenceCount++;
    });

    return {
      total,
      submitted,
      evidenceCount,
      studentsCount: participatingRolls.size
    };
  }, [filteredProjects]);

  // Export handlers with official template registry
  const handleExportCSV = () => {
    exportToCSV(filteredProjects, `ET_Community_Service_Projects_${selectedDept}`, currentUser, { moduleKey: 'cspProjects' });
    showToast(`Exported ${filteredProjects.length} CSP records to CSV.`);
  };

  const handleExportExcel = () => {
    exportToExcel(filteredProjects, `ET_Community_Service_Projects_${selectedDept}`, 'CSP_Projects', currentUser, { moduleKey: 'cspProjects' });
    showToast(`Exported ${filteredProjects.length} CSP records to Excel.`);
  };

  const handleExportPDF = () => {
    const rows = filteredProjects.map(p => ({
      'Project No': p.projectNumber,
      'Title': p.title,
      'Dept': p.department,
      'Batch': p.batch || p.batchYear || '—',
      'Location': p.community || p.village || 'Palnadu Rural',
      'Students': (p.students || []).map(s => `${s.rollNumber} - ${s.studentName || s.name}`).join('; '),
      'Status': p.status || p.stage || 'Submitted'
    }));
    exportToPDF('ET_Community_Service_Report', ['Project No', 'Title', 'Dept', 'Batch', 'Location', 'Students', 'Status'], rows, 'Community Service Projects (CSP)');
    showToast(`Exported CSP report to PDF.`);
  };

  const handleDelete = (project) => {
    setDeleteConfirmProject(project);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmProject) {
      deleteCommunityProject(deleteConfirmProject.id, currentUser);
      setDeleteConfirmProject(null);
      refresh();
      showToast(`Project moved to Recycle Bin.`);
    }
  };

  return (
    <MotionPage style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', position: 'relative' }}>
      {toastMessage && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header */}
      <ModulePageHeader
        breadcrumbs={[
          { label: 'Dashboard' },
          { label: 'Student Development' },
          { label: 'Community Service Projects' }
        ]}
        title="Community Service Projects (CSP)"
        subtitle="Mandatory field outreach, community welfare surveys, and societal impact initiatives conducted by ET students."
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
      />

      {/* 2. KPI Summary Cards (Clean Theme) */}
      <AnimatedKpiGrid minWidth="180px">
        <MotionKpiCard 
          label="Unique CSP Projects" 
          value={stats.total} 
          icon={HeartHandshake} 
          color="#0F172A" 
          bg="#F8FAFC" 
        />
        <MotionKpiCard 
          label="Participating Students" 
          value={stats.studentsCount} 
          icon={Users} 
          color="#2563EB" 
          bg="#EFF6FF" 
        />
        <MotionKpiCard 
          label="Submitted Books / Reports" 
          value={stats.submitted} 
          icon={CheckCircle2} 
          color="#059669" 
          bg="#ECFDF5" 
        />
        <MotionKpiCard 
          label="Linked Project Books (PDF)" 
          value={stats.evidenceCount} 
          icon={BookOpen} 
          color="#D97706" 
          bg="#FEFCE8" 
        />
      </AnimatedKpiGrid>

      {/* 3. Search & Filter Bar (Clean Portal Theme) */}
      <div style={{ background: '#FFFFFF', padding: '1.15rem 1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, roll number, student name, community, guide..."
              style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', outline: 'none', color: '#0F172A', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Department Filter (Canonical ET Departments, default label 'All') */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              disabled={currentUser?.role === 'HOD'}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All</option>
              {ET_DEPARTMENTS.map(d => (
                <option key={d.code} value={d.code}>{d.name} ({d.code})</option>
              ))}
            </select>

            {/* Batch Filter */}
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Batches</option>
              <option value="2021 Batch">2021 Batch</option>
              <option value="2022 Batch">2022 Batch</option>
              <option value="2023 Batch">2023 Batch</option>
            </select>

            {/* Stage / Status Filter */}
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>

            {/* Evidence Document Filter */}
            <select
              value={selectedEvidence}
              onChange={(e) => setSelectedEvidence(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Evidence States</option>
              <option value="WITH_DOCS">Linked CSP Book (PDF)</option>
              <option value="WITHOUT_DOCS">Awaiting Book Upload</option>
            </select>

            {/* Page Size */}
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A' }}
            >
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
              <option value="ALL">Show All</option>
            </select>
          </div>
        </div>

        {/* Date Filter Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '0.25rem', borderTop: '1px dashed #E2E8F0', fontSize: '0.78rem' }}>
          <span style={{ fontWeight: 700, color: '#475569' }}>Activity / Submission Date:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: '#64748B' }}>From Date</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem', color: '#0F172A' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: '#64748B' }}>To Date</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem', color: '#0F172A' }}
            />
          </div>
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={clearDates}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Clear Dates
            </button>
          )}
          {(searchQuery || selectedDept !== 'ALL' || selectedBatch !== 'ALL' || selectedStage !== 'ALL' || selectedEvidence !== 'ALL' || fromDate || toDate) && (
            <button
              type="button"
              onClick={clearAllFilters}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', background: '#F1F5F9', color: '#DC2626', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0.85rem 1rem', minWidth: '150px' }}>Project ID</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '220px' }}>Project Title</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '90px' }}>Department</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '85px' }}>Batch</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '130px' }}>Location</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '150px' }}>Team Members</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '130px' }}>Faculty Guide</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '110px' }}>Evidence</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '95px' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', minWidth: '90px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    No community service projects match the active criteria.
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((project, idx) => {
                  const studentCount = (project.students || []).length;
                  const docList = project.documents || [];
                  const studentWithDoc = (project.students || []).find(s => s.pdfEvidence);
                  const activeDoc = docList[0] || (studentWithDoc ? studentWithDoc.pdfEvidence : null) || project.pdfEvidence;

                  return (
                    <tr key={project.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <span className="record-code" style={{ color: '#0F172A', background: '#F8FAFC', padding: '0.2rem 0.45rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                          {project.projectNumber || 'CSP-PROJ'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top', maxWidth: '280px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem', lineHeight: 1.35 }}>
                          {project.title}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.8rem', background: '#F1F5F9', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          {project.department}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>{project.batch || project.batchYear || '—'}</div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top', maxWidth: '160px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#334155' }}>
                          <MapPin size={12} color="#D97706" style={{ flexShrink: 0 }} />
                          <span>{project.community || project.village || 'Not recorded'}</span>
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top', maxWidth: '220px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
                          {studentCount} Student{studentCount > 1 ? 's' : ''}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {(project.students || []).slice(0, 2).map(s => `${s.rollNumber} (${s.studentName || s.name})`).join(', ')}
                          {studentCount > 2 && ` +${studentCount - 2} more`}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0F172A' }}>
                          {project.facultyGuideName || 'Not recorded'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        {activeDoc ? (
                          <button
                            type="button"
                            onClick={() => setActivePdfDoc(activeDoc)}
                            style={{
                              padding: '0.25rem 0.55rem',
                              background: '#FEFCE8',
                              border: '1px solid #FEF08A',
                              color: '#A16207',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                            title="View Linked Project Book"
                          >
                            <BookOpen size={12} />
                            <span>CSP Book (PDF)</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                            No linked document
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: '#ECFDF5',
                          color: '#047857',
                          border: '1px solid #A7F3D0',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.68rem',
                          fontWeight: 800
                        }}>
                          <CheckCircle2 size={11} /> {project.status || project.stage || 'Submitted'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => setDetailProject(project)}
                            title="View Project Dossier"
                            style={{ padding: '0.35rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
                          >
                            <Eye size={13} />
                          </button>
                          {activeDoc && (
                            <a
                              href={`/api/portal/documents/serve?id=${activeDoc.id}&download=true`}
                              download={activeDoc.fileName}
                              title="Download CSP Book"
                              style={{ padding: '0.35rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', color: '#1D4ED8', display: 'inline-flex', alignItems: 'center' }}
                            >
                              <Download size={13} />
                            </a>
                          )}
                          {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
                            <button
                              type="button"
                              onClick={() => handleDelete(project)}
                              title="Delete Project"
                              style={{ padding: '0.35rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#DC2626', cursor: 'pointer' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredProjects.length > 0 && pageSize !== 'ALL' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', fontSize: '0.78rem', color: '#64748B' }}>
            <span>
              Showing {((currentPage - 1) * Number(pageSize)) + 1} to {Math.min(currentPage * Number(pageSize), filteredProjects.length)} of {filteredProjects.length} projects
            </span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', opacity: currentPage <= 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <span style={{ padding: '0.3rem 0.65rem', fontWeight: 700, color: '#0F172A' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', opacity: currentPage >= totalPages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      {detailProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 15, 30, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #D4AF37' }}>
            <div style={{ background: 'linear-gradient(135deg, #070F1E 0%, #0B192C 100%)', padding: '1.25rem 1.5rem', color: '#FFFFFF', borderBottom: '2px solid #D4AF37', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase' }}>
                  {detailProject.projectNumber || 'CSP PROJECT'}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#FFFFFF' }}>
                  {detailProject.title}
                </h3>
              </div>
              <button type="button" onClick={() => setDetailProject(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Meta Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Department & Batch</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                    {detailProject.department} • {detailProject.batch || detailProject.batchYear || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Faculty Supervisor</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                    {detailProject.facultyGuideName || 'Not Assigned'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Location / Village</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                    {detailProject.community || detailProject.village || 'Palnadu Rural Region'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Status & Verification</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>
                    {detailProject.status || detailProject.stage || 'Submitted'} ({detailProject.workflowStatus || 'Approval Not Recorded'})
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Team Members ({(detailProject.students || []).length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {(detailProject.students || []).map((s, idx) => (
                    <div key={idx} style={{ padding: '0.55rem 0.85rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.82rem' }}>{s.rollNumber}</span>
                        <span style={{ color: '#64748B', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{s.studentName || s.name}</span>
                        {s.isLeader && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.68rem', fontWeight: 800, background: 'rgba(212, 175, 55, 0.2)', color: '#A16207', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            LEADER
                          </span>
                        )}
                      </div>
                      {s.pdfEvidence && (
                        <button
                          type="button"
                          onClick={() => setActivePdfDoc(s.pdfEvidence)}
                          style={{ padding: '0.2rem 0.5rem', background: '#FEFCE8', border: '1px solid #FEF08A', color: '#A16207', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <BookOpen size={11} /> View Book
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked Supporting Documents */}
              <div>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Linked Supporting Evidence
                </h4>
                {detailProject.documents && detailProject.documents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {detailProject.documents.map((doc, idx) => (
                      <div key={idx} style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FileText size={16} color="#DC2626" />
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{doc.fileName}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Size: {doc.sizeKb} KB • Type: CSP Project Book</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => setActivePdfDoc(doc)}
                            style={{ padding: '0.35rem 0.75rem', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', cursor: 'pointer' }}
                          >
                            View Document
                          </button>
                          <a
                            href={`/api/portal/documents/serve?id=${doc.id}&download=true`}
                            download={doc.fileName}
                            style={{ padding: '0.35rem 0.75rem', background: '#0F172A', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#FFFFFF', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Download size={12} /> Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', fontSize: '0.78rem', color: '#94A3B8' }}>
                    No PDF project books uploaded for this project yet.
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDetailProject(null)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {activePdfDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 15, 30, 0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '900px', width: '100%', height: '85vh', display: 'flex', flexDirection: 'column', border: '1px solid #D4AF37', overflow: 'hidden' }}>
            <div style={{ background: '#070F1E', padding: '1rem 1.25rem', color: '#FFFFFF', borderBottom: '2px solid #D4AF37', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={16} color="#D4AF37" />
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFFFFF' }}>{activePdfDoc.fileName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <a
                  href={`/api/portal/documents/serve?id=${activePdfDoc.id}&download=true`}
                  download={activePdfDoc.fileName}
                  style={{ padding: '0.35rem 0.75rem', background: 'rgba(212, 175, 55, 0.2)', border: '1px solid #D4AF37', borderRadius: '6px', color: '#D4AF37', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Download size={12} /> Download
                </a>
                <button type="button" onClick={() => setActivePdfDoc(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, background: '#525659' }}>
              <iframe
                src={`/api/portal/documents/serve?id=${activePdfDoc.id}&download=false`}
                title={activePdfDoc.fileName}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        isOpen={Boolean(deleteConfirmProject)}
        title="Delete Community Service Project?"
        itemName={deleteConfirmProject?.title}
        itemType="project record"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmProject(null)}
      />
    </MotionPage>
  );
}
