/**
 * scopusService.js
 * Frontend Client for Elsevier Scopus API operations.
 * Proxies all requests through the secure server-side endpoint /api/portal/scopus.
 * 
 * SECURITY:
 * Never accesses or stores SCOPUS_API_KEY on the client.
 */

export async function checkScopusApiDiagnostic() {
  try {
    const res = await fetch('/api/portal/scopus?action=diagnostic');
    if (!res.ok) {
      return {
        success: false,
        status: 'SERVER_ERROR',
        error: `Server responded with HTTP ${res.status}`
      };
    }
    return await res.json();
  } catch (err) {
    return {
      success: false,
      status: 'OFFLINE',
      error: `Failed to reach server-side Scopus proxy: ${err.message}`
    };
  }
}

export async function searchScopusAuthors(query) {
  if (!query) return { success: false, error: 'Author search query required' };
  try {
    const res = await fetch(`/api/portal/scopus?action=author-search&query=${encodeURIComponent(query)}`);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function fetchScopusAuthorProfile(authorId) {
  if (!authorId) return { success: false, error: 'Author ID required' };
  try {
    const res = await fetch(`/api/portal/scopus?action=author-profile&authorId=${encodeURIComponent(authorId)}`);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function fetchScopusAuthorPublications(authorId) {
  if (!authorId) return { success: false, error: 'Author ID required' };
  try {
    const res = await fetch(`/api/portal/scopus?action=author-publications&authorId=${encodeURIComponent(authorId)}`);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}
