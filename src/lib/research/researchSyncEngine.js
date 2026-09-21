/**
 * Dedicated ORCID Public API v3.0 & Crossref Publication Synchronization Engine
 * Exclusively uses official ORCID Public API and Crossref DOI metadata enrichment.
 * ZERO mock data — strictly reflects genuine provider API payloads.
 */

import { fetchCrossrefMetadata, normalizeDOI, isValidDOI } from './doiService.js';
import { fetchOrcidData, isValidOrcid, normalizeOrcid } from './orcidService.js';
import { 
  fetchScopusAuthorProfile, 
  fetchScopusAuthorPublications, 
  checkScopusApiDiagnostic 
} from './scopusService.js';
import { getPublications } from '../../data/portalStore.js';

/**
 * Normalizes title string for duplicate fuzzy matching
 * @param {string} title 
 * @returns {string}
 */
export function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Executes unified ORCID + Elsevier Scopus publication discovery and deduplication pipeline
 * @param {object} identifiers { orcid, scopusAuthorId }
 * @param {function} onProgress (statusObj) => void
 * @returns {Promise<{success: boolean, summary: object, candidates: Array, profiles: object, sourceStatuses: object, error?: string}>}
 */
export async function runResearchSyncJob(identifiers = {}, onProgress = null) {
  const emit = (stage, message, percent) => {
    if (onProgress) onProgress({ stage, message, percent });
  };

  const orcid = identifiers.orcid ? normalizeOrcid(identifiers.orcid) : null;
  const scopusAuthorId = identifiers.scopusAuthorId ? String(identifiers.scopusAuthorId).trim() : null;

  if (!orcid && !scopusAuthorId) {
    return {
      success: false,
      error: 'Please provide an ORCID iD or a Scopus Author ID to start research synchronization.'
    };
  }

  const profiles = {
    orcid: null,
    scopus: null
  };

  const sourceStatuses = {
    orcid: orcid ? 'VERIFYING' : 'IDLE',
    scopus: scopusAuthorId ? 'VERIFYING' : 'IDLE',
    crossref: 'READY'
  };

  const collectedWorks = [];

  try {
    // ──────── STAGE 1: ORCID DISCOVERY ────────
    if (orcid) {
      emit('ORCID', `Connecting to official ORCID Public API v3.0 for ${orcid}...`, 15);
      const orcidRes = await fetchOrcidData(orcid);
      if (orcidRes.success) {
        profiles.orcid = orcidRes.profile;
        sourceStatuses.orcid = 'VERIFIED';
        if (Array.isArray(orcidRes.works)) {
          collectedWorks.push(...orcidRes.works);
        }
        emit('ORCID', `✓ Loaded ORCID profile and ${orcidRes.works?.length || 0} public works`, 35);
      } else {
        sourceStatuses.orcid = 'ERROR';
        emit('ORCID', `⚠ ORCID Notice: ${orcidRes.error}`, 35);
        if (!scopusAuthorId) {
          return {
            success: false,
            error: orcidRes.error || 'Failed to fetch researcher record from ORCID Public API.',
            sourceStatuses
          };
        }
      }
    }

    // ──────── STAGE 2: ELSEVIER SCOPUS DISCOVERY ────────
    if (scopusAuthorId) {
      emit('SCOPUS', `Connecting to official Elsevier Scopus API for Author ID: ${scopusAuthorId}...`, 45);
      try {
        const scopusProfileRes = await fetchScopusAuthorProfile(scopusAuthorId);
        if (scopusProfileRes.success) {
          profiles.scopus = scopusProfileRes.profile;
          sourceStatuses.scopus = 'VERIFIED';
        } else {
          sourceStatuses.scopus = 'UNAVAILABLE';
        }

        const scopusPubsRes = await fetchScopusAuthorPublications(scopusAuthorId);
        if (scopusPubsRes.success && Array.isArray(scopusPubsRes.publications)) {
          const scopusWorks = scopusPubsRes.publications.map(p => ({
            title: p.title,
            doi: p.doi,
            scopusEid: p.scopusEid,
            journalName: p.venue,
            venue: p.venue,
            publicationYear: p.year,
            publicationDate: p.publicationDate || (p.year ? `${p.year}-01-01` : null),
            publicationType: p.type || 'Journal Article',
            source: 'SCOPUS',
            scopusIndexed: true,
            verificationStatus: 'Verified in Scopus',
            citationCount: p.citationCount,
            url: p.scopusUrl
          }));
          collectedWorks.push(...scopusWorks);
          emit('SCOPUS', `✓ Loaded Scopus profile & ${scopusWorks.length} indexed publications`, 60);
        } else {
          emit('SCOPUS', `⚠ Scopus Notice: ${scopusPubsRes.error || 'No indexed works found'}`, 60);
        }
      } catch (scopusErr) {
        sourceStatuses.scopus = 'ERROR';
        emit('SCOPUS', `⚠ Scopus API error: ${scopusErr.message}`, 60);
      }
    }

    // ──────── STAGE 3: CROSSREF DOI METADATA ENRICHMENT ────────
    emit('CROSSREF', 'Cross-referencing verified DOIs with Crossref bibliographic metadata...', 75);
    const enrichedMap = new Map();

    for (let i = 0; i < collectedWorks.length; i++) {
      const work = collectedWorks[i];
      const canonicalDoi = normalizeDOI(work.doi);

      if (canonicalDoi && isValidDOI(canonicalDoi) && !enrichedMap.has(canonicalDoi)) {
        try {
          const crossrefRes = await fetchCrossrefMetadata(canonicalDoi);
          if (crossrefRes.success) {
            enrichedMap.set(canonicalDoi, crossrefRes.data);
          }
        } catch {
          // Graceful network timeout fallback
        }
      }
    }
    emit('CROSSREF', `✓ Enriched metadata for ${enrichedMap.size} DOIs from official Crossref repository`, 85);

    // ──────── STAGE 3: MERGING & DEDUPLICATION ────────
    emit('DEDUPLICATION', 'Checking existing institutional records and removing duplicates...', 92);

    const existingPubs = getPublications(true);
    const candidateMap = new Map();

    collectedWorks.forEach(work => {
      const canonicalDoi = normalizeDOI(work.doi);
      const key = canonicalDoi || (work.putCode ? `ORCID-${work.putCode}` : normalizeTitle(work.title));

      if (candidateMap.has(key)) {
        // Merge into existing candidate
        const existing = candidateMap.get(key);
        existing.sources = Array.from(new Set([...existing.sources, work.source]));
        if (!existing.doi && canonicalDoi) existing.doi = canonicalDoi;
      } else {
        const enriched = canonicalDoi ? enrichedMap.get(canonicalDoi) : null;
        const initialSources = [work.source, ...(enriched ? ['CROSSREF'] : [])];

        const candidate = {
          candidateId: 'CAND-' + Math.random().toString(36).substring(2, 9),
          title: enriched?.title || work.title,
          publicationType: enriched?.publicationType || work.publicationType || 'Journal Article',
          journalName: enriched?.journalName || work.journalName || '',
          publisher: enriched?.publisher || work.publisher || '',
          publicationDate: enriched?.publicationDate || work.publicationDate || `${new Date().getFullYear()}-01-01`,
          publicationYear: enriched?.publicationYear || work.publicationYear || new Date().getFullYear(),
          volume: enriched?.volume || work.volume || '',
          issue: enriched?.issue || work.issue || '',
          pages: enriched?.pages || work.pages || '',
          articleNumber: enriched?.articleNumber || work.articleNumber || '',
          issn: enriched?.issn || work.issn || '',
          isbn: enriched?.isbn || work.isbn || '',
          doi: canonicalDoi || work.doi || '',
          url: enriched?.url || work.url || (canonicalDoi ? `https://doi.org/${canonicalDoi}` : ''),
          sources: initialSources,
          authors: enriched?.authors?.length ? enriched.authors : (work.authors || []),
          indexing: ['ORCID', 'Crossref'],
          classification: 'NEW',
          matchReason: '',
          existingRecordId: null,
          selected: true
        };

        // Classify duplicate against existing institutional database
        const exactDoiMatch = canonicalDoi ? existingPubs.find(p => normalizeDOI(p.doi) === canonicalDoi) : null;
        const titleMatch = existingPubs.find(p => normalizeTitle(p.title) === normalizeTitle(work.title) && p.publicationYear === work.publicationYear);

        if (exactDoiMatch) {
          candidate.classification = 'EXACT_DUPLICATE';
          candidate.matchReason = `Exact DOI match with existing record ${exactDoiMatch.publicationRecordNumber || exactDoiMatch.id}`;
          candidate.existingRecordId = exactDoiMatch.id;
          candidate.selected = false;
        } else if (titleMatch) {
          candidate.classification = 'LIKELY_DUPLICATE';
          candidate.matchReason = `Title & Year match with existing record ${titleMatch.publicationRecordNumber || titleMatch.id}`;
          candidate.existingRecordId = titleMatch.id;
          candidate.selected = false;
        } else {
          candidate.classification = 'NEW';
          candidate.matchReason = 'Unique discovered research publication';
          candidate.selected = true;
        }

        candidateMap.set(key, candidate);
      }
    });

    const candidateList = Array.from(candidateMap.values());

    const summary = {
      totalDiscovered: collectedWorks.length,
      uniqueWorks: candidateList.length,
      newRecords: candidateList.filter(c => c.classification === 'NEW').length,
      duplicates: candidateList.filter(c => c.classification === 'EXACT_DUPLICATE' || c.classification === 'LIKELY_DUPLICATE').length,
      crossSourceEnriched: candidateList.filter(c => c.sources && c.sources.length >= 2).length,
      updates: candidateList.filter(c => c.classification === 'UPDATE_AVAILABLE').length
    };

    emit('COMPLETE', `Discovery complete: ${summary.newRecords} new publications ready for review.`, 100);

    return {
      success: true,
      summary: summary,
      candidates: candidateList,
      profiles: profiles,
      sourceStatuses: sourceStatuses
    };
  } catch (err) {
    emit('ERROR', `Sync error: ${err.message}`, 100);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred during ORCID research sync.'
    };
  }
}
