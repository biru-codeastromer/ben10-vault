/**
 * Ben 10 Vault — editorial Power Score system.
 * NOT official canon. See docs/power-scoring.md for the methodology and calibration notes.
 *
 * Every alien is rated 0–10 on fourteen dimensions from demonstrated on-screen feats,
 * plus two penalties (exploitable weaknesses 0–5, control problems 0–3). The weighted
 * sum is normalised onto a 50–200 scale using fixed anchors so that a score of 150 is
 * genuinely rare and 200 is unique.
 */
import type { PowerClass, PowerClassId, PowerScore, ScoreDimension } from './schema';
import { SCORE_DIMENSIONS } from './schema';

export const DIMENSION_WEIGHTS: Record<ScoreDimension, number> = {
  strength: 1.0,
  durability: 1.0,
  speed: 0.8,
  mobility: 0.8,
  offense: 1.2,
  defense: 1.0,
  special: 1.2,
  versatility: 1.0,
  intellect: 0.6,
  energy: 0.7,
  regeneration: 0.5,
  survivability: 0.5,
  range: 0.6,
  cosmic: 1.6,
};

export const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  strength: 'Strength',
  durability: 'Durability',
  speed: 'Speed',
  mobility: 'Mobility',
  offense: 'Offense',
  defense: 'Defense',
  special: 'Special Abilities',
  versatility: 'Versatility',
  intellect: 'Intellect / Tactics',
  energy: 'Energy Manipulation',
  regeneration: 'Regeneration',
  survivability: 'Survivability',
  range: 'Range',
  cosmic: 'Reality / Time / Space',
};

export const WEAKNESS_PENALTY_WEIGHT = 2.5; // per point (0–5)
export const CONTROL_PENALTY_WEIGHT = 2.0; // per point (0–3)

export const MAX_RAW = SCORE_DIMENSIONS.reduce((s, d) => s + DIMENSION_WEIGHTS[d] * 10, 0);

/**
 * Normalisation anchors (raw weighted score → 50–200 scale), piecewise linear.
 * Calibrated on the full researched roster so that the median transformation lands ~105,
 * a Way Big–class raw (~66) lands at the Legendary threshold and an Atomic-X–class raw (~78)
 * lands ~190. Only a pinned entry (Alien X) can reach 200.
 */
export const NORMALISATION: { raw: number; score: number }[] = [
  { raw: 15, score: 50 },
  { raw: 52, score: 105 },
  { raw: 66, score: 150 },
  { raw: 78, score: 190 },
  { raw: 100, score: 199 },
];

export function normalise(raw: number): number {
  const a = NORMALISATION;
  if (raw <= a[0].raw) return a[0].score;
  if (raw >= a[a.length - 1].raw) return a[a.length - 1].score;
  for (let i = 1; i < a.length; i++) {
    if (raw <= a[i].raw) {
      const t = (raw - a[i - 1].raw) / (a[i].raw - a[i - 1].raw);
      return a[i - 1].score + t * (a[i].score - a[i - 1].score);
    }
  }
  return a[a.length - 1].score;
}

export const POWER_CLASSES: PowerClass[] = [
  { id: 'standard', name: 'Standard', tier: 1, min: 50, max: 79, blurb: 'Dependable everyday transformations.' },
  { id: 'advanced', name: 'Advanced', tier: 2, min: 80, max: 99, blurb: 'Specialists with a real edge in the right fight.' },
  { id: 'elite', name: 'Elite', tier: 3, min: 100, max: 119, blurb: 'Front-line heavy hitters and problem solvers.' },
  { id: 'apex', name: 'Apex', tier: 4, min: 120, max: 139, blurb: 'Fight-enders. Ben reaches for these when it matters.' },
  { id: 'legendary', name: 'Legendary', tier: 5, min: 140, max: 164, blurb: 'Planet-scale threats bow to these forms.' },
  { id: 'cosmic', name: 'Cosmic', tier: 6, min: 165, max: 199, blurb: 'Power that bends physics itself.' },
  { id: 'infinite', name: 'Infinite', tier: 7, min: 200, max: 200, blurb: 'Omnipotence. There is only one.' },
];

export function classForScore(total: number): PowerClass {
  const c = POWER_CLASSES.find((p) => total >= p.min && total <= p.max);
  return c ?? POWER_CLASSES[0];
}

export interface ScoreInput {
  dimensions: Record<ScoreDimension, number>;
  weaknessPenalty: number;
  controlPenalty: number;
  rationale: string;
  pinnedTotal?: number;
}

export function computeScore(input: ScoreInput): PowerScore {
  const dims = { ...input.dimensions };
  for (const d of SCORE_DIMENSIONS) dims[d] = clamp(Math.round(dims[d] ?? 0), 0, 10);
  const weakness = clamp(input.weaknessPenalty ?? 0, 0, 5);
  const control = clamp(input.controlPenalty ?? 0, 0, 3);
  const weighted = SCORE_DIMENSIONS.reduce((s, d) => s + DIMENSION_WEIGHTS[d] * dims[d], 0);
  const raw = weighted - weakness * WEAKNESS_PENALTY_WEIGHT - control * CONTROL_PENALTY_WEIGHT;
  let total = Math.round(normalise(raw));
  const pinned = typeof input.pinnedTotal === 'number';
  if (pinned) total = clamp(Math.round(input.pinnedTotal as number), 50, 200);
  // 200 is reserved for pinned entries only.
  if (!pinned && total >= 200) total = 199;
  const classId: PowerClassId = classForScore(total).id;
  return {
    total,
    classId,
    dimensions: dims,
    weaknessPenalty: weakness,
    controlPenalty: control,
    raw: Math.round(raw * 100) / 100,
    rationale: input.rationale,
    ...(pinned ? { pinned: true } : {}),
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
