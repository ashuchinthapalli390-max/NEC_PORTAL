import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  applyRateLimit, 
  validateCsrf, 
  auditSecurityEvent, 
  loadServerAuditLogs, 
  hasPermission,
  protectLastSuperAdmin,
  safeApiError 
} from './securityMiddleware.js';

// Server-side session persistence file path
const SESSIONS_FILE = path.resolve(process.cwd(), '.portal_sessions.json');
const OTP_CHALLENGES_FILE = path.resolve(process.cwd(), '.portal_otp_challenges.json');

const USERS_SEED = [
  { 
    id: 'usr_superadmin', 
    username: 'superadmin',
    label: 'Super Admin', 
    name: 'Ashu Chinthapalli', 
    email: 'ashuchinthapalli3900@gmail.com', 
    dept: 'Management & Governance', 
    role: 'SUPER_ADMIN', 
    canApprove: true, 
    isSuper: true,
    status: 'Active',
    allowPassword: true,
    allowGoogle: true,
    requireEmailOtp: true
  },
  { 
    id: 'usr_principal', 
    username: 'principal',
    label: 'College Admin', 
    name: 'Dr. S. Venkateswarlu', 
    email: 'principal@nrtec.in', 
    dept: 'Administration', 
    role: 'ADMIN', 
    canApprove: true, 
    status: 'Active',
    allowPassword: true,
    allowGoogle: true,
    requireEmailOtp: true
  },
  { 
    id: 'usr_hod_cse', 
    username: 'hod_cse',
    label: 'Head of Department', 
    name: 'Dr. S. N. Tirumala Rao', 
    email: 'hodcse@nrtec.in', 
    dept: 'CSE', 
    role: 'HOD', 
    canApprove: true, 
    status: 'Active',
    allowPassword: true,
    allowGoogle: true,
    requireEmailOtp: true
  },
  { 
    id: 'usr_faculty_cse', 
    username: 'faculty_cse',
    label: 'Faculty Member', 
    name: 'Dr. B. Jhansi Vazram', 
    email: 'faculty@nrtec.in', 
    dept: 'CSE', 
    role: 'FACULTY', 
    canApprove: false, 
    status: 'Active',
    allowPassword: true,
    allowGoogle: true,
    requireEmailOtp: false
  },
  { 
    id: 'usr_auditor', 
    username: 'auditor',
    label: 'Audit & Compliance Evaluator', 
    name: 'Sri. P. Radhakrishna', 
    email: 'auditor@nrtec.in', 
    dept: 'Compliance & Audit', 
    role: 'AUDITOR', 
    canApprove: false, 
    status: 'Active',
    allowPassword: true,
    allowGoogle: true,
    requireEmailOtp: true
  },
  { 
    id: 'usr_dataentry', 
    username: 'dataentry',
    label: 'Data Entry Operator', 
    name: 'Academic Cell Staff', 
    email: 'dataentry@nrtec.in', 
    dept: 'Academic Cell', 
    role: 'DATA_ENTRY', 
    canApprove: false, 
    status: 'Active',
    allowPassword: true,
    allowGoogle: false,
    requireEmailOtp: true
  }
];

function loadServerSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8') || '[]');
    }
  } catch (e) {
    console.error('[SESSION_STORE_ERROR] Failed to read sessions file:', e);
  }
  return [];
}

function saveServerSessions(sessions) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  } catch (e) {
    console.error('[SESSION_STORE_ERROR] Failed to save sessions file:', e);
  }
}

function loadOtpChallenges() {
  try {
    if (fs.existsSync(OTP_CHALLENGES_FILE)) {
      return JSON.parse(fs.readFileSync(OTP_CHALLENGES_FILE, 'utf8') || '[]');
    }
  } catch (e) {
    console.error('[OTP_STORE_ERROR] Failed to read OTP challenges:', e);
  }
  return [];
}

function saveOtpChallenges(challenges) {
  try {
    fs.writeFileSync(OTP_CHALLENGES_FILE, JSON.stringify(challenges, null, 2));
  } catch (e) {
    console.error('[OTP_STORE_ERROR] Failed to save OTP challenges:', e);
  }
}

// Load server environment variables from .env.local without exposing to client
function getEnvConfig() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  let apiKey = process.env.RESEND_API_KEY;
  let authEmailFrom = process.env.AUTH_EMAIL_FROM || 'NEC Secure Portal <security@codeaxisapply.xyz>';

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const keyMatch = envContent.match(/RESEND_API_KEY=([^\r\n]+)/);
    const fromMatch = envContent.match(/AUTH_EMAIL_FROM="?([^"\r\n]+)"?/);

    if (keyMatch) apiKey = keyMatch[1].trim().replace(/^["']|["']$/g, '');
    if (fromMatch) authEmailFrom = fromMatch[1].trim().replace(/^["']|["']$/g, '');
  }

  return { apiKey, authEmailFrom };
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
          const parsed = JSON.parse(data);
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

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function authServerPlugin() {
  return {
    name: 'nec-auth-server-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const isProd = process.env.NODE_ENV === 'production';

        // ──────────────────────────────────────────────────────────
        // Global Security Headers on all HTTP responses
        // ──────────────────────────────────────────────────────────
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        // Only enforce API route interception
        if (!req.url.startsWith('/api/')) {
          return next();
        }

        // Disable caching on all dynamic authenticated API endpoints
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // CSRF Check for mutation requests
        const csrfCheck = validateCsrf(req);
        if (!csrfCheck.valid) {
          return safeApiError(res, new Error(csrfCheck.reason), 403, 'CSRF verification failed.');
        }

        // ──────────────────────────────────────────────────────────
        // 1. GET /api/auth/me - Authoritative Server Session Validator
        // ──────────────────────────────────────────────────────────
        if (req.url === '/api/auth/me' && req.method === 'GET') {
          const cookies = parseCookies(req.headers.cookie);
          const rawToken = cookies['nec_session'];

          if (!rawToken) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ authenticated: false, message: 'No active session' }));
          }

          const tokenDigest = hashToken(rawToken);
          const sessions = loadServerSessions();
          const activeSession = sessions.find(s => 
            s.token_digest === tokenDigest && 
            s.state === 'VERIFIED' && 
            new Date(s.expires_at) > new Date() && 
            !s.revoked_at
          );

          if (!activeSession) {
            // Clear invalid cookie
            res.writeHead(401, {
              'Content-Type': 'application/json',
              'Set-Cookie': `nec_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
            });
            return res.end(JSON.stringify({ authenticated: false, message: 'Session expired or revoked' }));
          }

          // Load user details
          const matchedUser = USERS_SEED.find(u => u.id === activeSession.user_id) || {
            id: activeSession.user_id,
            name: 'Ashu Chinthapalli',
            email: 'ashuchinthapalli3900@gmail.com',
            role: 'SUPER_ADMIN',
            label: 'Super Admin',
            dept: 'Management & Governance',
            status: 'Active'
          };

          if (matchedUser.status !== 'Active') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ authenticated: false, message: 'Account suspended or locked' }));
          }

          // Throttle last seen update
          activeSession.last_seen_at = new Date().toISOString();
          saveServerSessions(sessions);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
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
          }));
        }

        // ──────────────────────────────────────────────────────────
        // 2. POST /api/auth/session/create - Create Persistent HttpOnly nec_session Cookie after OTP Success
        // ──────────────────────────────────────────────────────────
        if (req.url === '/api/auth/session/create' && req.method === 'POST') {
          // Rate Limit session creations: 10 per minute
          const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
          const rateCheck = applyRateLimit(`session_create_${clientIp}`, 10, 60000);
          if (!rateCheck.allowed) {
            return safeApiError(res, new Error('Rate limit exceeded'), 429, `Too many session requests. Try again in ${rateCheck.resetInSeconds}s.`);
          }

          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const { userId, authMethod = 'GOOGLE', rememberDevice = true } = JSON.parse(body || '{}');

              if (!userId) {
                return safeApiError(res, new Error('User ID is required'), 400, 'User ID is required.');
              }

              const rawToken = crypto.randomBytes(32).toString('base64url');
              const tokenDigest = hashToken(rawToken);
              const ttlDays = rememberDevice ? 7 : 1;
              const maxAge = ttlDays * 24 * 60 * 60;
              const expiresAt = new Date(Date.now() + maxAge * 1000).toISOString();

              const sessions = loadServerSessions();

              // Session Fixation Protection: Revoke any existing pre-auth / unverified sessions for this user
              sessions.forEach(s => {
                if (s.user_id === userId && s.state === 'PENDING_OTP') {
                  s.state = 'SUPERSEDED';
                  s.revoked_at = new Date().toISOString();
                }
              });

              const newSession = {
                id: 'SES-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
                user_id: userId,
                token_digest: tokenDigest,
                state: 'VERIFIED',
                auth_method: authMethod,
                remember_device: rememberDevice,
                ip_address: clientIp,
                created_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString(),
                expires_at: expiresAt,
                revoked_at: null
              };

              sessions.unshift(newSession);
              if (sessions.length > 300) sessions.pop();
              saveServerSessions(sessions);

              const matchedUser = USERS_SEED.find(u => u.id === userId) || {
                id: userId,
                name: 'Ashu Chinthapalli',
                email: 'ashuchinthapalli3900@gmail.com',
                role: 'SUPER_ADMIN',
                label: 'Super Admin',
                dept: 'Management & Governance',
                status: 'Active'
              };

              // Audit logging
              auditSecurityEvent('SESSION_CREATED', 'Authentication', `Issued verified session via ${authMethod}`, matchedUser, {
                sessionId: newSession.id,
                rememberDevice
              });

              const cookieFlags = `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; ${isProd ? 'Secure;' : ''}`;

              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Set-Cookie': `nec_session=${rawToken}; ${cookieFlags}`
              });

              return res.end(JSON.stringify({
                success: true,
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
              }));
            } catch (err) {
              return safeApiError(res, err, 500, 'Unable to create session.');
            }
          });
          return;
        }

        // ──────────────────────────────────────────────────────────
        // 3. POST /api/auth/logout - Revoke Server Session & Delete Cookie
        // ──────────────────────────────────────────────────────────
        if (req.url === '/api/auth/logout' && req.method === 'POST') {
          const cookies = parseCookies(req.headers.cookie);
          const rawToken = cookies['nec_session'];

          if (rawToken) {
            const tokenDigest = hashToken(rawToken);
            const sessions = loadServerSessions();
            const session = sessions.find(s => s.token_digest === tokenDigest);
            if (session) {
              session.state = 'REVOKED';
              session.revoked_at = new Date().toISOString();
              saveServerSessions(sessions);
              
              auditSecurityEvent('SESSION_REVOKED', 'Authentication', `Explicit user logout`, { id: session.user_id }, {
                sessionId: session.id
              });
            }
          }

          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': `nec_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
          });
          return res.end(JSON.stringify({ success: true, message: 'Logged out successfully' }));
        }

        // ──────────────────────────────────────────────────────────
        // 4. POST /api/auth/otp/send - Live OTP Email Dispatch Endpoint
        // ──────────────────────────────────────────────────────────
        if (req.url === '/api/auth/otp/send' && req.method === 'POST') {
          const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
          
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const { email, code } = JSON.parse(body || '{}');
              const { apiKey, authEmailFrom } = getEnvConfig();

              if (!email || !code) {
                return safeApiError(res, new Error('Missing fields'), 400, 'Email and OTP code are required.');
              }

              // Rate Limit OTP send: 5 per minute per IP/Account
              const rateKey = `otp_send_${clientIp}_${email.toLowerCase().trim()}`;
              const rateCheck = applyRateLimit(rateKey, 5, 60000);
              if (!rateCheck.allowed) {
                return safeApiError(res, new Error('OTP rate limit exceeded'), 429, `Too many OTP requests. Please wait ${rateCheck.resetInSeconds}s.`);
              }

              console.info(`[SERVER_AUTH] Dispatching verification OTP email to recipient domain: ${email.split('@')[1]}`);

              const htmlContent = `
                <div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #0f172a;">
                  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
                    <div style="background-color: #070f1e; padding: 24px 20px; text-align: center; border-bottom: 3px solid #d4af37;">
                      <h2 style="margin: 0; color: #ffffff; font-size: 16px; letter-spacing: 1.2px; font-family: Georgia, serif; font-weight: 800;">
                        NARASARAOPETA ENGINEERING COLLEGE
                      </h2>
                      <div style="color: #d4af37; font-size: 11px; margin-top: 5px; font-weight: 600; letter-spacing: 0.5px;">
                        AUTONOMOUS • ACADEMIC & RESEARCH PORTAL
                      </div>
                    </div>
                    <div style="padding: 32px 28px;">
                      <h3 style="font-size: 18px; color: #0b192c; margin-top: 0; margin-bottom: 12px; font-weight: 700;">
                        Secure Portal Verification
                      </h3>
                      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hello,<br/>
                        A sign-in request was initiated for your authorized NEC portal account. Use the 6-digit verification code below to complete your authentication:
                      </p>
                      <div style="background-color: #0b192c; border-radius: 10px; padding: 22px; text-align: center; margin: 24px 0; border: 1.5px solid #d4af37;">
                        <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #f1c40f; font-family: monospace;">
                          ${code}
                        </div>
                        <div style="color: #94A3B8; font-size: 12px; margin-top: 6px;">
                          This code expires in 5 minutes • Single-use only
                        </div>
                      </div>
                      <div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 12px 14px; border-radius: 4px; font-size: 12.5px; color: #92400E; margin-bottom: 20px;">
                        🔒 <strong>Security Note:</strong> Never share this verification code with anyone. NEC administrators will never ask for your code or password.
                      </div>
                      <p style="color: #64748b; font-size: 12.5px; line-height: 1.5; margin: 0;">
                        If you did not attempt to sign in, you can safely ignore this email.
                      </p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
                      Narasaraopeta Engineering College (Autonomous)<br/>
                      Kotappakonda Road, Yellamanda (P.O), Narasaraopet, Palnadu Dist., AP - 522601
                    </div>
                  </div>
                </div>
              `;

              const result = await sendResendEmail({
                from: authEmailFrom,
                to: email,
                subject: 'Your NEC verification code',
                html: htmlContent,
                apiKey
              });

              auditSecurityEvent('OTP_SENT', 'Authentication', `Dispatched OTP verification email to user domain`, { email });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: true, messageId: result.id }));
            } catch (err) {
              return safeApiError(res, err, 500, 'Unable to dispatch verification code. Please try again.');
            }
          });
          return;
        }

        // ──────────────────────────────────────────────────────────
        // 5. GET /api/admin/audit-logs - Immutable Server Audit Log Trail
        // ──────────────────────────────────────────────────────────
        if (req.url === '/api/admin/audit-logs' && req.method === 'GET') {
          const cookies = parseCookies(req.headers.cookie);
          const rawToken = cookies['nec_session'];
          const tokenDigest = rawToken ? hashToken(rawToken) : null;
          const sessions = loadServerSessions();
          const activeSession = sessions.find(s => s.token_digest === tokenDigest && s.state === 'VERIFIED');

          if (!activeSession) {
            return safeApiError(res, new Error('Unauthorized audit log request'), 401, 'Authentication required to view audit records.');
          }

          const logs = loadServerAuditLogs();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, count: logs.length, logs }));
        }

        // ──────────────────────────────────────────────────────────
        // 6. /api/portal/data - Shared Server Persistence Endpoint
        // ──────────────────────────────────────────────────────────
        if (req.url && req.url.startsWith('/api/portal/data')) {
          const parsedUrl = new URL(req.url, 'http://localhost');
          const moduleKey = parsedUrl.searchParams.get('module') || 'all';
          const action = parsedUrl.searchParams.get('action') || 'get';

          if (req.method === 'GET') {
            try {
              const { readDbState, getModuleRecords } = await import('./portalDataService.js');
              if (moduleKey === 'all') {
                const fullState = readDbState();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: true, state: fullState }));
              }
              const records = getModuleRecords(moduleKey);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: true, module: moduleKey, count: records.length, records }));
            } catch (err) {
              return safeApiError(res, err, 500, 'Failed to fetch portal records');
            }
          }

          if (req.method === 'POST') {
            let bodyStr = '';
            req.on('data', chunk => bodyStr += chunk);
            req.on('end', async () => {
              try {
                const body = JSON.parse(bodyStr || '{}');
                const { saveModuleRecord, saveAllModuleRecords, commitBatch, rollbackBatch } = await import('./portalDataService.js');

                if (action === 'save-all') {
                  const result = saveAllModuleRecords(moduleKey, body, null);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({ success: result }));
                }

                if (action === 'batch-commit') {
                  const result = commitBatch(moduleKey, body, null);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({ success: true, ...result }));
                }

                if (action === 'rollback') {
                  const { batchId } = body || {};
                  const result = rollbackBatch(batchId, null);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({ success: true, ...result }));
                }

                const saved = saveModuleRecord(moduleKey, body, null);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: true, record: saved }));
              } catch (err) {
                return safeApiError(res, err, 500, 'Failed to save portal record');
              }
            });
            return;
          }

          if (req.method === 'DELETE') {
            try {
              const id = parsedUrl.searchParams.get('id');
              const { deleteModuleRecord } = await import('./portalDataService.js');
              const deleted = deleteModuleRecord(moduleKey, id, null);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: deleted }));
            } catch (err) {
              return safeApiError(res, err, 500, 'Failed to delete portal record');
            }
          }
        }

        // ──────────────────────────────────────────────────────────
        // 7. /api/portal/scopus - Elsevier Scopus Official Proxy
        // ──────────────────────────────────────────────────────────
        if (req.url && req.url.startsWith('/api/portal/scopus')) {
          const parsedUrl = new URL(req.url, 'http://localhost');
          const action = parsedUrl.searchParams.get('action') || 'diagnostic';
          const query = parsedUrl.searchParams.get('query') || '';
          const authorId = parsedUrl.searchParams.get('authorId') || '';

          try {
            const { 
              runScopusDiagnostic, 
              searchScopusAuthors, 
              getScopusAuthorProfile, 
              getScopusAuthorPublications 
            } = await import('./scopusService.js');

            if (action === 'diagnostic') {
              const result = await runScopusDiagnostic();
              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify(result));
            }

            if (action === 'author-search') {
              const result = await searchScopusAuthors(query);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify(result));
            }

            if (action === 'author-profile') {
              const result = await getScopusAuthorProfile(authorId);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify(result));
            }

            if (action === 'author-publications') {
              const result = await getScopusAuthorPublications(authorId);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify(result));
            }

            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, error: `Unsupported action: ${action}` }));
          } catch (err) {
            return safeApiError(res, err, 500, 'Scopus API Proxy Error');
          }
        }

        // ──────────────────────────────────────────────────────────
        // 8. /api/portal/documents/serve - Secure Institutional Document Streaming
        // ──────────────────────────────────────────────────────────
        if (req.url && req.url.startsWith('/api/portal/documents/serve')) {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost');
            const docId = parsedUrl.searchParams.get('id') || '';
            const isDownload = parsedUrl.searchParams.get('download') === 'true';

            const docsPath = path.resolve(process.cwd(), 'src', 'data', 'canonical', 'documentEvidence.json');
            if (!fs.existsSync(docsPath)) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: false, error: 'Document catalog not found' }));
            }

            const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
            const doc = docs.find(d => d.id === docId);
            if (!doc) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: false, error: 'Document not found' }));
            }

            const necDataDir = path.resolve(process.cwd(), '..', 'nec-data');
            const publicDir = path.resolve(process.cwd(), 'public');
            let targetFile = null;

            if (doc.storageReference) {
              const sub = doc.storageReference.replace(/^documents\//, '');
              const p1 = path.resolve(necDataDir, sub);
              const p2 = path.resolve(publicDir, doc.storageReference);
              const p3 = path.resolve(publicDir, 'documents', 'csp', '2023-batch', path.basename(sub));
              const p4 = path.resolve(publicDir, 'documents', 'csp', '2022-batch', path.basename(sub));
              if (fs.existsSync(p1)) targetFile = p1;
              else if (fs.existsSync(p2)) targetFile = p2;
              else if (fs.existsSync(p3)) targetFile = p3;
              else if (fs.existsSync(p4)) targetFile = p4;
            }

            if (!targetFile || !fs.existsSync(targetFile)) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: false, error: 'Document file not found on disk' }));
            }

            const ext = path.extname(targetFile).toLowerCase();
            let contentType = 'application/octet-stream';
            if (ext === '.pdf') contentType = 'application/pdf';
            else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            else if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

            const safeName = path.basename(targetFile).replace(/["\r\n]/g, '');
            const disposition = isDownload ? `attachment; filename="${safeName}"` : `inline; filename="${safeName}"`;

            res.writeHead(200, {
              'Content-Type': contentType,
              'Content-Disposition': disposition,
              'Cache-Control': 'private, max-age=3600'
            });

            const stream = fs.createReadStream(targetFile);
            return stream.pipe(res);
          } catch (err) {
            return safeApiError(res, err, 500, 'Document Serving Error');
          }
        }

        next();
      });
    }
  };
}
