/**
 * eventImporter.js
 * Ingests and normalizes workshops, seminars, hackathons, and institutional events.
 */

import { readWorkbook } from './workbookReader.js';
import { normalizeDepartment } from './departmentNormalizer.js';
import { normalizeDate } from './dateNormalizer.js';

export function normalizeEventType(raw) {
  if (!raw) return 'Workshop';
  const s = String(raw).trim().toLowerCase();
  if (s.includes('hack') || s.includes('hackathon')) return 'Hackathon';
  if (s.includes('code-a-thon') || s.includes('codeathon')) return 'Code-a-thon';
  if (s.includes('seminar') || s.includes('webinar')) return 'Seminar';
  if (s.includes('guest') || s.includes('lecture')) return 'Guest Lecture';
  if (s.includes('fdp') || s.includes('faculty development')) return 'Faculty Development Program';
  if (s.includes('workshop')) return 'Workshop';
  return 'Technical Event';
}

export function importEvents(eventFiles, crcDocEvents = [], auditLog) {
  const events = [];
  const dedupMap = new Map(); // dept + cleanTitle + date -> record
  let duplicateCount = 0;

  for (const item of eventFiles) {
    const { filePath, relPath, defaultDept } = item;
    const wbRes = readWorkbook(filePath);
    if (!wbRes.success) continue;

    for (const [sheetName, rows] of Object.entries(wbRes.sheets)) {
      for (const row of rows) {
        const rawTitle = row['NAME OF THE PROGRAM'] || row['Title of the Event'] || row['Title'] || row['Event Name'];
        if (!rawTitle || typeof rawTitle !== 'string' || rawTitle.trim().length < 3) continue;

        const title = rawTitle.trim();
        const rawType = row['TYPE (WORKSHOP/SEMINAR/GUEST LECTURE/ HACK-A-THON)'] || row['Event Type'] || row['Type'];
        const eventType = normalizeEventType(rawType);

        const rawDept = row['Dept'] || row['Department'] || defaultDept || 'Common';
        const deptMeta = normalizeDepartment(rawDept);

        const startDateMeta = normalizeDate(row['START DATE'] || row['Start Date'] || row['Date']);
        const endDateMeta = normalizeDate(row['END DATE'] || row['End Date']);

        const participants = parseInt(row['NUMBER OF PARTICIPANTS'] || row['Participants'] || 60, 10) || 60;
        const venue = row['VENUE'] || row['Venue'] || 'Seminar Hall / Computer Lab';
        const coordinator = row['RESOURCE PERSON DETAILS  / FACULTY COORDINATOR'] || row['RESOURCE PERSON DETAILS / FACULTY COORDINATOR'] || row['Faculty Coordinator'] || 'Department Coordinator';
        const organizedBy = row['Organized by'] || row['Organized By'] || 'TechnoElite, ISTE Student Chapter';

        const cleanTitleKey = title.toLowerCase().replace(/[^a-z0-9]+/g, '');
        const dateKey = startDateMeta.isoDate || startDateMeta.displayDate || 'any';
        const dedupKey = `${deptMeta.canonicalCode}::${cleanTitleKey}::${dateKey}`;

        if (dedupMap.has(dedupKey)) {
          duplicateCount++;
          continue;
        }

        const academicYear = row['Acd Year'] || (startDateMeta.isoDate ? `${startDateMeta.isoDate.slice(0, 4)}-${String(parseInt(startDateMeta.isoDate.slice(0, 4), 10) + 1).slice(2)}` : '2025-26');

        const record = {
          id: `EVT_${deptMeta.canonicalCode.toLowerCase()}_${events.length + 1}`,
          eventNumber: `EVT-${deptMeta.canonicalCode}-${academicYear}-${String(events.length + 1).padStart(4, '0')}`,
          title,
          eventType,
          department: deptMeta.canonicalCode,
          departmentName: deptMeta.name,
          participantsTotal: participants,
          venue: String(venue).trim(),
          startDate: startDateMeta.isoDate || startDateMeta.displayDate || '2025-07-01',
          endDate: endDateMeta.isoDate || endDateMeta.displayDate || null,
          coordinatorName: String(coordinator).trim(),
          organizedBy: String(organizedBy).trim(),
          academicYear,
          status: 'Completed',
          eventStatus: 'COMPLETED',
          workflowStatus: 'APPROVED',
          isDeleted: false,
          provenance: {
            sourceFile: relPath,
            sheetName,
            rowNum: row.__rowNum
          }
        };

        dedupMap.set(dedupKey, record);
        events.push(record);
      }
    }
  }

  // Attach CRC meeting events from DOCX evidence if any
  for (const crc of crcDocEvents) {
    events.push({
      id: `EVT_CRC_${events.length + 1}`,
      eventNumber: `EVT-CRC-2025-26-${String(events.length + 1).padStart(4, '0')}`,
      title: crc.title,
      eventType: 'Class Review Committee (CRC)',
      department: crc.department || 'Common',
      departmentName: normalizeDepartment(crc.department).name,
      participantsTotal: 45,
      venue: 'Department Conference Hall',
      startDate: crc.date || '2026-01-05',
      endDate: null,
      coordinatorName: 'Head of the Department',
      organizedBy: 'Academic Monitoring Committee',
      academicYear: '2025-26',
      status: 'Completed',
      eventStatus: 'COMPLETED',
      workflowStatus: 'APPROVED',
      isDeleted: false,
      provenance: {
        sourceFile: 'Formats/LIST OF EVENTS from 25 Dec.docx',
        meetingType: crc.title
      }
    });
  }

  auditLog.duplicatesMerged += duplicateCount;
  return {
    events,
    count: events.length
  };
}
