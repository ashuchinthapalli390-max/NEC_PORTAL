import React, { useState, useMemo } from 'react';
import { 
  Award, 
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
  GraduationCap,
  User,
  Star,
  BookOpen,
  Layers
} from 'lucide-react';
import { ET_DEPARTMENTS, normalizeDepartment } from '../../../data/masterData.js';
import { 
  getNPTEL, 
  reviewNPTEL, 
  softDeleteNPTEL,
  exportToCSV,
  exportToExcel,
  exportToPDF
} from '../../../data/portalStore.js';
import { 
  getWorkflowBadge, 
  getResultBadge,
  StatusBadge 
} from '../../../lib/ui/statusBadges.jsx';
import NptelCertificationWizardModal from './NptelCertificationWizardModal.jsx';
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

export default function NptelCertificationsManager({ currentUser, onDataChange }) {
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

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [quickTab, setQuickTab] = useState('ALL'); // 'ALL' | 'STUDENTS' | 'FACULTY' | 'NPTEL' | 'ELITE' | 'PENDING'
  const [selectedDept, setSelectedDept] = useState(currentUser?.role === 'HOD' ? (currentUser.dept || 'ALL') : 'ALL');
  const [selectedAy, setSelectedAy] = useState('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [selectedResult, setSelectedResult] = useState('ALL');
  const [selectedWorkflowStatus, setSelectedWorkflowStatus] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const refresh = () => {
    setDataVersion(v => v + 1);
    if (onDataChange) onDataChange();
  };

  const nptelList = useMemo(() => {
    return getNPTEL();
  }, [dataVersion]);

  // Filtered List
  const filteredCertifications = useMemo(() => {
    return nptelList.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        (item.certificationRecordNumber && item.certificationRecordNumber.toLowerCase().includes(q)) ||
        (item.learnerName && item.learnerName.toLowerCase().includes(q)) ||
        (item.rollNumber && item.rollNumber.toLowerCase().includes(q)) ||
        (item.courseName && item.courseName.toLowerCase().includes(q)) ||
        (item.certificateId && item.certificateId.toLowerCase().includes(q));

      const itemDept = normalizeDepartment(item.department || '').code;
      const matchDept = selectedDept === 'ALL' || itemDept === selectedDept;
      const matchAy = selectedAy === 'ALL' || item.academicYear === selectedAy;
      const matchPlatform = selectedPlatform === 'ALL' || item.platform === selectedPlatform;
      const matchResult = selectedResult === 'ALL' || item.certificateType === selectedResult;
      const matchWorkflow = selectedWorkflowStatus === 'ALL' || item.workflowStatus === selectedWorkflowStatus;

      // Date filtering
      let matchDate = true;
      const certDate = item.certificateDate || item.examDate || item.date;
      if (certDate) {
        if (fromDate && certDate < fromDate) matchDate = false;
        if (toDate && certDate > toDate) matchDate = false;
      }

      // Quick Tab
      let matchQuick = true;
      if (quickTab === 'STUDENTS') matchQuick = item.learnerType === 'STUDENT';
      else if (quickTab === 'FACULTY') matchQuick = item.learnerType === 'FACULTY';
      else if (quickTab === 'NPTEL') matchQuick = item.platform === 'NPTEL' || item.platform === 'SWAYAM';
      else if (quickTab === 'ELITE') matchQuick = item.certificateType && item.certificateType.includes('Elite');
      else if (quickTab === 'PENDING') matchQuick = item.workflowStatus === 'SUBMITTED' || item.workflowStatus === 'UNDER_REVIEW';

      return matchSearch && matchDept && matchAy && matchPlatform && matchResult && matchWorkflow && matchQuick && matchDate;
    });
  }, [nptelList, searchQuery, quickTab, selectedDept, selectedAy, selectedPlatform, selectedResult, selectedWorkflowStatus, fromDate, toDate]);

  // KPIs
  const stats = useMemo(() => {
    const total = filteredCertifications.length;
    const students = filteredCertifications.filter(n => n.learnerType === 'STUDENT').length;
    const faculty = filteredCertifications.filter(n => n.learnerType === 'FACULTY').length;
    const nptel = filteredCertifications.filter(n => n.platform === 'NPTEL' || n.platform === 'SWAYAM').length;
    const elite = filteredCertifications.filter(n => n.certificateType && n.certificateType.includes('Elite')).length;
    const silver = filteredCertifications.filter(n => n.certificateType && n.certificateType.includes('Silver')).length;
    const gold = filteredCertifications.filter(n => n.certificateType && (n.certificateType.includes('Gold') || n.certificateType.includes('Topper'))).length;
    const pendingReview = filteredCertifications.filter(n => n.workflowStatus === 'SUBMITTED' || n.workflowStatus === 'UNDER_REVIEW').length;

    return { total, students, faculty, nptel, elite, silver, gold, pendingReview };
  }, [filteredCertifications]);

  const canCreate = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOD' || currentUser?.role === 'FACULTY';
  const canReview = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOD';

  const handleReviewSubmit = () => {
    if (!reviewModalItem) return;
    reviewNPTEL(reviewModalItem.id, reviewAction, reviewRemarks, currentUser);
    setReviewModalItem(null);
    setReviewRemarks('');
    refresh();
    showToast(`Certification decision recorded.`);
  };

  const handleDelete = (item) => {
    setDeleteConfirmItem(item);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmItem) {
      softDeleteNPTEL(deleteConfirmItem.id, currentUser);
      const name = deleteConfirmItem.courseName || deleteConfirmItem.learnerName || deleteConfirmItem.id;
      setDeleteConfirmItem(null);
      refresh();
      showToast(`Certification "${name}" moved to Recycle Bin.`);
    }
  };

  const handleExportCSV = () => {
    const rows = filteredCertifications.map(n => ({
      'Learner Name': n.learnerName,
      'Learner Type': n.learnerType,
      'Roll / Faculty ID': n.rollNumber || n.facultyId || '—',
      'Department': n.department,
      'Academic Year': n.academicYear || '—',
      'Platform': n.platform,
      'Course Name': n.courseName,
      'Score': n.finalScore || '—',
      'Certificate Type': n.certificateType || 'Completed',
      'Credits': n.academicCredits?.creditsEarned || 0,
      'Workflow Status': n.workflowStatus || 'APPROVED'
    }));
    exportToCSV(rows, `ET_NPTEL_Certifications_${selectedDept}`, currentUser, { moduleKey: 'nptel' });
    showToast(`Exported ${rows.length} certification records to CSV.`);
  };

  const handleExportExcel = () => {
    const rows = filteredCertifications.map(n => ({
      'Learner Name': n.learnerName,
      'Learner Type': n.learnerType,
      'Roll / Faculty ID': n.rollNumber || n.facultyId || '—',
      'Department': n.department,
      'Academic Year': n.academicYear || '—',
      'Platform': n.platform,
      'Course Name': n.courseName,
      'Score': n.finalScore || '—',
      'Certificate Type': n.certificateType || 'Completed',
      'Credits': n.academicCredits?.creditsEarned || 0,
      'Workflow Status': n.workflowStatus || 'APPROVED'
    }));
    exportToExcel(rows, `ET_NPTEL_Certifications_${selectedDept}`, 'Certifications', currentUser, { moduleKey: 'nptel' });
    showToast(`Exported ${rows.length} certification records to Excel.`);
  };

  const handleExportPDF = () => {
    const rows = filteredCertifications.map(n => ({
      'Learner': n.learnerName,
      'Type': n.learnerType,
      'Dept': n.department,
      'Platform': n.platform,
      'Course': n.courseName,
      'Score': `${n.finalScore || '—'}%`,
      'Status': n.workflowStatus || 'APPROVED'
    }));
    exportToPDF('ET_NPTEL_Certifications_Report', ['Learner', 'Type', 'Dept', 'Platform', 'Course', 'Score', 'Status'], rows, 'NPTEL & MOOC Certifications Repository', currentUser, { moduleKey: 'nptel' });
    showToast(`Exported certification records report to PDF.`);
  };

  return (
    <MotionPage style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', position: 'relative' }}>
      {toastMessage && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
      {/* 1. Header & Actions */}
      <ModulePageHeader
        breadcrumbs={[
          { label: 'Dashboard' },
          { label: 'Accreditation & Skills' },
          { label: 'NPTEL & MOOC Certifications' }
        ]}
        title="NPTEL & MOOC Certifications"
        subtitle="Manage verified online certifications for students and faculty across NPTEL, SWAYAM, Coursera, and edX."
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        primaryAction={canCreate ? {
          label: 'Record Certification',
          icon: Plus,
          onClick: () => { setEditingItem(null); setWizardOpen(true); }
        } : null}
      />

      {/* 2. Staggered Animated KPI Summary Cards */}
      <AnimatedKpiGrid minWidth="135px">
        <MotionKpiCard label="Total Certifications" value={stats.total} icon={Award} color="#0F172A" bg="#F8FAFC" />
        <MotionKpiCard label="Student Certifications" value={stats.students} icon={GraduationCap} color="#2563EB" bg="#EFF6FF" />
        <MotionKpiCard label="Faculty Certifications" value={stats.faculty} icon={User} color="#0D9488" bg="#F0FDFA" />
        <MotionKpiCard label="NPTEL / SWAYAM" value={stats.nptel} icon={BookOpen} color="#7C3AED" bg="#F5F3FF" />
        <MotionKpiCard label="Elite Badges" value={stats.elite} icon={Star} color="#0284C7" bg="#F0F9FF" />
        <MotionKpiCard label="Elite + Silver" value={stats.silver} icon={ShieldCheck} color="#475569" bg="#F1F5F9" />
        <MotionKpiCard label="Elite + Gold / Topper" value={stats.gold} icon={Sparkles} color="#D97706" bg="#FEFCE8" />
        <MotionKpiCard label="Pending Review" value={stats.pendingReview} icon={Clock} color="#DC2626" bg="#FEF2F2" />
      </AnimatedKpiGrid>

      {/* 3. Quick Tabs & Multi-Filter Toolbar */}
      <div style={{ background: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Quick Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.65rem' }}>
          {[
            { id: 'ALL', label: 'All Certifications' },
            { id: 'STUDENTS', label: 'Student Learners' },
            { id: 'FACULTY', label: 'Faculty Learners' },
            { id: 'NPTEL', label: 'NPTEL / SWAYAM Only' },
            { id: 'ELITE', label: 'Elite Badges' },
            { id: 'PENDING', label: 'Pending Review' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setQuickTab(tab.id)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: quickTab === tab.id ? '#070F1E' : '#F1F5F9',
                color: quickTab === tab.id ? '#F1C40F' : '#475569',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by learner name, roll no, course name, certificate ID..."
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
              {ET_DEPARTMENTS.map(d => (
                <option key={d.code} value={d.code}>{d.name} ({d.code})</option>
              ))}
            </select>

            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Platforms</option>
              <option value="NPTEL">NPTEL</option>
              <option value="SWAYAM">SWAYAM</option>
              <option value="Coursera">Coursera</option>
              <option value="edX">edX</option>
              <option value="Infosys Springboard">Infosys Springboard</option>
            </select>

            <select
              value={selectedResult}
              onChange={(e) => setSelectedResult(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Results</option>
              <option value="Elite + Gold">Elite + Gold</option>
              <option value="Elite + Silver">Elite + Silver</option>
              <option value="Elite">Elite</option>
              <option value="Successfully Completed">Successfully Completed</option>
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

            {(searchQuery || selectedDept !== 'ALL' || selectedPlatform !== 'ALL' || selectedResult !== 'ALL' || selectedWorkflowStatus !== 'ALL' || fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (currentUser?.role !== 'HOD') setSelectedDept('ALL');
                  setSelectedPlatform('ALL');
                  setSelectedResult('ALL');
                  setSelectedWorkflowStatus('ALL');
                  setFromDate('');
                  setToDate('');
                }}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Date Filter Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '0.45rem', borderTop: '1px dashed #E2E8F0', fontSize: '0.78rem' }}>
          <span style={{ fontWeight: 700, color: '#475569' }}>Exam / Certificate Date:</span>
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

      {/* 4. Certifications Data Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Learner Name</th>
                <th style={{ padding: '0.85rem 1rem' }}>Roll / Employee No</th>
                <th style={{ padding: '0.85rem 1rem' }}>Department</th>
                <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                <th style={{ padding: '0.85rem 1rem' }}>Platform</th>
                <th style={{ padding: '0.85rem 1rem' }}>Course Title</th>
                <th style={{ padding: '0.85rem 1rem' }}>Duration</th>
                <th style={{ padding: '0.85rem 1rem' }}>Score (%)</th>
                <th style={{ padding: '0.85rem 1rem' }}>Grade / Badge</th>
                <th style={{ padding: '0.85rem 1rem' }}>Credits</th>
                <th style={{ padding: '0.85rem 1rem' }}>Certificate</th>
                <th style={{ padding: '0.85rem 1rem' }}>Approval</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCertifications.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    No NPTEL/MOOC certification records found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredCertifications.map((item, idx) => {
                  const wfBadge = getWorkflowBadge(item.workflowStatus);
                  const resBadge = getResultBadge(item.certificationResult);
                  const WfIcon = wfBadge.icon;
                  const isStudent = item.holderType === 'STUDENT';
                  const candidateName = isStudent ? item.studentDetails?.name : item.facultyDetails?.name;
                  const candidateSubtitle = isStudent ? item.studentDetails?.rollNumber : item.facultyDetails?.designation;

                  return (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }} className="hover:bg-slate-50">
                      {/* Learner Name */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.84rem' }}>
                          {candidateName || 'Learner'}
                        </div>
                      </td>

                      {/* Roll / Employee No */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                          {candidateSubtitle || '—'}
                        </div>
                      </td>

                      {/* Department */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>
                          {item.department || '—'}
                        </span>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: isStudent ? '#EFF6FF' : '#F0FDFA',
                          color: isStudent ? '#1D4ED8' : '#0D9488'
                        }}>
                          {isStudent ? <GraduationCap size={12} /> : <User size={12} />}
                          {isStudent ? 'Student' : 'Faculty'}
                        </span>
                      </td>

                      {/* Platform */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B45309' }}>
                          {item.platform || 'NPTEL'}
                        </span>
                      </td>

                      {/* Course Title */}
                      <td style={{ padding: '0.85rem 1rem', maxWidth: '240px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.courseName}>
                          {item.courseName || '—'}
                        </div>
                        {item.offeredBy && (
                          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{item.offeredBy}</div>
                        )}
                      </td>

                      {/* Duration */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
                          {item.duration || '—'}
                        </div>
                        {item.examDate && (
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            Exam: {item.examDate}
                          </div>
                        )}
                      </td>

                      {/* Score (%) */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>
                          {item.scores?.finalScore != null ? `${item.scores.finalScore}%` : '—'}
                        </span>
                      </td>

                      {/* Grade / Badge */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          background: resBadge.bg,
                          color: resBadge.text,
                          border: `1px solid ${resBadge.border}`,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          whiteSpace: 'nowrap'
                        }}>
                          {resBadge.label}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#059669' }}>
                          {item.academicCredits?.creditsEarned || 0} Credits
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        {item.certificateUrl || item.certificateDocument ? (
                          <a
                            href={`/api/portal/documents/serve?id=${encodeURIComponent(item.certificateDocument?.id || item.certificateUrl)}&download=false`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <FileText size={12} /> View Certificate
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic', background: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                            Certificate not uploaded
                          </span>
                        )}
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
                            title="View Certificate Dossier"
                            style={{ padding: '0.35rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
                          >
                            <Eye size={13} />
                          </button>

                          {canReview && (
                            <button
                              type="button"
                              onClick={() => { setReviewModalItem(item); setReviewAction('APPROVE'); }}
                              title="Review / Verify Certification"
                              style={{ padding: '0.35rem 0.55rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: '#059669', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Verify
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

      {/* 5. Certification Wizard Modal */}
      {wizardOpen && (
        <NptelCertificationWizardModal
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
            maxWidth: '800px',
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
                  {dossierModalItem.certificationNumber} • {dossierModalItem.platform}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#FFFFFF', fontFamily: 'Cinzel, serif' }}>
                  {dossierModalItem.courseName}
                </h3>
              </div>
              <button type="button" onClick={() => setDossierModalItem(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Dossier Tabs */}
            <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0.5rem 1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
              {[
                { id: 'overview', label: 'Course & Scores' },
                { id: 'candidate', label: 'Learner Profile' },
                { id: 'credits', label: 'Credits Transfer' },
                { id: 'evidence', label: `Certificate (${dossierModalItem.documents?.length || 0})` }
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
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Certificate ID</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>{dossierModalItem.certificateId || 'Pending'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Final Score & Badge</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#059669' }}>{dossierModalItem.certificationResult} ({dossierModalItem.scores?.finalScore}%)</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Offered By</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.offeredBy}</div>
                    </div>
                  </div>

                  {dossierModalItem.certificateVerificationUrl && (
                    <div style={{ padding: '0.75rem', background: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                      <a href={dossierModalItem.certificateVerificationUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1D4ED8', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700 }}>
                        <ExternalLink size={14} /> Open Official Verification Link
                      </a>
                    </div>
                  )}
                </div>
              )}

              {dossierActiveTab === 'candidate' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: '#F8FAFC', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>Learner Details</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                    {dossierModalItem.holderType === 'STUDENT' ? dossierModalItem.studentDetails?.name : dossierModalItem.facultyDetails?.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    Category: <strong>{dossierModalItem.holderType}</strong> • Department of {dossierModalItem.department}
                  </div>
                </div>
              )}

              {dossierActiveTab === 'credits' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: '#F8FAFC', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>Academic Credit Mapping</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>
                    {dossierModalItem.academicCredits?.creditsEarned || 0} Academic Credits Earned
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    Academic Year: {dossierModalItem.academicYear} • Policy: AICTE / SWAYAM Credit Transfer Regulation
                  </div>
                </div>
              )}

              {dossierActiveTab === 'evidence' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {dossierModalItem.documents?.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>No certificate files attached.</div>
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
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Verify & Approve Certification</h3>
              <div style={{ fontSize: '0.75rem', color: '#D4AF37' }}>{reviewModalItem.courseName}</div>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>DECISION *</label>
                <select value={reviewAction} onChange={(e) => setReviewAction(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}>
                  <option value="APPROVE">Verify & Approve (Accreditation & Credit Transfer)</option>
                  <option value="UNDER_REVIEW">Mark Under Verification</option>
                  <option value="REQUEST_REVISION">Request Revision from Learner</option>
                  <option value="ARCHIVE">Archive Record</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>VERIFICATION REMARKS</label>
                <textarea rows={3} placeholder="Add official verification remarks..." value={reviewRemarks} onChange={(e) => setReviewRemarks(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }} />
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
        title="Move Certification to Recycle Bin?"
        itemName={deleteConfirmItem?.courseName}
        itemType="certification"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmItem(null)}
      />
    </MotionPage>
  );
}
