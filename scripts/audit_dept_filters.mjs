import fs from 'fs';
import path from 'path';

function searchInDir(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      searchInDir(full);
    } else if (item.name.endsWith('.jsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, idx) => {
        if (l.includes('<option') && (l.includes('Department') || l.includes('Dept') || l.includes('value="ALL"') || l.includes('value="all"'))) {
          console.log(`${item.name}:${idx+1} -> ${l.trim()}`);
        }
      });
    }
  }
}
searchInDir('src/components/portal');
