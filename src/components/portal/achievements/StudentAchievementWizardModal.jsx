import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Check, 
  Upload, 
  FileText, 
  Trophy, 
  User, 
  Users, 
  Sparkles, 
  Award, 
  Calendar, 
  Building2, 
  Search, 
  AlertCircle, 
  Trash2,
  ExternalLink
} from 'lucide-react';
import { DEPARTMENTS } from '../../../data/masterData.js';
import { 
  STUDENT_DIRECTORY, 
  lookupStudentByRollNumber, 
  searchStudents, 
  saveStudentAchievement 
} from '../../../data/portalStore.js';
import FormField from '../../ui/form/FormField.jsx';
import { Input, DateInput, Select, Textarea } from '../../ui/form/FormControls.jsx';
import { parseDateRange } from '../../../lib/ui/dateUtils.js';

const ACHIEVEMENT_CATEGORIES = [
  'Academic',
  'Technical',
  'Cultural',
  'Sports',
  'NCC',
  'NSS',
  'Hackathon',
  'Coding Competition',
  'Paper Presentation',
  'Project Competition',
  'Innovation',
  'Online Course',
  'Leadership',
  'Community Service',
  'Others'
];

const COMPETITION_LEVELS = [
  'College',
  'Inter-College',
  'University',
  'District',
  'State',
  'National',
  'International'
];

const PRIZE_POSITIONS = [
  '1st Prize',
  '2nd Prize',
  '3rd Prize',
  'Winner',
  'Runner-Up',
  'Gold Medal',
  'Silver Medal',
  'Bronze Medal',
  'Best Performer',
  'Special Mention',
  'Other'
];

export default function StudentAchievementWizardModal({
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
  const [unsavedConfirmOpen, setUnsavedConfirmOpen] = useState(false);
  const [rollSearchQuery, setRollSearchQuery] = useState('');
  const [rollSearchResults, setRollSearchResults] = useState([]);
  const [errors, setErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      const parsed = parseDateRange(initialData.eventDate || initialData.achievementDate || initialData.date);
      const sDate = initialData.startDate || parsed.startDate;
      const eDate = initialData.endDate || parsed.endDate || parsed.lastDate;
      return {
        ...initialData,
        startDate: sDate,
        endDate: eDate,
        achievementDate: eDate || initialData.achievementDate,
        eventDate: eDate || initialData.eventDate,
        documents: initialData.documents || []
      };
    }

    const defaultDept = currentUser?.role === 'HOD' ? (currentUser.dept || 'CSE') : 'CSE';
    const today = new Date().toISOString().split('T')[0];

    return {
      rollNumber: '',
      studentName: '',
      department: defaultDept,
      year: 'III Year',
      semester: 'II Sem',
      batch: '2022-2026',
      academicYear: '2025-26',
      achievementType: 'Hackathon',
      customAchievementType: '',
      title: '',
      description: '',
      eventName: '',
      organizedBy: '',
      venue: '',
      startDate: today,
      endDate: today,
      achievementDate: today,
      eventDate: today,
      level: 'National',
      participationType: 'Individual',
      teamName: '',
      teamSize: 1,
      teamMembers: '',
      hasPrize: 'Yes',
      prizePosition: '1st Prize',
      prizeAmount: '',
      currency: 'INR',
      medalTrophy: 'Trophy & Certificate',
      certificateReceived: 'Yes',
      visibilityStatus: 'Eligible for Public Website',
      documents: []
    };
  });

  // Roll number search lookup handler
  const handleRollSearch = (q) => {
    setRollSearchQuery(q);
    setFormData(prev => ({ ...prev, rollNumber: q }));
    if (q && q.trim().length >= 2) {
      const results = searchStudents(q);
      setRollSearchResults(results);
    } else {
      setRollSearchResults([]);
    }
  };

  const handleSelectStudent = (student) => {
    setFormData(prev => ({
      ...prev,
      rollNumber: student.rollNumber,
      studentName: student.name,
      department: student.department,
      year: student.year,
      semester: student.semester,
      batch: student.batch,
      academicYear: student.academicYear || '2025-26'
    }));
    setRollSearchQuery(student.rollNumber);
    setRollSearchResults([]);
  };

  // Upload simulated document
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc = {
      id: 'DOC-' + Date.now(),
      name: file.name,
      type: file.name.endsWith('.pdf') ? 'PDF' : 'Image',
      category: 'Certificate / Proof',
      size: (file.size / 1024).toFixed(1) + ' KB',
      uploadedAt: new Date().toISOString(),
      url: URL.createObjectURL(file)
    };

    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, newDoc]
    }));
  };

  const handleRemoveDoc = (docId) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(d => d.id !== docId)
    }));
  };

  // Step Validation
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.rollNumber) newErrors.rollNumber = 'Roll number is required';
      if (!formData.studentName) newErrors.studentName = 'Student name is required';
      if (!formData.department) newErrors.department = 'Department is required';
      if (!formData.academicYear) newErrors.academicYear = 'Academic year is required';
    } else if (step === 2) {
      if (!formData.title) newErrors.title = 'Achievement title is required';
      if (!formData.organizedBy) newErrors.organizedBy = 'Organizing institute/entity is required';
      if (!formData.achievementDate) newErrors.achievementDate = 'Achievement date is required';
      if (formData.achievementType === 'Others' && !formData.customAchievementType) {
        newErrors.customAchievementType = 'Please specify the achievement type';
      }
    } else if (step === 3) {
      if (formData.hasPrize === 'Yes' && !formData.prizePosition) {
        newErrors.prizePosition = 'Prize position is required';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(5, prev + 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    const saved = saveStudentAchievement({
      ...formData,
      workflowStatus: 'DRAFT'
    }, currentUser);

    setTimeout(() => {
      setIsSavingDraft(false);
      setDraftSavedToast(true);
      if (onSaved) onSaved(saved);
      setTimeout(() => setDraftSavedToast(false), 2500);
    }, 400);
  };

  const [submitError, setSubmitError] = useState('');

  const handleSubmit = () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      setSubmitError('Please fill all mandatory fields across steps before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    const saved = saveStudentAchievement({
      ...formData,
      workflowStatus: 'SUBMITTED'
    }, currentUser);

    setTimeout(() => {
      setIsSubmitting(false);
      if (onSaved) onSaved(saved);
      onClose();
    }, 500);
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
        transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
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
        {/* 1. Modal Header */}
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
              <Trophy size={14} /> Student Development • Evidence Management
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#FFFFFF', fontFamily: 'Cinzel, serif' }}>
              {initialData ? 'Edit Student Achievement Record' : 'Record Student Achievement'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setUnsavedConfirmOpen(true)}
            aria-label="Close"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#94A3B8',
              borderRadius: '8px',
              padding: '0.45rem',
              cursor: 'pointer'
            }}
            className="hover:bg-white/20 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. 5-Step Stepper Header */}
        <div style={{
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          padding: '0.75rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {[
            { step: 1, label: 'Student Details' },
            { step: 2, label: 'Achievement' },
            { step: 3, label: 'Prize & Level' },
            { step: 4, label: 'Proof & Evidence' },
            { step: 5, label: 'Review & Submit' }
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isDone = currentStep > s.step;
            return (
              <div
                key={s.step}
                onClick={() => isDone && setCurrentStep(s.step)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: isDone ? 'pointer' : 'default',
                  opacity: isActive ? 1 : (isDone ? 0.85 : 0.45)
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: isActive ? '#070F1E' : (isDone ? '#10B981' : '#CBD5E1'),
                  color: isActive ? '#F1C40F' : '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: isActive ? '2px solid #D4AF37' : 'none'
                }}>
                  {isDone ? <Check size={13} /> : s.step}
                </div>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#0F172A' : '#64748B',
                  whiteSpace: 'nowrap'
                }}>
                  {s.label}
                </span>
                {s.step < 5 && <ChevronRight size={14} style={{ color: '#CBD5E1', marginLeft: '0.25rem' }} />}
              </div>
            );
          })}
        </div>

        {/* 3. Form Body Canvas */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {submitError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{submitError}</span>
            </div>
          )}
          <AnimatePresence mode="wait">
            {/* ──────── STEP 1: STUDENT DETAILS ──────── */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}
              >
                <div style={{ position: 'relative' }}>
                  <FormField label="ROLL NUMBER *" description="Type roll number or search student master directory" error={errors.rollNumber}>
                    <div style={{ position: 'relative' }}>
                      <Input
                        type="text"
                        placeholder="e.g. 23BQ1A0501, 22471A0589"
                        value={formData.rollNumber}
                        onChange={(e) => handleRollSearch(e.target.value)}
                        error={!!errors.rollNumber}
                      />
                      <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    </div>
                  </FormField>

                  {/* Auto-suggest dropdown */}
                  {rollSearchResults.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#FFFFFF',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                      border: '1px solid #D4AF37',
                      zIndex: 100,
                      maxHeight: '180px',
                      overflowY: 'auto',
                      marginTop: '4px'
                    }}>
                      {rollSearchResults.map(student => (
                        <div
                          key={student.rollNumber}
                          onClick={() => handleSelectStudent(student)}
                          style={{
                            padding: '0.55rem 0.85rem',
                            borderBottom: '1px solid #F1F5F9',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          className="hover:bg-slate-100"
                        >
                          <div>
                            <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem' }}>{student.rollNumber}</span>
                            <span style={{ color: '#64748B', fontSize: '0.78rem', marginLeft: '0.5rem' }}>{student.name}</span>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 600 }}>{student.department} ({student.year})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <FormField label="STUDENT NAME *" error={errors.studentName}>
                    <Input
                      type="text"
                      placeholder="Full student name"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      error={!!errors.studentName}
                    />
                  </FormField>

                  <FormField label="DEPARTMENT / BRANCH *" error={errors.department}>
                    <Select
                      value={formData.department}
                      disabled={currentUser?.role === 'HOD'}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      error={!!errors.department}
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d.code} value={d.code}>{d.name} ({d.code})</option>
                      ))}
                    </Select>
                  </FormField>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <FormField label="YEAR OF STUDY *">
                    <Select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    >
                      <option value="I Year">I Year</option>
                      <option value="II Year">II Year</option>
                      <option value="III Year">III Year</option>
                      <option value="IV Year">IV Year</option>
                    </Select>
                  </FormField>

                  <FormField label="SEMESTER">
                    <Select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    >
                      <option value="I Sem">I Semester</option>
                      <option value="II Sem">II Semester</option>
                    </Select>
                  </FormField>

                  <FormField label="ACADEMIC YEAR *" error={errors.academicYear}>
                    <Select
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    >
                      <option value="2026-27">2026-27</option>
                      <option value="2025-26">2025-26 (Current)</option>
                      <option value="2024-25">2024-25</option>
                      <option value="2023-24">2023-24</option>
                    </Select>
                  </FormField>
                </div>
              </motion.div>
            )}

            {/* ──────── STEP 2: ACHIEVEMENT DETAILS ──────── */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <FormField label="ACHIEVEMENT CATEGORY *">
                    <Select
                      value={formData.achievementType}
                      onChange={(e) => setFormData({ ...formData, achievementType: e.target.value })}
                    >
                      {ACHIEVEMENT_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </FormField>

                  {formData.achievementType === 'Others' ? (
                    <FormField label="SPECIFY TYPE *" error={errors.customAchievementType}>
                      <Input
                        type="text"
                        placeholder="Specify custom achievement type"
                        value={formData.customAchievementType}
                        onChange={(e) => setFormData({ ...formData, customAchievementType: e.target.value })}
                        error={!!errors.customAchievementType}
                      />
                    </FormField>
                  ) : (
                    <FormField label="LEVEL *">
                      <Select
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      >
                        {COMPETITION_LEVELS.map(l => (
                          <option key={l} value={l}>{l} Level</option>
                        ))}
                      </Select>
                    </FormField>
                  )}
                </div>

                <FormField label="ACHIEVEMENT TITLE *" error={errors.title}>
                  <Input
                    type="text"
                    placeholder="e.g. Winner – Smart India Hackathon 2024 Grand Finale"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    error={!!errors.title}
                  />
                </FormField>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <FormField label="ORGANIZED BY *" error={errors.organizedBy}>
                    <Input
                      type="text"
                      placeholder="e.g. Ministry of Education / IIT Madras / JNTUK"
                      value={formData.organizedBy}
                      onChange={(e) => setFormData({ ...formData, organizedBy: e.target.value })}
                      error={!!errors.organizedBy}
                    />
                  </FormField>

                  <FormField label="EVENT / COMPETITION NAME">
                    <Input
                      type="text"
                      placeholder="e.g. SIH 2024 / National Code-a-thon"
                      value={formData.eventName}
                      onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                    />
                  </FormField>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr', gap: '1rem' }}>
                  <FormField label="START DATE" error={errors.startDate}>
                    <DateInput
                      value={formData.startDate || formData.achievementDate}
                      onChange={(e) => {
                        const s = e.target.value;
                        setFormData({
                          ...formData,
                          startDate: s,
                          endDate: (!formData.endDate || formData.endDate === formData.startDate) ? s : formData.endDate,
                          achievementDate: formData.endDate || s,
                          eventDate: formData.endDate || s
                        });
                      }}
                      error={!!errors.startDate}
                    />
                  </FormField>

                  <FormField label="END DATE (DEFAULT) *" error={errors.achievementDate}>
                    <DateInput
                      value={formData.endDate || formData.achievementDate}
                      onChange={(e) => {
                        const ed = e.target.value;
                        setFormData({
                          ...formData,
                          endDate: ed,
                          achievementDate: ed,
                          eventDate: ed
                        });
                      }}
                      error={!!errors.achievementDate}
                    />
                  </FormField>

                  <FormField label="VENUE / CITY">
                    <Input
                      type="text"
                      placeholder="e.g. New Delhi / Hyderabad"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    />
                  </FormField>

                  <FormField label="PARTICIPATION TYPE">
                    <Select
                      value={formData.participationType}
                      onChange={(e) => setFormData({ ...formData, participationType: e.target.value })}
                    >
                      <option value="Individual">Individual</option>
                      <option value="Team">Team</option>
                    </Select>
                  </FormField>
                </div>

                {formData.participationType === 'Team' && (
                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>TEAM DETAILS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <Input
                        placeholder="Team Name (e.g. ByteCraft NEC)"
                        value={formData.teamName}
                        onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                      />
                      <Input
                        placeholder="Team Members (comma separated roll numbers)"
                        value={formData.teamMembers}
                        onChange={(e) => setFormData({ ...formData, teamMembers: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <FormField label="DESCRIPTION & HIGHLIGHTS">
                  <Textarea
                    rows={2}
                    placeholder="Brief description of the work, project, or problem solved..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </FormField>
              </motion.div>
            )}

            {/* ──────── STEP 3: PRIZE & LEVEL ──────── */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <FormField label="PRIZE / RECOGNITION SECURED? *">
                    <Select
                      value={formData.hasPrize}
                      onChange={(e) => setFormData({ ...formData, hasPrize: e.target.value })}
                    >
                      <option value="Yes">Yes (Secured Award / Prize)</option>
                      <option value="No">No (Participation / Finalist)</option>
                    </Select>
                  </FormField>

                  <FormField label="POSITION / AWARD *" error={errors.prizePosition}>
                    <Select
                      value={formData.prizePosition}
                      disabled={formData.hasPrize === 'No'}
                      onChange={(e) => setFormData({ ...formData, prizePosition: e.target.value })}
                      error={!!errors.prizePosition}
                    >
                      {PRIZE_POSITIONS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </Select>
                  </FormField>
                </div>

                {formData.hasPrize === 'Yes' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <FormField label="PRIZE AMOUNT (OPTIONAL)">
                      <Input
                        type="number"
                        placeholder="e.g. 50000"
                        value={formData.prizeAmount}
                        onChange={(e) => setFormData({ ...formData, prizeAmount: e.target.value })}
                      />
                    </FormField>

                    <FormField label="CURRENCY">
                      <Select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                      </Select>
                    </FormField>

                    <FormField label="MEDAL / TROPHY">
                      <Input
                        type="text"
                        placeholder="e.g. Gold Medal & Trophy"
                        value={formData.medalTrophy}
                        onChange={(e) => setFormData({ ...formData, medalTrophy: e.target.value })}
                      />
                    </FormField>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <FormField label="CERTIFICATE RECEIVED?">
                    <Select
                      value={formData.certificateReceived}
                      onChange={(e) => setFormData({ ...formData, certificateReceived: e.target.value })}
                    >
                      <option value="Yes">Yes</option>
                      <option value="Pending">Pending / Awaited</option>
                    </Select>
                  </FormField>

                  <FormField label="PUBLIC PORTAL VISIBILITY">
                    <Select
                      value={formData.visibilityStatus}
                      onChange={(e) => setFormData({ ...formData, visibilityStatus: e.target.value })}
                    >
                      <option value="Eligible for Public Website">Eligible for Public Website (Post-Approval)</option>
                      <option value="Internal Only">Internal Only (Accreditation & Audits)</option>
                    </Select>
                  </FormField>
                </div>
              </motion.div>
            )}

            {/* ──────── STEP 4: PROOF & EVIDENCE ──────── */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <div style={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: '#F8FAFC'
                }}>
                  <Upload size={28} style={{ color: '#D4AF37', margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
                    Upload Certificate / Award Proof / Photographs
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 1rem' }}>
                    Accepted formats: PDF, PNG, JPG, JPEG (Max 10 MB). Documents remain securely encrypted in institutional storage.
                  </p>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: '#070F1E',
                    color: '#F1C40F',
                    padding: '0.5rem 1.15rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}>
                    <Upload size={14} /> Browse Proof Files
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {/* Uploaded Documents List */}
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    ATTACHED EVIDENCE ({formData.documents.length})
                  </div>
                  {formData.documents.length === 0 ? (
                    <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>
                      No proof documents attached yet. Attach official certificate before final verification.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {formData.documents.map(doc => (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.65rem 0.9rem',
                            background: '#F1F5F9',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <FileText size={16} style={{ color: '#D4AF37' }} />
                            <div>
                              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>{doc.name}</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{doc.category} • {doc.size}</div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {doc.url && (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ padding: '0.25rem 0.5rem', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '4px', color: '#0284C7', fontSize: '0.72rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                              >
                                View <ExternalLink size={10} />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc(doc.id)}
                              style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', borderRadius: '4px', padding: '0.3rem', cursor: 'pointer' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ──────── STEP 5: REVIEW & SUBMIT ──────── */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <div style={{
                  background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid #BFDBFE'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {formData.achievementType} • {formData.level} Level
                      </span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: '0.2rem 0' }}>
                        {formData.title || 'Untitled Achievement'}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                        {formData.organizedBy} • {formData.achievementDate}
                      </div>
                    </div>

                    <span style={{
                      background: '#FEFCE8',
                      color: '#A16207',
                      border: '1px solid #FEF08A',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}>
                      {formData.hasPrize === 'Yes' ? formData.prizePosition : 'Participation'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Student</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{formData.studentName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{formData.rollNumber}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Department & AY</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{formData.department}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{formData.academicYear}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Prize & Awards</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{formData.prizeAmount ? `₹${formData.prizeAmount}` : 'Certificate/Trophy'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{formData.medalTrophy}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Documents</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{formData.documents.length} Files Attached</div>
                      <div style={{ fontSize: '0.72rem', color: '#10B981' }}>Evidence Ready</div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '0.85rem 1rem', background: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065F46', fontSize: '0.8rem' }}>
                  <Sparkles size={16} /> Submitting this record will initiate the departmental verification and approval workflow.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. Action Footer */}
        <div style={{
          background: '#F8FAFC',
          padding: '1rem 1.75rem',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {currentStep === 1 ? (
            <button
              type="button"
              onClick={() => setUnsavedConfirmOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              className="hover:bg-slate-100"
            >
              <X size={15} /> Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              className="hover:bg-slate-100"
            >
              <ChevronLeft size={15} /> Back
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.55rem 1.05rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              className="hover:bg-slate-100"
            >
              {draftSavedToast ? <><Check size={14} style={{ color: '#10B981' }} /> Saved</> : (isSavingDraft ? 'Saving...' : 'Save Draft')}
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#070F1E',
                  color: '#F1C40F',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
                className="hover:bg-slate-900"
              >
                Continue <ChevronRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 1.35rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)'
                }}
                className="hover:scale-105 transition-transform"
              >
                <Check size={15} /> {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            )}
          </div>
        </div>

        {/* Unsaved Changes Confirmation Modal */}
        {unsavedConfirmOpen && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(7, 15, 30, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '1rem'
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '1.5rem',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
            }}>
              <AlertCircle size={36} style={{ color: '#F59E0B', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.4rem' }}>
                Unsaved Achievement Record
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 1.25rem' }}>
                You have unsaved changes in this record. Do you want to save as draft before closing?
              </p>
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setUnsavedConfirmOpen(false); onClose(); }}
                  style={{ padding: '0.45rem 0.9rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', color: '#DC2626', fontWeight: 700, cursor: 'pointer' }}
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => { handleSaveDraft(); setUnsavedConfirmOpen(false); onClose(); }}
                  style={{ padding: '0.45rem 1.1rem', borderRadius: '6px', border: 'none', background: '#070F1E', color: '#F1C40F', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Save Draft & Close
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
