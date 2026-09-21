import React, { useMemo } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ShieldCheck, 
  FileText, 
  Handshake, 
  ArrowRight,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { getMoUs, getPublications, getStudentProjects, getMemberships } from '../../../data/portalStore.js';
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

export default function AlertsCenterView({ currentUser, onNavigate }) {
  const mous = getMoUs();
  const pubs = getPublications();
  const projects = getStudentProjects();
  const memberships = getMemberships();

  const now = new Date();

  // Expiring MoUs with calculated days remaining and stable IDs
  const expiringMous = useMemo(() => {
    return (mous || []).map(m => {
      if (!m.expiryDate) return null;
      const exp = new Date(m.expiryDate);
      const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
      return {
        ...m,
        alertId: `MOU_EXPIRY_${m.mouNumber || m.id}`,
        daysRemaining: diffDays
      };
    }).filter(m => m && m.daysRemaining <= 60);
  }, [mous]);

  // Pending Publications
  const pendingPubs = useMemo(() => {
    return pubs.filter(p => p.verificationStatus === 'Pending Review' || p.verificationStatus === 'Submitted' || p.workflowStatus === 'SUBMITTED' || p.workflowStatus === 'UNDER_REVIEW');
  }, [pubs]);

  // Expiring Memberships
  const expiringMemberships = useMemo(() => {
    return memberships.filter(m => {
      if (m.membershipType === 'Life' || !m.validTill) return false;
      const exp = new Date(m.validTill);
      const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
      return diffDays <= 90;
    });
  }, [memberships]);

  return (
    <MotionPage style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
      {/* Header */}
      <ModulePageHeader
        breadcrumbs={[
          { label: 'Dashboard' },
          { label: 'Governance' },
          { label: 'Alerts & Notices' }
        ]}
        title="Institutional Action Center & Alerts"
        subtitle="Active compliance deadlines, pending approvals, expiring MoUs, and faculty professional body renewals."
      />

      {/* Alert Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* 1. MoU Alerts */}
        <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Handshake size={18} style={{ color: '#D97706' }} /> Industry MoU Renewals & Expiry Alerts ({expiringMous.length})
            </h3>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('mous-collaborations')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.76rem', fontWeight: 700, color: '#D97706', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Go to MoUs <ArrowRight size={13} />
              </button>
            )}
          </div>

          {expiringMous.length === 0 ? (
            <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', color: '#059669', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} /> All active institutional MoUs are within compliant validity windows.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {expiringMous.map(m => (
                <div key={m.alertId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.1rem', background: '#FFFBEB', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#92400E', background: '#FEF3C7', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #FCD34D' }}>
                        MoU Expiration Notice
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: 700 }}>
                        {m.daysRemaining > 0 ? `${m.daysRemaining} Days Remaining` : 'Expired'}
                      </span>
                    </div>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.88rem', marginTop: '0.25rem' }}>
                      {m.organization || m.partnerOrganization}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.15rem' }}>
                      Department: <strong>{m.department || 'Institution Level'}</strong> • Expiry Date: <strong>{m.expiryDate}</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('mous-collaborations')}
                    style={{ padding: '0.45rem 0.9rem', background: '#D97706', color: '#FFFFFF', borderRadius: '8px', border: 'none', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Review MoU
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Publication Verification Queue */}
        <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <FileText size={18} style={{ color: '#2563EB' }} /> Research Publications Awaiting Verification ({pendingPubs.length})
            </h3>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('publications')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.76rem', fontWeight: 700, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Go to Publications <ArrowRight size={13} />
              </button>
            )}
          </div>

          {pendingPubs.length === 0 ? (
            <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', color: '#059669', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} /> All faculty publications have been reviewed and verified for NAAC SSR submission.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {pendingPubs.slice(0, 5).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#1E40AF', fontSize: '0.84rem' }}>{p.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#3B82F6' }}>Author: {p.facultyName || p.firstAuthor} • Dept: {p.department}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('publications')}
                    style={{ padding: '0.35rem 0.75rem', background: '#2563EB', color: '#FFFFFF', borderRadius: '6px', border: 'none', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Verify Paper
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Faculty Memberships Expiry Queue */}
        <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <BookOpen size={18} style={{ color: '#7C3AED' }} /> Faculty Professional Memberships Requiring Renewal ({expiringMemberships.length})
            </h3>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('faculty-memberships')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.76rem', fontWeight: 700, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Go to Memberships <ArrowRight size={13} />
              </button>
            )}
          </div>

          {expiringMemberships.length === 0 ? (
            <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', color: '#059669', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} /> All annual faculty society memberships (IEEE, CSI, IETE) are active and verified.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {expiringMemberships.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#F5F3FF', borderRadius: '8px', border: '1px solid #DDD6FE' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#5B21B6', fontSize: '0.84rem' }}>{m.facultyName} — {m.organization}</div>
                    <div style={{ fontSize: '0.72rem', color: '#7C3AED' }}>Membership No: {m.membershipNumber} • Valid Till: {m.validTill}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('faculty-memberships')}
                    style={{ padding: '0.35rem 0.75rem', background: '#7C3AED', color: '#FFFFFF', borderRadius: '6px', border: 'none', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Renew
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MotionPage>
  );
}
