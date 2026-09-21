import https from 'https';
import crypto from 'crypto';

const USERS_SEED = [
  { id: 'usr_superadmin', email: 'ashuchinthapalli3900@gmail.com', secondaryEmails: ['varunparlapalli2008@gmail.com'], name: 'Ashu Chinthapalli', role: 'SUPER_ADMIN', status: 'Active' },
  { id: 'usr_superadmin_varun', email: 'varunparlapalli2008@gmail.com', name: 'Varun Parlapalli', role: 'SUPER_ADMIN', status: 'Active' },
  { id: 'usr_principal', email: 'principal@nrtec.in', name: 'Dr. S. Venkateswarlu', role: 'ADMIN', status: 'Active' },
  { id: 'usr_hod_cse', email: 'hodcse@nrtec.in', name: 'Dr. S. N. Tirumala Rao', role: 'HOD', status: 'Active' },
  { id: 'usr_faculty_cse', email: 'faculty@nrtec.in', name: 'Dr. B. Jhansi Vazram', role: 'FACULTY', status: 'Active' },
  { id: 'usr_auditor', email: 'auditor@nrtec.in', name: 'Sri. P. Radhakrishna', role: 'AUDITOR', status: 'Active' },
  { id: 'usr_dataentry', email: 'dataentry@nrtec.in', name: 'Academic Cell Staff', role: 'DATA_ENTRY', status: 'Active' }
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

function sendResendEmail({ from, to, subject, html, apiKey }) {
  return new Promise((resolve, reject) => {
    if (!apiKey) {
      return reject(new Error('RESEND_API_KEY is not configured on the server.'));
    }

    const payload = JSON.stringify({
      from,
      to,
      subject,
      html
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, id: parsed.id });
          } else {
            reject(new Error(parsed.message || `Resend error HTTP ${res.statusCode}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true });
          } else {
            reject(new Error(`Resend error HTTP ${res.statusCode}: ${data}`));
          }
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. Expected POST.'
    });
  }

  const hmacSecret = process.env.SESSION_HMAC_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  const authEmailFrom = process.env.AUTH_EMAIL_FROM || 'NEC Secure Portal <security@codeaxisapply.xyz>';

  if (!hmacSecret) {
    console.error('[AUTH_FATAL] SESSION_HMAC_SECRET is missing.');
    return res.status(500).json({ success: false, error: 'Server security configuration error.' });
  }

  if (!apiKey) {
    console.error('[AUTH_FATAL] RESEND_API_KEY is not configured in Vercel environment.');
    return res.status(500).json({
      success: false,
      code: 'OTP_SEND_FAILED',
      error: 'Email verification service is currently unavailable. Please contact the administrator.'
    });
  }

  try {
    const { email: reqEmail } = req.body || {};
    const cookies = parseCookies(req.headers.cookie);
    let targetUser = null;

    // Resolve user from pre-auth cookie or validated request
    if (reqEmail) {
      const cleanReq = reqEmail.toLowerCase().trim();
      targetUser = USERS_SEED.find(u => 
        u.email.toLowerCase() === cleanReq ||
        (Array.isArray(u.secondaryEmails) && u.secondaryEmails.some(e => e.toLowerCase() === cleanReq))
      );
    } else if (cookies['nec_preauth']) {
      try {
        const [encoded, hmac] = cookies['nec_preauth'].split('.');
        const payloadStr = Buffer.from(encoded, 'base64url').toString('utf8');
        const expectedHmac = crypto.createHmac('sha256', hmacSecret).update(payloadStr).digest('hex');
        if (hmac === expectedHmac) {
          const preauthData = JSON.parse(payloadStr);
          targetUser = USERS_SEED.find(u => u.id === preauthData.userId);
        }
      } catch {}
    }

    if (!targetUser || targetUser.status !== 'Active') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized or unrecognized identity.'
      });
    }

    // 1. Generate Cryptographically Secure 6-digit OTP (Server-Side Only!)
    const code = crypto.randomInt(100000, 1000000).toString();
    const challengeId = 'CHAL-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    const otpDigest = crypto.createHmac('sha256', hmacSecret).update(`${challengeId}:${code}`).digest('hex');
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes TTL

    // 2. Encode Pre-Auth Cookie Payload (Signed with HMAC)
    const preauthPayload = JSON.stringify({
      userId: targetUser.id,
      challengeId,
      otpDigest,
      expiresAt,
      attempts: 0
    });
    const preauthHmac = crypto.createHmac('sha256', hmacSecret).update(preauthPayload).digest('hex');
    const preauthCookie = `${Buffer.from(preauthPayload).toString('base64url')}.${preauthHmac}`;

    const isProd = process.env.NODE_ENV === 'production';
    const secureFlag = isProd ? '; Secure' : '';

    // 3. Dispatch Live Verification Email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background: #FFFFFF;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #070F1E; margin: 0; font-size: 20px;">NARASARAOPETA ENGINEERING COLLEGE</h2>
          <p style="color: #D4AF37; margin: 4px 0 0; font-size: 13px; font-weight: bold;">(Autonomous) • Secure Portal Verification</p>
        </div>
        <div style="background: #F8FAFC; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #E2E8F0; margin-bottom: 20px;">
          <p style="color: #475569; font-size: 14px; margin: 0 0 12px;">Your 2-step verification code is:</p>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #070F1E; background: #FFFFFF; border: 2px dashed #D4AF37; border-radius: 8px; padding: 12px; display: inline-block;">
            ${code}
          </div>
          <p style="color: #64748B; font-size: 12px; margin: 12px 0 0;">Valid for 5 minutes. Do not share this code with anyone.</p>
        </div>
        <p style="color: #94A3B8; font-size: 11px; text-align: center; margin: 0;">
          This is an automated institutional message from the NEC Autonomous Portal Security Gateway.
        </p>
      </div>
    `;

    await sendResendEmail({
      from: authEmailFrom,
      to: [targetUser.email],
      subject: `[NEC Portal] Security Verification Code: ${code}`,
      html: htmlContent,
      apiKey
    });

    // Set signed preauth cookie
    res.setHeader(
      'Set-Cookie',
      `nec_preauth=${preauthCookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=300${secureFlag}`
    );

    return res.status(200).json({
      success: true,
      message: 'Verification code dispatched to your registered email.'
    });
  } catch (error) {
    console.error('[SERVERLESS_OTP_SEND_ERROR]', error);
    return res.status(500).json({
      success: false,
      code: 'OTP_SEND_FAILED',
      error: 'Unable to dispatch verification code. Please try again.'
    });
  }
}
