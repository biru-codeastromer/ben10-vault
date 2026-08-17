/**
 * Ben 10 Vault — data schema.
 *
 * The UI is generated from structured data. Everything here mirrors the JSON in /data
 * (compiled by scripts/build-data.ts from the research files in /research).
 *
 * Model overview
 *   Series ──┐
 *   Omnitrix ─┼─▶ AlienAppearance ◀── Asset (series-specific artwork)
 *   BenVersion┘         │
 *                       ▼
 *                     Alien ──▶ PowerScore ──▶ PowerClass
 *                       │
 *                       ├─ baseForm / ultimateForm (Ultimate forms)
 *                       └─ components (fusions)
 */

export type SeriesId = 'os' | 'af' | 'ua' | 'ov';

export type OmnitrixId =
  | 'omnitrix-prototype'
  | 'omnitrix-recalibrated'
  | 'ultimatrix'
  | 'omnitrix-omniverse'
  | 'biomnitrix';

export type AlienKind = 'standard' | 'ultimate' | 'fusion';

export type Timeline = 'prime' | 'future' | 'alternate' | 'dimension';

export interface Series {
  id: SeriesId;
  name: string;
  shortName: string;
  years: string;
  order: number;
  omnitrixId: OmnitrixId;
  tagline: string;
  synopsis: string;
}

export interface Omnitrix {
  id: OmnitrixId;
  name: string;
  seriesIds: SeriesId[];
  wearer: string;
  description: string;
  features: string[];
  colors: { primary: string; secondary: string; accent: string };
  notes: string[];
  assetId: string | null;
}

export interface BenVersion {
  id: string;
  name: string;
  shortName: string;
  age: string;
  seriesIds: SeriesId[];
  timeline: Timeline;
  device: string;
  outfit: string;
  summary: string;
  keyEpisodes: string[];
  signatureAliens: string[];
  assetId: string | null;
  sources: string[];
  notes: string[];
}

/** Editorial power-score dimensions (0–10 each). See docs/power-scoring.md */
export const SCORE_DIMENSIONS = [
  'strength',
  'durability',
  'speed',
  'mobility',
  'offense',
  'defense',
  'special',
  'versatility',
  'intellect',
  'energy',
  'regeneration',
  'survivability',
  'range',
  'cosmic',
] as const;

export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

export interface PowerScore {
  total: number; // 50–200
  classId: PowerClassId;
  dimensions: Record<ScoreDimension, number>;
  weaknessPenalty: number; // 0–5
  controlPenalty: number; // 0–3
  raw: number; // weighted sum before normalisation (kept for auditing)
  rationale: string;
  pinned?: boolean; // true when the total is editorially pinned (Alien X = 200)
}

export type PowerClassId =
  | 'standard'
  | 'advanced'
  | 'elite'
  | 'apex'
  | 'legendary'
  | 'cosmic'
  | 'infinite';

export interface PowerClass {
  id: PowerClassId;
  name: string;
  tier: number; // 1..7 — drives visual treatment
  min: number;
  max: number;
  blurb: string;
}

export interface Asset {
  id: string; // e.g. "alien/four-arms/os"
  path: string; // public path, e.g. "/assets/aliens/os/four-arms.webp"
  width: number;
  height: number;
  format: 'webp' | 'png' | 'jpg' | 'svg';
  type: 'alien' | 'ben' | 'device' | 'ui';
  sourceFile: string; // original wiki filename
  sourceUrl: string;
  sourcePage: string;
  verification: 'verified' | 'unverified' | 'needs-replacement';
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

export interface AlienAppearance {
  id: string; // `${alienId}:${seriesId}`
  alienId: string;
  seriesId: SeriesId;
  omnitrixId: OmnitrixId;
  benVersionIds: string[];
  firstEpisode: string;
  notableEpisodes: string[];
  designNotes: string;
  assetId: string | null;
}

export interface Alien {
  id: string;
  name: string;
  kind: AlienKind;
  species: string;
  homeworld: string;
  bodyType: string;
  summary: string;
  traits: string[];
  abilities: string[];
  weaknesses: string[];
  notableFeats: string[];
  debut: { episode: string; seriesId: SeriesId; benVersionId: string };
  baseFormId: string | null;
  ultimateFormId: string | null;
  componentIds: string[];
  appearances: AlienAppearance[];
  score: PowerScore;
  wikiTitle: string;
  sources: string[];
  notes: string[];
}

export interface VaultData {
  generatedAt: string;
  series: Series[];
  omnitrixes: Omnitrix[];
  benVersions: BenVersion[];
  powerClasses: PowerClass[];
  aliens: Alien[];
  assets: Asset[];
}
