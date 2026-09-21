import React, { useState, useMemo } from 'react';
import { 
  Code2, 
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
  Users, 
  Check, 
  X,
  Globe,
  GitBranch,
  Award,
  Layers,
  Zap,
  BookOpen
} from 'lucide-react';
import { ET_DEPARTMENTS, FACULTY_DATA } from '../../../data/masterData.js';
import { 
  getStudentProjects, 
  reviewStudentProject, 
  softDeleteStudentProject,
  exportToCSV,
  exportToExcel,
  exportToPDF
} from '../../../data/portalStore.js';
import { 
  getWorkflowBadge, 
  getProjectStatusBadge, 
  StatusBadge 
} from '../../../lib/ui/statusBadges.jsx';
import StudentProjectWizardModal from './StudentProjectWizardModal.jsx';
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

export default function StudentProjectsManager({ currentUser, onDataChange }) {
  const [dataVersion, setDataVersion] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dossierModalItem, setDossierModalItem] = useState(null);
  const [dossierActiveTab, setDossierActiveTab] = useState('overview');
  const [reviewModalItem, setReviewModalItem] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState(currentUser?.role === 'HOD' ? (currentUser.dept || 'ALL') : 'ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedWorkflowStatus, setSelectedWorkflowStatus] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [projects, setProjects] = useState(() => getStudentProjects());

  const refresh = () => {
    setProjects(getStudentProjects());
    setDataVersion(v => v + 1);
    if (onDataChange) onDataChange();
  };

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        (item.projectNumber && item.projectNumber.toLowerCase().includes(q)) ||
        (item.projectTitle && item.projectTitle.toLowerCase().includes(q)) ||
        (item.guide?.name && item.guide.name.toLowerCase().includes(q)) ||
        (item.teamMembers && item.teamMembers.some(m => m.name?.toLowerCase().includes(q) || m.rollNumber?.toLowerCase().includes(q)));

      const itemDept = item.department || '';
      const matchDept = selectedDept === 'ALL' || itemDept === selectedDept;
      const matchType = selectedType === 'ALL' || item.projectType === selectedType;
      const matchStatus = selectedStatus === 'ALL' || item.projectStatus === selectedStatus;
      const matchWorkflow = selectedWorkflowStatus === 'ALL' || item.workflowStatus === selectedWorkflowStatus;

      // Date filtering
      let matchDate = true;
      const pDate = item.startDate || item.submissionDate || item.createdAt;
      if (pDate) {
        if (fromDate && pDate < fromDate) matchDate = false;
        if (toDate && pDate > toDate) matchDate = false;
      }

      return matchSearch && matchDept && matchType && matchStatus && matchWorkflow && matchDate;
    });
  }, [projects, searchQuery, selectedDept, selectedType, selectedStatus, selectedWorkflowStatus, fromDate, toDate]);

  // KPIs
  const stats = useMemo(() => {
    const total = filteredProjects.length;
    const mini = filteredProjects.filter(p => p.projectType === 'Mini Project').length;
    const major = filteredProjects.filter(p => p.projectType === 'Major Project').length;
    const capstone = filteredProjects.filter(p => p.projectType === 'Capstone Project').length;
    const inProgress = filteredProjects.filter(p => p.projectStatus === 'IN_PROGRESS' || p.projectStatus === 'Ongoing').length;
    const completed = filteredProjects.filter(p => p.projectStatus === 'COMPLETED' || p.projectStatus === 'Completed').length;
    const industry = filteredProjects.filter(p => p.industryAssociation?.isIndustryAssociated || p.isIndustryProject === 'Yes').length;
    const pendingReview = filteredProjects.filter(p => p.workflowStatus === 'SUBMITTED' || p.workflowStatus === 'UNDER_REVIEW').length;

    return { total, mini, major, capstone, inProgress, completed, industry, pendingReview };
  }, [filteredProjects]);

  // Permissions
  const canCreate = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOD' || currentUser?.role === 'FACULTY';
  const canReview = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOD';

  const handleReviewSubmit = () => {
    if (!reviewModalItem) return;
    reviewStudentProject(reviewModalItem.id, reviewAction, reviewRemarks, currentUser);
    setReviewModalItem(null);
    setReviewRemarks('');
    refresh();
    showToast(`Project ${reviewModalItem.projectNumber || reviewModalItem.id} evaluation updated.`);
  };

  const handleDelete = (id, title) => {
    setDeleteConfirmItem({ id, title });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmItem) {
      softDeleteStudentProject(deleteConfirmItem.id, currentUser);
      const title = deleteConfirmItem.title;
      setDeleteConfirmItem(null);
      refresh();
      showToast(`Project "${title}" moved to Recycle Bin.`);
    }
  };

  const handleExportCSV = () => {
    const rows = filteredProjects.map(p => ({
      'Project Number': p.projectNumber,
      'Project Title': p.projectTitle,
      'Project Type': p.projectType,
      'Department': p.department,
      'Batch': p.batch || '—',
      'Team Lead': p.teamMembers?.[0]?.name || '—',
      'Lead Roll No': p.teamMembers?.[0]?.rollNumber || '—',
      'Guide Name': p.guide?.name || '—',
      'Project Status': p.projectStatus,
      'Workflow Status': p.workflowStatus || 'APPROVED'
    }));
    exportToCSV(rows, `ET_Student_Projects_${selectedDept}`, currentUser, { moduleKey: 'studentProjects' });
    showToast(`Exported ${rows.length} student project records to CSV.`);
  };

  const handleExportExcel = () => {
    const rows = filteredProjects.map(p => ({
      'Project Number': p.projectNumber,
      'Project Title': p.projectTitle,
      'Project Type': p.projectType,
      'Department': p.department,
      'Batch': p.batch || '—',
      'Team Lead': p.teamMembers?.[0]?.name || '—',
      'Lead Roll No': p.teamMembers?.[0]?.rollNumber || '—',
      'Guide Name': p.guide?.name || '—',
      'Project Status': p.projectStatus,
      'Workflow Status': p.workflowStatus || 'APPROVED'
    }));
    exportToExcel(rows, `ET_Student_Projects_${selectedDept}`, 'Projects', currentUser, { moduleKey: 'studentProjects' });
    showToast(`Exported ${rows.length} student project records to Excel.`);
  };

  const handleExportPDF = () => {
    const rows = filteredProjects.map(p => ({
      'Project No': p.projectNumber || '—',
      'Title': p.projectTitle,
      'Type': p.projectType,
      'Dept': p.department,
      'Lead': p.teamMembers?.[0]?.name || '—',
      'Guide': p.guide?.name || '—',
      'Status': p.workflowStatus || 'APPROVED'
    }));
    exportToPDF('ET_Student_Projects_Report', ['Project No', 'Title', 'Type', 'Dept', 'Lead', 'Guide', 'Status'], rows, 'Student Projects & Capstone Repository', currentUser, { moduleKey: 'studentProjects' });
    showToast(`Exported student projects report to PDF.`);
  };

  return (
    <MotionPage style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', position: 'relative' }}>
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
          { label: 'Student Projects' }
        ]}
        title="Student Projects & Capstone Repository"
        subtitle="Departmental repository for Major Projects, Mini Projects, Capstone Innovations, Industry Sponsored Projects & Evaluation Rubrics."
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        primaryAction={canCreate ? {
          label: 'Register Project',
          icon: Plus,
          onClick: () => { setEditingItem(null); setWizardOpen(true); }
        } : null}
      />

      {/* 2. KPI Summary Cards */}
      <AnimatedKpiGrid minWidth="140px">
        <MotionKpiCard label="Total Projects" value={stats.total} icon={Code2} color="#0F172A" bg="#F8FAFC" />
        <MotionKpiCard label="Major Projects" value={stats.major} icon={BookOpen} color="#2563EB" bg="#EFF6FF" />
        <MotionKpiCard label="Mini Projects" value={stats.mini} icon={Layers} color="#059669" bg="#ECFDF5" />
        <MotionKpiCard label="Capstone" value={stats.capstone} icon={Zap} color="#7C3AED" bg="#F5F3FF" />
        <MotionKpiCard label="Industry Linked" value={stats.industry} icon={Building2} color="#D97706" bg="#FEFCE8" />
        <MotionKpiCard label="Completed" value={stats.completed} icon={CheckCircle2} color="#0D9488" bg="#F0FDFA" />
        <MotionKpiCard label="Pending Review" value={stats.pendingReview} icon={AlertTriangle} color="#DC2626" bg="#FEF2F2" />
      </AnimatedKpiGrid>

      {/* 3. Search & Filter Bar */}
      <div style={{ background: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by project number, title, guide, team member..."
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
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Project Types</option>
              <option value="Major Project">Major Project</option>
              <option value="Mini Project">Mini Project</option>
              <option value="Capstone Project">Capstone Project</option>
              <option value="Research Project">Research Project</option>
              <option value="Industry Project">Industry Project</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">Status: All</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <select
              value={selectedWorkflowStatus}
              onChange={(e) => setSelectedWorkflowStatus(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">Approval: All</option>
              <option value="APPROVED">Approved</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="DRAFT">Draft</option>
            </select>

            {(searchQuery || selectedDept !== 'ALL' || selectedType !== 'ALL' || selectedStatus !== 'ALL' || selectedWorkflowStatus !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (currentUser?.role !== 'HOD') setSelectedDept('ALL');
                  setSelectedType('ALL');
                  setSelectedStatus('ALL');
                  setSelectedWorkflowStatus('ALL');
                }}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Projects Data Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1050px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0.85rem 1rem', minWidth: '130px' }}>Project ID</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '220px' }}>Project Title</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '95px' }}>Department</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '85px' }}>Batch</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '100px' }}>Type</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '120px' }}>Domain</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '160px' }}>Team Members</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '130px' }}>Faculty Guide</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '100px' }}>Milestones</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '95px' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '95px' }}>Approval</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', minWidth: '85px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    No student project records found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((item, idx) => {
                  const wfBadge = getWorkflowBadge(item.workflowStatus);
                  const stBadge = getProjectStatusBadge(item.projectStatus);
                  const WfIcon = wfBadge.icon;
                  const completedReviews = item.reviews?.filter(r => r.status === 'COMPLETED').length || 0;
                  const totalReviews = item.reviews?.length || 4;

                  return (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }} className="hover:bg-slate-50">
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <span className="record-code" style={{ color: '#0F172A', background: '#F8FAFC', padding: '0.2rem 0.45rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                          {item.projectNumber || `PRJ-${item.id}`}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top', maxWidth: '280px' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.84rem', lineHeight: '1.3' }}>
                          {item.projectTitle}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem', background: '#F1F5F9', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          {item.department}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 600 }}>
                          {item.batch || '—'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', background: '#F1F5F9', padding: '0.15rem 0.5rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                          {item.projectType}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 600 }}>
                          {item.domain || item.domains?.[0] || 'General'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top', maxWidth: '200px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                          {item.teamMembers?.[0]?.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          <span style={{ color: '#D4AF37', fontWeight: 700 }}>{item.teamMembers?.[0]?.rollNumber}</span>
                          {item.teamMembers?.length > 1 && ` • +${item.teamMembers.length - 1} more`}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                          {item.guide?.name}
                        </div>
                        {item.industryAssociation?.organization && (
                          <div style={{ fontSize: '0.7rem', color: '#0284C7' }}>
                            Industry: {item.industryAssociation.organization}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: completedReviews === totalReviews ? '#059669' : '#D97706' }}>
                            {completedReviews}/{totalReviews} Completed
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          background: stBadge.bg,
                          color: stBadge.text,
                          border: `1px solid ${stBadge.border}`,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          whiteSpace: 'nowrap'
                        }}>
                          {stBadge.label}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: wfBadge.bg,
                          color: wfBadge.text,
                          border: `1px solid ${wfBadge.border}`,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}>
                          {WfIcon && <WfIcon size={11} />} {wfBadge.label}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => { setDossierModalItem(item); setDossierActiveTab('overview'); }}
                            title="View Project Dossier"
                            style={{ padding: '0.35rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
                          >
                            <Eye size={13} />
                          </button>

                          {canReview && (
                            <button
                              type="button"
                              onClick={() => { setReviewModalItem(item); setReviewAction('APPROVE'); }}
                              title="Review / Approve Project"
                              style={{ padding: '0.35rem 0.55rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: '#059669', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Review
                            </button>
                          )}

                          {canCreate && (
                            <button
                              type="button"
                              onClick={() => { setEditingItem(item); setWizardOpen(true); }}
                              title="Edit Record"
                              style={{ padding: '0.35rem', background: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: '6px', color: '#A16207', cursor: 'pointer' }}
                            >
                              <Edit3 size={13} />
                            </button>
                          )}

                          {canReview && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              title="Delete / Archive"
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
      </div>

      {/* 5. Project Wizard Modal */}
      {wizardOpen && (
        <StudentProjectWizardModal
          isOpen={wizardOpen}
          onClose={() => { setWizardOpen(false); setEditingItem(null); }}
          initialData={editingItem}
          currentUser={currentUser}
          onSaved={() => refresh()}
        />
      )}

      {/* 6. Multi-Tab Dossier Modal */}
      {dossierModalItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 15, 30, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '860px',
            width: '100%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
            border: '1px solid #D4AF37',
            overflow: 'hidden'
          }}>
            <div style={{ background: 'linear-gradient(135deg, #070F1E 0%, #0B192C 100%)', padding: '1.25rem 1.5rem', color: '#FFFFFF', borderBottom: '2px solid #D4AF37', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase' }}>
                  {dossierModalItem.projectNumber} • {dossierModalItem.projectType}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#FFFFFF', fontFamily: 'Cinzel, serif' }}>
                  {dossierModalItem.projectTitle}
                </h3>
              </div>
              <button type="button" onClick={() => setDossierModalItem(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Dossier Tabs */}
            <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0.5rem 1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
              {[
                { id: 'overview', label: 'Problem & Overview' },
                { id: 'team', label: `Team Members (${dossierModalItem.teamMembers?.length || 0})` },
                { id: 'reviews', label: 'Milestone Reviews' },
                { id: 'tech', label: 'Tech Stack & Links' },
                { id: 'outcomes', label: 'Research Outcomes' },
                { id: 'evidence', label: `Documents (${dossierModalItem.documents?.length || 0})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDossierActiveTab(tab.id)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: dossierActiveTab === tab.id ? '#070F1E' : 'transparent',
                    color: dossierActiveTab === tab.id ? '#F1C40F' : '#64748B',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Dossier Canvas */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {dossierActiveTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Primary Guide</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>{dossierModalItem.guide?.name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Department & Batch</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#059669' }}>{dossierModalItem.department} ({dossierModalItem.batch})</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Project Status</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#2563EB' }}>{dossierModalItem.projectStatus}</div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Problem Statement</h4>
                    <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0 }}>{dossierModalItem.problemStatement}</p>
                  </div>
                </div>
              )}

              {dossierActiveTab === 'team' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dossierModalItem.teamMembers?.map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.84rem' }}>
                          {m.name} {m.isLeader && <span style={{ color: '#D4AF37', fontSize: '0.72rem' }}>(Leader)</span>}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          Roll: {m.rollNumber} • {m.department}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#0284C7' }}>{m.email}</div>
                    </div>
                  ))}
                </div>
              )}

              {dossierActiveTab === 'reviews' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dossierModalItem.reviews?.map((r, i) => (
                    <div key={i} style={{ padding: '0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.82rem', color: '#0F172A' }}>{r.reviewName}</strong>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#059669' }}>{r.marksAwarded} / {r.maxMarks} Marks</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem' }}>
                        Date: {r.reviewDate} • Panel: {r.panelMembers} • Status: {r.status}
                      </div>
                      {r.feedback && <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '0.35rem', background: '#FFFFFF', padding: '0.45rem', borderRadius: '4px' }}>Feedback: {r.feedback}</div>}
                    </div>
                  ))}
                </div>
              )}

              {dossierActiveTab === 'tech' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Tech Stack</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {dossierModalItem.technologies?.map(t => (
                        <span key={t} style={{ padding: '0.3rem 0.7rem', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    {dossierModalItem.links?.githubUrl && (
                      <a href={dossierModalItem.links.githubUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem', background: '#F8FAFC', borderRadius: '8px', color: '#0F172A', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700 }}>
                        <GitBranch size={15} /> GitHub Repository
                      </a>
                    )}
                    {dossierModalItem.links?.liveDemoUrl && (
                      <a href={dossierModalItem.links.liveDemoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem', background: '#F8FAFC', borderRadius: '8px', color: '#059669', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700 }}>
                        <Globe size={15} /> Live Project Demo
                      </a>
                    )}
                  </div>
                </div>
              )}

              {dossierActiveTab === 'outcomes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.84rem' }}>Research Publication Output</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
                      {dossierModalItem.researchOutcomes?.linkedPublicationId ? `Linked Record: ${dossierModalItem.researchOutcomes.linkedPublicationId}` : 'No publication linked yet.'}
                    </div>
                  </div>

                  <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.84rem' }}>Patent Filing Output</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
                      {dossierModalItem.researchOutcomes?.linkedPatentId ? `Linked Record: ${dossierModalItem.researchOutcomes.linkedPatentId}` : 'No patent linked yet.'}
                    </div>
                  </div>
                </div>
              )}

              {dossierActiveTab === 'evidence' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {dossierModalItem.documents?.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>No project documents attached.</div>
                  ) : (
                    dossierModalItem.documents?.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.9rem', background: '#F1F5F9', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <FileText size={16} style={{ color: '#D4AF37' }} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>{doc.name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{doc.type} ({doc.size})</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDossierModalItem(null)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Review Decision Modal */}
      {reviewModalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 15, 30, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '500px', width: '100%', border: '1px solid #D4AF37', overflow: 'hidden' }}>
            <div style={{ background: '#070F1E', padding: '1rem 1.25rem', color: '#FFFFFF', borderBottom: '2px solid #D4AF37' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Review & Approve Project</h3>
              <div style={{ fontSize: '0.75rem', color: '#D4AF37' }}>{reviewModalItem.projectTitle}</div>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>DECISION *</label>
                <select value={reviewAction} onChange={(e) => setReviewAction(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}>
                  <option value="APPROVE">Approve Project</option>
                  <option value="COMPLETE">Mark Project Completed & Evaluated</option>
                  <option value="UNDER_REVIEW">Mark Under Evaluation</option>
                  <option value="REQUEST_REVISION">Request Revision from Team</option>
                  <option value="ARCHIVE">Archive Record</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>EVALUATION REMARKS</label>
                <textarea rows={3} placeholder="Add panel evaluation remarks..." value={reviewRemarks} onChange={(e) => setReviewRemarks(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }} />
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
        title="Move Project to Recycle Bin?"
        itemName={deleteConfirmItem?.title}
        itemType="project"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmItem(null)}
      />
    </MotionPage>
  );
}
