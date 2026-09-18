/**
 * Official ORCID Public API v3.0 Integration Service
 */

/**
 * Validates ORCID format (XXXX-XXXX-XXXX-XXXX) including ISO 7064 MOD 11-2 checksum
 * @param {string} orcid 
 * @returns {boolean}
 */
export function isValidOrcid(orcid) {
  if (!orcid) return false;
  const cleaned = orcid.trim().replace(/^https?:\/\/orcid\.org\//i, '');
  if (!/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(cleaned)) return false;

  // Validate ISO 7064 MOD 11-2 Checksum
  const digits = cleaned.replace(/-/g, '');
  let total = 0;
  for (let i = 0; i < 15; i++) {
    const digit = parseInt(digits.charAt(i), 10);
    total = (total + digit) * 2;
  }
  const remainder = total % 11;
  const result = (12 - remainder) % 11;
  const checkDigit = result === 10 ? 'X' : String(result);

  return checkDigit.toUpperCase() === digits.charAt(15).toUpperCase();
}

/**
 * Normalizes ORCID string into standard format
 * @param {string} rawOrcid 
 * @returns {string}
 */
export function normalizeOrcid(rawOrcid) {
  if (!rawOrcid) return '';
  let cleaned = rawOrcid.trim().replace(/^https?:\/\/orcid\.org\//i, '').replace(/\s+/g, '');
  if (/^\d{15}[\dX]$/i.test(cleaned)) {
    cleaned = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12, 16)}`;
  }
  return cleaned;
}

// Official ORCID Public API v3.0 Configuration
export const ORCID_CONFIG = {
  clientId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ORCID_CLIENT_ID) || 'APP-8JDSVGUFZ9RYM805',
  accessToken: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ORCID_ACCESS_TOKEN) || '9bac1574-f57c-453f-a6b6-890df78ec3b6',
  baseUrl: 'https://pub.orcid.org/v3.0',
  authorizeUrl: 'https://orcid.org/oauth/authorize'
};

/**
 * Returns whether official ORCID API integration is configured
 * @returns {boolean}
 */
export function isOrcidConfigured() {
  return Boolean(ORCID_CONFIG.clientId);
}

/**
 * Constructs the official ORCID OAuth 2.0 Authorization URL for faculty identity linking
 * @param {string} [redirectUri]
 * @returns {string}
 */
export function getOrcidOAuthUrl(redirectUri) {
  const targetRedirect = redirectUri || (typeof window !== 'undefined' ? window.location.origin : 'https://www.nrtec.in');
  const params = new URLSearchParams({
    client_id: ORCID_CONFIG.clientId,
    response_type: 'code',
    scope: '/authenticate',
    redirect_uri: targetRedirect
  });
  return `${ORCID_CONFIG.authorizeUrl}?${params.toString()}`;
}

/**
 * Builds HTTP headers with official ORCID Bearer authorization for higher rate limits
 * @returns {Record<string, string>}
 */
export function getOrcidHeaders() {
  const headers = {
    'Accept': 'application/json'
  };
  // pub.orcid.org CORS only allows [X-Requested-With, Origin, Content-Type, Accept].
  // Sending Authorization in the browser causes CORS preflight rejection.
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser && ORCID_CONFIG.accessToken) {
    headers['Authorization'] = `Bearer ${ORCID_CONFIG.accessToken}`;
  }
  return headers;
}

/**
 * Searches for researcher profiles using the official ORCID Public API v3.0 expanded search
 * @param {string} query Search keyword, researcher name, or 16-digit ORCID iD
 * @param {object} [options]
 * @param {number} [options.rows=15] Max records to return
 * @param {string} [options.institution] Optional institution name to search
 * @returns {Promise<{success: boolean, results: Array, total: number, error?: string}>}
 */
export async function searchOrcidProfiles(query, options = {}) {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return { success: true, results: [], total: 0 };
  }

  // If user entered a valid ORCID format directly, fetch exact profile directly
  const normalized = normalizeOrcid(trimmed);
  if (isValidOrcid(normalized)) {
    const single = await fetchOrcidData(normalized);
    if (single.success && single.profile) {
      return {
        success: true,
        total: 1,
        results: [{
          orcid: single.profile.orcid,
          fullName: single.profile.fullName,
          givenName: single.profile.givenName,
          familyName: single.profile.familyName,
          creditName: single.profile.fullName,
          otherNames: [],
          institutions: ['Verified Direct ORCID Record'],
          worksCount: single.works?.length || 0,
          isExactOrcid: true,
          isInstitutionMatch: true,
          orcidUrl: `https://orcid.org/${single.profile.orcid}`
        }]
      };
    }
  }

  const rows = options.rows || 15;
  const BASE_URL = ORCID_CONFIG.baseUrl;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    // Build smart Lucene search query for ORCID expanded-search
    // Strip common academic titles like Dr., Prof.
    const cleanQuery = trimmed
      .replace(/\b(dr|prof|professor|mr|mrs|ms)\b\.?/gi, '')
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    let luceneQuery = cleanQuery;
    if (options.institution) {
      luceneQuery = `(${cleanQuery}) AND affiliation-org-name:"${options.institution}"`;
    }

    const searchUrl = `${BASE_URL}/expanded-search/?q=${encodeURIComponent(luceneQuery)}&rows=${rows}`;

    const resp = await fetch(searchUrl, {
      headers: getOrcidHeaders(),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      return { success: false, results: [], total: 0, error: `ORCID Search returned HTTP ${resp.status}` };
    }

    const json = await resp.json();
    const numFound = json['num-found'] || 0;
    const items = json['expanded-result'] || [];

    const candidates = items.map(r => {
      const orcidId = r['orcid-id'];
      const given = r['given-names'] || '';
      const family = r['family-names'] || '';
      const credit = r['credit-name'] || '';
      const full = credit || `${given} ${family}`.trim() || 'Researcher';
      const insts = r['institution-name'] || [];
      const others = r['other-name'] || [];

      // Detect institutional affiliation match
      const hasNecAffiliation = insts.some(i => 
        i.toLowerCase().includes('narasaraopeta') || 
        i.toLowerCase().includes('narasaraopet') ||
        /\bnec\b/i.test(i)
      );

      return {
        orcid: orcidId,
        fullName: full,
        givenName: given,
        familyName: family,
        creditName: credit,
        otherNames: others,
        institutions: insts,
        isInstitutionMatch: hasNecAffiliation,
        orcidUrl: `https://orcid.org/${orcidId}`
      };
    });

    // Sort to prioritize institutional matches first
    candidates.sort((a, b) => {
      if (a.isInstitutionMatch && !b.isInstitutionMatch) return -1;
      if (!a.isInstitutionMatch && b.isInstitutionMatch) return 1;
      return 0;
    });

    return {
      success: true,
      total: numFound,
      results: candidates
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { success: false, results: [], total: 0, error: 'ORCID Search request timed out.' };
    }
    return { success: false, results: [], total: 0, error: err.message || 'Failed to search ORCID profiles' };
  }
}

/**
 * Fetches researcher profile and works from official ORCID Public API v3.0
 * @param {string} rawOrcid 
 * @returns {Promise<{success: boolean, profile?: object, works?: Array, error?: string}>}
 */
export async function fetchOrcidData(rawOrcid) {
  const orcid = normalizeOrcid(rawOrcid);
  if (!isValidOrcid(orcid)) {
    return { success: false, error: 'Invalid ORCID iD format or checksum. Format must be 0000-000X-XXXX-XXXX.' };
  }

  const BASE_URL = ORCID_CONFIG.baseUrl;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    let givenName = '';
    let familyName = '';
    let creditName = '';
    let bio = '';

    // 1. Fetch Person Profile with official authenticated headers
    try {
      const personResp = await fetch(`${BASE_URL}/${orcid}/person`, {
        headers: getOrcidHeaders(),
        signal: controller.signal
      });

      if (personResp.ok) {
        const personJson = await personResp.json();
        const nameObj = personJson?.name;
        givenName = nameObj?.['given-names']?.value || '';
        familyName = nameObj?.['family-name']?.value || '';
        creditName = nameObj?.['credit-name']?.value || `${givenName} ${familyName}`.trim();
        bio = personJson?.biography?.content || '';
      }
    } catch (pErr) {
      console.warn('Could not retrieve ORCID person metadata:', pErr);
    }

    // 2. Fetch Works List with official authenticated headers
    const worksResp = await fetch(`${BASE_URL}/${orcid}/works`, {
      headers: getOrcidHeaders(),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!worksResp.ok) {
      if (worksResp.status === 404) {
        return { success: false, error: 'ORCID record not found or public access is restricted.' };
      }
      return { success: false, error: `ORCID Works API returned HTTP ${worksResp.status}` };
    }

    const works = [];
    if (worksResp.ok) {
      const worksJson = await worksResp.json();
      const groups = worksJson?.group || [];

      groups.forEach((g, idx) => {
        const summary = g['work-summary']?.[0];
        if (!summary) return;

        const title = summary.title?.title?.value || 'Untitled ORCID Work';
        const pubType = summary.type || 'journal-article';
        
        let pubYear = new Date().getFullYear();
        let pubDate = '';
        if (summary['publication-date']) {
          const pd = summary['publication-date'];
          pubYear = pd.year?.value ? parseInt(pd.year.value, 10) : pubYear;
          const month = pd.month?.value ? String(pd.month.value).padStart(2, '0') : '01';
          const day = pd.day?.value ? String(pd.day.value).padStart(2, '0') : '01';
          pubDate = `${pubYear}-${month}-${day}`;
        }

        const journalName = summary['journal-title']?.value || '';
        
        // Extract external identifiers (DOI, EID, etc.)
        let doi = '';
        let scopusEid = '';
        let wosUid = '';
        const extIds = summary['external-ids']?.['external-id'] || [];
        extIds.forEach(id => {
          const type = (id['external-id-type'] || '').toLowerCase();
          const val = id['external-id-value'] || '';
          if (type === 'doi') doi = val;
          if (type === 'eid') scopusEid = val;
          if (type === 'wosuid') wosUid = val;
        });

        const workId = `ORCID-${summary['put-code'] || idx + 1}`;

        works.push({
          id: workId,
          candidateId: workId,
          putCode: summary['put-code'],
          title: title,
          publicationType: pubType.includes('journal') ? 'Journal Article' : (pubType.includes('conference') ? 'Conference Paper' : (pubType.includes('book') ? 'Book Chapter' : 'Scholarly Work')),
          journalName: journalName,
          publisher: journalName,
          publicationYear: pubYear,
          publicationDate: pubDate || `${pubYear}-01-01`,
          doi: doi,
          scopusEid: scopusEid,
          wosUid: wosUid,
          source: 'ORCID',
          sources: ['ORCID'],
          url: summary.url?.value || (doi ? `https://doi.org/${doi}` : `https://orcid.org/${orcid}/work/${summary['put-code'] || ''}`)
        });
      });
    }

    const profile = {
      orcid: orcid,
      fullName: creditName || 'Verified ORCID Researcher',
      givenName: givenName,
      familyName: familyName,
      biography: bio,
      worksCount: works.length,
      verifiedAt: new Date().toISOString()
    };

    return {
      success: true,
      profile: profile,
      works: works
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'ORCID API request timed out.' };
    }
    return { success: false, error: err.message || 'Failed to fetch ORCID data' };
  }
}
