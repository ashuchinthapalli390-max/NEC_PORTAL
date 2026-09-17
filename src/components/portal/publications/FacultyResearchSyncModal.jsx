import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { FACULTY_DATA } from '../../../data/masterData.js';
import { runResearchSyncJob } from '../../../lib/research/researchSyncEngine.js';
import { isValidOrcid, ORCID_CONFIG, isOrcidConfigured, getOrcidOAuthUrl } from '../../../lib/research/orcidService.js';
import { isValidScopusAuthorId } from '../../../lib/research/scopusService.js';
import { isValidWosResearcherId } from '../../../lib/research/wosService.js';
import { 
  importPublicationsBatch, 
  getFacultyResearchProfile, 
  saveFacultyResearchProfile 
} from '../../../data/portalStore.js';

export default function FacultyResearchSyncModal({
  isOpen,
  onClose,
  currentUser,
  onSyncComplete
}) {
  const initialFacultyId = currentUser?.facultyId || (currentUser?.role === 'FACULTY' ? currentUser.facultyId : FACULTY_DATA[0]?.id) || 'NEC-PER-0284';
  const [selectedFacultyId, setSelectedFacultyId] = useState(initialFacultyId);
  const facultyRecord = FACULTY_DATA.find(f => f.id === selectedFacultyId) || FACULTY_DATA[0];

  // Identifiers state — loaded strictly per faculty ID from portalStore
  const [identifiers, setIdentifiers] = useState({
    orcid: '',
    scopusAuthorId: '',
    wosResearcherId: '',
    googleScholarId: '',
    vidwanId: ''
  });

  const [idSavedMessage, setIdSavedMessage] = useState('');

  // Sync execution state
  const [syncing, setSyncing] = useState(false);
  const [progressState, setProgressState] = useState({ stage: 'IDLE', message: '', percent: 0 });
  const [syncResult, setSyncResult] = useState(null);
  const [selectedCandidateKeys, setSelectedCandidateKeys] = useState({});
  const [activeCandidateTab, setActiveCandidateTab] = useState('NEW');
  const [comparisonCandidate, setComparisonCandidate] = useState(null);
  const [importing, setImporting] = useState(false);

  // Load faculty's own stored identifiers whenever selectedFacultyId changes
  useEffect(() => {
    if (selectedFacultyId) {
      const stored = getFacultyResearchProfile(selectedFacultyId);
      setIdentifiers({
        orcid: stored.orcid || '',
        scopusAuthorId: stored.scopusAuthorId || '',
        wosResearcherId: stored.wosResearcherId || '',
        googleScholarId: stored.googleScholarId || '',
        vidwanId: stored.vidwanId || ''
      });
      // Reset sync results when switching faculty
      setSyncResult(null);
      setSelectedCandidateKeys({});
      setProgressState({ stage: 'IDLE', message: '', percent: 0 });
      setIdSavedMessage('');
    }
  }, [selectedFacultyId]);

  const handleSaveIdentifiers = () => {
    saveFacultyResearchProfile(selectedFacultyId, identifiers, currentUser);
    setIdSavedMessage('Identifiers saved to institutional profile.');
    setTimeout(() => setIdSavedMessage(''), 3500);
  };

  const [syncModalError, setSyncModalError] = useState('');
  const [syncModalToast, setSyncModalToast] = useState('');

  const handleStartSync = async () => {
    const hasAtLeastOne = identifiers.orcid || identifiers.scopusAuthorId || identifiers.wosResearcherId;
    if (!hasAtLeastOne) {
      setSyncModalError('Please enter at least one research identifier (ORCID, Scopus Author ID, or WoS ResearcherID).');
      return;
    }

    setSyncModalError('');
    // Auto-save before sync
    saveFacultyResearchProfile(selectedFacultyId, identifiers, currentUser);

    setSyncing(true);
    setSyncResult(null);
    setSelectedCandidateKeys({});

    const result = await runResearchSyncJob(identifiers, (prog) => {
      setProgressState(prog);
    });

    setSyncing(false);

    if (result.success) {
      setSyncResult(result);
      // Auto-select all NEW candidates
      const initialSelection = {};
      result.candidates.forEach(c => {
        if (c.classification === 'NEW') {
          initialSelection[c.candidateId] = true;
        }
      });
      setSelectedCandidateKeys(initialSelection);
    } else {
      setSyncModalError(result.error || 'Failed to sync with research registries.');
    }
  };

  const toggleSelectCandidate = (id) => {
    setSelectedCandidateKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectAll = (select) => {
    if (!syncResult) return;
    const updated = {};
    syncResult.candidates.forEach(c => {
      if (select) {
        if (activeCandidateTab === 'ALL' || c.classification === activeCandidateTab) {
          updated[c.candidateId] = true;
        }
      }
    });
    setSelectedCandidateKeys(updated);
  };

  const handleImportSelected = () => {
    if (!syncResult) return;
    const toImport = syncResult.candidates.filter(c => selectedCandidateKeys[c.candidateId]);
    if (toImport.length === 0) {
      setSyncModalError('Please select at least one publication to import.');
      return;
    }

    setSyncModalError('');
    setImporting(true);
    const preparedCandidates = toImport.map(c => ({
      ...c,
      department: facultyRecord.department,
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
          affiliation: 'Narasaraopeta Engineering College',
          isFirstAuthor: true,
          isCorresponding: true
        }
      ]
    }));

    importPublicationsBatch(preparedCandidates, currentUser);

    setImporting(false);
    setSyncModalToast(`Successfully imported ${toImport.length} publication(s) into review pipeline.`);
    setTimeout(() => {
      if (onSyncComplete) onSyncComplete();
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  const filteredCandidates = syncResult?.candidates.filter(c => {
    if (activeCandidateTab === 'ALL') return true;
    return c.classification === activeCandidateTab;
  }) || [];

  const selectedCount = Object.values(selectedCandidateKeys).filter(Boolean).length;

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
        maxWidth: '1000px',
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
          padding: '1.25rem 1.75rem',
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
                Official Research Auto-Sync Engine
              </h2>
              <div style={{ fontSize: '0.74rem', color: '#D4AF37', fontWeight: 600 }}>
                Live Crossref, ORCID Public API v3.0, Scopus & Web of Science Registry Sync
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

        {/* 2. Scrollable Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {syncModalError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{syncModalError}</span>
            </div>
          )}
          {syncModalToast && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} />
              <span>{syncModalToast}</span>
            </div>
          )}
          {/* Faculty Selector & Real Identifier Inputs */}
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
                    ORCID iD (16-Digit)
                    {isOrcidConfigured() && (
                      <span style={{ fontSize: '0.66rem', color: '#059669', background: '#ECFDF5', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #A7F3D0', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={10} /> Connected (APP-8JDS...)
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
                  placeholder="e.g. 0000-0002-5550-9651"
                  value={identifiers.orcid}
                  onChange={(e) => setIdentifiers({ ...identifiers, orcid: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                  SCOPUS AUTHOR ID (10-11 Digits)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 57215069303"
                  value={identifiers.scopusAuthorId}
                  onChange={(e) => setIdentifiers({ ...identifiers, scopusAuthorId: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                  WEB OF SCIENCE RESEARCHERID
                </label>
                <input
                  type="text"
                  placeholder="e.g. HJZ-2915-2023"
                  value={identifiers.wosResearcherId}
                  onChange={(e) => setIdentifiers({ ...identifiers, wosResearcherId: e.target.value })}
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
                disabled={syncing || (!identifiers.orcid && !identifiers.scopusAuthorId && !identifiers.wosResearcherId)}
                onClick={handleStartSync}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: syncing ? '#94A3B8' : 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)',
                  color: '#070F1E',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: syncing ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px rgba(212, 175, 55, 0.35)'
                }}
              >
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Querying Registries...' : 'Sync Research Data'}
              </button>
            </div>
          </div>

          {/* Sync Progress Banner */}
          {syncing && (
            <div style={{ background: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE', padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1E40AF' }}>{progressState.message}</span>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#2563EB' }}>{progressState.percent}%</span>
              </div>
              <div style={{ height: '6px', background: '#DBEAFE', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${progressState.percent}%`, height: '100%', background: '#2563EB', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}

          {/* Real Results / Empty State */}
          {!syncResult && !syncing && (
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '14px', border: '1px dashed #CBD5E1' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Search size={24} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.35rem' }}>
                No Research Sync Has Been Run Yet
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', maxWidth: '440px', margin: '0 auto' }}>
                Enter or verify research identifiers above and click "Sync Research Data" to discover verified publications from official APIs.
              </p>
            </div>
          )}

          {syncResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Truthful KPI Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                {[
                  { label: 'Total Discovered', value: syncResult.summary.totalDiscovered, color: '#0F172A', bg: '#F8FAFC' },
                  { label: 'New Ready to Import', value: syncResult.summary.newRecords, color: '#059669', bg: '#ECFDF5' },
                  { label: 'Duplicates in Portal', value: syncResult.summary.duplicates, color: '#D97706', bg: '#FEFCE8' },
                  { label: 'Cross-Source Enriched', value: syncResult.summary.crossSourceEnriched, color: '#2563EB', bg: '#EFF6FF' }
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
                    { id: 'NEW', label: `New (${syncResult.summary.newRecords})` },
                    { id: 'ALL', label: `All Discovered (${syncResult.candidates.length})` },
                    { id: 'EXACT_DUPLICATE', label: `Duplicates (${syncResult.summary.duplicates})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveCandidateTab(tab.id)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: activeCandidateTab === tab.id ? '#070F1E' : '#F1F5F9',
                        color: activeCandidateTab === tab.id ? '#F1C40F' : '#475569',
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
                </div>
              </div>

              {/* Candidate Cards List */}
              {filteredCandidates.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>
                  No candidate publications found for the selected tab filter.
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
                          gap: '0.85rem'
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
                              <span key={si} style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', background: s === 'ORCID' ? '#A6CE39' : (s === 'SCOPUS' ? '#FF6C00' : '#2563EB'), color: '#FFFFFF' }}>
                                {s}
                              </span>
                            ))}

                            {c.scopusCitations && (
                              <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700 }}>
                                Citations: {c.scopusCitations}
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => setComparisonCandidate(c)}
                              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#2563EB', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              Compare Sources <ExternalLink size={11} />
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
        </div>

        {/* 3. Modal Bottom Action Bar */}
        <div style={{
          padding: '1rem 1.75rem',
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
            {selectedCount > 0 ? (
              <span><strong>{selectedCount}</strong> publication(s) selected for import.</span>
            ) : (
              <span>Select new publications to import into the departmental review pipeline.</span>
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
            <button
              type="button"
              disabled={importing || selectedCount === 0}
              onClick={handleImportSelected}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: selectedCount === 0 ? '#CBD5E1' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
                boxShadow: selectedCount === 0 ? 'none' : '0 2px 10px rgba(16, 185, 129, 0.3)'
              }}
            >
              {importing ? 'Importing...' : `Import Selected (${selectedCount})`}
            </button>
          </div>
        </div>
      </div>

      {/* Source Comparison Modal */}
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
              <div><strong>Journal:</strong> {comparisonCandidate.journalName || '—'}</div>
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
