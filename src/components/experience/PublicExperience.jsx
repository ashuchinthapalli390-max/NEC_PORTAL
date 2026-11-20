import { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import './experience.css';
import ParticleUniverse from './ParticleUniverse.jsx';
import { Preloader, TopBar, ChapterRail, ScrollProgress, Cursor } from './ExperienceChrome.jsx';
import PublicSearch from './PublicSearch.jsx';
import PublicSectionErrorBoundary from '../common/PublicSectionErrorBoundary.jsx';
import HeroPortal from './sections/HeroPortal.jsx';
import LegacySection from './sections/LegacySection.jsx';
import CampusFlythrough from './sections/CampusFlythrough.jsx';
import LeadershipSection from './sections/LeadershipSection.jsx';
import ProgrammesStack from './sections/ProgrammesStack.jsx';
import DepartmentsCylinder, { DepartmentPanel } from './sections/DepartmentsCylinder.jsx';
import EventsGallery from './sections/EventsGallery.jsx';
import GalleryTunnel from './sections/GalleryTunnel.jsx';
import CinemaWall from './sections/CinemaWall.jsx';
import StudentLife from './sections/StudentLife.jsx';
import PlacementsSection from './sections/PlacementsSection.jsx';
import FacultyExplorer from './sections/FacultyExplorer.jsx';
import GovernanceSection from './sections/GovernanceSection.jsx';
import ContactFinale from './sections/ContactFinale.jsx';
import { CHAPTERS } from './experienceData.js';

const SEARCH_TARGET = {
  leader: 'nx-leadership',
  event: 'nx-events',
  film: 'nx-cinema'
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

const Safe = ({ name, children }) => <PublicSectionErrorBoundary sectionName={name}>{children}</PublicSectionErrorBoundary>;

export default function PublicExperience({ onOpenPortal, isAuthenticated, currentUser, overlayOpen = false }) {
  const reducedMotion = usePrefersReducedMotion();
  const lenisRef = useRef(null);
  const [ready, setReady] = useState(() => {
    try {
      return sessionStorage.getItem('nx-intro-seen') === '1';
    } catch {
      return false;
    }
  });
  const [activeChapter, setActiveChapter] = useState(CHAPTERS[0].id);
  const [department, setDepartment] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [facultyFocus, setFacultyFocus] = useState(null);

  /* page-level classes: dark canvas + sticky-safe overflow */
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('nx-active');
    window.__nxShape = 0;
    return () => {
      html.classList.remove('nx-active', 'nx-locked', 'lenis', 'lenis-smooth');
    };
  }, []);

  /* smooth scroll */
  useEffect(() => {
    if (reducedMotion) return undefined;
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
    lenisRef.current = lenis;
    let raf = requestAnimationFrame(function loop(t) {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    });
    const html = document.documentElement;
    const sync = () => {
      if (html.classList.contains('nx-locked')) lenis.stop();
      else lenis.start();
    };
    const mo = new MutationObserver(sync);
    mo.observe(html, { attributes: true, attributeFilter: ['class'] });
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  /* overlays: auth modal (from App) + search palette */
  useEffect(() => {
    const html = document.documentElement;
    if (overlayOpen || searchOpen) html.classList.add('nx-locked');
    else if (!department) html.classList.remove('nx-locked');
  }, [overlayOpen, searchOpen, department]);

  /* chapter tracking → rail, top bar label, particle shape */
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const mid = window.innerHeight * 0.5;
      for (const c of CHAPTERS) {
        const el = document.getElementById(c.id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) {
          window.__nxShape = Number(el.dataset.shape ?? c.shape);
          setActiveChapter((prev) => (prev === c.id ? prev : c.id));
          break;
        }
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  /* Ctrl/Cmd + K toggles search */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !overlayOpen) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overlayOpen]);

  const scrollToChapter = useCallback((id, onDone) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenisRef.current) {
      lenisRef.current.start();
      lenisRef.current.scrollTo(el, {
        duration: 1.8,
        easing: (t) => 1 - Math.pow(1 - t, 4),
        force: true,
        onComplete: () => onDone?.()
      });
    } else {
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      if (onDone) setTimeout(onDone, reducedMotion ? 50 : 900);
    }
  }, [reducedMotion]);

  const handleSearchSelect = useCallback((r) => {
    // let the palette's close (and scroll unlock) land before moving
    setTimeout(() => {
      if (r.type === 'chapter') scrollToChapter(r.id);
      else if (r.type === 'department') scrollToChapter('nx-departments', () => setDepartment(r.payload));
      else if (r.type === 'faculty') {
        setFacultyFocus({ query: r.payload.name, nonce: Date.now() });
        scrollToChapter('nx-faculty');
      } else scrollToChapter(SEARCH_TARGET[r.type] || 'nx-hero');
    }, 80);
  }, [scrollToChapter]);

  const viewDirectory = useCallback((deptName) => {
    setDepartment(null);
    setFacultyFocus({ dept: deptName, nonce: Date.now() });
    setTimeout(() => scrollToChapter('nx-faculty'), 120);
  }, [scrollToChapter]);

  const finishIntro = useCallback(() => {
    setReady(true);
    try {
      sessionStorage.setItem('nx-intro-seen', '1');
    } catch {
      /* ignore */
    }
  }, []);

  const closeDepartment = useCallback(() => setDepartment(null), []);

  return (
    <div className={`nx ${reducedMotion ? 'nx-reduced' : ''}`}>
      <ParticleUniverse reducedMotion={reducedMotion} />
      <div className="nx-grain" aria-hidden="true" />
      <div className="nx-vignette" aria-hidden="true" />
      {!ready && <Preloader onDone={finishIntro} />}
      {!reducedMotion && <Cursor />}
      <ScrollProgress />
      <TopBar
        activeChapter={activeChapter}
        onNavigate={scrollToChapter}
        onOpenPortal={onOpenPortal}
        onOpenSearch={() => setSearchOpen(true)}
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
      />
      <ChapterRail activeChapter={activeChapter} onNavigate={scrollToChapter} />

      <main className="nx-main">
        <Safe name="Hero"><HeroPortal ready={ready} onExplore={() => scrollToChapter('nx-legacy')} onOpenPortal={onOpenPortal} /></Safe>
        <Safe name="Legacy"><LegacySection /></Safe>
        <Safe name="Campus"><CampusFlythrough /></Safe>
        <Safe name="Leadership"><LeadershipSection /></Safe>
        <Safe name="Programmes"><ProgrammesStack /></Safe>
        <Safe name="Departments"><DepartmentsCylinder onOpenDepartment={setDepartment} /></Safe>
        <Safe name="Events"><EventsGallery /></Safe>
        <Safe name="Gallery"><GalleryTunnel /></Safe>
        <Safe name="Cinema"><CinemaWall /></Safe>
        <Safe name="StudentLife"><StudentLife /></Safe>
        <Safe name="Placements"><PlacementsSection /></Safe>
        <Safe name="Faculty"><FacultyExplorer focus={facultyFocus} /></Safe>
        <Safe name="Governance"><GovernanceSection /></Safe>
        <Safe name="Contact"><ContactFinale onOpenPortal={onOpenPortal} onBackToTop={() => scrollToChapter('nx-hero')} /></Safe>
      </main>

      <DepartmentPanel dept={department} onClose={closeDepartment} onViewDirectory={viewDirectory} />
      <PublicSearch open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleSearchSelect} />
    </div>
  );
}
