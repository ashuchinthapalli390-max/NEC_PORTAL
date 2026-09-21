/**
 * scopusService.js
 * Secure Server-side Proxy for official Elsevier Scopus API.
 * 
 * SECURITY MANDATE:
 * - SCOPUS_API_KEY is strictly server-side (process.env.SCOPUS_API_KEY).
 * - NEVER return or log the API key or institutional authorization tokens to the browser.
 * - NEVER use VITE_ prefix for this secret key.
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

function getScopusApiKey() {
  if (process.env.SCOPUS_API_KEY && process.env.SCOPUS_API_KEY !== 'your_rotated_server_side_key') {
    return process.env.SCOPUS_API_KEY.trim();
  }
  // Try reading from .env if not yet loaded in process.env
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^SCOPUS_API_KEY\s*=\s*(.+)$/m);
      if (match && match[1] && !match[1].startsWith('your_')) {
        return match[1].trim();
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function getScopusInstToken() {
  return process.env.SCOPUS_INST_TOKEN ? process.env.SCOPUS_INST_TOKEN.trim() : null;
}

function fetchElsevierJson(urlPath, options = {}) {
  const apiKey = getScopusApiKey();
  if (!apiKey) {
    return Promise.resolve({
      status: 400,
      error: 'SCOPUS_API_KEY is not configured on the server. Please add SCOPUS_API_KEY=your_key to .env.',
      configured: false
    });
  }

  const instToken = getScopusInstToken();

  const headers = {
    'Accept': 'application/json',
    'X-ELS-APIKey': apiKey,
    'User-Agent': 'NEC-Autonomous-Portal/2.0'
  };

  if (instToken) {
    headers['X-ELS-Insttoken'] = instToken;
  }

  const fullUrl = urlPath.startsWith('http') ? urlPath : `https://api.elsevier.com${urlPath}`;

  return new Promise((resolve) => {
    https.get(fullUrl, { headers, timeout: 12000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const rateLimitRemaining = res.headers['x-ratelimit-remaining'];
        const rateLimitReset = res.headers['x-ratelimit-reset'];
        const rateLimitLimit = res.headers['x-ratelimit-limit'];

        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = { raw: data };
        }

        resolve({
          status: res.statusCode,
          headers: {
            rateLimitRemaining,
            rateLimitReset,
            rateLimitLimit
          },
          data: parsed,
          configured: true
        });
      });
    }).on('error', (err) => {
      resolve({
        status: 500,
        error: `Network error connecting to Elsevier API: ${err.message}`,
        configured: true
      });
    });
  });
}

/**
 * Diagnostic check: tests Scopus API key connectivity and entitlement.
 */
export async function runScopusDiagnostic() {
  const apiKey = getScopusApiKey();
  if (!apiKey) {
    return {
      success: false,
      status: 'NOT_CONFIGURED',
      error: 'SCOPUS_API_KEY is not configured on the server.',
      message: 'Add SCOPUS_API_KEY=your_key in the backend .env to enable official Elsevier Scopus synchronization.',
      canSync: false
    };
  }

  // Probe Elsevier Scopus Search with affiliation query
  const res = await fetchElsevierJson('/content/search/scopus?query=affil(Narasaraopeta)&count=1');

  if (res.status === 200) {
    return {
      success: true,
      status: 'CONNECTED',
      entitlement: 'ACTIVE',
      quota: {
        remaining: res.headers?.rateLimitRemaining || 'Available',
        limit: res.headers?.rateLimitLimit || 'Standard',
        reset: res.headers?.rateLimitReset || 'Normal'
      },
      message: 'Official Elsevier Scopus API connection verified and active.',
      canSync: true
    };
  }

  if (res.status === 401 || res.status === 403) {
    return {
      success: false,
      status: 'AUTHENTICATION_FAILED',
      statusCode: res.status,
      error: 'Elsevier API rejected the key. Key may be invalid, deactivated, or restricted to institution IP.',
      details: res.data?.['service-error']?.status?.statusText || 'Unauthorized',
      canSync: false
    };
  }

  return {
    success: false,
    status: 'PROVIDER_ERROR',
    statusCode: res.status,
    error: res.error || `Elsevier API returned HTTP status ${res.status}`,
    canSync: false
  };
}

/**
 * Searches for authors by name and optional affiliation
 */
export async function searchScopusAuthors(queryParam) {
  if (!queryParam) {
    return { success: false, error: 'Query parameter is required for author search.' };
  }

  // Construct query: e.g. AUTHLASTNAME(Lakshmi) and AFFIL(Narasaraopeta)
  const cleanQuery = encodeURIComponent(queryParam);
  const res = await fetchElsevierJson(`/content/search/author?query=${cleanQuery}&count=10`);

  if (res.status !== 200) {
    return {
      success: false,
      status: res.status,
      error: res.data?.['service-error']?.status?.statusText || res.error || 'Author search failed.'
    };
  }

  const entries = res.data?.['search-results']?.entry || [];
  const authors = entries.map(e => {
    const preferredName = e['preferred-name'] || {};
    const nameStr = `${preferredName['given-name'] || ''} ${preferredName['surname'] || ''}`.trim() || e['dc:identifier'];
    const affil = e['affiliation-current'] || {};
    return {
      scopusAuthorId: (e['dc:identifier'] || '').replace(/^AUTHOR_ID:/i, ''),
      name: nameStr,
      surname: preferredName['surname'] || '',
      givenName: preferredName['given-name'] || '',
      affiliation: affil['affiliation-name'] || 'Narasaraopeta Engineering College',
      city: affil['affiliation-city'] || 'Narasaraopet',
      country: affil['affiliation-country'] || 'India',
      documentCount: parseInt(e['document-count'] || '0', 10),
      orcid: e['orcid'] || null
    };
  });

  return {
    success: true,
    count: authors.length,
    authors
  };
}

/**
 * Retrieves full author profile metrics from Scopus
 */
export async function getScopusAuthorProfile(authorId) {
  const cleanId = String(authorId).replace(/[^0-9]/g, '');
  if (!cleanId) {
    return { success: false, error: 'Valid numeric Scopus Author ID required.' };
  }

  const res = await fetchElsevierJson(`/content/author?author_id=${cleanId}&view=ENHANCED`);

  if (res.status !== 200) {
    // Try standard view fallback
    const resStd = await fetchElsevierJson(`/content/author?author_id=${cleanId}&view=STANDARD`);
    if (resStd.status !== 200) {
      return {
        success: false,
        status: res.status,
        error: res.data?.['service-error']?.status?.statusText || 'Failed to retrieve Scopus author profile.'
      };
    }
    return parseAuthorProfile(resStd.data, cleanId);
  }

  return parseAuthorProfile(res.data, cleanId);
}

function parseAuthorProfile(data, authorId) {
  const profile = data?.['author-retrieval-response']?.[0] || {};
  const coredata = profile['coredata'] || {};
  const authorProfile = profile['author-profile'] || {};
  const prefName = authorProfile['preferred-name'] || {};

  const name = `${prefName['given-name'] || ''} ${prefName['surname'] || ''}`.trim() || 'Author';

  return {
    success: true,
    profile: {
      scopusAuthorId: authorId,
      name,
      documentCount: parseInt(coredata['document-count'] || '0', 10),
      citationCount: parseInt(coredata['citation-count'] || '0', 10),
      hIndex: profile['h-index'] ? parseInt(profile['h-index'], 10) : null,
      orcid: coredata['orcid'] || null,
      affiliation: coredata['affiliation-name'] || 'Narasaraopeta Engineering College',
      profileUrl: `https://www.scopus.com/authid/detail.uri?authorId=${authorId}`,
      lastFetched: new Date().toISOString()
    }
  };
}

/**
 * Fetches indexed publications for a confirmed Scopus Author ID
 */
export async function getScopusAuthorPublications(authorId) {
  const cleanId = String(authorId).replace(/[^0-9]/g, '');
  if (!cleanId) {
    return { success: false, error: 'Valid numeric Scopus Author ID required.' };
  }

  const res = await fetchElsevierJson(`/content/search/scopus?query=au-id(${cleanId})&count=25`);

  if (res.status !== 200) {
    return {
      success: false,
      status: res.status,
      error: res.data?.['service-error']?.status?.statusText || 'Failed to fetch author publications from Scopus.'
    };
  }

  const entries = res.data?.['search-results']?.entry || [];
  const publications = entries.map(e => ({
    title: e['dc:title'] || 'Untitled Scopus Paper',
    doi: e['prism:doi'] || null,
    scopusEid: e['eid'] || e['dc:identifier'] || null,
    venue: e['prism:publicationName'] || 'Academic Venue',
    year: e['prism:coverDate'] ? e['prism:coverDate'].slice(0, 4) : null,
    publicationDate: e['prism:coverDate'] || null,
    type: e['prism:aggregationType'] === 'Journal' ? 'Journal Article' : 'Conference Paper',
    citationCount: e['citedby-count'] ? parseInt(e['citedby-count'], 10) : 0,
    scopusUrl: e['prism:url'] || (e['eid'] ? `https://www.scopus.com/record/display.uri?eid=${e['eid']}&origin=resultslist` : null),
    scopusIndexed: true,
    verificationStatus: 'Verified in Scopus'
  }));

  return {
    success: true,
    count: publications.length,
    publications
  };
}
