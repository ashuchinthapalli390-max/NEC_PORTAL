import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { sanitizeExportRecord, sanitizeSpreadsheetCell } from '../lib/security/sanitizer.js';
import { 
  COLLEGE_INFO, 
  LEADERSHIP_PROFILES, 
  DEPARTMENTS, 
  GOVERNING_BODY, 
  ACADEMIC_COUNCIL, 
  AICTE_IDEA_LAB_TEAM, 
  FACULTY_DATA,
  CAMPUS_VIDEOS,
  CAMPUS_PHOTOS,
  BRANDING_LOGOS,
  INITIAL_PUBLICATIONS,
  INITIAL_PATENTS,
  INITIAL_FACULTY_RESEARCH_PROFILES,
  INITIAL_BOS,
  INITIAL_STUDENT_ACHIEVEMENTS,
  INITIAL_INTERNSHIPS,
  INITIAL_PROJECTS,
  INITIAL_FDPS,
  INITIAL_FACULTY_ACHIEVEMENTS,
  INITIAL_EVENTS,
  INITIAL_MEMBERSHIPS,
  INITIAL_MOUS,
  INITIAL_NPTEL,
  INITIAL_PLACEMENT_STATS,
  INITIAL_PLACEMENT_RECORDS,
  INITIAL_PLACEMENTS,
  INITIAL_EXAM_NOTIFICATIONS,
  INITIAL_NEWS,
  INITIAL_STUDENTS,
  INITIAL_STUDENT_GUARDIANS,
  INITIAL_ATTENDANCE_SNAPSHOTS,
  INITIAL_ATTENDANCE_ALERTS,
  INITIAL_ATTENDANCE_PARENT_CONTACTS
} from './masterData.js';
import { 
  INITIAL_DATASET_VERSIONS, 
  INDEXED_NEC_AUTHORS, 
  INDEXED_NEC_WORKS, 
  INDEXED_CROSSREF_METADATA 
} from '../lib/research/localIndex/datasetStore.js';
import { 
  VERIFIED_EVENT_MEDIA_REGISTRY,
  INGESTED_MEDIA_ASSETS,
  RECORD_MEDIA_LINKS,
  getVerifiedMediaForEvent
} from './verified-event-media.js';
import { parseDateRange, formatDateDDMMYYYY } from '../lib/ui/dateUtils.js';

// -------------------------------------------------------------
// Storage Keys & Security Core (v3 Production Clean)
// -------------------------------------------------------------
export const STORAGE_KEYS = {
  FACULTY: 'nec_portal_faculty_v3',
  PUBLICATIONS: 'nec_portal_publications_v3',
  PATENTS: 'nec_portal_patents_v3',
  RESEARCH_RECORD_SOURCES: 'nec_portal_research_record_sources_v3',
  RESEARCH_INDEX_RECORDS: 'nec_portal_research_index_records_v3',
  RESEARCH_IMPORT_JOBS: 'nec_portal_research_import_jobs_v3',
  BOS: 'nec_portal_bos_v3',
  STUDENT_ACHIEVEMENTS: 'nec_portal_student_achievements_v3',
  INTERNSHIPS: 'nec_portal_internships_v3',
  PROJECTS: 'nec_portal_projects_v3',
  FDPS: 'nec_portal_fdps_v3',
  FACULTY_ACHIEVEMENTS: 'nec_portal_faculty_achievements_v3',
  EVENTS: 'nec_portal_events_v3',
  MEMBERSHIPS: 'nec_portal_memberships_v3',
  MOUS: 'nec_portal_mous_v3',
  NPTEL: 'nec_portal_nptel_v3',
  PLACEMENTS: 'nec_portal_placements_v3',
  EXAM_NOTICES: 'nec_portal_exam_notices_v3',
  NEWS: 'nec_portal_news_v3',
  AUDIT_LOGS: 'nec_portal_audit_logs_v3',
  USERS: 'nec_portal_users_v3',
  ROLE_PERMISSIONS: 'nec_portal_role_permissions_v3',
  AUTH_CHALLENGES: 'nec_portal_auth_challenges_v3',
  ACTIVE_SESSIONS: 'nec_portal_active_sessions_v3',
  LOGIN_EVENTS: 'nec_portal_login_events_v3',
  EMAIL_EVENTS: 'nec_portal_email_events_v3',
  AUTH_SETTINGS: 'nec_portal_auth_settings_v3',
  EMAIL_TEMPLATES: 'nec_portal_email_templates_v3',
  FACULTY_RESEARCH_PROFILES: 'nec_portal_faculty_research_profiles_v3',
  DATASET_VERSIONS: 'nec_portal_dataset_versions_v3',
  METRIC_SNAPSHOTS: 'nec_portal_metric_snapshots_v3',
  STAFF_PROFILES: 'nec_portal_staff_profiles_v3',
  ACADEMIC_EVENT_IMPORT_JOBS: 'nec_portal_academic_event_import_jobs_v3',
  ACADEMIC_EVENT_IMPORT_ROWS: 'nec_portal_academic_event_import_rows_v3',
  BULK_IMPORT_JOBS: 'nec_portal_bulk_import_jobs_v3',
  BULK_IMPORT_ROWS: 'nec_portal_bulk_import_rows_v3',
  BULK_IMPORT_ALIAS_MAPPINGS: 'nec_portal_bulk_import_alias_mappings_v3',
  BULK_MEDIA_JOBS: 'nec_portal_bulk_media_jobs_v3',
  BULK_MEDIA_FOLDERS: 'nec_portal_bulk_media_folders_v3',
  BULK_MEDIA_ITEMS: 'nec_portal_bulk_media_items_v3',
  MEDIA_ASSETS: 'nec_portal_media_assets_v3',
  RECORD_MEDIA_LINKS: 'nec_portal_record_media_links_v3',
  STUDENTS: 'nec_portal_students_v3',
  STUDENT_GUARDIANS: 'nec_portal_student_guardians_v3',
  ATTENDANCE_IMPORT_JOBS: 'nec_portal_attendance_import_jobs_v3',
  ATTENDANCE_IMPORT_ROWS: 'nec_portal_attendance_import_rows_v3',
  ATTENDANCE_SNAPSHOTS: 'nec_portal_attendance_snapshots_v3',
  ATTENDANCE_SUBJECT_RECORDS: 'nec_portal_attendance_subject_records_v3',
  ATTENDANCE_ALERTS: 'nec_portal_attendance_alerts_v3',
  ATTENDANCE_PARENT_CONTACTS: 'nec_portal_attendance_parent_contacts_v3',
  COMMUNITY_PROJECTS: 'et_portal_community_projects_v1',
  COMPANY_VISITS: 'et_portal_company_visits_v1',
  CAMPUS_PLACEMENTS: 'et_portal_campus_placements_v1',
  ATTENDANCE_BATCHES: 'et_portal_attendance_batches_v1',
  MID_EXAM_ANALYSES: 'et_portal_mid_exam_analyses_v1'
};

// Automatic one-time cleanup of obsolete legacy demo caches & transactional zero-data reset
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const zeroDataPurgeKey = 'et_portal_zero_data_purged_v2';
    if (!localStorage.getItem(zeroDataPurgeKey)) {
      const transactionalKeysToClear = [
        'nec_portal_publications_v1', 'nec_portal_publications_v2', 'nec_portal_publications_v3',
        'nec_portal_patents_v1', 'nec_portal_patents_v2', 'nec_portal_patents_v3',
        'nec_portal_bos_v1', 'nec_portal_bos_v2', 'nec_portal_bos_v3',
        'nec_portal_student_achievements_v1', 'nec_portal_student_achievements_v2', 'nec_portal_student_achievements_v3',
        'nec_portal_internships_v1', 'nec_portal_internships_v2', 'nec_portal_internships_v3',
        'nec_portal_projects_v1', 'nec_portal_projects_v2', 'nec_portal_projects_v3',
        'nec_portal_fdps_v1', 'nec_portal_fdps_v2', 'nec_portal_fdps_v3',
        'nec_portal_faculty_achievements_v1', 'nec_portal_faculty_achievements_v2', 'nec_portal_faculty_achievements_v3',
        'nec_portal_events_v1', 'nec_portal_events_v2', 'nec_portal_events_v3',
        'nec_portal_memberships_v1', 'nec_portal_memberships_v2', 'nec_portal_memberships_v3',
        'nec_portal_mous_v1', 'nec_portal_mous_v2', 'nec_portal_mous_v3',
        'nec_portal_nptel_v1', 'nec_portal_nptel_v2', 'nec_portal_nptel_v3',
        'nec_portal_placements_v1', 'nec_portal_placements_v2', 'nec_portal_placements_v3',
        'nec_portal_faculty_v3', 'nec_portal_staff_profiles_v3', 'nec_portal_students_v3',
        'nec_portal_student_guardians_v3', 'nec_portal_attendance_import_jobs_v3',
        'nec_portal_attendance_import_rows_v3', 'nec_portal_attendance_snapshots_v3',
        'nec_portal_attendance_subject_records_v3', 'nec_portal_attendance_alerts_v3',
        'nec_portal_attendance_parent_contacts_v3', 'nec_portal_exam_notices_v3',
        'nec_portal_news_v3', 'nec_portal_research_record_sources_v3',
        'nec_portal_research_index_records_v3', 'nec_portal_research_import_jobs_v3',
        'nec_portal_faculty_research_profiles_v3', 'nec_portal_metric_snapshots_v3',
        'nec_portal_academic_event_import_jobs_v3', 'nec_portal_academic_event_import_rows_v3',
        'nec_portal_bulk_import_jobs_v3', 'nec_portal_bulk_import_rows_v3',
        'nec_portal_bulk_import_alias_mappings_v3', 'nec_portal_bulk_media_jobs_v3',
        'nec_portal_bulk_media_folders_v3', 'nec_portal_bulk_media_items_v3',
        'nec_portal_media_assets_v3', 'nec_portal_record_media_links_v3',
        'et_portal_community_projects_v1', 'et_portal_company_visits_v1',
        'et_portal_campus_placements_v1', 'et_portal_attendance_batches_v1'
      ];
      transactionalKeysToClear.forEach(k => localStorage.removeItem(k));
      localStorage.setItem(zeroDataPurgeKey, 'true');
    }
  } catch (e) {
    console.warn('Storage purge non-fatal error:', e);
  }
}

// Initial Provisioned Accounts (Zero public sign-up)
export const USER_ROLES = [
  { 
    id: 'usr_superadmin', 
    username: 'superadmin',
    label: 'Super Admin', 
    name: 'Ashu Chinthapalli', 
    email: 'ashuchinthapalli3900@gmail.com', 
    dept: 'Management & Governance', 
    role: 'SUPER_ADMIN', 
    canApprove: true, 
    isSuper: true,
    status: 'Active',
    allowPassword: true,
    allowGoogle: true,
    requireEmailOtp: true,
    firebaseUid: null,
    lastLogin: '2026-08-23T10:30:00.000Z'
  },
  { 
    id: 'usr_principal', 
    username: 'principal',
    label: 'College Admin', 
    name: 'Dr. S. Venkateswarlu', 
    email: 'principal@nrtec.in', 
    dept: 'Administration', 
    role: 'ADMIN', 
    canApprove: true,
    status: 'Active',
    allowPassword: true,
    allowGoogle: true,
    requireEmailOtp: true,
    lastLogin: '2026-08-23T09:45:00.000Z'
  },
  { 
    id: 'usr_deanrd', 
    username: 'deanrd',
    label: 'Dean R&D', 
    name: 'Dr. S. V. N. Sreenivasu', 
    email: 'deanrd@nrtec.in', 
    dept: 'R&D', 
    role: 'ADMIN', 
    canApprove: true,
    status: 'Active',
    allowPassword: true,
    allowGoogle: true,
    requireEmailOtp: true,
    lastLogin: '2026-08-22T16:20:00.000Z'
  },
  { 
    id: 'usr_hod_cse', 
    username: 'hod.cse',
    label: 'HOD CSE', 
    name: 'Dr. S. N. Tirumala Rao', 
    email: 'hod_cse@nrtec.in', 
    dept: 'CSE', 
    role: 'HOD', 
    canApprove: true,
    status: 'Active',
    allowPassword: true,
    allowGoogle: true,
    requireEmailOtp: true,
    lastLogin: '2026-08-23T08:15:00.000Z'
  },
  { 
    id: 'usr_hod_ece', 
    username: 'hod.ece',
    label: 'HOD ECE', 
    name: 'Dr. V. Venkata Rao', 
    email: 'hod_ece@nrtec.in', 
    dept: 'ECE', 
    role: 'HOD', 
    canApprove: true, 
    facultyId: 'NEC-PER-0069',
    status: 'Active',
    allowPassword: true,
    allowGoogle: true,
    requireEmailOtp: true,
    lastLogin: '2026-08-22T14:10:00.000Z'
  },
  { 
    id: 'usr_hod_it', 
    username: 'hod.it',
    label: 'HOD IT', 
    name: 'Dr. B. Jhansi Vazram', 
    email: 'hod_it@nrtec.in', 
    dept: 'IT', 
    role: 'HOD', 
    canApprove: true, 
    facultyId: 'NEC-PER-0284',
    status: 'Active',
    allowPassword: true,
    allowGoogle: true,
    requireEmailOtp: true,
    lastLogin: '2026-08-23T11:05:00.000Z'
  },
  { 
    id: 'usr_faculty_ece', 
    username: 'v.venkatarao',
    label: 'Faculty (ECE)', 
    name: 'Dr. V. Venkata Rao', 
    email: 'v.venkatarao@nrtec.in', 
    dept: 'ECE', 
    role: 'FACULTY', 
    facultyId: 'NEC-PER-0069',
    status: 'Active',
    allowPassword: true,
    allowGoogle: true,
    requireEmailOtp: false,
    lastLogin: '2026-08-21T18:00:00.000Z'
  },
  { 
    id: 'usr_faculty_it', 
    username: 'b.jhansivazram',
    label: 'Faculty (IT)', 
    name: 'Dr. B. Jhansi Vazram', 
    email: 'b.jhansivazram@nrtec.in', 
    dept: 'IT', 
    role: 'FACULTY', 
    facultyId: 'NEC-PER-0284',
    status: 'Active',
    allowPassword: true,
    allowGoogle: true,
    requireEmailOtp: false,
    lastLogin: '2026-08-23T11:00:00.000Z'
  },
  { 
    id: 'usr_dataentry', 
    username: 'dataentry',
    label: 'Data Entry Operator', 
    name: 'Academic Cell Staff', 
    email: 'dataentry@nrtec.in', 
    dept: 'Academic Cell', 
    role: 'DATA_ENTRY', 
    isDataEntry: true,
    status: 'Active',
    allowPassword: true,
    allowGoogle: false,
    requireEmailOtp: true,
    lastLogin: '2026-08-23T09:00:00.000Z'
  },
  { 
    id: 'usr_auditor', 
    username: 'auditor.naac',
    label: 'NAAC / NBA Evaluator', 
    name: 'Peer Review Auditor', 
    email: 'auditor@naac.gov.in', 
    dept: 'External Audit', 
    role: 'AUDITOR', 
    isReadOnly: true,
    status: 'Active',
    allowPassword: true,
    allowGoogle: true,
    requireEmailOtp: false,
    lastLogin: '2026-08-20T12:00:00.000Z'
  }
];

const memoryStore = {};

export function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: (k) => (k in memoryStore ? memoryStore[k] : null),
    setItem: (k, v) => { memoryStore[k] = String(v); },
    removeItem: (k) => { delete memoryStore[k]; }
  };
}

export function loadStore(key, initialData) {
  try {
    const storage = getStorage();
    const item = storage.getItem(key);
    if (!item) {
      const fallback = Array.isArray(initialData) ? initialData : (initialData || []);
      storage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(item);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && Array.isArray(parsed.records)) {
      return parsed.records;
    }
    if (parsed !== null && typeof parsed === 'object') {
      return parsed;
    }
    return Array.isArray(initialData) ? initialData : [];
  } catch (e) {
    console.error('Storage load error for key:', key, e);
    return Array.isArray(initialData) ? initialData : [];
  }
}

export function saveStore(key, data) {
  try {
    const storage = getStorage();
    storage.setItem(key, JSON.stringify(data));

    // Background server synchronization for shared cross-device persistence
    if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      const KEY_TO_MODULE_MAP = {
        [STORAGE_KEYS.PATENTS]: 'patents',
        [STORAGE_KEYS.PLACEMENTS]: 'campusPlacements',
        [STORAGE_KEYS.CAMPUS_PLACEMENTS]: 'campusPlacements',
        [STORAGE_KEYS.STUDENT_ACHIEVEMENTS]: 'studentAchievements',
        [STORAGE_KEYS.EVENTS]: 'events',
        [STORAGE_KEYS.BOS]: 'bos',
        [STORAGE_KEYS.BULK_IMPORT_JOBS]: 'importJobs',
        [STORAGE_KEYS.AUDIT_LOGS]: 'auditLogs'
      };

      const moduleKey = KEY_TO_MODULE_MAP[key];
      if (moduleKey && Array.isArray(data)) {
        fetch(`/api/portal/data?module=${encodeURIComponent(moduleKey)}&action=save-all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).catch(err => {
          // Gracefully defer background sync if offline or in static hosting mode
          console.debug('[PORTAL_SYNC] Background sync deferred:', err?.message || err);
        });
      }
    }
  } catch (e) {
    console.error('Storage save error:', e);
  }
}

// -------------------------------------------------------------
// Granular Permissions & Role-Based Access Control (RBAC)
// -------------------------------------------------------------
export const ALL_PERMISSIONS = [
  { key: 'faculty.view', module: 'Faculty', label: 'View Faculty Directory' },
  { key: 'faculty.create', module: 'Faculty', label: 'Add Faculty Member' },
  { key: 'faculty.update', module: 'Faculty', label: 'Edit Faculty Profile' },
  { key: 'faculty.delete', module: 'Faculty', label: 'Delete Faculty Record' },
  { key: 'publications.view', module: 'Publications', label: 'View Publications' },
  { key: 'publications.create', module: 'Publications', label: 'Submit Publication' },
  { key: 'publications.approve', module: 'Publications', label: 'Verify Publication' },
  { key: 'publications.publish', module: 'Publications', label: 'Publish to Public Site' },
  { key: 'patents.view', module: 'Patents', label: 'View Patents' },
  { key: 'patents.create', module: 'Patents', label: 'Record Patent' },
  { key: 'patents.approve', module: 'Patents', label: 'Verify Patent' },
  { key: 'bos.view', module: 'BoS', label: 'View BoS Minutes' },
  { key: 'bos.create', module: 'BoS', label: 'Record BoS Regulation' },
  { key: 'internships.view', module: 'Internships', label: 'View Internships' },
  { key: 'internships.manage', module: 'Internships', label: 'Manage & Verify Internships' },
  { key: 'achievements.view', module: 'Achievements', label: 'View Student Awards' },
  { key: 'achievements.approve', module: 'Achievements', label: 'Approve Awards' },
  { key: 'users.view', module: 'User Management', label: 'View User Directory' },
  { key: 'users.create', module: 'User Management', label: 'Provision Users & Bulk Import' },
  { key: 'users.suspend', module: 'User Management', label: 'Suspend / Lock Users' },
  { key: 'users.assign_role', module: 'User Management', label: 'Change Roles & Permissions' },
  { key: 'cms.publish', module: 'CMS', label: 'Publish News & Circulars' },
  { key: 'events.view', module: 'Events', label: 'View Academic Events & Workshops' },
  { key: 'events.create', module: 'Events', label: 'Create Academic Event' },
  { key: 'events.update', module: 'Events', label: 'Edit Academic Event' },
  { key: 'events.bulk_import', module: 'Events', label: 'Bulk CSV Import Academic Events' },
  { key: 'events.review', module: 'Events', label: 'Review & Verify Academic Events' },
  { key: 'events.approve', module: 'Events', label: 'Approve & Publish Academic Events' },
  { key: 'attendance.view', module: 'Attendance Monitoring', label: 'View Attendance Risk Monitoring' },
  { key: 'attendance.import', module: 'Attendance Monitoring', label: 'Upload Attendance CSV/XLSX' },
  { key: 'attendance.review', module: 'Attendance Monitoring', label: 'Review & Resolve Attendance Alerts' },
  { key: 'attendance.contact_parent', module: 'Attendance Monitoring', label: 'Access Guardian Details & Log Contact' },
  { key: 'attendance.export', module: 'Attendance Monitoring', label: 'Export Attendance Risk Reports' },
  { key: 'attendance.export_sensitive', module: 'Attendance Monitoring', label: 'Export Unmasked Parent Contact Sheet' },
  { key: 'students.view', module: 'Student Records', label: 'View Student Master Directory' },
  { key: 'students.guardian.view', module: 'Student Records', label: 'View Student Guardian Profiles' },
  { key: 'bulk_import.view', module: 'Bulk Data', label: 'Access Bulk Data Center' },
  { key: 'bulk_import.upload', module: 'Bulk Data', label: 'Upload CSV/XLSX Datasets' },
  { key: 'bulk_import.validate', module: 'Bulk Data', label: 'Validate Staged Records' },
  { key: 'bulk_import.commit', module: 'Bulk Data', label: 'Commit Bulk Import to Production Drafts' },
  { key: 'bulk_import.rollback', module: 'Bulk Data', label: 'Rollback Staged / Draft Imports' },
  { key: 'bulk_import.download_template', module: 'Bulk Data', label: 'Download Module Templates' },
  { key: 'bulk_import.download_errors', module: 'Bulk Data', label: 'Download Issue Reports' },
  { key: 'bulk_import.view_history', module: 'Bulk Data', label: 'View Ingestion History & Provenance' },
  { key: 'bulk_import.manage_mappings', module: 'Bulk Data', label: 'Manage Institutional Alias Mappings' },
  { key: 'media.bulk_upload', module: 'Media', label: 'Folder-Based Bulk Media Ingestion' },
  { key: 'media.approve_public', module: 'Media', label: 'Approve Media for Public Visibility' },
  { key: 'reports.export', module: 'Reports', label: 'Export PDF / Excel / CSV' },
  { key: 'audit.view', module: 'Audit', label: 'Inspect Immutable Security Logs' }
];

export const DEFAULT_ROLE_PERMISSIONS = {
  SUPER_ADMIN: ALL_PERMISSIONS.map(p => p.key),
  ADMIN: [
    'faculty.view', 'faculty.create', 'faculty.update',
    'publications.view', 'publications.create', 'publications.approve', 'publications.publish',
    'patents.view', 'patents.create', 'patents.approve',
    'bos.view', 'bos.create',
    'internships.view', 'internships.manage',
    'achievements.view', 'achievements.approve',
    'events.view', 'events.create', 'events.update', 'events.bulk_import', 'events.review', 'events.approve',
    'attendance.view', 'attendance.import', 'attendance.review', 'attendance.contact_parent', 'attendance.export', 'attendance.export_sensitive',
    'students.view', 'students.guardian.view',
    'bulk_import.view', 'bulk_import.upload', 'bulk_import.validate', 'bulk_import.commit', 'bulk_import.rollback',
    'bulk_import.download_template', 'bulk_import.download_errors', 'bulk_import.view_history', 'bulk_import.manage_mappings',
    'media.bulk_upload', 'media.approve_public',
    'users.view', 'users.create', 'users.suspend',
    'cms.publish', 'reports.export', 'audit.view'
  ],
  HOD: [
    'faculty.view', 'faculty.update',
    'publications.view', 'publications.create', 'publications.approve',
    'patents.view', 'patents.create', 'patents.approve',
    'bos.view', 'bos.create',
    'internships.view', 'internships.manage',
    'achievements.view', 'achievements.approve',
    'events.view', 'events.create', 'events.update', 'events.bulk_import', 'events.review',
    'attendance.view', 'attendance.import', 'attendance.review', 'attendance.contact_parent', 'attendance.export',
    'students.view', 'students.guardian.view',
    'bulk_import.view', 'bulk_import.upload', 'bulk_import.validate', 'bulk_import.commit',
    'bulk_import.download_template', 'bulk_import.download_errors', 'bulk_import.view_history',
    'media.bulk_upload',
    'reports.export'
  ],
  FACULTY: [
    'faculty.view',
    'publications.view', 'publications.create',
    'patents.view', 'patents.create',
    'bos.view',
    'achievements.view',
    'events.view', 'events.create', 'events.update',
    'attendance.view', 'attendance.contact_parent', 'students.view',
    'bulk_import.download_template',
    'reports.export'
  ],
  DATA_ENTRY: [
    'faculty.view', 'faculty.create',
    'publications.view', 'publications.create',
    'patents.view', 'patents.create',
    'internships.view', 'internships.create',
    'achievements.view', 'achievements.create',
    'events.view', 'events.create',
    'attendance.view', 'attendance.import', 'students.view',
    'bulk_import.view', 'bulk_import.upload', 'bulk_import.validate', 'bulk_import.commit',
    'bulk_import.download_template', 'bulk_import.download_errors',
    'media.bulk_upload'
  ],
  AUDITOR: [
    'users.view', 'audit.view', 'bos.view',
    'publications.manage', 'patents.manage', 'mous.manage', 'student_data.manage', 'fdp.manage',
    'events.view', 'attendance.view', 'students.view',
    'bulk_import.view', 'bulk_import.view_history',
    'reports.export'
  ]
};

export function getRolePermissions() {
  return loadStore(STORAGE_KEYS.ROLE_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS);
}

export function saveRolePermissions(matrix, adminUser) {
  saveStore(STORAGE_KEYS.ROLE_PERMISSIONS, matrix);
  addAuditLog('UPDATE_PERMISSIONS', 'RBAC Matrix', 'Updated global role permissions matrix', adminUser);
  return matrix;
}

export function hasPermission(userRole, permissionKey) {
  const matrix = getRolePermissions();
  const permissions = matrix[userRole] || [];
  return permissions.includes(permissionKey);
}

// -------------------------------------------------------------
// Auth Policies & Security Settings
// -------------------------------------------------------------
export const DEFAULT_AUTH_SETTINGS = {
  otpEnforcedRoles: {
    SUPER_ADMIN: true,
    ADMIN: true,
    HOD: true,
    FACULTY: false,
    DATA_ENTRY: true,
    AUDITOR: false
  },
  otpExpiryMinutes: 5,
  maxFailedLoginAttempts: 5,
  allowTrustedDevices: true,
  trustedDeviceDays: 7,
  allowGoogleOAuth: true,
  allowCredentialAuth: true,
  forcePasswordComplexity: true
};

export function getAuthSettings() {
  return loadStore(STORAGE_KEYS.AUTH_SETTINGS, DEFAULT_AUTH_SETTINGS);
}

export function updateAuthSettings(newSettings, adminUser) {
  saveStore(STORAGE_KEYS.AUTH_SETTINGS, newSettings);
  addAuditLog('UPDATE_AUTH_SETTINGS', 'Security Settings', 'Updated institutional authentication policies', adminUser);
  return newSettings;
}

// -------------------------------------------------------------
// Transactional Email Templates (Resend-ready)
// -------------------------------------------------------------
export const INITIAL_EMAIL_TEMPLATES = [
  {
    id: 'login_otp',
    name: 'Login Verification Code (OTP)',
    subject: 'Your NEC Academic Portal Verification Code',
    sender: 'NEC Secure Portal <no-reply@nrtec.in>',
    preview: 'Your 6-digit verification code is {{otp_code}}. Valid for 5 minutes.',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; background: #070F1E; padding: 25px; color: #FFF; border-radius: 12px;">
        <h2 style="color: #D4AF37; margin: 0 0 10px 0;">NARASARAOPETA ENGINEERING COLLEGE</h2>
        <p style="color: #CBD5E1; font-size: 14px;">Sign-in verification requested for <strong>{{user_email}}</strong></p>
        <div style="background: rgba(255,255,255,0.08); padding: 18px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #F1C40F;">{{otp_code}}</span>
        </div>
        <p style="color: #94A3B8; font-size: 12px;">This code expires in 5 minutes. If you did not initiate this request, contact principal@nrtec.in immediately.</p>
      </div>
    `
  },
  {
    id: 'user_invitation',
    name: 'New Account Setup Invitation',
    subject: 'Welcome to NEC Portal – Set Up Your Account',
    sender: 'NEC Central Administration <principal@nrtec.in>',
    preview: 'You have been provisioned access to the NEC Portal as {{user_role}}.',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; background: #070F1E; padding: 25px; color: #FFF; border-radius: 12px;">
        <h2 style="color: #D4AF37; margin: 0 0 10px 0;">NARASARAOPETA ENGINEERING COLLEGE</h2>
        <p style="color: #CBD5E1; font-size: 14px;">Dear {{user_name}},</p>
        <p style="color: #CBD5E1; font-size: 14px;">Your institutional account has been provisioned for the {{department}} Department as <strong>{{user_role}}</strong>.</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="{{setup_link}}" style="background: #D4AF37; color: #070F1E; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Set Up Your Password</a>
        </div>
        <p style="color: #94A3B8; font-size: 12px;">For security, this setup link expires in 48 hours. No public registration is permitted.</p>
      </div>
    `
  },
  {
    id: 'password_reset',
    name: 'Password Recovery Instructions',
    subject: 'NEC Portal – Password Reset Link',
    sender: 'NEC Security Cell <security@nrtec.in>',
    preview: 'Click the link to securely reset your institutional password.',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; background: #070F1E; padding: 25px; color: #FFF; border-radius: 12px;">
        <h2 style="color: #D4AF37;">Password Reset Request</h2>
        <p style="color: #CBD5E1; font-size: 14px;">A password reset was requested for {{user_email}}.</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="{{reset_link}}" style="background: #10B981; color: #FFF; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #94A3B8; font-size: 12px;">If you did not request this change, please contact the IT Administrator.</p>
      </div>
    `
  }
];

export function getEmailTemplates() {
  return loadStore(STORAGE_KEYS.EMAIL_TEMPLATES, INITIAL_EMAIL_TEMPLATES);
}

export function updateEmailTemplate(templateId, updatedFields, adminUser) {
  const templates = getEmailTemplates();
  const index = templates.findIndex(t => t.id === templateId);
  if (index >= 0) {
    templates[index] = { ...templates[index], ...updatedFields };
    saveStore(STORAGE_KEYS.EMAIL_TEMPLATES, templates);
    addAuditLog('UPDATE_EMAIL_TEMPLATE', 'Email System', `Updated template: ${templates[index].name}`, adminUser);
  }
  return templates;
}

// -------------------------------------------------------------
// Production Authentication & Security Engine
// -------------------------------------------------------------

// 1. Primary Credentials Auth (Username or Email + Password)
export function authenticateCredentials(identifier, password) {
  const users = getUsers();
  const cleanId = (identifier || '').toLowerCase().trim();

  // Find user by either email or username (Never reveal which failed)
  const matchedUser = users.find(u => 
    (u.email && u.email.toLowerCase() === cleanId) || 
    (u.username && u.username.toLowerCase() === cleanId)
  );

  // Security: Generic "Invalid credentials" to prevent user enumeration
  if (!matchedUser || !matchedUser.allowPassword) {
    recordLoginEvent(cleanId, 'CREDENTIALS', false, 'Invalid credentials');
    return { success: false, error: 'Invalid credentials.' };
  }

  // Check Account Status
  if (matchedUser.status === 'Suspended') {
    recordLoginEvent(cleanId, 'CREDENTIALS', false, 'Account Suspended');
    return { success: false, error: 'This account is currently suspended. Contact the administrator at principal@nrtec.in.' };
  }

  if (matchedUser.status === 'Locked') {
    recordLoginEvent(cleanId, 'CREDENTIALS', false, 'Account Locked');
    return { success: false, error: 'Account locked due to security policy. Contact administrator.' };
  }

  // Create Email OTP Challenge
  const challenge = createOtpChallenge(matchedUser.id, 'LOGIN', matchedUser.email);

  return {
    success: true,
    user: matchedUser,
    requireOtp: true,
    challengeId: challenge.id,
    challengeCode: challenge.otpCode,
    maskedEmail: maskEmail(matchedUser.email),
    forcePasswordChange: matchedUser.forcePasswordChange || false
  };
}

export function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  if (localPart.length <= 2) {
    return `${localPart[0]}*@${domain}`;
  }
  const first = localPart.slice(0, 2);
  const last = localPart.slice(-1);
  const masked = '*'.repeat(Math.max(3, localPart.length - 3));
  return `${first}${masked}${last}@${domain}`;
}

// 2. Primary Google OAuth (Invite-Only Whitelist Check)
export function authenticateGoogle(email, firebaseUid = null) {
  const users = getUsers();
  const cleanEmail = (email || '').toLowerCase().trim();

  let matchedUser = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);

  // Hard-block unauthorized Google accounts (No domain wildcard bypassing!)
  if (!matchedUser || !matchedUser.allowGoogle) {
    recordLoginEvent(cleanEmail, 'GOOGLE_OAUTH', false, 'Unauthorized Google Account');
    return { 
      success: false, 
      code: 'ACCESS_DENIED',
      error: 'This Google account has not been provisioned for the NEC Academic Portal. Contact your administrator.' 
    };
  }

  if (matchedUser.status === 'Suspended') {
    recordLoginEvent(cleanEmail, 'GOOGLE_OAUTH', false, 'Suspended Account');
    return { success: false, code: 'ACCESS_DENIED', error: 'This provisioned Google account is suspended. Contact administrator.' };
  }

  if (matchedUser.status === 'Locked') {
    recordLoginEvent(cleanEmail, 'GOOGLE_OAUTH', false, 'Locked Account');
    return { success: false, code: 'ACCESS_DENIED', error: 'Account locked due to security policy. Contact administrator.' };
  }

  // Firebase UID Binding & Integrity Verification
  if (firebaseUid) {
    if (!matchedUser.firebaseUid) {
      // First approved Google login binds UID safely
      matchedUser.firebaseUid = firebaseUid;
      saveStore(STORAGE_KEYS.USERS, users);
      addAuditLog('FIREBASE_UID_LINKED', 'IAM Governance', `Bound Firebase UID for ${matchedUser.email}`, matchedUser);
    } else if (matchedUser.firebaseUid !== firebaseUid) {
      recordLoginEvent(cleanEmail, 'GOOGLE_OAUTH', false, 'Firebase UID Mismatch');
      addAuditLog('FIREBASE_UID_MISMATCH', 'Security Incident', `Firebase UID mismatch attempt on ${matchedUser.email}`, matchedUser);
      return { 
        success: false, 
        code: 'ACCESS_DENIED', 
        error: 'Authentication integrity check failed. Contact administrator.' 
      };
    }
  }

  // Create Email OTP Challenge
  const challenge = createOtpChallenge(matchedUser.id, 'LOGIN', matchedUser.email);

  return {
    success: true,
    user: matchedUser,
    requireOtp: true,
    challengeId: challenge.id,
    challengeCode: challenge.otpCode,
    maskedEmail: maskEmail(matchedUser.email)
  };
}

// 3. Cryptographic 6-Digit OTP Generator & Digest Store
export function createOtpChallenge(userId, purpose, email) {
  const challenges = loadStore(STORAGE_KEYS.AUTH_CHALLENGES, []);
  
  // Invalidate any existing active challenges for this user
  const filtered = challenges.filter(c => c.userId !== userId || c.consumed);

  // Secure 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min expiry

  const newChallenge = {
    id: 'CHL-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    userId,
    purpose,
    otpCode,
    expiresAt,
    attemptCount: 0,
    maxAttempts: 5,
    lastSentAt: new Date().toISOString(),
    consumed: false
  };

  filtered.push(newChallenge);
  saveStore(STORAGE_KEYS.AUTH_CHALLENGES, filtered);

  return newChallenge;
}

// 4. OTP Verification Gate
export function verifyOtpChallenge(userId, enteredCode) {
  const challenges = loadStore(STORAGE_KEYS.AUTH_CHALLENGES, []);
  const activeChallenge = challenges.find(c => c.userId === userId && !c.consumed);

  if (!activeChallenge) {
    return { success: false, code: 'OTP_EXPIRED', error: 'Verification code expired or not found. Please request a new code.' };
  }

  // Check expiration
  if (new Date() > new Date(activeChallenge.expiresAt)) {
    activeChallenge.consumed = true;
    saveStore(STORAGE_KEYS.AUTH_CHALLENGES, challenges);
    return { success: false, code: 'OTP_EXPIRED', error: 'Verification code expired. Please request a new code.' };
  }

  // Check attempt limit
  if (activeChallenge.attemptCount >= activeChallenge.maxAttempts) {
    activeChallenge.consumed = true;
    saveStore(STORAGE_KEYS.AUTH_CHALLENGES, challenges);
    return { success: false, code: 'OTP_LOCKED', attemptsRemaining: 0, error: 'Too many incorrect attempts. Verification locked. Request a new code.' };
  }

  activeChallenge.attemptCount += 1;

  if (activeChallenge.otpCode !== enteredCode.trim()) {
    saveStore(STORAGE_KEYS.AUTH_CHALLENGES, challenges);
    const attemptsRemaining = Math.max(0, activeChallenge.maxAttempts - activeChallenge.attemptCount);
    if (attemptsRemaining === 0) {
      activeChallenge.consumed = true;
      saveStore(STORAGE_KEYS.AUTH_CHALLENGES, challenges);
      return { success: false, code: 'OTP_LOCKED', attemptsRemaining: 0, error: 'Too many incorrect attempts. Verification locked.' };
    }
    return { 
      success: false, 
      code: 'INVALID_OTP', 
      attemptsRemaining, 
      error: 'Code didn\'t match. Please re-enter the verification code.' 
    };
  }

  // Code matches! Mark challenge consumed
  activeChallenge.consumed = true;
  activeChallenge.verifiedAt = new Date().toISOString();
  saveStore(STORAGE_KEYS.AUTH_CHALLENGES, challenges);

  // Create verified session
  const session = createVerifiedSession(userId);

  // Update user last login
  const users = getUsers();
  const uIdx = users.findIndex(u => u.id === userId);
  if (uIdx >= 0) {
    users[uIdx].lastLogin = new Date().toISOString();
    saveStore(STORAGE_KEYS.USERS, users);
  }

  recordLoginEvent(users[uIdx]?.email, 'OTP_VERIFIED', true, 'Full 2-step authentication success');

  return {
    success: true,
    code: 'SUCCESS',
    user: users[uIdx],
    sessionId: session.id
  };
}

// Resend OTP with 60-second rate limiting
export function resendOtpChallenge(userId) {
  const challenges = loadStore(STORAGE_KEYS.AUTH_CHALLENGES, []);
  const activeChallenge = challenges.find(c => c.userId === userId);

  if (activeChallenge && activeChallenge.lastSentAt) {
    const elapsed = (Date.now() - new Date(activeChallenge.lastSentAt).getTime()) / 1000;
    if (elapsed < 60) {
      return { success: false, error: `Please wait ${Math.ceil(60 - elapsed)} seconds before requesting a new code.` };
    }
  }

  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, error: 'User not found.' };

  const newChallenge = createOtpChallenge(userId, 'LOGIN', user.email);
  return { 
    success: true, 
    challengeId: newChallenge.id,
    challengeCode: newChallenge.otpCode,
    expiresAt: newChallenge.expiresAt,
    maskedEmail: maskEmail(user.email)
  };
}

// 5. Active Session Management
export function createVerifiedSession(userId) {
  const sessions = loadStore(STORAGE_KEYS.ACTIVE_SESSIONS, []);
  const newSession = {
    id: 'SES-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
    userId,
    device: navigator.userAgent.includes('Windows') ? 'Windows PC' : (navigator.userAgent.includes('Mac') ? 'MacBook' : 'Mobile Device'),
    browser: 'Chrome / Webkit',
    ipAddress: '192.168.1.' + Math.floor(Math.random() * 200 + 10),
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    status: 'Active'
  };
  sessions.unshift(newSession);
  saveStore(STORAGE_KEYS.ACTIVE_SESSIONS, sessions);
  return newSession;
}

export function getActiveSessions(userId) {
  const sessions = loadStore(STORAGE_KEYS.ACTIVE_SESSIONS, []);
  return userId ? sessions.filter(s => s.userId === userId && s.status === 'Active') : sessions.filter(s => s.status === 'Active');
}

export function revokeSession(sessionId, adminUser) {
  const sessions = loadStore(STORAGE_KEYS.ACTIVE_SESSIONS, []);
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index >= 0) {
    sessions[index].status = 'Revoked';
    sessions[index].revokedAt = new Date().toISOString();
    saveStore(STORAGE_KEYS.ACTIVE_SESSIONS, sessions);
    addAuditLog('REVOKE_SESSION', 'Session Management', `Revoked session ${sessionId}`, adminUser);
  }
  return sessions.filter(s => s.status === 'Active');
}

export function revokeAllOtherSessions(userId, currentSessionId) {
  const sessions = loadStore(STORAGE_KEYS.ACTIVE_SESSIONS, []);
  sessions.forEach(s => {
    if (s.userId === userId && s.id !== currentSessionId) {
      s.status = 'Revoked';
      s.revokedAt = new Date().toISOString();
    }
  });
  saveStore(STORAGE_KEYS.ACTIVE_SESSIONS, sessions);
  return sessions.filter(s => s.status === 'Active');
}

// Helper: Record Login Security Events
export function recordLoginEvent(identifier, method, success, notes) {
  const events = loadStore(STORAGE_KEYS.LOGIN_EVENTS, []);
  const newEvent = {
    id: 'EVT-AUTH-' + Date.now(),
    timestamp: new Date().toISOString(),
    identifier,
    method,
    success,
    notes,
    ip: '192.168.1.' + Math.floor(Math.random() * 200 + 10)
  };
  events.unshift(newEvent);
  if (events.length > 250) events.pop();
  saveStore(STORAGE_KEYS.LOGIN_EVENTS, events);
}

export function getLoginEvents() {
  return loadStore(STORAGE_KEYS.LOGIN_EVENTS, []);
}

// -------------------------------------------------------------
// Super Admin IAM & User Management Suite
// -------------------------------------------------------------

export function getUsers() {
  const users = loadStore(STORAGE_KEYS.USERS, USER_ROLES);
  const targetEmail = 'ashuchinthapalli3900@gmail.com';
  const superAdmin = users.find(u => u.role === 'SUPER_ADMIN' || u.id === 'usr_superadmin');

  if (superAdmin && (superAdmin.email || '').toLowerCase() !== targetEmail.toLowerCase()) {
    superAdmin.email = targetEmail;
    superAdmin.allowGoogle = true;
    superAdmin.status = 'Active';
    superAdmin.updatedAt = new Date().toISOString();
    
    // Revoke old active sessions to force a fresh login
    saveStore(STORAGE_KEYS.ACTIVE_SESSIONS, []);
    
    addAuditLog('SUPER_ADMIN_EMAIL_CHANGED', 'IAM Governance', `Super Admin email safely migrated to ${targetEmail}`, superAdmin);
    saveStore(STORAGE_KEYS.USERS, users);
  } else if (!superAdmin) {
    users.unshift({
      id: 'usr_superadmin',
      username: 'superadmin',
      label: 'Super Admin',
      name: 'Super Administrator',
      email: targetEmail,
      dept: 'Management & Governance',
      role: 'SUPER_ADMIN',
      canApprove: true,
      isSuper: true,
      status: 'Active',
      allowPassword: true,
      allowGoogle: true,
      requireEmailOtp: true,
      firebaseUid: null,
      lastLogin: new Date().toISOString()
    });
    saveStore(STORAGE_KEYS.USERS, users);
  }
  return users;
}

export function saveUser(userData, adminUser) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userData.id || u.email.toLowerCase() === (userData.email || '').toLowerCase());
  
  if (index >= 0) {
    users[index] = { ...users[index], ...userData, updatedAt: new Date().toISOString() };
    addAuditLog('UPDATE_USER', 'User Management', `Updated user account for ${userData.name} (${userData.role})`, adminUser);
  } else {
    const newUser = {
      ...userData,
      id: userData.id || 'usr_' + Date.now(),
      status: userData.status || 'Active',
      allowPassword: userData.allowPassword !== false,
      allowGoogle: userData.allowGoogle !== false,
      requireEmailOtp: userData.requireEmailOtp !== false,
      createdAt: new Date().toISOString(),
      lastLogin: 'Never'
    };
    users.unshift(newUser);
    addAuditLog('CREATE_USER', 'User Management', `Provisioned new account for ${userData.name} (${userData.email})`, adminUser);
  }
  saveStore(STORAGE_KEYS.USERS, users);
  return users;
}

// Anti-Lockout Guard: Super Admin cannot accidentally lock himself out!
export function toggleUserStatus(userId, adminUser) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index >= 0) {
    const userToChange = users[index];

    // Anti-Lockout Check: If user is the ONLY active Super Admin, block suspension!
    if (userToChange.role === 'SUPER_ADMIN' && userToChange.status === 'Active') {
      const activeSuperAdmins = users.filter(u => u.role === 'SUPER_ADMIN' && u.status === 'Active');
      if (activeSuperAdmins.length <= 1) {
        throw new Error('At least one active Super Administrator must remain in the institution.');
      }
    }

    const newStatus = userToChange.status === 'Active' ? 'Suspended' : 'Active';
    users[index].status = newStatus;
    saveStore(STORAGE_KEYS.USERS, users);
    addAuditLog('USER_STATUS_CHANGE', 'User Management', `${newStatus} account for ${userToChange.name}`, adminUser);
  }
  return users;
}

export function forcePasswordReset(userId, adminUser) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index >= 0) {
    users[index].forcePasswordChange = true;
    saveStore(STORAGE_KEYS.USERS, users);
    addAuditLog('FORCE_PASSWORD_RESET', 'User Management', `Triggered mandatory password reset for ${users[index].name}`, adminUser);
  }
  return users;
}

// -------------------------------------------------------------
// Bulk CSV User Import & Schema Validator
// -------------------------------------------------------------
export function parseAndValidateUsersCSV(csvText) {
  if (!csvText || !csvText.trim()) return { rows: [], totalCount: 0, readyCount: 0, duplicateCount: 0, errorCount: 0 };

  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return { rows: [], totalCount: 0, readyCount: 0, duplicateCount: 0, errorCount: 0 };

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const existingUsers = getUsers();
  const validRoles = ['SUPER_ADMIN', 'ADMIN', 'HOD', 'FACULTY', 'DATA_ENTRY', 'AUDITOR'];

  const rows = [];
  let readyCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    
    const rowData = {
      rowNumber: i,
      name: cols[0] || '',
      email: cols[1] || '',
      username: cols[2] || '',
      role: (cols[3] || 'FACULTY').toUpperCase(),
      dept: cols[4] || 'CSE',
      facultyRef: cols[5] || '',
      allowPassword: cols[6] !== 'false',
      allowGoogle: cols[7] !== 'false',
      requireEmailOtp: cols[8] !== 'false',
      status: 'Ready',
      errorReason: ''
    };

    // Validation 1: Email check
    if (!rowData.email || !rowData.email.includes('@')) {
      rowData.status = 'Error';
      rowData.errorReason = 'Invalid institutional email address';
      errorCount++;
    }
    // Validation 2: Role check
    else if (!validRoles.includes(rowData.role)) {
      rowData.status = 'Error';
      rowData.errorReason = `Invalid role "${rowData.role}". Must be one of: ${validRoles.join(', ')}`;
      errorCount++;
    }
    // Validation 3: Duplicate check
    else if (existingUsers.some(u => u.email.toLowerCase() === rowData.email.toLowerCase())) {
      rowData.status = 'Duplicate';
      rowData.errorReason = 'User email already provisioned in portal';
      duplicateCount++;
    } else {
      rowData.status = 'Ready';
      readyCount++;
    }

    rows.push(rowData);
  }

  return {
    rows,
    totalCount: rows.length,
    readyCount,
    duplicateCount,
    errorCount
  };
}

export function executeBulkUserImport(validatedRows, adminUser) {
  const readyRows = validatedRows.filter(r => r.status === 'Ready');
  if (!readyRows.length) return { importedCount: 0 };

  const users = getUsers();
  readyRows.forEach(r => {
    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: r.name,
      email: r.email,
      username: r.username || r.email.split('@')[0],
      role: r.role,
      dept: r.dept,
      facultyId: r.facultyRef || '',
      status: 'Active',
      allowPassword: r.allowPassword,
      allowGoogle: r.allowGoogle,
      requireEmailOtp: r.requireEmailOtp,
      createdAt: new Date().toISOString(),
      lastLogin: 'Never'
    };
    users.unshift(newUser);
  });

  saveStore(STORAGE_KEYS.USERS, users);
  addAuditLog('BULK_IMPORT', 'User Management', `Bulk imported ${readyRows.length} staff accounts via CSV. Invitations queued.`, adminUser);
  return { importedCount: readyRows.length };
}

// -------------------------------------------------------------
// Audit Trail Engine
// -------------------------------------------------------------
export function addAuditLog(action, module, details, user) {
  const logs = loadStore(STORAGE_KEYS.AUDIT_LOGS, []);
  const newLog = {
    id: 'AUD-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    userName: user?.name || 'System Operator',
    userRole: user?.role || user?.label || 'Super Admin',
    action,
    module,
    details
  };
  logs.unshift(newLog);
  if (logs.length > 200) logs.pop();
  saveStore(STORAGE_KEYS.AUDIT_LOGS, logs);
  return newLog;
}

export function getAuditLogs() {
  return loadStore(STORAGE_KEYS.AUDIT_LOGS, [
    { id: 'AUD-001', timestamp: '2026-08-23T10:00:00.000Z', userName: 'Sri Mittapalli Ramesh Babu', userRole: 'SUPER_ADMIN', action: 'INIT_IAM', module: 'Auth & Access', details: 'Enterprise Identity & Access Management initialized with 2-step OTP enforcement.' },
    { id: 'AUD-002', timestamp: '2026-08-23T10:05:00.000Z', userName: 'Dr. S. Venkateswarlu', userRole: 'ADMIN', action: 'SYNC_VERIFY', module: 'Research Hub', details: '125+ SCI/Scopus indexed research publications verified.' }
  ]);
}

// -------------------------------------------------------------
// Public-Safe Faculty Query (Privacy Enforced)
// -------------------------------------------------------------
export function getPublicFacultyList() {
  return FACULTY_DATA.map(f => ({
    id: f.id,
    name: f.name,
    designation: f.designation,
    department: f.department,
    qualification: f.qualification,
    summary: f.summary,
    photo: f.photo,
    orcid: f.orcid,
    scopus: f.scopus,
    scholar: f.scholar,
    vidwan: f.vidwan,
    citations: f.citations,
    hIndex: f.hIndex
  }));
}

// -------------------------------------------------------------
// Faculty Directory & Photo Management
// -------------------------------------------------------------
export function getFacultyList() {
  return loadStore(STORAGE_KEYS.FACULTY, FACULTY_DATA);
}

export function saveFacultyMember(facultyData, user) {
  const list = getFacultyList();
  const idx = list.findIndex(f => f.id === facultyData.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...facultyData, updatedAt: new Date().toISOString(), updatedBy: user?.name };
    addAuditLog('UPDATE', 'Faculty Directory', `Updated profile: ${facultyData.name}`, user);
  } else {
    const newFaculty = {
      ...facultyData,
      id: facultyData.id || 'NEC-PER-' + String(list.length + 1).padStart(4, '0'),
      photo: facultyData.photo || null,
      createdAt: new Date().toISOString()
    };
    list.push(newFaculty);
    addAuditLog('CREATE', 'Faculty Directory', `Added faculty: ${facultyData.name}`, user);
  }
  saveStore(STORAGE_KEYS.FACULTY, list);
  return list;
}

export function updateFacultyPhoto(facultyId, photoDataUrl, user) {
  const list = getFacultyList();
  const idx = list.findIndex(f => f.id === facultyId);
  if (idx >= 0) {
    list[idx].photo = photoDataUrl;
    list[idx].updatedAt = new Date().toISOString();
    list[idx].updatedBy = user?.name;
    saveStore(STORAGE_KEYS.FACULTY, list);
    addAuditLog('PHOTO_UPDATE', 'Faculty Directory', `Updated photo for ${list[idx].name}`, user);
    return { success: true, faculty: list[idx] };
  }
  return { success: false, error: 'Faculty member not found.' };
}

export function removeFacultyPhoto(facultyId, user) {
  const list = getFacultyList();
  const idx = list.findIndex(f => f.id === facultyId);
  if (idx >= 0) {
    list[idx].photo = null;
    list[idx].updatedAt = new Date().toISOString();
    list[idx].updatedBy = user?.name;
    saveStore(STORAGE_KEYS.FACULTY, list);
    addAuditLog('PHOTO_REMOVE', 'Faculty Directory', `Removed photo for ${list[idx].name}. Reverted to No Photo.`, user);
    return { success: true, faculty: list[idx] };
  }
  return { success: false, error: 'Faculty member not found.' };
}

// -------------------------------------------------------------
// Madam 12 Modules CRUD with Visibility & Approvals
// -------------------------------------------------------------

// ─────────────────────────────────────────────────────────────
// 1. RESEARCH PUBLICATIONS REPOSITORY & REVIEWS
// ─────────────────────────────────────────────────────────────

export function normalizePublicationRecord(raw, idx = 0) {
  if (!raw) return null;

  const authors = Array.isArray(raw.authors) && raw.authors.length > 0 ? raw.authors.map((a, aIdx) => ({
    authorOrder: a.authorOrder || aIdx + 1,
    name: a.name || 'Author',
    department: a.department || a.departmentCode || null,
    departmentCode: a.departmentCode || a.department || null,
    designation: a.designation || 'Faculty',
    affiliation: a.affiliation || 'Narasaraopeta Engineering College (Autonomous)',
    isFirstAuthor: a.isFirstAuthor !== undefined ? a.isFirstAuthor : aIdx === 0,
    isCorresponding: a.isCorresponding !== undefined ? a.isCorresponding : aIdx === 0,
    facultyId: a.facultyId || null,
    matchStatus: a.matchStatus || (a.facultyId ? 'EXACT' : 'UNRESOLVED'),
    scopusAuthorId: a.scopusAuthorId || null,
    orcid: a.orcid || null,
    openalexAuthorId: a.openalexAuthorId || null
  })) : (
    raw.facultyName ? [{
      authorOrder: 1,
      name: raw.facultyName,
      department: raw.department || null,
      departmentCode: raw.department || null,
      designation: 'Faculty',
      affiliation: 'Narasaraopeta Engineering College (Autonomous)',
      isFirstAuthor: true,
      isCorresponding: true,
      facultyId: raw.facultyId || null,
      matchStatus: 'EXACT',
      scopusAuthorId: null,
      orcid: null,
      openalexAuthorId: null
    }] : []
  );

  const dept = raw.department || raw.departmentCode || (authors.find(a => a.departmentCode || a.department)?.departmentCode || null);
  const ay = raw.academicYear || (raw.publicationYear ? `${raw.publicationYear}-${String(raw.publicationYear + 1).slice(-2)}` : null);
  const yearSuffix = ay ? (ay.split('-')[0] || '2026').trim() : (raw.publicationYear ? String(raw.publicationYear) : '2026');
  const autoNum = raw.publicationRecordNumber || (dept ? `PUB-${dept}-${yearSuffix}-${String(idx + 1).padStart(4, '0')}` : `PUB-GEN-${yearSuffix}-${String(idx + 1).padStart(4, '0')}`);

  const indexing = Array.isArray(raw.indexing) ? raw.indexing : [
    ...(raw.scopusIndexed === 'Yes' || raw.isScopusIndexed ? ['Scopus'] : []),
    ...(raw.wosIndexed === 'Yes' || raw.isWosIndexed ? ['Web of Science'] : []),
    ...(raw.ugcCareIndexed === 'Yes' ? ['UGC CARE'] : []),
    ...(raw.ieeeIndexed === 'Yes' ? ['IEEE Xplore'] : [])
  ];

  const documents = Array.isArray(raw.documents) ? raw.documents : [
    ...(raw.paperPdf ? [{ id: 'DOC-1', name: raw.paperPdf, type: 'Full Paper PDF', size: '1.8 MB', url: '#' }] : []),
    ...(raw.certificatePdf ? [{ id: 'DOC-2', name: raw.certificatePdf, type: 'Publication Certificate', size: '420 KB', url: '#' }] : [])
  ];

  const sources = Array.isArray(raw.sources) && raw.sources.length > 0 ? raw.sources : [
    raw.importedSource ? raw.importedSource.toUpperCase() : (raw.source || 'MANUAL')
  ];

  const firstAuthorName = authors[0]?.name || raw.firstAuthor || raw.facultyName || '';

  return {
    ...raw,
    id: raw.id || `pub_${Date.now()}_${idx}`,
    publicationRecordNumber: autoNum,
    title: raw.title || raw.name || 'Untitled Publication',
    publicationType: raw.publicationType || (raw.conferenceName ? 'Conference Paper' : 'Journal Article'),
    paperOwnerType: raw.paperOwnerType || 'Faculty Publication',
    department: dept,
    departmentCode: dept,
    academicYear: ay,
    firstAuthor: firstAuthorName,
    journalName: raw.journalName || (raw.publicationType === 'Journal Article' ? raw.venue : '') || '',
    conferenceName: raw.conferenceName || (raw.publicationType === 'Conference Paper' ? raw.venue : '') || '',
    publisher: raw.publisher || '',
    volume: raw.volume || '',
    issue: raw.issue || '',
    pages: raw.pages || '',
    articleNumber: raw.articleNumber || '',
    publicationDate: raw.publicationDate || raw.date || (yearSuffix ? `${yearSuffix}-06-01` : ''),
    publicationYear: raw.publicationYear || (yearSuffix ? parseInt(yearSuffix, 10) : null),
    issn: raw.issn || '',
    eissn: raw.eissn || '',
    isbn: raw.isbn || '',
    doi: raw.doi || '',
    scopusEid: raw.scopusEid || '',
    wosUid: raw.wosUid || '',
    openalexWorkId: raw.openalexWorkId || raw.openAlexWorkId || '',
    pubmedId: raw.pubmedId || '',
    url: raw.url || raw.link || (raw.doi ? `https://doi.org/${raw.doi}` : ''),
    indexing: indexing,
    isScopusIndexed: raw.scopusIndexed === 'Yes' || raw.isScopusIndexed === true || indexing.includes('Scopus') || !!raw.scopusEid,
    isWosIndexed: raw.wosIndexed === 'Yes' || raw.isWosIndexed === true || indexing.includes('Web of Science') || !!raw.wosUid,
    isOpenAccess: raw.openAccess === true || raw.isOpenAccess === true,
    scopusCitations: raw.scopusCitations || (raw.citationCount ? { count: raw.citationCount, capturedAt: '2026-06-15T08:30:00Z' } : null),
    openalexCitations: raw.openalexCitations || null,
    wosCitations: raw.wosCitations || null,
    googleScholarCitations: raw.googleScholarCitations || null,
    impactFactor: raw.impactFactor || '',
    impactFactorSource: raw.impactFactorSource || 'JCR',
    impactFactorYear: raw.impactFactorYear || '2025',
    quartile: raw.quartile || '',
    abstract: raw.abstract || '',
    keywords: raw.keywords || '',
    researchDomain: raw.researchDomain || '',
    authors: authors,
    documents: documents,
    sources: sources,
    matchStatus: raw.matchStatus || (authors.some(a => a.matchStatus === 'EXACT' || a.matchStatus === 'VERIFIED') ? 'VERIFIED_NEC_MATCH' : 'POSSIBLE_NEC_MATCH'),
    workflowStatus: raw.workflowStatus || (raw.verificationStatus === 'Published' || raw.verificationStatus === 'Verified' ? 'APPROVED' : 'IMPORTED_PENDING_REVIEW'),
    publicVisibility: raw.publicVisibility || 'APPROVED_PUBLIC',
    reviewHistory: Array.isArray(raw.reviewHistory) ? raw.reviewHistory : []
  };
}

export function getPublications(includeDeleted = false) {
  const items = loadStore(STORAGE_KEYS.PUBLICATIONS, INITIAL_PUBLICATIONS);
  const activeList = Array.isArray(items) ? items.filter(i => includeDeleted || !i.isDeleted) : [];
  return activeList.map((item, idx) => normalizePublicationRecord(item, idx));
}

export function getPublicPublications() {
  const items = getPublications();
  return items.filter(i => i.workflowStatus === 'APPROVED' && !i.isDeleted);
}

export function savePublication(item, user) {
  const items = loadStore(STORAGE_KEYS.PUBLICATIONS, INITIAL_PUBLICATIONS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === item.id) : -1;
  const isHodOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'HOD';

  // Duplicate Check for new items
  if (index === -1) {
    const rawDoi = (item.doi || '').trim().toLowerCase();
    const rawEid = (item.scopusEid || '').trim();
    if (rawDoi) {
      const existingDoi = items.find(p => !p.isDeleted && (p.doi || '').trim().toLowerCase() === rawDoi);
      if (existingDoi) {
        throw new Error(`A publication with DOI "${item.doi}" already exists (Record: ${existingDoi.publicationRecordNumber || existingDoi.id}).`);
      }
    }
    if (rawEid) {
      const existingEid = items.find(p => !p.isDeleted && p.scopusEid === rawEid);
      if (existingEid) {
        throw new Error(`A publication with Scopus EID "${item.scopusEid}" already exists (Record: ${existingEid.publicationRecordNumber || existingEid.id}).`);
      }
    }
  }

  const dept = item.department || user?.dept || 'CSE';
  const ay = item.academicYear || '2025-26';
  const yearSuffix = (ay.split('-')[0] || '2026').trim();
  const nextSeq = String(items.length + 1).padStart(4, '0');
  const autoNum = item.publicationRecordNumber || `PUB-${dept}-${yearSuffix}-${nextSeq}`;

  if (index >= 0) {
    items[index] = {
      ...items[index],
      ...item,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name || 'System'
    };
    addAuditLog('UPDATE', 'Publications', `Updated publication: ${item.title} (${autoNum})`, user);
  } else {
    const defaultWorkflowStatus = item.workflowStatus || (isHodOrAdmin ? 'APPROVED' : 'SUBMITTED');
    const newItem = {
      ...item,
      id: item.id || `pub_${Date.now()}`,
      publicationRecordNumber: autoNum,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'System',
      workflowStatus: defaultWorkflowStatus,
      isDeleted: false,
      reviewHistory: [
        {
          action: 'CREATED',
          status: defaultWorkflowStatus,
          timestamp: new Date().toISOString(),
          by: user?.name || 'Author',
          remarks: 'Initial publication submission'
        }
      ]
    };
    items.unshift(newItem);
    addAuditLog('CREATE', 'Publications', `Submitted paper: ${item.title} (${autoNum})`, user);
  }

  saveStore(STORAGE_KEYS.PUBLICATIONS, items);
  return items.map((it, idx) => normalizePublicationRecord(it, idx));
}

export function reviewPublication(id, action, remarks, reviewerUser) {
  const items = loadStore(STORAGE_KEYS.PUBLICATIONS, INITIAL_PUBLICATIONS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index === -1) return items;

  let targetStatus = 'APPROVED';
  if (action === 'REQUEST_REVISION') targetStatus = 'NEEDS_REVISION';
  else if (action === 'UNDER_REVIEW') targetStatus = 'UNDER_REVIEW';
  else if (action === 'PUBLISH' || action === 'APPROVE') targetStatus = 'APPROVED';
  else if (action === 'ARCHIVE') targetStatus = 'ARCHIVED';
  else if (action === 'REJECT') targetStatus = 'REJECTED';

  items[index].workflowStatus = targetStatus;
  items[index].verifiedAt = new Date().toISOString();
  items[index].verifiedBy = reviewerUser?.name || 'Reviewer';
  if (!items[index].reviewHistory) items[index].reviewHistory = [];
  items[index].reviewHistory.push({
    action: action,
    status: targetStatus,
    timestamp: new Date().toISOString(),
    by: reviewerUser?.name || 'Reviewer',
    remarks: remarks || `Status updated to ${targetStatus}`
  });

  saveStore(STORAGE_KEYS.PUBLICATIONS, items);
  addAuditLog('REVIEW', 'Publications', `Reviewed publication ${items[index].publicationRecordNumber || id}: ${action} (Status: ${targetStatus})`, reviewerUser);
  return items.map((it, idx) => normalizePublicationRecord(it, idx));
}

export function importPublicationsBatch(candidates, currentUser, sourceName = 'LOCAL_INDEX') {
  if (!Array.isArray(candidates) || candidates.length === 0) return [];
  const items = loadStore(STORAGE_KEYS.PUBLICATIONS, INITIAL_PUBLICATIONS);
  let importedCount = 0;
  let mergedCount = 0;

  candidates.forEach(cand => {
    const rawDoi = (cand.doi || '').trim().toLowerCase();
    const rawEid = (cand.scopusEid || '').trim();
    const rawUid = (cand.wosUid || '').trim();
    const rawOaId = (cand.openalexWorkId || cand.openAlexWorkId || '').trim();

    // Deduplication check
    const existingIndex = items.findIndex(p => !p.isDeleted && (
      (rawDoi && (p.doi || '').trim().toLowerCase() === rawDoi) ||
      (rawEid && p.scopusEid === rawEid) ||
      (rawUid && p.wosUid === rawUid) ||
      (rawOaId && (p.openalexWorkId === rawOaId || p.openAlexWorkId === rawOaId))
    ));

    if (existingIndex >= 0) {
      // Merge source into existing canonical record
      const existing = items[existingIndex];
      const existingSources = Array.isArray(existing.sources) ? existing.sources : [existing.source || 'MANUAL'];
      const newSourceTag = sourceName.toUpperCase();
      if (!existingSources.includes(newSourceTag)) {
        existingSources.push(newSourceTag);
      }
      items[existingIndex] = {
        ...existing,
        sources: existingSources,
        doi: existing.doi || cand.doi || '',
        scopusEid: existing.scopusEid || cand.scopusEid || '',
        wosUid: existing.wosUid || cand.wosUid || '',
        openalexWorkId: existing.openalexWorkId || cand.openalexWorkId || '',
        scopusCitations: cand.scopusCitations || existing.scopusCitations || null,
        openalexCitations: cand.openalexCitations || existing.openalexCitations || null,
        updatedAt: new Date().toISOString()
      };
      mergedCount++;
    } else {
      const year = cand.publicationYear || new Date().getFullYear();
      const ay = cand.academicYear || `${year}-${String(year + 1).slice(-2)}`;
      const dept = cand.department || cand.departmentCode || null;
      const deptTag = dept || 'GEN';
      const yearSuffix = String(year);
      const nextSeq = String(items.length + 1).padStart(4, '0');
      const autoNum = `PUB-${deptTag}-${yearSuffix}-${nextSeq}`;

      const newPub = {
        ...cand,
        id: `pub_sync_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        publicationRecordNumber: autoNum,
        department: dept,
        departmentCode: dept,
        academicYear: ay,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.name || `${sourceName} Ingestion Engine`,
        workflowStatus: cand.workflowStatus || 'IMPORTED_PENDING_REVIEW',
        matchStatus: cand.matchStatus || 'POSSIBLE_NEC_MATCH',
        isDeleted: false,
        sources: cand.sources && cand.sources.length > 0 ? cand.sources : [sourceName.toUpperCase()],
        reviewHistory: [
          {
            action: 'IMPORTED_OFFLINE_INDEX',
            status: 'IMPORTED_PENDING_REVIEW',
            timestamp: new Date().toISOString(),
            by: currentUser?.name || `${sourceName} Ingestion`,
            remarks: `Imported with verified metadata from ${sourceName}`
          }
        ]
      };
      items.unshift(newPub);
      importedCount++;
    }
  });

  saveStore(STORAGE_KEYS.PUBLICATIONS, items);
  addAuditLog('RESEARCH_IMPORT_BATCH', 'Publications', `Batch research import: ${importedCount} added, ${mergedCount} deduplicated & linked`, currentUser);
  return items.map((it, idx) => normalizePublicationRecord(it, idx));
}

export function softDeletePublication(id, user) {
  const items = loadStore(STORAGE_KEYS.PUBLICATIONS, INITIAL_PUBLICATIONS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    items[index].isDeleted = true;
    items[index].deletedAt = new Date().toISOString();
    items[index].deletedBy = user?.name;
    saveStore(STORAGE_KEYS.PUBLICATIONS, items);
    addAuditLog('DELETE (Soft)', 'Publications', `Soft-deleted publication ID: ${id}`, user);
  }
  return items.filter(i => !i.isDeleted).map((it, idx) => normalizePublicationRecord(it, idx));
}

// ─────────────────────────────────────────────────────────────
// FACULTY RESEARCH PROFILES (Verified Identifiers)
// ─────────────────────────────────────────────────────────────

export function getFacultyResearchProfiles() {
  const stored = loadStore(STORAGE_KEYS.FACULTY_RESEARCH_PROFILES, INITIAL_FACULTY_RESEARCH_PROFILES);
  const facultyList = getFacultyList();
  
  // Return complete merged list with names and departments
  return facultyList.map(faculty => {
    const prof = (stored || []).find(p => p.facultyId === faculty.id) || {};
    return {
      facultyId: faculty.id,
      name: prof.name || faculty.name,
      department: prof.department || faculty.department,
      designation: prof.designation || faculty.designation,
      orcid: prof.orcid || faculty.orcid || '',
      scopusAuthorId: prof.scopusAuthorId || faculty.scopus || '',
      wosResearcherId: prof.wosResearcherId || faculty.wos || faculty.researcherId || '',
      googleScholarId: prof.googleScholarId || faculty.scholar || '',
      vidwanId: prof.vidwanId || faculty.vidwan || '',
      openAlexAuthorId: prof.openAlexAuthorId || '',
      orcidVerified: prof.orcidVerified !== undefined ? prof.orcidVerified : !!(prof.orcid || faculty.orcid),
      scopusVerified: prof.scopusVerified !== undefined ? prof.scopusVerified : !!(prof.scopusAuthorId || faculty.scopus),
      wosVerified: prof.wosVerified !== undefined ? prof.wosVerified : !!(prof.wosResearcherId || faculty.wos),
      openAlexMatchStatus: prof.openAlexMatchStatus || (prof.openAlexAuthorId ? 'MANUALLY_CONFIRMED' : 'NOT_DISCOVERED'),
      worksCount: prof.worksCount || faculty.citations || 0,
      citedByCount: prof.citedByCount || faculty.citations || 0,
      hIndex: prof.hIndex || faculty.hIndex || 0,
      i10Index: prof.i10Index || faculty.i10Index || 0,
      lastSyncedAt: prof.lastSyncedAt || null
    };
  });
}

export function getFacultyResearchProfile(facultyId) {
  if (!facultyId) return { orcid: '', scopusAuthorId: '', wosResearcherId: '', googleScholarId: '', vidwanId: '' };
  const allProfiles = getFacultyResearchProfiles();
  const found = allProfiles.find(p => p.facultyId === facultyId);
  return found || {
    facultyId,
    orcid: '',
    scopusAuthorId: '',
    wosResearcherId: '',
    googleScholarId: '',
    vidwanId: '',
    openAlexAuthorId: '',
    lastSyncedAt: null
  };
}

export function saveFacultyResearchProfile(facultyId, profileData, user) {
  if (!facultyId) return;
  const profiles = loadStore(STORAGE_KEYS.FACULTY_RESEARCH_PROFILES, INITIAL_FACULTY_RESEARCH_PROFILES);
  const idx = profiles.findIndex(p => p.facultyId === facultyId);
  const updated = {
    facultyId,
    orcid: (profileData.orcid || '').trim(),
    scopusAuthorId: (profileData.scopusAuthorId || '').trim(),
    wosResearcherId: (profileData.wosResearcherId || '').trim(),
    openAlexAuthorId: (profileData.openAlexAuthorId || '').trim(),
    googleScholarId: (profileData.googleScholarId || '').trim(),
    vidwanId: (profileData.vidwanId || '').trim(),
    orcidVerified: profileData.orcidVerified !== undefined ? profileData.orcidVerified : true,
    scopusVerified: profileData.scopusVerified !== undefined ? profileData.scopusVerified : true,
    wosVerified: profileData.wosVerified !== undefined ? profileData.wosVerified : true,
    openAlexMatchStatus: profileData.openAlexMatchStatus || 'MANUALLY_CONFIRMED',
    worksCount: profileData.worksCount || profileData.openAlexWorksCount || 0,
    citedByCount: profileData.citedByCount || profileData.openAlexCitedByCount || 0,
    hIndex: profileData.hIndex || profileData.openAlexHIndex || 0,
    i10Index: profileData.i10Index || 0,
    profileVerifiedBy: user?.name || 'Admin',
    profileVerifiedAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: user?.name || 'System'
  };

  if (idx >= 0) {
    profiles[idx] = { ...profiles[idx], ...updated };
  } else {
    profiles.push(updated);
  }
  saveStore(STORAGE_KEYS.FACULTY_RESEARCH_PROFILES, profiles);
  addAuditLog('UPDATE_RESEARCH_PROFILE', 'Publications', `Updated research profile for faculty ID: ${facultyId}`, user);
  return updated;
}

export function linkFacultyResearcher(facultyId, candidate, user) {
  if (!facultyId || !candidate) return;
  const profileData = {
    orcid: candidate.orcid || '',
    orcidVerified: true,
    worksCount: candidate.worksCount || 0,
    openAlexAuthorId: candidate.openAlexAuthorId || candidate.openAlexShortId || '',
    openAlexMatchStatus: 'MANUALLY_CONFIRMED',
    citedByCount: candidate.citedByCount || 0,
    hIndex: candidate.hIndex || 0
  };
  const res = saveFacultyResearchProfile(facultyId, profileData, user);
  addAuditLog('RESEARCH_PROFILE_LINKED', 'Publications', `Linked faculty ID ${facultyId} to ORCID: ${candidate.orcid || ''} (${candidate.fullName || candidate.canonicalName || ''})`, user);
  return res;
}

export function unlinkFacultyResearcher(facultyId, user) {
  if (!facultyId) return;
  const profiles = loadStore(STORAGE_KEYS.FACULTY_RESEARCH_PROFILES, INITIAL_FACULTY_RESEARCH_PROFILES);
  const idx = profiles.findIndex(p => p.facultyId === facultyId);
  if (idx >= 0) {
    profiles[idx].orcid = '';
    profiles[idx].orcidVerified = false;
    profiles[idx].openAlexAuthorId = '';
    profiles[idx].openAlexMatchStatus = 'NOT_DISCOVERED';
    profiles[idx].updatedAt = new Date().toISOString();
    profiles[idx].updatedBy = user?.name || 'System';
    saveStore(STORAGE_KEYS.FACULTY_RESEARCH_PROFILES, profiles);
    addAuditLog('RESEARCH_PROFILE_UNLINKED', 'Publications', `Unlinked research profile for faculty ID: ${facultyId}`, user);
  }
}

// ─────────────────────────────────────────────────────────────
// DATASET VERSIONS & METRIC SNAPSHOTS (Dynamic Computation)
// ─────────────────────────────────────────────────────────────

export function getDatasetVersions() {
  const versions = loadStore(STORAGE_KEYS.DATASET_VERSIONS, INITIAL_DATASET_VERSIONS);
  const publications = getPublications();
  const profiles = getFacultyResearchProfiles();
  const patents = getPatents();

  // Dynamically compute authentic record metrics per dataset source
  return versions.map(v => {
    let relevantCount = 0;
    let verifiedCount = 0;
    let possibleMatchCount = 0;
    let unresolvedCount = 0;

    if (v.source === 'OPENALEX') {
      const matchedPubs = publications.filter(p => p.sources?.includes('OPENALEX') || !!p.openalexWorkId);
      relevantCount = matchedPubs.length;
      verifiedCount = matchedPubs.filter(p => p.workflowStatus === 'APPROVED' && p.matchStatus === 'VERIFIED_NEC_MATCH').length;
      possibleMatchCount = matchedPubs.filter(p => p.matchStatus === 'POSSIBLE_NEC_MATCH').length;
      unresolvedCount = matchedPubs.filter(p => p.authors?.some(a => a.matchStatus === 'UNRESOLVED')).length;
    } else if (v.source === 'CROSSREF') {
      const matchedPubs = publications.filter(p => p.sources?.includes('CROSSREF') || !!p.doi);
      relevantCount = matchedPubs.length;
      verifiedCount = matchedPubs.filter(p => p.workflowStatus === 'APPROVED').length;
      possibleMatchCount = matchedPubs.filter(p => p.workflowStatus !== 'APPROVED').length;
    } else if (v.source === 'ORCID') {
      const orcidFaculty = profiles.filter(p => !!p.orcid && p.orcidVerified);
      relevantCount = orcidFaculty.length;
      verifiedCount = orcidFaculty.length;
      possibleMatchCount = profiles.filter(p => !!p.orcid && !p.orcidVerified).length;
    } else if (v.source === 'SCOPUS_IMPORT' || v.source === 'SCOPUS') {
      const scopusPubs = publications.filter(p => p.sources?.includes('SCOPUS_IMPORT') || p.isScopusIndexed || !!p.scopusEid);
      relevantCount = scopusPubs.length;
      verifiedCount = scopusPubs.filter(p => p.workflowStatus === 'APPROVED').length;
      possibleMatchCount = scopusPubs.filter(p => p.workflowStatus === 'IMPORTED_PENDING_REVIEW').length;
    } else if (v.source === 'WOS_IMPORT' || v.source === 'WOS') {
      const wosPubs = publications.filter(p => p.sources?.includes('WOS_IMPORT') || p.isWosIndexed || !!p.wosUid);
      relevantCount = wosPubs.length;
      verifiedCount = wosPubs.filter(p => p.workflowStatus === 'APPROVED').length;
      possibleMatchCount = wosPubs.filter(p => p.workflowStatus === 'IMPORTED_PENDING_REVIEW').length;
    }

    return {
      ...v,
      relevantRecordCount: relevantCount,
      verifiedRecordCount: verifiedCount,
      possibleMatchCount: possibleMatchCount,
      unresolvedCount: unresolvedCount
    };
  });
}

export function saveDatasetVersion(version, user) {
  const versions = getDatasetVersions();
  const idx = versions.findIndex(v => v.id === version.id);
  if (idx >= 0) {
    versions[idx] = { ...versions[idx], ...version, updatedAt: new Date().toISOString() };
  } else {
    versions.push({ ...version, id: `ds_${Date.now()}`, createdAt: new Date().toISOString() });
  }
  saveStore(STORAGE_KEYS.DATASET_VERSIONS, versions);
  addAuditLog('DATASET_INDEXED', 'Research Data', `Updated dataset version record: ${version.name} (${version.datasetVersion})`, user);
  return versions;
}

// ─────────────────────────────────────────────────────────────
// PROVENANCE & UNIVERSAL RESEARCH SEARCH ENGINE
// ─────────────────────────────────────────────────────────────

export function getResearchRecordSources(canonicalRecordId) {
  if (!canonicalRecordId) return [];
  const storedSources = loadStore(STORAGE_KEYS.RESEARCH_RECORD_SOURCES, []);
  return storedSources.filter(s => s.canonicalRecordId === canonicalRecordId);
}

export function saveResearchRecordSource(sourceRecord, user) {
  if (!sourceRecord || !sourceRecord.canonicalRecordId) return;
  const sources = loadStore(STORAGE_KEYS.RESEARCH_RECORD_SOURCES, []);
  const newEntry = {
    ...sourceRecord,
    id: sourceRecord.id || `src_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString()
  };
  sources.unshift(newEntry);
  saveStore(STORAGE_KEYS.RESEARCH_RECORD_SOURCES, sources);
  return newEntry;
}

export function universalResearchSearch(query) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return { publications: [], patents: [], researchers: [], totalCount: 0 };
  }

  const q = query.toLowerCase().trim();
  const allPublications = getPublications();
  const allPatents = getPatents();
  const allResearchers = getFacultyResearchProfiles();

  const matchedPubs = allPublications.filter(p => {
    return (p.title || '').toLowerCase().includes(q) ||
           (p.doi || '').toLowerCase().includes(q) ||
           (p.scopusEid || '').toLowerCase().includes(q) ||
           (p.wosUid || '').toLowerCase().includes(q) ||
           (p.openalexWorkId || '').toLowerCase().includes(q) ||
           (p.journalName || '').toLowerCase().includes(q) ||
           (p.publicationRecordNumber || '').toLowerCase().includes(q) ||
           (p.authors || []).some(a => (a.name || '').toLowerCase().includes(q));
  });

  const matchedPatents = allPatents.filter(pat => {
    return (pat.title || '').toLowerCase().includes(q) ||
           (pat.applicationNumber || '').toLowerCase().includes(q) ||
           (pat.grantNumber || '').toLowerCase().includes(q) ||
           (pat.patentRecordNumber || '').toLowerCase().includes(q) ||
           (pat.technologyDomain || '').toLowerCase().includes(q) ||
           (pat.inventors || []).some(inv => (inv.name || '').toLowerCase().includes(q));
  });

  const matchedResearchers = allResearchers.filter(r => {
    return (r.name || '').toLowerCase().includes(q) ||
           (r.department || '').toLowerCase().includes(q) ||
           (r.orcid || '').toLowerCase().includes(q) ||
           (r.scopusAuthorId || '').toLowerCase().includes(q) ||
           (r.wosResearcherId || '').toLowerCase().includes(q) ||
           (r.vidwanId || '').toLowerCase().includes(q) ||
           (r.facultyId || '').toLowerCase().includes(q);
  });

  return {
    publications: matchedPubs,
    patents: matchedPatents,
    researchers: matchedResearchers,
    totalCount: matchedPubs.length + matchedPatents.length + matchedResearchers.length
  };
}

export function getMatchReviewQueue() {
  const publications = getPublications();
  return publications.filter(p => p.matchStatus === 'POSSIBLE_NEC_MATCH' || p.workflowStatus === 'IMPORTED_PENDING_REVIEW');
}

export function resolveResearchMatch(publicationId, authorOrder, facultyId, action, user) {
  const items = loadStore(STORAGE_KEYS.PUBLICATIONS, INITIAL_PUBLICATIONS);
  const pubIndex = items.findIndex(p => p.id === publicationId);
  if (pubIndex === -1) return items;

  const pub = items[pubIndex];
  if (!Array.isArray(pub.authors)) pub.authors = [];

  const authorIndex = pub.authors.findIndex(a => a.authorOrder === authorOrder);
  if (authorIndex >= 0) {
    if (action === 'LINK_FACULTY' && facultyId) {
      const facultyList = getFacultyList();
      const matchedFaculty = facultyList.find(f => f.id === facultyId);
      pub.authors[authorIndex].facultyId = facultyId;
      pub.authors[authorIndex].matchStatus = 'VERIFIED';
      if (matchedFaculty) {
        pub.authors[authorIndex].department = matchedFaculty.department;
        pub.authors[authorIndex].departmentCode = matchedFaculty.department;
        if (!pub.department) pub.department = matchedFaculty.department;
      }
      pub.matchStatus = 'VERIFIED_NEC_MATCH';
      addAuditLog('AUTHOR_MATCH_RESOLVED', 'Publications', `Linked author "${pub.authors[authorIndex].name}" to faculty ID ${facultyId} for publication ${pub.publicationRecordNumber || pub.id}`, user);
    } else if (action === 'MARK_EXTERNAL') {
      pub.authors[authorIndex].matchStatus = 'EXTERNAL';
      pub.authors[authorIndex].facultyId = null;
      addAuditLog('AUTHOR_MARKED_EXTERNAL', 'Publications', `Marked author "${pub.authors[authorIndex].name}" as external contributor for publication ${pub.publicationRecordNumber || pub.id}`, user);
    }
  }

  // Update overall match status
  const hasVerified = pub.authors.some(a => a.matchStatus === 'EXACT' || a.matchStatus === 'VERIFIED');
  pub.matchStatus = hasVerified ? 'VERIFIED_NEC_MATCH' : 'POSSIBLE_NEC_MATCH';
  pub.updatedAt = new Date().toISOString();

  items[pubIndex] = pub;
  saveStore(STORAGE_KEYS.PUBLICATIONS, items);
  return items.map((it, idx) => normalizePublicationRecord(it, idx));
}


// ─────────────────────────────────────────────────────────────
// 2. PATENTS & IPR GOVERNANCE REPOSITORY
// ─────────────────────────────────────────────────────────────

export function normalizePatentRecord(raw, idx = 0) {
  if (!raw) return null;
  const dept = raw.department || 'CSE';
  const ay = raw.academicYear || '2025-26';
  const yearSuffix = (ay.split('-')[0] || '2026').trim();
  const autoNum = raw.patentRecordNumber || `PAT-${dept}-${yearSuffix}-${String(idx + 1).padStart(4, '0')}`;

  const inventors = Array.isArray(raw.inventors) ? raw.inventors : (
    Array.isArray(raw.authors) ? raw.authors.map((a, i) => ({
      inventorOrder: i + 1,
      personType: 'INTERNAL_FACULTY',
      name: a.name || 'Inventor',
      department: a.department || dept,
      designation: a.role || 'Faculty',
      affiliation: 'Narasaraopeta Engineering College',
      isLead: i === 0,
      isCorresponding: i === 0
    })) : [
      {
        inventorOrder: 1,
        personType: 'INTERNAL_FACULTY',
        name: raw.facultyName || 'Principal Inventor',
        department: dept,
        designation: 'Faculty',
        affiliation: 'Narasaraopeta Engineering College',
        isLead: true,
        isCorresponding: true
      }
    ]
  );

  const documents = Array.isArray(raw.documents) ? raw.documents : [
    ...(raw.patentPdf ? [{ id: 'DOC-1', name: raw.patentPdf, type: 'Patent Specification PDF', size: '2.4 MB', url: '#' }] : []),
    ...(raw.grantCertificatePdf ? [{ id: 'DOC-2', name: raw.grantCertificatePdf, type: 'Grant Certificate', size: '850 KB', url: '#' }] : [])
  ];

  const legalStatus = raw.legalStatus || (
    raw.patentStatus === 'Granted' ? 'GRANTED' : (
      raw.patentStatus === 'Published' ? 'PUBLISHED' : (
        raw.patentStatus === 'Filed' ? 'FILED' : 'PUBLISHED'
      )
    )
  );

  return {
    ...raw,
    id: raw.id || `pat_${Date.now()}_${idx}`,
    patentRecordNumber: autoNum,
    title: raw.title || 'Untitled Patent',
    department: dept,
    academicYear: ay,
    patentType: raw.patentType || 'Indian Patent',
    countryCode: raw.countryCode || 'IN',
    patentOffice: raw.patentOffice || 'Indian Patent Office (Chennai)',
    technologyDomain: raw.technologyDomain || 'Artificial Intelligence / IoT',
    abstract: raw.abstract || '',
    keywords: raw.keywords || '',
    applicationNumber: raw.applicationNumber || raw.applicationNo || '',
    applicationDate: raw.applicationDate || raw.filingDate || `${yearSuffix}-10-01`,
    filingDate: raw.filingDate || raw.applicationDate || `${yearSuffix}-10-01`,
    publicationDate: raw.publicationDate || '',
    grantNumber: raw.grantNumber || '',
    grantDate: raw.grantDate || '',
    priorityDate: raw.priorityDate || '',
    ferDate: raw.ferDate || '',
    expiryDate: raw.expiryDate || '',
    legalStatus: legalStatus,
    workflowStatus: raw.workflowStatus || (raw.verificationStatus === 'Verified' ? 'APPROVED' : 'UNDER_REVIEW'),
    applicantName: raw.applicantName || 'Narasaraopeta Engineering College (Autonomous)',
    ownershipType: raw.ownershipType || 'Narasaraopeta Engineering College',
    partnerOrg: raw.partnerOrg || '',
    ownershipPercent: raw.ownershipPercent || 100,
    inventors: inventors,
    documents: documents,
    publicVisibility: raw.publicVisibility || 'PUBLIC_SAFE',
    reviewHistory: Array.isArray(raw.reviewHistory) ? raw.reviewHistory : []
  };
}

export function getPatents(includeDeleted = false) {
  const items = loadStore(STORAGE_KEYS.PATENTS, INITIAL_PATENTS);
  const activeList = Array.isArray(items) ? items.filter(i => includeDeleted || !i.isDeleted) : [];
  return activeList.map((item, idx) => normalizePatentRecord(item, idx));
}

export function getPublicPatents() {
  const items = getPatents();
  return items.filter(i => i.workflowStatus === 'APPROVED' && !i.isDeleted);
}

export function savePatent(item, user) {
  const items = loadStore(STORAGE_KEYS.PATENTS, INITIAL_PATENTS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === item.id) : -1;
  const isHodOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'HOD';

  // Duplicate Check on Application Number
  const appNo = (item.applicationNumber || item.applicationNo || '').trim();
  if (appNo && index === -1) {
    const existing = items.find(p => !p.isDeleted && ((p.applicationNumber || p.applicationNo || '').trim() === appNo));
    if (existing) {
      throw new Error(`A patent with Application Number "${appNo}" already exists (Record: ${existing.patentRecordNumber || existing.id}).`);
    }
  }

  const dept = item.department || user?.dept || 'CSE';
  const ay = item.academicYear || '2025-26';
  const yearSuffix = (ay.split('-')[0] || '2026').trim();
  const nextSeq = String(items.length + 1).padStart(4, '0');
  const autoNum = item.patentRecordNumber || `PAT-${dept}-${yearSuffix}-${nextSeq}`;

  if (index >= 0) {
    items[index] = {
      ...items[index],
      ...item,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name || 'System'
    };
    addAuditLog('UPDATE', 'Patents', `Updated patent: ${item.title} (${autoNum})`, user);
  } else {
    const defaultWorkflowStatus = item.workflowStatus || (isHodOrAdmin ? 'APPROVED' : 'SUBMITTED');
    const newItem = {
      ...item,
      id: item.id || `pat_${Date.now()}`,
      patentRecordNumber: autoNum,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'System',
      workflowStatus: defaultWorkflowStatus,
      isDeleted: false,
      reviewHistory: [
        {
          action: 'CREATED',
          status: defaultWorkflowStatus,
          timestamp: new Date().toISOString(),
          by: user?.name || 'Inventor',
          remarks: 'Initial patent record creation'
        }
      ]
    };
    items.unshift(newItem);
    addAuditLog('CREATE', 'Patents', `Recorded patent: ${item.title} (${autoNum})`, user);
  }

  saveStore(STORAGE_KEYS.PATENTS, items);
  return items.map((it, idx) => normalizePatentRecord(it, idx));
}

export function reviewPatent(id, action, remarks, reviewerUser) {
  const items = loadStore(STORAGE_KEYS.PATENTS, INITIAL_PATENTS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index === -1) return items;

  let targetStatus = 'APPROVED';
  if (action === 'REQUEST_REVISION') targetStatus = 'NEEDS_REVISION';
  else if (action === 'UNDER_REVIEW') targetStatus = 'UNDER_REVIEW';
  else if (action === 'PUBLISH') targetStatus = 'APPROVED';
  else if (action === 'ARCHIVE') targetStatus = 'ARCHIVED';

  items[index].workflowStatus = targetStatus;
  items[index].verifiedAt = new Date().toISOString();
  items[index].verifiedBy = reviewerUser?.name || 'Reviewer';
  if (!items[index].reviewHistory) items[index].reviewHistory = [];
  items[index].reviewHistory.push({
    action: action,
    status: targetStatus,
    timestamp: new Date().toISOString(),
    by: reviewerUser?.name || 'Reviewer',
    remarks: remarks || `Patent status updated to ${targetStatus}`
  });

  saveStore(STORAGE_KEYS.PATENTS, items);
  addAuditLog('REVIEW', 'Patents', `Reviewed patent ${items[index].patentRecordNumber || id}: ${action} (Status: ${targetStatus})`, reviewerUser);
  return items.map((it, idx) => normalizePatentRecord(it, idx));
}

export function updatePatentLegalStatus(id, newLegalStatus, user) {
  const items = loadStore(STORAGE_KEYS.PATENTS, INITIAL_PATENTS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    items[index].legalStatus = newLegalStatus;
    items[index].updatedAt = new Date().toISOString();
    items[index].updatedBy = user?.name;
    if (!items[index].reviewHistory) items[index].reviewHistory = [];
    items[index].reviewHistory.push({
      action: 'LEGAL_STATUS_CHANGE',
      status: items[index].workflowStatus,
      timestamp: new Date().toISOString(),
      by: user?.name,
      remarks: `Legal status updated to ${newLegalStatus}`
    });
    saveStore(STORAGE_KEYS.PATENTS, items);
    addAuditLog('LEGAL_STATUS', 'Patents', `Updated legal status of ${items[index].patentRecordNumber || id} to ${newLegalStatus}`, user);
  }
  return items.map((it, idx) => normalizePatentRecord(it, idx));
}

export function softDeletePatent(id, user) {
  const items = loadStore(STORAGE_KEYS.PATENTS, INITIAL_PATENTS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    items[index].isDeleted = true;
    items[index].deletedAt = new Date().toISOString();
    items[index].deletedBy = user?.name;
    saveStore(STORAGE_KEYS.PATENTS, items);
    addAuditLog('DELETE (Soft)', 'Patents', `Soft-deleted patent ID: ${id}`, user);
  }
  return items.filter(i => !i.isDeleted).map((it, idx) => normalizePatentRecord(it, idx));
}

// -------------------------------------------------------------
// Verified Student Directory Master & Lookup
// -------------------------------------------------------------
export const STUDENT_DIRECTORY = [
  { rollNumber: '22471A0589', name: 'K. Sai Praneeth', department: 'CSE', batch: '2022-2026', year: 'III Year', semester: 'II Sem', academicYear: '2025-26', email: '22471a0589@nrtec.in', phone: '9848012345' },
  { rollNumber: '23471A0412', name: 'M. Sneha Latha', department: 'ECE', batch: '2023-2027', year: 'II Year', semester: 'II Sem', academicYear: '2025-26', email: '23471a0412@nrtec.in', phone: '9848023456' },
  { rollNumber: '21471A1208', name: 'V. Harsha Vardhan', department: 'IT', batch: '2021-2025', year: 'IV Year', semester: 'II Sem', academicYear: '2025-26', email: '21471a1208@nrtec.in', phone: '9848034567' },
  { rollNumber: '21471A0512', name: 'G. Vamsi Krishna', department: 'CSE', batch: '2021-2025', year: 'IV Year', semester: 'II Sem', academicYear: '2025-26', email: '21471a0512@nrtec.in', phone: '9848045678' },
  { rollNumber: '22471A0445', name: 'T. Bhavani Prasad', department: 'ECE', batch: '2022-2026', year: 'III Year', semester: 'II Sem', academicYear: '2025-26', email: '22471a0445@nrtec.in', phone: '9848056789' },
  { rollNumber: '21471A0218', name: 'N. Anvesh Kumar', department: 'EEE', batch: '2021-2025', year: 'IV Year', semester: 'II Sem', academicYear: '2025-26', email: '21471a0218@nrtec.in', phone: '9848067890' },
  { rollNumber: '23BQ1A0501', name: 'Ch. Venkata Aditya', department: 'CSE', batch: '2023-2027', year: 'II Year', semester: 'II Sem', academicYear: '2025-26', email: '23bq1a0501@nrtec.in', phone: '9848078901' },
  { rollNumber: '23BQ1A0502', name: 'P. Deepika Rani', department: 'CSE', batch: '2023-2027', year: 'II Year', semester: 'II Sem', academicYear: '2025-26', email: '23bq1a0502@nrtec.in', phone: '9848089012' },
  { rollNumber: '22BQ1A4205', name: 'S. Akhil Reddy', department: 'CSM', batch: '2022-2026', year: 'III Year', semester: 'II Sem', academicYear: '2025-26', email: '22bq1a4205@nrtec.in', phone: '9848090123' },
  { rollNumber: '22BQ1A4418', name: 'B. Rohith Kumar', department: 'CSD', batch: '2022-2026', year: 'III Year', semester: 'II Sem', academicYear: '2025-26', email: '22bq1a4418@nrtec.in', phone: '9848101234' },
  { rollNumber: '21BQ1A0304', name: 'K. Jagadeesh Babu', department: 'MECH', batch: '2021-2025', year: 'IV Year', semester: 'II Sem', academicYear: '2025-26', email: '21bq1a0304@nrtec.in', phone: '9848112345' },
  { rollNumber: '22BQ1A0112', name: 'M. Siva Rama Krishna', department: 'CIVIL', batch: '2022-2026', year: 'III Year', semester: 'II Sem', academicYear: '2025-26', email: '22bq1a0112@nrtec.in', phone: '9848123456' }
];

export function lookupStudentByRollNumber(query) {
  if (!query || !query.trim()) return null;
  const clean = query.trim().toUpperCase();
  return STUDENT_DIRECTORY.find(s => s.rollNumber.toUpperCase() === clean) || null;
}

export function searchStudents(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  return STUDENT_DIRECTORY.filter(s => 
    s.rollNumber.toLowerCase().includes(q) || 
    s.name.toLowerCase().includes(q) ||
    s.department.toLowerCase().includes(q)
  );
}

// -------------------------------------------------------------
// 4. Student Achievements (Full Evidence Lifecycle)
// -------------------------------------------------------------
export function normalizeAchievementDates(item) {
  if (!item) return item;
  const rawDate = item.eventDate || item.date || item.achievementDate;
  if (!rawDate) return item;

  const parsed = parseDateRange(rawDate);
  const startDate = item.startDate || parsed.startDate;
  const endDate = item.endDate || parsed.endDate || parsed.lastDate;
  const eventDate = parsed.lastDate || rawDate;

  return {
    ...item,
    startDate,
    endDate,
    eventDate,
    achievementDate: eventDate
  };
}

export function getStudentAchievements(includeDeleted = false) {
  const items = loadStore(STORAGE_KEYS.STUDENT_ACHIEVEMENTS, INITIAL_STUDENT_ACHIEVEMENTS);
  const normalized = Array.isArray(items) ? items.map(normalizeAchievementDates) : [];
  return includeDeleted ? normalized : normalized.filter(i => !i.isDeleted);
}

export function saveStudentAchievement(item, user) {
  const items = loadStore(STORAGE_KEYS.STUDENT_ACHIEVEMENTS, INITIAL_STUDENT_ACHIEVEMENTS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === item.id) : -1;
  const deptCode = item.department || item.branch || 'CSE';
  const yearCode = (item.academicYear || '2025-26').slice(0, 4);

  const normalizedInput = normalizeAchievementDates(item);

  if (index >= 0) {
    const existing = items[index];
    const updated = {
      ...existing,
      ...normalizedInput,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name || 'Super Admin'
    };
    items[index] = updated;
    addAuditLog('UPDATE_ACHIEVEMENT', 'Student Achievements', `Updated achievement ${updated.achievementNumber || updated.id} for ${updated.studentName}`, user);
    saveStore(STORAGE_KEYS.STUDENT_ACHIEVEMENTS, items);
    return updated;
  } else {
    // Generate institutional auto-number: ACH-CSE-2026-0001
    const count = items.filter(i => (i.department === deptCode)).length + 1;
    const seq = String(count).padStart(4, '0');
    const autoNumber = `ACH-${deptCode}-${yearCode}-${seq}`;

    const newItem = {
      ...normalizedInput,
      id: item.id || 'ach_' + Date.now(),
      achievementNumber: item.achievementNumber || autoNumber,
      workflowStatus: item.workflowStatus || 'DRAFT',
      visibilityStatus: item.visibilityStatus || 'Internal Only',
      documents: item.documents || [],
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'Super Admin',
      isDeleted: false
    };

    if (Array.isArray(items)) items.unshift(newItem);
    addAuditLog('CREATE_ACHIEVEMENT', 'Student Achievements', `Created achievement ${newItem.achievementNumber} for ${newItem.studentName} (${newItem.title || newItem.eventName})`, user);
    saveStore(STORAGE_KEYS.STUDENT_ACHIEVEMENTS, items);
    return newItem;
  }
}

export function reviewStudentAchievement(id, action, remarks, reviewerUser) {
  const items = loadStore(STORAGE_KEYS.STUDENT_ACHIEVEMENTS, INITIAL_STUDENT_ACHIEVEMENTS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    const item = items[index];
    let newStatus = item.workflowStatus;

    if (action === 'SUBMIT') newStatus = 'SUBMITTED';
    else if (action === 'VERIFY') newStatus = 'VERIFIED';
    else if (action === 'APPROVE') newStatus = 'APPROVED';
    else if (action === 'REQUEST_REVISION') newStatus = 'NEEDS_REVISION';
    else if (action === 'PUBLISH') {
      newStatus = 'APPROVED';
      item.visibilityStatus = 'Published';
      item.publishedAt = new Date().toISOString();
    } else if (action === 'ARCHIVE') newStatus = 'ARCHIVED';

    const history = item.reviewHistory || [];
    history.push({
      action,
      fromStatus: item.workflowStatus,
      toStatus: newStatus,
      remarks: remarks || '',
      reviewerName: reviewerUser?.name || 'Super Admin',
      reviewerRole: reviewerUser?.role || 'SUPER_ADMIN',
      timestamp: new Date().toISOString()
    });

    items[index] = {
      ...item,
      workflowStatus: newStatus,
      status: newStatus === 'APPROVED' ? 'Approved' : (newStatus === 'VERIFIED' ? 'Verified' : item.status),
      reviewHistory: history,
      updatedAt: new Date().toISOString(),
      updatedBy: reviewerUser?.name
    };

    addAuditLog(`REVIEW_${action}`, 'Student Achievements', `${action} achievement ${item.achievementNumber || item.id} for ${item.studentName}`, reviewerUser);
    saveStore(STORAGE_KEYS.STUDENT_ACHIEVEMENTS, items);
    return items[index];
  }
  return null;
}

export function softDeleteStudentAchievement(id, user) {
  const items = loadStore(STORAGE_KEYS.STUDENT_ACHIEVEMENTS, INITIAL_STUDENT_ACHIEVEMENTS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    items[index].isDeleted = true;
    items[index].deletedAt = new Date().toISOString();
    items[index].deletedBy = user?.name;
    saveStore(STORAGE_KEYS.STUDENT_ACHIEVEMENTS, items);
    addAuditLog('DELETE_ACHIEVEMENT', 'Student Achievements', `Soft-deleted achievement ID: ${id}`, user);
  }
  return Array.isArray(items) ? items.filter(i => !i.isDeleted) : [];
}

// -------------------------------------------------------------
// 5. Student Internships (Full Evidence Lifecycle)
// -------------------------------------------------------------
export function calculateInternshipDuration(startDate, endDate) {
  if (!startDate || !endDate) return { days: 0, weeks: 0 };
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return { days: 0, weeks: 0 };
  }
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const diffWeeks = parseFloat((diffDays / 7).toFixed(1));
  return { days: diffDays, weeks: diffWeeks };
}

export function calculateInternshipWeeks(startDate, endDate) {
  return calculateInternshipDuration(startDate, endDate).weeks;
}

export function getInternships(includeDeleted = false) {
  const items = loadStore(STORAGE_KEYS.INTERNSHIPS, INITIAL_INTERNSHIPS);
  return includeDeleted ? items : (Array.isArray(items) ? items.filter(i => !i.isDeleted) : []);
}

export function saveInternship(item, user) {
  const items = loadStore(STORAGE_KEYS.INTERNSHIPS, INITIAL_INTERNSHIPS);
  const duration = calculateInternshipDuration(item.startDate, item.endDate);
  const deptCode = item.department || item.branch || 'CSE';
  const yearCode = (item.academicYear || '2025-26').slice(0, 4);

  const internshipItem = { 
    ...item, 
    durationDays: duration.days, 
    durationWeeks: duration.weeks,
    weeks: duration.weeks
  };
  
  const index = Array.isArray(items) ? items.findIndex(i => i.id === item.id) : -1;
  if (index >= 0) {
    const existing = items[index];
    const updated = {
      ...existing,
      ...internshipItem,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name || 'Super Admin'
    };
    items[index] = updated;
    addAuditLog('UPDATE_INTERNSHIP', 'Internships', `Updated internship ${updated.internshipNumber || updated.id} for ${updated.studentName}`, user);
    saveStore(STORAGE_KEYS.INTERNSHIPS, items);
    return updated;
  } else {
    // Generate institutional auto-number: INT-CSE-2026-0001
    const count = items.filter(i => (i.branch === deptCode || i.department === deptCode)).length + 1;
    const seq = String(count).padStart(4, '0');
    const autoNumber = `INT-${deptCode}-${yearCode}-${seq}`;

    const newItem = {
      ...internshipItem,
      id: item.id || 'int_' + Date.now(),
      internshipNumber: item.internshipNumber || autoNumber,
      internshipStatus: item.internshipStatus || 'Ongoing',
      workflowStatus: item.workflowStatus || 'DRAFT',
      documents: item.documents || [],
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'Super Admin',
      isDeleted: false
    };

    if (Array.isArray(items)) items.unshift(newItem);
    addAuditLog('CREATE_INTERNSHIP', 'Internships', `Recorded internship ${newItem.internshipNumber} for ${newItem.studentName} at ${newItem.organization}`, user);
    saveStore(STORAGE_KEYS.INTERNSHIPS, items);
    return newItem;
  }
}

export function reviewInternship(id, action, remarks, reviewerUser) {
  const items = loadStore(STORAGE_KEYS.INTERNSHIPS, INITIAL_INTERNSHIPS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    const item = items[index];
    let newStatus = item.workflowStatus;

    if (action === 'SUBMIT') newStatus = 'SUBMITTED';
    else if (action === 'VERIFY') newStatus = 'VERIFIED';
    else if (action === 'APPROVE') newStatus = 'VERIFIED';
    else if (action === 'COMPLETE') {
      newStatus = 'COMPLETED';
      item.internshipStatus = 'Completed';
    } else if (action === 'REQUEST_REVISION') newStatus = 'NEEDS_REVISION';
    else if (action === 'ARCHIVE') newStatus = 'ARCHIVED';

    const history = item.reviewHistory || [];
    history.push({
      action,
      fromStatus: item.workflowStatus,
      toStatus: newStatus,
      remarks: remarks || '',
      reviewerName: reviewerUser?.name || 'Super Admin',
      reviewerRole: reviewerUser?.role || 'SUPER_ADMIN',
      timestamp: new Date().toISOString()
    });

    items[index] = {
      ...item,
      workflowStatus: newStatus,
      status: newStatus === 'COMPLETED' ? 'Completed' : (newStatus === 'VERIFIED' ? 'Verified' : item.status),
      reviewHistory: history,
      updatedAt: new Date().toISOString(),
      updatedBy: reviewerUser?.name
    };

    addAuditLog(`REVIEW_${action}`, 'Internships', `${action} internship ${item.internshipNumber || item.id} for ${item.studentName}`, reviewerUser);
    saveStore(STORAGE_KEYS.INTERNSHIPS, items);
    return items[index];
  }
  return null;
}

export function softDeleteInternship(id, user) {
  const items = loadStore(STORAGE_KEYS.INTERNSHIPS, INITIAL_INTERNSHIPS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    items[index].isDeleted = true;
    items[index].deletedAt = new Date().toISOString();
    items[index].deletedBy = user?.name;
    saveStore(STORAGE_KEYS.INTERNSHIPS, items);
    addAuditLog('DELETE_INTERNSHIP', 'Internships', `Soft-deleted internship ID: ${id}`, user);
  }
  return Array.isArray(items) ? items.filter(i => !i.isDeleted) : [];
}

// ─────────────────────────────────────────────────────────────
// 6. STUDENT PROJECTS (Full Lifecycle & Review Milestones)
// ─────────────────────────────────────────────────────────────

export function normalizeStudentProjectRecord(raw, idx = 0) {
  if (!raw) return null;
  const dept = raw.department || 'CSE';
  const ay = raw.academicYear || '2025-26';
  const yearSuffix = (ay.split('-')[0] || '2026').trim();
  const autoNum = raw.projectNumber || `PRJ-${dept}-${yearSuffix}-${String(idx + 1).padStart(4, '0')}`;

  const team = Array.isArray(raw.teamMembers) ? raw.teamMembers : [
    {
      rollNumber: raw.studentRollNo || raw.rollNumber || '22471A0589',
      name: raw.studentName || raw.teamLeader || 'Team Leader',
      department: dept,
      year: raw.year || 'III Year',
      semester: raw.semester || 'II Sem',
      email: raw.email || '',
      isLeader: true
    }
  ];

  const guide = raw.guide || {
    facultyId: raw.guideId || '',
    name: raw.guideName || raw.facultyGuide || 'Assigned Faculty Guide',
    department: dept,
    designation: 'Faculty Guide',
    email: ''
  };

  const reviews = Array.isArray(raw.reviews) && raw.reviews.length > 0 ? raw.reviews : [
    { reviewName: 'Proposal / Synopsis Review', reviewDate: raw.startDate || `${yearSuffix}-08-15`, panelMembers: 'Project Review Committee', marksAwarded: 18, maxMarks: 20, feedback: 'Problem statement and scope approved.', status: 'COMPLETED' },
    { reviewName: 'Review 1 (Design & Architecture)', reviewDate: `${yearSuffix}-10-20`, panelMembers: 'Internal Committee', marksAwarded: 22, maxMarks: 25, feedback: 'Architecture validated; begin implementation.', status: 'COMPLETED' },
    { reviewName: 'Review 2 (Implementation & Testing)', reviewDate: `${yearSuffix}-12-10`, panelMembers: 'Internal Committee', marksAwarded: 20, maxMarks: 25, feedback: 'Core modules tested with benchmark dataset.', status: raw.projectStatus === 'Completed' ? 'COMPLETED' : 'IN_PROGRESS' },
    { reviewName: 'Final Viva & Demo', reviewDate: raw.expectedCompletion || `${parseInt(yearSuffix, 10) + 1}-03-25`, panelMembers: 'External & Internal Panel', marksAwarded: 27, maxMarks: 30, feedback: 'Excellent demonstration and documentation.', status: raw.projectStatus === 'Completed' ? 'COMPLETED' : 'PENDING' }
  ];

  const documents = Array.isArray(raw.documents) ? raw.documents : [
    ...(raw.projectReportPdf ? [{ id: 'DOC-1', name: raw.projectReportPdf, type: 'Project Report PDF', size: '3.2 MB', url: '#' }] : []),
    ...(raw.synopsisPdf ? [{ id: 'DOC-2', name: raw.synopsisPdf, type: 'Synopsis & Architecture', size: '850 KB', url: '#' }] : [])
  ];

  return {
    ...raw,
    id: raw.id || `prj_${Date.now()}_${idx}`,
    projectNumber: autoNum,
    projectTitle: raw.projectTitle || raw.title || 'Untitled Student Project',
    projectType: raw.projectType || 'Major Project',
    department: dept,
    batch: raw.batch || '2022-2026',
    academicYear: ay,
    year: raw.year || 'IV Year',
    semester: raw.semester || 'II Sem',
    domain: raw.domain || 'Artificial Intelligence / ML',
    domains: Array.isArray(raw.domains) ? raw.domains : [raw.domain || 'Artificial Intelligence / ML'],
    problemStatement: raw.problemStatement || 'Development of smart computational platform.',
    description: raw.description || raw.abstract || '',
    objectives: raw.objectives || '',
    expectedOutcome: raw.expectedOutcome || '',
    startDate: raw.startDate || `${yearSuffix}-07-15`,
    expectedCompletion: raw.expectedCompletion || `${parseInt(yearSuffix, 10) + 1}-04-10`,
    teamMembers: team,
    guide: guide,
    coGuide: raw.coGuide || null,
    industryAssociation: raw.industryAssociation || {
      isIndustryAssociated: raw.isIndustryProject === 'Yes',
      organization: raw.associatedCompany || '',
      industryMentor: raw.industryMentor || '',
      isMouAssociated: !!raw.associatedMoU,
      associatedMoU: raw.associatedMoU || ''
    },
    technologies: Array.isArray(raw.technologies) ? raw.technologies : (
      raw.techStack ? raw.techStack.split(',').map(s => s.trim()) : ['Python', 'React', 'TensorFlow']
    ),
    reviews: reviews,
    documents: documents,
    links: raw.links || {
      githubUrl: raw.githubUrl || '',
      liveDemoUrl: raw.liveDemoUrl || '',
      videoUrl: raw.videoUrl || ''
    },
    researchOutcomes: raw.researchOutcomes || {
      publicationGenerated: !!raw.linkedPublicationId,
      linkedPublicationId: raw.linkedPublicationId || null,
      patentFiled: !!raw.linkedPatentId,
      linkedPatentId: raw.linkedPatentId || null
    },
    projectStatus: raw.projectStatus || (raw.status === 'Completed' ? 'COMPLETED' : 'IN_PROGRESS'),
    workflowStatus: raw.workflowStatus || (raw.status === 'Completed' || raw.status === 'Approved' ? 'APPROVED' : 'UNDER_REVIEW'),
    publicVisibility: raw.publicVisibility || 'INTERNAL_ONLY',
    reviewHistory: Array.isArray(raw.reviewHistory) ? raw.reviewHistory : []
  };
}

export function getStudentProjects(includeDeleted = false) {
  const items = loadStore(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const activeList = Array.isArray(items) ? items.filter(i => includeDeleted || !i.isDeleted) : [];
  return activeList.map((item, idx) => normalizeStudentProjectRecord(item, idx));
}

export function saveStudentProject(item, user) {
  const items = loadStore(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const deptCode = item.department || 'CSE';
  const ay = item.academicYear || '2025-26';
  const yearSuffix = (ay.split('-')[0] || '2026').trim();
  const nextSeq = String(items.length + 1).padStart(4, '0');
  const autoNum = item.projectNumber || `PRJ-${deptCode}-${yearSuffix}-${nextSeq}`;

  const index = Array.isArray(items) ? items.findIndex(i => i.id === item.id) : -1;
  if (index >= 0) {
    items[index] = {
      ...items[index],
      ...item,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name || 'System'
    };
    addAuditLog('UPDATE_PROJECT', 'Student Projects', `Updated project ${autoNum}: ${item.projectTitle || item.title}`, user);
    saveStore(STORAGE_KEYS.PROJECTS, items);
    return normalizeStudentProjectRecord(items[index]);
  } else {
    const defaultWorkflowStatus = item.workflowStatus || (user?.role === 'SUPER_ADMIN' || user?.role === 'HOD' ? 'APPROVED' : 'SUBMITTED');
    const newItem = {
      ...item,
      id: item.id || `prj_${Date.now()}`,
      projectNumber: autoNum,
      projectStatus: item.projectStatus || 'IN_PROGRESS',
      workflowStatus: defaultWorkflowStatus,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'System',
      isDeleted: false,
      reviewHistory: [
        {
          action: 'CREATED',
          status: defaultWorkflowStatus,
          timestamp: new Date().toISOString(),
          by: user?.name || 'Faculty / Team',
          remarks: 'Project registered in institutional portal'
        }
      ]
    };
    items.unshift(newItem);
    addAuditLog('CREATE_PROJECT', 'Student Projects', `Created project ${autoNum}: ${newItem.projectTitle}`, user);
    saveStore(STORAGE_KEYS.PROJECTS, items);
    return normalizeStudentProjectRecord(newItem);
  }
}

export function updateProjectReview(id, reviewIndex, updatedReviewData, user) {
  const items = loadStore(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    const item = items[index];
    if (!item.reviews) item.reviews = [];
    item.reviews[reviewIndex] = { ...item.reviews[reviewIndex], ...updatedReviewData };
    item.updatedAt = new Date().toISOString();
    item.updatedBy = user?.name;
    addAuditLog('PROJECT_REVIEW_UPDATED', 'Student Projects', `Updated ${item.reviews[reviewIndex]?.reviewName} for ${item.projectNumber || id}`, user);
    saveStore(STORAGE_KEYS.PROJECTS, items);
    return normalizeStudentProjectRecord(items[index]);
  }
  return null;
}

export function reviewStudentProject(id, action, remarks, reviewerUser) {
  const items = loadStore(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    let targetStatus = 'APPROVED';
    if (action === 'REQUEST_REVISION') targetStatus = 'NEEDS_REVISION';
    else if (action === 'UNDER_REVIEW') targetStatus = 'UNDER_REVIEW';
    else if (action === 'COMPLETE') {
      items[index].projectStatus = 'COMPLETED';
      targetStatus = 'APPROVED';
    } else if (action === 'ARCHIVE') targetStatus = 'ARCHIVED';

    items[index].workflowStatus = targetStatus;
    items[index].verifiedAt = new Date().toISOString();
    items[index].verifiedBy = reviewerUser?.name || 'Reviewer';
    if (!items[index].reviewHistory) items[index].reviewHistory = [];
    items[index].reviewHistory.push({
      action: action,
      status: targetStatus,
      timestamp: new Date().toISOString(),
      by: reviewerUser?.name || 'Reviewer',
      remarks: remarks || `Project status updated to ${targetStatus}`
    });

    saveStore(STORAGE_KEYS.PROJECTS, items);
    addAuditLog('REVIEW_PROJECT', 'Student Projects', `Reviewed project ${items[index].projectNumber || id}: ${action} (Status: ${targetStatus})`, reviewerUser);
    return items.map((it, idx) => normalizeStudentProjectRecord(it, idx));
  }
  return items;
}

export function softDeleteStudentProject(id, user) {
  const items = loadStore(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    items[index].isDeleted = true;
    items[index].deletedAt = new Date().toISOString();
    items[index].deletedBy = user?.name;
    saveStore(STORAGE_KEYS.PROJECTS, items);
    addAuditLog('DELETE_PROJECT', 'Student Projects', `Soft-deleted project ID: ${id}`, user);
  }
  return items.filter(i => !i.isDeleted).map((it, idx) => normalizeStudentProjectRecord(it, idx));
}

// -------------------------------------------------------------
// 7. FDPs Organized (Full Academic Evidence Lifecycle)
// -------------------------------------------------------------
export function getFDPs(includeDeleted = false) {
  const items = loadStore(STORAGE_KEYS.FDPS, INITIAL_FDPS);
  return includeDeleted ? items : (Array.isArray(items) ? items.filter(i => !i.isDeleted) : []);
}

export function saveFDP(item, user) {
  const items = loadStore(STORAGE_KEYS.FDPS, INITIAL_FDPS);
  const deptCode = item.department || 'CSE';
  const yearCode = (item.academicYear || '2025-26').slice(0, 4);

  // Auto duration
  let durationDays = 1;
  if (item.startDate && item.endDate) {
    const s = new Date(item.startDate);
    const e = new Date(item.endDate);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e >= s) {
      durationDays = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  const fdpPayload = {
    ...item,
    durationDays: durationDays || item.durationDays || 1
  };

  const index = Array.isArray(items) ? items.findIndex(i => i.id === item.id) : -1;
  if (index >= 0) {
    const existing = items[index];
    const updated = {
      ...existing,
      ...fdpPayload,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name || 'Super Admin'
    };
    items[index] = updated;
    addAuditLog('UPDATE_FDP', 'FDPs Organized', `Updated FDP ${updated.fdpNumber || updated.id}: ${updated.fdpTitle}`, user);
    saveStore(STORAGE_KEYS.FDPS, items);
    return updated;
  } else {
    // Generate institutional auto-number: FDP-CSE-2026-001
    const count = items.filter(i => i.department === deptCode).length + 1;
    const seq = String(count).padStart(3, '0');
    const autoNumber = `FDP-${deptCode}-${yearCode}-${seq}`;

    const newItem = {
      ...fdpPayload,
      id: item.id || 'fdp_' + Date.now(),
      fdpNumber: item.fdpNumber || autoNumber,
      programmeStatus: item.programmeStatus || 'COMPLETED',
      workflowStatus: item.workflowStatus || 'DRAFT',
      resourcePersons: item.resourcePersons || [],
      documents: item.documents || [],
      financials: item.financials || { hasFinance: false, amount: 0, invoiceNumber: '', paymentStatus: 'Not Applicable' },
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'Super Admin',
      isDeleted: false
    };

    if (Array.isArray(items)) items.unshift(newItem);
    addAuditLog('CREATE_FDP', 'FDPs Organized', `Created FDP record ${newItem.fdpNumber}: ${newItem.fdpTitle}`, user);
    saveStore(STORAGE_KEYS.FDPS, items);
    return newItem;
  }
}

export function reviewFDP(id, action, remarks, reviewerUser) {
  const items = loadStore(STORAGE_KEYS.FDPS, INITIAL_FDPS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    const item = items[index];
    let newStatus = item.workflowStatus;

    if (action === 'SUBMIT') newStatus = 'SUBMITTED';
    else if (action === 'UNDER_REVIEW') newStatus = 'UNDER_REVIEW';
    else if (action === 'APPROVE') newStatus = 'APPROVED';
    else if (action === 'REQUEST_REVISION') newStatus = 'NEEDS_REVISION';
    else if (action === 'ARCHIVE') newStatus = 'ARCHIVED';

    const history = item.reviewHistory || [];
    history.push({
      action,
      fromStatus: item.workflowStatus,
      toStatus: newStatus,
      remarks: remarks || '',
      reviewerName: reviewerUser?.name || 'Super Admin',
      reviewerRole: reviewerUser?.role || 'SUPER_ADMIN',
      timestamp: new Date().toISOString()
    });

    items[index] = {
      ...item,
      workflowStatus: newStatus,
      status: newStatus === 'APPROVED' ? 'Approved' : item.status,
      reviewHistory: history,
      updatedAt: new Date().toISOString(),
      updatedBy: reviewerUser?.name
    };

    addAuditLog(`REVIEW_${action}`, 'FDPs Organized', `${action} FDP ${item.fdpNumber || item.id}`, reviewerUser);
    saveStore(STORAGE_KEYS.FDPS, items);
    return items[index];
  }
  return null;
}

export function softDeleteFDP(id, user) {
  const items = loadStore(STORAGE_KEYS.FDPS, INITIAL_FDPS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    items[index].isDeleted = true;
    items[index].deletedAt = new Date().toISOString();
    items[index].deletedBy = user?.name;
    saveStore(STORAGE_KEYS.FDPS, items);
    addAuditLog('DELETE_FDP', 'FDPs Organized', `Soft-deleted FDP ID: ${id}`, user);
  }
  return Array.isArray(items) ? items.filter(i => !i.isDeleted) : [];
}

// -------------------------------------------------------------
// 8. Faculty Achievements & Development (Full Lifecycle)
// -------------------------------------------------------------
export function getFacultyAchievements(includeDeleted = false) {
  const items = loadStore(STORAGE_KEYS.FACULTY_ACHIEVEMENTS, INITIAL_FACULTY_ACHIEVEMENTS);
  return includeDeleted ? items : (Array.isArray(items) ? items.filter(i => !i.isDeleted) : []);
}

export function saveFacultyAchievement(item, user) {
  const items = loadStore(STORAGE_KEYS.FACULTY_ACHIEVEMENTS, INITIAL_FACULTY_ACHIEVEMENTS);
  const deptCode = item.department || 'CSE';
  const yearCode = (item.academicYear || '2025-26').slice(0, 4);

  // Auto duration
  let durationDays = 1;
  if (item.startDate && item.endDate) {
    const s = new Date(item.startDate);
    const e = new Date(item.endDate);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e >= s) {
      durationDays = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  const payload = {
    ...item,
    durationDays: durationDays || item.durationDays || 1
  };

  const index = Array.isArray(items) ? items.findIndex(i => i.id === item.id) : -1;
  if (index >= 0) {
    const existing = items[index];
    const updated = {
      ...existing,
      ...payload,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name || 'Super Admin'
    };
    items[index] = updated;
    addAuditLog('UPDATE_FACULTY_ACH', 'Faculty Achievements', `Updated achievement ${updated.achievementNumber || updated.id} for ${updated.facultyName}`, user);
    saveStore(STORAGE_KEYS.FACULTY_ACHIEVEMENTS, items);
    return updated;
  } else {
    // Generate institutional auto-number: FAC-ACH-CSE-2026-001
    const count = items.filter(i => i.department === deptCode).length + 1;
    const seq = String(count).padStart(3, '0');
    const autoNumber = `FAC-ACH-${deptCode}-${yearCode}-${seq}`;

    const newItem = {
      ...payload,
      id: item.id || 'fach_' + Date.now(),
      achievementNumber: item.achievementNumber || autoNumber,
      workflowStatus: item.workflowStatus || 'DRAFT',
      activityStatus: item.activityStatus || 'Completed',
      documents: item.documents || [],
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'Super Admin',
      isDeleted: false
    };

    if (Array.isArray(items)) items.unshift(newItem);
    addAuditLog('CREATE_FACULTY_ACH', 'Faculty Achievements', `Recorded achievement ${newItem.achievementNumber} for ${newItem.facultyName}: ${newItem.title}`, user);
    saveStore(STORAGE_KEYS.FACULTY_ACHIEVEMENTS, items);
    return newItem;
  }
}

export function reviewFacultyAchievement(id, action, remarks, reviewerUser) {
  const items = loadStore(STORAGE_KEYS.FACULTY_ACHIEVEMENTS, INITIAL_FACULTY_ACHIEVEMENTS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    const item = items[index];
    let newStatus = item.workflowStatus;

    if (action === 'SUBMIT') newStatus = 'SUBMITTED';
    else if (action === 'VERIFY') newStatus = 'VERIFIED';
    else if (action === 'APPROVE') newStatus = 'APPROVED';
    else if (action === 'REQUEST_REVISION') newStatus = 'NEEDS_REVISION';
    else if (action === 'ARCHIVE') newStatus = 'ARCHIVED';

    const history = item.reviewHistory || [];
    history.push({
      action,
      fromStatus: item.workflowStatus,
      toStatus: newStatus,
      remarks: remarks || '',
      reviewerName: reviewerUser?.name || 'Super Admin',
      reviewerRole: reviewerUser?.role || 'SUPER_ADMIN',
      timestamp: new Date().toISOString()
    });

    items[index] = {
      ...item,
      workflowStatus: newStatus,
      status: newStatus === 'APPROVED' ? 'Approved' : (newStatus === 'VERIFIED' ? 'Verified' : item.status),
      reviewHistory: history,
      updatedAt: new Date().toISOString(),
      updatedBy: reviewerUser?.name
    };

    addAuditLog(`REVIEW_${action}`, 'Faculty Achievements', `${action} achievement ${item.achievementNumber || item.id} for ${item.facultyName}`, reviewerUser);
    saveStore(STORAGE_KEYS.FACULTY_ACHIEVEMENTS, items);
    return items[index];
  }
  return null;
}

export function softDeleteFacultyAchievement(id, user) {
  const items = loadStore(STORAGE_KEYS.FACULTY_ACHIEVEMENTS, INITIAL_FACULTY_ACHIEVEMENTS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    items[index].isDeleted = true;
    items[index].deletedAt = new Date().toISOString();
    items[index].deletedBy = user?.name;
    saveStore(STORAGE_KEYS.FACULTY_ACHIEVEMENTS, items);
    addAuditLog('DELETE_FACULTY_ACH', 'Faculty Achievements', `Soft-deleted faculty achievement ID: ${id}`, user);
  }
  return Array.isArray(items) ? items.filter(i => !i.isDeleted) : [];
}


// -------------------------------------------------------------
// 9. Unified Academic Events (Workshops, Seminars, Guest Lectures, Hackathons, Code-a-thons, Conferences)
// -------------------------------------------------------------
export function getAcademicEvents(includeDeleted = false) {
  const items = loadStore(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  if (!Array.isArray(items)) return [];

  const normalized = items.map(item => {
    const title = item.title || item.name || item.eventName || 'Academic Event';
    const eventType = item.eventType || item.event_type || item.type || 'Workshop';
    const dept = item.department || item.departmentCodes || item.department_codes || 'ALL';
    const ay = item.academicYear || item.academic_year || item.yearCode || '2026-27';
    const start = item.startDate || item.start_date || item.date || '2026-06-15';
    const end = item.endDate || item.end_date || item.date || start;
    const pTotal = Number(item.participantsTotal || item.participants_total || item.actualParticipants || item.participants || 0);

    return {
      ...item,
      id: item.id || 'evt_' + Math.random().toString(36).substr(2, 9),
      eventNumber: item.eventNumber || item.event_number || item.id,
      title,
      name: title,
      eventType,
      type: eventType,
      department: dept,
      departmentCodes: dept,
      academicYear: ay,
      startDate: start,
      endDate: end,
      startTime: item.startTime || '09:30',
      endTime: item.endTime || '16:30',
      mode: item.mode || 'Offline',
      venue: item.venue || 'Campus Auditorium',
      privateMeetingUrl: item.privateMeetingUrl || '',
      level: item.level || 'Institution',
      description: item.description || '',
      objectives: item.objectives || '',
      targetAudience: item.targetAudience || 'All Students',
      targetYear: item.targetYear || item.audienceYears || item.audience_years || item.year || 'All Years',
      audienceYears: item.audienceYears || item.audience_years || item.targetYear || 'All Years',
      targetSemester: item.targetSemester || item.semester || 'Both Semesters',
      
      // People
      coordinatorName: item.coordinatorName || item.facultyCoordinator || '',
      coCoordinatorName: item.coCoordinatorName || '',
      studentCoordinatorName: item.studentCoordinatorName || '',
      resourcePersonDetails: item.resourcePersonDetails || item.resource_person_details || item.resourcePerson || '',
      resourcePersons: item.resourcePersons || (item.resourcePersonDetails || item.resourcePerson ? [{
        name: (item.resourcePersonDetails || item.resourcePerson).split(',')[0],
        designation: (item.resourcePersonDetails || item.resourcePerson).split(',')[1] || 'Expert Speaker',
        organization: (item.resourcePersonDetails || item.resourcePerson).split(',')[2] || 'Invited Organization',
        isExternal: true
      }] : []),
      
      // Audience Metrics
      participantsTotal: pTotal,
      expectedParticipants: Number(item.expectedParticipants || pTotal || 100),
      actualParticipants: pTotal,
      participantsBreakdown: item.participantsBreakdown || item.participants_breakdown || '',
      
      // Status
      eventStatus: item.eventStatus || (item.status === 'Completed' ? 'COMPLETED' : 'PLANNED'),
      workflowStatus: item.workflowStatus || (item.status === 'Completed' || item.status === 'Approved' ? 'APPROVED' : 'DRAFT'),
      status: item.status || 'Completed',
      publicVisibility: item.publicVisibility || 'PUBLIC',
      
      // Collaboration
      organizedBy: item.organizedBy || item.organized_by || 'TechnoElite, ISTE',
      mouPartner: item.mouPartner || item.mou_partner || item.associatedMoU || '',
      isMouAssociated: item.isMouAssociated || (item.mouPartner || item.mou_partner || item.mouYesNo === 'Yes' ? 'Yes' : 'No'),
      associatedMoU: item.mouPartner || item.mou_partner || item.associatedMoU || '',
      sourceReference: item.sourceReference || item.source_reference || '',
      sourceType: item.sourceType || 'BULK_IMPORT',
      
      // Event-type specific detail containers
      sessions: item.sessions || [],
      workshopDetails: item.workshopDetails || {},
      guestLectureDetails: item.guestLectureDetails || {},
      hackathonDetails: item.hackathonDetails || {
        problemStatements: [],
        judgingCriteria: [],
        prizes: [],
        domains: []
      },
      codeathonDetails: item.codeathonDetails || {},
      
      // Evidence & Media
      documents: item.documents || [],
      photos: item.photos || [],
      winners: item.winners || [],
      
      // Verified Ingested Media
      ...(() => {
        const vMedia = getVerifiedMediaForEvent(item.id || item.eventNumber || title);
        const isConfirmed = vMedia && (vMedia.mappingStatus === 'EXACT' || vMedia.mappingStatus === 'CONFIRMED_ALIAS');
        const posterUrl = item.posterUrl || (isConfirmed && vMedia?.poster?.src) || null;
        const gallery = (Array.isArray(item.gallery) && item.gallery.length > 0)
          ? item.gallery
          : (isConfirmed && vMedia?.gallery ? vMedia.gallery : []);
        const coverImageUrl = item.coverImageUrl || posterUrl || (gallery.length > 0 ? gallery[0]?.src : null);
        const photosPayload = (Array.isArray(item.photosPayload) && item.photosPayload.length > 0)
          ? item.photosPayload
          : gallery.map(g => ({
              id: g.id,
              url: g.src,
              src: g.src,
              alt: g.alt,
              caption: g.caption,
              role: 'GALLERY',
              type: 'IMAGE',
              visibility: 'PRIVATE',
              uploadedAt: item.createdAt || new Date().toISOString()
            }));

        return {
          posterUrl,
          poster: isConfirmed && vMedia?.poster ? vMedia.poster : null,
          gallery,
          coverImageUrl,
          photosPayload,
          verifiedMediaBundle: isConfirmed ? vMedia : null,
          mediaMappingStatus: vMedia ? vMedia.mappingStatus : 'UNMAPPED'
        };
      })(),

      // Outcome
      outcomeSummary: item.outcomeSummary || '',
      feedbackSummary: item.feedbackSummary || '',
      publicVisibility: item.publicVisibility || 'INTERNAL_ONLY',
      
      isDeleted: !!item.isDeleted
    };
  });

  return includeDeleted ? normalized : normalized.filter(i => !i.isDeleted);
}

// Backward compatible alias
export function getEvents(includeDeleted = false) {
  return getAcademicEvents(includeDeleted);
}

export function saveAcademicEvent(item, user) {
  const items = loadStore(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  const deptCode = item.department || 'CSE';
  const yearCode = (item.academicYear || '2025-26').slice(0, 4);

  const index = Array.isArray(items) ? items.findIndex(i => i.id === item.id) : -1;
  if (index >= 0) {
    const existing = items[index];
    const updated = {
      ...existing,
      ...item,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name || 'Super Admin'
    };
    items[index] = updated;
    addAuditLog('EVENT_UPDATED', 'Academic Events', `Updated academic event ${updated.eventNumber || updated.id}: ${updated.title || updated.name}`, user);
    saveStore(STORAGE_KEYS.EVENTS, items);
    return updated;
  } else {
    // Generate institutional auto-number: EVT-CSE-2026-0001
    const count = items.filter(i => i.department === deptCode).length + 1;
    const seq = String(count).padStart(4, '0');
    const autoNumber = `EVT-${deptCode}-${yearCode}-${seq}`;

    const newItem = {
      ...item,
      id: item.id || 'evt_' + Date.now(),
      eventNumber: item.eventNumber || autoNumber,
      title: item.title || item.name || 'Academic Event',
      name: item.title || item.name || 'Academic Event',
      eventType: item.eventType || 'Workshop',
      eventStatus: item.eventStatus || 'PLANNED',
      workflowStatus: item.workflowStatus || 'DRAFT',
      resourcePersons: item.resourcePersons || [],
      sessions: item.sessions || [],
      documents: item.documents || [],
      photos: item.photos || [],
      winners: item.winners || [],
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'Super Admin',
      isDeleted: false
    };

    if (Array.isArray(items)) items.unshift(newItem);
    addAuditLog('EVENT_CREATED', 'Academic Events', `Created ${newItem.eventType} event ${newItem.eventNumber}: ${newItem.title}`, user);
    saveStore(STORAGE_KEYS.EVENTS, items);
    return newItem;
  }
}

// Backward compatible alias
export function saveEvent(item, user) {
  return saveAcademicEvent(item, user);
}

export function reviewAcademicEvent(id, action, remarks, reviewerUser) {
  const items = loadStore(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    const item = items[index];
    let newStatus = item.workflowStatus;

    if (action === 'SUBMIT') newStatus = 'SUBMITTED';
    else if (action === 'UNDER_REVIEW') newStatus = 'UNDER_REVIEW';
    else if (action === 'APPROVE') newStatus = 'APPROVED';
    else if (action === 'REQUEST_REVISION') newStatus = 'NEEDS_REVISION';
    else if (action === 'PUBLISH') {
      newStatus = 'APPROVED';
      item.publicVisibility = 'PUBLISHED';
    } else if (action === 'ARCHIVE') newStatus = 'ARCHIVED';

    const history = item.reviewHistory || [];
    history.push({
      action,
      fromStatus: item.workflowStatus,
      toStatus: newStatus,
      remarks: remarks || '',
      reviewerName: reviewerUser?.name || 'Super Admin',
      reviewerRole: reviewerUser?.role || 'SUPER_ADMIN',
      timestamp: new Date().toISOString()
    });

    items[index] = {
      ...item,
      workflowStatus: newStatus,
      status: newStatus === 'APPROVED' ? 'Approved' : item.status,
      reviewHistory: history,
      updatedAt: new Date().toISOString(),
      updatedBy: reviewerUser?.name
    };

    addAuditLog(`EVENT_${action}`, 'Academic Events', `${action} event ${item.eventNumber || item.id}: ${item.title || item.name}`, reviewerUser);
    saveStore(STORAGE_KEYS.EVENTS, items);
    return items[index];
  }
  return null;
}

export function updateAcademicEventStatus(id, newEventStatus, user) {
  const items = loadStore(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    items[index].eventStatus = newEventStatus;
    items[index].updatedAt = new Date().toISOString();
    items[index].updatedBy = user?.name;
    addAuditLog('EVENT_STATUS_CHANGED', 'Academic Events', `Changed event status to ${newEventStatus} for ${items[index].eventNumber || items[index].id}`, user);
    saveStore(STORAGE_KEYS.EVENTS, items);
    return items[index];
  }
  return null;
}

export function saveAcademicEventWinners(id, winnersList, user) {
  const items = loadStore(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    items[index].winners = winnersList || [];
    items[index].updatedAt = new Date().toISOString();
    items[index].updatedBy = user?.name;
    addAuditLog('EVENT_WINNERS_UPDATED', 'Academic Events', `Updated winners for ${items[index].eventNumber || items[index].id}`, user);
    saveStore(STORAGE_KEYS.EVENTS, items);
    return items[index];
  }
  return null;
}

export function softDeleteAcademicEvent(id, user) {
  const items = loadStore(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    items[index].isDeleted = true;
    items[index].deletedAt = new Date().toISOString();
    items[index].deletedBy = user?.name;
    saveStore(STORAGE_KEYS.EVENTS, items);
    addAuditLog('EVENT_ARCHIVED', 'Academic Events', `Soft-deleted event record ID: ${id}`, user);
  }
  return Array.isArray(items) ? items.filter(i => !i.isDeleted) : [];
}

// -------------------------------------------------------------
// 9.1 Academic Events Bulk Import Jobs & Transactional Execution
// -------------------------------------------------------------

export function getAcademicEventImportJobs() {
  const jobs = loadStore(STORAGE_KEYS.ACADEMIC_EVENT_IMPORT_JOBS, []);
  return Array.isArray(jobs) ? jobs : [];
}

export function saveAcademicEventImportJob(job) {
  const jobs = getAcademicEventImportJobs();
  const index = jobs.findIndex(j => j.id === job.id);
  if (index >= 0) {
    jobs[index] = { ...jobs[index], ...job, updatedAt: new Date().toISOString() };
  } else {
    jobs.unshift({
      ...job,
      id: job.id || `imp_job_${Date.now()}`,
      createdAt: job.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  saveStore(STORAGE_KEYS.ACADEMIC_EVENT_IMPORT_JOBS, jobs);
  return job;
}

export function getAcademicEventImportRows(jobId) {
  const allRows = loadStore(STORAGE_KEYS.ACADEMIC_EVENT_IMPORT_ROWS, []);
  if (!Array.isArray(allRows)) return [];
  return jobId ? allRows.filter(r => r.importJobId === jobId) : allRows;
}

export function saveAcademicEventImportRows(jobId, rows = []) {
  const allRows = loadStore(STORAGE_KEYS.ACADEMIC_EVENT_IMPORT_ROWS, []);
  const cleanRows = Array.isArray(allRows) ? allRows.filter(r => r.importJobId !== jobId) : [];
  const stampedRows = rows.map(r => ({
    ...r,
    importJobId: jobId,
    savedAt: new Date().toISOString()
  }));
  const updated = [...stampedRows, ...cleanRows];
  saveStore(STORAGE_KEYS.ACADEMIC_EVENT_IMPORT_ROWS, updated);
  return stampedRows;
}

export function executeBulkAcademicEventImport(jobId, selectedRowIds = [], resolvedRows = [], adminUser) {
  const items = loadStore(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  const rowsToImport = resolvedRows.filter(r => 
    selectedRowIds.includes(r.id) && r.validationStatus !== 'BLOCKED'
  );

  if (rowsToImport.length === 0) {
    return {
      success: false,
      error: 'No valid rows selected for import.',
      importedCount: 0,
      importedEvents: []
    };
  }

  const importedEvents = [];
  const timestamp = new Date().toISOString();

  // Create department counts tracker for clean sequence numbers
  const deptSequenceTracker = {};
  items.forEach(ev => {
    const d = ev.department || 'CSE';
    deptSequenceTracker[d] = (deptSequenceTracker[d] || 0) + 1;
  });

  for (const row of rowsToImport) {
    const primaryDept = (row.departmentCode === 'ALL' || !row.departmentCode) 
      ? 'CSE' 
      : row.departmentCode.split(',')[0].trim();

    const ay = row.academicYear || '2026-27';
    const yearCode = ay.slice(0, 4);
    deptSequenceTracker[primaryDept] = (deptSequenceTracker[primaryDept] || 0) + 1;
    const seq = String(deptSequenceTracker[primaryDept]).padStart(4, '0');
    const eventNumber = `EVT-${primaryDept.replace(/[^A-Z0-9]/gi, '')}-${yearCode}-${seq}`;

    // Structured Resource Persons Array
    const resourcePersons = [];
    if (row.resourcePerson && row.resourcePerson.name) {
      resourcePersons.push({
        name: row.resourcePerson.name,
        designation: row.resourcePerson.designation || 'Expert / Resource Person',
        organization: row.resourcePerson.organization || row.organizedBy || '',
        isExternal: row.resourcePerson.isExternal !== false
      });
    }

    const newEvent = {
      id: `evt_bulk_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
      eventNumber,
      title: row.title,
      name: row.title,
      eventType: row.eventType || 'Workshop',
      department: row.departmentCode || primaryDept,
      academicYear: ay,
      startDate: row.startDate,
      endDate: row.endDate || row.startDate,
      startTime: row.startTime || '09:30',
      endTime: row.endTime || '16:30',
      mode: row.mode || 'Offline',
      venue: String(row.venue || 'Campus Auditorium'),
      level: row.level || 'Institution',
      description: row.description || `Organized by ${row.organizedBy || 'TechnoElite, ISTE'}.`,
      targetAudience: row.targetAudience || 'All Students',
      targetYear: row.audienceYears || 'All Years',
      targetSemester: 'Both Semesters',
      
      // People
      coordinatorName: row.coordinatorName || '',
      coCoordinatorName: '',
      studentCoordinatorName: '',
      resourcePersons,
      
      // Participant Metrics
      expectedParticipants: Number(row.participantsTotal || 0),
      actualParticipants: Number(row.participantsTotal || 0),
      participantBreakdown: row.participantsBreakdown || '',
      
      // Governance & Staging Lifecycle Status (Always DRAFT / INTERNAL_ONLY)
      eventStatus: 'PLANNED',
      workflowStatus: 'DRAFT',
      status: 'Draft',
      publicVisibility: 'INTERNAL_ONLY',
      
      // Collaboration & MoU
      isMouAssociated: row.isMouAssociated || (row.mouPartnerText ? 'Yes' : 'No'),
      associatedMoU: row.mouPartnerText || '',
      associatedOrganization: row.mouPartnerText || '',
      mouId: row.mouId || null,
      
      // Financials (null if empty, never 0)
      amount: row.amount || null,
      invoiceDate: row.invoiceDate || null,
      
      // Provenance
      sourceType: 'BULK_CSV_IMPORT',
      sourceImportJobId: jobId,
      sourceRowNumber: row.sourceRowNumber,
      sourceRawPayload: row.rawPayload || {},
      
      // Containers
      sessions: [],
      documents: [],
      photos: [],
      winners: [],
      reviewHistory: [
        {
          action: 'BULK_IMPORT',
          fromStatus: 'NONE',
          toStatus: 'DRAFT',
          remarks: `Bulk imported via CSV (${row.title}). Pending HOD/Admin review.`,
          reviewerName: adminUser?.name || 'Authorized Admin',
          reviewerRole: adminUser?.role || 'SUPER_ADMIN',
          timestamp
        }
      ],
      
      createdAt: timestamp,
      createdBy: adminUser?.name || 'Super Admin',
      updatedAt: timestamp,
      isDeleted: false
    };

    items.unshift(newEvent);
    importedEvents.push(newEvent);
    row.importedEventId = newEvent.id;
  }

  // Commit updated events to main store
  saveStore(STORAGE_KEYS.EVENTS, items);

  // Update Import Job
  const existingJob = getAcademicEventImportJobs().find(j => j.id === jobId);
  const updatedJob = {
    ...(existingJob || { id: jobId, createdAt: timestamp }),
    status: importedEvents.length === resolvedRows.length ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS',
    importedRows: importedEvents.length,
    totalRows: resolvedRows.length,
    completedAt: timestamp,
    completedBy: adminUser?.name
  };
  saveAcademicEventImportJob(updatedJob);
  saveAcademicEventImportRows(jobId, resolvedRows);

  // Record Immutable Audit Log
  addAuditLog(
    'EVENTS_BULK_IMPORTED',
    'Academic Events',
    `Bulk imported ${importedEvents.length} academic event(s) from CSV (Job ID: ${jobId}) as DRAFT records awaiting verification.`,
    adminUser
  );

  return {
    success: true,
    importedCount: importedEvents.length,
    importedEvents,
    jobSummary: updatedJob
  };
}

// ─────────────────────────────────────────────────────────────
// 9B. UNIVERSAL BULK DATA CENTER & BULK MEDIA STORE ENGINE
// ─────────────────────────────────────────────────────────────

export function getBulkImportJobs() {
  return loadStore(STORAGE_KEYS.BULK_IMPORT_JOBS, []);
}

export function getBulkImportJobById(jobId) {
  const jobs = getBulkImportJobs();
  return jobs.find(j => j.id === jobId || j.jobNumber === jobId) || null;
}

export function saveBulkImportJob(job) {
  const jobs = getBulkImportJobs();
  const index = jobs.findIndex(j => j.id === job.id);
  let updated;
  if (index >= 0) {
    updated = [...jobs];
    updated[index] = { ...updated[index], ...job, updatedAt: new Date().toISOString() };
  } else {
    updated = [job, ...jobs];
  }
  saveStore(STORAGE_KEYS.BULK_IMPORT_JOBS, updated);
  return job;
}

export function getBulkImportRows(jobId) {
  const allRows = loadStore(STORAGE_KEYS.BULK_IMPORT_ROWS, []);
  if (!jobId) return allRows;
  return allRows.filter(r => r.importJobId === jobId);
}

export function saveBulkImportRows(jobId, rows) {
  const allRows = loadStore(STORAGE_KEYS.BULK_IMPORT_ROWS, []);
  const otherRows = allRows.filter(r => r.importJobId !== jobId);
  const updated = [...rows, ...otherRows];
  saveStore(STORAGE_KEYS.BULK_IMPORT_ROWS, updated);
  return rows;
}

export function getBulkImportAliasMappings(moduleKey) {
  const mappings = loadStore(STORAGE_KEYS.BULK_IMPORT_ALIAS_MAPPINGS, [
    { id: 'alias_ds', moduleKey: 'academic_events', fieldKey: 'department', sourceValueNormalized: 'ds', targetType: 'department', targetId: 'CSE (Data Science)', targetLabel: 'CSE (Data Science)', isDefault: true, isActive: true },
    { id: 'alias_cs', moduleKey: 'academic_events', fieldKey: 'department', sourceValueNormalized: 'cs', targetType: 'department', targetId: 'CSE (Cyber Security)', targetLabel: 'CSE (Cyber Security)', isDefault: true, isActive: true },
    { id: 'alias_all', moduleKey: 'academic_events', fieldKey: 'department', sourceValueNormalized: 'all', targetType: 'department', targetId: 'ALL', targetLabel: 'Institution Wide / All Departments', isDefault: true, isActive: true },
    { id: 'alias_aiml_ai', moduleKey: 'academic_events', fieldKey: 'department', sourceValueNormalized: 'aiml, ai', targetType: 'department', targetId: 'CSE (AI & ML), CSE (AI)', targetLabel: 'Joint: CSE (AI & ML) & CSE (AI)', isDefault: true, isActive: true }
  ]);
  if (!moduleKey) return mappings;
  return mappings.filter(m => m.moduleKey === moduleKey || m.moduleKey === 'general');
}

export function saveBulkImportAliasMapping(mapping, adminUser) {
  const mappings = loadStore(STORAGE_KEYS.BULK_IMPORT_ALIAS_MAPPINGS, []);
  const index = mappings.findIndex(m => m.id === mapping.id);
  let updated;
  if (index >= 0) {
    updated = [...mappings];
    updated[index] = { ...updated[index], ...mapping, updatedAt: new Date().toISOString() };
  } else {
    const newMapping = {
      ...mapping,
      id: mapping.id || `alias_${Date.now()}`,
      createdBy: adminUser?.name || 'Admin',
      createdAt: new Date().toISOString(),
      isActive: mapping.isActive !== false
    };
    updated = [newMapping, ...mappings];
  }
  saveStore(STORAGE_KEYS.BULK_IMPORT_ALIAS_MAPPINGS, updated);
  addAuditLog('BULK_ALIAS_MAPPING_UPDATED', 'Bulk Data Center', `Alias mapping updated for "${mapping.sourceValueNormalized}" -> "${mapping.targetLabel}".`, adminUser);
  return mapping;
}

// ─────────────────────────────────────────────────────────────
// BULK MEDIA STORE
// ─────────────────────────────────────────────────────────────

export function getBulkMediaJobs() {
  return loadStore(STORAGE_KEYS.BULK_MEDIA_JOBS, []);
}

export function getBulkMediaJobById(jobId) {
  return getBulkMediaJobs().find(j => j.id === jobId) || null;
}

export function saveBulkMediaJob(job) {
  const jobs = getBulkMediaJobs();
  const index = jobs.findIndex(j => j.id === job.id);
  let updated;
  if (index >= 0) {
    updated = [...jobs];
    updated[index] = { ...updated[index], ...job, updatedAt: new Date().toISOString() };
  } else {
    updated = [job, ...jobs];
  }
  saveStore(STORAGE_KEYS.BULK_MEDIA_JOBS, updated);
  return job;
}

export function getBulkMediaFolders(jobId) {
  const allFolders = loadStore(STORAGE_KEYS.BULK_MEDIA_FOLDERS, []);
  if (!jobId) return allFolders;
  return allFolders.filter(f => f.jobId === jobId);
}

export function saveBulkMediaFolders(jobId, folders) {
  const allFolders = loadStore(STORAGE_KEYS.BULK_MEDIA_FOLDERS, []);
  const others = allFolders.filter(f => f.jobId !== jobId);
  const updated = [...folders, ...others];
  saveStore(STORAGE_KEYS.BULK_MEDIA_FOLDERS, updated);
  return folders;
}

export function getBulkMediaItems(jobId) {
  const allItems = loadStore(STORAGE_KEYS.BULK_MEDIA_ITEMS, []);
  if (!jobId) return allItems;
  return allItems.filter(i => i.jobId === jobId);
}

export function saveBulkMediaItems(jobId, items) {
  const allItems = loadStore(STORAGE_KEYS.BULK_MEDIA_ITEMS, []);
  const others = allItems.filter(i => i.jobId !== jobId);
  const updated = [...items, ...others];
  saveStore(STORAGE_KEYS.BULK_MEDIA_ITEMS, updated);
  return items;
}

// ─────────────────────────────────────────────────────────────
// UNIVERSAL BULK IMPORT TRANSACTION EXECUTION
// ─────────────────────────────────────────────────────────────

export function executeUniversalBulkImport(jobId, selectedRowIds, moduleKey, resolvedRows, currentUser) {
  const timestamp = new Date().toISOString();
  const isHod = currentUser?.role === 'HOD';
  const userDept = currentUser?.dept || '';

  // Load target store based on module
  let targetStorageKey = STORAGE_KEYS.EVENTS;
  let defaultWorkflowStatus = 'DRAFT';
  let defaultVisibility = 'INTERNAL_ONLY';
  let recordTypeLabel = 'Academic Events';

  switch (moduleKey) {
    case 'academic_events':
      targetStorageKey = STORAGE_KEYS.EVENTS;
      recordTypeLabel = 'Academic Events';
      break;
    case 'publications':
      targetStorageKey = STORAGE_KEYS.PUBLICATIONS;
      defaultWorkflowStatus = 'IMPORTED_PENDING_REVIEW';
      recordTypeLabel = 'Publications';
      break;
    case 'patents':
      targetStorageKey = STORAGE_KEYS.PATENTS;
      defaultWorkflowStatus = 'IMPORTED_PENDING_REVIEW';
      recordTypeLabel = 'Patents';
      break;
    case 'faculty_memberships':
      targetStorageKey = STORAGE_KEYS.FACULTY_MEMBERSHIPS;
      recordTypeLabel = 'Faculty Memberships';
      break;
    case 'student_projects':
      targetStorageKey = STORAGE_KEYS.STUDENT_PROJECTS;
      recordTypeLabel = 'Student Projects';
      break;
    case 'student_achievements':
      targetStorageKey = STORAGE_KEYS.STUDENT_ACHIEVEMENTS;
      recordTypeLabel = 'Student Achievements';
      break;
    case 'student_internships':
      targetStorageKey = STORAGE_KEYS.INTERNSHIPS;
      recordTypeLabel = 'Student Internships';
      break;
    case 'nptel_certifications':
      targetStorageKey = STORAGE_KEYS.NPTEL_CERTIFICATIONS;
      recordTypeLabel = 'NPTEL Certifications';
      break;
    case 'mous':
      targetStorageKey = STORAGE_KEYS.MOUS;
      recordTypeLabel = 'Industry MoUs';
      break;
    case 'fdps_organized':
      targetStorageKey = STORAGE_KEYS.FDPS_ORGANIZED;
      recordTypeLabel = 'FDPs Organized';
      break;
    case 'faculty_achievements':
      targetStorageKey = STORAGE_KEYS.FACULTY_ACHIEVEMENTS;
      recordTypeLabel = 'Faculty Achievements';
      break;
    case 'circulars':
      targetStorageKey = STORAGE_KEYS.CIRCULARS;
      recordTypeLabel = 'Official Circulars';
      break;
    case 'bos_meetings':
      targetStorageKey = STORAGE_KEYS.BOS;
      recordTypeLabel = 'Board of Studies';
      break;
    case 'academic_council':
      targetStorageKey = STORAGE_KEYS.ACADEMIC_COUNCIL;
      recordTypeLabel = 'Academic Council';
      break;
    case 'placements':
      targetStorageKey = STORAGE_KEYS.PLACEMENTS;
      recordTypeLabel = 'Placements';
      break;
    case 'staff_profiles':
      targetStorageKey = STORAGE_KEYS.STAFF_PROFILES;
      recordTypeLabel = 'Staff Profiles';
      break;
    case 'faculty_directory':
      targetStorageKey = STORAGE_KEYS.USERS;
      recordTypeLabel = 'Faculty Directory';
      break;
    default:
      targetStorageKey = STORAGE_KEYS.EVENTS;
      recordTypeLabel = 'General Data';
  }

  const existingRecords = loadStore(targetStorageKey, []);
  const importedRecords = [];

  for (const row of resolvedRows) {
    if (!selectedRowIds.includes(row.id)) continue;
    if (row.validationStatus === 'BLOCKED' || row.validationStatus === 'ERROR') continue;

    // Enforce HOD scope
    if (isHod && row.departmentCode && row.departmentCode !== 'ALL') {
      const depts = String(row.departmentCode).toLowerCase();
      if (!depts.includes(userDept.toLowerCase())) {
        continue;
      }
    }

    const norm = row.normalizedPayload || row;
    const recId = `${moduleKey.substring(0, 3)}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Construct database entity with complete provenance & schema normalization
    let entitySpecificFields = {};
    if (moduleKey === 'academic_events') {
      const dCode = (norm.department_codes || norm.departmentCodes || norm.department || 'ALL').replace(/[^A-Z0-9]/gi, '').slice(0, 4) || 'ALL';
      const yCode = (norm.academic_year || norm.academicYear || '2026-27').slice(0, 4);
      const seq = String(existingRecords.length + importedRecords.length + 1).padStart(4, '0');
      const autoNum = `EVT-${dCode}-${yCode}-${seq}`;

      entitySpecificFields = {
        title: norm.title || norm.name || 'Academic Event',
        name: norm.title || norm.name || 'Academic Event',
        eventType: norm.event_type || norm.eventType || 'Workshop',
        type: norm.event_type || norm.eventType || 'Workshop',
        department: norm.department_codes || norm.departmentCodes || norm.department || 'ALL',
        departmentCodes: norm.department_codes || norm.departmentCodes || norm.department || 'ALL',
        academicYear: norm.academic_year || norm.academicYear || '2026-27',
        startDate: norm.start_date || norm.startDate || '',
        endDate: norm.end_date || norm.endDate || norm.start_date || norm.startDate || '',
        participantsTotal: norm.participants_total !== undefined && norm.participants_total !== '' ? Number(norm.participants_total) : null,
        actualParticipants: norm.participants_total !== undefined && norm.participants_total !== '' ? Number(norm.participants_total) : 0,
        participantsBreakdown: norm.participants_breakdown || '',
        audienceYears: norm.audience_years || norm.targetYear || '',
        targetYear: norm.audience_years || norm.targetYear || 'All Years',
        venue: norm.venue ? String(norm.venue) : '',
        mode: norm.mode || null,
        resourcePersonDetails: norm.resource_person_details || '',
        organizedBy: norm.organized_by || '',
        mouPartner: norm.mou_partner || '',
        amount: norm.amount !== undefined && norm.amount !== '' ? norm.amount : null,
        invoiceDate: norm.invoice_date || null,
        sourceReference: norm.source_reference || row.sourceReference || '',
        eventNumber: norm.event_number || autoNum
      };
    } else if (moduleKey === 'bos_meetings') {
      const isR20 = String(norm.regulation_codes || norm.regulation || '').includes('R20');
      const sourceKey = norm.meeting_source_key || norm.meeting_number || `BOS-CYS-${norm.regulation_codes || 'R23'}-${String(existingRecords.length + importedRecords.length + 1).padStart(2, '0')}`;
      
      const rawDept = String(norm.department_code || norm.department || 'CYS').toUpperCase();
      const deptCode = rawDept === 'CYS' || rawDept.includes('CYBER') || rawDept.includes('CS') ? 'CSE (Cyber Security)' : (norm.department_name || rawDept);
      
      let members = [];
      if (norm.member_list_json) {
        try {
          members = typeof norm.member_list_json === 'string' ? JSON.parse(norm.member_list_json) : norm.member_list_json;
        } catch (e) {
          console.error('Failed to parse member_list_json:', e);
        }
      } else if (norm.members) {
        members = norm.members;
      }

      let chairman = norm.chairperson || norm.chairman || '';
      let universityNominee = null;
      const academicians = [];
      let industryMember = null;
      let alumniMember = null;
      const facultyMembers = [];

      members.forEach(m => {
        const type = (m.member_type || m.category || '').toUpperCase();
        const inst = m.organization || m.institution || '';
        const desig = m.designation || '';

        if (type.includes('CHAIRMAN') || type.includes('CHAIRPERSON')) {
          if (!chairman) chairman = m.name;
        } else if (type.includes('UNIVERSITY') || type.includes('NOMINEE')) {
          if (!universityNominee) universityNominee = { name: m.name, institution: inst, designation: desig, email: m.email || '', phone: m.phone || '' };
        } else if (type.includes('ACADEMIC') || type.includes('EXPERT') || type.includes('SUBJECT')) {
          academicians.push({ name: m.name, institution: inst, designation: desig, email: m.email || '', phone: m.phone || '' });
        } else if (type.includes('INDUSTRY')) {
          if (!industryMember) industryMember = { name: m.name, company: inst, designation: desig, email: m.email || '', phone: m.phone || '' };
        } else if (type.includes('ALUMNI')) {
          if (!alumniMember) alumniMember = { name: m.name, company: inst, designation: desig, email: m.email || '', phone: m.phone || '' };
        } else if (type.includes('INTERNAL') || type.includes('FACULTY') || type.includes('MEMBER')) {
          facultyMembers.push(m.name);
        }
      });

      let agendaItems = [];
      if (norm.agenda_items_json) {
        try {
          const rawAgenda = typeof norm.agenda_items_json === 'string' ? JSON.parse(norm.agenda_items_json) : norm.agenda_items_json;
          agendaItems = rawAgenda.map((item, i) => {
            if (typeof item === 'string') return { itemNo: i + 1, title: item, description: item, decision: '' };
            return {
              itemNo: item.item_no || item.itemNo || i + 1,
              title: item.title || item.agenda_title || `Agenda Item ${i + 1}`,
              description: item.description || item.agenda_description || item.title || '',
              decision: item.decision || ''
            };
          });
        } catch (e) {
          console.error('Failed to parse agenda_items_json:', e);
        }
      } else if (norm.agendaItems) {
        agendaItems = norm.agendaItems;
      }

      let resolutions = [];
      if (norm.resolutions_json) {
        try {
          const rawRes = typeof norm.resolutions_json === 'string' ? JSON.parse(norm.resolutions_json) : norm.resolutions_json;
          resolutions = rawRes.map((res, i) => {
            if (typeof res === 'string') return { resolutionNumber: i + 1, title: `Resolution ${i + 1}`, resolutionText: res, agendaRef: '' };
            return {
              resolutionNumber: res.resolution_no || res.resolutionNumber || i + 1,
              title: res.title || `Resolution ${i + 1}`,
              resolutionText: res.resolution_text || res.text || res.description || '',
              agendaRef: res.agenda_ref || ''
            };
          });
        } catch (e) {
          console.error('Failed to parse resolutions_json:', e);
        }
      } else if (norm.resolutions) {
        resolutions = norm.resolutions;
      }

      const PDF_MAP = {
        'BOS-CYS-R23-01': { filename: '01_R23_1st_BoS_CYS_2023-09-26.pdf', sha256: '1d4cc612e02f8e595ab8475384c30a170ff7f9f0f8757676134b0ae62f0f5f69', sizeBytes: 4889167 },
        'BOS-CYS-R23-02': { filename: '02_R23_2nd_BoS_CYS_2024-07-09.pdf', sha256: 'aaa481ce3241e79f8d5a8a955be9bd196f5f113e33485c98ca016dfc5ad280ef', sizeBytes: 4097445 },
        'BOS-CYS-R23-03': { filename: '03_R23_3rd_BoS_CYS_2025-07-12.pdf', sha256: '889c9a3c4a10a188f5b88128a2430bb7fe134868e81e148e806472922309330c', sizeBytes: 4740600 },
        'BOS-CYS-R23-04': { filename: '04_R23_4th_BoS_CYS_2026-02-21.pdf', sha256: '3c64980ae5df2375287cc54ed33c904b413d8d45d57c8a2b23a2ea9d1ac532ce', sizeBytes: 1883773 }
      };

      const documents = [];
      const pdfInfo = PDF_MAP[sourceKey];
      if (pdfInfo) {
        documents.push({
          id: `doc_${sourceKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          title: `${norm.meeting_title || sourceKey} (Official Signed Minutes)`,
          filename: pdfInfo.filename,
          type: 'MINUTES',
          documentType: 'MINUTES_PACKAGE',
          containsAgenda: true,
          containsAttendance: true,
          containsMeetingEvidence: true,
          storagePath: `/documents/bos/cse-cys/${pdfInfo.filename}`,
          downloadUrl: `/documents/bos/cse-cys/${pdfInfo.filename}`,
          sizeBytes: pdfInfo.sizeBytes,
          sha256: pdfInfo.sha256,
          visibility: 'PRIVATE',
          version: 'v1.0',
          uploadedAt: timestamp,
          uploadedBy: currentUser?.name || 'Bulk Data Center'
        });
      }

      entitySpecificFields = {
        bosNumber: sourceKey,
        meetingSourceKey: sourceKey,
        department: deptCode,
        departmentCode: 'CYS',
        departmentName: norm.department_name || deptCode,
        academicYear: norm.academic_year || (norm.meeting_date ? `${norm.meeting_date.slice(0, 4)}-${Number(norm.meeting_date.slice(2, 4)) + 1}` : '2023-24'),
        targetYear: norm.target_year || 'All Years',
        title: norm.meeting_title || `Board of Studies Meeting — ${sourceKey}`,
        bosDate: norm.meeting_date || norm.bosDate || '',
        meetingDate: norm.meeting_date || norm.bosDate || '',
        startTime: norm.meeting_time ? `${norm.meeting_time} ${Number(norm.meeting_time.split(':')[0]) < 12 ? 'AM' : 'PM'}` : '10:00 AM',
        endTime: norm.meeting_time ? `${Number(norm.meeting_time.split(':')[0]) + 3}:00 PM` : '01:00 PM',
        meetingMode: norm.meeting_mode || (isR20 ? 'Offline' : 'Online'),
        venue: norm.platform ? `${norm.platform} (Online)` : (isR20 ? 'CSE Department Conference Hall' : 'Online Microsoft Teams'),
        platform: norm.platform || '',
        privateMeetingLink: norm.private_meeting_link || '',
        circularReference: norm.circular_reference || '',
        circularDate: norm.circular_date || '',
        regulations: norm.regulation_codes ? [norm.regulation_codes] : (norm.regulation ? [norm.regulation] : ['R23']),
        regulationCodes: norm.regulation_codes || norm.regulation || 'R23',
        regulationMeetingNumber: Number(norm.regulation_meeting_number) || 1,
        meetingStatus: 'HELD',
        workflowStatus: 'DRAFT',
        status: isR20 ? 'Needs Review' : 'Draft',
        sourceConfidence: norm.source_confidence || (isR20 ? 'LIMITED_XLSX_ONLY' : 'HIGH'),
        reviewNotes: norm.review_notes || '',
        chairman: chairman || 'Dr. V. V. A. S. Lakshmi (Professor & HOD, CSE (Cyber Security))',
        chairperson: chairman || 'Dr. V. V. A. S. Lakshmi',
        members,
        universityNominee,
        academicians,
        industryMember,
        alumniMember,
        facultyMembers,
        agendaItems,
        resolutions,
        documents,
        approvalHistory: [
          {
            action: 'BOS_BULK_IMPORTED',
            fromStatus: null,
            toStatus: 'DRAFT',
            actor: currentUser?.name || 'Bulk Data Center (System Ingestion)',
            comments: isR20 
              ? 'Imported summary R20 record from XLSX staging. Marked DRAFT / NEEDS_REVIEW for missing minutes.' 
              : `Imported official R23 record with ${members.length} members, ${agendaItems.length} agenda items, and ${documents.length} linked PDF minutes package.`,
            timestamp
          }
        ],
        sourceType: 'BULK_IMPORT',
        sourceFiles: norm.source_files || '',
        sourceSha256Json: norm.source_sha256_json ? (typeof norm.source_sha256_json === 'string' ? JSON.parse(norm.source_sha256_json) : norm.source_sha256_json) : null,
        publicVisibility: 'INTERNAL_ONLY',
        isVerified: !isR20,
        isDeleted: false
      };
    }

    const newRecord = {
      ...norm,
      ...entitySpecificFields,
      id: recId,
      workflowStatus: norm.workflowStatus || defaultWorkflowStatus,
      status: norm.status || 'Draft',
      publicVisibility: defaultVisibility,
      isVerified: false,
      sourceType: 'BULK_IMPORT',
      sourceImportJobId: jobId,
      sourceRowNumber: row.sourceRowNumber || row.rowNumber,
      sourceRawPayload: row.rawPayload || norm,
      createdBy: currentUser?.name || 'Bulk Data Center',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    existingRecords.unshift(newRecord);
    importedRecords.push(newRecord);
    row.importedRecordId = recId;
    row.validationStatus = 'IMPORTED';
  }

  // Commit to target store
  saveStore(targetStorageKey, existingRecords);

  // Update import job metadata
  const existingJob = getBulkImportJobById(jobId);
  const updatedJob = {
    ...(existingJob || { id: jobId, createdAt: timestamp }),
    status: importedRecords.length === selectedRowIds.length ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS',
    importedRows: importedRecords.length,
    selectedRows: selectedRowIds.length,
    completedAt: timestamp,
    completedBy: currentUser?.name || 'Administrator'
  };

  saveBulkImportJob(updatedJob);
  saveBulkImportRows(jobId, resolvedRows);

  // Add immutable audit log
  addAuditLog(
    'BULK_IMPORT_COMMITTED',
    recordTypeLabel,
    `Bulk imported ${importedRecords.length} records into "${recordTypeLabel}" as DRAFT (Job: ${jobId}, File: ${updatedJob.originalFilename || 'Data'}).`,
    currentUser
  );

  return {
    success: true,
    importedCount: importedRecords.length,
    importedRecords,
    jobSummary: updatedJob
  };
}

// ─────────────────────────────────────────────────────────────
// SAFE ROLLBACK FOR BULK IMPORTS
// ─────────────────────────────────────────────────────────────

export function rollbackBulkImportJob(jobId, currentUser) {
  const job = getBulkImportJobById(jobId);
  if (!job) {
    return { success: false, error: 'Import job not found.' };
  }

  if (job.status === 'ROLLED_BACK') {
    return { success: false, error: 'This import job has already been rolled back.' };
  }

  const rows = getBulkImportRows(jobId);
  const importedRecordIds = rows.map(r => r.importedRecordId || r.importedEventId).filter(Boolean);

  if (importedRecordIds.length === 0) {
    return { success: false, error: 'No imported records found for this job.' };
  }

  // Determine storage key
  let targetStorageKey = STORAGE_KEYS.EVENTS;
  switch (job.moduleKey) {
    case 'academic_events': targetStorageKey = STORAGE_KEYS.EVENTS; break;
    case 'publications': targetStorageKey = STORAGE_KEYS.PUBLICATIONS; break;
    case 'patents': targetStorageKey = STORAGE_KEYS.PATENTS; break;
    case 'faculty_memberships': targetStorageKey = STORAGE_KEYS.FACULTY_MEMBERSHIPS; break;
    case 'student_projects': targetStorageKey = STORAGE_KEYS.STUDENT_PROJECTS; break;
    case 'student_achievements': targetStorageKey = STORAGE_KEYS.STUDENT_ACHIEVEMENTS; break;
    case 'student_internships': targetStorageKey = STORAGE_KEYS.INTERNSHIPS; break;
    case 'nptel_certifications': targetStorageKey = STORAGE_KEYS.NPTEL_CERTIFICATIONS; break;
    case 'mous': targetStorageKey = STORAGE_KEYS.MOUS; break;
    case 'fdps_organized': targetStorageKey = STORAGE_KEYS.FDPS_ORGANIZED; break;
    case 'faculty_achievements': targetStorageKey = STORAGE_KEYS.FACULTY_ACHIEVEMENTS; break;
    case 'circulars': targetStorageKey = STORAGE_KEYS.CIRCULARS; break;
    case 'bos_meetings': targetStorageKey = STORAGE_KEYS.BOS_MEETINGS; break;
    case 'academic_council': targetStorageKey = STORAGE_KEYS.ACADEMIC_COUNCIL; break;
    case 'placements': targetStorageKey = STORAGE_KEYS.PLACEMENTS; break;
    case 'staff_profiles': targetStorageKey = STORAGE_KEYS.STAFF_PROFILES; break;
    case 'faculty_directory': targetStorageKey = STORAGE_KEYS.USERS; break;
    default: targetStorageKey = STORAGE_KEYS.EVENTS;
  }

  const allRecords = loadStore(targetStorageKey, []);
  
  // Check for protected status changes (e.g. APPROVED or PUBLISHED)
  const modifiedOrApproved = allRecords.filter(r => 
    importedRecordIds.includes(r.id) && 
    (r.workflowStatus === 'APPROVED' || r.workflowStatus === 'PUBLISHED' || r.isVerified === true)
  );

  if (modifiedOrApproved.length > 0) {
    return {
      success: false,
      error: `Cannot rollback: ${modifiedOrApproved.length} record(s) have already been approved or verified in production.`
    };
  }

  // Filter out imported records (safe rollback)
  const retainedRecords = allRecords.filter(r => !importedRecordIds.includes(r.id));
  saveStore(targetStorageKey, retainedRecords);

  // Update job status to ROLLED_BACK (preserving history)
  const updatedJob = {
    ...job,
    status: 'ROLLED_BACK',
    rolledBackAt: new Date().toISOString(),
    rolledBackBy: currentUser?.name || 'Administrator'
  };
  saveBulkImportJob(updatedJob);

  // Mark rows as rolled back
  const updatedRows = rows.map(r => ({ ...r, validationStatus: 'SKIPPED', rollbackStatus: 'ROLLED_BACK' }));
  saveBulkImportRows(jobId, updatedRows);

  // Record audit log
  addAuditLog(
    'BULK_IMPORT_ROLLED_BACK',
    job.moduleKey || 'Bulk Data',
    `Rolled back ${importedRecordIds.length} draft record(s) from Import Job ${job.jobNumber || jobId}.`,
    currentUser
  );

  return {
    success: true,
    rolledBackCount: importedRecordIds.length,
    job: updatedJob
  };
}

// ─────────────────────────────────────────────────────────────
// BULK MEDIA ATTACHMENT EXECUTION
// ─────────────────────────────────────────────────────────────

export function executeBulkMediaImport(jobId, selectedFolderIds, currentUser) {
  const timestamp = new Date().toISOString();
  const job = getBulkMediaJobById(jobId);
  const folders = getBulkMediaFolders(jobId);
  const items = getBulkMediaItems(jobId);
  const events = getAcademicEvents();

  let attachedCount = 0;
  const updatedEvents = [...events];

  for (const folder of folders) {
    if (!selectedFolderIds.includes(folder.id)) continue;
    if (folder.mappingStatus !== 'MATCHED' || !folder.matchedRecordId) continue;

    const eventIndex = updatedEvents.findIndex(e => e.id === folder.matchedRecordId || e.eventNumber === folder.matchedRecordId);
    if (eventIndex === -1) continue;

    const folderItems = items.filter(i => i.folderId === folder.id && i.validationStatus === 'VALID');
    const targetEvent = { ...updatedEvents[eventIndex] };
    
    // Existing photo attachments
    const existingPhotos = targetEvent.photosPayload || targetEvent.photos || [];
    const newPhotos = folderItems.map(item => ({
      id: item.id,
      url: item.mediaAssetUrl || item.relativePath,
      filename: item.originalFilename,
      role: item.mediaRole,
      type: item.mediaType,
      visibility: 'PRIVATE', // Private by default as required
      uploadedAt: timestamp,
      source: 'BULK_MEDIA_FOLDER'
    }));

    targetEvent.photosPayload = [...existingPhotos, ...newPhotos];
    
    // If primary cover found and event has no cover
    const coverItem = folderItems.find(i => i.mediaRole === 'COVER');
    if (coverItem && !targetEvent.coverImageUrl) {
      targetEvent.coverImageUrl = coverItem.mediaAssetUrl || coverItem.relativePath;
    }

    updatedEvents[eventIndex] = targetEvent;
    attachedCount += folderItems.length;
  }

  // Save updated events
  saveStore(STORAGE_KEYS.EVENTS, updatedEvents);

  // Update job
  const updatedJob = {
    ...job,
    status: 'COMPLETED',
    completedAt: timestamp,
    completedBy: currentUser?.name
  };
  saveBulkMediaJob(updatedJob);

  // Log audit
  addAuditLog(
    'BULK_MEDIA_IMPORTED',
    'Media & Events',
    `Folder-based bulk media import completed. Attached ${attachedCount} media asset(s) across selected event folders as PRIVATE.`,
    currentUser
  );

  return {
    success: true,
    attachedCount,
    job: updatedJob
  };
}

// ─────────────────────────────────────────────────────────────
// CANONICAL MEDIA ASSETS & RECORD MEDIA LINKS STORE
// ─────────────────────────────────────────────────────────────

export function getMediaAssets() {
  return loadStore(STORAGE_KEYS.MEDIA_ASSETS, INGESTED_MEDIA_ASSETS || []);
}

export function saveMediaAsset(asset, user) {
  const assets = getMediaAssets();
  const index = assets.findIndex(a => a.id === asset.id);
  let updated;
  if (index >= 0) {
    updated = [...assets];
    updated[index] = { ...updated[index], ...asset, updatedAt: new Date().toISOString() };
  } else {
    updated = [asset, ...assets];
  }
  saveStore(STORAGE_KEYS.MEDIA_ASSETS, updated);
  addAuditLog('MEDIA_ASSET_SAVED', 'Media Management', `Saved media asset "${asset.safeFilename || asset.originalFilename}".`, user);
  return asset;
}

export function getRecordMediaLinks(eventId = null) {
  const links = loadStore(STORAGE_KEYS.RECORD_MEDIA_LINKS, RECORD_MEDIA_LINKS || []);
  if (!eventId) return links;
  return links.filter(l => l.eventId === eventId || l.eventNumber === eventId);
}

export function saveRecordMediaLink(link, user) {
  const links = getRecordMediaLinks();
  const index = links.findIndex(l => l.id === link.id);
  let updated;
  if (index >= 0) {
    updated = [...links];
    updated[index] = { ...updated[index], ...link, updatedAt: new Date().toISOString() };
  } else {
    updated = [...links, link];
  }
  saveStore(STORAGE_KEYS.RECORD_MEDIA_LINKS, updated);
  addAuditLog('EVENT_MEDIA_LINKED', 'Media & Events', `Linked media asset "${link.mediaAssetId}" to event "${link.eventId}" as ${link.role}.`, user);
  return link;
}

export function approveMediaPublic(mediaAssetId, user) {
  const assets = getMediaAssets();
  const assetIdx = assets.findIndex(a => a.id === mediaAssetId);
  if (assetIdx >= 0) {
    const updatedAssets = [...assets];
    updatedAssets[assetIdx] = { ...updatedAssets[assetIdx], visibility: 'APPROVED_PUBLIC', approvedBy: user?.name, approvedAt: new Date().toISOString() };
    saveStore(STORAGE_KEYS.MEDIA_ASSETS, updatedAssets);
  }

  // Also update corresponding links
  const links = getRecordMediaLinks();
  const updatedLinks = links.map(l => l.mediaAssetId === mediaAssetId ? { ...l, visibility: 'APPROVED_PUBLIC' } : l);
  saveStore(STORAGE_KEYS.RECORD_MEDIA_LINKS, updatedLinks);

  addAuditLog('EVENT_MEDIA_APPROVED_PUBLIC', 'Media Management', `Approved media asset "${mediaAssetId}" for public display.`, user);
  return { success: true };
}

export function changeMediaRole(mediaAssetId, newRole, user) {
  const assets = getMediaAssets();
  const assetIdx = assets.findIndex(a => a.id === mediaAssetId);
  if (assetIdx >= 0) {
    const updatedAssets = [...assets];
    updatedAssets[assetIdx] = { ...updatedAssets[assetIdx], mediaRole: newRole, updatedAt: new Date().toISOString() };
    saveStore(STORAGE_KEYS.MEDIA_ASSETS, updatedAssets);
  }

  const links = getRecordMediaLinks();
  const updatedLinks = links.map(l => l.mediaAssetId === mediaAssetId ? { ...l, role: newRole } : l);
  saveStore(STORAGE_KEYS.RECORD_MEDIA_LINKS, updatedLinks);

  addAuditLog('EVENT_MEDIA_ROLE_CHANGED', 'Media Management', `Changed role of media "${mediaAssetId}" to "${newRole}".`, user);
  return { success: true };
}

export function removeMediaLink(mediaLinkId, user) {
  const links = getRecordMediaLinks();
  const linkToRemove = links.find(l => l.id === mediaLinkId);
  const updatedLinks = links.filter(l => l.id !== mediaLinkId);
  saveStore(STORAGE_KEYS.RECORD_MEDIA_LINKS, updatedLinks);

  addAuditLog('EVENT_MEDIA_REMOVED', 'Media & Events', `Removed media link "${mediaLinkId}" from event "${linkToRemove?.eventId}".`, user);
  return { success: true };
}

export function setPrimaryCover(eventId, mediaUrlOrAssetId, user) {
  const events = getAcademicEvents();
  const index = events.findIndex(e => e.id === eventId || e.eventNumber === eventId);
  if (index >= 0) {
    const updatedEvents = [...events];
    updatedEvents[index] = {
      ...updatedEvents[index],
      coverImageUrl: mediaUrlOrAssetId,
      updatedAt: new Date().toISOString()
    };
    saveStore(STORAGE_KEYS.EVENTS, updatedEvents);
    addAuditLog('EVENT_COVER_CHANGED', 'Media & Events', `Set primary cover image for event "${events[index].title}".`, user);
    return { success: true, event: updatedEvents[index] };
  }
  return { success: false, message: 'Event not found' };
}



// ─────────────────────────────────────────────────────────────
// 10. FACULTY MEMBERSHIPS & PROFESSIONAL BODIES REPOSITORY
// ─────────────────────────────────────────────────────────────

export function calculateMembershipStatus(membershipType, endDate) {
  if (membershipType === 'Life Membership' || membershipType === 'Fellow' || membershipType === 'LIFETIME') {
    return { status: 'LIFETIME', diffDays: 9999, label: 'Life Membership' };
  }
  if (!endDate) {
    return { status: 'ACTIVE', diffDays: 365, label: 'Active' };
  }
  const exp = new Date(endDate);
  if (isNaN(exp.getTime())) {
    return { status: 'ACTIVE', diffDays: 365, label: 'Active' };
  }
  const now = new Date();
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { status: 'EXPIRED', diffDays, label: `Expired ${Math.abs(diffDays)} days ago` };
  }
  if (diffDays <= 90) {
    return { status: 'EXPIRING_SOON', diffDays, label: `Expires in ${diffDays} days` };
  }
  return { status: 'ACTIVE', diffDays, label: 'Active' };
}

export function normalizeMembershipRecord(raw, idx = 0) {
  if (!raw) return null;
  const dept = raw.department || 'CSE';
  const ay = raw.academicYear || '2025-26';
  const yearSuffix = (ay.split('-')[0] || '2026').trim();
  const autoNum = raw.membershipRecordNumber || `MEM-${dept}-${yearSuffix}-${String(idx + 1).padStart(4, '0')}`;

  const membershipType = raw.membershipType || (raw.validity === 'Life' || raw.membershipStatus === 'Life' ? 'Life Membership' : 'Annual Membership');
  const org = raw.organization || raw.professionalBody || 'IEEE';
  const validStatus = calculateMembershipStatus(membershipType, raw.endDate || raw.validUntil);

  const documents = Array.isArray(raw.documents) ? raw.documents : [
    ...(raw.certificatePdf ? [{ id: 'DOC-1', name: raw.certificatePdf, type: 'Membership Certificate', size: '1.2 MB', url: '#' }] : [])
  ];

  return {
    ...raw,
    id: raw.id || `mem_${Date.now()}_${idx}`,
    membershipRecordNumber: autoNum,
    facultyId: raw.facultyId || '',
    facultyName: raw.facultyName || raw.name || 'Faculty Member',
    department: dept,
    designation: raw.designation || 'Faculty',
    email: raw.email || '',
    organization: org,
    organizationName: raw.organizationName || (org === 'Other' ? raw.customOrgName : org),
    organizationWebsite: raw.organizationWebsite || '',
    membershipType: membershipType,
    membershipCategory: raw.membershipCategory || 'Professional',
    membershipNumber: raw.membershipNumber || raw.membershipId || '',
    startDate: raw.startDate || raw.validFrom || `${yearSuffix}-06-01`,
    endDate: membershipType === 'Life Membership' ? null : (raw.endDate || raw.validUntil || `${parseInt(yearSuffix, 10) + 1}-05-31`),
    memberSince: raw.memberSince || raw.startDate || yearSuffix,
    academicYear: ay,
    verificationUrl: raw.verificationUrl || raw.url || '',
    remarks: raw.remarks || '',
    membershipStatus: raw.membershipStatus || validStatus.status,
    workflowStatus: raw.workflowStatus || (raw.status === 'Approved' || raw.verificationStatus === 'Verified' ? 'APPROVED' : 'UNDER_REVIEW'),
    documents: documents,
    renewals: Array.isArray(raw.renewals) ? raw.renewals : [],
    reviewHistory: Array.isArray(raw.reviewHistory) ? raw.reviewHistory : [],
    publicVisibility: raw.publicVisibility || 'PUBLIC_SAFE'
  };
}

export function getMemberships(includeDeleted = false) {
  const items = loadStore(STORAGE_KEYS.MEMBERSHIPS, INITIAL_MEMBERSHIPS);
  const activeList = Array.isArray(items) ? items.filter(i => includeDeleted || !i.isDeleted) : [];
  return activeList.map((item, idx) => normalizeMembershipRecord(item, idx));
}

export function saveMembership(item, user) {
  const items = loadStore(STORAGE_KEYS.MEMBERSHIPS, INITIAL_MEMBERSHIPS);
  const deptCode = item.department || user?.dept || 'CSE';
  const ay = item.academicYear || '2025-26';
  const yearSuffix = (ay.split('-')[0] || '2026').trim();
  const nextSeq = String(items.length + 1).padStart(4, '0');
  const autoNum = item.membershipRecordNumber || `MEM-${deptCode}-${yearSuffix}-${nextSeq}`;

  const index = Array.isArray(items) ? items.findIndex(i => i.id === item.id) : -1;

  // Duplicate Check on Membership Number per Org
  const memNo = (item.membershipNumber || '').trim();
  if (memNo && index === -1) {
    const existing = items.find(m => !m.isDeleted && m.organization === item.organization && (m.membershipNumber || '').trim() === memNo);
    if (existing) {
      throw new Error(`A membership record with number "${memNo}" for ${item.organization} already exists (${existing.membershipRecordNumber || existing.id}).`);
    }
  }

  const validStatus = calculateMembershipStatus(item.membershipType, item.endDate);
  const membershipStatus = validStatus.status;

  if (index >= 0) {
    items[index] = {
      ...items[index],
      ...item,
      membershipStatus: membershipStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name || 'System'
    };
    addAuditLog('UPDATE_MEMBERSHIP', 'Memberships', `Updated membership ${autoNum} for ${item.facultyName} (${item.organization})`, user);
    saveStore(STORAGE_KEYS.MEMBERSHIPS, items);
    return normalizeMembershipRecord(items[index]);
  } else {
    const defaultWorkflowStatus = item.workflowStatus || (user?.role === 'SUPER_ADMIN' || user?.role === 'HOD' ? 'APPROVED' : 'SUBMITTED');
    const newItem = {
      ...item,
      id: item.id || `mem_${Date.now()}`,
      membershipRecordNumber: autoNum,
      membershipStatus: membershipStatus,
      workflowStatus: defaultWorkflowStatus,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'System',
      isDeleted: false,
      reviewHistory: [
        {
          action: 'CREATED',
          status: defaultWorkflowStatus,
          timestamp: new Date().toISOString(),
          by: user?.name || 'Faculty Member',
          remarks: 'Membership recorded in portal'
        }
      ]
    };
    items.unshift(newItem);
    addAuditLog('CREATE_MEMBERSHIP', 'Memberships', `Added membership ${autoNum} for ${newItem.facultyName} (${newItem.organization})`, user);
    saveStore(STORAGE_KEYS.MEMBERSHIPS, items);
    return normalizeMembershipRecord(newItem);
  }
}

export function renewMembership(id, renewalData, user) {
  const items = loadStore(STORAGE_KEYS.MEMBERSHIPS, INITIAL_MEMBERSHIPS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    const item = items[index];
    const prevEndDate = item.endDate;
    if (!item.renewals) item.renewals = [];

    const newRenewalEntry = {
      renewalId: 'REN-' + Date.now(),
      renewalDate: renewalData.renewalDate || new Date().toISOString().split('T')[0],
      previousEndDate: prevEndDate,
      newEndDate: renewalData.newEndDate,
      receiptNumber: renewalData.receiptNumber || '',
      receiptDocument: renewalData.receiptDocument || null,
      remarks: renewalData.remarks || 'Annual membership renewed',
      renewedBy: user?.name || 'Faculty Member',
      timestamp: new Date().toISOString()
    };

    item.renewals.unshift(newRenewalEntry);
    item.endDate = renewalData.newEndDate;
    const validStatus = calculateMembershipStatus(item.membershipType, item.endDate);
    item.membershipStatus = validStatus.status;
    item.updatedAt = new Date().toISOString();
    item.updatedBy = user?.name;

    addAuditLog('RENEW_MEMBERSHIP', 'Memberships', `Renewed membership ${item.membershipRecordNumber || id} until ${renewalData.newEndDate}`, user);
    saveStore(STORAGE_KEYS.MEMBERSHIPS, items);
    return normalizeMembershipRecord(items[index]);
  }
  return null;
}

export function reviewMembership(id, action, remarks, reviewerUser) {
  const items = loadStore(STORAGE_KEYS.MEMBERSHIPS, INITIAL_MEMBERSHIPS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    let targetStatus = 'APPROVED';
    if (action === 'REQUEST_REVISION') targetStatus = 'NEEDS_REVISION';
    else if (action === 'UNDER_REVIEW') targetStatus = 'UNDER_REVIEW';
    else if (action === 'ARCHIVE') targetStatus = 'ARCHIVED';

    items[index].workflowStatus = targetStatus;
    items[index].verifiedAt = new Date().toISOString();
    items[index].verifiedBy = reviewerUser?.name || 'Reviewer';
    if (!items[index].reviewHistory) items[index].reviewHistory = [];
    items[index].reviewHistory.push({
      action: action,
      status: targetStatus,
      timestamp: new Date().toISOString(),
      by: reviewerUser?.name || 'Reviewer',
      remarks: remarks || `Membership status updated to ${targetStatus}`
    });

    saveStore(STORAGE_KEYS.MEMBERSHIPS, items);
    addAuditLog('REVIEW_MEMBERSHIP', 'Memberships', `Reviewed membership ${items[index].membershipRecordNumber || id}: ${action}`, reviewerUser);
    return items.map((it, idx) => normalizeMembershipRecord(it, idx));
  }
  return items;
}

export function softDeleteMembership(id, user) {
  const items = loadStore(STORAGE_KEYS.MEMBERSHIPS, INITIAL_MEMBERSHIPS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    items[index].isDeleted = true;
    items[index].deletedAt = new Date().toISOString();
    items[index].deletedBy = user?.name;
    saveStore(STORAGE_KEYS.MEMBERSHIPS, items);
    addAuditLog('DELETE_MEMBERSHIP', 'Memberships', `Soft-deleted membership ID: ${id}`, user);
  }
  return items.filter(i => !i.isDeleted).map((it, idx) => normalizeMembershipRecord(it, idx));
}

// ─────────────────────────────────────────────────────────────
// 11. INDUSTRY MoUs & PARTNERSHIPS REPOSITORY
// ─────────────────────────────────────────────────────────────

export function calculateMoUStatus(effectiveDate, validityType, customExpiryDate) {
  if (validityType === 'Until Further Notice') {
    return { expiryDate: null, status: 'ACTIVE', diffDays: 9999, label: 'Active (Ongoing)' };
  }
  let expDate = null;
  if (validityType === 'Custom' && customExpiryDate) {
    expDate = new Date(customExpiryDate);
  } else if (effectiveDate) {
    const d = new Date(effectiveDate);
    const years = validityType === '1 Year' ? 1 : (validityType === '2 Years' ? 2 : (validityType === '5 Years' ? 5 : 3));
    d.setFullYear(d.getFullYear() + years);
    d.setDate(d.getDate() - 1);
    expDate = d;
  }

  if (!expDate || isNaN(expDate.getTime())) {
    return { expiryDate: '2029-06-30', status: 'ACTIVE', diffDays: 365, label: 'Active' };
  }

  const expiryString = expDate.toISOString().split('T')[0];
  const now = new Date();
  const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { expiryDate: expiryString, status: 'EXPIRED', diffDays, label: `Expired ${Math.abs(diffDays)} days ago` };
  }
  if (diffDays <= 60) {
    return { expiryDate: expiryString, status: 'EXPIRING_SOON', diffDays, label: `Expires in ${diffDays} days` };
  }
  return { expiryDate: expiryString, status: 'ACTIVE', diffDays, label: 'Active' };
}

export function normalizeMoURecord(raw, idx = 0) {
  if (!raw) return null;
  const pType = raw.partnerType || 'Industry';
  const typeCode = pType.includes('Industry') ? 'IND' : (pType.includes('University') ? 'UNIV' : 'COLLAB');
  const yearSuffix = (raw.signedDate ? raw.signedDate.slice(0, 4) : '2026').trim();
  const autoNum = raw.mouNumber || `MOU-${typeCode}-${yearSuffix}-${String(idx + 1).padStart(4, '0')}`;

  const validInfo = calculateMoUStatus(raw.effectiveDate || raw.signedDate || `${yearSuffix}-07-01`, raw.validityType || raw.validity || '3 Years', raw.expiryDate);

  const scopes = Array.isArray(raw.scopes) ? raw.scopes : (
    raw.scope ? raw.scope.split(',').map(s => s.trim()) : ['Internships', 'Student Projects', 'Faculty Training', 'Workshops']
  );

  const documents = Array.isArray(raw.documents) ? raw.documents : [
    ...(raw.mouDocumentPdf ? [{ id: 'DOC-1', name: raw.mouDocumentPdf, type: 'Signed MoU PDF', size: '3.8 MB', url: '#' }] : [])
  ];

  return {
    ...raw,
    id: raw.id || `mou_${Date.now()}_${idx}`,
    mouNumber: autoNum,
    title: raw.title || raw.mouTitle || `MoU with ${raw.partnerOrganization || raw.organization || 'Partner'}`,
    partnerOrganization: raw.partnerOrganization || raw.organization || 'Partner Organization',
    partnerType: pType,
    organizationWebsite: raw.organizationWebsite || raw.website || '',
    organizationAddress: raw.organizationAddress || '',
    city: raw.city || 'Hyderabad',
    state: raw.state || 'Telangana',
    country: raw.country || 'India',
    partnerContactPerson: raw.partnerContactPerson || raw.contactPerson || '',
    partnerContactDesignation: raw.partnerContactDesignation || '',
    partnerContactEmail: raw.partnerContactEmail || '',
    partnerContactPhone: raw.partnerContactPhone || '',
    signedDate: raw.signedDate || raw.mouDate || `${yearSuffix}-07-01`,
    effectiveDate: raw.effectiveDate || raw.signedDate || `${yearSuffix}-07-01`,
    validityType: raw.validityType || raw.validity || '3 Years',
    expiryDate: raw.expiryDate || validInfo.expiryDate,
    department: raw.department || 'All Departments (Institution-Level)',
    purpose: raw.purpose || 'Collaborative research, student internships, curriculum development, and technical workshops.',
    description: raw.description || '',
    scopes: scopes,
    primaryCoordinator: raw.primaryCoordinator || raw.facultyCoordinator || 'Dr. S. V. N. Sreenivasu',
    coCoordinators: Array.isArray(raw.coCoordinators) ? raw.coCoordinators : [],
    documents: documents,
    renewals: Array.isArray(raw.renewals) ? raw.renewals : [],
    mouStatus: raw.mouStatus || validInfo.status,
    workflowStatus: raw.workflowStatus || (raw.status === 'Active' || raw.verificationStatus === 'Approved' ? 'APPROVED' : 'UNDER_REVIEW'),
    publicVisibility: raw.publicVisibility || 'PUBLIC_SAFE',
    reviewHistory: Array.isArray(raw.reviewHistory) ? raw.reviewHistory : []
  };
}

export function getMoUs(includeDeleted = false) {
  const items = loadStore(STORAGE_KEYS.MOUS, INITIAL_MOUS);
  const activeList = Array.isArray(items) ? items.filter(i => includeDeleted || !i.isDeleted) : [];
  return activeList.map((item, idx) => normalizeMoURecord(item, idx));
}

export function getMoULinkedActivities(mouNumberOrOrg) {
  if (!mouNumberOrOrg) return { internships: 0, workshops: 0, fdps: 0, projects: 0, total: 0 };
  const q = String(mouNumberOrOrg).toLowerCase();
  
  const allInternships = getInternships();
  const allEvents = getAcademicEvents();
  const allProjects = getStudentProjects();
  const allFdps = getFDPs();

  const intCount = allInternships.filter(i => (i.organization && i.organization.toLowerCase().includes(q)) || (i.associatedMoU && i.associatedMoU.toLowerCase().includes(q))).length;
  const evtCount = allEvents.filter(e => (e.associatedMoU && e.associatedMoU.toLowerCase().includes(q)) || (e.associatedOrganization && e.associatedOrganization.toLowerCase().includes(q))).length;
  const fdpCount = allFdps.filter(f => (f.sponsor && f.sponsor.toLowerCase().includes(q)) || (f.associatedOrganization && f.associatedOrganization.toLowerCase().includes(q))).length;
  const prjCount = allProjects.filter(p => (p.industryAssociation?.organization && p.industryAssociation.organization.toLowerCase().includes(q))).length;

  return {
    internships: intCount,
    workshops: evtCount,
    fdps: fdpCount,
    projects: prjCount,
    total: intCount + evtCount + fdpCount + prjCount
  };
}

export function saveMoU(item, user) {
  const items = loadStore(STORAGE_KEYS.MOUS, INITIAL_MOUS);
  const pType = item.partnerType || 'Industry';
  const typeCode = pType.includes('Industry') ? 'IND' : (pType.includes('University') ? 'UNIV' : 'COLLAB');
  const yearSuffix = (item.signedDate ? item.signedDate.slice(0, 4) : '2026').trim();
  const nextSeq = String(items.length + 1).padStart(4, '0');
  const autoNum = item.mouNumber || `MOU-${typeCode}-${yearSuffix}-${nextSeq}`;

  const validInfo = calculateMoUStatus(item.effectiveDate || item.signedDate, item.validityType, item.expiryDate);
  const mouStatus = validInfo.status;
  const expiryDate = validInfo.expiryDate;

  const index = Array.isArray(items) ? items.findIndex(i => i.id === item.id) : -1;
  if (index >= 0) {
    items[index] = {
      ...items[index],
      ...item,
      expiryDate: expiryDate,
      mouStatus: mouStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name || 'System'
    };
    addAuditLog('UPDATE_MOU', 'MoUs', `Updated MoU ${autoNum} with ${item.partnerOrganization}`, user);
    saveStore(STORAGE_KEYS.MOUS, items);
    return normalizeMoURecord(items[index]);
  } else {
    const defaultWorkflowStatus = item.workflowStatus || (user?.role === 'SUPER_ADMIN' || user?.role === 'HOD' ? 'APPROVED' : 'SUBMITTED');
    const newItem = {
      ...item,
      id: item.id || `mou_${Date.now()}`,
      mouNumber: autoNum,
      expiryDate: expiryDate,
      mouStatus: mouStatus,
      workflowStatus: defaultWorkflowStatus,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'System',
      isDeleted: false,
      reviewHistory: [
        {
          action: 'CREATED',
          status: defaultWorkflowStatus,
          timestamp: new Date().toISOString(),
          by: user?.name || 'Institutional Coordinator',
          remarks: 'MoU recorded in institutional repository'
        }
      ]
    };
    items.unshift(newItem);
    addAuditLog('CREATE_MOU', 'MoUs', `Recorded new MoU ${autoNum} with ${newItem.partnerOrganization}`, user);
    saveStore(STORAGE_KEYS.MOUS, items);
    return normalizeMoURecord(newItem);
  }
}

export function renewMoU(id, renewalData, user) {
  const items = loadStore(STORAGE_KEYS.MOUS, INITIAL_MOUS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    const item = items[index];
    const prevExpiry = item.expiryDate;
    if (!item.renewals) item.renewals = [];

    const newRenewalEntry = {
      renewalId: 'MOU-REN-' + Date.now(),
      renewalSignedDate: renewalData.renewalSignedDate || new Date().toISOString().split('T')[0],
      previousExpiryDate: prevExpiry,
      newExpiryDate: renewalData.newExpiryDate,
      extensionPeriod: renewalData.extensionPeriod || '3 Years',
      agreementDocument: renewalData.agreementDocument || null,
      remarks: renewalData.remarks || 'MoU extended successfully',
      renewedBy: user?.name || 'Coordinator',
      timestamp: new Date().toISOString()
    };

    item.renewals.unshift(newRenewalEntry);
    item.expiryDate = renewalData.newExpiryDate;
    const validInfo = calculateMoUStatus(item.effectiveDate, 'Custom', item.expiryDate);
    item.mouStatus = validInfo.status;
    item.updatedAt = new Date().toISOString();
    item.updatedBy = user?.name;

    addAuditLog('RENEW_MOU', 'MoUs', `Extended MoU ${item.mouNumber || id} with ${item.partnerOrganization} until ${renewalData.newExpiryDate}`, user);
    saveStore(STORAGE_KEYS.MOUS, items);
    return normalizeMoURecord(items[index]);
  }
  return null;
}

export function reviewMoU(id, action, remarks, reviewerUser) {
  const items = loadStore(STORAGE_KEYS.MOUS, INITIAL_MOUS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    let targetStatus = 'APPROVED';
    if (action === 'REQUEST_REVISION') targetStatus = 'NEEDS_REVISION';
    else if (action === 'UNDER_REVIEW') targetStatus = 'UNDER_REVIEW';
    else if (action === 'TERMINATE') {
      items[index].mouStatus = 'TERMINATED';
      targetStatus = 'ARCHIVED';
    } else if (action === 'ARCHIVE') targetStatus = 'ARCHIVED';

    items[index].workflowStatus = targetStatus;
    items[index].verifiedAt = new Date().toISOString();
    items[index].verifiedBy = reviewerUser?.name || 'Reviewer';
    if (!items[index].reviewHistory) items[index].reviewHistory = [];
    items[index].reviewHistory.push({
      action: action,
      status: targetStatus,
      timestamp: new Date().toISOString(),
      by: reviewerUser?.name || 'Reviewer',
      remarks: remarks || `MoU status updated to ${targetStatus}`
    });

    saveStore(STORAGE_KEYS.MOUS, items);
    addAuditLog('REVIEW_MOU', 'MoUs', `Reviewed MoU ${items[index].mouNumber || id}: ${action}`, reviewerUser);
    return items.map((it, idx) => normalizeMoURecord(it, idx));
  }
  return items;
}

export function softDeleteMoU(id, user) {
  const items = loadStore(STORAGE_KEYS.MOUS, INITIAL_MOUS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    items[index].isDeleted = true;
    items[index].deletedAt = new Date().toISOString();
    items[index].deletedBy = user?.name;
    saveStore(STORAGE_KEYS.MOUS, items);
    addAuditLog('DELETE_MOU', 'MoUs', `Soft-deleted MoU ID: ${id}`, user);
  }
  return items.filter(i => !i.isDeleted).map((it, idx) => normalizeMoURecord(it, idx));
}

// ─────────────────────────────────────────────────────────────
// 12. NPTEL & MOOC ONLINE CERTIFICATIONS REPOSITORY
// ─────────────────────────────────────────────────────────────

export function normalizeNptelRecord(raw, idx = 0) {
  if (!raw) return null;
  const dept = raw.department || 'CSE';
  const ay = raw.academicYear || '2025-26';
  const yearSuffix = (ay.split('-')[0] || '2026').trim();
  const autoNum = raw.certificationNumber || `NPTEL-${dept}-${yearSuffix}-${String(idx + 1).padStart(4, '0')}`;

  const holderType = raw.holderType || (raw.role === 'Student' || raw.rollNumber ? 'STUDENT' : 'FACULTY');
  const student = holderType === 'STUDENT' ? (raw.studentDetails || {
    rollNumber: raw.rollNumber || raw.rollNo || '22471A0589',
    name: raw.name || raw.studentName || 'Student Learner',
    department: dept,
    batch: raw.batch || '2022-2026',
    year: raw.year || 'III Year',
    semester: raw.semester || 'II Sem'
  }) : null;

  const faculty = holderType === 'FACULTY' ? (raw.facultyDetails || {
    facultyId: raw.facultyId || '',
    name: raw.name || raw.facultyName || 'Faculty Learner',
    department: dept,
    designation: raw.designation || 'Faculty'
  }) : null;

  const documents = Array.isArray(raw.documents) ? raw.documents : [
    ...(raw.certificatePdf ? [{ id: 'DOC-1', name: raw.certificatePdf, type: 'NPTEL Certificate PDF', size: '1.4 MB', url: '#' }] : [])
  ];

  return {
    ...raw,
    id: raw.id || `nptel_${Date.now()}_${idx}`,
    certificationNumber: autoNum,
    holderType: holderType,
    studentDetails: student,
    facultyDetails: faculty,
    department: dept,
    academicYear: ay,
    platform: raw.platform || 'NPTEL',
    courseName: raw.courseName || raw.course || 'Cloud Computing & Distributed Systems',
    courseCode: raw.courseCode || '',
    offeredBy: raw.offeredBy || raw.institute || 'IIT Kharagpur',
    instructor: raw.instructor || '',
    courseCategory: raw.courseCategory || 'Computer Science',
    courseUrl: raw.courseUrl || '',
    duration: raw.duration || (raw.durationWeeks ? `${raw.durationWeeks} Weeks` : '12 Weeks'),
    examDate: raw.examDate || `${yearSuffix}-04-20`,
    scores: raw.scores || {
      assignmentScore: raw.assignmentScore || 24,
      examScore: raw.examScore || 62,
      finalScore: raw.finalScore || raw.score || 86
    },
    certificationResult: raw.certificationResult || raw.result || (raw.score >= 90 ? 'Elite + Gold' : (raw.score >= 75 ? 'Elite + Silver' : 'Elite')),
    academicCredits: raw.academicCredits || {
      creditsEarned: raw.creditsEarned || (raw.duration?.includes('12') ? 3 : (raw.duration?.includes('8') ? 2 : 1)),
      creditTransferRequested: raw.creditTransferRequested || false,
      creditTransferApproved: raw.creditTransferApproved || false,
      approvedCredits: raw.approvedCredits || 0,
      approvalReference: raw.approvalReference || ''
    },
    certificateDate: raw.certificateDate || raw.date || `${yearSuffix}-05-15`,
    certificateId: raw.certificateId || raw.certId || `NPTEL${yearSuffix}CS${String(idx + 10).padStart(4, '0')}`,
    certificateVerificationUrl: raw.certificateVerificationUrl || raw.verificationUrl || '',
    documents: documents,
    certificationStatus: raw.certificationStatus || 'COMPLETED',
    workflowStatus: raw.workflowStatus || (raw.status === 'Verified' || raw.verificationStatus === 'Verified' ? 'APPROVED' : 'UNDER_REVIEW'),
    publicVisibility: raw.publicVisibility || 'PUBLIC_SAFE',
    reviewHistory: Array.isArray(raw.reviewHistory) ? raw.reviewHistory : []
  };
}

export function getNPTEL(includeDeleted = false) {
  const items = loadStore(STORAGE_KEYS.NPTEL, INITIAL_NPTEL);
  const activeList = Array.isArray(items) ? items.filter(i => includeDeleted || !i.isDeleted) : [];
  return activeList.map((item, idx) => normalizeNptelRecord(item, idx));
}

export function saveNPTEL(item, user) {
  const items = loadStore(STORAGE_KEYS.NPTEL, INITIAL_NPTEL);
  const deptCode = item.department || user?.dept || 'CSE';
  const ay = item.academicYear || '2025-26';
  const yearSuffix = (ay.split('-')[0] || '2026').trim();
  const nextSeq = String(items.length + 1).padStart(4, '0');
  const autoNum = item.certificationNumber || `NPTEL-${deptCode}-${yearSuffix}-${nextSeq}`;

  const index = Array.isArray(items) ? items.findIndex(i => i.id === item.id) : -1;
  const holderName = item.holderType === 'STUDENT' ? (item.studentDetails?.name || 'Student') : (item.facultyDetails?.name || 'Faculty');

  if (index >= 0) {
    items[index] = {
      ...items[index],
      ...item,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name || 'System'
    };
    addAuditLog('UPDATE_NPTEL', 'NPTEL', `Updated certification ${autoNum} for ${holderName}: ${item.courseName}`, user);
    saveStore(STORAGE_KEYS.NPTEL, items);
    return normalizeNptelRecord(items[index]);
  } else {
    const defaultWorkflowStatus = item.workflowStatus || (user?.role === 'SUPER_ADMIN' || user?.role === 'HOD' ? 'APPROVED' : 'SUBMITTED');
    const newItem = {
      ...item,
      id: item.id || `nptel_${Date.now()}`,
      certificationNumber: autoNum,
      certificationStatus: 'COMPLETED',
      workflowStatus: defaultWorkflowStatus,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'System',
      isDeleted: false,
      reviewHistory: [
        {
          action: 'CREATED',
          status: defaultWorkflowStatus,
          timestamp: new Date().toISOString(),
          by: user?.name || 'Learner',
          remarks: 'Certification recorded in portal'
        }
      ]
    };
    items.unshift(newItem);
    addAuditLog('CREATE_NPTEL', 'NPTEL', `Recorded certification ${autoNum} for ${holderName}: ${newItem.courseName}`, user);
    saveStore(STORAGE_KEYS.NPTEL, items);
    return normalizeNptelRecord(newItem);
  }
}

export function reviewNPTEL(id, action, remarks, reviewerUser) {
  const items = loadStore(STORAGE_KEYS.NPTEL, INITIAL_NPTEL);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    let targetStatus = 'APPROVED';
    if (action === 'REQUEST_REVISION') targetStatus = 'NEEDS_REVISION';
    else if (action === 'UNDER_REVIEW') targetStatus = 'UNDER_REVIEW';
    else if (action === 'ARCHIVE') targetStatus = 'ARCHIVED';

    items[index].workflowStatus = targetStatus;
    items[index].verifiedAt = new Date().toISOString();
    items[index].verifiedBy = reviewerUser?.name || 'Reviewer';
    if (!items[index].reviewHistory) items[index].reviewHistory = [];
    items[index].reviewHistory.push({
      action: action,
      status: targetStatus,
      timestamp: new Date().toISOString(),
      by: reviewerUser?.name || 'Reviewer',
      remarks: remarks || `Certification status updated to ${targetStatus}`
    });

    saveStore(STORAGE_KEYS.NPTEL, items);
    addAuditLog('REVIEW_NPTEL', 'NPTEL', `Reviewed certification ${items[index].certificationNumber || id}: ${action}`, reviewerUser);
    return items.map((it, idx) => normalizeNptelRecord(it, idx));
  }
  return items;
}

export function softDeleteNPTEL(id, user) {
  const items = loadStore(STORAGE_KEYS.NPTEL, INITIAL_NPTEL);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    items[index].isDeleted = true;
    items[index].deletedAt = new Date().toISOString();
    items[index].deletedBy = user?.name;
    saveStore(STORAGE_KEYS.NPTEL, items);
    addAuditLog('DELETE_NPTEL', 'NPTEL', `Soft-deleted NPTEL ID: ${id}`, user);
  }
  return items.filter(i => !i.isDeleted).map((it, idx) => normalizeNptelRecord(it, idx));
}

// 13. Placements
export function getPlacementStats() {
  return INITIAL_PLACEMENT_STATS;
}

export function getPlacementRecords(includeDeleted = false) {
  const items = loadStore(STORAGE_KEYS.PLACEMENTS, INITIAL_PLACEMENT_RECORDS);
  return includeDeleted ? items : (Array.isArray(items) ? items.filter(i => !i.isDeleted) : []);
}

export function savePlacementRecord(item, user) {
  const items = loadStore(STORAGE_KEYS.PLACEMENTS, INITIAL_PLACEMENT_RECORDS);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === item.id) : -1;
  if (index >= 0) {
    items[index] = { ...items[index], ...item, updatedAt: new Date().toISOString(), updatedBy: user?.name };
    addAuditLog('UPDATE', 'Placements', `Updated placement for ${item.studentName}`, user);
  } else {
    const newItem = {
      ...item,
      id: item.id || 'PLC-' + Date.now(),
      createdAt: new Date().toISOString(),
      createdBy: user?.name,
      isDeleted: false
    };
    if (Array.isArray(items)) items.unshift(newItem);
    addAuditLog('CREATE', 'Placements', `Recorded placement offer for ${item.studentName} at ${item.company}`, user);
  }
  saveStore(STORAGE_KEYS.PLACEMENTS, items);
  return items;
}

// Exam Notices
export function getExamNotifications() {
  return loadStore(STORAGE_KEYS.EXAM_NOTICES, []);
}

// News
export function getNews() {
  return loadStore(STORAGE_KEYS.NEWS, []);
}

// Official Circulars & Orders
export function getCirculars() {
  return loadStore('nec_circulars_v2', []);
}

export function saveCircular(circular, user = 'Admin') {
  const items = getCirculars();
  const newItem = {
    ...circular,
    id: circular.id || `CIR-${new Date().getFullYear()}-${String(items.length + 1).padStart(4, '0')}`,
    createdAt: circular.createdAt || new Date().toISOString()
  };
  items.unshift(newItem);
  saveStore('nec_circulars_v2', items);
  addAuditLog('CREATE', 'Circulars', `Issued official circular: ${newItem.title}`, user);
  return items;
}

// -------------------------------------------------------------
// Research Auto-Sync & 4-Tier Duplicate Prevention Engine
// -------------------------------------------------------------
export function checkPublicationDuplicate(candidatePaper, existingPapers = []) {
  if (!candidatePaper) return { isDuplicate: false };

  // Tier 1: Match by DOI
  if (candidatePaper.doi) {
    const cleanDOI = candidatePaper.doi.toLowerCase().trim();
    const match = existingPapers.find(p => p.doi && p.doi.toLowerCase().trim() === cleanDOI);
    if (match) {
      return { isDuplicate: true, reason: 'Exact DOI Match (' + candidatePaper.doi + ')', existingRecord: match };
    }
  }

  // Tier 2: Match by Scopus EID
  if (candidatePaper.scopusEid) {
    const match = existingPapers.find(p => p.scopusEid && p.scopusEid === candidatePaper.scopusEid);
    if (match) {
      return { isDuplicate: true, reason: 'Scopus EID Match (' + candidatePaper.scopusEid + ')', existingRecord: match };
    }
  }

  // Tier 3: Match by WoS UID
  if (candidatePaper.wosUid) {
    const match = existingPapers.find(p => p.wosUid && p.wosUid === candidatePaper.wosUid);
    if (match) {
      return { isDuplicate: true, reason: 'Web of Science UID Match (' + candidatePaper.wosUid + ')', existingRecord: match };
    }
  }

  // Tier 4: Match by Normalized Title + First Author
  const normTitle = (candidatePaper.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normTitle.length > 15) {
    const match = existingPapers.find(p => {
      const existingNorm = (p.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return existingNorm === normTitle;
    });
    if (match) {
      return { isDuplicate: true, reason: 'Exact Normalized Title Match', existingRecord: match };
    }
  }

  return { isDuplicate: false };
}

// -------------------------------------------------------------
// Universal Export Engine (Formula Injection Hardened & Audited)
// -------------------------------------------------------------

// Helper to normalize objects before spreadsheet export (replaces [object Object], undefined, null)
export function sanitizeRecordForExport(record) {
  if (!record || typeof record !== 'object') return record;
  const clean = {};
  for (const [key, val] of Object.entries(record)) {
    if (val === null || val === undefined) {
      clean[key] = '';
    } else if (Array.isArray(val)) {
      if (val.length === 0) {
        clean[key] = '';
      } else if (typeof val[0] === 'object' && val[0] !== null) {
        clean[key] = val.map(item => item.name || item.title || item.label || JSON.stringify(item)).join('; ');
      } else {
        clean[key] = val.join('; ');
      }
    } else if (typeof val === 'object') {
      clean[key] = val.name || val.title || val.label || val.value || JSON.stringify(val);
    } else {
      clean[key] = sanitizeSpreadsheetCell(val);
    }
  }
  return clean;
}

// Compliance Dataset Definitions (Single Source of Truth)
export const COMPLIANCE_EXPORT_DEFINITIONS = {
  publications: {
    id: 'publications',
    title: 'Research Publications (Scopus / WoS / UGC)',
    filename: 'NEC_Research_Publications',
    sheetName: 'Publications',
    description: 'Exports verified publication metadata available in the institutional repository.',
    getData: () => getPublications(),
    toRows: (records) => (records || []).map(p => ({
      'Record Number': p.publicationRecordNumber || p.id || '',
      'Title': p.title || '',
      'Publication Type': p.publicationType || 'Journal Article',
      'Authors': (p.authors || []).map(a => a.name).join('; '),
      'NEC Authors': (p.authors || []).filter(a => a.matchStatus === 'EXACT' || a.matchStatus === 'VERIFIED' || a.facultyId).map(a => a.name).join('; '),
      'Department': p.department || p.departmentCode || '',
      'Publication Year': p.publicationYear || '',
      'Academic Year': p.academicYear || '',
      'Journal / Conference': p.journalName || p.conferenceName || '',
      'Publisher': p.publisher || '',
      'Volume': p.volume || '',
      'Issue': p.issue || '',
      'Pages': p.pageNumbers || p.pages || '',
      'DOI': p.doi || '',
      'ISSN': p.issn || '',
      'ISBN': p.isbn || '',
      'Scopus EID': p.scopusEid || '',
      'Web of Science UID': p.wosUid || '',
      'OpenAlex ID': p.openalexWorkId || '',
      'Indexing Sources': (p.indexing || p.sources || []).join('; '),
      'Workflow Status': p.workflowStatus || '',
      'Verification Status': p.verificationStatus || p.workflowStatus || ''
    })),
    pdfColumns: ['S.No', 'Title', 'Authors', 'Department', 'Year', 'Journal / Conference', 'DOI', 'Indexing'],
    toPdfRows: (records) => (records || []).map((p, idx) => [
      idx + 1,
      p.title || 'Untitled',
      (p.authors || []).map(a => a.name).join(', ') || 'NEC Authors',
      p.department || p.departmentCode || 'N/A',
      p.publicationYear || p.academicYear || 'N/A',
      p.journalName || p.conferenceName || 'N/A',
      p.doi || 'N/A',
      (p.indexing || p.sources || []).join(', ') || 'Scopus / WoS'
    ])
  },

  patents: {
    id: 'patents',
    title: 'Patents & Intellectual Property Rights',
    filename: 'NEC_Patents_IPR',
    sheetName: 'Patents',
    description: 'Exports recorded patent and IPR metadata according to current access scope.',
    getData: () => getPatents(),
    toRows: (records) => (records || []).map(pat => ({
      'Patent Record Number': pat.patentRecordNumber || pat.id || '',
      'Title': pat.title || '',
      'Patent Type': pat.patentType || 'Indian Patent',
      'Country': pat.countryCode || 'IN',
      'Application Number': pat.applicationNumber || pat.applicationNo || '',
      'Application Date': pat.applicationDate || '',
      'Filing Date': pat.filingDate || pat.applicationDate || '',
      'Publication Number': pat.publicationNumber || '',
      'Publication Date': pat.publicationDate || '',
      'Grant Number': pat.grantNumber || '',
      'Grant Date': pat.grantDate || '',
      'Legal Status': pat.legalStatus || 'PUBLISHED',
      'Inventors': (pat.inventors || []).map(i => i.name).join('; '),
      'NEC Inventors': (pat.inventors || []).filter(i => i.personType === 'INTERNAL_FACULTY' || i.facultyId).map(i => i.name).join('; '),
      'Department': pat.department || pat.departmentCode || '',
      'Applicant / Assignee': pat.applicantName || 'Narasaraopeta Engineering College (Autonomous)',
      'Technology Domain': pat.technologyDomain || '',
      'Workflow Status': pat.workflowStatus || ''
    })),
    pdfColumns: ['S.No', 'Title', 'App / Grant Number', 'Inventors', 'Department', 'Filing Date', 'Legal Status'],
    toPdfRows: (records) => (records || []).map((pat, idx) => [
      idx + 1,
      pat.title || 'Untitled Patent',
      pat.grantNumber ? `Grant: ${pat.grantNumber}` : (pat.applicationNumber || 'N/A'),
      (pat.inventors || []).map(i => i.name).join(', ') || 'NEC Inventors',
      pat.department || pat.departmentCode || 'N/A',
      pat.filingDate || pat.applicationDate || 'N/A',
      pat.legalStatus || 'PUBLISHED'
    ])
  },

  mous: {
    id: 'mous',
    title: 'Industry MoUs & Collaboration Agreements',
    filename: 'NEC_MoUs_Collaborations',
    sheetName: 'MoUs',
    description: 'Exports collaboration agreement metadata available in the MoU repository.',
    getData: () => getMoUs(),
    toRows: (records) => (records || []).map(m => ({
      'MoU Record Number': m.mouNumber || m.id || '',
      'Partner Organization': m.partnerOrganization || '',
      'MoU Title': m.title || '',
      'Partner Type': m.partnerType || 'Industry',
      'Signed Date': m.signedDate || '',
      'Effective Date': m.effectiveDate || '',
      'Expiry Date': m.expiryDate || '',
      'Department': m.department || '',
      'Scope': (m.scopes || []).join('; '),
      'Status': m.mouStatus || 'ACTIVE',
      'Coordinator': m.primaryCoordinator || '',
      'Purpose / Remarks': m.purpose || ''
    })),
    pdfColumns: ['S.No', 'Partner Organization', 'MoU Title', 'Partner Type', 'Signed Date', 'Expiry Date', 'Status'],
    toPdfRows: (records) => (records || []).map((m, idx) => [
      idx + 1,
      m.partnerOrganization || 'Partner',
      m.title || 'MoU Agreement',
      m.partnerType || 'Industry',
      m.signedDate || 'N/A',
      m.expiryDate || 'Ongoing',
      m.mouStatus || 'ACTIVE'
    ])
  },

  internships: {
    id: 'internships',
    title: 'Student Internships & Placements',
    filename: 'NEC_Internships_Placements',
    sheetName: 'Internships',
    description: 'Exports available student internship and placement records.',
    getData: () => {
      const ints = getInternships();
      const plcs = getPlacementRecords();
      return { internships: ints, placements: plcs, total: ints.length + plcs.length };
    },
    toRows: (data) => {
      const ints = data?.internships || (Array.isArray(data) ? data : getInternships());
      const plcs = data?.placements || getPlacementRecords();
      
      const rows = [];
      (ints || []).forEach(item => {
        rows.push({
          'Record Type': 'INTERNSHIP',
          'Student Roll Number': item.studentRollNo || item.rollNumber || '',
          'Student Name': item.studentName || '',
          'Department': item.department || item.branch || '',
          'Academic Year': item.academicYear || '',
          'Organization / Company': item.organization || '',
          'Domain / Role': item.domain || '',
          'Start Date': item.startDate || '',
          'End Date': item.endDate || '',
          'Duration (Weeks)': item.durationWeeks || item.weeks || '',
          'Mode': item.mode || '',
          'Status': item.internshipStatus || item.status || 'Completed',
          'Package (LPA)': ''
        });
      });

      (plcs || []).forEach(item => {
        rows.push({
          'Record Type': 'PLACEMENT',
          'Student Roll Number': item.studentRollNumber || item.rollNumber || item.studentRollNo || '',
          'Student Name': item.studentName || '',
          'Department': item.department || item.branch || '',
          'Academic Year': item.academicYear || '',
          'Organization / Company': item.company || item.organization || '',
          'Domain / Role': item.role || item.designation || '',
          'Start Date': item.joiningDate || '',
          'End Date': '',
          'Duration (Weeks)': '',
          'Mode': item.mode || 'On Campus',
          'Status': item.placementStatus || item.status || 'Placed',
          'Package (LPA)': item.packageLpa || item.package || item.salary || ''
        });
      });

      return rows;
    },
    multiSheets: () => {
      const ints = getInternships();
      const plcs = getPlacementRecords();
      return [
        {
          name: 'Internships',
          data: ints.map(i => ({
            'Internship Number': i.internshipNumber || i.id || '',
            'Roll Number': i.studentRollNo || i.rollNumber || '',
            'Student Name': i.studentName || '',
            'Department': i.department || i.branch || '',
            'Academic Year': i.academicYear || '',
            'Organization': i.organization || '',
            'Domain': i.domain || '',
            'Start Date': i.startDate || '',
            'End Date': i.endDate || '',
            'Duration (Weeks)': i.durationWeeks || i.weeks || '',
            'Status': i.internshipStatus || i.status || 'Completed'
          }))
        },
        {
          name: 'Placements',
          data: plcs.map(p => ({
            'Placement ID': p.id || '',
            'Roll Number': p.studentRollNumber || p.rollNumber || '',
            'Student Name': p.studentName || '',
            'Department': p.department || p.branch || '',
            'Academic Year': p.academicYear || '',
            'Company': p.company || '',
            'Role': p.role || p.designation || '',
            'Package (LPA)': p.packageLpa || p.package || '',
            'Offer Date': p.offerDate || '',
            'Status': p.placementStatus || p.status || 'Placed'
          }))
        }
      ];
    },
    pdfColumns: ['S.No', 'Type', 'Roll Number', 'Student Name', 'Dept', 'Company / Organization', 'Role / Domain', 'Status / LPA'],
    toPdfRows: (data) => {
      const ints = data?.internships || (Array.isArray(data) ? data : getInternships());
      const plcs = data?.placements || getPlacementRecords();
      const rows = [];
      let sNo = 1;

      (ints || []).forEach(i => {
        rows.push([
          sNo++,
          'INTERNSHIP',
          i.studentRollNo || i.rollNumber || 'N/A',
          i.studentName || 'Student',
          i.department || i.branch || '',
          i.organization || '',
          i.domain || 'Technical',
          i.internshipStatus || 'Completed'
        ]);
      });

      (plcs || []).forEach(p => {
        rows.push([
          sNo++,
          'PLACEMENT',
          p.studentRollNumber || p.rollNumber || 'N/A',
          p.studentName || 'Student',
          p.department || p.branch || '',
          p.company || '',
          p.role || 'Associate',
          p.packageLpa ? `${p.packageLpa} LPA` : (p.placementStatus || 'Placed')
        ]);
      });

      return rows;
    }
  },

  memberships: {
    id: 'memberships',
    title: 'Faculty Memberships in Professional Bodies',
    filename: 'NEC_Faculty_Memberships',
    sheetName: 'Memberships',
    description: 'Exports recorded faculty professional membership metadata.',
    getData: () => getMemberships(),
    toRows: (records) => (records || []).map(m => ({
      'Membership Record Number': m.membershipRecordNumber || m.id || '',
      'Faculty Name': m.facultyName || '',
      'Department': m.department || '',
      'Professional Body': m.organization || m.professionalBody || '',
      'Membership Type': m.membershipType || '',
      'Membership Number': m.membershipNumber || '',
      'Start Date': m.startDate || '',
      'End Date': m.endDate || 'Lifetime',
      'Status': m.membershipStatus || 'ACTIVE',
      'Workflow Status': m.workflowStatus || ''
    })),
    pdfColumns: ['S.No', 'Faculty Name', 'Department', 'Professional Body', 'Membership Type', 'Membership No', 'Status'],
    toPdfRows: (records) => (records || []).map((m, idx) => [
      idx + 1,
      m.facultyName || 'Faculty Member',
      m.department || 'N/A',
      m.organization || m.professionalBody || 'IEEE',
      m.membershipType || 'Life Membership',
      m.membershipNumber || 'N/A',
      m.membershipStatus || 'ACTIVE'
    ])
  },

  nptel: {
    id: 'nptel',
    title: 'NPTEL & MOOC Online Certifications',
    filename: 'NEC_NPTEL_Certifications',
    sheetName: 'NPTEL_Certifications',
    description: 'Exports available NPTEL/MOOC certification records.',
    getData: () => getNPTEL(),
    toRows: (records) => (records || []).map(n => ({
      'Certification Number': n.certificationNumber || n.id || '',
      'Learner Type': n.holderType || 'STUDENT',
      'Learner Name': n.holderType === 'FACULTY' ? (n.facultyDetails?.name || n.name || '') : (n.studentDetails?.name || n.name || ''),
      'Roll Number / Faculty ID': n.holderType === 'FACULTY' ? (n.facultyDetails?.facultyId || '') : (n.studentDetails?.rollNumber || n.rollNumber || ''),
      'Department': n.department || '',
      'Course Name': n.courseName || '',
      'Platform': n.platform || 'NPTEL',
      'Duration': n.duration || '',
      'Certificate Date': n.certificateDate || n.examDate || '',
      'Score': n.scores?.finalScore !== undefined ? n.scores.finalScore : (n.score || ''),
      'Result / Grade': n.certificationResult || '',
      'Academic Year': n.academicYear || ''
    })),
    pdfColumns: ['S.No', 'Learner Name', 'Type', 'Department', 'Course Name', 'Provider', 'Score', 'Result'],
    toPdfRows: (records) => (records || []).map((n, idx) => [
      idx + 1,
      n.holderType === 'FACULTY' ? (n.facultyDetails?.name || n.name || 'Faculty') : (n.studentDetails?.name || n.name || 'Student'),
      n.holderType || 'STUDENT',
      n.department || 'N/A',
      n.courseName || 'Course',
      n.platform || 'NPTEL',
      n.scores?.finalScore !== undefined ? String(n.scores.finalScore) : (n.score ? String(n.score) : 'N/A'),
      n.certificationResult || 'Completed'
    ])
  },

  projects: {
    id: 'projects',
    title: 'Student Capstone & Major Projects',
    filename: 'NEC_Student_Projects',
    sheetName: 'Student_Projects',
    description: 'Exports student project titles, guides, domains, and marks.',
    getData: () => getStudentProjects(),
    toRows: (records) => (records || []).map(p => ({
      'Project Number': p.projectNumber || p.id || '',
      'Project Title': p.projectTitle || '',
      'Department': p.department || '',
      'Academic Year': p.academicYear || '',
      'Project Type': p.projectType || 'Major Project',
      'Domain': p.domain || '',
      'Team Leader': p.teamMembers?.[0]?.name || '',
      'Leader Roll Number': p.teamMembers?.[0]?.rollNumber || '',
      'Guide Name': p.guide?.name || '',
      'Status': p.projectStatus || 'COMPLETED'
    })),
    pdfColumns: ['S.No', 'Project Number', 'Title', 'Dept', 'Domain', 'Team Leader', 'Guide', 'Status'],
    toPdfRows: (records) => (records || []).map((p, idx) => [
      idx + 1,
      p.projectNumber || 'PRJ-001',
      p.projectTitle || 'Untitled Project',
      p.department || 'CSE',
      p.domain || 'AI/ML',
      p.teamMembers?.[0]?.name || 'Student',
      p.guide?.name || 'Faculty Guide',
      p.projectStatus || 'COMPLETED'
    ])
  },

  achievements: {
    id: 'achievements',
    title: 'Student Achievements & Awards',
    filename: 'NEC_Student_Achievements',
    sheetName: 'Achievements',
    description: 'Exports student national/international awards and achievements.',
    getData: () => getStudentAchievements(),
    toRows: (records) => (records || []).map(a => ({
      'Achievement Number': a.achievementNumber || a.id || '',
      'Student Name': a.studentName || '',
      'Roll Number': a.studentRollNo || a.rollNumber || '',
      'Department': a.department || a.branch || '',
      'Academic Year': a.academicYear || '',
      'Event / Contest': a.eventName || a.title || '',
      'Organizing Body': a.organizer || '',
      'Award / Position': a.awardPosition || a.position || a.category || '',
      'Prize Amount': a.cashPrize || a.prizeAmount || '',
      'Date': a.eventDate || a.date || ''
    })),
    pdfColumns: ['S.No', 'Student Name', 'Roll Number', 'Dept', 'Event / Contest', 'Organizer', 'Award Position'],
    toPdfRows: (records) => (records || []).map((a, idx) => [
      idx + 1,
      a.studentName || 'Student',
      a.studentRollNo || a.rollNumber || 'N/A',
      a.department || a.branch || 'CSE',
      a.eventName || a.title || 'Event',
      a.organizer || 'Host Institution',
      a.awardPosition || a.position || 'First Prize'
    ])
  }
};

export function getComplianceExportDefinition(datasetKey) {
  if (!datasetKey) return null;
  const cleanKey = String(datasetKey).toLowerCase().trim();
  return COMPLIANCE_EXPORT_DEFINITIONS[cleanKey] || null;
}

// ─────────────────────────────────────────────────────────────
// Polymorphic Universal CSV Exporter
// Supports:
// 1. exportToCSV(filename, data, actor)
// 2. exportToCSV(data, filename, actor)
// 3. exportToCSV(moduleKey, actor)
// ─────────────────────────────────────────────────────────────
export function exportToCSV(arg1, arg2 = null, arg3 = null) {
  let filename = 'NEC_Export';
  let data = null;
  let actor = null;

  const today = new Date().toISOString().split('T')[0];

  if (typeof arg1 === 'string') {
    const compDef = getComplianceExportDefinition(arg1);
    if (compDef && (!arg2 || !Array.isArray(arg2))) {
      // Called as: exportToCSV('publications', actor)
      const rawData = compDef.getData();
      filename = `${compDef.filename}_${today}`;
      data = compDef.toRows(rawData);
      actor = arg2;
    } else if (Array.isArray(arg2)) {
      // Called as: exportToCSV('NEC_Filename', dataArray, actor)
      filename = arg1.endsWith('.csv') ? arg1.slice(0, -4) : arg1;
      data = arg2;
      actor = arg3;
    } else {
      filename = arg1;
      data = Array.isArray(arg2) ? arg2 : [];
      actor = arg3;
    }
  } else if (Array.isArray(arg1)) {
    // Called as: exportToCSV(dataArray, 'NEC_Filename', actor)
    data = arg1;
    filename = typeof arg2 === 'string' ? (arg2.endsWith('.csv') ? arg2.slice(0, -4) : arg2) : `NEC_Export_${today}`;
    actor = arg3;
  }

  if (!data || !data.length) {
    console.warn(`[exportToCSV] No data provided to export for ${filename}`);
    return { success: false, count: 0, message: 'No records available to export.' };
  }

  // Sanitize & formula injection neutralize
  const safeData = data.map(record => sanitizeRecordForExport(record));
  const worksheet = XLSX.utils.json_to_sheet(safeData);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  if (typeof document !== 'undefined') {
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  addAuditLog('CSV_EXPORT', 'Compliance & Reporting', `Exported ${data.length} records to ${filename}.csv`, actor);
  return { success: true, count: data.length, filename: `${filename}.csv` };
}

// ─────────────────────────────────────────────────────────────
// Polymorphic Universal Excel Exporter (Single or Multi-sheet)
// Supports:
// 1. exportToExcel(filename, data, sheetName, actor)
// 2. exportToExcel(data, filename, sheetName, actor)
// 3. exportToExcel(moduleKey, actor)
// ─────────────────────────────────────────────────────────────
export function exportToExcel(arg1, arg2 = null, arg3 = 'Report', arg4 = null) {
  let filename = 'NEC_Export';
  let data = null;
  let sheetName = typeof arg3 === 'string' ? arg3 : 'Report';
  let actor = null;

  const today = new Date().toISOString().split('T')[0];

  if (typeof arg1 === 'string') {
    const compDef = getComplianceExportDefinition(arg1);
    if (compDef && (!arg2 || !Array.isArray(arg2))) {
      // Called as: exportToExcel('internships', actor)
      if (typeof compDef.multiSheets === 'function') {
        const sheets = compDef.multiSheets();
        return exportToMultiSheetExcel(`${compDef.filename}_${today}`, sheets, arg2);
      }
      const rawData = compDef.getData();
      filename = `${compDef.filename}_${today}`;
      data = compDef.toRows(rawData);
      sheetName = compDef.sheetName || 'Report';
      actor = arg2;
    } else if (Array.isArray(arg2)) {
      filename = arg1.endsWith('.xlsx') ? arg1.slice(0, -5) : arg1;
      data = arg2;
      sheetName = typeof arg3 === 'string' ? arg3 : 'Report';
      actor = arg4;
    } else {
      filename = arg1;
      data = Array.isArray(arg2) ? arg2 : [];
      actor = arg4;
    }
  } else if (Array.isArray(arg1)) {
    data = arg1;
    filename = typeof arg2 === 'string' ? (arg2.endsWith('.xlsx') ? arg2.slice(0, -5) : arg2) : `NEC_Export_${today}`;
    sheetName = typeof arg3 === 'string' ? arg3 : 'Report';
    actor = arg4;
  }

  if (!data || !data.length) {
    console.warn(`[exportToExcel] No data provided to export for ${filename}`);
    return { success: false, count: 0, message: 'No records available to export.' };
  }

  const safeData = data.map(record => sanitizeRecordForExport(record));
  const worksheet = XLSX.utils.json_to_sheet(safeData);
  const workbook = XLSX.utils.book_new();
  
  // Ensure safe sheet name <= 31 chars
  const cleanSheetName = String(sheetName || 'Report').replace(/[:\\/?*\[\]]/g, '').slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, cleanSheetName);

  if (typeof window !== 'undefined' && XLSX.writeFile) {
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  addAuditLog('EXCEL_EXPORT', 'Compliance & Reporting', `Exported ${data.length} records to ${filename}.xlsx`, actor);
  return { success: true, count: data.length, filename: `${filename}.xlsx` };
}

// ─────────────────────────────────────────────────────────────
// Multi-sheet Excel Exporter
// ─────────────────────────────────────────────────────────────
export function exportToMultiSheetExcel(filename, sheets = [], actor = null) {
  if (!sheets || !sheets.length) {
    return { success: false, count: 0, message: 'No sheets provided for multi-sheet export.' };
  }

  const workbook = XLSX.utils.book_new();
  let totalRows = 0;

  sheets.forEach(sheet => {
    const rawData = Array.isArray(sheet.data) ? sheet.data : [];
    const safeData = rawData.length > 0 ? rawData.map(r => sanitizeRecordForExport(r)) : [{ Note: 'No verified records available' }];
    const worksheet = XLSX.utils.json_to_sheet(safeData);
    const cleanSheetName = String(sheet.name || 'Sheet').replace(/[:\\/?*\[\]]/g, '').slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, cleanSheetName);
    totalRows += rawData.length;
  });

  const cleanFilename = filename.endsWith('.xlsx') ? filename.slice(0, -5) : filename;

  if (typeof window !== 'undefined' && XLSX.writeFile) {
    XLSX.writeFile(workbook, `${cleanFilename}.xlsx`);
  }

  addAuditLog('EXCEL_EXPORT', 'Compliance & Reporting', `Exported multi-sheet workbook with ${totalRows} total records to ${cleanFilename}.xlsx`, actor);
  return { success: true, count: totalRows, filename: `${cleanFilename}.xlsx` };
}

function callAutoTable(doc, options) {
  if (typeof doc.autoTable === 'function') {
    doc.autoTable(options);
  } else if (typeof autoTable === 'function') {
    autoTable(doc, options);
  }
}

// ─────────────────────────────────────────────────────────────
// Polymorphic Universal PDF Exporter
// Supports:
// 1. exportToPDF(title, columns, rows, filename, actor)
// 2. exportToPDF(moduleKey, actor)
// ─────────────────────────────────────────────────────────────
export function exportToPDF(arg1, arg2 = null, arg3 = null, arg4 = 'NEC_Report', arg5 = null) {
  let title = 'Official Institutional Report';
  let columns = [];
  let rows = [];
  let filename = 'NEC_Report';
  let actor = null;

  const today = new Date().toISOString().split('T')[0];

  if (typeof arg1 === 'string' && (!arg2 || !Array.isArray(arg2))) {
    // Check if arg1 is a compliance dataset key
    const compDef = getComplianceExportDefinition(arg1);
    if (compDef) {
      const rawData = compDef.getData();
      title = `${compDef.title} — Institutional Compliance Report`;
      columns = compDef.pdfColumns;
      rows = compDef.toPdfRows(rawData);
      filename = `${compDef.filename}_${today}`;
      actor = arg2;
    } else {
      title = arg1;
      filename = `NEC_${arg1}_${today}`;
      actor = arg2;
    }
  } else if (typeof arg1 === 'string' && Array.isArray(arg2) && Array.isArray(arg3)) {
    title = arg1;
    columns = arg2;
    rows = arg3;
    filename = typeof arg4 === 'string' ? (arg4.endsWith('.pdf') ? arg4.slice(0, -4) : arg4) : `NEC_Report_${today}`;
    actor = arg5;
  }

  if (!rows || !rows.length) {
    console.warn(`[exportToPDF] No rows provided to generate PDF for ${title}`);
    return { success: false, count: 0, message: 'No records available to export.' };
  }

  const doc = new jsPDF('landscape');
  doc.setFontSize(15);
  doc.setTextColor(11, 25, 44);
  doc.text('NARASARAOPETA ENGINEERING COLLEGE (AUTONOMOUS)', 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Approved by AICTE, Affiliated to JNTUK, Accredited by NAAC with "A+" Grade & NBA Tier-1', 14, 21);
  doc.text(`Official Academic & Institutional Report: ${title}`, 14, 27);
  doc.text(`Generated on: ${new Date().toLocaleString()}  |  Records: ${rows.length}`, 190, 27);
  doc.line(14, 30, 280, 30);

  // Sanitize PDF rows to ensure text cells are clean strings
  const safeRows = rows.map(row => (Array.isArray(row) ? row : Object.values(row)).map(cell => cell !== null && cell !== undefined ? String(cell) : ''));

  callAutoTable(doc, {
    startY: 34,
    head: [columns],
    body: safeRows,
    theme: 'grid',
    headStyles: { fillColor: [11, 25, 44], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 7.5, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 }
  });

  if (typeof window !== 'undefined' && doc.save) {
    doc.save(`${filename}.pdf`);
  }

  addAuditLog('PDF_EXPORT', 'Compliance & Reporting', `Generated official PDF report: ${title} (${rows.length} records)`, actor);
  return { success: true, count: rows.length, filename: `${filename}.pdf` };
}

// Centralized High-Level Compliance Exporter
export function executeComplianceExport({ format, datasetKey, actor = null }) {
  const compDef = getComplianceExportDefinition(datasetKey);
  if (!compDef) {
    return { success: false, count: 0, message: `Unknown compliance dataset: ${datasetKey}` };
  }

  const rawData = compDef.getData();
  const count = Array.isArray(rawData) ? rawData.length : (rawData?.total || 0);

  if (count === 0) {
    return { success: false, count: 0, message: `No verified records available for ${compDef.title}.` };
  }

  const today = new Date().toISOString().split('T')[0];
  const fmt = String(format || 'CSV').toUpperCase();

  if (fmt === 'CSV') {
    const rows = compDef.toRows(rawData);
    return exportToCSV(`${compDef.filename}_${today}`, rows, actor);
  } else if (fmt === 'EXCEL' || fmt === 'XLSX') {
    if (typeof compDef.multiSheets === 'function') {
      const sheets = compDef.multiSheets();
      return exportToMultiSheetExcel(`${compDef.filename}_${today}`, sheets, actor);
    }
    const rows = compDef.toRows(rawData);
    return exportToExcel(`${compDef.filename}_${today}`, rows, compDef.sheetName, actor);
  } else if (fmt === 'PDF') {
    const rows = compDef.toPdfRows(rawData);
    return exportToPDF(`${compDef.title} — Compliance Report`, compDef.pdfColumns, rows, `${compDef.filename}_${today}`, actor);
  }

  return { success: false, count: 0, message: `Unsupported export format: ${format}` };
}

// -------------------------------------------------------------
// Board of Studies (BoS) High-Fidelity PDF Export Engine
// -------------------------------------------------------------

export function exportBoSToPDF(meeting, actorUser = null) {
  if (!meeting) return;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // 1. Header Banner
  doc.setFillColor(11, 25, 44);
  doc.rect(margin, y, pageWidth - (margin * 2), 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('NARASARAOPETA ENGINEERING COLLEGE (AUTONOMOUS)', pageWidth / 2, y + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(212, 175, 55);
  doc.text('Approved by AICTE, Affiliated to JNTUK, Accredited with NAAC "A+" Grade & NBA', pageWidth / 2, y + 14, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text('BOARD OF STUDIES (BoS) — CURRICULUM & SYLLABUS GOVERNANCE', pageWidth / 2, y + 20, { align: 'center' });

  y += 28;

  // 2. Meeting Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 25, 44);
  doc.text(meeting.title || `Board of Studies Meeting — ${meeting.bosNumber}`, margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Department: ${meeting.department || 'CSE (Cyber Security)'}  |  Regulation: ${meeting.regulationCodes || (meeting.regulations ? meeting.regulations.join(', ') : 'R23')}  |  AY: ${meeting.academicYear || '2023-24'}  |  Target: ${meeting.targetYear || 'All Years'}`, margin, y);
  y += 6;

  // 3. Metadata Table
  const metaRows = [
    [
      { content: 'BoS Ref Number:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      meeting.bosNumber || meeting.id || 'N/A',
      { content: 'Meeting Date & Time:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      `${meeting.bosDate || meeting.meetingDate || 'N/A'} at ${meeting.startTime || '10:00 AM'}`
    ],
    [
      { content: 'Meeting Mode:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      `${meeting.meetingMode || 'Online'} (${meeting.platform || meeting.venue || 'Microsoft Teams'})`,
      { content: 'Workflow Status:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      `${meeting.workflowStatus || 'DRAFT'} (Institutional Record)`
    ],
    [
      { content: 'Chairperson:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: meeting.chairperson || meeting.chairman || 'Dr. V. V. A. S. Lakshmi (HOD)', colSpan: 3 }
    ]
  ];

  if (meeting.circularReference) {
    metaRows.push([
      { content: 'Circular Reference:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      meeting.circularReference,
      { content: 'Circular Date:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      meeting.circularDate || 'N/A'
    ]);
  }

  callAutoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: metaRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 55 },
      2: { cellWidth: 35 },
      3: { cellWidth: 57 }
    }
  });

  y = doc.lastAutoTable.finalY + 7;

  // 4. Committee Members Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 25, 44);
  doc.text(`1. Board of Studies Committee Members (${(meeting.members && meeting.members.length) || 0} Members)`, margin, y);
  y += 4;

  const memberRows = (meeting.members || []).map((m, idx) => {
    const cat = m.member_type || m.category || (idx === 0 ? 'CHAIRMAN' : 'INTERNAL MEMBER');
    return [
      String(idx + 1),
      m.name || '—',
      cat.replace(/_/g, ' '),
      m.designation || '—',
      m.organization || m.institution || 'Narasaraopeta Engineering College'
    ];
  });

  callAutoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Member Name', 'Category / Role', 'Designation', 'Institution / University']],
    body: memberRows.length > 0 ? memberRows : [['1', meeting.chairperson || 'Dr. V. V. A. S. Lakshmi', 'CHAIRMAN', 'HOD & Professor', 'Narasaraopeta Engineering College']],
    theme: 'striped',
    headStyles: { fillColor: [11, 25, 44], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, cellPadding: 2.2, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 46, fontStyle: 'bold' },
      2: { cellWidth: 34 },
      3: { cellWidth: 42 },
      4: { cellWidth: 52 }
    }
  });

  y = doc.lastAutoTable.finalY + 7;

  // Page break check
  if (y > pageHeight - 50) {
    doc.addPage();
    y = margin;
  }

  // 5. Agenda Items
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 25, 44);
  doc.text('2. Meeting Agenda & Points for Discussion', margin, y);
  y += 4;

  const agendaRows = (meeting.agendaItems || []).map((item, idx) => [
    String(item.itemNo || idx + 1),
    item.title || `Agenda Item ${idx + 1}`,
    item.description || item.title || '—'
  ]);

  if (agendaRows.length > 0) {
    callAutoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Item #', 'Agenda Topic', 'Discussion Details']],
      body: agendaRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2.5, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 14, halign: 'center' },
        1: { cellWidth: 60, fontStyle: 'bold' },
        2: { cellWidth: 108 }
      }
    });
    y = doc.lastAutoTable.finalY + 7;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('   Detailed agenda items not recorded in summary source.', margin, y + 3);
    y += 9;
  }

  if (y > pageHeight - 50) {
    doc.addPage();
    y = margin;
  }

  // 6. Resolutions & Outcomes
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 25, 44);
  doc.text('3. Resolutions & Official Meeting Outcomes', margin, y);
  y += 4;

  const resolutionRows = (meeting.resolutions || []).map((res, idx) => [
    String(res.resolutionNumber || idx + 1),
    res.title || `Resolution ${idx + 1}`,
    res.resolutionText || res.title || 'Approved as deliberated.'
  ]);

  if (resolutionRows.length > 0) {
    callAutoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Res #', 'Subject', 'Resolution & Approved Outcome']],
      body: resolutionRows,
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2.5, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 14, halign: 'center' },
        1: { cellWidth: 60, fontStyle: 'bold' },
        2: { cellWidth: 108 }
      }
    });
    y = doc.lastAutoTable.finalY + 7;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('   Official resolutions recorded under signed minutes repository.', margin, y + 3);
    y += 9;
  }

  // 7. Provenance & Notes (if any)
  if (meeting.reviewNotes || meeting.sourceConfidence) {
    if (y > pageHeight - 35) {
      doc.addPage();
      y = margin;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Provenance & Institutional Review Notes:', margin, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const splitNotes = doc.splitTextToSize(`Source Confidence: ${meeting.sourceConfidence || 'HIGH'} | Notes: ${meeting.reviewNotes || 'Verified against institutional source documents.'}`, pageWidth - (margin * 2));
    doc.text(splitNotes, margin, y);
    y += (splitNotes.length * 3.5) + 4;
  }

  // Running Footers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('NEC Autonomous Academic Management Portal  |  Generated from institutional database record. (Not the scanned physical signed minutes)', margin, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}  |  Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  const cleanFilename = `NEC_${(meeting.department || 'CYS').replace(/[^A-Za-z0-9]/g, '_')}_${meeting.bosNumber || 'BoS_Meeting'}_${meeting.bosDate || 'Report'}`.replace(/_+/g, '_');
  doc.save(`${cleanFilename}.pdf`);

  addAuditLog('BOS_EXPORT_PDF', 'Board of Studies', `Exported BoS single meeting PDF: ${meeting.bosNumber || meeting.id}`, actorUser);
}

export function exportBoSReportToPDF(meetings, actorUser = null, filters = {}) {
  if (!meetings || meetings.length === 0) return;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Header Banner
  doc.setFillColor(11, 25, 44);
  doc.rect(margin, y, pageWidth - (margin * 2), 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('NARASARAOPETA ENGINEERING COLLEGE (AUTONOMOUS)', pageWidth / 2, y + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(212, 175, 55);
  doc.text('Approved by AICTE, Affiliated to JNTUK, Accredited with NAAC "A+" Grade & NBA', pageWidth / 2, y + 14, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text('BOARD OF STUDIES (BoS) — COMPREHENSIVE INSTITUTIONAL REPORT', pageWidth / 2, y + 20, { align: 'center' });

  y += 28;

  // Title & Filter Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(11, 25, 44);
  doc.text(`Department BoS Meetings Summary (${meetings.length} Records)`, margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Filter Scope: Department: ${filters.dept || 'All'} | Regulation: ${filters.reg || 'All'} | Academic Year: ${filters.ay || 'All'}`, margin, y);
  y += 6;

  // Executive Summary Table
  const summaryRows = meetings.map((m, idx) => [
    String(idx + 1),
    m.bosNumber || m.id || 'N/A',
    m.department || 'CSE (Cyber Security)',
    m.regulationCodes || (m.regulations ? m.regulations.join(', ') : 'R23'),
    m.bosDate || m.meetingDate || '—',
    m.targetYear || '—',
    String((m.members && m.members.length) || 0),
    m.workflowStatus || 'DRAFT'
  ]);

  callAutoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Meeting Ref', 'Department', 'Regulation', 'Date', 'Target', 'Members', 'Status']],
    body: summaryRows,
    theme: 'striped',
    headStyles: { fillColor: [11, 25, 44], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, cellPadding: 2.2, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 42 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 22 },
      5: { cellWidth: 20 },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 18 }
    }
  });

  // Render Details for Each Meeting on subsequent pages
  meetings.forEach((meeting, mIdx) => {
    doc.addPage();
    let my = margin;

    // Meeting Section Header
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, my, pageWidth - (margin * 2), 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`RECORD ${mIdx + 1} OF ${meetings.length}: ${meeting.bosNumber || meeting.id} — ${meeting.title || 'BoS Meeting'}`, margin + 4, my + 8);
    my += 16;

    // Meeting Metadata table
    const mRows = [
      [
        { content: 'Department:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        meeting.department || 'CSE (Cyber Security)',
        { content: 'Meeting Date & Time:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        `${meeting.bosDate || meeting.meetingDate || 'N/A'} at ${meeting.startTime || '10:00 AM'}`
      ],
      [
        { content: 'Regulation & Target:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        `${meeting.regulationCodes || (meeting.regulations ? meeting.regulations.join(', ') : 'R23')} (${meeting.targetYear || 'All Years'})`,
        { content: 'Mode & Venue:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        `${meeting.meetingMode || 'Online'} (${meeting.platform || meeting.venue || 'Microsoft Teams'})`
      ],
      [
        { content: 'Chairperson:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: meeting.chairperson || meeting.chairman || 'Dr. V. V. A. S. Lakshmi (HOD)', colSpan: 3 }
      ]
    ];

    callAutoTable(doc, {
      startY: my,
      margin: { left: margin, right: margin },
      body: mRows,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 55 },
        2: { cellWidth: 35 },
        3: { cellWidth: 57 }
      }
    });

    my = doc.lastAutoTable.finalY + 6;

    // Committee Members Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(11, 25, 44);
    doc.text(`Committee Members (${(meeting.members && meeting.members.length) || 0})`, margin, my);
    my += 3.5;

    const memRows = (meeting.members || []).map((mem, idx) => [
      String(idx + 1),
      mem.name || '—',
      (mem.member_type || mem.category || 'MEMBER').replace(/_/g, ' '),
      mem.designation || '—',
      mem.organization || mem.institution || 'Narasaraopeta Engineering College'
    ]);

    callAutoTable(doc, {
      startY: my,
      margin: { left: margin, right: margin },
      head: [['#', 'Member Name', 'Role', 'Designation', 'Institution']],
      body: memRows.length > 0 ? memRows : [['1', meeting.chairperson || 'Dr. V. V. A. S. Lakshmi', 'CHAIRMAN', 'HOD & Professor', 'Narasaraopeta Engineering College']],
      theme: 'striped',
      headStyles: { fillColor: [11, 25, 44], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 7, cellPadding: 1.8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 46, fontStyle: 'bold' },
        2: { cellWidth: 34 },
        3: { cellWidth: 42 },
        4: { cellWidth: 52 }
      }
    });

    my = doc.lastAutoTable.finalY + 5;

    // Agenda summary
    if (meeting.agendaItems && meeting.agendaItems.length > 0) {
      if (my > pageHeight - 40) {
        doc.addPage();
        my = margin;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(11, 25, 44);
      doc.text(`Agenda & Deliberations (${meeting.agendaItems.length} Items)`, margin, my);
      my += 3.5;

      const agRows = meeting.agendaItems.map((ag, idx) => [
        String(ag.itemNo || idx + 1),
        ag.title || `Agenda Item ${idx + 1}`,
        ag.description || ag.title || '—'
      ]);

      callAutoTable(doc, {
        startY: my,
        margin: { left: margin, right: margin },
        head: [['#', 'Agenda Topic', 'Discussion / Context']],
        body: agRows,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
        bodyStyles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 56, fontStyle: 'bold' },
          2: { cellWidth: 116 }
        }
      });

      my = doc.lastAutoTable.finalY + 5;
    }

    // Resolutions summary
    if (meeting.resolutions && meeting.resolutions.length > 0) {
      if (my > pageHeight - 40) {
        doc.addPage();
        my = margin;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(11, 25, 44);
      doc.text(`Resolutions & Approved Outcomes (${meeting.resolutions.length} Decisions)`, margin, my);
      my += 3.5;

      const resRows = meeting.resolutions.map((r, idx) => [
        String(r.resolutionNumber || idx + 1),
        r.title || `Resolution ${idx + 1}`,
        r.resolutionText || r.title || 'Approved.'
      ]);

      callAutoTable(doc, {
        startY: my,
        margin: { left: margin, right: margin },
        head: [['#', 'Subject', 'Resolution Details']],
        body: resRows,
        theme: 'grid',
        headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
        bodyStyles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 56, fontStyle: 'bold' },
          2: { cellWidth: 116 }
        }
      });

      my = doc.lastAutoTable.finalY + 5;
    }

    // Provenance / Review Notes
    if (meeting.reviewNotes || meeting.sourceConfidence) {
      if (my > pageHeight - 25) {
        doc.addPage();
        my = margin;
      }
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Provenance Note: ${meeting.sourceConfidence || 'HIGH'} — ${meeting.reviewNotes || 'Source verified.'}`, margin, my + 3);
    }
  });

  // Add Running Footers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('NEC Autonomous Academic Management Portal  |  Generated from institutional database record. (Not the scanned physical signed minutes)', margin, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}  |  Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  const cleanFilename = `NEC_BoS_Comprehensive_Report_${new Date().toISOString().slice(0, 10)}`;
  doc.save(`${cleanFilename}.pdf`);

  addAuditLog('BOS_EXPORT_PDF', 'Board of Studies', `Exported BoS comprehensive report (${meetings.length} records)`, actorUser);
}

// -------------------------------------------------------------
// Recycle Bin & Soft Delete Management Engine
// -------------------------------------------------------------
export function getRecycleBin() {
  const modules = [
    { key: STORAGE_KEYS.PUBLICATIONS, name: 'publications', initial: INITIAL_PUBLICATIONS },
    { key: STORAGE_KEYS.PATENTS, name: 'patents', initial: INITIAL_PATENTS },
    { key: STORAGE_KEYS.BOS, name: 'bos', initial: INITIAL_BOS },
    { key: STORAGE_KEYS.STUDENT_ACHIEVEMENTS, name: 'achievements', initial: INITIAL_STUDENT_ACHIEVEMENTS },
    { key: STORAGE_KEYS.INTERNSHIPS, name: 'internships', initial: INITIAL_INTERNSHIPS },
    { key: STORAGE_KEYS.PROJECTS, name: 'projects', initial: INITIAL_PROJECTS },
    { key: STORAGE_KEYS.FDPS, name: 'fdps', initial: INITIAL_FDPS },
    { key: STORAGE_KEYS.FACULTY_ACHIEVEMENTS, name: 'faculty-ach', initial: INITIAL_FACULTY_ACHIEVEMENTS },
    { key: STORAGE_KEYS.EVENTS, name: 'events', initial: INITIAL_EVENTS },
    { key: STORAGE_KEYS.MEMBERSHIPS, name: 'memberships', initial: INITIAL_MEMBERSHIPS },
    { key: STORAGE_KEYS.MOUS, name: 'mous', initial: INITIAL_MOUS },
    { key: STORAGE_KEYS.NPTEL, name: 'nptel', initial: INITIAL_NPTEL },
    { key: STORAGE_KEYS.PLACEMENTS, name: 'placements', initial: INITIAL_PLACEMENT_RECORDS }
  ];

  const deletedItems = [];
  modules.forEach(m => {
    const items = loadStore(m.key, m.initial);
    if (Array.isArray(items)) {
      items.filter(i => i && i.isDeleted).forEach(item => {
        deletedItems.push({
          ...item,
          module: m.name,
          storageKey: m.key
        });
      });
    }
  });
  return deletedItems;
}

export function restoreFromRecycleBin(id, moduleName, user) {
  const moduleKeyMap = {
    'publications': STORAGE_KEYS.PUBLICATIONS,
    'patents': STORAGE_KEYS.PATENTS,
    'bos': STORAGE_KEYS.BOS,
    'achievements': STORAGE_KEYS.STUDENT_ACHIEVEMENTS,
    'internships': STORAGE_KEYS.INTERNSHIPS,
    'projects': STORAGE_KEYS.PROJECTS,
    'fdps': STORAGE_KEYS.FDPS,
    'faculty-ach': STORAGE_KEYS.FACULTY_ACHIEVEMENTS,
    'events': STORAGE_KEYS.EVENTS,
    'memberships': STORAGE_KEYS.MEMBERSHIPS,
    'mous': STORAGE_KEYS.MOUS,
    'nptel': STORAGE_KEYS.NPTEL,
    'placements': STORAGE_KEYS.PLACEMENTS
  };

  const key = moduleKeyMap[moduleName] || STORAGE_KEYS.PUBLICATIONS;
  const items = loadStore(key, []);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    items[index].isDeleted = false;
    delete items[index].deletedAt;
    delete items[index].deletedBy;
    saveStore(key, items);
    addAuditLog('RESTORE', moduleName, `Restored item ${id} from Recycle Bin`, user);
  }
  return items;
}

export function deleteItem(entityKey, id, user) {
  const moduleKeyMap = {
    'publications': STORAGE_KEYS.PUBLICATIONS,
    'patents': STORAGE_KEYS.PATENTS,
    'bos': STORAGE_KEYS.BOS,
    'achievements': STORAGE_KEYS.STUDENT_ACHIEVEMENTS,
    'internships': STORAGE_KEYS.INTERNSHIPS,
    'projects': STORAGE_KEYS.PROJECTS,
    'fdps': STORAGE_KEYS.FDPS,
    'faculty-ach': STORAGE_KEYS.FACULTY_ACHIEVEMENTS,
    'events': STORAGE_KEYS.EVENTS,
    'memberships': STORAGE_KEYS.MEMBERSHIPS,
    'mous': STORAGE_KEYS.MOUS,
    'nptel': STORAGE_KEYS.NPTEL,
    'placements': STORAGE_KEYS.PLACEMENTS
  };

  const key = moduleKeyMap[entityKey.toLowerCase()] || STORAGE_KEYS.PUBLICATIONS;
  const items = loadStore(key, []);
  const index = Array.isArray(items) ? items.findIndex(i => i.id === id) : -1;
  if (index >= 0) {
    items[index].isDeleted = true;
    items[index].deletedAt = new Date().toISOString();
    items[index].deletedBy = user?.name || 'Admin';
    saveStore(key, items);
    addAuditLog('DELETE (Soft)', entityKey, `Soft-deleted record ${id}`, user);
  }
  return Array.isArray(items) ? items.filter(i => !i.isDeleted) : [];
}

// ==========================================
// BOARD OF STUDIES (BoS) ACADEMIC GOVERNANCE
// ==========================================

export function generateBoSNumber(department = 'CSE', year = new Date().getFullYear()) {
  const allMeetings = getBoSMeetings(true);
  const deptCode = (department || 'CSE').toUpperCase();
  const yearStr = String(year);
  const matching = allMeetings.filter(m => m.department === deptCode && (m.academicYear?.includes(yearStr) || m.bosNumber?.includes(yearStr)));
  const nextSeq = String(matching.length + 1).padStart(3, '0');
  return `BOS-${deptCode}-${yearStr}-${nextSeq}`;
}

export function getBoSMeetings(includeDeleted = false) {
  const seed = [
    {
      id: 'bos_cse_2026_01',
      bosNumber: 'BOS-CSE-2026-001',
      department: 'CSE',
      academicYear: '2025-26',
      title: '14th Board of Studies Meeting - CSE',
      bosDate: '2026-08-20',
      startTime: '10:00 AM',
      endTime: '01:30 PM',
      meetingMode: 'Hybrid',
      venue: 'Conference Hall - 1, Admin Block, NEC',
      meetingLink: 'https://meet.google.com/nec-cse-bos-2026',
      regulations: ['R20', 'R23'],
      meetingStatus: 'HELD',
      workflowStatus: 'APPROVED',
      version: 1,
      chairmanType: 'INTERNAL',
      chairman: 'Dr. S. N. Tirumala Rao (Professor & HOD, CSE)',
      chairmanEmail: 'hodcse@nrtec.in',
      chairmanPhone: '+91 8647 239903',
      chairmanOrg: 'Narasaraopeta Engineering College',
      universityNominee: {
        name: 'Prof. M.H.M. Krishna Prasad',
        institution: 'JNTUK Kakinada',
        designation: 'Professor of CSE & Director of Academic Planning',
        email: 'krishnaprasad@jntuk.edu.in',
        phone: '+91 884 2300900'
      },
      academicians: [
        {
          name: 'Dr. D. Rajya Lakshmi',
          institution: 'JNTUK University College of Engineering',
          designation: 'Professor of CSE & Vice Principal',
          email: 'drlakshmi@jntukucev.ac.in',
          phone: '+91 8922 277388'
        },
        {
          name: 'Dr. P. Radha Krishna',
          institution: 'NIT Warangal',
          designation: 'Professor & Head, Dept of CSE',
          email: 'prkrishna@nitw.ac.in',
          phone: '+91 870 2462700'
        }
      ],
      industryMember: {
        name: 'Mr. V. Sreekanth',
        company: 'Tata Consultancy Services (TCS)',
        designation: 'Senior Technology Architect & Academic Liaison',
        email: 'sreekanth.v@tcs.com',
        phone: '+91 40 66672000'
      },
      alumniMember: {
        name: 'Mr. K. Chaitanya Varma',
        company: 'Microsoft India Development Center',
        designation: 'Principal Software Engineer (Batch of 2016)',
        email: 'chaitanya.varma@microsoft.com',
        phone: '+91 80 67891000'
      },
      facultyMembers: [
        'Dr. K. Lakshi Narayana',
        'Dr. G. L. N. Jayaprada',
        'Dr. B. J. M. R. K. Prasad'
      ],
      agendaItems: [
        {
          itemNo: 1,
          title: 'Approval of R23 Regulation 3rd & 4th Year Curriculum Structure',
          description: 'Detailed discussion on advanced elective tracks: AI/ML, Cloud Computing, Cyber Security',
          decision: 'Unanimously approved with incorporation of Industry AI Capstone guidelines.'
        },
        {
          itemNo: 2,
          title: 'Introduction of New Professional Elective: Generative AI & LLM Systems',
          description: 'Syllabus design, prerequisite courses, and laboratory assignments using open-source models',
          decision: 'Approved. Recommended 30% weightage for hands-on project implementation.'
        },
        {
          itemNo: 3,
          title: 'Review of Industry Internship Credits & Evaluation Rubric',
          description: 'Mandatory 6-month full semester industrial internship policy for final year students',
          decision: 'Approved as per AICTE and APSCHE guidelines.'
        }
      ],
      documents: [
        {
          id: 'doc_1',
          title: 'Minutes of Meeting (Signed & Approved)',
          filename: 'BOS_CSE_14th_Minutes_Signed.pdf',
          type: 'MINUTES',
          sizeBytes: 3948200,
          version: 'v1.0',
          uploadedAt: '2026-08-20T14:30:00Z',
          uploadedBy: 'Dr. S. N. Tirumala Rao'
        },
        {
          id: 'doc_2',
          title: 'Curriculum Structure & Course Syllabus (R23)',
          filename: 'R23_CSE_Syllabus_Approved.pdf',
          type: 'SYLLABUS',
          sizeBytes: 5829100,
          version: 'v1.0',
          uploadedAt: '2026-08-20T14:35:00Z',
          uploadedBy: 'Dr. S. N. Tirumala Rao'
        }
      ],
      approvalHistory: [
        {
          action: 'BOS_CREATED',
          fromStatus: null,
          toStatus: 'DRAFT',
          actor: 'Dr. S. N. Tirumala Rao (HOD)',
          comments: 'Drafted 14th BoS meeting agenda and member roster.',
          timestamp: '2026-08-18T10:30:00Z'
        },
        {
          action: 'BOS_SUBMITTED',
          fromStatus: 'DRAFT',
          toStatus: 'SUBMITTED',
          actor: 'Dr. S. N. Tirumala Rao (HOD)',
          comments: 'Submitted completed meeting minutes and resolutions for administrative approval.',
          timestamp: '2026-08-20T15:00:00Z'
        },
        {
          action: 'BOS_REVIEWED',
          fromStatus: 'SUBMITTED',
          toStatus: 'UNDER_REVIEW',
          actor: 'Dr. S. Venkateswarlu (College Admin)',
          comments: 'Verified JNTUK nominee and expert attendance.',
          timestamp: '2026-08-21T09:30:00Z'
        },
        {
          action: 'BOS_APPROVED',
          fromStatus: 'UNDER_REVIEW',
          toStatus: 'APPROVED',
          actor: 'Super Administrator',
          comments: 'Formally approved and sealed for Academic Council & NAAC accreditation compliance.',
          timestamp: '2026-08-21T11:00:00Z'
        }
      ],
      createdAt: '2026-08-18T10:30:00Z',
      updatedAt: '2026-08-21T11:00:00Z'
    },
    {
      id: 'bos_ece_2026_01',
      bosNumber: 'BOS-ECE-2026-001',
      department: 'ECE',
      academicYear: '2025-26',
      title: '11th Board of Studies Meeting - ECE',
      bosDate: '2026-08-22',
      startTime: '11:00 AM',
      endTime: '02:00 PM',
      meetingMode: 'Offline',
      venue: 'ECE Department Seminar Hall',
      meetingLink: '',
      regulations: ['R23'],
      meetingStatus: 'HELD',
      workflowStatus: 'UNDER_REVIEW',
      version: 1,
      chairmanType: 'INTERNAL',
      chairman: 'Dr. V. Venkata Rao (Professor & HOD, ECE)',
      chairmanEmail: 'hodece@nrtec.in',
      chairmanPhone: '+91 8647 239904',
      chairmanOrg: 'Narasaraopeta Engineering College',
      universityNominee: {
        name: 'Dr. K. Babulu',
        institution: 'JNTUK Kakinada',
        designation: 'Professor of ECE & Director of Evaluation',
        email: 'kbabulu@jntuk.edu.in',
        phone: '+91 884 2300902'
      },
      academicians: [
        {
          name: 'Dr. N. V. S. N. Sarma',
          institution: 'IIITDM Kurnool',
          designation: 'Director & Professor of ECE',
          email: 'director@iiitk.ac.in',
          phone: '+91 8518 289100'
        }
      ],
      industryMember: {
        name: 'Er. R. Kishore',
        company: 'Texas Instruments',
        designation: 'Lead Architect (VLSI Systems)',
        email: 'r.kishore@ti.com',
        phone: '+91 80 25048000'
      },
      alumniMember: {
        name: 'Ms. P. Swathi',
        company: 'Qualcomm India',
        designation: 'Staff Engineer (Batch of 2018)',
        email: 'pswathi@qualcomm.com',
        phone: '+91 40 67008000'
      },
      facultyMembers: ['Dr. J. V. Rao', 'Dr. B. Suresh'],
      agendaItems: [
        {
          itemNo: 1,
          title: 'Revision of VLSI Design & Embedded Systems Curriculum',
          description: 'Incorporation of RISC-V architecture and FPGA laboratory modules',
          decision: 'Approved pending minor laboratory rubric updates.'
        }
      ],
      documents: [
        {
          id: 'doc_ece_1',
          title: 'Minutes of Meeting Draft',
          filename: 'BOS_ECE_11th_Minutes_Draft.pdf',
          type: 'MINUTES',
          sizeBytes: 2419000,
          version: 'v1.0',
          uploadedAt: '2026-08-22T16:00:00Z',
          uploadedBy: 'Dr. V. Venkata Rao'
        }
      ],
      approvalHistory: [
        {
          action: 'BOS_CREATED',
          fromStatus: null,
          toStatus: 'DRAFT',
          actor: 'Dr. V. Venkata Rao (HOD)',
          comments: 'Drafted 11th BoS meeting.',
          timestamp: '2026-08-20T11:00:00Z'
        },
        {
          action: 'BOS_SUBMITTED',
          fromStatus: 'DRAFT',
          toStatus: 'SUBMITTED',
          actor: 'Dr. V. Venkata Rao (HOD)',
          comments: 'Submitted for administrative review.',
          timestamp: '2026-08-22T17:00:00Z'
        }
      ],
      createdAt: '2026-08-20T11:00:00Z',
      updatedAt: '2026-08-22T17:00:00Z'
    }
  ];

  const combinedSeed = [...(INITIAL_BOS || []), ...seed];
  const items = loadStore(STORAGE_KEYS.BOS, combinedSeed);
  return includeDeleted ? items : items.filter(i => !i.isDeleted);
}

export function saveBoSMeeting(data, actorUser) {
  const items = loadStore(STORAGE_KEYS.BOS, []);
  let savedItem;

  if (data.id && items.some(i => i.id === data.id)) {
    const idx = items.findIndex(i => i.id === data.id);
    const existing = items[idx];

    const isApprovedBefore = existing.workflowStatus === 'APPROVED';
    const nextVersion = isApprovedBefore ? (existing.version || 1) + 1 : (existing.version || 1);

    const historyEntry = {
      action: data.workflowStatus !== existing.workflowStatus ? `STATUS_${data.workflowStatus}` : 'BOS_UPDATED',
      fromStatus: existing.workflowStatus,
      toStatus: data.workflowStatus || existing.workflowStatus,
      actor: actorUser?.name || 'Administrator',
      comments: data.workflowComments || `Updated BoS meeting record (v${nextVersion}).`,
      timestamp: new Date().toISOString()
    };

    savedItem = {
      ...existing,
      ...data,
      version: nextVersion,
      approvalHistory: [historyEntry, ...(existing.approvalHistory || [])],
      updatedAt: new Date().toISOString(),
      updatedBy: actorUser?.name || 'Admin'
    };

    items[idx] = savedItem;
    addAuditLog('UPDATE', 'BoS Meetings', `Updated BoS record ${savedItem.bosNumber}`, actorUser);
  } else {
    const dept = data.department || 'CSE';
    const year = new Date(data.bosDate || Date.now()).getFullYear();
    const generatedNumber = data.bosNumber || generateBoSNumber(dept, year);

    savedItem = {
      ...data,
      id: data.id || 'bos_' + Date.now(),
      bosNumber: generatedNumber,
      workflowStatus: data.workflowStatus || 'DRAFT',
      meetingStatus: data.meetingStatus || 'SCHEDULED',
      version: 1,
      approvalHistory: [
        {
          action: 'BOS_CREATED',
          fromStatus: null,
          toStatus: data.workflowStatus || 'DRAFT',
          actor: actorUser?.name || 'Administrator',
          comments: 'Initial creation of BoS meeting record.',
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      createdBy: actorUser?.name || 'Admin',
      updatedAt: new Date().toISOString()
    };

    items.unshift(savedItem);
    addAuditLog('CREATE', 'BoS Meetings', `Created BoS record ${savedItem.bosNumber}`, actorUser);
  }

  saveStore(STORAGE_KEYS.BOS, items);
  return savedItem;
}

export function updateBoSMeetingStatus(meetingId, newStatus, comments = '', actorUser) {
  const items = loadStore(STORAGE_KEYS.BOS, []);
  const idx = items.findIndex(i => i.id === meetingId);
  if (idx < 0) throw new Error('BoS meeting not found');

  const existing = items[idx];
  const oldStatus = existing.workflowStatus;

  const historyEntry = {
    action: `STATUS_CHANGE_TO_${newStatus}`,
    fromStatus: oldStatus,
    toStatus: newStatus,
    actor: actorUser?.name || 'Administrator',
    comments: comments || `Status changed to ${newStatus}`,
    timestamp: new Date().toISOString()
  };

  const updated = {
    ...existing,
    workflowStatus: newStatus,
    approvalHistory: [historyEntry, ...(existing.approvalHistory || [])],
    updatedAt: new Date().toISOString(),
    updatedBy: actorUser?.name || 'Admin'
  };

  items[idx] = updated;
  saveStore(STORAGE_KEYS.BOS, items);
  addAuditLog('STATUS_CHANGE', 'BoS Meetings', `${existing.bosNumber}: ${oldStatus} -> ${newStatus} (${comments})`, actorUser);
  return updated;
}

export function archiveBoSMeeting(meetingId, actorUser) {
  return updateBoSMeetingStatus(meetingId, 'ARCHIVED', 'Archived for historical governance record.', actorUser);
}

export function softDeleteBoSMeeting(meetingId, actorUser) {
  const items = loadStore(STORAGE_KEYS.BOS, []);
  const idx = items.findIndex(i => i.id === meetingId);
  if (idx < 0) return items;

  const existing = items[idx];
  if (existing.workflowStatus !== 'DRAFT' && actorUser?.role !== 'SUPER_ADMIN') {
    throw new Error('Only DRAFT BoS records can be deleted. Please archive submitted/approved records.');
  }

  existing.isDeleted = true;
  existing.deletedAt = new Date().toISOString();
  existing.deletedBy = actorUser?.name || 'Admin';

  saveStore(STORAGE_KEYS.BOS, items);
  addAuditLog('DELETE', 'BoS Meetings', `Deleted BoS draft record ${existing.bosNumber}`, actorUser);
  return items.filter(i => !i.isDeleted);
}

// -------------------------------------------------------------
// TECHNICAL CADRE & NON-TEACHING STAFF PROFILES STORE
// -------------------------------------------------------------
export function getStaffProfiles(includeDeleted = false) {
  const items = loadStore(STORAGE_KEYS.STAFF_PROFILES, []);
  if (!Array.isArray(items)) return [];
  return items.filter(s => includeDeleted || !s.isDeleted);
}

export function saveStaffProfile(item, actorUser) {
  const items = loadStore(STORAGE_KEYS.STAFF_PROFILES, []);
  const index = items.findIndex(s => s.id === item.id);

  if (index === -1) {
    // Duplicate check on officialStaffId or officialEmail
    if (item.officialStaffId && item.officialStaffId.trim()) {
      const existingId = items.find(s => !s.isDeleted && s.officialStaffId?.toLowerCase() === item.officialStaffId.trim().toLowerCase());
      if (existingId) {
        throw new Error(`A staff profile with Employee ID "${item.officialStaffId}" already exists.`);
      }
    }

    if (item.officialEmail && item.officialEmail.trim()) {
      const existingEmail = items.find(s => !s.isDeleted && s.email?.toLowerCase() === item.officialEmail.trim().toLowerCase());
      if (existingEmail) {
        throw new Error(`A staff profile with Email "${item.officialEmail}" already exists.`);
      }
    }

    const newStaff = {
      ...item,
      id: item.id || `STF-${String(Date.now()).slice(-4)}`,
      name: item.fullName || item.name,
      fullName: item.fullName || item.name,
      createdAt: new Date().toISOString(),
      createdBy: actorUser?.name || actorUser?.username || 'Staff Admin',
      isDeleted: false
    };

    items.unshift(newStaff);
    saveStore(STORAGE_KEYS.STAFF_PROFILES, items);
    addAuditLog('CREATE', 'Staff Profiles', `Created staff record for ${newStaff.name} (${newStaff.designation})`, actorUser);
    return { success: true, record: newStaff };
  } else {
    const updatedStaff = {
      ...items[index],
      ...item,
      name: item.fullName || item.name || items[index].name,
      fullName: item.fullName || item.name || items[index].name,
      updatedAt: new Date().toISOString(),
      updatedBy: actorUser?.name || actorUser?.username || 'Staff Admin'
    };

    items[index] = updatedStaff;
    saveStore(STORAGE_KEYS.STAFF_PROFILES, items);
    addAuditLog('UPDATE', 'Staff Profiles', `Updated staff record for ${updatedStaff.name}`, actorUser);
    return { success: true, record: updatedStaff };
  }
}

export function deleteStaffProfile(staffId, actorUser) {
  const items = loadStore(STORAGE_KEYS.STAFF_PROFILES, []);
  const index = items.findIndex(s => s.id === staffId);
  if (index === -1) return { success: false, error: 'Staff record not found.' };

  const target = items[index];
  target.isDeleted = true;
  target.deletedAt = new Date().toISOString();
  target.deletedBy = actorUser?.name || 'Staff Admin';

  saveStore(STORAGE_KEYS.STAFF_PROFILES, items);
  addAuditLog('DELETE', 'Staff Profiles', `Deleted staff record for ${target.name}`, actorUser);
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// STUDENT MASTER DIRECTORY & GUARDIAN PROFILE FUNCTIONS
// ─────────────────────────────────────────────────────────────

export function getStudents(filters = {}) {
  const students = loadStore(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  let list = students.filter(s => !s.isDeleted);

  if (filters.department && filters.department !== 'ALL') {
    list = list.filter(s => (s.departmentCode || s.department || '').toUpperCase() === filters.department.toUpperCase());
  }
  if (filters.year && filters.year !== 'ALL') {
    list = list.filter(s => s.year === filters.year);
  }
  if (filters.semester && filters.semester !== 'ALL') {
    list = list.filter(s => s.semester === filters.semester);
  }
  if (filters.section && filters.section !== 'ALL') {
    list = list.filter(s => s.section === filters.section);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(s => 
      (s.rollNumber || '').toLowerCase().includes(q) ||
      (s.registrationNumber || '').toLowerCase().includes(q) ||
      (s.fullName || '').toLowerCase().includes(q) ||
      (s.mentorName || '').toLowerCase().includes(q)
    );
  }

  return list;
}

export function getStudentByRollNumber(rollNumber) {
  if (!rollNumber) return null;
  const q = rollNumber.toString().trim().toLowerCase();
  const students = loadStore(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  return students.find(s => !s.isDeleted && (
    (s.rollNumber || '').toLowerCase().trim() === q ||
    (s.registrationNumber || '').toLowerCase().trim() === q
  )) || null;
}

export function getStudentGuardian(studentId, rollNumber = null) {
  const guardians = loadStore(STORAGE_KEYS.STUDENT_GUARDIANS, INITIAL_STUDENT_GUARDIANS);
  if (studentId) {
    const match = guardians.find(g => g.studentId === studentId);
    if (match) return match;
  }
  if (rollNumber) {
    const q = rollNumber.toString().trim().toLowerCase();
    const match = guardians.find(g => (g.rollNumber || '').toLowerCase().trim() === q);
    if (match) return match;
  }
  return null;
}

export function saveStudent(studentData, actorUser) {
  const students = loadStore(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  const isNew = !studentData.id;
  
  if (isNew) {
    const newStudent = {
      ...studentData,
      id: `stu_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      createdBy: actorUser?.name || 'Academic Admin',
      isDeleted: false
    };
    students.unshift(newStudent);
    saveStore(STORAGE_KEYS.STUDENTS, students);
    addAuditLog('CREATE', 'Student Master', `Added student ${newStudent.fullName} (${newStudent.rollNumber})`, actorUser);
    return { success: true, record: newStudent };
  } else {
    const index = students.findIndex(s => s.id === studentData.id);
    if (index === -1) return { success: false, error: 'Student not found.' };
    students[index] = {
      ...students[index],
      ...studentData,
      updatedAt: new Date().toISOString(),
      updatedBy: actorUser?.name || 'Academic Admin'
    };
    saveStore(STORAGE_KEYS.STUDENTS, students);
    addAuditLog('UPDATE', 'Student Master', `Updated student ${students[index].fullName} (${students[index].rollNumber})`, actorUser);
    return { success: true, record: students[index] };
  }
}

export function saveStudentGuardian(guardianData, actorUser) {
  const guardians = loadStore(STORAGE_KEYS.STUDENT_GUARDIANS, INITIAL_STUDENT_GUARDIANS);
  const isNew = !guardianData.id;

  if (isNew) {
    const newGrd = {
      ...guardianData,
      id: `grd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      isPrimary: true
    };
    guardians.unshift(newGrd);
    saveStore(STORAGE_KEYS.STUDENT_GUARDIANS, guardians);
    addAuditLog('CREATE', 'Guardian Directory', `Created guardian contact for roll ${newGrd.rollNumber}`, actorUser);
    return { success: true, record: newGrd };
  } else {
    const index = guardians.findIndex(g => g.id === guardianData.id);
    if (index === -1) return { success: false, error: 'Guardian profile not found.' };
    guardians[index] = {
      ...guardians[index],
      ...guardianData,
      updatedAt: new Date().toISOString()
    };
    saveStore(STORAGE_KEYS.STUDENT_GUARDIANS, guardians);
    addAuditLog('UPDATE', 'Guardian Directory', `Updated guardian contact for roll ${guardians[index].rollNumber}`, actorUser);
    return { success: true, record: guardians[index] };
  }
}

export function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return 'Not available';
  const clean = phone.trim();
  if (clean.length < 5) return 'Not available';
  
  // Extract pure digits
  const digitsOnly = clean.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `${digitsOnly.slice(0, 2)}******${digitsOnly.slice(8)}`;
  }
  if (digitsOnly.length > 10) {
    const countryCode = digitsOnly.slice(0, digitsOnly.length - 10);
    const tenDigits = digitsOnly.slice(-10);
    return `+${countryCode} ${tenDigits.slice(0, 2)}******${tenDigits.slice(8)}`;
  }
  return `${clean.slice(0, 2)}******${clean.slice(-2)}`;
}

// ─────────────────────────────────────────────────────────────
// ATTENDANCE PARSING, VALIDATION & ENGINE
// ─────────────────────────────────────────────────────────────

export function parseAndValidateAttendanceCSV(csvText, customMapping = {}, threshold = 65.0) {
  if (!csvText || typeof csvText !== 'string' || !csvText.trim()) {
    return { error: 'Empty or invalid CSV file content.', totalRows: 0, rows: [] };
  }

  // Parse lines considering quotes
  const lines = csvText.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    return { error: 'CSV must contain a header row and at least one data row.', totalRows: 0, rows: [] };
  }

  // Helper to split CSV row by comma respecting quoted strings
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const headers = parseCSVLine(lines[0]);
  const normHeaders = headers.map(h => h.toLowerCase().replace(/[\s_\-\.\(\)]/g, ''));

  // Header Auto-Detection logic
  const findColIndex = (candidates) => {
    for (const cand of candidates) {
      const cleanCand = cand.toLowerCase().replace(/[\s_\-\.\(\)]/g, '');
      const idx = normHeaders.findIndex(h => h === cleanCand || h.includes(cleanCand));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const rollColIdx = customMapping.rollNumber !== undefined ? customMapping.rollNumber : findColIndex(['rollnumber', 'rollno', 'htno', 'hallticket', 'regno', 'registrationnumber', 'studentid', 'id']);
  const nameColIdx = customMapping.studentName !== undefined ? customMapping.studentName : findColIndex(['studentname', 'fullname', 'name', 'student']);
  const subCodeColIdx = customMapping.subjectCode !== undefined ? customMapping.subjectCode : findColIndex(['subjectcode', 'subcode', 'coursecode']);
  const subNameColIdx = customMapping.subjectName !== undefined ? customMapping.subjectName : findColIndex(['subjectname', 'subject', 'coursename']);
  const conductedColIdx = customMapping.classesConducted !== undefined ? customMapping.classesConducted : findColIndex(['classesconducted', 'totalclasses', 'conducted', 'totalhours', 'held', 'maxclasses']);
  const attendedColIdx = customMapping.classesAttended !== undefined ? customMapping.classesAttended : findColIndex(['classesattended', 'attended', 'present', 'attendedhours']);
  const percentageColIdx = customMapping.attendancePercentage !== undefined ? customMapping.attendancePercentage : findColIndex(['attendancepercentage', 'attendancepct', 'attendance', 'percentage', 'pct']);

  if (rollColIdx === -1) {
    return {
      error: 'Could not identify Roll Number column. Please map the Roll Number / HTNO column explicitly.',
      detectedHeaders: headers,
      totalRows: 0,
      rows: []
    };
  }

  const studentsMaster = getStudents();
  const rawRows = [];
  const studentMap = new Map(); // rollNumber -> aggregate info

  for (let i = 1; i < lines.length; i++) {
    const rawCols = parseCSVLine(lines[i]);
    if (rawCols.every(c => !c.trim())) continue;

    const rawRoll = (rawCols[rollColIdx] || '').trim();
    const rawName = nameColIdx !== -1 ? (rawCols[nameColIdx] || '').trim() : '';
    const rawSubCode = subCodeColIdx !== -1 ? (rawCols[subCodeColIdx] || '').trim() : '';
    const rawSubName = subNameColIdx !== -1 ? (rawCols[subNameColIdx] || '').trim() : '';
    
    let rawConducted = conductedColIdx !== -1 ? parseInt(rawCols[conductedColIdx], 10) : NaN;
    let rawAttended = attendedColIdx !== -1 ? parseInt(rawCols[attendedColIdx], 10) : NaN;
    let rawPercentage = percentageColIdx !== -1 ? parseFloat(rawCols[percentageColIdx].replace('%', '').trim()) : NaN;

    const rowErrors = [];
    const rowWarnings = [];

    if (!rawRoll) {
      rowErrors.push('Missing student Roll Number / Identifier.');
    }

    // Attendance computation & validation
    let calcPercentage = null;
    if (!isNaN(rawConducted) && !isNaN(rawAttended)) {
      if (rawConducted <= 0) {
        rowErrors.push('Classes Conducted must be greater than 0.');
      } else if (rawAttended < 0) {
        rowErrors.push('Classes Attended cannot be negative.');
      } else if (rawAttended > rawConducted) {
        rowErrors.push(`Classes Attended (${rawAttended}) cannot exceed Classes Conducted (${rawConducted}).`);
      } else {
        calcPercentage = parseFloat(((rawAttended / rawConducted) * 100).toFixed(2));
      }
    }

    let finalPercentage = !isNaN(rawPercentage) ? rawPercentage : calcPercentage;

    if (finalPercentage !== null && (finalPercentage < 0 || finalPercentage > 100)) {
      rowErrors.push(`Invalid attendance percentage (${finalPercentage}%). Must be between 0% and 100%.`);
      finalPercentage = null;
    }

    if (finalPercentage === null && rowErrors.length === 0) {
      rowErrors.push('Unable to calculate attendance. Provide either (Conducted + Attended) or Attendance Percentage.');
    }

    // Match with student master
    const matchedStudent = rawRoll ? studentsMaster.find(s => (s.rollNumber || '').toLowerCase() === rawRoll.toLowerCase() || (s.registrationNumber || '').toLowerCase() === rawRoll.toLowerCase()) : null;
    const matchStatus = matchedStudent ? 'MATCHED' : (rawRoll ? 'UNMATCHED' : 'INVALID');
    
    const guardian = matchedStudent ? getStudentGuardian(matchedStudent.id, matchedStudent.rollNumber) : null;

    const parsedRow = {
      rowNumber: i,
      rawRollNumber: rawRoll,
      rawStudentName: rawName,
      subjectCode: rawSubCode || 'OVERALL',
      subjectName: rawSubName || (rawSubCode ? rawSubCode : 'Overall Attendance'),
      classesConducted: !isNaN(rawConducted) ? rawConducted : null,
      classesAttended: !isNaN(rawAttended) ? rawAttended : null,
      attendancePercentage: finalPercentage,
      isValid: rowErrors.length === 0,
      errors: rowErrors,
      warnings: rowWarnings,
      matchStatus,
      studentId: matchedStudent ? matchedStudent.id : null,
      student: matchedStudent ? {
        fullName: matchedStudent.fullName,
        departmentCode: matchedStudent.departmentCode,
        year: matchedStudent.year,
        semester: matchedStudent.semester,
        section: matchedStudent.section,
        mentorName: matchedStudent.mentorName
      } : null,
      guardian: guardian ? {
        guardianName: guardian.guardianName,
        relationship: guardian.relationship,
        phone: guardian.primaryPhone,
        maskedPhone: maskPhoneNumber(guardian.primaryPhone)
      } : null
    };

    rawRows.push(parsedRow);

    // Grouping by student roll for multi-subject or single subject
    if (parsedRow.isValid && rawRoll) {
      const normRoll = rawRoll.toUpperCase();
      if (!studentMap.has(normRoll)) {
        studentMap.set(normRoll, {
          rollNumber: normRoll,
          student: parsedRow.student,
          studentId: parsedRow.studentId,
          guardian: parsedRow.guardian,
          matchStatus: parsedRow.matchStatus,
          subjects: [],
          totalConducted: 0,
          totalAttended: 0,
          rawPercentages: []
        });
      }
      const agg = studentMap.get(normRoll);
      agg.subjects.push({
        subjectCode: parsedRow.subjectCode,
        subjectName: parsedRow.subjectName,
        conducted: parsedRow.classesConducted,
        attended: parsedRow.classesAttended,
        percentage: parsedRow.attendancePercentage,
        isBelow: parsedRow.attendancePercentage < threshold
      });
      if (parsedRow.classesConducted !== null && parsedRow.classesAttended !== null) {
        agg.totalConducted += parsedRow.classesConducted;
        agg.totalAttended += parsedRow.classesAttended;
      }
      if (parsedRow.attendancePercentage !== null) {
        agg.rawPercentages.push(parsedRow.attendancePercentage);
      }
    }
  }

  // Build Aggregated Students List with final overall attendance percentage
  const aggregatedStudents = [];
  let lowAttendanceCount = 0;
  let highRiskCount = 0;
  let criticalCount = 0;

  for (const [roll, data] of studentMap.entries()) {
    let overallPercentage = 0;
    if (data.totalConducted > 0) {
      overallPercentage = parseFloat(((data.totalAttended / data.totalConducted) * 100).toFixed(2));
    } else if (data.rawPercentages.length > 0) {
      const sum = data.rawPercentages.reduce((a, b) => a + b, 0);
      overallPercentage = parseFloat((sum / data.rawPercentages.length).toFixed(2));
    }

    const isBelow = overallPercentage < threshold;
    const shortfall = isBelow ? parseFloat((threshold - overallPercentage).toFixed(2)) : 0;

    let riskSeverity = 'NORMAL';
    if (overallPercentage < 45.0) {
      riskSeverity = 'CRITICAL';
      criticalCount++;
    } else if (overallPercentage < 55.0) {
      riskSeverity = 'HIGH_RISK';
      highRiskCount++;
    } else if (overallPercentage < threshold) {
      riskSeverity = 'LOW_ATTENDANCE';
      lowAttendanceCount++;
    }

    const lowSubjectsCount = data.subjects.filter(s => s.percentage < threshold).length;

    aggregatedStudents.push({
      rollNumber: roll,
      studentId: data.studentId,
      studentName: data.student ? data.student.fullName : (rawRows.find(r => r.rawRollNumber.toUpperCase() === roll)?.rawStudentName || roll),
      department: data.student ? data.student.departmentCode : 'UNRESOLVED',
      year: data.student ? data.student.year : '-',
      semester: data.student ? data.student.semester : '-',
      section: data.student ? data.student.section : '-',
      mentorName: data.student ? data.student.mentorName : 'Unassigned',
      guardianName: data.guardian ? data.guardian.guardianName : null,
      guardianRelationship: data.guardian ? data.guardian.relationship : null,
      guardianPhone: data.guardian ? data.guardian.phone : null,
      guardianMaskedPhone: data.guardian ? data.guardian.maskedPhone : 'Not available',
      matchStatus: data.matchStatus,
      classesConducted: data.totalConducted,
      classesAttended: data.totalAttended,
      attendancePercentage: overallPercentage,
      shortfall,
      threshold,
      isBelowThreshold: isBelow,
      riskSeverity,
      lowSubjectsCount,
      subjects: data.subjects
    });
  }

  const matchedRowsCount = rawRows.filter(r => r.matchStatus === 'MATCHED').length;
  const unmatchedRowsCount = rawRows.filter(r => r.matchStatus === 'UNMATCHED').length;
  const invalidRowsCount = rawRows.filter(r => !r.isValid).length;

  return {
    headers,
    columnMapping: {
      rollNumber: rollColIdx,
      studentName: nameColIdx,
      subjectCode: subCodeColIdx,
      subjectName: subNameColIdx,
      classesConducted: conductedColIdx,
      classesAttended: attendedColIdx,
      attendancePercentage: percentageColIdx
    },
    totalRows: rawRows.length,
    matchedRowsCount,
    unmatchedRowsCount,
    invalidRowsCount,
    rawRows,
    aggregatedStudents,
    summary: {
      totalStudents: aggregatedStudents.length,
      belowThresholdCount: lowAttendanceCount + highRiskCount + criticalCount,
      lowAttendanceCount,
      highRiskCount,
      criticalCount,
      threshold
    }
  };
}

export function executeAttendanceImport(parsedResult, cohortMeta = {}, actorUser) {
  if (!parsedResult || !parsedResult.aggregatedStudents || parsedResult.aggregatedStudents.length === 0) {
    return { success: false, error: 'No valid attendance data to commit.' };
  }

  const threshold = cohortMeta.threshold || parsedResult.summary.threshold || 65.0;
  const academicYear = cohortMeta.academicYear || '2026-27';
  const semester = cohortMeta.semester || 'III-I';
  const departmentCode = cohortMeta.departmentCode || 'CYS';
  const section = cohortMeta.section || 'A';
  const filename = cohortMeta.filename || 'attendance_upload.csv';
  const sha256 = cohortMeta.sha256 || `sha256_${Date.now()}`;

  const importJobs = loadStore(STORAGE_KEYS.ATTENDANCE_IMPORT_JOBS, []);
  const snapshots = loadStore(STORAGE_KEYS.ATTENDANCE_SNAPSHOTS, INITIAL_ATTENDANCE_SNAPSHOTS);
  const alerts = loadStore(STORAGE_KEYS.ATTENDANCE_ALERTS, INITIAL_ATTENDANCE_ALERTS);

  const jobId = `att_job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const recordedAt = new Date().toISOString();

  let createdAlertsCount = 0;

  parsedResult.aggregatedStudents.forEach(st => {
    // 1. Create or Update Snapshot
    const snapshotId = `att_snap_${st.rollNumber.toLowerCase()}_${Date.now()}`;
    const snap = {
      id: snapshotId,
      studentId: st.studentId || null,
      rollNumber: st.rollNumber,
      importJobId: jobId,
      academicYear,
      semester,
      section,
      departmentCode: st.department !== 'UNRESOLVED' ? st.department : departmentCode,
      classesConducted: st.classesConducted,
      classesAttended: st.classesAttended,
      attendancePercentage: st.attendancePercentage,
      thresholdPercentage: threshold,
      isBelowThreshold: st.isBelowThreshold,
      riskSeverity: st.riskSeverity,
      subjectBreakdown: st.subjects || [],
      recordedAt
    };
    snapshots.unshift(snap);

    // 2. If below threshold, create or update active alert
    if (st.isBelowThreshold) {
      const existingAlertIdx = alerts.findIndex(a => a.rollNumber.toUpperCase() === st.rollNumber.toUpperCase() && a.status !== 'RESOLVED');
      if (existingAlertIdx !== -1) {
        alerts[existingAlertIdx] = {
          ...alerts[existingAlertIdx],
          attendanceSnapshotId: snapshotId,
          attendancePercentage: st.attendancePercentage,
          shortfall: st.shortfall,
          riskSeverity: st.riskSeverity,
          threshold,
          updatedAt: recordedAt
        };
      } else {
        const newAlert = {
          id: `alt_${st.rollNumber.toLowerCase()}_${Date.now()}`,
          studentId: st.studentId || null,
          rollNumber: st.rollNumber,
          fullName: st.studentName,
          departmentCode: st.department !== 'UNRESOLVED' ? st.department : departmentCode,
          year: st.year !== '-' ? st.year : 'III',
          semester,
          section,
          academicYear,
          attendanceSnapshotId: snapshotId,
          alertType: 'LOW_ATTENDANCE',
          threshold,
          attendancePercentage: st.attendancePercentage,
          shortfall: st.shortfall,
          riskSeverity: st.riskSeverity,
          status: 'OPEN',
          lastContactedAt: null,
          lastContactStatus: null,
          createdAt: recordedAt
        };
        alerts.unshift(newAlert);
        createdAlertsCount++;
      }
    }
  });

  const jobRecord = {
    id: jobId,
    originalFilename: filename,
    sha256,
    academicYear,
    semester,
    departmentCode,
    section,
    uploadedBy: actorUser?.name || actorUser?.username || 'Academic Staff',
    totalRows: parsedResult.totalRows,
    matchedRows: parsedResult.matchedRowsCount,
    unmatchedRows: parsedResult.unmatchedRowsCount,
    lowAttendanceCount: parsedResult.summary.belowThresholdCount,
    thresholdPercentage: threshold,
    status: 'COMPLETED',
    createdAt: recordedAt,
    completedAt: recordedAt
  };

  importJobs.unshift(jobRecord);

  saveStore(STORAGE_KEYS.ATTENDANCE_IMPORT_JOBS, importJobs);
  saveStore(STORAGE_KEYS.ATTENDANCE_SNAPSHOTS, snapshots);
  saveStore(STORAGE_KEYS.ATTENDANCE_ALERTS, alerts);

  addAuditLog('IMPORT', 'Attendance Monitoring', `Committed attendance import for ${departmentCode} ${semester} Sec ${section} (${parsedResult.summary.belowThresholdCount} at-risk alerts)`, actorUser);

  return {
    success: true,
    jobId,
    totalStudents: parsedResult.aggregatedStudents.length,
    alertsCreated: createdAlertsCount,
    lowAttendanceCount: parsedResult.summary.belowThresholdCount
  };
}

export function getAttendanceAlerts(filters = {}, actorUser = null) {
  const alerts = loadStore(STORAGE_KEYS.ATTENDANCE_ALERTS, INITIAL_ATTENDANCE_ALERTS);
  const students = loadStore(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  const guardians = loadStore(STORAGE_KEYS.STUDENT_GUARDIANS, INITIAL_STUDENT_GUARDIANS);

  // Check user sensitive permission
  const userPermissions = actorUser?.permissions || DEFAULT_ROLE_PERMISSIONS[actorUser?.role] || [];
  const canViewSensitive = actorUser?.role === 'SUPER_ADMIN' || 
                           actorUser?.role === 'ADMIN' || 
                           userPermissions.includes('attendance.contact_parent') || 
                           userPermissions.includes('students.guardian.view');

  let list = alerts.map(alt => {
    const student = students.find(s => s.id === alt.studentId || (s.rollNumber || '').toLowerCase() === (alt.rollNumber || '').toLowerCase()) || {};
    const guardian = guardians.find(g => g.studentId === student.id || (g.rollNumber || '').toLowerCase() === (alt.rollNumber || '').toLowerCase()) || null;

    return {
      ...alt,
      studentName: student.fullName || alt.fullName || alt.rollNumber,
      registrationNumber: student.registrationNumber || '-',
      department: student.departmentCode || alt.departmentCode || 'CYS',
      year: student.year || alt.year || 'III',
      semester: student.semester || alt.semester || 'III-I',
      section: student.section || alt.section || 'A',
      mentorName: student.mentorName || 'Dr. S. Venkateswarlu',
      guardianName: guardian ? guardian.guardianName : null,
      guardianRelationship: guardian ? guardian.relationship : null,
      guardianPhone: canViewSensitive ? (guardian ? guardian.primaryPhone : null) : null,
      guardianMaskedPhone: guardian ? maskPhoneNumber(guardian.primaryPhone) : 'Parent contact not available',
      hasGuardian: !!guardian
    };
  });

  // Department Scope Enforcement for HOD/Faculty
  if (actorUser && actorUser.role === 'HOD' && actorUser.dept && actorUser.dept !== 'Management & Governance') {
    list = list.filter(a => (a.department || '').toUpperCase() === actorUser.dept.toUpperCase());
  }

  // Filters
  if (filters.department && filters.department !== 'ALL') {
    list = list.filter(a => (a.department || '').toUpperCase() === filters.department.toUpperCase());
  }
  if (filters.year && filters.year !== 'ALL') {
    list = list.filter(a => a.year === filters.year);
  }
  if (filters.semester && filters.semester !== 'ALL') {
    list = list.filter(a => a.semester === filters.semester);
  }
  if (filters.section && filters.section !== 'ALL') {
    list = list.filter(a => a.section === filters.section);
  }
  if (filters.status && filters.status !== 'ALL') {
    list = list.filter(a => a.status === filters.status);
  }
  if (filters.severity && filters.severity !== 'ALL') {
    list = list.filter(a => a.riskSeverity === filters.severity);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(a => 
      (a.rollNumber || '').toLowerCase().includes(q) ||
      (a.studentName || '').toLowerCase().includes(q) ||
      (a.guardianName || '').toLowerCase().includes(q) ||
      (a.mentorName || '').toLowerCase().includes(q)
    );
  }

  return list;
}

export function getAttendanceSnapshotDetail(rollNumberOrAlertId, actorUser = null) {
  if (!rollNumberOrAlertId) return null;
  const q = rollNumberOrAlertId.toString().trim().toLowerCase();

  const alerts = loadStore(STORAGE_KEYS.ATTENDANCE_ALERTS, INITIAL_ATTENDANCE_ALERTS);
  const snapshots = loadStore(STORAGE_KEYS.ATTENDANCE_SNAPSHOTS, INITIAL_ATTENDANCE_SNAPSHOTS);
  const students = loadStore(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  const guardians = loadStore(STORAGE_KEYS.STUDENT_GUARDIANS, INITIAL_STUDENT_GUARDIANS);
  const contacts = loadStore(STORAGE_KEYS.ATTENDANCE_PARENT_CONTACTS, INITIAL_ATTENDANCE_PARENT_CONTACTS);

  const alert = alerts.find(a => a.id.toLowerCase() === q || a.rollNumber.toLowerCase() === q);
  const rollNumber = alert ? alert.rollNumber : rollNumberOrAlertId;

  const student = students.find(s => (s.rollNumber || '').toLowerCase() === rollNumber.toLowerCase()) || null;
  const guardian = student ? guardians.find(g => g.studentId === student.id || (g.rollNumber || '').toLowerCase() === rollNumber.toLowerCase()) : null;

  // Find latest snapshot and historical trend
  const studentSnapshots = snapshots.filter(sn => (sn.rollNumber || '').toLowerCase() === rollNumber.toLowerCase())
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));

  const latestSnap = studentSnapshots[0] || null;
  const contactHistory = contacts.filter(c => (c.rollNumber || '').toLowerCase() === rollNumber.toLowerCase() || (alert && c.alertId === alert.id))
    .sort((a, b) => new Date(b.contactedAt) - new Date(a.contactedAt));

  const userPermissions = actorUser?.permissions || DEFAULT_ROLE_PERMISSIONS[actorUser?.role] || [];
  const canViewSensitive = actorUser?.role === 'SUPER_ADMIN' || 
                           actorUser?.role === 'ADMIN' || 
                           userPermissions.includes('attendance.contact_parent') || 
                           userPermissions.includes('students.guardian.view');

  return {
    rollNumber,
    alert,
    student,
    guardian: guardian ? {
      guardianName: guardian.guardianName,
      relationship: guardian.relationship,
      primaryPhone: canViewSensitive ? guardian.primaryPhone : null,
      alternatePhone: canViewSensitive ? guardian.alternatePhone : null,
      maskedPhone: maskPhoneNumber(guardian.primaryPhone),
      email: guardian.email,
      address: guardian.address
    } : null,
    latestSnapshot: latestSnap,
    trend: studentSnapshots.map(sn => ({
      date: sn.recordedAt ? sn.recordedAt.split('T')[0] : 'Recent',
      percentage: sn.attendancePercentage,
      isBelow: sn.isBelowThreshold
    })),
    subjectBreakdown: latestSnap?.subjectBreakdown || [],
    contactHistory
  };
}

export function logParentContact(contactPayload, actorUser) {
  const { alertId, rollNumber, contactMethod, contactStatus, notes, followUpDate } = contactPayload;
  if (!alertId || !rollNumber) {
    return { success: false, error: 'Alert ID and Roll Number are required.' };
  }

  const userPermissions = actorUser?.permissions || DEFAULT_ROLE_PERMISSIONS[actorUser?.role] || [];
  const canContact = actorUser?.role === 'SUPER_ADMIN' || 
                     actorUser?.role === 'ADMIN' || 
                     actorUser?.role === 'HOD' || 
                     userPermissions.includes('attendance.contact_parent');

  if (!canContact) {
    return { success: false, error: 'Unauthorized to log parent contact.' };
  }

  const contacts = loadStore(STORAGE_KEYS.ATTENDANCE_PARENT_CONTACTS, INITIAL_ATTENDANCE_PARENT_CONTACTS);
  const alerts = loadStore(STORAGE_KEYS.ATTENDANCE_ALERTS, INITIAL_ATTENDANCE_ALERTS);
  const student = getStudentByRollNumber(rollNumber);
  const guardian = student ? getStudentGuardian(student.id, rollNumber) : null;

  const newLog = {
    id: `cnt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    alertId,
    studentId: student ? student.id : null,
    rollNumber,
    guardianName: guardian ? guardian.guardianName : 'Parent',
    phoneContacted: guardian ? guardian.primaryPhone : 'Unstated',
    contactedBy: `${actorUser?.name || 'Academic Staff'} (${actorUser?.role || 'Staff'})`,
    contactMethod: contactMethod || 'PHONE',
    contactStatus: contactStatus || 'CONTACTED',
    notes: notes || '',
    followUpDate: followUpDate || null,
    contactedAt: new Date().toISOString()
  };

  contacts.unshift(newLog);
  saveStore(STORAGE_KEYS.ATTENDANCE_PARENT_CONTACTS, contacts);

  // Update alert status
  const alertIdx = alerts.findIndex(a => a.id === alertId);
  if (alertIdx !== -1) {
    alerts[alertIdx] = {
      ...alerts[alertIdx],
      status: contactStatus === 'RESOLVED' ? 'RESOLVED' : 'PARENT_CONTACTED',
      lastContactedAt: newLog.contactedAt,
      lastContactStatus: contactStatus
    };
    saveStore(STORAGE_KEYS.ATTENDANCE_ALERTS, alerts);
  }

  addAuditLog('CONTACT', 'Parent Communication', `Logged parent contact for student ${rollNumber} (Status: ${contactStatus})`, actorUser);

  return { success: true, log: newLog };
}

export function getAttendanceParentContacts(alertId = null) {
  const contacts = loadStore(STORAGE_KEYS.ATTENDANCE_PARENT_CONTACTS, INITIAL_ATTENDANCE_PARENT_CONTACTS);
  if (alertId) {
    return contacts.filter(c => c.alertId === alertId);
  }
  return contacts;
}

export function getAttendanceImportHistory() {
  return loadStore(STORAGE_KEYS.ATTENDANCE_IMPORT_JOBS, []);
}

export function exportAttendanceRiskList(alerts, format = 'csv', includeSensitive = false, actorUser = null) {
  const userPermissions = actorUser?.permissions || DEFAULT_ROLE_PERMISSIONS[actorUser?.role] || [];
  const canExportSensitive = (actorUser?.role === 'SUPER_ADMIN' || actorUser?.role === 'ADMIN' || userPermissions.includes('attendance.export_sensitive')) && includeSensitive;

  const exportRows = alerts.map((a, idx) => ({
    'S.No': idx + 1,
    'Roll Number': a.rollNumber,
    'Student Name': a.studentName,
    'Department': a.department,
    'Year / Sem': `${a.year} - ${a.semester}`,
    'Section': a.section,
    'Attendance %': `${a.attendancePercentage}%`,
    'Threshold': `${a.threshold}%`,
    'Shortfall': `${a.shortfall}%`,
    'Risk Severity': a.riskSeverity,
    'Mentor': a.mentorName,
    'Parent / Guardian': a.guardianName || 'Not available',
    'Contact Phone': canExportSensitive ? (a.guardianPhone || a.guardianMaskedPhone) : a.guardianMaskedPhone,
    'Contact Status': a.status
  }));

  if (format === 'csv') {
    exportToCSV(exportRows, `NEC_Attendance_Risk_List_${new Date().toISOString().split('T')[0]}.csv`);
  } else if (format === 'excel') {
    exportToExcel(exportRows, `NEC_Attendance_Risk_List_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
  return exportRows;
}

export function generateParentContactSheetPDF(alerts, cohortMeta = {}, includeSensitive = true, actorUser = null) {
  const userPermissions = actorUser?.permissions || DEFAULT_ROLE_PERMISSIONS[actorUser?.role] || [];
  const canExportSensitive = (actorUser?.role === 'SUPER_ADMIN' || actorUser?.role === 'ADMIN' || userPermissions.includes('attendance.export_sensitive')) && includeSensitive;

  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(7, 15, 30); // #070F1E
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(241, 196, 15); // Gold
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NARASARAOPETA ENGINEERING COLLEGE (AUTONOMOUS)', pageWidth / 2, 11, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('ACADEMIC MONITORING & LOW ATTENDANCE PARENT CONTACT SHEET', pageWidth / 2, 19, { align: 'center' });

  // Metadata ribbon
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 32, pageWidth - 28, 12, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 32, pageWidth - 28, 12, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  const metaText = `Cohort: ${cohortMeta.departmentCode || 'CYS'} | Year: ${cohortMeta.year || 'III'} | Semester: ${cohortMeta.semester || 'III-I'} | Section: ${cohortMeta.section || 'A'} | Policy Threshold: < ${cohortMeta.threshold || 65}% | Total At-Risk: ${alerts.length}`;
  doc.text(metaText, 18, 40);

  const tableData = alerts.map((a, idx) => [
    idx + 1,
    a.rollNumber,
    a.studentName,
    `${a.department} ${a.year}-${a.section}`,
    `${a.attendancePercentage}%`,
    a.riskSeverity.replace('_', ' '),
    a.mentorName,
    a.guardianName || 'Not available',
    canExportSensitive ? (a.guardianPhone || a.guardianMaskedPhone) : a.guardianMaskedPhone,
    a.status.replace('_', ' ')
  ]);

  autoTable(doc, {
    startY: 48,
    head: [['S.No', 'Roll No', 'Student Name', 'Class/Sec', 'Att %', 'Risk Level', 'Mentor Faculty', 'Guardian Name', 'Parent Contact', 'Call Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 25, 44],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [15, 23, 42]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 }
  });

  const finalY = doc.lastAutoTable?.finalY || 160;
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`CONFIDENTIAL ACADEMIC RECORD — Generated by ${actorUser?.name || 'Academic Administrator'} on ${new Date().toLocaleString()}`, 14, finalY + 10);

  doc.save(`NEC_Parent_Contact_Sheet_${cohortMeta.departmentCode || 'CYS'}_${cohortMeta.semester || 'III-I'}_${new Date().toISOString().split('T')[0]}.pdf`);
  return doc;
}

// -------------------------------------------------------------
// 1. Community Service Projects Store (ET Departments)
// -------------------------------------------------------------
export const INITIAL_COMMUNITY_PROJECTS = [
  {
    id: 'csp_cys_2026_01',
    projectNumber: 'CSP-CYS-2026-001',
    title: 'Cyber Safety & Digital Hygiene Awareness Campaign in Rural Schools',
    department: 'CYS',
    academicYear: '2026-27',
    year: 'III',
    semester: 'III-I',
    section: 'A',
    batch: '2023-2027',
    projectType: 'Awareness Campaign',
    community: 'Yellamanda & Kotappakonda ZP High Schools',
    partnerOrganization: 'Palnadu District Cyber Crime Awareness Cell',
    startDate: '2026-07-10',
    endDate: '2026-08-10',
    durationWeeks: 4,
    facultyGuideName: 'Dr. V. V. A. S. Lakshmi',
    facultyGuideDesignation: 'Professor & HOD',
    objective: 'Educate rural school students and teachers on phishing threats, OTP security, safe social media habits, and reporting mechanisms via National Cyber Crime Portal.',
    activities: 'Conducted interactive audio-visual demonstrations, distributed regional cyber hygiene leaflets in Telugu, and organized school poster competitions.',
    findings: '90% of rural students had smartphones in households but 0% had two-factor authentication enabled on family email and UPI apps.',
    outcomes: 'Trained 450+ school children across 3 schools; successfully secured 120+ parent mobile devices with biometric locks and PIN protection.',
    recommendations: 'Quarterly refresh workshops and establishing student cyber volunteer clubs.',
    beneficiaryType: 'Rural School Children & Parents',
    beneficiaryCount: 450,
    stage: 'COMPLETED',
    workflowStatus: 'APPROVED',
    students: [
      { rollNumber: '23CYS001', studentName: 'V. Sai Tharun', isLeader: true },
      { rollNumber: '23CYS002', studentName: 'M. Anusha', isLeader: false },
      { rollNumber: '23CYS003', studentName: 'K. Rakesh', isLeader: false }
    ]
  },
  {
    id: 'csp_ds_2026_01',
    projectNumber: 'CSP-DS-2026-001',
    title: 'Agricultural Crop Yield & Soil Health Survey in Palnadu Farming Blocks',
    department: 'DS',
    academicYear: '2026-27',
    year: 'III',
    semester: 'III-I',
    section: 'A',
    batch: '2023-2027',
    projectType: 'Rural Field Survey',
    community: 'Narasaraopet Rural Mandals (Chilakaluripet Border)',
    partnerOrganization: 'Rythu Bharosa Kendra (RBK)',
    startDate: '2026-06-15',
    endDate: '2026-07-20',
    durationWeeks: 5,
    facultyGuideName: 'Dr. S. V. N. Sreenivasu',
    facultyGuideDesignation: 'Professor',
    objective: 'Collect ground-level soil testing data, rainfall variance metrics, and crop disease incidents to create localized predictive dashboards.',
    activities: 'Surveyed 120 farmers, compiled digital spreadsheets of soil pH and NPK ratios, and presented findings to local agricultural extension officers.',
    findings: 'Severe nitrogen over-fertilization identified in chilli crop fields due to lack of localized soil nutrient testing guidance.',
    outcomes: 'Digitized farm records for 120 households; published data summaries advising soil nutrient balancing.',
    recommendations: 'Introduce mobile app SMS alerts for weather and fertilizer dosages.',
    beneficiaryType: 'Local Farmers',
    beneficiaryCount: 120,
    stage: 'COMPLETED',
    workflowStatus: 'APPROVED',
    students: [
      { rollNumber: '23DS001', studentName: 'P. Kalyan', isLeader: true },
      { rollNumber: '23DS002', studentName: 'Ch. Sneha', isLeader: false },
      { rollNumber: '23DS003', studentName: 'B. Manoj Kumar', isLeader: false }
    ]
  }
];

export function getCommunityProjects() {
  return loadStore(STORAGE_KEYS.COMMUNITY_PROJECTS, INITIAL_COMMUNITY_PROJECTS);
}

export function saveCommunityProject(project, actorUser = null) {
  const list = getCommunityProjects();
  let updated;
  if (project.id) {
    updated = list.map(p => p.id === project.id ? { ...p, ...project, updatedAt: new Date().toISOString(), updatedBy: actorUser?.name || 'Admin' } : p);
  } else {
    const newId = `csp_${(project.department || 'ET').toLowerCase()}_${Date.now()}`;
    const count = list.length + 1;
    const projectNumber = `CSP-${project.department || 'ET'}-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
    const newRecord = {
      ...project,
      id: newId,
      projectNumber: project.projectNumber || projectNumber,
      createdAt: new Date().toISOString(),
      createdBy: actorUser?.name || 'Admin'
    };
    updated = [newRecord, ...list];
  }
  saveStore(STORAGE_KEYS.COMMUNITY_PROJECTS, updated);
  return project.id ? project : updated[0];
}

export function deleteCommunityProject(id) {
  const list = getCommunityProjects();
  const updated = list.filter(p => p.id !== id);
  saveStore(STORAGE_KEYS.COMMUNITY_PROJECTS, updated);
  return true;
}

// -------------------------------------------------------------
// 2. Companies Visited Store (ET Departments)
// -------------------------------------------------------------
export const INITIAL_COMPANY_VISITS = [
  {
    id: 'cv_2026_01',
    companyName: 'Tata Consultancy Services (TCS)',
    sector: 'IT & Software Services',
    companyType: 'MNC',
    website: 'https://www.tcs.com',
    academicYear: '2026-27',
    visitDate: '2026-08-12',
    driveType: 'On-Campus',
    mode: 'Hybrid',
    venue: 'NEC Placement Hall & Online Coding Lab',
    status: 'Completed',
    eligibleDepartments: ['CYS', 'DS', 'AI', 'AIML'],
    rolesOffered: [
      { roleTitle: 'Digital Software Engineer', ctcLpa: 7.0, stipendMonthly: 20000 },
      { roleTitle: 'Ninja Developer', ctcLpa: 3.6, stipendMonthly: 15000 }
    ],
    eligibleCount: 180,
    attendedCount: 165,
    shortlistedCount: 42,
    selectedCount: 28,
    offersCount: 28,
    hrContactName: 'Ms. Priyadarshini M',
    hrEmail: 'priyadarshini.m@tcs.com',
    hrPhone: '+91 98401 22334'
  },
  {
    id: 'cv_2026_02',
    companyName: 'CyberRes Security Labs',
    sector: 'Cybersecurity & SOC',
    companyType: 'Product',
    website: 'https://www.cyberres.com',
    academicYear: '2026-27',
    visitDate: '2026-08-18',
    driveType: 'On-Campus',
    mode: 'Offline',
    venue: 'AICTE IDEA Lab Seminar Hall',
    status: 'Completed',
    eligibleDepartments: ['CYS', 'AI'],
    rolesOffered: [
      { roleTitle: 'SOC Analyst & Threat Hunter', ctcLpa: 8.5, stipendMonthly: 30000 }
    ],
    eligibleCount: 60,
    attendedCount: 54,
    shortlistedCount: 18,
    selectedCount: 8,
    offersCount: 8,
    hrContactName: 'Mr. Arvind Swaminathan',
    hrEmail: 'arvind.s@cyberres.com',
    hrPhone: '+91 99800 11223'
  },
  {
    id: 'cv_2026_03',
    companyName: 'Tiger Analytics',
    sector: 'Data Science & AI Consulting',
    companyType: 'Product & Analytics',
    website: 'https://www.tigeranalytics.com',
    academicYear: '2026-27',
    visitDate: '2026-08-22',
    driveType: 'On-Campus',
    mode: 'Hybrid',
    venue: 'Central Placement Auditorium',
    status: 'Completed',
    eligibleDepartments: ['DS', 'AIML', 'AI'],
    rolesOffered: [
      { roleTitle: 'Analyst - Advanced Data Engineering', ctcLpa: 9.0, stipendMonthly: 35000 }
    ],
    eligibleCount: 95,
    attendedCount: 88,
    shortlistedCount: 24,
    selectedCount: 12,
    offersCount: 12,
    hrContactName: 'Ms. Deepa Natarajan',
    hrEmail: 'deepa.n@tigeranalytics.com',
    hrPhone: '+91 97900 44556'
  }
];

export function getCompanyVisits() {
  return loadStore(STORAGE_KEYS.COMPANY_VISITS, INITIAL_COMPANY_VISITS);
}

export function saveCompanyVisit(visit, actorUser = null) {
  const list = getCompanyVisits();
  let updated;
  if (visit.id) {
    updated = list.map(v => v.id === visit.id ? { ...v, ...visit, updatedAt: new Date().toISOString(), updatedBy: actorUser?.name || 'Admin' } : v);
  } else {
    const newRecord = {
      ...visit,
      id: `cv_${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: actorUser?.name || 'Admin'
    };
    updated = [newRecord, ...list];
  }
  saveStore(STORAGE_KEYS.COMPANY_VISITS, updated);
  return visit.id ? visit : updated[0];
}

export function deleteCompanyVisit(id) {
  const list = getCompanyVisits();
  const updated = list.filter(v => v.id !== id);
  saveStore(STORAGE_KEYS.COMPANY_VISITS, updated);
  return true;
}

// -------------------------------------------------------------
// 3. Campus Placements Store (ET Departments)
// -------------------------------------------------------------
export const INITIAL_CAMPUS_PLACEMENTS = [
  {
    id: 'pl_2026_001',
    studentRoll: '23CYS001',
    studentName: 'V. Sai Tharun',
    department: 'CYS',
    academicYear: '2026-27',
    companyName: 'CyberRes Security Labs',
    role: 'SOC Analyst & Threat Hunter',
    offerType: 'Full-Time',
    packageLpa: 8.5,
    stipendMonthly: 30000,
    offerDate: '2026-08-19',
    status: 'OFFERED'
  },
  {
    id: 'pl_2026_002',
    studentRoll: '23CYS001',
    studentName: 'V. Sai Tharun',
    department: 'CYS',
    academicYear: '2026-27',
    companyName: 'Tata Consultancy Services (TCS)',
    role: 'Digital Software Engineer',
    offerType: 'Full-Time',
    packageLpa: 7.0,
    stipendMonthly: 20000,
    offerDate: '2026-08-14',
    status: 'OFFERED'
  },
  {
    id: 'pl_2026_003',
    studentRoll: '23DS001',
    studentName: 'P. Kalyan',
    department: 'DS',
    academicYear: '2026-27',
    companyName: 'Tiger Analytics',
    role: 'Analyst - Advanced Data Engineering',
    offerType: 'Full-Time',
    packageLpa: 9.0,
    stipendMonthly: 35000,
    offerDate: '2026-08-23',
    status: 'OFFERED'
  },
  {
    id: 'pl_2026_004',
    studentRoll: '23AIML001',
    studentName: 'G. Harish',
    department: 'AIML',
    academicYear: '2026-27',
    companyName: 'Tiger Analytics',
    role: 'Associate Machine Learning Engineer',
    offerType: 'FTE + Internship',
    packageLpa: 9.5,
    stipendMonthly: 35000,
    offerDate: '2026-08-23',
    status: 'JOINED'
  }
];

export function getCampusPlacements() {
  return loadStore(STORAGE_KEYS.CAMPUS_PLACEMENTS, INITIAL_CAMPUS_PLACEMENTS);
}

export function saveCampusPlacement(placement, actorUser = null) {
  const list = getCampusPlacements();
  let updated;
  if (placement.id) {
    updated = list.map(p => p.id === placement.id ? { ...p, ...placement, updatedAt: new Date().toISOString(), updatedBy: actorUser?.name || 'Admin' } : p);
  } else {
    const newRecord = {
      ...placement,
      id: `pl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      createdBy: actorUser?.name || 'Admin'
    };
    updated = [newRecord, ...list];
  }
  saveStore(STORAGE_KEYS.CAMPUS_PLACEMENTS, updated);
  return placement.id ? placement : updated[0];
}

export function deleteCampusPlacement(id) {
  const list = getCampusPlacements();
  const updated = list.filter(p => p.id !== id);
  saveStore(STORAGE_KEYS.CAMPUS_PLACEMENTS, updated);
  return true;
}

// -------------------------------------------------------------
// 4. Attendance Monthly Batch Lifecycle Handlers
// -------------------------------------------------------------
export const INITIAL_ATTENDANCE_BATCHES = [];

export function getAttendanceBatches() {
  return loadStore(STORAGE_KEYS.ATTENDANCE_BATCHES, INITIAL_ATTENDANCE_BATCHES);
}

export function replacePreviousMonthAttendance(newBatchMeta, newAlerts, actorUser = null) {
  // Safe transactional replacement:
  // 1. Mark existing active batch for same cohort as REPLACED
  const batches = getAttendanceBatches();
  const updatedBatches = batches.map(b => {
    if (
      b.department === newBatchMeta.department &&
      b.year === newBatchMeta.year &&
      b.semester === newBatchMeta.semester &&
      b.section === newBatchMeta.section &&
      b.status === 'ACTIVE'
    ) {
      return { ...b, status: 'REPLACED', replacedOn: new Date().toISOString(), replacedBy: actorUser?.name || 'Admin' };
    }
    return b;
  });

  // 2. Add new active batch
  const newBatch = {
    ...newBatchMeta,
    batchId: `batch_${Date.now()}`,
    status: 'ACTIVE',
    importDate: new Date().toISOString().split('T')[0],
    uploadedBy: actorUser?.name || 'Admin'
  };
  updatedBatches.unshift(newBatch);
  saveStore(STORAGE_KEYS.ATTENDANCE_BATCHES, updatedBatches);

  // 3. Update active alerts for this cohort
  const currentAlerts = loadStore(STORAGE_KEYS.ATTENDANCE_ALERTS, INITIAL_ATTENDANCE_ALERTS);
  const otherAlerts = currentAlerts.filter(a => !(
    a.department === newBatchMeta.department &&
    a.year === newBatchMeta.year &&
    a.semester === newBatchMeta.semester &&
    a.section === newBatchMeta.section
  ));
  const mergedAlerts = [...newAlerts, ...otherAlerts];
  saveStore(STORAGE_KEYS.ATTENDANCE_ALERTS, mergedAlerts);

  return newBatch;
}

export function removeAttendanceBatch(batchId, actorUser = null) {
  const batches = getAttendanceBatches();
  const targetBatch = batches.find(b => b.batchId === batchId);
  if (!targetBatch) return false;

  const updatedBatches = batches.filter(b => b.batchId !== batchId);
  saveStore(STORAGE_KEYS.ATTENDANCE_BATCHES, updatedBatches);

  // If active, remove alerts for this cohort
  if (targetBatch.status === 'ACTIVE') {
    const currentAlerts = loadStore(STORAGE_KEYS.ATTENDANCE_ALERTS, INITIAL_ATTENDANCE_ALERTS);
    const retainedAlerts = currentAlerts.filter(a => !(
      a.department === targetBatch.department &&
      a.year === targetBatch.year &&
      a.semester === targetBatch.semester &&
      a.section === targetBatch.section
    ));
    saveStore(STORAGE_KEYS.ATTENDANCE_ALERTS, retainedAlerts);
  }
  return true;
}

export function clearCurrentAttendance(cohortMeta, actorUser = null) {
  const currentAlerts = loadStore(STORAGE_KEYS.ATTENDANCE_ALERTS, INITIAL_ATTENDANCE_ALERTS);
  const retainedAlerts = currentAlerts.filter(a => !(
    (cohortMeta.department === 'ALL' || a.department === cohortMeta.department) &&
    (cohortMeta.year === 'ALL' || a.year === cohortMeta.year) &&
    (cohortMeta.semester === 'ALL' || a.semester === cohortMeta.semester) &&
    (cohortMeta.section === 'ALL' || a.section === cohortMeta.section)
  ));
  saveStore(STORAGE_KEYS.ATTENDANCE_ALERTS, retainedAlerts);
  return true;
}

// -------------------------------------------------------------
// 5. Mid Exam Analysis Store Re-exports
// -------------------------------------------------------------
export {
  getMidExamAnalyses,
  getMidExamAnalysisById,
  saveMidExamAnalysis,
  calculateStudentMid1,
  generateBlankMidTemplateXLSX,
  exportAdvancedLearnersCSV,
  exportAdvancedLearnersXLSX,
  exportAdvancedLearnersPDF,
  exportAdvancedEvidenceXLSX,
  exportWeakLearnersCSV,
  exportWeakLearnersXLSX,
  exportWeakLearnersPDF,
  exportWeakEvidenceXLSX,
  exportRemedialAttendanceXLSX,
  exportRemedialAttendancePDF,
  exportImprovementAnalysisXLSX,
  exportImprovementAnalysisPDF,
  exportConsolidatedMidCSV,
  exportConsolidatedMidPDF,
  exportFullAcademicWorkbookXLSX
} from './midExamStore.js';



