/**
 * Curated asset + content map for the 3D public experience.
 * Everything here is assembled from the existing verified registries so the
 * public site keeps a single source of truth for media and institutional data.
 */
import {
  COLLEGE_INFO,
  LEADERSHIP_PROFILES,
  DEPARTMENTS,
  GOVERNING_BODY,
  ACADEMIC_COUNCIL,
  AICTE_IDEA_LAB_TEAM,
  BRANDING_LOGOS,
  CAMPUS_VIDEOS,
  FACULTY_DATA as MASTER_FACULTY
} from '../../data/masterData.js';
import { VERIFIED_MEDIA } from '../../config/verifiedMedia.js';
import { VERIFIED_EVENT_MEDIA_REGISTRY } from '../../data/verified-event-media.js';

export const OPT = '/assets/optimized';

/** Encode paths that contain spaces / ampersands for safe use in src + CSS url(). */
export const asset = (p) => {
  if (!p) return p;
  try {
    return encodeURI(p);
  } catch {
    return p;
  }
};

export { COLLEGE_INFO, LEADERSHIP_PROFILES, DEPARTMENTS, GOVERNING_BODY, ACADEMIC_COUNCIL, AICTE_IDEA_LAB_TEAM, BRANDING_LOGOS };

/* ------------------------------------------------------------------ */
/* Chapters — drive the nav, the chapter rail and particle morphing.   */
/* shape index → ParticleUniverse SHAPES                               */
/* ------------------------------------------------------------------ */
export const CHAPTERS = [
  { id: 'nx-hero', label: 'Enter', shape: 0 },
  { id: 'nx-legacy', label: 'Legacy', shape: 1 },
  { id: 'nx-campus', label: 'Campus', shape: 2 },
  { id: 'nx-leadership', label: 'Leadership', shape: 5 },
  { id: 'nx-programmes', label: 'Programmes', shape: 4 },
  { id: 'nx-departments', label: 'Departments', shape: 3 },
  { id: 'nx-events', label: 'Events', shape: 0 },
  { id: 'nx-tunnel', label: 'Gallery', shape: 6 },
  { id: 'nx-cinema', label: 'Cinema', shape: 2 },
  { id: 'nx-life', label: 'Student Life', shape: 5 },
  { id: 'nx-placements', label: 'Placements', shape: 3 },
  { id: 'nx-faculty', label: 'Faculty', shape: 4 },
  { id: 'nx-governance', label: 'Governance', shape: 1 },
  { id: 'nx-contact', label: 'Visit', shape: 6 }
];

/* ------------------------------------------------------------------ */
/* Campus fly-through — every building + night photograph               */
/* ------------------------------------------------------------------ */
export const CAMPUS_STOPS = [
  { src: `${OPT}/entrance.webp`, title: 'The Grand Entrance', kicker: 'Kotappakonda Road', text: 'Where thousands of scholars begin each day on a 40+ acre Wi-Fi enabled campus.' },
  { src: `${OPT}/main-building.webp`, title: 'Main Academic Block', kicker: 'Academic Core', text: 'Smart lecture halls, departmental wings and research labs under one iconic roof.' },
  { src: `${OPT}/atrium.webp`, title: 'The Atrium', kicker: 'Inside the Block', text: 'A multi-level central atrium connecting classrooms, studios and collaborative spaces.' },
  { src: `${OPT}/admin-block.webp`, title: 'Administrative Block', kicker: 'Governance HQ', text: 'Principal’s secretariat, deaneries and the autonomous examination cell.' },
  { src: `${OPT}/walkway.webp`, title: 'Green Corridors', kicker: 'Walkways', text: 'Tree-shaded pathways linking every engineering department.' },
  { src: `${OPT}/area-view.webp`, title: 'Campus From Above', kicker: 'Aerial', text: 'Sprawling greenery, sports arenas and academic blocks across the campus.' },
  { src: `${OPT}/walkway-night.webp`, title: 'Walkway After Dark', kicker: 'Night', text: 'An illuminated campus that stays safe, alive and beautiful at night.' },
  { src: `${OPT}/night-view.webp`, title: 'NEC at Night', kicker: 'Illumination', text: 'The whole campus glowing under the Palnadu sky.' }
];

/* ------------------------------------------------------------------ */
/* Videos — all 14 campus films                                        */
/* ------------------------------------------------------------------ */
const VIDEO_POSTERS = {
  'vid-1': `${OPT}/area-view.webp`,
  'vid-2': `${OPT}/admin-block.webp`,
  'vid-3': `${OPT}/main-building.webp`,
  'vid-4': `${OPT}/atrium.webp`,
  'vid-5': `${OPT}/walkway.webp`,
  'vid-6': `${OPT}/walkway.webp`,
  'vid-7': `${OPT}/area-view.webp`,
  'vid-8': `${OPT}/entrance.webp`,
  'vid-9': `${OPT}/main-building.webp`,
  'vid-10': `${OPT}/entrance.webp`,
  'vid-11': `${OPT}/walkway.webp`,
  'vid-12': `${OPT}/night-view.webp`,
  'vid-13': `${OPT}/entrance.webp`,
  'vid-14': BRANDING_LOGOS.collegeLogoBg
};

export const VIDEOS = CAMPUS_VIDEOS.map((v) => ({
  ...v,
  src: asset(v.file),
  poster: asset(VIDEO_POSTERS[v.id] || `${OPT}/main-building.webp`)
}));

export const videoById = (id) => VIDEOS.find((v) => v.id === id);

export const HERO_VIDEO = asset('/assets/NEC Videos/Aerial View Of campus_.mp4');
export const LOGO_VIDEO = asset('/assets/NEC Videos/NEC Logo video.mp4');

/* ------------------------------------------------------------------ */
/* Accreditation + recognition logos                                   */
/* ------------------------------------------------------------------ */
export const ACCREDITATIONS = [
  { src: asset(BRANDING_LOGOS.naac), label: 'NAAC', note: '“A+” Grade · Cycle 2' },
  { src: asset(BRANDING_LOGOS.nba), label: 'NBA', note: 'Accredited Programmes' },
  { src: asset(BRANDING_LOGOS.aicte), label: 'AICTE', note: 'Approved Institution' },
  { src: asset(BRANDING_LOGOS.nirf), label: 'NIRF', note: 'Ranked Participant' },
  { src: asset(BRANDING_LOGOS.aishe), label: 'AISHE', note: 'Registered' },
  { src: asset(BRANDING_LOGOS.iic), label: 'IIC', note: 'Institution’s Innovation Council' },
  { src: `${OPT}/rd-logo.webp`, label: 'R&D Cell', note: 'Research & Development' },
  { src: asset(BRANDING_LOGOS.nba2), label: 'NBA', note: 'Tier-I Programmes' },
  { src: asset('/assets/NEC Logos/AISHE Logo 2.png'), label: 'AISHE', note: 'Higher Education Survey' },
  { src: `${OPT}/iic-logo.webp`, label: 'IIC', note: 'MoE Innovation Cell' }
];

export const RANKINGS = [
  { src: VERIFIED_MEDIA.homepage.indiaTodayRanking.src, alt: VERIFIED_MEDIA.homepage.indiaTodayRanking.alt, label: 'India Today 2026' },
  { src: VERIFIED_MEDIA.homepage.timesRanking.src, alt: VERIFIED_MEDIA.homepage.timesRanking.alt, label: 'Times Engineering 2026' }
];

export const ACCREDITATION_BADGES = VERIFIED_MEDIA.branding.accreditationBadges;
export const MAIN_LOGO = VERIFIED_MEDIA.branding.mainLogo.src;
export const FULL_NAME_LOGO = `${OPT}/college-full-name.webp`;
export const CREST = asset(BRANDING_LOGOS.collegeLogo);
export const CREST_ALT = asset(BRANDING_LOGOS.collegeLogo2);
export const CALL_ICON = VERIFIED_MEDIA.ui.callAdmissionsIcon.src;
export const STUDENTS_IMG = VERIFIED_MEDIA.homepage.aboutUsStudents.src;
export const STUDENT_FEATURE_IMG = VERIFIED_MEDIA.homepage.studentFeature.src;

/* ------------------------------------------------------------------ */
/* Leadership — merges profiles with the best available portraits      */
/* ------------------------------------------------------------------ */
const PORTRAIT_OVERRIDES = {
  'Vice Chairman': `${OPT}/vice-chairman-hd.webp`
};
const ALT_PORTRAITS = {
  Chairman: asset('/assets/NEC Faculty/Chairman.jpg'),
  'Vice Chairman': `${OPT}/vice-chairman-portrait.webp`,
  Secretary: asset('/assets/NEC Faculty/Secretary.jpg'),
  Director: `${OPT}/director-portrait.webp`,
  Principal: asset('/assets/NEC Faculty/Principal.jpeg'),
  'Vice Principal': asset('/assets/NEC Faculty/Vice Principal.png'),
  'Dean R&D': asset('/assets/NEC Faculty/Dean R&D.jpg')
};

export const LEADERS = LEADERSHIP_PROFILES.map((p) => ({
  ...p,
  photo: asset(PORTRAIT_OVERRIDES[p.role] || p.photo),
  altPhoto: ALT_PORTRAITS[p.role] || null
}));

/* ------------------------------------------------------------------ */
/* Events — 2026-27 verified registry + legacy NRTEC event sets         */
/* ------------------------------------------------------------------ */
const prettify = (slug) => slug.split('-').map((w) => (w.length <= 3 && w !== 'ai' ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1))).join(' ').replace(/\bAi\b/g, 'AI');

const registryEvents = Object.values(VERIFIED_EVENT_MEDIA_REGISTRY || {}).map((e) => {
  const gallery = (e.gallery || []).map((g) => g.src);
  const cover = e.poster?.src || gallery[0];
  return {
    id: e.slug,
    title: e.eventTitle || prettify(e.slug),
    code: 'Campus Event',
    cover,
    images: [e.poster?.src, ...gallery].filter(Boolean),
    year: '2026-27'
  };
}).filter((e) => e.cover);

const legacy = VERIFIED_MEDIA.events;
const legacyEvents = [
  {
    id: 'robotics-ai-workshop',
    title: legacy.roboticsAiWorkshop.title,
    code: 'Workshop',
    cover: legacy.roboticsAiWorkshop.poster.src,
    images: [legacy.roboticsAiWorkshop.poster.src, ...legacy.roboticsAiWorkshop.sessions.map((s) => s.src)],
    year: 'Archive'
  },
  {
    id: 'quantum-fdp',
    title: legacy.quantumComputingFdp.title,
    code: 'FDP',
    cover: legacy.quantumComputingFdp.poster.src,
    images: [legacy.quantumComputingFdp.poster.src, legacy.quantumComputingFdp.session.src],
    year: 'Archive'
  },
  {
    id: 'mech-industrial-visit',
    title: legacy.mechanicalIndustrialVisit.title,
    code: 'Industrial Visit',
    cover: legacy.mechanicalIndustrialVisit.cover.src,
    images: [legacy.mechanicalIndustrialVisit.cover.src, legacy.mechanicalIndustrialVisit.machinery.src],
    year: 'Archive'
  }
];

export const EVENTS = [...registryEvents, ...legacyEvents];

/* ------------------------------------------------------------------ */
/* Placements posters                                                  */
/* ------------------------------------------------------------------ */
export const PLACEMENT_POSTERS = [
  { src: VERIFIED_MEDIA.placements.savantisVertical.src, alt: VERIFIED_MEDIA.placements.savantisVertical.alt, title: 'Savantis Solutions', stat: '117', statLabel: 'students selected' },
  { src: VERIFIED_MEDIA.placements.lsAutomotiveVertical.src, alt: VERIFIED_MEDIA.placements.lsAutomotiveVertical.alt, title: 'LS Automotive, Chennai', stat: '35', statLabel: 'students selected' },
  { src: `${OPT}/ls-automotive-group.webp`, alt: VERIFIED_MEDIA.placements.lsAutomotiveGroup.alt, title: 'Selected Batch', stat: '35', statLabel: 'LS Automotive offers' }
];

/* ------------------------------------------------------------------ */
/* Board of Studies documents                                          */
/* ------------------------------------------------------------------ */
export const BOS_DOCUMENTS = [
  { title: '1st BoS — CSE (Cyber Security), R23', date: '26 Sep 2023', href: '/documents/bos/cse-cys/01_R23_1st_BoS_CYS_2023-09-26.pdf' },
  { title: '2nd BoS — CSE (Cyber Security), R23', date: '09 Jul 2024', href: '/documents/bos/cse-cys/02_R23_2nd_BoS_CYS_2024-07-09.pdf' },
  { title: '3rd BoS — CSE (Cyber Security), R23', date: '12 Jul 2025', href: '/documents/bos/cse-cys/03_R23_3rd_BoS_CYS_2025-07-12.pdf' },
  { title: '4th BoS — CSE (Cyber Security), R23', date: '21 Feb 2026', href: '/documents/bos/cse-cys/04_R23_4th_BoS_CYS_2026-02-21.pdf' }
];

/* ------------------------------------------------------------------ */
/* Student life chapters                                               */
/* ------------------------------------------------------------------ */
export const LIFE_STORIES = [
  { id: 'ncc', title: 'NCC & Culture', text: 'Disciplined cadet drills by day, colourful festival stages by night.', video: 'vid-9', accent: '#E9B44C' },
  { id: 'sports', title: 'Sports Complex', text: 'Cricket grounds, athletics tracks and intramural arenas that build champions.', video: 'vid-7', accent: '#5CC8E6' },
  { id: 'basketball', title: 'Floodlit Courts', text: 'High-energy basketball under the lights, all year round.', video: 'vid-8', accent: '#E58A4E' },
  { id: 'transit', title: '60+ Bus Fleet', text: 'Buses connecting students across the region every single day.', video: 'vid-10', accent: '#8FD3C1' },
  { id: 'green', title: 'Green Campus', text: 'Landscaped gardens and organised transit bays across the campus.', video: 'vid-11', accent: '#F6D58E' }
];

/* ------------------------------------------------------------------ */
/* Public faculty directory — whitelisted, directory-level fields only */
/* (no contact details, research metrics or portal-managed records)    */
/* ------------------------------------------------------------------ */
export const PUBLIC_FACULTY = (MASTER_FACULTY || [])
  .filter((f) => f && f.name)
  .map((f) => ({
    id: f.id,
    name: f.name,
    designation: f.designation || '',
    department: f.department || '',
    qualification: f.qualification || ''
  }));

/* ------------------------------------------------------------------ */
/* Static institutional facts (public information only)               */
/* ------------------------------------------------------------------ */
const YEARS = new Date().getFullYear() - COLLEGE_INFO.established;
export const PUBLIC_FACTS = [
  { value: COLLEGE_INFO.established, label: 'Year established', plain: true },
  { value: YEARS, suffix: '+', label: 'Years of engineering education' },
  { value: DEPARTMENTS.length, label: 'Academic departments' },
  { value: 40, suffix: '+', label: 'Acre Wi-Fi enabled campus' },
  { text: 'A+', label: 'NAAC grade (Cycle 2)' },
  { text: 'NBA', label: 'Accredited programmes' },
  { text: 'JNTUK', label: 'Affiliated · Autonomous' },
  { value: 60, suffix: '+', label: 'Bus transport fleet' }
];

/* ------------------------------------------------------------------ */
/* Programme families for the exploded 3D stack                        */
/* ------------------------------------------------------------------ */
const pick = (ids) => DEPARTMENTS.filter((d) => ids.includes(d.id));
export const PROGRAMME_LAYERS = [
  { id: 'core', title: 'Core Engineering', kicker: 'Since 1998', accent: '#E9B44C', depts: pick(['ece', 'eee', 'mec', 'ce']) },
  { id: 'computing', title: 'Computing & Information', kicker: 'CSE · IT', accent: '#5CC8E6', depts: pick(['cse', 'it']) },
  { id: 'emerging', title: 'Emerging Technologies', kicker: 'AI · ML · Cyber · Data', accent: '#E58A4E', depts: pick(['cse-ai', 'cse-aiml', 'cse-cys', 'cse-ds']) },
  { id: 'pg', title: 'Management & Applications', kicker: 'MBA · MCA', accent: '#8FD3C1', depts: pick(['mba', 'mca']) },
  { id: 'foundation', title: 'Foundation Sciences', kicker: 'First-year engineering', accent: '#F6D58E', depts: pick(['bsh']) }
];

/* ------------------------------------------------------------------ */
/* Gallery tunnel — public event & workshop photographs                */
/* ------------------------------------------------------------------ */
export const TUNNEL_IMAGES = (() => {
  const seen = new Set();
  const out = [];
  EVENTS.forEach((e) => e.images.slice(1).forEach((src) => {
    if (src && !seen.has(src)) {
      seen.add(src);
      out.push({ src, title: e.title });
    }
  }));
  return out.slice(0, 24);
})();
