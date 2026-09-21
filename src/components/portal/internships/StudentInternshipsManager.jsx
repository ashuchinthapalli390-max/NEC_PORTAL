import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Building2, 
  Trash2, 
  ChevronRight,
  ExternalLink,
  Sparkles,
  Printer,
  Calendar,
  Layers,
  X
} from 'lucide-react';
import { ET_DEPARTMENTS } from '../../../data/masterData.js';
import { 
  getInternships, 
  reviewInternship, 
  softDeleteInternship,
  exportToCSV,
  exportToExcel,
  exportToPDF
} from '../../../data/portalStore.js';
import { 
  getWorkflowBadge, 
  getInternshipStatusBadge, 
  StatusBadge 
} from '../../../lib/ui/statusBadges.jsx';
import StudentInternshipWizardModal from './StudentInternshipWizardModal.jsx';
import ConfirmDeleteDialog from '../common/ConfirmDeleteDialog.jsx';
import { 
  MotionPage, 
  ModulePageHeader, 
  AnimatedKpiGrid, 
  MotionKpiCard, 
  MotionTable, 
  MotionTableRow, 
  MotionEmptyState,
  MotionButton 
} from '../../motion/index.js';

export default function StudentInternshipsManager({ currentUser, onDataChange }) {
  const [dataVersion, setDataVersion] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dossierModalItem, setDossierModalItem] = useState(null);
  const [reviewModalItem, setReviewModalItem] = useState(null);
  const [reviewAction, setReviewAction] = useState('VERIFY');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState(currentUser?.role === 'HOD' ? (currentUser.dept || 'ALL') : 'ALL');
  const [selectedAy, setSelectedAy] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStipend, setSelectedStipend] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const refresh = () => {
    setDataVersion(v => v + 1);
    if (onDataChange) onDataChange();
  };

  const internships = useMemo(() => {
    return getInternships();
  }, [dataVersion]);

  // Client-Side Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filtered internships
  const filteredInternships = useMemo(() => {
    return internships.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        (item.internshipRecordNumber && item.internshipRecordNumber.toLowerCase().includes(q)) ||
        (item.studentName && item.studentName.toLowerCase().includes(q)) ||
        (item.rollNumber && item.rollNumber.toLowerCase().includes(q)) ||
        (item.organization && item.organization.toLowerCase().includes(q)) ||
        (item.domain && item.domain.toLowerCase().includes(q));

      const itemDept = item.department || '';
      const matchDept = selectedDept === 'ALL' || itemDept === selectedDept;
      const matchAy = selectedAy === 'ALL' || item.academicYear === selectedAy;
      const matchMode = selectedMode === 'ALL' || item.mode === selectedMode;
      const matchType = selectedType === 'ALL' || item.internshipType === selectedType;
      const matchStipend = selectedStipend === 'ALL' || (selectedStipend === 'PAID' ? item.hasStipend === 'Yes' : item.hasStipend !== 'Yes');
      const matchStatus = selectedStatus === 'ALL' || item.internshipStatus === selectedStatus;

      return matchSearch && matchDept && matchAy && matchMode && matchType && matchStipend && matchStatus;
    });
  }, [internships, searchQuery, selectedDept, selectedAy, selectedMode, selectedType, selectedStipend, selectedStatus]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept, selectedAy, selectedMode, selectedType, selectedStipend, selectedStatus, pageSize]);

  const totalPages = pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(filteredInternships.length / Number(pageSize)));
  const paginatedInternships = useMemo(() => {
    if (pageSize === 'ALL') return filteredInternships;
    const numSize = Number(pageSize);
    const start = (currentPage - 1) * numSize;
    return filteredInternships.slice(start, start + numSize);
  }, [filteredInternships, currentPage, pageSize]);

  // KPIs
  const stats = useMemo(() => {
    const total = filteredInternships.length;
    const ongoing = filteredInternships.filter(i => i.internshipStatus === 'Ongoing').length;
    const completed = filteredInternships.filter(i => i.internshipStatus === 'Completed' || i.workflowStatus === 'COMPLETED').length;
    const paid = filteredInternships.filter(i => i.hasStipend === 'Yes' || i.stipend === 'Yes').length;
    const industry = filteredInternships.filter(i => i.organizationType === 'Company' || i.organizationType === 'Startup' || !i.organizationType).length;
    const pendingReview = filteredInternships.filter(i => i.workflowStatus === 'SUBMITTED' || i.workflowStatus === 'UNDER_REVIEW').length;
    return { total, ongoing, completed, paid, industry, pendingReview };
  }, [filteredInternships]);

  const canCreate = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOD' || currentUser?.role === 'FACULTY';
  const canReview = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOD';

  const handleReviewSubmit = () => {
    if (!reviewModalItem) return;
    reviewInternship(reviewModalItem.id, reviewAction, reviewRemarks, currentUser);
    setReviewModalItem(null);
    setReviewRemarks('');
    refresh();
    showToast(`Internship verification decision submitted.`);
  };

  const handleDelete = (item) => {
    setDeleteConfirmItem(item);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmItem) {
      softDeleteInternship(deleteConfirmItem.id, currentUser);
      const name = deleteConfirmItem.studentName || deleteConfirmItem.internshipNumber || deleteConfirmItem.id;
      setDeleteConfirmItem(null);
      refresh();
      showToast(`Internship for "${name}" moved to Recycle Bin.`);
    }
  };

  const handleExportCSV = () => {
    const rows = filteredInternships.map(i => ({
      'Roll Number': i.rollNumber,
      'Student Name': i.studentName,
      'Department': i.department || i.branch,
      'Academic Year': i.academicYear || '—',
      'Organization': i.organization,
      'Domain': i.domain,
      'Role / Title': i.internshipTitle,
      'Duration': `${i.weeks || i.durationWeeks || 8} Weeks`,
      'Stipend': (i.hasStipend === 'Yes' || i.stipend === 'Yes') ? `₹${i.stipendAmount}/mo` : 'Unpaid',
      'Status': i.internshipStatus || 'Completed',
      'Workflow Status': i.workflowStatus || 'APPROVED'
    }));
    exportToCSV(rows, `ET_Student_Internships_${selectedDept}`, currentUser);
    showToast(`Exported ${rows.length} student internship records to CSV.`);
  };

  const handleExportExcel = () => {
    const rows = filteredInternships.map(i => ({
      'Roll Number': i.rollNumber,
      'Student Name': i.studentName,
      'Department': i.department || i.branch,
      'Academic Year': i.academicYear || '—',
      'Organization': i.organization,
      'Domain': i.domain,
      'Role / Title': i.internshipTitle,
      'Duration': `${i.weeks || i.durationWeeks || 8} Weeks`,
      'Stipend': (i.hasStipend === 'Yes' || i.stipend === 'Yes') ? `₹${i.stipendAmount}/mo` : 'Unpaid',
      'Status': i.internshipStatus || 'Completed',
      'Workflow Status': i.workflowStatus || 'APPROVED'
    }));
    exportToExcel(rows, `ET_Student_Internships_${selectedDept}`, 'Internships', currentUser);
    showToast(`Exported ${rows.length} student internship records to Excel.`);
  };

  const handleExportPDF = () => {
    const rows = filteredInternships.map(i => ({
      'Roll No': i.rollNumber || '—',
      'Student Name': i.studentName,
      'Dept': i.department || i.branch,
      'Organization': i.organization,
      'Title': i.internshipTitle,
      'Duration': `${i.weeks || 8} Wks`,
      'Status': i.workflowStatus || 'APPROVED'
    }));
    exportToPDF('ET_Student_Internships_Report', ['Roll No', 'Student Name', 'Dept', 'Organization', 'Title', 'Duration', 'Status'], rows, 'Student Industry Internships Repository');
    showToast(`Exported student internships report to PDF.`);
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
          { label: 'Student Internships' }
        ]}
        title="Industry Internships & Practical Training"
        subtitle="Comprehensive institutional record for Summer, Short-Term, Long-Term, and Industry Internships (NBA Criterion 4 Evidence)."
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        primaryAction={canCreate ? {
          label: 'Record Internship',
          icon: Plus,
          onClick: () => { setEditingItem(null); setWizardOpen(true); }
        } : null}
      />

      {/* 2. KPI Summary Cards */}
      <AnimatedKpiGrid minWidth="160px">
        <MotionKpiCard label="Total Internships" value={stats.total} icon={Briefcase} color="#0F172A" bg="#F8FAFC" />
        <MotionKpiCard label="Ongoing Training" value={stats.ongoing} icon={Clock} color="#2563EB" bg="#EFF6FF" />
        <MotionKpiCard label="Completed Internships" value={stats.completed} icon={CheckCircle2} color="#059669" bg="#ECFDF5" />
        <MotionKpiCard label="Paid / Stipendiary" value={stats.paid} icon={Sparkles} color="#D97706" bg="#FEFCE8" />
        <MotionKpiCard label="Industry Partners" value={stats.industry} icon={Building2} color="#7C3AED" bg="#F5F3FF" />
        <MotionKpiCard label="Pending Verification" value={stats.pendingReview} icon={AlertTriangle} color="#DC2626" bg="#FEF2F2" />
      </AnimatedKpiGrid>

      {/* 3. Search & Filter Bar */}
      <div style={{
        background: '#FFFFFF',
        padding: '1rem 1.25rem',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by student name, roll number, organization, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', outline: 'none', color: '#0F172A', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={selectedDept}
              disabled={currentUser?.role === 'HOD'}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All</option>
              {ET_DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
            </select>

            <select
              value={selectedAy}
              onChange={(e) => setSelectedAy(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All AYs</option>
              <option value="2025-26">2025-26</option>
              <option value="2024-25">2024-25</option>
            </select>

            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Modes</option>
              <option value="Offline">Offline</option>
              <option value="Online">Online</option>
              <option value="Hybrid">Hybrid</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Types</option>
              <option value="Summer Internship">Summer Internship</option>
              <option value="Semester Internship">Semester Internship</option>
              <option value="Short Term">Short Term</option>
            </select>

            <select
              value={selectedStipend}
              onChange={(e) => setSelectedStipend(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Stipend</option>
              <option value="PAID">Paid / Stipendiary</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Roll No & Student</th>
                <th style={{ padding: '0.85rem 1rem' }}>Branch & AY</th>
                <th style={{ padding: '0.85rem 1rem' }}>Organization & Domain</th>
                <th style={{ padding: '0.85rem 1rem' }}>Role / Title</th>
                <th style={{ padding: '0.85rem 1rem' }}>Duration</th>
                <th style={{ padding: '0.85rem 1rem' }}>Stipend</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInternships.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    No student internship records found.
                  </td>
                </tr>
              ) : (
                paginatedInternships.map((item, idx) => {
                  const statusKey = item.workflowStatus || (item.status === 'Verified' ? 'VERIFIED' : 'DRAFT');
                  const badge = getWorkflowBadge(statusKey);
                  const BadgeIcon = badge.icon;

                  return (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }} className="hover:bg-slate-50">
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.82rem' }}>{item.rollNumber}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{item.studentName}</div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>{item.department || item.branch}</span>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.academicYear} • {item.year || 'IV Year'}</div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem' }}>{item.organization}</div>
                        <div style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 600 }}>{item.domain} ({item.mode})</div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', maxWidth: '240px' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.8rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {item.internshipTitle}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontSize: '0.76rem', color: '#0F172A', fontWeight: 700 }}>
                          {item.weeks || item.durationWeeks || 8} Weeks
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          {item.startDate} to {item.endDate}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        {(item.hasStipend === 'Yes' || item.stipend === 'Yes') ? (
                          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#059669' }}>
                            ₹{Number(item.stipendAmount || 0).toLocaleString('en-IN')}/mo
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Unpaid</span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.68rem',
                          fontWeight: 800
                        }}>
                          {BadgeIcon && <BadgeIcon size={11} />} {badge.label}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => setDossierModalItem(item)}
                            title="View Dossier"
                            style={{ padding: '0.35rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
                          >
                            <Eye size={13} />
                          </button>

                          {canReview && (
                            <button
                              type="button"
                              onClick={() => { setReviewModalItem(item); setReviewAction('VERIFY'); }}
                              title="Verify Record"
                              style={{ padding: '0.35rem 0.55rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: '#059669', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Verify
                            </button>
                          )}

                          {canCreate && (
                            <button
                              type="button"
                              onClick={() => { setEditingItem(item); setWizardOpen(true); }}
                              style={{ padding: '0.35rem', background: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: '6px', color: '#A16207', cursor: 'pointer' }}
                            >
                              <Edit3 size={13} />
                            </button>
                          )}

                          {canReview && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
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

        {/* Pagination Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1.25rem',
          borderTop: '1px solid #E2E8F0',
          background: '#F8FAFC',
          fontSize: '0.78rem',
          color: '#64748B',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>
              Showing{' '}
              <strong style={{ color: '#0F172A' }}>
                {filteredInternships.length === 0 ? 0 : (currentPage - 1) * (pageSize === 'ALL' ? filteredInternships.length : Number(pageSize)) + 1}
              </strong>{' '}
              to{' '}
              <strong style={{ color: '#0F172A' }}>
                {pageSize === 'ALL' ? filteredInternships.length : Math.min(currentPage * Number(pageSize), filteredInternships.length)}
              </strong>{' '}
              of <strong style={{ color: '#0F172A' }}>{filteredInternships.length.toLocaleString('en-IN')}</strong> records
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem' }}>
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: '#0F172A'
                }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value="ALL">All ({filteredInternships.length})</option>
              </select>
            </div>
          </div>

          {pageSize !== 'ALL' && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(1)}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: currentPage <= 1 ? '#F1F5F9' : '#FFFFFF',
                  color: currentPage <= 1 ? '#94A3B8' : '#0F172A',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.74rem'
                }}
              >
                « First
              </button>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: currentPage <= 1 ? '#F1F5F9' : '#FFFFFF',
                  color: currentPage <= 1 ? '#94A3B8' : '#0F172A',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.74rem'
                }}
              >
                ‹ Prev
              </button>
              <span style={{ padding: '0 0.5rem', fontWeight: 700, color: '#0F172A', fontSize: '0.76rem' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: currentPage >= totalPages ? '#F1F5F9' : '#FFFFFF',
                  color: currentPage >= totalPages ? '#94A3B8' : '#0F172A',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.74rem'
                }}
              >
                Next ›
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: currentPage >= totalPages ? '#F1F5F9' : '#FFFFFF',
                  color: currentPage >= totalPages ? '#94A3B8' : '#0F172A',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.74rem'
                }}
              >
                Last »
              </button>
            </div>
          )}
        </div>
      </div>

      {wizardOpen && (
        <StudentInternshipWizardModal
          isOpen={wizardOpen}
          onClose={() => { setWizardOpen(false); setEditingItem(null); }}
          initialData={editingItem}
          currentUser={currentUser}
          onSaved={() => refresh()}
        />
      )}

      {/* Dossier Modal */}
      {dossierModalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 15, 30, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #D4AF37' }}>
            <div style={{ background: 'linear-gradient(135deg, #070F1E 0%, #0B192C 100%)', padding: '1.25rem 1.5rem', color: '#FFFFFF', borderBottom: '2px solid #D4AF37', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase' }}>{dossierModalItem.internshipNumber || dossierModalItem.id}</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#FFFFFF' }}>{dossierModalItem.internshipTitle}</h3>
              </div>
              <button type="button" onClick={() => setDossierModalItem(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Student Details</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.studentName} ({dossierModalItem.rollNumber})</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B' }}>{dossierModalItem.department || dossierModalItem.branch} • {dossierModalItem.academicYear}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Host Organization</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.organization}</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B' }}>{dossierModalItem.domain} ({dossierModalItem.mode})</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Period & Duration</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.startDate} to {dossierModalItem.endDate}</div>
                  <div style={{ fontSize: '0.74rem', color: '#16A34A', fontWeight: 700 }}>{dossierModalItem.weeks || 8} Weeks ({dossierModalItem.durationDays || 60} Days)</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Stipend Package</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.stipendAmount ? `₹${dossierModalItem.stipendAmount}/mo` : 'Unpaid'}</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{dossierModalItem.internshipStatus || 'Ongoing'}</div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Attached Evidence Files</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {dossierModalItem.offerLetter && <div style={{ padding: '0.5rem 0.8rem', background: '#F1F5F9', borderRadius: '6px', fontSize: '0.78rem' }}><strong>Offer Letter:</strong> {dossierModalItem.offerLetter}</div>}
                  {dossierModalItem.certificate && <div style={{ padding: '0.5rem 0.8rem', background: '#F1F5F9', borderRadius: '6px', fontSize: '0.78rem' }}><strong>Completion Certificate:</strong> {dossierModalItem.certificate}</div>}
                  {dossierModalItem.documents?.map(d => <div key={d.id} style={{ padding: '0.5rem 0.8rem', background: '#F1F5F9', borderRadius: '6px', fontSize: '0.78rem' }}>{d.name} ({d.size})</div>)}
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDossierModalItem(null)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 15, 30, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '500px', width: '100%', border: '1px solid #D4AF37', overflow: 'hidden' }}>
            <div style={{ background: '#070F1E', padding: '1rem 1.25rem', color: '#FFFFFF', borderBottom: '2px solid #D4AF37' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Verify Internship Record</h3>
              <div style={{ fontSize: '0.75rem', color: '#D4AF37' }}>{reviewModalItem.studentName} at {reviewModalItem.organization}</div>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>REVIEW DECISION *</label>
                <select value={reviewAction} onChange={(e) => setReviewAction(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}>
                  <option value="VERIFY">Mark Verified (Audit Approved)</option>
                  <option value="COMPLETE">Mark Completed (Certificate Validated)</option>
                  <option value="REQUEST_REVISION">Request Revision / Missing Proof</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>VERIFICATION REMARKS</label>
                <textarea rows={3} placeholder="Verification comments, attendance check..." value={reviewRemarks} onChange={(e) => setReviewRemarks(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.25rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => setReviewModalItem(null)} style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleReviewSubmit} style={{ padding: '0.45rem 1.15rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>Submit Decision</button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        isOpen={Boolean(deleteConfirmItem)}
        title="Move Internship to Recycle Bin?"
        itemName={deleteConfirmItem?.studentName || deleteConfirmItem?.internshipNumber}
        itemType="internship record"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmItem(null)}
      />
    </MotionPage>
  );
}
