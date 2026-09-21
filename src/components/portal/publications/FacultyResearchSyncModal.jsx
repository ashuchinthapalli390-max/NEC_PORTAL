import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Download, 
  FileText, 
  ExternalLink, 
  Layers, 
  ShieldCheck, 
  CheckSquare, 
  Square,
  Sparkles,
  Award,
  Globe,
  BookOpen,
  User,
  Database,
  Check,
  Search,
  Filter,
  Save,
  Clock,
  AlertCircle,
  Link,
  ChevronRight,
  Activity
} from 'lucide-react';
import { FACULTY_DATA } from '../../../data/masterData.js';
import { runResearchSyncJob } from '../../../lib/research/researchSyncEngine.js';
import { isValidOrcid, ORCID_CONFIG, isOrcidConfigured, getOrcidOAuthUrl } from '../../../lib/research/orcidService.js';
import { 
  checkScopusApiDiagnostic, 
  searchScopusAuthors, 
  fetchScopusAuthorProfile, 
  fetchScopusAuthorPublications 
} from '../../../lib/research/scopusService.js';
import { 
  importPublicationsBatch, 
  getFacultyResearchProfile, 
  saveFacultyResearchProfile,
  getPublications 
} from '../../../data/portalStore.js';

export default function FacultyResearchSyncModal({
  isOpen,
  onClose,
  currentUser,
  onSyncComplete,
  initialProvider = 'ORCID'
}) {
  const [provider, setProvider] = useState(initialProvider || 'ORCID');

  useEffect(() => {
    if (initialProvider) {
      setProvider(initialProvider);
    }
  }, [initialProvider]);

  const initialFacultyId = currentUser?.facultyId || (currentUser?.role === 'FACULTY' ? currentUser.facultyId : FACULTY_DATA[0]?.id) || 'NEC-PER-0284';
  const [selectedFacultyId, setSelectedFacultyId] = useState(initialFacultyId);
  const facultyRecord = FACULTY_DATA.find(f => f.id === selectedFacultyId) || FACULTY_DATA[0];

  // Identifiers state (ORCID + Scopus Author ID)
  const [identifiers, setIdentifiers] = useState({
    orcid: '',
    scopusAuthorId: '',
    googleScholarId: '',
    vidwanId: ''
  });

  const [idSavedMessage, setIdSavedMessage] = useState('');
  const [syncModalError, setSyncModalError] = useState('');
  const [syncModalToast, setSyncModalToast] = useState('');

  // ─────────────────────────────────────────────────────────────────────────
  // ORCID SYNC STATE
  // ─────────────────────────────────────────────────────────────────────────
  const [orcidSyncing, setOrcidSyncing] = useState(false);
  const [orcidProgress, setOrcidProgress] = useState({ stage: 'IDLE', message: '', percent: 0 });
  const [orcidSyncResult, setOrcidSyncResult] = useState(null);
  const [orcidSelectedCandidateKeys, setOrcidSelectedCandidateKeys] = useState({});
  const [orcidActiveCandidateTab, setOrcidActiveCandidateTab] = useState('NEW');
  const [orcidImporting, setOrcidImporting] = useState(false);
  const [comparisonCandidate, setComparisonCandidate] = useState(null);

  // ─────────────────────────────────────────────────────────────────────────
  // SCOPUS SYNC STATE
  // ─────────────────────────────────────────────────────────────────────────
  const [scopusDiagnostic, setScopusDiagnostic] = useState({ loading: false, data: null });
  const [scopusAuthorQuery, setScopusAuthorQuery] = useState('');
  const [scopusAffilQuery, setScopusAffilQuery] = useState('Narasaraopeta');
  const [scopusSearching, setScopusSearching] = useState(false);
  const [scopusSearchResults, setScopusSearchResults] = useState(null);
  const [scopusSearchOpen, setScopusSearchOpen] = useState(false);

  const [scopusProfileLoading, setScopusProfileLoading] = useState(false);
  const [scopusProfileData, setScopusProfileData] = useState(null);

  const [scopusFetchingPubs, setScopusFetchingPubs] = useState(false);
  const [scopusCandidates, setScopusCandidates] = useState(null);
  const [scopusSelectedKeys, setScopusSelectedKeys] = useState({});
  const [scopusActiveTab, setScopusActiveTab] = useState('NEW');
  const [scopusImporting, setScopusImporting] = useState(false);

  // Load faculty's own stored identifiers whenever selectedFacultyId changes
  useEffect(() => {
    if (selectedFacultyId) {
      const stored = getFacultyResearchProfile(selectedFacultyId);
      setIdentifiers({
        orcid: stored.orcid || '',
        scopusAuthorId: stored.scopusAuthorId || '',
        googleScholarId: stored.googleScholarId || '',
        vidwanId: stored.vidwanId || ''
      });
      // Reset sync results when switching faculty
      setOrcidSyncResult(null);
      setOrcidSelectedCandidateKeys({});
      setOrcidProgress({ stage: 'IDLE', message: '', percent: 0 });

      setScopusCandidates(null);
      setScopusSelectedKeys({});
      setScopusProfileData(null);
      setScopusSearchResults(null);
      setIdSavedMessage('');
      setSyncModalError('');

      // Pre-fill Scopus author search query
      const currentFac = FACULTY_DATA.find(f => f.id === selectedFacultyId);
      if (currentFac) {
        setScopusAuthorQuery(currentFac.name);
      }
    }
  }, [selectedFacultyId]);

  // Run Scopus diagnostic check on mount or when switching to Scopus provider
  useEffect(() => {
    if (provider === 'SCOPUS' && !scopusDiagnostic.data && !scopusDiagnostic.loading) {
      runScopusDiagnosticCheck();
    }
  }, [provider]);

  // If faculty already has a scopusAuthorId, load profile automatically on Scopus tab
  useEffect(() => {
    if (provider === 'SCOPUS' && identifiers.scopusAuthorId && !scopusProfileData && !scopusProfileLoading) {
      handleLookupScopusProfile(identifiers.scopusAuthorId);
    }
  }, [provider, identifiers.scopusAuthorId]);

  const runScopusDiagnosticCheck = async () => {
    setScopusDiagnostic({ loading: true, data: null });
    try {
      const res = await checkScopusApiDiagnostic();
      setScopusDiagnostic({ loading: false, data: res });
    } catch (err) {
      setScopusDiagnostic({
        loading: false,
        data: { success: false, status: 'OFFLINE', error: err.message, canSync: false }
      });
    }
  };

  const handleSaveIdentifiers = () => {
    saveFacultyResearchProfile(selectedFacultyId, identifiers, currentUser);
    setIdSavedMessage('Research identifiers successfully saved to institutional profile.');
    setTimeout(() => setIdSavedMessage(''), 3500);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ORCID ACTIONS
  // ─────────────────────────────────────────────────────────────────────────
  const handleStartOrcidSync = async () => {
    if (!identifiers.orcid || !identifiers.orcid.trim()) {
      setSyncModalError('Please enter a valid 16-digit ORCID iD (e.g. 0000-0002-1825-0097).');
      return;
    }

    if (!isValidOrcid(identifiers.orcid)) {
      setSyncModalError('Invalid ORCID format. Must be 16 digits formatted like 0000-0002-1825-0097.');
      return;
    }

    setSyncModalError('');
    saveFacultyResearchProfile(selectedFacultyId, identifiers, currentUser);

    setOrcidSyncing(true);
    setOrcidSyncResult(null);
    setOrcidSelectedCandidateKeys({});

    const result = await runResearchSyncJob(identifiers, (prog) => {
      setOrcidProgress(prog);
    });

    setOrcidSyncing(false);

    if (result.success) {
      setOrcidSyncResult(result);
      const initialSelection = {};
      result.candidates.forEach(c => {
        if (c.classification === 'NEW') {
          initialSelection[c.candidateId] = true;
        }
      });
      setOrcidSelectedCandidateKeys(initialSelection);
    } else {
      setSyncModalError(result.error || 'Failed to sync with ORCID registry.');
    }
  };

  const handleImportOrcidSelected = () => {
    if (!orcidSyncResult) return;
    const toImport = orcidSyncResult.candidates.filter(c => orcidSelectedCandidateKeys[c.candidateId]);
    if (toImport.length === 0) {
      setSyncModalError('Please select at least one publication to import.');
      return;
    }

    setSyncModalError('');
    setOrcidImporting(true);
    const preparedCandidates = toImport.map(c => ({
      ...c,
      department: facultyRecord.department,
      departmentCode: facultyRecord.department,
      facultyId: facultyRecord.id,
      facultyName: facultyRecord.name,
      academicYear: '2025-26',
      authors: c.authors?.length ? c.authors : [
        {
          authorOrder: 1,
          authorType: 'INTERNAL_FACULTY',
          facultyId: facultyRecord.id,
          name: facultyRecord.name,
          department: facultyRecord.department,
          departmentCode: facultyRecord.department,
          affiliation: 'Narasaraopeta Engineering College',
          isFirstAuthor: true,
          isCorresponding: true
        }
      ]
    }));

    importPublicationsBatch(preparedCandidates, currentUser);

    setOrcidImporting(false);
    setSyncModalToast(`Successfully imported ${toImport.length} publication(s) into review pipeline.`);
    setTimeout(() => {
      if (onSyncComplete) onSyncComplete();
      onClose();
    }, 1200);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SCOPUS ACTIONS
  // ─────────────────────────────────────────────────────────────────────────
  const handleSearchScopusAuthors = async () => {
    const q = scopusAuthorQuery.trim();
    if (!q) {
      setSyncModalError('Please enter an author name to search Scopus.');
      return;
    }

    setSyncModalError('');
    setScopusSearching(true);
    setScopusSearchResults(null);

    // Build query: e.g. AUTHLASTNAME(...) and AFFIL(...)
    let queryParam = `AUTHFIRST(${q}) or AUTHLASTNAME(${q})`;
    if (scopusAffilQuery.trim()) {
      queryParam = `(${queryParam}) and AFFIL(${scopusAffilQuery.trim()})`;
    }

    const res = await searchScopusAuthors(queryParam);
    setScopusSearching(false);

    if (res.success) {
      setScopusSearchResults(res.authors || []);
      if ((res.authors || []).length === 0) {
        setSyncModalError(`No Scopus authors found for query "${q}". Try searching by surname only or without affiliation.`);
      }
    } else {
      setSyncModalError(res.error || 'Scopus author search failed.');
    }
  };

  const handleSelectScopusAuthor = (author) => {
    setIdentifiers(prev => ({
      ...prev,
      scopusAuthorId: author.scopusAuthorId
    }));
    saveFacultyResearchProfile(selectedFacultyId, {
      ...identifiers,
      scopusAuthorId: author.scopusAuthorId
    }, currentUser);
    setScopusSearchOpen(false);
    handleLookupScopusProfile(author.scopusAuthorId);
  };

  const handleLookupScopusProfile = async (authorIdToLookup) => {
    const aid = authorIdToLookup || identifiers.scopusAuthorId;
    if (!aid || !aid.trim()) {
      setSyncModalError('Please enter a Scopus Author ID.');
      return;
    }

    setSyncModalError('');
    setScopusProfileLoading(true);
    setScopusProfileData(null);

    const res = await fetchScopusAuthorProfile(aid.trim());
    setScopusProfileLoading(false);

    if (res.success) {
      setScopusProfileData(res.profile);
    } else {
      setSyncModalError(res.error || 'Failed to fetch Scopus author profile.');
    }
  };

  const handleFetchScopusPublications = async () => {
    const aid = identifiers.scopusAuthorId;
    if (!aid || !aid.trim()) {
      setSyncModalError('Please provide or verify a Scopus Author ID first.');
      return;
    }

    setSyncModalError('');
    setScopusFetchingPubs(true);
    setScopusCandidates(null);
    setScopusSelectedKeys({});

    const res = await fetchScopusAuthorPublications(aid.trim());
    setScopusFetchingPubs(false);

    if (!res.success) {
      setSyncModalError(res.error || 'Failed to fetch publications from Scopus.');
      return;
    }

    const rawPubs = res.publications || [];
    const portalPubs = getPublications();

    const normalizeTitle = (t) => (t || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const candidates = rawPubs.map((pub, idx) => {
      const candDoi = (pub.doi || '').trim().toLowerCase();
      const candEid = (pub.scopusEid || '').trim();
      const candNormTitle = normalizeTitle(pub.title);

      const isDuplicate = portalPubs.some(p => {
        if (candDoi && p.doi && p.doi.trim().toLowerCase() === candDoi) return true;
        if (candEid && p.scopusEid && p.scopusEid.trim() === candEid) return true;
        if (candNormTitle && p.title && normalizeTitle(p.title) === candNormTitle) return true;
        return false;
      });

      const classification = isDuplicate ? 'EXACT_DUPLICATE' : 'NEW';
      const candidateId = `scopus_${candEid || candDoi || idx}_${Date.now()}`;

      return {
        candidateId,
        title: pub.title,
        publicationType: pub.type || 'Journal Article',
        journalName: pub.type === 'Journal Article' ? pub.venue : '',
        conferenceName: pub.type === 'Conference Paper' ? pub.venue : '',
        publicationYear: pub.year ? parseInt(pub.year, 10) : null,
        publicationDate: pub.publicationDate || (pub.year ? `${pub.year}-06-01` : ''),
        doi: pub.doi || '',
        scopusEid: pub.scopusEid || '',
        scopusUrl: pub.scopusUrl || (pub.doi ? `https://doi.org/${pub.doi}` : ''),
        citationCount: pub.citationCount || 0,
        isScopusIndexed: true,
        indexingStatus: 'Scopus Indexed',
        sources: ['SCOPUS'],
        classification
      };
    });

    setScopusCandidates(candidates);

    // Auto-select all NEW candidates
    const newKeys = {};
    candidates.forEach(c => {
      if (c.classification === 'NEW') {
        newKeys[c.candidateId] = true;
      }
    });
    setScopusSelectedKeys(newKeys);
  };

  const handleImportScopusSelected = () => {
    if (!scopusCandidates) return;
    const toImport = scopusCandidates.filter(c => scopusSelectedKeys[c.candidateId]);
    if (toImport.length === 0) {
      setSyncModalError('Please select at least one publication to import.');
      return;
    }

    setSyncModalError('');
    setScopusImporting(true);

    const preparedCandidates = toImport.map(c => ({
      title: c.title,
      publicationType: c.publicationType,
      paperOwnerType: 'Faculty Publication',
      department: facultyRecord.department,
      departmentCode: facultyRecord.department,
      facultyId: facultyRecord.id,
      facultyName: facultyRecord.name,
      academicYear: c.publicationYear ? `${c.publicationYear}-${String(c.publicationYear + 1).slice(-2)}` : '2025-26',
      publicationYear: c.publicationYear,
      publicationDate: c.publicationDate,
      journalName: c.journalName,
      conferenceName: c.conferenceName,
      doi: c.doi,
      scopusEid: c.scopusEid,
      url: c.scopusUrl,
      isScopusIndexed: true,
      indexing: ['Scopus'],
      indexingStatus: 'Scopus Indexed',
      sources: ['SCOPUS'],
      scopusCitations: { count: c.citationCount, capturedAt: new Date().toISOString() },
      workflowStatus: 'IMPORTED_PENDING_REVIEW',
      authors: [
        {
          authorOrder: 1,
          name: facultyRecord.name,
          department: facultyRecord.department,
          departmentCode: facultyRecord.department,
          facultyId: facultyRecord.id,
          affiliation: 'Narasaraopeta Engineering College',
          isFirstAuthor: true,
          isCorresponding: true,
          scopusAuthorId: identifiers.scopusAuthorId
        }
      ]
    }));

    importPublicationsBatch(preparedCandidates, currentUser);

    setScopusImporting(false);
    setSyncModalToast(`Successfully imported ${toImport.length} Scopus publication(s) into review pipeline.`);
    setTimeout(() => {
      if (onSyncComplete) onSyncComplete();
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  // ORCID filtered candidates
  const orcidFilteredCandidates = orcidSyncResult?.candidates.filter(c => {
    if (orcidActiveCandidateTab === 'ALL') return true;
    return c.classification === orcidActiveCandidateTab;
  }) || [];
  const orcidSelectedCount = Object.values(orcidSelectedCandidateKeys).filter(Boolean).length;

  // Scopus filtered candidates
  const scopusFilteredCandidates = (scopusCandidates || []).filter(c => {
    if (scopusActiveTab === 'ALL') return true;
    return c.classification === scopusActiveTab;
  });
  const scopusSelectedCount = Object.values(scopusSelectedKeys).filter(Boolean).length;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(7, 15, 30, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1200,
      padding: '1rem'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        maxWidth: '1050px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        border: '1px solid #D4AF37',
        overflow: 'hidden'
      }}>
        {/* 1. Modal Top Bar */}
        <div style={{
          background: 'linear-gradient(135deg, #070F1E 0%, #0B192C 100%)',
          padding: '1.15rem 1.75rem',
          color: '#FFFFFF',
          borderBottom: '2px solid #D4AF37',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(241, 196, 15, 0.15)',
              border: '1px solid rgba(241, 196, 15, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F1C40F'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF', fontFamily: 'Cinzel, Georgia, serif' }}>
                Research Auto-Sync & Indexing Hub
              </h2>
              <div style={{ fontSize: '0.74rem', color: '#D4AF37', fontWeight: 600 }}>
                Official Integrations: ORCID Public API v3.0 & Elsevier Scopus API
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. Provider Selector Tabs */}
        <div style={{
          background: '#0F172A',
          padding: '0.5rem 1.75rem',
          display: 'flex',
          gap: '0.75rem',
          borderBottom: '1px solid #1E293B'
        }}>
          <button
            type="button"
            onClick={() => { setProvider('ORCID'); setSyncModalError(''); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              border: provider === 'ORCID' ? '1px solid #A6CE39' : '1px solid transparent',
              background: provider === 'ORCID' ? '#1E293B' : 'transparent',
              color: provider === 'ORCID' ? '#A6CE39' : '#94A3B8',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Globe size={15} />
            ORCID Public API v3.0
          </button>

          <button
            type="button"
            onClick={() => { setProvider('SCOPUS'); setSyncModalError(''); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              border: provider === 'SCOPUS' ? '1px solid #F1C40F' : '1px solid transparent',
              background: provider === 'SCOPUS' ? '#1E293B' : 'transparent',
              color: provider === 'SCOPUS' ? '#F1C40F' : '#94A3B8',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Award size={15} />
            Elsevier Scopus API
          </button>
        </div>

        {/* 3. Scrollable Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {syncModalError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{syncModalError}</span>
            </div>
          )}
          {syncModalToast && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{syncModalToast}</span>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: ORCID PROVIDER */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {provider === 'ORCID' && (
            <>
              {/* Faculty Selector & ORCID Input */}
              <div style={{ background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      FACULTY RESEARCHER *
                    </label>
                    <select
                      value={selectedFacultyId}
                      onChange={(e) => setSelectedFacultyId(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFFFFF', fontWeight: 700, color: '#0F172A' }}
                    >
                      {FACULTY_DATA.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.department} - {f.designation})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        ORCID iD (16-Digit with Checksum) *
                        {isOrcidConfigured() && (
                          <span style={{ fontSize: '0.66rem', color: '#059669', background: '#ECFDF5', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #A7F3D0', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={10} /> ORCID API Active
                          </span>
                        )}
                      </label>
                      <a
                        href={getOrcidOAuthUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Connect or Authorize using your official ORCID account"
                        style={{ fontSize: '0.7rem', color: '#2563EB', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <ExternalLink size={11} /> Connect ORCID
                      </a>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 0000-0002-1825-0097"
                      value={identifiers.orcid}
                      onChange={(e) => setIdentifiers({ ...identifiers, orcid: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleSaveIdentifiers}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}
                    >
                      <Save size={13} /> Save Identifiers
                    </button>
                    {idSavedMessage && (
                      <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={13} /> {idSavedMessage}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={orcidSyncing || !identifiers.orcid}
                    onClick={handleStartOrcidSync}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.55rem 1.25rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: orcidSyncing ? '#94A3B8' : 'linear-gradient(135deg, #A6CE39 0%, #85A728 100%)',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: orcidSyncing ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 10px rgba(166, 206, 57, 0.35)'
                    }}
                  >
                    <RefreshCw size={14} className={orcidSyncing ? 'animate-spin' : ''} />
                    {orcidSyncing ? 'Fetching from ORCID...' : 'Sync ORCID Publications'}
                  </button>
                </div>
              </div>

              {/* Sync Progress Banner */}
              {orcidSyncing && (
                <div style={{ background: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1E40AF' }}>{orcidProgress.message}</span>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#2563EB' }}>{orcidProgress.percent}%</span>
                  </div>
                  <div style={{ height: '6px', background: '#DBEAFE', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: `${orcidProgress.percent}%`, height: '100%', background: '#2563EB', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}

              {/* ORCID Results / Empty State */}
              {!orcidSyncResult && !orcidSyncing && (
                <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '14px', border: '1px dashed #CBD5E1' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Globe size={24} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.35rem' }}>
                    No ORCID Synchronization Run Yet
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', maxWidth: '440px', margin: '0 auto' }}>
                    Enter or verify the faculty member's 16-digit ORCID iD and click "Sync ORCID Publications" to fetch works from ORCID Public API v3.0 with Crossref metadata enrichment.
                  </p>
                </div>
              )}

              {orcidSyncResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* KPI Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    {[
                      { label: 'Total Discovered', value: orcidSyncResult.summary.totalDiscovered, color: '#0F172A', bg: '#F8FAFC' },
                      { label: 'New Ready to Import', value: orcidSyncResult.summary.newRecords, color: '#059669', bg: '#ECFDF5' },
                      { label: 'Duplicates in Portal', value: orcidSyncResult.summary.duplicates, color: '#D97706', bg: '#FEFCE8' },
                      { label: 'Cross-Source Enriched', value: orcidSyncResult.summary.crossSourceEnriched, color: '#2563EB', bg: '#EFF6FF' }
                    ].map((k, idx) => (
                      <div key={idx} style={{ background: k.bg, padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>{k.label}</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: k.color, fontFamily: 'Cinzel, serif' }}>{k.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Candidate Tabs & Bulk Selection */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[
                        { id: 'NEW', label: `New (${orcidSyncResult.summary.newRecords})` },
                        { id: 'ALL', label: `All Discovered (${orcidSyncResult.candidates.length})` },
                        { id: 'EXACT_DUPLICATE', label: `Duplicates (${orcidSyncResult.summary.duplicates})` }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setOrcidActiveCandidateTab(tab.id)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: orcidActiveCandidateTab === tab.id ? '#070F1E' : '#F1F5F9',
                            color: orcidActiveCandidateTab === tab.id ? '#F1C40F' : '#475569',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {};
                          orcidSyncResult.candidates.forEach(c => {
                            if (orcidActiveCandidateTab === 'ALL' || c.classification === orcidActiveCandidateTab) {
                              updated[c.candidateId] = true;
                            }
                          });
                          setOrcidSelectedCandidateKeys(updated);
                        }}
                        style={{ fontSize: '0.74rem', color: '#2563EB', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Select All
                      </button>
                      <span style={{ color: '#CBD5E1' }}>•</span>
                      <button
                        type="button"
                        onClick={() => setOrcidSelectedCandidateKeys({})}
                        style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  {/* Candidate List */}
                  {orcidFilteredCandidates.length === 0 ? (
                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>
                      No candidate publications found for the selected tab filter.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {orcidFilteredCandidates.map(c => {
                        const isSelected = !!orcidSelectedCandidateKeys[c.candidateId];
                        const isNew = c.classification === 'NEW';

                        return (
                          <div
                            key={c.candidateId}
                            style={{
                              background: isSelected ? '#FAFBFF' : '#FFFFFF',
                              borderRadius: '12px',
                              border: isSelected ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                              padding: '1rem 1.25rem',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.85rem'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => setOrcidSelectedCandidateKeys(p => ({ ...p, [c.candidateId]: !p[c.candidateId] }))}
                              style={{ marginTop: '4px', width: '16px', height: '16px', cursor: 'pointer' }}
                            />

                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.88rem' }}>
                                  {c.title}
                                </div>
                                <span style={{
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.66rem',
                                  fontWeight: 800,
                                  background: isNew ? '#ECFDF5' : '#FEFCE8',
                                  color: isNew ? '#047857' : '#92400E',
                                  border: `1px solid ${isNew ? '#A7F3D0' : '#FDE68A'}`,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {c.classification}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.74rem', color: '#64748B', marginBottom: '0.45rem' }}>
                                {c.journalName ? `${c.journalName} • ` : ''}Year: {c.publicationYear} {c.doi ? `• DOI: ${c.doi}` : ''}
                              </div>

                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                {c.sources?.map((s, si) => (
                                  <span key={si} style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', background: s === 'ORCID' ? '#A6CE39' : '#2563EB', color: '#FFFFFF' }}>
                                    {s}
                                  </span>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => setComparisonCandidate(c)}
                                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#2563EB', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  Compare Metadata <ExternalLink size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: ELSEVIER SCOPUS PROVIDER */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {provider === 'SCOPUS' && (
            <>
              {/* Scopus API Diagnostic Banner */}
              <div style={{
                background: scopusDiagnostic.data?.canSync ? '#F0FDF4' : (scopusDiagnostic.data?.status === 'NOT_CONFIGURED' ? '#FFFBEB' : '#FEF2F2'),
                border: `1px solid ${scopusDiagnostic.data?.canSync ? '#BBF7D0' : (scopusDiagnostic.data?.status === 'NOT_CONFIGURED' ? '#FDE68A' : '#FECACA')}`,
                borderRadius: '12px',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Activity size={18} style={{ color: scopusDiagnostic.data?.canSync ? '#16A34A' : '#D97706' }} />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      Elsevier Scopus API Connection Status:
                      {scopusDiagnostic.loading ? (
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Testing server proxy...</span>
                      ) : scopusDiagnostic.data?.canSync ? (
                        <span style={{ fontSize: '0.72rem', color: '#16A34A', background: '#DCFCE7', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                          CONNECTED (Entitlement: Active)
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#B45309', background: '#FEF3C7', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                          {scopusDiagnostic.data?.status === 'NOT_CONFIGURED' ? 'KEY REQUIRED IN .ENV' : 'OFFLINE / RESTRICTED'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.15rem' }}>
                      {scopusDiagnostic.data?.message || scopusDiagnostic.data?.error || 'Proxying securely through institutional server backend.'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={runScopusDiagnosticCheck}
                  disabled={scopusDiagnostic.loading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.35rem 0.75rem',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: scopusDiagnostic.loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  <RefreshCw size={12} className={scopusDiagnostic.loading ? 'animate-spin' : ''} />
                  Test Connectivity
                </button>
              </div>

              {/* Faculty Selector & Scopus ID Card */}
              <div style={{ background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      FACULTY RESEARCHER *
                    </label>
                    <select
                      value={selectedFacultyId}
                      onChange={(e) => setSelectedFacultyId(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFFFFF', fontWeight: 700, color: '#0F172A' }}
                    >
                      {FACULTY_DATA.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.department} - {f.designation})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A' }}>
                        SCOPUS AUTHOR ID (Numeric) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setScopusSearchOpen(!scopusSearchOpen)}
                        style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Search size={11} /> {scopusSearchOpen ? 'Hide Search' : 'Lookup Author ID'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="e.g. 57194200000"
                        value={identifiers.scopusAuthorId}
                        onChange={(e) => setIdentifiers({ ...identifiers, scopusAuthorId: e.target.value })}
                        style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleLookupScopusProfile(identifiers.scopusAuthorId)}
                        disabled={scopusProfileLoading || !identifiers.scopusAuthorId}
                        style={{
                          padding: '0.55rem 0.85rem',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#0F172A',
                          cursor: scopusProfileLoading || !identifiers.scopusAuthorId ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {scopusProfileLoading ? 'Loading...' : 'Preview Profile'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional Expandable Author Search Panel */}
                {scopusSearchOpen && (
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                      Search Scopus Author Registry by Name & Affiliation
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <input
                        type="text"
                        placeholder="Author name (e.g. Sreenivasu or Lakshmi)"
                        value={scopusAuthorQuery}
                        onChange={(e) => setScopusAuthorQuery(e.target.value)}
                        style={{ padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem' }}
                      />
                      <input
                        type="text"
                        placeholder="Affiliation (defaults to Narasaraopeta)"
                        value={scopusAffilQuery}
                        onChange={(e) => setScopusAffilQuery(e.target.value)}
                        style={{ padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem' }}
                      />
                      <button
                        type="button"
                        disabled={scopusSearching || !scopusAuthorQuery}
                        onClick={handleSearchScopusAuthors}
                        style={{
                          padding: '0.45rem 0.95rem',
                          borderRadius: '6px',
                          background: '#070F1E',
                          color: '#F1C40F',
                          border: 'none',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          cursor: scopusSearching ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {scopusSearching ? 'Searching...' : 'Search Elsevier Scopus'}
                      </button>
                    </div>

                    {scopusSearchResults && scopusSearchResults.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto', borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem' }}>
                        {scopusSearchResults.map((author, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: '#F8FAFC',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F172A' }}>{author.name}</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                                Scopus ID: <strong>{author.scopusAuthorId}</strong> • {author.affiliation} ({author.documentCount} docs)
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectScopusAuthor(author)}
                              style={{
                                padding: '0.25rem 0.65rem',
                                background: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                color: '#1D4ED8',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Select Author
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Scopus Profile Card if loaded */}
                {scopusProfileData && (
                  <div style={{
                    background: 'linear-gradient(135deg, #070F1E 0%, #0F172A 100%)',
                    borderRadius: '12px',
                    border: '1px solid #D4AF37',
                    padding: '1rem 1.25rem',
                    color: '#FFFFFF',
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>{scopusProfileData.name}</span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#D4AF37', color: '#070F1E', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          SCOPUS ID: {scopusProfileData.scopusAuthorId}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                        {scopusProfileData.affiliation}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.66rem', color: '#94A3B8', textTransform: 'uppercase' }}>Documents</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F1C40F' }}>{scopusProfileData.documentCount}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.66rem', color: '#94A3B8', textTransform: 'uppercase' }}>Citations</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38BDF8' }}>{scopusProfileData.citationCount}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.66rem', color: '#94A3B8', textTransform: 'uppercase' }}>h-index</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4ADE80' }}>{scopusProfileData.hIndex || '—'}</div>
                      </div>
                      <a
                        href={scopusProfileData.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#F1C40F', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', fontWeight: 700 }}
                      >
                        Scopus Profile <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                )}

                {/* Bottom Action Bar of Identification Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleSaveIdentifiers}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}
                    >
                      <Save size={13} /> Save Identifiers
                    </button>
                    {idSavedMessage && (
                      <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={13} /> {idSavedMessage}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={scopusFetchingPubs || !identifiers.scopusAuthorId}
                    onClick={handleFetchScopusPublications}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.55rem 1.25rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: scopusFetchingPubs ? '#94A3B8' : 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)',
                      color: '#070F1E',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: scopusFetchingPubs || !identifiers.scopusAuthorId ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 10px rgba(212, 175, 55, 0.35)'
                    }}
                  >
                    <RefreshCw size={14} className={scopusFetchingPubs ? 'animate-spin' : ''} />
                    {scopusFetchingPubs ? 'Querying Scopus Index...' : 'Fetch Scopus Publications'}
                  </button>
                </div>
              </div>

              {/* Scopus Empty State */}
              {!scopusCandidates && !scopusFetchingPubs && (
                <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '14px', border: '1px dashed #CBD5E1' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEFCE8', color: '#CA8A04', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Award size={24} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.35rem' }}>
                    No Scopus Candidate Publications Loaded
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', maxWidth: '440px', margin: '0 auto' }}>
                    Select an author or verify the Scopus Author ID above, then click "Fetch Scopus Publications" to discover indexed papers from Elsevier Scopus with automatic duplicate detection.
                  </p>
                </div>
              )}

              {/* Scopus Candidates List & Deduplication */}
              {scopusCandidates && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* KPI Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    {[
                      { label: 'Total Scopus Works', value: scopusCandidates.length, color: '#0F172A', bg: '#F8FAFC' },
                      { label: 'New Ready to Import', value: scopusCandidates.filter(c => c.classification === 'NEW').length, color: '#059669', bg: '#ECFDF5' },
                      { label: 'Already in Portal', value: scopusCandidates.filter(c => c.classification === 'EXACT_DUPLICATE').length, color: '#D97706', bg: '#FEFCE8' },
                      { label: 'Total Scopus Citations', value: scopusCandidates.reduce((s, c) => s + (c.citationCount || 0), 0), color: '#0284C7', bg: '#F0F9FF' }
                    ].map((k, idx) => (
                      <div key={idx} style={{ background: k.bg, padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>{k.label}</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: k.color, fontFamily: 'Cinzel, serif' }}>{k.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Filter Tabs & Bulk Select */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[
                        { id: 'NEW', label: `New (${scopusCandidates.filter(c => c.classification === 'NEW').length})` },
                        { id: 'ALL', label: `All Discovered (${scopusCandidates.length})` },
                        { id: 'EXACT_DUPLICATE', label: `Already in Portal (${scopusCandidates.filter(c => c.classification === 'EXACT_DUPLICATE').length})` }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setScopusActiveTab(tab.id)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: scopusActiveTab === tab.id ? '#070F1E' : '#F1F5F9',
                            color: scopusActiveTab === tab.id ? '#F1C40F' : '#475569',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {};
                          scopusCandidates.forEach(c => {
                            if (scopusActiveTab === 'ALL' || c.classification === scopusActiveTab) {
                              updated[c.candidateId] = true;
                            }
                          });
                          setScopusSelectedKeys(updated);
                        }}
                        style={{ fontSize: '0.74rem', color: '#2563EB', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Select All
                      </button>
                      <span style={{ color: '#CBD5E1' }}>•</span>
                      <button
                        type="button"
                        onClick={() => setScopusSelectedKeys({})}
                        style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  {/* Scopus Candidates List */}
                  {scopusFilteredCandidates.length === 0 ? (
                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>
                      No Scopus candidate publications found for the selected filter.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {scopusFilteredCandidates.map(c => {
                        const isSelected = !!scopusSelectedKeys[c.candidateId];
                        const isNew = c.classification === 'NEW';

                        return (
                          <div
                            key={c.candidateId}
                            style={{
                              background: isSelected ? '#FAFBFF' : '#FFFFFF',
                              borderRadius: '12px',
                              border: isSelected ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
                              padding: '1rem 1.25rem',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.85rem'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => setScopusSelectedKeys(p => ({ ...p, [c.candidateId]: !p[c.candidateId] }))}
                              style={{ marginTop: '4px', width: '16px', height: '16px', cursor: 'pointer' }}
                            />

                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.88rem' }}>
                                  {c.title}
                                </div>
                                <span style={{
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.66rem',
                                  fontWeight: 800,
                                  background: isNew ? '#ECFDF5' : '#FEFCE8',
                                  color: isNew ? '#047857' : '#92400E',
                                  border: `1px solid ${isNew ? '#A7F3D0' : '#FDE68A'}`,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {isNew ? 'NEW TO PORTAL' : 'ALREADY IN PORTAL'}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.74rem', color: '#64748B', marginBottom: '0.45rem' }}>
                                {c.journalName || c.conferenceName || 'Scopus Publication'} • Year: {c.publicationYear || '—'}
                                {c.doi ? ` • DOI: ${c.doi}` : ''}
                                {c.scopusEid ? ` • EID: ${c.scopusEid}` : ''}
                              </div>

                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#D97706', color: '#FFFFFF' }}>
                                  SCOPUS INDEXED
                                </span>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                                  {c.publicationType}
                                </span>
                                {c.citationCount > 0 && (
                                  <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
                                    Citations: {c.citationCount}
                                  </span>
                                )}

                                {c.scopusUrl && (
                                  <a
                                    href={c.scopusUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ marginLeft: 'auto', color: '#2563EB', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  >
                                    View in Scopus <ExternalLink size={11} />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* 4. Modal Bottom Action Bar */}
        <div style={{
          padding: '1rem 1.75rem',
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
            {provider === 'ORCID' ? (
              orcidSelectedCount > 0 ? (
                <span><strong>{orcidSelectedCount}</strong> ORCID publication(s) selected for import.</span>
              ) : (
                <span>Select publications to import into the review pipeline.</span>
              )
            ) : (
              scopusSelectedCount > 0 ? (
                <span><strong>{scopusSelectedCount}</strong> Scopus publication(s) selected for import.</span>
              ) : (
                <span>Select Scopus publications to import into the review pipeline.</span>
              )
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.8rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
            >
              Cancel
            </button>

            {provider === 'ORCID' ? (
              <button
                type="button"
                disabled={orcidImporting || orcidSelectedCount === 0}
                onClick={handleImportOrcidSelected}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: orcidSelectedCount === 0 ? '#CBD5E1' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: orcidSelectedCount === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: orcidSelectedCount === 0 ? 'none' : '0 2px 10px rgba(16, 185, 129, 0.3)'
                }}
              >
                {orcidImporting ? 'Importing...' : `Import Selected (${orcidSelectedCount})`}
              </button>
            ) : (
              <button
                type="button"
                disabled={scopusImporting || scopusSelectedCount === 0}
                onClick={handleImportScopusSelected}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: scopusSelectedCount === 0 ? '#CBD5E1' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: scopusSelectedCount === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: scopusSelectedCount === 0 ? 'none' : '0 2px 10px rgba(245, 158, 11, 0.3)'
                }}
              >
                {scopusImporting ? 'Importing...' : `Import Selected (${scopusSelectedCount})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metadata Comparison Sub-Modal */}
      {comparisonCandidate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 15, 30, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '650px', width: '100%', border: '1px solid #D4AF37', overflow: 'hidden' }}>
            <div style={{ background: '#070F1E', padding: '1rem 1.25rem', color: '#FFFFFF', borderBottom: '2px solid #D4AF37', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Compare Discovered Metadata</h3>
              <button type="button" onClick={() => setComparisonCandidate(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div><strong>Title:</strong> {comparisonCandidate.title}</div>
              <div><strong>DOI:</strong> {comparisonCandidate.doi || '—'}</div>
              <div><strong>Journal / Venue:</strong> {comparisonCandidate.journalName || comparisonCandidate.conferenceName || '—'}</div>
              <div><strong>Publisher:</strong> {comparisonCandidate.publisher || '—'}</div>
              <div><strong>Sources Supplying Metadata:</strong> {comparisonCandidate.sources?.join(', ')}</div>
            </div>
            <div style={{ padding: '0.75rem 1.25rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setComparisonCandidate(null)} style={{ padding: '0.4rem 0.85rem', background: '#070F1E', color: '#F1C40F', border: 'none', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
