import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  RotateCcw, 
  Download, 
  Eye, 
  Search
} from 'lucide-react';
import { 
  getBulkImportJobs, 
  getBulkImportRows, 
  rollbackBulkImportJob 
} from '../../../data/portalStore.js';
import { 
  generateModuleErrorReportCsv, 
  triggerFileDownload 
} from '../../../lib/bulk-import/bulkImportCore.js';

export default function ImportHistoryView({ currentUser, onRefreshNeeded }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);
  const [rollbackConfirmJob, setRollbackConfirmJob] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [_dataVersion, setDataVersion] = useState(0);

  const showToast = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const jobs = getBulkImportJobs();

  const filteredJobs = jobs.filter(job => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (job.jobNumber && job.jobNumber.toLowerCase().includes(q)) ||
      (job.moduleKey && job.moduleKey.toLowerCase().includes(q)) ||
      (job.originalFilename && job.originalFilename.toLowerCase().includes(q)) ||
      (job.uploadedBy && job.uploadedBy.toLowerCase().includes(q)) ||
      (job.status && job.status.toLowerCase().includes(q))
    );
  });

  const handleDownloadErrors = (job) => {
    const rows = getBulkImportRows(job.id);
    if (rows.length === 0) {
      showToast('No detailed row logs found for this job.');
      return;
    }
    const csvContent = generateModuleErrorReportCsv(rows);
    const filename = `NEC_Import_Issues_${job.jobNumber || job.id}.csv`;
    triggerFileDownload(csvContent, filename);
  };

  const handleExecuteRollback = () => {
    if (!rollbackConfirmJob) return;
    const res = rollbackBulkImportJob(rollbackConfirmJob.id, currentUser);
    if (res.success) {
      showToast(`Successfully rolled back ${res.rolledBackCount} draft record(s) from Job #${rollbackConfirmJob.jobNumber || rollbackConfirmJob.id}.`);
      setRollbackConfirmJob(null);
      setDataVersion(v => v + 1);
      if (onRefreshNeeded) onRefreshNeeded();
    } else {
      showToast(`Rollback blocked: ${res.error}`);
      setRollbackConfirmJob(null);
    }
  };

  const canRollback = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toast */}
      {actionMessage && (
        <div style={{ padding: '0.65rem 1rem', borderRadius: '8px', background: '#0F172A', color: '#F1C40F', fontSize: '0.82rem', fontWeight: 700 }}>
          {actionMessage}
        </div>
      )}

      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.25rem 0' }}>
            Bulk Ingestion Audit & Provenance History
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
            Inspect every dataset uploaded to the institution with cryptographic SHA-256 signatures, row counts, and safe rollback controls.
          </p>
        </div>

        <div style={{ position: 'relative', width: '240px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search import history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.65rem 0.45rem 2rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.78rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Jobs Table */}
      {filteredJobs.length === 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F8FAFC', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <FileSpreadsheet size={24} />
          </div>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.35rem 0' }}>
            No Bulk Import Jobs Recorded Yet
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748B', maxWidth: '420px', margin: '0 auto' }}>
            When authorized faculty or administrators import datasets via CSV or Excel, permanent cryptographic audit records will appear here.
          </p>
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Job Number</th>
                <th style={{ padding: '0.75rem 1rem' }}>Module</th>
                <th style={{ padding: '0.75rem 1rem' }}>File Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>SHA-256 Hash</th>
                <th style={{ padding: '0.75rem 1rem' }}>Uploader</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Rows</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map(job => (
                <tr key={job.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0F172A' }}>
                    {job.jobNumber || job.id.substring(0, 16)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                      {job.moduleKey}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#334155' }}>{job.originalFilename || '—'}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#64748B' }}>
                      {job.fileSha256 ? job.fileSha256.substring(0, 16) + '...' : '—'}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                    {job.uploadedBy || 'Administrator'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', color: '#64748B' }}>
                    {job.createdAt ? new Date(job.createdAt).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{job.importedRows || job.totalRows || 0}</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}> / {job.totalRows || 0}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: job.status === 'COMPLETED' ? '#ECFDF5' :
                                    job.status === 'COMPLETED_WITH_ERRORS' ? '#FFFBEB' :
                                    job.status === 'ROLLED_BACK' ? '#FEF2F2' : '#F1F5F9',
                        color: job.status === 'COMPLETED' ? '#047857' :
                               job.status === 'COMPLETED_WITH_ERRORS' ? '#B45309' :
                               job.status === 'ROLLED_BACK' ? '#DC2626' : '#475569'
                      }}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedJobDetail(job)}
                        style={{ padding: '0.3rem 0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.72rem', cursor: 'pointer' }}
                        title="View Job Details"
                      >
                        <Eye size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadErrors(job)}
                        style={{ padding: '0.3rem 0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.72rem', cursor: 'pointer', color: '#B45309' }}
                        title="Download Error Report CSV"
                      >
                        <Download size={13} />
                      </button>

                      {canRollback && job.status !== 'ROLLED_BACK' && (
                        <button
                          type="button"
                          onClick={() => setRollbackConfirmJob(job)}
                          style={{ padding: '0.3rem 0.55rem', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', fontSize: '0.72rem', cursor: 'pointer', color: '#DC2626' }}
                          title="Rollback Draft Import"
                        >
                          <RotateCcw size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJobDetail && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(7, 15, 30, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '650px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '1.15rem 1.5rem', background: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Import Job Details: {selectedJobDetail.jobNumber || selectedJobDetail.id}
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  Module: {selectedJobDetail.moduleKey} • Status: {selectedJobDetail.status}
                </span>
              </div>
              <button type="button" onClick={() => setSelectedJobDetail(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.8rem' }}>
                <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>FILENAME</div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedJobDetail.originalFilename}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>UPLOADED BY</div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedJobDetail.uploadedBy || 'Administrator'}</div>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, marginBottom: '0.2rem' }}>FILE SHA-256 FINGERPRINT</div>
                <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: '#1E293B' }}>{selectedJobDetail.fileSha256 || '—'}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                <div style={{ background: '#EFF6FF', padding: '0.5rem', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: '0.65rem', color: '#1D4ED8', fontWeight: 700 }}>TOTAL</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1D4ED8' }}>{selectedJobDetail.totalRows || 0}</div>
                </div>
                <div style={{ background: '#ECFDF5', padding: '0.5rem', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '0.65rem', color: '#047857', fontWeight: 700 }}>IMPORTED</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#047857' }}>{selectedJobDetail.importedRows || 0}</div>
                </div>
                <div style={{ background: '#FFFBEB', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: '0.65rem', color: '#B45309', fontWeight: 700 }}>WARNINGS</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#B45309' }}>{selectedJobDetail.warningRows || 0}</div>
                </div>
                <div style={{ background: '#FEF2F2', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: '0.65rem', color: '#DC2626', fontWeight: 700 }}>BLOCKED</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#DC2626' }}>{selectedJobDetail.errorRows || 0}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.25rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSelectedJobDetail(null)}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rollback Confirmation Modal */}
      {rollbackConfirmJob && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(7, 15, 30, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RotateCcw size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                Rollback Bulk Import Job?
              </h3>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: '1.45', margin: '0 0 1.25rem 0' }}>
              Are you sure you want to rollback <strong>{rollbackConfirmJob.jobNumber || rollbackConfirmJob.id}</strong> ({rollbackConfirmJob.moduleKey})?
              All draft records created by this import will be removed. Records that have already been verified/approved in production will NOT be deleted.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setRollbackConfirmJob(null)}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRollback}
                style={{ padding: '0.45rem 1.15rem', borderRadius: '6px', border: 'none', background: '#DC2626', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Confirm Rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
