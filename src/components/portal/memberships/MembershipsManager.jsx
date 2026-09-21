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
  Globe,
  RefreshCw
} from 'lucide-react';
import { ET_DEPARTMENTS, FACULTY_DATA } from '../../../data/masterData.js';
import { 
  getMemberships, 
  reviewMembership, 
  softDeleteMembership,
  exportToCSV,
  exportToExcel,
  exportToPDF
} from '../../../data/portalStore.js';
import { 
  getWorkflowBadge, 
  getMembershipValidityBadge, 
  getValidityBadge, 
  StatusBadge 
} from '../../../lib/ui/statusBadges.jsx';
import MembershipWizardModal from './MembershipWizardModal.jsx';
import ConfirmDeleteDialog from '../common/ConfirmDeleteDialog.jsx';
import FacultyAvatar from '../../common/FacultyAvatar.jsx';
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

export default function MembershipsManager({ currentUser, onDataChange }) {
  const [dataVersion, setDataVersion] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [renewalItem, setRenewalItem] = useState(null);
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
  const [selectedDept, setSelectedDept] = useState(currentUser?.role === 'HOD' ? (currentUser.dept || 'ALL') : 'ALL');
  const [selectedOrg, setSelectedOrg] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedWorkflowStatus, setSelectedWorkflowStatus] = useState('ALL');

  const refresh = () => {
    setDataVersion(v => v + 1);
    if (onDataChange) onDataChange();
  };

  const rawMemberships = useMemo(() => {
    return getMemberships();
  }, [dataVersion]);

  // Filter Logic
  const filteredMemberships = useMemo(() => {
    return rawMemberships.filter(m => {
      // Dept
      if (selectedDept !== 'ALL' && m.department !== selectedDept) return false;
      // Org
      if (selectedOrg !== 'ALL' && m.organization !== selectedOrg && m.organizationName !== selectedOrg) return false;
      // Type
      if (selectedType !== 'ALL' && m.membershipType !== selectedType) return false;
      // Status
      if (selectedStatus !== 'ALL' && m.membershipStatus !== selectedStatus) return false;
      // Workflow
      if (selectedWorkflowStatus !== 'ALL' && m.workflowStatus !== selectedWorkflowStatus) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const faculty = (m.facultyName || '').toLowerCase();
        const memNum = (m.membershipNumber || '').toLowerCase();
        const org = (m.organization || m.organizationName || '').toLowerCase();
        const dept = (m.department || '').toLowerCase();
        if (!faculty.includes(q) && !memNum.includes(q) && !org.includes(q) && !dept.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [rawMemberships, selectedDept, selectedOrg, selectedType, selectedStatus, selectedWorkflowStatus, searchQuery]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = filteredMemberships.length;
    const active = filteredMemberships.filter(m => m.membershipStatus === 'ACTIVE' || m.membershipStatus === 'Active').length;
    const life = filteredMemberships.filter(m => m.membershipType === 'Life Membership').length;
    const annual = filteredMemberships.filter(m => m.membershipType === 'Annual Membership').length;
    const expiringSoon = filteredMemberships.filter(m => m.membershipStatus === 'EXPIRING_SOON').length;
    const expired = filteredMemberships.filter(m => m.membershipStatus === 'EXPIRED' || m.membershipStatus === 'Expired').length;
    const pendingReview = filteredMemberships.filter(m => m.workflowStatus === 'UNDER_REVIEW' || m.workflowStatus === 'SUBMITTED').length;

    return { total, active, life, annual, expiringSoon, expired, pendingReview };
  }, [filteredMemberships]);

  // Permissions
  const canCreate = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOD' || currentUser?.role === 'FACULTY';
  const canReview = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOD';

  const handleReviewSubmit = () => {
    if (!reviewModalItem) return;
    reviewMembership(reviewModalItem.id, reviewAction, reviewRemarks, currentUser);
    const num = reviewModalItem.membershipNumber || reviewModalItem.id;
    setReviewModalItem(null);
    setReviewRemarks('');
    refresh();
    showToast(`Membership ${num} decision submitted.`);
  };

  const handleDelete = (item) => {
    setDeleteConfirmItem(item);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmItem) {
      softDeleteMembership(deleteConfirmItem.id, currentUser);
      const name = deleteConfirmItem.membershipNumber || deleteConfirmItem.id;
      setDeleteConfirmItem(null);
      refresh();
      showToast(`Membership "${name}" moved to Recycle Bin.`);
    }
  };

  const handleExportCSV = () => {
    const rows = filteredMemberships.map(m => ({
      'Membership ID': m.membershipRecordNumber || m.id,
      'Membership Number': m.membershipNumber || 'Pending',
      'Faculty Name': m.facultyName,
      'Designation': m.designation || '—',
      'Department': m.department,
      'Academic Year': m.academicYear || '—',
      'Professional Body': m.organizationName || m.organization,
      'Membership Type': m.membershipType,
      'Validity Status': m.membershipStatus,
      'Workflow Status': m.workflowStatus || 'APPROVED',
      'Start Date': m.startDate || '—',
      'End Date': m.endDate || 'Lifetime'
    }));
    exportToCSV(rows, `ET_Faculty_Memberships_${selectedDept}`, currentUser);
    showToast(`Exported ${rows.length} membership records to CSV.`);
  };

  const handleExportExcel = () => {
    const rows = filteredMemberships.map(m => ({
      'Membership ID': m.membershipRecordNumber || m.id,
      'Membership Number': m.membershipNumber || 'Pending',
      'Faculty Name': m.facultyName,
      'Designation': m.designation || '—',
      'Department': m.department,
      'Academic Year': m.academicYear || '—',
      'Professional Body': m.organizationName || m.organization,
      'Membership Type': m.membershipType,
      'Validity Status': m.membershipStatus,
      'Workflow Status': m.workflowStatus || 'APPROVED',
      'Start Date': m.startDate || '—',
      'End Date': m.endDate || 'Lifetime'
    }));
    exportToExcel(rows, `ET_Faculty_Memberships_${selectedDept}`, 'Memberships', currentUser);
    showToast(`Exported ${rows.length} membership records to Excel.`);
  };

  const handleExportPDF = () => {
    const rows = filteredMemberships.map(m => ({
      'Faculty Name': m.facultyName,
      'Dept': m.department,
      'Organization': m.organizationName || m.organization,
      'Type': m.membershipType,
      'Mem. Number': m.membershipNumber || 'Pending',
      'Validity': m.membershipStatus,
      'Status': m.workflowStatus || 'APPROVED'
    }));
    exportToPDF('ET_Faculty_Memberships_Report', ['Faculty Name', 'Dept', 'Organization', 'Type', 'Mem. Number', 'Validity', 'Status'], rows, 'Faculty Professional Memberships Repository');
    showToast(`Exported membership report to PDF.`);
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
          { label: 'Faculty Development' },
          { label: 'Faculty Memberships' }
        ]}
        title="Faculty Professional Memberships"
        subtitle="Manage faculty professional memberships, renewals, certificates and verification records."
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        primaryAction={canCreate ? {
          label: 'Record Membership',
          icon: Plus,
          onClick: () => { setEditingItem(null); setRenewalItem(null); setWizardOpen(true); }
        } : null}
      />

      {/* 2. Staggered Animated KPI Summary Cards */}
      <AnimatedKpiGrid minWidth="140px">
        <MotionKpiCard label="Total Memberships" value={stats.total} icon={Award} color="#0F172A" bg="#F8FAFC" />
        <MotionKpiCard label="Active Memberships" value={stats.active} icon={CheckCircle2} color="#059669" bg="#ECFDF5" />
        <MotionKpiCard label="Life Memberships" value={stats.life} icon={ShieldCheck} color="#2563EB" bg="#EFF6FF" />
        <MotionKpiCard label="Annual Memberships" value={stats.annual} icon={Calendar} color="#0D9488" bg="#F0FDFA" />
        <MotionKpiCard label="Expiring Soon" value={stats.expiringSoon} icon={Clock} color="#D97706" bg="#FEFCE8" />
        <MotionKpiCard label="Expired" value={stats.expired} icon={AlertTriangle} color="#DC2626" bg="#FEF2F2" />
        <MotionKpiCard label="Pending Review" value={stats.pendingReview} icon={Sparkles} color="#9333EA" bg="#FDF4FF" />
      </AnimatedKpiGrid>

      {/* 3. Search & Multi-Filter Toolbar */}
      <div style={{ background: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by faculty name, membership number, organization, department..."
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
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Organizations</option>
              <option value="IEEE">IEEE</option>
              <option value="ISTE">ISTE</option>
              <option value="CSI">CSI</option>
              <option value="IETE">IETE</option>
              <option value="IEI">IEI</option>
              <option value="ACM">ACM</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Types</option>
              <option value="Life Membership">Life Membership</option>
              <option value="Annual Membership">Annual Membership</option>
              <option value="Fellow">Fellow</option>
              <option value="Professional">Professional</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">Status: All</option>
              <option value="ACTIVE">Active</option>
              <option value="LIFETIME">Life Member</option>
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

            {(searchQuery || selectedDept !== 'ALL' || selectedOrg !== 'ALL' || selectedType !== 'ALL' || selectedStatus !== 'ALL' || selectedWorkflowStatus !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (currentUser?.role !== 'HOD') setSelectedDept('ALL');
                  setSelectedOrg('ALL');
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

      {/* 4. Memberships Data Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Faculty Member</th>
                <th style={{ padding: '0.85rem 1rem' }}>Department</th>
                <th style={{ padding: '0.85rem 1rem' }}>Organization</th>
                <th style={{ padding: '0.85rem 1rem' }}>Membership Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Membership No.</th>
                <th style={{ padding: '0.85rem 1rem' }}>Validity Period</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Approval</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMemberships.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    No faculty membership records found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredMemberships.map((item, idx) => {
                  const wfBadge = getWorkflowBadge(item.workflowStatus);
                  const valBadge = getValidityBadge(item.membershipStatus);
                  const WfIcon = wfBadge.icon;
                  const facultyObj = FACULTY_DATA.find(f => f.id === item.facultyId);

                  return (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }} className="hover:bg-slate-50">
                      <td style={{ padding: '0.85rem 1rem', maxWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <FacultyAvatar faculty={facultyObj || { name: item.facultyName }} size={36} shape="circle" />
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem' }}>
                              {item.facultyName}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                              {item.designation}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>{item.department}</span>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.academicYear}</div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', maxWidth: '220px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.organizationName || item.organization}
                        </div>
                        {item.verificationUrl && (
                          <a href={item.verificationUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: '#0284C7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            Verify Link <ExternalLink size={10} />
                          </a>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', background: '#F1F5F9', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          {item.membershipType}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>
                          {item.membershipNumber || 'Pending'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#D4AF37', fontWeight: 700 }}>
                          {item.membershipRecordNumber}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        {item.membershipType === 'Life Membership' ? (
                          <div style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 700 }}>Lifetime</div>
                        ) : (
                          <>
                            <div style={{ fontSize: '0.76rem', color: '#0F172A', fontWeight: 700 }}>
                              Until: {item.endDate || 'N/A'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                              From: {item.startDate || 'N/A'}
                            </div>
                          </>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          background: valBadge.bg,
                          color: valBadge.text,
                          border: `1px solid ${valBadge.border}`,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          whiteSpace: 'nowrap'
                        }}>
                          {valBadge.label}
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
                            title="View Membership Dossier"
                            style={{ padding: '0.35rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
                          >
                            <Eye size={13} />
                          </button>

                          {item.membershipType === 'Annual Membership' && canCreate && (
                            <button
                              type="button"
                              onClick={() => { setRenewalItem(item); setEditingItem(item); setWizardOpen(true); }}
                              title="Renew Annual Membership"
                              style={{ padding: '0.35rem 0.5rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', color: '#1D4ED8', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Renew
                            </button>
                          )}

                          {canReview && (
                            <button
                              type="button"
                              onClick={() => { setReviewModalItem(item); setReviewAction('APPROVE'); }}
                              title="Review / Approve Membership"
                              style={{ padding: '0.35rem 0.55rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: '#059669', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Review
                            </button>
                          )}

                          {canCreate && (
                            <button
                              type="button"
                              onClick={() => { setEditingItem(item); setRenewalItem(null); setWizardOpen(true); }}
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

      {/* 5. Membership Wizard Modal */}
      {wizardOpen && (
        <MembershipWizardModal
          isOpen={wizardOpen}
          onClose={() => { setWizardOpen(false); setEditingItem(null); setRenewalItem(null); }}
          initialData={editingItem}
          isRenewalMode={!!renewalItem}
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
            maxWidth: '780px',
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
                  {dossierModalItem.membershipRecordNumber} • {dossierModalItem.membershipType}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#FFFFFF', fontFamily: 'Cinzel, serif' }}>
                  {dossierModalItem.organizationName || dossierModalItem.organization}
                </h3>
              </div>
              <button type="button" onClick={() => setDossierModalItem(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Dossier Tabs */}
            <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0.5rem 1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
              {[
                { id: 'overview', label: 'Membership Overview' },
                { id: 'faculty', label: 'Faculty Profile' },
                { id: 'renewals', label: `Renewals (${dossierModalItem.renewals?.length || 0})` },
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
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Official Membership Number</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>{dossierModalItem.membershipNumber || 'Pending'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Validity Status</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#059669' }}>{dossierModalItem.membershipStatus}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Member Since</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.memberSince || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Academic Year</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>{dossierModalItem.academicYear}</div>
                    </div>
                  </div>

                  {dossierModalItem.remarks && (
                    <div>
                      <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Remarks</h4>
                      <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0 }}>{dossierModalItem.remarks}</p>
                    </div>
                  )}
                </div>
              )}

              {dossierActiveTab === 'faculty' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', background: '#F8FAFC', borderRadius: '12px' }}>
                  <FacultyAvatar faculty={FACULTY_DATA.find(f => f.id === dossierModalItem.facultyId) || { name: dossierModalItem.facultyName }} size={72} shape="circle" ringColor="#D4AF37" />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.2rem' }}>{dossierModalItem.facultyName}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{dossierModalItem.designation} • Department of {dossierModalItem.department}</div>
                    <div style={{ fontSize: '0.75rem', color: '#0284C7', marginTop: '0.25rem' }}>{dossierModalItem.email || 'faculty@nrtec.in'}</div>
                  </div>
                </div>
              )}

              {dossierActiveTab === 'renewals' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {dossierModalItem.renewals?.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>No historical renewals recorded yet.</div>
                  ) : (
                    dossierModalItem.renewals?.map((ren, i) => (
                      <div key={i} style={{ padding: '0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.82rem' }}>
                          Renewal on {ren.renewalDate} &rarr; Extended until {ren.newEndDate}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem' }}>
                          Receipt: {ren.receiptNumber || 'None'} • Renewed by: {ren.renewedBy}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {dossierActiveTab === 'evidence' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {dossierModalItem.documents?.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>No certificates attached.</div>
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
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Review & Approve Membership</h3>
              <div style={{ fontSize: '0.75rem', color: '#D4AF37' }}>{reviewModalItem.facultyName} ({reviewModalItem.organization})</div>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>DECISION *</label>
                <select value={reviewAction} onChange={(e) => setReviewAction(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}>
                  <option value="APPROVE">Approve & Verify (Institutional Accreditation)</option>
                  <option value="UNDER_REVIEW">Mark Under Verification</option>
                  <option value="REQUEST_REVISION">Request Revision / Proof from Faculty</option>
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
        title="Move Membership to Recycle Bin?"
        itemName={deleteConfirmItem?.membershipNumber || deleteConfirmItem?.id}
        itemType="membership"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmItem(null)}
      />
    </MotionPage>
  );
}
