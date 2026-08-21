import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlienCard } from '../components/cards/AlienCard';
import { AlienDetail } from '../components/detail/AlienDetail';
import { DEVICE_COMPONENTS } from '../components/omnitrix/deviceRegistry';
import { WallFilters } from '../components/wall/WallFilters';
import type { PowerClassId, SeriesId } from '../data/schema';
import { alienEntry, getOmnitrix, getSeries, wallEntries, type WallEntry } from '../data/vault';
import { audio } from '../lib/audio';
import { applyFilters, DEFAULT_FILTERS, speciesOptions, type SortKey, type WallFilterState } from '../lib/wallFilters';
import './EraWallPage.css';

const VALID: SeriesId[] = ['os', 'af', 'ua', 'ov'];

export function EraWallPage() {
  const params = useParams<{ seriesId: string; alienId?: string }>();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const seriesId = (VALID.includes(params.seriesId as SeriesId) ? params.seriesId : 'os') as SeriesId;
  const series = getSeries(seriesId)!;
  const device = getOmnitrix(series.omnitrixId);
  const Device = DEVICE_COMPONENTS[seriesId];

  const entries = useMemo(() => wallEntries(seriesId), [seriesId]);
  const filters: WallFilterState = useMemo(
    () => ({
      q: sp.get('q') ?? '',
      classes: (sp.get('class')?.split(',').filter(Boolean) ?? []) as PowerClassId[],
      kind: (sp.get('kind') as WallFilterState['kind']) ?? 'all',
      sort: (sp.get('sort') as SortKey) ?? 'debut',
      species: sp.get('species') ?? '',
    }),
    [sp],
  );
  const setFilters = useCallback(
    (next: WallFilterState) => {
      const p = new URLSearchParams();
      if (next.q) p.set('q', next.q);
      if (next.classes.length) p.set('class', next.classes.join(','));
      if (next.kind !== 'all') p.set('kind', next.kind);
      if (next.sort !== 'debut') p.set('sort', next.sort);
      if (next.species) p.set('species', next.species);
      setSp(p, { replace: true });
    },
    [setSp],
  );

  const visible = useMemo(() => applyFilters(entries, filters), [entries, filters]);
  const species = useMemo(() => speciesOptions(entries), [entries]);
  const selected = params.alienId ? alienEntry(params.alienId, seriesId) : undefined;

  const open = useCallback(
    (e: WallEntry) => {
      audio.play('card-open', { volume: 0.6 });
      navigate({ pathname: `/era/${seriesId}/${e.alien.id}`, search: sp.toString() ? `?${sp}` : '' });
    },
    [navigate, seriesId, sp],
  );
  const close = useCallback(() => {
    audio.play('card-close', { volume: 0.5 });
    navigate({ pathname: `/era/${seriesId}`, search: sp.toString() ? `?${sp}` : '' });
  }, [navigate, seriesId, sp]);

  useEffect(() => {
    document.title = `${series.name} — Ben 10 Vault`;
  }, [series]);

  const kindCounts = useMemo(
    () => ({
      standard: entries.filter((e) => e.alien.kind === 'standard').length,
      ultimate: entries.filter((e) => e.alien.kind === 'ultimate').length,
      fusion: entries.filter((e) => e.alien.kind === 'fusion').length,
    }),
    [entries],
  );

  return (
    <main className="wall" data-era={seriesId} key={seriesId}>
      <div className="wall__bg" aria-hidden="true">
        <div className="wall__bg-glow" />
        <div className="wall__bg-texture" />
      </div>

      <header className="wall__hero page">
        <motion.div className="wall__device" initial={{ opacity: 0, scale: 0.9, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <Link to={`/simulator/${seriesId}`} className="wall__device-link" title={`Open the ${device?.name} simulator`} aria-label={`Open the ${device?.name} simulator`}>
            <Device idPrefix={`wall-${seriesId}`} charge={0.8} dialRotation={0} />
            <span className="wall__device-cta">Simulate</span>
          </Link>
        </motion.div>
        <div className="wall__hero-text">
          <motion.p className="eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {device?.name ?? 'Omnitrix'} · {series.years}
          </motion.p>
          <motion.h1 className="wall__title" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}>
            {series.name}
          </motion.h1>
          <motion.p className="wall__tagline" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}>
            {series.tagline}
          </motion.p>
          <motion.p className="wall__synopsis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
            {series.synopsis}
          </motion.p>
          <motion.ul className="wall__counts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.28 }}>
            <li>
              <strong>{entries.length}</strong> cards
            </li>
            {kindCounts.ultimate > 0 && (
              <li>
                <strong>{kindCounts.ultimate}</strong> ultimate
              </li>
            )}
            {kindCounts.fusion > 0 && (
              <li>
                <strong>{kindCounts.fusion}</strong> fusions
              </li>
            )}
          </motion.ul>
        </div>
      </header>

      <section className="wall__controls page">
        <WallFilters value={filters} onChange={setFilters} species={species} total={entries.length} shown={visible.length} kindCounts={kindCounts} />
      </section>

      <section className="wall__grid page" aria-label={`${series.name} alien cards`}>
        {visible.length === 0 ? (
          <div className="wall__empty">
            <p>No transformations match. The Omnitrix shrugs.</p>
            <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Reset filters
            </button>
          </div>
        ) : (
          visible.map((e, i) => <AlienCard key={e.appearance.id} entry={e} index={i} onOpen={open} />)
        )}
      </section>

      <AnimatePresence>
        {selected && (
          <AlienDetail
            key={selected.appearance.id}
            entry={selected}
            onClose={close}
            onNavigate={(alienId, sid) => navigate(`/era/${sid}/${alienId}`)}
            neighbours={visible}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
