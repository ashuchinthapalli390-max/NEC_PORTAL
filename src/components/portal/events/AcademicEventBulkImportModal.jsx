import React, { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  Download, 
  ArrowLeft, 
  RefreshCw, 
  ShieldCheck, 
  Check, 
  X
} from 'lucide-react';
import { DEPARTMENTS, ET_DEPARTMENTS } from '../../../data/masterData.js';
import { 
  getMoUs, 
  getAcademicEvents, 
  getAcademicEventImportJobs, 
  saveAcademicEventImportJob, 
  executeBulkAcademicEventImport 
} from '../../../data/portalStore.js';
import { 
  processAcademicEventsCsv, 
  downloadBulkImportTemplate, 
  downloadIssuesReport 
} from '../../../lib/events/bulkImportEngine.js';
import { validateFileMetadata } from '../../../lib/security/fileValidator.js';
import { formatDateDDMMYYYY } from '../../../lib/ui/dateUtils.js';

export default function AcademicEventBulkImportModal({ isOpen, onClose, currentUser, onImportComplete }) {
  // Wizard Step: 1 = Upload, 2 = Parsing, 3 = Resolution/Preview, 4 = Success
  const [step, setStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);

  // Parsing & Processing State
  const [parseProgress, setParseProgress] = useState(0);
  const [parseStageText, setParseStageText] = useState('');
  const [jobSummary, setJobSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, READY, WARNING, BLOCKED, DUPLICATE

  // Selection & Resolution State
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [duplicateModalCluster, setDuplicateModalCluster] = useState(null);
  const [dateEditModalRow, setDateEditModalRow] = useState(null);
  const [participantEditRow, setParticipantEditRow] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const fileInputRef = useRef(null);

  // Reset when modal closes/opens
  const handleClose = () => {
    setStep(1);
    setSelectedFile(null);
    setFileError(null);
    setRows([]);
    setJobSummary(null);
    setSelectedRowIds([]);
    setDuplicateModalCluster(null);
    setDateEditModalRow(null);
    setParticipantEditRow(null);
    setImportResult(null);
    onClose();
  };

  // File Upload Handlers
  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectedFile = (file) => {
    setFileError(null);
    const metadataCheck = validateFileMetadata(file.name, file.type, file.size, 'SPREADSHEET_IMPORT');
    if (!metadataCheck.valid) {
      setFileError(metadataCheck.error);
      return;
    }
    setSelectedFile(file);
    startValidationPipeline(file);
  };

  // Pipeline Execution with animated stages
  const startValidationPipeline = async (file) => {
    setStep(2);
    setParseProgress(15);
    setParseStageText('Reading file buffer and computing SHA-256 cryptographic digest...');

    await new Promise(r => setTimeout(r, 450));
    setParseProgress(40);
    setParseStageText('Parsing schema structure & enforcing ISO YYYY-MM-DD date normalization...');

    await new Promise(r => setTimeout(r, 450));
    setParseProgress(70);
    setParseStageText('Resolving department aliases and matching active institutional MoUs...');

    const existingMous = getMoUs();
    const existingEvents = getAcademicEvents();
    const previousJobs = getAcademicEventImportJobs();

    const processResult = await processAcademicEventsCsv(
      file,
      currentUser,
      existingMous,
      existingEvents,
      previousJobs
    );

    await new Promise(r => setTimeout(r, 400));
    setParseProgress(95);
    setParseStageText('Scanning for potential duplicates and cross-event schedule overlaps...');

    await new Promise(r => setTimeout(r, 350));
    setParseProgress(100);

    if (!processResult.isValid) {
      setFileError(processResult.error);
      setStep(1);
      return;
    }

    setJobSummary(processResult.jobSummary);
    setRows(processResult.rows);

    // Auto-select non-blocked rows
    const defaultSelected = processResult.rows
      .filter(r => r.validationStatus !== 'BLOCKED')
      .map(r => r.id);
    setSelectedRowIds(defaultSelected);

    // Save initial job record in storage
    const jobId = `job_evt_${Date.now()}`;
    saveAcademicEventImportJob({
      id: jobId,
      uploadedBy: currentUser?.name || 'Administrator',
      originalFilename: file.name,
      fileSha256: processResult.jobSummary.fileSha256,
      academicYear: '2026-27',
      status: 'READY',
      totalRows: processResult.rows.length,
      validRows: processResult.jobSummary.readyRows,
      warningRows: processResult.jobSummary.warningRows,
      errorRows: processResult.jobSummary.blockedRows,
      duplicateRows: processResult.jobSummary.duplicateRows,
      importedRows: 0,
      createdAt: new Date().toISOString()
    });

    setStep(3);
  };

  // Row update helpers
  const updateRow = (rowId, updater) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const updated = updater(r);
      // Re-evaluate validation status
      const hasErrors = (updated.validationErrors || []).length > 0;
      const hasDuplicates = !!updated.duplicateCluster;
      const hasWarnings = (updated.validationWarnings || []).length > 0;

      let validationStatus = 'READY';
      if (hasErrors) validationStatus = 'BLOCKED';
      else if (hasDuplicates) validationStatus = 'DUPLICATE';
      else if (hasWarnings) validationStatus = 'WARNING';

      return {
        ...updated,
        validationStatus
      };
    }));
  };

  // Resolve Department Mapping Inline
  const handleDepartmentChange = (rowId, newDeptCode) => {
    updateRow(rowId, row => {
      const match = DEPARTMENTS.find(d => d.code === newDeptCode);
      const isAll = newDeptCode === 'ALL';
      const label = isAll ? 'Institution Wide / All Departments' : (match ? match.name : newDeptCode);
      
      const newErrors = (row.validationErrors || []).filter(e => !e.toLowerCase().includes('department'));
      const newWarnings = (row.validationWarnings || []).filter(w => !w.toLowerCase().includes('department') && !w.toLowerCase().includes('alias'));

      return {
        ...row,
        departmentCode: newDeptCode,
        departmentLabel: label,
        departmentStatus: 'VALID',
        validationErrors: newErrors,
        validationWarnings: newWarnings
      };
    });

    // Auto-select row if it was unblocked
    setSelectedRowIds(prev => prev.includes(rowId) ? prev : [...prev, rowId]);
  };

  // Confirm / Edit Date Modal
  const handleSaveDateEdit = (rowId, newStartDate, newEndDate) => {
    updateRow(rowId, row => {
      const newWarnings = (row.validationWarnings || []).filter(w => !w.toLowerCase().includes('date'));
      return {
        ...row,
        startDate: newStartDate,
        endDate: newEndDate || newStartDate,
        hasDateAmbiguity: false,
        validationWarnings: newWarnings
      };
    });
    setDateEditModalRow(null);
  };

  // Participant Count Quick Fix
  const handleSaveParticipantEdit = (rowId, newTotal, newBreakdown) => {
    const totalNum = parseInt(newTotal, 10);
    if (isNaN(totalNum) || totalNum < 0) return;

    updateRow(rowId, row => {
      const newErrors = (row.validationErrors || []).filter(e => !e.toLowerCase().includes('participant'));
      const newWarnings = (row.validationWarnings || []).filter(w => !w.toLowerCase().includes('participant'));
      return {
        ...row,
        participantsTotal: totalNum,
        participantsBreakdown: newBreakdown || '',
        participantsIsDerived: false,
        validationErrors: newErrors,
        validationWarnings: newWarnings
      };
    });
    setSelectedRowIds(prev => prev.includes(rowId) ? prev : [...prev, rowId]);
    setParticipantEditRow(null);
  };

  // Duplicate Resolution Actions
  const handleResolveDuplicate = (cluster, action) => {
    const row1 = rows[cluster.row1Index];
    const row2 = rows[cluster.row2Index];

    if (action === 'KEEP_BOTH') {
      if (row1) {
        updateRow(row1.id, r => ({
          ...r,
          duplicateCluster: null,
          validationWarnings: r.validationWarnings.filter(w => !w.toLowerCase().includes('duplicate'))
        }));
      }
      if (row2) {
        updateRow(row2.id, r => ({
          ...r,
          duplicateCluster: null,
          validationWarnings: r.validationWarnings.filter(w => !w.toLowerCase().includes('duplicate'))
        }));
      }
    } else if (action === 'SKIP_ROW_2') {
      if (row1) {
        updateRow(row1.id, r => ({
          ...r,
          duplicateCluster: null,
          validationWarnings: r.validationWarnings.filter(w => !w.toLowerCase().includes('duplicate'))
        }));
      }
      if (row2) {
        setSelectedRowIds(prev => prev.filter(id => id !== row2.id));
      }
    }
    setDuplicateModalCluster(null);
  };

  // Row Selection Toggle
  const toggleRowSelection = (rowId) => {
    const row = rows.find(r => r.id === rowId);
    if (row && row.validationStatus === 'BLOCKED') return; // Cannot select blocked rows

    setSelectedRowIds(prev => 
      prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]
    );
  };

  const toggleSelectAll = () => {
    const selectable = filteredRows.filter(r => r.validationStatus !== 'BLOCKED').map(r => r.id);
    const allSelected = selectable.every(id => selectedRowIds.includes(id));
    if (allSelected) {
      setSelectedRowIds(prev => prev.filter(id => !selectable.includes(id)));
    } else {
      setSelectedRowIds(prev => Array.from(new Set([...prev, ...selectable])));
    }
  };

  // Tab Filtering
  const filteredRows = useMemo(() => {
    if (activeTab === 'ALL') return rows;
    return rows.filter(r => r.validationStatus === activeTab);
  }, [rows, activeTab]);

  // Statistics calculation for dynamic KPI badges
  const liveStats = useMemo(() => {
    const total = rows.length;
    const ready = rows.filter(r => r.validationStatus === 'READY').length;
    const warnings = rows.filter(r => r.validationStatus === 'WARNING').length;
    const blocked = rows.filter(r => r.validationStatus === 'BLOCKED').length;
    const duplicates = rows.filter(r => r.validationStatus === 'DUPLICATE').length;
    const selectedCount = selectedRowIds.length;
    return { total, ready, warnings, blocked, duplicates, selectedCount };
  }, [rows, selectedRowIds]);

  // Execute Transactional Import
  const handleExecuteImport = async () => {
    if (selectedRowIds.length === 0) return;
    setImporting(true);

    await new Promise(r => setTimeout(r, 600));

    const jobId = `job_evt_${Date.now()}`;
    const result = executeBulkAcademicEventImport(
      jobId,
      selectedRowIds,
      rows,
      currentUser
    );

    setImporting(false);
    setImportResult(result);
    setStep(4);

    if (onImportComplete) {
      onImportComplete(result);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(7, 15, 30, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          width: '100%',
          maxWidth: step === 3 ? '1180px' : '760px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(212, 175, 55, 0.25)',
          overflow: 'hidden',
          transition: 'max-width 0.3s ease'
        }}
      >
        {/* 1. Modal Top Bar */}
        <div 
          style={{
            padding: '1.25rem 1.75rem',
            background: 'linear-gradient(135deg, #070F1E 0%, #112240 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(212, 175, 55, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B38600 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#070F1E',
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
              }}
            >
              <UploadCloud size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, fontFamily: 'Cinzel, Georgia, serif', letterSpacing: '0.02em', color: '#F1C40F' }}>
                Bulk CSV Import — Academic Events & Workshops
              </h2>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#94A3B8' }}>
                Automated schema validation, department alias resolution & duplicate detection
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#CBD5E1',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Step Progress Indicators */}
        <div style={{ background: '#F8FAFC', padding: '0.75rem 1.75rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {[
            { id: 1, label: '1. Upload CSV' },
            { id: 2, label: '2. Schema Validation' },
            { id: 3, label: '3. Review & Resolve' },
            { id: 4, label: '4. Ingestion Summary' }
          ].map(s => {
            const isCompleted = step > s.id;
            const isCurrent = step === s.id;
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div 
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isCompleted ? '#059669' : isCurrent ? '#070F1E' : '#E2E8F0',
                    color: isCompleted || isCurrent ? '#FFFFFF' : '#64748B',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isCompleted ? <Check size={14} /> : s.id}
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? '#0F172A' : '#64748B' }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* 3. Modal Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>
          {/* STEP 1: UPLOAD ZONE */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Duplicate File Notice or File Error */}
              {fileError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '0.85rem 1rem', borderRadius: '10px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <AlertTriangle size={18} />
                  <span>{fileError}</span>
                </div>
              )}

              {/* Drag & Drop Box */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragging ? '2px dashed #D4AF37' : '2px dashed #CBD5E1',
                  background: isDragging ? '#FFFDF5' : '#F8FAFC',
                  borderRadius: '16px',
                  padding: '2.5rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,text/csv"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleSelectedFile(e.target.files[0]);
                    }
                  }}
                />
                <div 
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}
                >
                  <FileSpreadsheet size={32} />
                </div>
                <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                  Click to Browse or Drag & Drop CSV File
                </h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748B', maxWidth: '420px' }}>
                  Strict format: UTF-8 CSV with ISO dates (<strong>YYYY-MM-DD</strong>). Maximum size: 5 MB.
                </p>
                <button
                  type="button"
                  style={{
                    background: '#070F1E',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.55rem 1.25rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  Select File from Computer
                </button>
              </div>

              {/* Security & Format Guidance Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div style={{ background: '#F1F5F9', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#0F172A', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                    <ShieldCheck size={16} color="#059669" />
                    <span>Security & Provenance Rules</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.74rem', color: '#475569', lineHeight: 1.5 }}>
                    <li>SHA-256 integrity hash logged per import</li>
                    <li>Events imported strictly as <strong>DRAFT</strong> status</li>
                    <li>No automatic public publishing</li>
                    <li>Department scoped access control enforced</li>
                  </ul>
                </div>

                <div style={{ background: '#F0FDF4', padding: '1rem', borderRadius: '12px', border: '1px solid #DCFCE7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#166534', fontWeight: 700, fontSize: '0.82rem' }}>
                      <Download size={16} />
                      <span>Official CSV Template</span>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.74rem', color: '#15803D' }}>
                    Includes 18 standardized headers, sample rows, and valid department codes.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); downloadBulkImportTemplate(); }}
                    style={{
                      background: '#166534',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Download size={13} /> Download Template
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PARSING & VALIDATING PROGRESS */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', textAlign: 'center' }}>
              <div 
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}
              >
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}>
                  <RefreshCw size={28} />
                </motion.div>
              </div>

              <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                Validating & Normalizing Records...
              </h3>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.82rem', color: '#64748B', maxWidth: '450px' }}>
                {parseStageText}
              </p>

              {/* Animated Progress Bar */}
              <div style={{ width: '100%', maxWidth: '420px', height: '8px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', background: 'linear-gradient(90deg, #2563EB, #D4AF37)' }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${parseProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & INTERACTIVE RESOLUTION */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Duplicate File Warning Banner if applicable */}
              {jobSummary?.isDuplicateFile && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', padding: '0.85rem 1rem', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <AlertTriangle size={18} color="#D97706" />
                  <span>
                    <strong>Identical File Hash Detected:</strong> An import with this exact file (SHA-256 match) was previously processed on {formatDateDDMMYYYY(jobSummary.previousJobDate)}. Proceed carefully to avoid duplicate events.
                  </span>
                </div>
              )}

              {/* Dynamic Validation Summary KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{liveStats.total}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Total Rows</div>
                </div>

                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>{liveStats.ready}</div>
                  <div style={{ fontSize: '0.72rem', color: '#065F46', fontWeight: 600 }}>Ready (Clean)</div>
                </div>

                <div style={{ background: '#FEFCE8', border: '1px solid #FEF08A', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#A16207' }}>{liveStats.warnings}</div>
                  <div style={{ fontSize: '0.72rem', color: '#854D0E', fontWeight: 600 }}>Warnings / Review</div>
                </div>

                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#DC2626' }}>{liveStats.blocked}</div>
                  <div style={{ fontSize: '0.72rem', color: '#991B1B', fontWeight: 600 }}>Blocked (Errors)</div>
                </div>

                <div style={{ background: '#FDF4FF', border: '1px solid #F5D0FE', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#9333EA' }}>{liveStats.duplicates}</div>
                  <div style={{ fontSize: '0.72rem', color: '#7E22CE', fontWeight: 600 }}>Duplicates</div>
                </div>
              </div>

              {/* Interactive Toolbar: Filter Tabs & Bulk Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[
                    { id: 'ALL', label: `All (${liveStats.total})` },
                    { id: 'READY', label: `Ready (${liveStats.ready})` },
                    { id: 'WARNING', label: `Warnings (${liveStats.warnings})` },
                    { id: 'BLOCKED', label: `Blocked (${liveStats.blocked})` },
                    { id: 'DUPLICATE', label: `Duplicates (${liveStats.duplicates})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: activeTab === tab.id ? 800 : 600,
                        background: activeTab === tab.id ? '#070F1E' : '#F1F5F9',
                        color: activeTab === tab.id ? '#F1C40F' : '#475569',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#334155',
                      cursor: 'pointer'
                    }}
                  >
                    Select All Unblocked
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadIssuesReport(rows)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#DC2626',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Download size={13} /> Error Report CSV
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF' }}>
                <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
                    <thead style={{ background: '#F8FAFC', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #E2E8F0' }}>
                      <tr>
                        <th style={{ padding: '0.6rem 0.75rem', width: '36px' }}>
                          <input 
                            type="checkbox"
                            checked={filteredRows.filter(r => r.validationStatus !== 'BLOCKED').length > 0 && filteredRows.filter(r => r.validationStatus !== 'BLOCKED').every(r => selectedRowIds.includes(r.id))}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th style={{ padding: '0.6rem 0.75rem', width: '45px' }}>Row</th>
                        <th style={{ padding: '0.6rem 0.75rem', minWidth: '180px' }}>Program / Title</th>
                        <th style={{ padding: '0.6rem 0.75rem', width: '90px' }}>Type</th>
                        <th style={{ padding: '0.6rem 0.75rem', minWidth: '130px' }}>Department</th>
                        <th style={{ padding: '0.6rem 0.75rem', minWidth: '110px' }}>Dates (ISO)</th>
                        <th style={{ padding: '0.6rem 0.75rem', width: '100px' }}>Participants</th>
                        <th style={{ padding: '0.6rem 0.75rem', width: '90px' }}>Status</th>
                        <th style={{ padding: '0.6rem 0.75rem', width: '80px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => {
                        const isSelected = selectedRowIds.includes(row.id);
                        const isBlocked = row.validationStatus === 'BLOCKED';
                        const isWarning = row.validationStatus === 'WARNING';
                        const isDuplicate = row.validationStatus === 'DUPLICATE';

                        return (
                          <tr 
                            key={row.id}
                            style={{
                              borderBottom: '1px solid #F1F5F9',
                              background: isBlocked ? '#FFF5F5' : isSelected ? '#F0FDF4' : '#FFFFFF',
                              transition: 'background 0.15s'
                            }}
                          >
                            {/* Checkbox */}
                            <td style={{ padding: '0.6rem 0.75rem' }}>
                              <input 
                                type="checkbox"
                                disabled={isBlocked}
                                checked={isSelected}
                                onChange={() => toggleRowSelection(row.id)}
                              />
                            </td>

                            {/* Row # */}
                            <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#64748B' }}>
                              #{row.sourceRowNumber}
                            </td>

                            {/* Title & Errors/Warnings */}
                            <td style={{ padding: '0.6rem 0.75rem' }}>
                              <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '0.2rem' }}>
                                {row.title}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                {row.validationErrors?.map((err, idx) => (
                                  <div key={idx} style={{ color: '#DC2626', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <XCircle size={11} /> {err}
                                  </div>
                                ))}
                                {row.validationWarnings?.map((warn, idx) => (
                                  <div key={idx} style={{ color: '#D97706', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <AlertTriangle size={11} /> {warn}
                                  </div>
                                ))}
                              </div>
                            </td>

                            {/* Type */}
                            <td style={{ padding: '0.6rem 0.75rem' }}>
                              <span style={{ background: '#F1F5F9', color: '#334155', padding: '0.2rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                                {row.eventType}
                              </span>
                            </td>

                            {/* Department Inline Mapper */}
                            <td style={{ padding: '0.6rem 0.75rem' }}>
                              <select
                                value={row.departmentCode || ''}
                                onChange={(e) => handleDepartmentChange(row.id, e.target.value)}
                                style={{
                                  padding: '0.3rem 0.45rem',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  border: isBlocked && !row.departmentCode ? '1px solid #DC2626' : '1px solid #CBD5E1',
                                  background: isBlocked && !row.departmentCode ? '#FEF2F2' : '#FFFFFF',
                                  color: isBlocked && !row.departmentCode ? '#DC2626' : '#0F172A',
                                  maxWidth: '140px'
                                }}
                              >
                                <option value="">Select Dept...</option>
                                <option value="ALL">ALL (Institution)</option>
                                {ET_DEPARTMENTS.map(d => (
                                  <option key={d.code} value={d.code}>{d.code}</option>
                                ))}
                              </select>
                            </td>

                            {/* Dates (ISO) & Confirmation */}
                            <td style={{ padding: '0.6rem 0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ fontWeight: 600, color: '#0F172A' }}>{row.startDate || 'Missing'}</span>
                                {row.hasDateAmbiguity && (
                                  <button
                                    type="button"
                                    onClick={() => setDateEditModalRow(row)}
                                    title="Excel locale ambiguity detected. Click to confirm/edit."
                                    style={{
                                      background: '#FEF3C7',
                                      border: '1px solid #FCD34D',
                                      color: '#B45309',
                                      borderRadius: '4px',
                                      fontSize: '0.65rem',
                                      padding: '0.1rem 0.3rem',
                                      cursor: 'pointer',
                                      fontWeight: 800
                                    }}
                                  >
                                    Verify
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Participants Total & Breakdown */}
                            <td style={{ padding: '0.6rem 0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ fontWeight: 700, color: row.participantsTotal > 0 ? '#0F172A' : '#DC2626' }}>
                                  {row.participantsTotal || '0'}
                                </span>
                                {row.participantsBreakdown && (
                                  <span style={{ fontSize: '0.68rem', color: '#64748B' }}>({row.participantsBreakdown})</span>
                                )}
                                {isBlocked && row.participantsTotal === 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setParticipantEditRow(row)}
                                    style={{
                                      background: '#FEF2F2',
                                      border: '1px solid #FECACA',
                                      color: '#DC2626',
                                      borderRadius: '4px',
                                      fontSize: '0.65rem',
                                      padding: '0.1rem 0.3rem',
                                      cursor: 'pointer',
                                      fontWeight: 800
                                    }}
                                  >
                                    Fix
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Status Badge */}
                            <td style={{ padding: '0.6rem 0.75rem' }}>
                              {isBlocked && (
                                <span style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '0.2rem 0.45rem', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 800 }}>
                                  BLOCKED
                                </span>
                              )}
                              {!isBlocked && isDuplicate && (
                                <span style={{ background: '#FDF4FF', color: '#9333EA', border: '1px solid #F5D0FE', padding: '0.2rem 0.45rem', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 800 }}>
                                  DUPLICATE
                                </span>
                              )}
                              {!isBlocked && !isDuplicate && isWarning && (
                                <span style={{ background: '#FEFCE8', color: '#A16207', border: '1px solid #FEF08A', padding: '0.2rem 0.45rem', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 800 }}>
                                  WARNING
                                </span>
                              )}
                              {!isBlocked && !isDuplicate && !isWarning && (
                                <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.2rem 0.45rem', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 800 }}>
                                  READY
                                </span>
                              )}
                            </td>

                            {/* Action / Duplicate Resolver Button */}
                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                              {isDuplicate && (
                                <button
                                  type="button"
                                  onClick={() => setDuplicateModalCluster(row.duplicateCluster)}
                                  style={{
                                    background: '#9333EA',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '5px',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Resolve
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: TRANSACTION SUCCESS */}
          {step === 4 && importResult && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', textAlign: 'center' }}>
              <div 
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#ECFDF5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                {importResult.importedCount} Academic Events Imported Successfully!
              </h3>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.82rem', color: '#64748B', maxWidth: '480px' }}>
                All records have been staged safely as <strong>DRAFT / PENDING_REVIEW</strong> with assigned institutional event IDs. They are ready for departmental verification.
              </p>

              {/* Summary Stats Card */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', width: '100%', maxWidth: '450px', marginBottom: '1.5rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#64748B' }}>Total Processed:</span>
                  <strong style={{ color: '#0F172A' }}>{rows.length} rows</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#64748B' }}>Imported to DRAFT:</span>
                  <strong style={{ color: '#059669' }}>{importResult.importedCount} events</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#64748B' }}>Skipped / Unresolved:</span>
                  <strong style={{ color: '#DC2626' }}>{rows.length - importResult.importedCount} rows</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#64748B' }}>Audit Log:</span>
                  <span style={{ color: '#475569', fontSize: '0.74rem' }}>Recorded in Security Trail</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {rows.length > importResult.importedCount && (
                  <button
                    type="button"
                    onClick={() => downloadIssuesReport(rows.filter(r => !selectedRowIds.includes(r.id) || r.validationStatus === 'BLOCKED'))}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      padding: '0.55rem 1.1rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#DC2626',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Download size={14} /> Download Error Report
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    background: 'linear-gradient(135deg, #070F1E 0%, #1E293B 100%)',
                    color: '#F1C40F',
                    border: '1px solid #F1C40F',
                    padding: '0.55rem 1.4rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  View Imported Events
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Modal Footer Controls */}
        <div style={{ padding: '1rem 1.75rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {step === 3 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <ArrowLeft size={14} /> Upload Different File
              </button>

              <button
                type="button"
                disabled={selectedRowIds.length === 0 || importing}
                onClick={handleExecuteImport}
                style={{
                  background: selectedRowIds.length === 0 || importing
                    ? '#94A3B8'
                    : 'linear-gradient(135deg, #D4AF37 0%, #B38600 100%)',
                  color: '#070F1E',
                  border: '1px solid #F1C40F',
                  padding: '0.55rem 1.4rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: selectedRowIds.length === 0 || importing ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
                }}
              >
                {importing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Ingesting Events...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Import Selected ({selectedRowIds.length})
                  </>
                )}
              </button>
            </>
          )}

          {step === 1 && (
            <div style={{ marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  padding: '0.5rem 1.1rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* 5. Sub-Modal: Duplicate Resolver & Comparison */}
      {duplicateModalCluster && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '650px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#9333EA', marginBottom: '0.75rem' }}>
              <Copy size={20} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                Resolve Potential Duplicate / Overlap
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 1rem 0' }}>
              {duplicateModalCluster.reason}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B' }}>Row #{duplicateModalCluster.row1Number}</span>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  {duplicateModalCluster.title1}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>
                  📅 {duplicateModalCluster.date1}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                  👤 {duplicateModalCluster.speaker1}
                </div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B' }}>Row #{duplicateModalCluster.row2Number}</span>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  {duplicateModalCluster.title2}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>
                  📅 {duplicateModalCluster.date2}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                  👤 {duplicateModalCluster.speaker2}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setDuplicateModalCluster(null)}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleResolveDuplicate(duplicateModalCluster, 'SKIP_ROW_2')}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#F1F5F9', color: '#0F172A', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Skip Row #{duplicateModalCluster.row2Number}
              </button>
              <button
                type="button"
                onClick={() => handleResolveDuplicate(duplicateModalCluster, 'KEEP_BOTH')}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: 'none', background: '#9333EA', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Keep Both as Distinct
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Sub-Modal: Date Confirmation & Editor */}
      {dateEditModalRow && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
              Confirm Normalized Date (ISO)
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 1rem 0' }}>
              Original Excel value: <code>{dateEditModalRow.rawStartDate}</code>
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              handleSaveDateEdit(dateEditModalRow.id, fd.get('start'), fd.get('end'));
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    Start Date (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    name="start"
                    defaultValue={dateEditModalRow.startDate}
                    required
                    style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    End Date (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    name="end"
                    defaultValue={dateEditModalRow.endDate || dateEditModalRow.startDate}
                    required
                    style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setDateEditModalRow(null)}
                  style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: 'none', background: '#059669', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Confirm Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Sub-Modal: Participant Fixer */}
      {participantEditRow && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
              Specify Participant Count
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 1rem 0' }}>
              Original value was: <code>"{participantEditRow.participantsRaw}"</code>
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              handleSaveParticipantEdit(participantEditRow.id, fd.get('total'), fd.get('breakdown'));
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    Total Participants (Integer)
                  </label>
                  <input
                    type="number"
                    name="total"
                    defaultValue={participantEditRow.participantsTotal || ''}
                    placeholder="e.g. 75"
                    required
                    style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    Breakdown / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    name="breakdown"
                    defaultValue={participantEditRow.participantsBreakdown || ''}
                    placeholder="e.g. III=40; IV=35"
                    style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setParticipantEditRow(null)}
                  style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: 'none', background: '#059669', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Save Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
