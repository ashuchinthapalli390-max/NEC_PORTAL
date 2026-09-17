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
  return rawOrcid.trim().replace(/^https?:\/\/orcid\.org\//i, '');
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
  if (ORCID_CONFIG.accessToken) {
    headers['Authorization'] = `Bearer ${ORCID_CONFIG.accessToken}`;
  }
  return headers;
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

    // 1. Fetch Person Profile with official authenticated headers
    const personResp = await fetch(`${BASE_URL}/${orcid}/person`, {
      headers: getOrcidHeaders(),
      signal: controller.signal
    });

    if (!personResp.ok) {
      clearTimeout(timeoutId);
      if (personResp.status === 404) {
        return { success: false, error: 'ORCID profile not found or set to private.' };
      }
      return { success: false, error: `ORCID API returned HTTP ${personResp.status}` };
    }

    const personJson = await personResp.json();

    const nameObj = personJson?.name;
    const givenName = nameObj?.['given-names']?.value || '';
    const familyName = nameObj?.['family-name']?.value || '';
    const creditName = nameObj?.['credit-name']?.value || `${givenName} ${familyName}`.trim();
    const bio = personJson?.biography?.content || '';

    const profile = {
      orcid: orcid,
      fullName: creditName || 'Verified ORCID Researcher',
      givenName: givenName,
      familyName: familyName,
      biography: bio,
      verifiedAt: new Date().toISOString()
    };

    // 2. Fetch Works List with official authenticated headers
    const worksResp = await fetch(`${BASE_URL}/${orcid}/works`, {
      headers: getOrcidHeaders(),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

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

        works.push({
          id: `ORCID-${summary['put-code'] || idx + 1}`,
          putCode: summary['put-code'],
          title: title,
          publicationType: pubType.includes('journal') ? 'Journal Article' : (pubType.includes('conference') ? 'Conference Paper' : 'Book Chapter'),
          journalName: journalName,
          publicationYear: pubYear,
          publicationDate: pubDate || `${pubYear}-01-01`,
          doi: doi,
          scopusEid: scopusEid,
          wosUid: wosUid,
          source: 'ORCID',
          url: summary.url?.value || (doi ? `https://doi.org/${doi}` : '')
        });
      });
    }

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
