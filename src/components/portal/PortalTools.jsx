import React, { useState } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  ShieldAlert, 
  Search, 
  Calendar, 
  User, 
  FileText, 
  Download, 
  AlertTriangle, 
  Bell, 
  CheckCircle2,
  Clock,
  Sparkles,
  Printer
} from 'lucide-react';
import { 
  getRecycleBin, 
  restoreFromRecycleBin, 
  getAuditLogs, 
  getMoUs, 
  getPublications,
  exportToCSV,
  exportToExcel,
  exportToPDF
} from '../../data/portalStore.js';

/* 1. RECYCLE BIN (Soft Delete & Restore Engine) */
export function RecycleBin({ currentUser, onRestoreSuccess }) {
  const [search, setSearch] = useState('');
  const [restoreToast, setRestoreToast] = useState(null);
  const binItems = getRecycleBin();

  const filtered = binItems.filter(item => {
    const q = search.toLowerCase();
    return (item.title || item.name || item.id).toLowerCase().includes(q) || item.module.toLowerCase().includes(q);
  });

  const handleRestore = (item) => {
    restoreFromRecycleBin(item.id, item.module, currentUser);
    setRestoreToast(`Successfully restored "${item.title || item.name || item.id}" back to ${item.module.toUpperCase()}!`);
    setTimeout(() => setRestoreToast(null), 3500);
    if (onRestoreSuccess) onRestoreSuccess();
  };

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
      {restoreToast && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{restoreToast}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.8rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', color: '#0B192C', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trash2 size={20} style={{ color: '#EF4444' }} /> Institutional Recycle Bin ({binItems.length} Deleted Items)
          </h3>
          <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
            Soft-deleted records are retained here. Any authorized Admin can restore records with a single click.
          </div>
        </div>

        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search deleted items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '2rem', paddingRight: '0.6rem', fontSize: '0.82rem' }}
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#0B192C', color: '#FFFFFF' }}>
              <th style={{ padding: '0.8rem' }}>Original ID</th>
              <th style={{ padding: '0.8rem' }}>Module</th>
              <th style={{ padding: '0.8rem' }}>Record Title</th>
              <th style={{ padding: '0.8rem' }}>Deleted By</th>
              <th style={{ padding: '0.8rem' }}>Deleted At</th>
              <th style={{ padding: '0.8rem', textAlign: 'right' }}>Restore</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                  Recycle bin is empty. No deleted records.
                </td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0', background: '#FFF' }}>
                  <td style={{ padding: '0.8rem', fontWeight: 600, color: '#64748B' }}>{item.id}</td>
                  <td style={{ padding: '0.8rem' }}>
                    <span className="badge badge-navy">{item.module}</span>
                  </td>
                  <td style={{ padding: '0.8rem', fontWeight: 700, color: '#0B192C' }}>
                    {item.title || item.name || item.studentName || item.organization || item.id}
                  </td>
                  <td style={{ padding: '0.8rem', color: '#475569' }}>
                    {item.deletedBy || 'Admin User'}
                  </td>
                  <td style={{ padding: '0.8rem', color: '#64748B', fontSize: '0.8rem' }}>
                    {new Date(item.deletedAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleRestore(item)}
                      className="btn-primary"
                      style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem' }}
                    >
                      <RotateCcw size={12} /> 1-Click Restore
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* 2. AUDIT LOG VIEWER */
export function AuditLogViewer() {
  const [search, setSearch] = useState('');
  const logs = getAuditLogs();

  const filteredLogs = logs.filter(l => {
    const q = search.toLowerCase();
    return l.action.toLowerCase().includes(q) || l.module.toLowerCase().includes(q) || l.userName.toLowerCase().includes(q) || l.details.toLowerCase().includes(q);
  });

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.8rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', color: '#0B192C', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={20} style={{ color: '#D4AF37' }} /> System Audit Trail & Compliance Log ({logs.length} Actions)
          </h3>
          <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
            Immutable chronological logging of all creates, updates, soft deletes, restores, approvals, and research syncs.
          </div>
        </div>

        <div style={{ position: 'relative', width: '240px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '2rem', paddingRight: '0.6rem', fontSize: '0.82rem' }}
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#0B192C', color: '#FFFFFF' }}>
              <th style={{ padding: '0.8rem' }}>Timestamp</th>
              <th style={{ padding: '0.8rem' }}>User</th>
              <th style={{ padding: '0.8rem' }}>Action Type</th>
              <th style={{ padding: '0.8rem' }}>Module</th>
              <th style={{ padding: '0.8rem' }}>Summary</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid #E2E8F0', background: '#FFF' }}>
                <td style={{ padding: '0.8rem', color: '#64748B', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td style={{ padding: '0.8rem', fontWeight: 700, color: '#0B192C' }}>
                  <div>{log.userName}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 400 }}>{log.userRole}</div>
                </td>
                <td style={{ padding: '0.8rem' }}>
                  <span className={log.action.includes('DELETE') ? 'badge badge-danger' : log.action.includes('SYNC') ? 'badge badge-gold' : 'badge badge-success'}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: '0.8rem' }}>
                  <span className="badge badge-navy">{log.module}</span>
                </td>
                <td style={{ padding: '0.8rem', color: '#334155', maxWidth: '350px' }}>
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* 3. NOTIFICATION & 30-DAY EXPIRY ALERT DRAWER */
export function NotificationAlerts({ onSelectModule }) {
  const mous = getMoUs();
  const pubs = getPublications();

  // Find MoUs expiring within 30 days or already expired
  const now = new Date();
  const expiringMous = mous.filter(m => {
    if (!m.expiryDate) return false;
    const exp = new Date(m.expiryDate);
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  });

  const pendingPubs = pubs.filter(p => p.verificationStatus === 'Pending Review' || p.verificationStatus === 'Submitted');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
      {/* 30-day MoU Expiry Alert */}
      {expiringMous.length > 0 && (
        <div style={{
          background: '#FFFBEB',
          border: '1.5px solid #FCD34D',
          borderRadius: '12px',
          padding: '1rem 1.2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <AlertTriangle size={22} style={{ color: '#D97706', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, color: '#92400E', fontSize: '0.95rem' }}>
                MoU Expiration Notice ({expiringMous.length} Partnerships Requiring Renewal)
              </div>
              <div style={{ color: '#B45309', fontSize: '0.82rem' }}>
                {expiringMous.map(m => `${m.organization} (Expires: ${m.expiryDate})`).join(' • ')}
              </div>
            </div>
          </div>
          <button
            onClick={() => onSelectModule('mous-collaborations')}
            className="btn-outline"
            style={{ borderColor: '#D97706', color: '#92400E', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            Review MoUs
          </button>
        </div>
      )}

      {/* Pending Reviews Alert */}
      {pendingPubs.length > 0 && (
        <div style={{
          background: '#EFF6FF',
          border: '1.5px solid #93C5FD',
          borderRadius: '12px',
          padding: '1rem 1.2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Clock size={22} style={{ color: '#2563EB', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, color: '#1E40AF', fontSize: '0.95rem' }}>
                {pendingPubs.length} Research Publication(s) Awaiting HOD / Dean R&D Verification
              </div>
              <div style={{ color: '#3B82F6', fontSize: '0.82rem' }}>
                Latest submissions from faculty auto-sync and manual uploads ready for NAAC approval.
              </div>
            </div>
          </div>
          <button
            onClick={() => onSelectModule('publications')}
            className="btn-navy"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            Open Verification Queue
          </button>
        </div>
      )}
    </div>
  );
}
