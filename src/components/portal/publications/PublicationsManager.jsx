import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
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
  FileCheck,
  Globe,
  Award,
  Layers,
  RefreshCw
} from 'lucide-react';
import { ET_DEPARTMENTS } from '../../../data/masterData.js';
import { 
  getPublications, 
  reviewPublication, 
  softDeletePublication,
  exportToCSV,
  exportToExcel,
  exportToPDF
} from '../../../data/portalStore.js';
import { 
  getWorkflowBadge, 
  StatusBadge 
} from '../../../lib/ui/statusBadges.jsx';
import PublicationWizardModal from './PublicationWizardModal.jsx';
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

const QUICK_FILTER_TABS = [
  { id: 'ALL', label: 'All Publications' },
  { id: 'JOURNAL', label: 'Journal Articles', icon: BookOpen },
  { id: 'CONFERENCE', label: 'Conference Papers', icon: Users },
  { id: 'SCOPUS', label: 'Scopus Indexed', icon: Award },
  { id: 'WOS', label: 'Web of Science', icon: Globe },
  { id: 'PENDING', label: 'Pending Review', icon: Clock },
  { id: 'IMPORTED', label: 'Imported Records', icon: RefreshCw }
];

export default function PublicationsManager({ currentUser, onDataChange, onOpenSyncModal }) {
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

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuickTab, setSelectedQuickTab] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState(currentUser?.role === 'HOD' ? (currentUser.dept || 'ALL') : 'ALL');
  const [selectedAy, setSelectedAy] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedScopusFilter, setSelectedScopusFilter] = useState('ALL');
  const [selectedWorkflowStatus, setSelectedWorkflowStatus] = useState('ALL');

  const [publications, setPublications] = useState(() => getPublications());

  const refresh = () => {
    setPublications(getPublications());
    if (onDataChange) onDataChange();
  };

  // Aggregate Stats
  const stats = useMemo(() => {
    const total = publications.length;
    const journal = publications.filter(p => p.publicationType === 'JOURNAL').length;
    const conference = publications.filter(p => p.publicationType === 'CONFERENCE').length;
    const scopus = publications.filter(p => p.isScopusIndexed === 'YES' || p.isScopusIndexed === true).length;
    const wos = publications.filter(p => p.isWosIndexed === 'YES' || p.isWosIndexed === true).length;
    const pendingReview = publications.filter(p => p.workflowStatus === 'SUBMITTED' || p.workflowStatus === 'UNDER_REVIEW' || p.workflowStatus === 'IMPORTED_PENDING_REVIEW').length;
    const thisYear = publications.filter(p => p.academicYear === '2025-26' || p.academicYear === '2024-25').length;
    return { total, journal, conference, scopus, wos, pendingReview, thisYear };
  }, [publications]);

  // Filtered Records
  const filteredPubs = useMemo(() => {
    return publications.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        (item.publicationNumber && item.publicationNumber.toLowerCase().includes(q)) ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.journalName && item.journalName.toLowerCase().includes(q)) ||
        (item.doi && item.doi.toLowerCase().includes(q)) ||
        (item.authors && item.authors.some(a => a.name && a.name.toLowerCase().includes(q)));

      const itemDept = item.department || '';
      const matchDept = selectedDept === 'ALL' || itemDept.toLowerCase().includes(selectedDept.toLowerCase());
      const matchAy = selectedAy === 'ALL' || item.academicYear === selectedAy;
      const matchType = selectedType === 'ALL' || item.publicationType === selectedType;
      const matchScopus = selectedScopusFilter === 'ALL' || (selectedScopusFilter === 'SCOPUS' && (item.isScopusIndexed === 'YES' || item.isScopusIndexed === true));
      const matchWorkflow = selectedWorkflowStatus === 'ALL' || item.workflowStatus === selectedWorkflowStatus;

      // Quick Tab Filter
      let matchTab = true;
      if (selectedQuickTab === 'JOURNAL') matchTab = item.publicationType === 'JOURNAL';
      else if (selectedQuickTab === 'CONFERENCE') matchTab = item.publicationType === 'CONFERENCE';
      else if (selectedQuickTab === 'SCOPUS') matchTab = item.isScopusIndexed === 'YES' || item.isScopusIndexed === true;
      else if (selectedQuickTab === 'WOS') matchTab = item.isWosIndexed === 'YES' || item.isWosIndexed === true;
      else if (selectedQuickTab === 'PENDING') matchTab = item.workflowStatus === 'SUBMITTED' || item.workflowStatus === 'UNDER_REVIEW';
      else if (selectedQuickTab === 'IMPORTED') matchTab = item.workflowStatus === 'IMPORTED_PENDING_REVIEW';

      return matchSearch && matchDept && matchAy && matchType && matchScopus && matchWorkflow && matchTab;
    });
  }, [publications, searchQuery, selectedDept, selectedAy, selectedType, selectedScopusFilter, selectedWorkflowStatus, selectedQuickTab]);

  // Permissions
  const canCreate = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'HOD' || currentUser?.role === 'FACULTY';
  const canReview = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'HOD';

  const handleExecuteReview = () => {
    if (!reviewModalItem) return;
    reviewPublication(reviewModalItem.id, reviewAction, reviewRemarks, currentUser);
    const num = reviewModalItem.publicationNumber || reviewModalItem.id;
    setReviewModalItem(null);
    setReviewRemarks('');
    refresh();
    showToast(`Publication ${num} decision submitted.`);
  };

  const handleDelete = (item) => {
    setDeleteConfirmItem(item);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmItem) {
      softDeletePublication(deleteConfirmItem.id, currentUser);
      const title = deleteConfirmItem.title;
      setDeleteConfirmItem(null);
      refresh();
      showToast(`Publication "${title}" moved to Recycle Bin.`);
    }
  };

  const handleExportCSV = () => {
    const rows = filteredPublications.map(p => ({
      'Publication Number': p.publicationNumber,
      'Title': p.title,
      'Department': p.department,
      'Academic Year': p.academicYear || '—',
      'Publication Type': p.publicationType,
      'First Author': p.firstAuthor?.name || '—',
      'Journal / Conference': p.journalName || p.conferenceName || '—',
      'DOI': p.doi || '—',
      'Scopus Indexed': p.isScopusIndexed ? 'Yes' : 'No',
      'WoS Indexed': p.isWosIndexed ? 'Yes' : 'No',
      'Workflow Status': p.workflowStatus || 'APPROVED'
    }));
    exportToCSV(rows, `ET_Publications_${selectedDept}`, currentUser);
    showToast(`Exported ${rows.length} publication records to CSV.`);
  };

  const handleExportExcel = () => {
    const rows = filteredPublications.map(p => ({
      'Publication Number': p.publicationNumber,
      'Title': p.title,
      'Department': p.department,
      'Academic Year': p.academicYear || '—',
      'Publication Type': p.publicationType,
      'First Author': p.firstAuthor?.name || '—',
      'Journal / Conference': p.journalName || p.conferenceName || '—',
      'DOI': p.doi || '—',
      'Scopus Indexed': p.isScopusIndexed ? 'Yes' : 'No',
      'WoS Indexed': p.isWosIndexed ? 'Yes' : 'No',
      'Workflow Status': p.workflowStatus || 'APPROVED'
    }));
    exportToExcel(rows, `ET_Publications_${selectedDept}`, 'Publications', currentUser);
    showToast(`Exported ${rows.length} publication records to Excel.`);
  };

  const handleExportPDF = () => {
    const rows = filteredPublications.map(p => ({
      'Pub No': p.publicationNumber || '—',
      'Title': p.title,
      'Dept': p.department,
      'Author': p.firstAuthor?.name || '—',
      'Venue': p.journalName || p.conferenceName || '—',
      'Scopus': p.isScopusIndexed ? 'Yes' : 'No',
      'Status': p.workflowStatus || 'APPROVED'
    }));
    exportToPDF('ET_Publications_Report', ['Pub No', 'Title', 'Dept', 'Author', 'Venue', 'Scopus', 'Status'], rows, 'Research Publications Repository');
    showToast(`Exported publication records report to PDF.`);
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
          { label: 'Research & Innovation' },
          { label: 'Research Publications' }
        ]}
        title="Research Publications"
        subtitle="Manage faculty and student research papers, conference publications, indexing and research identifiers."
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        customActions={onOpenSyncModal ? (
          <button
            type="button"
            onClick={onOpenSyncModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.5rem 0.95rem',
              background: '#070F1E',
              color: '#F1C40F',
              border: '1px solid #D4AF37',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> Auto-Sync (ORCID)
          </button>
        ) : null}
        primaryAction={canCreate ? {
          label: 'Record Paper',
          icon: Plus,
          onClick: () => { setEditingItem(null); setWizardOpen(true); }
        } : null}
      />

      {/* 2. Staggered Animated KPI Summary Cards */}
      <AnimatedKpiGrid minWidth="140px">
        <MotionKpiCard label="Total Publications" value={stats.total} icon={BookOpen} color="#0F172A" bg="#F8FAFC" />
        <MotionKpiCard label="Journal Articles" value={stats.journal} icon={FileText} color="#2563EB" bg="#EFF6FF" />
        <MotionKpiCard label="Conference Papers" value={stats.conference} icon={Users} color="#0284C7" bg="#F0F9FF" />
        <MotionKpiCard label="Scopus Indexed" value={stats.scopus} icon={Award} color="#059669" bg="#ECFDF5" />
        <MotionKpiCard label="Web of Science" value={stats.wos} icon={Globe} color="#D97706" bg="#FEFCE8" />
        <MotionKpiCard label="Pending Review" value={stats.pendingReview} icon={Sparkles} color="#9333EA" bg="#FDF4FF" />
        <MotionKpiCard label="This Academic Year" value={stats.thisYear} icon={Building2} color="#0D9488" bg="#F0FDFA" />
      </AnimatedKpiGrid>

      {/* 3. Quick Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
        {QUICK_FILTER_TABS.map((tab) => {
          const isSelected = selectedQuickTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedQuickTab(tab.id)}
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
                whiteSpace: 'nowrap'
              }}
            >
              {Icon && <Icon size={13} />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Multi-Filter Toolbar */}
      <div style={{ background: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by publication title, DOI, author, journal, department..."
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
              <option value="ALL">All ET Departments</option>
              {ET_DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
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
              value={selectedScopusFilter}
              onChange={(e) => setSelectedScopusFilter(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">Scopus: All</option>
              <option value="YES">Scopus Indexed Only</option>
              <option value="NO">Non-Scopus</option>
            </select>

            <select
              value={selectedWorkflowStatus}
              onChange={(e) => setSelectedWorkflowStatus(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">Approval: All</option>
              <option value="APPROVED">Approved</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="IMPORTED_PENDING_REVIEW">Sync Pending</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="DRAFT">Draft</option>
            </select>

            {(searchQuery || selectedQuickTab !== 'ALL' || selectedDept !== 'ALL' || selectedAy !== 'ALL' || selectedScopusFilter !== 'ALL' || selectedWorkflowStatus !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedQuickTab('ALL');
                  if (currentUser?.role !== 'HOD') setSelectedDept('ALL');
                  setSelectedAy('ALL');
                  setSelectedScopusFilter('ALL');
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

      {/* 5. Publications Data Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Publication ID & Title</th>
                <th style={{ padding: '0.85rem 1rem' }}>Type & Venue</th>
                <th style={{ padding: '0.85rem 1rem' }}>Authors</th>
                <th style={{ padding: '0.85rem 1rem' }}>Dept & AY</th>
                <th style={{ padding: '0.85rem 1rem' }}>DOI & Indexing</th>
                <th style={{ padding: '0.85rem 1rem' }}>Source</th>
                <th style={{ padding: '0.85rem 1rem' }}>Approval</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPubs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    No research publications found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredPubs.map((item, idx) => {
                  const wfBadge = getWorkflowBadge(item.workflowStatus);
                  const WfIcon = wfBadge.icon;
                  const firstAuthor = item.authors?.find(a => a.isFirstAuthor)?.name || item.authors?.[0]?.name || 'Author';

                  return (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }} className="hover:bg-slate-50">
                      <td style={{ padding: '0.85rem 1rem', maxWidth: '280px' }}>
                        <div style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 800 }}>
                          {item.publicationRecordNumber || item.id}
                        </div>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {item.title}
                        </div>
                        {item.doi && (
                          <a
                            href={`https://doi.org/${item.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.7rem', color: '#0284C7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}
                          >
                            doi:{item.doi} <ExternalLink size={10} />
                          </a>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', maxWidth: '200px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0369A1', background: '#E0F2FE', padding: '0.15rem 0.45rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                          {item.publicationType}
                        </span>
                        <div style={{ fontSize: '0.74rem', color: '#334155', marginTop: '0.2rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {item.journalName || item.conferenceName || 'Publisher'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', maxWidth: '180px' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.78rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {firstAuthor}
                        </div>
                        {item.authors?.length > 1 && (
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            +{item.authors.length - 1} Co-Author(s)
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>{item.department}</span>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.academicYear}</div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {item.isScopusIndexed && (
                            <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#065F46', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                              Scopus
                            </span>
                          )}
                          {item.isWosIndexed && (
                            <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                              WoS
                            </span>
                          )}
                          {!item.isScopusIndexed && !item.isWosIndexed && (
                            <span style={{ fontSize: '0.66rem', color: '#64748B', background: '#F1F5F9', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                              Peer-Reviewed
                            </span>
                          )}
                        </div>
                        {item.scopusCitations?.count ? (
                          <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700, marginTop: '0.2rem' }}>
                            Citations: {item.scopusCitations.count} (Scopus)
                          </div>
                        ) : null}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#F1F5F9', color: '#475569', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          {item.sources?.[0] || 'MANUAL'}
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
                            title="View Publication Dossier"
                            style={{ padding: '0.35rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
                          >
                            <Eye size={13} />
                          </button>

                          {canReview && (
                            <button
                              type="button"
                              onClick={() => { setReviewModalItem(item); setReviewAction('APPROVE'); }}
                              title="Review / Approve Publication"
                              style={{ padding: '0.35rem 0.55rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: '#059669', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Review
                            </button>
                          )}

                          {canCreate && (
                            <button
                              type="button"
                              onClick={() => { setEditingItem(item); setWizardOpen(true); }}
                              title="Edit Publication"
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

      {/* 6. Publication Wizard Modal */}
      {wizardOpen && (
        <PublicationWizardModal
          isOpen={wizardOpen}
          onClose={() => { setWizardOpen(false); setEditingItem(null); }}
          initialData={editingItem}
          currentUser={currentUser}
          onSaved={() => refresh()}
        />
      )}

      {/* 7. Comprehensive Multi-Tab Publication Dossier Modal */}
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
                  {dossierModalItem.publicationRecordNumber || dossierModalItem.id} • {dossierModalItem.publicationType}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#FFFFFF', fontFamily: 'Cinzel, serif' }}>
                  {dossierModalItem.title}
                </h3>
              </div>
              <button type="button" onClick={() => setDossierModalItem(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Dossier Tabs */}
            <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0.5rem 1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
              {[
                { id: 'overview', label: 'Bibliographic Overview' },
                { id: 'authors', label: `Authors (${dossierModalItem.authors?.length || 0})` },
                { id: 'indexing', label: 'Indexing & Metrics' },
                { id: 'evidence', label: `Evidence Files (${dossierModalItem.documents?.length || 0})` }
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Venue / Container</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>{dossierModalItem.journalName || dossierModalItem.conferenceName || 'Publisher'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Department & Academic Year</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.department} • {dossierModalItem.academicYear}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Publication Date & Year</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.publicationDate} ({dossierModalItem.publicationYear})</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Canonical DOI</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0284C7' }}>{dossierModalItem.doi || 'None'}</div>
                    </div>
                  </div>

                  {dossierModalItem.abstract && (
                    <div>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Abstract</h4>
                      <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>{dossierModalItem.abstract}</p>
                    </div>
                  )}
                </div>
              )}

              {dossierActiveTab === 'authors' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {dossierModalItem.authors?.map((auth, idx) => (
                    <div key={idx} style={{ padding: '0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.85rem' }}>
                          #{auth.authorOrder} {auth.name} {auth.isFirstAuthor && <span style={{ color: '#D4AF37', fontSize: '0.74rem' }}>★ (First Author)</span>}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                          {auth.designation} • {auth.department} • <strong>{auth.affiliation || 'Narasaraopeta Engineering College'}</strong>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#0369A1', background: '#E0F2FE', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                        {auth.authorType?.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {dossierActiveTab === 'indexing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Indexing Coverage</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {dossierModalItem.indexing?.map((idxName, i) => (
                        <span key={i} style={{ fontSize: '0.74rem', fontWeight: 800, background: '#070F1E', color: '#F1C40F', padding: '0.25rem 0.65rem', borderRadius: '9999px' }}>
                          ✓ {idxName}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: '#F8FAFC', padding: '1rem', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Scopus Citations</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>{dossierModalItem.scopusCitations?.count || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Impact Factor</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>{dossierModalItem.impactFactor || 'N/A'} ({dossierModalItem.impactFactorSource})</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Quartile</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#D97706' }}>{dossierModalItem.quartile || 'N/A'}</div>
                    </div>
                  </div>
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

      {/* 8. Review Decision Modal */}
      {reviewModalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 15, 30, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '500px', width: '100%', border: '1px solid #D4AF37', overflow: 'hidden' }}>
            <div style={{ background: '#070F1E', padding: '1rem 1.25rem', color: '#FFFFFF', borderBottom: '2px solid #D4AF37' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Review & Approve Publication</h3>
              <div style={{ fontSize: '0.75rem', color: '#D4AF37' }}>{reviewModalItem.publicationRecordNumber || reviewModalItem.id}: {reviewModalItem.title}</div>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>DECISION *</label>
                <select value={reviewAction} onChange={(e) => setReviewAction(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}>
                  <option value="APPROVE">Approve Publication (Verified Institutional Record)</option>
                  <option value="UNDER_REVIEW">Mark Under Verification</option>
                  <option value="REQUEST_REVISION">Request Revision from Author</option>
                  <option value="PUBLISH">Approve & Make Eligible for Public Website</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>VERIFICATION REMARKS</label>
                <textarea rows={3} placeholder="Add official research verification remarks..." value={reviewRemarks} onChange={(e) => setReviewRemarks(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.25rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => setReviewModalItem(null)} style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleExecuteReview} style={{ padding: '0.45rem 1.15rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>Submit Decision</button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        isOpen={Boolean(deleteConfirmItem)}
        title="Move Publication to Recycle Bin?"
        itemName={deleteConfirmItem?.title}
        itemType="publication"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmItem(null)}
      />
    </MotionPage>
  );
}
