import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
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
  Award, 
  Trash2, 
  ChevronRight,
  ExternalLink,
  Sparkles,
  Printer,
  Archive,
  RefreshCw,
  X
} from 'lucide-react';
import { ET_DEPARTMENTS } from '../../../data/masterData.js';
import { formatDateDDMMYYYY, isDateInRange } from '../../../lib/ui/dateUtils.js';
import { 
  getStudentAchievements, 
  reviewStudentAchievement, 
  softDeleteStudentAchievement,
  exportToCSV,
  exportToExcel,
  exportToPDF
} from '../../../data/portalStore.js';
import { 
  getWorkflowBadge, 
  StatusBadge 
} from '../../../lib/ui/statusBadges.jsx';
import StudentAchievementWizardModal from './StudentAchievementWizardModal.jsx';
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

export default function StudentAchievementsManager({ currentUser, onDataChange }) {
  const [dataVersion, setDataVersion] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dossierModalItem, setDossierModalItem] = useState(null);
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
  const [selectedDept, setSelectedDept] = useState(currentUser?.role === 'HOD' ? (currentUser.dept || 'ALL') : 'ALL');
  const [selectedAy, setSelectedAy] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedPrize, setSelectedPrize] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Client-Side Pagination for High-Performance Rendering
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const refresh = () => {
    setDataVersion(v => v + 1);
    if (onDataChange) onDataChange();
  };

  // Live Records
  const achievements = useMemo(() => {
    return getStudentAchievements();
  }, [dataVersion]);

  // Filtered Achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        (item.achievementNumber && item.achievementNumber.toLowerCase().includes(q)) ||
        (item.studentName && item.studentName.toLowerCase().includes(q)) ||
        (item.rollNumber && item.rollNumber.toLowerCase().includes(q)) ||
        (item.eventName && item.eventName.toLowerCase().includes(q)) ||
        (item.awardTitle && item.awardTitle.toLowerCase().includes(q)) ||
        (item.organizingInstitute && item.organizingInstitute.toLowerCase().includes(q));

      const itemDept = item.department || item.branch || '';
      const matchDept = selectedDept === 'ALL' || itemDept === selectedDept;
      const matchAy = selectedAy === 'ALL' || item.academicYear === selectedAy;
      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory || item.achievementType === selectedCategory;
      const matchLevel = selectedLevel === 'ALL' || item.level === selectedLevel;
      const matchPrize = selectedPrize === 'ALL' ||
        (selectedPrize === 'YES' && (item.hasPrize === 'Yes' || item.prize === 'Yes' || !!item.awardTitle)) ||
        (selectedPrize === 'NO' && item.hasPrize !== 'Yes' && item.prize !== 'Yes' && !item.awardTitle);
      
      const itemStatus = item.workflowStatus || (item.status === 'Approved' ? 'APPROVED' : 'DRAFT');
      const matchStatus = selectedStatus === 'ALL' || itemStatus === selectedStatus;
      const matchDate = isDateInRange(item.eventDate || item.date, fromDate, toDate);

      return matchSearch && matchDept && matchAy && matchCategory && matchLevel && matchPrize && matchStatus && matchDate;
    });
  }, [achievements, searchQuery, selectedDept, selectedAy, selectedCategory, selectedLevel, selectedPrize, selectedStatus, fromDate, toDate]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept, selectedAy, selectedCategory, selectedLevel, selectedPrize, selectedStatus, fromDate, toDate, pageSize]);

  const totalPages = pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(filteredAchievements.length / Number(pageSize)));
  const paginatedAchievements = useMemo(() => {
    if (pageSize === 'ALL') return filteredAchievements;
    const numSize = Number(pageSize);
    const start = (currentPage - 1) * numSize;
    return filteredAchievements.slice(start, start + numSize);
  }, [filteredAchievements, currentPage, pageSize]);

  // KPIs
  const stats = useMemo(() => {
    const total = filteredAchievements.length;
    const academic = filteredAchievements.filter(a => a.category === 'Academic' || a.achievementType === 'Academic').length;
    const sports = filteredAchievements.filter(a => a.category === 'Sports' || a.achievementType === 'Sports').length;
    const uniqueStudents = new Set(filteredAchievements.map(a => (a.rollNumber || '').trim().toUpperCase())).size;
    const prizeWinners = filteredAchievements.filter(a => !!a.awardTitle || a.hasPrize === 'Yes' || a.prize === 'Yes').length;
    const thisYear = filteredAchievements.filter(a => a.academicYear === '2026-27' || a.academicYear === '2025-26' || a.academicYear === '2024-25').length;
    return { total, academic, sports, uniqueStudents, prizeWinners, thisYear };
  }, [filteredAchievements]);

  // Permissions
  const canCreate = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOD' || currentUser?.role === 'FACULTY' || currentUser?.role === 'DATA_ENTRY';
  const canReview = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOD';

  // Handle Review Execution
  const handleReviewSubmit = () => {
    if (!reviewModalItem) return;
    reviewStudentAchievement(reviewModalItem.id, reviewAction, reviewRemarks, currentUser);
    setReviewModalItem(null);
    setReviewRemarks('');
    refresh();
    showToast(`Achievement status updated to ${reviewAction}.`);
  };

  // Handle Delete
  const handleDelete = (item) => {
    setDeleteConfirmItem(item);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmItem) {
      softDeleteStudentAchievement(deleteConfirmItem.id, currentUser);
      setDeleteConfirmItem(null);
      refresh();
      showToast(`Achievement for "${deleteConfirmItem.studentName}" moved to Recycle Bin.`);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(filteredAchievements, 'student_achievements');
    showToast('Exported filtered student achievements to CSV.');
  };

  const handleExportPDF = () => {
    exportToPDF(filteredAchievements, 'student_achievements');
    showToast('Exported filtered student achievements to PDF.');
  };

  return (
    <MotionPage className="student-achievements-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header with Breadcrumbs */}
      <ModulePageHeader
        title="Student Achievements & Awards"
        subtitle="Departmental and institutional registry of student co-curricular, academic, and sports accomplishments."
        breadcrumbs={[
          { label: 'Portal', onClick: () => {} },
          { label: 'Student Portfolio', onClick: () => {} },
          { label: 'Achievements' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Download size={14} /> CSV
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Printer size={14} /> PDF
            </button>
          </div>
        }
        primaryAction={canCreate ? {
          label: 'Register Achievement',
          icon: Plus,
          onClick: () => { setEditingItem(null); setWizardOpen(true); }
        } : null}
      />

      {/* 2. KPI Summary Cards */}
      <AnimatedKpiGrid minWidth="150px">
        <MotionKpiCard label="Total Achievements" value={stats.total} icon={Trophy} color="#D97706" bg="#FEFCE8" />
        <MotionKpiCard label="Academic" value={stats.academic} icon={Award} color="#2563EB" bg="#EFF6FF" />
        <MotionKpiCard label="Sports" value={stats.sports} icon={Sparkles} color="#059669" bg="#ECFDF5" />
        <MotionKpiCard label="Students Represented" value={stats.uniqueStudents} icon={Building2} color="#7C3AED" bg="#F5F3FF" />
        <MotionKpiCard label="Awards & Prizes" value={stats.prizeWinners} icon={CheckCircle2} color="#DB2777" bg="#FDF2F8" />
        <MotionKpiCard label="This AY" value={stats.thisYear} icon={Clock} color="#475569" bg="#F8FAFC" />
      </AnimatedKpiGrid>

      {/* 3. Filter Bar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '0.9rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by Roll No, Student Name, Achievement Title, Organizer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8rem',
                outline: 'none',
                color: '#0F172A',
                background: '#FFFFFF',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Department */}
            <select
              value={selectedDept}
              disabled={currentUser?.role === 'HOD'}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All</option>
              <option value="CYS">Cyber Security</option>
              <option value="DS">Data Science</option>
              <option value="AI">Artificial Intelligence</option>
              <option value="AIML">AI & ML</option>
            </select>

            {/* Academic Year */}
            <select
              value={selectedAy}
              onChange={(e) => setSelectedAy(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All AYs</option>
              <option value="2026-27">2026-27</option>
              <option value="2025-26">2025-26</option>
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
            </select>

            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Categories</option>
              <option value="Academic">Academic</option>
              <option value="Sports">Sports</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Coding Competition">Coding Competition</option>
              <option value="Paper Presentation">Paper Presentation</option>
              <option value="Cultural">Cultural</option>
              <option value="NCC">NCC</option>
              <option value="Innovation">Innovation</option>
            </select>

            {/* Level */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Levels</option>
              <option value="International">International</option>
              <option value="National">National</option>
              <option value="State">State</option>
              <option value="University">University</option>
              <option value="Institution">Institution</option>
            </select>

            {/* Prize */}
            <select
              value={selectedPrize}
              onChange={(e) => setSelectedPrize(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">Award/Prize: All</option>
              <option value="YES">Prize Winners Only</option>
              <option value="NO">Participation Only</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="VERIFIED">Verified</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="NEEDS_REVISION">Needs Revision</option>
              <option value="DRAFT">Draft</option>
            </select>

            {/* From Date */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              From:
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', outline: 'none' }}
              />
            </label>

            {/* To Date */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              To:
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', outline: 'none' }}
              />
            </label>

            {(searchQuery || selectedDept !== 'ALL' || selectedAy !== 'ALL' || selectedCategory !== 'ALL' || selectedLevel !== 'ALL' || selectedStatus !== 'ALL' || fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (currentUser?.role !== 'HOD') setSelectedDept('ALL');
                  setSelectedAy('ALL');
                  setSelectedCategory('ALL');
                  setSelectedLevel('ALL');
                  setSelectedPrize('ALL');
                  setSelectedStatus('ALL');
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
      </div>

      {/* 4. Data Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Roll No & Student</th>
                <th style={{ padding: '0.85rem 1rem' }}>Department & AY</th>
                <th style={{ padding: '0.85rem 1rem' }}>Achievement & Event</th>
                <th style={{ padding: '0.85rem 1rem' }}>Category & Level</th>
                <th style={{ padding: '0.85rem 1rem' }}>Prize / Award</th>
                <th style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAchievements.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    No student achievement records found matching current criteria.
                  </td>
                </tr>
              ) : (
                paginatedAchievements.map((item, idx) => {
                  const statusKey = item.workflowStatus || (item.status === 'Approved' ? 'APPROVED' : 'DRAFT');
                  const badge = getWorkflowBadge(statusKey);
                  const BadgeIcon = badge.icon;

                  return (
                    <tr
                      key={item.id || idx}
                      style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                      className="hover:bg-slate-50"
                    >
                      {/* Roll No & Student */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.82rem' }}>
                          {item.rollNumber || 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          {item.studentName}
                        </div>
                      </td>

                      {/* Department & AY */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>
                          {item.department || item.departmentCode || item.branch || '—'}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          {item.academicYear || '—'} {item.year ? `• ${item.year}` : ''}
                        </div>
                      </td>

                      {/* Achievement & Event */}
                      <td style={{ padding: '0.85rem 1rem', maxWidth: '280px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {item.title || item.eventName || '—'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {item.organizingInstitute || item.organizer || item.eventDetails || '—'}
                        </div>
                      </td>

                      {/* Category & Level */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369A1', background: '#E0F2FE', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          {item.category || item.achievementType || 'Academic'}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.2rem' }}>
                          {item.level ? `${item.level} Level` : '—'}
                        </div>
                      </td>

                      {/* Prize / Award */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {(item.awardTitle || item.hasPrize === 'Yes' || item.prize === 'Yes') ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 800, color: '#B45309', fontSize: '0.76rem' }}>
                              {item.awardTitle || item.prizePosition || item.position || 'Award Winner'}
                            </span>
                            {item.prizeAmount ? (
                              <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>
                                ₹{Number(item.prizeAmount).toLocaleString('en-IN')}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Participation</span>
                        )}
                      </td>

                      {/* Event Date */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.78rem', color: '#0F172A', fontWeight: 700 }}>
                          {formatDateDDMMYYYY(item.endDate || item.eventDate || item.date) || '—'}
                        </div>
                        {item.startDate && item.endDate && item.startDate !== item.endDate && (
                          <div
                            style={{ fontSize: '0.67rem', color: '#64748B', marginTop: '1px' }}
                            title={`Event Duration: ${formatDateDDMMYYYY(item.startDate)} to ${formatDateDDMMYYYY(item.endDate)}`}
                          >
                            From {formatDateDDMMYYYY(item.startDate)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          background: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                          fontSize: '0.68rem',
                          fontWeight: 800
                        }}>
                          {BadgeIcon && <BadgeIcon size={10} />}
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => setDossierModalItem(item)}
                            title="Inspect Achievement Details"
                            style={{ padding: '0.35rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
                          >
                            <Eye size={13} />
                          </button>
                          {canReview && (
                            <button
                              type="button"
                              onClick={() => { setReviewModalItem(item); setReviewAction(item.workflowStatus === 'APPROVED' ? 'REJECT' : 'APPROVE'); }}
                              title="Review / Approve"
                              style={{ padding: '0.35rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', color: '#1D4ED8', cursor: 'pointer' }}
                            >
                              <ShieldCheck size={13} />
                            </button>
                          )}
                          {canCreate && (
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
                {filteredAchievements.length === 0 ? 0 : (currentPage - 1) * (pageSize === 'ALL' ? filteredAchievements.length : Number(pageSize)) + 1}
              </strong>{' '}
              to{' '}
              <strong style={{ color: '#0F172A' }}>
                {pageSize === 'ALL' ? filteredAchievements.length : Math.min(currentPage * Number(pageSize), filteredAchievements.length)}
              </strong>{' '}
              of <strong style={{ color: '#0F172A' }}>{filteredAchievements.length.toLocaleString('en-IN')}</strong> records
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
                <option value="ALL">All ({filteredAchievements.length})</option>
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

      {/* 5. Guided Wizard Modal */}
      {wizardOpen && (
        <StudentAchievementWizardModal
          isOpen={wizardOpen}
          onClose={() => { setWizardOpen(false); setEditingItem(null); }}
          initialData={editingItem}
          currentUser={currentUser}
          onSaved={() => { refresh(); }}
        />
      )}

      {/* 6. Comprehensive Dossier Inspection Modal */}
      {dossierModalItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 15, 30, 0.8)',
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
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
            border: '1px solid #D4AF37'
          }}>
            <div style={{ background: 'linear-gradient(135deg, #070F1E 0%, #0B192C 100%)', padding: '1.25rem 1.5rem', color: '#FFFFFF', borderBottom: '2px solid #D4AF37', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase' }}>
                  {dossierModalItem.achievementNumber || dossierModalItem.id}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#FFFFFF' }}>
                  {dossierModalItem.title || dossierModalItem.eventName}
                </h3>
              </div>
              <button type="button" onClick={() => setDossierModalItem(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Student Name & Roll No</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.studentName}</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B' }}>{dossierModalItem.rollNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Department & Year</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.department || dossierModalItem.branch}</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B' }}>{dossierModalItem.academicYear}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Organizing Entity</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.organizedBy}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Achievement Date</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                    {formatDateDDMMYYYY(dossierModalItem.endDate || dossierModalItem.eventDate || dossierModalItem.achievementDate)}
                    {dossierModalItem.startDate && dossierModalItem.endDate && dossierModalItem.startDate !== dossierModalItem.endDate && (
                      <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 500, marginLeft: '0.4rem' }}>
                        ({formatDateDDMMYYYY(dossierModalItem.startDate)} to {formatDateDDMMYYYY(dossierModalItem.endDate)})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Evidence Documents */}
              <div>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  ATTACHED EVIDENCE ({dossierModalItem.documents?.length || (dossierModalItem.certificate ? 1 : 0)})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {dossierModalItem.certificate && (
                    <div style={{ padding: '0.55rem 0.85rem', background: '#F1F5F9', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{dossierModalItem.certificate}</span>
                      <span style={{ color: '#10B981', fontWeight: 700 }}>Official Certificate</span>
                    </div>
                  )}
                  {dossierModalItem.proof && (
                    <div style={{ padding: '0.55rem 0.85rem', background: '#F1F5F9', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{dossierModalItem.proof}</span>
                      <span style={{ color: '#3B82F6', fontWeight: 700 }}>Supporting Proof</span>
                    </div>
                  )}
                  {dossierModalItem.documents?.map(doc => (
                    <div key={doc.id} style={{ padding: '0.55rem 0.85rem', background: '#F1F5F9', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{doc.name}</span>
                      <span style={{ color: '#0284C7', fontWeight: 700 }}>{doc.category} ({doc.size})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review History */}
              {dossierModalItem.reviewHistory?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    VERIFICATION HISTORY
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {dossierModalItem.reviewHistory.map((h, i) => (
                      <div key={i} style={{ padding: '0.5rem 0.75rem', background: '#F8FAFC', borderRadius: '6px', borderLeft: '3px solid #10B981', fontSize: '0.75rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{h.action} by {h.reviewerName} ({h.reviewerRole})</div>
                        <div style={{ color: '#64748B' }}>{h.remarks || 'No comments'} • {new Date(h.timestamp).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => setDossierModalItem(null)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Verification & Approval Modal */}
      {reviewModalItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 15, 30, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
            overflow: 'hidden',
            border: '1px solid #D4AF37'
          }}>
            <div style={{ background: '#070F1E', padding: '1rem 1.25rem', color: '#FFFFFF', borderBottom: '2px solid #D4AF37' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Verify & Review Achievement Record
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#D4AF37' }}>
                {reviewModalItem.studentName} ({reviewModalItem.rollNumber})
              </div>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                  REVIEW ACTION *
                </label>
                <select
                  value={reviewAction}
                  onChange={(e) => setReviewAction(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
                >
                  <option value="APPROVE">Approve Achievement</option>
                  <option value="VERIFY">Mark Verified (Internal Audit Ready)</option>
                  <option value="REQUEST_REVISION">Request Revision from Submitter</option>
                  <option value="PUBLISH">Approve & Publish to College Website</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                  REVIEW REMARKS / FEEDBACK
                </label>
                <textarea
                  rows={3}
                  placeholder="Add verification notes, certificate audit confirmation..."
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.25rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setReviewModalItem(null)}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                style={{ padding: '0.45rem 1.15rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        isOpen={Boolean(deleteConfirmItem)}
        title="Move Achievement to Recycle Bin?"
        itemName={deleteConfirmItem?.awardTitle || deleteConfirmItem?.eventName}
        itemType="achievement record"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmItem(null)}
      />
    </MotionPage>
  );
}
