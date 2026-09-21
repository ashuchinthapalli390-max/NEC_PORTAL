import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Users, 
  FileText, 
  Calendar, 
  Award, 
  ChevronRight, 
  Search, 
  Download, 
  ExternalLink,
  Building2,
  Bookmark,
  Layers,
  FileCheck,
  CheckCircle
} from 'lucide-react';
import { MotionPage } from '../../motion/index.js';
import { 
  getGoverningBody, 
  getAcademicCouncil, 
  getDocumentEvidence 
} from '../../../data/portalStore.js';

// Autonomous Regulations Structure
const REGULATIONS_DATA = [
  {
    code: 'R24',
    title: 'Autonomous Academic Regulations R24 (CBCS & NEP-2020 Aligned)',
    effectiveBatch: '2024-2028 Onwards',
    programs: 'B.Tech (CSE, ECE, EEE, MECH, CIVIL, AIML, AIDS, CS)',
    credits: 160,
    status: 'Active (Current)',
    features: [
      'NEP-2020 multi-entry/exit framework with Skill-Oriented Courses',
      'Mandatory Community Service Project (CSP) in II Year (4 Credits)',
      'Summer Industry Internships in II & III Year + Full Semester Internship in IV Year',
      'Honor & Minor Degree tracks in Emerging Technologies (20 Additional Credits)',
      'Continuous Internal Evaluation (40%) & Semester End Examinations (60%)'
    ],
    pdf: 'NEC_R24_Academic_Regulations.pdf'
  },
  {
    code: 'R20',
    title: 'Autonomous Academic Regulations R20 (Outcome-Based Education)',
    effectiveBatch: '2020-2024 & 2021-2025 Batches',
    programs: 'B.Tech (All Engineering Branches)',
    credits: 160,
    status: 'Active (Graduating Batches)',
    features: [
      'AICTE Model Curriculum aligned Choice Based Credit System (CBCS)',
      'Integrated Theory & Practical courses with laboratory continuous assessments',
      'Mandatory MOOCs through NPTEL / SWAYAM platform (3 Credits)',
      'Societal Centric Project / Mini Project in Pre-final Year',
      'Grading System: 10-Point SGPA/CGPA with relative moderation'
    ],
    pdf: 'NEC_R20_Academic_Regulations.pdf'
  },
  {
    code: 'R19',
    title: 'Autonomous Academic Regulations R19 (Autonomous Foundation)',
    effectiveBatch: '2019-2023 Batches',
    programs: 'B.Tech (Autonomous Streams)',
    credits: 160,
    status: 'Archived',
    features: [
      'First Autonomous regulation under UGC 2(f) & 12(B) autonomous status',
      'Semester system with comprehensive internal and external evaluations',
      'Mandatory industry visits and technical seminar presentations',
      'Established Board of Studies (BoS) autonomy across engineering branches'
    ],
    pdf: 'NEC_R19_Academic_Regulations.pdf'
  }
];

export default function RegulationsHubManager({ currentUser, onNavigate }) {
  const [activeTab, setActiveTab] = useState('governing-body'); // 'governing-body' | 'academic-council' | 'regulations' | 'evidence'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);

  // Ingested Canonical Records
  const gbMeetings = useMemo(() => getGoverningBody() || [], []);
  const cacMeetings = useMemo(() => getAcademicCouncil() || [], []);
  const allEvidence = useMemo(() => {
    const ev = getDocumentEvidence() || [];
    return ev.filter(e => e.category === 'governance' || (e.title || '').toLowerCase().includes('gb') || (e.title || '').toLowerCase().includes('cac'));
  }, []);

  return (
    <MotionPage style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Breadcrumb Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: '#64748B' }}>
          <span>Dashboard</span>
          <span style={{ color: '#CBD5E1' }}>›</span>
          <span>Academic Governance</span>
          <span style={{ color: '#CBD5E1' }}>›</span>
          <span style={{ color: '#0F172A', fontWeight: 700 }}>Governing Body & CAC Records</span>
          <span style={{
            marginLeft: '0.5rem',
            padding: '0.15rem 0.55rem',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#059669',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.65rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Institutional Canon Active
          </span>
        </div>
      </div>

      {/* Hero Banner with Executive Seal */}
      <div style={{
        background: 'linear-gradient(135deg, #070F1E 0%, #0B192C 70%, #122846 100%)',
        borderRadius: '18px',
        padding: '2rem 2.25rem',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        {/* Glow Element */}
        <div style={{
          position: 'absolute',
          right: '-50px',
          top: '-50px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.16) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ zIndex: 2, maxWidth: '680px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.2rem 0.65rem', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.35)', borderRadius: '9999px', color: '#D4AF37', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
            <ShieldCheck size={13} /> Autonomous Statutory Governance
          </div>
          <h1 style={{
            color: '#FFFFFF',
            fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)',
            fontWeight: 800,
            margin: '0 0 0.45rem 0',
            fontFamily: 'Cinzel, Georgia, serif',
            letterSpacing: '0.02em'
          }}>
            Institutional Governance & CAC Proceedings
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.86rem', margin: 0, lineHeight: 1.6 }}>
            Official proceedings of the <strong>Governing Body (GB)</strong> and <strong>College Academic Committee (CAC)</strong> of Narasaraopeta Engineering College (Autonomous), including ratified resolutions, curriculum mandates, and Autonomous Academic Regulations (R24, R20, R19).
          </p>
        </div>

        {/* Quick Statutory Metrics */}
        <div style={{ display: 'flex', gap: '1rem', zIndex: 2, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0.85rem 1.15rem', textAlign: 'center', minWidth: '105px' }}>
            <div style={{ color: '#D4AF37', fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.1 }}>23rd</div>
            <div style={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginTop: '0.25rem' }}>GB Meeting</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0.85rem 1.15rem', textAlign: 'center', minWidth: '105px' }}>
            <div style={{ color: '#38BDF8', fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.1 }}>2</div>
            <div style={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginTop: '0.25rem' }}>CAC Proceedings</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0.85rem 1.15rem', textAlign: 'center', minWidth: '105px' }}>
            <div style={{ color: '#10B981', fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.1 }}>3</div>
            <div style={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginTop: '0.25rem' }}>Regulations</div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '2px solid #E2E8F0',
        paddingBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'governing-body', label: 'Governing Body Records', icon: Building2, count: gbMeetings.length },
          { id: 'academic-council', label: 'College Academic Committee (CAC)', icon: BookOpen, count: cacMeetings.length },
          { id: 'regulations', label: 'Autonomous Regulations (R24, R20, R19)', icon: Bookmark, count: REGULATIONS_DATA.length },
          { id: 'evidence', label: 'Statutory Evidence Repository', icon: FileCheck, count: allEvidence.length }
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
                gap: '0.45rem',
                padding: '0.65rem 1.1rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#0B192C' : 'transparent',
                color: isActive ? '#D4AF37' : '#64748B',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 2px 8px rgba(11, 25, 44, 0.25)' : 'none'
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              <span style={{
                background: isActive ? 'rgba(212, 175, 55, 0.25)' : '#F1F5F9',
                color: isActive ? '#FFFFFF' : '#475569',
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                fontSize: '0.68rem',
                fontWeight: 800
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Governing Body Records */}
      {activeTab === 'governing-body' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {gbMeetings.map((meeting, idx) => (
            <div
              key={meeting.id || idx}
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                overflow: 'hidden'
              }}
            >
              {/* Card Header */}
              <div style={{
                padding: '1.5rem 1.75rem',
                background: 'linear-gradient(90deg, #F8FAFC 0%, #FFFFFF 100%)',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      background: 'rgba(212, 175, 55, 0.15)',
                      color: '#B45309',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.74rem'
                    }}>
                      {meeting.meetingNumber}
                    </span>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#059669',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.74rem'
                    }}>
                      {meeting.status}
                    </span>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
                      Academic Year {meeting.academicYear} (Period: {meeting.reportingPeriod})
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.3rem 0' }}>
                    Meeting of the Governing Body
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8rem', color: '#475569', flexWrap: 'wrap' }}>
                    <span><strong>Chairperson:</strong> {meeting.chairperson}</span>
                    <span><strong>Date:</strong> {meeting.meetingDate}</span>
                    <span><strong>Venue:</strong> {meeting.venue}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{
                    padding: '0.4rem 0.8rem',
                    background: '#F1F5F9',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <FileText size={14} style={{ color: '#2563EB' }} />
                    {meeting.sourceFile}
                  </div>
                </div>
              </div>

              {/* Card Body: Agenda & Resolutions Grid */}
              <div style={{
                padding: '1.75rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem'
              }}>
                {/* Agenda Items */}
                <div style={{
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #E2E8F0'
                }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Layers size={16} style={{ color: '#D4AF37' }} /> Agenda Items Discussed
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {(meeting.agendaItems || []).map((agenda, aIdx) => (
                      <div key={aIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                        <span style={{
                          minWidth: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(212, 175, 55, 0.2)',
                          color: '#B45309',
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: '2px'
                        }}>
                          {aIdx + 1}
                        </span>
                        <span>{agenda}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resolutions Approved */}
                <div style={{
                  background: '#F0FDF4',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #BBF7D0'
                }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#14532D', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CheckCircle2 size={16} style={{ color: '#16A34A' }} /> Formal Resolutions Passed
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {(meeting.resolutions || []).map((res, rIdx) => (
                      <div key={rIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.82rem', color: '#166534', lineHeight: 1.5 }}>
                        <CheckCircle size={16} style={{ color: '#16A34A', flexShrink: 0, marginTop: '2px' }} />
                        <span>{res}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Statutory Note */}
              <div style={{
                padding: '0.85rem 1.75rem',
                background: '#FEFCE8',
                borderTop: '1px solid #FEF08A',
                fontSize: '0.76rem',
                color: '#854D0E',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ShieldCheck size={15} style={{ color: '#CA8A04', flexShrink: 0 }} />
                <span>
                  The Governing Body is the apex statutory authority under UGC Autonomous Regulations, comprising Chairman Sri M. V. Koteswara Rao, Management Nominees, University Nominee (JNTUK), State Government Nominee, Industrialist, UGC Nominee, and Principal Dr. S. Venkateswarlu as Member Secretary.
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: College Academic Committee (CAC) Records */}
      {activeTab === 'academic-council' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {cacMeetings.map((meeting, idx) => (
            <div
              key={meeting.id || idx}
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                overflow: 'hidden'
              }}
            >
              {/* CAC Header */}
              <div style={{
                padding: '1.5rem 1.75rem',
                background: 'linear-gradient(90deg, #F8FAFC 0%, #FFFFFF 100%)',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      background: 'rgba(2, 132, 199, 0.12)',
                      color: '#0284C7',
                      border: '1px solid rgba(2, 132, 199, 0.3)',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.74rem'
                    }}>
                      {meeting.councilType || 'College Academic Committee'}
                    </span>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#059669',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.74rem'
                    }}>
                      {meeting.status}
                    </span>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
                      AY {meeting.academicYear} (Period: {meeting.reportingPeriod})
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.3rem 0' }}>
                    {meeting.meetingNumber}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8rem', color: '#475569', flexWrap: 'wrap' }}>
                    <span><strong>Meeting Date:</strong> {meeting.meetingDate}</span>
                    <span><strong>Venue:</strong> {meeting.venue}</span>
                  </div>
                </div>

                <div style={{
                  padding: '0.4rem 0.8rem',
                  background: '#F1F5F9',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <FileText size={14} style={{ color: '#0284C7' }} />
                  {meeting.sourceFile}
                </div>
              </div>

              {/* CAC Grid */}
              <div style={{
                padding: '1.75rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem'
              }}>
                {/* Agenda */}
                <div style={{
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #E2E8F0'
                }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Layers size={16} style={{ color: '#0284C7' }} /> Academic Agendas
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {(meeting.agendaItems || []).map((agenda, aIdx) => (
                      <div key={aIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                        <span style={{
                          minWidth: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(2, 132, 199, 0.15)',
                          color: '#0284C7',
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: '2px'
                        }}>
                          {aIdx + 1}
                        </span>
                        <span>{agenda}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resolutions */}
                <div style={{
                  background: '#F0F9FF',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #BAE6FD'
                }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0369A1', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CheckCircle2 size={16} style={{ color: '#0284C7' }} /> Committee Ratifications & Approvals
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {(meeting.resolutions || []).map((res, rIdx) => (
                      <div key={rIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.82rem', color: '#075985', lineHeight: 1.5 }}>
                        <CheckCircle size={16} style={{ color: '#0284C7', flexShrink: 0, marginTop: '2px' }} />
                        <span>{res}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Autonomous Regulations */}
      {activeTab === 'regulations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {REGULATIONS_DATA.map((reg, idx) => (
              <div
                key={reg.code}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: reg.code === 'R24' ? '2px solid #D4AF37' : '1px solid #E2E8F0',
                  boxShadow: reg.code === 'R24' ? '0 8px 24px rgba(212, 175, 55, 0.15)' : '0 2px 10px rgba(0,0,0,0.04)',
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {reg.code === 'R24' && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '-2.5rem',
                    background: '#D4AF37',
                    color: '#070F1E',
                    transform: 'rotate(45deg)',
                    padding: '0.2rem 2.8rem',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    Current
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: reg.code === 'R24' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(11, 25, 44, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: reg.code === 'R24' ? '#B45309' : '#0B192C'
                  }}>
                    {reg.code}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                      {reg.code} Autonomous Framework
                    </h3>
                    <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                      Applicable: {reg.effectiveBatch}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600, lineHeight: 1.4 }}>
                  {reg.title}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.6rem 0.85rem',
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.76rem',
                  color: '#475569'
                }}>
                  <span><strong>Total Credits:</strong> {reg.credits}</span>
                  <span>•</span>
                  <span><strong>Status:</strong> {reg.status}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                    Key Regulatory Features:
                  </span>
                  {reg.features.map((feat, fIdx) => (
                    <div key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.78rem', color: '#334155', lineHeight: 1.45 }}>
                      <CheckCircle2 size={13} style={{ color: '#10B981', flexShrink: 0, marginTop: '2px' }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Doc: {reg.pdf}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) onNavigate('bos-meetings');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284C7',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    View BoS Curricula <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Statutory Evidence Repository */}
      {activeTab === 'evidence' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0F172A' }}>
                Governance & Regulatory Institutional Documents
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                Catalog of verified governing body files, CAC proceedings, and institutional formats in the repository.
              </p>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              background: '#F1F5F9',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#334155'
            }}>
              <FileCheck size={15} style={{ color: '#059669' }} />
              {allEvidence.length} Governance Files Indexed
            </div>
          </div>

          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Document Name</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Format</th>
                  <th style={{ padding: '0.85rem 1rem' }}>File Size</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Indexed Path</th>
                </tr>
              </thead>
              <tbody>
                {allEvidence.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>
                      No governance evidence records currently indexed.
                    </td>
                  </tr>
                ) : (
                  allEvidence.map((doc, idx) => (
                    <tr key={doc.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem' }}>
                          {doc.title || doc.filename}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(212, 175, 55, 0.15)', color: '#B45309', fontSize: '0.7rem', fontWeight: 700 }}>
                          {doc.category || 'governance'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>
                          {doc.extension || doc.format || 'DOCX'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.76rem', color: '#64748B' }}>
                        {doc.sizeFormatted || doc.sizeBytes ? `${Math.round((doc.sizeBytes || 0) / 1024)} KB` : '42 KB'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>
                        {doc.relativePath || doc.sourceFile || 'Formats/...'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </MotionPage>
  );
}
