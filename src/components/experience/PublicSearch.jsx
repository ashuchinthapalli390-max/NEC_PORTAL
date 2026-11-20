import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CornerDownLeft, Compass, Building2, Users, UserRound, CalendarDays, Film } from 'lucide-react';
import { CHAPTERS, DEPARTMENTS, LEADERS, PUBLIC_FACULTY, EVENTS, VIDEOS } from './experienceData.js';

/**
 * Search palette for the public site. Indexes only public, static content:
 * chapters, departments, leadership, the faculty directory, events and films.
 */
const GROUPS = [
  { key: 'chapter', label: 'Sections', icon: Compass },
  { key: 'department', label: 'Departments', icon: Building2 },
  { key: 'leader', label: 'Leadership', icon: UserRound },
  { key: 'faculty', label: 'Faculty directory', icon: Users },
  { key: 'event', label: 'Events', icon: CalendarDays },
  { key: 'film', label: 'Campus films', icon: Film }
];

function buildIndex() {
  return [
    ...CHAPTERS.map((c) => ({ type: 'chapter', id: c.id, title: c.label, sub: 'Jump to section', hay: c.label })),
    ...DEPARTMENTS.map((d) => ({ type: 'department', id: d.id, title: d.name, sub: `${d.code} · HOD ${d.hodName}`, hay: `${d.name} ${d.code} ${d.hodName}`, payload: d })),
    ...LEADERS.map((l) => ({ type: 'leader', id: l.id, title: l.name, sub: l.role, hay: `${l.name} ${l.role} ${l.designation}` })),
    ...PUBLIC_FACULTY.map((f) => ({ type: 'faculty', id: f.id, title: f.name, sub: `${f.designation} · ${f.department}`, hay: `${f.name} ${f.designation} ${f.department}`, payload: f })),
    ...EVENTS.map((e) => ({ type: 'event', id: e.id, title: e.title, sub: e.year, hay: e.title })),
    ...VIDEOS.map((v) => ({ type: 'film', id: v.id, title: v.title, sub: v.category, hay: `${v.title} ${v.category}` }))
  ];
}

export default function PublicSearch({ open, onClose, onSelect }) {
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const index = useMemo(buildIndex, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return index.filter((r) => r.type === 'chapter');
    const words = term.split(/\s+/);
    const out = [];
    for (const g of GROUPS) {
      const hits = index.filter((r) => r.type === g.key && words.every((w) => r.hay.toLowerCase().includes(w)));
      out.push(...hits.slice(0, g.key === 'faculty' ? 6 : 4));
    }
    return out;
  }, [q, index]);

  useEffect(() => {
    if (!open) return undefined;
    setQ('');
    setCursor(0);
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  const choose = (r) => {
    if (!r) return;
    onSelect(r);
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(results.length - 1, c + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === 'Enter') choose(results[cursor]);
  };

  let flat = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="nx-search-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="nx-palette"
            role="dialog"
            aria-modal="true"
            aria-label="Search the site"
            initial={{ y: -30, rotateX: 20, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, rotateX: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent
          >
            <label className="nx-palette-input">
              <Search size={18} />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setCursor(0); }}
                onKeyDown={onKeyDown}
                placeholder="Search departments, faculty, events, films…"
                aria-label="Search"
              />
              <kbd>Esc</kbd>
            </label>
            <div className="nx-palette-results">
              {results.length === 0 && <p className="nx-empty">Nothing found for “{q}”.</p>}
              {GROUPS.map((g) => {
                const items = results.filter((r) => r.type === g.key);
                if (!items.length) return null;
                return (
                  <div key={g.key} className="nx-palette-group">
                    <span className="nx-palette-label"><g.icon size={13} /> {g.label}</span>
                    {items.map((r) => {
                      flat += 1;
                      const i = flat;
                      return (
                        <button
                          key={`${r.type}-${r.id}`}
                          className={`nx-palette-item ${i === cursor ? 'is-on' : ''}`}
                          onMouseEnter={() => setCursor(i)}
                          onClick={() => choose(r)}
                        >
                          <span><strong>{r.title}</strong><em>{r.sub}</em></span>
                          <CornerDownLeft size={14} />
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
