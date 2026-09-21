import crypto from 'crypto';

const USERS_SEED = [
  { id: 'usr_superadmin', email: 'ashuchinthapalli3900@gmail.com', secondaryEmails: ['varunparlapalli2008@gmail.com'], name: 'Ashu Chinthapalli', role: 'SUPER_ADMIN', label: 'Super Admin', dept: 'Management & Governance', status: 'Active' },
  { id: 'usr_superadmin_varun', email: 'varunparlapalli2008@gmail.com', name: 'Varun Parlapalli', role: 'SUPER_ADMIN', label: 'Super Admin', dept: 'Management & Governance', status: 'Active' },
  { id: 'usr_principal', email: 'principal@nrtec.in', name: 'Dr. S. Venkateswarlu', role: 'ADMIN', label: 'College Admin', dept: 'Administration', status: 'Active' },
  { id: 'usr_hod_cse', email: 'hodcse@nrtec.in', name: 'Dr. S. N. Tirumala Rao', role: 'HOD', label: 'Head of Department', dept: 'CSE', status: 'Active' },
  { id: 'usr_faculty_cse', email: 'faculty@nrtec.in', name: 'Dr. B. Jhansi Vazram', role: 'FACULTY', label: 'Faculty Member', dept: 'CSE', status: 'Active' },
  { id: 'usr_auditor', email: 'auditor@nrtec.in', name: 'Sri. P. Radhakrishna', role: 'AUDITOR', label: 'Audit Evaluator', dept: 'Compliance & Audit', status: 'Active' },
  { id: 'usr_dataentry', email: 'dataentry@nrtec.in', name: 'Academic Cell Staff', role: 'DATA_ENTRY', label: 'Data Entry Operator', dept: 'Academic Cell', status: 'Active' }
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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Expected POST.' });
  }

  const hmacSecret = process.env.SESSION_HMAC_SECRET;
  if (!hmacSecret) {
    console.error('[AUTH_FATAL] SESSION_HMAC_SECRET is missing.');
    return res.status(500).json({ success: false, error: 'Server security configuration error.' });
  }

  try {
    const { code } = req.body || {};
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'Verification code is required.' });
    }

    const cookies = parseCookies(req.headers.cookie);
    const preauthCookie = cookies['nec_preauth'];

    if (!preauthCookie) {
      return res.status(401).json({
        success: false,
        code: 'OTP_EXPIRED',
        error: 'Verification session has expired. Please initiate sign-in again.'
      });
    }

    const [encodedPayload, providedHmac] = preauthCookie.split('.');
    if (!encodedPayload || !providedHmac) {
      return res.status(401).json({ success: false, error: 'Malformed verification token.' });
    }

    const payloadStr = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const expectedHmac = crypto.createHmac('sha256', hmacSecret).update(payloadStr).digest('hex');

    const provBuf = Buffer.from(providedHmac, 'hex');
    const expBuf = Buffer.from(expectedHmac, 'hex');
    if (provBuf.length !== expBuf.length || !crypto.timingSafeEqual(provBuf, expBuf)) {
      return res.status(401).json({ success: false, error: 'Invalid verification signature.' });
    }

    const preauthData = JSON.parse(payloadStr);

    // Check expiration
    if (Date.now() > preauthData.expiresAt) {
      res.setHeader('Set-Cookie', 'nec_preauth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      return res.status(401).json({
        success: false,
        code: 'OTP_EXPIRED',
        error: 'Verification code has expired. Please request a new code.'
      });
    }

    // Check attempts limit
    if (preauthData.attempts >= 5) {
      res.setHeader('Set-Cookie', 'nec_preauth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      return res.status(429).json({
        success: false,
        code: 'OTP_LOCKED',
        error: 'Maximum verification attempts exceeded. Account verification locked.'
      });
    }

    // Verify OTP using constant-time comparison of HMAC digest
    const inputDigest = crypto.createHmac('sha256', hmacSecret)
      .update(`${preauthData.challengeId}:${code.trim()}`)
      .digest('hex');

    const inputBuf = Buffer.from(inputDigest, 'hex');
    const targetBuf = Buffer.from(preauthData.otpDigest, 'hex');

    if (inputBuf.length !== targetBuf.length || !crypto.timingSafeEqual(inputBuf, targetBuf)) {
      preauthData.attempts += 1;
      const updatedPayload = JSON.stringify(preauthData);
      const updatedHmac = crypto.createHmac('sha256', hmacSecret).update(updatedPayload).digest('hex');
      const updatedCookie = `${Buffer.from(updatedPayload).toString('base64url')}.${updatedHmac}`;
      const isProd = process.env.NODE_ENV === 'production';
      const secureFlag = isProd ? '; Secure' : '';

      res.setHeader('Set-Cookie', `nec_preauth=${updatedCookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=300${secureFlag}`);

      return res.status(400).json({
        success: false,
        code: 'INVALID_OTP',
        attemptsRemaining: Math.max(0, 5 - preauthData.attempts),
        error: `Invalid verification code. ${Math.max(0, 5 - preauthData.attempts)} attempts remaining.`
      });
    }

    // Lookup user (Strict - Never fallback to Super Admin)
    const user = USERS_SEED.find(u => u.id === preauthData.userId);
    if (!user || user.status !== 'Active') {
      return res.status(401).json({ success: false, error: 'User is unauthorized or inactive.' });
    }

    // Success! Create 7-day verified session
    const maxAge = 7 * 24 * 60 * 60;
    const sessionPayload = `${user.id}:${Date.now()}`;
    const sessionHmac = crypto.createHmac('sha256', hmacSecret).update(sessionPayload).digest('hex');
    const sessionCookieValue = `${Buffer.from(sessionPayload).toString('base64url')}.${sessionHmac}`;
    const isProd = process.env.NODE_ENV === 'production';
    const secureFlag = isProd ? '; Secure' : '';

    // Issue verified nec_session and clear nec_preauth
    res.setHeader('Set-Cookie', [
      `nec_session=${sessionCookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureFlag}`,
      `nec_preauth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
    ]);

    return res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        label: user.label || user.role,
        dept: user.dept,
        status: user.status
      }
    });
  } catch (error) {
    console.error('[SERVERLESS_OTP_VERIFY_ERROR]', error);
    return res.status(500).json({ success: false, error: 'Verification failed. Please try again.' });
  }
}
