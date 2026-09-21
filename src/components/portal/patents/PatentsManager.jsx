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
  FileCheck,
  Globe
} from 'lucide-react';
import { ET_DEPARTMENTS } from '../../../data/masterData.js';
import { 
  getPatents, 
  reviewPatent, 
  updatePatentLegalStatus, 
  softDeletePatent,
  exportToCSV,
  exportToExcel,
  exportToPDF
} from '../../../data/portalStore.js';
import { 
  getWorkflowBadge, 
  getLegalStatusBadge, 
  StatusBadge 
} from '../../../lib/ui/statusBadges.jsx';
import PatentWizardModal from './PatentWizardModal.jsx';
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

export default function PatentsManager({ currentUser, onDataChange }) {
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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState(currentUser?.role === 'HOD' ? (currentUser.dept || 'ALL') : 'ALL');
  const [selectedAy, setSelectedAy] = useState('ALL');
  const [selectedLegalStatus, setSelectedLegalStatus] = useState('ALL');
  const [selectedWorkflowStatus, setSelectedWorkflowStatus] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [inventorsModalPatent, setInventorsModalPatent] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refresh = () => {
    setDataVersion(v => v + 1);
    if (onDataChange) onDataChange();
  };

  const patents = useMemo(() => {
    return getPatents();
  }, [dataVersion]);

  // Filtered Patents
  const filteredPatents = useMemo(() => {
    return patents.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        (item.patentNumber && item.patentNumber.toLowerCase().includes(q)) ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.applicationNumber && item.applicationNumber.toLowerCase().includes(q)) ||
        (item.grantNumber && item.grantNumber.toLowerCase().includes(q)) ||
        (item.leadInventor?.name && item.leadInventor.name.toLowerCase().includes(q)) ||
        (item.inventors && item.inventors.some(inv => inv.name?.toLowerCase().includes(q)));

      const itemDept = item.department || '';
      const matchDept = selectedDept === 'ALL' || itemDept === selectedDept;
      const matchAy = selectedAy === 'ALL' || item.academicYear === selectedAy;
      const matchLegal = selectedLegalStatus === 'ALL' || item.legalStatus?.toUpperCase() === selectedLegalStatus.toUpperCase();
      const matchWorkflow = selectedWorkflowStatus === 'ALL' || item.workflowStatus === selectedWorkflowStatus;

      // Date filtering
      let matchDate = true;
      const pDate = item.filingDate || item.publicationDate || item.date;
      if (pDate) {
        if (fromDate && pDate < fromDate) matchDate = false;
        if (toDate && pDate > toDate) matchDate = false;
      }

      return matchSearch && matchDept && matchAy && matchLegal && matchWorkflow && matchDate;
    });
  }, [patents, searchQuery, selectedDept, selectedAy, selectedLegalStatus, selectedWorkflowStatus, fromDate, toDate]);

  // KPIs (strictly calculated from canonical data)
  const stats = useMemo(() => {
    const total = filteredPatents.length;
    const isPublished = (p) => p.legalStatus?.toUpperCase() === 'PUBLISHED' || p.status?.toUpperCase() === 'PUBLISHED';
    const isFiled = (p) => p.legalStatus?.toUpperCase() === 'FILED' || p.status?.toUpperCase() === 'FILED' || isPublished(p);
    const isGranted = (p) => p.legalStatus?.toUpperCase() === 'GRANTED' || p.status?.toUpperCase() === 'GRANTED';
    const filed = filteredPatents.filter(isFiled).length;
    const published = filteredPatents.filter(isPublished).length;
    const granted = filteredPatents.filter(isGranted).length;
    const examination = filteredPatents.filter(p => p.legalStatus === 'UNDER_EXAMINATION' || p.legalStatus === 'EXAMINATION').length;
    const pendingReview = filteredPatents.filter(p => p.workflowStatus === 'SUBMITTED' || p.workflowStatus === 'UNDER_REVIEW').length;
    const thisYear = filteredPatents.filter(p => p.academicYear === '2025-26' || p.academicYear === '2024-25').length;

    return { total, filed, published, granted, examination, pendingReview, thisYear };
  }, [filteredPatents]);

  const canCreate = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOD' || currentUser?.role === 'FACULTY';
  const canReview = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOD';

  const handleReviewSubmit = () => {
    if (!reviewModalItem) return;
    reviewPatent(reviewModalItem.id, reviewAction, reviewRemarks, currentUser);
    setReviewModalItem(null);
    setReviewRemarks('');
    refresh();
    showToast(`Patent decision recorded.`);
  };

  const handleDelete = (item) => {
    setDeleteConfirmItem(item);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmItem) {
      softDeletePatent(deleteConfirmItem.id, currentUser);
      const title = deleteConfirmItem.title;
      setDeleteConfirmItem(null);
      refresh();
      showToast(`Patent "${title}" moved to Recycle Bin.`);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(filteredPatents, `ET_Patents_${selectedDept}`, currentUser, { moduleKey: 'patents' });
    showToast(`Exported ${filteredPatents.length} patent records to CSV.`);
  };

  const handleExportExcel = () => {
    exportToExcel(filteredPatents, `ET_Patents_${selectedDept}`, 'Patents', currentUser, { moduleKey: 'patents' });
    showToast(`Exported ${filteredPatents.length} patent records via official template to Excel.`);
  };

  const handleExportPDF = () => {
    const rows = filteredPatents.map((p, idx) => ({
      'S.No': String(idx + 1),
      'Application No': p.applicationNumber || '—',
      'Title of Invention': p.title,
      'Department': p.department,
      'Inventors': Array.isArray(p.inventors) ? p.inventors.map(i => i.name).join(', ') : (p.leadInventor?.name || '—'),
      'Filing Date': p.filingDate || '—',
      'Status': p.status || p.legalStatus || 'Published'
    }));
    exportToPDF('ET_Patents_Report', ['S.No', 'Application No', 'Title of Invention', 'Department', 'Inventors', 'Filing Date', 'Status'], rows, 'Patents & IPR Portfolio');
    showToast(`Exported patent records report to PDF.`);
  };

  return (
    <MotionPage style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', position: 'relative' }}>
      {toastMessage && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
      
      <ModulePageHeader
        breadcrumbs={[
          { label: 'Dashboard' },
          { label: 'Research & Innovation' },
          { label: 'Patents & IPR' }
        ]}
        title="Patents & Intellectual Property"
        subtitle="Manage faculty, student and institutional patent applications, publications and grants."
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        primaryAction={canCreate ? {
          label: 'Record Patent',
          icon: Plus,
          onClick: () => { setEditingItem(null); setWizardOpen(true); }
        } : null}
      />

      <AnimatedKpiGrid minWidth="140px">
        <MotionKpiCard label="Total Patents" value={stats.total} icon={Award} color="#0F172A" bg="#F8FAFC" />
        <MotionKpiCard label="Filed" value={stats.filed} icon={FileCheck} color="#2563EB" bg="#EFF6FF" />
        <MotionKpiCard label="Published" value={stats.published} icon={Globe} color="#0284C7" bg="#F0F9FF" />
        <MotionKpiCard label="Granted" value={stats.granted} icon={CheckCircle2} color="#059669" bg="#ECFDF5" />
        <MotionKpiCard label="Examination" value={stats.examination} icon={Clock} color="#D97706" bg="#FEFCE8" />
        <MotionKpiCard label="Pending Review" value={stats.pendingReview} icon={Sparkles} color="#9333EA" bg="#FDF4FF" />
        <MotionKpiCard label="This Academic Year" value={stats.thisYear} icon={Building2} color="#0D9488" bg="#F0FDFA" />
      </AnimatedKpiGrid>

      <div style={{ background: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by patent title, application number, grant number, inventor, department..."
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
              <option value="2026-27">2026-27</option>
              <option value="2025-26">2025-26</option>
              <option value="2024-25">2024-25</option>
            </select>

            <select
              value={selectedLegalStatus}
              onChange={(e) => setSelectedLegalStatus(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">Legal Status: All</option>
              <option value="FILED">Filed</option>
              <option value="PUBLISHED">Published</option>
              <option value="UNDER_EXAMINATION">Examination</option>
              <option value="GRANTED">Granted</option>
              <option value="COMMERCIALIZED">Commercialized</option>
              <option value="ABANDONED">Abandoned</option>
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

            {(searchQuery || selectedDept !== 'ALL' || selectedAy !== 'ALL' || selectedLegalStatus !== 'ALL' || selectedWorkflowStatus !== 'ALL' || fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (currentUser?.role !== 'HOD') setSelectedDept('ALL');
                  setSelectedAy('ALL');
                  setSelectedLegalStatus('ALL');
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
          <span style={{ fontWeight: 700, color: '#475569' }}>Filing / Publication Date:</span>
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

      {/* 4. Patents Data Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1050px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0.85rem 1rem', minWidth: '130px' }}>Patent ID</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '220px' }}>Patent Title</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '140px' }}>Application Number</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '95px' }}>Department</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '150px' }}>Inventors</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '95px' }}>Filing Date</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '105px' }}>Publication Date</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '95px' }}>Legal Status</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '95px' }}>Documents</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '95px' }}>Approval</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', minWidth: '85px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatents.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    No patent records found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredPatents.map((item, idx) => {
                  const wfBadge = getWorkflowBadge(item.workflowStatus);
                  const lgBadge = getLegalStatusBadge(item.legalStatus);
                  const WfIcon = wfBadge.icon;
                  const leadInventor = item.inventors?.find(i => i.isLead)?.name || item.inventors?.[0]?.name || 'Assigned Inventor';
                  const inventorCount = item.inventors?.length || 1;

                  return (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }} className="hover:bg-slate-50">
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <span className="record-code" style={{ color: '#0F172A', background: '#F8FAFC', padding: '0.2rem 0.45rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                          {item.patentRecordNumber || item.id}
                        </span>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '0.15rem' }}>
                          {item.patentType}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top', maxWidth: '280px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem', lineHeight: 1.35 }}>
                          {item.title}
                        </div>
                      </td>

                      {/* Application Number */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                          {item.applicationNumber || '—'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem', background: '#F1F5F9', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          {item.department}
                        </span>
                      </td>

                      {/* Inventors */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top', maxWidth: '180px' }}>
                        <button
                          type="button"
                          onClick={() => setInventorsModalPatent(item)}
                          style={{
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            color: '#1D4ED8',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                          title="Click to view all inventors"
                        >
                          <Users size={12} />
                          {inventorCount} Inventor{inventorCount !== 1 ? 's' : ''}
                        </button>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {leadInventor}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                          {item.filingDate || '—'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '0.78rem', color: '#0F172A', fontWeight: 600 }}>
                          {item.publicationDate || '—'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          background: lgBadge.bg,
                          color: lgBadge.text,
                          border: `1px solid ${lgBadge.border}`,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          whiteSpace: 'nowrap'
                        }}>
                          {lgBadge.label}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        {item.documents && item.documents.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {item.documents.map((doc, dIdx) => (
                              <a
                                key={dIdx}
                                href={`/api/portal/documents/serve?id=${encodeURIComponent(doc.id || doc.url)}&download=true`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <FileText size={11} /> {doc.title || 'Patent Document'}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic', background: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                            Document not available
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
                            title="View Patent Dossier"
                            style={{ padding: '0.35rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
                          >
                            <Eye size={13} />
                          </button>

                          {canReview && (
                            <button
                              type="button"
                              onClick={() => { setReviewModalItem(item); setReviewAction('APPROVE'); }}
                              title="Review / Approve Patent"
                              style={{ padding: '0.35rem 0.55rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: '#059669', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Review
                            </button>
                          )}

                          {canCreate && (
                            <button
                              type="button"
                              onClick={() => { setEditingItem(item); setWizardOpen(true); }}
                              title="Edit Patent Record"
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

      {/* 5. Guided Patent Wizard Modal */}
      {wizardOpen && (
        <PatentWizardModal
          isOpen={wizardOpen}
          onClose={() => { setWizardOpen(false); setEditingItem(null); }}
          initialData={editingItem}
          currentUser={currentUser}
          onSaved={() => refresh()}
        />
      )}

      {/* 6. Multi-Tab Patent Dossier Modal */}
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
                  {dossierModalItem.patentRecordNumber || dossierModalItem.id} • {dossierModalItem.patentType}
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
                { id: 'overview', label: 'Overview & Scope' },
                { id: 'inventors', label: `Inventors (${dossierModalItem.inventors?.length || 0})` },
                { id: 'timeline', label: 'Filing Timeline' },
                { id: 'evidence', label: `Evidence (${dossierModalItem.documents?.length || 0})` }
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
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Official Application No.</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>{dossierModalItem.applicationNumber || 'Pending'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Legal Status</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#059669' }}>{dossierModalItem.legalStatus}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Technology Domain</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.technologyDomain}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Applicant / Owner</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.applicantName}</div>
                    </div>
                  </div>

                  {dossierModalItem.abstract && (
                    <div>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Abstract & Technical Scope</h4>
                      <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>{dossierModalItem.abstract}</p>
                    </div>
                  )}

                  {dossierModalItem.keywords && (
                    <div>
                      <h4 style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Keywords</h4>
                      <div style={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 600 }}>{dossierModalItem.keywords}</div>
                    </div>
                  )}
                </div>
              )}

              {dossierActiveTab === 'inventors' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {dossierModalItem.inventors?.map((inv, idx) => (
                    <div key={idx} style={{ padding: '0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.85rem' }}>
                          #{inv.inventorOrder} {inv.name} {inv.isLead && <span style={{ color: '#D4AF37', fontSize: '0.74rem' }}>★ (Lead Inventor)</span>}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                          {inv.designation} • {inv.department} • <strong>{inv.affiliation}</strong>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#0369A1', background: '#E0F2FE', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                        {inv.personType?.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {dossierActiveTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '0.5rem 0' }}>
                  {[
                    { label: 'Application Filed', date: dossierModalItem.filingDate, status: 'Completed', icon: CheckCircle2, color: '#059669' },
                    { label: 'Published in Official Journal', date: dossierModalItem.publicationDate || 'Pending Publication', status: dossierModalItem.publicationDate ? 'Completed' : 'Pending', icon: Globe, color: dossierModalItem.publicationDate ? '#059669' : '#94A3B8' },
                    { label: 'First Examination Report (FER)', date: dossierModalItem.ferDate || 'Under Review', status: dossierModalItem.ferDate ? 'Completed' : 'Pending', icon: Clock, color: dossierModalItem.ferDate ? '#059669' : '#94A3B8' },
                    { label: 'Patent Granted', date: dossierModalItem.grantDate || (dossierModalItem.grantNumber ? 'Granted' : 'In Pipeline'), status: dossierModalItem.grantNumber ? 'Completed' : 'Pending', icon: Award, color: dossierModalItem.grantNumber ? '#059669' : '#94A3B8' }
                  ].map((t, idx) => {
                    const Icon = t.icon;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <Icon size={20} style={{ color: t.color }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.84rem' }}>{t.label}</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{t.date}</div>
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: t.color }}>{t.status}</span>
                      </div>
                    );
                  })}
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

      {/* 7. Review & Decision Modal */}
      {reviewModalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 15, 30, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '500px', width: '100%', border: '1px solid #D4AF37', overflow: 'hidden' }}>
            <div style={{ background: '#070F1E', padding: '1rem 1.25rem', color: '#FFFFFF', borderBottom: '2px solid #D4AF37' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Review & Approve Patent Record</h3>
              <div style={{ fontSize: '0.75rem', color: '#D4AF37' }}>{reviewModalItem.patentRecordNumber || reviewModalItem.id}: {reviewModalItem.title}</div>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>DECISION *</label>
                <select value={reviewAction} onChange={(e) => setReviewAction(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}>
                  <option value="APPROVE">Approve & Mark Verified (Institutional IPR)</option>
                  <option value="UNDER_REVIEW">Mark Under Verification</option>
                  <option value="REQUEST_REVISION">Request Revision from Inventor</option>
                  <option value="PUBLISH">Approve & Make Eligible for Public Website</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>VERIFICATION REMARKS</label>
                <textarea rows={3} placeholder="Add official IPR verification remarks..." value={reviewRemarks} onChange={(e) => setReviewRemarks(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.25rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => setReviewModalItem(null)} style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleReviewSubmit} style={{ padding: '0.45rem 1.15rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>Submit Decision</button>
            </div>
          </div>
        </div>
      )}
      {/* Inventors List Modal */}
      {inventorsModalPatent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '520px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '1rem 1.25rem', background: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 800 }}>ALL INVENTORS ({inventorsModalPatent.inventors?.length || 0})</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, maxWidth: '420px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {inventorsModalPatent.title}
                </div>
              </div>
              <button type="button" onClick={() => setInventorsModalPatent(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '1.25rem', maxHeight: '420px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {inventorsModalPatent.inventors?.map((inv, iIdx) => (
                  <div key={iIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', background: inv.isLead ? '#FEFCE8' : '#F8FAFC', borderRadius: '8px', border: inv.isLead ? '1px solid #FEF08A' : '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', width: '20px' }}>#{inv.order || (iIdx + 1)}</span>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{inv.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{inv.department || inventorsModalPatent.department || 'Narasaraopeta Engineering College'}</div>
                      </div>
                    </div>
                    {inv.isLead && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#D4AF37', color: '#0F172A', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                        Lead Inventor
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '0.85rem 1.25rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setInventorsModalPatent(null)} style={{ padding: '0.45rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        isOpen={Boolean(deleteConfirmItem)}
        title="Move Patent to Recycle Bin?"
        itemName={deleteConfirmItem?.title}
        itemType="patent"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmItem(null)}
      />
    </MotionPage>
  );
}
