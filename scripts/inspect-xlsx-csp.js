import xlsx from 'xlsx';
import path from 'path';

const file = 'd:/nec portal/nec-data/CSP/2022 BATCH CSP DATA.xlsx';
const wb = xlsx.readFile(file);
console.log('Sheets in 2022 BATCH CSP DATA.xlsx:', wb.SheetNames);
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const json = xlsx.utils.sheet_to_json(ws);
  console.log(`Sheet "${name}" has ${json.length} rows. Sample row 0:`, json[0]);
}
