import { useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent, useMotionTemplate } from 'framer-motion';
import { Eyebrow } from '../primitives.jsx';
import { CAMPUS_STOPS } from '../experienceData.js';

const GAP = 1500; // px of depth between photographs

function Stop({ stop, index, depth }) {
  // distance from camera: negative = ahead, positive = passed
  const rel = useTransform(depth, (d) => d - index * GAP);
  const opacity = useTransform(rel, [-GAP * 3.2, -GAP * 1.6, -150, 250], [0, 1, 1, 0]);
  const blur = useTransform(rel, [-GAP * 3.2, -GAP * 1.4, -200, 250], [10, 0, 0, 8]);
  const filter = useMotionTemplate`blur(${blur}px)`;
  const side = index % 2 === 0 ? -1 : 1;

  return (
    <motion.figure
      className="nx-fly-stop"
      style={{
        opacity,
        filter,
        transform: `translate3d(calc(-50% + ${side * 17}vw), -50%, ${-index * GAP}px) rotateY(${side * -10}deg)`
      }}
    >
      <img src={stop.src} alt={stop.title} loading={index < 2 ? 'eager' : 'lazy'} decoding="async" />
      <figcaption>
        <span>{String(index + 1).padStart(2, '0')}</span>
        {stop.kicker}
      </figcaption>
    </motion.figure>
  );
}

export default function CampusFlythrough() {
  const ref = useRef(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const total = (CAMPUS_STOPS.length - 1) * GAP + 600;
  const depth = useTransform(scrollYProgress, [0.04, 0.96], [-GAP * 0.6, total]);
  const worldTransform = useMotionTemplate`translate3d(0, 0, ${depth}px)`;
  const barScale = useTransform(scrollYProgress, [0.04, 0.96], [0, 1]);
  const introOpacity = useTransform(scrollYProgress, [0, 0.06, 0.1], [1, 1, 0]);

  useMotionValueEvent(depth, 'change', (d) => {
    const idx = Math.max(0, Math.min(CAMPUS_STOPS.length - 1, Math.round((d + GAP * 0.35) / GAP)));
    setActive((prev) => (prev === idx ? prev : idx));
  });

  const stop = CAMPUS_STOPS[active];

  return (
    <section id="nx-campus" ref={ref} className="nx-fly" data-shape="2" style={{ height: `${CAMPUS_STOPS.length * 80 + 100}vh` }} aria-label="Campus fly-through">
      <div className="nx-sticky nx-fly-stage">
        <div className="nx-fly-viewport">
          <motion.div className="nx-fly-world" style={{ transform: worldTransform }}>
            {CAMPUS_STOPS.map((s, i) => (
              <Stop key={s.src} stop={s} index={i} depth={depth} />
            ))}
          </motion.div>
        </div>

        <motion.div className="nx-fly-intro" style={{ opacity: introOpacity }}>
          <Eyebrow index={2}>Campus</Eyebrow>
          <h2 className="nx-h2">Fly through <span className="nx-grad-text">the campus.</span></h2>
          <p className="nx-muted">Keep scrolling — every photograph is a doorway.</p>
        </motion.div>

        <div className="nx-fly-hud">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              className="nx-fly-caption"
              initial={{ opacity: 0, y: 30, rotateX: -40 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="nx-fly-kicker">{stop.kicker}</span>
              <h3>{stop.title}</h3>
              <p>{stop.text}</p>
            </motion.div>
          </AnimatePresence>
          <div className="nx-fly-meter">
            <span>{String(active + 1).padStart(2, '0')}</span>
            <div className="nx-fly-bar"><motion.i style={{ scaleX: barScale }} /></div>
            <span>{String(CAMPUS_STOPS.length).padStart(2, '0')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
