import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Edit3, 
  FileCheck, 
  Globe, 
  Sparkles, 
  AlertCircle, 
  XCircle, 
  ShieldCheck,
  Calendar,
  Building2,
  Award,
  Check,
  Send,
  Briefcase
} from 'lucide-react';

/**
 * Normalizes input status strings safely
 */
export function normalizeStatusKey(status) {
  if (!status || typeof status !== 'string') return '';
  return status.trim().toUpperCase().replace(/[\s-]+/g, '_');
}

/**
 * 1. WORKFLOW STATUS BADGE (System-wide governance & approval workflow)
 * Domains: DRAFT, SUBMITTED, UNDER_REVIEW, NEEDS_REVISION, APPROVED, VERIFIED, REJECTED, ARCHIVED, REVISED
 */
export function getWorkflowBadge(status) {
  const key = normalizeStatusKey(status);
  switch (key) {
    case 'APPROVED':
      return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', icon: CheckCircle2, label: 'APPROVED' };
    case 'VERIFIED':
      return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', icon: CheckCircle2, label: 'VERIFIED' };
    case 'SUBMITTED':
      return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: Clock, label: 'SUBMITTED' };
    case 'UNDER_REVIEW':
      return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: Clock, label: 'UNDER REVIEW' };
    case 'IMPORTED_PENDING_REVIEW':
      return { bg: '#FDF4FF', text: '#7E22CE', border: '#F5D0FE', icon: Sparkles, label: 'IMPORTED (PENDING)' };
    case 'NEEDS_REVISION':
    case 'REVISION_REQUIRED':
      return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: AlertTriangle, label: 'REVISION REQ.' };
    case 'REJECTED':
      return { bg: '#FEF2F2', text: '#B91C1C', border: '#FCA5A5', icon: XCircle, label: 'REJECTED' };
    case 'ARCHIVED':
      return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', icon: Clock, label: 'ARCHIVED' };
    case 'DRAFT':
      return { bg: '#FEFCE8', text: '#A16207', border: '#FEF08A', icon: Edit3, label: 'DRAFT' };
    default:
      return { 
        bg: '#F8FAFC', 
        text: '#475569', 
        border: '#E2E8F0', 
        icon: Clock, 
        label: status ? String(status).toUpperCase() : 'DRAFT' 
      };
  }
}

/**
 * 2. MEMBERSHIP VALIDITY BADGE (Faculty professional bodies)
 * Domains: ACTIVE, EXPIRING_SOON, EXPIRED, LIFETIME
 */
export function getMembershipValidityBadge(status) {
  const key = normalizeStatusKey(status);
  switch (key) {
    case 'ACTIVE':
      return { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', icon: CheckCircle2, label: 'ACTIVE' };
    case 'LIFETIME':
      return { bg: '#FDF4FF', text: '#7E22CE', border: '#F5D0FE', icon: Sparkles, label: 'LIFETIME' };
    case 'EXPIRING_SOON':
      return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', icon: AlertTriangle, label: 'EXPIRING SOON' };
    case 'EXPIRED':
      return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: XCircle, label: 'EXPIRED' };
    default:
      return { 
        bg: '#F1F5F9', 
        text: '#475569', 
        border: '#CBD5E1', 
        icon: Clock, 
        label: status ? String(status).toUpperCase() : 'UNKNOWN' 
      };
  }
}
export const getValidityBadge = getMembershipValidityBadge;

/**
 * 3. PROGRAMME / EVENT STATUS BADGE (Workshops, FDPs, Seminars, Hackathons)
 * Domains: PLANNED, UPCOMING, ONGOING, COMPLETED, POSTPONED, CANCELLED
 */
export function getProgrammeStatusBadge(status) {
  const key = normalizeStatusKey(status);
  switch (key) {
    case 'COMPLETED':
      return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', icon: CheckCircle2, label: 'COMPLETED' };
    case 'ONGOING':
      return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: Clock, label: 'ONGOING' };
    case 'UPCOMING':
    case 'PLANNED':
      return { bg: '#FEFCE8', text: '#A16207', border: '#FEF08A', icon: Calendar, label: 'UPCOMING' };
    case 'POSTPONED':
      return { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', icon: AlertTriangle, label: 'POSTPONED' };
    case 'CANCELLED':
      return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: XCircle, label: 'CANCELLED' };
    default:
      return { 
        bg: '#F8FAFC', 
        text: '#475569', 
        border: '#CBD5E1', 
        icon: Clock, 
        label: status ? String(status).toUpperCase() : 'PLANNED' 
      };
  }
}
export const getEventStatusBadge = getProgrammeStatusBadge;

/**
 * 4. STUDENT / FACULTY PROJECT STATUS BADGE
 * Domains: COMPLETED, IN_PROGRESS, ONGOING, PROPOSED, SUBMITTED, PATENTED, EVALUATED
 */
export function getProjectStatusBadge(status) {
  const key = normalizeStatusKey(status);
  switch (key) {
    case 'COMPLETED':
    case 'EVALUATED':
      return { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', icon: CheckCircle2, label: 'COMPLETED' };
    case 'IN_PROGRESS':
    case 'ONGOING':
      return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: Clock, label: 'IN PROGRESS' };
    case 'PROPOSED':
    case 'SUBMITTED':
      return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', icon: AlertTriangle, label: 'SUBMITTED' };
    case 'PATENTED':
      return { bg: '#FDF4FF', text: '#7E22CE', border: '#F5D0FE', icon: Sparkles, label: 'PATENTED' };
    default:
      return { 
        bg: '#F1F5F9', 
        text: '#475569', 
        border: '#CBD5E1', 
        icon: Clock, 
        label: status ? String(status).toUpperCase() : 'ONGOING' 
      };
  }
}

/**
 * 5. INTERNSHIP STATUS BADGE
 * Domains: COMPLETED, ONGOING, UPCOMING, OFFERED, PURSUING
 */
export function getInternshipStatusBadge(status) {
  const key = normalizeStatusKey(status);
  switch (key) {
    case 'COMPLETED':
      return { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', icon: CheckCircle2, label: 'COMPLETED' };
    case 'ONGOING':
    case 'PURSUING':
      return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: Clock, label: 'ONGOING' };
    case 'UPCOMING':
    case 'OFFERED':
      return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', icon: AlertTriangle, label: 'UPCOMING' };
    default:
      return { 
        bg: '#F1F5F9', 
        text: '#475569', 
        border: '#CBD5E1', 
        icon: Briefcase, 
        label: status ? String(status).toUpperCase() : 'ACTIVE' 
      };
  }
}

/**
 * 6. LEGAL / PATENT STATUS BADGE
 * Domains: GRANTED, PUBLISHED, UNDER_EXAMINATION, FILED, COMMERCIALIZED, EXPIRED, ABANDONED
 */
export function getLegalStatusBadge(status) {
  const key = normalizeStatusKey(status);
  switch (key) {
    case 'GRANTED':
      return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', icon: CheckCircle2, label: 'GRANTED' };
    case 'PUBLISHED':
      return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: Globe, label: 'PUBLISHED' };
    case 'UNDER_EXAMINATION':
    case 'EXAMINATION':
      return { bg: '#FEFCE8', text: '#A16207', border: '#FDE68A', icon: Clock, label: 'EXAMINATION' };
    case 'COMMERCIALIZED':
      return { bg: '#FDF4FF', text: '#7E22CE', border: '#F5D0FE', icon: Sparkles, label: 'COMMERCIALIZED' };
    case 'FILED':
      return { bg: '#F8FAFC', text: '#475569', border: '#CBD5E1', icon: FileCheck, label: 'FILED' };
    case 'ABANDONED':
    case 'EXPIRED':
      return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: XCircle, label: 'EXPIRED' };
    default:
      return { 
        bg: '#F8FAFC', 
        text: '#475569', 
        border: '#CBD5E1', 
        icon: FileCheck, 
        label: status ? String(status).toUpperCase() : 'FILED' 
      };
  }
}
export const getPatentStatusBadge = getLegalStatusBadge;

/**
 * 7. BOARD OF STUDIES / GOVERNANCE MEETING STATUS BADGE
 * Domains: SCHEDULED, COMPLETED, POSTPONED, CANCELLED, DRAFT, MINUTES_SIGNED
 */
export function getMeetingStatusBadge(status) {
  const key = normalizeStatusKey(status);
  switch (key) {
    case 'COMPLETED':
    case 'MINUTES_SIGNED':
      return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', icon: CheckCircle2, label: 'COMPLETED' };
    case 'SCHEDULED':
      return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: Calendar, label: 'SCHEDULED' };
    case 'POSTPONED':
      return { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', icon: AlertTriangle, label: 'POSTPONED / RESCHEDULED' };
    case 'CANCELLED':
      return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: XCircle, label: 'CANCELLED' };
    case 'DRAFT':
    default:
      return { bg: '#FEFCE8', text: '#A16207', border: '#FEF08A', icon: Edit3, label: 'DRAFT' };
  }
}

/**
 * 8. INDUSTRY MoU STATUS BADGE
 * Domains: ACTIVE, RENEWAL_DUE, EXPIRED, TERMINATED, SIGNED
 */
export function getMouStatusBadge(status) {
  const key = normalizeStatusKey(status);
  switch (key) {
    case 'ACTIVE':
    case 'SIGNED':
      return { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', icon: CheckCircle2, label: 'ACTIVE' };
    case 'EXPIRING_SOON':
    case 'RENEWAL_DUE':
      return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', icon: AlertTriangle, label: 'EXPIRING SOON' };
    case 'EXPIRED':
      return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: XCircle, label: 'EXPIRED' };
    case 'TERMINATED':
      return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', icon: XCircle, label: 'TERMINATED' };
    case 'VALIDITY_NOT_RECORDED':
      return { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0', icon: Clock, label: 'VALIDITY NOT RECORDED' };
    default:
      return { 
        bg: '#F1F5F9', 
        text: '#475569', 
        border: '#CBD5E1', 
        icon: Clock, 
        label: status ? String(status).toUpperCase() : 'UNKNOWN' 
      };
  }
}

/**
 * 9. PLACEMENT STATUS BADGE
 * Domains: PLACED, SHORTLISTED, IN_PROGRESS, JOINED, OFFERED, REJECTED
 */
export function getPlacementStatusBadge(status) {
  const key = normalizeStatusKey(status);
  switch (key) {
    case 'PLACED':
    case 'JOINED':
      return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', icon: CheckCircle2, label: 'PLACED' };
    case 'OFFERED':
      return { bg: '#FDF4FF', text: '#7E22CE', border: '#F5D0FE', icon: Award, label: 'OFFER RECEIVED' };
    case 'SHORTLISTED':
      return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: Clock, label: 'SHORTLISTED' };
    case 'IN_PROGRESS':
      return { bg: '#FEFCE8', text: '#A16207', border: '#FEF08A', icon: Clock, label: 'IN PROGRESS' };
    case 'REJECTED':
      return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: XCircle, label: 'NOT PLACED' };
    default:
      return { 
        bg: '#F8FAFC', 
        text: '#475569', 
        border: '#CBD5E1', 
        icon: Briefcase, 
        label: status ? String(status).toUpperCase() : 'IN PROGRESS' 
      };
  }
}

/**
 * 10. ATTENDANCE RISK & CONTACT STATUS BADGES
 */
export function getAttendanceRiskBadge(riskTier) {
  const key = normalizeStatusKey(riskTier);
  switch (key) {
    case 'CRITICAL':
      return { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', icon: AlertCircle, label: 'CRITICAL (<65%)' };
    case 'CONDONATION':
    case 'WARNING':
      return { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', icon: AlertTriangle, label: 'CONDONATION (65-75%)' };
    case 'SATISFACTORY':
    case 'CLEAR':
      return { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', icon: CheckCircle2, label: 'SATISFACTORY (≥75%)' };
    default:
      return { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0', icon: Clock, label: riskTier || 'UNKNOWN' };
  }
}

export function getAttendanceContactBadge(status) {
  const key = normalizeStatusKey(status);
  switch (key) {
    case 'RESOLVED':
    case 'CONTACTED':
      return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', icon: CheckCircle2, label: 'RESOLVED / CONTACTED' };
    case 'IN_PROGRESS':
    case 'INITIATED':
      return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: Clock, label: 'IN PROGRESS' };
    case 'PENDING':
    default:
      return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: AlertTriangle, label: 'ACTION REQUIRED' };
  }
}

/**
 * 11. ACADEMIC & CERTIFICATION RESULT BADGE (NPTEL, MOOCs)
 */
export function getResultBadge(result) {
  const key = normalizeStatusKey(result);
  if (key.includes('GOLD') || key.includes('TOP_1') || key.includes('TOP_5')) {
    return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', icon: Award, label: result || 'ELITE + GOLD' };
  }
  if (key.includes('SILVER') || key.includes('ELITE')) {
    return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: Award, label: result || 'ELITE' };
  }
  if (key.includes('PASS') || key.includes('SUCCESS') || key.includes('COMPLETED')) {
    return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', icon: CheckCircle2, label: result || 'SUCCESSFULLY COMPLETED' };
  }
  if (key.includes('FAIL') || key.includes('NO_CERT')) {
    return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: XCircle, label: result || 'NO CERTIFICATE' };
  }
  return { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0', icon: Award, label: result || 'REGISTERED' };
}

/**
 * Crash-Proof Reusable Status Badge Component
 */
export function StatusBadge({ 
  badge, 
  icon: OverrideIcon, 
  size = 11, 
  style = {}, 
  className = '' 
}) {
  if (!badge) return null;
  const IconComponent = OverrideIcon || (typeof badge.icon === 'function' ? badge.icon : null);

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        background: badge.bg || '#F1F5F9',
        color: badge.text || '#475569',
        border: `1px solid ${badge.border || '#CBD5E1'}`,
        padding: '0.15rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.68rem',
        fontWeight: 800,
        whiteSpace: 'nowrap',
        letterSpacing: '0.3px',
        ...style
      }}
    >
      {IconComponent && <IconComponent size={size} />}
      <span>{badge.label || 'UNKNOWN'}</span>
    </span>
  );
}
