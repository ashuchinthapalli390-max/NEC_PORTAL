import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useVelocity, useSpring } from 'framer-motion';
import { Quote, RotateCw } from 'lucide-react';
import { Eyebrow, SafeImg } from '../primitives.jsx';
import { LEADERS } from '../experienceData.js';

function LeaderCard({ leader, index }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="nx-leader-slot">
      <button
        className={`nx-leader ${flipped ? 'is-flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        aria-label={`${leader.name}, ${leader.role}. ${flipped ? 'Show portrait' : 'Read message'}`}
      >
        <div className="nx-leader-face nx-leader-front">
          <SafeImg src={leader.photo} fallback={leader.altPhoto} alt={leader.name} />
          <div className="nx-leader-meta">
            <span className="nx-leader-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="nx-leader-role">{leader.role}</span>
            <strong>{leader.name}</strong>
            <em><RotateCw size={12} /> Tap to read message</em>
          </div>
        </div>
        <div className="nx-leader-face nx-leader-back">
          <Quote size={28} className="nx-leader-quote" />
          <p className="nx-leader-message">{leader.message}</p>
          <p className="nx-leader-summary">{leader.summary}</p>
          <div className="nx-leader-sign">
            <strong>{leader.name}</strong>
            <span>{leader.designation}</span>
            {leader.qualification && <span>{leader.qualification}</span>}
          </div>
        </div>
      </button>
    </div>
  );
}

export default function LeadershipSection() {
  const ref = useRef(null);
  const trackRef = useRef(null);
  const [distance, setDistance] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      setDistance(Math.max(0, track.scrollWidth - window.innerWidth + 48));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0.08, 0.95], [0, -distance]);
  const velocity = useVelocity(scrollYProgress);
  const skew = useSpring(useTransform(velocity, [-1, 0, 1], [6, 0, -6]), { stiffness: 200, damping: 40 });
  const headingX = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);

  return (
    <section id="nx-leadership" ref={ref} className="nx-hscroll" data-shape="5" style={{ height: `${Math.max(260, LEADERS.length * 55)}vh` }} aria-label="Leadership">
      <div className="nx-sticky nx-hscroll-stage">
        <motion.div className="nx-ghost-word" style={{ x: headingX }} aria-hidden="true">LEADERSHIP · VISION · LEADERSHIP</motion.div>
        <div className="nx-container nx-hscroll-head">
          <Eyebrow index={3}>Leadership</Eyebrow>
          <h2 className="nx-h2">The people <span className="nx-grad-text">behind the vision.</span></h2>
        </div>
        <motion.div ref={trackRef} className="nx-hscroll-track" style={{ x, skewX: skew }}>
          {LEADERS.map((l, i) => (
            <LeaderCard key={l.id} leader={l} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
