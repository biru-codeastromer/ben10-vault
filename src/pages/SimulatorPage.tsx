import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DEVICE_COMPONENTS } from '../components/omnitrix/deviceRegistry';
import { hourglassPath } from '../components/omnitrix/hourglassPath';
import type { SeriesId } from '../data/schema';
import { getOmnitrix, getSeries, series as allSeries, wallEntries } from '../data/vault';
import { audio } from '../lib/audio';
import './SimulatorPage.css';

const VALID: SeriesId[] = ['os', 'af', 'ua', 'ov'];

type Phase = 'idle' | 'selecting' | 'reveal';

/**
 * Omnitrix Simulator — operate each era's device the way the show did:
 *   activate → the dial wakes; cycle → era-authentic previews (Classic: black alien
 *   silhouette on the glowing green face; AF/UA/OV: a green hologram projected above
 *   the watch); slam → green transformation flash and the alien is revealed.
 * Previews are the exact canonical artworks restyled live with CSS filters — never redrawn.
 */
export function SimulatorPage() {
  const params = useParams<{ seriesId?: string }>();
  const navigate = useNavigate();
  const seriesId = (VALID.includes(params.seriesId as SeriesId) ? params.seriesId : 'os') as SeriesId;
  const series = getSeries(seriesId)!;
  const device = getOmnitrix(series.omnitrixId);
  const Device = DEVICE_COMPONENTS[seriesId];

  const roster = useMemo(() => wallEntries(seriesId).filter((e) => e.asset), [seriesId]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [index, setIndex] = useState(0);
  const [rot, setRot] = useState(0);
  const dragX = useRef<number | null>(null);
  const dragAcc = useRef(0);

  useEffect(() => {
    setPhase('idle');
    setIndex(0);
    setRot(0);
    document.title = `Omnitrix Simulator — ${series.name} · Ben 10 Vault`;
  }, [seriesId, series.name]);

  const entry = roster[index];

  const activate = useCallback(() => {
    if (phase !== 'idle') return;
    audio.play('card-open', { volume: 0.6 });
    setPhase('selecting');
  }, [phase]);

  const cycle = useCallback(
    (dir: 1 | -1) => {
      if (phase !== 'selecting' || roster.length === 0) return;
      audio.play('dial-tick', { volume: 0.6, throttleMs: 60 });
      setIndex((i) => (i + dir + roster.length) % roster.length);
      setRot((r) => r + dir * 30);
    },
    [phase, roster.length],
  );

  const slam = useCallback(() => {
    if (phase !== 'selecting' || !entry) return;
    audio.play(`omnitrix-activate-${seriesId}`, { volume: 0.9 });
    setPhase('reveal');
  }, [phase, entry, seriesId]);

  const reset = useCallback(() => {
    audio.play('card-close', { volume: 0.5 });
    setPhase('selecting');
  }, []);

  // keyboard: arrows cycle, Enter/Space slams
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'ArrowRight') cycle(1);
      if (e.key === 'ArrowLeft') cycle(-1);
      if ((e.key === 'Enter' || e.key === ' ') && phase === 'selecting') {
        e.preventDefault();
        slam();
      }
      if (e.key === 'Escape' && phase === 'reveal') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cycle, slam, reset, phase]);

  // drag the device horizontally to twist the dial
  const onPointerDown = (e: React.PointerEvent) => {
    if (phase === 'idle') return activate();
    dragX.current = e.clientX;
    dragAcc.current = 0;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragX.current === null || phase !== 'selecting') return;
    dragAcc.current += e.clientX - dragX.current;
    dragX.current = e.clientX;
    while (dragAcc.current > 42) {
      dragAcc.current -= 42;
      cycle(1);
    }
    while (dragAcc.current < -42) {
      dragAcc.current += 42;
      cycle(-1);
    }
  };
  const onPointerUp = () => {
    dragX.current = null;
  };

  const holoStyle = seriesId !== 'os';

  return (
    <main className="sim" data-era={seriesId}>
      <div className="sim__bg" aria-hidden="true" />

      <header className="sim__head page">
        <p className="eyebrow">Omnitrix Simulator</p>
        <h1 className="sim__title">{device?.name}</h1>
        <p className="sim__sub">
          {series.name} · {series.years} · {roster.length} DNA samples loaded
        </p>
        <div className="sim__tabs" role="tablist" aria-label="Choose a device">
          {allSeries.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === seriesId}
              data-era={s.id}
              className={`sim__tab${s.id === seriesId ? ' is-on' : ''}`}
              onClick={() => navigate(`/simulator/${s.id}`)}
            >
              {s.shortName}
            </button>
          ))}
        </div>
      </header>

      <section className="sim__stage page" aria-label={`${device?.name} simulator`}>
        <div
          className={`sim__device phase-${phase}${holoStyle ? ' is-holo' : ' is-face'}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="application"
          aria-label={phase === 'idle' ? 'Press to activate the Omnitrix' : `Selected: ${entry?.alien.name ?? 'none'}. Drag or use arrow keys to cycle, Enter to transform.`}
        >
          {/* hologram projection (AF / UA / OV) */}
          <AnimatePresence>
            {holoStyle && phase === 'selecting' && entry?.asset && (
              <motion.div
                key={entry.alien.id}
                className="sim__holo"
                initial={{ opacity: 0, y: 14, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.9 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                aria-hidden="true"
              >
                <img src={entry.asset.path} alt="" draggable={false} />
              </motion.div>
            )}
          </AnimatePresence>
          {holoStyle && phase === 'selecting' && <span className="sim__beam" aria-hidden="true" />}

          <motion.div
            className="sim__watch"
            animate={{ scale: phase === 'selecting' ? 1.03 : 1, y: phase === 'selecting' ? -4 : 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
          >
            <Device idPrefix={`sim-${seriesId}`} charge={phase === 'idle' ? 0.45 : 1} dialRotation={seriesId === 'ov' ? (rot % 60) * 0.4 : rot} className="sim__svg" />
            {/* Classic face display: black silhouette on the glowing green core */}
            {!holoStyle && phase === 'selecting' && entry?.asset && (
              <div className="sim__face" aria-hidden="true">
                <AnimatePresence mode="popLayout">
                  <motion.img
                    key={entry.alien.id}
                    src={entry.asset.path}
                    alt=""
                    draggable={false}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.75 }}
                    transition={{ duration: 0.16 }}
                  />
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {phase === 'idle' && (
            <button type="button" className="sim__wake" onClick={activate}>
              Press to activate
            </button>
          )}
        </div>

        {phase === 'selecting' && entry && (
          <div className="sim__controls">
            <button type="button" className="sim__arrow" onClick={() => cycle(-1)} aria-label="Previous alien">
              ‹
            </button>
            <div className="sim__readout" aria-live="polite">
              <span className="sim__readout-name">{entry.alien.name}</span>
              <span className="sim__readout-meta">
                {entry.alien.species} · {index + 1}/{roster.length}
              </span>
            </div>
            <button type="button" className="sim__arrow" onClick={() => cycle(1)} aria-label="Next alien">
              ›
            </button>
          </div>
        )}

        {phase === 'selecting' && (
          <button type="button" className="sim__slam" onClick={slam}>
            <svg viewBox="-100 -100 200 200" width="26" height="26" aria-hidden="true">
              <path d={hourglassPath(seriesId, 0.9)} fill="currentColor" />
            </svg>
            Slam it
          </button>
        )}

        {phase === 'idle' && <p className="sim__hint">Click the {device?.name} to power it up — then twist the dial and slam.</p>}
        {phase === 'selecting' && <p className="sim__hint">Drag across the watch or use ← → to turn the dial · Enter to transform</p>}
      </section>

      <AnimatePresence>
        {phase === 'reveal' && entry?.asset && (
          <motion.div
            className="sim__reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-label={`Transformed into ${entry.alien.name}`}
          >
            <motion.span
              className="sim__reveal-burst"
              initial={{ scale: 0.2, opacity: 1 }}
              animate={{ scale: 3.4, opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              aria-hidden="true"
            />
            <motion.img
              src={entry.asset.path}
              alt={entry.alien.name}
              className="sim__reveal-art"
              initial={{ scale: 0.6, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              draggable={false}
            />
            <motion.h2 className="sim__reveal-name" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
              {entry.alien.name}
            </motion.h2>
            <motion.div className="sim__reveal-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <button type="button" onClick={reset}>
                Transform again
              </button>
              <Link to={`/era/${seriesId}/${entry.alien.id}`}>Open card →</Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
