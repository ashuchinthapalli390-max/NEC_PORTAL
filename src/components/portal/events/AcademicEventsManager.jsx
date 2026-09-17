import React, { useState, useMemo, useEffect } from 'react';
import { 
  Megaphone, 
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
  Award, 
  Trophy, 
  Code, 
  Video, 
  Layers, 
  Star, 
  Image as ImageIcon,
  Check,
  X,
  UploadCloud
} from 'lucide-react';
import { ET_DEPARTMENTS, normalizeDepartment } from '../../../data/masterData.js';
import { formatDateDDMMYYYY, isDateInRange } from '../../../lib/ui/dateUtils.js';
import { 
  getAcademicEvents, 
  reviewAcademicEvent, 
  updateAcademicEventStatus, 
  saveAcademicEventWinners, 
  softDeleteAcademicEvent,
  exportToCSV,
  exportToExcel,
  exportToPDF,
  setPrimaryCover,
  approveMediaPublic,
  changeMediaRole,
  removeMediaLink
} from '../../../data/portalStore.js';
import AcademicEventWizardModal from './AcademicEventWizardModal.jsx';
import AcademicEventBulkImportModal from './AcademicEventBulkImportModal.jsx';
import { downloadBulkImportTemplate } from '../../../lib/events/bulkImportEngine.js';
import ConfirmDeleteDialog from '../common/ConfirmDeleteDialog.jsx';
import { NECImage, NECVideo, MediaLightboxModal } from '../../media/index.js';
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

const EVENT_TYPE_TABS = [
  { id: 'ALL', label: 'All Events' },
  { id: 'Workshop', label: 'Workshops', icon: Layers },
  { id: 'Seminar', label: 'Seminars', icon: Megaphone },
  { id: 'Guest Lecture', label: 'Guest Lectures', icon: Users },
  { id: 'Hackathon', label: 'Hackathons', icon: Trophy },
  { id: 'Code-a-thon', label: 'Code-a-thons', icon: Code },
  { id: 'Conference', label: 'Conferences', icon: Award },
  { id: 'Bootcamp', label: 'Bootcamps', icon: Sparkles },
  { id: 'Technical Talk', label: 'Technical Talks', icon: Video }
];

export const ALL_ET_DEPT_CODES = ['AI', 'AIML', 'CYS', 'DS'];

export const DEPT_METADATA = {
  'AI': { code: 'AI', name: 'Artificial Intelligence', label: 'Artificial Intelligence' },
  'AIML': { code: 'AIML', name: 'AI & ML', label: 'AI & ML' },
  'CYS': { code: 'CYS', name: 'Cyber Security', label: 'Cyber Security' },
  'DS': { code: 'DS', name: 'Data Science', label: 'Data Science' }
};

export function parseAndExpandDepartments(deptInput, isInstitutionWide = false) {
  if (isInstitutionWide) {
    return [...ALL_ET_DEPT_CODES];
  }
  if (!deptInput) return ['CYS'];

  if (Array.isArray(deptInput)) {
    let res = [];
    deptInput.forEach(d => {
      res = res.concat(parseAndExpandDepartments(d));
    });
    return [...new Set(res)];
  }

  const str = String(deptInput).trim();
  const lower = str.toLowerCase();

  if (
    lower === 'all' || 
    lower === 'all et' || 
    lower === 'allet' || 
    lower === 'all departments' || 
    lower.includes('all et') || 
    lower === 'multiple' ||
    lower === 'multiple departments' ||
    lower === 'all-et'
  ) {
    return [...ALL_ET_DEPT_CODES];
  }

  const parts = str.split(/[,+/|]/).map(p => p.trim()).filter(Boolean);
  const resolved = [];

  for (const part of parts) {
    const pLower = part.toLowerCase();
    if (pLower.includes('cyber') || pLower === 'cys' || (pLower.includes('cs') && !pLower.includes('ds') && !pLower.includes('ai'))) {
      resolved.push('CYS');
    } else if (pLower.includes('data') || pLower === 'ds') {
      resolved.push('DS');
    } else if (pLower.includes('ml') || pLower.includes('machine') || pLower === 'aiml') {
      resolved.push('AIML');
    } else if (pLower.includes('ai') || pLower.includes('artificial') || pLower === 'ai') {
      resolved.push('AI');
    } else {
      const norm = normalizeDepartment(part);
      if (norm && norm.code && ALL_ET_DEPT_CODES.includes(norm.code)) {
        resolved.push(norm.code);
      }
    }
  }

  return resolved.length > 0 ? [...new Set(resolved)] : ['CYS'];
}

export function parseAndExpandSections(sectionInput) {
  if (!sectionInput) return ['A'];

  if (Array.isArray(sectionInput)) {
    const flat = sectionInput.flatMap(s => parseAndExpandSections(s));
    return flat.length > 0 ? [...new Set(flat)] : ['A'];
  }

  const str = String(sectionInput).trim();
  const lower = str.toLowerCase();

  if (lower === 'all' || lower === 'all sections' || lower === 'all-sections') {
    return ['A', 'B', 'C', 'D'];
  }

  const parts = str.split(/[,+/|]/).map(p => p.trim().toUpperCase()).filter(Boolean);
  const validSections = parts.filter(p => ['A', 'B', 'C', 'D', 'E'].includes(p) || p.startsWith('SEC'));

  return validSections.length > 0 ? [...new Set(validSections)] : (parts.length > 0 ? parts : ['A']);
}

export default function AcademicEventsManager({ currentUser, onDataChange, initialTypeFilter = 'ALL', onOpenBulkDataCenter }) {
  const [dataVersion, setDataVersion] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dossierModalItem, setDossierModalItem] = useState(null);
  const [dossierActiveTab, setDossierActiveTab] = useState('overview');
  const [reviewModalItem, setReviewModalItem] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [winnersModalItem, setWinnersModalItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Media Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItems, setLightboxItems] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (items, index = 0) => {
    setLightboxItems(items);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeTab, setSelectedTypeTab] = useState(initialTypeFilter);
  const [selectedDept, setSelectedDept] = useState(currentUser?.role === 'HOD' && currentUser?.dept ? currentUser.dept : 'ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedAy, setSelectedAy] = useState('ALL');
  const [selectedEventStatus, setSelectedEventStatus] = useState('ALL');
  const [selectedWorkflowStatus, setSelectedWorkflowStatus] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    setSelectedTypeTab(initialTypeFilter);
  }, [initialTypeFilter]);

  const refresh = () => {
    setDataVersion(v => v + 1);
    if (onDataChange) onDataChange();
  };

  // Live Records
  const events = useMemo(() => {
    return getAcademicEvents();
  }, [dataVersion]);

  // Projected 1-to-1 Department & Section Offerings
  const expandedOfferings = useMemo(() => {
    const list = [];
    events.forEach(item => {
      const depts = parseAndExpandDepartments(item.department || item.departmentCodes || item.targetDepartment, item.isInstitutionWide);
      const rawSecs = item.section || item.sections || item.targetSections || item.sectionBreakdown;
      const sections = parseAndExpandSections(rawSecs);

      depts.forEach(dept => {
        sections.forEach(sec => {
          list.push({
            ...item,
            offeringId: `${item.id}_${dept}_${sec}`,
            parentEventId: item.id,
            department: dept,
            departmentCode: dept,
            departmentName: DEPT_METADATA[dept]?.name || dept,
            section: sec,
            sectionLabel: `Section ${sec}`,
            isExpanded: depts.length > 1 || sections.length > 1,
            totalSiblings: depts.length * sections.length
          });
        });
      });
    });
    return list;
  }, [events]);

  // KPIs
  const stats = useMemo(() => {
    const totalEvents = events.length;
    const totalOfferings = expandedOfferings.length;
    const upcoming = events.filter(e => e.eventStatus === 'PLANNED' || e.eventStatus === 'REGISTRATION_OPEN').length;
    const ongoing = events.filter(e => e.eventStatus === 'ONGOING').length;
    const completed = events.filter(e => e.eventStatus === 'COMPLETED').length;
    const pendingReview = events.filter(e => e.workflowStatus === 'SUBMITTED' || e.workflowStatus === 'UNDER_REVIEW').length;
    const thisYear = events.filter(e => e.academicYear === '2026-27' || e.academicYear === '2025-26' || e.academicYear === '2024-25').length;
    return { totalEvents, totalOfferings, total: totalEvents, upcoming, ongoing, completed, pendingReview, thisYear };
  }, [events, expandedOfferings]);

  // Filtered Projected Offerings
  const filteredOfferings = useMemo(() => {
    return expandedOfferings.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        (item.eventNumber && item.eventNumber.toLowerCase().includes(q)) ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.speakers && item.speakers.some(s => s.name && s.name.toLowerCase().includes(q))) ||
        (item.coordinators && item.coordinators.some(c => c.name && c.name.toLowerCase().includes(q))) ||
        (item.departmentName && item.departmentName.toLowerCase().includes(q));

      // Direct 1-to-1 match for Department & Section
      const matchDept = selectedDept === 'ALL' || item.department === selectedDept;
      const matchSection = selectedSection === 'ALL' || item.section === selectedSection;

      const matchAy = selectedAy === 'ALL' || item.academicYear === selectedAy;

      const itemTypeNorm = String(item.eventType || item.type || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const tabTypeNorm = String(selectedTypeTab || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchType = selectedTypeTab === 'ALL' || itemTypeNorm === tabTypeNorm ||
        (tabTypeNorm === 'codeathon' && itemTypeNorm.includes('code')) ||
        (tabTypeNorm === 'hackathon' && itemTypeNorm.includes('hack')) ||
        (tabTypeNorm === 'workshop' && itemTypeNorm.includes('workshop')) ||
        (tabTypeNorm === 'seminar' && itemTypeNorm.includes('seminar'));

      const matchStatus = selectedEventStatus === 'ALL' || item.eventStatus === selectedEventStatus;
      const matchWorkflow = selectedWorkflowStatus === 'ALL' || item.workflowStatus === selectedWorkflowStatus;
      const matchMode = selectedMode === 'ALL' || item.mode === selectedMode;
      const matchLevel = selectedLevel === 'ALL' || item.level === selectedLevel;
      const matchDate = isDateInRange(item.startDate || item.eventDate || item.date, fromDate, toDate);

      return matchSearch && matchDept && matchSection && matchAy && matchType && matchStatus && matchWorkflow && matchMode && matchLevel && matchDate;
    });
  }, [expandedOfferings, searchQuery, selectedDept, selectedSection, selectedAy, selectedTypeTab, selectedEventStatus, selectedWorkflowStatus, selectedMode, selectedLevel, fromDate, toDate]);

  // Permissions
  const canCreate = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'HOD' || currentUser?.role === 'FACULTY';
  const canBulkImport = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'HOD';
  const canReview = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'HOD';

  const handleExecuteReview = () => {
    if (!reviewModalItem) return;
    reviewAcademicEvent(reviewModalItem.id, reviewAction, reviewRemarks, currentUser);
    const title = reviewModalItem.title || reviewModalItem.name;
    setReviewModalItem(null);
    setReviewRemarks('');
    refresh();
    showToast(`Event decision submitted for "${title}".`);
  };

  const handleDelete = (item) => {
    setDeleteConfirmItem(item);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmItem) {
      softDeleteAcademicEvent(deleteConfirmItem.id, currentUser);
      const title = deleteConfirmItem.title || deleteConfirmItem.name;
      setDeleteConfirmItem(null);
      refresh();
      showToast(`Event "${title}" moved to Recycle Bin.`);
    }
  };

  const getWorkflowBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', icon: CheckCircle2, label: 'APPROVED' };
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: Clock, label: 'UNDER REVIEW' };
      case 'NEEDS_REVISION':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: AlertTriangle, label: 'REVISION REQ.' };
      case 'ARCHIVED':
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', icon: Clock, label: 'ARCHIVED' };
      case 'DRAFT':
      default:
        return { bg: '#FEFCE8', text: '#A16207', border: '#FEF08A', icon: Edit3, label: 'DRAFT' };
    }
  };

  const getEventLifecycleBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return { bg: '#ECFDF5', text: '#047857', label: 'COMPLETED' };
      case 'ONGOING':
        return { bg: '#FEF08A', text: '#854D0E', label: 'ONGOING' };
      case 'REGISTRATION_OPEN':
        return { bg: '#EFF6FF', text: '#1E40AF', label: 'REG. OPEN' };
      case 'POSTPONED':
        return { bg: '#FFF7ED', text: '#C2410C', label: 'POSTPONED' };
      case 'CANCELLED':
        return { bg: '#FEF2F2', text: '#DC2626', label: 'CANCELLED' };
      case 'PLANNED':
      default:
        return { bg: '#F1F5F9', text: '#334155', label: 'PLANNED' };
    }
  };

  const handleExportCSV = () => {
    const rows = filteredOfferings.map(item => ({
      'Event Number': item.eventNumber || item.id || '—',
      'Event Title': item.title || item.name || '—',
      'Event Type': item.eventType || item.type || 'Workshop',
      'Department': item.departmentName,
      'Department Code': item.department,
      'Section': item.section,
      'Academic Year': item.academicYear || '—',
      'Start Date': formatDateDDMMYYYY(item.startDate || item.date),
      'End Date': formatDateDDMMYYYY(item.endDate),
      'Mode': item.mode || 'Offline',
      'Venue': item.venue || '—',
      'Coordinator': item.coordinators?.[0]?.name || item.coordinator || '—',
      'Key Speaker / Expert': item.resourcePersons?.[0]?.name || item.speakers?.[0]?.name || '—',
      'Attendees': item.actualParticipants || item.expectedParticipants || 0,
      'Status': item.eventStatus || 'COMPLETED',
      'Approval': item.workflowStatus || 'APPROVED'
    }));
    exportToCSV(rows, `ET_Academic_Events_${selectedDept}_${selectedSection}`, currentUser);
    showToast(`Exported ${rows.length} expanded offering rows to CSV.`);
  };

  const handleExportExcel = () => {
    const rows = filteredOfferings.map(item => ({
      'Event Number': item.eventNumber || item.id || '—',
      'Event Title': item.title || item.name || '—',
      'Event Type': item.eventType || item.type || 'Workshop',
      'Department': item.departmentName,
      'Department Code': item.department,
      'Section': item.section,
      'Academic Year': item.academicYear || '—',
      'Start Date': formatDateDDMMYYYY(item.startDate || item.date),
      'End Date': formatDateDDMMYYYY(item.endDate),
      'Mode': item.mode || 'Offline',
      'Venue': item.venue || '—',
      'Coordinator': item.coordinators?.[0]?.name || item.coordinator || '—',
      'Key Speaker / Expert': item.resourcePersons?.[0]?.name || item.speakers?.[0]?.name || '—',
      'Attendees': item.actualParticipants || item.expectedParticipants || 0,
      'Status': item.eventStatus || 'COMPLETED',
      'Approval': item.workflowStatus || 'APPROVED'
    }));
    exportToExcel(rows, `ET_Academic_Events_${selectedDept}_${selectedSection}`, 'Academic Events', currentUser);
    showToast(`Exported ${rows.length} expanded offering rows to Excel.`);
  };

  const handleExportPDF = () => {
    const rows = filteredOfferings.map(item => [
      item.eventNumber || item.id || '—',
      item.title || item.name || '—',
      item.eventType || 'Workshop',
      item.departmentName,
      `Sec ${item.section}`,
      formatDateDDMMYYYY(item.startDate),
      item.eventStatus || 'COMPLETED'
    ]);
    exportToPDF('ET Academic Events & Workshops Report', ['Event No.', 'Title', 'Type', 'Department', 'Section', 'Date', 'Status'], rows, `ET_Events_${selectedDept}_${selectedSection}`);
    showToast(`Exported ${rows.length} expanded offering rows to PDF.`);
  };

  return (
    <MotionPage style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', position: 'relative' }}>
      {toastMessage && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
      {/* 1. Header & Quick Actions */}
      <ModulePageHeader
        breadcrumbs={[
          { label: 'Dashboard' },
          { label: 'Events & Outreach' },
          { label: 'Academic Events' }
        ]}
        title="Academic Events & Workshops"
        subtitle="Manage workshops, seminars, guest lectures, hackathons, code-a-thons and institutional events."
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        customActions={
          <>
            <button
              type="button"
              onClick={downloadBulkImportTemplate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.48rem 0.85rem',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#15803D',
                cursor: 'pointer'
              }}
            >
              <Download size={14} /> Template
            </button>
            {canBulkImport && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenBulkDataCenter) {
                    onOpenBulkDataCenter();
                  } else {
                    setBulkImportModalOpen(true);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.48rem 0.95rem',
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                  color: '#F1C40F',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <UploadCloud size={14} /> Smart Import
              </button>
            )}
          </>
        }
        primaryAction={canCreate ? {
          label: 'Create Event',
          icon: Plus,
          onClick: () => { setEditingItem(null); setWizardOpen(true); }
        } : null}
      />

      {/* 2. Staggered Animated KPI Summary Cards */}
      <AnimatedKpiGrid minWidth="150px">
        <MotionKpiCard label="Unique Master Events" value={stats.totalEvents} icon={Megaphone} color="#0F172A" bg="#F8FAFC" />
        <MotionKpiCard label="Dept & Sec Offerings" value={stats.totalOfferings} icon={Layers} color="#2563EB" bg="#EFF6FF" />
        <MotionKpiCard label="Upcoming" value={stats.upcoming} icon={Calendar} color="#0D9488" bg="#F0FDFA" />
        <MotionKpiCard label="Ongoing Now" value={stats.ongoing} icon={Clock} color="#D97706" bg="#FEFCE8" />
        <MotionKpiCard label="Completed" value={stats.completed} icon={CheckCircle2} color="#059669" bg="#ECFDF5" />
        <MotionKpiCard label="Pending Review" value={stats.pendingReview} icon={Sparkles} color="#9333EA" bg="#FDF4FF" />
      </AnimatedKpiGrid>

      {/* 3. Event Type Horizontal Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
        {EVENT_TYPE_TABS.map((tab) => {
          const isSelected = selectedTypeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTypeTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '9999px',
                border: isSelected ? '1px solid #D4AF37' : '1px solid #E2E8F0',
                background: isSelected ? '#070F1E' : '#FFFFFF',
                color: isSelected ? '#F1C40F' : '#475569',
                fontSize: '0.76rem',
                fontWeight: isSelected ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {Icon && <Icon size={13} />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. Search & Multi-Filter Toolbar */}
      <div style={{ background: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by event number, title, speaker, coordinator, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', outline: 'none', color: '#0F172A', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Department Filter (1-to-1 canonical) */}
            <select
              value={selectedDept}
              disabled={currentUser?.role === 'HOD'}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All ET Departments</option>
              <option value="CYS">Cyber Security</option>
              <option value="DS">Data Science</option>
              <option value="AI">Artificial Intelligence</option>
              <option value="AIML">AI & ML</option>
            </select>

            {/* Section Filter (1-to-1 canonical) */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>

            <select
              value={selectedAy}
              onChange={(e) => setSelectedAy(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All AYs</option>
              <option value="2026-27">2026-27</option>
              <option value="2025-26">2025-26</option>
              <option value="2024-25">2024-25</option>
            </select>

            <select
              value={selectedEventStatus}
              onChange={(e) => setSelectedEventStatus(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">Event Status: All</option>
              <option value="PLANNED">Planned</option>
              <option value="REGISTRATION_OPEN">Registration Open</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="POSTPONED">Postponed</option>
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

            {(searchQuery || selectedTypeTab !== 'ALL' || selectedDept !== 'ALL' || selectedSection !== 'ALL' || selectedAy !== 'ALL' || selectedEventStatus !== 'ALL' || selectedWorkflowStatus !== 'ALL' || fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTypeTab('ALL');
                  if (currentUser?.role !== 'HOD') setSelectedDept('ALL');
                  setSelectedSection('ALL');
                  setSelectedAy('ALL');
                  setSelectedEventStatus('ALL');
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
      </div>

      {/* 5. Events Data Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Event No. & Title</th>
                <th style={{ padding: '0.85rem 1rem' }}>Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Department</th>
                <th style={{ padding: '0.85rem 1rem' }}>Section</th>
                <th style={{ padding: '0.85rem 1rem' }}>Dates & Mode</th>
                <th style={{ padding: '0.85rem 1rem' }}>Coordinator(s)</th>
                <th style={{ padding: '0.85rem 1rem' }}>Key Speaker / Expert</th>
                <th style={{ padding: '0.85rem 1rem' }}>Attendees</th>
                <th style={{ padding: '0.85rem 1rem' }}>Event Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Approval</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOfferings.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    No academic event offerings recorded matching current filters.
                  </td>
                </tr>
              ) : (
                filteredOfferings.map((item, idx) => {
                  const wfBadge = getWorkflowBadge(item.workflowStatus);
                  const evBadge = getEventLifecycleBadge(item.eventStatus);
                  const WfIcon = wfBadge.icon;
                  const firstSpeaker = item.resourcePersons?.[0]?.name || (item.resourcePersons?.length ? '1 Expert' : 'TBD');

                  return (
                    <tr key={item.offeringId || item.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }} className="hover:bg-slate-50">
                      <td style={{ padding: '0.85rem 1rem', maxWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {(item.coverImageUrl || item.posterUrl) && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                const allImgs = [
                                  ...(item.poster ? [{ src: item.poster.src, alt: item.poster.alt || item.title, caption: 'Official Poster' }] : []),
                                  ...(item.gallery || []).map(g => ({ src: g.src, alt: g.alt || item.title, caption: g.caption }))
                                ];
                                if (allImgs.length > 0) openLightbox(allImgs, 0);
                              }}
                              title="Click to view verified event poster / media"
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                border: '1px solid #E2E8F0',
                                flexShrink: 0,
                                cursor: 'pointer',
                                background: '#F8FAFC'
                              }}
                            >
                              <NECImage
                                src={item.coverImageUrl || item.posterUrl}
                                alt={item.title}
                                width={38}
                                height={38}
                                objectFit="cover"
                                style={{ width: '100%', height: '100%' }}
                              />
                            </div>
                          )}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 800 }}>
                              {item.eventNumber || item.id}
                            </div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {item.title || item.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369A1', background: '#E0F2FE', padding: '0.15rem 0.45rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                          {item.eventType}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>{item.departmentName}</span>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Code: <strong>{item.department}</strong> • {item.academicYear}</div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          background: '#F1F5F9',
                          color: '#0F172A',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          border: '1px solid #CBD5E1',
                          whiteSpace: 'nowrap'
                        }}>
                          Section {item.section}
                        </span>
                        {item.isExpanded && (
                          <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '0.15rem' }}>
                            Offering ({item.totalSiblings} total)
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontSize: '0.76rem', color: '#0F172A', fontWeight: 700 }}>
                          {formatDateDDMMYYYY(item.startDate)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          {item.mode} • {item.venue || 'Online'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.78rem' }}>
                          {item.coordinatorName || 'TBD'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', maxWidth: '180px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#334155', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {firstSpeaker}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>
                          {item.actualParticipants || item.expectedParticipants || 0}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                          {item.actualParticipants ? 'Attended' : 'Expected'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, background: evBadge.bg, color: evBadge.text, padding: '0.15rem 0.5rem', borderRadius: '9999px', whiteSpace: 'nowrap' }}>
                          {evBadge.label}
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
                          <WfIcon size={11} /> {wfBadge.label}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => { setDossierModalItem(item); setDossierActiveTab('overview'); }}
                            title="View Event Dossier"
                            style={{ padding: '0.35rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
                          >
                            <Eye size={13} />
                          </button>

                          {canReview && (
                            <button
                              type="button"
                              onClick={() => { setReviewModalItem(item); setReviewAction('APPROVE'); }}
                              title="Review / Approve Event"
                              style={{ padding: '0.35rem 0.55rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: '#059669', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Review
                            </button>
                          )}

                          {canCreate && (
                            <button
                              type="button"
                              onClick={() => { 
                                const parent = events.find(e => e.id === (item.parentEventId || item.id)) || item;
                                setEditingItem(parent); 
                                setWizardOpen(true); 
                              }}
                              title="Edit Event"
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

      {/* 6. Guided 6-Step Creation / Edit Wizard */}
      {wizardOpen && (
        <AcademicEventWizardModal
          isOpen={wizardOpen}
          onClose={() => { setWizardOpen(false); setEditingItem(null); }}
          initialData={editingItem}
          currentUser={currentUser}
          onSaved={() => refresh()}
        />
      )}

      {/* 7. Comprehensive Multi-Tab Dossier Inspection Modal */}
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
            maxWidth: '820px',
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
                  {dossierModalItem.eventNumber || dossierModalItem.id} • {dossierModalItem.eventType}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#FFFFFF', fontFamily: 'Cinzel, serif' }}>
                  {dossierModalItem.title || dossierModalItem.name}
                </h3>
              </div>
              <button type="button" onClick={() => setDossierModalItem(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Dossier Tabs */}
            <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0.5rem 1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'schedule', label: `Sessions (${dossierModalItem.sessions?.length || 0})` },
                { id: 'speakers', label: `Resource Persons (${dossierModalItem.resourcePersons?.length || 0})` },
                { id: 'evidence', label: `Evidence (${dossierModalItem.documents?.length || 0})` },
                { id: 'media', label: `Media (${(dossierModalItem.poster ? 1 : 0) + (dossierModalItem.gallery?.length || 0)})` }
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
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Dossier Body Canvas */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {dossierActiveTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Department & Academic Year</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.department} • {dossierModalItem.academicYear}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Date & Mode</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>{formatDateDDMMYYYY(dossierModalItem.startDate)} to {formatDateDDMMYYYY(dossierModalItem.endDate)} ({dossierModalItem.mode})</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{dossierModalItem.venue || dossierModalItem.platformName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Primary Coordinator</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.coordinatorName || 'TBD'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Audience & Attendance</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.targetAudience} ({dossierModalItem.actualParticipants || dossierModalItem.expectedParticipants} Delegates)</div>
                    </div>
                  </div>

                  {dossierModalItem.description && (
                    <div>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Description</h4>
                      <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>{dossierModalItem.description}</p>
                    </div>
                  )}

                  {dossierModalItem.outcomeSummary && (
                    <div style={{ background: '#ECFDF5', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#065F46', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Outcome & Feedback</div>
                      <p style={{ fontSize: '0.8rem', color: '#047857', margin: 0 }}>{dossierModalItem.outcomeSummary}</p>
                    </div>
                  )}
                </div>
              )}

              {dossierActiveTab === 'schedule' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dossierModalItem.sessions?.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>No individual sessions recorded.</div>
                  ) : (
                    dossierModalItem.sessions?.map((sess, idx) => (
                      <div key={idx} style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem' }}>Session {sess.sessionNo}: {sess.title}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{sess.date} ({sess.startTime} - {sess.endTime}) • {sess.speaker || 'Assigned Expert'}</div>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 700 }}>{sess.venue || 'Hall'}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {dossierActiveTab === 'speakers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dossierModalItem.resourcePersons?.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>No resource persons recorded.</div>
                  ) : (
                    dossierModalItem.resourcePersons?.map((rp, idx) => (
                      <div key={idx} style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.84rem' }}>{rp.name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{rp.designation} — <strong>{rp.organization}</strong></div>
                        {rp.topic && <div style={{ fontSize: '0.72rem', color: '#0284C7', marginTop: '0.2rem' }}>Topic: {rp.topic}</div>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {dossierActiveTab === 'evidence' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {dossierModalItem.documents?.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>No evidence files attached.</div>
                  ) : (
                    dossierModalItem.documents?.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.9rem', background: '#F1F5F9', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <FileText size={16} style={{ color: '#D4AF37' }} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>{doc.name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{doc.category || 'Proof'} ({doc.size})</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {dossierActiveTab === 'media' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Poster Card */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', margin: 0, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ImageIcon size={14} style={{ color: '#D4AF37' }} />
                        Official Event Poster
                      </h4>
                      {dossierModalItem.poster && (
                        <span style={{ fontSize: '0.7rem', background: '#ECFDF5', color: '#047857', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 700 }}>
                          Verified WebP • {dossierModalItem.poster.width}x{dossierModalItem.poster.height}
                        </span>
                      )}
                    </div>

                    {dossierModalItem.poster ? (
                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          onClick={() => {
                            const allMedia = [
                              { src: dossierModalItem.poster.src, alt: dossierModalItem.poster.alt || dossierModalItem.title, caption: 'Official Event Poster' },
                              ...(dossierModalItem.gallery || []).map(g => ({ src: g.src, alt: g.alt, caption: g.caption }))
                            ];
                            openLightbox(allMedia, 0);
                          }}
                          style={{ cursor: 'pointer', maxWidth: '380px', width: '100%', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.08)', background: '#FFFFFF' }}
                        >
                          <NECImage
                            src={dossierModalItem.poster.src}
                            alt={dossierModalItem.poster.alt || `Poster for ${dossierModalItem.title}`}
                            width={dossierModalItem.poster.width || 800}
                            height={dossierModalItem.poster.height || 1000}
                            objectFit="contain"
                            style={{ width: '100%', height: 'auto', maxHeight: '380px', display: 'block' }}
                          />
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          Click poster image to expand in full-resolution lightbox viewer.
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '1.25rem', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1', textAlign: 'center', color: '#64748B', fontSize: '0.8rem' }}>
                        No official poster identified for this event.
                      </div>
                    )}
                  </div>

                  {/* Gallery Grid */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', margin: 0, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Layers size={14} style={{ color: '#D4AF37' }} />
                        Event Session Gallery ({dossierModalItem.gallery?.length || 0})
                      </h4>
                      <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                        Visibility: <strong>INTERNAL / PRIVATE</strong>
                      </span>
                    </div>

                    {(!dossierModalItem.gallery || dossierModalItem.gallery.length === 0) ? (
                      <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>
                        No verified session photographs have been linked to this event.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        {dossierModalItem.gallery.map((photo, pIdx) => (
                          <div
                            key={photo.id || pIdx}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            <div
                              onClick={() => {
                                const allMedia = [
                                  ...(dossierModalItem.poster ? [{ src: dossierModalItem.poster.src, alt: dossierModalItem.poster.alt || dossierModalItem.title, caption: 'Official Poster' }] : []),
                                  ...(dossierModalItem.gallery || []).map(g => ({ src: g.src, alt: g.alt, caption: g.caption }))
                                ];
                                const targetIdx = dossierModalItem.poster ? pIdx + 1 : pIdx;
                                openLightbox(allMedia, targetIdx);
                              }}
                              style={{ height: '120px', background: '#070F1E', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                            >
                              <NECImage
                                src={photo.src}
                                alt={photo.alt || `Session Photo ${pIdx + 1}`}
                                width={photo.width || 400}
                                height={photo.height || 300}
                                objectFit="cover"
                                style={{ width: '100%', height: '100%' }}
                              />
                              <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.65)', color: '#FFFFFF', fontSize: '0.62rem', padding: '0.05rem 0.3rem', borderRadius: '3px' }}>
                                #{pIdx + 1}
                              </div>
                            </div>

                            <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {photo.caption || `Photograph ${pIdx + 1}`}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                <span style={{ fontSize: '0.62rem', background: '#F1F5F9', color: '#475569', padding: '0.05rem 0.35rem', borderRadius: '3px' }}>
                                  {photo.width}x{photo.height}
                                </span>
                                {canReview && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPrimaryCover(dossierModalItem.id, photo.src, currentUser);
                                      showToast('Primary cover image updated.');
                                      refresh();
                                    }}
                                    style={{ fontSize: '0.65rem', color: '#0284C7', background: '#E0F2FE', border: 'none', padding: '0.1rem 0.4rem', borderRadius: '3px', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Set Cover
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDossierModalItem(null)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Review & Decision Modal */}
      {reviewModalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 15, 30, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '500px', width: '100%', border: '1px solid #D4AF37', overflow: 'hidden' }}>
            <div style={{ background: '#070F1E', padding: '1rem 1.25rem', color: '#FFFFFF', borderBottom: '2px solid #D4AF37' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Review & Approve Academic Event</h3>
              <div style={{ fontSize: '0.75rem', color: '#D4AF37' }}>{reviewModalItem.eventNumber || reviewModalItem.id}: {reviewModalItem.title || reviewModalItem.name}</div>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>DECISION *</label>
                <select value={reviewAction} onChange={(e) => setReviewAction(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}>
                  <option value="APPROVE">Approve Event (Institutional Verified)</option>
                  <option value="UNDER_REVIEW">Mark Under Verification</option>
                  <option value="REQUEST_REVISION">Request Revision from Coordinator</option>
                  <option value="PUBLISH">Approve & Mark Eligible for Website</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>APPROVAL REMARKS</label>
                <textarea rows={3} placeholder="Add verification remarks..." value={reviewRemarks} onChange={(e) => setReviewRemarks(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.25rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => setReviewModalItem(null)} style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleExecuteReview} style={{ padding: '0.45rem 1.15rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>Submit Decision</button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Import CSV Modal */}
      <AcademicEventBulkImportModal
        isOpen={bulkImportModalOpen}
        onClose={() => setBulkImportModalOpen(false)}
        currentUser={currentUser}
        onImportComplete={(result) => {
          refresh();
          showToast(`Successfully imported ${result.importedCount} event(s) into DRAFT verification queue.`);
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        isOpen={Boolean(deleteConfirmItem)}
        title="Move Event to Recycle Bin?"
        itemName={deleteConfirmItem?.title || deleteConfirmItem?.name}
        itemType="event record"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmItem(null)}
      />

      {/* Media Fullscreen Lightbox Modal */}
      <MediaLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        items={lightboxItems}
        currentIndex={lightboxIndex}
        onNavigate={(newIdx) => setLightboxIndex(newIdx)}
      />
    </MotionPage>
  );
}
