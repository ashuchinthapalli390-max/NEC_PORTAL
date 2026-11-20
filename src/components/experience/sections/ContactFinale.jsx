import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MapPin, Phone, Mail, Globe, ArrowUp, LogIn, Navigation } from 'lucide-react';
import { Eyebrow, LazyVideo, SafeImg } from '../primitives.jsx';
import { COLLEGE_INFO, OPT, LOGO_VIDEO, FULL_NAME_LOGO, CALL_ICON, CREST_ALT, MAIN_LOGO, ACCREDITATIONS } from '../experienceData.js';

export default function ContactFinale({ onOpenPortal, onBackToTop }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.35, 1]);
  const bgY = useTransform(scrollYProgress, [0, 1], ['-12%', '0%']);
  const wordX = useTransform(scrollYProgress, [0, 1], ['25%', '-5%']);
  const orbRotate = useTransform(scrollYProgress, [0, 1], [-40, 0]);

  const phones = COLLEGE_INFO.admissionsHelpline.split('/').map((p) => p.trim());
  const office = COLLEGE_INFO.phone.split('/')[0].trim();
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Narasaraopeta Engineering College, Narasaraopet')}`;

  return (
    <section id="nx-contact" ref={ref} className="nx-finale" data-shape="6" aria-label="Visit and contact">
      <motion.div className="nx-finale-bg" style={{ scale: bgScale, y: bgY, backgroundImage: `url(${OPT}/night-view.webp)` }} aria-hidden="true" />
      <div className="nx-finale-shade" aria-hidden="true" />

      <motion.div className="nx-finale-word" style={{ x: wordX }} aria-hidden="true">VISIT NEC · VISIT NEC</motion.div>

      <div className="nx-container nx-finale-grid">
        <div>
          <Eyebrow index={13}>Visit</Eyebrow>
          <h2 className="nx-h2 nx-finale-title">Your story starts <span className="nx-grad-text">on this campus.</span></h2>
          <p className="nx-muted nx-lede">EAMCET / ECET code <strong className="nx-strong">NARA</strong>. Come see the labs, meet the faculty and walk the corridors yourself.</p>

          <div className="nx-contact-cards">
            <a className="nx-contact-card" href={mapsHref} target="_blank" rel="noopener noreferrer">
              <MapPin size={20} />
              <span><em>Campus</em>{COLLEGE_INFO.address}</span>
              <Navigation size={16} />
            </a>
            <a className="nx-contact-card" href={`tel:${phones[0].replace(/\s/g, '')}`}>
              <img src={CALL_ICON} alt="" className="nx-call-icon" />
              <span><em>Admissions</em>{phones.join(' · ')}</span>
            </a>
            <a className="nx-contact-card" href={`tel:${office.replace(/\s/g, '')}`}>
              <Phone size={20} />
              <span><em>Office</em>{COLLEGE_INFO.phone}</span>
            </a>
            <a className="nx-contact-card" href={`mailto:${COLLEGE_INFO.email}`}>
              <Mail size={20} />
              <span><em>Email</em>{COLLEGE_INFO.email}</span>
            </a>
            <a className="nx-contact-card" href={COLLEGE_INFO.website} target="_blank" rel="noopener noreferrer">
              <Globe size={20} />
              <span><em>Website</em>{COLLEGE_INFO.website.replace('https://', '')}</span>
            </a>
          </div>

          <div className="nx-hero-ctas">
            <button className="nx-cta" onClick={onOpenPortal}><LogIn size={17} /> Portal Login</button>
            <button className="nx-cta nx-cta-ghost" onClick={onBackToTop}><ArrowUp size={17} /> Back to the beginning</button>
          </div>
        </div>

        <motion.div className="nx-orb-wrap" style={{ rotateY: orbRotate }}>
          <div className="nx-orb">
            <LazyVideo src={LOGO_VIDEO} poster={CREST_ALT} className="nx-orb-video" />
          </div>
          <div className="nx-orb-ring" />
          <div className="nx-orb-ring nx-orb-ring-2" />
        </motion.div>
      </div>

      <footer className="nx-footer">
        <div className="nx-container nx-footer-inner">
          <SafeImg src={FULL_NAME_LOGO} fallback={MAIN_LOGO} alt="Narasaraopeta Engineering College (Autonomous)" className="nx-footer-logo" />
          <div className="nx-footer-logos">
            {ACCREDITATIONS.slice(0, 7).map((a) => (
              <SafeImg key={a.src} src={a.src} alt={a.label} />
            ))}
          </div>
          <p className="nx-footer-note">
            © {new Date().getFullYear()} {COLLEGE_INFO.name} · {COLLEGE_INFO.society} · {COLLEGE_INFO.autonomous}
          </p>
        </div>
      </footer>
    </section>
  );
}
