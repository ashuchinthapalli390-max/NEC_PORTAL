import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { Search, LogIn, ShieldCheck, Phone, ArrowUpRight } from 'lucide-react';
import { CHAPTERS, CREST, COLLEGE_INFO, FULL_NAME_LOGO } from './experienceData.js';

/* ------------------------------------------------------------------ */
/* Preloader — counter + crest, lifts like a curtain                   */
/* ------------------------------------------------------------------ */
export function Preloader({ onDone }) {
  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t0 = performance.now();
    const total = 1700;
    let raf;
    const step = (now) => {
      const p = Math.min((now - t0) / total, 1);
      setPct(Math.round((1 - Math.pow(1 - p, 3)) * 100));
      if (p < 1) raf = requestAnimationFrame(step);
      else {
        setLeaving(true);
        setTimeout(onDone, 900);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <motion.div
      className="nx-preloader"
      initial={{ clipPath: 'inset(0 0 0% 0)' }}
      animate={leaving ? { clipPath: 'inset(0 0 100% 0)' } : { clipPath: 'inset(0 0 0% 0)' }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
      aria-hidden="true"
    >
      <div className="nx-preloader-inner">
        <motion.img
          src={CREST}
          alt=""
          className="nx-preloader-crest"
          initial={{ scale: 0.6, opacity: 0, rotateY: -90 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="nx-preloader-name">Narasaraopeta Engineering College</div>
        <div className="nx-preloader-bar"><span style={{ transform: `scaleX(${pct / 100})` }} /></div>
      </div>
      <div className="nx-preloader-count">{String(pct).padStart(3, '0')}</div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Top bar + fullscreen chapter menu                                   */
/* ------------------------------------------------------------------ */
export function TopBar({ activeChapter, onNavigate, onOpenPortal, onOpenSearch, isAuthenticated, currentUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 240 && y > lastY.current + 4 && !menuOpen);
      if (y < lastY.current - 4) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [menuOpen]);

  useEffect(() => {
    document.documentElement.classList.toggle('nx-locked', menuOpen);
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const go = (id) => {
    setMenuOpen(false);
    setTimeout(() => onNavigate(id), menuOpen ? 350 : 0);
  };

  const first = currentUser?.name ? currentUser.name.split(' ').slice(-1)[0] : 'Portal';

  return (
    <>
      <header className={`nx-topbar ${hidden ? 'is-hidden' : ''}`}>
        <button className="nx-brand" onClick={() => go('nx-hero')} aria-label="Back to start">
          <img src={CREST} alt="" />
          <span className="nx-brand-text">
            <strong>NEC</strong>
            <em>Autonomous · Estd. 1998</em>
          </span>
        </button>

        <div className="nx-topbar-chapter" aria-live="polite">
          <span className="nx-dot" />
          {CHAPTERS.find((c) => c.id === activeChapter)?.label || 'Enter'}
        </div>

        <div className="nx-topbar-actions">
          <button className="nx-icon-btn" onClick={onOpenSearch} aria-label="Search (Ctrl+K)">
            <Search size={17} />
          </button>
          <button className={`nx-portal-btn ${isAuthenticated ? 'is-auth' : ''}`} onClick={onOpenPortal}>
            {isAuthenticated ? <ShieldCheck size={15} /> : <LogIn size={15} />}
            <span>{isAuthenticated ? `Enter Portal · ${first}` : 'Portal Login'}</span>
          </button>
          <button className={`nx-burger ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
            <span /><span />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            className="nx-menu"
            initial={{ clipPath: 'circle(0% at calc(100% - 44px) 36px)' }}
            animate={{ clipPath: 'circle(150% at calc(100% - 44px) 36px)' }}
            exit={{ clipPath: 'circle(0% at calc(100% - 44px) 36px)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            aria-label="Chapters"
            data-lenis-prevent
          >
            <div className="nx-menu-grid">
              <ol className="nx-menu-list">
                {CHAPTERS.map((c, i) => (
                  <motion.li
                    key={c.id}
                    initial={{ y: 60, opacity: 0, rotateX: -50 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    transition={{ delay: 0.15 + i * 0.035, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <button className={activeChapter === c.id ? 'is-active' : ''} onClick={() => go(c.id)}>
                      <span className="nx-menu-index">{String(i + 1).padStart(2, '0')}</span>
                      {c.label}
                    </button>
                  </motion.li>
                ))}
              </ol>
              <motion.aside className="nx-menu-aside" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                <img src={FULL_NAME_LOGO} alt="Narasaraopeta Engineering College (Autonomous)" className="nx-menu-logo" />
                <p>{COLLEGE_INFO.address}</p>
                <a href={`tel:${COLLEGE_INFO.admissionsHelpline.split('/')[0].replace(/\s/g, '')}`} className="nx-menu-link"><Phone size={15} /> Admissions {COLLEGE_INFO.admissionsHelpline.split('/')[0]}</a>
                <a href={`mailto:${COLLEGE_INFO.email}`} className="nx-menu-link"><ArrowUpRight size={15} /> {COLLEGE_INFO.email}</a>
                <button className="nx-cta" onClick={() => { setMenuOpen(false); onOpenPortal(); }}>
                  <LogIn size={16} /> {isAuthenticated ? 'Enter Portal' : 'Portal Login'}
                </button>
              </motion.aside>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter rail (right edge) + scroll progress                         */
/* ------------------------------------------------------------------ */
export function ChapterRail({ activeChapter, onNavigate }) {
  return (
    <nav className="nx-rail" aria-label="Chapter navigation">
      {CHAPTERS.map((c, i) => (
        <button key={c.id} className={activeChapter === c.id ? 'is-active' : ''} onClick={() => onNavigate(c.id)} aria-label={`Go to ${c.label}`}>
          <span className="nx-rail-label">{String(i + 1).padStart(2, '0')} {c.label}</span>
          <span className="nx-rail-tick" />
        </button>
      ))}
    </nav>
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  return <motion.div className="nx-progress" style={{ scaleX }} aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/* Custom cursor (fine pointers only)                                  */
/* ------------------------------------------------------------------ */
export function Cursor() {
  const dot = useRef(null);
  const ring = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return undefined;
    document.documentElement.classList.add('nx-has-cursor');
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let raf;
    const move = (e) => {
      x = e.clientX;
      y = e.clientY;
      const t = e.target;
      const interactive = t.closest && t.closest('a, button, [role="button"], input, select, textarea, .nx-tilt');
      ring.current?.classList.toggle('is-hover', !!interactive);
    };
    const down = () => ring.current?.classList.add('is-down');
    const up = () => ring.current?.classList.remove('is-down');
    const loop = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      document.documentElement.classList.remove('nx-has-cursor');
    };
  }, []);

  return (
    <>
      <div ref={ring} className="nx-cursor-ring" aria-hidden="true" />
      <div ref={dot} className="nx-cursor-dot" aria-hidden="true" />
    </>
  );
}
