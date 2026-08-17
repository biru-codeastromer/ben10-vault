/**
 * Data access layer. All UI reads through here; nothing imports the raw JSON directly.
 */
import aliensJson from '../../data/aliens.json';
import benVersionsJson from '../../data/ben-versions.json';
import seriesJson from '../../data/series.json';
import omnitrixesJson from '../../data/omnitrixes.json';
import powerClassesJson from '../../data/power-classes.json';
import manifestJson from '../../assets/asset-manifest.json';
import { assetUrl } from '../lib/assetUrl';
import type {
  Alien,
  AlienAppearance,
  Asset,
  BenVersion,
  Omnitrix,
  PowerClass,
  PowerClassId,
  Series,
  SeriesId,
} from './schema';

export const aliens = aliensJson as unknown as Alien[];
export const benVersions = benVersionsJson as unknown as BenVersion[];
export const series = (seriesJson as unknown as Series[]).slice().sort((a, b) => a.order - b.order);
export const omnitrixes = omnitrixesJson as unknown as Omnitrix[];
export const powerClasses = powerClassesJson as unknown as PowerClass[];
export const assets = (((manifestJson as unknown as { assets: Asset[] }).assets ?? []) as Asset[]).map((a) => ({ ...a, path: assetUrl(a.path) }));

const alienById = new Map(aliens.map((a) => [a.id, a]));
const seriesById = new Map(series.map((s) => [s.id, s]));
const omnitrixById = new Map(omnitrixes.map((o) => [o.id, o]));
const powerClassById = new Map(powerClasses.map((p) => [p.id, p]));
const assetById = new Map(assets.map((a) => [a.id, a]));
const benVersionById = new Map(benVersions.map((b) => [b.id, b]));

export const getAlien = (id: string) => alienById.get(id);
export const getSeries = (id: SeriesId) => seriesById.get(id);
export const getOmnitrix = (id: string) => omnitrixById.get(id as Omnitrix['id']);
export const getPowerClass = (id: PowerClassId) => powerClassById.get(id) ?? powerClasses[0];
export const getAsset = (id: string | null | undefined) => (id ? assetById.get(id) : undefined);
export const getBenVersion = (id: string) => benVersionById.get(id);

export interface WallEntry {
  alien: Alien;
  appearance: AlienAppearance;
  asset: Asset | undefined;
  powerClass: PowerClass;
}

/** All cards for an era wall, in canonical (debut) order by default. */
export function wallEntries(seriesId: SeriesId): WallEntry[] {
  const out: WallEntry[] = [];
  for (const alien of aliens) {
    const appearance = alien.appearances.find((ap) => ap.seriesId === seriesId);
    if (!appearance) continue;
    out.push({ alien, appearance, asset: getAsset(appearance.assetId), powerClass: getPowerClass(alien.score.classId) });
  }
  return out;
}

export function alienEntry(alienId: string, seriesId: SeriesId): WallEntry | undefined {
  const alien = getAlien(alienId);
  if (!alien) return undefined;
  const appearance = alien.appearances.find((ap) => ap.seriesId === seriesId) ?? alien.appearances[0];
  if (!appearance) return undefined;
  return { alien, appearance, asset: getAsset(appearance.assetId), powerClass: getPowerClass(alien.score.classId) };
}

/** Best artwork for an alien regardless of era (used by related-form chips etc.). */
export function anyAsset(alienId: string, preferSeries?: SeriesId): Asset | undefined {
  const a = getAlien(alienId);
  if (!a) return undefined;
  const pref = preferSeries ? a.appearances.find((ap) => ap.seriesId === preferSeries) : undefined;
  return getAsset(pref?.assetId) ?? a.appearances.map((ap) => getAsset(ap.assetId)).find(Boolean);
}

export const stats = {
  aliens: aliens.length,
  appearances: aliens.reduce((n, a) => n + a.appearances.length, 0),
  perSeries: Object.fromEntries(series.map((s) => [s.id, wallEntries(s.id).length])) as Record<SeriesId, number>,
  benVersions: benVersions.length,
};
