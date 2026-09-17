import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Plus, 
  Search, 
  Download, 
  FileText, 
  Calendar, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  X,
  FileCheck
} from 'lucide-react';
import { getCirculars, saveCircular } from '../../../data/portalStore.js';
import { formatDateDDMMYYYY, isDateInRange } from '../../../lib/ui/dateUtils.js';
import { 
  AnimatedActionButton, 
  AnimatedIconButton, 
  MotionEmptyState,
  MotionPage,
  MotionModal
} from '../../motion/index.js';

export default function CircularsManager({ currentUser }) {
  const [circulars, setCirculars] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Official Notice',
    department: 'Institutional',
    signedBy: currentUser?.name || 'Dean / Principal Office',
    date: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    documentUrl: ''
  });

  const loadData = () => {
    try {
      const records = getCirculars() || [];
      setCirculars(records);
    } catch (e) {
      console.warn('Error loading circulars:', e);
      setCirculars([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    saveCircular({
      title: formData.title.trim(),
      category: formData.category,
      department: formData.department,
      signedBy: formData.signedBy,
      date: formData.date,
      referenceNumber: formData.referenceNumber || undefined,
      documentUrl: formData.documentUrl || undefined,
      status: 'Active'
    }, currentUser?.name || 'Administrator');

    setIsModalOpen(false);
    setFormData({
      title: '',
      category: 'Official Notice',
      department: 'Institutional',
      signedBy: currentUser?.name || 'Dean / Principal Office',
      date: new Date().toISOString().split('T')[0],
      referenceNumber: '',
      documentUrl: ''
    });
    loadData();
  };

  const filtered = circulars.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || (c.title && c.title.toLowerCase().includes(q)) || (c.id && c.id.toLowerCase().includes(q)) || (c.referenceNumber && c.referenceNumber.toLowerCase().includes(q));
    const matchType = filterType === 'ALL' || c.category === filterType;
    const matchDate = isDateInRange(c.date, fromDate, toDate);
    return matchQ && matchType && matchDate;
  });

  return (
    <MotionPage style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: '#64748B', marginBottom: '0.25rem' }}>
            <span>Dashboard</span>
            <ChevronRight size={12} />
            <span>Events & Outreach</span>
            <ChevronRight size={12} />
            <span style={{ color: '#0F172A', fontWeight: 700 }}>Official Circulars & Notices</span>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.25rem 0', fontFamily: 'Cinzel, Georgia, serif' }}>
            Official Circulars & Institutional Orders
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
            Dispatch, publish, and archive autonomous examination notices, administrative circulars, and orders.
          </p>
        </div>

        <AnimatedActionButton
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          size="md"
        >
          Issue New Circular
        </AnimatedActionButton>
      </div>

      {/* Filter Row */}
      <div style={{ background: '#FFFFFF', padding: '0.9rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search circulars by title, reference ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.2rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFFFFF', outline: 'none' }}
        >
          <option value="ALL">All Categories</option>
          <option value="Official Notice">Official Notices</option>
          <option value="Examination Circular">Examination Circulars</option>
          <option value="Academic Circular">Academic Circulars</option>
          <option value="Administrative Order">Administrative Orders</option>
        </select>

        {/* From Date */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
          From:
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', outline: 'none' }}
          />
        </label>

        {/* To Date */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
          To:
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', outline: 'none' }}
          />
        </label>

        {(search || filterType !== 'ALL' || fromDate || toDate) && (
          <button
            type="button"
            onClick={() => { setSearch(''); setFilterType('ALL'); setFromDate(''); setToDate(''); }}
            style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Circulars Table or Clean Empty State */}
      {filtered.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          padding: '4rem 1.5rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'rgba(212, 175, 55, 0.12)',
            color: '#D4AF37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.25rem'
          }}>
            <Mail size={26} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            No official circulars have been recorded yet.
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#64748B', maxWidth: '440px', margin: 0 }}>
            Approved institutional circulars and examination notifications will appear here once published.
          </p>
          <div style={{ marginTop: '0.75rem' }}>
            <AnimatedActionButton
              icon={Plus}
              onClick={() => setIsModalOpen(true)}
              variant="primary"
              size="sm"
            >
              Issue New Circular
            </AnimatedActionButton>
          </div>
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Reference ID & Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Subject / Circular Title</th>
                <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                <th style={{ padding: '0.75rem 1rem' }}>Issuing Authority</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 800, color: '#0F172A' }}>{c.referenceNumber || c.id}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{formatDateDDMMYYYY(c.date)}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', maxWidth: '380px' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.84rem' }}>{c.title}</div>
                    {c.department && <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Dept: {c.department}</div>}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: c.category === 'Examination Circular' ? '#EFF6FF' : '#FEFCE8',
                      color: c.category === 'Examination Circular' ? '#1D4ED8' : '#A16207'
                    }}>
                      {c.category}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                    {c.signedBy || 'Controller of Examinations / Dean'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    {c.documentUrl ? (
                      <a
                        href={c.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.35rem 0.65rem',
                          background: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          borderRadius: '6px',
                          color: '#334155',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        <Download size={13} /> Download PDF
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Digital Record</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(7, 15, 30, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '540px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #E2E8F0',
              background: '#070F1E',
              color: '#FFFFFF'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#F1C40F' }}>Issue Official Circular</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>Record official notification into the verified institutional repository</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.3rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Circular / Notice Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autonomous Academic Calendar for Academic Year 2026-27"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFFFFF', boxSizing: 'border-box' }}
                  >
                    <option value="Official Notice">Official Notice</option>
                    <option value="Examination Circular">Examination Circular</option>
                    <option value="Academic Circular">Academic Circular</option>
                    <option value="Administrative Order">Administrative Order</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Issuing Authority
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Principal / Dean Academic"
                    value={formData.signedBy}
                    onChange={(e) => setFormData({ ...formData, signedBy: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Department / Wing
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Autonomous Exam Cell"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Reference / Document Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. NEC/AUT/CIR/2026/04"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <AnimatedActionButton
                  variant="primary"
                  size="md"
                >
                  Publish Circular
                </AnimatedActionButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </MotionPage>
  );
}
