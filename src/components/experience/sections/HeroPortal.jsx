import { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';
import { ArrowDown, Compass, LogIn } from 'lucide-react';
import { HERO_VIDEO, OPT, COLLEGE_INFO } from '../experienceData.js';

const LINE_1 = 'NARASARAOPETA';
const LINE_2 = 'ENGINEERING COLLEGE';

function Letters({ text, delay = 0, className }) {
  return (
    <span className={className} aria-hidden="true">
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          className="nx-hero-letter"
          initial={{ y: '120%', rotateX: -90, opacity: 0 }}
          animate={{ y: '0%', rotateX: 0, opacity: 1 }}
          transition={{ delay: delay + i * 0.035, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </span>
  );
}

export default function HeroPortal({ ready, onExplore, onOpenPortal }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  // headline flies toward the camera and dissolves
  const titleScale = useTransform(scrollYProgress, [0, 0.45], [1, 2.6]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.3, 0.42], [1, 1, 0]);
  const titleBlur = useTransform(scrollYProgress, [0.15, 0.42], [0, 14]);
  const titleFilter = useMotionTemplate`blur(${titleBlur}px)`;

  // portal window grows from a card to the full viewport
  const inset = useTransform(scrollYProgress, [0.05, 0.62], [30, 0]);
  const insetY = useTransform(scrollYProgress, [0.05, 0.62], [22, 0]);
  const radius = useTransform(scrollYProgress, [0.05, 0.62], [28, 0]);
  const clip = useMotionTemplate`inset(${insetY}% ${inset}% ${insetY}% ${inset}% round ${radius}px)`;
  const videoScale = useTransform(scrollYProgress, [0, 0.7], [1.35, 1]);
  const portalRotate = useTransform(scrollYProgress, [0, 0.6], [14, 0]);

  // post-reveal copy
  const copyOpacity = useTransform(scrollYProgress, [0.6, 0.72, 0.94, 1], [0, 1, 1, 0.2]);
  const copyY = useTransform(scrollYProgress, [0.6, 0.75], [60, 0]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  return (
    <section id="nx-hero" ref={ref} className="nx-hero" data-shape="0" aria-label="Welcome to Narasaraopeta Engineering College">
      <div className="nx-sticky nx-hero-stage">
        <motion.div className="nx-portal" style={{ clipPath: clip, rotateX: portalRotate }}>
          <motion.video
            className="nx-portal-video"
            src={HERO_VIDEO}
            poster={`${OPT}/area-view.webp`}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            style={{ scale: videoScale }}
          />
          <div className="nx-portal-shade" />
        </motion.div>

        <motion.div className="nx-hero-title-wrap" style={{ scale: titleScale, opacity: titleOpacity, filter: titleFilter }}>
          <motion.div className="nx-hero-kicker" initial={{ opacity: 0, y: 20 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2, duration: 0.8 }}>
            <span>Autonomous</span><i /> <span>NAAC A+</span><i /> <span>NBA</span><i /> <span>Estd. {COLLEGE_INFO.established}</span>
          </motion.div>
          <h1 className="nx-hero-title" aria-label="Narasaraopeta Engineering College">
            {ready && <Letters text={LINE_1} delay={0.25} className="nx-hero-line nx-hero-line-1" />}
            {ready && <Letters text={LINE_2} delay={0.55} className="nx-hero-line nx-hero-line-2 nx-grad-text" />}
          </h1>
          <motion.p className="nx-hero-sub" initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : {}} transition={{ delay: 1.3, duration: 1 }}>
            Scroll to step inside — engineering, research and innovation in three dimensions.
          </motion.p>
        </motion.div>

        <motion.div className="nx-hero-after" style={{ opacity: copyOpacity, y: copyY }}>
          <p className="nx-hero-after-kicker">Palnadu · Andhra Pradesh</p>
          <h2>40+ acres of ambition,<br /><span className="nx-grad-text">since 1998.</span></h2>
          <div className="nx-hero-ctas">
            <button className="nx-cta" onClick={onExplore}><Compass size={17} /> Begin the journey</button>
            <button className="nx-cta nx-cta-ghost" onClick={onOpenPortal}><LogIn size={17} /> Portal Login</button>
          </div>
        </motion.div>

        <motion.div className="nx-scroll-hint" style={{ opacity: hintOpacity }}>
          <span>Scroll to explore</span>
          <ArrowDown size={16} />
        </motion.div>
      </div>
    </section>
  );
}
