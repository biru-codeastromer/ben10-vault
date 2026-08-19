import { motion } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import { SCORE_DIMENSIONS, type SeriesId } from '../../data/schema';
import { DIMENSION_LABELS, DIMENSION_WEIGHTS } from '../../data/scoring';
import { anyAsset, getAlien, getBenVersion, getOmnitrix, getPowerClass, getSeries, sequencesFor, type WallEntry } from '../../data/vault';
import { useScrollLock } from '../../lib/hooks';
import { AlienCard } from '../cards/AlienCard';
import { OmnitrixIcon } from '../omnitrix/Hourglass';
import { TransformationPlayer } from './TransformationPlayer';
import './AlienDetail.css';

interface Props {
  entry: WallEntry;
  onClose: () => void;
  onNavigate: (alienId: string, seriesId: SeriesId) => void;
  neighbours: WallEntry[];
}

export function AlienDetail({ entry, onClose, onNavigate, neighbours }: Props) {
  const { alien, appearance, powerClass } = entry;
  const series = getSeries(appearance.seriesId)!;
  const device = getOmnitrix(appearance.omnitrixId);
  useScrollLock(true);

  const idx = neighbours.findIndex((n) => n.alien.id === alien.id);
  const prev = idx > 0 ? neighbours[idx - 1] : undefined;
  const next = idx >= 0 && idx < neighbours.length - 1 ? neighbours[idx + 1] : undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && next) onNavigate(next.alien.id, appearance.seriesId);
      if (e.key === 'ArrowLeft' && prev) onNavigate(prev.alien.id, appearance.seriesId);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNavigate, next, prev, appearance.seriesId]);

  const otherEras = alien.appearances.filter((ap) => ap.seriesId !== appearance.seriesId);
  const related = useMemo(() => {
    const out: { label: string; alienId: string; seriesId: SeriesId }[] = [];
    const pick = (id: string | null, label: string) => {
      if (!id) return;
      const a = getAlien(id);
      if (!a) return;
      const sid = a.appearances.some((ap) => ap.seriesId === appearance.seriesId) ? appearance.seriesId : a.appearances[0]?.seriesId;
      if (sid) out.push({ label, alienId: id, seriesId: sid });
    };
    pick(alien.baseFormId, 'Base form');
    pick(alien.ultimateFormId, 'Ultimate form');
    alien.componentIds.forEach((c) => pick(c, 'Component'));
    return out;
  }, [alien, appearance.seriesId]);

  const usedBy = appearance.benVersionIds.map((id) => getBenVersion(id)?.shortName ?? humanBen(id));
  const clips = useMemo(() => sequencesFor(alien.id, appearance.seriesId), [alien.id, appearance.seriesId]);
  const dims = SCORE_DIMENSIONS.map((d) => ({ d, v: alien.score.dimensions[d], w: DIMENSION_WEIGHTS[d] }));

  return (
    <motion.div
      className="adetail"
      data-era={appearance.seriesId}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`adetail-title-${alien.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="adetail__backdrop" onClick={onClose} aria-hidden="true" />
      <motion.section
        className={`adetail__panel tier-${powerClass.tier}`}
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <button type="button" className="adetail__close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="adetail__card">
          <AlienCard entry={entry} mode="showcase" />
          <div className="adetail__nav">
            <button type="button" disabled={!prev} onClick={() => prev && onNavigate(prev.alien.id, appearance.seriesId)} aria-label={prev ? `Previous: ${prev.alien.name}` : 'No previous card'}>
              ‹ {prev?.alien.name ?? '—'}
            </button>
            <button type="button" disabled={!next} onClick={() => next && onNavigate(next.alien.id, appearance.seriesId)} aria-label={next ? `Next: ${next.alien.name}` : 'No next card'}>
              {next?.alien.name ?? '—'} ›
            </button>
          </div>
        </div>

        <div className="adetail__body">
          <header className="adetail__head">
            <p className="eyebrow">
              {series.name} · {device?.name}
            </p>
            <h2 id={`adetail-title-${alien.id}`} className="adetail__title">
              {alien.name}
            </h2>
            <p className="adetail__sub">
              <span className={`adetail__class tier-${powerClass.tier}`}>{powerClass.name}</span>
              <span className="adetail__score">
                {alien.score.total}
                <small>/200</small>
              </span>
              <span className="adetail__kind">{alien.kind === 'ultimate' ? 'Ultimate form' : alien.kind === 'fusion' ? 'Fusion' : 'Transformation'}</span>
            </p>
            <p className="adetail__summary">{alien.summary}</p>
          </header>

          <dl className="adetail__facts">
            <div>
              <dt>Species</dt>
              <dd>{alien.species || 'Unknown'}</dd>
            </div>
            <div>
              <dt>Homeworld</dt>
              <dd>{alien.homeworld || 'Unknown'}</dd>
            </div>
            {alien.bodyType && (
              <div>
                <dt>Body</dt>
                <dd>{alien.bodyType}</dd>
              </div>
            )}
            <div>
              <dt>Debut</dt>
              <dd>
                {alien.debut.episode || '—'} <span className="adetail__dim">({getSeries(alien.debut.seriesId)?.shortName})</span>
              </dd>
            </div>
            <div>
              <dt>First in {series.shortName}</dt>
              <dd>{appearance.firstEpisode || alien.debut.episode || '—'}</dd>
            </div>
            <div>
              <dt>Used by</dt>
              <dd>{usedBy.length ? usedBy.join(', ') : '—'}</dd>
            </div>
          </dl>

          {clips.length > 0 ? (
            <TransformationPlayer clips={clips} currentSeries={appearance.seriesId} alienName={alien.name} />
          ) : (
            <p className="adetail__noseq">
              No dramatised transformation sequence exists for {alien.name} — on screen this form was reached with a quick Omnitrix flash, so
              there is nothing to clip.
            </p>
          )}

          {appearance.designNotes && (
            <section className="adetail__section">
              <h3>
                <OmnitrixIcon size={16} variant={appearance.seriesId} /> {series.shortName} design
              </h3>
              <p>{appearance.designNotes}</p>
              {otherEras.length > 0 && (
                <div className="adetail__eras">
                  <span>Also appears in</span>
                  {otherEras.map((ap) => {
                    const s = getSeries(ap.seriesId)!;
                    const asset = anyAsset(alien.id, ap.seriesId);
                    return (
                      <button key={ap.id} type="button" className="adetail__era-chip" data-era={ap.seriesId} onClick={() => onNavigate(alien.id, ap.seriesId)}>
                        {asset ? <img src={asset.path} alt="" width="28" height="36" loading="lazy" /> : <OmnitrixIcon size={16} variant={ap.seriesId} />}
                        <span>{s.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          <div className="adetail__cols">
            <section className="adetail__section">
              <h3>Abilities</h3>
              <ul className="adetail__list">
                {alien.abilities.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </section>
            <section className="adetail__section">
              <h3>Weaknesses</h3>
              {alien.weaknesses.length ? (
                <ul className="adetail__list adetail__list--weak">
                  {alien.weaknesses.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              ) : (
                <p className="adetail__dim">No notable weakness recorded.</p>
              )}
            </section>
          </div>

          {alien.notableFeats.length > 0 && (
            <section className="adetail__section">
              <h3>Notable feats</h3>
              <ul className="adetail__feats">
                {alien.notableFeats.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          )}

          {alien.traits.length > 0 && (
            <section className="adetail__section">
              <h3>Traits</h3>
              <div className="adetail__chips">
                {alien.traits.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </section>
          )}

          <section className="adetail__section adetail__scoring">
            <h3>
              Power score breakdown <span className="adetail__dim">editorial · not canon</span>
            </h3>
            <div className="adetail__bars">
              {dims.map(({ d, v, w }) => (
                <div key={d} className="adetail__bar" title={`${DIMENSION_LABELS[d]}: ${v}/10 (weight ${w})`}>
                  <span className="adetail__bar-label">{DIMENSION_LABELS[d]}</span>
                  <span className="adetail__bar-track">
                    <motion.span className="adetail__bar-fill" initial={{ width: 0 }} animate={{ width: `${v * 10}%` }} transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} />
                  </span>
                  <span className="adetail__bar-val">{v}</span>
                </div>
              ))}
            </div>
            <p className="adetail__penalties">
              Weakness penalty <strong>−{alien.score.weaknessPenalty}</strong> · Control penalty <strong>−{alien.score.controlPenalty}</strong>
              {alien.score.pinned ? <> · <em>Score pinned editorially</em></> : null}
            </p>
            {alien.score.rationale && <p className="adetail__rationale">{alien.score.rationale}</p>}
          </section>

          {related.length > 0 && (
            <section className="adetail__section">
              <h3>Related forms</h3>
              <div className="adetail__related">
                {related.map((r) => {
                  const a = getAlien(r.alienId)!;
                  const asset = anyAsset(a.id, r.seriesId);
                  const pc = getPowerClass(a.score.classId);
                  return (
                    <button key={r.alienId + r.label} type="button" className={`adetail__rel tier-${pc.tier}`} onClick={() => onNavigate(a.id, r.seriesId)}>
                      {asset && <img src={asset.path} alt="" loading="lazy" />}
                      <span className="adetail__rel-label">{r.label}</span>
                      <span className="adetail__rel-name">{a.name}</span>
                      <span className="adetail__rel-score">{a.score.total}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {alien.notes.length > 0 && (
            <details className="adetail__notes">
              <summary>Canon notes &amp; uncertainties</summary>
              <ul>
                {alien.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </details>
          )}

          <footer className="adetail__sources">
            <span>Sources:</span>
            {alien.sources.map((s) => (
              <a key={s} href={s} target="_blank" rel="noreferrer noopener">
                {s.replace(/^https?:\/\//, '').replace(/^ben10\.fandom\.com\/wiki\//, 'wiki/')}
              </a>
            ))}
          </footer>
        </div>
      </motion.section>
    </motion.div>
  );
}

function humanBen(id: string): string {
  const map: Record<string, string> = {
    'ben-10-os': 'Ben, age 10',
    'ben-15-af': 'Ben, age 15',
    'ben-16-af': 'Ben, age 16 (AF)',
    'ben-16-ua': 'Ben, age 16 (UA)',
    'ben-16-ov': 'Ben, age 16 (OV)',
    'ben-11-ov': 'Ben, age 11',
    'ben-10-ua': 'Ben, age 10 (time-travel)',
    'ben-10-ov': 'Ben, age 10 (flashback)',
    'ben-10k-os': 'Ben 10,000',
    'ben-10k-ua': 'Ben 10,000 (UA)',
    'ben-10k-ov': 'Ben 10,000 (OV)',
    'ben-5': 'Ben, age 5',
    albedo: 'Albedo',
    other: 'Others',
  };
  return map[id] ?? id;
}
