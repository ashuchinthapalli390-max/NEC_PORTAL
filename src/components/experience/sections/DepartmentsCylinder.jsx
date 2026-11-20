import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent, useMotionTemplate } from 'framer-motion';
import { X, FlaskConical, Target, Compass, Users, CalendarDays, GraduationCap, ArrowRight } from 'lucide-react';
import { Eyebrow } from '../primitives.jsx';
import { DEPARTMENTS, PUBLIC_FACULTY } from '../experienceData.js';

const norm = (s) => String(s || '').toUpperCase().replace(/[\s()&]/g, '');

function facultyForDepartment(dept, list) {
  const code = norm(dept.code);
  return list.filter((f) => {
    const d = norm(f.department);
    if (code === 'BSH') return d.startsWith('BSH') || d === 'PHYSICALEDUCATION';
    return d === code;
  });
}

const ACCENTS = ['#E9B44C', '#5CC8E6', '#F6D58E', '#8FD3C1', '#E58A4E'];

export function DepartmentPanel({ dept, onClose, onViewDirectory }) {
  const faculty = useMemo(() => (dept ? facultyForDepartment(dept, PUBLIC_FACULTY) : []), [dept]);

  useEffect(() => {
    if (!dept) return undefined;
    document.documentElement.classList.add('nx-locked');
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.classList.remove('nx-locked');
      window.removeEventListener('keydown', onKey);
    };
  }, [dept, onClose]);

  return (
    <AnimatePresence>
      {dept && (
        <motion.div className="nx-drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.aside
            className="nx-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={dept.name}
            initial={{ x: '100%', rotateY: -25 }}
            animate={{ x: '0%', rotateY: 0 }}
            exit={{ x: '100%', rotateY: -15 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent
          >
            <button className="nx-drawer-close" onClick={onClose} aria-label="Close department"><X size={20} /></button>
            <span className="nx-chip">{dept.code}</span>
            <h3 className="nx-drawer-title">{dept.name}</h3>
            <p className="nx-muted">{dept.description}</p>

            <div className="nx-drawer-facts">
              <div><GraduationCap size={16} /><span>HOD</span><strong>{dept.hodName}</strong><em>{dept.hodQualification}</em></div>
              <div><CalendarDays size={16} /><span>Established</span><strong>{dept.established}</strong></div>
              <div><Users size={16} /><span>Intake</span><strong>{dept.intake}</strong></div>
              <div><Users size={16} /><span>Faculty</span><strong>{dept.facultyCount}</strong></div>
            </div>

            <div className="nx-drawer-block"><h4><Compass size={15} /> Vision</h4><p>{dept.vision}</p></div>
            <div className="nx-drawer-block"><h4><Target size={15} /> Mission</h4><p>{dept.mission}</p></div>

            <div className="nx-drawer-block">
              <h4><GraduationCap size={15} /> Programmes</h4>
              <ul className="nx-list">{dept.programs.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
            <div className="nx-drawer-block">
              <h4><FlaskConical size={15} /> Laboratories</h4>
              <div className="nx-chip-row">{dept.labs.map((l) => <span className="nx-chip nx-chip-soft" key={l}>{l}</span>)}</div>
            </div>
            <div className="nx-drawer-block">
              <h4>Highlights</h4>
              <ul className="nx-list">{dept.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
            </div>
            <div className="nx-drawer-block">
              <h4>BoS Regulations</h4>
              <div className="nx-chip-row">{dept.bosRegulations.map((r) => <span className="nx-chip" key={r}>{r}</span>)}</div>
            </div>

            <div className="nx-drawer-block">
              <h4><Users size={15} /> Faculty ({faculty.length})</h4>
              {faculty.length === 0 ? (
                <p className="nx-muted">This department’s roster is listed in the faculty directory further down the page.</p>
              ) : (
                <>
                  <div className="nx-mini-faculty">
                    {faculty.slice(0, 12).map((f) => (
                      <div key={f.id} className="nx-mini-row">
                        <strong>{f.name}</strong>
                        <span>{f.designation}</span>
                      </div>
                    ))}
                  </div>
                  <button className="nx-cta nx-cta-ghost nx-drawer-cta" onClick={() => onViewDirectory(faculty[0].department)}>
                    View all {faculty.length} in the directory <ArrowRight size={15} />
                  </button>
                </>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function DepartmentsCylinder({ onOpenDepartment }) {
  const ref = useRef(null);
  const [front, setFront] = useState(0);
  const [radius, setRadius] = useState(560);
  const n = DEPARTMENTS.length;
  const step = 360 / n;

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      const card = w < 640 ? 210 : w < 1024 ? 250 : 280;
      setRadius(Math.round((card + 24) / (2 * Math.tan(Math.PI / n))));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [n]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const rotation = useTransform(scrollYProgress, [0.06, 0.94], [0, -step * (n - 1)]);
  const tilt = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [24, 8, 8, -10]);
  const ringTransform = useMotionTemplate`translateZ(${-radius}px) rotateX(${tilt}deg) rotateY(${rotation}deg)`;

  useMotionValueEvent(rotation, 'change', (r) => {
    const idx = ((Math.round(-r / step) % n) + n) % n;
    setFront((p) => (p === idx ? p : idx));
  });

  const current = DEPARTMENTS[front];

  return (
    <section id="nx-departments" ref={ref} className="nx-cyl" data-shape="3" style={{ height: `${n * 32 + 100}vh` }} aria-label="Academic departments">
      <div className="nx-sticky nx-cyl-stage">
        <div className="nx-container nx-cyl-head">
          <Eyebrow index={5}>{n} Departments</Eyebrow>
          <h2 className="nx-h2">Spin through <span className="nx-grad-text">every discipline.</span></h2>
        </div>

        <div className="nx-cyl-viewport">
          <motion.div className="nx-cyl-ring" style={{ transform: ringTransform }}>
            {DEPARTMENTS.map((d, i) => (
              <button
                key={d.id}
                className={`nx-cyl-card ${i === front ? 'is-front' : ''}`}
                style={{ transform: `rotateY(${i * step}deg) translateZ(${radius}px)`, '--accent': ACCENTS[i % ACCENTS.length] }}
                onClick={() => onOpenDepartment(d)}
                aria-label={`Open ${d.name}`}
                tabIndex={0}
              >
                <span className="nx-cyl-code">{d.code}</span>
                <strong>{d.name}</strong>
                <span className="nx-cyl-meta">Since {d.established} · {d.facultyCount} faculty</span>
                <span className="nx-cyl-open">Explore <ArrowRight size={14} /></span>
              </button>
            ))}
          </motion.div>
        </div>

        <div className="nx-container nx-cyl-detail">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="nx-cyl-detail-inner"
            >
              <div>
                <span className="nx-muted">HOD · {current.hodName}</span>
                <p>{current.description}</p>
              </div>
              <button className="nx-cta" onClick={() => onOpenDepartment(current)}>
                Open {current.code} <ArrowRight size={16} />
              </button>
            </motion.div>
          </AnimatePresence>
          <div className="nx-cyl-dots" aria-hidden="true">
            {DEPARTMENTS.map((d, i) => <i key={d.id} className={i === front ? 'is-on' : ''} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
