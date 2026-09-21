import fs from 'fs';

const CSP_JSON = 'd:/nec portal/NEC_PORTAL/src/data/canonical/cspProjects.json';
const data = JSON.parse(fs.readFileSync(CSP_JSON, 'utf8'));

const items22 = data.filter(d => {
  if (d.students && d.students.length > 0 && String(d.students[0].rollNumber).startsWith('22')) return true;
  return false;
});

console.log('Found 22 items count:', items22.length);
console.log('Sample 22 items:', JSON.stringify(items22.slice(0, 5), null, 2));
