/**
 * Compile the research layer (research/aliens/*.json, research/ben-versions.research.json,
 * research/devices.research.json) + the asset manifest into the presentation dataset in /data.
 *
 *   npx tsx scripts/build-data.ts
 *
 * Nothing in the UI is hard-coded from research; this is the single seam between the two.
 */
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { computeScore, POWER_CLASSES } from '../src/data/scoring';
import { SCORE_DIMENSIONS } from '../src/data/schema';
import type {
  Alien,
  AlienAppearance,
  Asset,
  BenVersion,
  Omnitrix,
  OmnitrixId,
  Series,
  SeriesId,
} from '../src/data/schema';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const R = (...p: string[]) => path.join(ROOT, ...p);

// ---------- research-layer schemas ----------
const seriesIdSchema = z.enum(['os', 'af', 'ua', 'ov']);
const imageSchema = z.object({
  file: z.string(),
  label: z.string().optional().default(''),
  confidence: z.enum(['high', 'medium', 'low']).optional().default('medium'),
  notes: z.string().optional().default(''),
});
const appearanceSchema = z.object({
  series: seriesIdSchema,
  usedBy: z.array(z.string()).default([]),
  firstEpisode: z.string().default(''),
  notableEpisodes: z.array(z.string()).default([]),
  designNotes: z.string().default(''),
  image: imageSchema.nullable().optional(),
});
const scoringSchema = z.object({
  strength: z.number(), durability: z.number(), speed: z.number(), mobility: z.number(),
  offense: z.number(), defense: z.number(), special: z.number(), versatility: z.number(),
  intellect: z.number(), energy: z.number(), regeneration: z.number(), survivability: z.number(),
  range: z.number(), cosmic: z.number(),
  weaknessPenalty: z.number().default(0),
  controlPenalty: z.number().default(0),
  rationale: z.string().default(''),
});
const alienResearchSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  wikiTitle: z.string().default(''),
  kind: z.enum(['standard', 'ultimate', 'fusion']).default('standard'),
  species: z.string().default('Unknown'),
  homeworld: z.string().default(''),
  bodyType: z.string().default(''),
  debut: z.object({ episode: z.string().default(''), series: seriesIdSchema, usedBy: z.string().default('') }),
  baseFormId: z.string().nullable().default(null),
  ultimateFormId: z.string().nullable().default(null),
  componentIds: z.array(z.string()).default([]),
  abilities: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  summary: z.string().default(''),
  traits: z.array(z.string()).default([]),
  notableFeats: z.array(z.string()).default([]),
  appearances: z.array(appearanceSchema).default([]),
  scoring: scoringSchema,
  sources: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]),
});
type AlienResearch = z.infer<typeof alienResearchSchema>;

const benVersionResearchSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string().default(''),
  age: z.string().default(''),
  series: z.array(seriesIdSchema).default([]),
  timeline: z.enum(['prime', 'future', 'alternate', 'dimension']).default('prime'),
  device: z.string().default(''),
  outfit: z.string().default(''),
  summary: z.string().default(''),
  keyEpisodes: z.array(z.string()).default([]),
  signatureAliens: z.array(z.string()).default([]),
  image: imageSchema.nullable().optional(),
  sources: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]),
});

const overridesSchema = z.object({
  pinnedScores: z.record(z.string(), z.number()).default({}),
  excludeAliens: z.array(z.string()).default([]),
  excludeBenVersions: z.array(z.string()).default([]),
  benVersionOrder: z.array(z.string()).default([]),
});

// ---------- helpers ----------
function readJson<T>(p: string, fallback: T): T {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as T;
}

const OMNITRIX_FOR_SERIES: Record<SeriesId, OmnitrixId> = {
  os: 'omnitrix-prototype',
  af: 'omnitrix-recalibrated',
  ua: 'ultimatrix',
  ov: 'omnitrix-omniverse',
};

function omnitrixFor(seriesId: SeriesId, usedBy: string[], kind: string): OmnitrixId {
  if (seriesId === 'ov' && kind === 'fusion' && usedBy.every((u) => u === 'ben-10k-ov')) return 'biomnitrix';
  return OMNITRIX_FOR_SERIES[seriesId];
}

// ---------- main ----------
function main() {
  const researchDir = R('research', 'aliens');
  const files = fs.existsSync(researchDir) ? fs.readdirSync(researchDir).filter((f) => f.endsWith('.json')).sort() : [];
  const overrides = overridesSchema.parse(readJson(R('data', 'overrides.json'), {}));
  const manifest = readJson<{ assets: Asset[] }>(R('assets', 'asset-manifest.json'), { assets: [] });
  const assetById = new Map(manifest.assets.map((a) => [a.id, a]));

  const problems: string[] = [];
  const research: AlienResearch[] = [];
  for (const f of files) {
    const raw = readJson<unknown>(path.join(researchDir, f), null);
    const parsed = alienResearchSchema.safeParse(raw);
    if (!parsed.success) {
      problems.push(`${f}: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
      continue;
    }
    if (overrides.excludeAliens.includes(parsed.data.id)) continue;
    research.push(parsed.data);
  }

  // Forms no Ben ever used on-screen (e.g. Albedo-only Ultimates) stay in research but are not part of the vault.
  const benUsed = (r: AlienResearch) => r.appearances.some((a) => a.usedBy.length === 0 || a.usedBy.some((u) => u !== 'albedo' && u !== 'other'));
  const excluded = research.filter((r) => !benUsed(r)).map((r) => r.id);
  if (excluded.length) console.log(`excluded (no Ben appearance): ${excluded.join(', ')}`);
  const kept = research.filter(benUsed);
  const ids = new Set(kept.map((r) => r.id));
  for (const r of kept) {
    if (r.ultimateFormId && !ids.has(r.ultimateFormId)) { problems.push(`${r.id}: ultimateFormId "${r.ultimateFormId}" not in vault → cleared`); r.ultimateFormId = null; }
    if (r.baseFormId && !ids.has(r.baseFormId)) { problems.push(`${r.id}: baseFormId "${r.baseFormId}" not in vault → cleared`); r.baseFormId = null; }
    r.componentIds = r.componentIds.filter((c) => { const ok = ids.has(c); if (!ok) problems.push(`${r.id}: component "${c}" not in vault → dropped`); return ok; });
  }
  const aliens: Alien[] = kept.map((r) => {
    const appearances: AlienAppearance[] = r.appearances
      .filter((a) => a.usedBy.length === 0 || a.usedBy.some((u) => u !== 'albedo' && u !== 'other'))
      .map((a) => {
        const assetId = `alien/${r.id}/${a.series}`;
        const asset = assetById.get(assetId);
        if (!asset) problems.push(`missing asset ${assetId} (${a.image?.file ?? 'no image named'})`);
        return {
          id: `${r.id}:${a.series}`,
          alienId: r.id,
          seriesId: a.series,
          omnitrixId: omnitrixFor(a.series, a.usedBy, r.kind),
          benVersionIds: a.usedBy,
          firstEpisode: a.firstEpisode,
          notableEpisodes: a.notableEpisodes,
          designNotes: a.designNotes,
          assetId: asset ? assetId : null,
        };
      });

    for (const rel of [r.baseFormId, r.ultimateFormId, ...r.componentIds]) {
      if (rel && !ids.has(rel)) problems.push(`${r.id}: related id "${rel}" not found`);
    }

    const dims = Object.fromEntries(SCORE_DIMENSIONS.map((d) => [d, r.scoring[d]])) as Alien['score']['dimensions'];
    const score = computeScore({
      dimensions: dims,
      weaknessPenalty: r.scoring.weaknessPenalty,
      controlPenalty: r.scoring.controlPenalty,
      rationale: r.scoring.rationale,
      pinnedTotal: overrides.pinnedScores[r.id],
    });

    return {
      id: r.id,
      name: r.name,
      kind: r.kind,
      species: r.species,
      homeworld: r.homeworld,
      bodyType: r.bodyType,
      summary: r.summary,
      traits: r.traits,
      abilities: r.abilities,
      weaknesses: r.weaknesses,
      notableFeats: r.notableFeats,
      debut: { episode: r.debut.episode, seriesId: r.debut.series, benVersionId: r.debut.usedBy },
      baseFormId: r.baseFormId,
      ultimateFormId: r.ultimateFormId,
      componentIds: r.componentIds,
      appearances,
      score,
      wikiTitle: r.wikiTitle,
      sources: r.sources,
      notes: r.notes,
    };
  });

  // Ultimate forms must outscore their base form (unless pinned).
  const byId = new Map(aliens.map((a) => [a.id, a]));
  for (const a of aliens) {
    if (a.kind === 'ultimate' && a.baseFormId) {
      const base = byId.get(a.baseFormId);
      if (base && a.score.total <= base.score.total) problems.push(`score: ${a.id} (${a.score.total}) <= ${base.id} (${base.score.total})`);
    }
  }

  // Ben versions
  const bvRaw = readJson<unknown[]>(R('research', 'ben-versions.research.json'), []);
  const benVersions: BenVersion[] = [];
  for (const raw of Array.isArray(bvRaw) ? bvRaw : []) {
    const p = benVersionResearchSchema.safeParse(raw);
    if (!p.success) { problems.push(`ben-version: ${p.error.issues.map((i) => i.message).join('; ')}`); continue; }
    if (overrides.excludeBenVersions.includes(p.data.id)) continue;
    const assetId = `ben/${p.data.id}`;
    benVersions.push({
      id: p.data.id,
      name: p.data.name,
      shortName: p.data.shortName || p.data.name,
      age: p.data.age,
      seriesIds: p.data.series,
      timeline: p.data.timeline,
      device: p.data.device,
      outfit: p.data.outfit,
      summary: p.data.summary,
      keyEpisodes: p.data.keyEpisodes,
      signatureAliens: p.data.signatureAliens,
      assetId: assetById.has(assetId) ? assetId : null,
      sources: p.data.sources,
      notes: p.data.notes,
    });
  }
  if (overrides.benVersionOrder.length) {
    const order = new Map(overrides.benVersionOrder.map((id, i) => [id, i]));
    benVersions.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
  }

  // Series + devices (hand-authored, enriched by research/devices.research.json when present)
  const series = readJson<Series[]>(R('data', 'series.json'), []);
  const omnitrixes = readJson<Omnitrix[]>(R('data', 'omnitrixes.json'), []);

  fs.mkdirSync(R('data'), { recursive: true });
  const sortedAliens = [...aliens].sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(R('data', 'aliens.json'), JSON.stringify(sortedAliens, null, 2));
  fs.writeFileSync(R('data', 'ben-versions.json'), JSON.stringify(benVersions, null, 2));
  fs.writeFileSync(R('data', 'power-classes.json'), JSON.stringify(POWER_CLASSES, null, 2));

  // Score report for calibration
  const dist = POWER_CLASSES.map((c) => `${c.name}: ${sortedAliens.filter((a) => a.score.classId === c.id).length}`).join(' | ');
  const top = [...sortedAliens].sort((a, b) => b.score.total - a.score.total).slice(0, 12).map((a) => `${a.name}=${a.score.total}`).join(', ');
  const bottom = [...sortedAliens].sort((a, b) => a.score.total - b.score.total).slice(0, 8).map((a) => `${a.name}=${a.score.total}`).join(', ');
  const perSeries = (['os', 'af', 'ua', 'ov'] as SeriesId[]).map((s) => `${s}: ${sortedAliens.filter((a) => a.appearances.some((ap) => ap.seriesId === s)).length}`).join(' | ');

  console.log(`aliens: ${sortedAliens.length}  appearances: ${sortedAliens.reduce((n, a) => n + a.appearances.length, 0)}  ben versions: ${benVersions.length}  series: ${series.length}  devices: ${omnitrixes.length}`);
  console.log(`per series → ${perSeries}`);
  console.log(`classes → ${dist}`);
  console.log(`top → ${top}`);
  console.log(`bottom → ${bottom}`);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    for (const p of problems) console.log(' - ' + p);
  }
}

main();
