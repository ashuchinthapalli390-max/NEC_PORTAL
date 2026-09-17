import React from 'react';
import { ShieldCheck, Clock, BookOpen, CheckCircle2 } from 'lucide-react';
import { MotionPage } from '../../motion/index.js';

/**
 * Governance Body Manager
 *
 * Module is currently under institutional preparation.
 * The original Curriculum & Regulations data is preserved internally
 * and will be surfaced once the Governance Body workflow is ready.
 */

// Internal data preserved for when module is fully activated
const _PRESERVED_REGULATIONS_DATA = [
  { code: 'R24', title: 'Autonomous Academic Regulations R24 (CBCS & NEP-2020 Aligned)', effectiveBatch: '2024-2028 Onwards', programs: 'B.Tech (Emerging Technologies: CYS, DS, AI, AIML)', credits: 160, status: 'Active (Current)', pdf: 'NEC_R24_Academic_Regulations.pdf' },
  { code: 'R20', title: 'Autonomous Academic Regulations R20 (Outcome Based Education)', effectiveBatch: '2020-2024 Batches', programs: 'B.Tech (Emerging Technologies: CYS, DS, AI, AIML)', credits: 160, status: 'Active (Graduating)', pdf: 'NEC_R20_Academic_Regulations.pdf' },
  { code: 'R19', title: 'Autonomous Academic Regulations R19', effectiveBatch: '2019-2023 Batches', programs: 'B.Tech (Emerging Technologies)', credits: 160, status: 'Archived', pdf: 'NEC_R19_Academic_Regulations.pdf' }
];

const ROADMAP_ITEMS = [
  { label: 'Academic Governance Policies', desc: 'Upload and version-control Autonomous Regulations (R19, R20, R24)' },
  { label: 'BoS Curriculum Workflows', desc: 'Integrated Board of Studies approval and minutes tracking' },
  { label: 'Governing Body Meeting Records', desc: 'Official minutes, resolutions and attendance sheets' },
  { label: 'Academic Calendar Management', desc: 'Term-wise academic event planning and holiday schedules' },
  { label: 'Statutory Committee Register', desc: 'Faculty Induction Program, IQAC, Anti-Ragging Committee records' }
];

export default function RegulationsHubManager({ currentUser }) {
  return (
    <MotionPage style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: '#64748B' }}>
        <span>Dashboard</span>
        <span style={{ color: '#CBD5E1' }}>›</span>
        <span>Academic Governance</span>
        <span style={{ color: '#CBD5E1' }}>›</span>
        <span style={{ color: '#0F172A', fontWeight: 700 }}>Governance Body</span>
        <span style={{
          marginLeft: '0.5rem',
          padding: '0.1rem 0.5rem',
          borderRadius: '9999px',
          background: 'rgba(212, 175, 55, 0.15)',
          color: '#D4AF37',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          fontSize: '0.62rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          Pending
        </span>
      </div>

      {/* Main Pending State Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '18px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        overflow: 'hidden'
      }}>
        {/* Dark Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #070F1E 0%, #0B192C 70%, #122846 100%)',
          padding: '2.5rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative glow */}
          <div style={{
            position: 'absolute',
            right: '-40px',
            top: '-40px',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '14px',
            background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <BookOpen size={30} style={{ color: '#D4AF37' }} />
          </div>

          <div style={{ zIndex: 2 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.2rem 0.65rem',
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '9999px',
              color: '#D4AF37',
              fontSize: '0.7rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.5rem'
            }}>
              <Clock size={11} /> Module Under Preparation
            </div>

            <h1 style={{
              color: '#FFFFFF',
              fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)',
              fontWeight: 800,
              margin: '0 0 0.35rem 0',
              fontFamily: 'Cinzel, Georgia, serif',
              letterSpacing: '0.02em'
            }}>
              Governance Body
            </h1>

            <p style={{
              color: '#94A3B8',
              fontSize: '0.85rem',
              margin: 0,
              maxWidth: '560px',
              lineHeight: 1.55
            }}>
              The Governance Body module — covering academic regulations, curriculum governance, governing body records, and statutory committee management — is currently being structured for NEC's Autonomous academic framework.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Info Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem',
            padding: '1rem 1.25rem',
            background: '#FEFCE8',
            borderRadius: '10px',
            border: '1px solid #FEF08A'
          }}>
            <ShieldCheck size={20} style={{ color: '#CA8A04', flexShrink: 0, marginTop: '1px' }} />
            <div>
              <div style={{ fontWeight: 700, color: '#713F12', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                Institutional Configuration In Progress
              </div>
              <div style={{ fontSize: '0.78rem', color: '#92400E', lineHeight: 1.55 }}>
                Academic regulation documents (R24, R20, R19), BoS meeting workflows, and governing body committee records are preserved internally and will be surfaced through this interface once the Governance Body module is formally activated by the Academic Council.
              </div>
            </div>
          </div>

          {/* Roadmap */}
          <div>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} style={{ color: '#D4AF37' }} />
              Planned Feature Areas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {ROADMAP_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'rgba(212, 175, 55, 0.12)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#D4AF37'
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem', marginBottom: '0.15rem' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', lineHeight: 1.4 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Access Note */}
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(212, 175, 55, 0.06)',
            borderRadius: '8px',
            border: '1px dashed rgba(212, 175, 55, 0.35)',
            fontSize: '0.74rem',
            color: '#64748B',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <BookOpen size={14} style={{ color: '#D4AF37', flexShrink: 0 }} />
            <span>
              For existing Academic Regulations and BoS documents, please refer to the <strong style={{ color: '#0F172A' }}>Board of Studies (BoS)</strong> module in the Academic Governance section.
            </span>
          </div>
        </div>
      </div>
    </MotionPage>
  );
}
