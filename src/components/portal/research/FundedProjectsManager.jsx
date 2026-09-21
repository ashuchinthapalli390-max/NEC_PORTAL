import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Building2,
  DollarSign,
  X,
  AlertCircle
} from 'lucide-react';
import { DEPARTMENTS, ET_DEPARTMENTS } from '../../../data/masterData.js';

export default function FundedProjectsManager({ currentUser }) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState(currentUser?.role === 'HOD' ? (currentUser.dept || 'ALL') : 'ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [projectsList, setProjectsList] = useState([
    { id: 'FND-2024-001', projectTitle: 'Design and Development of AI-powered Edge IoT Gateway for Smart Agriculture', fundingAgency: 'DST-SERB (Government of India)', sanctionedAmount: '₹ 28,50,000', principalInvestigator: 'Dr. S. Venkateswarlu', coPi: 'Dr. B. Jhansi Vazram', department: 'AI', duration: '3 Years (2024-2027)', status: 'Ongoing', sanctionLetter: 'DST_SERB_Sanction_2024.pdf' },
    { id: 'FND-2023-002', projectTitle: 'AICTE IDEA Lab Establishment for Hands-on Prototyping and STEM Education', fundingAgency: 'AICTE (New Delhi)', sanctionedAmount: '₹ 55,00,000', principalInvestigator: 'Dr. M. Sreenivasa Kumar', coPi: 'Dr. V. Venkata Rao', department: 'AIML', duration: '2 Years (2023-2025)', status: 'Active & Operational', sanctionLetter: 'AICTE_IDEA_Lab_Grant.pdf' },
    { id: 'FND-2022-003', projectTitle: 'Modernization of Advanced Cyber Defense and Threat Intelligence Laboratory', fundingAgency: 'AICTE MODROBS Scheme', sanctionedAmount: '₹ 18,20,000', principalInvestigator: 'Dr. V. Venkata Rao', coPi: 'Dr. P. Lakshmanan', department: 'CYS', duration: '2 Years (2022-2024)', status: 'Successfully Completed', sanctionLetter: 'MODROBS_Sanction_CYS.pdf' }
  ]);

  const [newProject, setNewProject] = useState({
    projectTitle: '',
    fundingAgency: '',
    sanctionedAmount: '',
    principalInvestigator: '',
    coPi: '',
    department: currentUser?.dept || 'AI',
    duration: '3 Years',
    status: 'Ongoing'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateGrant = (e) => {
    e.preventDefault();
    if (!newProject.projectTitle || !newProject.fundingAgency || !newProject.principalInvestigator) return;

    const record = {
      ...newProject,
      id: `FND-2026-${String(projectsList.length + 1).padStart(3, '0')}`,
      sanctionLetter: 'Sanction_Order_Copy.pdf'
    };

    setProjectsList([record, ...projectsList]);
    setModalOpen(false);
    showToast('Funded research grant recorded successfully!');
    setNewProject({
      projectTitle: '',
      fundingAgency: '',
      sanctionedAmount: '',
      principalInvestigator: '',
      coPi: '',
      department: currentUser?.dept || 'CSE',
      duration: '3 Years',
      status: 'Ongoing'
    });
  };

  const filtered = projectsList.filter(p => {
    const q = search.toLowerCase().trim();
    const matchQ = !q || 
      (p.projectTitle && p.projectTitle.toLowerCase().includes(q)) || 
      (p.fundingAgency && p.fundingAgency.toLowerCase().includes(q)) || 
      (p.principalInvestigator && p.principalInvestigator.toLowerCase().includes(q));
    const matchDept = deptFilter === 'ALL' || (p.department || '').toLowerCase().includes(deptFilter.toLowerCase());
    return matchQ && matchDept;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', width: '100%' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#0B192C',
          color: '#FFFFFF',
          padding: '0.75rem 1.4rem',
          borderRadius: '10px',
          border: '1px solid #D4AF37',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          zIndex: 7000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.86rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} style={{ color: '#10B981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: '#64748B', marginBottom: '0.25rem' }}>
            <span>Dashboard</span>
            <ChevronRight size={12} />
            <span>Research & Publications</span>
            <ChevronRight size={12} />
            <span style={{ color: '#0F172A', fontWeight: 700 }}>Funded Research Projects</span>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.25rem 0', fontFamily: 'Cinzel, Georgia, serif' }}>
            Extramural Funded Research Projects & Grants
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
            Track sponsored research grants from DST, SERB, AICTE, UGC, DRDO, and private industrial bodies.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)', color: '#070F1E', padding: '0.55rem 1.05rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}
        >
          <Plus size={15} /> Record Funded Grant
        </button>
      </div>

      {/* Filter Row */}
      <div style={{ background: '#FFFFFF', padding: '0.9rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search projects by title, agency, PI name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '220px', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
        />
        <select
          value={deptFilter}
          disabled={currentUser?.role === 'HOD'}
          onChange={(e) => setDeptFilter(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
        >
          <option value="ALL">All</option>
          {ET_DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
        </select>
      </div>

      {/* Projects List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map(p => (
          <div key={p.id} style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ maxWidth: '680px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.74rem', color: '#D4AF37', fontWeight: 800 }}>{p.id} • {p.department}</span>
                <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 800 }}>
                  {p.status}
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.4rem', fontFamily: 'Cinzel, serif' }}>
                {p.projectTitle}
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.4 }}>
                Funding Agency: <strong>{p.fundingAgency}</strong> • Sanctioned Grant: <strong style={{ color: '#059669' }}>{p.sanctionedAmount}</strong>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '0.35rem' }}>
                Principal Investigator (PI): <strong>{p.principalInvestigator}</strong> {p.coPi ? `(Co-PI: ${p.coPi})` : ''} • Duration: {p.duration}
              </div>
            </div>

            <button
              type="button"
              onClick={() => showToast(`Sanction copy reference verified: ${p.sanctionLetter}`)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, color: '#0F172A', cursor: 'pointer' }}
            >
              <Download size={13} /> Sanction Order Copy
            </button>
          </div>
        ))}
      </div>

      {/* Record Funded Grant Dialog */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 15, 30, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 6000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ padding: '1.2rem 1.5rem', background: '#0B192C', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Record Funded Research Grant</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateGrant} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design and Development of AI-IoT Smart Agriculture"
                  value={newProject.projectTitle}
                  onChange={(e) => setNewProject({ ...newProject, projectTitle: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Funding Agency *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DST-SERB / AICTE"
                    value={newProject.fundingAgency}
                    onChange={(e) => setNewProject({ ...newProject, fundingAgency: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Sanctioned Amount *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹ 25,00,000"
                    value={newProject.sanctionedAmount}
                    onChange={(e) => setNewProject({ ...newProject, sanctionedAmount: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Principal Investigator (PI) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. S. Venkateswarlu"
                    value={newProject.principalInvestigator}
                    onChange={(e) => setNewProject({ ...newProject, principalInvestigator: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Department *</label>
                  <select
                    value={newProject.department}
                    onChange={(e) => setNewProject({ ...newProject, department: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.84rem', boxSizing: 'border-box', background: '#FFFFFF' }}
                  >
                    {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.code}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.55rem 1.3rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)', color: '#070F1E', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Save Grant Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
