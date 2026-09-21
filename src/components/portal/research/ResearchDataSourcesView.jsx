import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Database, 
  Layers, 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Download, 
  ShieldCheck, 
  RefreshCw,
  FileSpreadsheet,
  Globe,
  Award,
  Sparkles,
  Info,
  Check,
  Search,
  Filter,
  Copy,
  ExternalLink,
  Users,
  Eye,
  BookOpen,
  X,
  Plus,
  ArrowUpRight,
  Shield,
  Lightbulb,
  CheckSquare,
  Building2,
  Loader2
} from 'lucide-react';
import { 
  getPublications, 
  getPublicPublications, 
  savePublication, 
  reviewPublication, 
  importPublicationsBatch, 
  getPatents,
  getFacultyResearchProfiles,
  getFacultyResearchProfile,
  saveFacultyResearchProfile,
  linkFacultyResearcher,
  getDatasetVersions,
  universalResearchSearch,
  getMatchReviewQueue,
  resolveResearchMatch,
  getResearchRecordSources,
  exportToCSV,
  exportToExcel,
  exportToPDF
} from '../../../data/portalStore.js';
import { DEPARTMENTS, FACULTY_DATA } from '../../../data/masterData.js';
import { parseScopusExportCSV, parseWosExport } from '../../../lib/research/exportParsers.js';
import { 
  MotionPage, 
  ModulePageHeader, 
  AnimatedKpiGrid, 
  MotionKpiCard, 
  MotionTable, 
  MotionTableRow, 
  MotionEmptyState, 
  MotionButton,
  MotionNumber
} from '../../motion/index.js';

export default function ResearchDataSourcesView({ currentUser }) {
  const shouldReduce = useReducedMotion();
  const universalSearchRef = useRef(null);
  const tabStripRef = useRef(null);

  // Navigation tabs
  const [activeTab, setActiveTab] = useState('DATASETS'); // 'DATASETS' | 'EXPLORER' | 'PUBLICATIONS' | 'RESEARCHERS' | 'PATENTS' | 'INGESTION' | 'REVIEW_QUEUE'
  
  // Data state
  const [dataVersion, setDataVersion] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    showToast(`Copied ${label}: ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Modals state
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [selectedResearcher, setSelectedResearcher] = useState(null);
  const [selectedProvenance, setSelectedProvenance] = useState(null);
  const [editProfileModalFaculty, setEditProfileModalFaculty] = useState(null);

  // Ingestion state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSha, setUploadFileSha] = useState('');
  const [uploadText, setUploadText] = useState('');
  const [ingestionSourceType, setIngestionSourceType] = useState('SCOPUS'); // 'SCOPUS' | 'WOS'
  const [parsedRecords, setParsedRecords] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [parseError, setParseError] = useState('');

  // Explorer filters
  const [explorerSearch, setExplorerSearch] = useState('');
  const [explorerSourceFilter, setExplorerSourceFilter] = useState('ALL');
  const [explorerTypeFilter, setExplorerTypeFilter] = useState('ALL'); // 'ALL' | 'PUBLICATION' | 'RESEARCHER' | 'PATENT'
  const [explorerDeptFilter, setExplorerDeptFilter] = useState('ALL');
  const [explorerMatchStatusFilter, setExplorerMatchStatusFilter] = useState('ALL');

  // Review Queue filter state
  const [reviewDeptFilter, setReviewDeptFilter] = useState('ALL');

  // Fetch real data
  const publications = useMemo(() => getPublications(), [dataVersion]);
  const patents = useMemo(() => getPatents(), [dataVersion]);
  const researcherProfiles = useMemo(() => getFacultyResearchProfiles(), [dataVersion]);
  const datasetVersions = useMemo(() => getDatasetVersions(), [dataVersion, publications, patents, researcherProfiles]);
  const matchReviewQueue = useMemo(() => getMatchReviewQueue(), [dataVersion, publications]);

  const refreshAll = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    requestAnimationFrame(() => {
      try {
        getPublications();
        getPatents();
        getFacultyResearchProfiles();
        getDatasetVersions();
        getMatchReviewQueue();
        setDataVersion(v => v + 1);
        showToast('Research data refreshed.');
      } catch (err) {
        showToast('Failed to refresh data: ' + err.message);
      } finally {
        setIsRefreshing(false);
      }
    });
  };

  // Compute Overall Real Institutional Metrics
  const summaryKpis = useMemo(() => {
    const verifiedPubs = publications.filter(p => p.workflowStatus === 'APPROVED').length;
    const scopusWosPubs = publications.filter(p => p.isScopusIndexed || p.isWosIndexed).length;
    const grantedPatents = patents.filter(p => p.legalStatus === 'GRANTED').length;
    const totalPatents = patents.length;
    const researchersWithOrcid = researcherProfiles.filter(r => !!r.orcid).length;
    const researchersWithScopus = researcherProfiles.filter(r => !!r.scopusAuthorId).length;
    const pendingReviews = matchReviewQueue.length;

    return {
      verifiedPubs,
      scopusWosPubs,
      grantedPatents,
      totalPatents,
      researchersWithOrcid,
      researchersWithScopus,
      pendingReviews
    };
  }, [publications, patents, researcherProfiles, matchReviewQueue]);

  // Handle drilldown from dataset card to Explorer
  const handleDrilldown = (sourceKey) => {
    setExplorerSourceFilter(sourceKey);
    setExplorerTypeFilter('ALL');
    setExplorerSearch('');
    setActiveTab('EXPLORER');
  };

  // Filtered Explorer Results
  const explorerResults = useMemo(() => {
    let list = [];

    // 1. Publications
    if (explorerTypeFilter === 'ALL' || explorerTypeFilter === 'PUBLICATION') {
      const filteredPubs = publications.filter(p => {
        // Source match
        let matchesSource = true;
        if (explorerSourceFilter !== 'ALL') {
          if (explorerSourceFilter === 'OPENALEX') matchesSource = p.sources?.includes('OPENALEX') || !!p.openalexWorkId;
          else if (explorerSourceFilter === 'CROSSREF') matchesSource = p.sources?.includes('CROSSREF') || !!p.doi;
          else if (explorerSourceFilter === 'ORCID') matchesSource = p.sources?.includes('ORCID') || p.authors?.some(a => !!a.orcid);
          else if (explorerSourceFilter === 'SCOPUS_IMPORT' || explorerSourceFilter === 'SCOPUS') matchesSource = p.sources?.includes('SCOPUS_IMPORT') || p.isScopusIndexed || !!p.scopusEid;
          else if (explorerSourceFilter === 'WOS_IMPORT' || explorerSourceFilter === 'WOS') matchesSource = p.sources?.includes('WOS_IMPORT') || p.isWosIndexed || !!p.wosUid;
        }

        // Dept match
        const matchesDept = explorerDeptFilter === 'ALL' || p.department === explorerDeptFilter || p.departmentCode === explorerDeptFilter;

        // Match status
        const matchesStatus = explorerMatchStatusFilter === 'ALL' || p.matchStatus === explorerMatchStatusFilter;

        // Search text
        let matchesSearch = true;
        if (explorerSearch.trim()) {
          const q = explorerSearch.toLowerCase().trim();
          matchesSearch = (p.title || '').toLowerCase().includes(q) ||
                          (p.doi || '').toLowerCase().includes(q) ||
                          (p.scopusEid || '').toLowerCase().includes(q) ||
                          (p.wosUid || '').toLowerCase().includes(q) ||
                          (p.openalexWorkId || '').toLowerCase().includes(q) ||
                          (p.journalName || '').toLowerCase().includes(q) ||
                          (p.publicationRecordNumber || '').toLowerCase().includes(q) ||
                          (p.authors || []).some(a => (a.name || '').toLowerCase().includes(q));
        }

        return matchesSource && matchesDept && matchesStatus && matchesSearch;
      });

      list.push(...filteredPubs.map(p => ({ ...p, itemType: 'PUBLICATION' })));
    }

    // 2. Researchers
    if (explorerTypeFilter === 'ALL' || explorerTypeFilter === 'RESEARCHER') {
      if (explorerSourceFilter === 'ALL' || explorerSourceFilter === 'ORCID' || explorerSourceFilter === 'OPENALEX' || explorerSourceFilter === 'SCOPUS') {
        const filteredRes = researcherProfiles.filter(r => {
          const matchesDept = explorerDeptFilter === 'ALL' || r.department === explorerDeptFilter;
          let matchesSource = true;
          if (explorerSourceFilter === 'ORCID') matchesSource = !!r.orcid;
          else if (explorerSourceFilter === 'OPENALEX') matchesSource = !!r.openAlexAuthorId;
          else if (explorerSourceFilter === 'SCOPUS') matchesSource = !!r.scopusAuthorId;

          let matchesSearch = true;
          if (explorerSearch.trim()) {
            const q = explorerSearch.toLowerCase().trim();
            matchesSearch = (r.name || '').toLowerCase().includes(q) ||
                            (r.orcid || '').toLowerCase().includes(q) ||
                            (r.scopusAuthorId || '').toLowerCase().includes(q) ||
                            (r.wosResearcherId || '').toLowerCase().includes(q) ||
                            (r.vidwanId || '').toLowerCase().includes(q);
          }

          return matchesDept && matchesSource && matchesSearch;
        });

        list.push(...filteredRes.map(r => ({ ...r, itemType: 'RESEARCHER' })));
      }
    }

    // 3. Patents (isolated strictly from patent store)
    if ((explorerTypeFilter === 'ALL' || explorerTypeFilter === 'PATENT') && (explorerSourceFilter === 'ALL' || explorerSourceFilter === 'PATENTS')) {
      const filteredPatents = patents.filter(pat => {
        const matchesDept = explorerDeptFilter === 'ALL' || pat.department === explorerDeptFilter || pat.departmentCode === explorerDeptFilter;
        let matchesSearch = true;
        if (explorerSearch.trim()) {
          const q = explorerSearch.toLowerCase().trim();
          matchesSearch = (pat.title || '').toLowerCase().includes(q) ||
                          (pat.applicationNumber || '').toLowerCase().includes(q) ||
                          (pat.grantNumber || '').toLowerCase().includes(q) ||
                          (pat.patentRecordNumber || '').toLowerCase().includes(q) ||
                          (pat.technologyDomain || '').toLowerCase().includes(q) ||
                          (pat.inventors || []).some(inv => (inv.name || '').toLowerCase().includes(q));
        }
        return matchesDept && matchesSearch;
      });

      list.push(...filteredPatents.map(pat => ({ ...pat, itemType: 'PATENT' })));
    }

    return list;
  }, [publications, patents, researcherProfiles, explorerTypeFilter, explorerSourceFilter, explorerDeptFilter, explorerMatchStatusFilter, explorerSearch]);

  // File parsing logic
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    setUploadFile(file);
    setParseError('');

    // Compute SHA-256 in browser
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setUploadFileSha(hashHex);

      const text = new TextDecoder('utf-8').decode(arrayBuffer);
      setUploadText(text);
      executeParse(text, ingestionSourceType, file.name, hashHex);
    } catch (err) {
      setParseError('Failed to read file: ' + err.message);
    }
  };

  const executeParse = (text, type, filename = 'pasted_data.txt', sha = '') => {
    if (!text || !text.trim()) {
      setParseError('Please provide file content to parse.');
      return;
    }

    setParseError('');
    try {
      let records = [];
      if (type === 'SCOPUS') {
        records = parseScopusExportCSV(text);
      } else {
        records = parseWosExport(text);
      }

      if (records.length === 0) {
        setParseError('No valid publication records detected in the provided file. Ensure valid headers (e.g., Title, DOI, EID, Authors).');
        setParsedRecords(null);
        return;
      }

      // Automatically match extracted author names against local NEC FACULTY_DATA
      const enrichedRecords = records.map(rec => {
        const updatedAuthors = (rec.authors || []).map(author => {
          const normAuthor = author.name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
          const matchedFac = FACULTY_DATA.find(f => {
            const normFac = f.name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
            return normFac.includes(normAuthor) || normAuthor.includes(normFac);
          });

          if (matchedFac) {
            return {
              ...author,
              facultyId: matchedFac.id,
              departmentCode: matchedFac.department,
              department: matchedFac.department,
              matchStatus: 'POSSIBLE_MATCH',
              affiliation: 'Narasaraopeta Engineering College'
            };
          }
          return author;
        });

        // Determine record department from matched authors if available
        const detectedDept = updatedAuthors.find(a => a.departmentCode)?.departmentCode || null;

        return {
          ...rec,
          department: detectedDept,
          departmentCode: detectedDept,
          authors: updatedAuthors,
          sourceFile: filename,
          sourceSha256: sha
        };
      });

      setParsedRecords(enrichedRecords);
      setImportResult(null);
      showToast(`Parsed ${enrichedRecords.length} records successfully.`);
    } catch (err) {
      setParseError('Parse error: ' + err.message);
      setParsedRecords(null);
    }
  };

  const handleExecuteImport = () => {
    if (!parsedRecords || parsedRecords.length === 0) return;

    setImporting(true);
    try {
      importPublicationsBatch(parsedRecords, currentUser, ingestionSourceType);
      
      setImportResult({
        count: parsedRecords.length,
        message: `Successfully ingested and deduplicated ${parsedRecords.length} record(s) into institutional research repository (Status: IMPORTED_PENDING_REVIEW).`
      });

      setParsedRecords(null);
      setUploadText('');
      setUploadFileName('');
      setUploadFileSha('');
      refreshAll();
      showToast(`Imported ${parsedRecords.length} records into Review Queue!`);
    } catch (err) {
      setParseError('Import failed: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    const activeBtn = document.getElementById(`research-tab-${activeTab}`);
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: shouldReduce ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeTab, shouldReduce]);

  const tabs = [
    { id: 'DATASETS', label: 'Dataset Snapshots', icon: Database, badge: datasetVersions.length },
    { id: 'EXPLORER', label: 'Dataset Record Explorer', icon: Search, badge: explorerResults.length },
    { id: 'PUBLICATIONS', label: 'Canonical Publications', icon: BookOpen, badge: publications.length },
    { id: 'RESEARCHERS', label: 'Researchers & IDs', icon: Users, badge: researcherProfiles.length },
    { id: 'PATENTS', label: 'Patents & IPR', icon: Lightbulb, badge: patents.length },
    { id: 'INGESTION', label: 'Authorized File Import', icon: UploadCloud },
    { id: 'REVIEW_QUEUE', label: 'Match Review Queue', icon: AlertTriangle, badge: matchReviewQueue.length, alert: matchReviewQueue.length > 0 }
  ];

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: '#0B192C',
              color: '#FFFFFF',
              border: '1px solid #D4AF37',
              borderRadius: '8px',
              padding: '0.8rem 1.4rem',
              zIndex: 9999,
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <Sparkles size={16} color="#F1C40F" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Institutional Header */}
      <motion.div 
        initial={shouldReduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        style={{
          background: 'linear-gradient(135deg, #070F1E 0%, #0B192C 60%, #122846 100%)',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          color: '#FFFFFF',
          border: '1px solid #D4AF37',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.2rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F1C40F'
          }}>
            <Database size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#FFFFFF', fontFamily: 'Cinzel, Georgia, serif', letterSpacing: '0.5px' }}>
                Institutional Research Data Hub & Offline Index
              </h1>
              <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.55rem', borderRadius: '4px', background: '#2563EB', color: '#FFFFFF', fontWeight: 800 }}>
                OFFLINE PUBLIC SNAPSHOTS
              </span>
              <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.55rem', borderRadius: '4px', background: '#059669', color: '#FFFFFF', fontWeight: 800 }}>
                CANONICAL MULTI-PROVENANCE
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#CBD5E1', margin: 0 }}>
              Deterministic offline indexing from OpenAlex, Crossref, and ORCID snapshots. Authorized institutional file ingestion for Scopus & Web of Science with complete provenance.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <motion.button
            type="button"
            onClick={() => {
              setExplorerSourceFilter('ALL');
              setExplorerTypeFilter('ALL');
              setActiveTab('EXPLORER');
              requestAnimationFrame(() => {
                universalSearchRef.current?.focus();
                universalSearchRef.current?.scrollIntoView({ behavior: shouldReduce ? 'auto' : 'smooth', block: 'center' });
              });
            }}
            whileHover={shouldReduce ? undefined : { y: -2, scale: 1.015 }}
            whileTap={shouldReduce ? undefined : { scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              outline: 'none'
            }}
          >
            <Search size={15} />
            <span>Universal Search</span>
          </motion.button>

          <motion.button
            type="button"
            disabled={isRefreshing}
            aria-busy={isRefreshing}
            aria-disabled={isRefreshing}
            onClick={refreshAll}
            whileHover={shouldReduce || isRefreshing ? undefined : { y: -2, scale: 1.015 }}
            whileTap={shouldReduce || isRefreshing ? undefined : { scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              padding: '0.6rem 0.9rem',
              borderRadius: '8px',
              background: '#D4AF37',
              border: 'none',
              color: '#070F1E',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              opacity: isRefreshing ? 0.75 : 1,
              outline: 'none'
            }}
          >
            <motion.div
              animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={isRefreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0.2 }}
              style={{ display: 'flex' }}
            >
              <RefreshCw size={15} />
            </motion.div>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Store'}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Real Aggregate Institutional KPIs (Interactive Links to Respective Tabs) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* KPI 1: Publications */}
        <motion.div
          initial={shouldReduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, delay: 0 }}
          whileHover={shouldReduce ? undefined : { y: -3 }}
          whileTap={shouldReduce ? undefined : { scale: 0.985 }}
          onClick={() => setActiveTab('PUBLICATIONS')}
          role="button"
          tabIndex={0}
          aria-label="View Verified Publications"
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '1.1rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Verified Publications</span>
            <BookOpen size={18} color="#2563EB" />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0F172A', fontFamily: 'Cinzel, serif' }}>
            <MotionNumber value={summaryKpis.verifiedPubs} />
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: '0.2rem' }}>
            {summaryKpis.scopusWosPubs} Scopus / WoS indexed
          </div>
        </motion.div>

        {/* KPI 2: Patents */}
        <motion.div
          initial={shouldReduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, delay: shouldReduce ? 0 : 0.045 }}
          whileHover={shouldReduce ? undefined : { y: -3 }}
          whileTap={shouldReduce ? undefined : { scale: 0.985 }}
          onClick={() => setActiveTab('PATENTS')}
          role="button"
          tabIndex={0}
          aria-label="View Institutional Patents"
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '1.1rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Institutional Patents</span>
            <Lightbulb size={18} color="#D97706" />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0F172A', fontFamily: 'Cinzel, serif' }}>
            <MotionNumber value={summaryKpis.totalPatents} />
          </div>
          <div style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 600, marginTop: '0.2rem' }}>
            {summaryKpis.grantedPatents} Granted by Indian Patent Office
          </div>
        </motion.div>

        {/* KPI 3: Researchers */}
        <motion.div
          initial={shouldReduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, delay: shouldReduce ? 0 : 0.09 }}
          whileHover={shouldReduce ? undefined : { y: -3 }}
          whileTap={shouldReduce ? undefined : { scale: 0.985 }}
          onClick={() => setActiveTab('RESEARCHERS')}
          role="button"
          tabIndex={0}
          aria-label="View Researchers with IDs"
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '1.1rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Researchers with IDs</span>
            <Users size={18} color="#7C3AED" />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0F172A', fontFamily: 'Cinzel, serif' }}>
            <MotionNumber value={summaryKpis.researchersWithOrcid} />
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7C3AED', fontWeight: 600, marginTop: '0.2rem' }}>
            {summaryKpis.researchersWithScopus} with Scopus Author IDs
          </div>
        </motion.div>

        {/* KPI 4: Match Review Queue */}
        <motion.div 
          initial={shouldReduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, delay: shouldReduce ? 0 : 0.135 }}
          whileHover={shouldReduce ? undefined : { y: -3 }}
          whileTap={shouldReduce ? undefined : { scale: 0.985 }}
          onClick={() => setActiveTab('REVIEW_QUEUE')}
          role="button"
          tabIndex={0}
          aria-label="View Match Review Queue"
          style={{ 
            background: summaryKpis.pendingReviews > 0 ? '#FEF2F2' : '#FFFFFF', 
            borderRadius: '12px', 
            padding: '1.1rem', 
            border: summaryKpis.pendingReviews > 0 ? '1px solid #FCA5A5' : '1px solid #E2E8F0', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: summaryKpis.pendingReviews > 0 ? '#DC2626' : '#64748B', textTransform: 'uppercase' }}>Match Review Queue</span>
            <AlertTriangle size={18} color={summaryKpis.pendingReviews > 0 ? '#DC2626' : '#94A3B8'} />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: summaryKpis.pendingReviews > 0 ? '#DC2626' : '#0F172A', fontFamily: 'Cinzel, serif' }}>
            <MotionNumber value={summaryKpis.pendingReviews} />
          </div>
          <div style={{ fontSize: '0.72rem', color: summaryKpis.pendingReviews > 0 ? '#B91C1C' : '#64748B', fontWeight: 600, marginTop: '0.2rem' }}>
            {summaryKpis.pendingReviews > 0 ? 'Click to resolve author linkages' : 'All match linkages verified'}
          </div>
        </motion.div>
      </div>

      {/* Main Tab Navigation */}
      <div 
        ref={tabStripRef}
        role="tablist"
        style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          borderBottom: '2px solid #E2E8F0', 
          paddingBottom: '0.5rem', 
          overflowX: 'auto',
          scrollbarWidth: 'thin',
          scrollSnapType: 'x proximity'
        }}
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              id={`research-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              whileHover={shouldReduce ? undefined : { y: -1 }}
              whileTap={shouldReduce ? undefined : { scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'relative',
                padding: '0.65rem 1.1rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#0B192C' : 'transparent',
                color: isActive ? '#FFFFFF' : '#64748B',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                minWidth: 'max-content',
                scrollSnapAlign: 'start',
                outline: 'none'
              }}
            >
              <motion.div
                animate={shouldReduce ? undefined : { scale: isActive ? 1.05 : 1 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <Icon size={16} color={isActive ? '#D4AF37' : 'currentColor'} />
              </motion.div>
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '12px',
                  background: isActive ? '#D4AF37' : (tab.alert ? '#FEE2E2' : '#F1F5F9'),
                  color: isActive ? '#070F1E' : (tab.alert ? '#DC2626' : '#475569'),
                  fontWeight: 800
                }}>
                  {tab.badge}
                </span>
              )}

              {/* Active Tab Floating Underline Indicator */}
              {isActive && (
                <motion.div
                  layoutId={shouldReduce ? undefined : "research-active-tab"}
                  style={{
                    position: 'absolute',
                    bottom: '-0.55rem',
                    left: '10%',
                    right: '10%',
                    height: '3px',
                    background: '#D4AF37',
                    borderRadius: '3px 3px 0 0'
                  }}
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Tab Panels with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          role="tabpanel"
          aria-labelledby={`research-tab-${activeTab}`}
          initial={shouldReduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduce ? false : { opacity: 0, y: -4 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%' }}
        >

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: DATASET SNAPSHOT CARDS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'DATASETS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Offline Index Snapshots & External Dataset Registries
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Click on any dataset card or record count to drill down into the underlying matched records.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.2rem' }}>
            {datasetVersions.map(ds => {
              return (
                <div
                  key={ds.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                    padding: '1.4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                      <div>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: ds.source === 'OPENALEX' ? '#EFF6FF' : (ds.source === 'CROSSREF' ? '#F0FDF4' : '#FAF5FF'),
                          color: ds.source === 'OPENALEX' ? '#1D4ED8' : (ds.source === 'CROSSREF' ? '#15803D' : '#7E22CE'),
                          textTransform: 'uppercase'
                        }}>
                          {ds.source}
                        </span>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '0.4rem 0 0.1rem 0' }}>
                          {ds.name}
                        </h3>
                      </div>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#059669',
                        background: '#ECFDF5',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '12px'
                      }}>
                        <CheckCircle2 size={13} />
                        {ds.status}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4, margin: '0 0 1rem 0' }}>
                      {ds.description}
                    </p>

                    {/* Metadata Grid */}
                    <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.74rem' }}>
                      <div>
                        <span style={{ color: '#94A3B8', display: 'block' }}>Snapshot Version</span>
                        <strong style={{ color: '#334155' }}>{ds.datasetVersion}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8', display: 'block' }}>Global Corpus Scope</span>
                        <strong style={{ color: '#334155' }}>{ds.totalGlobalRecords}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8', display: 'block' }}>Ingested Date</span>
                        <strong style={{ color: '#334155' }}>{ds.ingestedAt?.slice(0, 10) || '2026-06-15'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8', display: 'block' }}>Provenance Mode</span>
                        <strong style={{ color: '#059669' }}>Offline Verified</strong>
                      </div>
                    </div>

                    {/* Relevant Records Clickable Trigger */}
                    <div 
                      onClick={() => handleDrilldown(ds.source)}
                      style={{
                        marginTop: '0.9rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#1E40AF', fontWeight: 600, display: 'block' }}>
                          Matched Institutional NEC Records
                        </span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1D4ED8' }}>
                          {ds.relevantRecordCount} Records
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#1D4ED8', fontWeight: 700, fontSize: '0.75rem' }}>
                        <span>Explore</span>
                        <ArrowUpRight size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Checksum & Action */}
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#94A3B8' }}>
                      <Shield size={13} color="#D4AF37" />
                      <span title={ds.checksum} style={{ fontFamily: 'monospace' }}>
                        {ds.checksum ? `${ds.checksum.slice(0, 18)}...` : 'sha256:verified'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDrilldown(ds.source)}
                      style={{
                        background: '#0B192C',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      Browse Records
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Authorized Scopus CSV Card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#FFFBEB', color: '#B45309' }}>
                      ELSEVIER SCOPUS
                    </span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '0.4rem 0 0.1rem 0' }}>
                      Authorized Scopus Export Ingestion
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.55rem', borderRadius: '12px' }}>
                    AUTHORIZED
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4, margin: '0 0 1rem 0' }}>
                  Institutional exports containing verified Scopus Electronic Identifiers (EIDs), citations, and indexed author mappings.
                </p>
                <div 
                  onClick={() => handleDrilldown('SCOPUS_IMPORT')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#92400E', fontWeight: 600, display: 'block' }}>
                      Ingested Scopus Publications
                    </span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#B45309' }}>
                      {publications.filter(p => p.isScopusIndexed || p.sources?.includes('SCOPUS_IMPORT')).length} Records
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#B45309', fontWeight: 700, fontSize: '0.75rem' }}>
                    <span>Explore</span>
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setIngestionSourceType('SCOPUS');
                  setActiveTab('INGESTION');
                }}
                style={{
                  background: '#B45309',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <UploadCloud size={15} />
                Ingest Scopus CSV Export
              </button>
            </div>

            {/* Authorized Web of Science Card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#F0FDF4', color: '#166534' }}>
                      CLARIVATE WOS
                    </span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '0.4rem 0 0.1rem 0' }}>
                      Web of Science Export Ingestion
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.55rem', borderRadius: '12px' }}>
                    AUTHORIZED
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4, margin: '0 0 1rem 0' }}>
                  Official Web of Science Core Collection tab-delimited and CSV records with Unique Accession Numbers (UT/UID).
                </p>
                <div 
                  onClick={() => handleDrilldown('WOS_IMPORT')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600, display: 'block' }}>
                      Ingested WoS Publications
                    </span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803D' }}>
                      {publications.filter(p => p.isWosIndexed || p.sources?.includes('WOS_IMPORT')).length} Records
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#15803D', fontWeight: 700, fontSize: '0.75rem' }}>
                    <span>Explore</span>
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setIngestionSourceType('WOS');
                  setActiveTab('INGESTION');
                }}
                style={{
                  background: '#15803D',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <UploadCloud size={15} />
                Ingest WoS Export File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: DATASET RECORD EXPLORER (SEARCH & FILTER) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'EXPLORER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Header & Breadcrumb */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Dataset Record Explorer
                </h2>
                <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '12px', background: '#0B192C', color: '#FFFFFF', fontWeight: 800 }}>
                  {explorerResults.length} Matched Records
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Filter across publications, researchers, identifiers, and institutional patents.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => exportToCSV(explorerResults, 'NEC_Research_Explorer_Export')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Download size={14} />
                Export CSV
              </button>
              <button
                onClick={() => exportToExcel(explorerResults, 'NEC_Research_Explorer_Export', 'Research_Explorer')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <FileSpreadsheet size={14} />
                Export Excel
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '1rem',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                ref={universalSearchRef}
                type="text"
                placeholder="Universal Search: Title, Author, DOI, ORCID, Scopus EID, WoS UID, OpenAlex ID, Patent Application No..."
                value={explorerSearch}
                onChange={(e) => setExplorerSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem 0.65rem 2.4rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {explorerSearch && (
                <button
                  onClick={() => setExplorerSearch('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
                <Filter size={14} /> Filters:
              </div>

              {/* Source Filter */}
              <select
                value={explorerSourceFilter}
                onChange={(e) => setExplorerSourceFilter(e.target.value)}
                style={{ padding: '0.4rem 0.7rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.76rem', background: '#FFFFFF', color: '#334155', fontWeight: 600 }}
              >
                <option value="ALL">Source: All Data Sources</option>
                <option value="OPENALEX">OpenAlex Public Snapshot</option>
                <option value="CROSSREF">Crossref DOI Registry</option>
                <option value="ORCID">ORCID Public File</option>
                <option value="SCOPUS_IMPORT">Scopus Ingested</option>
                <option value="WOS_IMPORT">Web of Science Ingested</option>
                <option value="PATENTS">Verified Institutional Patents</option>
              </select>

              {/* Record Type Filter */}
              <select
                value={explorerTypeFilter}
                onChange={(e) => setExplorerTypeFilter(e.target.value)}
                style={{ padding: '0.4rem 0.7rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.76rem', background: '#FFFFFF', color: '#334155', fontWeight: 600 }}
              >
                <option value="ALL">Type: All Record Types</option>
                <option value="PUBLICATION">Publications & Articles</option>
                <option value="RESEARCHER">Researchers & Identifiers</option>
                <option value="PATENT">Patents & IPR</option>
              </select>

              {/* Department Filter */}
              <select
                value={explorerDeptFilter}
                onChange={(e) => setExplorerDeptFilter(e.target.value)}
                style={{ padding: '0.4rem 0.7rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.76rem', background: '#FFFFFF', color: '#334155', fontWeight: 600 }}
              >
                <option value="ALL">Department: All Departments</option>
                {DEPARTMENTS.map(d => (
                  <option key={d.code} value={d.code}>{d.name} ({d.code})</option>
                ))}
              </select>

              {/* Match Status */}
              <select
                value={explorerMatchStatusFilter}
                onChange={(e) => setExplorerMatchStatusFilter(e.target.value)}
                style={{ padding: '0.4rem 0.7rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.76rem', background: '#FFFFFF', color: '#334155', fontWeight: 600 }}
              >
                <option value="ALL">Match Status: All Statuses</option>
                <option value="VERIFIED_NEC_MATCH">Verified NEC Match</option>
                <option value="POSSIBLE_NEC_MATCH">Possible NEC Match (Review)</option>
              </select>

              {(explorerSourceFilter !== 'ALL' || explorerTypeFilter !== 'ALL' || explorerDeptFilter !== 'ALL' || explorerMatchStatusFilter !== 'ALL' || explorerSearch) && (
                <button
                  onClick={() => {
                    setExplorerSourceFilter('ALL');
                    setExplorerTypeFilter('ALL');
                    setExplorerDeptFilter('ALL');
                    setExplorerMatchStatusFilter('ALL');
                    setExplorerSearch('');
                  }}
                  style={{
                    padding: '0.4rem 0.7rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#F1F5F9',
                    color: '#64748B',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Results Grid / Cards */}
          {explorerResults.length === 0 ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '3rem',
              textAlign: 'center',
              border: '1px dashed #CBD5E1'
            }}>
              <Search size={36} color="#94A3B8" style={{ margin: '0 auto 0.8rem auto', display: 'block' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#334155', margin: 0 }}>No matching research records found</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.3rem' }}>
                Try adjusting your search keywords or clearing active dataset filters.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {explorerResults.map((item, idx) => {
                if (item.itemType === 'PUBLICATION') {
                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '1.3rem',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.8rem'
                      }}
                    >
                      {/* Top Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#0B192C', color: '#FFFFFF' }}>
                            {item.publicationRecordNumber || 'PUB-RECORD'}
                          </span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8' }}>
                            {item.publicationType || 'Journal Article'}
                          </span>
                          {item.department && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#F1F5F9', color: '#475569' }}>
                              Dept: {item.department}
                            </span>
                          )}
                          {item.publicationYear && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#F8FAFC', color: '#64748B' }}>
                              Year: {item.publicationYear}
                            </span>
                          )}
                        </div>

                        {/* Provenance Source Tags */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {(item.sources || ['MANUAL']).map(src => (
                            <span
                              key={src}
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '0.12rem 0.45rem',
                                borderRadius: '4px',
                                background: src.includes('SCOPUS') ? '#FFFBEB' : (src.includes('WOS') ? '#F0FDF4' : '#F1F5F9'),
                                color: src.includes('SCOPUS') ? '#B45309' : (src.includes('WOS') ? '#15803D' : '#334155'),
                                border: '1px solid rgba(0,0,0,0.05)'
                              }}
                            >
                              {src}
                            </span>
                          ))}
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '0.12rem 0.45rem',
                            borderRadius: '4px',
                            background: item.workflowStatus === 'APPROVED' ? '#ECFDF5' : '#FEF3C7',
                            color: item.workflowStatus === 'APPROVED' ? '#059669' : '#D97706'
                          }}>
                            {item.workflowStatus}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.4 }}>
                        {item.title}
                      </h3>

                      {/* Journal / Venue */}
                      {item.journalName && (
                        <div style={{ fontSize: '0.8rem', color: '#475569', fontStyle: 'italic' }}>
                          Published in: <strong>{item.journalName}</strong> {item.publisher && `(${item.publisher})`}
                          {item.volume && ` • Vol: ${item.volume}`}
                          {item.pages && ` • Pages: ${item.pages}`}
                        </div>
                      )}

                      {/* Authors Roster */}
                      {Array.isArray(item.authors) && item.authors.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>Authors:</span>
                          {item.authors.map((auth, aIdx) => (
                            <span
                              key={aIdx}
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '12px',
                                background: auth.facultyId ? '#ECFDF5' : '#F8FAFC',
                                color: auth.facultyId ? '#065F46' : '#334155',
                                border: auth.facultyId ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                                fontWeight: auth.facultyId ? 700 : 500
                              }}
                            >
                              {auth.name}
                              {auth.facultyId && ' (NEC Faculty)'}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Identifiers & Copy Buttons Bar */}
                      <div style={{
                        background: '#F8FAFC',
                        borderRadius: '8px',
                        padding: '0.6rem 0.8rem',
                        display: 'flex',
                        gap: '0.8rem',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        border: '1px solid #F1F5F9'
                      }}>
                        {/* DOI */}
                        {item.doi && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem' }}>
                            <span style={{ fontWeight: 700, color: '#64748B' }}>DOI:</span>
                            <a
                              href={`https://doi.org/${item.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.15rem' }}
                            >
                              {item.doi}
                              <ExternalLink size={11} />
                            </a>
                            <button
                              onClick={() => handleCopy(item.doi, 'DOI')}
                              title="Copy DOI"
                              style={{ background: 'none', border: 'none', color: copiedId === item.doi ? '#059669' : '#94A3B8', cursor: 'pointer', padding: '2px' }}
                            >
                              {copiedId === item.doi ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                          </div>
                        )}

                        {/* Scopus EID */}
                        {item.scopusEid && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem' }}>
                            <span style={{ fontWeight: 700, color: '#B45309' }}>Scopus EID:</span>
                            <span style={{ fontFamily: 'monospace', color: '#78350F' }}>{item.scopusEid}</span>
                            <button
                              onClick={() => handleCopy(item.scopusEid, 'Scopus EID')}
                              title="Copy Scopus EID"
                              style={{ background: 'none', border: 'none', color: copiedId === item.scopusEid ? '#059669' : '#94A3B8', cursor: 'pointer', padding: '2px' }}
                            >
                              {copiedId === item.scopusEid ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                          </div>
                        )}

                        {/* WoS UID */}
                        {item.wosUid && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem' }}>
                            <span style={{ fontWeight: 700, color: '#15803D' }}>WoS UID:</span>
                            <span style={{ fontFamily: 'monospace', color: '#14532D' }}>{item.wosUid}</span>
                            <button
                              onClick={() => handleCopy(item.wosUid, 'WoS UID')}
                              title="Copy WoS UID"
                              style={{ background: 'none', border: 'none', color: copiedId === item.wosUid ? '#059669' : '#94A3B8', cursor: 'pointer', padding: '2px' }}
                            >
                              {copiedId === item.wosUid ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                          </div>
                        )}

                        {/* OpenAlex ID */}
                        {item.openalexWorkId && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem' }}>
                            <span style={{ fontWeight: 700, color: '#1E40AF' }}>OpenAlex:</span>
                            <a
                              href={`https://openalex.org/${item.openalexWorkId.replace('https://openalex.org/', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#1E40AF', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.15rem' }}
                            >
                              {item.openalexWorkId.replace('https://openalex.org/', '')}
                              <ExternalLink size={11} />
                            </a>
                            <button
                              onClick={() => handleCopy(item.openalexWorkId, 'OpenAlex ID')}
                              title="Copy OpenAlex ID"
                              style={{ background: 'none', border: 'none', color: copiedId === item.openalexWorkId ? '#059669' : '#94A3B8', cursor: 'pointer', padding: '2px' }}
                            >
                              {copiedId === item.openalexWorkId ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                          </div>
                        )}

                        {/* Citations */}
                        {item.openalexCitations?.count !== undefined && (
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1E40AF', background: '#EFF6FF', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            OpenAlex Citations: {item.openalexCitations.count}
                          </span>
                        )}
                        {item.scopusCitations?.count !== undefined && (
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#B45309', background: '#FFFBEB', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            Scopus Citations: {item.scopusCitations.count}
                          </span>
                        )}
                      </div>

                      {/* Bottom Actions */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.2rem' }}>
                        <button
                          onClick={() => setSelectedPublication(item)}
                          style={{
                            background: '#0B192C',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.45rem 0.85rem',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Eye size={14} />
                          View Complete Dossier
                        </button>
                      </div>
                    </div>
                  );
                } else if (item.itemType === 'RESEARCHER') {
                  return (
                    <div
                      key={item.facultyId || idx}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '1.3rem',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#7C3AED', color: '#FFFFFF' }}>
                            {item.facultyId}
                          </span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#F3E8FF', color: '#7C3AED' }}>
                            {item.department}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                          {item.name}
                        </h3>
                        <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '0.2rem 0 0.5rem 0' }}>
                          {item.designation} • {item.department} Department
                        </p>

                        {/* Research IDs Badges */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {item.orcid && (
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, background: '#F0FDF4', color: '#166534', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              ORCID: {item.orcid}
                            </span>
                          )}
                          {item.scopusAuthorId && (
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, background: '#FFFBEB', color: '#B45309', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              Scopus ID: {item.scopusAuthorId}
                            </span>
                          )}
                          {item.wosResearcherId && (
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, background: '#EFF6FF', color: '#1D4ED8', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #BFDBFE' }}>
                              WoS ID: {item.wosResearcherId}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedResearcher(item)}
                        style={{
                          background: '#7C3AED',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Users size={14} />
                        View Researcher Profile
                      </button>
                    </div>
                  );
                } else if (item.itemType === 'PATENT') {
                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '1.3rem',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.8rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#D97706', color: '#FFFFFF' }}>
                            {item.patentRecordNumber}
                          </span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#FEF3C7', color: '#92400E' }}>
                            {item.legalStatus}
                          </span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#F1F5F9', color: '#475569' }}>
                            Dept: {item.department}
                          </span>
                        </div>

                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                          App Date: {item.applicationDate || item.filingDate}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        {item.title}
                      </h3>

                      <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                        Technology Domain: <strong>{item.technologyDomain}</strong>
                      </div>

                      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', background: '#F8FAFC', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.74rem' }}>
                        <div>Application No: <strong>{item.applicationNumber}</strong></div>
                        {item.grantNumber && <div>Grant No: <strong style={{ color: '#059669' }}>{item.grantNumber}</strong></div>}
                        {item.publicationNumber && <div>Journal Pub No: <strong>{item.publicationNumber}</strong></div>}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: CANONICAL PUBLICATIONS LIBRARY */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'PUBLICATIONS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Canonical Institutional Publications Library
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Deduplicated master records linked to multiple source snapshot identifiers.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => exportToCSV(publications, 'NEC_Canonical_Publications')}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Download size={14} />
                Export CSV
              </button>
              <button
                onClick={() => exportToExcel(publications, 'NEC_Canonical_Publications', 'Publications')}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <FileSpreadsheet size={14} />
                Export Excel
              </button>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Record #</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Publication Title</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Journal / Venue</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Authors</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Identifiers</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Sources</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {publications.map((p, idx) => (
                  <tr key={p.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0B192C', whiteSpace: 'nowrap' }}>
                      {p.publicationRecordNumber}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', maxWidth: '320px' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                        {p.title}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', maxWidth: '200px' }}>
                      <div style={{ fontSize: '0.76rem', color: '#475569' }}>
                        {p.journalName || p.conferenceName || 'Journal Article'} {p.publicationYear ? `(${p.publicationYear})` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontSize: '0.76rem', color: '#334155' }}>
                        {(p.authors || []).map(a => a.name).join(', ')}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.72rem' }}>
                        {p.doi && <div>DOI: <strong style={{ color: '#2563EB' }}>{p.doi}</strong></div>}
                        {p.scopusEid && <div>EID: <strong style={{ color: '#B45309' }}>{p.scopusEid}</strong></div>}
                        {p.wosUid && <div>WOS: <strong style={{ color: '#15803D' }}>{p.wosUid}</strong></div>}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
                        {(p.sources || ['MANUAL']).map(s => (
                          <span key={s} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '3px', background: '#F1F5F9', color: '#334155', fontWeight: 700 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: p.workflowStatus === 'APPROVED' ? '#ECFDF5' : '#FEF3C7',
                        color: p.workflowStatus === 'APPROVED' ? '#059669' : '#D97706'
                      }}>
                        {p.workflowStatus}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => setSelectedPublication(p)}
                        style={{
                          background: '#0B192C',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 4: RESEARCHERS & RESEARCH IDENTIFIERS ROSTER */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'RESEARCHERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Institutional Researcher Profiles & Persistent Identifiers
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Verified ORCID, Scopus Author ID, Web of Science ResearcherID, Google Scholar, and Vidwan mappings.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem' }}>
            {researcherProfiles.map(prof => {
              const facultyPubsCount = publications.filter(p => p.authors?.some(a => a.facultyId === prof.facultyId || a.name === prof.name)).length;
              const facultyPatentsCount = patents.filter(pat => pat.inventors?.some(inv => inv.facultyId === prof.facultyId || inv.name === prof.name)).length;

              return (
                <div
                  key={prof.facultyId}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '1.3rem',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.9rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '4px', background: '#7C3AED', color: '#FFFFFF' }}>
                          {prof.facultyId}
                        </span>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0.3rem 0 0 0' }}>
                          {prof.name}
                        </h3>
                        <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                          {prof.designation} • Dept of {prof.department}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>{facultyPubsCount}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>Publications</div>
                      </div>
                    </div>

                    {/* Identifiers List */}
                    <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.74rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>ORCID:</span>
                        {prof.orcid ? (
                          <span style={{ color: '#166534', fontWeight: 700, fontFamily: 'monospace' }}>{prof.orcid}</span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Not registered</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>Scopus Author ID:</span>
                        {prof.scopusAuthorId ? (
                          <span style={{ color: '#B45309', fontWeight: 700, fontFamily: 'monospace' }}>{prof.scopusAuthorId}</span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Not linked</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>WoS ResearcherID:</span>
                        {prof.wosResearcherId ? (
                          <span style={{ color: '#1D4ED8', fontWeight: 700, fontFamily: 'monospace' }}>{prof.wosResearcherId}</span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Not linked</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>Vidwan ID:</span>
                        {prof.vidwanId ? (
                          <span style={{ color: '#0F172A', fontWeight: 700 }}>{prof.vidwanId}</span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Not linked</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '0.6rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 700 }}>
                      {facultyPatentsCount > 0 ? `${facultyPatentsCount} Patent(s)` : ''}
                    </span>

                    <button
                      onClick={() => setEditProfileModalFaculty(prof)}
                      style={{
                        background: '#0B192C',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Edit / Verify IDs
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 5: PATENTS & IPR GOVERNANCE */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'PATENTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Institutional Patents & Intellectual Property (IPR) Repository
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Verified Indian Patent Office records. Patents are managed exclusively from the institutional patent database.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => exportToCSV(patents, 'NEC_Institutional_Patents')}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Download size={14} />
                Export CSV
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.2rem' }}>
            {patents.map(pat => (
              <div
                key={pat.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '1.4rem',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#D97706', color: '#FFFFFF' }}>
                      {pat.patentRecordNumber}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.55rem',
                      borderRadius: '12px',
                      background: pat.legalStatus === 'GRANTED' ? '#ECFDF5' : '#FEF3C7',
                      color: pat.legalStatus === 'GRANTED' ? '#059669' : '#B45309'
                    }}>
                      {pat.legalStatus}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.4rem 0', lineHeight: 1.35 }}>
                    {pat.title}
                  </h3>

                  <div style={{ fontSize: '0.76rem', color: '#64748B', marginBottom: '0.8rem' }}>
                    Domain: <strong style={{ color: '#334155' }}>{pat.technologyDomain}</strong> • Dept: <strong>{pat.department}</strong>
                  </div>

                  <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.74rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Application Number:</span>
                      <strong>{pat.applicationNumber}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Filing Date:</span>
                      <strong>{pat.filingDate || pat.applicationDate}</strong>
                    </div>
                    {pat.grantNumber && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#059669', fontWeight: 700 }}>Patent Grant Number:</span>
                        <strong style={{ color: '#059669' }}>{pat.grantNumber}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.8rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Inventors:
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {(pat.inventors || []).map((inv, iIdx) => (
                      <span
                        key={iIdx}
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.12rem 0.45rem',
                          borderRadius: '4px',
                          background: '#EFF6FF',
                          color: '#1E40AF',
                          fontWeight: 600
                        }}
                      >
                        {inv.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 6: AUTHORIZED FILE INGESTION (SCOPUS & WOS) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'INGESTION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '1000px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Authorized File Ingestion Engine (Scopus CSV & Web of Science Export)
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
              Ingest institutional exports with zero fake author substitution. Extracts authentic author names, affiliations, DOIs, EIDs, and citation metrics.
            </p>
          </div>

          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            {/* Format Selection */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem' }}>
              <button
                onClick={() => {
                  setIngestionSourceType('SCOPUS');
                  setParsedRecords(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: ingestionSourceType === 'SCOPUS' ? '2px solid #B45309' : '1px solid #E2E8F0',
                  background: ingestionSourceType === 'SCOPUS' ? '#FFFBEB' : '#FFFFFF',
                  color: ingestionSourceType === 'SCOPUS' ? '#B45309' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <FileSpreadsheet size={18} />
                Elsevier Scopus Export (CSV)
              </button>

              <button
                onClick={() => {
                  setIngestionSourceType('WOS');
                  setParsedRecords(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: ingestionSourceType === 'WOS' ? '2px solid #15803D' : '1px solid #E2E8F0',
                  background: ingestionSourceType === 'WOS' ? '#F0FDF4' : '#FFFFFF',
                  color: ingestionSourceType === 'WOS' ? '#15803D' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Globe size={18} />
                Clarivate Web of Science Export (Tab/CSV)
              </button>
            </div>

            {/* File Upload / Drag and Drop */}
            <div style={{
              border: '2px dashed #CBD5E1',
              borderRadius: '10px',
              padding: '1.5rem',
              textAlign: 'center',
              background: '#F8FAFC',
              marginBottom: '1rem'
            }}>
              <UploadCloud size={32} color="#64748B" style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                Select or drop your official export file (.csv, .txt, .tsv)
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.2rem 0 0.8rem 0' }}>
                Computes cryptographic SHA-256 hash automatically to prevent duplicate ingestion jobs.
              </p>

              <input
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileUpload}
                style={{ fontSize: '0.8rem' }}
              />
            </div>

            {/* Fallback Paste Input */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                Or Paste Export File Text Content:
              </label>
              <textarea
                rows={5}
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
                placeholder="Paste CSV header and rows here..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Parse Error */}
            {parseError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem', marginBottom: '1rem' }}>
                <strong>Error:</strong> {parseError}
              </div>
            )}

            {/* Success Result */}
            {importResult && (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.9rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} color="#059669" />
                <span>{importResult.message}</span>
              </div>
            )}

            {/* Parse Button */}
            {!parsedRecords && (
              <button
                onClick={() => executeParse(uploadText, ingestionSourceType, uploadFileName || 'pasted_input.txt', uploadFileSha)}
                style={{
                  background: '#0B192C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.65rem 1.2rem',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Parse & Validate Records
              </button>
            )}

            {/* Ingestion Preview Table */}
            {parsedRecords && (
              <div style={{ marginTop: '1.2rem', borderTop: '2px solid #E2E8F0', paddingTop: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Validation Preview ({parsedRecords.length} records parsed)
                    </h3>
                    <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                      File Hash: <span style={{ fontFamily: 'monospace' }}>{uploadFileSha || 'Computed in-memory'}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleExecuteImport}
                    disabled={importing}
                    style={{
                      background: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.65rem 1.4rem',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: importing ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <CheckSquare size={16} />
                    {importing ? 'Ingesting...' : 'Confirm & Ingest Records'}
                  </button>
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                    <thead style={{ background: '#F8FAFC', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>#</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Title</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Authors Extracted</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>DOI / Identifier</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRecords.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.5rem', fontWeight: 700 }}>{i + 1}</td>
                          <td style={{ padding: '0.5rem', fontWeight: 600 }}>{r.title}</td>
                          <td style={{ padding: '0.5rem', color: '#475569' }}>
                            {(r.authors || []).map(a => a.name).join('; ')}
                          </td>
                          <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{r.doi || r.scopusEid || r.wosUid || '—'}</td>
                          <td style={{ padding: '0.5rem' }}>{r.publicationYear || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 7: MATCH REVIEW QUEUE (ADMIN / HOD RESOLUTION) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'REVIEW_QUEUE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Institutional Match Review Queue ({matchReviewQueue.length} Pending Records)
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
              Review imported works with candidate author matches, link authors to verified NEC faculty, or confirm external co-authors.
            </p>
          </div>

          {matchReviewQueue.length === 0 ? (
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '3rem', textAlign: 'center', border: '1px dashed #CBD5E1' }}>
              <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 0.8rem auto', display: 'block' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Review Queue is Clear</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.3rem' }}>
                All publication authors and source metadata have been resolved.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {matchReviewQueue.map(item => (
                <div
                  key={item.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '1.3rem',
                    border: '1px solid #FDE68A',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#FEF3C7', color: '#92400E' }}>
                        NEEDS AUTHOR CONFIRMATION
                      </span>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '0.4rem 0 0.2rem 0' }}>
                        {item.title}
                      </h3>
                      <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                        DOI: <strong>{item.doi || '—'}</strong> • Source: <strong>{item.sources?.join(', ')}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        reviewPublication(item.id, 'APPROVE', 'Approved by Admin in Match Review Queue', currentUser);
                        refreshAll();
                        showToast('Publication approved & verified!');
                      }}
                      style={{
                        background: '#059669',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Approve Record
                    </button>
                  </div>

                  {/* Authors Resolution Roster */}
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.8rem' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                      Author Linkage Resolution:
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(item.authors || []).map((auth, aIdx) => (
                        <div
                          key={aIdx}
                          style={{
                            background: '#F8FAFC',
                            borderRadius: '6px',
                            padding: '0.5rem 0.8rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            fontSize: '0.76rem'
                          }}
                        >
                          <div>
                            <strong>{auth.name}</strong> ({auth.affiliation || 'Affiliation unstated'})
                            {auth.facultyId && <span style={{ color: '#059669', fontWeight: 700, marginLeft: '0.5rem' }}>• Linked to {auth.facultyId}</span>}
                          </div>

                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  resolveResearchMatch(item.id, auth.authorOrder, e.target.value, 'LINK_FACULTY', currentUser);
                                  refreshAll();
                                  showToast(`Linked author to ${e.target.value}`);
                                }
                              }}
                              style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.72rem' }}
                            >
                              <option value="">Link to Faculty...</option>
                              {FACULTY_DATA.map(f => (
                                <option key={f.id} value={f.id}>{f.name} ({f.department})</option>
                              ))}
                            </select>

                            <button
                              onClick={() => {
                                resolveResearchMatch(item.id, auth.authorOrder, null, 'MARK_EXTERNAL', currentUser);
                                refreshAll();
                                showToast('Marked as external author.');
                              }}
                              style={{
                                background: '#F1F5F9',
                                border: '1px solid #CBD5E1',
                                color: '#475569',
                                borderRadius: '4px',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              External
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
        </motion.div>
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* PUBLICATION DOSSIER MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedPublication && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(7, 15, 30, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '850px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#0B192C', color: '#FFFFFF' }}>
                  {selectedPublication.publicationRecordNumber}
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0.4rem 0 0.2rem 0', lineHeight: 1.3 }}>
                  {selectedPublication.title}
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  {selectedPublication.journalName} ({selectedPublication.publicationYear})
                </div>
              </div>

              <button
                onClick={() => setSelectedPublication(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '0.4rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Abstract */}
            {selectedPublication.abstract && (
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', margin: '0 0 0.4rem 0', textTransform: 'uppercase' }}>Abstract</h4>
                <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  {selectedPublication.abstract}
                </p>
              </div>
            )}

            {/* Authors & Affiliations */}
            <div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', margin: '0 0 0.6rem 0', textTransform: 'uppercase' }}>Authors & Affiliations</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {(selectedPublication.authors || []).map((auth, aIdx) => (
                  <div key={aIdx} style={{ background: '#F8FAFC', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{auth.name}</strong> {auth.isCorresponding && <span style={{ color: '#2563EB', fontWeight: 700 }}>(Corresponding Author)</span>}
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{auth.affiliation || 'Narasaraopeta Engineering College'}</div>
                    </div>
                    {auth.facultyId && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#ECFDF5', color: '#059669', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                        Verified Faculty: {auth.facultyId}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Persistent Identifiers */}
            <div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', margin: '0 0 0.6rem 0', textTransform: 'uppercase' }}>Research Identifiers</h4>
              <div style={{ background: '#F8FAFC', padding: '0.8rem', borderRadius: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem', fontSize: '0.76rem' }}>
                <div>DOI: <strong style={{ color: '#2563EB' }}>{selectedPublication.doi || '—'}</strong></div>
                <div>Scopus EID: <strong style={{ color: '#B45309' }}>{selectedPublication.scopusEid || '—'}</strong></div>
                <div>WoS UID: <strong style={{ color: '#15803D' }}>{selectedPublication.wosUid || '—'}</strong></div>
                <div>OpenAlex ID: <strong style={{ color: '#1E40AF' }}>{selectedPublication.openalexWorkId || '—'}</strong></div>
                <div>ISSN: <strong>{selectedPublication.issn || '—'}</strong></div>
                <div>Impact Factor: <strong>{selectedPublication.impactFactor || '—'}</strong></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => setSelectedPublication(null)}
                style={{ background: '#0B192C', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '0.55rem 1.2rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* EDIT / VERIFY RESEARCHER IDs MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {editProfileModalFaculty && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(7, 15, 30, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '550px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#7C3AED', color: '#FFFFFF' }}>
                  {editProfileModalFaculty.facultyId}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0.3rem 0 0 0' }}>
                  Edit Research IDs: {editProfileModalFaculty.name}
                </h3>
              </div>
              <button
                onClick={() => setEditProfileModalFaculty(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updatedData = {
                  orcid: formData.get('orcid'),
                  scopusAuthorId: formData.get('scopusAuthorId'),
                  wosResearcherId: formData.get('wosResearcherId'),
                  googleScholarId: formData.get('googleScholarId'),
                  vidwanId: formData.get('vidwanId')
                };
                saveFacultyResearchProfile(editProfileModalFaculty.facultyId, updatedData, currentUser);
                setEditProfileModalFaculty(null);
                refreshAll();
                showToast(`Saved persistent IDs for ${editProfileModalFaculty.name}!`);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}
            >
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.2rem' }}>
                  ORCID (e.g. 0000-0002-3841-9201)
                </label>
                <input
                  type="text"
                  name="orcid"
                  defaultValue={editProfileModalFaculty.orcid || ''}
                  placeholder="0000-0000-0000-0000"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.2rem' }}>
                  Scopus Author ID (e.g. 57218920192)
                </label>
                <input
                  type="text"
                  name="scopusAuthorId"
                  defaultValue={editProfileModalFaculty.scopusAuthorId || ''}
                  placeholder="572..."
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.2rem' }}>
                  Web of Science ResearcherID (e.g. AAC-9182-2021)
                </label>
                <input
                  type="text"
                  name="wosResearcherId"
                  defaultValue={editProfileModalFaculty.wosResearcherId || ''}
                  placeholder="AAC-..."
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.2rem' }}>
                  Google Scholar ID (e.g. v892kL0AAAAJ)
                </label>
                <input
                  type="text"
                  name="googleScholarId"
                  defaultValue={editProfileModalFaculty.googleScholarId || ''}
                  placeholder="Google Scholar identifier"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.2rem' }}>
                  Vidwan / INFLIBNET ID (e.g. 192847)
                </label>
                <input
                  type="text"
                  name="vidwanId"
                  defaultValue={editProfileModalFaculty.vidwanId || ''}
                  placeholder="Vidwan profile ID"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.8rem' }}>
                <button
                  type="button"
                  onClick={() => setEditProfileModalFaculty(null)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.2rem', borderRadius: '6px', border: 'none', background: '#0B192C', color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Save Persistent IDs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
