import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  Search, 
  Filter, 
  Phone, 
  PhoneCall, 
  Mail, 
  UserCheck, 
  UserX, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Sliders, 
  RefreshCw, 
  Layers, 
  HelpCircle, 
  FileText,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  X,
  Plus,
  BookOpen,
  Building2,
  ExternalLink
} from 'lucide-react';
import { 
  getAttendanceAlerts, 
  getAttendanceSnapshotDetail, 
  logParentContact, 
  getAttendanceParentContacts,
  getAttendanceImportHistory,
  parseAndValidateAttendanceCSV,
  executeAttendanceImport,
  exportAttendanceRiskList,
  generateParentContactSheetPDF,
  getStudents,
  maskPhoneNumber,
  getAttendanceBatches,
  replacePreviousMonthAttendance,
  removeAttendanceBatch,
  clearCurrentAttendance
} from '../../../data/portalStore.js';
import { ET_DEPARTMENTS } from '../../../data/masterData.js';
import { formatDateDDMMYYYY } from '../../../lib/ui/dateUtils.js';

export default function AttendanceRiskManager({ currentUser, onDataChange }) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('risk-list'); // 'risk-list' | 'upload-wizard' | 'contact-ledger' | 'student-directory' | 'import-history'
  
  // Data State
  const [dataVersion, setDataVersion] = useState(0);
  const [threshold, setThreshold] = useState(65.0);
  
  // Filters
  const [deptFilter, setDeptFilter] = useState(currentUser?.role === 'HOD' && currentUser?.dept ? currentUser.dept : 'ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Student Profile Drawer State
  const [selectedStudentRoll, setSelectedStudentRoll] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);

  // Parent Contact Modal State
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactTargetAlert, setContactTargetAlert] = useState(null);
  const [contactForm, setContactForm] = useState({
    method: 'PHONE',
    status: 'CONTACTED',
    notes: '',
    followUpDate: ''
  });
  const [showUnmaskedPhone, setShowUnmaskedPhone] = useState(false);

  // Upload Wizard State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadText, setUploadText] = useState('');
  const [uploadSha256, setUploadSha256] = useState('');
  const [wizardStep, setWizardStep] = useState(1); // 1: Select/Paste, 2: Column Mapping, 3: Validation & Preview
  const [customMapping, setCustomMapping] = useState({});
  const [cohortMeta, setCohortMeta] = useState({
    academicYear: '2026-27',
    departmentCode: currentUser?.dept && currentUser?.dept !== 'Management & Governance' ? currentUser.dept : 'CYS',
    year: 'III',
    semester: 'III-I',
    section: 'A',
    threshold: 65.0
  });
  const [parsedImportResult, setParsedImportResult] = useState(null);
  const [importingInProgress, setImportingInProgress] = useState(false);
  const [importNotification, setImportNotification] = useState(null);

  // Load Alerts
  const alertsList = useMemo(() => {
    return getAttendanceAlerts({
      department: deptFilter,
      year: yearFilter,
      semester: semesterFilter,
      section: sectionFilter,
      severity: severityFilter,
      status: statusFilter,
      search: searchQuery
    }, currentUser);
  }, [deptFilter, yearFilter, semesterFilter, sectionFilter, severityFilter, statusFilter, searchQuery, dataVersion, currentUser]);

  // Load Contacts Ledger
  const contactsLedger = useMemo(() => {
    return getAttendanceParentContacts();
  }, [dataVersion]);

  // Load Import History
  const importHistory = useMemo(() => {
    return getAttendanceImportHistory();
  }, [dataVersion]);

  // Load Attendance Batches
  const attendanceBatches = useMemo(() => {
    return getAttendanceBatches();
  }, [dataVersion]);

  const hasAttendanceData = (importHistory && importHistory.length > 0) || (attendanceBatches && attendanceBatches.length > 0);

  // Load Students Master
  const studentsList = useMemo(() => {
    return getStudents({
      department: deptFilter,
      year: yearFilter,
      semester: semesterFilter,
      section: sectionFilter,
      search: searchQuery
    });
  }, [deptFilter, yearFilter, semesterFilter, sectionFilter, searchQuery, dataVersion]);

  // Statistics KPI
  const stats = useMemo(() => {
    const totalAlerts = alertsList.length;
    const criticalCount = alertsList.filter(a => a.riskSeverity === 'CRITICAL').length;
    const highRiskCount = alertsList.filter(a => a.riskSeverity === 'HIGH_RISK').length;
    const lowAttCount = alertsList.filter(a => a.riskSeverity === 'LOW_ATTENDANCE').length;
    const contactedCount = alertsList.filter(a => a.status === 'PARENT_CONTACTED' || a.status === 'RESOLVED').length;
    const pendingCount = alertsList.filter(a => a.status === 'OPEN').length;

    return {
      totalAlerts,
      criticalCount,
      highRiskCount,
      lowAttCount,
      contactedCount,
      pendingCount
    };
  }, [alertsList]);

  // Drawer Opener
  const handleOpenStudentDrawer = (rollNumber) => {
    setSelectedStudentRoll(rollNumber);
    const detail = getAttendanceSnapshotDetail(rollNumber, currentUser);
    setStudentDetail(detail);
    setShowUnmaskedPhone(false);
  };

  const handleCloseStudentDrawer = () => {
    setSelectedStudentRoll(null);
    setStudentDetail(null);
  };

  // Contact Modal Opener
  const handleOpenContactModal = (alert) => {
    setContactTargetAlert(alert);
    setContactForm({
      method: 'PHONE',
      status: 'CONTACTED',
      notes: '',
      followUpDate: ''
    });
    setContactModalOpen(true);
  };

  const handleSubmitParentContact = () => {
    if (!contactTargetAlert) return;
    const res = logParentContact({
      alertId: contactTargetAlert.id,
      rollNumber: contactTargetAlert.rollNumber,
      contactMethod: contactForm.method,
      contactStatus: contactForm.status,
      notes: contactForm.notes,
      followUpDate: contactForm.followUpDate
    }, currentUser);

    if (res.success) {
      setContactModalOpen(false);
      setDataVersion(v => v + 1);
      // Refresh student drawer if open
      if (selectedStudentRoll === contactTargetAlert.rollNumber) {
        setStudentDetail(getAttendanceSnapshotDetail(selectedStudentRoll, currentUser));
      }
    }
  };

  // File Upload Handlers
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadFile(file);
    const text = await file.text();
    setUploadText(text);

    // Compute SHA-256 hash
    if (window.crypto && window.crypto.subtle) {
      try {
        const msgBuffer = new TextEncoder().encode(text);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setUploadSha256(hashHex);
      } catch (err) {
        setUploadSha256(`sha256_mock_${Date.now()}`);
      }
    }

    // Automatically parse with default mapping
    const parsed = parseAndValidateAttendanceCSV(text, {}, cohortMeta.threshold);
    setParsedImportResult(parsed);
    setWizardStep(2);
  };

  const handleApplyMappingAndValidate = () => {
    if (!uploadText) return;
    const parsed = parseAndValidateAttendanceCSV(uploadText, customMapping, cohortMeta.threshold);
    setParsedImportResult(parsed);
    setWizardStep(3);
  };

  const handleExecuteAttendanceCommit = () => {
    if (!parsedImportResult || !parsedImportResult.aggregatedStudents) return;

    setImportingInProgress(true);
    setTimeout(() => {
      const res = executeAttendanceImport(parsedImportResult, {
        ...cohortMeta,
        filename: uploadFile?.name || 'attendance_upload.csv',
        sha256: uploadSha256 || `sha256_${Date.now()}`
      }, currentUser);

      setImportingInProgress(false);
      if (res.success) {
        setImportNotification({
          type: 'success',
          message: `Successfully imported ${res.totalStudents} student attendance records. Created ${res.alertsCreated} attendance risk alerts.`
        });
        setDataVersion(v => v + 1);
        setWizardStep(1);
        setUploadFile(null);
        setUploadText('');
        setParsedImportResult(null);
        setActiveTab('risk-list');
        if (onDataChange) onDataChange();
      } else {
        setImportNotification({
          type: 'error',
          message: res.error || 'Failed to commit attendance import.'
        });
      }
    }, 400);
  };

  // Severity pill helper
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
            <ShieldAlert size={12} /> CRITICAL (&lt;45%)
          </span>
        );
      case 'HIGH_RISK':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#FFFBEB', color: '#D97706', border: '1px solid #FCD34D', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
            <AlertTriangle size={12} /> HIGH RISK (&lt;55%)
          </span>
        );
      case 'LOW_ATTENDANCE':
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#EFF6FF', color: '#2563EB', border: '1px solid #93C5FD', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
            <Clock size={12} /> LOW (&lt;{threshold}%)
          </span>
        );
    }
  };

  // Status pill helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PARENT_CONTACTED':
        return (
          <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700 }}>
            Contacted
          </span>
        );
      case 'RESOLVED':
        return (
          <span style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #86EFAC', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700 }}>
            Resolved
          </span>
        );
      case 'FOLLOW_UP':
        return (
          <span style={{ background: '#FFF7ED', color: '#EA580C', border: '1px solid #FDBA74', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700 }}>
            Follow-up
          </span>
        );
      case 'OPEN':
      default:
        return (
          <span style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700 }}>
            Pending Contact
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & KPI SUMMARY BANNER */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div style={{ 
        background: 'linear-gradient(135deg, #070F1E 0%, #0D1E36 100%)', 
        borderRadius: '16px', 
        padding: '1.5rem', 
        color: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        border: '1px solid rgba(241,196,15,0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(241,196,15,0.15)', color: '#F1C40F', border: '1px solid rgba(241,196,15,0.3)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              <ShieldAlert size={13} /> ACADEMIC RISK MONITORING &amp; GOVERNANCE
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.35rem 0', fontFamily: 'Cinzel, Georgia, serif', color: '#F8FAFC' }}>
              Attendance Risk &amp; Parent Contact Center
            </h1>
            <p style={{ fontSize: '0.84rem', color: '#94A3B8', margin: 0, maxWidth: '680px' }}>
              Integrated Student Master monitoring suite. Detect low attendance cohorts (&lt;{threshold}%), calculate subject-level shortfalls, and maintain verified parent contact logs without data fabrication.
            </p>
          </div>

          {/* Action Button Strip */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('upload-wizard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)',
                color: '#070F1E',
                border: 'none',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(241,196,15,0.3)'
              }}
            >
              <UploadCloud size={15} /> Smart Import Attendance
            </button>

            <button
              type="button"
              disabled={alertsList.length === 0}
              title={alertsList.length === 0 ? 'No low attendance alerts in current cohort to generate parent contact sheet' : 'Generate official Parent Contact PDF'}
              onClick={() => {
                if (alertsList.length === 0) return;
                generateParentContactSheetPDF(alertsList, { departmentCode: deptFilter, semester: semesterFilter, threshold }, true, currentUser);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: alertsList.length === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                color: alertsList.length === 0 ? '#64748B' : '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '0.55rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: alertsList.length === 0 ? 'not-allowed' : 'pointer',
                opacity: alertsList.length === 0 ? 0.6 : 1
              }}
            >
              <FileText size={15} /> Parent Contact Sheet PDF
            </button>
          </div>
        </div>

        {/* Live KPI Summary Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginTop: '1.25rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.85rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Students Below {threshold}%</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F87171', marginTop: '0.2rem' }}>{stats.totalAlerts}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.85rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Critical &lt;45%</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#EF4444', marginTop: '0.2rem' }}>{stats.criticalCount}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.85rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>High Risk &lt;55%</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F59E0B', marginTop: '0.2rem' }}>{stats.highRiskCount}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.85rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Parents Contacted</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34D399', marginTop: '0.2rem' }}>{stats.contactedCount}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.85rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Pending Call / Meeting</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FBBF24', marginTop: '0.2rem' }}>{stats.pendingCount}</div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. TABBED NAVIGATION BAR */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'risk-list', label: 'Active Attendance Risk List', icon: AlertTriangle, count: stats.totalAlerts },
          { id: 'upload-wizard', label: 'Smart Attendance Import', icon: UploadCloud },
          { id: 'contact-ledger', label: 'Parent Communication Ledger', icon: PhoneCall, count: contactsLedger.length },
          { id: 'student-directory', label: 'Student Master Directory', icon: Users, count: studentsList.length },
          { id: 'import-history', label: 'Import History & Batches', icon: Layers, count: importHistory.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#070F1E' : 'transparent',
                color: isActive ? '#F1C40F' : '#64748B',
                fontSize: '0.82rem',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={14} />
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  background: isActive ? '#F1C40F' : '#E2E8F0',
                  color: isActive ? '#070F1E' : '#475569',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px',
                  fontSize: '0.68rem',
                  fontWeight: 800
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications banner */}
      {importNotification && (
        <div style={{
          background: importNotification.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${importNotification.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: importNotification.type === 'success' ? '#047857' : '#B91C1C', fontSize: '0.82rem', fontWeight: 600 }}>
            {importNotification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {importNotification.message}
          </div>
          <button type="button" onClick={() => setImportNotification(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 1: ATTENDANCE RISK LIST & PARENT CONTACTS */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'risk-list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Filters Bar */}
          <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search by Roll No, Student Name, Guardian, Mentor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.2rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              disabled={currentUser?.role === 'HOD' && currentUser?.dept && currentUser?.dept !== 'Management & Governance'}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
            >
              <option value="ALL">All ET Departments</option>
              {ET_DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Risk Severities</option>
              <option value="CRITICAL">Critical (&lt;45%)</option>
              <option value="HIGH_RISK">High Risk (&lt;55%)</option>
              <option value="LOW_ATTENDANCE">Low Attendance (&lt;65%)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Contact Statuses</option>
              <option value="OPEN">Pending Contact</option>
              <option value="PARENT_CONTACTED">Parent Contacted</option>
              <option value="FOLLOW_UP">Follow-up Required</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                disabled={alertsList.length === 0}
                onClick={() => exportAttendanceRiskList(alertsList, 'csv', false, currentUser)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  color: alertsList.length === 0 ? '#94A3B8' : '#334155',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: alertsList.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  opacity: alertsList.length === 0 ? 0.6 : 1
                }}
              >
                <Download size={13} /> Export CSV
              </button>
              <button
                type="button"
                disabled={alertsList.length === 0}
                onClick={() => exportAttendanceRiskList(alertsList, 'excel', false, currentUser)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  color: alertsList.length === 0 ? '#94A3B8' : '#334155',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: alertsList.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  opacity: alertsList.length === 0 ? 0.6 : 1
                }}
              >
                <FileSpreadsheet size={13} /> Excel
              </button>
            </div>
          </div>

          {/* Table of At-Risk Students */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Student &amp; Roll No</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Cohort &amp; Dept</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Attendance %</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Risk Level</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Parent / Guardian</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Contact Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alertsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
                      {!hasAttendanceData ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: '#F1F5F9', color: '#64748B', marginBottom: '0.4rem' }}>
                            <UploadCloud size={24} />
                          </div>
                          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>No attendance data imported yet.</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748B', maxWidth: '420px', marginBottom: '0.75rem' }}>
                            Use Smart Attendance Import to upload the current attendance dataset.
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('upload-wizard')}
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#070F1E',
                              color: '#F1C40F',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            <UploadCloud size={14} /> Smart Attendance Import
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: '#ECFDF5', color: '#059669', marginBottom: '0.4rem' }}>
                            <CheckCircle2 size={24} />
                          </div>
                          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>No Low Attendance Alerts Found</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                            All students in this cohort meet or exceed the {threshold}% attendance requirement.
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  alertsList.map((alert) => (
                    <tr key={alert.id} style={{ borderBottom: '1px solid #F1F5F9' }} className="hover:bg-slate-50">
                      
                      {/* Student Info */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: alert.riskSeverity === 'CRITICAL' ? '#FEE2E2' : (alert.riskSeverity === 'HIGH_RISK' ? '#FEF3C7' : '#EFF6FF'),
                            color: alert.riskSeverity === 'CRITICAL' ? '#DC2626' : (alert.riskSeverity === 'HIGH_RISK' ? '#D97706' : '#2563EB'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.76rem'
                          }}>
                            {alert.rollNumber.slice(-3)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0F172A' }}>{alert.studentName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#D4AF37' }}>{alert.rollNumber}</span> • Reg: {alert.registrationNumber}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cohort */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#334155' }}>{alert.department} • Year {alert.year}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Sem {alert.semester} | Sec {alert.section}</div>
                      </td>

                      {/* Attendance % */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 900, color: alert.attendancePercentage < 45 ? '#DC2626' : (alert.attendancePercentage < 55 ? '#D97706' : '#2563EB') }}>
                            {alert.attendancePercentage}%
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                            (-{alert.shortfall}% shortfall)
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div style={{ width: '90px', height: '5px', background: '#E2E8F0', borderRadius: '9999px', marginTop: '0.25rem', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(100, alert.attendancePercentage)}%`,
                            height: '100%',
                            background: alert.attendancePercentage < 45 ? '#EF4444' : (alert.attendancePercentage < 55 ? '#F59E0B' : '#3B82F6')
                          }} />
                        </div>
                      </td>

                      {/* Risk Level */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {getSeverityBadge(alert.riskSeverity)}
                      </td>

                      {/* Guardian & Masked Phone */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {alert.hasGuardian ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.78rem' }}>{alert.guardianName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Phone size={11} /> {alert.guardianMaskedPhone}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.74rem' }}>
                            Parent contact not available
                          </span>
                        )}
                      </td>

                      {/* Contact Status */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {getStatusBadge(alert.status)}
                        {alert.lastContactedAt && (
                          <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                            {formatDateDDMMYYYY(alert.lastContactedAt)}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenStudentDrawer(alert.rollNumber)}
                            style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', cursor: 'pointer' }}
                            className="hover:bg-slate-100"
                          >
                            View Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenContactModal(alert)}
                            style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, border: 'none', background: '#070F1E', color: '#F1C40F', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            className="hover:opacity-90"
                          >
                            <PhoneCall size={12} /> Contact Parent
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
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 2: ATTENDANCE CSV UPLOAD WIZARD */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'upload-wizard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Step Indicator */}
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.84rem', color: wizardStep === 1 ? '#070F1E' : '#64748B' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: wizardStep === 1 ? '#F1C40F' : '#E2E8F0', color: '#070F1E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem' }}>1</span>
              Upload CSV / XLSX File
            </div>
            <ChevronRight size={16} color="#CBD5E1" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.84rem', color: wizardStep === 2 ? '#070F1E' : '#64748B' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: wizardStep === 2 ? '#F1C40F' : '#E2E8F0', color: '#070F1E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem' }}>2</span>
              Map Columns &amp; Cohort
            </div>
            <ChevronRight size={16} color="#CBD5E1" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.84rem', color: wizardStep === 3 ? '#070F1E' : '#64748B' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: wizardStep === 3 ? '#F1C40F' : '#E2E8F0', color: '#070F1E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem' }}>3</span>
              Validation &amp; Student Master Matching
            </div>
          </div>

          {/* STEP 1: UPLOAD BOX */}
          {wizardStep === 1 && (
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '2rem', textAlign: 'center' }}>
              <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <UploadCloud size={28} />
                </div>
                <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                  Select College Attendance Export File
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 1.25rem 0' }}>
                  Supports CSV, TSV, or XLSX. Must contain student roll number / HTNO and attendance counts or percentages.
                </p>

                <input
                  type="file"
                  id="attendance-file-input"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                <label
                  htmlFor="attendance-file-input"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#070F1E',
                    color: '#F1C40F',
                    padding: '0.65rem 1.4rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  <FileSpreadsheet size={16} /> Choose Attendance File
                </label>

                {/* Sample Format Guide */}
                <div style={{ marginTop: '2rem', textAlign: 'left', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.9rem', width: '100%', fontSize: '0.74rem', color: '#475569' }}>
                  <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '0.3rem' }}>Supported CSV Header Formats:</div>
                  <code>roll_number, student_name, classes_conducted, classes_attended, attendance_percentage</code>
                  <div style={{ marginTop: '0.35rem', color: '#64748B' }}>
                    Or subject-wise exports: <code>roll_number, subject_code, subject_name, conducted, attended</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING & COHORT CONFIG */}
          {wizardStep === 2 && (
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                  Step 2: Verify Cohort &amp; Column Mappings
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                  File: <span style={{ fontWeight: 700, color: '#0F172A' }}>{uploadFile?.name}</span> ({parsedImportResult?.totalRows} rows detected)
                </p>
              </div>

              {/* Cohort Metadata Form */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>ACADEMIC YEAR</label>
                  <input
                    type="text"
                    value={cohortMeta.academicYear}
                    onChange={(e) => setCohortMeta({ ...cohortMeta, academicYear: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>DEPARTMENT</label>
                  <select
                    value={cohortMeta.departmentCode}
                    onChange={(e) => setCohortMeta({ ...cohortMeta, departmentCode: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  >
                    {ET_DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>YEAR &amp; SEMESTER</label>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <select
                      value={cohortMeta.year}
                      onChange={(e) => setCohortMeta({ ...cohortMeta, year: e.target.value })}
                      style={{ flex: 1, padding: '0.45rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                    >
                      <option value="I">I Year</option>
                      <option value="II">II Year</option>
                      <option value="III">III Year</option>
                      <option value="IV">IV Year</option>
                    </select>
                    <select
                      value={cohortMeta.semester}
                      onChange={(e) => setCohortMeta({ ...cohortMeta, semester: e.target.value })}
                      style={{ flex: 1, padding: '0.45rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                    >
                      <option value="I">I Sem</option>
                      <option value="II">II Sem</option>
                      <option value="III-I">III-I</option>
                      <option value="III-II">III-II</option>
                      <option value="IV-I">IV-I</option>
                      <option value="IV-II">IV-II</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>SECTION</label>
                  <select
                    value={cohortMeta.section}
                    onChange={(e) => setCohortMeta({ ...cohortMeta, section: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>LOW ATTENDANCE THRESHOLD (%)</label>
                  <input
                    type="number"
                    value={cohortMeta.threshold}
                    onChange={(e) => setCohortMeta({ ...cohortMeta, threshold: parseFloat(e.target.value) || 65.0 })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontWeight: 800 }}
                  />
                </div>
              </div>

              {/* Column Mapping Selectors */}
              <div>
                <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                  Column Mapping Configuration
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {[
                    { key: 'rollNumber', label: 'Roll Number / HTNO (Required)', required: true },
                    { key: 'studentName', label: 'Student Name', required: false },
                    { key: 'classesConducted', label: 'Classes Conducted', required: false },
                    { key: 'classesAttended', label: 'Classes Attended', required: false },
                    { key: 'attendancePercentage', label: 'Attendance % (if pre-calculated)', required: false },
                    { key: 'subjectCode', label: 'Subject Code (for Subject-wise)', required: false }
                  ].map(field => (
                    <div key={field.key} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '8px' }}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: field.required ? '#DC2626' : '#475569', marginBottom: '0.3rem' }}>
                        {field.label}
                      </label>
                      <select
                        value={customMapping[field.key] !== undefined ? customMapping[field.key] : (parsedImportResult?.columnMapping?.[field.key] ?? -1)}
                        onChange={(e) => setCustomMapping({ ...customMapping, [field.key]: parseInt(e.target.value, 10) })}
                        style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem' }}
                      >
                        <option value={-1}>-- Not Mapped / Ignore --</option>
                        {parsedImportResult?.headers?.map((h, idx) => (
                          <option key={idx} value={idx}>Column {idx + 1}: {h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleApplyMappingAndValidate}
                  style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', border: 'none', background: '#070F1E', color: '#F1C40F', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Proceed to Validation &amp; Matching
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: VALIDATION PREVIEW & MATCHING WITH STUDENT MASTER */}
          {wizardStep === 3 && parsedImportResult && (
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                    Step 3: Ingestion Validation &amp; Student Master Matching
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                    Cohort: <span style={{ fontWeight: 700, color: '#0F172A' }}>{cohortMeta.departmentCode} {cohortMeta.year}-{cohortMeta.semester} Sec {cohortMeta.section}</span> | Threshold: &lt; {cohortMeta.threshold}%
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    style={{ padding: '0.5rem 0.9rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Adjust Mapping
                  </button>
                  <button
                    type="button"
                    disabled={importingInProgress || parsedImportResult.aggregatedStudents.length === 0}
                    onClick={handleExecuteAttendanceCommit}
                    style={{
                      padding: '0.5rem 1.4rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                    }}
                  >
                    {importingInProgress ? 'Committing...' : `Commit & Create Alerts (${parsedImportResult.summary.belowThresholdCount} At-Risk)`}
                  </button>
                </div>
              </div>

              {/* Validation Summary Ribbon */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Total Students</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>{parsedImportResult.summary.totalStudents}</div>
                </div>
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#047857' }}>Matched in Master</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#047857' }}>{parsedImportResult.matchedRowsCount}</div>
                </div>
                <div style={{ background: parsedImportResult.unmatchedRowsCount > 0 ? '#FEF2F2' : '#F8FAFC', border: `1px solid ${parsedImportResult.unmatchedRowsCount > 0 ? '#FECACA' : '#E2E8F0'}`, padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: parsedImportResult.unmatchedRowsCount > 0 ? '#DC2626' : '#64748B' }}>Unmatched in Master</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: parsedImportResult.unmatchedRowsCount > 0 ? '#DC2626' : '#0F172A' }}>{parsedImportResult.unmatchedRowsCount}</div>
                </div>
                <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#D97706' }}>Below {cohortMeta.threshold}%</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#D97706' }}>{parsedImportResult.summary.belowThresholdCount}</div>
                </div>
              </div>

              {/* Pre-Import Data Grid */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Roll Number</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Student Master Match</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Conducted / Attended</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Calculated %</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Risk Severity</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Guardian Linkage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedImportResult.aggregatedStudents.map((st, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A' }}>
                          {st.rollNumber}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem' }}>
                          {st.matchStatus === 'MATCHED' ? (
                            <div>
                              <span style={{ fontWeight: 700, color: '#047857' }}>{st.studentName}</span>
                              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{st.department} • Mentor: {st.mentorName}</div>
                            </div>
                          ) : (
                            <span style={{ color: '#DC2626', fontWeight: 700 }}>
                              <UserX size={12} style={{ display: 'inline', marginRight: '3px' }} /> Unmatched in Student Master
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', color: '#334155' }}>
                          {st.classesConducted > 0 ? `${st.classesAttended} / ${st.classesConducted}` : 'Stated %'}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: st.isBelowThreshold ? '#DC2626' : '#047857' }}>
                          {st.attendancePercentage}%
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem' }}>
                          {getSeverityBadge(st.riskSeverity)}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem' }}>
                          {st.guardianName ? (
                            <span style={{ color: '#047857', fontWeight: 600 }}>{st.guardianName} ({st.guardianMaskedPhone})</span>
                          ) : (
                            <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Parent contact not available</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 3: PARENT COMMUNICATION LEDGER */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'contact-ledger' && (
        <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
              Parent Communication Audit Trail
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
              Immutable institutional record of parent phone calls, SMS/email notifications, and counseling meetings.
            </p>
          </div>

          <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.7rem 0.9rem' }}>Date &amp; Time</th>
                  <th style={{ padding: '0.7rem 0.9rem' }}>Student &amp; Roll No</th>
                  <th style={{ padding: '0.7rem 0.9rem' }}>Guardian Contacted</th>
                  <th style={{ padding: '0.7rem 0.9rem' }}>Method &amp; Outcome</th>
                  <th style={{ padding: '0.7rem 0.9rem' }}>Discussion Notes &amp; Follow-up</th>
                  <th style={{ padding: '0.7rem 0.9rem' }}>Staff / Mentor</th>
                </tr>
              </thead>
              <tbody>
                {contactsLedger.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      No parent contact logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  contactsLedger.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 0.9rem', color: '#64748B' }}>
                        {formatDateDDMMYYYY(log.contactedAt)}
                      </td>
                      <td style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: '#0F172A' }}>
                        <span style={{ fontFamily: 'monospace', color: '#D4AF37' }}>{log.rollNumber}</span>
                      </td>
                      <td style={{ padding: '0.75rem 0.9rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{log.guardianName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{maskPhoneNumber(log.phoneContacted)}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.9rem' }}>
                        <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, marginRight: '0.3rem' }}>
                          {log.contactMethod}
                        </span>
                        {getStatusBadge(log.contactStatus)}
                      </td>
                      <td style={{ padding: '0.75rem 0.9rem', maxWidth: '280px', color: '#334155' }}>
                        <div>{log.notes}</div>
                        {log.followUpDate && (
                          <div style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 700, marginTop: '0.2rem' }}>
                            Next Follow-up: {log.followUpDate}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.9rem', fontSize: '0.74rem', color: '#475569' }}>
                        {log.contactedBy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 4: STUDENT MASTER DIRECTORY */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'student-directory' && (
        <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
              Student Master Database
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
              Official roster of enrolled students with department mappings and faculty mentor linkages.
            </p>
          </div>

          <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.7rem 0.9rem' }}>Roll Number</th>
                  <th style={{ padding: '0.7rem 0.9rem' }}>Registration No</th>
                  <th style={{ padding: '0.7rem 0.9rem' }}>Full Name</th>
                  <th style={{ padding: '0.7rem 0.9rem' }}>Dept / Year / Sec</th>
                  <th style={{ padding: '0.7rem 0.9rem' }}>Faculty Mentor</th>
                  <th style={{ padding: '0.7rem 0.9rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {studentsList.map((st) => (
                  <tr key={st.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem 0.9rem', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A' }}>
                      {st.rollNumber}
                    </td>
                    <td style={{ padding: '0.75rem 0.9rem', color: '#64748B', fontFamily: 'monospace' }}>
                      {st.registrationNumber}
                    </td>
                    <td style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: '#0F172A' }}>
                      {st.fullName}
                    </td>
                    <td style={{ padding: '0.75rem 0.9rem', color: '#334155' }}>
                      {st.departmentCode} • {st.year} Year ({st.semester}) Sec {st.section}
                    </td>
                    <td style={{ padding: '0.75rem 0.9rem', color: '#047857', fontWeight: 600 }}>
                      {st.mentorName || 'Unassigned'}
                    </td>
                    <td style={{ padding: '0.75rem 0.9rem' }}>
                      <span style={{ background: '#ECFDF5', color: '#047857', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                        {st.studentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 5: IMPORT HISTORY & BATCHES */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'import-history' && (
        <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
              Attendance Ingestion History
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
              Batch ledger of all uploaded attendance datasets with cryptographic hashes.
            </p>
          </div>

          <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.7rem 0.9rem' }}>Uploaded At</th>
                  <th style={{ padding: '0.7rem 0.9rem' }}>Filename</th>
                  <th style={{ padding: '0.7rem 0.9rem' }}>Cohort</th>
                  <th style={{ padding: '0.7rem 0.9rem' }}>Total Rows</th>
                  <th style={{ padding: '0.7rem 0.9rem' }}>At-Risk Count</th>
                  <th style={{ padding: '0.7rem 0.9rem' }}>Uploaded By</th>
                </tr>
              </thead>
              <tbody>
                {importHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      No attendance imports logged in this session yet.
                    </td>
                  </tr>
                ) : (
                  importHistory.map((job) => (
                    <tr key={job.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 0.9rem', color: '#64748B' }}>
                        {formatDateDDMMYYYY(job.createdAt)}
                      </td>
                      <td style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: '#0F172A' }}>
                        {job.originalFilename}
                      </td>
                      <td style={{ padding: '0.75rem 0.9rem', color: '#334155' }}>
                        {job.departmentCode} • {job.semester} Sec {job.section}
                      </td>
                      <td style={{ padding: '0.75rem 0.9rem' }}>
                        {job.totalRows} rows ({job.matchedRows} matched)
                      </td>
                      <td style={{ padding: '0.75rem 0.9rem', fontWeight: 800, color: '#DC2626' }}>
                        {job.lowAttendanceCount} alerts
                      </td>
                      <td style={{ padding: '0.75rem 0.9rem', color: '#64748B' }}>
                        {job.uploadedBy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. STUDENT ATTENDANCE PROFILE DRAWER */}
      {/* ──────────────────────────────────────────────────────────── */}
      {studentDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '540px',
          background: '#FFFFFF',
          boxShadow: '-4px 0 25px rgba(0,0,0,0.2)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          {/* Drawer Header */}
          <div style={{
            background: 'linear-gradient(135deg, #070F1E 0%, #0D1E36 100%)',
            padding: '1.25rem',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#F1C40F', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                STUDENT ATTENDANCE PROFILE
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.2rem 0', fontFamily: 'Cinzel, serif' }}>
                {studentDetail.student?.fullName || studentDetail.rollNumber}
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                Roll: <span style={{ color: '#F1C40F', fontWeight: 700, fontFamily: 'monospace' }}>{studentDetail.rollNumber}</span> • Reg: {studentDetail.student?.registrationNumber}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseStudentDrawer}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFFFFF', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Drawer Content */}
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Overall Attendance Card */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>OVERALL ATTENDANCE</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: (studentDetail.latestSnapshot?.attendancePercentage || 0) < 65 ? '#DC2626' : '#10B981' }}>
                    {studentDetail.latestSnapshot?.attendancePercentage || 0}%
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>POLICY THRESHOLD</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>65.0%</div>
                  <div style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 700, marginTop: '0.15rem' }}>
                    {(studentDetail.latestSnapshot?.attendancePercentage || 0) < 65 ? `${(65.0 - (studentDetail.latestSnapshot?.attendancePercentage || 0)).toFixed(1)}% Shortfall` : 'Above Threshold'}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', background: '#CBD5E1', borderRadius: '9999px', marginTop: '0.75rem', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, studentDetail.latestSnapshot?.attendancePercentage || 0)}%`,
                  height: '100%',
                  background: (studentDetail.latestSnapshot?.attendancePercentage || 0) < 45 ? '#EF4444' : ((studentDetail.latestSnapshot?.attendancePercentage || 0) < 55 ? '#F59E0B' : '#3B82F6')
                }} />
              </div>
            </div>

            {/* Student & Academic Mentor Metadata */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.78rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Department</span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>{studentDetail.student?.departmentCode}</span>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Year &amp; Section</span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>{studentDetail.student?.year} Year ({studentDetail.student?.semester}) Sec {studentDetail.student?.section}</span>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Faculty Advisor / Mentor</span>
                <span style={{ fontWeight: 800, color: '#047857' }}>{studentDetail.student?.mentorName || 'Unassigned'}</span>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Student Status</span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>{studentDetail.student?.studentStatus || 'ACTIVE'}</span>
              </div>
            </div>

            {/* Subject-Wise Attendance Breakdown */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                Subject-wise Attendance Breakdown
              </h4>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                      <th style={{ padding: '0.55rem 0.75rem' }}>Subject Name</th>
                      <th style={{ padding: '0.55rem 0.75rem' }}>Attended / Total</th>
                      <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentDetail.subjectBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: '#64748B' }}>
                          No subject-level breakdown provided in this upload.
                        </td>
                      </tr>
                    ) : (
                      studentDetail.subjectBreakdown.map((sub, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: sub.isBelow ? '#FEF2F2' : '#FFFFFF' }}>
                          <td style={{ padding: '0.55rem 0.75rem' }}>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{sub.subjectName}</div>
                            <div style={{ fontSize: '0.68rem', color: '#64748B', fontFamily: 'monospace' }}>{sub.subjectCode}</div>
                          </td>
                          <td style={{ padding: '0.55rem 0.75rem', color: '#475569' }}>
                            {sub.attended} / {sub.conducted}
                          </td>
                          <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 800, color: sub.isBelow ? '#DC2626' : '#047857' }}>
                            {sub.percentage}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Parent / Guardian Verification Section */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                  Verified Parent / Guardian Contact
                </h4>
                {studentDetail.guardian && (
                  <button
                    type="button"
                    onClick={() => setShowUnmaskedPhone(!showUnmaskedPhone)}
                    style={{ background: 'transparent', border: 'none', color: '#2563EB', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    {showUnmaskedPhone ? <EyeOff size={13} /> : <Eye size={13} />}
                    {showUnmaskedPhone ? 'Mask Phone' : 'Unmask Phone'}
                  </button>
                )}
              </div>

              {studentDetail.guardian ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Guardian Name</span>
                    <span style={{ fontWeight: 800, color: '#0F172A' }}>{studentDetail.guardian.guardianName}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Relationship</span>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{studentDetail.guardian.relationship}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Primary Phone</span>
                    <span style={{ fontWeight: 800, color: '#047857', fontFamily: 'monospace' }}>
                      {showUnmaskedPhone ? (studentDetail.guardian.primaryPhone || 'Unstated') : studentDetail.guardian.maskedPhone}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Alternate Phone</span>
                    <span style={{ fontWeight: 600, color: '#64748B', fontFamily: 'monospace' }}>
                      {showUnmaskedPhone ? (studentDetail.guardian.alternatePhone || 'None') : '**********'}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#64748B', fontStyle: 'italic', fontSize: '0.76rem' }}>
                  Parent contact details are not registered in the student master.
                </div>
              )}
            </div>

            {/* Quick Action: Log Contact */}
            {studentDetail.alert && (
              <button
                type="button"
                onClick={() => handleOpenContactModal(studentDetail.alert)}
                style={{
                  width: '100%',
                  background: '#070F1E',
                  color: '#F1C40F',
                  border: 'none',
                  padding: '0.7rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                <PhoneCall size={16} /> Log Parent Contact Attempt
              </button>
            )}

            {/* Recent Contact Logs for this student */}
            {studentDetail.contactHistory.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                  Communication History
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {studentDetail.contactHistory.map((log) => (
                    <div key={log.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '8px', fontSize: '0.76rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 800, color: '#0F172A' }}>{log.contactMethod} • {getStatusBadge(log.contactStatus)}</span>
                        <span style={{ color: '#64748B', fontSize: '0.7rem' }}>{formatDateDDMMYYYY(log.contactedAt)}</span>
                      </div>
                      <div style={{ color: '#334155' }}>{log.notes}</div>
                      <div style={{ color: '#64748B', fontSize: '0.7rem', marginTop: '0.25rem' }}>Logged by: {log.contactedBy}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 4. CONTROLLED PARENT CONTACT MODAL */}
      {/* ──────────────────────────────────────────────────────────── */}
      {contactModalOpen && contactTargetAlert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(7,15,30,0.7)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            {/* Modal Header */}
            <div style={{ background: '#070F1E', padding: '1rem 1.25rem', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#F1C40F', fontWeight: 800 }}>ACADEMIC MONITORING LOG</div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Log Parent / Guardian Contact</h3>
              </div>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              
              {/* Target Student & Guardian Details */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.75rem', fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.85rem' }}>
                  {contactTargetAlert.studentName} ({contactTargetAlert.rollNumber})
                </div>
                <div style={{ color: '#64748B', marginTop: '0.15rem' }}>
                  Attendance: <span style={{ fontWeight: 800, color: '#DC2626' }}>{contactTargetAlert.attendancePercentage}%</span> (Shortfall: {contactTargetAlert.shortfall}%)
                </div>
                <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px dashed #CBD5E1', color: '#047857', fontWeight: 700 }}>
                  Guardian: {contactTargetAlert.guardianName || 'Unstated'} • Phone: {contactTargetAlert.guardianPhone || contactTargetAlert.guardianMaskedPhone}
                </div>
              </div>

              {/* Contact Method */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>CONTACT METHOD</label>
                <select
                  value={contactForm.method}
                  onChange={(e) => setContactForm({ ...contactForm, method: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                >
                  <option value="PHONE">Phone Call (Voice)</option>
                  <option value="EMAIL">Official Email Notification</option>
                  <option value="IN_PERSON">In-Person Campus Counseling Meeting</option>
                  <option value="OTHER">Other Official Channel</option>
                </select>
              </div>

              {/* Contact Status */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>CALL / CONTACT OUTCOME</label>
                <select
                  value={contactForm.status}
                  onChange={(e) => setContactForm({ ...contactForm, status: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                >
                  <option value="CONTACTED">Contacted &amp; Discussed Attendance</option>
                  <option value="NO_ANSWER">No Answer / Ringing</option>
                  <option value="CALLBACK_REQUIRED">Callback Requested by Parent</option>
                  <option value="MEETING_REQUESTED">Campus Meeting Scheduled</option>
                  <option value="WRONG_NUMBER">Incorrect / Invalid Number</option>
                  <option value="RESOLVED">Resolved / Medical Leave Verified</option>
                </select>
              </div>

              {/* Discussion Remarks */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>DISCUSSION REMARKS / PARENT RESPONSE</label>
                <textarea
                  rows={3}
                  placeholder="Record summary of discussion with parent (e.g. Parent informed of 61% attendance, student will attend classes regularly)..."
                  value={contactForm.notes}
                  onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Next Follow-Up Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>NEXT FOLLOW-UP DATE (OPTIONAL)</label>
                <input
                  type="date"
                  value={contactForm.followUpDate}
                  onChange={(e) => setContactForm({ ...contactForm, followUpDate: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ background: '#F8FAFC', padding: '0.85rem 1.25rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                style={{ padding: '0.5rem 0.9rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitParentContact}
                style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', border: 'none', background: '#070F1E', color: '#F1C40F', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Save Contact Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
