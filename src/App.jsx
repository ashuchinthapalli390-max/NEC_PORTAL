import React, { useState, useEffect } from 'react';
import './styles/design-system.css';

// Master Data & Store
import { USER_ROLES } from './data/portalStore.js';
import { firebaseAuth } from './lib/firebase/client.ts';
import { signOut } from 'firebase/auth';
import { BRANDING_LOGOS } from './data/masterData.js';
import { safeAuthFetch } from './lib/auth/authFetch.js';

// Public Website — immersive 3D scroll experience
import PublicExperience from './components/experience/PublicExperience.jsx';

// Portal Components
import PortalAuth from './components/portal/PortalAuth.jsx';
import PortalDashboard from './components/portal/PortalDashboard.jsx';

// Global Search Palette & Error Boundaries

/**
 * Root Fatal Error Boundary
 * Confined strictly to catastrophic root shell crashes.
 * Never mentions modules or display preferences.
 */
class RootFatalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[FATAL_ROOT_ERROR]', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#070F1E', color: '#FFF', padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#D4AF37', marginBottom: '0.8rem', fontFamily: 'Cinzel, serif' }}>
            Narasaraopeta Engineering College
          </h2>
          <p style={{ color: '#94A3B8', maxWidth: '480px', marginBottom: '1.5rem', fontSize: '0.92rem', lineHeight: 1.6 }}>
            An unexpected error occurred while loading the application.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleReload}
              className="btn-primary"
              style={{ padding: '0.65rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}
            >
              Reload View
            </button>
            <button
              onClick={this.handleGoHome}
              className="btn-secondary"
              style={{ padding: '0.65rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}
            >
              Go to Homepage
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Isolated Authentication Error Boundary
 * Prevents any sign-in errors from destroying the public site or page shell.
 */
class AuthErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AUTH_MODAL_ERROR]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 15, 30, 0.92)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '2rem', maxWidth: '420px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: '#0F172A', fontWeight: 800, margin: '0 0 0.5rem 0', fontSize: '1.15rem' }}>Unable to Load Sign-In Window</h3>
            <p style={{ color: '#64748B', fontSize: '0.84rem', marginBottom: '1.2rem', lineHeight: 1.5 }}>
              A localized error occurred while rendering the sign-in modal. Please try again.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="btn-primary"
                style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', cursor: 'pointer' }}
              >
                Try Again
              </button>
              {this.props.onClose && (
                <button
                  onClick={this.props.onClose}
                  className="btn-secondary"
                  style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Dedicated Portal Shell Error Boundary
 * Confines portal dashboard crashes so authenticated sessions and the public website remain intact.
 */
class PortalShellErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[PORTAL_SHELL_ERROR]', error, errorInfo);
    try {
      fetch('/api/telemetry/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'PortalShell',
          errorName: error?.name,
          errorMessage: error?.message,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
    } catch {}
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #070F1E 0%, #0B192C 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '16px',
            padding: '2.5rem 2rem',
            maxWidth: '520px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.2rem'
            }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', color: '#D4AF37', margin: '0 0 0.5rem 0', fontFamily: 'Cinzel, serif' }}>
              Unable to Load Secure Portal
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              A localized display issue occurred while rendering the portal dashboard. Your authenticated session remains intact and safe.
            </p>
            {this.state.error && (
              <div style={{ textAlign: 'left', background: '#070F1E', padding: '0.75rem', borderRadius: '8px', border: '1px solid #EF4444', color: '#FCA5A5', fontSize: '0.78rem', marginBottom: '1.2rem', maxHeight: '180px', overflowY: 'auto', fontFamily: 'monospace' }}>
                <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>{this.state.error.name}: {this.state.error.message}</div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{this.state.error.stack}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleRetry}
                style={{
                  background: 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)',
                  color: '#070F1E',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.65rem 1.25rem',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.props.onNavigatePublic}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '0.65rem 1.25rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Open Public Website
              </button>
              <button
                type="button"
                onClick={this.props.onLogout}
                style={{
                  background: 'rgba(220, 38, 38, 0.2)',
                  color: '#FCA5A5',
                  border: '1px solid rgba(220, 38, 38, 0.4)',
                  borderRadius: '8px',
                  padding: '0.65rem 1.25rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <RootFatalErrorBoundary>
      <MainApp />
    </RootFatalErrorBoundary>
  );
}

function MainApp() {
  // Authentication & Session Persistence State
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'authenticated' | 'unauthenticated'
  const [currentUser, setCurrentUser] = useState(null); // Never default to Super Admin
  const [viewMode, setViewMode] = useState('public'); // 'public' | 'portal'
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // 1. Authoritative Server Session Check on Page Load / Refresh
  useEffect(() => {
    let isMounted = true;

    async function checkServerSession() {
      try {
        const { ok, data } = await safeAuthFetch('/api/auth/me', {
          method: 'GET',
          credentials: 'same-origin'
        });

        if (ok && data?.authenticated && data?.user) {
          if (isMounted) {
            setCurrentUser(data.user);
            setViewMode('portal');
            setAuthState('authenticated');
            return;
          }
        }
      } catch (err) {
        console.warn('Session verification fallback to public:', err);
      }

      // No client-side login shortcuts: the portal opens only for a session the server verified above.
      // Strip any legacy ?portal=… / ?role=… params so old bookmarked links land cleanly on the public site.
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.has('portal') || params.has('role')) {
          params.delete('portal');
          params.delete('role');
          const qs = params.toString();
          window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
        }
      }

      if (isMounted) {
        setAuthState('unauthenticated');
      }
    }

    checkServerSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Reset scroll position when switching between public site and portal
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [viewMode]);

  const handleOpenPortal = async () => {
    if (authState === 'authenticated' && currentUser) {
      setViewMode('portal');
      return;
    }

    // Authoritative check against server session cookie
    try {
      const { ok, data } = await safeAuthFetch('/api/auth/me', { credentials: 'same-origin' });
      if (ok && data?.authenticated && data?.user) {
        setCurrentUser(data.user);
        setAuthState('authenticated');
        setViewMode('portal');
        return;
      }
    } catch (e) {
      console.warn('Live session check fallback:', e);
    }

    setAuthModalOpen(true);
  };

  // Pure navigation to Public Website (Preserves active verified session!)
  const handleGoToPublicWebsite = () => {
    setViewMode('public');
  };

  // Explicit User Logout (Revokes server session cookie)
  const handleLogout = async () => {
    try {
      await safeAuthFetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
      });
    } catch (err) {
      console.warn('Server logout error:', err);
    }

    try {
      await signOut(firebaseAuth);
    } catch (err) {}

    setViewMode('public');
    setAuthState('unauthenticated');
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
    setViewMode('portal');
    setAuthState('authenticated');
  };

  // 2. Loading State During Session Hydration (Prevents Privilege/Role Flash)
  if (authState === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#070F1E',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <img
          src={BRANDING_LOGOS.collegeLogo}
          alt="NEC Crest"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '12px',
            border: '2px solid #D4AF37',
            boxShadow: '0 0 25px rgba(212, 175, 55, 0.4)',
            marginBottom: '1.5rem',
            animation: 'pulse 2s infinite'
          }}
        />
        <div style={{
          fontSize: '1.05rem',
          fontWeight: 700,
          letterSpacing: '0.5px',
          color: '#F1C40F'
        }}>
          Verifying Authorized Portal Session...
        </div>
        <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.35rem' }}>
          Narasaraopeta Engineering College (Autonomous)
        </div>
      </div>
    );
  }

  // 3. Authenticated Secure Portal View Mode (Survives Refresh & Public Navigation!)
  if (viewMode === 'portal' && authState === 'authenticated' && currentUser) {
    return (
      <PortalShellErrorBoundary
        onNavigatePublic={handleGoToPublicWebsite}
        onLogout={handleLogout}
      >
        <PortalDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigatePublic={handleGoToPublicWebsite}
        />
      </PortalShellErrorBoundary>
    );
  }

  // 4. Public Institutional Website — single continuous 3D scroll experience
  return (
    <>
      {/* Public site has its own search over public content only (see PublicSearch.jsx) */}
      <PublicExperience
        onOpenPortal={handleOpenPortal}
        isAuthenticated={authState === 'authenticated'}
        currentUser={currentUser}
        overlayOpen={authModalOpen}
      />

      {/* Authentication Modal with 2-Step OTP Verification */}
      {authModalOpen && (
        <AuthErrorBoundary onClose={() => setAuthModalOpen(false)}>
          <PortalAuth
            onClose={() => setAuthModalOpen(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        </AuthErrorBoundary>
      )}
    </>
  );
}
