import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Check, 
  Upload, 
  FileText, 
  Code2, 
  User, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  Globe, 
  GitBranch,
  Video,
  ExternalLink,
  Sparkles,
  Award,
  Layers,
  Search,
  BookOpen
} from 'lucide-react';
import { DEPARTMENTS, FACULTY_DATA } from '../../../data/masterData.js';
import { 
  STUDENT_DIRECTORY, 
  lookupStudentByRollNumber, 
  saveStudentProject, 
  getMoUs,
  getPublications,
  getPatents
} from '../../../data/portalStore.js';
import FormField from '../../ui/form/FormField.jsx';
import { Input, DateInput, Select, Textarea } from '../../ui/form/FormControls.jsx';

const PROJECT_TYPES = [
  'Mini Project',
  'Major Project',
  'Capstone Project',
  'Research Project',
  'Industry Project',
  'Innovation Project'
];

const DOMAINS = [
  'Artificial Intelligence / ML',
  'Internet of Things (IoT)',
  'Cloud Computing',
  'Cyber Security & Cryptography',
  'Web Development & Full Stack',
  'Mobile App Development',
  'Data Science & Big Data',
  'VLSI & Embedded Systems',
  'Robotics & Automation',
  'Blockchain & Web3',
  'Renewable Energy & Power Systems',
  'Structural & Civil Engineering'
];

export default function StudentProjectWizardModal({
  isOpen,
  onClose,
  initialData = null,
  currentUser,
  onSaved
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // Student directory search input for adding members
  const [studentRollQuery, setStudentRollQuery] = useState('');
  const [studentLookupError, setStudentLookupError] = useState('');
  const [newTechTag, setNewTechTag] = useState('');

  const defaultDept = currentUser?.role === 'HOD' ? (currentUser.dept || 'CSE') : 'CSE';

  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
        domains: Array.isArray(initialData.domains) ? initialData.domains : [initialData.domain || 'Artificial Intelligence / ML'],
        teamMembers: Array.isArray(initialData.teamMembers) ? initialData.teamMembers : [],
        technologies: Array.isArray(initialData.technologies) ? initialData.technologies : [],
        reviews: Array.isArray(initialData.reviews) ? initialData.reviews : [],
        documents: Array.isArray(initialData.documents) ? initialData.documents : []
      };
    }

    const defaultFac = currentUser?.facultyId ? FACULTY_DATA.find(f => f.id === currentUser.facultyId) : null;

    return {
      projectTitle: '',
      projectType: 'Major Project',
      department: defaultDept,
      batch: '2022-2026',
      academicYear: '2025-26',
      year: 'IV Year',
      semester: 'II Sem',
      domains: [],
      problemStatement: '',
      description: '',
      objectives: '',
      expectedOutcome: '',
      startDate: new Date().toISOString().split('T')[0],
      expectedCompletion: '',
      
      // Team
      teamMembers: [],
      
      // Guides & Industry
      guide: {
        facultyId: defaultFac?.id || '',
        name: defaultFac?.name || '',
        department: defaultFac?.department || defaultDept,
        designation: defaultFac?.designation || '',
        email: defaultFac?.email || ''
      },
      coGuide: null,
      industryAssociation: {
        isIndustryAssociated: false,
        organization: '',
        industryMentor: '',
        isMouAssociated: false,
        associatedMoU: ''
      },
      
      // Tech Stack
      technologies: [],
      
      // Milestone Reviews
      reviews: [
        { reviewName: 'Proposal / Synopsis Review', reviewDate: '', panelMembers: 'Project Review Committee', marksAwarded: 0, maxMarks: 20, feedback: '', status: 'PENDING' },
        { reviewName: 'Review 1 (Architecture)', reviewDate: '', panelMembers: 'Internal Panel', marksAwarded: 0, maxMarks: 25, feedback: '', status: 'PENDING' },
        { reviewName: 'Review 2 (Implementation)', reviewDate: '', panelMembers: 'Internal Panel', marksAwarded: 0, maxMarks: 25, feedback: '', status: 'PENDING' },
        { reviewName: 'Final Viva & Demo', reviewDate: '', panelMembers: 'External & Internal Panel', marksAwarded: 0, maxMarks: 30, feedback: '', status: 'PENDING' }
      ],
      
      // Links & Research Outcomes
      links: {
        githubUrl: '',
        liveDemoUrl: '',
        videoUrl: ''
      },
      researchOutcomes: {
        publicationGenerated: false,
        linkedPublicationId: '',
        patentFiled: false,
        linkedPatentId: ''
      },
      
      documents: [],
      projectStatus: 'IN_PROGRESS',
      workflowStatus: 'DRAFT'
    };
  });

  // Toggle Domain Chip
  const toggleDomain = (dom) => {
    setFormData(prev => {
      const exists = prev.domains.includes(dom);
      const updated = exists ? prev.domains.filter(d => d !== dom) : [...prev.domains, dom];
      return { ...prev, domains: updated, domain: updated[0] || 'Artificial Intelligence / ML' };
    });
  };

  // Add Member by Roll Number lookup
  const handleAddMemberByRoll = () => {
    if (!studentRollQuery.trim()) return;
    const clean = studentRollQuery.trim().toUpperCase();
    
    // Check duplicate
    if (formData.teamMembers.some(m => m.rollNumber.toUpperCase() === clean)) {
      setStudentLookupError(`Student with Roll No ${clean} is already in the project team.`);
      return;
    }

    const found = lookupStudentByRollNumber(clean);
    if (!found) {
      setStudentLookupError(`Roll Number "${clean}" not found in verified student directory. Enter valid roll number.`);
      return;
    }

    const newMember = {
      rollNumber: found.rollNumber,
      name: found.name,
      department: found.department,
      year: found.year,
      semester: found.semester,
      email: found.email,
      isLeader: false
    };

    setFormData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, newMember]
    }));
    setStudentRollQuery('');
    setStudentLookupError('');
  };

  // Remove Member
  const handleRemoveMember = (roll) => {
    if (formData.teamMembers.length <= 1) {
      setStudentLookupError('A project team must have at least 1 student member (Team Leader).');
      return;
    }
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter(m => m.rollNumber !== roll)
    }));
  };

  // Add Technology Tag
  const handleAddTechTag = () => {
    if (!newTechTag.trim()) return;
    if (formData.technologies.includes(newTechTag.trim())) return;
    setFormData(prev => ({
      ...prev,
      technologies: [...prev.technologies, newTechTag.trim()]
    }));
    setNewTechTag('');
  };

  // Remove Technology Tag
  const handleRemoveTechTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tag)
    }));
  };

  // Document Upload
  const handleFileUpload = (e, category) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc = {
      id: 'DOC-' + Date.now(),
      name: file.name,
      type: category || 'Project Report PDF',
      size: (file.size / 1024).toFixed(1) + ' KB',
      uploadedAt: new Date().toISOString(),
      url: URL.createObjectURL(file)
    };

    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, newDoc]
    }));
  };

  // Step Validation
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.projectTitle) newErrors.projectTitle = 'Project title is required';
      if (!formData.problemStatement) newErrors.problemStatement = 'Problem statement is required';
      if (!formData.domains || formData.domains.length === 0) newErrors.domains = 'Select at least 1 technology domain';
    } else if (step === 2) {
      if (!formData.teamMembers || formData.teamMembers.length === 0) {
        newErrors.teamMembers = 'At least 1 team member is required';
      }
    } else if (step === 3) {
      if (!formData.guide?.name) newErrors.guide = 'Primary faculty guide is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(6, prev + 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Save Draft Handler
  const handleSaveDraft = () => {
    if (!formData.projectTitle.trim()) {
      setSubmitError('Project Title is required to save draft');
      return;
    }

    setIsSavingDraft(true);
    setSubmitError('');
    try {
      const saved = saveStudentProject({
        ...formData,
        workflowStatus: 'DRAFT'
      }, currentUser);

      setTimeout(() => {
        setIsSavingDraft(false);
        setDraftSavedToast(true);
        if (onSaved) onSaved(saved);
        setTimeout(() => setDraftSavedToast(false), 2500);
      }, 400);
    } catch (err) {
      setIsSavingDraft(false);
      setSubmitError(err.message);
    }
  };

  const handleSubmit = () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      setSubmitError('Please fill all mandatory fields across steps 1, 2, and 3.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      saveStudentProject({
        ...formData,
        workflowStatus: 'SUBMITTED'
      }, currentUser);

      setTimeout(() => {
        setIsSubmitting(false);
        if (onSaved) onSaved();
        onClose();
      }, 500);
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(7, 15, 30, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '1rem'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.25 }}
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          overflow: 'hidden'
        }}
      >
        {/* 1. Header */}
        <div style={{
          background: 'linear-gradient(135deg, #070F1E 0%, #0B192C 100%)',
          padding: '1.25rem 1.75rem',
          borderBottom: '2px solid #D4AF37',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#FFFFFF'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#D4AF37', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Code2 size={14} /> Student Development • Project Governance & Outcomes
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#FFFFFF', fontFamily: 'Cinzel, serif' }}>
              {initialData ? `Edit Student Project (${initialData.projectNumber || initialData.id})` : 'Register Student Project & Milestones'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#94A3B8', borderRadius: '8px', padding: '0.45rem', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Stepper Header */}
        <div style={{
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          padding: '0.75rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.35rem',
          overflowX: 'auto'
        }}>
          {[
            { step: 1, label: 'Project Details' },
            { step: 2, label: 'Team Members' },
            { step: 3, label: 'Guide & Mentors' },
            { step: 4, label: 'Tech & Reviews' },
            { step: 5, label: 'Documents & Outcomes' },
            { step: 6, label: 'Review & Submit' }
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isDone = currentStep > s.step;
            return (
              <div
                key={s.step}
                onClick={() => isDone && setCurrentStep(s.step)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: isDone ? 'pointer' : 'default', opacity: isActive ? 1 : (isDone ? 0.85 : 0.45) }}
              >
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: isActive ? '#070F1E' : (isDone ? '#10B981' : '#CBD5E1'),
                  color: isActive ? '#F1C40F' : '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: isActive ? '2px solid #D4AF37' : 'none'
                }}>
                  {isDone ? <Check size={11} /> : s.step}
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#0F172A' : '#64748B', whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
                {s.step < 6 && <ChevronRight size={12} style={{ color: '#CBD5E1', marginLeft: '0.15rem' }} />}
              </div>
            );
          })}
        </div>

        {/* 3. Form Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {submitError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{submitError}</span>
            </div>
          )}
          <AnimatePresence mode="wait">
            {/* ──────── STEP 1: PROJECT DETAILS ──────── */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem' }}>
                  <FormField label="PROJECT TYPE *">
                    <Select value={formData.projectType} onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}>
                      {PROJECT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                    </Select>
                  </FormField>

                  <FormField label="DEPARTMENT *">
                    <Select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                      {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.code}</option>)}
                    </Select>
                  </FormField>

                  <FormField label="BATCH *">
                    <Select value={formData.batch} onChange={(e) => setFormData({ ...formData, batch: e.target.value })}>
                      <option value="2022-2026">2022-2026</option>
                      <option value="2023-2027">2023-2027</option>
                      <option value="2021-2025">2021-2025</option>
                    </Select>
                  </FormField>
                </div>

                <FormField label="PROJECT TITLE *" error={errors.projectTitle}>
                  <Input
                    placeholder="e.g. Autonomous Edge AI Vision System for Crop Disease Detection"
                    value={formData.projectTitle}
                    onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                    error={!!errors.projectTitle}
                  />
                </FormField>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                    TECHNOLOGY DOMAINS ({formData.domains.length} SELECTED) *
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {DOMAINS.map(dom => {
                      const isSel = formData.domains.includes(dom);
                      return (
                        <button
                          key={dom}
                          type="button"
                          onClick={() => toggleDomain(dom)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '9999px',
                            border: isSel ? '1px solid #D4AF37' : '1px solid #CBD5E1',
                            background: isSel ? '#070F1E' : '#FFFFFF',
                            color: isSel ? '#F1C40F' : '#475569',
                            fontSize: '0.74rem',
                            fontWeight: isSel ? 800 : 600,
                            cursor: 'pointer'
                          }}
                        >
                          {isSel ? '✓ ' : '+ '}{dom}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <FormField label="PROBLEM STATEMENT *" error={errors.problemStatement}>
                  <Textarea rows={2} placeholder="Define the core technical challenge and societal or industrial relevance..." value={formData.problemStatement} onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })} error={!!errors.problemStatement} />
                </FormField>
              </motion.div>
            )}

            {/* ──────── STEP 2: TEAM MEMBERS ──────── */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                    ADD STUDENT MEMBER FROM DIRECTORY
                  </span>
                  
                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <input
                      type="text"
                      placeholder="Enter Student Roll No (e.g. 22471A0589, 23BQ1A0501)..."
                      value={studentRollQuery}
                      onChange={(e) => { setStudentRollQuery(e.target.value); setStudentLookupError(''); }}
                      style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddMemberByRoll}
                      style={{ padding: '0.5rem 1.15rem', background: '#070F1E', color: '#F1C40F', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      + Add Member
                    </button>
                  </div>

                  {studentLookupError && (
                    <div style={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.4rem' }}>
                      {studentLookupError}
                    </div>
                  )}
                </div>

                <div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                    PROJECT TEAM MEMBERS ({formData.teamMembers.length})
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {formData.teamMembers.map((m, idx) => (
                      <div
                        key={m.rollNumber || idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          background: m.isLeader ? '#FFFDF5' : '#FFFFFF',
                          border: m.isLeader ? '1.5px solid #D4AF37' : '1px solid #E2E8F0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: m.isLeader ? '#D4AF37' : '#070F1E',
                            color: m.isLeader ? '#070F1E' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 800
                          }}>
                            {idx + 1}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.84rem' }}>
                              {m.name} {m.isLeader && <span style={{ color: '#D4AF37', fontSize: '0.72rem', fontWeight: 800 }}>(Team Leader)</span>}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              Roll: {m.rollNumber} • {m.department} • {m.year}
                            </div>
                          </div>
                        </div>

                        {!m.isLeader && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.rollNumber)}
                            style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──────── STEP 3: GUIDE & MENTORS ──────── */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <FormField label="PRIMARY FACULTY GUIDE *" error={errors.guide}>
                  <Select
                    value={formData.guide?.name}
                    onChange={(e) => {
                      const fac = FACULTY_DATA.find(f => f.name === e.target.value);
                      setFormData({
                        ...formData,
                        guide: {
                          facultyId: fac?.id || '',
                          name: fac?.name || e.target.value,
                          department: fac?.department || formData.department,
                          designation: fac?.designation || 'Faculty Guide',
                          email: fac?.email || ''
                        }
                      });
                    }}
                  >
                    {FACULTY_DATA.map(f => <option key={f.id} value={f.name}>{f.name} ({f.department} - {f.designation})</option>)}
                  </Select>
                </FormField>

                <FormField label="CO-GUIDE (OPTIONAL)">
                  <Select
                    value={formData.coGuide?.name || ''}
                    onChange={(e) => {
                      if (!e.target.value) {
                        setFormData({ ...formData, coGuide: null });
                      } else {
                        const fac = FACULTY_DATA.find(f => f.name === e.target.value);
                        setFormData({
                          ...formData,
                          coGuide: {
                            facultyId: fac?.id || '',
                            name: fac?.name || e.target.value,
                            department: fac?.department || formData.department,
                            designation: fac?.designation || 'Co-Guide'
                          }
                        });
                      }
                    }}
                  >
                    <option value="">None / Single Guide</option>
                    {FACULTY_DATA.map(f => <option key={f.id} value={f.name}>{f.name} ({f.department})</option>)}
                  </Select>
                </FormField>

                {/* Industry Association Toggle */}
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>
                    <input
                      type="checkbox"
                      checked={formData.industryAssociation.isIndustryAssociated}
                      onChange={(e) => setFormData({
                        ...formData,
                        industryAssociation: {
                          ...formData.industryAssociation,
                          isIndustryAssociated: e.target.checked
                        }
                      })}
                    />
                    Industry Sponsored / Collaborative Project
                  </label>

                  {formData.industryAssociation.isIndustryAssociated && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginTop: '0.85rem' }}
                    >
                      <FormField label="INDUSTRY PARTNER / COMPANY NAME">
                        <Input placeholder="e.g. Tata Consultancy Services / Cisco" value={formData.industryAssociation.organization} onChange={(e) => setFormData({ ...formData, industryAssociation: { ...formData.industryAssociation, organization: e.target.value } })} />
                      </FormField>
                      <FormField label="EXTERNAL INDUSTRY MENTOR">
                        <Input placeholder="Mr. / Ms. Mentor Name" value={formData.industryAssociation.industryMentor} onChange={(e) => setFormData({ ...formData, industryAssociation: { ...formData.industryAssociation, industryMentor: e.target.value } })} />
                      </FormField>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ──────── STEP 4: TECH & REVIEWS ──────── */}
            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                    TECHNOLOGY STACK TAGS
                  </label>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Add tech stack tag (e.g. PyTorch, Docker, Next.js)..."
                      value={newTechTag}
                      onChange={(e) => setNewTechTag(e.target.value)}
                      style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                    />
                    <button type="button" onClick={handleAddTechTag} style={{ padding: '0.45rem 1rem', background: '#070F1E', color: '#F1C40F', border: 'none', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>
                      + Add
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {formData.technologies.map(t => (
                      <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.7rem', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {t}
                        <X size={11} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTechTag(t)} />
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                    MILESTONE REVIEW SCHEDULE & MARKS
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {formData.reviews.map((rev, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.65rem', alignItems: 'center', padding: '0.65rem 0.9rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>{rev.reviewName}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Panel: {rev.panelMembers}</div>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#0F172A' }}>{rev.reviewDate}</div>
                        <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#059669' }}>{rev.marksAwarded} / {rev.maxMarks} M</div>
                        <div>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px', background: rev.status === 'COMPLETED' ? '#ECFDF5' : (rev.status === 'IN_PROGRESS' ? '#FEF3C7' : '#F1F5F9'), color: rev.status === 'COMPLETED' ? '#047857' : (rev.status === 'IN_PROGRESS' ? '#B45309' : '#64748B') }}>
                            {rev.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──────── STEP 5: DOCUMENTS & OUTCOMES ──────── */}
            {currentStep === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <FormField label="GITHUB REPO URL">
                    <Input placeholder="https://github.com/nec-cse/..." value={formData.links?.githubUrl} onChange={(e) => setFormData({ ...formData, links: { ...formData.links, githubUrl: e.target.value } })} />
                  </FormField>
                  <FormField label="LIVE DEMO URL">
                    <Input placeholder="https://project.nec.edu.in" value={formData.links?.liveDemoUrl} onChange={(e) => setFormData({ ...formData, links: { ...formData.links, liveDemoUrl: e.target.value } })} />
                  </FormField>
                  <FormField label="VIDEO DEMO URL">
                    <Input placeholder="https://youtu.be/..." value={formData.links?.videoUrl} onChange={(e) => setFormData({ ...formData, links: { ...formData.links, videoUrl: e.target.value } })} />
                  </FormField>
                </div>

                {/* Research Outcomes Linkage */}
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                    RESEARCH OUTCOME LINKAGES (PUBLICATIONS & PATENTS)
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FormField label="LINKED RESEARCH PUBLICATION ID">
                      <Input placeholder="e.g. PUB-CSE-2026-0012" value={formData.researchOutcomes?.linkedPublicationId} onChange={(e) => setFormData({ ...formData, researchOutcomes: { ...formData.researchOutcomes, linkedPublicationId: e.target.value, publicationGenerated: !!e.target.value } })} />
                    </FormField>
                    <FormField label="LINKED PATENT APPLICATION ID">
                      <Input placeholder="e.g. PAT-CSE-2026-0004" value={formData.researchOutcomes?.linkedPatentId} onChange={(e) => setFormData({ ...formData, researchOutcomes: { ...formData.researchOutcomes, linkedPatentId: e.target.value, patentFiled: !!e.target.value } })} />
                    </FormField>
                  </div>
                </div>

                {/* Document Attachments Dropzone */}
                <div style={{ border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', background: '#F8FAFC' }}>
                  <Upload size={24} style={{ color: '#D4AF37', margin: '0 auto 0.4rem' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.2rem' }}>Upload Project Final Report or Synopsis PDF</div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#070F1E', color: '#F1C40F', padding: '0.45rem 1rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                    <Upload size={13} /> Attach PDF Document
                    <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, 'Project Final Report PDF')} style={{ display: 'none' }} />
                  </label>
                </div>
              </motion.div>
            )}

            {/* ──────── STEP 6: REVIEW & SUBMIT ──────── */}
            {currentStep === 6 && (
              <motion.div key="step6" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)', padding: '1.25rem', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase' }}>
                    {formData.projectType} • {formData.batch}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0.2rem 0' }}>
                    {formData.projectTitle}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    Leader: <strong>{formData.teamMembers[0]?.name}</strong> ({formData.teamMembers[0]?.rollNumber}) • Guide: <strong>{formData.guide?.name}</strong>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Team Size</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>{formData.teamMembers.length} Members</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Tech Domains</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#059669' }}>{formData.domains.join(', ')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Status</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#2563EB' }}>{formData.projectStatus}</div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '0.85rem 1rem', background: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065F46', fontSize: '0.8rem' }}>
                  <Sparkles size={16} /> Submitting initiates departmental review and NAAC Criterion 1 & 3 accreditation documentation.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. Action Footer */}
        <div style={{ background: '#F8FAFC', padding: '1rem 1.75rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {currentStep === 1 ? (
            <button type="button" onClick={onClose} style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              Cancel
            </button>
          ) : (
            <button type="button" onClick={handleBack} style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              <ChevronLeft size={15} /> Back
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button type="button" onClick={handleSaveDraft} disabled={isSavingDraft} style={{ padding: '0.55rem 1.05rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              {draftSavedToast ? <><Check size={14} style={{ color: '#10B981' }} /> Saved</> : (isSavingDraft ? 'Saving...' : 'Save Draft')}
            </button>

            {currentStep < 6 ? (
              <button type="button" onClick={handleNext} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', background: '#070F1E', color: '#F1C40F', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>
                Continue <ChevronRight size={15} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.35rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>
                <Check size={15} /> {isSubmitting ? 'Submitting...' : 'Submit Project'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
