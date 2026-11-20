import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';
import { Maximize2 } from 'lucide-react';
import { Eyebrow, Lightbox, SafeImg } from '../primitives.jsx';
import { PLACEMENT_POSTERS } from '../experienceData.js';

// final fanned-out pose for each poster (vw / deg)
const POSES = [
  { x: -24, y: 2, rz: -9, ry: 24 },
  { x: 24, y: -2, rz: 8, ry: -24 },
  { x: 0, y: 6, rz: 0, ry: 0 }
];

function FanPoster({ poster, index, progress, onOpen }) {
  const pose = POSES[index % POSES.length];
  const delay = index * 0.08;
  const p = useTransform(progress, [0.1 + delay, 0.62 + delay], [0, 1], { clamp: true });
  const x = useTransform(p, [0, 1], [0, pose.x]);
  const y = useTransform(p, [0, 1], [40, pose.y]);
  const z = useTransform(p, [0, 1], [-1400, index === 2 ? 120 : 0]);
  const ry = useTransform(p, [0, 1], [index % 2 ? -70 : 70, pose.ry]);
  const rz = useTransform(p, [0, 1], [index % 2 ? 25 : -25, pose.rz]);
  const opacity = useTransform(p, [0, 0.25], [0, 1]);
  const transform = useMotionTemplate`translate(-50%, -50%) translate3d(${x}vw, ${y}vh, ${z}px) rotateY(${ry}deg) rotateZ(${rz}deg)`;

  return (
    <motion.button
      className={`nx-fan-poster ${index === 2 ? 'is-wide' : ''}`}
      style={{ transform, opacity, zIndex: index === 2 ? 3 : 1 }}
      onClick={() => onOpen(index)}
      aria-label={`View ${poster.title} poster`}
    >
      <SafeImg src={poster.src} alt={poster.alt} />
      <div className="nx-poster-meta">
        <strong>{poster.stat}</strong>
        <span>{poster.statLabel}</span>
        <em>{poster.title}</em>
      </div>
      <span className="nx-fan-zoom"><Maximize2 size={14} /></span>
    </motion.button>
  );
}

export default function PlacementsSection() {
  const ref = useRef(null);
  const [open, setOpen] = useState(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const headOpacity = useTransform(scrollYProgress, [0, 0.08, 0.85, 1], [0, 1, 1, 0.4]);
  const headY = useTransform(scrollYProgress, [0, 0.12], [40, 0]);
  const glow = useTransform(scrollYProgress, [0.2, 0.7], [0, 1]);

  return (
    <section id="nx-placements" ref={ref} className="nx-fan" data-shape="3" aria-label="Placements">
      <div className="nx-sticky nx-fan-stage">
        <motion.div className="nx-container nx-fan-head" style={{ opacity: headOpacity, y: headY }}>
          <Eyebrow index={10}>Placements</Eyebrow>
          <h2 className="nx-h2">Careers that <span className="nx-grad-text">launch from here.</span></h2>
          <p className="nx-muted">Recent campus selection drives, as announced by the college.</p>
        </motion.div>
        <motion.div className="nx-fan-glow" style={{ opacity: glow }} aria-hidden="true" />
        <div className="nx-fan-viewport">
          {PLACEMENT_POSTERS.map((p, i) => (
            <FanPoster key={p.src} poster={p} index={i} progress={scrollYProgress} onOpen={setOpen} />
          ))}
        </div>
      </div>
      <Lightbox
        open={open !== null}
        onClose={() => setOpen(null)}
        images={PLACEMENT_POSTERS.map((p) => p.src)}
        startIndex={open || 0}
        title="Placement highlights"
      />
    </section>
  );
}
