import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Award, 
  FileText, 
  Lightbulb, 
  Users, 
  Briefcase, 
  BookOpen, 
  Download, 
  Printer, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { 
  getPublications, 
  getPatents, 
  getMoUs, 
  getInternships, 
  getStudentAchievements, 
  getMemberships,
  getNPTEL,
  getCampusPlacements,
  exportToExcel,
  exportToPDF,
  exportToCSV
} from '../../../data/portalStore.js';
import { ET_DEPARTMENTS, normalizeDepartment } from '../../../data/masterData.js';
import { 
  MotionPage, 
  ModulePageHeader, 
  AnimatedKpiGrid, 
  MotionKpiCard 
} from '../../motion/index.js';

export default function AnalyticsView({ currentUser, onNavigate }) {
  const pubs = getPublications();
  const patents = getPatents();
  const mous = getMoUs();
  const internships = getInternships();
  const achievements = getStudentAchievements();
  const memberships = getMemberships();
  const nptel = getNPTEL();
  const placements = getCampusPlacements();

  // Deduplicated / Unique Entity Counts
  const uniqueNptelStudents = useMemo(() => {
    return new Set(
      nptel
        .map(n => (n.studentDetails?.rollNumber || n.rollNumber || '').trim().toUpperCase())
        .filter(Boolean)
    ).size;
  }, [nptel]);

  const uniquePlacedStudents = useMemo(() => {
    return new Set(
      placements
        .map(p => (p.studentRoll || p.rollNumber || '').trim().toUpperCase())
        .filter(Boolean)
    ).size;
  }, [placements]);

  // Departmental Factual Volume Breakdown across the 5 Canonical ET Departments
  const deptBreakdown = useMemo(() => {
    return ET_DEPARTMENTS.map(d => {
      const matchDept = (rawDept) => {
        if (!rawDept) return false;
        const norm = normalizeDepartment(rawDept);
        return norm.code === d.code || norm.code === d.shortName || norm.canonicalCode === d.code || norm.canonicalCode === d.shortName;
      };

      const dPubs = pubs.filter(p => matchDept(p.department) || (p.authors && p.authors.some(a => matchDept(a.department)))).length;
      const dPatents = patents.filter(p => matchDept(p.department) || (p.inventors && p.inventors.some(i => matchDept(i.department)))).length;
      const dInternships = internships.filter(i => matchDept(i.department || i.branch)).length;
      const dMemberships = memberships.filter(m => matchDept(m.department)).length;
      const dNptel = nptel.filter(n => matchDept(n.department)).length;
      
      // Factual activity volume (strictly count of verified records without arbitrary multipliers)
      const activityVolume = dPubs + dPatents + dInternships + dMemberships + dNptel;

      return {
        code: d.code,
        name: d.name,
        pubs: dPubs,
        patents: dPatents,
        internships: dInternships,
        memberships: dMemberships,
        nptel: dNptel,
        activityVolume
      };
    }).sort((a, b) => b.activityVolume - a.activityVolume);
  }, [pubs, patents, internships, memberships, nptel]);

  return (
    <MotionPage style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
      {/* 1. Header */}
      <ModulePageHeader
        breadcrumbs={[
          { label: 'Dashboard' },
          { label: 'Governance' },
          { label: 'Executive Analytics' }
        ]}
        title="Institutional Velocity & Performance Analytics"
        subtitle="Cross-departmental research indexing, unique patent applications, MoUs, faculty achievements, and accreditation indices."
        onExportCSV={() => exportToCSV('analytics_overview')}
        onExportExcel={() => exportToExcel('analytics_overview')}
        onExportPDF={() => exportToPDF('analytics_overview')}
      />

      {/* 2. Canonical Factual KPI Summary Cards */}
      <AnimatedKpiGrid minWidth="160px">
        <MotionKpiCard 
          label="Research Papers" 
          value={pubs.length} 
          icon={FileText} 
          color="#2563EB" 
          bg="#EFF6FF" 
          subtext="Unique verified papers"
        />
        <MotionKpiCard 
          label="Patent Applications" 
          value={patents.length} 
          icon={Lightbulb} 
          color="#D97706" 
          bg="#FEFCE8" 
          subtext="Unique patent filings (not raw rows)"
        />
        <MotionKpiCard 
          label="Active Industry MoUs" 
          value={mous.length} 
          icon={Award} 
          color="#7C3AED" 
          bg="#F5F3FF" 
          subtext="Active collaborations"
        />
        <MotionKpiCard 
          label="Student Internships" 
          value={internships.length} 
          icon={Briefcase} 
          color="#0D9488" 
          bg="#F0FDFA" 
          subtext="Verified industry internships"
        />
        <MotionKpiCard 
          label="Student Achievements" 
          value={achievements.length} 
          icon={Sparkles} 
          color="#EC4899" 
          bg="#FDF2F8" 
          subtext="Awards & hackathon wins"
        />
        <MotionKpiCard 
          label="Unique NPTEL Certified" 
          value={uniqueNptelStudents} 
          icon={GraduationCap} 
          color="#059669" 
          bg="#ECFDF5" 
          subtext="Deduplicated certified students"
        />
        <MotionKpiCard 
          label="Unique Students Placed" 
          value={uniquePlacedStudents} 
          icon={TrendingUp} 
          color="#D4AF37" 
          bg="#FEFCE8" 
          subtext="Distinct placed candidates"
        />
        <MotionKpiCard 
          label="Faculty Memberships" 
          value={memberships.length} 
          icon={Users} 
          color="#6366F1" 
          bg="#EEF2FF" 
          subtext="Professional body rosters"
        />
      </AnimatedKpiGrid>

      {/* 3. Departmental Velocity Leaderboard across 5 ET Departments */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Emerging Technologies Departmental Records Breakdown
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.74rem', color: '#64748B' }}>
              Documented factual activity volume across the 5 canonical ET departments (Measurement unit: count of verified institutional records)
            </p>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 700, border: '1px solid #A7F3D0' }}>
            5 Canonical ET Departments
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                <th style={{ padding: '0.75rem 1rem' }}>Publications</th>
                <th style={{ padding: '0.75rem 1rem' }}>Patents</th>
                <th style={{ padding: '0.75rem 1rem' }}>Memberships</th>
                <th style={{ padding: '0.75rem 1rem' }}>NPTEL / MOOC</th>
                <th style={{ padding: '0.75rem 1rem' }}>Internships</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Verified Records</th>
              </tr>
            </thead>
            <tbody>
              {deptBreakdown.map((dept) => (
                <tr key={dept.code} style={{ borderBottom: '1px solid #F1F5F9' }} className="hover:bg-slate-50">
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 800, color: '#0F172A' }}>{dept.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 700 }}>Code: {dept.code}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#2563EB' }}>{dept.pubs}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#D97706' }}>{dept.patents}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#475569' }}>{dept.memberships}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0D9488' }}>{dept.nptel}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#7C3AED' }}>{dept.internships}</td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 800, fontSize: '0.75rem' }}>
                      {dept.activityVolume} records
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MotionPage>
  );
}
