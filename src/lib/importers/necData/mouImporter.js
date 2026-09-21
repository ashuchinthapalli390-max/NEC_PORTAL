/**
 * mouImporter.js
 * Ingests institutional Memoranda of Understanding (MoUs) and industry tie-ups.
 */

import { readWorkbook } from './workbookReader.js';
import { normalizeDepartment } from './departmentNormalizer.js';
import { normalizeDate } from './dateNormalizer.js';

export function importMous(mouFile, auditLog) {
  const mous = [];
  const wbRes = readWorkbook(mouFile.filePath);
  if (!wbRes.success) return { mous: [], count: 0 };

  const sheet = wbRes.sheets['Sheet1'] || Object.values(wbRes.sheets)[0] || [];

  for (const row of sheet) {
    const rawOrg = row['Mou Signed with (Name & address of the organization)'] ||
                   row['Mou Signed with (Name & address of the organization) '] ||
                   row['Organization'] || row['Name of the Organization'];
    if (!rawOrg || typeof rawOrg !== 'string' || rawOrg.trim().length < 3) continue;

    const orgName = String(rawOrg).replace(/[\r\n]+/g, ' ').trim();
    const rawDept = row['Dept. Name'] || row['Dept. Name '] || row['Department'] || '';
    const deptNorm = rawDept && typeof rawDept === 'string' && rawDept.trim().length > 0
      ? normalizeDepartment(rawDept).canonicalCode
      : 'Institution Level';

    const dateMeta = normalizeDate(row['Date of MoU'] || row['MoU Date'] || row['Date']);
    const rawValidity = row['Period of validity'] ? String(row['Period of validity']).trim() : null;
    const validity = rawValidity || 'Validity Not Recorded';
    const nature = row['Nature of MoU /Activity'] || row['Nature of MoU /Activity '] || 'Academic & Industry Collaboration';

    // Calculate authentic expiry and status
    let expiryDate = null;
    let status = 'Validity Not Recorded';

    if (dateMeta.isoDate && rawValidity) {
      const yearMatch = rawValidity.match(/(\d+)\s*(?:year|yr)/i);
      const monthMatch = rawValidity.match(/(\d+)\s*(?:month|mo)/i);
      const signD = new Date(dateMeta.isoDate);

      if (yearMatch) {
        const yrs = parseInt(yearMatch[1], 10);
        signD.setFullYear(signD.getFullYear() + yrs);
        expiryDate = signD.toISOString().split('T')[0];
      } else if (monthMatch) {
        const mos = parseInt(monthMatch[1], 10);
        signD.setMonth(signD.getMonth() + mos);
        expiryDate = signD.toISOString().split('T')[0];
      }

      if (expiryDate) {
        const now = new Date().toISOString().split('T')[0];
        const daysRemaining = (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
        if (expiryDate < now) {
          status = 'Expired';
        } else if (daysRemaining <= 60) {
          status = 'Expiring Soon';
        } else {
          status = 'Active';
        }
      }
    }

    mous.push({
      id: `MOU_${mous.length + 1}`,
      mouCode: `MOU-NEC-${String(mous.length + 1).padStart(3, '0')}`,
      organization: orgName,
      partnerOrganization: orgName,
      companyName: orgName,
      partnerType: 'Corporate / Industry Partner',
      department: deptNorm,
      departmentName: deptNorm === 'Institution Level' ? 'Institution Level' : normalizeDepartment(deptNorm).name,
      signedDate: dateMeta.isoDate || null,
      mouDate: dateMeta.isoDate || null,
      validity,
      expiryDate,
      agreementTitle: nature,
      purpose: nature,
      natureOfMoU: nature,
      status,
      workflowStatus: 'Approved',
      isDeleted: false,
      documents: [],
      provenance: {
        sourceFile: mouFile.relPath,
        sheetName: 'Sheet1',
        rowNum: row.__rowNum
      }
    });
  }

  return {
    mous,
    count: mous.length
  };
}
