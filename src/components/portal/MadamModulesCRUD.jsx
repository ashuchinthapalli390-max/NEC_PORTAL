import React, { useState } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Upload, 
  Save, 
  X, 
  ExternalLink,
  Clock,
  Layers,
  ChevronDown
} from 'lucide-react';
import { 
  getPublications, savePublication, softDeletePublication,
  getPatents, savePatent, softDeletePatent,
  getBoSMeetings, saveBoSMeeting,
  getStudentAchievements, saveStudentAchievement,
  getInternships, saveInternship, calculateInternshipWeeks,
  getStudentProjects, saveStudentProject,
  getFDPs, saveFDP,
  getFacultyAchievements, saveFacultyAchievement,
  getEvents, saveEvent,
  getMemberships, saveMembership,
  getMoUs, saveMoU, calculateMoUStatus,
  getNPTEL, saveNPTEL,
  getPlacementRecords, savePlacementRecord,
  exportToCSV, exportToExcel, exportToPDF,
  deleteItem
} from '../../data/portalStore.js';
import { DEPARTMENTS, FACULTY_DATA } from '../../data/masterData.js';
import ConfirmDeleteDialog from './common/ConfirmDeleteDialog.jsx';

export default function MadamModulesCRUD({ activeModule, currentUser, onDataChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  // Safety guard: Dedicated workflows must never render in generic CRUD
  if ([
    'bos', 
    'bos-meetings',
    'student-achievements',
    'achievements',
    'internships',
    'fdps-organized',
    'fdps',
    'faculty-achievements',
    'faculty-ach',
    'events',
    'academic-events',
    'workshops',
    'seminars',
    'guest-lectures',
    'hackathons',
    'codeathons',
    'publications',
    'research-papers',
    'patents',
    'ipr-patents',
    'sync-publications',
    'faculty-memberships',
    'memberships',
    'mous-collaborations',
    'mous',
    'student-projects',
    'projects',
    'nptel-certifications',
    'nptel'
  ].includes(activeModule)) {
    return null;
  }

  // Fetch current module records
  let items = [];
  if (activeModule === 'publications') items = getPublications();
  else if (activeModule === 'patents') items = getPatents();
  else if (activeModule === 'achievements') items = getStudentAchievements();
  else if (activeModule === 'internships') items = getInternships();
  else if (activeModule === 'projects') items = getStudentProjects();
  else if (activeModule === 'fdps') items = getFDPs();
  else if (activeModule === 'faculty-ach') items = getFacultyAchievements();
  else if (activeModule === 'events') items = getEvents();
  else if (activeModule === 'memberships') items = getMemberships();
  else if (activeModule === 'mous') items = getMoUs();
  else if (activeModule === 'nptel') items = getNPTEL();
  else if (activeModule === 'placements') items = getPlacementRecords();

  // Filter items
  const filteredItems = items.filter(item => {
    const q = searchQuery.toLowerCase();
    const str = JSON.stringify(item).toLowerCase();
    const matchesSearch = str.includes(q);
    const itemDept = String(item.department || item.branch || item.departmentCodes || 'All').toLowerCase();
    const filterDept = selectedDeptFilter.toLowerCase();
    const matchesDept = selectedDeptFilter === 'All' || 
      itemDept === 'all' || 
      itemDept.includes('all') || 
      itemDept.includes(filterDept) ||
      (selectedDeptFilter === 'CSE' && (itemDept.includes('cys') || itemDept.includes('ai') || itemDept.includes('ds') || itemDept.includes('cs')));
    return matchesSearch && matchesDept;
  });

  const openCreateModal = () => {
    setEditingItem(null);
    if (activeModule === 'publications') {
      setFormData({
        academicYear: '2024-25',
        authorType: 'Faculty',
        publicationType: 'Journal',
        facultyId: currentUser?.facultyId || 'NEC-PER-0284',
        facultyName: currentUser?.name || 'Dr. B. Jhansi Vazram',
        department: currentUser?.dept === 'Institutional' || currentUser?.dept === 'All' ? 'CSE' : currentUser?.dept,
        title: '',
        journalConference: '',
        publicationDate: new Date().toISOString().split('T')[0],
        firstAuthor: currentUser?.name || '',
        doi: '',
        issn: '',
        scopusIndexed: 'Yes',
        wosIndexed: 'No',
        verificationStatus: currentUser?.canApprove ? 'Published' : 'Submitted'
      });
    } else if (activeModule === 'patents') {
      setFormData({
        academicYear: '2024-25',
        facultyId: currentUser?.facultyId || 'NEC-PER-0069',
        facultyName: currentUser?.name || 'Dr. V. Venkata Rao',
        department: currentUser?.dept === 'Institutional' || currentUser?.dept === 'All' ? 'ECE' : currentUser?.dept,
        title: '',
        applicationNo: '',
        filingDate: new Date().toISOString().split('T')[0],
        publicationDate: '',
        patentStatus: 'Filed',
        patentType: 'Indian Utility Patent',
        authors: [{ name: currentUser?.name || '', role: 'Principal Inventor', department: currentUser?.dept || 'ECE' }],
        verificationStatus: 'Verified'
      });
    } else if (activeModule === 'internships') {
      setFormData({
        studentName: '',
        rollNumber: '',
        branch: 'CSE',
        batch: '2022-2026',
        year: 'III Year',
        academicYear: '2024-25',
        internshipType: 'Long Term',
        organization: '',
        mode: 'Hybrid',
        internshipTitle: '',
        domain: 'Cloud / AI',
        startDate: '2025-01-01',
        endDate: '2025-06-30',
        weeks: 26,
        stipend: 'Yes',
        stipendAmount: 25000,
        status: 'Verified'
      });
    } else if (activeModule === 'mous') {
      setFormData({
        organization: '',
        mouDate: new Date().toISOString().split('T')[0],
        validity: '3 Years',
        natureOfCollaboration: '',
        department: 'Institutional',
        contactPerson: '',
        status: 'Active'
      });
    } else if (activeModule === 'achievements') {
      setFormData({
        academicYear: '2024-25',
        rollNumber: '',
        studentName: '',
        department: 'CSE',
        year: 'III Year',
        achievementType: 'Academic / Technical',
        eventName: '',
        eventDetails: '',
        organizedBy: '',
        eventDate: new Date().toISOString().split('T')[0],
        level: 'National',
        prize: 'Yes',
        position: '1st Prize',
        prizeAmount: 25000,
        status: 'Approved'
      });
    } else {
      setFormData({
        academicYear: '2024-25',
        department: 'CSE',
        status: 'Approved'
      });
    }
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    setDeleteConfirmItem(id);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmItem) {
      const id = deleteConfirmItem;
      if (activeModule === 'publications') softDeletePublication(id, currentUser);
      else if (activeModule === 'patents') softDeletePatent(id, currentUser);
      else deleteItem(activeModule, id, currentUser);

      setDeleteConfirmItem(null);
      if (onDataChange) onDataChange();
      setToastMessage(`Item ${id} moved to Recycle Bin.`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (activeModule === 'publications') {
      savePublication(formData, currentUser);
    } else if (activeModule === 'patents') {
      savePatent(formData, currentUser);
    } else if (activeModule === 'achievements') {
      saveStudentAchievement(formData, currentUser);
    } else if (activeModule === 'internships') {
      saveInternship(formData, currentUser);
    } else if (activeModule === 'projects') {
      saveStudentProject(formData, currentUser);
    } else if (activeModule === 'fdps') {
      saveFDP(formData, currentUser);
    } else if (activeModule === 'faculty-ach') {
      saveFacultyAchievement(formData, currentUser);
    } else if (activeModule === 'events') {
      saveEvent(formData, currentUser);
    } else if (activeModule === 'memberships') {
      saveMembership(formData, currentUser);
    } else if (activeModule === 'mous') {
      saveMoU(formData, currentUser);
    } else if (activeModule === 'nptel') {
      saveNPTEL(formData, currentUser);
    } else if (activeModule === 'placements') {
      savePlacementRecord(formData, currentUser);
    }

    setToastMessage(`Record successfully saved to ${activeModule.toUpperCase()}!`);
    setTimeout(() => setToastMessage(null), 3000);
    setModalOpen(false);
    if (onDataChange) onDataChange();
  };

  // Export handlers
  const handleExportCSV = () => {
    exportToCSV(`NEC_${activeModule.toUpperCase()}_Export`, filteredItems);
  };

  const handleExportExcel = () => {
    exportToExcel(`NEC_${activeModule.toUpperCase()}_Report`, filteredItems, activeModule);
  };

  const handleExportPDF = () => {
    const keys = filteredItems.length > 0 ? Object.keys(filteredItems[0]).slice(0, 6) : ['ID', 'Title', 'Dept'];
    const rows = filteredItems.map(item => keys.map(k => typeof item[k] === 'object' ? JSON.stringify(item[k]) : String(item[k] || '')));
    exportToPDF(`NEC Institutional ${activeModule.toUpperCase()} Report`, keys, rows, `NEC_${activeModule}_Report`);
  };

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
      {toastMessage && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.2rem', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
      {/* Control Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', flex: 1 }}>
          {/* Search */}
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder={`Search ${activeModule}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.2rem', paddingRight: '0.8rem', fontSize: '0.88rem' }}
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="form-control"
            style={{ width: 'auto', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map(d => (
              <option key={d.id} value={d.code}>{d.code} - {d.name}</option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={handleExportCSV}
            style={{ padding: '0.5rem 0.8rem', borderRadius: '6px', background: '#F1F5F9', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontWeight: 600 }}
          >
            CSV
          </button>
          <button
            onClick={handleExportExcel}
            style={{ padding: '0.5rem 0.8rem', borderRadius: '6px', background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontSize: '0.8rem', fontWeight: 600 }}
          >
            Excel (XLSX)
          </button>
          <button
            onClick={handleExportPDF}
            style={{ padding: '0.5rem 0.8rem', borderRadius: '6px', background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', fontSize: '0.8rem', fontWeight: 600 }}
          >
            PDF Report
          </button>
          <button
            onClick={openCreateModal}
            className="btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <Plus size={15} /> Add New Entry
          </button>
        </div>
      </div>

      {/* Dynamic Data Table */}
      <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#0B192C', color: '#FFFFFF' }}>
              <th style={{ padding: '0.8rem' }}>#</th>
              <th style={{ padding: '0.8rem' }}>Primary Title / Name</th>
              <th style={{ padding: '0.8rem' }}>Department / Branch</th>
              <th style={{ padding: '0.8rem' }}>Academic Session</th>
              <th style={{ padding: '0.8rem' }}>Key Detail / Status</th>
              <th style={{ padding: '0.8rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                  No active records found matching the criteria. Click "Add New Entry" to create one.
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => (
                <tr key={item.id || idx} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                  <td style={{ padding: '0.8rem', fontWeight: 600, color: '#64748B' }}>{idx + 1}</td>
                  <td style={{ padding: '0.8rem', fontWeight: 700, color: '#0B192C', maxWidth: '320px' }}>
                    <div>{item.title || item.name || item.studentName || item.facultyName || item.organization || item.projectTitle || item.id}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 400 }}>ID: {item.id}</div>
                  </td>
                  <td style={{ padding: '0.8rem' }}>
                    <span className="badge badge-navy">{item.department || item.branch || 'Institutional'}</span>
                  </td>
                  <td style={{ padding: '0.8rem', color: '#475569' }}>
                    {item.academicYear || item.publicationDate || item.date || item.mouDate || 'Current'}
                  </td>
                  <td style={{ padding: '0.8rem' }}>
                    <span className={item.verificationStatus === 'Published' || item.status === 'Active' || item.status === 'Approved' ? 'badge badge-success' : 'badge badge-gold'}>
                      {item.verificationStatus || item.status || item.patentStatus || 'Recorded'}
                    </span>
                    {item.doi && <div style={{ fontSize: '0.72rem', color: '#0284C7', marginTop: '2px' }}>DOI: {item.doi}</div>}
                    {item.weeks && <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>{item.weeks} Weeks Duration</div>}
                    {item.highestPackage && <div style={{ fontSize: '0.72rem', color: '#B38600', fontWeight: 700 }}>Highest: {item.highestPackage}</div>}
                  </td>
                  <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => openEditModal(item)}
                        style={{ padding: '4px 8px', borderRadius: '4px', background: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1' }}
                        title="Edit Record"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{ padding: '4px 8px', borderRadius: '4px', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}
                        title="Move to Recycle Bin"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dynamic Create/Edit Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(7, 15, 30, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 6000,
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '750px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 70px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            <button
              onClick={() => setModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1.2rem',
                right: '1.2rem',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ background: '#0B192C', padding: '1.8rem 2rem', color: '#FFFFFF' }}>
              <span className="badge badge-gold" style={{ marginBottom: '0.3rem' }}>
                Module: {activeModule.toUpperCase()}
              </span>
              <h2 style={{ fontSize: '1.3rem', color: '#FFFFFF' }}>
                {editingItem ? `Edit Entry (${editingItem.id})` : `Create New ${activeModule.toUpperCase()} Entry`}
              </h2>
            </div>

            <form onSubmit={handleSaveForm} style={{ padding: '2rem' }}>
              {/* Conditional Form Fields based on activeModule */}
              {activeModule === 'publications' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Paper Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">First Author / Faculty Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.firstAuthor || ''}
                        onChange={(e) => setFormData({ ...formData, firstAuthor: e.target.value })}
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Journal / Conference Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.journalConference || ''}
                        onChange={(e) => setFormData({ ...formData, journalConference: e.target.value })}
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="grid-3" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Department *</label>
                      <select
                        value={formData.department || 'CSE'}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="form-control"
                      >
                        {DEPARTMENTS.map(d => (
                          <option key={d.id} value={d.code}>{d.code}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">DOI Link</label>
                      <input
                        type="text"
                        placeholder="10.1016/j.eng.2025..."
                        value={formData.doi || ''}
                        onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                        className="form-control"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Scopus Indexed</label>
                      <select
                        value={formData.scopusIndexed || 'Yes'}
                        onChange={(e) => setFormData({ ...formData, scopusIndexed: e.target.value })}
                        className="form-control"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeModule === 'patents' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Patent Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="grid-3" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Application Number *</label>
                      <input
                        type="text"
                        required
                        value={formData.applicationNo || ''}
                        onChange={(e) => setFormData({ ...formData, applicationNo: e.target.value })}
                        className="form-control"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Patent Status</label>
                      <select
                        value={formData.patentStatus || 'Filed'}
                        onChange={(e) => setFormData({ ...formData, patentStatus: e.target.value })}
                        className="form-control"
                      >
                        <option value="Filed">Filed</option>
                        <option value="Published">Published</option>
                        <option value="Granted">Granted</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Filing Date</label>
                      <input
                        type="date"
                        value={formData.filingDate || ''}
                        onChange={(e) => setFormData({ ...formData, filingDate: e.target.value })}
                        className="form-control"
                      />
                    </div>
                  </div>

                  {/* Dynamic Inventors List */}
                  <div style={{ marginTop: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label className="form-label">Inventors & Authors</label>
                      <button
                        type="button"
                        onClick={() => {
                          const authors = formData.authors || [];
                          setFormData({ ...formData, authors: [...authors, { name: '', role: 'Co-Inventor', department: formData.department || 'ECE' }] });
                        }}
                        style={{ fontSize: '0.78rem', color: '#0284C7', fontWeight: 700 }}
                      >
                        + Add Inventor
                      </button>
                    </div>
                    {(formData.authors || []).map((author, aIdx) => (
                      <div key={aIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          placeholder="Inventor Name"
                          value={author.name || ''}
                          onChange={(e) => {
                            const updated = [...(formData.authors || [])];
                            updated[aIdx] = { ...updated[aIdx], name: e.target.value };
                            setFormData({ ...formData, authors: updated });
                          }}
                          className="form-control"
                        />
                        <input
                          type="text"
                          placeholder="Role (e.g. Principal Inventor)"
                          value={author.role || ''}
                          onChange={(e) => {
                            const updated = [...(formData.authors || [])];
                            updated[aIdx] = { ...updated[aIdx], role: e.target.value };
                            setFormData({ ...formData, authors: updated });
                          }}
                          className="form-control"
                          style={{ width: '180px' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (formData.authors || []).filter((_, i) => i !== aIdx);
                            setFormData({ ...formData, authors: updated });
                          }}
                          style={{ padding: '0 8px', color: '#EF4444' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeModule === 'internships' && (
                <div>
                  <div className="grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Student Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.studentName || ''}
                        onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Roll Number *</label>
                      <input
                        type="text"
                        required
                        value={formData.rollNumber || ''}
                        onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Organization / Host Company *</label>
                      <input
                        type="text"
                        required
                        value={formData.organization || ''}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Internship Title</label>
                      <input
                        type="text"
                        value={formData.internshipTitle || ''}
                        onChange={(e) => setFormData({ ...formData, internshipTitle: e.target.value })}
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="grid-3" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        value={formData.startDate || ''}
                        onChange={(e) => {
                          const s = e.target.value;
                          const w = calculateInternshipWeeks(s, formData.endDate);
                          setFormData({ ...formData, startDate: s, weeks: w });
                        }}
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        value={formData.endDate || ''}
                        onChange={(e) => {
                          const end = e.target.value;
                          const w = calculateInternshipWeeks(formData.startDate, end);
                          setFormData({ ...formData, endDate: end, weeks: w });
                        }}
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Auto-Calculated Weeks</label>
                      <input
                        type="number"
                        readOnly
                        value={formData.weeks || 1}
                        className="form-control"
                        style={{ background: '#F1F5F9', fontWeight: 700 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeModule === 'mous' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Collaborating Organization *</label>
                    <input
                      type="text"
                      required
                      value={formData.organization || ''}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">MoU Signing Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.mouDate || ''}
                        onChange={(e) => {
                          const date = e.target.value;
                          const auto = calculateMoUStatus(date, formData.validity);
                          setFormData({ ...formData, mouDate: date, expiryDate: auto.expiryDate, status: auto.status });
                        }}
                        className="form-control"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Validity Duration</label>
                      <select
                        value={formData.validity || '3 Years'}
                        onChange={(e) => {
                          const val = e.target.value;
                          const auto = calculateMoUStatus(formData.mouDate, val);
                          setFormData({ ...formData, validity: val, expiryDate: auto.expiryDate, status: auto.status });
                        }}
                        className="form-control"
                      >
                        <option value="1 Year">1 Year</option>
                        <option value="2 Years">2 Years</option>
                        <option value="3 Years">3 Years</option>
                        <option value="5 Years">5 Years</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nature of Collaboration</label>
                    <textarea
                      rows={2}
                      value={formData.natureOfCollaboration || ''}
                      onChange={(e) => setFormData({ ...formData, natureOfCollaboration: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>
              )}

              {/* Generic fallback for remaining modules */}
              {!['publications', 'patents', 'internships', 'mous'].includes(activeModule) && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Title / Event / Candidate Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.title || formData.name || formData.studentName || formData.eventName || formData.course || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value, name: e.target.value, eventName: e.target.value, course: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Department *</label>
                      <select
                        value={formData.department || 'CSE'}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="form-control"
                      >
                        {DEPARTMENTS.map(d => (
                          <option key={d.id} value={d.code}>{d.code}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Academic Year</label>
                      <input
                        type="text"
                        value={formData.academicYear || '2024-25'}
                        onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.2rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-outline"
                  style={{ padding: '0.6rem 1.2rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.6rem' }}
                >
                  <Save size={16} /> Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        isOpen={Boolean(deleteConfirmItem)}
        title="Move Item to Recycle Bin?"
        itemName={deleteConfirmItem}
        itemType="record"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmItem(null)}
      />
    </div>
  );
}
