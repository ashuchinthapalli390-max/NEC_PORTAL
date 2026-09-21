import crypto from 'crypto';

const USERS_SEED = [
  { 
    id: 'usr_superadmin', 
    name: 'Ashu Chinthapalli', 
    email: 'ashuchinthapalli3900@gmail.com', 
    secondaryEmails: ['varunparlapalli2008@gmail.com'],
    dept: 'Management & Governance', 
    role: 'SUPER_ADMIN', 
    label: 'Super Admin',
    status: 'Active'
  },
  { 
    id: 'usr_superadmin_varun', 
    name: 'Varun Parlapalli', 
    email: 'varunparlapalli2008@gmail.com', 
    dept: 'Management & Governance', 
    role: 'SUPER_ADMIN', 
    label: 'Super Admin',
    status: 'Active'
  },
  { 
    id: 'usr_principal', 
    name: 'Dr. S. Venkateswarlu', 
    email: 'principal@nrtec.in', 
    dept: 'Administration', 
    role: 'ADMIN', 
    label: 'College Admin',
    status: 'Active'
  },
  { 
    id: 'usr_hod_cse', 
    name: 'Dr. S. N. Tirumala Rao', 
    email: 'hodcse@nrtec.in', 
    dept: 'CSE', 
    role: 'HOD', 
    label: 'Head of Department',
    status: 'Active'
  },
  { 
    id: 'usr_faculty_cse', 
    name: 'Dr. B. Jhansi Vazram', 
    email: 'faculty@nrtec.in', 
    dept: 'CSE', 
    role: 'FACULTY', 
    label: 'Faculty Member',
    status: 'Active'
  },
  { 
    id: 'usr_auditor', 
    name: 'Sri. P. Radhakrishna', 
    email: 'auditor@nrtec.in', 
    dept: 'Compliance & Audit', 
    role: 'AUDITOR', 
    label: 'Audit Evaluator',
    status: 'Active'
  },
  { 
    id: 'usr_dataentry', 
    name: 'Academic Cell Staff', 
    email: 'dataentry@nrtec.in', 
    dept: 'Academic Cell', 
    role: 'DATA_ENTRY', 
    label: 'Data Entry Operator',
    status: 'Active'
  }
];

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    let [name, ...rest] = cookie.split('=');
    name = name.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'GET') {
    return res.status(405).json({ authenticated: false, error: 'Method Not Allowed. Expected GET.' });
  }

  const hmacSecret = process.env.SESSION_HMAC_SECRET;
  if (!hmacSecret) {
    console.error('[AUTH_FATAL] SESSION_HMAC_SECRET is missing. Failing closed.');
    return res.status(500).json({ authenticated: false, error: 'Server security configuration error.' });
  }

  try {
    const cookies = parseCookies(req.headers.cookie);
    const rawCookie = cookies['nec_session'];

    if (!rawCookie) {
      return res.status(401).json({ authenticated: false, message: 'No active session' });
    }

    const [encodedPayload, providedHmac] = rawCookie.split('.');
    if (!encodedPayload || !providedHmac) {
      res.setHeader('Set-Cookie', 'nec_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      return res.status(401).json({ authenticated: false, message: 'Malformed session token' });
    }

    const payload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const [userId, timestamp] = payload.split(':');

    const expectedHmac = crypto.createHmac('sha256', hmacSecret)
      .update(payload)
      .digest('hex');

    // Constant-time HMAC comparison
    const providedBuf = Buffer.from(providedHmac, 'hex');
    const expectedBuf = Buffer.from(expectedHmac, 'hex');
    if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      res.setHeader('Set-Cookie', 'nec_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      return res.status(401).json({ authenticated: false, message: 'Invalid session signature' });
    }

    // Absolute Expiration Check (7 days maximum)
    const sessionAge = Date.now() - Number(timestamp);
    if (isNaN(sessionAge) || sessionAge > 7 * 24 * 60 * 60 * 1000 || sessionAge < 0) {
      res.setHeader('Set-Cookie', 'nec_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      return res.status(401).json({ authenticated: false, message: 'Session expired' });
    }

    // Find User (Strict Lookup - Never fallback to Super Admin!)
    const matchedUser = USERS_SEED.find(u => u.id === userId);
    if (!matchedUser) {
      res.setHeader('Set-Cookie', 'nec_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      return res.status(401).json({ authenticated: false, message: 'Unknown or removed user identity' });
    }

    if (matchedUser.status !== 'Active') {
      res.setHeader('Set-Cookie', 'nec_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      return res.status(403).json({ authenticated: false, message: 'Account is suspended or locked' });
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
        label: matchedUser.label || matchedUser.role,
        dept: matchedUser.dept,
        status: matchedUser.status
      }
    });
  } catch (error) {
    console.error('[SERVERLESS_ME_ERROR]', error);
    return res.status(500).json({
      authenticated: false,
      error: 'Session check failed'
    });
  }
}
