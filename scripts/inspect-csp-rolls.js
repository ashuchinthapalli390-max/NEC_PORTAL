import fs from 'fs';

const CSP_JSON = 'd:/nec portal/NEC_PORTAL/src/data/canonical/cspProjects.json';
const data = JSON.parse(fs.readFileSync(CSP_JSON, 'utf8'));

console.log('Total records:', data.length);
const sampleRolls = [];
for (let i = 0; i < data.length; i++) {
  const item = data[i];
  if (item.students && item.students.length > 0) {
    sampleRolls.push(item.students[0].rollNumber);
  }
}
console.log('Sample rolls:', sampleRolls.slice(0, 15));
console.log('Rolls starting with 22:', sampleRolls.filter(r => String(r).startsWith('22')).length);
console.log('Rolls starting with 21:', sampleRolls.filter(r => String(r).startsWith('21')).length);
console.log('Rolls starting with 20:', sampleRolls.filter(r => String(r).startsWith('20')).length);
console.log('Rolls starting with 23:', sampleRolls.filter(r => String(r).startsWith('23')).length);
