import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  UploadCloud, 
  Download, 
  Search, 
  Filter, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Users, 
  Award, 
  TrendingUp, 
  BookOpen, 
  Eye, 
  Plus, 
  X, 
  Sparkles, 
  HelpCircle, 
  Layers, 
  Calendar, 
  ShieldCheck, 
  Trash2, 
  RefreshCw,
  Info,
  ChevronDown,
  ArrowRight,
  Printer,
  FileCheck2
} from 'lucide-react';
import { 
  MotionPage, 
  ModulePageHeader, 
  AnimatedKpiGrid, 
  MotionKpiCard, 
  MotionTable, 
  MotionTableRow, 
  MotionEmptyState, 
  MotionButton,
  MotionModal
} from '../../motion/index.js';
import { ET_DEPARTMENTS } from '../../../data/masterData.js';
import { parseMidExamWorkbook } from '../../../lib/importer/midExamTemplateParser.js';
import { formatDateDDMMYYYY } from '../../../lib/ui/dateUtils.js';
import { 
  getMidExamAnalyses, 
  getMidExamAnalysisById, 
  saveMidExamAnalysis,
  calculateStudentMid1,
  generateBlankMidTemplateXLSX,
  exportAdvancedLearnersCSV,
  exportAdvancedLearnersXLSX,
  exportAdvancedLearnersPDF,
  exportAdvancedEvidenceXLSX,
  exportWeakLearnersCSV,
  exportWeakLearnersXLSX,
  exportWeakLearnersPDF,
  exportWeakEvidenceXLSX,
  exportRemedialAttendanceXLSX,
  exportRemedialAttendancePDF,
  exportImprovementAnalysisXLSX,
  exportImprovementAnalysisPDF,
  exportConsolidatedMidCSV,
  exportConsolidatedMidPDF,
  exportFullAcademicWorkbookXLSX,
  getStudents
} from '../../../data/portalStore.js';

export default function MidExamAnalysis({ currentUser }) {
  const [dataVersion, setDataVersion] = useState(0);
  
  // Selection Context
  const [selectedDept, setSelectedDept] = useState(
    currentUser?.role === 'HOD' && currentUser?.dept && currentUser?.dept !== 'Management & Governance' 
      ? currentUser.dept 
      : 'CYS'
  );
  const [selectedAy, setSelectedAy] = useState('2025-26');
  const [selectedYear, setSelectedYear] = useState('III Year');
  const [selectedSemester, setSelectedSemester] = useState('II Semester');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'marks' | 'mid1-analysis' | 'mid2-analysis' | 'advanced' | 'weak' | 'remedial' | 'improvement' | 'import-export'

  // Search & Filtering within tables
  const [searchQuery, setSearchQuery] = useState('');
  const [learnerFilter, setLearnerFilter] = useState('ALL'); // 'ALL' | 'ADVANCED' | 'WEAK' | 'REGULAR' | 'ABSENT'

  // Modals & Drawers
  const [studentDetailModal, setStudentDetailModal] = useState(null);
  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [exportsModalOpen, setExportsModalOpen] = useState(false);
  const [addAdvancedTopicOpen, setAddAdvancedTopicOpen] = useState(false);
  const [addRemedialSessionOpen, setAddRemedialSessionOpen] = useState(false);
  const [remedialSessionCount, setRemedialSessionCount] = useState(6);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Analyses List
  const allAnalyses = useMemo(() => {
    return getMidExamAnalyses();
  }, [dataVersion]);

  // Current Active Analysis Context
  const currentAnalysis = useMemo(() => {
    const match = allAnalyses.find(a => 
      (selectedDept === 'ALL' || a.department === selectedDept) &&
      a.academicYear === selectedAy &&
      a.year === selectedYear &&
      a.semester === selectedSemester
    );
    return match || allAnalyses[0] || null;
  }, [allAnalyses, selectedDept, selectedAy, selectedYear, selectedSemester]);

  // Master Students linking
  const studentsMaster = useMemo(() => {
    return getStudents();
  }, []);

  // Enriched Students list with Master Student Names
  const enrichedStudents = useMemo(() => {
    if (!currentAnalysis || !currentAnalysis.students) return [];

    return currentAnalysis.students.map(s => {
      const match = studentsMaster.find(sm => (sm.rollNumber || '').toUpperCase() === (s.rollNumber || '').toUpperCase());
      return {
        ...s,
        studentName: match ? (match.fullName || match.name) : (s.studentName || '—'),
        studentDept: match ? match.departmentCode : currentAnalysis.department,
        isMatched: !!match
      };
    });
  }, [currentAnalysis, studentsMaster]);

  // Filtered Students for Marks Table
  const filteredStudents = useMemo(() => {
    return enrichedStudents.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        s.rollNumber.toLowerCase().includes(q) || 
        (s.studentName && s.studentName.toLowerCase().includes(q));

      let matchesLearner = true;
      if (learnerFilter === 'ADVANCED') matchesLearner = s.mid1Percentage >= 80;
      else if (learnerFilter === 'WEAK') matchesLearner = s.mid1Percentage < 50;
      else if (learnerFilter === 'REGULAR') matchesLearner = s.mid1Percentage >= 50 && s.mid1Percentage < 80;
      else if (learnerFilter === 'ABSENT') matchesLearner = s.isAbsentMid1;

      return matchesSearch && matchesLearner;
    });
  }, [enrichedStudents, searchQuery, learnerFilter]);

  // Advanced Learners (>= 80%)
  const advancedLearners = useMemo(() => {
    return enrichedStudents.filter(s => s.mid1Percentage >= 80);
  }, [enrichedStudents]);

  // Weak Learners (< 50%)
  const weakLearners = useMemo(() => {
    return enrichedStudents.filter(s => s.mid1Percentage < 50);
  }, [enrichedStudents]);

  // Live Performance Band Distribution
  const distribution = useMemo(() => {
    if (!enrichedStudents.length) {
      return { above80: 0, band70_79: 0, band60_69: 0, band50_59: 0, below50: 0 };
    }
    return {
      above80: enrichedStudents.filter(s => s.mid1Percentage >= 80).length,
      band70_79: enrichedStudents.filter(s => s.mid1Percentage >= 70 && s.mid1Percentage < 80).length,
      band60_69: enrichedStudents.filter(s => s.mid1Percentage >= 60 && s.mid1Percentage < 70).length,
      band50_59: enrichedStudents.filter(s => s.mid1Percentage >= 50 && s.mid1Percentage < 60).length,
      below50: enrichedStudents.filter(s => s.mid1Percentage < 50).length
    };
  }, [enrichedStudents]);

  // Form states for Advanced Activity
  const [advTopicForm, setAdvTopicForm] = useState({
    date: new Date().toISOString().split('T')[0],
    topic: '',
    facultyGuide: 'Dr. S. Venkateswarlu',
    remarks: ''
  });

  const handleSaveAdvancedTopic = (e) => {
    e.preventDefault();
    if (!advTopicForm.topic.trim()) {
      showToast('Please provide a topic title.');
      return;
    }
    const updated = {
      ...currentAnalysis,
      advancedActivities: [
        ...(currentAnalysis.advancedActivities || []),
        { id: `adv_${Date.now()}`, ...advTopicForm }
      ]
    };
    saveMidExamAnalysis(updated);
    setDataVersion(v => v + 1);
    setAddAdvancedTopicOpen(false);
    setAdvTopicForm({ date: new Date().toISOString().split('T')[0], topic: '', facultyGuide: 'Dr. S. Venkateswarlu', remarks: '' });
    showToast('Advanced learner activity recorded.');
  };

  // Form states for Remedial Session
  const [remedialForm, setRemedialForm] = useState({
    sessionDate: new Date().toISOString().split('T')[0],
    topic: '',
    facultyName: 'Dr. S. Venkateswarlu',
    remarks: ''
  });

  const handleSaveRemedialSession = (e) => {
    e.preventDefault();
    if (!remedialForm.topic.trim()) {
      showToast('Please provide a remedial session topic.');
      return;
    }
    const initialAttendance = {};
    weakLearners.forEach(w => {
      initialAttendance[w.rollNumber] = 'PRESENT';
    });

    const updated = {
      ...currentAnalysis,
      remedialSessions: [
        ...(currentAnalysis.remedialSessions || []),
        {
          id: `rem_${Date.now()}`,
          ...remedialForm,
          attendance: initialAttendance
        }
      ]
    };
    saveMidExamAnalysis(updated);
    setDataVersion(v => v + 1);
    setAddRemedialSessionOpen(false);
    setRemedialForm({ sessionDate: new Date().toISOString().split('T')[0], topic: '', facultyName: 'Dr. S. Venkateswarlu', remarks: '' });
    showToast(`Remedial class scheduled for ${weakLearners.length} weak students.`);
  };

  const handleToggleAttendance = (sessionId, rollNumber) => {
    const sessions = currentAnalysis.remedialSessions || [];
    const updatedSessions = sessions.map(sess => {
      if (sess.id === sessionId) {
        const currentVal = sess.attendance?.[rollNumber] || 'PRESENT';
        return {
          ...sess,
          attendance: {
            ...sess.attendance,
            [rollNumber]: currentVal === 'PRESENT' ? 'ABSENT' : 'PRESENT'
          }
        };
      }
      return sess;
    });

    const updated = { ...currentAnalysis, remedialSessions: updatedSessions };
    saveMidExamAnalysis(updated);
    setDataVersion(v => v + 1);
  };

  // Smart Import State
  const [wizardStep, setWizardStep] = useState(1);
  const [importFileName, setImportFileName] = useState('');
  const [importDetectedType, setImportDetectedType] = useState('FULL_WORKBOOK');
  const [importPreviewData, setImportPreviewData] = useState(null);
  const [importParseResult, setImportParseResult] = useState(null); // real parsed output

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setWizardStep(2);
    setImportParseResult(null);
    setImportPreviewData(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = parseMidExamWorkbook(arrayBuffer, []);
      setImportParseResult(result);

      const detected = result.status === 'ERROR' ? 'ERROR' : 'FULL_WORKBOOK';
      setImportDetectedType(detected);

      setImportPreviewData({
        typeTitle: result.status === 'ERROR'
          ? 'File Could Not Be Parsed'
          : result.warnings.length > 0
            ? 'Mid Analysis Workbook — Imported with Warnings'
            : 'Mid Analysis Workbook — Successfully Parsed',
        status: result.status,
        errors: result.errors,
        warnings: result.warnings,
        sheetsFound: result.sheetsFound,
        studentsCount: result.stats.total,
        matchedStudents: result.stats.matched,
        unmatchedStudents: result.stats.unmatched,
        calculatedAdvanced: result.stats.advanced,
        calculatedWeak: result.stats.weak,
        metadata: result.metadata,
        stableKey: result.stableKey
      });
    } catch (err) {
      setImportDetectedType('ERROR');
      setImportPreviewData({
        typeTitle: 'File Processing Error',
        status: 'ERROR',
        errors: [`Unexpected error: ${err.message}`],
        warnings: [],
        studentsCount: 0
      });
    } finally {
      setWizardStep(3);
    }
  };

  const handleCommitImport = () => {
    if (!importParseResult || importParseResult.status === 'ERROR') {
      showToast('Cannot commit: file has parse errors. Please fix the source file and re-import.');
      return;
    }
    const meta = importParseResult.metadata || {};
    const updated = {
      ...(currentAnalysis || {}),
      department: meta.departmentCode || meta.department || currentAnalysis?.department,
      academicYear: meta.academicYear || currentAnalysis?.academicYear,
      year: meta.year || currentAnalysis?.year,
      semester: meta.semester || currentAnalysis?.semester,
      subjectName: meta.subjectName || currentAnalysis?.subjectName,
      subjectCode: meta.subjectCode || currentAnalysis?.subjectCode,
      regulation: meta.regulation || currentAnalysis?.regulation,
      batch: meta.batch || currentAnalysis?.batch,
      students: importParseResult.students,
      studentsCount: importParseResult.stats.total,
      mid1Average: importParseResult.students.length > 0
        ? parseFloat(
            (importParseResult.students.reduce((sum, s) => sum + (s.mid1Total || 0), 0) /
              importParseResult.students.length).toFixed(2)
          )
        : 0,
      mid1Percentage: importParseResult.students.length > 0
        ? parseFloat(
            (importParseResult.students.reduce((sum, s) => sum + (s.mid1Percentage || 0), 0) /
              importParseResult.students.length).toFixed(2)
          )
        : 0,
      importHistory: [
        ...(currentAnalysis?.importHistory || []),
        {
          id: `imp_${Date.now()}`,
          originalFilename: importFileName,
          uploadedAt: new Date().toISOString(),
          sheetsDetected: Object.values(importParseResult.sheetsFound || {}).filter(Boolean).length,
          rawSheetsImported: [
            importParseResult.sheetsFound?.assignment1 ? 'ASSIGNMENT-1' : null,
            importParseResult.sheetsFound?.mid1 ? 'MID-1' : null,
            importParseResult.sheetsFound?.assignment2 ? 'ASSIGNMENT-2' : null,
            importParseResult.sheetsFound?.mid2 ? 'MID-2' : null,
          ].filter(Boolean),
          derivedSheetsRegenerated: ['Analysis Summary', 'Advanced Learners', 'Weak Learners'],
          status: importParseResult.status,
          warnings: importParseResult.warnings
        }
      ]
    };
    saveMidExamAnalysis(updated);
    setImportWizardOpen(false);
    setWizardStep(1);
    setImportFileName('');
    setImportPreviewData(null);
    setImportParseResult(null);
    setDataVersion(v => v + 1);
    showToast(`Successfully imported ${importParseResult.stats.total} student records from "${importFileName}".`);
  };

  return (
    <MotionPage style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header with Breadcrumbs & Unified Action Modals */}
      <ModulePageHeader
        breadcrumbs={[
          { label: 'Portal', onClick: () => {} },
          { label: 'Academic Portfolio', onClick: () => {} },
          { label: 'Mid Exam Analysis' }
        ]}
        title="Mid Exam Analysis"
        subtitle="Mid examination marks, learner analysis, remedial follow-up, and academic evidence."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Download Templates Group */}
            <button
              type="button"
              onClick={() => setTemplatesModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Download size={14} /> Download Templates <ChevronDown size={12} />
            </button>

            {/* Export Reports Group */}
            <button
              type="button"
              onClick={() => setExportsModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <FileSpreadsheet size={14} /> Export Reports <ChevronDown size={12} />
            </button>
          </div>
        }
        primaryAction={{
          label: 'Smart Import',
          icon: UploadCloud,
          onClick: () => {
            setWizardStep(1);
            setImportWizardOpen(true);
          }
        }}
      />

      {/* 2. Top Course & Exam Context Selector Bar (Institutional White Theme) */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '0.85rem 1rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        {/* Department */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            disabled={currentUser?.role === 'HOD' && currentUser?.dept && currentUser?.dept !== 'Management & Governance'}
            style={{ padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
          >
            <option value="CYS">Cyber Security (CYS)</option>
            <option value="DS">Data Science (DS)</option>
            <option value="AI">Artificial Intelligence (AI)</option>
            <option value="AIML">AI & ML (AIML)</option>
          </select>
        </div>

        {/* Academic Year */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Academic Year</label>
          <select
            value={selectedAy}
            onChange={(e) => setSelectedAy(e.target.value)}
            style={{ padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
          >
            <option value="2025-26">2025-26</option>
            <option value="2026-27">2026-27</option>
            <option value="2024-25">2024-25</option>
          </select>
        </div>

        {/* Year */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
          >
            <option value="III Year">III Year</option>
            <option value="II Year">II Year</option>
            <option value="IV Year">IV Year</option>
            <option value="I Year">I Year</option>
          </select>
        </div>

        {/* Semester */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Semester</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            style={{ padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
          >
            <option value="II Semester">II Semester</option>
            <option value="I Semester">I Semester</option>
          </select>
        </div>

        {/* Active Subject Context Badge */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <BookOpen size={16} style={{ color: '#2563EB' }} />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>
              {currentAnalysis?.subjectName || 'Cyber Crime & Digital Forensics'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748B', display: 'flex', gap: '0.5rem' }}>
              <span>Code: <strong>{currentAnalysis?.subjectCode || 'R23CY3201'}</strong></span>
              <span>•</span>
              <span>Regulation: <strong>{currentAnalysis?.regulation || 'R23'}</strong></span>
              <span>•</span>
              <span>Batch: <strong>{currentAnalysis?.batch || '2023'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Conflict Warning Banner (if present in workbook source) */}
      {currentAnalysis?.metadataConflictNote && (
        <div style={{
          background: '#FEFCE8',
          border: '1px solid #FEF08A',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.78rem',
          color: '#854D0E'
        }}>
          <Info size={16} style={{ flexShrink: 0, color: '#CA8A04' }} />
          <div>
            <strong>Source Metadata Notice:</strong> {currentAnalysis.metadataConflictNote}
          </div>
        </div>
      )}

      {/* 3. Live KPI Summary Cards (Institutional Theme) */}
      <AnimatedKpiGrid minWidth="160px">
        <MotionKpiCard
          label="Students Analysed"
          value={currentAnalysis?.studentsCount || enrichedStudents.length || 0}
          subtext="Cohort size"
          icon={Users}
          color="#2563EB"
          bg="#EFF6FF"
        />
        <MotionKpiCard
          label="Mid-I Average"
          value={`${currentAnalysis?.mid1Average || 20.28} / 30`}
          subtext={`Avg: ${currentAnalysis?.mid1Percentage || 67.61}%`}
          icon={TrendingUp}
          color="#059669"
          bg="#ECFDF5"
        />
        <MotionKpiCard
          label="Advanced Learners"
          value={distribution.above80}
          subtext="≥ 80% marks (≥24/30)"
          icon={Award}
          color="#D97706"
          bg="#FEFCE8"
        />
        <MotionKpiCard
          label="Weak Learners"
          value={distribution.below50}
          subtext="< 50% marks (<15/30)"
          icon={AlertTriangle}
          color="#DC2626"
          bg="#FEF2F2"
        />
        <MotionKpiCard
          label="Mid-II Status"
          value="Exam Marks Avail."
          subtext="Ass-II Incomplete"
          icon={Clock}
          color="#64748B"
          bg="#F8FAFC"
        />
      </AnimatedKpiGrid>

      {/* 4. 9 Functional Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.35rem',
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: '0.35rem',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'marks', label: 'Student Marks', icon: FileSpreadsheet, count: enrichedStudents.length },
          { id: 'mid1-analysis', label: 'Mid-I Analysis', icon: CheckCircle2 },
          { id: 'mid2-analysis', label: 'Mid-II Analysis', icon: Clock },
          { id: 'advanced', label: 'Advanced Learners (≥80%)', icon: Award, count: distribution.above80 },
          { id: 'weak', label: 'Weak Learners (<50%)', icon: AlertTriangle, count: distribution.below50 },
          { id: 'remedial', label: 'Remedial & Follow-up', icon: BookOpen },
          { id: 'improvement', label: 'Improvement Analysis', icon: TrendingUp },
          { id: 'import-export', label: 'Import / Export Hub', icon: Layers }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#0F172A' : 'transparent',
                color: isActive ? '#F1C40F' : '#64748B',
                fontSize: '0.78rem',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={14} />
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  background: isActive ? '#F1C40F' : '#E2E8F0',
                  color: isActive ? '#0F172A' : '#475569',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                  fontSize: '0.65rem',
                  fontWeight: 800
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 1: OVERVIEW & PERFORMANCE DISTRIBUTION */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Performance Bands Card */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BarChart3 size={16} style={{ color: '#2563EB' }} /> Mid-I Performance Band Distribution
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#FEFCE8', border: '1px solid #FEF08A' }}>
                <div style={{ fontSize: '0.72rem', color: '#854D0E', fontWeight: 700 }}>≥ 80% (Advanced Learners)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#A16207', marginTop: '0.25rem' }}>{distribution.above80} Students</div>
                <div style={{ fontSize: '0.7rem', color: '#854D0E', marginTop: '0.15rem' }}>Score ≥ 24.0 / 30</div>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <div style={{ fontSize: '0.72rem', color: '#1E40AF', fontWeight: 700 }}>70% – 79% (Very Good)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1D4ED8', marginTop: '0.25rem' }}>{distribution.band70_79} Students</div>
                <div style={{ fontSize: '0.7rem', color: '#1E40AF', marginTop: '0.15rem' }}>Score 21.0 – 23.9 / 30</div>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700 }}>60% – 69% (Good)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', marginTop: '0.25rem' }}>{distribution.band60_69} Students</div>
                <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.15rem' }}>Score 18.0 – 20.9 / 30</div>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: '0.72rem', color: '#92400E', fontWeight: 700 }}>50% – 59% (Satisfactory)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#B45309', marginTop: '0.25rem' }}>{distribution.band50_59} Students</div>
                <div style={{ fontSize: '0.7rem', color: '#92400E', marginTop: '0.15rem' }}>Score 15.0 – 17.9 / 30</div>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: '0.72rem', color: '#991B1B', fontWeight: 700 }}>&lt; 50% (Weak / Remedial)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#DC2626', marginTop: '0.25rem' }}>{distribution.below50} Students</div>
                <div style={{ fontSize: '0.7rem', color: '#991B1B', marginTop: '0.15rem' }}>Score &lt; 15.0 / 30</div>
              </div>
            </div>
          </div>

          {/* Assessment Component Weightage Card */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.85rem 0' }}>
                Mid-I Assessment Framework (30 Marks Basis)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem', background: '#F8FAFC', borderRadius: '6px' }}>
                  <span style={{ color: '#475569' }}>Assignment-I (Reduced from 10)</span>
                  <strong style={{ color: '#0F172A' }}>5 Marks</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem', background: '#F8FAFC', borderRadius: '6px' }}>
                  <span style={{ color: '#475569' }}>Part-A: Short Answer Questions (SAQ)</span>
                  <strong style={{ color: '#0F172A' }}>10 Marks</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem', background: '#F8FAFC', borderRadius: '6px' }}>
                  <span style={{ color: '#475569' }}>Part-B: Descriptive Questions (Reduced from 30)</span>
                  <strong style={{ color: '#0F172A' }}>15 Marks</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#EFF6FF', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                  <span style={{ color: '#1E40AF', fontWeight: 700 }}>Total Mid-I Maximum Marks</span>
                  <strong style={{ color: '#1D4ED8' }}>30 Marks</strong>
                </div>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.85rem 0' }}>
                Mid-II Assessment Framework (Status Note)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem', background: '#ECFDF5', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
                  <span style={{ color: '#047857', fontWeight: 600 }}>Part-A SAQ &amp; Part-B Descriptive</span>
                  <strong style={{ color: '#059669' }}>60 Records Populated</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem', background: '#FEFCE8', borderRadius: '6px', border: '1px solid #FEF08A' }}>
                  <span style={{ color: '#854D0E', fontWeight: 600 }}>Assignment-II Marks</span>
                  <strong style={{ color: '#A16207' }}>Incomplete (Blanks Preserved)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem', background: '#F8FAFC', borderRadius: '6px' }}>
                  <span style={{ color: '#475569' }}>Final Mid-II Overall Total /30</span>
                  <strong style={{ color: '#64748B' }}>Pending Assignment-II Completion</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 2: MASTER STUDENT MARKS TABLE */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'marks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Table Filters */}
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '0.85rem 1rem', border: '1px solid #E2E8F0', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student roll number or student name..."
                style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.2rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }}
              />
            </div>

            <select
              value={learnerFilter}
              onChange={(e) => setLearnerFilter(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
            >
              <option value="ALL">All Learner Groups</option>
              <option value="ADVANCED">Advanced Learners (≥80%)</option>
              <option value="WEAK">Weak Learners (&lt;50%)</option>
              <option value="REGULAR">Regular (50% – 79%)</option>
              <option value="ABSENT">Absence Flagged (AB)</option>
            </select>

            <button
              type="button"
              onClick={() => exportConsolidatedMidCSV(currentAnalysis)}
              style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#334155', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Download size={13} /> Export CSV
            </button>
          </div>

          {/* Student Table */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Roll Number</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Student Name</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Ass-I (/5)</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Mid-I SAQ (/10)</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Mid-I DES (/15)</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Mid-I Total (/30)</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Mid-I %</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Mid-II SAQ</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Mid-II DES</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Classification</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8' }}>
                        No student marks found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => {
                      const isAdv = student.mid1Percentage >= 80;
                      const isWeak = student.mid1Percentage < 50;

                      return (
                        <tr key={student.rollNumber} style={{ borderBottom: '1px solid #F1F5F9' }} className="hover:bg-slate-50">
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#0F172A' }}>
                            {student.rollNumber}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: student.isMatched ? '#0F172A' : '#94A3B8' }}>
                            {student.studentName}
                          </td>
                          <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 700, color: student.assignment1 === 'AB' ? '#DC2626' : '#0F172A' }}>
                            {student.assignment1}
                          </td>
                          <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 700, color: student.mid1Saq === 'AB' ? '#DC2626' : '#0F172A' }}>
                            {student.mid1Saq}
                          </td>
                          <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 700, color: student.mid1Descriptive === 'AB' ? '#DC2626' : '#0F172A' }}>
                            {student.mid1Descriptive}
                          </td>
                          <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 900, color: isAdv ? '#059669' : (isWeak ? '#DC2626' : '#2563EB') }}>
                            {student.mid1Total}
                          </td>
                          <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 800 }}>
                            {student.mid1Percentage}%
                          </td>
                          <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', color: '#64748B' }}>
                            {student.mid2Saq != null ? student.mid2Saq : '—'}
                          </td>
                          <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', color: '#64748B' }}>
                            {student.mid2Descriptive != null ? student.mid2Descriptive : '—'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              background: isAdv ? '#ECFDF5' : (isWeak ? '#FEF2F2' : '#F1F5F9'),
                              color: isAdv ? '#059669' : (isWeak ? '#DC2626' : '#475569'),
                              border: `1px solid ${isAdv ? '#A7F3D0' : (isWeak ? '#FECACA' : '#E2E8F0')}`
                            }}>
                              {student.classification}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => setStudentDetailModal(student)}
                              style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              <Eye size={12} style={{ display: 'inline', marginRight: '4px' }} /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 3: MID-I ANALYSIS */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'mid1-analysis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1rem 0' }}>
              Mid-I Consolidated Performance Breakdown
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Average Assignment-I Score</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>4.38 / 5.0</div>
                <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '0.1rem' }}>87.6% attainment</div>
              </div>

              <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Average Part-A SAQ Score</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>6.22 / 10.0</div>
                <div style={{ fontSize: '0.7rem', color: '#2563EB', marginTop: '0.1rem' }}>62.2% attainment</div>
              </div>

              <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Average Part-B Descriptive</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>9.68 / 15.0</div>
                <div style={{ fontSize: '0.7rem', color: '#7C3AED', marginTop: '0.1rem' }}>64.5% attainment</div>
              </div>

              <div style={{ padding: '1rem', background: '#EFF6FF', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
                <div style={{ fontSize: '0.74rem', color: '#1E40AF', fontWeight: 700 }}>Overall Mid-I Class Average</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1D4ED8', marginTop: '0.2rem' }}>20.28 / 30.0</div>
                <div style={{ fontSize: '0.7rem', color: '#1E40AF', marginTop: '0.1rem' }}>67.61% class average</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 4: MID-II ANALYSIS */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'mid2-analysis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: '#FEFCE8', borderRadius: '14px', border: '1px solid #FEF08A', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#854D0E', fontWeight: 800, fontSize: '0.9rem' }}>
              <Clock size={18} /> Mid-II Assessment Status: Partial Raw Marks Available
            </div>
            <p style={{ fontSize: '0.8rem', color: '#713F12', margin: '0.4rem 0 0 0' }}>
              Mid-II raw examination marks (SAQ and Descriptive parts) have been captured for 60 students from sheet <code>MID-2</code>. Assignment-II marks remain incomplete in the source workbook. Final Mid-II overall total (/30) and percentage will be calculated dynamically once Assignment-II records are entered.
            </p>
          </div>

          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1rem 0' }}>
              Mid-II Raw Exam Component Availability
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Part-A SAQ (/10)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>60 Records Present</div>
              </div>
              <div style={{ padding: '0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Part-B Descriptive (/15)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>60 Records Present</div>
              </div>
              <div style={{ padding: '0.85rem', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: '0.72rem', color: '#991B1B' }}>Assignment-II (/5)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#DC2626', marginTop: '0.2rem' }}>Pending Entry</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 5: ADVANCED LEARNERS (≥80%) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'advanced' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Advanced Learners Cohort (Score ≥ 80% • ≥24/30)
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                  {advancedLearners.length} students identified for advanced technical seminars, capstone mentoring, and certifications.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => exportAdvancedLearnersPDF(currentAnalysis)}
                  style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#047857', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Printer size={13} /> Print PDF
                </button>
                <button
                  type="button"
                  onClick={() => exportAdvancedLearnersCSV(currentAnalysis)}
                  style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Download size={13} /> CSV
                </button>
                <button
                  type="button"
                  onClick={() => setAddAdvancedTopicOpen(true)}
                  style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: 'none', background: '#0F172A', color: '#F1C40F', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Plus size={13} /> Add Topic / Seminar
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Roll Number</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Student Name</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Ass-I (/5)</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>SAQ (/10)</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>DES (/15)</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Total (/30)</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Percentage</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {advancedLearners.map(student => (
                    <tr key={student.rollNumber} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#0F172A' }}>{student.rollNumber}</td>
                      <td style={{ padding: '0.75rem 1rem', color: student.isMatched ? '#0F172A' : '#94A3B8' }}>{student.studentName}</td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>{student.assignment1}</td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>{student.mid1Saq}</td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>{student.mid1Descriptive}</td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 900, color: '#059669' }}>{student.mid1Total}</td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 800, color: '#059669' }}>{student.mid1Percentage}%</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 800, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                          Advanced Learner
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Advanced Learner Activity Log */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.85rem 0' }}>
              Advanced Learner Activities &amp; Seminar Topics Log
            </h4>
            {(!currentAnalysis?.advancedActivities || currentAnalysis.advancedActivities.length === 0) ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem', background: '#F8FAFC', borderRadius: '8px' }}>
                No advanced activities logged yet. Click "Add Topic / Seminar" to record enrichment sessions.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {currentAnalysis.advancedActivities.map(act => (
                  <div key={act.id} style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.82rem' }}>{act.topic}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem' }}>
                        Date: {act.date} • Faculty Guide: {act.facultyGuide} {act.remarks ? `• ${act.remarks}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 6: WEAK LEARNERS (<50%) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'weak' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Weak / Slow Learners Cohort (Score &lt; 50% • &lt;15/30)
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                  {weakLearners.length} students identified for mandatory remedial makeup classes and academic counseling.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => exportWeakLearnersPDF(currentAnalysis)}
                  style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Printer size={13} /> Print PDF
                </button>
                <button
                  type="button"
                  onClick={() => exportWeakLearnersCSV(currentAnalysis)}
                  style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Download size={13} /> CSV
                </button>
                <button
                  type="button"
                  onClick={() => setAddRemedialSessionOpen(true)}
                  style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: 'none', background: '#0F172A', color: '#F1C40F', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Plus size={13} /> Schedule Remedial Class
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Roll Number</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Student Name</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Ass-I (/5)</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>SAQ (/10)</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>DES (/15)</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Total (/30)</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Percentage</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Absence Notes</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Remedial Status</th>
                  </tr>
                </thead>
                <tbody>
                  {weakLearners.map(student => (
                    <tr key={student.rollNumber} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#0F172A' }}>{student.rollNumber}</td>
                      <td style={{ padding: '0.75rem 1rem', color: student.isMatched ? '#0F172A' : '#94A3B8' }}>{student.studentName}</td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', color: student.assignment1 === 'AB' ? '#DC2626' : '#0F172A', fontWeight: 700 }}>
                        {student.assignment1}
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', color: student.mid1Saq === 'AB' ? '#DC2626' : '#0F172A', fontWeight: 700 }}>
                        {student.mid1Saq}
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', color: student.mid1Descriptive === 'AB' ? '#DC2626' : '#0F172A', fontWeight: 700 }}>
                        {student.mid1Descriptive}
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 900, color: '#DC2626' }}>{student.mid1Total}</td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 800, color: '#DC2626' }}>{student.mid1Percentage}%</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', color: student.isAbsentMid1 ? '#DC2626' : '#64748B' }}>
                        {student.absenceNote || 'Appeared'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 800, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                          Remedial Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 7: REMEDIAL & FOLLOW-UP SUITE */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'remedial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick Actions Bar for Remedial Sheets */}
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '0.85rem 1rem', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={16} style={{ color: '#DC2626' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A' }}>
                Makeup &amp; Remedial Classes Attendance Suite
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => exportRemedialAttendanceXLSX(currentAnalysis, { prefilled: true, sessionCount: remedialSessionCount })}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#0F172A', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Download size={13} /> Export Pre-filled Attendance (Excel)
              </button>
              <button
                type="button"
                onClick={() => exportRemedialAttendancePDF(currentAnalysis, { prefilled: true, sessionCount: remedialSessionCount })}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#0F172A', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Printer size={13} /> Print Sheet (PDF)
              </button>
              <button
                type="button"
                onClick={() => setAddRemedialSessionOpen(true)}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: 'none', background: '#0F172A', color: '#F1C40F', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Plus size={13} /> Add Session
              </button>
            </div>
          </div>

          {/* Remedial Sessions Card */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.85rem 0' }}>
              Logged Remedial Classes &amp; Student Attendance
            </h4>

            {(!currentAnalysis?.remedialSessions || currentAnalysis.remedialSessions.length === 0) ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem', background: '#F8FAFC', borderRadius: '8px' }}>
                No remedial classes logged yet. Click "Add Session" or export the pre-filled attendance sheet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {currentAnalysis.remedialSessions.map((sess, sIdx) => (
                  <div key={sess.id} style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#0F172A', fontSize: '0.84rem' }}>Session #{sIdx + 1}: {sess.topic}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Date: {sess.sessionDate} • Faculty: {sess.facultyName}</div>
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Student Attendance (Click to Toggle)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                        {weakLearners.map(w => {
                          const status = sess.attendance?.[w.rollNumber] || 'PRESENT';
                          const isPresent = status === 'PRESENT';
                          return (
                            <div
                              key={w.rollNumber}
                              onClick={() => handleToggleAttendance(sess.id, w.rollNumber)}
                              style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                border: `1px solid ${isPresent ? '#A7F3D0' : '#FECACA'}`,
                                background: isPresent ? '#ECFDF5' : '#FEF2F2',
                                color: isPresent ? '#047857' : '#991B1B',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <span>{w.rollNumber}</span>
                              <span>{status}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 8: IMPROVEMENT ANALYSIS (MID-I VS MID-II) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'improvement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Impact Analysis on Remedial Classes Conducted for Weak Students
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                  Tracks progression and mark delta from Mid-I to Mid-II for the identified intervention cohort.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => exportImprovementAnalysisXLSX(currentAnalysis)}
                  style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#0F172A', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Download size={13} /> Export Excel
                </button>
                <button
                  type="button"
                  onClick={() => exportImprovementAnalysisPDF(currentAnalysis)}
                  style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#0F172A', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Printer size={13} /> Print Sheet (PDF)
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Roll Number</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Student Name</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Mid-I (/30)</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Mid-I %</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Mid-II Total</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Mid-II %</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Change (Δ)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Intervention Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {weakLearners.map(student => {
                    const mid2Tot = student.mid2Total != null ? student.mid2Total : 'Pending';
                    const mid2Pct = student.mid2Percentage != null ? `${student.mid2Percentage}%` : 'Pending';
                    const change = student.mid2Total != null ? (student.mid2Total - student.mid1Total) : '—';

                    return (
                      <tr key={student.rollNumber} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#0F172A' }}>{student.rollNumber}</td>
                        <td style={{ padding: '0.75rem 1rem', color: student.isMatched ? '#0F172A' : '#94A3B8' }}>{student.studentName}</td>
                        <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#DC2626' }}>{student.mid1Total}</td>
                        <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>{student.mid1Percentage}%</td>
                        <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', color: '#64748B' }}>{mid2Tot}</td>
                        <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', color: '#64748B' }}>{mid2Pct}</td>
                        <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 800 }}>{change}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#475569' }}>
                          Remedial sessions conducted; Assignment-II pending
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 9: IMPORT / EXPORT HUB */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'import-export' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Action Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* Download Templates Card */}
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Download size={18} style={{ color: '#2563EB' }} />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Academic Templates</h4>
              </div>
              <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '0 0 1rem 0' }}>
                Download clean, institutional Excel and PDF templates with zero formula errors.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={generateBlankMidTemplateXLSX}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#0F172A', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>Blank Mid Data Workbook</span>
                  <FileSpreadsheet size={14} style={{ color: '#059669' }} />
                </button>
                <button
                  type="button"
                  onClick={() => exportRemedialAttendanceXLSX(currentAnalysis, { prefilled: true, sessionCount: 6 })}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#0F172A', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>Pre-filled Remedial Attendance (Excel)</span>
                  <FileSpreadsheet size={14} style={{ color: '#059669' }} />
                </button>
                <button
                  type="button"
                  onClick={() => exportRemedialAttendancePDF(currentAnalysis, { prefilled: true, sessionCount: 6 })}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#0F172A', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>Printable Remedial Attendance (PDF)</span>
                  <Printer size={14} style={{ color: '#DC2626' }} />
                </button>
                <button
                  type="button"
                  onClick={() => exportAdvancedEvidenceXLSX(currentAnalysis)}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#0F172A', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>Advanced Learner Activities Sheet</span>
                  <FileSpreadsheet size={14} style={{ color: '#059669' }} />
                </button>
              </div>
            </div>

            {/* Smart Ingest Card */}
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <UploadCloud size={18} style={{ color: '#059669' }} />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Smart Ingest &amp; Re-import</h4>
              </div>
              <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '0 0 1rem 0' }}>
                Upload original workbooks or completed manual-fill sheets. System auto-detects sheet types and maps records.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => { setWizardStep(1); setImportWizardOpen(true); }}
                  style={{ padding: '0.55rem 0.85rem', borderRadius: '6px', border: 'none', background: '#0F172A', color: '#F1C40F', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>Launch Smart Importer</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => exportFullAcademicWorkbookXLSX(currentAnalysis)}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#0F172A', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>Export Full Academic Workbook</span>
                  <FileSpreadsheet size={14} style={{ color: '#2563EB' }} />
                </button>
              </div>
            </div>
          </div>

          {/* Import History Table */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.85rem 0' }}>
              File Provenance &amp; Upload History Ledger
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Original Filename</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Sheets Detected</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Authoritative Raw Sheets</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Regenerated Reports</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Uploaded Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentAnalysis?.importHistory || []).map(job => (
                    <tr key={job.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0F172A' }}>{job.originalFilename}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{job.sheetsDetected} Sheets</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#059669', fontSize: '0.75rem' }}>
                        {(job.rawSheetsImported || []).join(', ')}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#2563EB', fontSize: '0.75rem' }}>
                        {(job.derivedSheetsRegenerated || []).join(', ')}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748B' }}>
                        {formatDateDDMMYYYY(job.uploadedAt)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 800, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                          Verified Mid-I
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL: DOWNLOAD TEMPLATES CENTER */}
      {/* ──────────────────────────────────────────────────────────── */}
      {templatesModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 15, 30, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ background: '#0F172A', padding: '1.25rem 1.5rem', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Download Templates &amp; Manual Sheets</h3>
              <button type="button" onClick={() => setTemplatesModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.84rem' }}>Pre-filled Remedial Attendance Sheet</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem' }}>Auto-fills the 4 weak student roll numbers &amp; Mid-I marks. Ready for manual signature &amp; date marking.</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => { exportRemedialAttendanceXLSX(currentAnalysis, { prefilled: true, sessionCount: 6 }); setTemplatesModalOpen(false); }} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>Excel (.xlsx)</button>
                  <button type="button" onClick={() => { exportRemedialAttendancePDF(currentAnalysis, { prefilled: true, sessionCount: 6 }); setTemplatesModalOpen(false); }} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>PDF Printable</button>
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.84rem' }}>Blank Remedial Attendance Sheet</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem' }}>Blank sheet for manual student roll and mark entry with institutional header.</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => { exportRemedialAttendanceXLSX(currentAnalysis, { prefilled: false, sessionCount: 6 }); setTemplatesModalOpen(false); }} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>Excel (.xlsx)</button>
                  <button type="button" onClick={() => { exportRemedialAttendancePDF(currentAnalysis, { prefilled: false, sessionCount: 6 }); setTemplatesModalOpen(false); }} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>PDF Printable</button>
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.84rem' }}>Blank Mid Data Import Workbook</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem' }}>Clean multi-sheet workbook (INFO, ASSIGNMENT-1, MID-1, ASSIGNMENT-2, MID-2) with zero broken formulas.</div>
                <div style={{ marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => { generateBlankMidTemplateXLSX(); setTemplatesModalOpen(false); }} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#047857', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>Download Multi-Sheet Excel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL: EXPORT REPORTS CENTER */}
      {/* ──────────────────────────────────────────────────────────── */}
      {exportsModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 15, 30, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ background: '#0F172A', padding: '1.25rem 1.5rem', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Export Academic Reports</h3>
              <button type="button" onClick={() => setExportsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.84rem' }}>Advanced Learners Report (≥80%)</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem' }}>Official list of 12 students scoring 24/30 or above.</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => { exportAdvancedLearnersXLSX(currentAnalysis); setExportsModalOpen(false); }} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>Excel</button>
                  <button type="button" onClick={() => { exportAdvancedLearnersPDF(currentAnalysis); setExportsModalOpen(false); }} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#047857', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>PDF</button>
                  <button type="button" onClick={() => { exportAdvancedLearnersCSV(currentAnalysis); setExportsModalOpen(false); }} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>CSV</button>
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.84rem' }}>Weak Learners Report (&lt;50%)</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem' }}>Official list of 4 students scoring below 15/30 with absence notes.</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => { exportWeakLearnersXLSX(currentAnalysis); setExportsModalOpen(false); }} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>Excel</button>
                  <button type="button" onClick={() => { exportWeakLearnersPDF(currentAnalysis); setExportsModalOpen(false); }} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>PDF</button>
                  <button type="button" onClick={() => { exportWeakLearnersCSV(currentAnalysis); setExportsModalOpen(false); }} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>CSV</button>
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.84rem' }}>Consolidated Full Mid Report</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem' }}>Complete marks ledger for all 60 students.</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => { exportFullAcademicWorkbookXLSX(currentAnalysis); setExportsModalOpen(false); }} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>Full Workbook (Excel)</button>
                  <button type="button" onClick={() => { exportConsolidatedMidPDF(currentAnalysis); setExportsModalOpen(false); }} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>PDF</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL: STUDENT DETAILS DOSSIER */}
      {/* ──────────────────────────────────────────────────────────── */}
      {studentDetailModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 15, 30, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '540px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }}>
            <div style={{ background: '#0F172A', padding: '1.25rem 1.5rem', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 800 }}>
                  {studentDetailModal.rollNumber} • {studentDetailModal.studentDept}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#FFFFFF' }}>
                  {studentDetailModal.studentName !== '—' ? studentDetailModal.studentName : studentDetailModal.rollNumber}
                </h3>
              </div>
              <button type="button" onClick={() => setStudentDetailModal(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Mid-I Assignment Score</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>{studentDetailModal.assignment1} / 5.0</div>
                </div>
                <div style={{ padding: '0.75rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Mid-I SAQ (Short Answers)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>{studentDetailModal.mid1Saq} / 10.0</div>
                </div>
                <div style={{ padding: '0.75rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Mid-I Descriptive Score</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>{studentDetailModal.mid1Descriptive} / 15.0</div>
                </div>
                <div style={{ padding: '0.75rem', background: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: '0.7rem', color: '#1E40AF', fontWeight: 700 }}>Mid-I Total Score</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1D4ED8' }}>
                    {studentDetailModal.mid1Total} / 30 ({studentDetailModal.mid1Percentage}%)
                  </div>
                </div>
              </div>

              {studentDetailModal.absenceNote && (
                <div style={{ padding: '0.6rem 0.85rem', background: '#FEF2F2', borderRadius: '6px', border: '1px solid #FECACA', color: '#DC2626', fontSize: '0.75rem', fontWeight: 700 }}>
                  ⚠️ Absence Recorded: {studentDetailModal.absenceNote}
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.25rem', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setStudentDetailModal(null)}
                style={{ padding: '0.45rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD ADVANCED TOPIC */}
      {/* ──────────────────────────────────────────────────────────── */}
      {addAdvancedTopicOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 15, 30, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ background: '#0F172A', padding: '1.25rem 1.5rem', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Add Topic for Advanced Learners (≥80%)
              </h3>
              <button type="button" onClick={() => setAddAdvancedTopicOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdvancedTopic} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                  TOPIC / SEMINAR TITLE *
                </label>
                <input
                  type="text"
                  required
                  value={advTopicForm.topic}
                  onChange={(e) => setAdvTopicForm(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="e.g. Memory Forensics with Volatility Framework"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    DATE CONDUCTED
                  </label>
                  <input
                    type="date"
                    value={advTopicForm.date}
                    onChange={(e) => setAdvTopicForm(prev => ({ ...prev, date: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    FACULTY GUIDE
                  </label>
                  <input
                    type="text"
                    value={advTopicForm.facultyGuide}
                    onChange={(e) => setAdvTopicForm(prev => ({ ...prev, facultyGuide: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setAddAdvancedTopicOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL: SCHEDULE REMEDIAL SESSION */}
      {/* ──────────────────────────────────────────────────────────── */}
      {addRemedialSessionOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 15, 30, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ background: '#0F172A', padding: '1.25rem 1.5rem', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Schedule Makeup / Remedial Class (&lt;50%)
              </h3>
              <button type="button" onClick={() => setAddRemedialSessionOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRemedialSession} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.65rem 0.85rem', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA', fontSize: '0.74rem', color: '#991B1B' }}>
                Auto-assigned to <strong>{weakLearners.length} weak students</strong> ({weakLearners.map(w => w.rollNumber).join(', ')})
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                  REMEDIAL TOPIC / FOCUS AREA *
                </label>
                <input
                  type="text"
                  required
                  value={remedialForm.topic}
                  onChange={(e) => setRemedialForm(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="e.g. Fundamental Concepts of Cyber Evidence Handling"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    SESSION DATE
                  </label>
                  <input
                    type="date"
                    value={remedialForm.sessionDate}
                    onChange={(e) => setRemedialForm(prev => ({ ...prev, sessionDate: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    FACULTY
                  </label>
                  <input
                    type="text"
                    value={remedialForm.facultyName}
                    onChange={(e) => setRemedialForm(prev => ({ ...prev, facultyName: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setAddRemedialSessionOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL: SMART IMPORT MID DATA WIZARD */}
      {/* ──────────────────────────────────────────────────────────── */}
      {importWizardOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 15, 30, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '580px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ background: '#0F172A', padding: '1.25rem 1.5rem', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 800 }}>STEP {wizardStep} OF 3</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0.15rem 0 0', color: '#FFFFFF' }}>
                  Smart Import Mid Analysis File
                </h3>
              </div>
              <button type="button" onClick={() => setImportWizardOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {wizardStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', padding: '1.5rem', border: '2px dashed #CBD5E1', borderRadius: '12px', background: '#F8FAFC' }}>
                  <UploadCloud size={36} style={{ color: '#2563EB' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>Upload Excel Workbook (.xlsx, .xls)</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.2rem' }}>
                      Auto-detects Workbook Layout: Full Mid Analysis, Completed Remedial Attendance, or Evidence Activity Sheets.
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    style={{ fontSize: '0.78rem' }}
                  />
                </div>
              )}

              {wizardStep === 2 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                  <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: '#2563EB' }} />
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>Inspecting File &amp; Auto-Detecting Sheet Type...</div>
                </div>
              )}

              {wizardStep === 3 && importPreviewData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Status Banner */}
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: importPreviewData.status === 'ERROR' ? '#FEF2F2' : importPreviewData.status === 'WARNING' ? '#FEFCE8' : '#ECFDF5',
                    borderRadius: '8px',
                    border: `1px solid ${importPreviewData.status === 'ERROR' ? '#FECACA' : importPreviewData.status === 'WARNING' ? '#FEF08A' : '#A7F3D0'}`
                  }}>
                    <div style={{ fontSize: '0.72rem', color: importPreviewData.status === 'ERROR' ? '#DC2626' : importPreviewData.status === 'WARNING' ? '#CA8A04' : '#059669', fontWeight: 800, textTransform: 'uppercase' }}>
                      {importPreviewData.status === 'ERROR' ? '⚠ Parse Failed' : importPreviewData.status === 'WARNING' ? '⚡ Imported with Warnings' : '✓ File Parsed Successfully'}
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0F172A', marginTop: '0.15rem' }}>
                      {importPreviewData.typeTitle}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem' }}>
                      File: <strong>{importFileName}</strong>
                    </div>
                  </div>

                  {/* Errors */}
                  {importPreviewData.errors && importPreviewData.errors.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {importPreviewData.errors.map((err, i) => (
                        <div key={i} style={{ padding: '0.6rem 0.85rem', background: '#FEF2F2', borderRadius: '6px', border: '1px solid #FECACA', fontSize: '0.75rem', color: '#DC2626' }}>
                          ✗ {err}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {importPreviewData.warnings && importPreviewData.warnings.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {importPreviewData.warnings.map((w, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.75rem', background: '#FEFCE8', borderRadius: '6px', border: '1px solid #FEF08A', fontSize: '0.74rem', color: '#92400E' }}>
                          ⚡ {w}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stats Grid */}
                  {importPreviewData.status !== 'ERROR' && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
                        <div style={{ padding: '0.75rem', background: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                          <div style={{ fontSize: '0.7rem', color: '#1E40AF' }}>Students Detected</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1D4ED8' }}>{importPreviewData.studentsCount}</div>
                        </div>
                        <div style={{ padding: '0.75rem', background: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                          <div style={{ fontSize: '0.7rem', color: '#047857' }}>Matched to Master</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>{importPreviewData.matchedStudents}</div>
                        </div>
                        <div style={{ padding: '0.75rem', background: '#FEFCE8', borderRadius: '8px', border: '1px solid #FEF08A' }}>
                          <div style={{ fontSize: '0.7rem', color: '#A16207' }}>Advanced (≥80%)</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#D97706' }}>{importPreviewData.calculatedAdvanced}</div>
                        </div>
                      </div>

                      {/* Sheets found */}
                      {importPreviewData.sheetsFound && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {Object.entries(importPreviewData.sheetsFound).map(([key, found]) => (
                            <span key={key} style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: found ? '#ECFDF5' : '#F8FAFC',
                              color: found ? '#047857' : '#94A3B8',
                              border: `1px solid ${found ? '#A7F3D0' : '#E2E8F0'}`
                            }}>
                              {found ? '✓' : '—'} {key.toUpperCase().replace(/_/g, '-')}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Metadata */}
                      {importPreviewData.metadata && Object.keys(importPreviewData.metadata).length > 0 && (
                        <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.73rem', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.25rem' }}>
                          {Object.entries(importPreviewData.metadata).filter(([, v]) => v).map(([k, v]) => (
                            <span key={k}><strong style={{ color: '#334155' }}>{k}:</strong> {v}</span>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => { setImportWizardOpen(false); setWizardStep(1); setImportPreviewData(null); setImportParseResult(null); }}
                      style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    {importPreviewData.status !== 'ERROR' && (
                      <button
                        type="button"
                        onClick={handleCommitImport}
                        style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        Commit Data to Portal
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          padding: '0.75rem 1.25rem',
          background: '#0F172A',
          border: '1px solid #D4AF37',
          borderRadius: '8px',
          color: '#FFFFFF',
          fontSize: '0.82rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          zIndex: 9999
        }}>
          {toastMessage}
        </div>
      )}
    </MotionPage>
  );
}
