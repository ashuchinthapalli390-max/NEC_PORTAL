import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  Building2,
  Mail, 
  Phone,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Calendar,
  Award
} from 'lucide-react';
import { DEPARTMENTS } from '../../../data/masterData.js';
import { getStaffProfiles, saveStaffProfile, deleteStaffProfile } from '../../../data/portalStore.js';
import AddStaffRecordDialog from '../staff/AddStaffRecordDialog.jsx';

export default function StaffProfilesManager({ currentUser }) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [staffTypeFilter, setStaffTypeFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const refreshStaff = () => {
    const list = getStaffProfiles();
    setStaffList(list);
  };

  useEffect(() => {
    refreshStaff();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveStaff = async (staffData) => {
    try {
      const res = saveStaffProfile(staffData, currentUser);
      refreshStaff();
      showToast(staffData.id ? 'Staff profile updated successfully.' : 'New staff record created successfully.');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleDeleteStaff = (staffId) => {
    deleteStaffProfile(staffId, currentUser);
    setDeleteCandidate(null);
    refreshStaff();
    showToast('Staff record archived successfully.');
  };

  const filtered = staffList.filter(s => {
    const q = search.toLowerCase().trim();
    const matchQ = !q || 
      (s.name && s.name.toLowerCase().includes(q)) || 
      (s.fullName && s.fullName.toLowerCase().includes(q)) || 
      (s.designation && s.designation.toLowerCase().includes(q)) || 
      (s.id && s.id.toLowerCase().includes(q)) ||
      (s.officialStaffId && s.officialStaffId.toLowerCase().includes(q));

    const matchDept = deptFilter === 'ALL' || (s.department || '').toLowerCase() === deptFilter.toLowerCase();
    const matchType = staffTypeFilter === 'ALL' || (s.staffType || '') === staffTypeFilter;
    return matchQ && matchDept && matchType;
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
            <span>Faculty & Staff Development</span>
            <ChevronRight size={12} />
            <span style={{ color: '#0F172A', fontWeight: 700 }}>Staff Profiles</span>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.25rem 0', fontFamily: 'Cinzel, Georgia, serif' }}>
            Technical Cadre & Non-Teaching Staff Directory
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
            Manage verified technical lab assistants, network engineers, administrative officers, and workshop cadre records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingRecord(null);
            setDialogOpen(true);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)',
            color: '#070F1E',
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.82rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(212, 175, 55, 0.35)',
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          <Plus size={16} /> Add Staff Record
        </button>
      </div>

      {/* Filter Row */}
      <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search staff by name, designation, Staff ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.2rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          style={{ padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFFFFF' }}
        >
          <option value="ALL">All</option>
          {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
          <option value="Administration">Central Administration</option>
          <option value="Examinations">Exam Cell</option>
          <option value="Library">Central Library</option>
          <option value="Maintenance">Campus Maintenance</option>
        </select>
      </div>

      {/* Zero State / Empty List */}
      {filtered.length === 0 && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '4rem 2rem',
          textAlign: 'center',
          border: '1px dashed #CBD5E1',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#94A3B8' }}>
            <UserCheck size={28} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.4rem 0' }}>
            {staffList.length === 0 ? 'No Staff Records Added Yet' : 'No Matching Staff Records Found'}
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.85rem', maxWidth: '460px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            {staffList.length === 0 
              ? 'Click "+ Add Staff Record" above to add verified technical cadre, lab assistants, or administrative personnel to the institutional directory.'
              : 'Try adjusting your search criteria or department filter.'}
          </p>
          {staffList.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setDialogOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#0B192C',
                color: '#FFFFFF',
                padding: '0.6rem 1.4rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.84rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Plus size={15} /> Add First Staff Record
            </button>
          )}
        </div>
      )}

      {/* Staff Cards Grid */}
      {filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filtered.map(staff => (
            <motion.div 
              key={staff.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{ 
                background: '#FFFFFF', 
                borderRadius: '14px', 
                border: '1px solid #E2E8F0', 
                padding: '1.4rem', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                gap: '0.8rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '6px', background: '#FEF3C7', color: '#B45309' }}>
                    {staff.staffType || 'Technical Cadre'}
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '6px', background: '#F1F5F9', color: '#334155' }}>
                    {staff.department}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.2rem 0' }}>
                  {staff.name || staff.fullName}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#D4AF37', fontWeight: 700, marginBottom: '0.6rem' }}>
                  {staff.designation}
                </div>

                <div style={{ fontSize: '0.76rem', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {staff.officialStaffId && <div><strong>ID:</strong> {staff.officialStaffId}</div>}
                  {staff.qualification && <div><strong>Qualification:</strong> {staff.qualification}</div>}
                  {staff.experience && <div><strong>Experience:</strong> {staff.experience}</div>}
                  {staff.email && <div><strong>Email:</strong> {staff.email}</div>}
                  {staff.phone && <div><strong>Contact:</strong> {staff.phone}</div>}
                  {staff.employmentType && <div><strong>Cadre:</strong> {staff.employmentType}</div>}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRecord(staff);
                    setDialogOpen(true);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#0B192C',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Edit2 size={13} /> Edit
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteCandidate(staff)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #FECACA',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={13} /> Archive
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Staff Modal Dialog */}
      <AddStaffRecordDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveStaff}
        currentUser={currentUser}
        editRecord={editingRecord}
      />

      {/* Custom Archive Confirmation Dialog (No window.confirm!) */}
      {deleteCandidate && (
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
              Archive Staff Profile?
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: '1.4rem', lineHeight: 1.5 }}>
              Are you sure you want to archive the staff record for <strong>{deleteCandidate.name || deleteCandidate.fullName}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStaff(deleteCandidate.id)}
                style={{
                  padding: '0.6rem 1.4rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Archive Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
