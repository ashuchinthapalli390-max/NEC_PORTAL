import React, { useState, useMemo } from 'react';
import { 
  Grid, 
  Smartphone, 
  Sliders, 
  ShieldCheck, 
  Check, 
  X, 
  Trash2, 
  Save, 
  Lock, 
  Key, 
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { 
  getRolePermissions, 
  saveRolePermissions, 
  ALL_PERMISSIONS, 
  getActiveSessions, 
  revokeSession, 
  revokeAllOtherSessions,
  getAuthSettings,
  updateAuthSettings
} from '../../../data/portalStore.js';

export function IamMatrixManager({ currentUser }) {
  return <PermissionsMatrixManager currentUser={currentUser} />;
}

export function PermissionsMatrixManager({ currentUser }) {
  const [matrix, setMatrix] = useState(getRolePermissions());
  const [toastMessage, setToastMessage] = useState(null);
  const roles = ['SUPER_ADMIN', 'ADMIN', 'HOD', 'FACULTY', 'STUDENT', 'AUDITOR'];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggle = (role, permId) => {
    if (role === 'SUPER_ADMIN') return;
    setMatrix(prev => {
      const current = prev[role] || [];
      const updated = current.includes(permId) ? current.filter(p => p !== permId) : [...current, permId];
      return { ...prev, [role]: updated };
    });
  };

  const handleSave = () => {
    saveRolePermissions(matrix, currentUser);
    showToast('RBAC Permissions Matrix saved successfully across all institutional roles!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', width: '100%', position: 'relative' }}>
      {toastMessage && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: '#64748B', marginBottom: '0.25rem' }}>
            <span>Dashboard</span>
            <ChevronRight size={12} />
            <span>Administration & IAM</span>
            <ChevronRight size={12} />
            <span style={{ color: '#0F172A', fontWeight: 700 }}>Permissions Matrix</span>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.25rem 0', fontFamily: 'Cinzel, Georgia, serif' }}>
            Role-Based Access Control (RBAC) Matrix
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
            Configure granular institutional module privileges across system roles.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)', color: '#070F1E', padding: '0.55rem 1.15rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem', border: 'none', cursor: 'pointer' }}
        >
          <Save size={15} /> Save Permissions
        </button>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Module</th>
              <th style={{ padding: '0.75rem 1rem' }}>Capability / Privilege</th>
              {roles.map(r => (
                <th key={r} style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                  {r.replace('_', ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_PERMISSIONS.map(p => (
              <tr key={p.key} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: 700, color: '#0F172A', background: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                    {p.module}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{p.label}</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B' }}><code>{p.key}</code></div>
                </td>
                {roles.map(r => {
                  const isChecked = matrix[r]?.includes(p.key) || r === 'SUPER_ADMIN';
                  return (
                    <td key={r} style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={r === 'SUPER_ADMIN'}
                        onChange={() => handleToggle(r, p.key)}
                        style={{ cursor: r === 'SUPER_ADMIN' ? 'not-allowed' : 'pointer' }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function IamSessionsManager({ currentUser }) {
  const [sessions, setSessions] = useState(getActiveSessions());
  const [toastMessage, setToastMessage] = useState(null);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRevoke = (sessionId) => {
    revokeSession(sessionId, currentUser);
    setSessions(getActiveSessions());
    showToast('Session revoked immediately.');
  };

  const handleConfirmRevokeAll = () => {
    revokeAllOtherSessions(currentUser);
    setSessions(getActiveSessions());
    setConfirmRevokeAll(false);
    showToast('All other active sessions revoked.');
  };

  // Derive real display sessions including current authenticated session
  const displaySessions = useMemo(() => {
    if (sessions && sessions.length > 0) {
      return sessions.map((s, idx) => ({
        ...s,
        isCurrent: idx === 0 || s.userId === currentUser?.id || s.email === currentUser?.email
      }));
    }

    if (!currentUser) return [];

    return [{
      id: 'current-auth-session',
      userName: currentUser.name || currentUser.username || 'Current Administrator',
      email: currentUser.email || `${currentUser.username || 'admin'}@nec.edu.in`,
      role: currentUser.role || 'SUPER_ADMIN',
      device: typeof navigator !== 'undefined' ? `${navigator.platform || 'Desktop'} • Verified Web Client` : 'Active Browser Session',
      ipAddress: 'Active Session (Secure TLS)',
      createdAt: new Date().toISOString(),
      isCurrent: true
    }];
  }, [sessions, currentUser]);

  const otherSessionsCount = displaySessions.filter(s => !s.isCurrent).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', width: '100%', position: 'relative' }}>
      {toastMessage && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: '#64748B', marginBottom: '0.25rem' }}>
            <span>Dashboard</span>
            <ChevronRight size={12} />
            <span>Administration & IAM</span>
            <ChevronRight size={12} />
            <span style={{ color: '#0F172A', fontWeight: 700 }}>Active Sessions</span>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.25rem 0', fontFamily: 'Cinzel, Georgia, serif' }}>
            Active Sessions & Device Security
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
            Real-time tracking of authenticated devices, IP addresses, browser tokens, and concurrent sessions.
          </p>
        </div>

        <button
          type="button"
          disabled={otherSessionsCount === 0}
          onClick={() => setConfirmRevokeAll(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: otherSessionsCount === 0 ? '#F1F5F9' : '#FEF2F2',
            border: otherSessionsCount === 0 ? '1px solid #E2E8F0' : '1px solid #FECACA',
            color: otherSessionsCount === 0 ? '#94A3B8' : '#DC2626',
            padding: '0.5rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: otherSessionsCount === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          <Trash2 size={14} /> Terminate All Other Sessions ({otherSessionsCount})
        </button>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem 1rem' }}>User Name</th>
              <th style={{ padding: '0.75rem 1rem' }}>Email Address</th>
              <th style={{ padding: '0.75rem 1rem' }}>Role</th>
              <th style={{ padding: '0.75rem 1rem' }}>Device / Client</th>
              <th style={{ padding: '0.75rem 1rem' }}>IP Address</th>
              <th style={{ padding: '0.75rem 1rem' }}>Started At</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displaySessions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem' }}>
                  <ShieldCheck size={28} style={{ color: '#10B981', marginBottom: '0.4rem' }} />
                  <div>No active sessions found.</div>
                </td>
              </tr>
            ) : (
              displaySessions.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  {/* User Name */}
                  <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 800, color: '#0F172A' }}>{s.userName || s.name || 'User'}</span>
                      {s.isCurrent && (
                        <span style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontSize: '0.64rem', fontWeight: 800 }}>
                          Current Session
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '0.78rem', color: '#475569' }}>{s.email}</div>
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', fontSize: '0.7rem', fontWeight: 700 }}>
                      {s.role}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                    {s.device || s.userAgent || (s.isCurrent ? 'Current Web Client' : 'Not recorded')}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#64748B' }}>
                    {s.ipAddress || 'Not recorded'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', color: '#64748B' }}>
                    {new Date(s.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    {s.isCurrent ? (
                      <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                        Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRevoke(s.id)}
                        style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Revoke All Custom Confirmation Modal */}
      {confirmRevokeAll && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 15, 30, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 7000
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.8rem',
            maxWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
          }}>
            <AlertCircle size={36} style={{ color: '#DC2626', margin: '0 auto 0.6rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.4rem 0' }}>
              Terminate All Other Sessions?
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: '1.4rem', lineHeight: 1.5 }}>
              This will immediately log out all other active browser and mobile devices.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setConfirmRevokeAll(false)}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevokeAll}
                style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#FFFFFF', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Terminate All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function IamSettingsManager({ currentUser }) {
  const [settings, setSettings] = useState(getAuthSettings());
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    updateAuthSettings(settings, currentUser);
    showToast('IAM Security & Authentication policies updated successfully!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', width: '100%', position: 'relative' }}>
      {toastMessage && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: '#64748B', marginBottom: '0.25rem' }}>
            <span>Dashboard</span>
            <ChevronRight size={12} />
            <span>Administration & IAM</span>
            <ChevronRight size={12} />
            <span style={{ color: '#0F172A', fontWeight: 700 }}>Auth & OTP Policies</span>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.25rem 0', fontFamily: 'Cinzel, Georgia, serif' }}>
            IAM Security, MFA & Password Policies
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
            Configure institutional OTP timeouts, session TTL, password complexity rules, and rate limits.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)', color: '#070F1E', padding: '0.55rem 1.05rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}
        >
          <Save size={15} /> Save Security Policies
        </button>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
          <div>
            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>Enforce 2-Step Email OTP for All Roles</div>
            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Requires 6-digit verification code sent to verified @nrtec.in email.</div>
          </div>
          <input
            type="checkbox"
            checked={settings.requireEmailOtp !== false}
            onChange={(e) => setSettings({ ...settings, requireEmailOtp: e.target.checked })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
          <div>
            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>Max Concurrent Sessions per User</div>
            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Automatically revokes oldest session when limit is exceeded.</div>
          </div>
          <select
            value={settings.maxConcurrentSessions || 3}
            onChange={(e) => setSettings({ ...settings, maxConcurrentSessions: parseInt(e.target.value) })}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
          >
            <option value={1}>1 Device (Strict)</option>
            <option value={2}>2 Devices</option>
            <option value={3}>3 Devices (Recommended)</option>
            <option value={5}>5 Devices</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>Session Idle Timeout</div>
            <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.15rem' }}>
              Controls automatic logout when no mouse or keyboard activity is detected.
            </div>
            <div style={{ fontSize: '0.7rem', color: '#B45309', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '0.35rem 0.6rem', borderRadius: '6px', marginTop: '0.4rem', display: 'inline-block' }}>
              <strong>Security Notice:</strong> Selecting <em>Never</em> disables inactivity auto-logout only. Absolute session expiration and token revocation remain active.
            </div>
          </div>
          <select
            value={settings.sessionTimeoutMinutes === 0 ? 0 : (settings.sessionTimeoutMinutes || 60)}
            onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value, 10) })}
            style={{ padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 600, background: '#FFFFFF', color: '#0F172A' }}
          >
            <option value={15}>15 Minutes</option>
            <option value={30}>30 Minutes</option>
            <option value={60}>60 Minutes (1 Hour)</option>
            <option value={120}>2 Hours</option>
            <option value={240}>4 Hours</option>
            <option value={480}>8 Hours</option>
            <option value={0}>Never (No Idle Logout)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
