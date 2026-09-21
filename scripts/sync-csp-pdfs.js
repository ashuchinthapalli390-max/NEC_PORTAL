import fs from 'fs';
import path from 'path';

const TARGET_DIR = 'd:/nec portal/NEC_PORTAL/public/documents/csp/2022-batch';
const CSP_JSON = 'd:/nec portal/NEC_PORTAL/src/data/canonical/cspProjects.json';

const files = fs.readdirSync(TARGET_DIR);
const copiedMap = new Map();

for (const f of files) {
  const match = f.match(/([0-9]{2}[0-9A-Z]{3}[0-9A-Z]{5})/i);
  if (match) {
    const roll = match[1].toUpperCase();
    copiedMap.set(roll, `/documents/csp/2022-batch/${f}`);
  }
}

console.log(`CopiedMap has ${copiedMap.size} files.`);
console.log('Sample copied keys:', Array.from(copiedMap.keys()).slice(0, 10));

const data = JSON.parse(fs.readFileSync(CSP_JSON, 'utf8'));
let matchedCount = 0;

for (const item of data) {
  let matchedPdf = null;
  let matchedRoll = null;

  if (item.students && Array.isArray(item.students)) {
    for (const st of item.students) {
      const roll = (st.rollNumber || '').trim().toUpperCase();
      if (copiedMap.has(roll)) {
        matchedPdf = copiedMap.get(roll);
        matchedRoll = roll;
        st.hasPdfBook = true;
        st.pdfEvidence = matchedPdf;
      } else {
        st.hasPdfBook = false;
        st.pdfEvidence = null;
      }
    }
  }

  // Also check if item.id or item.projectNumber contains roll
  if (!matchedPdf) {
    for (const [roll, pdfPath] of copiedMap.entries()) {
      if ((item.id && item.id.toUpperCase().includes(roll)) || (item.projectNumber && item.projectNumber.toUpperCase().includes(roll))) {
        matchedPdf = pdfPath;
        matchedRoll = roll;
        break;
      }
    }
  }

  if (matchedPdf) {
    matchedCount++;
    item.hasPdfBook = true;
    item.pdfEvidence = matchedPdf;
    item.documents = [
      {
        id: `DOC-${item.id || matchedCount}`,
        name: `CSP Project Report (${path.basename(matchedPdf)})`,
        type: 'Community Service Project Report PDF',
        size: 'Official PDF Submission',
        downloadUrl: matchedPdf,
        url: matchedPdf
      }
    ];
  } else {
    item.hasPdfBook = false;
    item.pdfEvidence = null;
    item.documents = [];
  }
}

fs.writeFileSync(CSP_JSON, JSON.stringify(data, null, 2), 'utf8');
console.log(`Updated ${CSP_JSON}: matched ${matchedCount} / ${data.length} projects.`);
