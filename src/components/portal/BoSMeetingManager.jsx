import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Users, 
  Building2, 
  FileText, 
  Layers, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  UploadCloud, 
  Lock, 
  Eye, 
  Copy, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  UserCheck, 
  Briefcase, 
  GraduationCap, 
  Printer,
  Archive,
  RefreshCw,
  FileSpreadsheet,
  FileCheck,
  History,
  Send,
  AlertTriangle,
  MapPin,
  Globe,
  Video,
  Info
} from 'lucide-react';
import { 
  getBoSMeetings, 
  saveBoSMeeting, 
  updateBoSMeetingStatus, 
  archiveBoSMeeting,
  softDeleteBoSMeeting, 
  generateBoSNumber,
  exportToCSV,
  exportToExcel,
  exportToPDF,
  exportBoSToPDF,
  exportBoSReportToPDF
} from '../../data/portalStore.js';
import { ET_DEPARTMENTS, normalizeDepartment } from '../../data/masterData.js';
import { 
  getWorkflowBadge, 
  StatusBadge 
} from '../../lib/ui/statusBadges.jsx';
import BosWizardModal from './bos/BosWizardModal.jsx';
import NECDocumentViewer from './shared/NECDocumentViewer.jsx';
import { 
  MotionPage, 
  ModulePageHeader, 
  AnimatedKpiGrid, 
  MotionKpiCard, 
  MotionTable, 
  MotionTableRow, 
  MotionEmptyState, 
  MotionButton 
} from '../motion/index.js';

export default function BoSMeetingManager({ currentUser, onDataChange }) {
  const [meetings, setMeetings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState(
    currentUser?.role === 'HOD' ? (currentUser.dept || 'CYS') : 'ALL'
  );
  const [selectedRegulationFilter, setSelectedRegulationFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedAcademicYearFilter, setSelectedAcademicYearFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Wizard Modal State
  const [wizardModalOpen, setWizardModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);

  // Detail Dossier Modal State
  const [detailModalMeeting, setDetailModalMeeting] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('overview');

  // Review & Approval Action Modal State
  const [reviewModalMeeting, setReviewModalMeeting] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVED'); // 'APPROVED' | 'NEEDS_REVISION'
  const [reviewComments, setReviewComments] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Toast & Action Modal States
  const [toastMessage, setToastMessage] = useState(null);
  const [deleteDraftMeeting, setDeleteDraftMeeting] = useState(null);
  const [archiveModalMeeting, setArchiveModalMeeting] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activePdfDoc, setActivePdfDoc] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Regulations Master List
  const availableRegulations = ['R16', 'R19', 'R20', 'R23', 'R26'];

  // Real Export Handlers
  const handleExportFilteredPDF = () => {
    exportBoSReportToPDF(filteredMeetings, currentUser, {
      dept: selectedDeptFilter,
      reg: selectedRegulationFilter,
      ay: selectedAcademicYearFilter
    });
    showToast(`Exported formal BoS report for ${filteredMeetings.length} meetings.`);
  };

  const handleExportExcel = () => {
    const exportRows = filteredMeetings.map(m => ({
      'BoS Number': m.bosNumber,
      'Department': m.department,
      'Academic Year': m.academicYear,
      'Meeting Date': m.bosDate,
      'Start Time': m.startTime || 'N/A',
      'End Time': m.endTime || 'N/A',
      'Mode': m.meetingMode,
      'Regulations': (m.regulations || []).join(', '),
      'Chairman': m.chairmanName || m.chairman || 'N/A',
      'Nominee': m.universityNominee?.name || 'N/A',
      'Status': m.workflowStatus
    }));
    exportToExcel(exportRows, `ET_BoS_Meetings_${selectedDeptFilter}`);
    showToast(`Exported ${filteredMeetings.length} BoS meetings to Excel.`);
  };

  const handleExportSingleMeetingPDF = (meeting) => {
    exportBoSToPDF(meeting, currentUser);
    showToast(`Generated official BoS PDF for ${meeting.bosNumber}.`);
  };

  // Load BoS Data
  const refreshMeetings = () => {
    const data = getBoSMeetings();
    setMeetings(data);
    if (onDataChange) onDataChange();
  };

  useEffect(() => {
    refreshMeetings();
  }, []);

  // Role & Granular Permissions
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN';
  const isHOD = currentUser?.role === 'HOD';
  const canCreate = isSuperAdmin || isAdmin || isHOD;
  const canApprove = isSuperAdmin || isAdmin;
  const hasBosDeletePerm = isSuperAdmin || isAdmin || (currentUser?.permissions?.includes('bos.delete')) || (isHOD && currentUser?.permissions?.includes('bos.delete'));

  const canEditRecord = (meeting) => {
    if (isSuperAdmin || isAdmin) return true;
    if (isHOD && normalizeDepartment(meeting.department).code === normalizeDepartment(currentUser?.dept).code) {
      return ['DRAFT', 'NEEDS_REVISION'].includes(meeting.workflowStatus);
    }
    return false;
  };

  const canDeleteRecord = (meeting) => {
    if (isSuperAdmin) return true;
    if (meeting.workflowStatus === 'DRAFT') {
      if (isAdmin) return true;
      if (isHOD && normalizeDepartment(meeting.department).code === normalizeDepartment(currentUser?.dept).code) return true;
      return Boolean(currentUser?.permissions?.includes('bos.delete'));
    }
    return false;
  };

  const canArchiveRecord = (meeting) => {
    if (meeting.workflowStatus === 'ARCHIVED') return false;
    return isSuperAdmin || isAdmin || (isHOD && normalizeDepartment(meeting.department).code === normalizeDepartment(currentUser?.dept).code);
  };

  // Filtered Meetings List
  const filteredMeetings = meetings.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (m.bosNumber && m.bosNumber.toLowerCase().includes(q)) ||
      (m.title && m.title.toLowerCase().includes(q)) ||
      (m.chairmanName && m.chairmanName.toLowerCase().includes(q)) ||
      (m.chairman && m.chairman.toLowerCase().includes(q)) ||
      (m.department && m.department.toLowerCase().includes(q)) ||
      (m.universityNominee?.name && m.universityNominee.name.toLowerCase().includes(q)) ||
      (m.regulations && m.regulations.some(r => r.toLowerCase().includes(q)));

    // Canonical HOD & Department Code Matching
    const meetingDeptCode = normalizeDepartment(m.department).code;
    const userDeptCode = normalizeDepartment(currentUser?.dept).code;
    const matchesDept = currentUser?.role === 'HOD' 
      ? meetingDeptCode === userDeptCode 
      : (selectedDeptFilter === 'ALL' || meetingDeptCode === selectedDeptFilter);

    const matchesReg = selectedRegulationFilter === 'ALL' || (m.regulations && m.regulations.includes(selectedRegulationFilter));
    const matchesStatus = selectedStatusFilter === 'ALL' || m.workflowStatus === selectedStatusFilter;
    const matchesYear = selectedAcademicYearFilter === 'ALL' || m.academicYear === selectedAcademicYearFilter;

    let matchesDate = true;
    const mDate = m.bosDate || m.meetingDate || m.date;
    if (mDate) {
      if (fromDate && mDate < fromDate) matchesDate = false;
      if (toDate && mDate > toDate) matchesDate = false;
    }

    return matchesSearch && matchesDept && matchesReg && matchesStatus && matchesYear && matchesDate;
  });

  // KPI Metrics Summary (Synchronized strictly with filtered projection)
  const totalCount = filteredMeetings.length;
  const draftCount = filteredMeetings.filter(m => m.workflowStatus === 'DRAFT').length;
  const reviewCount = filteredMeetings.filter(m => ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION'].includes(m.workflowStatus)).length;
  const approvedCount = filteredMeetings.filter(m => m.workflowStatus === 'APPROVED').length;
  const currentYearCount = filteredMeetings.filter(m => m.academicYear === '2026-27' || m.academicYear === '2025-26').length;

  // Open Create Wizard (100% EMPTY initial state)
  const handleOpenCreate = () => {
    setEditingMeeting(null);
    setWizardModalOpen(true);
  };

  // Open Edit Wizard
  const handleOpenEdit = (meeting) => {
    setEditingMeeting(meeting);
    setWizardModalOpen(true);
  };

  // Save Draft Handler
  const handleSaveDraft = (data) => {
    const payload = {
      ...data,
      workflowStatus: 'DRAFT'
    };
    const saved = saveBoSMeeting(payload, currentUser);
    refreshMeetings();
    setWizardModalOpen(false);
    showToast(`Draft saved successfully for ${saved.bosNumber}.`);
  };

  // Submit for Review Handler
  const handleSubmitForReview = (data) => {
    const payload = {
      ...data,
      workflowStatus: 'SUBMITTED',
      workflowComments: 'Submitted for College Academic Admin & Super Admin review.'
    };
    const saved = saveBoSMeeting(payload, currentUser);
    refreshMeetings();
    setWizardModalOpen(false);
    showToast(`BoS Meeting ${saved.bosNumber} submitted for Administrative Review!`);
  };

  // Handle Review Action (Approve / Request Revision)
  const handleExecuteReview = () => {
    if (!reviewModalMeeting) return;
    if (reviewAction === 'NEEDS_REVISION' && !reviewComments.trim()) {
      setReviewError('Please provide specific feedback/revision requirements in the comments box.');
      return;
    }

    setReviewError('');
    updateBoSMeetingStatus(
      reviewModalMeeting.id,
      reviewAction,
      reviewComments || (reviewAction === 'APPROVED' ? 'Approved by Academic Governance Committee.' : 'Changes requested.'),
      currentUser
    );

    refreshMeetings();
    const currentBosNum = reviewModalMeeting.bosNumber;
    setReviewModalMeeting(null);
    setReviewComments('');
    showToast(`BoS record ${currentBosNum} marked as ${reviewAction}!`);
  };

  // Handle Delete Draft
  const handleDeleteDraft = (meeting) => {
    setDeleteDraftMeeting(meeting);
  };

  const handleConfirmDeleteDraft = () => {
    if (deleteDraftMeeting) {
      try {
        softDeleteBoSMeeting(deleteDraftMeeting.id, currentUser);
        refreshMeetings();
        showToast(`Draft ${deleteDraftMeeting.bosNumber} moved to Recycle Bin.`);
      } catch (err) {
        showToast(err.message);
      } finally {
        setDeleteDraftMeeting(null);
      }
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', icon: CheckCircle2, label: 'APPROVED' };
      case 'SUBMITTED':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: Clock, label: 'SUBMITTED' };
      case 'UNDER_REVIEW':
        return { bg: '#FDF4FF', text: '#9333EA', border: '#F0ABFC', icon: Sparkles, label: 'UNDER REVIEW' };
      case 'NEEDS_REVISION':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: AlertTriangle, label: 'NEEDS REVISION' };
      case 'ARCHIVED':
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', icon: Archive, label: 'ARCHIVED' };
      case 'DRAFT':
      default:
        return { bg: '#FEFCE8', text: '#A16207', border: '#FEF08A', icon: Edit3, label: 'DRAFT' };
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
      {/* 1. Page Title & Action Header */}
      <ModulePageHeader
        breadcrumbs={[
          { label: 'Dashboard' },
          { label: 'Academic Governance' },
          { label: 'Board of Studies (BoS)' }
        ]}
        title="Board of Studies (BoS) Academic Governance"
        subtitle="Statutory repository for department BoS regulations, external nominees, meeting minutes, and compliance approvals."
        onExportCSV={() => exportToCSV(filteredMeetings, `ET_BoS_Meetings_${selectedDeptFilter}`, currentUser, { moduleKey: 'bosMeetings' })}
        onExportExcel={() => exportToExcel(filteredMeetings, `ET_BoS_Meetings_${selectedDeptFilter}`, 'BoS_Meetings', currentUser, { moduleKey: 'bosMeetings' })}
        onExportPDF={handleExportFilteredPDF}
        primaryAction={canCreate ? {
          label: 'Create BoS Record',
          icon: Plus,
          onClick: handleOpenCreate
        } : null}
      />

      {/* 2. Mini KPI Stats Summary Row */}
      <AnimatedKpiGrid minWidth="180px">
        <MotionKpiCard label="Total BoS Meetings" value={totalCount} icon={BookOpen} color="#3B82F6" bg="rgba(59, 130, 246, 0.08)" />
        <MotionKpiCard label="Draft Meetings" value={draftCount} icon={Edit3} color="#F59E0B" bg="rgba(245, 158, 11, 0.08)" />
        <MotionKpiCard label="Awaiting Review" value={reviewCount} icon={Clock} color="#8B5CF6" bg="rgba(139, 92, 246, 0.08)" />
        <MotionKpiCard label="Approved Records" value={approvedCount} icon={CheckCircle2} color="#10B981" bg="rgba(16, 185, 129, 0.08)" />
        <MotionKpiCard label="AY 2025-26 Meetings" value={currentYearCount} icon={Calendar} color="#D4AF37" bg="rgba(212, 175, 55, 0.08)" />
      </AnimatedKpiGrid>

      {/* 3. Filter & Search Toolbar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        padding: '1rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search BoS number, title, chairman, university nominee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              className="focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={handleExportExcel}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#334155', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
              className="hover:bg-slate-100"
            >
              <FileSpreadsheet size={14} style={{ color: '#10B981' }} /> Export Excel
            </button>
            <button
              type="button"
              onClick={handleExportFilteredPDF}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#334155', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
              className="hover:bg-slate-100"
            >
              <FileText size={14} style={{ color: '#EF4444' }} /> Export PDF
            </button>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem' }}>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '0.2rem' }}>
              DEPARTMENT {currentUser?.role === 'HOD' && '(LOCKED)'}
            </label>
            <select
              value={selectedDeptFilter}
              disabled={currentUser?.role === 'HOD'}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem', outline: 'none', background: currentUser?.role === 'HOD' ? '#F1F5F9' : '#FFFFFF' }}
            >
              {currentUser?.role !== 'HOD' && <option value="ALL">All</option>}
              {ET_DEPARTMENTS.map(d => (
                <option key={d.code} value={d.code}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '0.2rem' }}>
              ACADEMIC YEAR
            </label>
            <select
              value={selectedAcademicYearFilter}
              onChange={(e) => setSelectedAcademicYearFilter(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem', outline: 'none', background: '#FFFFFF' }}
            >
              <option value="ALL">All Academic Years</option>
              <option value="2026-27">2026-27</option>
              <option value="2025-26">2025-26 (Current)</option>
              <option value="2024-25">2024-25</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '0.2rem' }}>
              REGULATION
            </label>
            <select
              value={selectedRegulationFilter}
              onChange={(e) => setSelectedRegulationFilter(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem', outline: 'none', background: '#FFFFFF' }}
            >
              <option value="ALL">All Regulations</option>
              {availableRegulations.map(r => <option key={r} value={r}>{r} Regulation</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '0.2rem' }}>
              GOVERNANCE STATUS
            </label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem', outline: 'none', background: '#FFFFFF' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="NEEDS_REVISION">NEEDS REVISION</option>
              <option value="APPROVED">APPROVED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </div>

        {/* Date Filter Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '0.45rem', borderTop: '1px dashed #E2E8F0', fontSize: '0.78rem' }}>
          <span style={{ fontWeight: 700, color: '#475569' }}>Meeting Date:</span>
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
              onClick={() => { setFromDate(''); setToDate(''); }}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Clear Dates
            </button>
          )}
        </div>
      </div>

      {/* 4. BoS Data Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0.75rem 1rem' }}>BoS Number & Title</th>
                <th style={{ padding: '0.75rem 1rem' }}>Dept / Year</th>
                <th style={{ padding: '0.75rem 1rem' }}>Regulations</th>
                <th style={{ padding: '0.75rem 1rem' }}>Meeting Date & Mode</th>
                <th style={{ padding: '0.75rem 1rem' }}>Chairman / Nominee</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Documents</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMeetings.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748B' }}>
                    <BookOpen size={36} style={{ color: '#CBD5E1', margin: '0 auto 0.5rem auto' }} />
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#334155' }}>No Board of Studies meetings found</div>
                    <div style={{ fontSize: '0.76rem', marginTop: '0.2rem' }}>
                      {canCreate ? 'Click "+ Create BoS Record" to register a departmental BoS meeting.' : 'No records match the active search filters.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMeetings.map((meeting) => {
                  const badge = getStatusBadge(meeting.workflowStatus);
                  const BadgeIcon = badge.icon;
                  const canEdit = canEditRecord(meeting);

                  return (
                    <tr
                      key={meeting.id}
                      style={{ borderBottom: '1px solid #F1F5F9' }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                          {meeting.bosNumber}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '0.15rem' }}>
                          {meeting.title || `${meeting.department} BoS Meeting`}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{meeting.department}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{meeting.academicYear}</div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {meeting.regulations?.map(r => (
                            <span
                              key={r}
                              style={{
                                background: '#F1F5F9',
                                color: '#334155',
                                border: '1px solid #E2E8F0',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 700
                              }}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{meeting.bosDate}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {meeting.meetingMode === 'Online' && <Video size={11} />}
                          {meeting.meetingMode === 'Hybrid' && <Globe size={11} />}
                          {meeting.meetingMode === 'Offline' && <MapPin size={11} />}
                          {meeting.meetingMode}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', maxWidth: '220px' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {meeting.chairmanName || meeting.chairman?.split('(')[0]}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          🎓 Nominee: {meeting.universityNominee?.name || 'Assigned'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          background: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          {BadgeIcon && <BadgeIcon size={11} />} {badge.label}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        {meeting.documents && meeting.documents.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setActivePdfDoc(meeting.documents[0])}
                            style={{
                              background: '#FEF2F2',
                              border: '1px solid #FECACA',
                              color: '#DC2626',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                            title="View Official Scanned PDF Minutes"
                          >
                            <FileText size={12} /> {meeting.documents.length} PDF{meeting.documents.length > 1 ? 's' : ''}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FileText size={13} /> No linked document
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', position: 'relative' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            title="Inspect BoS Dossier"
                            onClick={() => {
                              setDetailModalMeeting(meeting);
                              setActiveDetailTab('overview');
                            }}
                            style={{ background: 'transparent', border: '1px solid #CBD5E1', color: '#334155', padding: '0.3rem 0.45rem', borderRadius: '6px', cursor: 'pointer' }}
                            className="hover:bg-slate-100"
                          >
                            <Eye size={13} />
                          </button>

                          <button
                            type="button"
                            title="Export Meeting PDF Report"
                            onClick={() => handleExportSingleMeetingPDF(meeting)}
                            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '0.3rem 0.45rem', borderRadius: '6px', cursor: 'pointer' }}
                            className="hover:bg-red-100"
                          >
                            <Printer size={13} />
                          </button>

                          {canEdit && (
                            <button
                              type="button"
                              title="Edit Record"
                              onClick={() => handleOpenEdit(meeting)}
                              style={{ background: 'transparent', border: '1px solid #CBD5E1', color: '#334155', padding: '0.3rem 0.45rem', borderRadius: '6px', cursor: 'pointer' }}
                              className="hover:bg-slate-100"
                            >
                              <Edit3 size={13} />
                            </button>
                          )}

                          {/* Quick Review Button for Approvers */}
                          {canApprove && ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION'].includes(meeting.workflowStatus) && (
                            <button
                              type="button"
                              title="Review & Decision"
                              onClick={() => {
                                setReviewModalMeeting(meeting);
                                setReviewAction('APPROVED');
                                setReviewComments('');
                              }}
                              style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.3rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                              className="hover:bg-emerald-100"
                            >
                              Review
                            </button>
                          )}

                          {/* More Options / Lifecycle Menu Toggle */}
                          <div style={{ position: 'relative' }}>
                            <button
                              type="button"
                              title="More actions"
                              onClick={() => setOpenActionMenuId(openActionMenuId === meeting.id ? null : meeting.id)}
                              style={{
                                background: openActionMenuId === meeting.id ? '#0F172A' : 'transparent',
                                border: '1px solid #CBD5E1',
                                color: openActionMenuId === meeting.id ? '#FFFFFF' : '#334155',
                                padding: '0.3rem 0.45rem',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              ⋯
                            </button>

                            {openActionMenuId === meeting.id && (
                              <div style={{
                                position: 'absolute',
                                right: 0,
                                top: 'calc(100% + 4px)',
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                                zIndex: 200,
                                minWidth: '170px',
                                padding: '0.35rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.2rem'
                              }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setDetailModalMeeting(meeting);
                                    setActiveDetailTab('overview');
                                  }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.4rem 0.6rem', border: 'none', background: 'transparent', color: '#334155', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left', borderRadius: '4px', cursor: 'pointer' }}
                                  className="hover:bg-slate-50"
                                >
                                  <Eye size={12} /> View Dossier
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleExportSingleMeetingPDF(meeting);
                                  }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.4rem 0.6rem', border: 'none', background: 'transparent', color: '#DC2626', fontSize: '0.75rem', fontWeight: 700, textAlign: 'left', borderRadius: '4px', cursor: 'pointer' }}
                                  className="hover:bg-red-50"
                                >
                                  <Printer size={12} /> Export PDF Report
                                </button>

                                {meeting.documents && meeting.documents.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      setActivePdfDoc(meeting.documents[0]);
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.4rem 0.6rem', border: 'none', background: 'transparent', color: '#0F172A', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left', borderRadius: '4px', cursor: 'pointer' }}
                                    className="hover:bg-slate-50"
                                  >
                                    <FileText size={12} /> View Official Minutes
                                  </button>
                                )}

                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleOpenEdit(meeting);
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.4rem 0.6rem', border: 'none', background: 'transparent', color: '#334155', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left', borderRadius: '4px', cursor: 'pointer' }}
                                    className="hover:bg-slate-50"
                                  >
                                    <Edit3 size={12} /> Edit Record
                                  </button>
                                )}

                                {canArchiveRecord(meeting) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      setArchiveModalMeeting(meeting);
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.4rem 0.6rem', border: 'none', background: 'transparent', color: '#475569', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left', borderRadius: '4px', cursor: 'pointer' }}
                                    className="hover:bg-slate-50"
                                  >
                                    <Archive size={12} /> Archive Record
                                  </button>
                                )}

                                {canDeleteRecord(meeting) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      setDeleteDraftMeeting(meeting);
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.4rem 0.6rem', border: 'none', background: '#FEF2F2', color: '#DC2626', fontSize: '0.75rem', fontWeight: 700, textAlign: 'left', borderRadius: '4px', cursor: 'pointer' }}
                                    className="hover:bg-red-100"
                                  >
                                    <Trash2 size={12} /> Delete Record
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
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

      {/* 5. Production-Grade Wizard Stepper Modal */}
      {wizardModalOpen && (
        <BosWizardModal
          isOpen={wizardModalOpen}
          onClose={() => setWizardModalOpen(false)}
          initialData={editingMeeting}
          currentUser={currentUser}
          onSaveDraft={handleSaveDraft}
          onSubmitForReview={handleSubmitForReview}
        />
      )}

      {/* 6. Detailed Inspection Dossier Modal */}
      {detailModalMeeting && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 15, 30, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1100
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: '#FFFFFF',
              borderRadius: '18px',
              maxWidth: '860px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden'
            }}
          >
            <div style={{ background: '#070F1E', padding: '1.25rem 1.5rem', color: '#FFFFFF', borderBottom: '2px solid #D4AF37', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.92rem', color: '#F1C40F' }}>
                    {detailModalMeeting.bosNumber}
                  </span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                    v{detailModalMeeting.version || 1}.0
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#CBD5E1' }}>
                  {detailModalMeeting.department} Department • {detailModalMeeting.academicYear} • Regulations: {detailModalMeeting.regulations?.join(', ')}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleExportSingleMeetingPDF(detailModalMeeting)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  <Printer size={13} /> Export PDF Report
                </button>
                <button
                  type="button"
                  onClick={() => setDetailModalMeeting(null)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFFFFF', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0 1.5rem', display: 'flex', gap: '1rem', overflowX: 'auto' }}>
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'members', label: `Statutory Members (${(detailModalMeeting.members && detailModalMeeting.members.length) || 0})` },
                { id: 'agenda', label: `Agenda & Resolutions (${(detailModalMeeting.agendaItems?.length || 0) + (detailModalMeeting.resolutions?.length || 0)})` },
                { id: 'documents', label: `Official Documents (${detailModalMeeting.documents?.length || 0})` },
                { id: 'history', label: 'Approval Trail' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveDetailTab(tab.id)}
                  style={{
                    padding: '0.85rem 0.5rem',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: `2px solid ${activeDetailTab === tab.id ? '#D4AF37' : 'transparent'}`,
                    color: activeDetailTab === tab.id ? '#0F172A' : '#64748B',
                    fontWeight: activeDetailTab === tab.id ? 800 : 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {activeDetailTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.82rem' }}>
                    <div><strong>Meeting Date:</strong> {detailModalMeeting.bosDate || detailModalMeeting.meetingDate || 'N/A'}</div>
                    <div><strong>Timing:</strong> {detailModalMeeting.startTime || '10:00 AM'} to {detailModalMeeting.endTime || '01:00 PM'}</div>
                    <div><strong>Mode:</strong> {detailModalMeeting.meetingMode || 'Online'}</div>
                    <div><strong>Venue / Platform:</strong> {detailModalMeeting.platform || detailModalMeeting.venue || 'Microsoft Teams'}</div>
                    <div><strong>Meeting Status:</strong> {detailModalMeeting.meetingStatus || 'HELD'}</div>
                    <div><strong>Governance Status:</strong> {detailModalMeeting.workflowStatus || 'DRAFT'}</div>
                    <div><strong>Chairperson:</strong> {detailModalMeeting.chairperson || detailModalMeeting.chairman || 'Dr. V. V. A. S. Lakshmi'}</div>
                    <div><strong>Target Regulation:</strong> {detailModalMeeting.regulationCodes || (detailModalMeeting.regulations ? detailModalMeeting.regulations.join(', ') : 'R23')} ({detailModalMeeting.targetYear || 'All Years'})</div>
                  </div>

                  {(detailModalMeeting.reviewNotes || detailModalMeeting.sourceConfidence || detailModalMeeting.sourceFiles) && (
                    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1rem', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#B45309', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                        <ShieldCheck size={15} /> PROVENANCE & INSTITUTIONAL REVIEW AUDIT TRAIL
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#78350F', lineHeight: 1.5 }}>
                        <div><strong>Source Confidence:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{detailModalMeeting.sourceConfidence || 'HIGH'}</span></div>
                        {detailModalMeeting.reviewNotes && <div style={{ marginTop: '0.25rem' }}><strong>Review Notes:</strong> {detailModalMeeting.reviewNotes}</div>}
                        {detailModalMeeting.sourceFiles && <div style={{ marginTop: '0.25rem' }}><strong>Original Files:</strong> {detailModalMeeting.sourceFiles}</div>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === 'members' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {detailModalMeeting.members && detailModalMeeting.members.length > 0 ? (
                    <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                        <thead>
                          <tr style={{ background: '#0F172A', color: '#FFFFFF', textAlign: 'left' }}>
                            <th style={{ padding: '0.6rem 0.75rem', width: '35px', textAlign: 'center' }}>#</th>
                            <th style={{ padding: '0.6rem 0.75rem' }}>Member Name</th>
                            <th style={{ padding: '0.6rem 0.75rem' }}>Role / Category</th>
                            <th style={{ padding: '0.6rem 0.75rem' }}>Designation</th>
                            <th style={{ padding: '0.6rem 0.75rem' }}>Institution / Organization</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailModalMeeting.members.map((m, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                              <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>{i + 1}</td>
                              <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: '#0F172A' }}>{m.name}</td>
                              <td style={{ padding: '0.55rem 0.75rem' }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8', padding: '0.2rem 0.45rem', borderRadius: '4px' }}>
                                  {(m.member_type || m.category || 'MEMBER').replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td style={{ padding: '0.55rem 0.75rem', color: '#475569' }}>{m.designation || '—'}</td>
                              <td style={{ padding: '0.55rem 0.75rem', color: '#334155' }}>{m.organization || m.institution || 'Narasaraopeta Engineering College'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase' }}>BoS Chairman</div>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>{detailModalMeeting.chairmanName || detailModalMeeting.chairman || detailModalMeeting.chairperson}</div>
                      </div>
                      {detailModalMeeting.universityNominee && (
                        <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase' }}>University Nominee</div>
                          <div style={{ fontWeight: 800, color: '#0F172A' }}>{detailModalMeeting.universityNominee.name}</div>
                          <div style={{ fontSize: '0.74rem', color: '#475569' }}>{detailModalMeeting.universityNominee.designation}, {detailModalMeeting.universityNominee.institution}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === 'agenda' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {detailModalMeeting.agendaItems && detailModalMeeting.agendaItems.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <BookOpen size={14} style={{ color: '#D4AF37' }} /> Agenda Items & Deliberations ({detailModalMeeting.agendaItems.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {detailModalMeeting.agendaItems.map((it, idx) => (
                          <div key={idx} style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D4AF37', marginBottom: '0.2rem' }}>AGENDA ITEM #{it.itemNo || idx + 1}</div>
                            <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>{it.title}</div>
                            {it.description && <div style={{ fontSize: '0.76rem', color: '#64748B' }}>{it.description}</div>}
                            {it.decision && (
                              <div style={{ fontSize: '0.76rem', color: '#047857', background: '#ECFDF5', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #A7F3D0', marginTop: '0.4rem' }}>
                                <strong>Decision:</strong> {it.decision}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detailModalMeeting.resolutions && detailModalMeeting.resolutions.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckCircle2 size={14} style={{ color: '#10B981' }} /> Formal BoS Resolutions ({detailModalMeeting.resolutions.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {detailModalMeeting.resolutions.map((res, idx) => (
                          <div key={idx} style={{ background: '#F0FDF4', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803D', marginBottom: '0.2rem' }}>RESOLUTION #{res.resolutionNumber || idx + 1}</div>
                            <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>{res.title}</div>
                            <div style={{ fontSize: '0.78rem', color: '#166534', lineHeight: 1.45 }}>{res.resolutionText || res.title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!detailModalMeeting.agendaItems || detailModalMeeting.agendaItems.length === 0) && (!detailModalMeeting.resolutions || detailModalMeeting.resolutions.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B', fontSize: '0.82rem' }}>
                      No separate agenda items or resolutions parsed for this summary record. Please refer to official minutes package.
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {detailModalMeeting.documents && detailModalMeeting.documents.length > 0 ? (
                    detailModalMeeting.documents.map(doc => (
                      <div key={doc.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={22} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A' }}>{doc.title || doc.filename}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem' }}>
                              {doc.filename} • {doc.sizeBytes ? `${(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB` : 'PDF'} • {doc.type || 'MINUTES'}
                            </div>
                            {doc.sha256 && (
                              <div style={{ fontSize: '0.66rem', color: '#94A3B8', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                                SHA-256: {doc.sha256.slice(0, 24)}...
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setActivePdfDoc(doc)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#0F172A', color: '#FFFFFF', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            <Eye size={13} /> View PDF
                          </button>
                          <a
                            href={doc.downloadUrl || doc.url || `/documents/bos/cse-cys/${doc.filename}`}
                            download={doc.filename}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#334155', padding: '0.45rem 0.85rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}
                          >
                            <Download size={13} /> Download
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B', fontSize: '0.82rem' }}>
                      No source PDF evidence package attached to this meeting record.
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {detailModalMeeting.approvalHistory?.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D4AF37', marginTop: '6px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                          {h.actor} — <span style={{ color: '#2563EB' }}>{h.toStatus}</span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '0.15rem' }}>{h.comments}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                          {new Date(h.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* 7. Review & Decision Modal */}
      {reviewModalMeeting && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 15, 30, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1100
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.5rem',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.4rem 0' }}>
              Academic Governance Review Decision
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1rem' }}>
              Record: <strong>{reviewModalMeeting.bosNumber}</strong> ({reviewModalMeeting.department})
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setReviewAction('APPROVED')}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: '8px',
                  border: `2px solid ${reviewAction === 'APPROVED' ? '#10B981' : '#E2E8F0'}`,
                  background: reviewAction === 'APPROVED' ? '#ECFDF5' : '#FFFFFF',
                  color: reviewAction === 'APPROVED' ? '#047857' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Approve BoS Record
              </button>

              <button
                type="button"
                onClick={() => setReviewAction('NEEDS_REVISION')}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: '8px',
                  border: `2px solid ${reviewAction === 'NEEDS_REVISION' ? '#DC2626' : '#E2E8F0'}`,
                  background: reviewAction === 'NEEDS_REVISION' ? '#FEF2F2' : '#FFFFFF',
                  color: reviewAction === 'NEEDS_REVISION' ? '#DC2626' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Request Revision
              </button>
            </div>

            {reviewError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={14} />
                <span>{reviewError}</span>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                REVIEWER COMMENTS & INSTRUCTIONS *
              </label>
              <textarea
                rows={4}
                required
                placeholder={reviewAction === 'APPROVED' ? 'Formal approval remarks for Academic Council...' : 'Specify items requiring revision from the department HOD...'}
                value={reviewComments}
                onChange={(e) => { setReviewComments(e.target.value); setReviewError(''); }}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={() => { setReviewModalMeeting(null); setReviewError(''); }}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReview}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: reviewAction === 'APPROVED' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Submit Decision
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 8. Custom NEC Danger Delete Confirmation Modal */}
      {deleteDraftMeeting && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 15, 30, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 7000
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
              border: '1px solid #FECACA'
            }}
          >
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Trash2 size={26} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', textAlign: 'center', margin: '0 0 0.5rem 0', fontFamily: 'Cinzel, Georgia, serif' }}>
              Delete BoS Record?
            </h3>
            
            <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', margin: '0.85rem 0 1.2rem' }}>
              <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#D4AF37', fontSize: '0.9rem' }}>
                {deleteDraftMeeting.bosNumber}
              </div>
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.84rem', marginTop: '0.25rem' }}>
                {deleteDraftMeeting.title || `${deleteDraftMeeting.department} BoS Meeting`}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.2rem' }}>
                {deleteDraftMeeting.department} • Academic Year {deleteDraftMeeting.academicYear}
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748B', textAlign: 'center', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              This action will remove the record and associated draft data from the active roster. The deletion event will be permanently recorded in the institutional audit trail.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteDraftMeeting(null)}
                style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    softDeleteBoSMeeting(deleteDraftMeeting.id, currentUser);
                    const num = deleteDraftMeeting.bosNumber;
                    setDeleteDraftMeeting(null);
                    refreshMeetings();
                    showToast(`BoS record ${num} deleted successfully.`);
                  } catch (err) {
                    showToast(err.message);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                style={{ flex: 1, padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#FFFFFF', fontSize: '0.82rem', fontWeight: 800, cursor: isDeleting ? 'not-allowed' : 'pointer' }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 9. Custom Archive Confirmation Modal */}
      {archiveModalMeeting && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 15, 30, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 7000
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
              border: '1px solid #E2E8F0'
            }}
          >
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#F1F5F9',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Archive size={26} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', textAlign: 'center', margin: '0 0 0.5rem 0', fontFamily: 'Cinzel, Georgia, serif' }}>
              Archive BoS Meeting Record?
            </h3>
            
            <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', margin: '0.85rem 0 1.2rem' }}>
              <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#D4AF37', fontSize: '0.9rem' }}>
                {archiveModalMeeting.bosNumber}
              </div>
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.84rem', marginTop: '0.25rem' }}>
                {archiveModalMeeting.title}
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748B', textAlign: 'center', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              This record will be preserved in the historical governance archive for compliance and statutory auditing.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setArchiveModalMeeting(null)}
                style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  archiveBoSMeeting(archiveModalMeeting.id, currentUser);
                  const num = archiveModalMeeting.bosNumber;
                  setArchiveModalMeeting(null);
                  refreshMeetings();
                  showToast(`BoS Record ${num} moved to Historical Archives.`);
                }}
                style={{ flex: 1, padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none', background: '#0F172A', color: '#FFFFFF', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Archive Record
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 10. Official Scanned PDF Viewer Modal */}
      <NECDocumentViewer
        isOpen={Boolean(activePdfDoc)}
        onClose={() => setActivePdfDoc(null)}
        title={activePdfDoc?.title || 'BoS Official Minutes & Regulations'}
        subtitle={`Official Signed Package • ${activePdfDoc?.filename || 'Document'}`}
        documentUrl={activePdfDoc?.downloadUrl || activePdfDoc?.url || (activePdfDoc?.filename ? `/documents/bos/cse-cys/${activePdfDoc.filename}` : '')}
        fileName={activePdfDoc?.filename || 'BoS_Document.pdf'}
      />
    </MotionPage>
  );
}
