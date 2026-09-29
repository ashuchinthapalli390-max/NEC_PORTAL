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
      lines.forEach((line, idx) => {
        if (line.includes('&') || line.includes('&amp;')) {
          if (line.includes('<th') || line.includes('header:') || line.includes('Header:') || line.includes('title:')) {
            // Filter out allowable categories
            if (!/(Research &|Alerts &|Workshops &|Patents &|Governance &|Seminars &|&copy;|&nbsp;|&bull;|&times;|&rarr;|&darr;|&uarr;|&larr;|&gt;|&lt;)/i.test(line)) {
              console.log(`${item.name}:${idx+1} -> ${line.trim()}`);
            }
          }
        }
      });
    }
  }
}

searchInDir('src');
