import { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Play, Clock } from 'lucide-react';
import { Eyebrow, SplitHeading, LazyVideo, Lightbox } from '../primitives.jsx';
import { VIDEOS } from '../experienceData.js';

function VideoTile({ video, index, onOpen, featured }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.button
      className={`nx-vtile ${featured ? 'is-featured' : ''}`}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      onClick={() => onOpen(video)}
      initial={{ opacity: 0, y: 60, rotateX: 25 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay: (index % 4) * 0.07, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`Play ${video.title}`}
    >
      <LazyVideo src={video.src} poster={video.poster} playing={featured || hover} className="nx-vtile-video" />
      <div className="nx-vtile-shade" />
      <div className="nx-vtile-meta">
        <span className="nx-chip nx-chip-soft">{video.category}</span>
        <strong>{video.title}</strong>
        <span className="nx-vtile-dur"><Clock size={12} /> {video.duration}</span>
      </div>
      <span className="nx-vtile-play"><Play size={18} fill="currentColor" /></span>
    </motion.button>
  );
}

export default function CinemaWall() {
  const ref = useRef(null);
  const [open, setOpen] = useState(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [38, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.82, 1]);

  return (
    <section id="nx-cinema" ref={ref} className="nx-section nx-cinema" data-shape="2" aria-label="Campus films">
      <div className="nx-container">
        <Eyebrow index={8}>Cinema · {VIDEOS.length} films</Eyebrow>
        <SplitHeading text="The campus, in motion." className="nx-h2" gradientWords={[2, 3]} />
        <p className="nx-muted nx-lede">Drone flights, sports nights, NCC parades and walkways at dusk. Hover to preview, tap to watch with sound.</p>
      </div>
      <motion.div className="nx-vgrid-scene" style={{ rotateX, scale }}>
        <div className="nx-vgrid">
          {VIDEOS.map((v, i) => (
            <VideoTile key={v.id} video={v} index={i} onOpen={setOpen} featured={i === 0} />
          ))}
        </div>
      </motion.div>
      <Lightbox open={!!open} onClose={() => setOpen(null)} video={open?.src} images={open ? [open.poster] : []} title={open?.title} caption={open?.description} />
    </section>
  );
}
