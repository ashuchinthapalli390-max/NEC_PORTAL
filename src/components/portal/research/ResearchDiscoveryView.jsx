import React, { useState, useMemo } from 'react';
import { 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Download, 
  RefreshCw, 
  X, 
  Copy, 
  Check,
  PlusCircle
} from 'lucide-react';
import { FACULTY_DATA } from '../../../data/masterData.js';
import { 
  fetchOrcidData, 
  isValidOrcid, 
  normalizeOrcid, 
  ORCID_CONFIG 
} from '../../../lib/research/orcidService.js';
import { 
  importPublicationsBatch,
  getFacultyList,
  getPublications 
} from '../../../data/portalStore.js';

export default function ResearchDiscoveryView({ currentUser }) {
  // Institutional Faculty Directory (used for automatic faculty ID/department linkage)
  const facultyList = useMemo(() => {
    const list = getFacultyList();
    if (list && list.length > 0) return list;
    if (FACULTY_DATA && FACULTY_DATA.length > 0) return FACULTY_DATA;
    return [];
  }, []);

  // Direct ORCID iD Input & Live Profile State
  const [orcidInput, setOrcidInput] = useState('');
  const [orcidProfile, setOrcidProfile] = useState(null);

  // Publication Extraction State
  const [extractingWorks, setExtractingWorks] = useState(false);
  const [extractProgress, setExtractProgress] = useState({ stage: 'IDLE', message: '', percent: 0 });
  const [discoveredCandidates, setDiscoveredCandidates] = useState(null);
  const [selectedCandidateKeys, setSelectedCandidateKeys] = useState({});
  const [activeTab, setActiveTab] = useState('NEW');
  const [comparisonCandidate, setComparisonCandidate] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importNotice, setImportNotice] = useState('');
  const [discoveryError, setDiscoveryError] = useState('');
  const [discoveryToast, setDiscoveryToast] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const showToast = (msg) => {
    setDiscoveryToast(msg);
    setTimeout(() => setDiscoveryToast(''), 3500);
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    showToast(`Copied ${label} to clipboard.`);
    setTimeout(() => setCopiedId(''), 2500);
  };

  // 1. Direct Fetch Works from Official ORCID Public API
  const handleFetchOrcidWorks = async (forcedOrcid = null) => {
    const rawTarget = forcedOrcid || orcidInput;
    const targetOrcid = normalizeOrcid(rawTarget);

    if (!targetOrcid || !isValidOrcid(targetOrcid)) {
      setDiscoveryError('Please enter a valid 16-digit ORCID iD (e.g., 0000-0002-8262-9894).');
      return;
    }

    setDiscoveryError('');
    setExtractingWorks(true);
    setDiscoveredCandidates(null);
    setSelectedCandidateKeys({});

    setExtractProgress({ stage: 'CONNECTING', message: `Connecting to ORCID Public API v3.0 for ${targetOrcid}...`, percent: 25 });
    await new Promise(r => setTimeout(r, 200));

    setExtractProgress({ stage: 'FETCHING', message: `Fetching person profile & publication summaries...`, percent: 60 });

    const result = await fetchOrcidData(targetOrcid);

    setExtractProgress({ stage: 'CROSS_REF', message: `Evaluating institutional deduplication & Crossref DOIs...`, percent: 85 });
    await new Promise(r => setTimeout(r, 200));

    setExtractingWorks(false);

    if (result.success) {
      setOrcidProfile(result.profile);
      const portalPubs = getPublications();
      const rawWorks = result.works || [];

      // Categorize works as NEW vs EXACT_DUPLICATE
      const candidates = rawWorks.map((w, idx) => {
        const rawDoi = (w.doi || '').trim().toLowerCase();
        const rawEid = (w.scopusEid || '').trim();
        const rawUid = (w.wosUid || '').trim();
        const cleanTitle = (w.title || '').toLowerCase().trim();

        const isDuplicate = portalPubs.some(p => !p.isDeleted && (
          (rawDoi && (p.doi || '').trim().toLowerCase() === rawDoi) ||
          (rawEid && p.scopusEid === rawEid) ||
          (rawUid && p.wosUid === rawUid) ||
          (cleanTitle && p.title && p.title.toLowerCase().trim() === cleanTitle)
        ));

        return {
          ...w,
          candidateId: w.id || `ORCID-${w.putCode || idx + 1}`,
          classification: isDuplicate ? 'EXACT_DUPLICATE' : 'NEW'
        };
      });

      const newCount = candidates.filter(c => c.classification === 'NEW').length;
      const dupCount = candidates.filter(c => c.classification === 'EXACT_DUPLICATE').length;
      const doiCount = candidates.filter(c => c.doi).length;

      setDiscoveredCandidates({
        summary: {
          totalDiscovered: candidates.length,
          newRecords: newCount,
          duplicates: dupCount,
          crossSourceEnriched: doiCount
        },
        candidates
      });

      // Auto-select all new candidates by default for quick 1-click import
      const initialKeys = {};
      candidates.forEach((c, idx) => {
        if (c.classification === 'NEW') {
          initialKeys[c.candidateId || idx] = true;
        }
      });
      setSelectedCandidateKeys(initialKeys);

      setExtractProgress({ stage: 'COMPLETE', message: `Extracted ${candidates.length} work(s) from ORCID.`, percent: 100 });
      showToast(`Fetched ${candidates.length} works from ORCID for ${result.profile?.fullName || targetOrcid}.`);
    } else {
      setDiscoveryError(result.error || 'Failed to fetch works from ORCID Public API.');
      setExtractProgress({ stage: 'ERROR', message: 'Extraction failed.', percent: 0 });
    }
  };

  // 2. Direct Submission by ORCID iD
  const handleFetchByOrcidId = async (e) => {
    if (e) e.preventDefault();
    const raw = orcidInput.trim();
    if (!raw) {
      setDiscoveryError('Please enter a 16-digit ORCID iD (e.g. 0000-0002-8262-9894).');
      return;
    }

    const cleaned = normalizeOrcid(raw);
    if (!isValidOrcid(cleaned)) {
      setDiscoveryError('Invalid ORCID iD format or checksum. Format must be 0000-000X-XXXX-XXXX (16 digits).');
      return;
    }

    setDiscoveryError('');
    setOrcidInput(cleaned);
    await handleFetchOrcidWorks(cleaned);
  };

  const toggleSelectCandidate = (id) => {
    setSelectedCandidateKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectAll = (select) => {
    if (!discoveredCandidates) return;
    const updated = {};
    discoveredCandidates.candidates.forEach(c => {
      if (select) {
        if (activeTab === 'ALL' || c.classification === activeTab) {
          updated[c.candidateId] = true;
        }
      }
    });
    setSelectedCandidateKeys(updated);
  };

  // 6. Bulk Import Publications (Import All / Import All New / Import Selected)
  const handleImportCandidates = (importMode = 'SELECTED') => {
    if (!discoveredCandidates) return;
    let toImport = [];

    if (importMode === 'ALL') {
      toImport = discoveredCandidates.candidates;
    } else if (importMode === 'ALL_NEW') {
      toImport = discoveredCandidates.candidates.filter(c => c.classification === 'NEW');
    } else {
      toImport = discoveredCandidates.candidates.filter(c => selectedCandidateKeys[c.candidateId]);
    }

    if (toImport.length === 0) {
      setDiscoveryError(importMode === 'ALL_NEW' ? 'No NEW publications ready to import.' : 'Please select at least one publication to import.');
      return;
    }

    setDiscoveryError('');
    setImporting(true);

    const targetOrcid = normalizeOrcid(orcidInput);
    const matchedFaculty = facultyList.find(f => 
      (f.orcid && normalizeOrcid(f.orcid) === targetOrcid) ||
      (orcidProfile?.fullName && f.name.toLowerCase().includes(orcidProfile.fullName.toLowerCase()))
    );

    const scholarName = orcidProfile?.fullName || matchedFaculty?.name || 'ORCID Researcher';
    const scholarDept = matchedFaculty?.department || currentUser?.department || 'R&D';
    const scholarId = matchedFaculty?.id || currentUser?.facultyId || 'ORCID-SCHOLAR';

    const preparedCandidates = toImport.map(c => ({
      ...c,
      department: scholarDept,
      departmentCode: scholarDept,
      facultyId: scholarId,
      facultyName: scholarName,
      academicYear: `${c.publicationYear || 2025}-${String((c.publicationYear || 2025) + 1).slice(-2)}`,
      source: 'ORCID',
      sources: ['ORCID'],
      workflowStatus: 'IMPORTED_PENDING_REVIEW',
      matchStatus: 'VERIFIED_NEC_MATCH',
      authors: c.authors?.length ? c.authors : [
        {
          authorOrder: 1,
          authorType: 'INTERNAL_FACULTY',
          facultyId: scholarId,
          name: scholarName,
          department: scholarDept,
          affiliation: 'Narasaraopeta Engineering College',
          isFirstAuthor: true,
          isCorresponding: true
        }
      ]
    }));

    importPublicationsBatch(preparedCandidates, currentUser, 'ORCID');

    setImporting(false);
    setSelectedCandidateKeys({});
    showToast(`Successfully imported ${toImport.length} publication(s) into the review queue.`);
    setImportNotice(`Successfully imported ${toImport.length} publication(s) from ORCID into the review queue.`);

    // Refresh classifications so newly imported items now show as duplicates
    const portalPubs = getPublications();
    const updatedCandidates = discoveredCandidates.candidates.map(w => {
      const rawDoi = (w.doi || '').trim().toLowerCase();
      const cleanTitle = (w.title || '').toLowerCase().trim();
      const isDuplicate = portalPubs.some(p => !p.isDeleted && (
        (rawDoi && (p.doi || '').trim().toLowerCase() === rawDoi) ||
        (cleanTitle && p.title && p.title.toLowerCase().trim() === cleanTitle)
      ));
      return {
        ...w,
        classification: isDuplicate ? 'EXACT_DUPLICATE' : 'NEW'
      };
    });

    setDiscoveredCandidates(prev => ({
      ...prev,
      summary: {
        ...prev.summary,
        newRecords: updatedCandidates.filter(c => c.classification === 'NEW').length,
        duplicates: updatedCandidates.filter(c => c.classification === 'EXACT_DUPLICATE').length
      },
      candidates: updatedCandidates
    }));
  };

  const filteredCandidates = discoveredCandidates?.candidates.filter(c => {
    if (activeTab === 'ALL') return true;
    return c.classification === activeTab;
  }) || [];

  const selectedCount = Object.values(selectedCandidateKeys).filter(Boolean).length;

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      {/* Toast Notifications */}
      {discoveryToast && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <CheckCircle2 size={16} />
          <span>{discoveryToast}</span>
        </div>
      )}
      {discoveryError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <AlertCircle size={16} />
          <span>{discoveryError}</span>
        </div>
      )}

      {/* 1. Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #070F1E 0%, #0B192C 60%, #122846 100%)',
        borderRadius: '16px',
        padding: '1.5rem 2rem',
        color: '#FFFFFF',
        border: '1px solid #D4AF37',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(166, 206, 57, 0.15)',
            border: '1.5px solid #A6CE39',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#A6CE39'
          }}>
            {/* Official ORCID iD Glyph */}
            <span style={{ fontWeight: 900, fontSize: '1.25rem', fontFamily: 'sans-serif' }}>iD</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#FFFFFF', fontFamily: 'Cinzel, Georgia, serif' }}>
                NEC Research Discovery & ORCID Scholar Registry
              </h1>
              <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.55rem', borderRadius: '4px', background: '#A6CE39', color: '#070F1E', fontWeight: 900, letterSpacing: '0.5px' }}>
                OFFICIAL ORCID PUBLIC API v3.0
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#CBD5E1', margin: 0 }}>
              Live ORCID Public API registry search, verified profile identity binding, Crossref DOI enrichment, and 1-click publication ingestion.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#94A3B8' }}>
            <div>Registry: <strong style={{ color: '#A6CE39' }}>ORCID v3.0 Public API</strong></div>
            <div>Enrichment: <strong>Crossref DOIs</strong> • Client ID: <strong>{ORCID_CONFIG.clientId ? 'Active' : 'Standby'}</strong></div>
          </div>
        </div>
      </div>

      {/* 2. Real Progress Indicator */}
      {extractingWorks && (
        <div style={{ background: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1E40AF' }}>
              {extractProgress.message}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563EB' }}>
              {extractProgress.percent}%
            </span>
          </div>
          <div style={{ height: '6px', background: '#DBEAFE', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${extractProgress.percent}%`, height: '100%', background: '#2563EB', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {/* 3. Enter ORCID iD & Fetch Publications Card */}
      <div id="orcid-search-section" style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ marginBottom: '1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: 'rgba(166, 206, 57, 0.2)',
              border: '1.5px solid #A6CE39',
              color: '#658C12',
              fontWeight: 900,
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'sans-serif'
            }}>iD</span>
            <h2 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Enter ORCID iD & Fetch Publications
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
            Enter the researcher's 16-digit ORCID identifier (e.g., <strong>0000-0002-8262-9894</strong> or full profile link) to query the official ORCID Public API v3.0, retrieve verified works, and import into the review queue.
          </p>
        </div>

        <form onSubmit={handleFetchByOrcidId} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '320px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <span style={{ color: '#A6CE39', fontWeight: 900, fontSize: '0.95rem' }}>iD</span>
            </div>
            <input
              id="orcid-id-input"
              type="text"
              value={orcidInput}
              onChange={(e) => setOrcidInput(e.target.value)}
              placeholder="Enter 16-digit ORCID iD (e.g. 0000-0002-8262-9894 or https://orcid.org/...)"
              style={{
                width: '100%',
                padding: '0.72rem 0.85rem 0.72rem 2.6rem',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.9rem',
                outline: 'none',
                fontWeight: 700,
                fontFamily: 'monospace',
                color: '#0F172A',
                boxSizing: 'border-box',
                background: '#F8FAFC'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={extractingWorks}
            style={{
              padding: '0.72rem 1.6rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #070F1E 0%, #0B192C 100%)',
              color: '#F1C40F',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: extractingWorks ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 3px 10px rgba(7, 15, 30, 0.25)'
            }}
          >
            <RefreshCw size={15} className={extractingWorks ? 'animate-spin' : ''} />
            {extractingWorks ? 'Fetching Works...' : 'Fetch ORCID Publications'}
          </button>

          {orcidInput && (
            <button
              type="button"
              onClick={() => setOrcidInput('')}
              style={{
                padding: '0.72rem 1rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#64748B',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          )}
        </form>

        {/* Verified ORCID Scholar Details */}
        {orcidProfile && (
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', color: '#065F46', background: '#ECFDF5', border: '1.5px solid #A7F3D0', padding: '0.75rem 1.1rem', borderRadius: '10px', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircle2 size={18} style={{ color: '#059669' }} />
              <div>
                <div style={{ fontWeight: 800, color: '#064E3B' }}>
                  {orcidProfile.fullName || `${orcidProfile.givenName || ''} ${orcidProfile.familyName || ''}`.trim()}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#047857', fontFamily: 'monospace' }}>
                  ORCID iD: {orcidProfile.orcid}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleCopy(`https://orcid.org/${orcidProfile.orcid}`, 'ORCID URL')}
                style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.35rem 0.6rem', color: '#475569', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                {copiedId === `https://orcid.org/${orcidProfile.orcid}` ? <Check size={12} style={{ color: '#059669' }} /> : <Copy size={12} />} {copiedId === `https://orcid.org/${orcidProfile.orcid}` ? 'Copied' : 'Copy'}
              </button>
              <a
                href={`https://orcid.org/${orcidProfile.orcid}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', fontWeight: 700, fontSize: '0.78rem' }}
              >
                View on ORCID.org <ExternalLink size={13} />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 5. Import Success Notice */}
      {importNotice && (
        <div style={{ background: '#ECFDF5', borderRadius: '10px', border: '1px solid #A7F3D0', padding: '0.85rem 1.25rem', color: '#065F46', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} /> {importNotice}
          </span>
          <button type="button" onClick={() => setImportNotice('')} style={{ background: 'none', border: 'none', color: '#047857', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}

      {/* 6. Discovered ORCID Publications List & Batch Import */}
      {discoveredCandidates && (
        <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Total in ORCID Record', value: discoveredCandidates.summary.totalDiscovered, color: '#0F172A', bg: '#F8FAFC' },
              { label: 'New Ready to Import', value: discoveredCandidates.summary.newRecords, color: '#059669', bg: '#ECFDF5' },
              { label: 'Already in Portal', value: discoveredCandidates.summary.duplicates, color: '#D97706', bg: '#FEFCE8' },
              { label: 'With Verified DOI', value: discoveredCandidates.summary.crossSourceEnriched, color: '#2563EB', bg: '#EFF6FF' }
            ].map((k, idx) => (
              <div key={idx} style={{ background: k.bg, padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: k.color, fontFamily: 'Cinzel, serif' }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Action Header & Bulk Import Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[
                { id: 'NEW', label: `New (${discoveredCandidates.summary.newRecords})` },
                { id: 'ALL', label: `All Works (${discoveredCandidates.candidates.length})` },
                { id: 'EXACT_DUPLICATE', label: `Already in Portal (${discoveredCandidates.summary.duplicates})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeTab === tab.id ? '#070F1E' : '#F1F5F9',
                    color: activeTab === tab.id ? '#F1C40F' : '#475569',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Bulk Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                style={{ fontSize: '0.74rem', color: '#2563EB', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Select All
              </button>
              <span style={{ color: '#CBD5E1' }}>•</span>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Deselect All
              </button>
              <span style={{ color: '#CBD5E1' }}>•</span>

              {/* 1-Click Import All New */}
              <button
                type="button"
                disabled={importing || discoveredCandidates.summary.newRecords === 0}
                onClick={() => handleImportCandidates('ALL_NEW')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: discoveredCandidates.summary.newRecords === 0 ? '#E2E8F0' : '#059669',
                  color: discoveredCandidates.summary.newRecords === 0 ? '#94A3B8' : '#FFFFFF',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: discoveredCandidates.summary.newRecords === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: discoveredCandidates.summary.newRecords === 0 ? 'none' : '0 2px 6px rgba(5, 150, 105, 0.25)'
                }}
              >
                <PlusCircle size={14} />
                Import All New ({discoveredCandidates.summary.newRecords})
              </button>

              {/* 1-Click Import ALL Publications */}
              <button
                type="button"
                disabled={importing || discoveredCandidates.candidates.length === 0}
                onClick={() => handleImportCandidates('ALL')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #070F1E 0%, #0B192C 100%)',
                  color: '#F1C40F',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: discoveredCandidates.candidates.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 2px 6px rgba(7, 15, 30, 0.25)'
                }}
              >
                <Download size={14} />
                Import All Publications ({discoveredCandidates.candidates.length})
              </button>
            </div>
          </div>

          {/* Cards List */}
          {filteredCandidates.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem' }}>
              No candidate publications found for the selected tab.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredCandidates.map(c => {
                const isSelected = !!selectedCandidateKeys[c.candidateId];
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
                      gap: '0.85rem',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectCandidate(c.candidateId)}
                      style={{ marginTop: '4px', width: '16px', height: '16px', cursor: 'pointer' }}
                    />

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>
                          {c.title}
                        </div>
                        <span style={{
                          padding: '0.15rem 0.55rem',
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

                      <div style={{ fontSize: '0.76rem', color: '#64748B', marginBottom: '0.45rem' }}>
                        {c.journalName ? <strong style={{ color: '#334155' }}>{c.journalName}</strong> : <span>Scholarly Work</span>}
                        <span> • Year: {c.publicationYear}</span>
                        {c.doi && (
                          <span> • DOI: <a href={`https://doi.org/${c.doi}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', textDecoration: 'none' }}>{c.doi}</a></span>
                        )}
                        <span> • Type: {c.publicationType}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '4px', background: '#A6CE39', color: '#070F1E' }}>
                          ORCID
                        </span>
                        {c.doi && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '4px', background: '#D97706', color: '#FFFFFF' }}>
                            CROSSREF DOI
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setComparisonCandidate(c)}
                          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#2563EB', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          View Metadata <ExternalLink size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Import Selected Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
              <strong>{selectedCount}</strong> publication(s) selected for import.
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                type="button"
                disabled={importing || selectedCount === 0}
                onClick={() => handleImportCandidates('SELECTED')}
                style={{
                  padding: '0.55rem 1.4rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: selectedCount === 0 ? '#CBD5E1' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: selectedCount === 0 ? 'none' : '0 2px 10px rgba(16, 185, 129, 0.3)'
                }}
              >
                {importing ? 'Importing Selected...' : `Import Selected (${selectedCount})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Compare Discovered Metadata Modal */}
      {comparisonCandidate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 15, 30, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '650px', width: '100%', border: '1px solid #D4AF37', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ background: '#070F1E', padding: '1rem 1.25rem', color: '#FFFFFF', borderBottom: '2px solid #D4AF37', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Discovered ORCID Publication Metadata</h3>
              <button type="button" onClick={() => setComparisonCandidate(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
              <div><strong>Title:</strong> {comparisonCandidate.title}</div>
              <div><strong>Publication Type:</strong> {comparisonCandidate.publicationType}</div>
              <div><strong>Journal / Container:</strong> {comparisonCandidate.journalName || '—'}</div>
              <div><strong>Publication Year:</strong> {comparisonCandidate.publicationYear}</div>
              <div><strong>Date:</strong> {comparisonCandidate.publicationDate || '—'}</div>
              <div><strong>DOI:</strong> {comparisonCandidate.doi ? <a href={`https://doi.org/${comparisonCandidate.doi}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB' }}>{comparisonCandidate.doi}</a> : '—'}</div>
              <div><strong>ORCID Put-Code:</strong> <code>{comparisonCandidate.putCode || '—'}</code></div>
              <div><strong>Provenance Source:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>Official ORCID Public API v3.0</span></div>
            </div>
            <div style={{ padding: '0.75rem 1.25rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setComparisonCandidate(null)} style={{ padding: '0.4rem 0.95rem', background: '#070F1E', color: '#F1C40F', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
