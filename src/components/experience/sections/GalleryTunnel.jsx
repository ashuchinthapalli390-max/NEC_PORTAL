import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';
import { Eyebrow, Lightbox } from '../primitives.jsx';
import { TUNNEL_IMAGES } from '../experienceData.js';

const STEP = 420; // depth between consecutive photos
const TURN = 52; // degrees each photo turns around the spiral

function TunnelPhoto({ item, index, depth, radius, onOpen }) {
  const rel = useTransform(depth, (d) => d - index * STEP);
  const opacity = useTransform(rel, [-STEP * 9, -STEP * 4, -120, 220], [0, 1, 1, 0]);
  const angle = index * TURN;
  return (
    <motion.button
      className="nx-tunnel-photo"
      style={{
        opacity,
        transform: `translate(-50%, -50%) rotateZ(${angle}deg) translateY(${-radius}px) rotateZ(${-angle}deg) translateZ(${-index * STEP}px)`
      }}
      onClick={() => onOpen(index)}
      aria-label={`Open photo from ${item.title}`}
    >
      <img src={item.src} alt={item.title} loading="lazy" decoding="async" />
    </motion.button>
  );
}

export default function GalleryTunnel() {
  const ref = useRef(null);
  const [radius, setRadius] = useState(380);
  const [open, setOpen] = useState(null);
  const total = (TUNNEL_IMAGES.length - 1) * STEP + 400;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const depth = useTransform(scrollYProgress, [0.03, 0.97], [-STEP * 2, total]);
  const spin = useTransform(scrollYProgress, [0, 1], [0, -TUNNEL_IMAGES.length * TURN * 0.35]);
  const world = useMotionTemplate`translateZ(${depth}px) rotateZ(${spin}deg)`;
  const titleScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.6]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.18, 0.26], [1, 1, 0]);
  const outroOpacity = useTransform(scrollYProgress, [0.86, 0.96], [0, 1]);

  useEffect(() => {
    const calc = () => setRadius(Math.round(Math.min(window.innerWidth * 0.36, window.innerHeight * 0.42, 520)));
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  if (!TUNNEL_IMAGES.length) return null;

  return (
    <section id="nx-tunnel" ref={ref} className="nx-tunnel" data-shape="6" style={{ height: `${Math.max(320, TUNNEL_IMAGES.length * 22)}vh` }} aria-label="Event photo gallery">
      <div className="nx-sticky nx-tunnel-stage">
        <div className="nx-tunnel-viewport">
          <motion.div className="nx-tunnel-world" style={{ transform: world }}>
            {TUNNEL_IMAGES.map((item, i) => (
              <TunnelPhoto key={item.src} item={item} index={i} depth={depth} radius={radius} onOpen={setOpen} />
            ))}
          </motion.div>
        </div>
        <motion.div className="nx-tunnel-title" style={{ scale: titleScale, opacity: titleOpacity }}>
          <Eyebrow index={7}>Gallery</Eyebrow>
          <h2 className="nx-h2">Fall into <span className="nx-grad-text">the moments.</span></h2>
          <p className="nx-muted">{TUNNEL_IMAGES.length} photographs from workshops, hackathons and seminars.</p>
        </motion.div>
        <motion.p className="nx-tunnel-outro" style={{ opacity: outroOpacity }}>Tap any photograph to open it.</motion.p>
      </div>
      <Lightbox
        open={open !== null}
        onClose={() => setOpen(null)}
        images={TUNNEL_IMAGES.map((t) => t.src)}
        startIndex={open || 0}
        title={open !== null ? TUNNEL_IMAGES[open]?.title : ''}
      />
    </section>
  );
}
