/**
 * Asset pipeline: resolve the wiki filenames named in the research layer, download the
 * originals, optimise them for web delivery (webp, alpha preserved, transparent margins
 * trimmed, max 1400px) and write assets/asset-manifest.json.
 *
 *   npx tsx scripts/fetch-assets.ts            # all (aliens + ben versions + devices)
 *   npx tsx scripts/fetch-assets.ts --force    # re-download everything
 *   npx tsx scripts/fetch-assets.ts --only alien/four-arms/os
 *
 * Optimisation never redraws or alters the character — it only crops empty margins,
 * scales down oversized originals and re-encodes.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { Asset } from '../src/data/schema';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const R = (...p: string[]) => path.join(ROOT, ...p);
const API = 'https://ben10.fandom.com/api.php';
const UA = 'Mozilla/5.0 (compatible; Ben10VaultAssets/1.0; local research tool)';
const MANIFEST = R('assets', 'asset-manifest.json');
const MAX_DIM = 1400;

interface Job {
  id: string;
  type: Asset['type'];
  outDir: string; // relative to public/
  outName: string;
  file: string; // wiki filename
  sourcePage: string;
  confidence: Asset['confidence'];
  notes: string;
}

interface ImageInfo { url: string; width: number; height: number; mime: string; descriptionurl: string }

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

function readJson<T>(p: string, fallback: T): T {
  return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, 'utf-8')) as T) : fallback;
}

async function apiImageInfo(file: string): Promise<ImageInfo | null> {
  const title = 'File:' + file.replace(/^File:/, '').replace(/ /g, '_');
  const url = `${API}?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|size|mime&format=json&redirects=1`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      const data = (await res.json()) as { query?: { pages?: Record<string, { imageinfo?: ImageInfo[]; missing?: string }> } };
      const pages = data.query?.pages ?? {};
      for (const p of Object.values(pages)) {
        if (p.imageinfo?.[0]) return p.imageinfo[0];
      }
      return null;
    } catch {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return null;
}

async function download(url: string): Promise<Buffer> {
  const withFormat = url.includes('?') ? `${url}&format=original` : `${url}?format=original`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(withFormat, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
    }
  }
  throw new Error('unreachable');
}

async function optimise(buf: Buffer, outPath: string): Promise<{ width: number; height: number }> {
  let img = sharp(buf, { animated: false }).rotate();
  const meta = await img.metadata();
  const hasAlpha = Boolean(meta.hasAlpha);
  if (hasAlpha) {
    // Trim fully transparent margins only (never trims into the character).
    try {
      const trimmed = sharp(buf).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 });
      const t = await trimmed.toBuffer({ resolveWithObject: true });
      if (t.info.width > 40 && t.info.height > 40) img = sharp(t.data);
    } catch {
      /* keep untrimmed */
    }
  }
  const out = await img
    .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out.data);
  return { width: out.info.width, height: out.info.height };
}

function collectJobs(): Job[] {
  const jobs: Job[] = [];
  const dir = R('research', 'aliens');
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
      const a = readJson<any>(path.join(dir, f), null);
      if (!a?.id) continue;
      for (const ap of a.appearances ?? []) {
        if (!ap?.image?.file) continue;
        jobs.push({
          id: `alien/${a.id}/${ap.series}`,
          type: 'alien',
          outDir: `assets/aliens/${ap.series}`,
          outName: `${a.id}.webp`,
          file: ap.image.file,
          sourcePage: a.wikiTitle || a.name,
          confidence: ap.image.confidence ?? 'medium',
          notes: ap.image.notes ?? '',
        });
      }
    }
  }
  const bens = readJson<any[]>(R('research', 'ben-versions.research.json'), []);
  for (const b of Array.isArray(bens) ? bens : []) {
    if (!b?.image?.file) continue;
    jobs.push({ id: `ben/${b.id}`, type: 'ben', outDir: 'assets/ben', outName: `${b.id}.webp`, file: b.image.file, sourcePage: b.sources?.[0] ?? '', confidence: b.image.confidence ?? 'medium', notes: b.image.notes ?? '' });
  }
  const devices = readJson<any>(R('research', 'devices.research.json'), null);
  for (const d of devices?.devices ?? []) {
    if (!d?.image?.file) continue;
    jobs.push({ id: `device/${d.id}`, type: 'device', outDir: 'assets/devices', outName: `${d.id}.webp`, file: d.image.file, sourcePage: 'device page', confidence: d.image.confidence ?? 'medium', notes: d.image.notes ?? '' });
  }
  return jobs;
}

async function main() {
  const jobs = collectJobs().filter((j) => !ONLY || j.id === ONLY);
  const manifest = readJson<{ assets: Asset[] }>(MANIFEST, { assets: [] });
  const existing = new Map(manifest.assets.map((a) => [a.id, a]));
  let ok = 0, skipped = 0, failed = 0;
  const failures: string[] = [];

  for (const [i, job] of jobs.entries()) {
    const outRel = `${job.outDir}/${job.outName}`;
    const outAbs = R('public', outRel);
    const prev = existing.get(job.id);
    if (!FORCE && prev && prev.sourceFile === job.file && fs.existsSync(outAbs)) {
      skipped++;
      // keep manifest fields fresh from research (confidence/notes may have been edited)
      prev.confidence = job.confidence; prev.notes = job.notes || prev.notes;
      continue;
    }
    try {
      const info = await apiImageInfo(job.file);
      if (!info) throw new Error('file not found on wiki');
      const buf = await download(info.url);
      const dims = await optimise(buf, outAbs);
      const asset: Asset = {
        id: job.id,
        path: '/' + outRel,
        width: dims.width,
        height: dims.height,
        format: 'webp',
        type: job.type,
        sourceFile: job.file,
        sourceUrl: info.url.split('/revision/')[0],
        sourcePage: job.sourcePage,
        verification: prev?.verification === 'verified' && prev.sourceFile === job.file ? 'verified' : 'unverified',
        confidence: job.confidence,
        notes: job.notes,
      };
      existing.set(job.id, asset);
      ok++;
      console.log(`[${i + 1}/${jobs.length}] ${job.id} ← ${job.file} (${info.width}×${info.height} → ${dims.width}×${dims.height})`);
      await new Promise((r) => setTimeout(r, 150));
    } catch (e) {
      failed++;
      failures.push(`${job.id} (${job.file}): ${(e as Error).message}`);
      console.log(`[${i + 1}/${jobs.length}] FAILED ${job.id} ← ${job.file}: ${(e as Error).message}`);
    }
    // persist progressively
    fs.mkdirSync(R('assets'), { recursive: true });
    fs.writeFileSync(MANIFEST, JSON.stringify({ generatedAt: new Date().toISOString(), assets: [...existing.values()].sort((a, b) => a.id.localeCompare(b.id)) }, null, 2));
  }
  fs.mkdirSync(R('assets'), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify({ generatedAt: new Date().toISOString(), assets: [...existing.values()].sort((a, b) => a.id.localeCompare(b.id)) }, null, 2));
  console.log(`\ndone: ${ok} downloaded, ${skipped} up-to-date, ${failed} failed`);
  if (failures.length) console.log(failures.map((f) => ' - ' + f).join('\n'));
}

main().catch((e) => { console.error(e); process.exit(1); });
