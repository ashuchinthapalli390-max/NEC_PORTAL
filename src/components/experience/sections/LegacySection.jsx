import { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';
import { Eyebrow, Reveal, TiltCard, CountUp, SafeImg, Depth } from '../primitives.jsx';
import {
  ACCREDITATIONS,
  RANKINGS,
  ACCREDITATION_BADGES,
  STUDENTS_IMG,
  STUDENT_FEATURE_IMG,
  COLLEGE_INFO,
  PUBLIC_FACTS
} from '../experienceData.js';

const STATEMENT =
  'For more than a quarter century, Narasaraopeta Engineering College has turned curiosity into capability — thirteen departments, a 40-acre green campus and a culture built for the engineers who will shape what comes next.';

const ACCENTS = ['#E9B44C', '#5CC8E6', '#F6D58E', '#8FD3C1', '#E58A4E'];

function ScrollLitText({ text }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.35'] });
  const words = text.split(' ');
  return (
    <p ref={ref} className="nx-lit" aria-label={text}>
      {words.map((w, i) => (
        <LitWord key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>{w}</LitWord>
      ))}
    </p>
  );
}

function LitWord({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  const y = useTransform(progress, range, [8, 0]);
  return (
    <motion.span aria-hidden="true" className="nx-lit-word" style={{ opacity, y }}>
      {children}{' '}
    </motion.span>
  );
}

/** Logos on a 3D ring that turns as you scroll past. */
function RecognitionRing() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rotate = useTransform(scrollYProgress, [0, 1], [40, -320]);
  const tilt = useTransform(scrollYProgress, [0, 0.5, 1], [26, 12, -4]);
  const ring = useMotionTemplate`rotateX(${tilt}deg) rotateY(${rotate}deg)`;
  const n = ACCREDITATIONS.length;
  return (
    <div ref={ref} className="nx-ring-scene" aria-label="Accreditations and recognitions">
      <motion.div className="nx-ring" style={{ transform: ring }}>
        {ACCREDITATIONS.map((a, i) => (
          <div key={`${a.label}-${i}`} className="nx-ring-tile" style={{ transform: `rotateY(${(360 / n) * i}deg) translateZ(var(--ring-r))` }}>
            <SafeImg src={a.src} alt={`${a.label} logo`} />
            <strong>{a.label}</strong>
            <span>{a.note}</span>
          </div>
        ))}
      </motion.div>
      <div className="nx-ring-floor" aria-hidden="true" />
    </div>
  );
}

export default function LegacySection() {
  return (
    <section id="nx-legacy" className="nx-section nx-legacy" data-shape="1">
      <div className="nx-container">
        <Eyebrow index={1}>Legacy · Since {COLLEGE_INFO.established}</Eyebrow>
        <ScrollLitText text={STATEMENT} />

        <Depth>
          <div className="nx-stats">
            {PUBLIC_FACTS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.05}>
                <TiltCard className="nx-stat" style={{ '--accent': ACCENTS[i % ACCENTS.length] }}>
                  {s.text ? (
                    <span className="nx-stat-value">{s.text}</span>
                  ) : s.plain ? (
                    <span className="nx-stat-value">{s.value}</span>
                  ) : (
                    <CountUp to={s.value} suffix={s.suffix || ''} className="nx-stat-value" />
                  )}
                  <span className="nx-stat-label">{s.label}</span>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </Depth>
      </div>

      <RecognitionRing />

      <div className="nx-container nx-recognition">
        <Reveal className="nx-recognition-copy">
          <h3 className="nx-h3">Recognised. Ranked. <span className="nx-grad-text">Accredited.</span></h3>
          <p className="nx-muted">{COLLEGE_INFO.accreditations.join(' · ')}</p>
          <SafeImg src={ACCREDITATION_BADGES.src} alt={ACCREDITATION_BADGES.alt} className="nx-badges-img" />
          <div className="nx-student-pair">
            <SafeImg src={STUDENTS_IMG} alt="Students learning together at NEC" />
            <SafeImg src={STUDENT_FEATURE_IMG} alt="NEC engineering student" />
          </div>
        </Reveal>
        <div className="nx-rank-stack">
          {RANKINGS.map((r, i) => (
            <Reveal key={r.src} delay={0.1 + i * 0.12}>
              <TiltCard className="nx-rank-card" max={14}>
                <SafeImg src={r.src} alt={r.alt} />
                <span>{r.label}</span>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
