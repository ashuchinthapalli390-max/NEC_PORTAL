import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, UserCheck, Check, Building2 } from 'lucide-react';
import { FACULTY_DATA, DEPARTMENTS } from '../../../data/masterData.js';
import FacultyAvatar from '../../common/FacultyAvatar.jsx';

export default function FacultySelectorModal({
  isOpen,
  onClose,
  onSelectFaculty,
  defaultDepartment = 'CSE',
  selectedFacultyId = null
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState(defaultDepartment || 'ALL');

  if (!isOpen) return null;

  const filteredFaculty = FACULTY_DATA.filter(f => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (f.name && f.name.toLowerCase().includes(q)) || 
      (f.designation && f.designation.toLowerCase().includes(q)) || 
      (f.id && f.id.toLowerCase().includes(q));
    const matchesDept = deptFilter === 'ALL' || (f.department || '').toLowerCase().includes(deptFilter.toLowerCase());
    return matchesSearch && matchesDept;
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(7, 15, 30, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 1200
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '620px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          background: '#070F1E',
          padding: '1.1rem 1.25rem',
          color: '#FFFFFF',
          borderBottom: '2px solid #D4AF37',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'Cinzel, Georgia, serif' }}>
              Select BoS Chairman from Directory
            </h3>
            <div style={{ fontSize: '0.74rem', color: '#CBD5E1', marginTop: '0.15rem' }}>
              Verified NEC Faculty Records Only • Authentic Photo Governance
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', gap: '0.6rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search faculty name, designation, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.1rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.78rem',
              outline: 'none',
              background: '#FFFFFF'
            }}
          >
            <option value="ALL">All</option>
            {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
          </select>
        </div>

        {/* Faculty List */}
        <div style={{ padding: '0.75rem 1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredFaculty.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748B' }}>
              <Building2 size={32} style={{ color: '#CBD5E1', margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155' }}>No verified faculty found</div>
              <div style={{ fontSize: '0.74rem' }}>Try adjusting your department filter or search query.</div>
            </div>
          ) : (
            filteredFaculty.map((faculty) => {
              const isSelected = selectedFacultyId === faculty.id;
              return (
                <div
                  key={faculty.id}
                  onClick={() => {
                    onSelectFaculty(faculty);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: `1px solid ${isSelected ? '#D4AF37' : '#E2E8F0'}`,
                    background: isSelected ? 'rgba(212, 175, 55, 0.08)' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  className="hover:border-amber-400 hover:bg-slate-50"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FacultyAvatar
                      faculty={faculty}
                      size={42}
                      showBadge={false}
                      shape="circle"
                      ringColor={faculty.photo ? '#10B981' : '#CBD5E1'}
                    />
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                        {faculty.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem' }}>
                        {faculty.designation} • <span style={{ fontWeight: 700, color: '#D4AF37' }}>{faculty.department}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    style={{
                      background: isSelected ? '#D4AF37' : '#F8FAFC',
                      color: isSelected ? '#070F1E' : '#334155',
                      border: `1px solid ${isSelected ? '#D4AF37' : '#CBD5E1'}`,
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {isSelected ? <><Check size={12} /> Selected</> : 'Select'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
