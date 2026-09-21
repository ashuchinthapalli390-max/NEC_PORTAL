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
  Megaphone, 
  User, 
  Users, 
  Calendar, 
  Clock, 
  Building2, 
  Search, 
  AlertCircle, 
  Trash2,
  ExternalLink,
  Sparkles,
  Award,
  Video,
  MapPin,
  Tag,
  Plus,
  Trophy,
  Code,
  Handshake,
  CheckCircle2,
  Layers,
  Star
} from 'lucide-react';
import { ET_DEPARTMENTS, FACULTY_DATA } from '../../../data/masterData.js';
import { saveAcademicEvent, getMoUs } from '../../../data/portalStore.js';
import FormField from '../../ui/form/FormField.jsx';
import { Input, DateInput, Select, Textarea } from '../../ui/form/FormControls.jsx';

const EVENT_TYPES = [
  { id: 'Workshop', label: 'Workshop', icon: Layers, desc: 'Technical hands-on lab or training' },
  { id: 'Seminar', label: 'Seminar', icon: Megaphone, desc: 'Academic or research seminar' },
  { id: 'Guest Lecture', label: 'Guest Lecture', icon: User, desc: 'Invited expert / industry talk' },
  { id: 'Hackathon', label: 'Hackathon', icon: Trophy, desc: 'Multi-round innovation challenge' },
  { id: 'Code-a-thon', label: 'Code-a-thon', icon: Code, desc: 'Competitive coding contest' },
  { id: 'Conference', label: 'Conference', icon: Award, desc: 'National / Intl conference' },
  { id: 'Bootcamp', label: 'Bootcamp', icon: Sparkles, desc: 'Intensive skill-building sprint' },
  { id: 'Technical Talk', label: 'Technical Talk', icon: Video, desc: 'Technology & architecture deep dive' },
  { id: 'Awareness Programme', label: 'Awareness', icon: CheckCircle2, desc: 'Social / compliance awareness' },
  { id: 'Training Programme', label: 'Training', icon: Building2, desc: 'Structured professional training' },
  { id: 'Competition', label: 'Competition', icon: Star, desc: 'Quiz, design, or project contest' },
  { id: 'Other', label: 'Other Event', icon: Tag, desc: 'Custom institutional event' }
];

const EVENT_LEVELS = [
  'Department',
  'Institution',
  'Inter-College',
  'University',
  'District',
  'State',
  'National',
  'International'
];

const TARGET_AUDIENCES = [
  'I Year Students',
  'II Year Students',
  'III Year Students',
  'IV Year Students',
  'All Students',
  'Faculty Members',
  'Students & Faculty',
  'External Participants',
  'Alumni',
  'Industry Professionals',
  'Other'
];

const POPULAR_TOOLS = [
  'Python',
  'MATLAB',
  'AWS',
  'Azure',
  'Docker',
  'Kubernetes',
  'React / Next.js',
  'Node.js',
  'ANSYS',
  'Arduino',
  'Raspberry Pi',
  'TensorFlow',
  'PyTorch',
  'VLSI / Cadence',
  'AutoCAD',
  'SolidWorks'
];

const HACKATHON_DOMAINS = [
  'AI / Machine Learning',
  'Cyber Security & Privacy',
  'Web & Mobile Apps',
  'IoT & Smart Hardware',
  'Cloud & DevOps',
  'Blockchain & Web3',
  'Data Science & Analytics',
  'CleanTech & Sustainability',
  'Healthcare & BioTech',
  'Open Innovation'
];

export default function AcademicEventWizardModal({
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
  const [errors, setErrors] = useState({});

  const mousList = getMoUs ? getMoUs() : [];

  // Form State
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
        resourcePersons: initialData.resourcePersons || [],
        sessions: initialData.sessions || [],
        documents: initialData.documents || [],
        photos: initialData.photos || [],
        hackathonDetails: initialData.hackathonDetails || {
          problemStatements: [],
          judgingCriteria: [],
          prizes: [],
          domains: []
        },
        workshopDetails: initialData.workshopDetails || {
          tools: [],
          isHandsOn: 'Yes',
          prerequisites: '',
          labRequired: 'Yes'
        },
        guestLectureDetails: initialData.guestLectureDetails || {
          topicFocus: '',
          qaDurationMins: 15,
          speakerBio: ''
        },
        codeathonDetails: initialData.codeathonDetails || {
          languagesAllowed: 'C, C++, Java, Python',
          platforms: 'Internal Judge / HackerRank',
          difficulty: 'Medium',
          scoringMethod: 'ACM-ICPC Style'
        }
      };
    }

    const defaultDept = currentUser?.role === 'HOD' ? (currentUser.dept || 'CYS') : 'CYS';

    return {
      eventType: 'Workshop',
      title: '',
      department: defaultDept,
      academicYear: '2026-27',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      startTime: '09:30',
      endTime: '16:30',
      mode: 'Offline',
      venue: '',
      platformName: '',
      privateMeetingUrl: '',
      level: 'Department',
      description: '',
      objectives: '',
      
      // Target Audience
      targetAudience: 'All Students',
      targetYear: 'All Years',
      targetSemester: 'Both Semesters',
      expectedParticipants: 120,
      actualParticipants: 0,
      
      // People
      coordinatorFacultyId: '',
      coordinatorName: '',
      coordinatorDesignation: '',
      coCoordinatorName: '',
      studentCoordinatorName: '',
      resourcePersons: [
        {
          name: '',
          designation: '',
          organization: '',
          expertise: '',
          topic: '',
          email: '',
          phone: '',
          isExternal: true
        }
      ],
      
      // Schedule Sessions
      sessions: [
        {
          sessionNo: 1,
          title: 'Inauguration & Keynote Address',
          date: new Date().toISOString().split('T')[0],
          startTime: '09:30',
          endTime: '11:00',
          speaker: '',
          venue: 'Auditorium',
          description: ''
        }
      ],
      
      // Collaboration
      isMouAssociated: 'No',
      associatedMoU: '',
      isIndustryCollab: 'No',
      partnerOrganization: '',
      collabType: 'Industry Partner',
      
      // Registration
      isRegistrationRequired: 'No',
      registrationLink: '',
      registrationFee: 0,
      registrationCapacity: 150,
      
      // Event-type specifics
      workshopDetails: {
        workshopType: 'Technical',
        isHandsOn: 'Yes',
        labRequired: 'Yes',
        tools: ['Python', 'AWS'],
        prerequisites: 'Basic Programming Fundamentals',
        durationHours: 12
      },
      guestLectureDetails: {
        topicFocus: '',
        qaDurationMins: 15,
        speakerBio: ''
      },
      hackathonDetails: {
        theme: '',
        registrationStart: new Date().toISOString().split('T')[0],
        registrationEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        teamSizeMin: 2,
        teamSizeMax: 4,
        eligibility: 'B.Tech All Years',
        problemStatements: [
          { id: 'PS-1', code: 'PS-01', title: 'Smart Campus Automation', domain: 'AI / Machine Learning', description: '' }
        ],
        judgingCriteria: [
          { criterion: 'Innovation & Novelty', weight: '30%' },
          { criterion: 'Technical Execution', weight: '40%' },
          { criterion: 'UI/UX & Presentation', weight: '30%' }
        ],
        prizes: [
          { position: '1st Prize', amount: 25000, currency: 'INR', sponsor: 'Department / College' },
          { position: '2nd Prize', amount: 15000, currency: 'INR', sponsor: 'Department / College' },
          { position: '3rd Prize', amount: 10000, currency: 'INR', sponsor: 'Department / College' }
        ],
        domains: ['AI / Machine Learning', 'Web & Mobile Apps', 'IoT & Smart Hardware']
      },
      codeathonDetails: {
        contestTitle: '',
        durationHours: 3,
        individualOrTeam: 'Individual',
        languagesAllowed: 'C, C++, Java, Python',
        platforms: 'Internal Judge / HackerRank',
        difficulty: 'Medium',
        scoringMethod: 'ACM-ICPC Style',
        noOfProblems: 5
      },
      
      // Documents & Media
      documents: [],
      photos: [],
      winners: [],
      
      // Outcome
      outcomeSummary: '',
      feedbackSummary: '',
      skillsDeveloped: '',
      publicVisibility: 'INTERNAL_ONLY',
      
      eventStatus: 'PLANNED',
      workflowStatus: 'DRAFT'
    };
  });

  const getExpertLabel = (type) => {
    switch (type) {
      case 'Guest Lecture':
        return 'Guest Speaker';
      case 'Seminar':
      case 'Conference':
      case 'Technical Talk':
        return 'Speaker / Keynote';
      case 'Hackathon':
      case 'Code-a-thon':
        return 'Judge / Industry Mentor';
      case 'Workshop':
      case 'Bootcamp':
      case 'Training Programme':
      default:
        return 'Resource Person / Expert';
    }
  };

  const handleCoordinatorSelect = (facId) => {
    const fac = FACULTY_DATA.find(f => f.id === facId);
    if (fac) {
      setFormData(prev => ({
        ...prev,
        coordinatorFacultyId: fac.id,
        coordinatorName: fac.name,
        coordinatorDesignation: fac.designation
      }));
    }
  };

  // Dynamic Resource Persons
  const handleAddResourcePerson = () => {
    setFormData(prev => ({
      ...prev,
      resourcePersons: [
        ...prev.resourcePersons,
        { name: '', designation: '', organization: '', expertise: '', topic: '', email: '', phone: '', isExternal: true }
      ]
    }));
  };

  const handleUpdateResourcePerson = (index, field, value) => {
    const updated = [...formData.resourcePersons];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, resourcePersons: updated }));
  };

  const handleRemoveResourcePerson = (index) => {
    setFormData(prev => ({
      ...prev,
      resourcePersons: prev.resourcePersons.filter((_, i) => i !== index)
    }));
  };

  // Dynamic Sessions
  const handleAddSession = () => {
    const nextNo = formData.sessions.length + 1;
    setFormData(prev => ({
      ...prev,
      sessions: [
        ...prev.sessions,
        {
          sessionNo: nextNo,
          title: `Session ${nextNo}`,
          date: formData.startDate,
          startTime: '11:15',
          endTime: '13:00',
          speaker: '',
          venue: formData.venue || 'Campus',
          description: ''
        }
      ]
    }));
  };

  const handleUpdateSession = (index, field, value) => {
    const updated = [...formData.sessions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, sessions: updated }));
  };

  const handleRemoveSession = (index) => {
    setFormData(prev => ({
      ...prev,
      sessions: prev.sessions.filter((_, i) => i !== index).map((s, idx) => ({ ...s, sessionNo: idx + 1 }))
    }));
  };

  // Hackathon Problem Statements
  const handleAddProblemStatement = () => {
    const count = formData.hackathonDetails.problemStatements.length + 1;
    const newPs = {
      id: 'PS-' + count,
      code: 'PS-' + String(count).padStart(2, '0'),
      title: '',
      domain: 'AI / Machine Learning',
      description: ''
    };
    setFormData(prev => ({
      ...prev,
      hackathonDetails: {
        ...prev.hackathonDetails,
        problemStatements: [...prev.hackathonDetails.problemStatements, newPs]
      }
    }));
  };

  const handleUpdateProblemStatement = (index, field, value) => {
    const updated = [...formData.hackathonDetails.problemStatements];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      hackathonDetails: { ...prev.hackathonDetails, problemStatements: updated }
    }));
  };

  const handleRemoveProblemStatement = (index) => {
    setFormData(prev => ({
      ...prev,
      hackathonDetails: {
        ...prev.hackathonDetails,
        problemStatements: prev.hackathonDetails.problemStatements.filter((_, i) => i !== index)
      }
    }));
  };

  // File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc = {
      id: 'DOC-' + Date.now(),
      name: file.name,
      type: file.name.endsWith('.pdf') ? 'PDF' : 'Image',
      category: 'Brochure / Report / Photos',
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
      if (!formData.title) newErrors.title = 'Event title is required';
      if (!formData.department) newErrors.department = 'Department is required';
      if (!formData.startDate) newErrors.startDate = 'Start date is required';
      if (!formData.endDate) newErrors.endDate = 'End date is required';
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate = 'End date must be on or after start date';
      }
      if ((formData.mode === 'Offline' || formData.mode === 'Hybrid') && !formData.venue) {
        newErrors.venue = 'Venue is required for Offline / Hybrid mode';
      }
      if ((formData.mode === 'Online' || formData.mode === 'Hybrid') && !formData.privateMeetingUrl) {
        newErrors.privateMeetingUrl = 'Private meeting link is required for Online / Hybrid mode';
      }
    } else if (step === 2) {
      if (!formData.coordinatorName && !formData.coordinatorFacultyId) {
        newErrors.coordinatorName = 'Primary faculty coordinator is required';
      }
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

  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    const saved = saveAcademicEvent({
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
    if (!validateStep(1) || !validateStep(2)) {
      setSubmitError('Please fill mandatory fields before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    const saved = saveAcademicEvent({
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

  const expertLabel = getExpertLabel(formData.eventType);

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
          maxWidth: '960px',
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
              <Megaphone size={14} /> Events & Outreach • Academic Governance
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#FFFFFF', fontFamily: 'Cinzel, serif' }}>
              {initialData ? `Edit Academic Event (${initialData.eventNumber || initialData.id})` : 'Create Academic Event'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setUnsavedConfirmOpen(true)}
            aria-label="Close"
            style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#94A3B8', borderRadius: '8px', padding: '0.45rem', cursor: 'pointer' }}
            className="hover:bg-white/20 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. 6-Step Stepper Header */}
        <div style={{
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          padding: '0.75rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.4rem',
          overflowX: 'auto'
        }}>
          {[
            { step: 1, label: 'Basic Details' },
            { step: 2, label: 'People & Experts' },
            { step: 3, label: 'Audience & Schedule' },
            { step: 4, label: 'Specifics & Collab' },
            { step: 5, label: 'Evidence & Outcome' },
            { step: 6, label: 'Review & Submit' }
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isDone = currentStep > s.step;
            return (
              <div
                key={s.step}
                onClick={() => isDone && setCurrentStep(s.step)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: isDone ? 'pointer' : 'default', opacity: isActive ? 1 : (isDone ? 0.85 : 0.45) }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: isActive ? '#070F1E' : (isDone ? '#10B981' : '#CBD5E1'),
                  color: isActive ? '#F1C40F' : '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: isActive ? '2px solid #D4AF37' : 'none'
                }}>
                  {isDone ? <Check size={12} /> : s.step}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#0F172A' : '#64748B', whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
                {s.step < 6 && <ChevronRight size={13} style={{ color: '#CBD5E1', marginLeft: '0.2rem' }} />}
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
            {/* ──────── STEP 1: BASIC DETAILS ──────── */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {/* Event Type Interactive Chips Grid */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    SELECT EVENT TYPE *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                    {EVENT_TYPES.map((et) => {
                      const isSelected = formData.eventType === et.id;
                      const Icon = et.icon;
                      return (
                        <button
                          key={et.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, eventType: et.id })}
                          style={{
                            padding: '0.65rem 0.5rem',
                            borderRadius: '10px',
                            border: isSelected ? '2px solid #D4AF37' : '1px solid #E2E8F0',
                            background: isSelected ? '#070F1E' : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : '#334155',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            textAlign: 'center',
                            boxShadow: isSelected ? '0 4px 12px rgba(212, 175, 55, 0.2)' : 'none'
                          }}
                        >
                          <Icon size={18} style={{ color: isSelected ? '#F1C40F' : '#64748B' }} />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{et.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <FormField label="EVENT TITLE *" error={errors.title}>
                  <Input
                    placeholder="e.g. National Level 36-Hour Hackathon on GenAI & Autonomous Systems"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    error={!!errors.title}
                  />
                </FormField>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <FormField label="ORGANIZING DEPARTMENT *" error={errors.department}>
                    <Select
                      value={formData.department}
                      disabled={currentUser?.role === 'HOD'}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      error={!!errors.department}
                    >
                      {ET_DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
                    </Select>
                  </FormField>

                  <FormField label="ACADEMIC YEAR *">
                    <Select value={formData.academicYear} onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}>
                      <option value="2026-27">2026-27</option>
                      <option value="2025-26">2025-26</option>
                      <option value="2024-25">2024-25</option>
                      <option value="2023-24">2023-24</option>
                    </Select>
                  </FormField>

                  <FormField label="EVENT LEVEL *">
                    <Select value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })}>
                      {EVENT_LEVELS.map(l => <option key={l} value={l}>{l} Level</option>)}
                    </Select>
                  </FormField>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                  <FormField label="START DATE *" error={errors.startDate}>
                    <DateInput value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} error={!!errors.startDate} />
                  </FormField>

                  <FormField label="END DATE *" error={errors.endDate}>
                    <DateInput value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} error={!!errors.endDate} />
                  </FormField>

                  <FormField label="START TIME">
                    <Input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                  </FormField>

                  <FormField label="END TIME">
                    <Input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
                  </FormField>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <FormField label="DELIVERY MODE *">
                    <Select value={formData.mode} onChange={(e) => setFormData({ ...formData, mode: e.target.value })}>
                      <option value="Offline">Offline (On-Campus)</option>
                      <option value="Online">Online (Virtual)</option>
                      <option value="Hybrid">Hybrid (On-Campus + Virtual)</option>
                    </Select>
                  </FormField>

                  {(formData.mode === 'Offline' || formData.mode === 'Hybrid') ? (
                    <FormField label="VENUE LOCATION *" error={errors.venue}>
                      <Input placeholder="e.g. Central Auditorium / CSE Lab 3" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} error={!!errors.venue} />
                    </FormField>
                  ) : null}

                  {(formData.mode === 'Online' || formData.mode === 'Hybrid') ? (
                    <FormField label="PRIVATE MEETING LINK *" description="Internal link for registered delegates only" error={errors.privateMeetingUrl}>
                      <Input placeholder="https://meet.google.com/... or Zoom link" value={formData.privateMeetingUrl} onChange={(e) => setFormData({ ...formData, privateMeetingUrl: e.target.value })} error={!!errors.privateMeetingUrl} />
                    </FormField>
                  ) : null}
                </div>

                <FormField label="EVENT DESCRIPTION & SCOPE">
                  <Textarea rows={2} placeholder="Comprehensive description of the event theme, context, and focus..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </FormField>
              </motion.div>
            )}

            {/* ──────── STEP 2: PEOPLE & EXPERTS ──────── */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: '#F8FAFC', padding: '1.15rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    FACULTY & STUDENT COORDINATION TEAM
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1rem' }}>
                    <FormField label="PRIMARY FACULTY COORDINATOR *" error={errors.coordinatorName}>
                      <Select
                        value={formData.coordinatorFacultyId}
                        onChange={(e) => handleCoordinatorSelect(e.target.value)}
                        error={!!errors.coordinatorName}
                      >
                        <option value="">Select Faculty from Directory</option>
                        {FACULTY_DATA.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.department} - {f.designation})</option>
                        ))}
                      </Select>
                    </FormField>

                    <FormField label="CO-COORDINATOR(S)">
                      <Input placeholder="e.g. Dr. B. Jhansi Vazram" value={formData.coCoordinatorName} onChange={(e) => setFormData({ ...formData, coCoordinatorName: e.target.value })} />
                    </FormField>

                    <FormField label="STUDENT COORDINATOR(S)">
                      <Input placeholder="e.g. K. Sai (22471A0512)" value={formData.studentCoordinatorName} onChange={(e) => setFormData({ ...formData, studentCoordinatorName: e.target.value })} />
                    </FormField>
                  </div>

                  {formData.coordinatorName && (
                    <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#070F1E', color: '#F1C40F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                        {formData.coordinatorName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem' }}>{formData.coordinatorName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{formData.coordinatorDesignation} • {formData.department}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Resource Persons & Speakers */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
                      {expertLabel.toUpperCase()}S & KEYNOTE SPEAKERS ({formData.resourcePersons.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddResourcePerson}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', background: '#070F1E', color: '#F1C40F', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                    >
                      <Plus size={13} /> Add {expertLabel}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {formData.resourcePersons.map((rp, idx) => (
                      <div key={idx} style={{ background: '#F1F5F9', padding: '0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 30px', gap: '0.5rem', alignItems: 'center' }}>
                          <Input placeholder={`${expertLabel} Name *`} value={rp.name} onChange={(e) => handleUpdateResourcePerson(idx, 'name', e.target.value)} />
                          <Input placeholder="Designation (e.g. Lead Architect)" value={rp.designation} onChange={(e) => handleUpdateResourcePerson(idx, 'designation', e.target.value)} />
                          <Input placeholder="Organization / University" value={rp.organization} onChange={(e) => handleUpdateResourcePerson(idx, 'organization', e.target.value)} />
                          {formData.resourcePersons.length > 1 && (
                            <button type="button" onClick={() => handleRemoveResourcePerson(idx)} style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', borderRadius: '4px', height: '36px', cursor: 'pointer' }}>
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.5rem' }}>
                          <Input placeholder="Session Topic / Expertise" value={rp.topic} onChange={(e) => handleUpdateResourcePerson(idx, 'topic', e.target.value)} />
                          <Input placeholder="Email (Official)" value={rp.email} onChange={(e) => handleUpdateResourcePerson(idx, 'email', e.target.value)} />
                          <Input placeholder="Phone / Contact" value={rp.phone} onChange={(e) => handleUpdateResourcePerson(idx, 'phone', e.target.value)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──────── STEP 3: AUDIENCE & SCHEDULE ──────── */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                  <FormField label="TARGET AUDIENCE *">
                    <Select value={formData.targetAudience} onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}>
                      {TARGET_AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                    </Select>
                  </FormField>

                  <FormField label="TARGET YEAR">
                    <Select value={formData.targetYear} onChange={(e) => setFormData({ ...formData, targetYear: e.target.value })}>
                      <option value="All Years">All Years (I–IV)</option>
                      <option value="I Year">I Year</option>
                      <option value="II Year">II Year</option>
                      <option value="III Year">III Year</option>
                      <option value="IV Year">IV Year</option>
                      <option value="III & IV Year">III & IV Year</option>
                    </Select>
                  </FormField>

                  <FormField label="SEMESTER">
                    <Select value={formData.targetSemester} onChange={(e) => setFormData({ ...formData, targetSemester: e.target.value })}>
                      <option value="Both Semesters">Both Semesters</option>
                      <option value="Odd Sem">Odd Semester (I)</option>
                      <option value="Even Sem">Even Semester (II)</option>
                    </Select>
                  </FormField>

                  <FormField label="EXPECTED DELEGATES">
                    <Input type="number" value={formData.expectedParticipants} onChange={(e) => setFormData({ ...formData, expectedParticipants: e.target.value })} />
                  </FormField>
                </div>

                {/* Structured Schedule Builder */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
                      STRUCTURED EVENT SESSIONS / AGENDA ({formData.sessions.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSession}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', background: '#070F1E', color: '#F1C40F', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                    >
                      <Plus size={13} /> Add Session
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {formData.sessions.map((sess, idx) => (
                      <div key={idx} style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '60px 1.5fr 1fr 1fr 30px', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D4AF37', textAlign: 'center' }}>S{sess.sessionNo}</span>
                          <Input placeholder="Session Title (e.g. Hands-on Lab: Tensor Ops)" value={sess.title} onChange={(e) => handleUpdateSession(idx, 'title', e.target.value)} />
                          <DateInput value={sess.date} onChange={(e) => handleUpdateSession(idx, 'date', e.target.value)} />
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <Input type="time" value={sess.startTime} onChange={(e) => handleUpdateSession(idx, 'startTime', e.target.value)} />
                            <Input type="time" value={sess.endTime} onChange={(e) => handleUpdateSession(idx, 'endTime', e.target.value)} />
                          </div>
                          {formData.sessions.length > 1 && (
                            <button type="button" onClick={() => handleRemoveSession(idx)} style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', borderRadius: '4px', height: '36px', cursor: 'pointer' }}>
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                        <Input placeholder="Speaker / Resource Person for this session" value={sess.speaker} onChange={(e) => handleUpdateSession(idx, 'speaker', e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──────── STEP 4: SPECIFICS & COLLABORATION ──────── */}
            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* 1. Event Type Specific Section */}
                {formData.eventType === 'Workshop' && (
                  <div style={{ background: '#F0FDFA', padding: '1rem', borderRadius: '12px', border: '1px solid #99F6E4' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F766E', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                      WORKSHOP & LAB SPECIFICS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <FormField label="HANDS-ON PRACTICAL?">
                        <Select value={formData.workshopDetails.isHandsOn} onChange={(e) => setFormData({ ...formData, workshopDetails: { ...formData.workshopDetails, isHandsOn: e.target.value } })}>
                          <option value="Yes">Yes (100% Hands-On Lab)</option>
                          <option value="No">No (Demonstration / Theory)</option>
                        </Select>
                      </FormField>

                      <FormField label="COMPUTER LAB REQUIRED?">
                        <Select value={formData.workshopDetails.labRequired} onChange={(e) => setFormData({ ...formData, workshopDetails: { ...formData.workshopDetails, labRequired: e.target.value } })}>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </Select>
                      </FormField>

                      <FormField label="PREREQUISITES">
                        <Input placeholder="e.g. Python basics, laptop required" value={formData.workshopDetails.prerequisites} onChange={(e) => setFormData({ ...formData, workshopDetails: { ...formData.workshopDetails, prerequisites: e.target.value } })} />
                      </FormField>
                    </div>
                  </div>
                )}

                {(formData.eventType === 'Hackathon' || formData.eventType === 'Code-a-thon') && (
                  <div style={{ background: '#FAF5FF', padding: '1.15rem', borderRadius: '12px', border: '1px solid #E9D5FF' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#7E22CE', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                      HACKATHON / CODE-A-THON INTELLIGENCE
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem' }}>
                      <FormField label="THEME / TRACKS">
                        <Input placeholder="e.g. AI for Sustainable Development & Healthcare" value={formData.hackathonDetails.theme} onChange={(e) => setFormData({ ...formData, hackathonDetails: { ...formData.hackathonDetails, theme: e.target.value } })} />
                      </FormField>

                      <FormField label="TEAM SIZE (MIN – MAX)">
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <Input type="number" placeholder="Min (2)" value={formData.hackathonDetails.teamSizeMin} onChange={(e) => setFormData({ ...formData, hackathonDetails: { ...formData.hackathonDetails, teamSizeMin: e.target.value } })} />
                          <Input type="number" placeholder="Max (4)" value={formData.hackathonDetails.teamSizeMax} onChange={(e) => setFormData({ ...formData, hackathonDetails: { ...formData.hackathonDetails, teamSizeMax: e.target.value } })} />
                        </div>
                      </FormField>

                      <FormField label="REGISTRATION DEADLINE">
                        <DateInput value={formData.hackathonDetails.registrationEnd} onChange={(e) => setFormData({ ...formData, hackathonDetails: { ...formData.hackathonDetails, registrationEnd: e.target.value } })} />
                      </FormField>
                    </div>

                    {/* Problem Statements */}
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' }}>
                          PROBLEM STATEMENTS ({formData.hackathonDetails.problemStatements.length})
                        </span>
                        <button type="button" onClick={handleAddProblemStatement} style={{ padding: '0.25rem 0.55rem', background: '#7E22CE', color: '#FFFFFF', borderRadius: '4px', border: 'none', fontSize: '0.72rem', cursor: 'pointer' }}>
                          + Add Problem Statement
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {formData.hackathonDetails.problemStatements.map((ps, idx) => (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 30px', gap: '0.4rem', alignItems: 'center' }}>
                            <Input placeholder="PS-01" value={ps.code} onChange={(e) => handleUpdateProblemStatement(idx, 'code', e.target.value)} />
                            <Input placeholder="Problem Title (e.g. Automated Crop Disease Detection)" value={ps.title} onChange={(e) => handleUpdateProblemStatement(idx, 'title', e.target.value)} />
                            <Select value={ps.domain} onChange={(e) => handleUpdateProblemStatement(idx, 'domain', e.target.value)}>
                              {HACKATHON_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                            </Select>
                            {formData.hackathonDetails.problemStatements.length > 1 && (
                              <button type="button" onClick={() => handleRemoveProblemStatement(idx)} style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', borderRadius: '4px', height: '36px', cursor: 'pointer' }}>
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Institutional MoU & Collaboration */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <FormField label="CONDUCTED UNDER AN MOU?">
                    <Select value={formData.isMouAssociated} onChange={(e) => setFormData({ ...formData, isMouAssociated: e.target.value })}>
                      <option value="Yes">Yes (Under Active MoU)</option>
                      <option value="No">No (Autonomous / Independent)</option>
                    </Select>
                  </FormField>

                  {formData.isMouAssociated === 'Yes' ? (
                    <FormField label="SELECT LINKED INSTITUTIONAL MOU">
                      <Select value={formData.associatedMoU} onChange={(e) => setFormData({ ...formData, associatedMoU: e.target.value })}>
                        <option value="">Select Associated MoU</option>
                        {mousList.map(m => (
                          <option key={m.id} value={m.organization || m.title}>{m.organization || m.title}</option>
                        ))}
                        <option value="Oracle Academy & Infosys Springboard">Oracle Academy & Infosys Springboard</option>
                        <option value="Cadence Design Systems">Cadence Design Systems</option>
                        <option value="TCS iON">TCS iON</option>
                      </Select>
                    </FormField>
                  ) : null}
                </div>
              </motion.div>
            )}

            {/* ──────── STEP 5: EVIDENCE & OUTCOME ──────── */}
            {currentStep === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', background: '#F8FAFC' }}>
                  <Upload size={28} style={{ color: '#D4AF37', margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
                    Upload Event Brochure, Attendance, and Outcome Reports
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 1rem' }}>
                    Official documents for NAAC Criterion-3/6 and NBA compliance accreditation records.
                  </p>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#070F1E', color: '#F1C40F', padding: '0.5rem 1.15rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                    <Upload size={14} /> Attach Event Files
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                {/* Uploaded Documents List */}
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    ATTACHED EVIDENCE ({formData.documents.length})
                  </div>
                  {formData.documents.length === 0 ? (
                    <div style={{ padding: '0.85rem', background: '#F8FAFC', borderRadius: '8px', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>
                      No documents attached yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {formData.documents.map(doc => (
                        <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.9rem', background: '#F1F5F9', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <FileText size={16} style={{ color: '#D4AF37' }} />
                            <div>
                              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>{doc.name}</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{doc.size}</div>
                            </div>
                          </div>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== doc.id) }))} style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', borderRadius: '4px', padding: '0.3rem', cursor: 'pointer' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <FormField label="EVENT LIFECYCLE STATUS">
                    <Select value={formData.eventStatus} onChange={(e) => setFormData({ ...formData, eventStatus: e.target.value })}>
                      <option value="PLANNED">Planned / Scheduled</option>
                      <option value="REGISTRATION_OPEN">Registration Open</option>
                      <option value="ONGOING">Ongoing</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="POSTPONED">Postponed</option>
                    </Select>
                  </FormField>

                  <FormField label="ACTUAL ATTENDANCE (POST-EVENT)">
                    <Input type="number" placeholder="Actual attendees" value={formData.actualParticipants} onChange={(e) => setFormData({ ...formData, actualParticipants: e.target.value })} />
                  </FormField>
                </div>

                <FormField label="OUTCOME & PEDAGOGICAL SUMMARY">
                  <Textarea rows={2} placeholder="Key outcomes, skills developed, and participant feedback..." value={formData.outcomeSummary} onChange={(e) => setFormData({ ...formData, outcomeSummary: e.target.value })} />
                </FormField>
              </motion.div>
            )}

            {/* ──────── STEP 6: REVIEW & SUBMIT ──────── */}
            {currentStep === 6 && (
              <motion.div key="step6" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)', padding: '1.25rem', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase' }}>
                    {formData.eventType} • {formData.level} Level
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0.2rem 0' }}>
                    {formData.title || 'Untitled Academic Event'}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    {formData.department} • {formData.startDate} to {formData.endDate} ({formData.mode})
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Coordinator</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{formData.coordinatorName || 'Not Assigned'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Experts / Speakers</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{formData.resourcePersons.length} Resource Persons</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Sessions</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{formData.sessions.length} Scheduled</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>MoU Linkage</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#D97706' }}>{formData.isMouAssociated === 'Yes' ? 'MoU Linked' : 'Independent'}</div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '0.85rem 1rem', background: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065F46', fontSize: '0.8rem' }}>
                  <Sparkles size={16} /> Submitting initiates departmental review and NAAC Criterion 3/6 evidence validation.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. Action Footer */}
        <div style={{ background: '#F8FAFC', padding: '1rem 1.75rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {currentStep === 1 ? (
            <button type="button" onClick={() => setUnsavedConfirmOpen(true)} style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              <X size={15} /> Cancel
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
                <Check size={15} /> {isSubmitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            )}
          </div>
        </div>

        {/* Unsaved Changes Confirmation Modal */}
        {unsavedConfirmOpen && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(7, 15, 30, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '1.5rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
              <AlertCircle size={36} style={{ color: '#F59E0B', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.4rem' }}>Unsaved Academic Event</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 1.25rem' }}>Do you want to save draft before closing?</p>
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                <button type="button" onClick={() => { setUnsavedConfirmOpen(false); onClose(); }} style={{ padding: '0.45rem 0.9rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', color: '#DC2626', fontWeight: 700, cursor: 'pointer' }}>Discard</button>
                <button type="button" onClick={() => { handleSaveDraft(); setUnsavedConfirmOpen(false); onClose(); }} style={{ padding: '0.45rem 1.1rem', borderRadius: '6px', border: 'none', background: '#070F1E', color: '#F1C40F', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>Save Draft & Close</button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
