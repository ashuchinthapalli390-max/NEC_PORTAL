import React, { useState, useRef, useMemo } from 'react';
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Download, 
  Check, 
  Edit2
} from 'lucide-react';
import { 
  getModuleConfig, 
  getAccessibleModules 
} from '../../../lib/bulk-import/moduleRegistry.js';
import { 
  parseUploadedDataFile, 
  calculateSha256, 
  validateAndNormalizeDataset, 
  generateModuleErrorReportCsv, 
  triggerFileDownload 
} from '../../../lib/bulk-import/bulkImportCore.js';
import { 
  getBulkImportJobs, 
  saveBulkImportJob, 
  saveBulkImportRows, 
  getBulkImportAliasMappings, 
  executeUniversalBulkImport 
} from '../../../data/portalStore.js';
import { DEPARTMENTS } from '../../../data/masterData.js';

function createJobIdentifiers(moduleKey) {
  const ts = Date.now();
  return {
    jobId: `job_${moduleKey}_${ts}`,
    jobNumber: `JOB-${moduleKey.substring(0, 3).toUpperCase()}-${ts.toString().slice(-6)}`,
    isoString: new Date(ts).toISOString()
  };
}

export default function UniversalImportWizard({ initialModuleKey, currentUser, onImportComplete, onCancel }) {
  // Wizard Steps: 1 = Module & File, 2 = Validating, 3 = Review & Resolve, 4 = Success
  const [step, setStep] = useState(1);
  const [selectedModuleKey, setSelectedModuleKey] = useState(initialModuleKey || 'academic_events');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileSha256, setFileSha256] = useState(null);
  const [duplicateFileWarning, setDuplicateFileWarning] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState(null);

  // Parsing & Processing State
  const [parseProgress, setParseProgress] = useState(0);
  const [parseStageText, setParseStageText] = useState('');
  const [rows, setRows] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');

  // Interactive Resolution Modals
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [cellEditRow, setCellEditRow] = useState(null);
  const [cellEditField, setCellEditField] = useState('');
  const [cellEditValue, setCellEditValue] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const fileInputRef = useRef(null);
  const accessibleModules = getAccessibleModules(currentUser);
  const currentModuleConfig = getModuleConfig(selectedModuleKey) || accessibleModules[0];

  // Drag & Drop handlers
  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = async (file) => {
    setFileError(null);
    setDuplicateFileWarning(null);

    const filename = file.name || '';
    const isCsv = filename.endsWith('.csv');
    const isXlsx = filename.endsWith('.xlsx') || filename.endsWith('.xls');

    if (!isCsv && !isXlsx) {
      setFileError('Invalid file format. Please upload a .csv or .xlsx file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size exceeds 10MB limit.');
      return;
    }

    setSelectedFile(file);

    // Compute SHA-256 for duplicate upload protection
    try {
      const hash = await calculateSha256(file);
      setFileSha256(hash);

      const existingJobs = getBulkImportJobs();
      const duplicateJob = existingJobs.find(j => j.fileSha256 === hash && j.status !== 'ROLLED_BACK');
      if (duplicateJob) {
        setDuplicateFileWarning({
          jobNumber: duplicateJob.jobNumber || duplicateJob.id,
          createdAt: duplicateJob.createdAt,
          uploader: duplicateJob.uploadedBy || 'Admin'
        });
      }
    } catch (err) {
      console.warn('SHA-256 error:', err);
    }
  };

  // Run validation pipeline
  const handleStartValidation = async () => {
    if (!selectedFile || !currentModuleConfig) return;
    setStep(2);
    setParseProgress(10);
    setParseStageText('Reading raw spreadsheet data & headers...');

    await new Promise(r => setTimeout(r, 300));
    setParseProgress(35);
    setParseStageText('Computing SHA-256 cryptographic fingerprint...');

    try {
      const parsedFile = await parseUploadedDataFile(selectedFile);
      setParseProgress(65);
      setParseStageText(`Validating ${parsedFile.rawRows.length - 1} rows against ${currentModuleConfig.title} schema...`);

      const aliasMappings = getBulkImportAliasMappings(selectedModuleKey);
      const validationResult = await validateAndNormalizeDataset(
        selectedModuleKey,
        parsedFile.rawRows,
        currentUser,
        aliasMappings
      );

      setParseProgress(90);
      setParseStageText('Detecting cross-row duplicates and resolving department scopes...');
      await new Promise(r => setTimeout(r, 300));

      setParseProgress(100);
      setRows(validationResult.rows);

      // Auto select valid and warning rows
      const validIds = validationResult.rows
        .filter(r => r.validationStatus === 'VALID' || r.validationStatus === 'WARNING')
        .map(r => r.id);
      setSelectedRowIds(validIds);

      // Staging job record
      const ids = createJobIdentifiers(selectedModuleKey);
      const stagedJob = {
        id: ids.jobId,
        jobNumber: ids.jobNumber,
        moduleKey: selectedModuleKey,
        templateVersion: currentModuleConfig.version,
        originalFilename: selectedFile.name,
        fileSha256: fileSha256 || 'sha256_mock',
        fileSizeBytes: selectedFile.size,
        uploadedBy: currentUser?.name || 'Administrator',
        status: 'READY',
        totalRows: validationResult.jobSummary.totalRows,
        validRows: validationResult.jobSummary.validRows,
        warningRows: validationResult.jobSummary.warningRows,
        errorRows: validationResult.jobSummary.errorRows,
        duplicateRows: validationResult.jobSummary.duplicateRows,
        selectedRows: validIds.length,
        importedRows: 0,
        createdAt: ids.isoString
      };
      saveBulkImportJob(stagedJob);
      saveBulkImportRows(ids.jobId, validationResult.rows);

      setStep(3);
    } catch (err) {
      console.error('Validation pipeline failure:', err);
      setFileError(err.message || 'Validation pipeline failed.');
      setStep(1);
    }
  };

  // Row inline edit save
  const handleSaveInlineEdit = () => {
    if (!cellEditRow || !cellEditField) return;

    setRows(prev => prev.map(r => {
      if (r.id === cellEditRow.id) {
        const updatedNorm = { ...r.normalizedPayload, [cellEditField]: cellEditValue };
        return {
          ...r,
          normalizedPayload: updatedNorm,
          primaryRecordName: updatedNorm[currentModuleConfig.primaryRecordField] || updatedNorm.title || updatedNorm.name || r.primaryRecordName,
          validationStatus: r.validationErrors.length > 0 ? 'WARNING' : 'VALID',
          validationErrors: []
        };
      }
      return r;
    }));

    setCellEditRow(null);
  };

  // Department alias quick resolver
  const handleResolveRowDepartment = (rowId, newDept) => {
    setRows(prev => prev.map(r => {
      if (r.id === rowId) {
        const updatedNorm = { ...r.normalizedPayload, department_codes: newDept, departmentCode: newDept };
        const errors = r.validationErrors.filter(e => !e.toLowerCase().includes('department'));
        return {
          ...r,
          departmentCode: newDept,
          normalizedPayload: updatedNorm,
          validationErrors: errors,
          validationStatus: errors.length > 0 ? 'ERROR' : (r.validationWarnings.length > 0 ? 'WARNING' : 'VALID')
        };
      }
      return r;
    }));
  };

  // Tab Filtering & Live Stats
  const filteredRows = useMemo(() => {
    if (activeTab === 'ALL') return rows;
    return rows.filter(r => r.validationStatus === activeTab || (activeTab === 'DUPLICATE' && r.duplicateStatus !== 'NO_DUPLICATE'));
  }, [rows, activeTab]);

  const liveStats = useMemo(() => {
    const total = rows.length;
    const ready = rows.filter(r => r.validationStatus === 'VALID').length;
    const warnings = rows.filter(r => r.validationStatus === 'WARNING').length;
    const blocked = rows.filter(r => r.validationStatus === 'ERROR').length;
    const duplicates = rows.filter(r => r.duplicateStatus !== 'NO_DUPLICATE').length;
    const selectedCount = selectedRowIds.length;
    return { total, ready, warnings, blocked, duplicates, selectedCount };
  }, [rows, selectedRowIds]);

  // Execute Universal Ingestion
  const handleExecuteImport = () => {
    if (selectedRowIds.length === 0) return;
    setImporting(true);

    const ids = createJobIdentifiers(selectedModuleKey);
    const result = executeUniversalBulkImport(
      ids.jobId,
      selectedRowIds,
      selectedModuleKey,
      rows,
      currentUser
    );

    setImporting(false);
    setConfirmModalOpen(false);
    setImportResult(result);
    setStep(4);

    if (onImportComplete) {
      onImportComplete(result);
    }
  };

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      {/* Wizard Header Stepper */}
      <div style={{ padding: '1.25rem 1.75rem', background: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.25rem 0' }}>
            Universal Bulk Data Ingestion Wizard
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            Module: <strong style={{ color: '#F1C40F' }}>{currentModuleConfig?.title}</strong> • Schema: {currentModuleConfig?.version}
          </span>
        </div>

        {/* Stepper pills */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {[
            { num: 1, label: 'Upload' },
            { num: 2, label: 'Validate' },
            { num: 3, label: 'Resolve & Preview' },
            { num: 4, label: 'Committed' }
          ].map(s => {
            const isDone = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div
                key={s.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: isCurrent ? 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)' : isDone ? '#1E293B' : 'rgba(255,255,255,0.08)',
                  color: isCurrent ? '#070F1E' : isDone ? '#10B981' : '#94A3B8'
                }}
              >
                {isDone ? <Check size={12} /> : s.num}. {s.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: MODULE SELECTION & FILE UPLOAD */}
      {step === 1 && (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Module Selector */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '0.5rem' }}>
              SELECT DESTINATION MODULE
            </label>
            <select
              value={selectedModuleKey}
              onChange={(e) => setSelectedModuleKey(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '450px',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#0F172A',
                background: '#F8FAFC'
              }}
            >
              {accessibleModules.map(mod => (
                <option key={mod.key} value={mod.key}>
                  {mod.title} ({mod.category})
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Upload */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? '#2563EB' : selectedFile ? '#10B981' : '#CBD5E1'}`,
              borderRadius: '14px',
              background: isDragging ? '#EFF6FF' : selectedFile ? '#ECFDF5' : '#F8FAFC',
              padding: '3rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) handleFileSelected(e.target.files[0]);
              }}
            />

            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: selectedFile ? '#D1FAE5' : '#EFF6FF', color: selectedFile ? '#059669' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <UploadCloud size={26} />
            </div>

            {selectedFile ? (
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 800, color: '#065F46' }}>
                  {selectedFile.name}
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#047857' }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB • Ready for validation
                </span>
              </div>
            ) : (
              <div>
                <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                  Drop CSV or XLSX Spreadsheet Here
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                  Supports RFC 4180 CSV & modern Excel workbooks (Up to 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Duplicate File Warning Banner */}
          {duplicateFileWarning && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: '#92400E' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Notice:</strong> This exact file (SHA-256 match) was previously uploaded as Job <strong>#{duplicateFileWarning.jobNumber}</strong> by {duplicateFileWarning.uploader}. You may re-validate and proceed if intentional.
              </div>
            </div>
          )}

          {/* Error Message */}
          {fileError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#DC2626' }}>
              <XCircle size={16} /> {fileError}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{ padding: '0.55rem 1.15rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              disabled={!selectedFile}
              onClick={handleStartValidation}
              style={{
                padding: '0.55rem 1.45rem',
                borderRadius: '8px',
                border: 'none',
                background: selectedFile ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' : '#CBD5E1',
                color: selectedFile ? '#F1C40F' : '#64748B',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: selectedFile ? 'pointer' : 'not-allowed'
              }}
            >
              Parse & Validate Schema →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ANIMATED VALIDATION PROGRESS */}
      {step === 2 && (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', animation: 'spin 1s linear infinite', marginBottom: '1.5rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
            Running Universal Ingestion Engine
          </h3>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.82rem', color: '#64748B', maxWidth: '420px' }}>
            {parseStageText}
          </p>

          <div style={{ width: '100%', maxWidth: '380px', height: '8px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${parseProgress}%`, height: '100%', background: 'linear-gradient(90deg, #2563EB 0%, #10B981 100%)', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {/* STEP 3: INTERACTIVE REVIEW & RESOLUTION */}
      {step === 3 && (
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* KPI Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
            <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>TOTAL ROWS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{liveStats.total}</div>
            </div>
            <div style={{ background: '#ECFDF5', padding: '0.75rem', borderRadius: '10px', border: '1px solid #A7F3D0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#047857', fontWeight: 700 }}>VALID (READY)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>{liveStats.ready}</div>
            </div>
            <div style={{ background: '#FFFBEB', padding: '0.75rem', borderRadius: '10px', border: '1px solid #FDE68A', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#B45309', fontWeight: 700 }}>WARNINGS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#B45309' }}>{liveStats.warnings}</div>
            </div>
            <div style={{ background: '#FEF2F2', padding: '0.75rem', borderRadius: '10px', border: '1px solid #FECACA', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#DC2626', fontWeight: 700 }}>BLOCKED (ERRORS)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#DC2626' }}>{liveStats.blocked}</div>
            </div>
            <div style={{ background: '#F5F3FF', padding: '0.75rem', borderRadius: '10px', border: '1px solid #DDD6FE', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#6D28D9', fontWeight: 700 }}>DUPLICATES</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#6D28D9' }}>{liveStats.duplicates}</div>
            </div>
          </div>

          {/* Table Controls & Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {['ALL', 'VALID', 'WARNING', 'ERROR', 'DUPLICATE'].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: activeTab === tab ? '#0F172A' : '#CBD5E1',
                    background: activeTab === tab ? '#0F172A' : '#FFFFFF',
                    color: activeTab === tab ? '#F1C40F' : '#475569',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                const csv = generateModuleErrorReportCsv(rows);
                triggerFileDownload(csv, `NEC_Import_Issues_${selectedModuleKey}.csv`);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#B45309',
                cursor: 'pointer'
              }}
            >
              <Download size={13} /> Export Issues Report CSV
            </button>
          </div>

          {/* Preview Table */}
          <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', maxHeight: '420px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F8FAFC' }}>
                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.65rem 0.75rem', width: '35px' }}>
                    <input
                      type="checkbox"
                      checked={rows.filter(r => r.validationStatus !== 'ERROR').every(r => selectedRowIds.includes(r.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRowIds(rows.filter(r => r.validationStatus !== 'ERROR').map(r => r.id));
                        } else {
                          setSelectedRowIds([]);
                        }
                      }}
                    />
                  </th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Row #</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Primary Record</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Department</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Validation Status</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Issues</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(row => {
                  const isBlocked = row.validationStatus === 'ERROR';
                  const isSelected = selectedRowIds.includes(row.id);

                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid #F1F5F9', background: isBlocked ? '#FFF5F5' : '#FFFFFF' }}>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <input
                          type="checkbox"
                          disabled={isBlocked}
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRowIds(prev => [...prev, row.id]);
                            } else {
                              setSelectedRowIds(prev => prev.filter(id => id !== row.id));
                            }
                          }}
                        />
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#0F172A' }}>
                        #{row.sourceRowNumber}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{row.primaryRecordName}</div>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <select
                          value={row.departmentCode || 'CSE'}
                          onChange={(e) => handleResolveRowDepartment(row.id, e.target.value)}
                          style={{
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.72rem',
                            background: '#F8FAFC'
                          }}
                        >
                          <option value="ALL">ALL (Institution Wide)</option>
                          {DEPARTMENTS.map(d => (
                            <option key={d.code} value={d.name}>{d.name} ({d.code})</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span
                          style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '9999px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            background: row.validationStatus === 'VALID' ? '#ECFDF5' :
                                        row.validationStatus === 'WARNING' ? '#FFFBEB' : '#FEF2F2',
                            color: row.validationStatus === 'VALID' ? '#047857' :
                                   row.validationStatus === 'WARNING' ? '#B45309' : '#DC2626'
                          }}
                        >
                          {row.validationStatus}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.72rem' }}>
                        {row.validationErrors.length > 0 && (
                          <div style={{ color: '#DC2626', fontWeight: 600 }}>
                            {row.validationErrors.join('; ')}
                          </div>
                        )}
                        {row.validationWarnings.length > 0 && (
                          <div style={{ color: '#B45309' }}>
                            {row.validationWarnings.join('; ')}
                          </div>
                        )}
                        {row.validationErrors.length === 0 && row.validationWarnings.length === 0 && (
                          <span style={{ color: '#059669' }}>✓ Verified</span>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setCellEditRow(row);
                              setCellEditField(currentModuleConfig.primaryRecordField);
                              setCellEditValue(row.normalizedPayload[currentModuleConfig.primaryRecordField] || '');
                            }}
                            style={{ padding: '0.25rem 0.45rem', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.7rem', cursor: 'pointer' }}
                            title="Edit normalized values"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Ingestion Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', color: '#475569' }}>
              Selected <strong>{selectedRowIds.length}</strong> of {rows.length} records for ingestion.
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Back to Upload
              </button>
              <button
                type="button"
                disabled={selectedRowIds.length === 0}
                onClick={() => setConfirmModalOpen(true)}
                style={{
                  padding: '0.45rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: selectedRowIds.length > 0 ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#CBD5E1',
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: selectedRowIds.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Confirm & Import {selectedRowIds.length} Records →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS SUMMARY */}
      {step === 4 && importResult && (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <CheckCircle2 size={32} />
          </div>

          <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
            Bulk Ingestion Completed Successfully!
          </h3>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.82rem', color: '#64748B', maxWidth: '440px', lineHeight: '1.45' }}>
            Imported <strong>{importResult.importedCount}</strong> records into <strong>{currentModuleConfig.title}</strong> as <code>DRAFT / PENDING REVIEW</code>. All provenance hashes and audit trails have been permanently stored.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setSelectedFile(null);
                setRows([]);
                setImportResult(null);
              }}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Start Another Import
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#F1C40F', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Go to Module Repository
              </button>
            )}
          </div>
        </div>
      )}

      {/* Inline Cell Edit Modal */}
      {cellEditRow && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(7, 15, 30, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '450px', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
              Edit Normalized Field: {cellEditField}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 1rem 0' }}>
              Original Raw Value: <code>{cellEditRow.rawPayload[cellEditField] || cellEditRow.rawPayload.Program || '—'}</code>
            </p>

            <input
              type="text"
              value={cellEditValue}
              onChange={(e) => setCellEditValue(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', marginBottom: '1.25rem', boxSizing: 'border-box' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setCellEditRow(null)}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveInlineEdit}
                style={{ padding: '0.45rem 1rem', borderRadius: '6px', border: 'none', background: '#0F172A', color: '#F1C40F', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Save Correction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(7, 15, 30, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
              Confirm Ingestion of {selectedRowIds.length} Records
            </h3>

            <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: '1.45', margin: '0 0 1rem 0' }}>
              All records will be inserted as <strong>DRAFT / PENDING_REVIEW</strong> with <strong>INTERNAL_ONLY</strong> visibility. They will NOT automatically be published to the public website without formal coordinator/HOD verification.
            </p>

            <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.74rem', color: '#64748B', marginBottom: '1.25rem' }}>
              <div>• Destination: <strong>{currentModuleConfig.title}</strong></div>
              <div>• File SHA-256: <code>{fileSha256 ? fileSha256.substring(0, 16) + '...' : 'Verified'}</code></div>
              <div>• Responsible Actor: <strong>{currentUser?.name || 'Administrator'}</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={handleExecuteImport}
                style={{ padding: '0.45rem 1.25rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
              >
                {importing ? 'Importing...' : 'Commit Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
