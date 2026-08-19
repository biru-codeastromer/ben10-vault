/**
 * Transformation-sequence pipeline.
 *
 * Source: the Ben 10 wiki's per-series "Transformation Sequences" libraries — frame-by-frame
 * episode stills of each alien's on-screen transformation sequence (parsed into
 * research/transformation-sequences.raw.json by the inline parser below from the cached wikitext).
 *
 * For every (alien, series, variant) this script:
 *   1. resolves the frame files via the wiki API and downloads server-side-scaled copies (≤720px),
 *   2. renders a short MP4 clip with ffmpeg (frames blended up to 24 fps, ~3 s) + a poster image,
 *   3. writes public/assets/sequences/<series>/<alienId>-<n>.mp4|.webp and
 *      assets/sequence-manifest.json with provenance (episode, source frame files).
 *
 *   npx tsx scripts/fetch-sequences.ts            # everything missing
 *   npx tsx scripts/fetch-sequences.ts --force    # re-render all
 *   npx tsx scripts/fetch-sequences.ts --only four-arms
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const R = (...p: string[]) => path.join(ROOT, ...p);
const API = 'https://ben10.fandom.com/api.php';
const UA = 'Mozilla/5.0 (compatible; Ben10VaultSequences/1.0; local research tool)';
const RAW = R('research', 'transformation-sequences.raw.json');
const MANIFEST = R('assets', 'sequence-manifest.json');
const CACHE = path.join(os.tmpdir(), 'ben10vault-seq-cache');
const FRAME_WIDTH = 720;
const MAX_VARIANTS = 2;
const MAX_FRAMES = 40;
const MIN_FRAMES = 3; // 2 stills is not a sequence; 3 = a flash-style evolution/transformation

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

type SeriesId = 'os' | 'af' | 'ua' | 'ov';
interface RawEntry { series: SeriesId; group: string; wikiTitle: string; name: string; variants: { description: string; frames: string[] }[] }
export interface SequenceClip {
  id: string; // seq/<alienId>/<series>/<n>
  alienId: string;
  seriesId: SeriesId;
  variant: number;
  path: string; // mp4
  poster: string; // webp
  width: number;
  height: number;
  frames: number;
  durationSec: number;
  description: string; // e.g. "This transformation sequence was featured in Fame."
  episode: string;
  usedBy: string; // group label from the library (Omnitrix / Ultimatrix / Biomnitrix …)
  sourceFrames: string[];
  sourcePage: string;
}

// Groups in the libraries that are NOT a Ben transformation.
const SKIP_GROUPS = [/Alpha's/i, /Alternate Omnitrix/i, /Recreated Ultimatrix/i, /Skurd/i, /Other Sequences/i];
const SKIP_TITLES = [/Gwen 10/i, /Mad Ben/i, /Kevin 11/i, /Dr\. Viktor/i, /Eon/i, /Vine Whips/i, /Drill Arm/i];

function readJson<T>(p: string, fallback: T): T { return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, 'utf-8')) as T) : fallback; }

/** wikiTitle → vault alien id, from the research files. */
function alienIdIndex(): Map<string, string> {
  const m = new Map<string, string>();
  const dir = R('research', 'aliens');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const a = readJson<any>(path.join(dir, f), null);
    if (!a?.id) continue;
    if (a.wikiTitle) m.set(a.wikiTitle.toLowerCase(), a.id);
    m.set(a.name.toLowerCase(), a.id);
    m.set(`${a.name.toLowerCase()} (classic)`, a.id);
  }
  // library spellings
  m.set('waterhazard', 'water-hazard'); m.set('ampfibian (classic)', 'ampfibian'); m.set('juryrigg', 'jury-rigg');
  m.set('ultimate ben', 'ultimate-ben');
  return m;
}

async function imageInfo(files: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (let i = 0; i < files.length; i += 50) {
    const batch = files.slice(i, i + 50);
    const titles = batch.map((f) => 'File:' + f.replace(/ /g, '_')).join('|');
    const url = `${API}?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&format=json&redirects=1`;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': UA } });
        const data = (await res.json()) as any;
        const norm = new Map<string, string>();
        for (const n of data.query?.normalized ?? []) norm.set(n.to, n.from);
        for (const r of data.query?.redirects ?? []) norm.set(r.to, norm.get(r.from) ?? r.from);
        for (const p of Object.values<any>(data.query?.pages ?? {})) {
          const u = p.imageinfo?.[0]?.url;
          if (!u) continue;
          const title: string = p.title;
          const original = norm.get(title) ?? title;
          out.set(original.replace(/^File:/, '').replace(/_/g, ' '), u);
          out.set(title.replace(/^File:/, '').replace(/_/g, ' '), u);
        }
        break;
      } catch (e) { if (attempt === 3) throw e; await new Promise((r) => setTimeout(r, 1000 * (attempt + 1))); }
    }
  }
  return out;
}

async function downloadFrame(url: string, dest: string): Promise<boolean> {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return true;
  const base = url.split('/revision/')[0];
  const scaled = `${base}/revision/latest/scale-to-width-down/${FRAME_WIDTH}?format=png`;
  for (const u of [scaled, `${base}/revision/latest?format=png`]) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(u, { headers: { 'User-Agent': UA } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 200) throw new Error('empty');
        fs.writeFileSync(dest, buf);
        return true;
      } catch { await new Promise((r) => setTimeout(r, 600 * (attempt + 1))); }
    }
  }
  return false;
}

const EPISODE_TITLES: string[] = (() => {
  const order = readJson<Record<string, number>>(R('data', 'episode-order.json'), {});
  return Object.keys(order).filter((k) => k.length > 3).sort((a, b) => b.length - a.length);
})();
const TITLE_CASE = new Map<string, string>();
for (const e of readJson<{ title: string }[]>(R('research', 'episodes.json'), [])) TITLE_CASE.set(e.title.toLowerCase(), e.title.replace(/\s*\(Episode\)$/i, ''));
const MOVIE_CASE: Record<string, string> = {
  'ben 10: secret of the omnitrix': 'Ben 10: Secret of the Omnitrix', 'ben 10: race against time': 'Ben 10: Race Against Time',
  'ben 10: destroy all aliens': 'Ben 10: Destroy All Aliens', 'ben 10: alien swarm': 'Ben 10: Alien Swarm',
  'ben 10-generator rex: heroes united': 'Ben 10/Generator Rex: Heroes United',
};

/** Episode the sequence was featured in: the earliest-mentioned known episode title in the description. */
function episodeFrom(desc: string): string {
  const d = desc.replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').toLowerCase();
  if (!d) return '';
  let best: { i: number; t: string } | null = null;
  for (const t of EPISODE_TITLES) {
    const i = d.indexOf(t);
    if (i === -1) continue;
    const before = d[i - 1] ?? ' ', after = d[i + t.length] ?? ' ';
    if (/[a-z0-9]/.test(before) || /[a-z0-9]/.test(after)) continue; // word boundary
    if (!best || i < best.i) best = { i, t }; // titles are longest-first, so ties keep the longer match
  }
  if (!best) return '';
  return TITLE_CASE.get(best.t) ?? MOVIE_CASE[best.t] ?? best.t.replace(/\b\w/g, (c) => c.toUpperCase());
}

async function render(frames: string[], outMp4: string, outPoster: string): Promise<{ width: number; height: number; duration: number }> {
  // normalise frames to a common even size (first frame's aspect), pad to be safe
  const first = await sharp(frames[0]).metadata();
  const w = Math.min(FRAME_WIDTH, first.width ?? FRAME_WIDTH);
  const h = Math.round((w * (first.height ?? 405)) / (first.width ?? 720));
  const W = w - (w % 2), H = h - (h % 2);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'seq-'));
  for (const [i, f] of frames.entries()) {
    await sharp(f).resize(W, H, { fit: 'cover' }).png().toFile(path.join(tmp, `f${String(i + 1).padStart(3, '0')}.png`));
  }
  const srcFps = Math.max(1.5, Math.min(12, frames.length / 3.2));
  const duration = frames.length / srcFps;
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-framerate', String(srcFps), '-i', path.join(tmp, 'f%03d.png'),
    '-vf', 'framerate=fps=24:interp_start=0:interp_end=255:scene=100', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '25', '-preset', 'medium',
    '-movflags', '+faststart', '-an', outMp4,
  ]);
  // poster = a frame ~1/3 in (the "mid-transformation" look), webp
  const posterIdx = Math.min(frames.length - 1, Math.max(0, Math.floor(frames.length * 0.35)));
  await sharp(path.join(tmp, `f${String(posterIdx + 1).padStart(3, '0')}.png`)).webp({ quality: 80 }).toFile(outPoster);
  fs.rmSync(tmp, { recursive: true, force: true });
  return { width: W, height: H, duration: Math.round(duration * 10) / 10 };
}

async function main() {
  const raw = readJson<RawEntry[]>(RAW, []);
  const idx = alienIdIndex();
  const manifest = readJson<{ clips: SequenceClip[] }>(MANIFEST, { clips: [] });
  const byId = new Map(manifest.clips.map((c) => [c.id, c]));
  fs.mkdirSync(CACHE, { recursive: true });

  type Job = { alienId: string; series: SeriesId; n: number; variant: RawEntry['variants'][number]; entry: RawEntry };
  const jobs: Job[] = [];
  const counters = new Map<string, number>();
  const skipped: string[] = [];
  for (const e of raw) {
    if (SKIP_GROUPS.some((r) => r.test(e.group ?? '')) || SKIP_TITLES.some((r) => r.test(e.wikiTitle) || r.test(e.name))) { skipped.push(`${e.series}:${e.name} [${e.group}]`); continue; }
    const alienId = idx.get(e.wikiTitle.toLowerCase()) ?? idx.get(e.name.toLowerCase());
    if (!alienId) { skipped.push(`${e.series}:${e.name} (no vault alien)`); continue; }
    if (ONLY && alienId !== ONLY) continue;
    for (const v of e.variants) {
      if (v.frames.length < MIN_FRAMES) continue;
      const key = `${alienId}/${e.series}`;
      const n = (counters.get(key) ?? 0) + 1;
      if (n > MAX_VARIANTS) continue;
      counters.set(key, n);
      jobs.push({ alienId, series: e.series, n, variant: { ...v, frames: v.frames.slice(0, MAX_FRAMES) }, entry: e });
    }
  }
  console.log(`${jobs.length} clips to consider; skipped ${skipped.length} non-vault entries`);

  // resolve all frame URLs in one go
  const allFrames = Array.from(new Set(jobs.flatMap((j) => j.variant.frames)));
  console.log(`resolving ${allFrames.length} frame URLs…`);
  const urls = await imageInfo(allFrames);

  let ok = 0, fail = 0, skip = 0;
  for (const [i, job] of jobs.entries()) {
    const id = `seq/${job.alienId}/${job.series}/${job.n}`;
    const relMp4 = `assets/sequences/${job.series}/${job.alienId}-${job.n}.mp4`;
    const relPoster = `assets/sequences/${job.series}/${job.alienId}-${job.n}.webp`;
    const absMp4 = R('public', relMp4), absPoster = R('public', relPoster);
    const prev = byId.get(id);
    const sameSource = prev && JSON.stringify(prev.sourceFrames) === JSON.stringify(job.variant.frames);
    if (!FORCE && prev && sameSource && fs.existsSync(absMp4) && fs.existsSync(absPoster)) {
      prev.description = job.variant.description; prev.episode = episodeFrom(job.variant.description); prev.usedBy = job.entry.group;
      skip++; continue;
    }
    try {
      const local: string[] = [];
      const wanted = job.variant.frames.map((f) => ({ f, u: urls.get(f), dest: path.join(CACHE, f.replace(/[^\w.\-()' ,]/g, '_')) })).filter((x) => x.u);
      for (let c = 0; c < wanted.length; c += 8) {
        const chunk = wanted.slice(c, c + 8);
        const got = await Promise.all(chunk.map((x) => downloadFrame(x.u!, x.dest)));
        chunk.forEach((x, k) => { if (got[k]) local.push(x.dest); });
      }
      if (local.length < 2) throw new Error(`only ${local.length} frames downloadable`);
      fs.mkdirSync(path.dirname(absMp4), { recursive: true });
      const meta = await render(local, absMp4, absPoster);
      const clip: SequenceClip = {
        id, alienId: job.alienId, seriesId: job.series, variant: job.n,
        path: '/' + relMp4, poster: '/' + relPoster, width: meta.width, height: meta.height,
        frames: local.length, durationSec: meta.duration,
        description: job.variant.description, episode: episodeFrom(job.variant.description),
        usedBy: job.entry.group, sourceFrames: job.variant.frames,
        sourcePage: `https://ben10.fandom.com/wiki/Transformation_Sequences/${encodeURIComponent({ os: 'Ben 10 (2005 TV Series)', af: 'Alien Force', ua: 'Ultimate Alien', ov: 'Omniverse' }[job.series])}`,
      };
      byId.set(id, clip);
      ok++;
      console.log(`[${i + 1}/${jobs.length}] ${id} ← ${local.length} frames (${meta.width}×${meta.height}, ${meta.duration}s) "${clip.episode}"`);
    } catch (e) {
      fail++;
      console.log(`[${i + 1}/${jobs.length}] FAILED ${id}: ${(e as Error).message}`);
    }
    fs.mkdirSync(R('assets'), { recursive: true });
    fs.writeFileSync(MANIFEST, JSON.stringify({ generatedAt: new Date().toISOString(), clips: [...byId.values()].sort((a, b) => a.id.localeCompare(b.id)) }, null, 2));
  }
  // prune: too-short sequences, entries whose files vanished, and ids no longer produced by the library
  const produced = new Set(jobs.map((j) => `seq/${j.alienId}/${j.series}/${j.n}`));
  for (const [id, c] of [...byId]) {
    const mp4 = R('public', c.path.replace(/^\//, '')), poster = R('public', c.poster.replace(/^\//, ''));
    if (c.frames < MIN_FRAMES || !fs.existsSync(mp4) || !fs.existsSync(poster) || (!ONLY && !produced.has(id))) {
      byId.delete(id);
      for (const f of [mp4, poster]) if (fs.existsSync(f)) fs.unlinkSync(f);
      console.log(`pruned ${id}`);
    }
  }
  fs.writeFileSync(MANIFEST, JSON.stringify({ generatedAt: new Date().toISOString(), clips: [...byId.values()].sort((a, b) => a.id.localeCompare(b.id)) }, null, 2));
  console.log(`\ndone: ${ok} rendered, ${skip} up-to-date, ${fail} failed`);
  if (skipped.length) console.log('skipped entries:\n  ' + skipped.join('\n  '));
}

main().catch((e) => { console.error(e); process.exit(1); });
