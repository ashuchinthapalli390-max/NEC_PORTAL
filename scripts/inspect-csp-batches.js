import fs from 'fs';

const CSP_JSON = 'd:/nec portal/NEC_PORTAL/src/data/canonical/cspProjects.json';
const data = JSON.parse(fs.readFileSync(CSP_JSON, 'utf8'));

const batches = {};
for (const item of data) {
  const b = item.batch || item.batchYear || 'Unknown';
  batches[b] = (batches[b] || 0) + 1;
}
console.log('Batches in cspProjects.json:', batches);

const departments = {};
for (const item of data) {
  const d = item.department || 'Unknown';
  departments[d] = (departments[d] || 0) + 1;
}
console.log('Departments in cspProjects.json:', departments);
