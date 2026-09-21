import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Trash2, 
  Copy, 
  Users, 
  MapPin, 
  Building2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { DEPARTMENTS } from '../../../data/masterData.js';

export default function WorkshopsEventsView({ onAddEvent }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'
  const [activeEvent, setActiveEvent] = useState(null);

  // Initial rich production events dataset
  const [events, setEvents] = useState([
    {
      id: 'EVT-2026-001',
      title: 'National Workshop on Generative AI & Large Language Models',
      type: 'Workshop',
      dept: 'CSE',
      academicYear: '2025-26',
      startDate: '2026-09-15',
      endDate: '2026-09-17',
      venue: 'Dr. APJ Abdul Kalam Auditorium',
      speaker: 'Dr. P. Ramesh, Principal AI Scientist, Microsoft Research',
      attendees: 180,
      status: 'Upcoming',
      coordinator: 'Dr. S. Venkateswarlu'
    },
    {
      id: 'EVT-2026-002',
      title: 'Industry Hands-on BootCamp on Embedded Systems & Edge Computing',
      type: 'FDP',
      dept: 'ECE',
      academicYear: '2025-26',
      startDate: '2026-08-10',
      endDate: '2026-08-14',
      venue: 'IoT & Embedded Systems Center of Excellence',
      speaker: 'Er. V. Rajesh, Senior Systems Engineer, Texas Instruments',
      attendees: 65,
      status: 'Completed',
      coordinator: 'Dr. V. Venkata Rao'
    },
    {
      id: 'EVT-2026-003',
      title: 'NEC HackSphere 2026: 36-Hour National Code-a-Thon',
      type: 'Hackathon',
      dept: 'CSE',
      academicYear: '2025-26',
      startDate: '2026-10-02',
      endDate: '2026-10-04',
      venue: 'Central Innovation & Incubation Hub',
      speaker: 'Industry Jury Panel (Google, Amazon, TCS)',
      attendees: 320,
      status: 'Upcoming',
      coordinator: 'Dr. K. Ramesh'
    },
    {
      id: 'EVT-2026-004',
      title: 'Guest Lecture on Next-Gen Renewable Microgrids & EV Infrastructure',
      type: 'Guest Lecture',
      dept: 'EEE',
      academicYear: '2025-26',
      startDate: '2026-07-28',
      endDate: '2026-07-28',
      venue: 'Seminar Hall 2',
      speaker: 'Prof. K. Satyanarayana, IIT Madras',
      attendees: 110,
      status: 'Completed',
      coordinator: 'Dr. M. Sreenivasa Kumar'
    },
    {
      id: 'EVT-2026-005',
      title: 'International Seminar on Advanced Computational Fluid Dynamics',
      type: 'Seminar',
      dept: 'MECH',
      academicYear: '2025-26',
      startDate: '2026-09-22',
      endDate: '2026-09-23',
      venue: 'Mechanical Seminar Hall',
      speaker: 'Dr. Alan Walker, Cranfield University, UK',
      attendees: 90,
      status: 'Pending Review',
      coordinator: 'Dr. B. Venkata Siva'
    }
  ]);

  // Form State for Event Modal
  const [formData, setFormData] = useState({
    title: '',
    type: 'Workshop',
    dept: 'CSE',
    academicYear: '2025-26',
    startDate: '',
    endDate: '',
    venue: '',
    speaker: '',
    attendees: '',
    status: 'Upcoming',
    coordinator: ''
  });

  const [toastMessage, setToastMessage] = useState(null);
  const [formError, setFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered Events
  const filteredEvents = events.filter(e => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = e.title.toLowerCase().includes(q) || e.speaker.toLowerCase().includes(q) || e.coordinator.toLowerCase().includes(q);
    const matchesDept = deptFilter === 'ALL' || e.dept === deptFilter;
    const matchesType = typeFilter === 'ALL' || e.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    const matchesYear = yearFilter === 'ALL' || e.academicYear === yearFilter;
    return matchesSearch && matchesDept && matchesType && matchesStatus && matchesYear;
  });

  // Mini Stat Calculations
  const totalCount = events.length;
  const upcomingCount = events.filter(e => e.status === 'Upcoming').length;
  const completedCount = events.filter(e => e.status === 'Completed').length;
  const pendingCount = events.filter(e => e.status === 'Pending Review').length;
  const totalAttendees = events.reduce((acc, curr) => acc + (Number(curr.attendees) || 0), 0);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEventIds(filteredEvents.map(ev => ev.id));
    } else {
      setSelectedEventIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedEventIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormError('');
    setFormData({
      title: '',
      type: 'Workshop',
      dept: 'CSE',
      academicYear: '2025-26',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      venue: 'Auditorium',
      speaker: '',
      attendees: 100,
      status: 'Upcoming',
      coordinator: 'Dr. S. Venkateswarlu'
    });
    setModalOpen(true);
  };

  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.speaker.trim()) {
      setFormError('Please fill in Event Title and Keynote Speaker details.');
      return;
    }

    setFormError('');
    if (modalMode === 'create') {
      const newEvent = {
        ...formData,
        id: 'EVT-' + Date.now().toString().slice(-4),
        attendees: Number(formData.attendees) || 50
      };
      setEvents([newEvent, ...events]);
      showToast('Event registered successfully!');
    } else if (modalMode === 'edit' && activeEvent) {
      setEvents(events.map(ev => ev.id === activeEvent.id ? { ...ev, ...formData } : ev));
      showToast('Event updated successfully!');
    }
    setModalOpen(false);
  };

  const handleDeleteEvent = (id) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      setEvents(events.filter(e => e.id !== deleteConfirmId));
      setSelectedEventIds(prev => prev.filter(item => item !== deleteConfirmId));
      setDeleteConfirmId(null);
      showToast('Event record removed successfully.');
    }
  };

  const handleDuplicate = (ev) => {
    const duplicated = {
      ...ev,
      id: 'EVT-' + Date.now().toString().slice(-4),
      title: `${ev.title} (Copy)`,
      status: 'Draft'
    };
    setEvents([duplicated, ...events]);
    showToast('Event record duplicated.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', width: '100%', position: 'relative' }}>
      {toastMessage && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
      {/* 1. Module Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: '#64748B', marginBottom: '0.25rem' }}>
            <span>Dashboard</span>
            <ChevronRight size={12} />
            <span>Events & Outreach</span>
            <ChevronRight size={12} />
            <span style={{ color: '#0F172A', fontWeight: 700 }}>Workshops & Events</span>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.25rem 0', fontFamily: 'Cinzel, Georgia, serif' }}>
            Workshops & Academic Events
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
            Central repository for department workshops, national conferences, FDPs, hackathons, and guest lectures.
          </p>
        </div>

        {/* Top Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)',
              color: '#070F1E',
              padding: '0.55rem 1.05rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.8rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(212, 175, 55, 0.35)'
            }}
            className="hover:scale-105 transition-transform"
          >
            <Plus size={15} /> Add New Event
          </button>
        </div>
      </div>

      {/* 2. Mini Stats Summary Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.85rem'
      }}>
        {[
          { label: 'Total Events', value: totalCount, icon: Calendar, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.08)' },
          { label: 'Upcoming', value: upcomingCount, icon: Clock, color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)' },
          { label: 'Completed', value: completedCount, icon: CheckCircle2, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.08)' },
          { label: 'Pending Review', value: pendingCount, icon: AlertCircle, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)' },
          { label: 'Total Attendees', value: totalAttendees, icon: Users, color: '#D4AF37', bg: 'rgba(212, 175, 55, 0.08)' }
        ].map((st, idx) => {
          const StIcon = st.icon;
          return (
            <div
              key={idx}
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '0.9rem 1rem',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: st.bg,
                color: st.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <StIcon size={18} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{st.value}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem' }}>{st.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Comprehensive Filter Toolbar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        padding: '1rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by event title, speaker, or coordinator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              className="focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Export & Utility Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={() => showToast('Exporting active dataset to Excel format...')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                color: '#334155',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              className="hover:bg-slate-100"
            >
              <FileSpreadsheet size={14} style={{ color: '#10B981' }} /> Export Excel
            </button>

            <button
              type="button"
              onClick={() => showToast('Generating formal PDF report dossier...')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                color: '#334155',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              className="hover:bg-slate-100"
            >
              <FileText size={14} style={{ color: '#EF4444' }} /> Export PDF
            </button>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.65rem'
        }}>
          {/* Department Filter */}
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '0.2rem' }}>
              DEPARTMENT
            </label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem',
                borderRadius: '6px',
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

          {/* Event Type Filter */}
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '0.2rem' }}>
              EVENT TYPE
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.78rem',
                outline: 'none',
                background: '#FFFFFF'
              }}
            >
              <option value="ALL">All Event Types</option>
              <option value="Workshop">Workshop</option>
              <option value="Seminar">Seminar</option>
              <option value="Guest Lecture">Guest Lecture</option>
              <option value="Hackathon">Hackathon</option>
              <option value="FDP">FDP (Faculty Dev)</option>
              <option value="Webinar">Webinar</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '0.2rem' }}>
              STATUS
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.78rem',
                outline: 'none',
                background: '#FFFFFF'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* Academic Year Filter */}
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '0.2rem' }}>
              ACADEMIC YEAR
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.78rem',
                outline: 'none',
                background: '#FFFFFF'
              }}
            >
              <option value="ALL">All Academic Years</option>
              <option value="2025-26">2025-26 (Current)</option>
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Data Table Container */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0.75rem 1rem', width: '36px' }}>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedEventIds.length === filteredEvents.length && filteredEvents.length > 0}
                  />
                </th>
                <th style={{ padding: '0.75rem 1rem' }}>Event Title</th>
                <th style={{ padding: '0.75rem 1rem' }}>Speaker / Expert</th>
                <th style={{ padding: '0.75rem 1rem' }}>Event Type</th>
                <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                <th style={{ padding: '0.75rem 1rem' }}>Academic Year</th>
                <th style={{ padding: '0.75rem 1rem' }}>Event Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Venue</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Coordinator</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748B' }}>
                    <Calendar size={32} style={{ color: '#CBD5E1', margin: '0 auto 0.5rem auto' }} />
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>No matching events found</div>
                    <div style={{ fontSize: '0.76rem' }}>Try adjusting your search query or filter parameters.</div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const isSelected = selectedEventIds.includes(ev.id);
                  const statusColors = {
                    Upcoming: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
                    Completed: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
                    'Pending Review': { bg: '#FEFCE8', text: '#A16207', border: '#FEF08A' },
                    Draft: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' }
                  }[ev.status] || { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };

                  return (
                    <tr
                      key={ev.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        background: isSelected ? 'rgba(212, 175, 55, 0.05)' : 'transparent',
                        transition: 'background 0.1s ease'
                      }}
                      className="hover:bg-slate-50"
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(ev.id)}
                        />
                      </td>

                      {/* Event Title */}
                      <td style={{ padding: '0.85rem 1rem', maxWidth: '240px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>
                          {ev.title}
                        </div>
                      </td>

                      {/* Speaker / Expert */}
                      <td style={{ padding: '0.85rem 1rem', maxWidth: '180px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                          {ev.speaker || '—'}
                        </div>
                      </td>

                      {/* Event Type */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          background: '#F1F5F9',
                          color: '#334155',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          border: '1px solid #E2E8F0'
                        }}>
                          {ev.type}
                        </span>
                      </td>

                      {/* Department */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{ev.dept}</div>
                      </td>

                      {/* Academic Year */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{ev.academicYear || '—'}</div>
                      </td>

                      {/* Event Date */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{ev.startDate || '—'}</div>
                      </td>

                      {/* Venue */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.76rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <MapPin size={11} /> {ev.venue || 'Campus'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          background: statusColors.bg,
                          color: statusColors.text,
                          border: `1px solid ${statusColors.border}`,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          display: 'inline-block'
                        }}>
                          {ev.status}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: '#334155' }}>
                        {ev.coordinator}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <button
                            type="button"
                            title="Edit Event"
                            onClick={() => {
                              setActiveEvent(ev);
                              setFormData(ev);
                              setModalMode('edit');
                              setModalOpen(true);
                            }}
                            style={{
                              background: 'transparent',
                              border: '1px solid #CBD5E1',
                              color: '#334155',
                              padding: '0.3rem 0.45rem',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            className="hover:bg-slate-100"
                          >
                            <Edit3 size={13} />
                          </button>

                          <button
                            type="button"
                            title="Duplicate"
                            onClick={() => handleDuplicate(ev)}
                            style={{
                              background: 'transparent',
                              border: '1px solid #CBD5E1',
                              color: '#334155',
                              padding: '0.3rem 0.45rem',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            className="hover:bg-slate-100"
                          >
                            <Copy size={13} />
                          </button>

                          <button
                            type="button"
                            title="Delete"
                            onClick={() => handleDeleteEvent(ev.id)}
                            style={{
                              background: 'rgba(220, 38, 38, 0.08)',
                              border: '1px solid rgba(220, 38, 38, 0.2)',
                              color: '#DC2626',
                              padding: '0.3rem 0.45rem',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            className="hover:bg-red-100"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Create / Edit Event Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 15, 30, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1100
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.5rem',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1rem 0' }}>
              {modalMode === 'create' ? 'Add New Workshop / Event' : 'Edit Event Record'}
            </h2>
            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {formError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '0.6rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={14} />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  EVENT TITLE *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Workshop on Deep Learning & Vision"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    EVENT TYPE
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Guest Lecture">Guest Lecture</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="FDP">FDP</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    DEPARTMENT
                  </label>
                  <select
                    value={formData.dept}
                    onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  >
                    {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  KEYNOTE SPEAKER / RESOURCE PERSON *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. K. Satyanarayana, Senior Scientist"
                  value={formData.speaker}
                  onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    START DATE
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    VENUE / PLATFORM
                  </label>
                  <input
                    type="text"
                    placeholder="Auditorium / Lab"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)',
                    color: '#070F1E',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Save Record
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
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
              Delete Event Record?
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: '1.4rem', lineHeight: 1.5 }}>
              Are you sure you want to remove this event record? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#FFFFFF', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
