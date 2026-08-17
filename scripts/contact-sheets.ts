/**
 * Render labelled contact sheets of every asset in the manifest for visual verification.
 *   npx tsx scripts/contact-sheets.ts [outDir] [filterPrefix]
 * Default outDir: research/qa/contact-sheets. Each sheet is a 4×3 grid of 300×380 cells.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = process.argv[2] ?? path.join(ROOT, 'research', 'qa', 'contact-sheets');
const prefix = process.argv[3] ?? '';
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'asset-manifest.json'), 'utf-8')) as { assets: { id: string; path: string; sourceFile: string }[] };

const COLS = 4, ROWS = 3, CW = 300, CH = 380, IMG_H = 300;

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const assets = manifest.assets.filter((a) => a.id.startsWith(prefix)).sort((a, b) => a.id.localeCompare(b.id));
  const perSheet = COLS * ROWS;
  for (let s = 0; s * perSheet < assets.length; s++) {
    const batch = assets.slice(s * perSheet, (s + 1) * perSheet);
    const composites: sharp.OverlayOptions[] = [];
    for (const [i, a] of batch.entries()) {
      const x = (i % COLS) * CW, y = Math.floor(i / COLS) * CH;
      const file = path.join(ROOT, 'public', a.path);
      try {
        const img = await sharp(file).resize({ width: CW - 20, height: IMG_H - 10, fit: 'inside' }).png().toBuffer({ resolveWithObject: true });
        composites.push({ input: img.data, left: x + Math.round((CW - img.info.width) / 2), top: y + Math.round((IMG_H - img.info.height) / 2) });
      } catch {
        /* leave cell empty */
      }
      const label = `<svg width="${CW}" height="${CH - IMG_H}"><rect width="100%" height="100%" fill="#101418"/><text x="10" y="26" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="bold" fill="#8dff4d">${esc(a.id)}</text><text x="10" y="50" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#c8d0c8">${esc(a.sourceFile.slice(0, 40))}</text></svg>`;
      composites.push({ input: Buffer.from(label), left: x, top: y + IMG_H });
    }
    const out = path.join(outDir, `${prefix.replace(/\//g, '-') || 'all'}-${String(s + 1).padStart(2, '0')}.png`);
    await sharp({ create: { width: COLS * CW, height: ROWS * CH, channels: 4, background: '#2a2f35' } })
      .composite(composites)
      .png()
      .toFile(out);
    console.log('wrote', out, batch.map((b) => b.id).join(', '));
  }
}
main();
