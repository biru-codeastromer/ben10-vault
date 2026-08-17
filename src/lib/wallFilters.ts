import type { WallEntry } from '../data/vault';
import type { AlienKind, PowerClassId } from '../data/schema';
import episodeOrder from '../../data/episode-order.json';

export type SortKey = 'debut' | 'power-desc' | 'power-asc' | 'name';

export interface WallFilterState {
  q: string;
  classes: PowerClassId[];
  kind: 'all' | AlienKind;
  sort: SortKey;
  species: string; // '' = any
}

export const DEFAULT_FILTERS: WallFilterState = { q: '', classes: [], kind: 'all', sort: 'debut', species: '' };

const order = episodeOrder as Record<string, number>;

/** The prototype Omnitrix's original playlist, in the order the show introduces them — used to break ties for
 *  aliens sharing a debut episode (four of the ten debut in the pilot). */
const ORIGINAL_TEN = ['heatblast', 'wildmutt', 'diamondhead', 'xlr8', 'grey-matter', 'four-arms', 'stinkfly', 'ripjaws', 'upgrade', 'ghostfreak'];
const canonRank = (id: string) => { const i = ORIGINAL_TEN.indexOf(id); return i === -1 ? 99 : i; };

/** Global order index for an episode title (across the four series). Unknown → large. */
export function episodeIndex(title: string): number {
  if (!title) return 1e9;
  const key = title.trim().toLowerCase();
  return order[key] ?? 1e9;
}

export function applyFilters(entries: WallEntry[], f: WallFilterState): WallEntry[] {
  const q = f.q.trim().toLowerCase();
  let out = entries.filter(({ alien }) => {
    if (f.kind !== 'all' && alien.kind !== f.kind) return false;
    if (f.classes.length && !f.classes.includes(alien.score.classId)) return false;
    if (f.species && alien.species !== f.species) return false;
    if (q) {
      const hay = [alien.name, alien.species, alien.homeworld, ...alien.abilities, ...alien.traits].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  out = out.slice().sort((a, b) => {
    switch (f.sort) {
      case 'power-desc':
        return b.alien.score.total - a.alien.score.total || a.alien.name.localeCompare(b.alien.name);
      case 'power-asc':
        return a.alien.score.total - b.alien.score.total || a.alien.name.localeCompare(b.alien.name);
      case 'name':
        return a.alien.name.localeCompare(b.alien.name);
      case 'debut':
      default: {
        // first use *in this era*, then overall debut, then name
        const ea = episodeIndex(a.appearance.firstEpisode || a.alien.debut.episode);
        const eb = episodeIndex(b.appearance.firstEpisode || b.alien.debut.episode);
        if (ea !== eb) return ea - eb;
        const da = episodeIndex(a.alien.debut.episode);
        const db = episodeIndex(b.alien.debut.episode);
        if (da !== db) return da - db;
        const ca = canonRank(a.alien.id), cb = canonRank(b.alien.id);
        if (ca !== cb) return ca - cb;
        // base forms before their Ultimates / fusions when tied
        const ka = a.alien.kind === 'standard' ? 0 : 1, kb = b.alien.kind === 'standard' ? 0 : 1;
        if (ka !== kb) return ka - kb;
        return a.alien.name.localeCompare(b.alien.name);
      }
    }
  });
  return out;
}

export function speciesOptions(entries: WallEntry[]): string[] {
  return Array.from(new Set(entries.map((e) => e.alien.species).filter(Boolean))).sort();
}
