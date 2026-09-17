/**
 * Serverless API handler for /api/portal/orcid
 * Manages official ORCID Public API v3.0 token issuance and researcher query proxying.
 */

const ORCID_CLIENT_ID = process.env.ORCID_CLIENT_ID || process.env.VITE_ORCID_CLIENT_ID || 'APP-8JDSVGUFZ9RYM805';
const ORCID_CLIENT_SECRET = process.env.ORCID_CLIENT_SECRET || '8759ef92-bffa-437c-9c81-97240bf88f9e';

let cachedToken = process.env.VITE_ORCID_ACCESS_TOKEN || '9bac1574-f57c-453f-a6b6-890df78ec3b6';
let tokenExpiryTime = Date.now() + 1000 * 60 * 60 * 24 * 365; // ~1 year fallback

async function getOrRefreshToken() {
  if (cachedToken && Date.now() < tokenExpiryTime) {
    return cachedToken;
  }

  try {
    const tokenRes = await fetch('https://orcid.org/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: ORCID_CLIENT_ID,
        client_secret: ORCID_CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: '/read-public'
      })
    });

    if (tokenRes.ok) {
      const data = await tokenRes.json();
      if (data.access_token) {
        cachedToken = data.access_token;
        const ttl = (data.expires_in || 3600) * 1000;
        tokenExpiryTime = Date.now() + ttl - 60000;
        return cachedToken;
      }
    }
  } catch (err) {
    console.error('Error refreshing ORCID token:', err);
  }

  return cachedToken;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate');

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const action = url.searchParams.get('action') || 'status';
    const orcidId = url.searchParams.get('orcid');

    if (req.method === 'GET') {
      if (action === 'status') {
        const token = await getOrRefreshToken();
        return res.status(200).json({
          success: true,
          configured: Boolean(ORCID_CLIENT_ID && ORCID_CLIENT_SECRET),
          clientId: ORCID_CLIENT_ID,
          hasToken: Boolean(token),
          institution: 'Narasaraopeta Engineering College'
        });
      }

      if (action === 'query' && orcidId) {
        const token = await getOrRefreshToken();
        const headers = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const personRes = await fetch(`https://pub.orcid.org/v3.0/${orcidId}/person`, { headers });
        if (!personRes.ok) {
          return res.status(personRes.status).json({ success: false, error: `ORCID error ${personRes.status}` });
        }
        const personData = await personRes.json();

        const worksRes = await fetch(`https://pub.orcid.org/v3.0/${orcidId}/works`, { headers });
        const worksData = worksRes.ok ? await worksRes.json() : null;

        return res.status(200).json({
          success: true,
          person: personData,
          works: worksData
        });
      }
    }

    return res.status(400).json({ success: false, error: 'Invalid action or request method.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Internal server error in ORCID handler.' });
  }
}
