import { useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent, useMotionTemplate } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import { Eyebrow } from '../primitives.jsx';
import { PROGRAMME_LAYERS } from '../experienceData.js';

function Layer({ layer, index, total, gap, active }) {
  const z = useTransform(gap, (g) => index * g - ((total - 1) * g) / 2);
  const transform = useMotionTemplate`translate(-50%, -50%) translateZ(${z}px)`;
  return (
    <motion.div className="nx-layer-pos" style={{ transform }}>
      <div className={`nx-layer ${active ? 'is-active' : ''}`} style={{ '--accent': layer.accent }}>
        <div className="nx-layer-grid" aria-hidden="true" />
        <span className="nx-layer-index">{String(index + 1).padStart(2, '0')}</span>
        <strong>{layer.title}</strong>
        <em>{layer.kicker}</em>
        <div className="nx-layer-codes">
          {layer.depts.map((d) => <span key={d.id}>{d.code}</span>)}
        </div>
      </div>
    </motion.div>
  );
}

export default function ProgrammesStack() {
  const ref = useRef(null);
  const n = PROGRAMME_LAYERS.length;
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  // the stack starts closed like a book, explodes apart, then the camera swings round
  const gap = useTransform(scrollYProgress, [0.02, 0.3], [14, 98]);
  const rotX = useTransform(scrollYProgress, [0, 0.3, 1], [64, 56, 48]);
  const rotZ = useTransform(scrollYProgress, [0, 1], [-42, -22]);
  const lift = useTransform(scrollYProgress, [0, 0.3], [80, 0]);
  const stack = useMotionTemplate`translateY(${lift}px) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`;

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const t = Math.max(0, Math.min(0.999, (p - 0.28) / 0.68));
    const idx = Math.floor(t * n);
    setActive((prev) => (prev === idx ? prev : idx));
  });

  const layer = PROGRAMME_LAYERS[active];

  return (
    <section id="nx-programmes" ref={ref} className="nx-prog" data-shape="4" style={{ height: `${n * 70 + 120}vh` }} aria-label="Academic programmes">
      <div className="nx-sticky nx-prog-stage">
        <div className="nx-container nx-prog-grid">
          <div className="nx-prog-copy">
            <Eyebrow index={4}>Programmes</Eyebrow>
            <h2 className="nx-h2">Five layers of <span className="nx-grad-text">learning.</span></h2>
            <AnimatePresence mode="wait">
              <motion.div
                key={layer.id}
                className="nx-prog-detail"
                style={{ '--accent': layer.accent }}
                initial={{ opacity: 0, x: -30, rotateY: 20 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="nx-prog-kicker">{String(active + 1).padStart(2, '0')} · {layer.kicker}</span>
                <h3>{layer.title}</h3>
                <ul>
                  {layer.depts.flatMap((d) => d.programs.map((p) => (
                    <li key={`${d.id}-${p}`}><GraduationCap size={14} /> {p}</li>
                  )))}
                </ul>
              </motion.div>
            </AnimatePresence>
            <div className="nx-prog-dots" aria-hidden="true">
              {PROGRAMME_LAYERS.map((l, i) => <i key={l.id} className={i === active ? 'is-on' : ''} style={{ '--accent': l.accent }} />)}
            </div>
          </div>

          <div className="nx-prog-viewport">
            <motion.div className="nx-prog-stack" style={{ transform: stack }}>
              {PROGRAMME_LAYERS.map((l, i) => (
                <Layer key={l.id} layer={l} index={i} total={n} gap={gap} active={i === active} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
