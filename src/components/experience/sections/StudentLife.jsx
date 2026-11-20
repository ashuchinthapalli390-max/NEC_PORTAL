import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { Eyebrow, SplitHeading, LazyVideo } from '../primitives.jsx';
import { LIFE_STORIES, videoById } from '../experienceData.js';

function StoryCard({ story, index, total, active, progress }) {
  const video = videoById(story.video);
  // card recedes once the following cards start stacking over it
  const start = (index + 1) / total;
  const end = Math.min(1, start + 1 / total);
  const scale = useTransform(progress, [start - 0.02, 1], [1, 0.84 + index * 0.025]);
  const rotateX = useTransform(progress, [start - 0.02, end], [0, -6]);
  const filter = useTransform(progress, [start - 0.02, end], ['brightness(1)', 'brightness(0.45)']);

  return (
    <div className="nx-stack-wrap" style={{ zIndex: index + 1, paddingTop: `calc(12vh + ${index * 22}px)` }}>
      <motion.article className="nx-stack-card" style={{ scale, rotateX, filter, '--accent': story.accent }}>
        <LazyVideo src={video?.src} poster={video?.poster} playing={active === index} className="nx-stack-video" />
        <div className="nx-stack-shade" />
        <div className="nx-stack-copy">
          <span className="nx-stack-index">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
          <h3>{story.title}</h3>
          <p>{story.text}</p>
        </div>
      </motion.article>
    </div>
  );
}

export default function StudentLife() {
  const [active, setActive] = useState(0);
  const stackRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: stackRef, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const idx = Math.max(0, Math.min(LIFE_STORIES.length - 1, Math.floor(p * LIFE_STORIES.length)));
    setActive((prev) => (prev === idx ? prev : idx));
  });

  return (
    <section id="nx-life" className="nx-section nx-life" data-shape="5" aria-label="Student life">
      <div className="nx-container">
        <Eyebrow index={9}>Student Life</Eyebrow>
        <SplitHeading text="Beyond the classroom." className="nx-h2" gradientWords={[2]} />
        <p className="nx-muted nx-lede">NCC parades, floodlit courts, sports grounds and a campus that keeps moving long after the last lecture.</p>
      </div>
      <div ref={stackRef} className="nx-container nx-stack">
        {LIFE_STORIES.map((s, i) => (
          <StoryCard key={s.id} story={s} index={i} total={LIFE_STORIES.length} active={active} progress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}
