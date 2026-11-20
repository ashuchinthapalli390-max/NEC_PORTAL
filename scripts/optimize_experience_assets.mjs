/**
 * Generates web-optimised WebP copies of the heavy campus / branding images
 * used by the 3D public experience. Originals are left untouched.
 *
 *   node scripts/optimize_experience_assets.mjs
 *
 * Output: public/assets/optimized/<slug>.webp
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'public');
const outDir = path.join(root, 'assets', 'optimized');
fs.mkdirSync(outDir, { recursive: true });

const jobs = [
  ['assets/NEC Buildings/College main building.jpg', 'main-building', 2000],
  ['assets/NEC Buildings/College Admin Block.jpg', 'admin-block', 2000],
  ['assets/NEC Buildings/College Entrance.jpg', 'entrance', 2000],
  ['assets/NEC Buildings/Main buliding inside.jpg', 'atrium', 2000],
  ['assets/NEC Buildings/College Walkway.jpg', 'walkway', 2000],
  ['assets/NEC Buildings/College Area View.jpg', 'area-view', 2000],
  ['assets/NEC Logos/College Night view.png', 'night-view', 2000],
  ['assets/NEC Logos/College Walkway Night View.png', 'walkway-night', 2000],
  ['assets/NEC Logos/College Full name.png', 'college-full-name', 1400],
  ['assets/NEC Logos/R&D Logo Without BG.png', 'rd-logo', 600],
  ['assets/NEC Logos/IIC Logo BG.png', 'iic-logo', 600],
  ['assets/NEC Faculty/Director.jpg', 'director-portrait', 900],
  ['assets/NEC Faculty/Vice Chairman.jpg', 'vice-chairman-portrait', 900],
  ['assets/nrtec/people/vice-chairman-chakravarthi-portrait.webp', 'vice-chairman-hd', 900],
  ['assets/nrtec/placements/ls-automotive-35-students-group.webp', 'ls-automotive-group', 1600]
];

for (const [src, slug, width] of jobs) {
  const input = path.join(root, src);
  if (!fs.existsSync(input)) {
    console.warn('skip (missing):', src);
    continue;
  }
  const output = path.join(outDir, `${slug}.webp`);
  const info = await sharp(input)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 78, effort: 5 })
    .toFile(output);
  const before = fs.statSync(input).size;
  console.log(`${slug}.webp  ${(before / 1024).toFixed(0)}KB -> ${(info.size / 1024).toFixed(0)}KB  (${info.width}x${info.height})`);
}
