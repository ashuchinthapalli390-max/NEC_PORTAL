import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, GraduationCap } from 'lucide-react';
import { Eyebrow, SplitHeading, TiltCard, Depth } from '../primitives.jsx';
import { PUBLIC_FACULTY } from '../experienceData.js';

const PAGE = 24;

const initials = (name) =>
  String(name || '')
    .replace(/^(Dr|Mr|Mrs|Ms|Prof|Sri|Smt)\.?\s+/i, '')
    .split(/[\s.]+/)
    .filter((p) => p.length > 1)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

/**
 * Public faculty directory — name, designation, department and qualification only.
 * `focus` lets search / department panels pre-filter the list: { query?, dept?, nonce }.
 */
export default function FacultyExplorer({ focus }) {
  const all = PUBLIC_FACULTY;
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('All');
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    if (!focus) return;
    setQuery(focus.query || '');
    setDept(focus.dept || 'All');
    setLimit(PAGE);
  }, [focus]);

  const departments = useMemo(() => {
    const counts = new Map();
    all.forEach((f) => counts.set(f.department, (counts.get(f.department) || 0) + 1));
    return [['All', all.length], ...[...counts.entries()].sort((a, b) => b[1] - a[1])];
  }, [all]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((f) => {
      if (dept !== 'All' && f.department !== dept) return false;
      if (!q) return true;
      return [f.name, f.designation, f.department, f.qualification].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [all, query, dept]);

  const changeQuery = (v) => {
    setQuery(v);
    setLimit(PAGE);
  };
  const changeDept = (d) => {
    setDept(d);
    setLimit(PAGE);
  };

  return (
    <section id="nx-faculty" className="nx-section nx-faculty" data-shape="4" aria-label="Faculty directory">
      <div className="nx-container">
        <Eyebrow index={11}>Faculty Directory</Eyebrow>
        <SplitHeading text="Meet the minds of NEC." className="nx-h2" gradientWords={[3, 4]} />

        <div className="nx-search-row">
          <label className="nx-search">
            <Search size={18} />
            <input value={query} onChange={(e) => changeQuery(e.target.value)} placeholder="Search by name, designation or department…" aria-label="Search faculty" />
            {query && <button onClick={() => changeQuery('')} aria-label="Clear search"><X size={16} /></button>}
          </label>
          <span className="nx-muted">{filtered.length} result{filtered.length === 1 ? '' : 's'}</span>
        </div>

        <div className="nx-chip-row nx-dept-filter" role="tablist" aria-label="Filter by department" data-lenis-prevent>
          {departments.map(([d, c]) => (
            <button key={d} role="tab" aria-selected={dept === d} className={`nx-chip ${dept === d ? 'is-on' : 'nx-chip-soft'}`} onClick={() => changeDept(d)}>
              {d} <em>{c}</em>
            </button>
          ))}
        </div>

        <Depth intensity={0.6}>
          <motion.div layout className="nx-faculty-grid">
            <AnimatePresence mode="popLayout">
              {filtered.slice(0, limit).map((f, i) => (
                <motion.div
                  key={f.id}
                  layout
                  initial={{ opacity: 0, y: 30, rotateX: 30 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: (i % PAGE) * 0.015 }}
                >
                  <TiltCard className="nx-fcard">
                    <span className="nx-avatar nx-avatar-initials" aria-hidden="true">{initials(f.name) || 'NEC'}</span>
                    <div className="nx-fcard-body">
                      <strong title={f.name}>{f.name}</strong>
                      <span>{f.designation}</span>
                      {f.qualification && <span className="nx-fcard-qual"><GraduationCap size={11} /> {f.qualification}</span>}
                      <em>{f.department}</em>
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </Depth>

        {filtered.length === 0 && <p className="nx-empty">No faculty match “{query}”. Try another name or department.</p>}

        {limit < filtered.length && (
          <div className="nx-center">
            <button className="nx-cta nx-cta-ghost" onClick={() => setLimit((l) => l + PAGE * 2)}>
              Show more ({filtered.length - limit} remaining)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
