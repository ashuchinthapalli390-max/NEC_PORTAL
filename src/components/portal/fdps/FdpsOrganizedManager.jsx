import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  CheckCircle2, 
  Trash2, 
  Users,
  GraduationCap,
  X
} from 'lucide-react';
import { ET_DEPARTMENTS } from '../../../data/masterData.js';
import { 
  getFDPs, 
  getWorkshopsAttended,
  softDeleteFDP,
  softDeleteWorkshopAttended,
  exportToCSV,
  exportToExcel,
  exportToPDF
} from '../../../data/portalStore.js';
import FdpOrganizedWizardModal from './FdpOrganizedWizardModal.jsx';
import ConfirmDeleteDialog from '../common/ConfirmDeleteDialog.jsx';
import { 
  MotionPage, 
  ModulePageHeader, 
  AnimatedKpiGrid, 
  MotionKpiCard 
} from '../../motion/index.js';

export default function FdpsOrganizedManager({ currentUser, onDataChange }) {
  const [dataVersion, setDataVersion] = useState(0);
  const [activeTab, setActiveTab] = useState('ORGANIZED'); // 'ORGANIZED' | 'ATTENDED'
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dossierModalItem, setDossierModalItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState(currentUser?.role === 'HOD' ? (currentUser.dept || 'ALL') : 'ALL');
  const [selectedAy, setSelectedAy] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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
    setSelectedAy('ALL');
    setSelectedMode('ALL');
    setSelectedStatus('ALL');
    setFromDate('');
    setToDate('');
  };

  // 1. Load Datasets
  const fdpsOrganized = useMemo(() => {
    return getFDPs();
  }, [dataVersion]);

  const workshopsAttended = useMemo(() => {
    return getWorkshopsAttended();
  }, [dataVersion]);

  // 2. Filtered Lists
  const filteredOrganized = useMemo(() => {
    return fdpsOrganized.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const title = (item.title || item.fdpTitle || '').toLowerCase();
      const coord = (item.coordinatorName || item.coordinator || '').toLowerCase();
      const resp = (item.resourcePerson || '').toLowerCase();
      const num = (item.fdpNumber || item.id || '').toLowerCase();

      const matchSearch = !q || title.includes(q) || coord.includes(q) || resp.includes(q) || num.includes(q);
      const itemDept = item.department || '';
      const matchDept = selectedDept === 'ALL' || itemDept === selectedDept;
      const matchAy = selectedAy === 'ALL' || item.academicYear === selectedAy;
      const matchMode = selectedMode === 'ALL' || item.mode === selectedMode;
      const matchStatus = selectedStatus === 'ALL' || item.workflowStatus === selectedStatus;

      // Date filtering
      let matchDate = true;
      const itemDate = item.startDate || item.date;
      if (itemDate) {
        if (fromDate && itemDate < fromDate) matchDate = false;
        if (toDate && itemDate > toDate) matchDate = false;
      }

      return matchSearch && matchDept && matchAy && matchMode && matchStatus && matchDate;
    });
  }, [fdpsOrganized, searchQuery, selectedDept, selectedAy, selectedMode, selectedStatus, fromDate, toDate]);

  const filteredAttended = useMemo(() => {
    return workshopsAttended.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const facName = (item.facultyName || item.name || '').toLowerCase();
      const title = (item.title || item.programTitle || '').toLowerCase();
      const org = (item.organizer || item.venue || '').toLowerCase();
      const facId = (item.facultyId || '').toLowerCase();

      const matchSearch = !q || facName.includes(q) || title.includes(q) || org.includes(q) || facId.includes(q);
      const itemDept = item.department || '';
      const matchDept = selectedDept === 'ALL' || itemDept === selectedDept;
      const matchAy = selectedAy === 'ALL' || item.academicYear === selectedAy;
      const matchStatus = selectedStatus === 'ALL' || item.workflowStatus === selectedStatus;

      // Date filtering
      let matchDate = true;
      const itemDate = item.startDate || item.date;
      if (itemDate) {
        if (fromDate && itemDate < fromDate) matchDate = false;
        if (toDate && itemDate > toDate) matchDate = false;
      }

      return matchSearch && matchDept && matchAy && matchStatus && matchDate;
    });
  }, [workshopsAttended, searchQuery, selectedDept, selectedAy, selectedStatus, fromDate, toDate]);

  // Active items based on selected tab
  const activeItems = activeTab === 'ORGANIZED' ? filteredOrganized : filteredAttended;

  // KPIs
  const orgStats = useMemo(() => {
    const total = filteredOrganized.length;
    const completed = filteredOrganized.filter(f => f.programmeStatus === 'COMPLETED' || f.status === 'Organized' || f.workflowStatus === 'Approved').length;
    const participants = filteredOrganized.reduce((sum, f) => sum + Number(f.participants || f.participantsCount || f.noParticipants || 0), 0);
    const withCoordinators = filteredOrganized.filter(f => f.coordinator && f.coordinator !== 'Not recorded').length;
    return { total, completed, participants, withCoordinators };
  }, [filteredOrganized]);

  const attStats = useMemo(() => {
    const total = filteredAttended.length;
    const nptelCertified = filteredAttended.filter(f => f.organizer && f.organizer.toLowerCase().includes('nptel')).length;
    const uniqueFaculty = new Set(filteredAttended.map(f => f.facultyName).filter(Boolean)).size;
    return { total, nptelCertified, uniqueFaculty };
  }, [filteredAttended]);

  const canCreate = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOD' || currentUser?.role === 'FACULTY';
  const canReview = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOD';

  const handleReviewSubmit = () => {
    if (!reviewModalItem) return;
    reviewFDP(reviewModalItem.id, reviewAction, reviewRemarks, currentUser);
    setReviewModalItem(null);
    setReviewRemarks('');
    refresh();
    showToast(`FDP decision submitted.`);
  };

  const handleDelete = (item) => {
    setDeleteConfirmItem(item);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmItem) {
      if (activeTab === 'ORGANIZED') {
        softDeleteFDP(deleteConfirmItem.id, currentUser);
        const name = deleteConfirmItem.title || deleteConfirmItem.fdpTitle || deleteConfirmItem.id;
        showToast(`FDP "${name}" moved to Recycle Bin.`);
      } else {
        softDeleteWorkshopAttended(deleteConfirmItem.id, currentUser);
        showToast(`Attended program for "${deleteConfirmItem.facultyName}" removed.`);
      }
      setDeleteConfirmItem(null);
      refresh();
    }
  };

  // Export handlers with official template registry
  const handleExportCSV = () => {
    if (activeTab === 'ORGANIZED') {
      exportToCSV(filteredOrganized, `ET_FDPs_Organized_${selectedDept}`, currentUser, { moduleKey: 'fdpsOrganized' });
      showToast(`Exported ${filteredOrganized.length} organized FDP records to CSV.`);
    } else {
      exportToCSV(filteredAttended, `ET_Faculty_Workshops_Attended_${selectedDept}`, currentUser, { moduleKey: 'workshopsAttended' });
      showToast(`Exported ${filteredAttended.length} attended workshop records to CSV.`);
    }
  };

  const handleExportExcel = () => {
    if (activeTab === 'ORGANIZED') {
      exportToExcel(filteredOrganized, `ET_FDPs_Organized_${selectedDept}`, 'FDPs_Organized', currentUser, { moduleKey: 'fdpsOrganized' });
      showToast(`Exported ${filteredOrganized.length} organized FDP records via official template to Excel.`);
    } else {
      exportToExcel(filteredAttended, `ET_Faculty_Workshops_Attended_${selectedDept}`, 'Workshops_Attended', currentUser, { moduleKey: 'workshopsAttended' });
      showToast(`Exported ${filteredAttended.length} attended workshop records via official template to Excel.`);
    }
  };

  const handleExportPDF = () => {
    if (activeTab === 'ORGANIZED') {
      const rows = filteredOrganized.map(f => ({
        'Program Title': f.title || f.fdpTitle || '—',
        'Dept': f.department || 'Institution Level',
        'Coordinator(s)': f.coordinator || 'Not recorded',
        'Dates': f.startDate && f.endDate ? `${f.startDate} to ${f.endDate}` : (f.startDate || '—'),
        'Duration': f.duration || '—',
        'Participants': String(f.participants || f.participantsCount || '—'),
        'Status': f.workflowStatus || f.status || 'Organized'
      }));
      exportToPDF('ET_FDPs_Organized_Report', ['Program Title', 'Dept', 'Coordinator(s)', 'Dates', 'Duration', 'Participants', 'Status'], rows, 'Institutional Organized FDPs & Workshops');
      showToast(`Exported organized FDP report to PDF.`);
    } else {
      const rows = filteredAttended.map(w => ({
        'Faculty Member': w.facultyName || '—',
        'Dept': w.department || 'Institution Level',
        'Program Title': w.title || w.programTitle || '—',
        'Organizing Body': w.organizer || '—',
        'Dates / AY': `${w.date || '—'} (${w.academicYear || '—'})`,
        'Score / Status': w.nptelScore ? `${w.nptelScore}%` : (w.status || 'Completed')
      }));
      exportToPDF('ET_Workshops_Attended_Report', ['Faculty Member', 'Dept', 'Program Title', 'Organizing Body', 'Dates / AY', 'Score / Status'], rows, 'Faculty Participation in FDPs & Workshops');
      showToast(`Exported attended workshops report to PDF.`);
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
          { label: 'Faculty Development' },
          { label: activeTab === 'ORGANIZED' ? 'FDPs Organized (Host)' : 'Programs Attended' }
        ]}
        title="Faculty Development Programmes (FDPs)"
        subtitle="Institutional repository for programs organized by NEC/departments and external faculty development participation."
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        primaryAction={canCreate && activeTab === 'ORGANIZED' ? {
          label: 'Record Organized FDP',
          icon: Plus,
          onClick: () => { setEditingItem(null); setWizardOpen(true); }
        } : null}
      />

      {/* Tab Switcher: Type 1 vs Type 2 */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('ORGANIZED')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: activeTab === 'ORGANIZED' ? '#0F172A' : '#F1F5F9',
            color: activeTab === 'ORGANIZED' ? '#FFFFFF' : '#475569',
            transition: 'all 0.15s ease'
          }}
        >
          <Award size={16} color={activeTab === 'ORGANIZED' ? '#D4AF37' : '#64748B'} />
          <span>Programs Organized (Host)</span>
          <span style={{
            background: activeTab === 'ORGANIZED' ? 'rgba(212, 175, 55, 0.25)' : '#E2E8F0',
            color: activeTab === 'ORGANIZED' ? '#D4AF37' : '#475569',
            padding: '0.15rem 0.5rem',
            borderRadius: '10px',
            fontSize: '0.72rem'
          }}>
            {fdpsOrganized.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ATTENDED')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: activeTab === 'ATTENDED' ? '#0F172A' : '#F1F5F9',
            color: activeTab === 'ATTENDED' ? '#FFFFFF' : '#475569',
            transition: 'all 0.15s ease'
          }}
        >
          <GraduationCap size={16} color={activeTab === 'ATTENDED' ? '#D4AF37' : '#64748B'} />
          <span>Programs Attended (Participation)</span>
          <span style={{
            background: activeTab === 'ATTENDED' ? 'rgba(212, 175, 55, 0.25)' : '#E2E8F0',
            color: activeTab === 'ATTENDED' ? '#D4AF37' : '#475569',
            padding: '0.15rem 0.5rem',
            borderRadius: '10px',
            fontSize: '0.72rem'
          }}>
            {workshopsAttended.length}
          </span>
        </button>
      </div>

      {/* 2. KPI Summary Cards */}
      {activeTab === 'ORGANIZED' ? (
        <AnimatedKpiGrid minWidth="180px">
          <MotionKpiCard label="Organized Programs" value={orgStats.total} icon={Award} color="#0F172A" bg="#F8FAFC" />
          <MotionKpiCard label="Confirmed Conducted" value={orgStats.completed} icon={CheckCircle2} color="#059669" bg="#ECFDF5" />
          <MotionKpiCard label="Total Participants" value={orgStats.participants > 0 ? orgStats.participants : '—'} icon={Users} color="#9333EA" bg="#FDF4FF" />
          <MotionKpiCard label="Coordinators Recorded" value={orgStats.withCoordinators} icon={Users} color="#D97706" bg="#FEFCE8" />
        </AnimatedKpiGrid>
      ) : (
        <AnimatedKpiGrid minWidth="180px">
          <MotionKpiCard label="Programs Attended" value={attStats.total} icon={GraduationCap} color="#0F172A" bg="#F8FAFC" />
          <MotionKpiCard label="NPTEL Certifications" value={attStats.nptelCertified} icon={CheckCircle2} color="#059669" bg="#ECFDF5" />
          <MotionKpiCard label="Participating Faculty" value={attStats.uniqueFaculty} icon={Users} color="#2563EB" bg="#EFF6FF" />
        </AnimatedKpiGrid>
      )}

      {/* 3. Search & Filters with Date Range */}
      <div style={{ background: '#FFFFFF', padding: '1.15rem 1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder={activeTab === 'ORGANIZED' ? "Search by title, coordinator, resource person, department..." : "Search by faculty member, program title, organizer..."}
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
              <option value="Institution Level">Institution Level</option>
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
              <option value="2023-24">2023-24</option>
            </select>

            {activeTab === 'ORGANIZED' && (
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
              >
                <option value="ALL">All Modes</option>
                <option value="Offline">Offline</option>
                <option value="Virtual">Virtual / Online</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            )}

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Organized">Organized</option>
            </select>
          </div>
        </div>

        {/* Date Filter Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '0.25rem', borderTop: '1px dashed #E2E8F0', fontSize: '0.78rem' }}>
          <span style={{ fontWeight: 700, color: '#475569' }}>Date Range:</span>
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
          {(searchQuery || selectedDept !== 'ALL' || selectedAy !== 'ALL' || selectedMode !== 'ALL' || selectedStatus !== 'ALL' || fromDate || toDate) && (
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
          {activeTab === 'ORGANIZED' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1050px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '110px' }}>Program ID</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '220px' }}>Program Title</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '95px' }}>Department</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '130px' }}>Coordinator(s)</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '130px' }}>Venue</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '95px' }}>Start Date</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '95px' }}>End Date</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '85px' }}>Duration</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '95px' }}>Participants</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '95px' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right', minWidth: '85px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrganized.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                      No organized FDP records match the active criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrganized.map((item, idx) => {
                    const statusLabel = item.workflowStatus || item.status || 'Organized';
                    const hasCoord = item.coordinator && item.coordinator !== 'Not recorded';

                    return (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                          <span className="record-code" style={{ color: '#0F172A', background: '#F8FAFC', padding: '0.2rem 0.45rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                            {item.programId || `FDP-${item.id}`}
                          </span>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top', maxWidth: '280px' }}>
                          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.82rem', lineHeight: 1.35 }}>
                            {item.title || item.fdpTitle || item.programTitle || 'Not recorded'}
                          </div>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                          <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem', background: '#F1F5F9', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                            {item.department || 'Institution Level'}
                          </span>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 700, color: hasCoord ? '#0F172A' : '#94A3B8', fontSize: '0.8rem' }}>
                            {item.coordinator || 'Not recorded'}
                          </div>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top', maxWidth: '160px' }}>
                          <div style={{ fontSize: '0.76rem', color: '#475569' }}>
                            {item.venue || 'Campus / Online'}
                          </div>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '0.76rem', color: '#0F172A', fontWeight: 600 }}>
                            {item.startDate || 'Not recorded'}
                          </div>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '0.76rem', color: '#0F172A', fontWeight: 600 }}>
                            {item.endDate || item.startDate || '—'}
                          </div>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 700 }}>
                            {item.duration || '—'}
                          </div>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: (item.participants || item.participantsCount) ? '#9333EA' : '#94A3B8' }}>
                            {item.participants || item.participantsCount || '—'}
                          </span>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: '#ECFDF5',
                            color: '#047857',
                            border: '1px solid #A7F3D0',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '9999px',
                            fontSize: '0.68rem',
                            fontWeight: 800
                          }}>
                            <CheckCircle2 size={11} /> {statusLabel}
                          </span>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                            <button type="button" onClick={() => setDossierModalItem(item)} title="View Details" style={{ padding: '0.35rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}>
                              <Eye size={13} />
                            </button>
                            {canCreate && (
                              <button type="button" onClick={() => { setEditingItem(item); setWizardOpen(true); }} title="Edit Record" style={{ padding: '0.35rem', background: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: '6px', color: '#A16207', cursor: 'pointer' }}>
                                <Edit3 size={13} />
                              </button>
                            )}
                            {canReview && (
                              <button type="button" onClick={() => handleDelete(item)} title="Delete" style={{ padding: '0.35rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#DC2626', cursor: 'pointer' }}>
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
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Faculty Member</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Department & AY</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Program / Course Title</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Organizing Institution / Venue</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Dates / Duration</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Score / Result</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttended.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                      No attended workshop records match the active criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAttended.slice(0, 100).map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.82rem' }}>
                          {item.facultyName || item.name || '—'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          {item.facultyId || 'Faculty Participant'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>{item.department || 'Institution Level'}</span>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.academicYear || '—'}</div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', maxWidth: '280px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>
                          {item.title || item.programTitle || '—'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', maxWidth: '220px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                          {item.organizer || item.venue || '—'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontSize: '0.76rem', color: '#0F172A', fontWeight: 600 }}>
                          {item.date || item.startDate || '—'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          {item.duration || '—'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        {item.nptelScore ? (
                          <span style={{ fontWeight: 800, color: '#2563EB', fontSize: '0.8rem', background: '#EFF6FF', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                            {item.nptelScore}%
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.76rem' }}>—</span>
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
                          <CheckCircle2 size={11} /> {item.status || 'Completed'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button type="button" onClick={() => setDossierModalItem(item)} title="View Details" style={{ padding: '0.35rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}>
                            <Eye size={13} />
                          </button>
                          {canReview && (
                            <button type="button" onClick={() => handleDelete(item)} title="Delete" style={{ padding: '0.35rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#DC2626', cursor: 'pointer' }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        {activeTab === 'ATTENDED' && filteredAttended.length > 100 && (
          <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#64748B', textAlign: 'center' }}>
            Showing first 100 of {filteredAttended.length} attended records. Use search, department, and date filters to refine results.
          </div>
        )}
      </div>

      {wizardOpen && (
        <FdpOrganizedWizardModal
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
                <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase' }}>
                  {dossierModalItem.id || 'PROGRAM RECORD'}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#FFFFFF' }}>
                  {dossierModalItem.title || dossierModalItem.fdpTitle || dossierModalItem.programTitle}
                </h3>
              </div>
              <button type="button" onClick={() => setDossierModalItem(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Department & Academic Year</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                    {dossierModalItem.department || 'Institution Level'} • {dossierModalItem.academicYear || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    {dossierModalItem.facultyName ? 'Faculty Participant' : 'Coordinator'}
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                    {dossierModalItem.facultyName || dossierModalItem.coordinator || 'Not recorded'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Dates & Duration</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                    {dossierModalItem.startDate && dossierModalItem.endDate ? `${dossierModalItem.startDate} to ${dossierModalItem.endDate}` : (dossierModalItem.date || dossierModalItem.startDate || '—')} ({dossierModalItem.duration || '—'})
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Venue / Host Institution</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                    {dossierModalItem.organizer || dossierModalItem.venue || 'Campus / Online'}
                  </div>
                </div>
              </div>

              {dossierModalItem.resourcePerson && (
                <div>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Key Experts & Resource Persons</h4>
                  <div style={{ padding: '0.65rem 0.85rem', background: '#F1F5F9', borderRadius: '8px', fontSize: '0.82rem', color: '#334155', whiteSpace: 'pre-line' }}>
                    {dossierModalItem.resourcePerson}
                  </div>
                </div>
              )}

              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                Source: {dossierModalItem.sourceFile || 'Institutional Ingestion Pipeline'}
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDossierModalItem(null)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        isOpen={Boolean(deleteConfirmItem)}
        title={activeTab === 'ORGANIZED' ? "Delete Organized FDP?" : "Delete Attended Record?"}
        itemName={deleteConfirmItem?.title || deleteConfirmItem?.fdpTitle || deleteConfirmItem?.facultyName}
        itemType="program record"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmItem(null)}
      />
    </MotionPage>
  );
}
