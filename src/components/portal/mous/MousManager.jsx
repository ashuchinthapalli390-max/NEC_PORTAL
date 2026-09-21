import React, { useState, useMemo } from 'react';
import { 
  Handshake, 
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
  Layers,
  MapPin,
  RefreshCw,
  Zap,
  Activity,
  GraduationCap
} from 'lucide-react';
import { ET_DEPARTMENTS, FACULTY_DATA } from '../../../data/masterData.js';
import { 
  getMoUs, 
  reviewMoU, 
  softDeleteMoU,
  getMoULinkedActivities,
  exportToCSV,
  exportToExcel,
  exportToPDF
} from '../../../data/portalStore.js';
import { 
  getWorkflowBadge, 
  getMouStatusBadge, 
  StatusBadge 
} from '../../../lib/ui/statusBadges.jsx';
import MouWizardModal from './MouWizardModal.jsx';
import ConfirmDeleteDialog from '../common/ConfirmDeleteDialog.jsx';
import { formatDateDDMMYYYY, isDateInRange } from '../../../lib/ui/dateUtils.js';

import { 
  MotionPage, 
  ModulePageHeader, 
  AnimatedKpiGrid, 
  MotionKpiCard, 
  MotionTable, 
  MotionTableRow, 
  MotionEmptyState,
  MotionButton,
  MotionModal
} from '../../motion/index.js';

export default function MousManager({ currentUser, onDataChange }) {
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

  // Authoritative Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState(currentUser?.role === 'HOD' ? (currentUser.dept || 'ALL') : 'ALL');
  const [selectedPartnerType, setSelectedPartnerType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedWorkflowStatus, setSelectedWorkflowStatus] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refresh = () => {
    setDataVersion(v => v + 1);
    if (onDataChange) onDataChange();
  };

  // Helper Icon Resolution for Collaborator Types
  const getPartnerTypeIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('industry') || t.includes('corporate') || t.includes('company')) return Building2;
    if (t.includes('university') || t.includes('college') || t.includes('academic')) return GraduationCap;
    if (t.includes('research') || t.includes('institute') || t.includes('lab')) return Sparkles;
    return Globe;
  };

  // Helper to query linked activity counters
  const getMouActivitiesSummary = (item) => {
    if (!item) return { total: 0, internships: 0, workshops: 0, fdps: 0, projects: 0 };
    const queryKey = item.organization || item.partnerOrganization || item.collaboratingAgency || item.mouRecordNumber || item.id;
    return getMoULinkedActivities(queryKey);
  };

  // Live Records
  const mous = useMemo(() => {
    return getMoUs();
  }, [dataVersion]);

  // Filtered Records (Safe Search & Field Filter Normalization)
  const filteredMoUs = useMemo(() => {
    return mous.filter(item => {
      const q = searchQuery.trim().toLowerCase();
      const searchable = [
        item.mouRecordNumber,
        item.mouCode,
        item.organization,
        item.partnerOrganization,
        item.collaboratingAgency,
        item.industryName,
        item.title,
        item.focusArea,
        item.purpose,
        item.department,
        item.partnerContactPerson
      ].filter(Boolean).join(' ').toLowerCase();

      const matchSearch = !q || searchable.includes(q);

      const itemDept = item.department || '';
      const matchDept = selectedDept === 'ALL' || itemDept === selectedDept;
      
      const partnerVal = (item.collaboratorType || item.partnerType || '').toLowerCase();
      const matchPartner = selectedPartnerType === 'ALL' || partnerVal.includes(selectedPartnerType.toLowerCase());
      
      const statusVal = item.mouStatus || item.status || 'ACTIVE';
      const matchStatus = selectedStatus === 'ALL' || statusVal === selectedStatus;
      
      const wfVal = item.workflowStatus || 'APPROVED';
      const matchWorkflow = selectedWorkflowStatus === 'ALL' || wfVal === selectedWorkflowStatus;

      const matchDate = isDateInRange(item.signedDate || item.effectiveDate || item.date || item.createdAt, fromDate, toDate);

      return matchSearch && matchDept && matchPartner && matchStatus && matchWorkflow && matchDate;
    });
  }, [mous, searchQuery, selectedDept, selectedPartnerType, selectedStatus, selectedWorkflowStatus, fromDate, toDate]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const total = filteredMoUs.length;
    const active = filteredMoUs.filter(m => (m.mouStatus === 'ACTIVE' || m.status === 'ACTIVE')).length;
    const expiringSoon = filteredMoUs.filter(m => (m.mouStatus === 'EXPIRING_SOON' || m.status === 'EXPIRING_SOON')).length;
    const expired = filteredMoUs.filter(m => (m.mouStatus === 'EXPIRED' || m.status === 'EXPIRED')).length;
    const industry = filteredMoUs.filter(m => (m.collaboratorType === 'INDUSTRY' || m.partnerType === 'Industry' || m.collaboratorType === 'Industry')).length;
    const academic = filteredMoUs.filter(m => (m.collaboratorType === 'ACADEMIC_INSTITUTION' || m.partnerType === 'University' || m.partnerType === 'College')).length;
    const pendingReview = filteredMoUs.filter(m => m.workflowStatus === 'SUBMITTED' || m.workflowStatus === 'UNDER_REVIEW').length;
    
    let totalAct = 0;
    filteredMoUs.forEach(m => {
      const act = getMouActivitiesSummary(m);
      totalAct += (act.total || 0);
    });

    return { total, active, expiringSoon, expired, industry, academic, pendingReview, totalAct };
  }, [filteredMoUs]);

  // Permissions
  const canCreate = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOD' || currentUser?.role === 'FACULTY';
  const canReview = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOD';

  const handleReviewSubmit = () => {
    if (!reviewModalItem) return;
    reviewMoU(reviewModalItem.id, reviewAction, reviewRemarks, currentUser);
    setReviewModalItem(null);
    setReviewRemarks('');
    refresh();
    showToast(`MoU review decision recorded.`);
  };

  const handleDelete = (id, org) => {
    setDeleteConfirmItem({ id, org });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmItem) {
      softDeleteMoU(deleteConfirmItem.id, currentUser);
      const name = deleteConfirmItem.org;
      setDeleteConfirmItem(null);
      refresh();
      showToast(`MoU with "${name}" moved to Recycle Bin.`);
    }
  };

  const handleExportCSV = () => {
    const rows = filteredMoUs.map(m => ({
      'MoU Code': m.mouRecordNumber || m.mouCode,
      'Partner Organization': m.organization || m.partnerOrganization || m.collaboratingAgency || m.industryName,
      'Department': m.department || 'Institution Level',
      'Partner Type': m.collaboratorType || m.partnerType || 'Industry',
      'Duration / Validity': m.validityPeriod || 'Validity Not Recorded',
      'StartDate': formatDateDDMMYYYY(m.startDate || m.signedDate) || '—',
      'EndDate': formatDateDDMMYYYY(m.endDate || m.expiryDate) || '—',
      'Purpose / Activity': m.purpose || m.title || 'Academic & Technical Collaboration',
      'Status': m.status || 'Active'
    }));
    exportToCSV(rows, `ET_MoUs_${selectedDept}`, currentUser);
    showToast(`Exported ${rows.length} MoU records to CSV.`);
  };

  const handleExportExcel = () => {
    const rows = filteredMoUs.map(m => ({
      'MoU Code': m.mouRecordNumber || m.mouCode,
      'Partner Organization': m.organization || m.partnerOrganization || m.collaboratingAgency || m.industryName,
      'Department': m.department || 'Institution Level',
      'Partner Type': m.collaboratorType || m.partnerType || 'Industry',
      'Duration / Validity': m.validityPeriod || 'Validity Not Recorded',
      'StartDate': formatDateDDMMYYYY(m.startDate || m.signedDate) || '—',
      'EndDate': formatDateDDMMYYYY(m.endDate || m.expiryDate) || '—',
      'Purpose / Activity': m.purpose || m.title || 'Academic & Technical Collaboration',
      'Status': m.status || 'Active'
    }));
    exportToExcel(rows, `ET_MoUs_${selectedDept}`, 'MoUs', currentUser);
    showToast(`Exported ${rows.length} MoU records to Excel.`);
  };

  const handleExportPDF = () => {
    const rows = filteredMoUs.map(m => ({
      'MoU Code': m.mouRecordNumber || m.mouCode || '—',
      'Partner': m.organization || m.partnerOrganization || m.collaboratingAgency || m.industryName,
      'Dept': m.department || 'All',
      'Type': m.collaboratorType || m.partnerType || 'Industry',
      'Expiry': formatDateDDMMYYYY(m.expiryDate) || 'Ongoing',
      'Status': m.mouStatus || m.status || 'ACTIVE'
    }));
    exportToPDF('ET_MoUs_Report', ['MoU Code', 'Partner', 'Dept', 'Type', 'Expiry', 'Status'], rows, 'Industry MoUs & Collaborations');
    showToast(`Exported MoU records report to PDF.`);
  };

  return (
    <MotionPage style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', position: 'relative' }}>
      {toastMessage && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
      
      {/* 1. Standardized Animated Header & Action Cluster */}
      <ModulePageHeader
        breadcrumbs={[
          { label: 'Dashboard' },
          { label: 'Events & Outreach' },
          { label: 'Industry MoUs & Partnerships' }
        ]}
        title="Industry MoUs & Collaborations"
        subtitle="Manage institutional bilateral agreements, industry tie-ups, validity tracking, and linked activities."
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        primaryAction={canCreate ? {
          label: 'Establish MoU',
          icon: Plus,
          onClick: () => { setEditingItem(null); setWizardOpen(true); }
        } : null}
      />

      {/* 3. Staggered Animated KPI Summary Cards */}
      <AnimatedKpiGrid minWidth="140px">
        <MotionKpiCard label="Total MoUs" value={stats.total} icon={Handshake} color="#0F172A" bg="#F8FAFC" />
        <MotionKpiCard label="Active Partnerships" value={stats.active} icon={CheckCircle2} color="#059669" bg="#ECFDF5" />
        <MotionKpiCard label="Expiring Soon (≤60d)" value={stats.expiringSoon} icon={Clock} color="#D97706" bg="#FEFCE8" />
        <MotionKpiCard label="Expired / Concluded" value={stats.expired} icon={AlertTriangle} color="#DC2626" bg="#FEF2F2" />
        <MotionKpiCard label="Industry Partners" value={stats.industry} icon={Building2} color="#2563EB" bg="#EFF6FF" />
        <MotionKpiCard label="Academic Partners" value={stats.academic} icon={Globe} color="#7C3AED" bg="#F5F3FF" />
        <MotionKpiCard label="Activities Conducted" value={stats.totalAct} icon={Activity} color="#0D9488" bg="#F0FDFA" />
      </AnimatedKpiGrid>

      {/* 4. Search & Multi-Filter Toolbar */}
      <div style={{ background: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by partner organization, MoU code, agreement purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', outline: 'none', color: '#0F172A', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={selectedPartnerType}
              onChange={(e) => setSelectedPartnerType(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Partner Types</option>
              <option value="Industry">Industry</option>
              <option value="University">University</option>
              <option value="College">College</option>
              <option value="Research Institute">Research Institute</option>
              <option value="Startup">Startup</option>
            </select>

            <select
              value={selectedDept}
              disabled={currentUser?.role === 'HOD'}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All</option>
              <option value="Institution Level">Institution Level</option>
              {ET_DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">Status: All</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRING_SOON">Expiring Soon</option>
              <option value="EXPIRED">Expired</option>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.76rem', background: '#FFFFFF', color: '#0F172A' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.76rem', background: '#FFFFFF', color: '#0F172A' }}
              />
            </div>

            {(searchQuery || selectedDept !== 'ALL' || selectedPartnerType !== 'ALL' || selectedStatus !== 'ALL' || selectedWorkflowStatus !== 'ALL' || fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (currentUser?.role !== 'HOD') setSelectedDept('ALL');
                  setSelectedPartnerType('ALL');
                  setSelectedStatus('ALL');
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

      {/* 5. Authoritative Data Table */}
      {filteredMoUs.length === 0 ? (
        <MotionEmptyState
          icon={Handshake}
          title="No MoU Records Found"
          description="No collaborative agreements match the active search or filter criteria. Create a new MoU or reset the filters."
          action={canCreate ? {
            label: 'Register First MoU',
            onClick: () => { setEditingItem(null); setWizardOpen(true); }
          } : null}
        />
      ) : (
        <MotionTable>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem', minWidth: '980px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '130px' }}>MoU Code</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '180px' }}>Partner Organization</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '110px' }}>Partner Type</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '110px' }}>Department</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '180px' }}>Agreement Purpose</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '100px' }}>Signed Date</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '110px' }}>Expiry / Validity</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '95px' }}>Activities</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '95px' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: '95px' }}>Approval</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right', minWidth: '85px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMoUs.map((item, idx) => {
                  const activities = getMouActivitiesSummary(item);
                  const stBadge = getMouStatusBadge(item.mouStatus || item.status);
                  const wfBadge = getWorkflowBadge(item.workflowStatus || 'APPROVED');
                  const WfIcon = wfBadge.icon || CheckCircle2;
                  const PartnerIcon = getPartnerTypeIcon(item.collaboratorType || item.partnerType);
                  const partnerName = item.organization || item.partnerOrganization || item.collaboratingAgency || item.industryName || 'Partner Organization';
                  const mouCode = item.mouRecordNumber || item.mouCode || item.mouNumber || `MOU-${item.id}`;

                  return (
                    <MotionTableRow key={item.id} index={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <span className="record-code" style={{ color: '#0F172A', background: '#F8FAFC', padding: '0.2rem 0.45rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                          {mouCode}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>
                          {partnerName}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          color: '#475569',
                          background: '#F1F5F9',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          <PartnerIcon size={12} />
                          {item.collaboratorType || item.partnerType || 'Industry'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 700, color: '#334155' }}>
                          {item.department || 'Institution Level'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0F172A', maxWidth: '240px', lineHeight: 1.35 }} title={item.purpose || item.title || 'Technical Collaboration'}>
                          {item.purpose || item.title || 'Academic & Technical Collaboration'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                          {item.startDate || item.signedDate ? formatDateDDMMYYYY(item.startDate || item.signedDate) : '—'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '0.78rem', color: '#0F172A', fontWeight: 700 }}>
                          {item.endDate || item.expiryDate ? formatDateDDMMYYYY(item.endDate || item.expiryDate) : (item.validityPeriod || 'Validity Not Recorded')}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <button
                          type="button"
                          onClick={() => { setDossierModalItem(item); setDossierActiveTab('activities'); }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            background: activities.total > 0 ? '#ECFDF5' : '#F1F5F9',
                            color: activities.total > 0 ? '#047857' : '#64748B',
                            border: `1px solid ${activities.total > 0 ? '#A7F3D0' : '#CBD5E1'}`,
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          <Zap size={11} /> {activities.total || 0} Activities
                        </button>
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
                          <WfIcon size={11} /> {wfBadge.label}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => { setDossierModalItem(item); setDossierActiveTab('overview'); }}
                            title="View MoU Dossier"
                            style={{ padding: '0.35rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
                          >
                            <Eye size={13} />
                          </button>

                          {canReview && (
                            <button
                              type="button"
                              onClick={() => { setReviewModalItem(item); setReviewAction('APPROVE'); }}
                              title="Review / Approve MoU"
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
                              onClick={() => handleDelete(item.id, partnerName)}
                              title="Delete / Move to Recycle Bin"
                              style={{ padding: '0.35rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#DC2626', cursor: 'pointer' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </MotionTableRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        </MotionTable>
      )}

      {/* 6. MoU Wizard Modal */}
      {wizardOpen && (
        <MouWizardModal
          isOpen={wizardOpen}
          onClose={() => { setWizardOpen(false); setEditingItem(null); }}
          initialData={editingItem}
          currentUser={currentUser}
          onSaved={() => refresh()}
        />
      )}

      {/* 7. Multi-Tab Dossier Modal */}
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
            maxWidth: '840px',
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
                  {dossierModalItem.mouRecordNumber || dossierModalItem.mouCode || dossierModalItem.id} • {dossierModalItem.collaboratorType || dossierModalItem.partnerType || 'Industry'}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#FFFFFF', fontFamily: 'Cinzel, Georgia, serif' }}>
                  {dossierModalItem.organization || dossierModalItem.partnerOrganization || dossierModalItem.collaboratingAgency}
                </h3>
              </div>
              <button type="button" onClick={() => setDossierModalItem(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Dossier Tabs */}
            <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0.5rem 1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
              {[
                { id: 'overview', label: 'Agreement Overview' },
                { id: 'scopes', label: `Scopes (${dossierModalItem.scopes?.length || 0})` },
                { id: 'activities', label: 'Linked Activities' },
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Agreement Title</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>{dossierModalItem.title || dossierModalItem.purpose || 'Institutional Bilateral Agreement'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Duration / Validity</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>{dossierModalItem.validityPeriod || 'Validity Not Recorded'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Signed & Effective Date</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.signedDate || 'N/A'} (Effective: {dossierModalItem.effectiveDate || dossierModalItem.signedDate || 'N/A'})</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Validity & Expiry</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.validityType || '3 Years'} (Expires: {formatDateDDMMYYYY(dossierModalItem.expiryDate) || 'Ongoing'})</div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Purpose & Objectives</h4>
                    <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0 }}>{dossierModalItem.purpose || dossierModalItem.focusArea || 'Academic collaboration, student internships, curriculum development, and joint research.'}</p>
                  </div>
                </div>
              )}

              {dossierActiveTab === 'scopes' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(dossierModalItem.scopes && dossierModalItem.scopes.length > 0) ? (
                    dossierModalItem.scopes.map(s => (
                      <span key={s} style={{ padding: '0.45rem 0.9rem', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700 }}>
                        ✓ {s}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.82rem', color: '#64748B' }}>General bilateral collaboration scope.</span>
                  )}
                </div>
              )}

              {dossierActiveTab === 'activities' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {(() => {
                    const act = getMouActivitiesSummary(dossierModalItem);
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                        <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>{act.internships || 0}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Internships</div>
                        </div>
                        <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{act.workshops || 0}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Workshops/Events</div>
                        </div>
                        <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB' }}>{act.fdps || 0}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>FDPs Organized</div>
                        </div>
                        <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7C3AED' }}>{act.projects || 0}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Industry Projects</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {dossierActiveTab === 'evidence' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {(!dossierModalItem.documents || dossierModalItem.documents.length === 0) ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>No agreement documents attached.</div>
                  ) : (
                    dossierModalItem.documents.map(doc => (
                      <div key={doc.id || doc.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.9rem', background: '#F1F5F9', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <FileText size={16} style={{ color: '#D4AF37' }} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>{doc.name || doc.title}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{doc.type || 'PDF Document'} ({doc.size || 'Verified'})</div>
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
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Review & Approve MoU</h3>
              <div style={{ fontSize: '0.75rem', color: '#D4AF37' }}>{reviewModalItem.organization || reviewModalItem.partnerOrganization}</div>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>DECISION *</label>
                <select value={reviewAction} onChange={(e) => setReviewAction(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}>
                  <option value="APPROVE">Approve & Ratify Bilateral MoU</option>
                  <option value="UNDER_REVIEW">Mark Under Legal/Institutional Review</option>
                  <option value="REQUEST_REVISION">Request Revision from Department</option>
                  <option value="TERMINATE">Terminate / Conclude Agreement</option>
                  <option value="ARCHIVE">Archive Record</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>OFFICIAL REMARKS</label>
                <textarea rows={3} placeholder="Add official ratification remarks..." value={reviewRemarks} onChange={(e) => setReviewRemarks(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }} />
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
        title="Move MoU to Recycle Bin?"
        itemName={deleteConfirmItem?.org}
        itemType="MoU agreement"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmItem(null)}
      />
    </MotionPage>
  );
}
