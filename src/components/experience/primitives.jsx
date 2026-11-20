import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Scroll-linked 3D entrance: content rises out of the floor (rotateX) and
 * settles flat as it reaches the upper third of the viewport, then tilts
 * away again as it leaves.
 */
export function Depth({ children, className = '', intensity = 1 }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rotateX = useTransform(scrollYProgress, [0, 0.35, 0.75, 1], [22 * intensity, 0, 0, -14 * intensity]);
  const scale = useTransform(scrollYProgress, [0, 0.35, 0.75, 1], [0.88, 1, 1, 0.94]);
  const z = useTransform(scrollYProgress, [0, 0.35, 0.75, 1], [-180 * intensity, 0, 0, -120 * intensity]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.85, 1], [0.25, 1, 1, 0.5]);
  return (
    <div ref={ref} className={`nx-depth ${className}`}>
      <motion.div className="nx-depth-inner" style={{ rotateX, scale, z, opacity, transformPerspective: 1400 }}>
        {children}
      </motion.div>
    </div>
  );
}

/** Section eyebrow: "03 — Campus" */
export function Eyebrow({ index, children }) {
  return (
    <div className="nx-eyebrow">
      {index != null && <span className="nx-eyebrow-index">{String(index).padStart(2, '0')}</span>}
      <span className="nx-eyebrow-line" />
      <span>{children}</span>
    </div>
  );
}

/** Headline whose words rise out of a mask in 3D as it enters the viewport. */
export function SplitHeading({ as: Tag = 'h2', text, className = '', delay = 0, gradientWords = [] }) {
  const words = String(text).split(' ');
  return (
    <Tag className={`nx-split ${className}`} aria-label={text}>
      {words.map((w, i) => (
        <span className="nx-split-mask" key={`${w}-${i}`} aria-hidden="true">
          <motion.span
            className={`nx-split-word ${gradientWords.includes(i) ? 'nx-grad-text' : ''}`}
            initial={{ y: '110%', rotateX: -70, opacity: 0 }}
            whileInView={{ y: '0%', rotateX: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: delay + i * 0.06 }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Fade + lift + slight 3D tilt on enter. */
export function Reveal({ children, delay = 0, y = 40, className = '', style, as = 'div' }) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      className={className}
      style={style}
      initial={{ opacity: 0, y, rotateX: 12, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </MotionTag>
  );
}

/** Pointer-driven 3D tilt card. */
export function TiltCard({ children, className = '', max = 10, onClick, style, as = 'div', ...rest }) {
  const ref = useRef(null);
  const Tag = as;
  const handleMove = (e) => {
    const el = ref.current;
    if (!el || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', `${(-py * max).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(px * max).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${((py + 0.5) * 100).toFixed(1)}%`);
  };
  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  return (
    <Tag ref={ref} className={`nx-tilt ${className}`} onPointerMove={handleMove} onPointerLeave={reset} onClick={onClick} style={style} {...rest}>
      {children}
      <span className="nx-tilt-glare" aria-hidden="true" />
    </Tag>
  );
}

/** Video that only loads + plays while on screen. */
export function LazyVideo({ src, poster, className = '', playing = true, muted = true, loop = true, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '200px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (visible && playing) {
      const p = el.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      el.pause();
    }
  }, [visible, playing]);

  return (
    <video
      ref={ref}
      className={className}
      poster={poster}
      muted={muted}
      loop={loop}
      playsInline
      preload="none"
      src={visible ? src : undefined}
      {...rest}
    />
  );
}

/** Fullscreen media lightbox for images or a single video. */
export function Lightbox({ open, onClose, images = [], startIndex = 0, video = null, title, caption }) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % Math.max(images.length, 1));
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1));
    };
    window.addEventListener('keydown', onKey);
    document.documentElement.classList.add('nx-locked');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('nx-locked');
    };
  }, [open, images.length, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="nx-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={title || 'Media viewer'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          data-lenis-prevent
        >
          <button className="nx-lightbox-close" onClick={onClose} aria-label="Close viewer">
            <X size={22} />
          </button>
          <motion.div
            className="nx-lightbox-stage"
            initial={{ scale: 0.86, rotateX: 18, opacity: 0 }}
            animate={{ scale: 1, rotateX: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {video ? (
              <video className="nx-lightbox-media" src={video} poster={images[0]} controls autoPlay playsInline />
            ) : (
              images[index] && <img key={images[index]} className="nx-lightbox-media" src={images[index]} alt={title || ''} />
            )}
            {(title || caption) && (
              <div className="nx-lightbox-caption">
                {title && <strong>{title}</strong>}
                {caption && <span>{caption}</span>}
                {!video && images.length > 1 && <span className="nx-lightbox-count">{index + 1} / {images.length}</span>}
              </div>
            )}
            {!video && images.length > 1 && (
              <>
                <button className="nx-lightbox-nav nx-prev" aria-label="Previous" onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}>
                  <ChevronLeft size={26} />
                </button>
                <button className="nx-lightbox-nav nx-next" aria-label="Next" onClick={() => setIndex((i) => (i + 1) % images.length)}>
                  <ChevronRight size={26} />
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Count-up number that runs once when visible. */
export function CountUp({ to = 0, duration = 1.8, suffix = '', className = '' }) {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started.current) return;
      started.current = true;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min((now - t0) / (duration * 1000), 1);
        const eased = 1 - Math.pow(1 - p, 4);
        setVal(Math.round(to * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {val.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}

/** Image with graceful fallback chain. */
export function SafeImg({ src, fallback, alt = '', ...rest }) {
  const [current, setCurrent] = useState(src);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setCurrent(src);
    setFailed(false);
  }, [src]);
  if (failed) return <span className="nx-img-fallback" aria-label={alt}>{(alt || 'NEC').split(' ').filter(Boolean).slice(-2).map((w) => w[0]).join('')}</span>;
  return (
    <img
      src={current}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (fallback && current !== fallback) setCurrent(fallback);
        else setFailed(true);
      }}
      {...rest}
    />
  );
}
