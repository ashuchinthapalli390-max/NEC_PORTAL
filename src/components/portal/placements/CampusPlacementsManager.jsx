import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Building2, 
  UserCheck, 
  Users, 
  TrendingUp, 
  ExternalLink, 
  DollarSign, 
  Calendar,
  X,
  Sparkles,
  AlertTriangle
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
import { getCampusPlacements, saveCampusPlacement, deleteCampusPlacement, getStudents, exportToCSV, exportToPDF } from '../../../data/portalStore.js';
import { formatDateDDMMYYYY, isDateInRange } from '../../../lib/ui/dateUtils.js';
import ConfirmDeleteDialog from '../common/ConfirmDeleteDialog.jsx';

export default function CampusPlacementsManager({ currentUser, onDataChange }) {
  const [dataVersion, setDataVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAy, setSelectedAy] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState(
    currentUser?.role === 'HOD' ? (currentUser.dept || 'ALL') : 'ALL'
  );
  const [selectedOfferType, setSelectedOfferType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modal states
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [detailOffer, setDetailOffer] = useState(null);
  const [deleteConfirmOffer, setDeleteConfirmOffer] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const placementsList = useMemo(() => {
    return getCampusPlacements();
  }, [dataVersion]);

  const studentsMaster = useMemo(() => {
    return getStudents();
  }, []);

  // Filtered Placements
  const filteredPlacements = useMemo(() => {
    return placementsList.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (p.studentName || '').toLowerCase().includes(q) ||
        (p.studentRoll || '').toLowerCase().includes(q) ||
        (p.companyName || '').toLowerCase().includes(q) ||
        (p.role || '').toLowerCase().includes(q)
      );

      const matchesAy = selectedAy === 'ALL' || p.academicYear === selectedAy;
      const itemDept = p.department || p.departmentCode || '';
      const matchesDept = selectedDept === 'ALL' || itemDept === selectedDept || itemDept.includes(selectedDept);
      const matchesOfferType = selectedOfferType === 'ALL' || p.offerType === selectedOfferType || p.campusType === selectedOfferType;
      const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
      const matchesDate = isDateInRange(p.placementDate || p.driveDate || p.offerDate, fromDate, toDate);

      return matchesSearch && matchesAy && matchesDept && matchesOfferType && matchesStatus && matchesDate;
    });
  }, [placementsList, searchQuery, selectedAy, selectedDept, selectedOfferType, selectedStatus, fromDate, toDate]);

  // Real KPIs (strictly calculated from real canonical data)
  const stats = useMemo(() => {
    const totalOffers = filteredPlacements.length;
    const uniqueStudents = new Set(filteredPlacements.map(p => (p.studentRoll || '').trim().toUpperCase())).size;
    const hiringCompanies = new Set(filteredPlacements.map(p => (p.companyName || '').trim().toLowerCase())).size;

    const validPackages = filteredPlacements
      .map(p => p.packageLpa)
      .filter(pkg => typeof pkg === 'number' && !isNaN(pkg) && pkg > 0);

    const highestPackage = validPackages.length > 0 ? Math.max(...validPackages) : 0;
    const avgPackage = validPackages.length > 0 
      ? (validPackages.reduce((a, b) => a + b, 0) / validPackages.length).toFixed(2)
      : 0;

    // Median Package
    let medianPackage = 0;
    if (validPackages.length > 0) {
      const sorted = [...validPackages].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      medianPackage = sorted.length % 2 !== 0 ? sorted[mid] : ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2);
    }

    // Multiple Offer Students
    const studentOfferCounts = {};
    filteredPlacements.forEach(p => {
      const r = (p.studentRoll || '').trim().toUpperCase();
      studentOfferCounts[r] = (studentOfferCounts[r] || 0) + 1;
    });
    const multiOfferStudents = Object.values(studentOfferCounts).filter(c => c > 1).length;

    const onCampusCount = filteredPlacements.filter(p => p.campusType === 'On Campus' || p.driveType === 'On-Campus').length;
    const offCampusCount = filteredPlacements.filter(p => p.campusType === 'Off Campus' || p.driveType === 'Off-Campus').length;

    return {
      uniqueStudents,
      totalOffers,
      hiringCompanies,
      highestPackage: highestPackage > 0 ? `${highestPackage} LPA` : 'N/A',
      avgPackage: avgPackage > 0 ? `${avgPackage} LPA` : 'N/A',
      medianPackage: medianPackage > 0 ? `${medianPackage} LPA` : 'N/A',
      multiOfferStudents,
      onCampusCount,
      offCampusCount
    };
  }, [filteredPlacements]);

  // Form State
  const [formData, setFormData] = useState({
    studentRoll: '',
    studentName: '',
    department: currentUser?.role === 'HOD' ? (currentUser.dept || 'CYS') : 'CYS',
    academicYear: '2025-2026',
    companyName: '',
    role: '',
    offerType: '',
    packageLpa: '',
    stipendMonthly: '',
    offerDate: '',
    status: 'OFFERED'
  });

  const handleOpenCreate = () => {
    setEditingOffer(null);
    setFormData({
      studentRoll: '',
      studentName: '',
      department: currentUser?.role === 'HOD' ? (currentUser.dept || 'CYS') : 'CYS',
      academicYear: '2025-2026',
      companyName: '',
      role: '',
      offerType: '',
      packageLpa: '',
      stipendMonthly: '',
      offerDate: '',
      status: 'OFFERED'
    });
    setWizardOpen(true);
  };

  const handleOpenEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      ...offer,
      packageLpa: offer.packageLpa != null ? offer.packageLpa.toString() : ''
    });
    setWizardOpen(true);
  };

  const handleRollChange = (roll) => {
    const cleanRoll = roll.trim().toUpperCase();
    const found = studentsMaster.find(sm => (sm.rollNumber || '').toUpperCase() === cleanRoll);
    setFormData(prev => ({
      ...prev,
      studentRoll: roll,
      studentName: found ? (found.name || found.fullName || '') : prev.studentName,
      department: found && found.department ? found.department : prev.department,
      matchStatus: found ? 'MATCHED' : 'UNMATCHED'
    }));
  };

  const handleSavePlacement = (e) => {
    e.preventDefault();
    if (!formData.studentRoll.trim() || !formData.companyName.trim()) {
      showToast('Please provide Student Roll Number and Company Name.');
      return;
    }

    const payload = {
      ...formData,
      packageLpa: formData.packageLpa !== '' && !isNaN(formData.packageLpa) ? Number(formData.packageLpa) : null,
      stipendMonthly: formData.stipendMonthly ? Number(formData.stipendMonthly) : null
    };

    const saved = saveCampusPlacement(payload, currentUser);
    setDataVersion(v => v + 1);
    setWizardOpen(false);
    showToast(`Placement record for "${saved.studentName || saved.studentRoll}" at ${saved.companyName} saved.`);
    if (onDataChange) onDataChange();
  };

  const handleDelete = () => {
    if (!deleteConfirmOffer) return;
    deleteCampusPlacement(deleteConfirmOffer.id);
    setDataVersion(v => v + 1);
    setDeleteConfirmOffer(null);
    showToast('Placement offer removed.');
    if (onDataChange) onDataChange();
  };

  const handleExportCSV = () => {
    const exportRows = filteredPlacements.map(p => ({
      'Roll Number': p.studentRoll,
      'Student Name': p.studentName,
      'Department': p.department,
      'Academic Year': p.academicYear,
      'Company Name': p.companyName,
      'Designation / Role': p.role || '—',
      'Campus Type': p.campusType || p.offerType || '—',
      'Package (LPA)': p.packageLpa != null ? p.packageLpa : 'N/A',
      'Status': p.status || 'Placed'
    }));
    exportToCSV(exportRows, `ET_Campus_Placements_${selectedAy}`);
    showToast('Exported filtered placement records to CSV.');
  };

  const handleExportPDF = () => {
    const headers = ['Roll No', 'Student Name', 'Dept', 'Company', 'Package', 'Campus Type', 'Status'];
    const rows = filteredPlacements.map(p => [
      p.studentRoll,
      p.studentName,
      p.department,
      p.companyName,
      p.packageLpa != null ? `${p.packageLpa} LPA` : 'N/A',
      p.campusType || p.offerType || '—',
      p.status || 'Placed'
    ]);
    exportToPDF('Campus Placements Report (Emerging Technologies)', headers, rows, `ET_Placements_${selectedAy}`);
    showToast('Exported filtered placement records to PDF.');
  };

  return (
    <MotionPage style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <ModulePageHeader
        breadcrumbs={[
          { label: 'Portal', onClick: () => {} },
          { label: 'Placements & Career', onClick: () => {} },
          { label: 'Campus Placements' }
        ]}
        title="Campus Placements"
        subtitle="Student placement outcomes, enterprise offers, salary packages, and career milestone tracking."
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
          label: 'Record Placement Offer',
          icon: Plus,
          onClick: handleOpenCreate
        }}
      />

      {/* KPI Summary Grid - Primary Institutional Cards */}
      <AnimatedKpiGrid minWidth="150px">
        <MotionKpiCard
          label="Students Placed"
          value={stats.uniqueStudents}
          subtext="Unique placed students"
          icon={UserCheck}
          color="#059669"
          bg="#ECFDF5"
        />
        <MotionKpiCard
          label="Total Offers"
          value={stats.totalOffers}
          subtext="Offer records"
          icon={Award}
          color="#2563EB"
          bg="#EFF6FF"
        />
        <MotionKpiCard
          label="Highest Package"
          value={stats.highestPackage}
          subtext="Top Campus CTC"
          icon={DollarSign}
          color="#D97706"
          bg="#FEFCE8"
        />
        <MotionKpiCard
          label="Average Package"
          value={stats.avgPackage}
          subtext="Mean Cohort CTC"
          icon={TrendingUp}
          color="#7C3AED"
          bg="#F5F3FF"
        />
        <MotionKpiCard
          label="Companies Hiring"
          value={stats.hiringCompanies}
          subtext="Hiring partners"
          icon={Building2}
          color="#0284C7"
          bg="#F0F9FF"
        />
        <MotionKpiCard
          label="Median Package"
          value={stats.medianPackage}
          subtext="Cohort median CTC"
          icon={Sparkles}
          color="#475569"
          bg="#F8FAFC"
        />
      </AnimatedKpiGrid>

      {/* Filter Bar - Institutional White Surface */}
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
              placeholder="Search by student roll, name, company, or role..."
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
              <option value="2025-2026">2025-2026</option>
              <option value="2026-27">2026-2027</option>
              <option value="2024-2025">2024-2025</option>
            </select>

            {/* Campus / Offer Type */}
            <select
              value={selectedOfferType}
              onChange={(e) => setSelectedOfferType(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Drive Types</option>
              <option value="On Campus">On Campus</option>
              <option value="Off Campus">Off Campus</option>
              <option value="Full-Time">Full-Time</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Statuses</option>
              <option value="OFFERED">Offered</option>
              <option value="SELECTED">Selected</option>
              <option value="JOINED">Joined</option>
              <option value="DUPLICATE_CANDIDATE">Duplicate Flag</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
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

            {(searchQuery || selectedDept !== 'ALL' || selectedAy !== 'ALL' || selectedOfferType !== 'ALL' || selectedStatus !== 'ALL' || fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (currentUser?.role !== 'HOD') setSelectedDept('ALL');
                  setSelectedAy('ALL');
                  setSelectedOfferType('ALL');
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

      {/* Table - White Institutional Container */}
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
                <th style={{ padding: '0.85rem 1rem' }}>Company & Role</th>
                <th style={{ padding: '0.85rem 1rem' }}>Package (CTC)</th>
                <th style={{ padding: '0.85rem 1rem' }}>Campus Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Review / Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlacements.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    No campus placement records found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredPlacements.map(placement => {
                  const isDuplicate = placement.status === 'DUPLICATE_CANDIDATE' || placement.duplicateCandidate;
                  const hasConflict = placement.departmentConflict || placement.status === 'NEEDS_REVIEW';

                  return (
                    <tr
                      key={placement.id}
                      style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                      className="hover:bg-slate-50"
                    >
                      {/* Roll No & Student */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.82rem' }}>
                          {placement.studentRoll || 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          {placement.studentName || '—'}
                        </div>
                      </td>

                      {/* Department & AY */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>
                          {placement.department || placement.departmentCode || '—'}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          {placement.academicYear || '—'}
                        </div>
                      </td>

                      {/* Company & Role */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem' }}>
                          {placement.companyName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          {placement.role || '—'}
                        </div>
                      </td>

                      {/* Package */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {placement.packageLpa != null ? (
                          <span style={{ fontWeight: 800, color: '#059669', fontSize: '0.82rem', background: '#ECFDF5', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                            ₹{placement.packageLpa} LPA
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>
                            Unspecified
                          </span>
                        )}
                      </td>

                      {/* Campus Type */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                          {placement.campusType || placement.offerType || 'On Campus'}
                        </span>
                      </td>

                      {/* Status & Review Badges */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                          {isDuplicate ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              background: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              fontSize: '0.68rem',
                              fontWeight: 800
                            }}>
                              <AlertTriangle size={10} />
                              Duplicate Candidate
                            </span>
                          ) : hasConflict ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              background: '#FEFCE8',
                              color: '#D97706',
                              border: '1px solid #FEF08A',
                              fontSize: '0.68rem',
                              fontWeight: 800
                            }}>
                              <AlertTriangle size={10} />
                              Dept Review Required
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              background: '#ECFDF5',
                              color: '#059669',
                              border: '1px solid #A7F3D0',
                              fontSize: '0.68rem',
                              fontWeight: 800
                            }}>
                              <CheckCircle2 size={10} />
                              {placement.status || 'Placed'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => setDetailOffer(placement)}
                            title="View Placement Details"
                            style={{ padding: '0.35rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(placement)}
                            title="Edit Record"
                            style={{ padding: '0.35rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', color: '#1D4ED8', cursor: 'pointer' }}
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmOffer(placement)}
                            title="Delete Record"
                            style={{ padding: '0.35rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#DC2626', cursor: 'pointer' }}
                          >
                            <Trash2 size={13} />
                          </button>
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
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ background: '#0F172A', padding: '1.25rem 1.5rem', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                {editingOffer ? `Edit Placement: ${formData.studentRoll}` : 'Record Student Placement Offer'}
              </h3>
              <button type="button" onClick={() => setWizardOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlacement} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Roll & Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    STUDENT ROLL NO *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.studentRoll}
                    onChange={(e) => handleRollChange(e.target.value)}
                    placeholder="e.g. 22471A4201"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    STUDENT NAME
                  </label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                    placeholder="Student Name"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Dept & AY */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    DEPARTMENT *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFFFFF' }}
                  >
                    <option value="CYS">Cyber Security (CYS)</option>
                    <option value="DS">Data Science (DS)</option>
                    <option value="AI">Artificial Intelligence (AI)</option>
                    <option value="AIML">AI & ML (AIML)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    ACADEMIC YEAR
                  </label>
                  <select
                    value={formData.academicYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFFFFF' }}
                  >
                    <option value="2025-2026">2025-2026</option>
                    <option value="2026-27">2026-2027</option>
                    <option value="2024-2025">2024-2025</option>
                  </select>
                </div>
              </div>

              {/* Company & Role */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    COMPANY NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="e.g. SAVANTIS, TCS"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    DESIGNATION / ROLE
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="Optional if unstated"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Package & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    PACKAGE (LPA)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.packageLpa}
                    onChange={(e) => setFormData(prev => ({ ...prev, packageLpa: e.target.value }))}
                    placeholder="Leave blank if unspecified"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    STATUS
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFFFFF' }}
                  >
                    <option value="OFFERED">Offered</option>
                    <option value="SELECTED">Selected</option>
                    <option value="JOINED">Joined</option>
                    <option value="NEEDS_REVIEW">Needs Review</option>
                  </select>
                </div>
              </div>

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
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  {editingOffer ? 'Save Changes' : 'Record Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailOffer && (
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
                  {detailOffer.studentRoll} • {detailOffer.department}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#FFFFFF' }}>
                  {detailOffer.studentName || detailOffer.studentRoll}
                </h3>
              </div>
              <button type="button" onClick={() => setDetailOffer(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#F8FAFC' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Hiring Company</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>{detailOffer.companyName}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Salary Package</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#059669' }}>
                  {detailOffer.packageLpa != null ? `₹${detailOffer.packageLpa} LPA` : 'Unspecified'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Campus Drive Type</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0F172A' }}>
                  {detailOffer.campusType || detailOffer.offerType || 'On Campus'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Academic Year</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0F172A' }}>
                  {detailOffer.academicYear}
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDetailOffer(null)}
                style={{ padding: '0.45rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmOffer && (
        <ConfirmDeleteDialog
          isOpen={Boolean(deleteConfirmOffer)}
          title="Delete Placement Record?"
          itemName={`${deleteConfirmOffer?.studentRoll} at ${deleteConfirmOffer?.companyName}`}
          itemType="placement offer"
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirmOffer(null)}
        />
      )}
    </MotionPage>
  );
}
