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
  Handshake, 
  Building2, 
  User, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  Globe, 
  Clock, 
  Sparkles,
  Layers,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import { DEPARTMENTS, FACULTY_DATA } from '../../../data/masterData.js';
import { saveMoU, renewMoU, calculateMoUStatus } from '../../../data/portalStore.js';
import FormField from '../../ui/form/FormField.jsx';
import { Input, DateInput, Select, Textarea } from '../../ui/form/FormControls.jsx';

const PARTNER_TYPES = [
  'Industry',
  'University',
  'College',
  'Research Institute',
  'Government Organization',
  'NGO',
  'Startup',
  'Training Partner',
  'Professional Body',
  'International Institution',
  'Other'
];

const COLLABORATION_SCOPES = [
  'Internships',
  'Placements',
  'Research',
  'Joint Publications',
  'Student Projects',
  'Faculty Training',
  'Student Training',
  'FDPs',
  'Workshops',
  'Guest Lectures',
  'Hackathons',
  'Industrial Visits',
  'Innovation',
  'Consultancy',
  'Curriculum Support',
  'Other'
];

const VALIDITY_OPTIONS = [
  '1 Year',
  '2 Years',
  '3 Years',
  '5 Years',
  'Custom',
  'Until Further Notice'
];

export default function MouWizardModal({
  isOpen,
  onClose,
  initialData = null,
  isRenewalMode = false,
  currentUser,
  onSaved
}) {
  const [currentStep, setCurrentStep] = useState(isRenewalMode ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // Renewal Form State
  const [renewalForm, setRenewalForm] = useState({
    renewalSignedDate: new Date().toISOString().split('T')[0],
    newExpiryDate: '',
    extensionPeriod: '3 Years',
    remarks: 'MoU extended for 3 years'
  });

  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
        scopes: initialData.scopes || [],
        documents: initialData.documents || []
      };
    }

    const defaultFac = FACULTY_DATA.find(f => f.id === currentUser?.facultyId) || FACULTY_DATA[0];

    return {
      partnerOrganization: '',
      partnerType: 'Industry',
      organizationWebsite: '',
      organizationAddress: '',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      
      partnerContactPerson: '',
      partnerContactDesignation: '',
      partnerContactEmail: '',
      partnerContactPhone: '',
      
      title: '',
      signedDate: new Date().toISOString().split('T')[0],
      effectiveDate: new Date().toISOString().split('T')[0],
      validityType: '3 Years',
      expiryDate: '',
      department: isHod ? (currentUser?.dept || 'CSE(AIML)') : 'Institution Level',
      purpose: 'Collaborative research, student internships, curriculum development, and technical workshops.',
      scopes: ['STUDENT_INTERNSHIP', 'FACULTY_TRAINING', 'PLACEMENT_ASSISTANCE'],
      description: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      partnerAddress: '',
      partnerWebsite: '',
      workflowStatus: 'SUBMITTED',
      documents: []
    };
  });

  // Calculate live validity info
  const validityInfo = calculateMoUStatus(formData.effectiveDate, formData.validityType, formData.expiryDate);

  // Toggle Scope Chip
  const toggleScope = (scopeName) => {
    setFormData(prev => {
      const exists = prev.scopes.includes(scopeName);
      const updated = exists 
        ? prev.scopes.filter(s => s !== scopeName)
        : [...prev.scopes, scopeName];
      return { ...prev, scopes: updated };
    });
  };

  // File Upload
  const handleFileUpload = (e, category) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc = {
      id: 'DOC-' + Date.now(),
      name: file.name,
      type: category || 'Signed MoU Document PDF',
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
      if (!formData.partnerOrganization) newErrors.partnerOrganization = 'Partner organization name is required';
      if (!formData.partnerType) newErrors.partnerType = 'Partner type is required';
    } else if (step === 2) {
      if (!formData.title) newErrors.title = 'MoU title is required';
      if (!formData.signedDate) newErrors.signedDate = 'Signed date is required';
      if (!formData.effectiveDate) newErrors.effectiveDate = 'Effective date is required';
      if (formData.validityType === 'Custom' && !formData.expiryDate) {
        newErrors.expiryDate = 'Expiry date is required for custom validity';
      }
    } else if (step === 3) {
      if (!formData.scopes || formData.scopes.length === 0) {
        newErrors.scopes = 'Please select at least one scope of collaboration';
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
    if (!formData.partnerOrganization.trim()) {
      setSubmitError('Industry / Partner Organization Name is required to save draft');
      return;
    }

    setIsSavingDraft(true);
    setSubmitError('');
    try {
      const saved = saveMoU({
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
      setSubmitError('Please fill all mandatory fields before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      if (isRenewalMode && initialData?.id) {
        renewMoU(initialData.id, renewalForm, currentUser);
      } else {
        saveMoU({
          ...formData,
          workflowStatus: 'SUBMITTED'
        }, currentUser);
      }

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
              <Handshake size={14} /> Industry & University Collaborations • MoU Lifecycle
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#FFFFFF', fontFamily: 'Cinzel, serif' }}>
              {isRenewalMode ? `Extend MoU Agreement (${initialData.mouNumber || initialData.id})` : (initialData ? `Edit MoU (${initialData.mouNumber || initialData.id})` : 'Establish New MoU / Partnership')}
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
          gap: '0.4rem',
          overflowX: 'auto'
        }}>
          {[
            { step: 1, label: 'Partner Organization' },
            { step: 2, label: 'Agreement Details' },
            { step: 3, label: 'Scope & Purpose' },
            { step: 4, label: 'Documents' },
            { step: 5, label: 'Review & Submit' }
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
                {s.step < 5 && <ChevronRight size={13} style={{ color: '#CBD5E1', marginLeft: '0.2rem' }} />}
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
            {/* ──────── STEP 1: PARTNER ORGANIZATION ──────── */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                  <FormField label="PARTNER ORGANIZATION NAME *" error={errors.partnerOrganization}>
                    <Input
                      placeholder="e.g. Cisco Systems India Pvt Ltd / IIT Hyderabad"
                      value={formData.partnerOrganization}
                      onChange={(e) => setFormData({ ...formData, partnerOrganization: e.target.value, title: formData.title || `MoU with ${e.target.value}` })}
                      error={!!errors.partnerOrganization}
                    />
                  </FormField>

                  <FormField label="PARTNER TYPE *" error={errors.partnerType}>
                    <Select
                      value={formData.partnerType}
                      onChange={(e) => setFormData({ ...formData, partnerType: e.target.value })}
                      error={!!errors.partnerType}
                    >
                      {PARTNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                  </FormField>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <FormField label="ORGANIZATION WEBSITE">
                    <Input placeholder="https://..." value={formData.organizationWebsite} onChange={(e) => setFormData({ ...formData, organizationWebsite: e.target.value })} />
                  </FormField>
                  <FormField label="CITY">
                    <Input placeholder="e.g. Hyderabad / Bengaluru" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                  </FormField>
                  <FormField label="STATE & COUNTRY">
                    <Input placeholder="Telangana, India" value={`${formData.state}, ${formData.country}`} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                  </FormField>
                </div>

                {/* Partner Contact Information Container */}
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', display: 'block', marginBottom: '0.65rem' }}>
                    PARTNER OFFICIAL CONTACT PERSON (PRIVATE)
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
                    <FormField label="CONTACT NAME">
                      <Input placeholder="Mr. / Dr. Contact Name" value={formData.partnerContactPerson} onChange={(e) => setFormData({ ...formData, partnerContactPerson: e.target.value })} />
                    </FormField>
                    <FormField label="DESIGNATION">
                      <Input placeholder="e.g. University Relations Head" value={formData.partnerContactDesignation} onChange={(e) => setFormData({ ...formData, partnerContactDesignation: e.target.value })} />
                    </FormField>
                    <FormField label="EMAIL">
                      <Input placeholder="partner@company.com" value={formData.partnerContactEmail} onChange={(e) => setFormData({ ...formData, partnerContactEmail: e.target.value })} />
                    </FormField>
                    <FormField label="PHONE NUMBER">
                      <Input placeholder="+91 98480..." value={formData.partnerContactPhone} onChange={(e) => setFormData({ ...formData, partnerContactPhone: e.target.value })} />
                    </FormField>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──────── STEP 2: AGREEMENT DETAILS ──────── */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <FormField label="MoU TITLE / AGREEMENT NAME *" error={errors.title}>
                  <Input
                    placeholder="e.g. Comprehensive Institutional Collaboration for Skill Enhancement & Internships"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    error={!!errors.title}
                  />
                </FormField>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '1rem' }}>
                  <FormField label="SIGNED DATE *" error={errors.signedDate}>
                    <DateInput value={formData.signedDate} onChange={(e) => setFormData({ ...formData, signedDate: e.target.value })} error={!!errors.signedDate} />
                  </FormField>

                  <FormField label="EFFECTIVE DATE *" error={errors.effectiveDate}>
                    <DateInput value={formData.effectiveDate} onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })} error={!!errors.effectiveDate} />
                  </FormField>

                  <FormField label="VALIDITY PERIOD *">
                    <Select value={formData.validityType} onChange={(e) => setFormData({ ...formData, validityType: e.target.value })}>
                      {VALIDITY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </Select>
                  </FormField>
                </div>

                {formData.validityType === 'Custom' && (
                  <FormField label="CUSTOM EXPIRY DATE *" error={errors.expiryDate}>
                    <DateInput value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} error={!!errors.expiryDate} />
                  </FormField>
                )}

                {/* Animated Validity Timeline Card */}
                <div style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase' }}>
                      VALIDITY TIMELINE: {formData.validityType}
                    </span>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: validityInfo.status === 'ACTIVE' ? '#059669' : '#D97706' }}>
                      Status: {validityInfo.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>{formData.effectiveDate}</span>
                    <div style={{ flex: 1, height: '4px', background: '#D4AF37', borderRadius: '9999px', position: 'relative' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#070F1E', position: 'absolute', left: 0, top: '-2px' }} />
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#070F1E', position: 'absolute', right: 0, top: '-2px' }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>{validityInfo.expiryDate || 'Ongoing'}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                  <FormField label="COLLABORATION LEVEL / DEPARTMENT *">
                    <Select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                      <option value="All Departments (Institution-Level)">All Departments (Institution-Level)</option>
                      {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
                    </Select>
                  </FormField>

                  <FormField label="PRIMARY PURPOSE">
                    <Input placeholder="e.g. Internships, Projects, FDPs" value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} />
                  </FormField>
                </div>

                <FormField label="DETAILED DESCRIPTION / SCOPE SUMMARY">
                  <Textarea rows={2} placeholder="Provide overview of agreed deliverables, milestones, and faculty/student opportunities..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </FormField>
              </motion.div>
            )}

            {/* ──────── STEP 3: SCOPE & COORDINATORS ──────── */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                    COLLABORATION SCOPES ({formData.scopes.length} SELECTED) *
                  </label>
                  {errors.scopes && <div style={{ color: '#DC2626', fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.35rem' }}>{errors.scopes}</div>}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {COLLABORATION_SCOPES.map(scope => {
                      const isSel = formData.scopes.includes(scope);
                      return (
                        <button
                          key={scope}
                          type="button"
                          onClick={() => toggleScope(scope)}
                          style={{
                            padding: '0.45rem 0.9rem',
                            borderRadius: '9999px',
                            border: isSel ? '1px solid #D4AF37' : '1px solid #CBD5E1',
                            background: isSel ? '#070F1E' : '#FFFFFF',
                            color: isSel ? '#F1C40F' : '#475569',
                            fontSize: '0.76rem',
                            fontWeight: isSel ? 800 : 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isSel ? '✓ ' : '+ '}{scope}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──────── STEP 4: DOCUMENTS ──────── */}
            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div style={{ border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', background: '#F8FAFC' }}>
                  <Upload size={28} style={{ color: '#D4AF37', margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
                    Upload Signed MoU Agreement PDF
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 1rem' }}>
                    Attach full signed bilateral contract, approval letters, or activity proposals.
                  </p>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#070F1E', color: '#F1C40F', padding: '0.5rem 1.15rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                    <Upload size={14} /> Attach Signed MoU PDF
                    <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, 'Signed MoU Agreement PDF')} style={{ display: 'none' }} />
                  </label>
                </div>

                <div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                    ATTACHED DOCUMENTS ({formData.documents.length})
                  </span>
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
                              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{doc.type} ({doc.size})</div>
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
              </motion.div>
            )}

            {/* ──────── STEP 5: REVIEW & SUBMIT ──────── */}
            {currentStep === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)', padding: '1.25rem', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase' }}>
                    {formData.partnerType} MoU • {formData.validityType}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0.2rem 0' }}>
                    {formData.title || `MoU with ${formData.partnerOrganization}`}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    Partner: <strong>{formData.partnerOrganization}</strong> ({formData.city}, {formData.country})
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Effective & Expiry</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A' }}>{formData.effectiveDate} &rarr; {validityInfo.expiryDate}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Department / Level</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A' }}>{formData.department || 'Institution Level'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Scopes</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#059669' }}>{formData.scopes.length} Areas Selected</div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '0.85rem 1rem', background: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065F46', fontSize: '0.8rem' }}>
                  <Sparkles size={16} /> Submitting initiates institutional review and activity linkages for NAAC Criterion 3 / NBA accreditation.
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

            {currentStep < 5 ? (
              <button type="button" onClick={handleNext} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', background: '#070F1E', color: '#F1C40F', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>
                Continue <ChevronRight size={15} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.35rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>
                <Check size={15} /> {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
