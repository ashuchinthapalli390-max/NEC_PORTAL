import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  FileText, 
  Lightbulb, 
  Handshake, 
  Trophy, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  TrendingUp, 
  Activity,
  GraduationCap,
  Award,
  BookOpen
} from 'lucide-react';
import { 
  MotionPage, 
  AnimatedKpiGrid, 
  MotionKpiCard, 
  MotionNumber, 
  MotionButton, 
  MotionCard 
} from '../../motion/index.js';
import { 
  getRolePresentation, 
  getAuthorizedQuickActions 
} from '../../../lib/auth/rolePresentation.js';

export default function DashboardOverviewView({
  currentUser,
  usersCount = 0,
  facultyCount = 0,
  publicationsCount = 0,
  patentsCount = 0,
  mousCount = 0,
  eventsCount = 0,
  achievementsCount = 0,
  activeSessionsCount = 0,
  placementsCount = 0,
  uniquePlacedStudentsCount = 0,
  bosMeetingsCount = 0,
  onNavigate,
  onOpenQuickAction,
  onOpenSync
}) {
  const userRole = currentUser?.role || 'FACULTY';
  const userDept = currentUser?.dept || 'Engineering';
  const displayName = currentUser?.name || currentUser?.fullName || 'Academic Officer';
  
  const rolePresentation = getRolePresentation(userRole, userDept, displayName);
  const authorizedActions = getAuthorizedQuickActions(currentUser, currentUser?.permissions);

  const RoleIcon = rolePresentation.icon || ShieldCheck;

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Dynamic KPI Metrics according to User Role & Scope (Strictly real data / zero state)
  const getScopedKpiCards = () => {
    if (userRole === 'FACULTY') {
      return [
        {
          title: 'My Publications',
          value: publicationsCount,
          subtext: publicationsCount > 0 ? `${publicationsCount} verified papers` : 'No records imported yet',
          icon: FileText,
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.25)',
          moduleId: 'publications'
        },
        {
          title: 'My Patents & IPR',
          value: patentsCount,
          subtext: patentsCount > 0 ? `${patentsCount} published / granted` : 'No records imported yet',
          icon: Lightbulb,
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.1)',
          border: 'rgba(245, 158, 11, 0.25)',
          moduleId: 'patents'
        },
        {
          title: 'Professional Memberships',
          value: 0,
          subtext: 'No memberships registered yet',
          icon: Award,
          color: '#8B5CF6',
          bg: 'rgba(139, 92, 246, 0.1)',
          border: 'rgba(139, 92, 246, 0.25)',
          moduleId: 'faculty-memberships'
        },
        {
          title: 'NPTEL & FDPs',
          value: 0,
          subtext: 'No certifications registered yet',
          icon: GraduationCap,
          color: '#06B6D4',
          bg: 'rgba(6, 182, 212, 0.1)',
          border: 'rgba(6, 182, 212, 0.25)',
          moduleId: 'faculty-achievements'
        }
      ];
    }

    if (userRole === 'HOD') {
      return [
        {
          title: 'Dept. Publications',
          value: publicationsCount,
          subtext: publicationsCount > 0 ? `Department of ${userDept}` : 'No records imported yet',
          icon: FileText,
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.25)',
          moduleId: 'publications'
        },
        {
          title: 'Department Faculty',
          value: facultyCount,
          subtext: facultyCount > 0 ? 'Active Teaching Roster' : 'No faculty added yet',
          icon: Users,
          color: '#3B82F6',
          bg: 'rgba(59, 130, 246, 0.1)',
          border: 'rgba(59, 130, 246, 0.25)',
          moduleId: 'faculty-directory'
        },
        {
          title: 'Student Achievements',
          value: achievementsCount,
          subtext: achievementsCount > 0 ? `${achievementsCount} verified records` : 'No records imported yet',
          icon: Trophy,
          color: '#EC4899',
          bg: 'rgba(236, 72, 153, 0.1)',
          border: 'rgba(236, 72, 153, 0.25)',
          moduleId: 'student-achievements'
        },
        {
          title: 'BoS Meetings',
          value: bosMeetingsCount,
          subtext: bosMeetingsCount > 0 ? `${bosMeetingsCount} approved meetings` : 'No meetings imported yet',
          icon: BookOpen,
          color: '#D4AF37',
          bg: 'rgba(212, 175, 55, 0.1)',
          border: 'rgba(212, 175, 55, 0.3)',
          moduleId: 'bos-meetings'
        },
        {
          title: 'Department MoUs',
          value: mousCount,
          subtext: mousCount > 0 ? 'Active Collaborations' : 'No records imported yet',
          icon: Handshake,
          color: '#8B5CF6',
          bg: 'rgba(139, 92, 246, 0.1)',
          border: 'rgba(139, 92, 246, 0.25)',
          moduleId: 'mous-collaborations'
        },
        {
          title: 'Department Events',
          value: eventsCount,
          subtext: eventsCount > 0 ? 'Workshops & Guest Lectures' : 'No records imported yet',
          icon: Calendar,
          color: '#06B6D4',
          bg: 'rgba(6, 182, 212, 0.1)',
          border: 'rgba(6, 182, 212, 0.25)',
          moduleId: 'events'
        }
      ];
    }

    if (userRole === 'AUDITOR') {
      return [
        {
          title: 'Verified Publications',
          value: publicationsCount,
          subtext: publicationsCount > 0 ? 'Audit Ready (Scopus/SCI)' : 'No records imported yet',
          icon: FileText,
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.25)',
          moduleId: 'publications'
        },
        {
          title: 'Patents & IPR Evidence',
          value: patentsCount,
          subtext: patentsCount > 0 ? 'Official Gazette Verified' : 'No records imported yet',
          icon: Lightbulb,
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.1)',
          border: 'rgba(245, 158, 11, 0.25)',
          moduleId: 'patents'
        },
        {
          title: 'Active Institutional MoUs',
          value: mousCount,
          subtext: mousCount > 0 ? 'Industry Agreements' : 'No records imported yet',
          icon: Handshake,
          color: '#8B5CF6',
          bg: 'rgba(139, 92, 246, 0.1)',
          border: 'rgba(139, 92, 246, 0.25)',
          moduleId: 'mous-collaborations'
        },
        {
          title: 'Audit Trail Records',
          value: 0,
          subtext: 'Immutable Log Entries',
          icon: ShieldCheck,
          color: '#38BDF8',
          bg: 'rgba(56, 189, 248, 0.1)',
          border: 'rgba(56, 189, 248, 0.25)',
          moduleId: 'audit-logs'
        }
      ];
    }

    // Default / Super Admin & Admin Institutional Metrics
    return [
      {
        title: 'Total Faculty',
        value: facultyCount,
        subtext: facultyCount > 0 ? `${facultyCount} verified profiles` : 'No faculty added yet',
        icon: Users,
        color: '#3B82F6',
        bg: 'rgba(59, 130, 246, 0.1)',
        border: 'rgba(59, 130, 246, 0.25)',
        moduleId: 'faculty-directory'
      },
      {
        title: 'Publications',
        value: publicationsCount,
        subtext: publicationsCount > 0 ? `${publicationsCount} indexed papers` : 'No records imported yet',
        icon: FileText,
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.25)',
        moduleId: 'publications'
      },
      {
        title: 'Patents & IPR',
        value: patentsCount,
        subtext: patentsCount > 0 ? `${patentsCount} published patents` : 'No records imported yet',
        icon: Lightbulb,
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.25)',
        moduleId: 'patents'
      },
      {
        title: 'Active MoUs',
        value: mousCount,
        subtext: mousCount > 0 ? `${mousCount} active tie-ups` : 'No records imported yet',
        icon: Handshake,
        color: '#8B5CF6',
        bg: 'rgba(139, 92, 246, 0.1)',
        border: 'rgba(139, 92, 246, 0.25)',
        moduleId: 'mous-collaborations'
      },
      {
        title: 'Student Awards',
        value: achievementsCount,
        subtext: achievementsCount > 0 ? `${achievementsCount} verified records` : 'No records imported yet',
        icon: Trophy,
        color: '#EC4899',
        bg: 'rgba(236, 72, 153, 0.1)',
        border: 'rgba(236, 72, 153, 0.25)',
        moduleId: 'student-achievements'
      },
      {
        title: 'Workshops & Events',
        value: eventsCount,
        subtext: eventsCount > 0 ? `${eventsCount} academic events` : 'No records imported yet',
        icon: Calendar,
        color: '#06B6D4',
        bg: 'rgba(6, 182, 212, 0.1)',
        border: 'rgba(6, 182, 212, 0.25)',
        moduleId: 'events'
      },
      {
        title: 'Campus Placements',
        value: placementsCount,
        subtext: placementsCount > 0 ? `${uniquePlacedStudentsCount} placed students` : 'No records imported yet',
        icon: TrendingUp,
        color: '#D4AF37',
        bg: 'rgba(212, 175, 55, 0.1)',
        border: 'rgba(212, 175, 55, 0.3)',
        moduleId: 'placements'
      },
      {
        title: 'BoS Meetings',
        value: bosMeetingsCount,
        subtext: bosMeetingsCount > 0 ? `${bosMeetingsCount} canonical meetings` : 'No meetings imported yet',
        icon: BookOpen,
        color: '#6366F1',
        bg: 'rgba(99, 102, 241, 0.1)',
        border: 'rgba(99, 102, 241, 0.25)',
        moduleId: 'bos-meetings'
      }
    ];
  };

  const kpiCards = getScopedKpiCards();

  return (
    <MotionPage style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Dynamic Welcome & Role-Scoped Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #070F1E 0%, #0B192C 70%, #122846 100%)',
        borderRadius: '18px',
        padding: 'clamp(1.2rem, 3vw, 1.8rem)',
        border: `1px solid ${rolePresentation.border || 'rgba(212, 175, 55, 0.3)'}`,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Decorative Radial Glow */}
        <div style={{
          position: 'absolute',
          right: '-40px',
          top: '-40px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${rolePresentation.bg || 'rgba(212, 175, 55, 0.15)'} 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} />

        <div style={{ zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
            <span style={{
              background: rolePresentation.bg,
              color: rolePresentation.color,
              border: `1px solid ${rolePresentation.border}`,
              padding: '0.22rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              letterSpacing: '0.03em',
              textTransform: 'uppercase'
            }}>
              <RoleIcon size={12} /> {rolePresentation.label}
            </span>

            {(userRole === 'HOD' || userRole === 'FACULTY') && userDept && (
              <span style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#E2E8F0',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                Dept. of {userDept}
              </span>
            )}

            <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>{currentDate}</span>
          </div>

          <h1 style={{
            color: '#FFFFFF',
            fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)',
            fontWeight: 800,
            margin: '0 0 0.35rem 0',
            fontFamily: 'Cinzel, Georgia, serif',
            letterSpacing: '0.02em'
          }}>
            Welcome Back, {displayName}
          </h1>

          <p style={{
            color: '#CBD5E1',
            fontSize: '0.85rem',
            margin: 0,
            maxWidth: '680px',
            lineHeight: 1.5
          }}>
            {rolePresentation.renderedDescription}
          </p>
        </div>

        {/* Dynamic Quick Actions */}
        {authorizedActions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', zIndex: 2 }}>
            {authorizedActions.map((action) => {
              const ActionIcon = action.icon || Plus;
              return (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => onNavigate(action.moduleId)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: action.id === 'create-bos' || action.id === 'add-publication'
                      ? 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)'
                      : 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid ' + (action.id === 'create-bos' || action.id === 'add-publication' ? '#D4AF37' : 'rgba(255, 255, 255, 0.15)'),
                    color: action.id === 'create-bos' || action.id === 'add-publication' ? '#070F1E' : '#FFFFFF',
                    padding: '0.55rem 0.95rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: action.id === 'create-bos' || action.id === 'add-publication' ? '0 3px 12px rgba(212, 175, 55, 0.35)' : 'none'
                  }}
                >
                  <ActionIcon size={14} /> {action.label}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. KPI Metrics Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Activity size={18} style={{ color: '#D4AF37' }} /> 
            {userRole === 'FACULTY' ? 'My Academic & Research Metrics' : userRole === 'HOD' ? `Departmental Metrics (${userDept})` : 'Core Institutional Metrics'}
          </h2>
          <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Real-time verified data</span>
        </div>

        <AnimatedKpiGrid minWidth="200px" gap="1rem">
          {kpiCards.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <MotionKpiCard
                key={idx}
                onClick={() => kpi.moduleId && onNavigate(kpi.moduleId)}
                style={{
                  padding: '1.15rem',
                  borderRadius: '14px',
                  border: `1px solid ${kpi.border}`,
                  background: '#FFFFFF',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                  cursor: kpi.moduleId ? 'pointer' : 'default'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: kpi.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: kpi.color
                  }}>
                    <Icon size={20} />
                  </div>
                  {kpi.moduleId && (
                    <ArrowUpRight size={15} style={{ color: '#94A3B8' }} />
                  )}
                </div>

                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', lineHeight: 1, marginBottom: '0.3rem' }}>
                  <MotionNumber value={kpi.value} />
                </div>

                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.2rem' }}>
                  {kpi.title}
                </div>

                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  {kpi.subtext}
                </div>
              </MotionKpiCard>
            );
          })}
        </AnimatedKpiGrid>
      </div>

    </MotionPage>
  );
}
