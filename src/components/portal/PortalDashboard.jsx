import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { routeVariants } from '../../lib/motion/variants.js';
import { formatDateDDMMYYYY } from '../../lib/ui/dateUtils.js';
import { 
  Building2, 
  Users, 
  FileText, 
  Lightbulb, 
  BookOpen, 
  Trophy, 
  Briefcase, 
  Code, 
  Calendar, 
  Award, 
  Handshake, 
  GraduationCap, 
  TrendingUp, 
  Trash2, 
  ShieldAlert, 
  RefreshCw, 
  Download, 
  Plus, 
  ChevronRight, 
  UserCheck,
  ShieldCheck,
  UserPlus,
  UploadCloud,
  Grid,
  Lock,
  Key,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Settings,
  Eye,
  Sliders,
  Send,
  Camera,
  Image as ImageIcon,
  X,
  Search,
  Filter
} from 'lucide-react';
import { 
  USER_ROLES, 
  getUsers,
  saveUser,
  toggleUserStatus,
  forcePasswordReset,
  getFacultyList,
  updateFacultyPhoto,
  removeFacultyPhoto,
  saveFacultyMember,
  getPublications, 
  getPatents, 
  getMoUs, 
  getInternships, 
  getStudentAchievements,
  getRecycleBin,
  getAuditLogs,
  getRolePermissions,
  saveRolePermissions,
  ALL_PERMISSIONS,
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  getLoginEvents,
  getAuthSettings,
  updateAuthSettings,
  getEmailTemplates,
  updateEmailTemplate,
  parseAndValidateUsersCSV,
  executeBulkUserImport,
  exportToExcel,
  exportToPDF,
  exportToCSV,
  getAcademicEvents,
  getCampusPlacements,
  getBoSMeetings,
  getCommunityProjects,
  getStudentProjects,
  getNPTEL,
  getStudents
} from '../../data/portalStore.js';
import { DEPARTMENTS, BRANDING_LOGOS } from '../../data/masterData.js';
import MadamModulesCRUD from './MadamModulesCRUD.jsx';
import { RecycleBin, AuditLogViewer, NotificationAlerts } from './PortalTools.jsx';
import PublicationSyncModal from './PublicationSyncModal.jsx';
import FacultyAvatar from '../common/FacultyAvatar.jsx';
import BoSMeetingManager from './BoSMeetingManager.jsx';
import StudentAchievementsManager from './achievements/StudentAchievementsManager.jsx';
import StudentInternshipsManager from './internships/StudentInternshipsManager.jsx';
import FdpsOrganizedManager from './fdps/FdpsOrganizedManager.jsx';
import FacultyAchievementsManager from './faculty-achievements/FacultyAchievementsManager.jsx';

// New Modular Dashboard Components
import TopHeader from './dashboard/TopHeader.jsx';
import FloatingSidebar from './dashboard/FloatingSidebar.jsx';
import { NAVIGATION_CATEGORIES } from './dashboard/navigationCategories.js';
import DashboardOverviewView from './dashboard/DashboardOverviewView.jsx';
import AcademicEventsManager from './events/AcademicEventsManager.jsx';
import PatentsManager from './patents/PatentsManager.jsx';
import PublicationsManager from './publications/PublicationsManager.jsx';
import FacultyResearchSyncModal from './publications/FacultyResearchSyncModal.jsx';
import MembershipsManager from './memberships/MembershipsManager.jsx';
import MousManager from './mous/MousManager.jsx';
import StudentProjectsManager from './projects/StudentProjectsManager.jsx';
import CommunityServiceProjectsManager from './community-service/CommunityServiceProjectsManager.jsx';
import NptelCertificationsManager from './nptel/NptelCertificationsManager.jsx';
import AttendanceRiskManager from './attendance/AttendanceRiskManager.jsx';
import MidExamAnalysis from './analytics/MidExamAnalysis.jsx';
import ExternalExamAnalysis from './analytics/ExternalExamAnalysis.jsx';
import CampusPlacementsManager from './placements/CampusPlacementsManager.jsx';
import CompaniesVisitedManager from './placements/CompaniesVisitedManager.jsx';

// Dedicated Governance, Intelligence & Compliance Suites
import AnalyticsView from './dashboard/AnalyticsView.jsx';
import AlertsCenterView from './dashboard/AlertsCenterView.jsx';
import CircularsManager from './governance/CircularsManager.jsx';
import StaffProfilesManager from './governance/StaffProfilesManager.jsx';
import AcademicCouncilManager from './governance/AcademicCouncilManager.jsx';
import RegulationsHubManager from './governance/RegulationsHubManager.jsx';
import FundedProjectsManager from './research/FundedProjectsManager.jsx';
import ResearchDiscoveryView from './research/ResearchDiscoveryView.jsx';
import ResearchDataSourcesView from './research/ResearchDataSourcesView.jsx';
import { NaacPortalManager, NbaTier1Manager, NirfDataManager, ExportHubManager } from './compliance/ComplianceHubs.jsx';
import { IamMatrixManager, IamSessionsManager, IamSettingsManager } from './iam/IamModules.jsx';
import BulkDataCenterView from './bulk-data/BulkDataCenterView.jsx';
import PortalModuleFallback from './common/PortalModuleFallback.jsx';
import ModuleErrorBoundary from '../common/ModuleErrorBoundary.jsx';

export default function PortalDashboard({ currentUser, onNavigatePublic, onLogout, onExitPortal }) {
  const [activeModule, setActiveModule] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('module') || 'overview';
    }
    return 'overview';
  });
  const [selectedBulkModule, setSelectedBulkModule] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobileDrawer, setIsMobileDrawer] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncModalProvider, setSyncModalProvider] = useState('ORCID');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  const handleOpenBulkImport = (moduleKey) => {
    setSelectedBulkModule(moduleKey || 'academic_events');
    setActiveModule('bulk-data');
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile && isMobileDrawer) {
        setIsMobileDrawer(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileDrawer]);

  useEffect(() => {
    if (isMobileDrawer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawer]);

  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [userFilterRole, setUserFilterRole] = useState('ALL');
  const [userFilterDept, setUserFilterDept] = useState('ALL');

  // Single User Form State
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    username: '',
    role: 'FACULTY',
    dept: 'CSE',
    facultyId: '',
    allowPassword: true,
    allowGoogle: true,
    requireEmailOtp: true
  });

  // Bulk CSV Import State
  const [csvText, setCsvText] = useState('');
  const [csvParsedResult, setCsvParsedResult] = useState(null);

  // Email Template Previewer State
  const [selectedTemplateId, setSelectedTemplateId] = useState('login_otp');

  // Faculty Photo Management Modal State
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedFacultyForPhoto, setSelectedFacultyForPhoto] = useState(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState(null);
  const [photoUploadError, setPhotoUploadError] = useState('');
  const [facultySearch, setFacultySearch] = useState('');
  const [facultyDeptFilter, setFacultyDeptFilter] = useState('ALL');
  const [facultyPhotoStatusFilter, setFacultyPhotoStatusFilter] = useState('ALL');

  const refreshData = () => setDataVersion(v => v + 1);

  // Live Data Stores
  const usersList = getUsers();
  const facultyList = getFacultyList();
  const publications = getPublications();
  const patents = getPatents();
  const mous = getMoUs();
  const academicEvents = getAcademicEvents();
  const internships = getInternships();
  const achievements = getStudentAchievements();
  const recycleBin = getRecycleBin();
  const auditLogs = getAuditLogs();
  const permissionsMatrix = getRolePermissions();
  const activeSessions = getActiveSessions();
  const loginEvents = getLoginEvents();
  const authSettings = getAuthSettings();
  const emailTemplates = getEmailTemplates();

  const campusPlacements = getCampusPlacements();
  const bosMeetings = getBoSMeetings();
  const communityProjects = getCommunityProjects();
  const studentProjects = getStudentProjects();
  const nptelCertifications = getNPTEL();
  const studentsList = getStudents();

  // Department-scoped records for HOD role
  const isHod = currentUser?.role === 'HOD';
  const hodDept = currentUser?.dept;
  const filterByDept = (item) => {
    if (!isHod || !hodDept || hodDept === 'ALL') return true;
    const d = item.department || item.branch || '';
    if (d === hodDept || d === 'Institution Level' || d === 'Common') return true;
    if (item.authors && item.authors.some(a => a.department === hodDept)) return true;
    if (item.inventors && item.inventors.some(i => i.department === hodDept)) return true;
    return false;
  };

  const activeFacultyList = isHod ? facultyList.filter(f => f.department === hodDept) : facultyList;
  const activeStudentsList = isHod ? studentsList.filter(s => s.department === hodDept) : studentsList;
  const activePublications = isHod ? publications.filter(filterByDept) : publications;
  const activePatents = isHod ? patents.filter(filterByDept) : patents;
  const activeMoUs = isHod ? mous.filter(filterByDept) : mous;
  const activeEvents = isHod ? academicEvents.filter(filterByDept) : academicEvents;
  const activeAchievements = isHod ? achievements.filter(filterByDept) : achievements;
  const activePlacements = isHod ? campusPlacements.filter(filterByDept) : campusPlacements;
  const activeUniquePlaced = new Set(activePlacements.map(p => (p.studentRoll || p.rollNumber || '').trim().toUpperCase()).filter(Boolean)).size;
  const activeBosMeetings = isHod ? bosMeetings.filter(filterByDept) : bosMeetings;
  const activeCommunityProjects = isHod ? communityProjects.filter(filterByDept) : communityProjects;
  const activeInternships = isHod ? internships.filter(filterByDept) : internships;
  const activeStudentProjects = isHod ? studentProjects.filter(filterByDept) : studentProjects;
  const activeNptel = isHod ? nptelCertifications.filter(filterByDept) : nptelCertifications;
  const activeUniqueNptel = new Set(activeNptel.map(n => (n.studentDetails?.rollNumber || n.rollNumber || '').trim().toUpperCase()).filter(Boolean)).size;

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdminOrSuper = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  const [dashboardToast, setDashboardToast] = useState(null);

  const showDashboardToast = (msg) => {
    setDashboardToast(msg);
    setTimeout(() => setDashboardToast(null), 3500);
  };

  // Helper to extract active category & module labels for breadcrumbs
  const getModuleMeta = (modId) => {
    for (const cat of NAVIGATION_CATEGORIES) {
      const item = cat.items.find(i => i.id === modId);
      if (item) {
        return { categoryLabel: cat.label, moduleLabel: item.label };
      }
    }
    return { categoryLabel: 'Overview', moduleLabel: 'Executive Dashboard' };
  };

  const { categoryLabel, moduleLabel } = getModuleMeta(activeModule);

  // Handle Single User Save
  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) {
      showDashboardToast('Please enter full name and institutional email.');
      return;
    }
    saveUser(userForm, currentUser);
    showDashboardToast(`Account provisioned successfully for ${userForm.name} (${userForm.role})! Notification sent.`);
    setUserModalOpen(false);
    setUserForm({
      name: '', email: '', username: '', role: 'FACULTY', dept: 'CSE', facultyId: '',
      allowPassword: true, allowGoogle: true, requireEmailOtp: true
    });
    refreshData();
  };

  // Handle User Status Toggle with Anti-Lockout Exception
  const handleToggleUserStatus = (userId) => {
    try {
      toggleUserStatus(userId, currentUser);
      showDashboardToast('User account status updated.');
      refreshData();
    } catch (err) {
      showDashboardToast(err.message);
    }
  };

  // Handle Force Password Reset
  const handleForceReset = (userId) => {
    const res = forcePasswordReset(userId, currentUser);
    if (res.success) {
      showDashboardToast(res.message);
      refreshData();
    }
  };

  // Handle Bulk CSV Parse
  const handleParseCSV = () => {
    if (!csvText.trim()) {
      showDashboardToast('Please paste CSV rows into the text area.');
      return;
    }
    const result = parseAndValidateUsersCSV(csvText);
    setCsvParsedResult(result);
  };

  // Handle Bulk CSV Execution
  const handleExecuteImport = () => {
    if (!csvParsedResult || !csvParsedResult.validRows || csvParsedResult.validRows.length === 0) {
      showDashboardToast('No valid user accounts to import.');
      return;
    }
    const result = executeBulkUserImport(csvParsedResult.validRows, currentUser);
    showDashboardToast(`Successfully imported and provisioned ${result.importedCount} user accounts.`);
    setBulkImportModalOpen(false);
    setCsvText('');
    setCsvParsedResult(null);
    refreshData();
  };

  // Faculty Photo Management Handlers
  const handleOpenPhotoModal = (faculty) => {
    setSelectedFacultyForPhoto(faculty);
    setNewPhotoPreview(faculty.photo || null);
    setPhotoUploadError('');
    setPhotoModalOpen(true);
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoUploadError('File size exceeds 5MB limit.');
      return;
    }

    setPhotoUploadError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      setNewPhotoPreview(evt.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    if (!selectedFacultyForPhoto || !newPhotoPreview) return;
    updateFacultyPhoto(selectedFacultyForPhoto.id, newPhotoPreview, currentUser);
    showDashboardToast(`Verified photo updated for ${selectedFacultyForPhoto.name}.`);
    setPhotoModalOpen(false);
    setNewPhotoPreview(null);
    refreshData();
  };

  const handleRemovePhoto = () => {
    if (!selectedFacultyForPhoto) return;
    removeFacultyPhoto(selectedFacultyForPhoto.id, currentUser);
    showDashboardToast(`Photo removed for ${selectedFacultyForPhoto.name}. Profile reverted to neutral placeholder.`);
    setPhotoModalOpen(false);
    setNewPhotoPreview(null);
    refreshData();
  };

  // Filtered Users List
  const filteredUsers = usersList.filter(u => {
    const q = userSearch.toLowerCase();
    const matchesQuery = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.username && u.username.toLowerCase().includes(q));
    const matchesRole = userFilterRole === 'ALL' || u.role === userFilterRole;
    const matchesDept = userFilterDept === 'ALL' || u.dept === userFilterDept;
    return matchesQuery && matchesRole && matchesDept;
  });

  // Filtered Faculty List for Photo Management
  const filteredFacultyList = facultyList.filter(f => {
    const q = facultySearch.toLowerCase().trim();
    const matchesQuery = !q || 
      (f.name && f.name.toLowerCase().includes(q)) || 
      (f.id && f.id.toLowerCase().includes(q)) || 
      (f.department && f.department.toLowerCase().includes(q)) || 
      (f.designation && f.designation.toLowerCase().includes(q));
    const matchesDept = facultyDeptFilter === 'ALL' || (f.department || '').toLowerCase().includes(facultyDeptFilter.toLowerCase());
    const matchesPhoto = facultyPhotoStatusFilter === 'ALL' 
      ? true 
      : (facultyPhotoStatusFilter === 'WITH_PHOTO' ? !!f.photo : !f.photo);
    return matchesQuery && matchesDept && matchesPhoto;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
      {dashboardToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          background: '#0B192C',
          color: '#FFFFFF',
          padding: '0.75rem 1.4rem',
          borderRadius: '10px',
          border: '1px solid #D4AF37',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          zIndex: 9999,
          fontSize: '0.86rem',
          fontWeight: 600
        }}>
          {dashboardToast}
        </div>
      )}
      {/* 1. Integrated Global Header */}
      <TopHeader
        currentUser={currentUser}
        isHod={isHod}
        hodDept={hodDept}
        onToggleMobileDrawer={() => setIsMobileDrawer(!isMobileDrawer)}
        onSelectModule={(mod) => {
          setActiveModule(mod);
          setIsMobileDrawer(false);
        }}
        activeModule={activeModule}
        activeCategoryLabel={categoryLabel}
        activeModuleLabel={moduleLabel}
        onOpenSync={() => setSyncModalOpen(true)}
        onOpenQuickAction={() => setActiveModule('events')}
        onNavigatePublic={onNavigatePublic || onExitPortal}
        onLogout={onLogout || onExitPortal}
        onOpenSettings={() => setActiveModule('iam-settings')}
        onOpenNotifications={() => setActiveModule('alerts')}
        unreadAlertsCount={activeAlertsCount}
      />

      {/* 2. Main Workspace Layout (Floating Sidebar + Content Canvas with Shared Breathing Gap) */}
      <div style={{
        display: isMobile ? 'block' : 'flex',
        flex: 1,
        width: '100%',
        position: 'relative',
        boxSizing: 'border-box',
        padding: 'var(--portal-shell-y, 16px) var(--portal-shell-x, 14px)',
        gap: 'var(--portal-sidebar-main-gap, 16px)',
        minHeight: 'calc(100vh - 65px)'
      }}>
        {/* Floating Animated Navigation Sidebar */}
        <FloatingSidebar
          activeModule={activeModule}
          onSelectModule={(mod) => setActiveModule(mod)}
          sidebarExpanded={sidebarExpanded}
          onToggleSidebar={() => setSidebarExpanded(!sidebarExpanded)}
          currentUser={currentUser}
          onNavigatePublic={onNavigatePublic || onExitPortal}
          onLogout={onLogout || onExitPortal}
          isMobile={isMobile}
          isMobileDrawer={isMobileDrawer}
          onCloseMobileDrawer={() => setIsMobileDrawer(false)}
          unreadAlertsCount={activeAlertsCount}
        />

        {/* Dynamic Content Canvas */}
        <main style={{
          flex: 1,
          minWidth: 0,
          padding: 0,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column'
        }}>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              variants={routeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ width: '100%' }}
            >
              <ModuleErrorBoundary moduleName={activeModule} resetKey={activeModule}>
                {/* ────────────────────────────────────────────────────────── */}
                {/* VIEW 1: EXECUTIVE DASHBOARD OVERVIEW */}
                {/* ────────────────────────────────────────────────────────── */}
                {activeModule === 'overview' && (
                  <DashboardOverviewView
                    currentUser={currentUser}
                    usersCount={usersList.length}
                    facultyCount={activeFacultyList.length}
                    uniqueStudentsCount={activeStudentsList.length}
                    publicationsCount={activePublications.length}
                    patentsCount={activePatents.length}
                    mousCount={activeMoUs.length}
                    eventsCount={activeEvents.length}
                    achievementsCount={activeAchievements.length}
                    activeSessionsCount={activeSessions.length}
                    placementsCount={activePlacements.length}
                    uniquePlacedStudentsCount={activeUniquePlaced}
                    bosMeetingsCount={activeBosMeetings.length}
                    cspCount={activeCommunityProjects.length}
                    internshipsCount={activeInternships.length}
                    miniProjectsCount={activeStudentProjects.length}
                    nptelCount={activeNptel.length}
                    uniqueNptelCount={activeUniqueNptel}
                    onNavigate={(mod) => setActiveModule(mod)}
                    onOpenQuickAction={() => setActiveModule('events')}
                    onOpenSync={() => { setSyncModalProvider('ORCID'); setSyncModalOpen(true); }}
                  />
                )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 2: UNIFIED ACADEMIC EVENTS SUITE */}
          {/* ────────────────────────────────────────────────────────── */}
          {(
            activeModule === 'events' || 
            activeModule === 'academic-events' || 
            activeModule === 'workshops' || 
            activeModule === 'seminars' || 
            activeModule === 'guest-lectures' || 
            activeModule === 'hackathons' || 
            activeModule === 'codeathons'
          ) && (
            <AcademicEventsManager
              currentUser={currentUser}
              onDataChange={refreshData}
              onOpenBulkDataCenter={() => handleOpenBulkImport('academic_events')}
              initialTypeFilter={
                activeModule === 'hackathons' ? 'Hackathon' :
                activeModule === 'codeathons' ? 'Code-a-thon' :
                activeModule === 'guest-lectures' ? 'Guest Lecture' :
                activeModule === 'seminars' ? 'Seminar' :
                activeModule === 'workshops' ? 'Workshop' : 'ALL'
              }
            />
          )}



          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 4: IAM USER DIRECTORY */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeModule === 'iam-users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.25rem 0', fontFamily: 'Cinzel, Georgia, serif' }}>
                    IAM User Provisioning & Directory
                  </h1>
                  <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                    Zero public signup. Manage authorized faculty and staff credentials, 2-step OTP enforcement, and status.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setBulkImportModalOpen(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#334155', padding: '0.5rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <UploadCloud size={14} /> Bulk CSV Import
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserModalOpen(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)', border: 'none', color: '#070F1E', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    <UserPlus size={14} /> Provision User
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>User / Identity</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Last Login</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }} className="hover:bg-slate-50">
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{u.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ background: u.role === 'SUPER_ADMIN' ? '#FEF3C7' : '#EFF6FF', color: u.role === 'SUPER_ADMIN' ? '#B45309' : '#1D4ED8', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>{u.dept}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ background: u.status === 'Active' ? '#ECFDF5' : '#FEF2F2', color: u.status === 'Active' ? '#047857' : '#DC2626', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700 }}>
                            {u.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', color: '#64748B' }}>
                          {u.lastLogin ? formatDateDDMMYYYY(u.lastLogin) : 'Never'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          {u.role !== 'SUPER_ADMIN' && (
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u.id)}
                              style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer' }}
                            >
                              {u.status === 'Active' ? 'Suspend' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 5: BOARD OF STUDIES (BoS) - DEDICATED GOVERNANCE SUITE */}
          {/* ────────────────────────────────────────────────────────── */}
          {(activeModule === 'bos' || activeModule === 'bos-meetings') && (
            <BoSMeetingManager currentUser={currentUser} onDataChange={refreshData} />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 5.5: ATTENDANCE RISK & PARENT CONTACT SUITE */}
          {/* ────────────────────────────────────────────────────────── */}
          {(activeModule === 'attendance-risk' || activeModule === 'attendance') && (
            <AttendanceRiskManager currentUser={currentUser} onDataChange={refreshData} />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 6: STUDENT ACHIEVEMENTS - DEDICATED EVIDENCE SUITE */}
          {/* ────────────────────────────────────────────────────────── */}
          {(activeModule === 'student-achievements' || activeModule === 'achievements') && (
            <StudentAchievementsManager currentUser={currentUser} onDataChange={refreshData} />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 7: STUDENT INTERNSHIPS - DEDICATED EVIDENCE SUITE */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeModule === 'internships' && (
            <StudentInternshipsManager currentUser={currentUser} onDataChange={refreshData} />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 8: FDPS ORGANIZED - DEDICATED EVIDENCE SUITE */}
          {/* ────────────────────────────────────────────────────────── */}
          {(activeModule === 'fdps-organized' || activeModule === 'fdps') && (
            <FdpsOrganizedManager currentUser={currentUser} onDataChange={refreshData} />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 9: FACULTY ACHIEVEMENTS - DEDICATED EVIDENCE SUITE */}
          {/* ────────────────────────────────────────────────────────── */}
          {(activeModule === 'faculty-achievements' || activeModule === 'faculty-ach') && (
            <FacultyAchievementsManager currentUser={currentUser} onDataChange={refreshData} />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 10: RESEARCH PUBLICATIONS SUITE */}
          {/* ────────────────────────────────────────────────────────── */}
          {(activeModule === 'publications' || activeModule === 'research-papers') && (
            <PublicationsManager
              currentUser={currentUser}
              onDataChange={refreshData}
              onOpenSyncModal={(provider) => {
                setSyncModalProvider(provider || 'ORCID');
                setSyncModalOpen(true);
              }}
            />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 10B: RESEARCH DISCOVERY & LOCAL SCHOLARLY INDEX */}
          {/* ────────────────────────────────────────────────────────── */}
          {(activeModule === 'research-discovery' || activeModule === 'sync-publications') && (
            <ResearchDiscoveryView
              currentUser={currentUser}
              onNavigate={(mod) => setActiveModule(mod)}
            />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 10C: RESEARCH DATA SOURCES & DATASET MANAGEMENT */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeModule === 'research-data-sources' && (
            <ResearchDataSourcesView
              currentUser={currentUser}
            />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 11: PATENTS & IPR GOVERNANCE SUITE */}
          {/* ────────────────────────────────────────────────────────── */}
          {(activeModule === 'patents' || activeModule === 'ipr-patents') && (
            <PatentsManager
              currentUser={currentUser}
              onDataChange={refreshData}
            />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 12: FACULTY MEMBERSHIPS & PROFESSIONAL BODIES */}
          {/* ────────────────────────────────────────────────────────── */}
          {(activeModule === 'faculty-memberships' || activeModule === 'memberships') && (
            <MembershipsManager
              currentUser={currentUser}
              onDataChange={refreshData}
            />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 13: INDUSTRY MoUs & PARTNERSHIPS */}
          {/* ────────────────────────────────────────────────────────── */}
          {(activeModule === 'mous-collaborations' || activeModule === 'mous' || activeModule === 'collaborations') && (
            <MousManager
              currentUser={currentUser}
              onDataChange={refreshData}
            />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 14: STUDENT PROJECTS & CAPSTONE */}
          {/* ────────────────────────────────────────────────────────── */}
          {(activeModule === 'student-projects' || activeModule === 'projects' || activeModule === 'capstone-projects') && (
            <StudentProjectsManager
              currentUser={currentUser}
              onDataChange={refreshData}
            />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 14.5: COMMUNITY SERVICE PROJECTS (CSP) */}
          {/* ────────────────────────────────────────────────────────── */}
          {(activeModule === 'community-projects' || activeModule === 'csp') && (
            <CommunityServiceProjectsManager
              currentUser={currentUser}
              onDataChange={refreshData}
            />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 15: NPTEL & MOOC ONLINE CERTIFICATIONS */}
          {/* ────────────────────────────────────────────────────────── */}
          {(activeModule === 'nptel-certifications' || activeModule === 'nptel' || activeModule === 'moocs') && (
            <NptelCertificationsManager
              currentUser={currentUser}
              onDataChange={refreshData}
            />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 16: EXECUTIVE INTELLIGENCE & NOTIFICATIONS */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeModule === 'analytics' && (
            <AnalyticsView currentUser={currentUser} onNavigate={(mod) => setActiveModule(mod)} />
          )}

          {activeModule === 'alerts' && (
            <AlertsCenterView currentUser={currentUser} onNavigate={(mod) => setActiveModule(mod)} />
          )}

          {activeModule === 'gallery-media' && (
            <PortalModuleFallback
              moduleId="gallery-media"
              moduleLabel="Media & Campus Gallery"
              message="Media & Campus Gallery has been moved to the public website. Use the Public Site navigation to access the gallery."
            />
          )}

          {activeModule === 'circulars-notices' && (
            <CircularsManager currentUser={currentUser} />
          )}

          {activeModule === 'academic-council' && (
            <AcademicCouncilManager currentUser={currentUser} />
          )}

          {activeModule === 'regulations-hub' && (
            <RegulationsHubManager currentUser={currentUser} />
          )}

          {activeModule === 'funded-projects' && (
            <FundedProjectsManager currentUser={currentUser} />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 18: ACCREDITATION & COMPLIANCE HUBS */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeModule === 'naac-portal' && (
            <NaacPortalManager currentUser={currentUser} />
          )}

          {activeModule === 'nba-tier1' && (
            <NbaTier1Manager currentUser={currentUser} />
          )}

          {activeModule === 'nirf-data' && (
            <NirfDataManager currentUser={currentUser} />
          )}

          {activeModule === 'export-hub' && (
            <ExportHubManager currentUser={currentUser} />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 19: IAM & SECURITY CONFIGURATIONS */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeModule === 'iam-matrix' && (
            <IamMatrixManager currentUser={currentUser} />
          )}

          {activeModule === 'iam-sessions' && (
            <IamSessionsManager currentUser={currentUser} />
          )}

          {activeModule === 'iam-settings' && (
            <IamSettingsManager currentUser={currentUser} />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 20: BULK DATA CENTER */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeModule === 'bulk-data' && (
            <BulkDataCenterView
              currentUser={currentUser}
              initialModuleKey={selectedBulkModule}
            />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 21.5: ACADEMIC ANALYTICS & STUDENT / PLACEMENT MODULES */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeModule === 'mid-exam-analysis' && (
            <MidExamAnalysis currentUser={currentUser} />
          )}

          {activeModule === 'external-exam-analysis' && (
            <ExternalExamAnalysis currentUser={currentUser} />
          )}

          {activeModule === 'campus-placements' && (
            <CampusPlacementsManager currentUser={currentUser} />
          )}

          {activeModule === 'companies-visited' && (
            <CompaniesVisitedManager currentUser={currentUser} />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 21.6: RECYCLE BIN & AUDIT LOGS */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeModule === 'recycle-bin' && (
            <RecycleBin currentUser={currentUser} onRestored={refreshData} />
          )}

          {activeModule === 'audit-logs' && (
            <AuditLogViewer />
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* VIEW 22: ZERO-BLANK-SCREEN FALLBACK */}
          {/* ────────────────────────────────────────────────────────── */}
          {![
            'overview',
            'analytics',
            'alerts',
            'activity',
            'events',
            'academic-events',
            'workshops',
            'seminars',
            'guest-lectures',
            'hackathons',
            'codeathons',
            'mid-exam-analysis',
            'external-exam-analysis',
            'attendance-risk',
            'campus-placements',
            'companies-visited',
            'gallery-media',
            'circulars-notices',
            'faculty-memberships',
            'memberships',
            'fdps-organized',
            'fdps',
            'faculty-achievements',
            'faculty-ach',
            'student-projects',
            'projects',
            'capstone-projects',
            'community-projects',
            'csp',
            'student-achievements',
            'achievements',
            'internships',
            'bos',
            'bos-meetings',
            'academic-council',
            'regulations-hub',
            'publications',
            'research-papers',
            'patents',
            'ipr-patents',
            'funded-projects',
            'research-discovery',
            'research-data-sources',
            'sync-publications',
            'mous-collaborations',
            'mous',
            'collaborations',
            'nptel-certifications',
            'nptel',
            'moocs',
            'naac-portal',
            'nba-tier1',
            'nirf-data',
            'export-hub',
            'iam-users',
            'bulk-data',
            'iam-matrix',
            'iam-sessions',
            'iam-settings',
            'recycle-bin',
            'audit-logs'
          ].includes(activeModule) && (
            <PortalModuleFallback
              activeModule={activeModule}
              currentUser={currentUser}
              onBackToOverview={() => setActiveModule('overview')}
            />
          )}
              </ModuleErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODALS */}
      {/* ────────────────────────────────────────────────────────── */}

      {/* Single User Provisioning Modal */}
      {userModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 15, 30, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1100 }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '1.5rem', maxWidth: '520px', width: '100%', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1rem 0' }}>
              Provision Institutional User Account
            </h2>
            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>FULL NAME *</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Full Name"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>INSTITUTIONAL EMAIL *</label>
                <input
                  type="email"
                  required
                  placeholder="faculty@nrtec.in"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>ROLE</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  >
                    <option value="FACULTY">Faculty</option>
                    <option value="HOD">Head of Department (HOD)</option>
                    <option value="DEAN">Dean / Director</option>
                    <option value="ADMIN">College Admin</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>DEPARTMENT</label>
                  <select
                    value={userForm.dept}
                    onChange={(e) => setUserForm({ ...userForm, dept: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  >
                    {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)', color: '#070F1E', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {bulkImportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 15, 30, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1100 }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '1.5rem', maxWidth: '640px', width: '100%', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
              Bulk User Provisioning (CSV)
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '1rem' }}>
              Paste rows in format: <code>name, email, role, department, faculty_id</code>
            </p>

            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Dr. K. Ramesh, kramesh@nrtec.in, FACULTY, CSE, NEC-CSE-102&#10;Dr. S. Varma, svarma@nrtec.in, HOD, ECE, NEC-ECE-105"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontFamily: 'monospace', boxSizing: 'border-box', marginBottom: '1rem' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleParseCSV}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Validate CSV Rows
              </button>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => { setBulkImportModalOpen(false); setCsvParsedResult(null); }}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!csvParsedResult || !csvParsedResult.validRows || csvParsedResult.validRows.length === 0}
                  onClick={handleExecuteImport}
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)', color: '#070F1E', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Execute Import ({csvParsedResult?.validRows?.length || 0})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Photo Upload Modal */}
      {photoModalOpen && selectedFacultyForPhoto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 15, 30, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1100 }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '1.5rem', maxWidth: '480px', width: '100%', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
              Update Faculty Photograph
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1rem' }}>
              {selectedFacultyForPhoto.name} ({selectedFacultyForPhoto.department})
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              {newPhotoPreview ? (
                <img
                  src={newPhotoPreview}
                  alt="Preview"
                  style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #D4AF37', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
                />
              ) : (
                <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', border: '2px dashed #CBD5E1' }}>
                  No Photo
                </div>
              )}
            </div>

            {photoUploadError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '0.5rem', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '0.85rem' }}>
                {photoUploadError}
              </div>
            )}

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handlePhotoFileChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1.25rem', boxSizing: 'border-box' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {selectedFacultyForPhoto.photo ? (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', padding: '0.45rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Remove Photo
                </button>
              ) : <div />}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => { setPhotoModalOpen(false); setNewPhotoPreview(null); }}
                  style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newPhotoPreview}
                  onClick={handleSavePhoto}
                  style={{ padding: '0.45rem 1.1rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)', color: '#070F1E', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Auto-Sync Research Profile Modal */}
      {syncModalOpen && (
        <FacultyResearchSyncModal
          isOpen={syncModalOpen}
          initialProvider={syncModalProvider}
          currentUser={currentUser}
          onSyncComplete={refreshData}
          onClose={() => setSyncModalOpen(false)}
        />
      )}
    </div>
  );
}
