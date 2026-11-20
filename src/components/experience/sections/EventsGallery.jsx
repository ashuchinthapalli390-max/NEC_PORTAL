import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';
import { Images } from 'lucide-react';
import { Eyebrow, Lightbox, SafeImg } from '../primitives.jsx';
import { EVENTS } from '../experienceData.js';

const CARD_W = 340;
const GAP = 40;

function EventCard({ event, index, trackX, viewport, onOpen }) {
  // rotate each card based on its distance from the viewport centre → coverflow
  const center = index * (CARD_W + GAP) + CARD_W / 2;
  const rotateY = useTransform(trackX, (x) => {
    const offset = (center + x + 48 - viewport / 2) / viewport;
    return Math.max(-55, Math.min(55, -offset * 70));
  });
  const z = useTransform(trackX, (x) => {
    const offset = Math.abs((center + x + 48 - viewport / 2) / viewport);
    return -Math.min(offset, 1) * 260;
  });
  const transform = useMotionTemplate`translateZ(${z}px) rotateY(${rotateY}deg)`;

  return (
    <motion.button className="nx-event" style={{ transform, width: CARD_W }} onClick={() => onOpen(event)} aria-label={`Open ${event.title} gallery`}>
      <div className="nx-event-img">
        <SafeImg src={event.cover} alt={event.title} />
      </div>
      <div className="nx-event-meta">
        <span className="nx-event-code">{event.year} · {event.code}</span>
        <strong>{event.title}</strong>
        <span className="nx-event-count"><Images size={13} /> {event.images.length} photos</span>
      </div>
    </motion.button>
  );
}

export default function EventsGallery() {
  const ref = useRef(null);
  const trackRef = useRef(null);
  const [distance, setDistance] = useState(0);
  const [viewport, setViewport] = useState(1200);
  const [open, setOpen] = useState(null);

  useLayoutEffect(() => {
    const measure = () => {
      setViewport(window.innerWidth);
      const track = trackRef.current;
      if (track) setDistance(Math.max(0, track.scrollWidth - window.innerWidth / 2 - CARD_W / 2 - 48));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const startX = viewport / 2 - CARD_W / 2 - 48;
  const x = useTransform(scrollYProgress, [0.05, 0.95], [startX, startX - distance]);
  const countOpacity = useTransform(scrollYProgress, [0, 0.08], [0, 1]);

  return (
    <section id="nx-events" ref={ref} className="nx-hscroll nx-events" data-shape="4" style={{ height: `${Math.max(300, EVENTS.length * 34)}vh` }} aria-label="Events and workshops">
      <div className="nx-sticky nx-hscroll-stage">
        <div className="nx-container nx-hscroll-head">
          <Eyebrow index={6}>Events · Workshops · FDPs</Eyebrow>
          <h2 className="nx-h2">Where ideas <span className="nx-grad-text">come alive.</span></h2>
          <motion.p className="nx-muted" style={{ opacity: countOpacity }}>{EVENTS.length} verified event galleries — tap any poster to step inside.</motion.p>
        </div>
        <div className="nx-coverflow">
          <motion.div ref={trackRef} className="nx-coverflow-track" style={{ x, gap: GAP }}>
            {EVENTS.map((e, i) => (
              <EventCard key={e.id} event={e} index={i} trackX={x} viewport={viewport} onOpen={setOpen} />
            ))}
          </motion.div>
        </div>
      </div>
      <Lightbox open={!!open} onClose={() => setOpen(null)} images={open?.images || []} title={open?.title} caption={open ? `${open.year} · ${open.code}` : ''} />
    </section>
  );
}
