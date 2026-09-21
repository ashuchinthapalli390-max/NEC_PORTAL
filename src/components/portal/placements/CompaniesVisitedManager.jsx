import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Globe, 
  Briefcase, 
  Users, 
  Award, 
  MapPin, 
  ShieldCheck, 
  ExternalLink,
  DollarSign,
  X
} from 'lucide-react';
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
import { ET_DEPARTMENTS } from '../../../data/masterData.js';
import { 
  getCompanyVisits, 
  saveCompanyVisit, 
  deleteCompanyVisit,
  exportToCSV,
  exportToPDF
} from '../../../data/portalStore.js';
import ConfirmDeleteDialog from '../common/ConfirmDeleteDialog.jsx';

export default function CompaniesVisitedManager({ currentUser, onDataChange }) {
  const [dataVersion, setDataVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAy, setSelectedAy] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState(
    currentUser?.role === 'HOD' ? (currentUser.dept || 'ALL') : 'ALL'
  );
  const [selectedDriveType, setSelectedDriveType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal states
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const [detailVisit, setDetailVisit] = useState(null);
  const [deleteConfirmVisit, setDeleteConfirmVisit] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const visitsList = useMemo(() => {
    return getCompanyVisits();
  }, [dataVersion]);

  // Filtered Visits
  const filteredVisits = useMemo(() => {
    return visitsList.filter(v => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        v.companyName.toLowerCase().includes(q) ||
        (v.sector || '').toLowerCase().includes(q) ||
        (v.rolesOffered || []).some(r => (r.roleTitle || '').toLowerCase().includes(q))
      );

      const matchesAy = selectedAy === 'ALL' || v.academicYear === selectedAy;
      const matchesDept = selectedDept === 'ALL' || (v.eligibleDepartments || []).includes(selectedDept);
      const matchesDriveType = selectedDriveType === 'ALL' || v.driveType === selectedDriveType;
      const matchesStatus = selectedStatus === 'ALL' || v.status === selectedStatus;

      return matchesSearch && matchesAy && matchesDept && matchesDriveType && matchesStatus;
    });
  }, [visitsList, searchQuery, selectedAy, selectedDept, selectedDriveType, selectedStatus]);

  // KPIs
  const stats = useMemo(() => {
    const totalVisits = filteredVisits.length;
    const uniqueCompanies = new Set(filteredVisits.map(v => v.companyName.trim().toLowerCase())).size;
    const activeDrives = filteredVisits.filter(v => v.status === 'Ongoing' || v.status === 'Scheduled').length;
    const totalOffers = filteredVisits.reduce((acc, v) => acc + (v.offersCount != null ? Number(v.offersCount) : 0), 0);

    return {
      totalVisits,
      uniqueCompanies,
      activeDrives,
      totalOffers
    };
  }, [filteredVisits]);

  // Wizard Form State
  const [formData, setFormData] = useState({
    companyName: '',
    sector: '',
    companyType: '',
    website: '',
    academicYear: '2025-2026',
    visitDate: '',
    driveType: 'On-Campus',
    mode: 'In-Person',
    venue: '',
    status: 'Scheduled',
    eligibleDepartments: [],
    roleTitle: '',
    ctcLpa: '',
    stipendMonthly: '',
    eligibleCount: '',
    attendedCount: '',
    shortlistedCount: '',
    selectedCount: '',
    offersCount: '',
    hrContactName: '',
    hrEmail: '',
    hrPhone: ''
  });

  const handleOpenCreate = () => {
    setEditingVisit(null);
    setFormData({
      companyName: '',
      sector: '',
      companyType: '',
      website: '',
      academicYear: '2025-2026',
      visitDate: '',
      driveType: 'On-Campus',
      mode: 'In-Person',
      venue: '',
      status: 'Scheduled',
      eligibleDepartments: currentUser?.role === 'HOD' ? [currentUser.dept] : [],
      roleTitle: '',
      ctcLpa: '',
      stipendMonthly: '',
      eligibleCount: '',
      attendedCount: '',
      shortlistedCount: '',
      selectedCount: '',
      offersCount: '',
      hrContactName: '',
      hrEmail: '',
      hrPhone: ''
    });
    setWizardOpen(true);
  };

  const handleOpenEdit = (visit) => {
    setEditingVisit(visit);
    setFormData({
      ...visit,
      roleTitle: visit.rolesOffered?.[0]?.roleTitle || '',
      ctcLpa: visit.rolesOffered?.[0]?.ctcLpa || '',
      stipendMonthly: visit.rolesOffered?.[0]?.stipendMonthly || ''
    });
    setWizardOpen(true);
  };

  const handleToggleDept = (code) => {
    setFormData(prev => {
      const exists = prev.eligibleDepartments.includes(code);
      return {
        ...prev,
        eligibleDepartments: exists 
          ? prev.eligibleDepartments.filter(c => c !== code)
          : [...prev.eligibleDepartments, code]
      };
    });
  };

  const handleSaveVisit = (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      showToast('Please enter the Company Name.');
      return;
    }

    const payload = {
      ...formData,
      rolesOffered: formData.roleTitle ? [
        {
          roleTitle: formData.roleTitle,
          ctcLpa: formData.ctcLpa ? Number(formData.ctcLpa) : null,
          stipendMonthly: formData.stipendMonthly ? Number(formData.stipendMonthly) : null
        }
      ] : [],
      eligibleCount: formData.eligibleCount ? Number(formData.eligibleCount) : null,
      attendedCount: formData.attendedCount ? Number(formData.attendedCount) : null,
      shortlistedCount: formData.shortlistedCount ? Number(formData.shortlistedCount) : null,
      selectedCount: formData.selectedCount ? Number(formData.selectedCount) : null,
      offersCount: formData.offersCount ? Number(formData.offersCount) : null
    };

    const saved = saveCompanyVisit(payload, currentUser);
    setDataVersion(v => v + 1);
    setWizardOpen(false);
    showToast(`Company visit for "${saved.companyName}" recorded successfully.`);
    if (onDataChange) onDataChange();
  };

  const handleDelete = () => {
    if (!deleteConfirmVisit) return;
    deleteCompanyVisit(deleteConfirmVisit.id);
    setDataVersion(v => v + 1);
    setDeleteConfirmVisit(null);
    showToast('Company visit deleted.');
    if (onDataChange) onDataChange();
  };

  const handleExportCSV = () => {
    const exportRows = filteredVisits.map(v => ({
      'Company Name': v.companyName,
      'Sector': v.sector || '—',
      'Company Type': v.companyType || '—',
      'Academic Year': v.academicYear || '—',
      'Visit Date': v.visitDate || '—',
      'Drive Type': v.driveType || '—',
      'Mode': v.mode || '—',
      'Status': v.status || '—',
      'Eligible ET Depts': (v.eligibleDepartments || []).join(', ') || '—',
      'Roles Offered': (v.rolesOffered || []).map(r => `${r.roleTitle} (${r.ctcLpa} LPA)`).join('; ') || '—',
      'Total Offers': v.offersCount != null ? v.offersCount : 'N/A'
    }));
    exportToCSV(exportRows, `ET_Companies_Visited_${selectedAy}`);
    showToast('Exported filtered company visits to CSV.');
  };

  const handleExportPDF = () => {
    const headers = ['Company', 'Sector', 'Visit Date', 'Drive Type', 'Eligible Depts', 'Roles (CTC)', 'Offers', 'Status'];
    const rows = filteredVisits.map(v => [
      v.companyName,
      v.sector || '—',
      v.visitDate || '—',
      v.driveType || '—',
      (v.eligibleDepartments || []).join(', ') || '—',
      (v.rolesOffered || []).map(r => `${r.roleTitle} (${r.ctcLpa}L)`).join(', ') || '—',
      v.offersCount != null ? v.offersCount.toString() : '-',
      v.status || '—'
    ]);
    exportToPDF('Companies Visited & Recruitment Drives (ET Departments)', headers, rows, `ET_Companies_Visited_${selectedAy}`);
    showToast('Exported filtered company visits to PDF.');
  };

  return (
    <MotionPage style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <ModulePageHeader
        breadcrumbs={[
          { label: 'Portal', onClick: () => {} },
          { label: 'Placements & Career', onClick: () => {} },
          { label: 'Companies Visited' }
        ]}
        title="Companies Visited"
        subtitle="Recruitment drives, hiring schedules, corporate partner visits, and selection rounds for ET cohorts."
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
              <Download size={14} /> PDF
            </button>
          </div>
        }
        primaryAction={{
          label: 'Record Company Drive',
          icon: Plus,
          onClick: handleOpenCreate
        }}
      />

      {/* KPI Grid - Institutional Theme */}
      <AnimatedKpiGrid minWidth="150px">
        <MotionKpiCard
          label="Unique Companies"
          value={stats.uniqueCompanies}
          subtext="Corporate Employers"
          icon={Building2}
          color="#2563EB"
          bg="#EFF6FF"
        />
        <MotionKpiCard
          label="Total Drives"
          value={stats.totalVisits}
          subtext="Recruitment Events"
          icon={Briefcase}
          color="#059669"
          bg="#ECFDF5"
        />
        <MotionKpiCard
          label="Active Drives"
          value={stats.activeDrives}
          subtext="Scheduled / Ongoing"
          icon={Clock}
          color="#D97706"
          bg="#FEFCE8"
        />
        <MotionKpiCard
          label="Total Offers"
          value={stats.totalOffers}
          subtext="Resulting from Drives"
          icon={Award}
          color="#7C3AED"
          bg="#F5F3FF"
        />
      </AnimatedKpiGrid>

      {/* Filters Bar - Institutional White Surface */}
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
          {/* Search */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, sector, role..."
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
            </select>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              disabled={currentUser?.role === 'HOD'}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All</option>
              {ET_DEPARTMENTS.map(d => (
                <option key={d.code} value={d.code}>{d.code}</option>
              ))}
            </select>

            {/* Drive Type */}
            <select
              value={selectedDriveType}
              onChange={(e) => setSelectedDriveType(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Drive Types</option>
              <option value="On-Campus">On-Campus</option>
              <option value="Off-Campus">Off-Campus</option>
              <option value="Pool Campus">Pool Campus</option>
              <option value="Virtual">Virtual</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>

            {(searchQuery || selectedAy !== 'ALL' || selectedDept !== 'ALL' || selectedDriveType !== 'ALL' || selectedStatus !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedAy('ALL');
                  if (currentUser?.role !== 'HOD') setSelectedDept('ALL');
                  setSelectedDriveType('ALL');
                  setSelectedStatus('ALL');
                }}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table - Institutional White Container */}
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
                <th style={{ padding: '0.85rem 1rem' }}>Company Name</th>
                <th style={{ padding: '0.85rem 1rem' }}>Sector / Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Drive Date</th>
                <th style={{ padding: '0.85rem 1rem' }}>Drive Mode</th>
                <th style={{ padding: '0.85rem 1rem' }}>Eligible Departments</th>
                <th style={{ padding: '0.85rem 1rem' }}>Roles Offered</th>
                <th style={{ padding: '0.85rem 1rem' }}>Selection Results</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    No companies visited records found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredVisits.map(visit => (
                  <tr
                    key={visit.id}
                    style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                    className="hover:bg-slate-50"
                  >
                    {/* Company Name */}
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.82rem' }}>
                        {visit.companyName}
                      </div>
                    </td>

                    {/* Sector / Type */}
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {visit.sector || '—'} {visit.companyType ? `• ${visit.companyType}` : ''}
                      </div>
                    </td>

                    {/* Drive Date */}
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 600 }}>
                        {visit.visitDate || 'Date TBD'}
                      </div>
                    </td>

                    {/* Drive Mode */}
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                        {visit.driveType || '—'} {visit.mode ? `(${visit.mode})` : ''}
                      </div>
                    </td>

                    {/* Eligible Branches */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {(visit.eligibleDepartments || []).map(d => (
                          <span
                            key={d}
                            style={{
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              border: '1px solid #DBEAFE'
                            }}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Roles */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {(visit.rolesOffered || []).map((r, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', color: '#0F172A', fontWeight: 600 }}>
                          {r.roleTitle} {r.ctcLpa ? `(${r.ctcLpa} LPA)` : ''}
                        </div>
                      ))}
                    </td>

                    {/* Selection Results */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {visit.offersCount != null ? (
                        <span style={{ fontWeight: 700, color: '#059669', fontSize: '0.8rem' }}>
                          {visit.offersCount} Offers
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Pending</span>
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
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        background: visit.status === 'Completed' ? '#ECFDF5' : '#FEFCE8',
                        color: visit.status === 'Completed' ? '#059669' : '#D97706',
                        border: `1px solid ${visit.status === 'Completed' ? '#A7F3D0' : '#FEF08A'}`
                      }}>
                        {visit.status || 'Scheduled'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => setDetailVisit(visit)}
                          title="View Details"
                          style={{ padding: '0.35rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(visit)}
                          title="Edit Drive"
                          style={{ padding: '0.35rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', color: '#1D4ED8', cursor: 'pointer' }}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmVisit(visit)}
                          title="Delete Drive"
                          style={{ padding: '0.35rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#DC2626', cursor: 'pointer' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wizard Modal */}
      {wizardOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 15, 30, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '580px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ background: '#0F172A', padding: '1.25rem 1.5rem', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                {editingVisit ? `Edit Drive: ${formData.companyName}` : 'Record Company Recruitment Drive'}
              </h3>
              <button type="button" onClick={() => setWizardOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVisit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    COMPANY NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="e.g. Infosys, TCS, Cognizant, Cisco"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    COMPANY TYPE
                  </label>
                  <select
                    value={formData.companyType}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyType: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFFFFF' }}
                  >
                    <option value="">Select Type</option>
                    <option value="MNC">MNC</option>
                    <option value="Product">Product Company</option>
                    <option value="Service">Service Company</option>
                    <option value="Startup">Startup</option>
                    <option value="Core">Core Engineering</option>
                  </select>
                </div>
              </div>

              {/* Grid 2: Date, Drive Type, Status, AY */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>DRIVE DATE</label>
                  <input
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, visitDate: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>DRIVE TYPE</label>
                  <select
                    value={formData.driveType}
                    onChange={(e) => setFormData(prev => ({ ...prev, driveType: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFFFFF' }}
                  >
                    <option value="On-Campus">On-Campus</option>
                    <option value="Off-Campus">Off-Campus</option>
                    <option value="Pool Campus">Pool Campus</option>
                    <option value="Virtual">Virtual</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>DRIVE STATUS</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFFFFF' }}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Eligible ET Departments Checkboxes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                  ELIGIBLE ET DEPARTMENTS
                </label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {ET_DEPARTMENTS.map(d => (
                    <label key={d.code} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0F172A', fontSize: '0.82rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.eligibleDepartments.includes(d.code)}
                        onChange={() => handleToggleDept(d.code)}
                      />
                      {d.code}
                    </label>
                  ))}
                </div>
              </div>

              {/* Role & Package */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>ROLE TITLE</label>
                  <input
                    type="text"
                    value={formData.roleTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, roleTitle: e.target.value }))}
                    placeholder="Optional if unspecified"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>CTC (LPA)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.ctcLpa}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctcLpa: e.target.value }))}
                    placeholder="e.g. 7.5"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Total Offers */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>TOTAL OFFERS ISSUED</label>
                <input
                  type="number"
                  value={formData.offersCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, offersCount: e.target.value }))}
                  placeholder="Offers Count"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setWizardOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  {editingVisit ? 'Save Changes' : 'Record Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Dossier Modal */}
      {detailVisit && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 15, 30, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ background: '#0F172A', padding: '1.25rem 1.5rem', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 800 }}>
                  {detailVisit.sector} {detailVisit.companyType ? `• ${detailVisit.companyType}` : ''}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#FFFFFF' }}>
                  {detailVisit.companyName}
                </h3>
              </div>
              <button type="button" onClick={() => setDetailVisit(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#F8FAFC' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Drive Date</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>{detailVisit.visitDate || 'Date TBD'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Format / Mode</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>{detailVisit.driveType} ({detailVisit.mode || 'In-Person'})</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Offers Issued</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#059669' }}>
                  {detailVisit.offersCount != null ? `${detailVisit.offersCount} Offers` : 'Pending'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Eligible Departments</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0F172A' }}>
                  {(detailVisit.eligibleDepartments || []).join(', ') || 'All ET'}
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDetailVisit(null)}
                style={{ padding: '0.45rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmVisit && (
        <ConfirmDeleteDialog
          isOpen={Boolean(deleteConfirmVisit)}
          title="Delete Company Drive Record?"
          itemName={`${deleteConfirmVisit.companyName} on ${deleteConfirmVisit.visitDate || 'scheduled date'}`}
          itemType="recruitment drive"
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirmVisit(null)}
        />
      )}

      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          padding: '0.75rem 1.25rem',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          borderRadius: '8px',
          color: '#F8FAFC',
          fontSize: '0.88rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 9999
        }}>
          {toastMessage}
        </div>
      )}
    </MotionPage>
  );
}
